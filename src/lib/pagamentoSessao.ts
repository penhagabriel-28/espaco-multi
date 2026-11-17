export type FormaPagamentoSessao =
  | "Pix"
  | "Espécie"
  | "Pix + Espécie"
  | "Débito"
  | "Crédito"
  | "Boleto"
  | "Transferência";

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
  isParcial: boolean;
  cleanObservacoes: string;
}

export function parsePagamentoSimples(raw?: string | null): InfoPagamentoSimples {
  if (!raw) {
    return { meio: "Pix", pagamentoParcial: "", isParcial: false, cleanObservacoes: "" };
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

  // Remove tag JSON legada se houver
  const jsonMatch = text.match(/\[Pagamentos:\s*\[[\s\S]*?\]\]/i);
  if (jsonMatch) {
    try {
      const jsonContent = jsonMatch[0].replace(/^\[Pagamentos:\s*/i, "").replace(/\]$/, "");
      const parsed = JSON.parse(jsonContent);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (!pagamentoParcial) {
          pagamentoParcial = parsed
            .map((p: any) => `${p.forma || "PG"}: R$ ${p.valor || 0}${p.data ? ` (${p.data})` : ""}`)
            .join(" | ");
        }
        if (parsed.length > 1 && (!meioMatch || meio === "Pix")) {
          meio = "Pix + Espécie";
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
  }

  if (!pagamentoParcial && foundManual.length > 0) {
    pagamentoParcial = foundManual.join(" | ");
    if (foundManual.length > 1 && (!meioMatch || meio === "Pix")) {
      meio = "Pix + Espécie";
    }
  }
  text = text.replace(manualRegex, "");

  const cleanObservacoes = text.replace(/^\s*[\r\n]/gm, "").trim();

  return { meio, pagamentoParcial, isParcial, cleanObservacoes };
}

export function encodePagamentoSimples(
  cleanObservacoes: string,
  meio: string,
  pagamentoParcial?: string,
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

  if (pagamentoParcial && pagamentoParcial.trim()) {
    parts.push(`[PagamentoParcial: ${pagamentoParcial.trim()}]`);
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
