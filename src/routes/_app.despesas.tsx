import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  TrendingDown,
  TrendingUp,
  Lock,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Settings2,
  DollarSign,
  Wallet,
  Building2,
  Zap,
  ShoppingBag,
  Users,
  Search,
  ArrowUpRight,
  Sparkles,
  Receipt,
  Layers,
} from "lucide-react";
import { GerenciarContasRecorrentesDialog } from "@/components/GerenciarContasRecorrentesDialog";
import {
  ContaRecorrente,
  getContasRecorrentes,
  saveContasRecorrentes,
  cruzarContasComDespesas,
  calcularInfoEmprestimo,
  brl,
} from "@/lib/despesasRecorrentes";

export const Route = createFileRoute("/_app/despesas")({
  component: DespesasPage,
});

function DespesasPasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    try {
      if (password === "12345") {
        onUnlock();
        toast.success("Acesso liberado!");
      } else {
        toast.error("Senha incorreta!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao validar senha.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border-primary/20 shadow-lg">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary mb-3">
            <Lock className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Acesso Restrito</CardTitle>
          <CardDescription>
            Digite a senha para visualizar e gerenciar as despesas da clínica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Senha de Acesso</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="text-center tracking-widest pr-10"
                  autoFocus
                  disabled={verifying}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={verifying}>
              {verifying ? "Verificando..." : "Confirmar Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function DespesasPage() {
  const [unlocked, setUnlocked] = useState(() => {
    if (typeof window !== "undefined") {
      return window.sessionStorage.getItem("despesas_unlocked") === "true";
    }
    return false;
  });

  const queryClient = useQueryClient();
  const today = useMemo(() => new Date(), []);
  const [inicio, setInicio] = useState(format(startOfMonth(today), "yyyy-MM-dd"));
  const [fim, setFim] = useState(format(endOfMonth(today), "yyyy-MM-dd"));

  // Contas Recorrentes
  const [contasRecorrentes, setContasRecorrentes] = useState<ContaRecorrente[]>(() =>
    getContasRecorrentes()
  );
  const [dialogRecorrentesOpen, setDialogRecorrentesOpen] = useState(false);

  // Form states for manual expense
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(format(new Date(), "yyyy-MM-dd"));
  const [categoria, setCategoria] = useState("Outros");

  // Filters for registered expenses table
  const [buscaDespesa, setBuscaDespesa] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("TODAS");

  const formRef = useRef<HTMLDivElement | null>(null);

  // Navegação de mês
  const mesAtualDate = useMemo(() => {
    try {
      return parseISO(inicio);
    } catch {
      return new Date();
    }
  }, [inicio]);

  const nomeMesAno = useMemo(() => {
    return format(mesAtualDate, "MMMM 'de' yyyy", { locale: ptBR });
  }, [mesAtualDate]);

  const handleMudarMes = (delta: number) => {
    const novoMes = delta > 0 ? addMonths(mesAtualDate, delta) : subMonths(mesAtualDate, Math.abs(delta));
    setInicio(format(startOfMonth(novoMes), "yyyy-MM-dd"));
    setFim(format(endOfMonth(novoMes), "yyyy-MM-dd"));
  };

  const handleIrMesAtual = () => {
    setInicio(format(startOfMonth(today), "yyyy-MM-dd"));
    setFim(format(endOfMonth(today), "yyyy-MM-dd"));
  };

  // Fetch Expenses
  const { data: despesas = [], isLoading: loadingDespesas } = useQuery({
    queryKey: ["despesas-page", inicio, fim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("despesas")
        .select("*")
        .gte("data", inicio)
        .lte("data", fim)
        .order("data", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Salvar Contas Recorrentes
  const handleSaveContasRecorrentes = (novasContas: ContaRecorrente[]) => {
    setContasRecorrentes(novasContas);
    saveContasRecorrentes(novasContas);
  };

  // Cruzamento de Contas Recorrentes com Despesas do Mês
  const matchesRecorrentes = useMemo(() => {
    return cruzarContasComDespesas(contasRecorrentes, despesas, inicio);
  }, [contasRecorrentes, despesas, inicio]);

  // Totais e KPIs
  const totais = useMemo(() => {
    // Fixas Previstas: soma dos valores previstos das contas fixas ativas (incluindo Pagamento de Pessoal com repasse do mês anterior)
    const fixasAtivas = matchesRecorrentes.filter((m) => m.conta.tipo === "fixo");
    const totalFixasPrevistas = fixasAtivas.reduce(
      (acc, cur) => acc + (cur.valorPrevistoFinal || cur.conta.valorPadrao || 0),
      0
    );

    // Fixas Pagas no mês:
    let totalFixasPagas = 0;
    matchesRecorrentes.forEach((m) => {
      if (m.conta.tipo === "fixo" && (m.status === "pago" || m.status === "parcial")) {
        totalFixasPagas += m.valorEfetivo;
      }
    });

    const totalFixasPendentes = Math.max(0, totalFixasPrevistas - totalFixasPagas);

    // Variáveis Lançadas no mês:
    let totalVariaveisLancadas = 0;
    matchesRecorrentes.forEach((m) => {
      if (m.conta.tipo === "variavel" && m.status === "pago") {
        totalVariaveisLancadas += m.valorEfetivo;
      }
    });

    // Total Geral Previsto = Fixas Previstas + Variáveis já lançadas
    const totalPrevistoConsolidado = totalFixasPrevistas + totalVariaveisLancadas;

    // Total Efetivo Real de todos os lançamentos do banco no período
    const totalRealPeriodo = despesas.reduce((acc: number, cur: any) => acc + (Number(cur.valor) || 0), 0);

    const qtdFixasTotal = fixasAtivas.length;
    const qtdFixasPagas = matchesRecorrentes.filter(
      (m) => m.conta.tipo === "fixo" && (m.status === "pago" || m.status === "parcial")
    ).length;

    const progressoFixas =
      totalFixasPrevistas > 0
        ? Math.min(100, Math.round((totalFixasPagas / totalFixasPrevistas) * 100))
        : 100;

    return {
      totalFixasPrevistas,
      totalFixasPagas,
      totalFixasPendentes,
      totalVariaveisLancadas,
      totalPrevistoConsolidado,
      totalRealPeriodo,
      qtdFixasTotal,
      qtdFixasPagas,
      progressoFixas,
    };
  }, [matchesRecorrentes, despesas]);

  // Insert Expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (newExpense: {
      descricao: string;
      valor: number;
      data: string;
      categoria: string;
    }) => {
      const { data, error } = await supabase.from("despesas").insert(newExpense);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["despesas-page"] });
      toast.success("Despesa cadastrada com sucesso!");
      setDescricao("");
      setValor("");
      setData(format(new Date(), "yyyy-MM-dd"));
      setCategoria("Outros");
    },
    onError: (err: any) => {
      console.error(err);
      toast.error("Erro ao cadastrar despesa: " + err.message);
    },
  });

  // Delete Expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("despesas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["despesas-page"] });
      toast.success("Despesa excluída com sucesso!");
    },
    onError: (err: any) => {
      console.error(err);
      toast.error("Erro ao excluir despesa: " + err.message);
    },
  });

  // Update Expense mutation
  const updateExpenseMutation = useMutation({
    mutationFn: async (updatedExpense: {
      id: string;
      descricao: string;
      valor: number;
      data: string;
      categoria: string;
    }) => {
      const { error } = await supabase
        .from("despesas")
        .update({
          descricao: updatedExpense.descricao,
          valor: updatedExpense.valor,
          data: updatedExpense.data,
          categoria: updatedExpense.categoria,
        })
        .eq("id", updatedExpense.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["despesas-page"] });
      toast.success("Despesa atualizada com sucesso!");
      setEditExpenseDialog({ open: false, despesa: null });
    },
    onError: (err: any) => {
      console.error(err);
      toast.error("Erro ao atualizar despesa: " + err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      toast.error("Digite uma descrição para a despesa.");
      return;
    }
    const parsedValor = parseFloat(valor.replace(",", "."));
    if (isNaN(parsedValor) || parsedValor <= 0) {
      toast.error("Digite um valor válido maior que zero.");
      return;
    }

    createExpenseMutation.mutate({
      descricao,
      valor: parsedValor,
      data,
      categoria,
    });
  };

  // Preencher formulário rápido a partir da conta recorrente
  const handleLancarRecorrente = (
    conta: ContaRecorrente,
    infoEmprestimo: any,
    infoPessoal?: any
  ) => {
    let descSugerida = conta.nome;
    if (conta.isEmprestimo && infoEmprestimo) {
      descSugerida = `Empréstimo ${infoEmprestimo.parcelaAtual}/${infoEmprestimo.totalParcelas}`;
    } else if (infoPessoal) {
      descSugerida = `Pagamento de Pessoal - Repasses de ${infoPessoal.mesAnteriorNome}`;
    }

    let valSugerido = "";
    if (conta.tipo === "fixo") {
      valSugerido = String(infoPessoal ? infoPessoal.valor : conta.valorPadrao || "");
    }

    const diaVenc = conta.diaVencimento || 10;
    const anoMes = inicio.substring(0, 7);
    const dataSugerida = `${anoMes}-${String(diaVenc).padStart(2, "0")}`;

    setDescricao(descSugerida);
    setValor(valSugerido);
    setData(dataSugerida);
    setCategoria(conta.categoria || "Outros");

    toast.info(`Preenchendo despesa: "${descSugerida}". Complete e confirme o lançamento.`);

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Edit Expense Dialog
  const [editExpenseDialog, setEditExpenseDialog] = useState<{ open: boolean; despesa: any }>({
    open: false,
    despesa: null,
  });
  const [expenseForm, setExpenseForm] = useState({
    descricao: "",
    valor: "",
    data: format(new Date(), "yyyy-MM-dd"),
    categoria: "Outros",
  });

  const handleOpenEditExpense = (despesa: any) => {
    setExpenseForm({
      descricao: despesa.descricao,
      valor: String(despesa.valor),
      data: despesa.data,
      categoria: despesa.categoria || "Outros",
    });
    setEditExpenseDialog({ open: true, despesa });
  };

  // Filtro de despesas da tabela geral
  const despesasFiltradas = useMemo(() => {
    return despesas.filter((d: any) => {
      const matchBusca =
        !buscaDespesa ||
        d.descricao?.toLowerCase().includes(buscaDespesa.toLowerCase()) ||
        d.categoria?.toLowerCase().includes(buscaDespesa.toLowerCase());

      const matchCat =
        filtroCategoria === "TODAS" ||
        (d.categoria || "Outros").toLowerCase() === filtroCategoria.toLowerCase();

      return matchBusca && matchCat;
    });
  }, [despesas, buscaDespesa, filtroCategoria]);

  const isMutating = createExpenseMutation.isPending || deleteExpenseMutation.isPending;

  if (!unlocked) {
    return (
      <DespesasPasswordGate
        onUnlock={() => {
          setUnlocked(true);
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem("despesas_unlocked", "true");
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Month Navigator */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <TrendingDown className="h-6 w-6 text-rose-500" />
            Controle de Despesas & Previsão Mensal
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Acompanhe a previsão de despesas fixas, variáveis e histórico de pagamentos da clínica.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialogRecorrentesOpen(true)}
            className="gap-1.5 text-xs h-9 border-border shadow-sm hover:border-primary/50"
          >
            <Settings2 className="h-3.5 w-3.5 text-primary" />
            Gerenciar Contas Recorrentes
          </Button>
        </div>
      </div>

      {/* Date Navigator Card */}
      <Card className="border-border shadow-sm bg-card/60 backdrop-blur-sm">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => handleMudarMes(-1)}
              title="Mês Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="px-3 py-1.5 rounded-lg bg-muted/50 border border-border/80 flex items-center gap-2 text-sm font-semibold capitalize min-w-[180px] justify-center">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{nomeMesAno}</span>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => handleMudarMes(1)}
              title="Próximo Mês"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleIrMesAtual}
              className="text-xs h-9 text-muted-foreground hover:text-foreground"
            >
              Mês Atual
            </Button>
          </div>

          <div className="flex items-center gap-3 ml-auto flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-medium">Período:</span>
              <Input
                type="date"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                className="h-8 text-xs w-[130px]"
              />
              <span>até</span>
              <Input
                type="date"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
                className="h-8 text-xs w-[130px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Despesas Fixas Previstas */}
        <Card className="border-border shadow-sm bg-gradient-to-br from-card via-card to-primary/5">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Despesas Fixas Previstas
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Building2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-2">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {brl(totais.totalFixasPrevistas)}
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center justify-between">
              <span>{totais.qtdFixasTotal} contas fixas configuradas</span>
              <Badge variant="outline" className="text-[10px] font-normal py-0">
                Aluguel + Pessoal + Empr. + Cont.
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Fixas Pagas vs Pendentes */}
        <Card className="border-border shadow-sm">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Fixas Quitadas no Mês
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-2">
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {brl(totais.totalFixasPagas)}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>
                  {totais.qtdFixasPagas} de {totais.qtdFixasTotal} pagas
                </span>
                <span className="font-semibold">{totais.progressoFixas}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${totais.progressoFixas}%` }}
                />
              </div>
              {totais.totalFixasPendentes > 0 && (
                <div className="text-[10px] text-amber-600 dark:text-amber-400 pt-0.5">
                  Falta pagar: {brl(totais.totalFixasPendentes)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Variáveis do Mês */}
        <Card className="border-border shadow-sm">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Variáveis do Mês (Lançadas)
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Zap className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-2">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {brl(totais.totalVariaveisLancadas)}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Energia, Imposto, Pessoal, Supermercado
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Previsão Total do Mês */}
        <Card className="border-border shadow-sm bg-gradient-to-br from-card via-card to-rose-500/5">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Previsão Total do Mês
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-2">
            <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {brl(totais.totalPrevistoConsolidado)}
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Fixas + Variáveis apuradas</span>
              <span className="text-[10px]">Total Real: {brl(totais.totalRealPeriodo)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Previsão de Despesas Mensais (Contas Recorrentes) */}
      <Card className="border-border shadow-sm overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Previsão de Despesas Recorrentes — {nomeMesAno}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Contas fixas pré-preenchidas e variáveis do mês. Clique em "Lançar Despesa" para
                registrar no caixa oficial.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialogRecorrentesOpen(true)}
                className="text-xs h-8 gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar / Excluir Contas
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[200px]">Conta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Detalhamento / Parcelas</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor Previsto</TableHead>
                  <TableHead className="text-right">Valor Realizado</TableHead>
                  <TableHead className="text-center">Status no Mês</TableHead>
                  <TableHead className="text-right w-[140px]">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matchesRecorrentes.map((m) => {
                  const { conta, valorEfetivo, status, infoEmprestimo, despesasEncontradas } = m;
                  const isFixo = conta.tipo === "fixo";

                  return (
                    <TableRow key={conta.id} className="hover:bg-muted/30 transition-colors">
                      {/* Nome */}
                      <TableCell className="font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          {conta.isEmprestimo ? (
                            <Receipt className="h-4 w-4 text-amber-500 shrink-0" />
                          ) : conta.nome.toLowerCase().includes("aluguel") ? (
                            <Building2 className="h-4 w-4 text-indigo-500 shrink-0" />
                          ) : conta.nome.toLowerCase().includes("energia") ? (
                            <Zap className="h-4 w-4 text-yellow-500 shrink-0" />
                          ) : conta.nome.toLowerCase().includes("contador") ? (
                            <Users className="h-4 w-4 text-blue-500 shrink-0" />
                          ) : conta.nome.toLowerCase().includes("mercado") || conta.nome.toLowerCase().includes("supermercado") ? (
                            <ShoppingBag className="h-4 w-4 text-emerald-500 shrink-0" />
                          ) : (
                            <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <span>{conta.nome}</span>
                        </div>
                      </TableCell>

                      {/* Tipo */}
                      <TableCell>
                        <Badge
                          variant={isFixo ? "default" : "secondary"}
                          className={`text-[10px] px-2 py-0.5 ${
                            isFixo
                              ? "bg-primary/90 text-primary-foreground"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {isFixo ? "Fixo" : "Variável"}
                        </Badge>
                      </TableCell>

                      {/* Detalhamento / Empréstimo / Repasse Pessoal */}
                      <TableCell>
                        {conta.isEmprestimo && infoEmprestimo ? (
                          <div className="space-y-1 py-1 max-w-[280px]">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-amber-600 dark:text-amber-400">
                                {infoEmprestimo.textoParcela}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                • {infoEmprestimo.textoFalta}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 rounded-full"
                                style={{ width: `${infoEmprestimo.percentualPago}%` }}
                                title={`${infoEmprestimo.percentualPago}% pago`}
                              />
                            </div>
                          </div>
                        ) : m.infoPessoal ? (
                          <div className="space-y-0.5 max-w-[280px]">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                              <Users className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                              <span>Repasses de {m.infoPessoal.mesAnteriorNome}</span>
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              Sessões já realizadas • Vencimento dia {conta.diaVencimento || 10}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {conta.diaVencimento ? `Vencimento sugerido dia ${conta.diaVencimento}` : "Mensal"}
                          </span>
                        )}
                      </TableCell>

                      {/* Categoria */}
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          {conta.categoria}
                        </span>
                      </TableCell>

                      {/* Valor Previsto */}
                      <TableCell className="text-right font-medium">
                        {isFixo ? (
                          <span className="text-foreground font-semibold">
                            {brl(m.valorPrevistoFinal || conta.valorPadrao)}
                          </span>
                        ) : (
                          <span className="text-xs italic text-muted-foreground">
                            Variável
                          </span>
                        )}
                      </TableCell>

                      {/* Valor Realizado */}
                      <TableCell className="text-right font-semibold">
                        {despesasEncontradas.length > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {brl(valorEfetivo)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {despesasEncontradas.length === 1
                                ? `Pago em ${format(
                                    parseISO(despesasEncontradas[0].data),
                                    "dd/MM"
                                  )}`
                                : `${despesasEncontradas.length} lançamentos`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        {status === "pago" ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1 text-[11px]">
                            <CheckCircle2 className="h-3 w-3" /> Pago / Lançado
                          </Badge>
                        ) : status === "parcial" ? (
                          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 gap-1 text-[11px]">
                            <Clock className="h-3 w-3" /> Pago Parcial
                          </Badge>
                        ) : isFixo ? (
                          <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/40 gap-1 text-[11px]">
                            <Clock className="h-3 w-3" /> Pendente
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground border-border gap-1 text-[11px]">
                            <AlertCircle className="h-3 w-3" /> A Lançar
                          </Badge>
                        )}
                      </TableCell>

                      {/* Ação */}
                      <TableCell className="text-right">
                        {despesasEncontradas.length === 0 ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1 border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all"
                            onClick={() => handleLancarRecorrente(conta, infoEmprestimo, m.infoPessoal)}
                          >
                            <Plus className="h-3 w-3" /> Lançar Despesa
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => handleOpenEditExpense(despesasEncontradas[0])}
                            title="Editar lançamento realizado"
                          >
                            <Pencil className="h-3 w-3 mr-1" /> Editar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Formulário Manual e Tabela Geral de Despesas Registradas */}
      <div className="grid gap-6 lg:grid-cols-3" ref={formRef}>
        {/* Formulário de Cadastro Manual */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                Registrar Despesa
              </CardTitle>
              <CardDescription className="text-xs">
                Lance qualquer despesa avulsa ou confirme um gasto recorrente no caixa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="expense-desc" className="text-xs">
                    Descrição *
                  </Label>
                  <Input
                    id="expense-desc"
                    placeholder="Ex: Aluguel da clínica, Energia, etc."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    required
                    className="h-9 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="expense-value" className="text-xs">
                      Valor (R$) *
                    </Label>
                    <Input
                      id="expense-value"
                      placeholder="0,00"
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                      required
                      className="h-9 text-sm font-semibold text-rose-600 dark:text-rose-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="expense-date" className="text-xs">
                      Data *
                    </Label>
                    <Input
                      id="expense-date"
                      type="date"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      required
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="expense-category" className="text-xs">
                    Categoria
                  </Label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger id="expense-category" className="h-9 text-sm w-full">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aluguel">Aluguel / Condomínio</SelectItem>
                      <SelectItem value="Salários">Salários / Honorários</SelectItem>
                      <SelectItem value="Impostos">Impostos / Taxas</SelectItem>
                      <SelectItem value="Materiais">Materiais / Escritório</SelectItem>
                      <SelectItem value="Limpeza">Limpeza / Conservação</SelectItem>
                      <SelectItem value="Utilidades">Água / Luz / Internet</SelectItem>
                      <SelectItem value="Marketing">Marketing / Divulgação</SelectItem>
                      <SelectItem value="Outros">Outros Gastos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  disabled={isMutating}
                  className="w-full flex items-center justify-center gap-2 h-9 text-xs font-semibold"
                >
                  <Plus className="h-4 w-4" /> Salvar no Caixa
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Lista Geral de Todas as Despesas Registradas */}
        <Card className="border-border shadow-sm lg:col-span-2">
          <CardHeader className="pb-3 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold">
                  Despesas Registradas ({despesasFiltradas.length})
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Todos os lançamentos do período selecionado ({inicio} a {fim}).
                </CardDescription>
              </div>

              {/* Filtros da tabela */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative min-w-[150px]">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar despesa..."
                    value={buscaDespesa}
                    onChange={(e) => setBuscaDespesa(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                </div>

                <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                  <SelectTrigger className="h-8 text-xs w-[130px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODAS">Todas Categorias</SelectItem>
                    <SelectItem value="Aluguel">Aluguel</SelectItem>
                    <SelectItem value="Salários">Salários</SelectItem>
                    <SelectItem value="Impostos">Impostos</SelectItem>
                    <SelectItem value="Materiais">Materiais</SelectItem>
                    <SelectItem value="Limpeza">Limpeza</SelectItem>
                    <SelectItem value="Utilidades">Utilidades</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loadingDespesas ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Carregando despesas...
              </div>
            ) : despesasFiltradas.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhuma despesa encontrada para os filtros selecionados.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-[100px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {despesasFiltradas.map((d: any) => (
                      <TableRow key={d.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-xs">
                          {format(new Date(d.data + "T12:00:00"), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate text-sm" title={d.descricao}>
                          {d.descricao}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground">
                            {d.categoria || "Outros"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-rose-600 dark:text-rose-400">
                          {brl(Number(d.valor))}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => handleOpenEditExpense(d)}
                              title="Editar Despesa"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  title="Excluir Despesa"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Tem certeza que deseja excluir esta despesa?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação é irreversível. A despesa "{d.descricao}" no valor de{" "}
                                    {brl(Number(d.valor))} será excluída permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteExpenseMutation.mutate(d.id)}
                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Totalizador no rodapé da tabela */}
            <div className="flex items-center justify-between p-4 border-t bg-muted/10 text-xs">
              <span className="text-muted-foreground">
                Total registrado no período ({despesasFiltradas.length} itens)
              </span>
              <span className="font-bold text-sm text-foreground">
                {brl(
                  despesasFiltradas.reduce(
                    (acc: number, cur: any) => acc + (Number(cur.valor) || 0),
                    0
                  )
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Editar Despesa Dialog */}
      <Dialog
        open={editExpenseDialog.open}
        onOpenChange={(open) =>
          setEditExpenseDialog({ open, despesa: open ? editExpenseDialog.despesa : null })
        }
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Despesa</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!expenseForm.descricao.trim()) {
                toast.error("Digite uma descrição para a despesa.");
                return;
              }
              const parsedValor = parseFloat(expenseForm.valor.replace(",", "."));
              if (isNaN(parsedValor) || parsedValor <= 0) {
                toast.error("Digite um valor válido maior que zero.");
                return;
              }

              if (editExpenseDialog.despesa) {
                updateExpenseMutation.mutate({
                  id: editExpenseDialog.despesa.id,
                  descricao: expenseForm.descricao,
                  valor: parsedValor,
                  data: expenseForm.data,
                  categoria: expenseForm.categoria,
                });
              }
            }}
            className="space-y-4 pt-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="edit-expense-desc" className="text-xs">Descrição</Label>
              <Input
                id="edit-expense-desc"
                placeholder="Ex: Aluguel da clínica"
                value={expenseForm.descricao}
                onChange={(e) => setExpenseForm({ ...expenseForm, descricao: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-expense-value" className="text-xs">Valor (R$)</Label>
                <Input
                  id="edit-expense-value"
                  placeholder="0,00"
                  value={expenseForm.valor}
                  onChange={(e) => setExpenseForm({ ...expenseForm, valor: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-expense-date" className="text-xs">Data</Label>
                <Input
                  id="edit-expense-date"
                  type="date"
                  value={expenseForm.data}
                  onChange={(e) => setExpenseForm({ ...expenseForm, data: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-expense-category" className="text-xs">Categoria</Label>
              <Select
                value={expenseForm.categoria}
                onValueChange={(val) => setExpenseForm({ ...expenseForm, categoria: val })}
              >
                <SelectTrigger id="edit-expense-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aluguel">Aluguel / Condomínio</SelectItem>
                  <SelectItem value="Salários">Salários / Honorários</SelectItem>
                  <SelectItem value="Impostos">Impostos / Taxas</SelectItem>
                  <SelectItem value="Materiais">Materiais / Escritório</SelectItem>
                  <SelectItem value="Limpeza">Limpeza / Conservação</SelectItem>
                  <SelectItem value="Utilidades">Água / Luz / Internet</SelectItem>
                  <SelectItem value="Marketing">Marketing / Divulgação</SelectItem>
                  <SelectItem value="Outros">Outros Gastos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditExpenseDialog({ open: false, despesa: null })}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateExpenseMutation.isPending}>
                {updateExpenseMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Gerenciamento das Contas Recorrentes */}
      <GerenciarContasRecorrentesDialog
        open={dialogRecorrentesOpen}
        onOpenChange={setDialogRecorrentesOpen}
        contas={contasRecorrentes}
        onSave={handleSaveContasRecorrentes}
      />
    </div>
  );
}
