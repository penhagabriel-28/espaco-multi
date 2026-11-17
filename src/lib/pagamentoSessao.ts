export type FormaPagamentoSessao =
  | "Pix"
  | "Espécie"
  | "Débito"
  | "Crédito"
  | "Boleto"
  | "Transferência";

export interface ParcelaPagamento {
  id: string;
  valor: number;
  forma: FormaPagamentoSessao;
  data: string; // YYYY-MM-DD
  descricao?: string; // ex: "Sinal / Antecipado", "No dia da sessão", etc.
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

export function normalizarFormaPagamento(val?: string | null): FormaPagamentoSessao {
  if (!val) return "Pix";
  const v = val.trim().toLowerCase();
  if (v.includes("esp") || v.includes("dinheiro")) return "Espécie";
  if (v.includes("deb") || v.includes("déb")) return "Débito";
  if (v.includes("cred") || v.includes("créd")) return "Crédito";
  if (v.includes("bol")) return "Boleto";
  if (v.includes("transf")) return "Transferência";
  return "Pix";
}

export function formatarDataBrasileira(dataStr?: string | null): string {
  if (!dataStr) return "";
  const parts = dataStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dataStr;
}

/**
 * Converte data em texto como "09/11" ou "09/11/2026" para "YYYY-MM-DD"
 */
function converterParaISOData(textoData?: string, anoPadrao?: number): string {
  if (!textoData) {
    return new Date().toISOString().slice(0, 10);
  }
  const clean = textoData.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }
  const matchDMY = clean.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/);
  if (matchDMY) {
    const dia = matchDMY[1].padStart(2, "0");
    const mes = matchDMY[2].padStart(2, "0");
    let ano = matchDMY[3];
    if (!ano) {
      ano = String(anoPadrao || new Date().getFullYear());
    } else if (ano.length === 2) {
      ano = `20${ano}`;
    }
    return `${ano}-${mes}-${dia}`;
  }
  return new Date().toISOString().slice(0, 10);
}

/**
 * Faz o parse das observações do agendamento buscando:
 * 1) Tag estruturada [Pagamentos: [...]]
 * 2) Anotações manuais legadas como "PG PIX- R$100,00 (09/11)"
 * 3) Tag [Meio: Pix]
 * Retorna as informações calculadas de pagamento e o texto limpo de observações.
 */
export function parsePagamentoSessao(
  observacoesRaw: string | null | undefined,
  valorEstimado?: number,
  dataSessao?: string | null
): { info: InfoPagamentoSessao; cleanObservacoes: string; statusPagamentoTag: "quitado" | "parcial" | "pendente" | null } {
  const raw = observacoesRaw || "";
  let clean = raw;

  // Remover tipo de agendamento se estiver no texto
  clean = clean.replace(/^\[Tipo:\s*(Anamnese|Sessão Padrão)\]\n?/i, "");

  // Status de pagamento explícito na tag
  let statusPagamentoTag: "quitado" | "parcial" | "pendente" | null = null;
  const statusMatch = clean.match(/\[StatusPagamento:\s*(quitado|parcial|pendente)\]/i);
  if (statusMatch) {
    statusPagamentoTag = statusMatch[1].toLowerCase() as any;
    clean = clean.replace(statusMatch[0], "");
  }

  // Meio registrado anteriormente
  const meioMatch = clean.match(/\[Meio:\s*([^\]]+)\]/i);
  const meioRegistrado = meioMatch ? meioMatch[1].trim() : null;
  if (meioMatch) {
    clean = clean.replace(meioMatch[0], "");
  }

  let pagamentos: ParcelaPagamento[] = [];
  let isFromStructured = false;

  // 1) Tag estruturada [Pagamentos: [...]]
  const pagamentosMatch = clean.match(/\[Pagamentos:\s*(\[[\s\S]*?\])\]/);
  if (pagamentosMatch) {
    try {
      const parsed = JSON.parse(pagamentosMatch[1]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        pagamentos = parsed.map((item, idx) => ({
          id: String(item.id || `pag-${Date.now()}-${idx}`),
          valor: Number(item.valor) || 0,
          forma: normalizarFormaPagamento(item.forma),
          data: item.data || new Date().toISOString().slice(0, 10),
          descricao: item.descricao || "",
        }));
        isFromStructured = true;
      }
    } catch {
      // Ignora erro de JSON malformado
    }
    clean = clean.replace(pagamentosMatch[0], "");
  }

  // Ano padrão para conversão de datas
  const anoPadrao = dataSessao ? new Date(dataSessao).getFullYear() : new Date().getFullYear();

  // 2) Se não encontrou estruturado, buscar anotações manuais legadas como:
  // "PG PIX- R$100,00 (09/11)" ou "PG ESP- R$100,00 (11/11)"
  const manualRegex = /PG\s+(PIX|ESP|ESPÉCIE|ESPECIE|DINHEIRO|DÉBITO|DEBITO|CRÉDITO|CREDITO|BOL|BOLETO|TRANSF|TRANSFERÊNCIA)[-\s:]+R?\$?\s*([\d.,]+)(?:\s*\(([^)]+)\))?/gi;
  if (!isFromStructured) {
    let m: RegExpExecArray | null;
    const manualMatches: ParcelaPagamento[] = [];
    while ((m = manualRegex.exec(clean)) !== null) {
      const forma = normalizarFormaPagamento(m[1]);
      const rawValor = m[2].replace(/\./g, "").replace(",", ".");
      const valor = parseFloat(rawValor) || 0;
      const extra = m[3] ? m[3].trim() : "";
      const dataIso = converterParaISOData(extra, anoPadrao);
      manualMatches.push({
        id: `pg-manual-${Date.now()}-${manualMatches.length}`,
        valor,
        forma,
        data: dataIso,
        descricao: extra ? `Ref: (${extra})` : "",
      });
    }

    if (manualMatches.length > 0) {
      pagamentos = manualMatches;
      // Remove do texto de observações para deixar limpo
      clean = clean.replace(manualRegex, "");
    }
  }

  // 3) Se não encontrou pagamentos ainda, mas tem [Meio: ...]:
  if (pagamentos.length === 0 && meioRegistrado) {
    const defaultData = dataSessao ? dataSessao.slice(0, 10) : new Date().toISOString().slice(0, 10);
    // Se há múltiplos meios como "Pix + Espécie"
    if (meioRegistrado.includes("+")) {
      const parts = meioRegistrado.split("+").map((s) => s.trim());
      const partVal = valorEstimado && valorEstimado > 0 ? valorEstimado / parts.length : 0;
      pagamentos = parts.map((p, idx) => ({
        id: `pg-init-${idx}`,
        valor: Math.round(partVal * 100) / 100,
        forma: normalizarFormaPagamento(p),
        data: defaultData,
        descricao: `Parcela ${idx + 1}`,
      }));
    } else {
      pagamentos = [
        {
          id: `pg-init-0`,
          valor: valorEstimado || 0,
          forma: normalizarFormaPagamento(meioRegistrado),
          data: defaultData,
          descricao: "Pagamento integral",
        },
      ];
    }
  }

  // Limpeza de quebras de linha excedentes no texto de observação
  clean = clean.replace(/^\s*[\r\n]/gm, "").trim();

  // Calcular totais
  const valorTotalSessao = valorEstimado && valorEstimado > 0 ? valorEstimado : pagamentos.reduce((acc, p) => acc + (p.valor || 0), 0);
  const totalPago = pagamentos.reduce((acc, p) => acc + (p.valor || 0), 0);
  const saldoRestante = Math.max(0, Math.round((valorTotalSessao - totalPago) * 100) / 100);

  const isQuitado = valorTotalSessao > 0 ? totalPago >= valorTotalSessao - 0.01 : totalPago > 0;
  const isParcial = totalPago > 0 && !isQuitado;

  // Meios distintos para resumo
  const formasUnicas = Array.from(new Set(pagamentos.map((p) => p.forma)));
  const resumoMeios = formasUnicas.length > 0 ? formasUnicas.join(" + ") : (meioRegistrado || "Pix");

  const tipo: "unico" | "parcial_dividido" =
    pagamentos.length > 1 || isParcial || statusPagamentoTag === "parcial"
      ? "parcial_dividido"
      : "unico";

  return {
    info: {
      tipo,
      valorTotalSessao,
      pagamentos,
      totalPago,
      saldoRestante,
      isQuitado,
      isParcial,
      resumoMeios,
    },
    cleanObservacoes: clean,
    statusPagamentoTag,
  };
}

/**
 * Codifica o registro de pagamento em formato estruturado dentro do campo observações.
 */
export function encodePagamentoSessao(
  cleanObservacoes: string,
  info: InfoPagamentoSessao,
  tipoAgendamento?: string
): string {
  // Limpar texto de tags existentes para evitar duplicidade
  const clean = (cleanObservacoes || "")
    .replace(/^\[Tipo:\s*(Anamnese|Sessão Padrão)\]\n?/i, "")
    .replace(/\[StatusPagamento:\s*(quitado|parcial|pendente)\]\n?/gi, "")
    .replace(/\[Meio:\s*[^\]]+\]\n?/gi, "")
    .replace(/\[Pagamentos:\s*\[[\s\S]*?\]\]\n?/gi, "")
    .replace(/PG\s+(PIX|ESP|ESPÉCIE|ESPECIE|DINHEIRO|DÉBITO|DEBITO|CRÉDITO|CREDITO|BOL|BOLETO|TRANSF|TRANSFERÊNCIA)[-\s:]+R?\$?\s*([\d.,]+)(?:\s*\(([^)]+)\))?\n?/gi, "")
    .trim();

  const parts: string[] = [];

  // Prefixo de tipo de atendimento (se informado)
  if (tipoAgendamento) {
    parts.push(tipoAgendamento === "anamnese" ? "[Tipo: Anamnese]" : "[Tipo: Sessão Padrão]");
  }

  if (info.pagamentos && info.pagamentos.length > 0) {
    // 1) Tag estruturada de pagamentos
    parts.push(`[Pagamentos: ${JSON.stringify(info.pagamentos)}]`);

    // 2) Status de quitação do pagamento
    if (info.isQuitado) {
      parts.push(`[StatusPagamento: quitado]`);
    } else if (info.isParcial || info.totalPago > 0) {
      parts.push(`[StatusPagamento: parcial]`);
    }

    // 3) Resumo do meio para retrocompatibilidade
    parts.push(`[Meio: ${info.resumoMeios || "Pix"}]`);
  }

  if (clean) {
    parts.push(clean);
  }

  return parts.join("\n");
}
