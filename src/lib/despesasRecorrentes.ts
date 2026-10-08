export type TipoDespesaRecorrente = "fixo" | "variavel";

export interface ContaRecorrente {
  id: string;
  nome: string;
  tipo: TipoDespesaRecorrente;
  valorPadrao: number; // fixo tem valor (ex: 3050, 417, 320), variável começa com 0
  categoria: string;
  diaVencimento?: number; // dia do mês sugerido (1 a 31)
  ativo: boolean;
  // Configuração específica para empréstimos / financiamentos parcelados
  isEmprestimo?: boolean;
  parcelaBase?: number; // ex: 28
  mesBase?: string; // ex: "2026-06"
  totalParcelas?: number; // ex: 36
  valorParcela?: number; // ex: 417
  observacoes?: string;
}

export const STORAGE_KEY_CONTAS_RECORRENTES = "espaco_multi_contas_recorrentes_v2";

export const CONTAS_RECORRENTES_DEFAULT: ContaRecorrente[] = [
  {
    id: "aluguel",
    nome: "Aluguel",
    tipo: "fixo",
    valorPadrao: 3050.0,
    categoria: "Aluguel",
    diaVencimento: 10,
    ativo: true,
  },
  {
    id: "emprestimo",
    nome: "Empréstimo",
    tipo: "fixo",
    valorPadrao: 417.0,
    categoria: "Outros",
    diaVencimento: 20,
    ativo: true,
    isEmprestimo: true,
    parcelaBase: 28,
    mesBase: "2026-06",
    totalParcelas: 36,
    valorParcela: 417.0,
    observacoes: "Empréstimo bancário em 36 parcelas",
  },
  {
    id: "contador",
    nome: "Contador",
    tipo: "fixo",
    valorPadrao: 320.0,
    categoria: "Salários",
    diaVencimento: 24,
    ativo: true,
  },
  {
    id: "energia",
    nome: "Energia",
    tipo: "variavel",
    valorPadrao: 0,
    categoria: "Utilidades",
    diaVencimento: 22,
    ativo: true,
  },
  {
    id: "imposto",
    nome: "Imposto",
    tipo: "variavel",
    valorPadrao: 0,
    categoria: "Impostos",
    diaVencimento: 20,
    ativo: true,
  },
  {
    id: "pagamento-pessoal",
    nome: "Pagamento de Pessoal",
    tipo: "variavel",
    valorPadrao: 0,
    categoria: "Salários",
    diaVencimento: 10,
    ativo: true,
  },
  {
    id: "supermercado",
    nome: "Supermercado",
    tipo: "variavel",
    valorPadrao: 0,
    categoria: "Materiais",
    diaVencimento: 15,
    ativo: true,
  },
];

export function brl(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function getContasRecorrentes(): ContaRecorrente[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return CONTAS_RECORRENTES_DEFAULT;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_CONTAS_RECORRENTES);
    if (!raw) {
      window.localStorage.setItem(
        STORAGE_KEY_CONTAS_RECORRENTES,
        JSON.stringify(CONTAS_RECORRENTES_DEFAULT)
      );
      return CONTAS_RECORRENTES_DEFAULT;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return CONTAS_RECORRENTES_DEFAULT;
  } catch (err) {
    console.error("Erro ao carregar contas recorrentes:", err);
    return CONTAS_RECORRENTES_DEFAULT;
  }
}

export function saveContasRecorrentes(contas: ContaRecorrente[]): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY_CONTAS_RECORRENTES, JSON.stringify(contas));
  } catch (err) {
    console.error("Erro ao salvar contas recorrentes:", err);
  }
}

export interface InfoParcelaEmprestimo {
  parcelaAtual: number;
  totalParcelas: number;
  parcelasRestantes: number;
  saldoRestante: number;
  status: "nao_iniciado" | "em_andamento" | "quitado";
  textoParcela: string;
  textoFalta: string;
  percentualPago: number;
}

export function calcularInfoEmprestimo(
  conta: ContaRecorrente,
  dataOuMesReferencia: string | Date
): InfoParcelaEmprestimo | null {
  if (!conta.isEmprestimo) return null;

  const totalParcelas = conta.totalParcelas || 36;
  const valorParcela = conta.valorParcela || conta.valorPadrao || 417;
  const parcelaBase = conta.parcelaBase ?? 28;
  const mesBase = conta.mesBase || "2026-06";

  const [baseYear, baseMonth] = mesBase.split("-").map(Number);

  let refYear: number;
  let refMonth: number;

  if (typeof dataOuMesReferencia === "string") {
    const parts = dataOuMesReferencia.split("-");
    refYear = Number(parts[0]);
    refMonth = Number(parts[1]);
  } else {
    refYear = dataOuMesReferencia.getFullYear();
    refMonth = dataOuMesReferencia.getMonth() + 1;
  }

  const diffMeses = (refYear - baseYear) * 12 + (refMonth - baseMonth);
  const parcelaAtual = parcelaBase + diffMeses;

  if (parcelaAtual <= 0) {
    return {
      parcelaAtual: 0,
      totalParcelas,
      parcelasRestantes: totalParcelas,
      saldoRestante: totalParcelas * valorParcela,
      status: "nao_iniciado",
      textoParcela: `Não iniciado (0/${totalParcelas})`,
      textoFalta: `Total a pagar: ${totalParcelas}x de ${brl(valorParcela)} (${brl(
        totalParcelas * valorParcela
      )})`,
      percentualPago: 0,
    };
  }

  if (parcelaAtual > totalParcelas) {
    return {
      parcelaAtual,
      totalParcelas,
      parcelasRestantes: 0,
      saldoRestante: 0,
      status: "quitado",
      textoParcela: `Quitado (${totalParcelas}/${totalParcelas})`,
      textoFalta: "Todas as parcelas foram quitadas!",
      percentualPago: 100,
    };
  }

  const parcelasRestantes = Math.max(0, totalParcelas - parcelaAtual);
  const saldoRestante = parcelasRestantes * valorParcela;
  const percentualPago = Math.min(100, Math.round((parcelaAtual / totalParcelas) * 100));

  return {
    parcelaAtual,
    totalParcelas,
    parcelasRestantes,
    saldoRestante,
    status: "em_andamento",
    textoParcela: `Parcela ${parcelaAtual} de ${totalParcelas}`,
    textoFalta:
      parcelasRestantes === 0
        ? "Última parcela!"
        : `Faltam ${parcelasRestantes} parcela${
            parcelasRestantes > 1 ? "s" : ""
          } (${brl(saldoRestante)})`,
    percentualPago,
  };
}

export interface MatchContaDespesa {
  conta: ContaRecorrente;
  despesasEncontradas: any[];
  valorEfetivo: number;
  status: "pago" | "parcial" | "pendente" | "variavel_pendente";
  infoEmprestimo: InfoParcelaEmprestimo | null;
}

export function cruzarContasComDespesas(
  contas: ContaRecorrente[],
  despesas: any[],
  dataReferencia: string
): MatchContaDespesa[] {
  return contas
    .filter((c) => c.ativo)
    .map((conta) => {
      const nomeNorm = conta.nome.toLowerCase().trim();
      const infoEmprestimo = calcularInfoEmprestimo(conta, dataReferencia);

      const matches = despesas.filter((d: any) => {
        const desc = (d.descricao || "").toLowerCase().trim();
        const cat = (d.categoria || "").toLowerCase().trim();

        if (conta.isEmprestimo || nomeNorm.includes("empr")) {
          return desc.includes("empr");
        }
        if (conta.id === "aluguel" || nomeNorm.includes("aluguel")) {
          return desc.includes("aluguel") || cat === "aluguel";
        }
        if (conta.id === "contador" || nomeNorm.includes("contador")) {
          return desc.includes("contador");
        }
        if (
          conta.id === "energia" ||
          nomeNorm.includes("energia") ||
          nomeNorm.includes("luz")
        ) {
          return (
            desc.includes("energia") ||
            desc.includes("luz") ||
            desc.includes("equatorial") ||
            desc.includes("enel")
          );
        }
        if (conta.id === "imposto" || nomeNorm.includes("imposto")) {
          return (
            desc.includes("impost") ||
            desc.includes("das") ||
            desc.includes("darf") ||
            desc.includes("tribut") ||
            cat === "impostos"
          );
        }
        if (
          conta.id === "pagamento-pessoal" ||
          nomeNorm.includes("pessoal") ||
          nomeNorm.includes("pagamento")
        ) {
          return (
            desc.includes("pessoal") ||
            desc.includes("folha") ||
            (cat === "salários" &&
              !desc.includes("contador") &&
              !desc.includes("retirada"))
          );
        }
        if (
          conta.id === "supermercado" ||
          nomeNorm.includes("supermercado") ||
          nomeNorm.includes("mercado")
        ) {
          return (
            desc.includes("supermercado") ||
            desc.includes("mercado") ||
            desc.includes("compras")
          );
        }

        return desc.includes(nomeNorm);
      });

      const valorEfetivo = matches.reduce(
        (acc, cur) => acc + (Number(cur.valor) || 0),
        0
      );

      let status: MatchContaDespesa["status"] = "pendente";
      if (conta.tipo === "fixo") {
        if (matches.length > 0) {
          status = valorEfetivo >= conta.valorPadrao * 0.95 ? "pago" : "parcial";
        } else {
          status = "pendente";
        }
      } else {
        if (matches.length > 0) {
          status = "pago";
        } else {
          status = "variavel_pendente";
        }
      }

      return {
        conta,
        despesasEncontradas: matches,
        valorEfetivo,
        status,
        infoEmprestimo,
      };
    });
}
