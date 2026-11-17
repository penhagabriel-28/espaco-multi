export type FormaPagamentoSessao =
  | "Pix"
  | "Espécie"
  | "Pix + Espécie"
  | "Débito"
  | "Crédito"
  | "Boleto"
  | "Transferência";

export interface ItemPagamentoParcial {
  data: string;
  forma: string;
}

export interface ParcelaPagamento {
  id: string;
  valor: number;
  forma: FormaPagamentoSessao;
  data: string;
  descricao?: string;
}

export interface InfoPagamentoSessao {
  tipo: "unico" | "parcial_dividido";
  valorTotalSessao: number;
  pagamentos: ParcelaPagamento[];
  totalPago: number;
  saldoRestante: number;
  isQuitado: boolean;
  isParcial: boolean;
  resumoMeios: string;
}

export interface InfoPagamentoSimples {
  meio: string;
  pagamentoParcial: string;
  pagamentos: ItemPagamentoParcial[];
  isParcial: boolean;
  cleanObservacoes: string;
}

function parseDataBR(str?: string): string {
  if (!str) return new Date().toISOString().slice(0, 10);
  const s = str.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/);
  if (m) {
    const d = m[1].padStart(2, "0");
    const mo = m[2].padStart(2, "0");
    const y = m[3] ? (m[3].length === 2 ? `20${m[3]}` : m[3]) : String(new Date().getFullYear());
    return `${y}-${mo}-${d}`;
  }
  return new Date().toISOString().slice(0, 10);
}

function normalizarForma(raw?: string): string {
  if (!raw) return "Pix";
  const r = raw.trim().toLowerCase();
  if (r.includes("esp") || r.includes("dinheiro")) return "Espécie";
  if (r.includes("deb") || r.includes("déb")) return "Débito";
  if (r.includes("cred") || r.includes("créd")) return "Crédito";
  if (r.includes("bol")) return "Boleto";
  if (r.includes("transf")) return "Transferência";
  return "Pix";
}

export function parsePagamentoSimples(raw?: string | null): InfoPagamentoSimples {
  if (!raw) {
    return { meio: "Pix", pagamentoParcial: "", pagamentos: [], isParcial: false, cleanObservacoes: "" };
  }

  let text = raw;

  // Meio registrado
  let meio = "Pix";
  const meioMatch = text.match(/\[Meio:\s*([^\]]+)\]/i);
  if (meioMatch) {
    meio = meioMatch[1].trim();
    text = text.replace(meioMatch[0], "");
  }

  // Status parcial
  let isParcial = false;
  const statusMatch = text.match(/\[StatusPagamento:\s*(quitado|parcial|pendente)\]/i);
  if (statusMatch) {
    if (statusMatch[1].toLowerCase() === "parcial") isParcial = true;
    text = text.replace(statusMatch[0], "");
  }

  // Tag explícita de PagamentoParcial
  let pagamentoParcial = "";
  const parcialMatch = text.match(/\[PagamentoParcial:\s*([^\]]+)\]/i);
  if (parcialMatch) {
    pagamentoParcial = parcialMatch[1].trim();
    text = text.replace(parcialMatch[0], "");
  }

  const pagamentos: ItemPagamentoParcial[] = [];

  // Remove tag JSON legada ou atual se houver
  const jsonMatch = text.match(/\[Pagamentos:\s*\[[\s\S]*?\]\]/i);
  if (jsonMatch) {
    try {
      const jsonContent = jsonMatch[0].replace(/^\[Pagamentos:\s*/i, "").replace(/\]$/, "");
      const parsed = JSON.parse(jsonContent);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach((p: any) => {
          pagamentos.push({
            data: p.data ? parseDataBR(p.data) : new Date().toISOString().slice(0, 10),
            forma: p.forma || "Pix",
          });
        });
        isParcial = true;
        if (!pagamentoParcial) {
          pagamentoParcial = pagamentos
            .map((p) => `${p.forma} (${p.data.split("-").slice(1).reverse().join("/")})`)
            .join(" | ");
        }
        if (pagamentos.length > 1 && (!meioMatch || meio === "Pix")) {
          const formasUnicas = Array.from(new Set(pagamentos.map((p) => p.forma)));
          meio = formasUnicas.join(" + ");
        }
      }
    } catch {
      // ignore
    }
    text = text.replace(jsonMatch[0], "");
  }

  // Remove tipo se houver
  text = text.replace(/\[Tipo:\s*(Anamnese|Sessão Padrão)\]\n?/i, "");

  // Anotações legadas tipo PG PIX- R$100,00 (09/11)
  const manualRegex = /PG\s+(PIX|ESP|ESPÉCIE|ESPECIE|DINHEIRO|DÉBITO|DEBITO|CRÉDITO|CREDITO|BOL|BOLETO|TRANSF|TRANSFERÊNCIA)[-\s:]+R?\$?\s*([\d.,]+)(?:\s*\(([^)]+)\))?/gi;
  const foundManual: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = manualRegex.exec(text)) !== null) {
    foundManual.push(m[0].trim());
    if (pagamentos.length < 5) {
      const formaIdent = normalizarForma(m[1]);
      const dataIdent = parseDataBR(m[3]);
      pagamentos.push({ data: dataIdent, forma: formaIdent });
    }
  }

  if (pagamentos.length > 0) {
    isParcial = true;
  }

  if (!pagamentoParcial && foundManual.length > 0) {
    pagamentoParcial = foundManual.join(" | ");
    if (foundManual.length > 1 && (!meioMatch || meio === "Pix")) {
      meio = "Pix + Espécie";
    }
  }
  text = text.replace(manualRegex, "");

  const cleanObservacoes = text.replace(/^\s*[\r\n]/gm, "").trim();

  return { meio, pagamentoParcial, pagamentos, isParcial, cleanObservacoes };
}

export function encodePagamentoSimples(
  cleanObservacoes: string,
  meio: string,
  pagamentos?: ItemPagamentoParcial[] | string,
  isParcial?: boolean,
  tipoAgendamento?: string
): string {
  // Limpar texto de tags existentes para evitar duplicidade
  const clean = (cleanObservacoes || "")
    .replace(/^\[Tipo:\s*(Anamnese|Sessão Padrão)\]\n?/gi, "")
    .replace(/\[StatusPagamento:\s*(quitado|parcial|pendente)\]\n?/gi, "")
    .replace(/\[Meio:\s*[^\]]+\]\n?/gi, "")
    .replace(/\[PagamentoParcial:\s*[^\]]+\]\n?/gi, "")
    .replace(/\[Pagamentos:\s*\[[\s\S]*?\]\]\n?/gi, "")
    .replace(/PG\s+(PIX|ESP|ESPÉCIE|ESPECIE|DINHEIRO|DÉBITO|DEBITO|CRÉDITO|CREDITO|BOL|BOLETO|TRANSF|TRANSFERÊNCIA)[-\s:]+R?\$?\s*([\d.,]+)(?:\s*\(([^)]+)\))?\n?/gi, "")
    .trim();

  const parts: string[] = [];

  if (tipoAgendamento) {
    parts.push(tipoAgendamento === "anamnese" ? "[Tipo: Anamnese]" : "[Tipo: Sessão Padrão]");
  }

  if (meio) {
    parts.push(`[Meio: ${meio.trim()}]`);
  }

  if (isParcial) {
    parts.push(`[StatusPagamento: parcial]`);
  }

  if (Array.isArray(pagamentos) && pagamentos.length > 0) {
    parts.push(`[Pagamentos: ${JSON.stringify(pagamentos)}]`);
    const desc = pagamentos
      .map((p) => `${p.forma} (${p.data ? p.data.split("-").slice(1).reverse().join("/") : ""})`)
      .join(" | ");
    parts.push(`[PagamentoParcial: ${desc}]`);
  } else if (typeof pagamentos === "string" && pagamentos.trim()) {
    parts.push(`[PagamentoParcial: ${pagamentos.trim()}]`);
  }

  if (clean) {
    parts.push(clean);
  }

  return parts.join("\n");
}

// Backwards-compatible aliases for existing components
export function parsePagamentoSessao(raw?: string | null, _valorPadrao?: number, _dataPadrao?: string) {
  const parsed = parsePagamentoSimples(raw);
  const isParcial = parsed.isParcial || Boolean(parsed.pagamentoParcial);
  const info: InfoPagamentoSessao = {
    tipo: isParcial ? "parcial_dividido" : "unico",
    valorTotalSessao: 0,
    pagamentos: [],
    totalPago: 0,
    saldoRestante: 0,
    isQuitado: !isParcial,
    isParcial,
    resumoMeios: parsed.meio,
  };
  return {
    info,
    cleanObservacoes: parsed.cleanObservacoes,
    statusPagamentoTag: isParcial ? "parcial" : (raw?.includes("[StatusPagamento: quitado]") ? "quitado" : null),
  };
}

export function encodePagamentoSessao(
  cleanObservacoes: string,
  info: InfoPagamentoSessao,
  tipoAgendamento?: string
): string {
  return encodePagamentoSimples(
    cleanObservacoes,
    info.resumoMeios || "Pix",
    undefined,
    info.isParcial,
    tipoAgendamento
  );
}
