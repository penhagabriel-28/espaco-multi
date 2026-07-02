import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase as supabaseClient } from "@/integrations/supabase/client";
const supabase = supabaseClient as any;
import { useState, useMemo, useEffect } from "react";
import { format, startOfMonth, endOfMonth, differenceInDays, startOfDay } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Lock,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  ArrowRightLeft,
  Eye,
  EyeOff,
  Check,
  Pencil,
  Search,
  DollarSign,
  AlertCircle,
  Clock,
  MessageCircle,
  ExternalLink,
  ArrowLeft,
  ChevronLeft,
  X,
  Printer,
} from "lucide-react";

export const Route = createFileRoute("/_app/diretoria")({
  component: DiretoriaPage,
});

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    try {
      const expectedPassword = import.meta.env.VITE_DIRETORIA_PASSWORD || "Gabi2020@";
      if (password === expectedPassword) {
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
            Digite sua senha de administrador para visualizar as informações financeiras da
            diretoria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Senha do Administrador</Label>
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

function DiretoriaPageContent() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("diretoria-realtime-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "faturas" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dir-faturas"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fatura_itens" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dir-fatura-itens"] });
          queryClient.invalidateQueries({ queryKey: ["dir-fatura-itens-all"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pacientes" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dir-pacientes-min"] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
  const today = new Date();
  const [inicio, setInicio] = useState(format(startOfMonth(today), "yyyy-MM-dd"));
  const [fim, setFim] = useState(format(endOfMonth(today), "yyyy-MM-dd"));

  useEffect(() => {
    async function fetchOldestPendingCompetence() {
      try {
        const { data, error } = await supabase
          .from("faturas")
          .select("competencia")
          .in("status", ["aberta", "vencida"])
          .order("competencia", { ascending: true })
          .limit(1);
        
        if (error) throw error;
        
        if (data && data.length > 0 && data[0]?.competencia) {
          const rawDate = data[0].competencia;
          const formattedDate = typeof rawDate === "string" ? rawDate.substring(0, 10) : format(new Date(rawDate), "yyyy-MM-dd");
          setInicio(formattedDate);
        }
      } catch (err) {
        console.error("Erro ao buscar competência mais antiga pendente:", err);
      }
    }
    void fetchOldestPendingCompetence();
  }, []);

  const normalizeString = (str: string) =>
    str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";

  const getPatientProfessionals = (pacienteId: string) => {
    const patientFats = (faturas || []).filter((f) => f.paciente_id === pacienteId);
    const names = new Set<string>();
    patientFats.forEach((f) => {
      const pros = faturaProfessionalsMap.get(f.id);
      if (pros) {
        pros.forEach((p) => names.add(p));
      }
    });

    const p = patientDetailsMap.get(pacienteId);
    if (p && p.paciente_profissional) {
      p.paciente_profissional.forEach((pp: any) => {
        const name = professionalMap.get(pp.profissional_id);
        if (name) {
          names.add(name);
        }
      });
    }

    return Array.from(names);
  };

  // Fetch Patients
  const { data: pacientes = [] } = useQuery<any[]>({
    queryKey: ["dir-pacientes-min"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pacientes")
        .select(`
          id, 
          nome, 
          valor_mensal, 
          cids_secundarios, 
          apoio_frequencia, 
          apoio_valor_personalizado,
          paciente_profissional (
            profissional_id
          )
        `)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const patientMap = useMemo(() => {
    return new Map<string, string>((pacientes || []).map((p) => [p.id, p.nome]));
  }, [pacientes]);

  const patientDetailsMap = useMemo(() => {
    return new Map<string, any>((pacientes || []).map((p) => [p.id, p]));
  }, [pacientes]);

  // Fetch all responsaveis to map their contacts
  const { data: responsaveis = [] } = useQuery<any[]>({
    queryKey: ["dir-responsaveis-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("responsaveis")
        .select("id, paciente_id, nome, telefone, whatsapp, parentesco");
      if (error) throw error;
      return data;
    },
  });

  const responsaveisMap = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const r of responsaveis || []) {
      const list = map.get(r.paciente_id) || [];
      list.push(r);
      map.set(r.paciente_id, list);
    }
    return map;
  }, [responsaveis]);

  // Fetch Invoices
  const { data: faturas = [], isLoading: loadingFaturas } = useQuery<any[]>({
    queryKey: ["dir-faturas", inicio, fim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faturas")
        .select(
           "id, valor, status, competencia, vencimento, pago_em, metodo, observacoes, paciente_id, profissional_id, especialidade",
        )
        .gte("competencia", inicio)
        .lte("competencia", fim)
        .order("competencia", { ascending: true })
        .order("vencimento", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Confirm payment mutation
  const confirmPaymentMutation = useMutation({
    mutationFn: async ({
      id,
      pago_em,
      metodo,
      observacoes,
    }: {
      id: string;
      pago_em: string;
      metodo: string;
      observacoes?: string;
    }) => {
      const { error } = await supabase
        .from("faturas")
        .update({
          status: "paga",
          pago_em,
          metodo: metodo as any,
          observacoes: observacoes || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dir-faturas"] });
      toast.success("Pagamento confirmado com sucesso!");
    },
    onError: (err: any) => {
      toast.error("Erro ao confirmar pagamento: " + err.message);
    },
  });

  // Create billing (manual) mutation
  const createFaturaMutation = useMutation({
    mutationFn: async (newFatura: {
      paciente_id: string;
      competencia: string;
      vencimento?: string | null;
      valor: number;
      status: string;
      observacoes?: string | null;
      profissional_id?: string | null;
      especialidade?: string | null;
    }) => {
      const { error } = await supabase.from("faturas").insert({
        paciente_id: newFatura.paciente_id,
        competencia: newFatura.competencia,
        vencimento: newFatura.vencimento || null,
        valor: newFatura.valor,
        status: newFatura.status as any,
        observacoes: newFatura.observacoes || null,
        profissional_id: newFatura.profissional_id || null,
        especialidade: newFatura.especialidade || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dir-faturas"] });
      toast.success("Cobrança criada com sucesso!");
    },
    onError: (err: any) => {
      toast.error("Erro ao criar cobrança: " + err.message);
    },
  });

  // Edit billing mutation
  const editFaturaMutation = useMutation({
    mutationFn: async (updatedFatura: {
      id: string;
      competencia: string;
      vencimento?: string | null;
      valor: number;
      status: string;
      pago_em?: string | null;
      metodo?: string | null;
      observacoes?: string | null;
      profissional_id?: string | null;
      especialidade?: string | null;
    }) => {
      const { error } = await supabase
        .from("faturas")
        .update({
          competencia: updatedFatura.competencia,
          vencimento: updatedFatura.vencimento || null,
          valor: updatedFatura.valor,
          status: updatedFatura.status as any,
          pago_em:
            updatedFatura.status === "paga"
              ? (updatedFatura.pago_em
                ? new Date(updatedFatura.pago_em + "T12:00:00").toISOString()
                : new Date().toISOString())
              : null,
          metodo: updatedFatura.status === "paga" ? (updatedFatura.metodo as any || "pix") : null,
          observacoes: updatedFatura.observacoes || null,
          profissional_id: updatedFatura.profissional_id || null,
          especialidade: updatedFatura.especialidade || null,
        })
        .eq("id", updatedFatura.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dir-faturas"] });
      toast.success("Cobrança atualizada com sucesso!");
    },
    onError: (err: any) => {
      toast.error("Erro ao atualizar cobrança: " + err.message);
    },
  });

  // Delete billing mutation
  const deleteFaturaMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("fatura_itens").delete().eq("fatura_id", id);
      const { error } = await supabase.from("faturas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dir-faturas"] });
      toast.success("Cobrança excluída com sucesso!");
    },
    onError: (err: any) => {
      toast.error("Erro ao excluir cobrança: " + err.message);
    },
  });

  // Delete individual billing item mutation
  const deleteFaturaItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      // 1. Fetch the item to know its parent fatura_id
      const { data: itemToDelete, error: getError } = await supabase
        .from("fatura_itens")
        .select("fatura_id")
        .eq("id", itemId)
        .single();
      if (getError) throw getError;
      const faturaId = itemToDelete?.fatura_id;

      // 2. Delete the item
      const { error: deleteError } = await supabase
        .from("fatura_itens")
        .delete()
        .eq("id", itemId);
      if (deleteError) throw deleteError;

      // 3. Recalculate or delete parent fatura
      if (faturaId) {
        const { data: remainingItems, error: fetchError } = await supabase
          .from("fatura_itens")
          .select("total")
          .eq("fatura_id", faturaId);
        if (fetchError) throw fetchError;

        if (!remainingItems || remainingItems.length === 0) {
          // Delete parent fatura if empty
          const { error: deleteFaturaError } = await supabase
            .from("faturas")
            .delete()
            .eq("id", faturaId);
          if (deleteFaturaError) throw deleteFaturaError;
        } else {
          // Recalculate total and update parent fatura
          const newTotal = remainingItems.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0);
          const { error: updateFaturaError } = await supabase
            .from("faturas")
            .update({ valor: newTotal })
            .eq("id", faturaId);
          if (updateFaturaError) throw updateFaturaError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dir-faturas"] });
      queryClient.invalidateQueries({ queryKey: ["dir-fatura-itens-all"] });
      toast.success("Sessão excluída da cobrança com sucesso!");
    },
    onError: (err: any) => {
      toast.error("Erro ao excluir sessão: " + err.message);
    },
  });

  // Edit fatura item mutation
  const editFaturaItemMutation = useMutation({
    mutationFn: async ({
      id,
      descricao,
      valor_unitario,
    }: {
      id: string;
      descricao: string;
      valor_unitario: number;
    }) => {
      const { error } = await supabase
        .from("fatura_itens")
        .update({
          descricao,
          valor_unitario,
          total: valor_unitario,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dir-faturas"] });
      queryClient.invalidateQueries({ queryKey: ["dir-fatura-itens-all"] });
      toast.success("Sessão atualizada com sucesso!");
    },
    onError: (err: any) => {
      toast.error("Erro ao atualizar sessão: " + err.message);
    },
  });

  // Create fatura item mutation
  const createFaturaItemMutation = useMutation({
    mutationFn: async ({
      fatura_id,
      descricao,
      valor_unitario,
    }: {
      fatura_id: string;
      descricao: string;
      valor_unitario: number;
    }) => {
      const { error } = await supabase
        .from("fatura_itens")
        .insert({
          fatura_id,
          descricao,
          quantidade: 1,
          valor_unitario,
          total: valor_unitario,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dir-faturas"] });
      queryClient.invalidateQueries({ queryKey: ["dir-fatura-itens-all"] });
      toast.success("Sessão adicionada com sucesso!");
    },
    onError: (err: any) => {
      toast.error("Erro ao adicionar sessão: " + err.message);
    },
  });

  // Update appointment status mutation
  const updateAppointmentStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: string;
    }) => {
      const { error } = await supabase
        .from("agendamentos")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dir-faturas"] });
      queryClient.invalidateQueries({ queryKey: ["dir-fatura-itens-all"] });
      queryClient.invalidateQueries({ queryKey: ["dir-linked-agendamentos"] });
      queryClient.invalidateQueries({ queryKey: ["dir-agendamentos-repasses"] });
    },
    onError: (err: any) => {
      toast.error("Erro ao atualizar status da sessão: " + err.message);
    },
  });

  // Fetch Expenses
  const { data: despesas = [], isLoading: loadingDespesas } = useQuery<any[]>({
    queryKey: ["dir-despesas", inicio, fim],
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

  // Calculations
  const stats = useMemo(() => {
    // Faturamento Recebido (Pagas)
    const faturamentoRecebido = (faturas || [])
      .filter((f) => f.status === "paga")
      .reduce((acc, f) => acc + Number(f.valor), 0);

    // Faturamento A Receber (Abertas)
    const faturamentoAReceber = (faturas || [])
      .filter((f) => f.status === "aberta")
      .reduce((acc, f) => acc + Number(f.valor), 0);

    // Faturamento Vencido (Vencidas)
    const faturamentoVencido = (faturas || [])
      .filter((f) => f.status === "vencida")
      .reduce((acc, f) => acc + Number(f.valor), 0);

    // Faturamento Pendente (Abertas/Vencidas)
    const faturamentoPendente = faturamentoAReceber + faturamentoVencido;

    // Faturamento Geral (Total Faturas)
    const faturamentoTotal = (faturas || [])
      .filter((f) => f.status !== "cancelada")
      .reduce((acc, f) => acc + Number(f.valor), 0);

    // Despesas
    const totalDespesas = despesas.reduce((acc, d) => acc + Number(d.valor), 0);

    // Balanços
    const balancoReal = faturamentoRecebido - totalDespesas;
    const balancoEstimado = faturamentoTotal - totalDespesas;

    return {
      faturamentoRecebido,
      faturamentoAReceber,
      faturamentoVencido,
      faturamentoPendente,
      faturamentoTotal,
      totalDespesas,
      balancoReal,
      balancoEstimado,
    };
  }, [faturas, despesas]);

  function brl(n: number) {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  const renderSessionDates = (fatura: any, allowDelete = false) => {
    let items = faturaItens.filter((item: any) => item.fatura_id === fatura.id);
    if (fatura.especialidade === "Apoio") {
      items = items.filter((item: any) => !item.agendamento_id);
    }
    if (items.length === 0) {
      if (fatura.especialidade) {
        let label = fatura.especialidade;
        if (fatura.especialidade === "Apoio") {
          const p = patientDetailsMap.get(fatura.paciente_id);
          const freq = p?.apoio_frequencia || 'avulso';
          const freqLabels: Record<string, string> = {
            avulso: "Pacote Apoio - Sessões Avulsas",
            "1x": "Pacote Apoio - 1x por semana",
            "2x": "Pacote Apoio - 2x por semana",
            "3x": "Pacote Apoio - 3x por semana",
            semana_toda: "Pacote Apoio - Semana Inteira",
          };
          label = freqLabels[freq] || "Pacote Apoio";
        }
        return (
          <span className="text-[10px] font-semibold text-foreground bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded whitespace-nowrap block w-max">
            {label} (Manual)
          </span>
        );
      }
      return <span className="text-muted-foreground italic">—</span>;
    }

    return (
      <div className="flex flex-col gap-1 max-h-[85px] overflow-y-auto pr-2 scrollbar-thin">
        {items.map((item: any, idx: number) => {
          if (!item.descricao) return null;
          let itemDesc = item.descricao;
          if (fatura.especialidade === "Apoio" && !item.descricao.startsWith("Pacote Apoio")) {
            const p = patientDetailsMap.get(fatura.paciente_id);
            const freq = p?.apoio_frequencia || 'avulso';
            const freqLabels: Record<string, string> = {
              avulso: "Pacote Apoio - Sessões Avulsas",
              "1x": "Pacote Apoio - 1x por semana",
              "2x": "Pacote Apoio - 2x por semana",
              "3x": "Pacote Apoio - 3x por semana",
              semana_toda: "Pacote Apoio - Semana Inteira",
            };
            itemDesc = freqLabels[freq] || "Pacote Apoio";
          }
          const valBrl = brl(Number(item.total || 0));
          return (
            <div
              key={item.id || idx}
              className="text-[10px] font-medium text-foreground bg-muted/65 px-1.5 py-0.5 rounded border border-border/50 whitespace-nowrap flex items-center gap-1.5 w-max hover:bg-muted transition duration-150"
            >
              <span>{itemDesc}: {valBrl}</span>
              {allowDelete && (
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer ml-1 bg-transparent border-0 p-0 leading-none flex items-center justify-center"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (confirm(`Tem certeza que deseja excluir a sessão "${item.descricao}" desta cobrança?`)) {
                      deleteFaturaItemMutation.mutate(item.id);
                    }
                  }}
                  title="Excluir esta sessão"
                >
                  <X className="h-3 w-3 shrink-0" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Fetch active professionals
  const { data: profissionais = [] } = useQuery<any[]>({
    queryKey: ["dir-profissionais"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profissionais")
        .select("id, nome, especialidade, cor, valor_sessao, valores_config")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data || [];
    },
  });

  const professionalMap = useMemo(() => {
    return new Map<string, string>((profissionais || []).map((p) => [p.id, p.nome]));
  }, [profissionais]);

  const getProfessionalsForFatura = (fatura: any) => {
    const set = new Set<string>();
    const prosSet = faturaProfessionalsMap.get(fatura.id);
    if (prosSet) {
      prosSet.forEach((p) => set.add(p));
    }
    if (fatura.profissional_id) {
      const name = professionalMap.get(fatura.profissional_id);
      if (name) set.add(name);
    }
    return Array.from(set);
  };

  // Fetch all agendamentos for professional payment calculation
  const { data: agendamentosRepasses = [], isLoading: loadingAgendamentos } = useQuery<any[]>({
    queryKey: ["dir-agendamentos-repasses", inicio, fim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select(
          `
          id,
          status,
          data_inicio,
          paciente_id,
          profissional_id,
          servico_id,
          observacoes,
          pacientes (
            id,
            nome,
            cids_secundarios
          ),
          profissionais (
            id,
            nome,
            especialidade,
            valor_sessao,
            valores_config
          ),
          servicos (
            id,
            nome
          )
        `,
        )
        .gte("data_inicio", `${inicio}T00:00:00`)
        .lte("data_inicio", `${fim}T23:59:59`);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all fatura_itens to link them to agendamentos in memory (avoids missing relation schema constraint join issue)
  const { data: faturaItens = [], isLoading: loadingFaturaItens } = useQuery<any[]>({
    queryKey: ["dir-fatura-itens", inicio, fim],
    queryFn: async () => {
      // First fetch faturas for this date range to get their IDs
      const { data: fList, error: fError } = await supabase
        .from("faturas")
        .select("id")
        .gte("competencia", inicio)
        .lte("competencia", fim);
      if (fError) throw fError;
      
      const fIds = (fList || []).map((f: any) => f.id);
      if (fIds.length === 0) return [];
      
      // Fetch in chunks of 100 to avoid URL length limit
      const chunkSize = 100;
      const chunks = [];
      for (let i = 0; i < fIds.length; i += chunkSize) {
        chunks.push(fIds.slice(i, i + chunkSize));
      }
      
      const promises = chunks.map(async (chunk) => {
        const { data, error } = await supabase
          .from("fatura_itens")
          .select(`
            id,
            fatura_id,
            total,
            valor_unitario,
            agendamento_id,
            descricao,
            faturas (
              id,
              status,
              pago_em,
              metodo,
              vencimento,
              profissional_id,
              especialidade,
              paciente_id,
              competencia,
              valor
            )
          `)
          .in("fatura_id", chunk);
        if (error) throw error;
        return data || [];
      });
      
      const results = await Promise.all(promises);
      return results.flat();
    },
  });

  const linkedAgendamentoIds = useMemo(() => {
    const ids = new Set<string>();
    (faturaItens || []).forEach((item: any) => {
      const comp = item.faturas?.competencia;
      if (comp && comp >= inicio && comp <= fim && item.agendamento_id) {
        ids.add(item.agendamento_id);
      }
    });
    return Array.from(ids);
  }, [faturaItens, inicio, fim]);

  const { data: linkedAgendamentos = [] } = useQuery<any[]>({
    queryKey: ["dir-linked-agendamentos", linkedAgendamentoIds],
    queryFn: async () => {
      if (linkedAgendamentoIds.length === 0) return [];
      
      // Chunk the IDs to avoid URL length limit (max ~100 IDs per request)
      const chunkSize = 100;
      const chunks = [];
      for (let i = 0; i < linkedAgendamentoIds.length; i += chunkSize) {
        chunks.push(linkedAgendamentoIds.slice(i, i + chunkSize));
      }
      
      const promises = chunks.map(async (chunk) => {
        const { data, error } = await supabase
          .from("agendamentos")
          .select("id, profissional_id, status, data_inicio")
          .in("id", chunk);
        if (error) throw error;
        return data || [];
      });
      
      const results = await Promise.all(promises);
      return results.flat();
    },
    enabled: linkedAgendamentoIds.length > 0,
  });

  const agendamentoProfIdMap = useMemo(() => {
    const map = new Map<string, string>();
    (linkedAgendamentos || []).forEach((ag: any) => {
      if (ag.id && ag.profissional_id) {
        map.set(ag.id, ag.profissional_id);
      }
    });
    return map;
  }, [linkedAgendamentos]);

  const agendamentoStatusMap = useMemo(() => {
    const map = new Map<string, string>();
    (linkedAgendamentos || []).forEach((ag: any) => {
      if (ag.id && ag.status) {
        map.set(ag.id, ag.status);
      }
    });
    return map;
  }, [linkedAgendamentos]);

  const agendamentoDateMap = useMemo(() => {
    const map = new Map<string, string>();
    (linkedAgendamentos || []).forEach((ag: any) => {
      if (ag.id && ag.data_inicio) {
        map.set(ag.id, ag.data_inicio);
      }
    });
    return map;
  }, [linkedAgendamentos]);

  const faturaItensMap = useMemo(() => {
    const map = new Map<string, any>();
    faturaItens.forEach((item: any) => {
      if (item.agendamento_id) {
        map.set(item.agendamento_id, item);
      }
    });
    return map;
  }, [faturaItens]);

  const agendamentoProfMap = useMemo(() => {
    const map = new Map<string, string>();
    (agendamentosRepasses || []).forEach((ag: any) => {
      if (ag.id && ag.profissionais?.nome) {
        map.set(ag.id, ag.profissionais.nome);
      }
    });
    return map;
  }, [agendamentosRepasses]);

  const faturaProfessionalsMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    
    (faturas || []).forEach((f: any) => {
      if (f.profissional_id) {
        const profName = professionalMap.get(f.profissional_id);
        if (profName) {
          const set = map.get(f.id) || new Set<string>();
          set.add(profName);
          map.set(f.id, set);
        }
      }
    });

    (faturaItens || []).forEach((item: any) => {
      const fatId = item.fatura_id || item.faturas?.id;
      if (!fatId) return;

      const profId = item.agendamento_id ? agendamentoProfIdMap.get(item.agendamento_id) : null;
      if (profId) {
        const profName = professionalMap.get(profId);
        if (profName) {
          const set = map.get(fatId) || new Set<string>();
          set.add(profName);
          map.set(fatId, set);
        }
      }
    });
    return map;
  }, [faturas, faturaItens, agendamentoProfIdMap, professionalMap]);

  const faturaProfIdsMap = useMemo(() => {
    const map = new Map<string, Set<string>>();

    (faturas || []).forEach((f: any) => {
      const set = map.get(f.id) || new Set<string>();
      if (f.profissional_id) {
        set.add(f.profissional_id);
      } else {
        // Fallback for faturas without a professional_id:
        // Use the patient's accompanying professional IDs
        const p = patientDetailsMap.get(f.paciente_id);
        const pProfs = p?.paciente_profissional || [];
        pProfs.forEach((pp: any) => {
          set.add(pp.profissional_id);
        });
      }
      if (set.size > 0) {
        map.set(f.id, set);
      }
    });

    (faturaItens || []).forEach((item: any) => {
      const fatId = item.fatura_id || item.faturas?.id;
      if (!fatId) return;

      const profId = item.agendamento_id ? agendamentoProfIdMap.get(item.agendamento_id) : null;
      if (profId) {
        const set = map.get(fatId) || new Set<string>();
        set.add(profId);
        map.set(fatId, set);
      }
    });
    return map;
  }, [faturas, faturaItens, agendamentoProfIdMap, patientDetailsMap]);

  // Helper to resolve specialty of an appointment
  const getAppointmentSpecialty = (a: any) => {
    if (a.servicos?.nome) return a.servicos.nome;
    const pacSpecs = (
      Array.isArray(a.pacientes?.cids_secundarios) ? a.pacientes.cids_secundarios : []
    ).filter((s: any): s is string => typeof s === "string");
    const profSpecs = a.profissionais?.especialidade
      ? a.profissionais.especialidade
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];
    const intersection = pacSpecs.filter((s: string) =>
      profSpecs.some((ps: string) => ps.toLowerCase() === s.toLowerCase()),
    );
    if (intersection.length > 0) return intersection[0];
    if (profSpecs.length > 0) return profSpecs[0];
    return "Geral";
  };

  // Helper to get session value
  const getAppointmentValue = (a: any) => {
    const fatItem = faturaItensMap.get(a.id);
    if (fatItem) {
      return Number(fatItem.total || 0);
    }

    // Fallback logic equivalent to fn_get_pricing
    const prof = a.profissionais;
    if (!prof) return 0;

    const spec = getAppointmentSpecialty(a);
    const isAnamnese = a.observacoes?.includes("[Tipo: Anamnese]");

    const config = prof.valores_config || { especialidades: [], descontos: [] };
    const valorDefault = Number(prof.valor_sessao || 0);

    // 1. Check custom patient discount
    if (Array.isArray(config.descontos) && config.descontos.length > 0) {
      const d = config.descontos.find(
        (item: any) =>
          item.paciente_id === a.paciente_id &&
          String(item.especialidade || "").toLowerCase() === String(spec || "").toLowerCase(),
      );
      if (d) {
        return isAnamnese ? Number(d.valor_avaliacao || 0) : Number(d.valor_sessao || 0);
      }
    }

    // 2. Check standard specialty rates
    if (Array.isArray(config.especialidades) && config.especialidades.length > 0) {
      const e = config.especialidades.find(
        (item: any) => String(item.nome || "").toLowerCase() === String(spec || "").toLowerCase(),
      );
      if (e) {
        if (isAnamnese) {
          return Number(e.valor_avaliacao || 0);
        } else {
          if (String(spec).toLowerCase() === "ap") return 0;
          return Number(e.valor_sessao ?? valorDefault ?? 0);
        }
      }
    }

    // 3. Default professional rate
    if (isAnamnese) {
      return 0;
    } else {
      return valorDefault;
    }
  };

  const getRepasseRates = (specialty: string) => {
    const isAtAba =
      String(specialty || "")
        .trim()
        .toUpperCase() === "AT ABA";
    if (isAtAba) {
      return { profPct: 0.5, clinicPct: 0.5, label: "50% / 50%" };
    }
    return { profPct: 0.7, clinicPct: 0.3, label: "70% / 30%" };
  };

  const isCoordenadora = (profId: string | null) => {
    if (!profId) return false;
    const prof = (profissionais || []).find((p: any) => p.id === profId);
    if (!prof?.especialidade) return false;
    return prof.especialidade
      .split(",")
      .map((s: string) => s.trim().toLowerCase())
      .includes("coordenadora ap");
  };

  // State variables for payment calculation tab
  const [selectedProfId, setSelectedProfId] = useState<string>("all");
  const [sessionStatusFilter, setSessionStatusFilter] = useState<string>("realizado_pago_falta");
  const [viewingProfDetail, setViewingProfDetail] = useState<string | null>(null);

  const handleSelectProf = (val: string) => {
    setSelectedProfId(val);
    if (val === "all") {
      setViewingProfDetail(null);
    } else {
      setViewingProfDetail(val);
    }
  };

  const filteredRepasses = useMemo(() => {
    return agendamentosRepasses.filter((a: any) => {
      if (a.status === "cancelado") return false;

      const matchesProf = selectedProfId === "all" || a.profissional_id === selectedProfId;

      let matchesStatus = true;
      if (sessionStatusFilter === "realizado_pago_falta") {
        matchesStatus = a.status === "realizado" || a.status === "pago" || a.status === "falta";
      } else if (sessionStatusFilter === "confirmado") {
        matchesStatus = a.status === "confirmado";
      } else if (sessionStatusFilter === "pago") {
        matchesStatus = a.status === "pago";
      } else if (sessionStatusFilter === "realizado") {
        matchesStatus = a.status === "realizado";
      }

      return matchesProf && matchesStatus;
    });
  }, [agendamentosRepasses, selectedProfId, sessionStatusFilter]);

  const getPatientPaymentStatus = (a: any) => {
    const fatItem = faturaItensMap.get(a.id);
    if (a.status === "pago" || fatItem?.faturas?.status === "paga") {
      return "paga";
    }
    const fat = fatItem?.faturas;
    if (!fat) {
      return "nao_faturado";
    }
    if (fat.status === "aberta" && fat.vencimento) {
      const today = startOfDay(new Date());
      const dueDate = startOfDay(new Date(fat.vencimento + "T12:00:00"));
      const diff = differenceInDays(today, dueDate);
      if (diff > 0) return "vencida";
    }
    return fat.status; // aberta, vencida, cancelada
  };

  const professionalPatients = useMemo(() => {
    if (!viewingProfDetail || viewingProfDetail === "all") return [];

    const map = new Map<
      string,
      {
        pacienteId: string;
        nome: string;
        totalSessões: number;
        faturamentoBruto: number;
        repasseProfissional: number;
        repasseApto: number;
        repasseBloqueado: number;
      }
    >();

    filteredRepasses.forEach((a: any) => {
      if (a.profissional_id !== viewingProfDetail) return;

      const pId = a.paciente_id;
      if (!pId) return;
      const pNome = a.pacientes?.nome || "Paciente Desconhecido";
      const val = getAppointmentValue(a);
      const spec = getAppointmentSpecialty(a);
      const { profPct } = getRepasseRates(spec);
      const repVal = val * profPct;

      const isClientePago = getPatientPaymentStatus(a) === "paga";

      let entry = map.get(pId);
      if (!entry) {
        entry = {
          pacienteId: pId,
          nome: pNome,
          totalSessões: 0,
          faturamentoBruto: 0,
          repasseProfissional: 0,
          repasseApto: 0,
          repasseBloqueado: 0,
        };
        map.set(pId, entry);
      }

      entry.totalSessões += 1;
      entry.faturamentoBruto += val;
      entry.repasseProfissional += repVal;
      if (isClientePago) {
        entry.repasseApto += repVal;
      } else {
        entry.repasseBloqueado += repVal;
      }
    });

    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [filteredRepasses, viewingProfDetail]);

  const repasseStats = useMemo(() => {
    let totalSessões = 0;
    let faturamentoBruto = 0;
    let repasseProfissional = 0;
    let comissaoClinica = 0;
    let repasseApto = 0;
    let repasseBloqueado = 0;
    let comissaoRecebida = 0;
    let comissaoPendente = 0;

    filteredRepasses.forEach((a: any) => {
      const val = getAppointmentValue(a);
      const spec = getAppointmentSpecialty(a);
      const { profPct, clinicPct } = getRepasseRates(spec);

      totalSessões += 1;
      faturamentoBruto += val;
      repasseProfissional += val * profPct;
      comissaoClinica += val * clinicPct;

      const isClientePago = getPatientPaymentStatus(a) === "paga";

      if (isClientePago) {
        repasseApto += val * profPct;
        comissaoRecebida += val * clinicPct;
      } else {
        repasseBloqueado += val * profPct;
        comissaoPendente += val * clinicPct;
      }
    });

    // Add Coordinator Bonus
    if (selectedProfId === "all") {
      const activeCoordinators = new Set<string>();
      filteredRepasses.forEach((a: any) => {
        if (a.profissional_id && isCoordenadora(a.profissional_id)) {
          activeCoordinators.add(a.profissional_id);
        }
      });

      activeCoordinators.forEach((profId) => {
        repasseProfissional += 300;
        const coordinatorSessions = filteredRepasses.filter((a: any) => a.profissional_id === profId);
        const allPaid = coordinatorSessions.every((a: any) => getPatientPaymentStatus(a) === "paga");
        if (allPaid) {
          repasseApto += 300;
        } else {
          repasseBloqueado += 300;
        }
      });
    } else if (isCoordenadora(selectedProfId)) {
      if (filteredRepasses.length > 0) {
        repasseProfissional += 300;
        const allPaid = filteredRepasses.every((a: any) => getPatientPaymentStatus(a) === "paga");
        if (allPaid) {
          repasseApto += 300;
        } else {
          repasseBloqueado += 300;
        }
      }
    }

    return {
      totalSessões,
      faturamentoBruto,
      repasseProfissional,
      comissaoClinica,
      repasseApto,
      repasseBloqueado,
      comissaoRecebida,
      comissaoPendente,
    };
  }, [filteredRepasses, selectedProfId, profissionais]);

  const repasseCardsStats = useMemo(() => {
    let totalSessões = 0;
    let repassePago = 0;
    let repassePendente = 0;

    agendamentosRepasses.forEach((a: any) => {
      if (a.status === "cancelado") return;

      const matchesProf = selectedProfId === "all" || a.profissional_id === selectedProfId;
      if (!matchesProf) return;

      const val = getAppointmentValue(a);
      const spec = getAppointmentSpecialty(a);
      const { profPct } = getRepasseRates(spec);

      totalSessões += 1;

      if (a.status === "pago") {
        repassePago += val * profPct;
      } else if (a.status === "realizado" || a.status === "falta") {
        repassePendente += val * profPct;
      }
    });

    // Add Coordinator Bonus
    if (selectedProfId === "all") {
      const activeCoordinators = new Set<string>();
      agendamentosRepasses.forEach((a: any) => {
        if (a.status !== "cancelado" && a.profissional_id && isCoordenadora(a.profissional_id)) {
          activeCoordinators.add(a.profissional_id);
        }
      });

      activeCoordinators.forEach((profId) => {
        const coordinatorSessions = agendamentosRepasses.filter(
          (a: any) => a.status !== "cancelado" && a.profissional_id === profId
        );
        const allPaid = coordinatorSessions.every((a: any) => getPatientPaymentStatus(a) === "paga");
        if (allPaid) {
          repassePago += 300;
        } else {
          repassePendente += 300;
        }
      });
    } else if (isCoordenadora(selectedProfId)) {
      const hasSessions = agendamentosRepasses.some((a: any) => a.status !== "cancelado" && a.profissional_id === selectedProfId);
      if (hasSessions) {
        const coordinatorSessions = agendamentosRepasses.filter(
          (a: any) => a.status !== "cancelado" && a.profissional_id === selectedProfId
        );
        const allPaid = coordinatorSessions.every((a: any) => getPatientPaymentStatus(a) === "paga");
        if (allPaid) {
          repassePago += 300;
        } else {
          repassePendente += 300;
        }
      }
    }

    return {
      totalSessões,
      repassePago,
      repassePendente,
    };
  }, [agendamentosRepasses, selectedProfId, profissionais]);

  const caixaLiquidoReal =
    stats.faturamentoRecebido - repasseStats.repasseApto - stats.totalDespesas;
  const caixaLiquidoPrevisto =
    stats.faturamentoTotal - repasseStats.repasseProfissional - stats.totalDespesas;

  const consolidatedRepasses = useMemo(() => {
    const groups = new Map<
      string,
      {
        profissionalId: string;
        nome: string;
        cor: string;
        especialidades: Set<string>;
        totalSessões: number;
        faturamentoBruto: number;
        repasseProfissional: number;
        comissaoClinica: number;
        repasseApto: number;
        repasseBloqueado: number;
        comissaoRecebida: number;
        comissaoPendente: number;
        sessoes: any[];
      }
    >();

    filteredRepasses.forEach((a: any) => {
      const profId = a.profissional_id;
      if (!profId) return;

      const profName = a.profissionais?.nome || "Desconhecido";
      const profCor = a.profissionais?.cor || "#000000";
      const spec = getAppointmentSpecialty(a);
      const val = getAppointmentValue(a);
      const { profPct, clinicPct } = getRepasseRates(spec);

      let group = groups.get(profId);
      if (!group) {
        group = {
          profissionalId: profId,
          nome: profName,
          cor: profCor,
          especialidades: new Set<string>(),
          totalSessões: 0,
          faturamentoBruto: 0,
          repasseProfissional: 0,
          comissaoClinica: 0,
          repasseApto: 0,
          repasseBloqueado: 0,
          comissaoRecebida: 0,
          comissaoPendente: 0,
          sessoes: [],
        };
        groups.set(profId, group);
      }

      group.especialidades.add(spec);
      group.totalSessões += 1;
      group.faturamentoBruto += val;
      group.repasseProfissional += val * profPct;
      group.comissaoClinica += val * clinicPct;

      const isClientePago = getPatientPaymentStatus(a) === "paga";

      if (isClientePago) {
        group.repasseApto += val * profPct;
        group.comissaoRecebida += val * clinicPct;
      } else {
        group.repasseBloqueado += val * profPct;
        group.comissaoPendente += val * clinicPct;
      }

      group.sessoes.push(a);
    });

    // Add Coordinator Bonus
    groups.forEach((group, profId) => {
      if (isCoordenadora(profId)) {
        group.repasseProfissional += 300;
        const allPaid = group.sessoes.every((a: any) => getPatientPaymentStatus(a) === "paga");
        if (allPaid) {
          group.repasseApto += 300;
        } else {
          group.repasseBloqueado += 300;
        }
      }
    });

    return Array.from(groups.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [filteredRepasses, profissionais]);

  // Billing Filters
  const [searchPatient, setSearchPatient] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [profFilter, setProfFilter] = useState("all");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<"all" | "mensal" | "sessao">("all");
  const [subTab, setSubTab] = useState<"consolidado" | "historico">("consolidado");

  // Patient Faturas Modal state
  const [patientFaturasDialog, setPatientFaturasDialog] = useState<{
    open: boolean;
    pacienteId: string;
    pacienteNome: string;
  }>({ open: false, pacienteId: "", pacienteNome: "" });

  const handleOpenPatientFaturas = (pacienteId: string, pacienteNome: string) => {
    setPatientFaturasDialog({ open: true, pacienteId, pacienteNome });
  };

  const getApoioFaturaValor = (fatura: any) => {
    const p = patientDetailsMap.get(fatura.paciente_id);
    if (!p) return Number(fatura.valor) || 0;
    
    const freq = p.apoio_frequencia || 'avulso';
    const customVal = p.apoio_valor_personalizado;
    
    if (freq === 'avulso') {
      const sessionsCount = (faturaItens || []).filter(
        (item: any) => item.fatura_id === fatura.id && item.agendamento_id
      ).length;
      const rate = (customVal !== null && customVal !== undefined && String(customVal) !== "") 
        ? Number(customVal) 
        : 50.00;
      return sessionsCount > 0 ? (sessionsCount * rate) : rate;
    } else {
      if (customVal !== null && customVal !== undefined && String(customVal) !== "") {
        return Number(customVal);
      }
      const defaultRates: Record<string, number> = {
        "1x": 120.00,
        "2x": 240.00,
        "3x": 360.00,
        semana_toda: 450.00
      };
      return defaultRates[freq] ?? 120.00;
    }
  };

  // Memoized consolidated billing by patient
  const consolidatedPatients = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        pacienteId: string;
        billingType: "mensal" | "sessao";
        nome: string;
        faturasPendentesCount: number;
        totalPendente: number;
        totalPago: number;
        totalGeral: number;
        temAtraso: boolean;
        faturas: any[];
      }
    >();

    for (const f of faturas || []) {
      if (profFilter !== "all") {
        const profIds = faturaProfIdsMap.get(f.id);
        if (!profIds || !profIds.has(profFilter)) continue;
      }

      const pId = f.paciente_id;
      if (!pId) continue;
      const patientName = patientMap.get(pId) || "Paciente Desconhecido";
      const pDetails = patientDetailsMap.get(pId);
      
      const billingType = f.especialidade === "Apoio" 
        ? "mensal" 
        : (pDetails && pDetails.valor_mensal && pDetails.valor_mensal > 0 ? "mensal" : "sessao");

      const key = `${pId}-${billingType}`;

      let entry = map.get(key);
      if (!entry) {
        entry = {
          key,
          pacienteId: pId,
          billingType,
          nome: patientName,
          faturasPendentesCount: 0,
          totalPendente: 0,
          totalPago: 0,
          totalGeral: 0,
          temAtraso: false,
          faturas: [],
        };
        map.set(key, entry);
      }

      entry.faturas.push(f);
      const val = f.especialidade === "Apoio" ? getApoioFaturaValor(f) : (Number(f.valor) || 0);

      if (f.status === "paga") {
        entry.totalPago += val;
      } else if (f.status === "aberta" || f.status === "vencida") {
        entry.totalPendente += val;
        entry.faturasPendentesCount += 1;

        // Calculate delay days
        if (f.vencimento) {
          const today = startOfDay(new Date());
          const dueDate = startOfDay(new Date(f.vencimento + "T12:00:00"));
          const diff = differenceInDays(today, dueDate);
          if (diff > 0 || f.status === "vencida") {
            entry.temAtraso = true;
          }
        }
      }

      if (f.status !== "cancelada") {
        entry.totalGeral += val;
      }
    }

    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [faturas, patientMap, profFilter, faturaProfIdsMap, patientDetailsMap, faturaItens]);

  const filteredConsolidated = useMemo(() => {
    return consolidatedPatients.filter((c) => {
      const matchesSearch = normalizeString(c.nome).includes(normalizeString(searchPatient));
      if (statusFilter === "aberta" && c.totalPendente === 0) return false;
      if (statusFilter === "paga" && c.totalPago === 0) return false;
      if (statusFilter === "vencida" && !c.temAtraso) return false;
      return matchesSearch;
    });
  }, [consolidatedPatients, searchPatient, statusFilter]);

  const patientFaturas = useMemo(() => {
    if (!patientFaturasDialog.pacienteId) return [];
    return (faturas || [])
      .filter((f) => {
        const matchesPatient = f.paciente_id === patientFaturasDialog.pacienteId;
        let matchesProf = true;
        if (profFilter !== "all") {
          const profIds = faturaProfIdsMap.get(f.id);
          matchesProf = profIds ? profIds.has(profFilter) : false;
        }
        return matchesPatient && matchesProf;
      })
      .sort((a, b) => new Date(b.competencia).getTime() - new Date(a.competencia).getTime());
  }, [faturas, patientFaturasDialog.pacienteId, profFilter, faturaProfIdsMap]);

  const patientDetailedRows = useMemo(() => {
    const rows: any[] = [];
    (patientFaturas || []).forEach((f) => {
      let items = (faturaItens || []).filter((item: any) => item.fatura_id === f.id);
      if (f.especialidade === "Apoio") {
        items = items.filter((item: any) => !item.agendamento_id);
      }
      if (items.length === 0) {
        // Manual fatura or fatura with no items
        const rowProfId = f.profissional_id;
        if (profFilter !== "all" && rowProfId !== profFilter) return;

        let rowDesc = f.observacoes || (f.especialidade ? `${f.especialidade} (Manual)` : "Cobrança Manual");
        if (f.especialidade === "Apoio") {
          const p = patientDetailsMap.get(f.paciente_id);
          const freq = p?.apoio_frequencia || 'avulso';
          const freqLabels: Record<string, string> = {
            avulso: "Pacote Apoio - Sessões Avulsas",
            "1x": "Pacote Apoio - 1x por semana",
            "2x": "Pacote Apoio - 2x por semana",
            "3x": "Pacote Apoio - 3x por semana",
            semana_toda: "Pacote Apoio - Semana Inteira",
          };
          rowDesc = freqLabels[freq] || "Pacote Apoio";
        }

        let profNome = f.profissional_id ? (professionalMap.get(f.profissional_id) || "—") : "—";
        if (f.especialidade === "Apoio" && profNome === "—") {
          const fatProfs = faturaProfIdsMap.get(f.id);
          if (fatProfs && fatProfs.size > 0) {
            profNome = Array.from(fatProfs)
              .map((pId: string) => professionalMap.get(pId))
              .filter(Boolean)
              .join(", ") || "—";
          } else {
            const p = patientDetailsMap.get(f.paciente_id);
            const pProfs = p?.paciente_profissional || [];
            profNome = pProfs
              .map((pp: any) => professionalMap.get(pp.profissional_id))
              .filter(Boolean)
              .join(", ") || "—";
          }
        }

        rows.push({
          id: `fatura-${f.id}`,
          faturaId: f.id,
          paciente_id: f.paciente_id,
          competencia: f.competencia,
          vencimento: f.vencimento,
          pago_em: f.pago_em,
          status: f.status,
          metodo: f.metodo,
          valor: f.especialidade === "Apoio" ? getApoioFaturaValor(f) : (Number(f.valor) || 0),
          descricao: rowDesc,
          profissionalNome: profNome,
          especialidade: f.especialidade || null,
          fatura: f,
          isFaturaOnly: true,
        });
      } else {
        // Session items
        items.forEach((item: any) => {
          const isApoioMatch = f.especialidade === "Apoio" && profFilter !== "all" && faturaProfIdsMap.get(f.id)?.has(profFilter);
          const rowProfId = isApoioMatch 
            ? profFilter 
            : (item.agendamento_id ? agendamentoProfIdMap.get(item.agendamento_id) : f.profissional_id);
          if (profFilter !== "all" && rowProfId !== profFilter) return;
 
          const profName = isApoioMatch 
            ? (professionalMap.get(profFilter) || "—") 
            : (item.agendamento_id ? (agendamentoProfIdMap.get(item.agendamento_id) ? professionalMap.get(agendamentoProfIdMap.get(item.agendamento_id)!) : null) : null);
          let finalProfName = profName || (f.profissional_id ? (professionalMap.get(f.profissional_id) || "—") : "—");
          if (f.especialidade === "Apoio" && finalProfName === "—") {
            const fatProfs = faturaProfIdsMap.get(f.id);
            if (fatProfs && fatProfs.size > 0) {
              finalProfName = Array.from(fatProfs)
                .map((pId: string) => professionalMap.get(pId))
                .filter(Boolean)
                .join(", ") || "—";
            } else {
              const p = patientDetailsMap.get(f.paciente_id);
              const pProfs = p?.paciente_profissional || [];
              finalProfName = pProfs
                .map((pp: any) => professionalMap.get(pp.profissional_id))
                .filter(Boolean)
                .join(", ") || "—";
            }
          }

          let rowDesc = item.descricao || "Sessão";
          if (f.especialidade === "Apoio") {
            if (item.descricao && item.descricao.startsWith("Pacote Apoio")) {
              rowDesc = item.descricao;
            } else {
              const p = patientDetailsMap.get(f.paciente_id);
              const freq = p?.apoio_frequencia || 'avulso';
              const freqLabels: Record<string, string> = {
                avulso: "Pacote Apoio - Sessões Avulsas",
                "1x": "Pacote Apoio - 1x por semana",
                "2x": "Pacote Apoio - 2x por semana",
                "3x": "Pacote Apoio - 3x por semana",
                semana_toda: "Pacote Apoio - Semana Inteira",
              };
              rowDesc = freqLabels[freq] || "Pacote Apoio";
            }
          }
          
          rows.push({
            id: `item-${item.id}`,
            faturaId: f.id,
            paciente_id: f.paciente_id,
            competencia: f.competencia,
            vencimento: f.vencimento,
            pago_em: f.pago_em,
            status: f.status,
            metodo: f.metodo,
            valor: f.especialidade === "Apoio" ? getApoioFaturaValor(f) : (Number(item.total || 0)),
            descricao: rowDesc,
            profissionalNome: finalProfName,
            especialidade: f.especialidade || null,
            fatura: f,
            item: item,
            isFaturaOnly: false,
          });
        });
      }
    });

    // Sort by session date/time ascending, falling back to competence/vencimento
    return rows.sort((a, b) => {
      const timeA = a.item?.agendamento_id ? (agendamentoDateMap.get(a.item.agendamento_id) ? new Date(agendamentoDateMap.get(a.item.agendamento_id)!).getTime() : null) : null;
      const timeB = b.item?.agendamento_id ? (agendamentoDateMap.get(b.item.agendamento_id) ? new Date(agendamentoDateMap.get(b.item.agendamento_id)!).getTime() : null) : null;

      const dateA = timeA || (a.competencia ? new Date(a.competencia).getTime() : 0);
      const dateB = timeB || (b.competencia ? new Date(b.competencia).getTime() : 0);

      return dateA - dateB;
    });
  }, [patientFaturas, faturaItens, professionalMap, agendamentoProfMap, agendamentoProfIdMap, agendamentoStatusMap, agendamentoDateMap, profFilter, patientDetailsMap, faturaProfIdsMap]);

  const handlePrintAllBilling = () => {
    if (filteredConsolidated.length === 0) {
      toast.error("Nenhuma cobrança encontrada nos filtros selecionados para imprimir.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Por favor, permita pop-ups para imprimir.");
      return;
    }

    const brl = (val: number) =>
      val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    const getRowDateStr = (row: any) => {
      const rawDate = row.item?.agendamento_id ? agendamentoDateMap.get(row.item.agendamento_id) : null;
      if (rawDate) {
        return format(new Date(rawDate), "dd/MM/yyyy HH:mm");
      }
      if (row.competencia) {
        return format(new Date(row.competencia + "T12:00:00"), "MM/yyyy");
      }
      return "—";
    };

    const patientBlocksHtml = filteredConsolidated.map((c: any) => {
      const pFats = c.faturas.filter((f: any) => {
        let matchesProf = true;
        if (profFilter !== "all") {
          const profIds = faturaProfIdsMap.get(f.id);
          matchesProf = profIds ? profIds.has(profFilter) : false;
        }
        return matchesProf;
      });

      const rows: any[] = [];
      pFats.forEach((f: any) => {
        let items = (faturaItens || []).filter((item: any) => item.fatura_id === f.id);
        if (f.especialidade === "Apoio") {
          items = items.filter((item: any) => !item.agendamento_id);
        }
        if (items.length === 0) {
          const rowProfId = f.profissional_id;
          if (profFilter !== "all" && rowProfId !== profFilter) return;

          let rowDesc = f.observacoes || (f.especialidade ? `${f.especialidade} (Manual)` : "Cobrança Manual");
          if (f.especialidade === "Apoio") {
            const p = patientDetailsMap.get(f.paciente_id);
            const freq = p?.apoio_frequencia || 'avulso';
            const freqLabels: Record<string, string> = {
              avulso: "Pacote Apoio - Sessões Avulsas",
              "1x": "Pacote Apoio - 1x por semana",
              "2x": "Pacote Apoio - 2x por semana",
              "3x": "Pacote Apoio - 3x por semana",
              semana_toda: "Pacote Apoio - Semana Inteira",
            };
            rowDesc = freqLabels[freq] || "Pacote Apoio";
          }

          let profNome = f.profissional_id ? (professionalMap.get(f.profissional_id) || "—") : "—";
          if (f.especialidade === "Apoio" && profNome === "—") {
            const fatProfs = faturaProfIdsMap.get(f.id);
            if (fatProfs && fatProfs.size > 0) {
              profNome = Array.from(fatProfs)
                .map((pId: string) => professionalMap.get(pId))
                .filter(Boolean)
                .join(", ") || "—";
            } else {
              const p = patientDetailsMap.get(f.paciente_id);
              const pProfs = p?.paciente_profissional || [];
              profNome = pProfs
                .map((pp: any) => professionalMap.get(pp.profissional_id))
                .filter(Boolean)
                .join(", ") || "—";
            }
          }

          rows.push({
            id: `fatura-${f.id}`,
            faturaId: f.id,
            paciente_id: f.paciente_id,
            competencia: f.competencia,
            vencimento: f.vencimento,
            pago_em: f.pago_em,
            status: f.status,
            metodo: f.metodo,
            valor: f.especialidade === "Apoio" ? getApoioFaturaValor(f) : (Number(f.valor) || 0),
            descricao: rowDesc,
            profissionalNome: profNome,
            especialidade: f.especialidade || null,
            fatura: f,
            isFaturaOnly: true,
          });
        } else {
          items.forEach((item: any) => {
            const isApoioMatch = f.especialidade === "Apoio" && profFilter !== "all" && faturaProfIdsMap.get(f.id)?.has(profFilter);
            const rowProfId = isApoioMatch 
              ? profFilter 
              : (item.agendamento_id ? agendamentoProfIdMap.get(item.agendamento_id) : f.profissional_id);
            if (profFilter !== "all" && rowProfId !== profFilter) return;

            const profName = isApoioMatch 
              ? (professionalMap.get(profFilter) || "—") 
              : (item.agendamento_id ? (agendamentoProfIdMap.get(item.agendamento_id) ? professionalMap.get(agendamentoProfIdMap.get(item.agendamento_id)!) : null) : null);
            let finalProfName = profName || (f.profissional_id ? (professionalMap.get(f.profissional_id) || "—") : "—");
            if (f.especialidade === "Apoio" && finalProfName === "—") {
              const fatProfs = faturaProfIdsMap.get(f.id);
              if (fatProfs && fatProfs.size > 0) {
                finalProfName = Array.from(fatProfs)
                  .map((pId: string) => professionalMap.get(pId))
                  .filter(Boolean)
                  .join(", ") || "—";
              } else {
                const p = patientDetailsMap.get(f.paciente_id);
                const pProfs = p?.paciente_profissional || [];
                finalProfName = pProfs
                  .map((pp: any) => professionalMap.get(pp.profissional_id))
                  .filter(Boolean)
                  .join(", ") || "—";
              }
            }

            let rowDesc = item.descricao || "Sessão";
            if (f.especialidade === "Apoio") {
              if (item.descricao && item.descricao.startsWith("Pacote Apoio")) {
                rowDesc = item.descricao;
              } else {
                const p = patientDetailsMap.get(f.paciente_id);
                const freq = p?.apoio_frequencia || 'avulso';
                const freqLabels: Record<string, string> = {
                  avulso: "Pacote Apoio - Sessões Avulsas",
                  "1x": "Pacote Apoio - 1x por semana",
                  "2x": "Pacote Apoio - 2x por semana",
                  "3x": "Pacote Apoio - 3x por semana",
                  semana_toda: "Pacote Apoio - Semana Inteira",
                };
                rowDesc = freqLabels[freq] || "Pacote Apoio";
              }
            }

            rows.push({
              id: `item-${item.id}`,
              faturaId: f.id,
              paciente_id: f.paciente_id,
              competencia: f.competencia,
              vencimento: f.vencimento,
              pago_em: f.pago_em,
              status: f.status,
              metodo: f.metodo,
              valor: f.especialidade === "Apoio" ? getApoioFaturaValor(f) : (Number(item.total || 0)),
              descricao: rowDesc,
              profissionalNome: finalProfName,
              especialidade: f.especialidade || null,
              fatura: f,
              item: item,
              isFaturaOnly: false,
            });
          });
        }
      });

      rows.sort((a, b) => {
        const timeA = a.item?.agendamento_id ? (agendamentoDateMap.get(a.item.agendamento_id) ? new Date(agendamentoDateMap.get(a.item.agendamento_id)!).getTime() : null) : null;
        const timeB = b.item?.agendamento_id ? (agendamentoDateMap.get(b.item.agendamento_id) ? new Date(agendamentoDateMap.get(b.item.agendamento_id)!).getTime() : null) : null;

        const dateA = timeA || (a.competencia ? new Date(a.competencia).getTime() : 0);
        const dateB = timeB || (b.competencia ? new Date(b.competencia).getTime() : 0);

        return dateA - dateB;
      });

      const profGroups = new Map<string, any[]>();
      rows.forEach((row) => {
        const list = profGroups.get(row.profissionalNome) || [];
        list.push(row);
        profGroups.set(row.profissionalNome, list);
      });

      const profSectionsHtml = Array.from(profGroups.entries()).map(([profName, groupRows]) => {
        const groupTotal = groupRows.reduce((acc, r) => acc + r.valor, 0);
        const groupRowsHtml = groupRows.map((row) => {
          let statusStyle = "color: #e11d48; font-weight: bold;";
          if (row.status === "paga") statusStyle = "color: #059669; font-weight: bold;";
          else if (row.status === "aberta") statusStyle = "color: #d97706; font-weight: bold;";
          
          return `
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-family: monospace;">${getRowDateStr(row)}</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px;">${row.descricao}</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; text-transform: capitalize; ${statusStyle}">${row.status}</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: right; font-weight: bold;">${brl(row.valor)}</td>
            </tr>
          `;
        }).join("");

        return `
          <div style="margin-top: 15px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; page-break-inside: avoid;">
            <div style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 8px 12px; font-weight: bold; color: #1e293b; display: flex; justify-content: space-between;">
              <span>👤 Profissional: ${profName}</span>
              <span style="color: #4f46e5;">Subtotal: ${brl(groupTotal)}</span>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <thead>
                <tr style="background-color: #ffffff; border-bottom: 1px solid #cbd5e1; color: #475569; font-weight: bold;">
                  <th style="padding: 6px; text-align: left; width: 130px;">Data/Período</th>
                  <th style="padding: 6px; text-align: left;">Descrição da Sessão/Fatura</th>
                  <th style="padding: 6px; text-align: left; width: 80px;">Status</th>
                  <th style="padding: 6px; text-align: right; width: 90px;">Valor</th>
                </tr>
              </thead>
              <tbody>
                ${groupRowsHtml}
              </tbody>
            </table>
          </div>
        `;
      }).join("");

      return `
        <div style="margin-bottom: 40px; border-bottom: 2px dashed #cbd5e1; padding-bottom: 25px; page-break-after: auto;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h2 style="margin: 0; font-size: 16px; color: #1e293b; font-weight: bold;">${c.nome}</h2>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
                Tipo de Faturamento: <span style="font-weight: bold; text-transform: uppercase;">${c.billingType}</span>
              </div>
            </div>
          </div>
          
          ${rows.length === 0 ? `
            <div style="padding: 15px; border: 1px dashed #cbd5e1; border-radius: 6px; text-align: center; font-size: 12px; color: #64748b; margin-top: 15px;">
              Nenhum item ou sessão de cobrança encontrado para os filtros ativos.
            </div>
          ` : profSectionsHtml}
        </div>
      `;
    }).join("");

    const statusLabel = statusFilter === "all" ? "Todos os Status" : statusFilter;
    const profLabel = profFilter === "all" ? "Todos os Profissionais" : (professionalMap.get(profFilter) || profFilter);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório Geral da Central de Cobrança</title>
        <style>
          body { font-family: sans-serif; margin: 30px; color: #1e293b; }
          h1 { font-size: 20px; font-weight: bold; color: #4f46e5; margin: 0; }
          .header-title { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #cbd5e1; padding-bottom: 12px; }
          .filter-summary { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 15px; margin-top: 15px; margin-bottom: 25px; font-size: 11px; display: grid; grid-template-cols: 1fr 1fr 1fr; gap: 10px; }
          .filter-item span { font-weight: bold; color: #64748b; text-transform: uppercase; font-size: 9px; display: block; }
          .filter-item div { font-size: 11px; font-weight: 600; margin-top: 2px; }
          @media print {
            body { margin: 15px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header-title">
          <div>
            <h1>Relatório Geral da Central de Cobrança</h1>
            <div style="font-size: 11px; color: #64748b; margin-top: 3px;">Espaço Multi — Gestão Financeira Consolidada</div>
          </div>
          <button onclick="window.print()" style="padding: 8px 16px; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Imprimir Relatório / Salvar como PDF</button>
        </div>
        
        <div class="filter-summary">
          <div class="filter-item"><span>Período Selecionado</span><div>${inicio.split('-').reverse().join('/')} a ${fim.split('-').reverse().join('/')}</div></div>
          <div class="filter-item"><span>Filtro de Status</span><div>${statusLabel}</div></div>
          <div class="filter-item"><span>Filtro de Profissional</span><div>${profLabel}</div></div>
        </div>

        ${patientBlocksHtml}
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleWhatsAppClick = (pacienteId: string, totalPendente: number, patientName: string) => {
    const resps = responsaveisMap.get(pacienteId) || [];
    const primaryResp = resps.find((r) => r.whatsapp) || resps.find((r) => r.telefone) || resps[0];
    if (!primaryResp) {
      toast.error("Nenhum responsável com telefone cadastrado para este paciente.");
      return;
    }
    const num = primaryResp.whatsapp || primaryResp.telefone;
    if (!num) {
      toast.error("Responsável sem telefone ou WhatsApp cadastrado.");
      return;
    }
    const cleanNum = String(num).replace(/\D/g, "");
    if (!cleanNum) {
      toast.error("Número de telefone inválido.");
      return;
    }
    let phoneWithCountry = cleanNum;
    if (cleanNum.length === 10 || cleanNum.length === 11) {
      phoneWithCountry = "55" + cleanNum;
    }

    const textMsg = `Olá, ${primaryResp.nome}!
Gostaríamos de lembrar que constam pendências financeiras em aberto referentes aos atendimentos de *${patientName}* no valor total de *${brl(totalPendente)}*.

Poderia, por gentileza, realizar a confirmação do pagamento?
Caso já tenha pago, por favor nos envie o comprovante.

Agradecemos a atenção!
*Espaço Multi*`;

    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(textMsg)}`;
    window.open(url, "_blank");
  };

  // Billing Modals
  const [payDialog, setPayDialog] = useState<{ open: boolean; fatura: any }>({
    open: false,
    fatura: null,
  });
  const [editDialog, setEditDialog] = useState<{ open: boolean; fatura: any }>({
    open: false,
    fatura: null,
  });
  const [createDialog, setCreateDialog] = useState(false);

  // Form states
  const [payForm, setPayForm] = useState({
    pago_em: format(new Date(), "yyyy-MM-dd"),
    metodo: "pix",
    observacoes: "",
  });

  const [faturaForm, setFaturaForm] = useState({
    paciente_id: "",
    competencia: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    vencimento: "",
    valor: "",
    status: "aberta",
    pago_em: "",
    observacoes: "",
    profissional_id: "",
    especialidade: "",
  });

  const availableSpecialties = useMemo(() => {
    if (!faturaForm.profissional_id) return [];
    const prof = (profissionais || []).find((p: any) => p.id === faturaForm.profissional_id);
    if (!prof?.especialidade) return [];
    return prof.especialidade
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
  }, [faturaForm.profissional_id, profissionais]);

  const [invoiceDetailsDialog, setInvoiceDetailsDialog] = useState<{ open: boolean; fatura: any }>({
    open: false,
    fatura: null,
  });

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemDesc, setEditingItemDesc] = useState("");
  const [editingItemVal, setEditingItemVal] = useState("");
  const [editingItemStatus, setEditingItemStatus] = useState<string>("");

  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemVal, setNewItemVal] = useState("");

  // Helper to get pricing based on professional configuration and patient-specific discounts
  const getFaturaPrice = (pacienteId: string, profissionalId: string, especialidade: string, isAnamnese = false) => {
    if (!pacienteId) return 0;

    if (especialidade === "Apoio") {
      const p = patientDetailsMap.get(pacienteId);
      if (p) {
        const freq = p.apoio_frequencia || 'avulso';
        const customVal = p.apoio_valor_personalizado;
        if (customVal !== null && customVal !== undefined && String(customVal) !== "") {
          return Number(customVal);
        }
        const defaultRates: Record<string, number> = {
          avulso: 50.00,
          "1x": 120.00,
          "2x": 240.00,
          "3x": 360.00,
          semana_toda: 450.00
        };
        return defaultRates[freq] ?? 50.00;
      }
      return 0;
    }

    if (!profissionalId) return 0;
    const prof = (profissionais || []).find((p: any) => p.id === profissionalId);
    if (!prof) return 0;

    const config = prof.valores_config || { especialidades: [], descontos: [] };
    const valorDefault = Number(prof.valor_sessao || 0);

    // 1. Check custom patient discount
    if (Array.isArray(config.descontos) && config.descontos.length > 0) {
      const d = config.descontos.find(
        (item: any) =>
          item.paciente_id === pacienteId &&
          String(item.especialidade || "").toLowerCase() === String(especialidade || "").toLowerCase(),
      );
      if (d) {
        return isAnamnese ? Number(d.valor_avaliacao || 0) : Number(d.valor_sessao || 0);
      }
    }

    // 2. Check standard specialty rates
    if (Array.isArray(config.especialidades) && config.especialidades.length > 0) {
      const e = config.especialidades.find(
        (item: any) => String(item.nome || "").toLowerCase() === String(especialidade || "").toLowerCase(),
      );
      if (e) {
        if (isAnamnese) {
          return Number(e.valor_avaliacao || 0);
        } else {
          if (String(especialidade).toLowerCase() === "ap") return 0;
          return Number(e.valor_sessao ?? valorDefault ?? 0);
        }
      }
    }

    // 3. Default professional rate
    if (isAnamnese) {
      return 0;
    } else {
      return valorDefault;
    }
  };

  const updateFaturaFormPrice = (pacienteId: string, profissionalId: string, especialidade: string) => {
    const price = getFaturaPrice(pacienteId, profissionalId, especialidade);
    setFaturaForm((prev) => ({ ...prev, valor: price > 0 ? String(price) : "" }));
  };

  const detectedDiscount = useMemo(() => {
    if (!faturaForm.paciente_id || !faturaForm.profissional_id || !faturaForm.especialidade) return null;
    const prof = (profissionais || []).find((p: any) => p.id === faturaForm.profissional_id);
    if (!prof) return null;
    const config = prof.valores_config || { descontos: [] };
    if (!Array.isArray(config.descontos)) return null;

    return config.descontos.find(
      (d: any) =>
        d.paciente_id === faturaForm.paciente_id &&
        String(d.especialidade || "").toLowerCase() === String(faturaForm.especialidade || "").toLowerCase(),
    );
  }, [faturaForm.paciente_id, faturaForm.profissional_id, faturaForm.especialidade, profissionais]);

  const detectedSpecialtyRate = useMemo(() => {
    if (detectedDiscount) return null;
    if (!faturaForm.profissional_id || !faturaForm.especialidade) return null;
    const prof = (profissionais || []).find((p: any) => p.id === faturaForm.profissional_id);
    if (!prof) return null;
    const config = prof.valores_config || { especialidades: [] };
    if (!Array.isArray(config.especialidades)) return null;

    return config.especialidades.find(
      (e: any) => String(e.nome || "").toLowerCase() === String(faturaForm.especialidade || "").toLowerCase(),
    );
  }, [detectedDiscount, faturaForm.profissional_id, faturaForm.especialidade, profissionais]);

  // Detailed Fatura form states for inline editing the parent invoice inside details dialog
  const [detailsFaturaForm, setDetailsFaturaForm] = useState({
    competencia: "",
    vencimento: "",
    status: "aberta",
    pago_em: "",
    metodo: "pix",
    observacoes: "",
    profissional_id: "",
    especialidade: "",
  });

  const detailsAvailableSpecialties = useMemo(() => {
    if (!detailsFaturaForm.profissional_id) return [];
    const prof = (profissionais || []).find((p: any) => p.id === detailsFaturaForm.profissional_id);
    if (!prof?.especialidade) return [];
    return prof.especialidade
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
  }, [detailsFaturaForm.profissional_id, profissionais]);

  const activeDetailedFatura = useMemo(() => {
    if (!invoiceDetailsDialog.fatura?.id) return null;
    return (faturas || []).find((f) => f.id === invoiceDetailsDialog.fatura.id) || invoiceDetailsDialog.fatura;
  }, [faturas, invoiceDetailsDialog.fatura]);

  const detectedDetailsDiscount = useMemo(() => {
    if (!activeDetailedFatura?.paciente_id || !activeDetailedFatura?.profissional_id || !activeDetailedFatura?.especialidade) return null;
    const prof = (profissionais || []).find((p: any) => p.id === activeDetailedFatura.profissional_id);
    if (!prof) return null;
    const config = prof.valores_config || { descontos: [] };
    if (!Array.isArray(config.descontos)) return null;

    return config.descontos.find(
      (d: any) =>
        d.paciente_id === activeDetailedFatura.paciente_id &&
        String(d.especialidade || "").toLowerCase() === String(activeDetailedFatura.especialidade || "").toLowerCase(),
    );
  }, [activeDetailedFatura, profissionais]);

  const detectedDetailsSpecialtyRate = useMemo(() => {
    if (detectedDetailsDiscount) return null;
    if (!activeDetailedFatura?.profissional_id || !activeDetailedFatura?.especialidade) return null;
    const prof = (profissionais || []).find((p: any) => p.id === activeDetailedFatura.profissional_id);
    if (!prof) return null;
    const config = prof.valores_config || { especialidades: [] };
    if (!Array.isArray(config.especialidades)) return null;

    return config.especialidades.find(
      (e: any) => String(e.nome || "").toLowerCase() === String(activeDetailedFatura.especialidade || "").toLowerCase(),
    );
  }, [detectedDetailsDiscount, activeDetailedFatura, profissionais]);

  const handleOpenInvoiceDetails = (fatura: any) => {
    setInvoiceDetailsDialog({ open: true, fatura });
    
    let profId = fatura.profissional_id || "";
    if (fatura.especialidade === "Apoio" && !profId) {
      const p = patientDetailsMap.get(fatura.paciente_id);
      if (p?.paciente_profissional?.length > 0) {
        profId = p.paciente_profissional[0].profissional_id;
      }
    }

    setDetailsFaturaForm({
      competencia: fatura.competencia || "",
      vencimento: fatura.vencimento || "",
      status: fatura.status || "aberta",
      pago_em: fatura.pago_em ? format(new Date(fatura.pago_em), "yyyy-MM-dd") : "",
      metodo: fatura.metodo || "pix",
      observacoes: fatura.observacoes || "",
      profissional_id: profId,
      especialidade: fatura.especialidade || "",
    });
    setEditingItemId(null);
    setNewItemDesc("");
    const price = getFaturaPrice(fatura.paciente_id, profId, fatura.especialidade);
    setNewItemVal(price > 0 ? String(price) : "");
  };

  const handleOpenConfirmPayment = (fatura: any) => {
    setPayForm({
      pago_em: format(new Date(), "yyyy-MM-dd"),
      metodo: fatura.metodo || "pix",
      observacoes: fatura.observacoes || "",
    });
    setPayDialog({ open: true, fatura });
  };

  const handleOpenEdit = (fatura: any) => {
    setFaturaForm({
      paciente_id: fatura.paciente_id,
      competencia: fatura.competencia,
      vencimento: fatura.vencimento || "",
      valor: String(fatura.valor),
      status: fatura.status,
      pago_em: fatura.pago_em ? format(new Date(fatura.pago_em), "yyyy-MM-dd") : "",
      observacoes: fatura.observacoes || "",
      profissional_id: fatura.profissional_id || "",
      especialidade: fatura.especialidade || "",
    });
    setEditDialog({ open: true, fatura });
  };

  const getDaysDelayed = (fatura: any) => {
    if (fatura.status === "paga") {
      if (fatura.pago_em && fatura.vencimento) {
        const payDate = startOfDay(new Date(fatura.pago_em));
        const dueDate = startOfDay(new Date(fatura.vencimento + "T12:00:00"));
        const diff = differenceInDays(payDate, dueDate);
        return diff > 0 ? diff : 0;
      }
      return 0;
    }
    if (fatura.status === "cancelada") return 0;
    if (fatura.vencimento) {
      const today = startOfDay(new Date());
      const dueDate = startOfDay(new Date(fatura.vencimento + "T12:00:00"));
      const diff = differenceInDays(today, dueDate);
      return diff > 0 ? diff : 0;
    }
    return 0;
  };

  const filteredFaturas = useMemo(() => {
    return (faturas || [])
      .filter((f) => {
        const patientName = patientMap.get(f.paciente_id) || "";
        const matchesSearch = normalizeString(patientName).includes(normalizeString(searchPatient));
        const matchesStatus = statusFilter === "all" || f.status === statusFilter;

        let matchesProf = true;
        if (profFilter !== "all") {
          const profIds = faturaProfIdsMap.get(f.id);
          matchesProf = profIds ? profIds.has(profFilter) : false;
        }

        return matchesSearch && matchesStatus && matchesProf;
      })
      .sort((a, b) => new Date(a.competencia).getTime() - new Date(b.competencia).getTime());
  }, [faturas, searchPatient, statusFilter, profFilter, faturaProfIdsMap, patientMap]);
  const mensalPatients = useMemo(() => {
    return filteredConsolidated.filter((c) => c.billingType === "mensal");
  }, [filteredConsolidated]);

  const sessaoPatients = useMemo(() => {
    return filteredConsolidated.filter((c) => c.billingType === "sessao");
  }, [filteredConsolidated]);

  const renderPatientTable = (list: typeof filteredConsolidated, emptyMessage: string) => {
    if (list.length === 0) {
      return (
        <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg bg-card/30">
          {emptyMessage}
        </div>
      );
    }
    return (
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader className="bg-muted/40 font-semibold text-foreground">
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Profissionais</TableHead>
              <TableHead>Responsável Financeiro</TableHead>
              <TableHead className="text-center">Faturas Pendentes</TableHead>
              <TableHead>Soma Pendente</TableHead>
              <TableHead>Soma Paga</TableHead>
              <TableHead>Soma Geral</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="w-[180px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((c) => {
              const resps = responsaveisMap.get(c.pacienteId) || [];
              const primaryResp =
                resps.find((r) => r.whatsapp) ||
                resps.find((r) => r.telefone) ||
                resps[0];

              return (
                <TableRow key={c.key} className="hover:bg-muted/30">
                  <TableCell className="font-semibold text-foreground">
                    <div>{c.nome}</div>
                    {(() => {
                      const p = patientDetailsMap.get(c.pacienteId);
                      const hasApoio = p?.cids_secundarios?.some((s: string) => s.toLowerCase() === "apoio" || s.toUpperCase() === "AP");
                      if (hasApoio) {
                        const freq = p?.apoio_frequencia || 'avulso';
                        const customVal = p?.apoio_valor_personalizado;
                        let label = "";
                        if (freq === 'avulso') label = `Apoio: Avulso (${customVal ? brl(customVal) : "R$ 50,00"}/sessão)`;
                        else if (freq === '1x') label = `Apoio: 1x/semana (${customVal ? brl(customVal) : "R$ 120,00"}/mês)`;
                        else if (freq === '2x') label = `Apoio: 2x/semana (${customVal ? brl(customVal) : "R$ 240,00"}/mês)`;
                        else if (freq === '3x') label = `Apoio: 3x/semana (${customVal ? brl(customVal) : "R$ 360,00"}/mês)`;
                        else if (freq === 'semana_toda') label = `Apoio: Semana Toda (${customVal ? brl(customVal) : "R$ 450,00"}/mês)`;
                        return (
                          <div className="space-y-1 mt-0.5">
                            <span className="text-[10px] text-muted-foreground font-normal block bg-primary/5 border border-primary/10 rounded px-1.5 py-0.5 w-max">
                              {label}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[155px]">
                      {getPatientProfessionals(c.pacienteId).length > 0 ? (
                        getPatientProfessionals(c.pacienteId).map((name) => (
                          <Badge
                            key={name}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0.5 font-medium whitespace-nowrap"
                          >
                            {name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {primaryResp ? (
                      <div className="flex items-center gap-2">
                        <div className="text-sm">
                          <span className="font-semibold text-foreground block leading-tight">
                            {primaryResp.nome}
                          </span>
                          {primaryResp.parentesco && (
                            <span className="text-muted-foreground text-[11px]">
                              {primaryResp.parentesco}
                            </span>
                          )}
                        </div>
                        {(primaryResp.whatsapp || primaryResp.telefone) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2.5 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-emerald-500/20 hover:border-emerald-500/40 flex items-center gap-1"
                            onClick={() =>
                              handleWhatsAppClick(c.pacienteId, c.totalPendente, c.nome)
                            }
                            title={`Chamar no WhatsApp: ${primaryResp.whatsapp || primaryResp.telefone}`}
                          >
                            <MessageCircle className="h-3.5 w-3.5 fill-emerald-600/10 shrink-0" />
                            WhatsApp
                          </Button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Nenhum responsável
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {c.faturasPendentesCount}
                  </TableCell>
                  <TableCell
                    className={`font-semibold ${c.totalPendente > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}
                  >
                    {brl(c.totalPendente)}
                  </TableCell>
                  <TableCell
                    className={`font-medium ${c.totalPago > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
                  >
                    {brl(c.totalPago)}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {brl(c.totalGeral)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        c.temAtraso
                          ? "destructive"
                          : c.totalPendente > 0
                            ? "outline"
                            : c.totalPago > 0
                              ? "default"
                              : "secondary"
                      }
                      className={
                        c.temAtraso
                          ? "bg-rose-500 hover:bg-rose-600 text-white border-transparent"
                          : c.totalPendente > 0
                            ? "bg-sky-500 hover:bg-sky-600 text-white border-transparent"
                            : c.totalPago > 0
                              ? "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent"
                              : ""
                      }
                    >
                      {c.temAtraso
                        ? "Atrasado"
                        : c.totalPendente > 0
                          ? "No Prazo"
                          : c.totalPago > 0
                            ? "Em Dia"
                            : "Sem Faturas"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className="flex justify-end gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 font-medium"
                        onClick={() => handleOpenPatientFaturas(c.pacienteId, c.nome)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver Faturas
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Nova Cobrança para este Paciente"
                        className="h-8 w-8 text-primary hover:bg-primary/5"
                        onClick={() => {
                          setFaturaForm({
                            paciente_id: c.pacienteId,
                            competencia: format(startOfMonth(new Date()), "yyyy-MM-dd"),
                            vencimento: "",
                            valor: "",
                            status: "aberta",
                            pago_em: "",
                            observacoes: "",
                            profissional_id: "",
                            especialidade: "",
                          });
                          setCreateDialog(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };
  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <Card className="border-border shadow-sm">
        <CardContent className="flex flex-wrap items-end gap-4 p-4">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <Label className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              <Calendar className="h-3.5 w-3.5" /> Data Início
            </Label>
            <Input
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <Label className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              <Calendar className="h-3.5 w-3.5" /> Data Fim
            </Label>
            <Input
              type="date"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
              className="h-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Financial Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-emerald-500/10 shadow-sm relative overflow-hidden group hover:shadow-md transition duration-200">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
          <CardContent className="flex items-center gap-4 p-5">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Receita Recebida
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {brl(stats.faturamentoRecebido)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Total Faturado no período:{" "}
                <span className="font-medium">{brl(stats.faturamentoTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/10 shadow-sm relative overflow-hidden group hover:shadow-md transition duration-200">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
          <CardContent className="flex items-center gap-4 p-5">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400">
              <Clock className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Faturas Pendentes
              </div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {brl(stats.faturamentoPendente)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                A Receber: <span className="font-medium">{brl(stats.faturamentoAReceber)}</span> |
                Vencido: <span className="font-medium">{brl(stats.faturamentoVencido)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-500/10 shadow-sm relative overflow-hidden group hover:shadow-md transition duration-200">
          <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
          <CardContent className="flex items-center gap-4 p-5">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
              <TrendingDown className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Despesas Totais
              </div>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {brl(stats.totalDespesas)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Comprometimento de receita no período selecionado
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`shadow-sm relative overflow-hidden group hover:shadow-md transition duration-200 ${
            stats.balancoReal >= 0 ? "border-emerald-500/10" : "border-rose-500/10"
          }`}
        >
          <div
            className={`absolute top-0 left-0 w-full h-1 ${
              stats.balancoReal >= 0 ? "bg-emerald-500" : "bg-rose-500"
            }`}
          />
          <CardContent className="flex items-center gap-4 p-5">
            <div
              className={`grid h-12 w-12 place-items-center rounded-xl ${
                stats.balancoReal >= 0
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                  : "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400"
              }`}
            >
              <ArrowRightLeft className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Balanço Líquido
              </div>
              <div
                className={`text-2xl font-bold ${
                  stats.balancoReal >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {brl(stats.balancoReal)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Balanço Estimado (Total Faturado):{" "}
                <span className="font-semibold">{brl(stats.balancoEstimado)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cobrancas" className="w-full space-y-6">
        <TabsList className="bg-muted p-1 rounded-xl inline-flex">
          <TabsTrigger value="cobrancas" className="rounded-lg px-4 py-2 text-sm font-medium">
            Cobranças por Paciente
          </TabsTrigger>
          <TabsTrigger value="pagamentos" className="rounded-lg px-4 py-2 text-sm font-medium">
            Pagamento dos Profissionais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cobrancas" className="mt-0">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
              <div>
                <CardTitle className="text-lg">Central de Cobrança</CardTitle>
                <CardDescription>
                  Acompanhamento consolidado de valores, contato com responsáveis e confirmação de
                  pagamentos.
                </CardDescription>
              </div>
              <div className="flex gap-2 self-start sm:self-center">
                <Button
                  onClick={handlePrintAllBilling}
                  disabled={filteredConsolidated.length === 0}
                  variant="outline"
                  className="gap-1.5 border-primary/20 text-primary hover:bg-primary/5"
                >
                  <Printer className="h-4 w-4" /> Imprimir Relatório Geral
                </Button>
                <Button
                  onClick={() => {
                    setFaturaForm({
                      paciente_id: "",
                      competencia: format(startOfMonth(new Date()), "yyyy-MM-dd"),
                      vencimento: "",
                      valor: "",
                      status: "aberta",
                      pago_em: "",
                      observacoes: "",
                      profissional_id: "",
                      especialidade: "",
                    });
                    setCreateDialog(true);
                  }}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Nova Cobrança
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sub-tabs Switcher */}
              <div className="flex border-b border-border pb-px mb-2">
                <button
                  onClick={() => setSubTab("consolidado")}
                  className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
                    subTab === "consolidado"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Resumo por Paciente
                </button>
                <button
                  onClick={() => setSubTab("historico")}
                  className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
                    subTab === "historico"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Histórico de Faturas
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Buscar paciente..."
                    value={searchPatient}
                    onChange={(e) => setSearchPatient(e.target.value)}
                    className="pl-9 h-10"
                  />
                </div>
                <div className="w-[180px]">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="aberta">Em Aberto</SelectItem>
                      <SelectItem value="paga">Pagas</SelectItem>
                      <SelectItem value="vencida">Vencidas</SelectItem>
                      <SelectItem value="cancelada">Canceladas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-[190px]">
                  <Select value={profFilter} onValueChange={setProfFilter}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Todos os Profissionais" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Profissionais</SelectItem>
                      {(profissionais || []).map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {subTab === "consolidado" && (
                  <div className="w-[190px]">
                    <Select
                      value={paymentTypeFilter}
                      onValueChange={(val: any) => setPaymentTypeFilter(val)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Tipo de Faturamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Faturamentos</SelectItem>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="sessao">Por Sessão</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {subTab === "consolidado" ? (
                loadingFaturas ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Carregando cobranças consolidadas...
                  </div>
                ) : filteredConsolidated.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                    Nenhuma cobrança consolidada encontrada para os filtros selecionados.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(paymentTypeFilter === "all" || paymentTypeFilter === "mensal") && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 font-semibold text-sm text-foreground bg-muted/40 px-3 py-2 rounded-lg border border-border/50">
                          <span className="text-primary font-bold">💳 Pagamento Mensal</span>
                          <span className="text-xs text-muted-foreground">
                            ({mensalPatients.length} {mensalPatients.length === 1 ? "paciente" : "pacientes"})
                          </span>
                        </div>
                        {renderPatientTable(mensalPatients, "Nenhum paciente com faturamento mensal.")}
                      </div>
                    )}

                    {(paymentTypeFilter === "all" || paymentTypeFilter === "sessao") && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 font-semibold text-sm text-foreground bg-muted/40 px-3 py-2 rounded-lg border border-border/50">
                          <span className="text-primary font-bold">📅 Pagamento por Sessão</span>
                          <span className="text-xs text-muted-foreground">
                            ({sessaoPatients.length} {sessaoPatients.length === 1 ? "paciente" : "pacientes"})
                          </span>
                        </div>
                        {renderPatientTable(sessaoPatients, "Nenhum paciente com faturamento por sessão.")}
                      </div>
                    )}
                  </div>
                )
              ) : /* Histórico de Faturas */
              loadingFaturas ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Carregando cobranças...
                </div>
              ) : filteredFaturas.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                  Nenhuma cobrança encontrada para os filtros selecionados.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader className="bg-muted/40 font-semibold text-foreground">
                      <TableRow>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Competência</TableHead>
                        <TableHead>Sessão</TableHead>
                        <TableHead>Profissional</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead>Dias de Atraso</TableHead>
                        <TableHead className="w-[140px] text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFaturas.map((f: any) => {
                        const daysDelayed = getDaysDelayed(f);
                        const patientName = patientMap.get(f.paciente_id) || "—";

                        return (
                          <TableRow key={f.id}>
                            <TableCell className="font-semibold text-foreground">
                              {patientName}
                            </TableCell>
                            <TableCell>
                              {f.competencia
                                ? format(new Date(f.competencia + "T12:00:00"), "MM/yyyy")
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {renderSessionDates(f)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-[150px]">
                                {getProfessionalsForFatura(f).length > 0 ? (
                                  getProfessionalsForFatura(f).map((name) => (
                                    <Badge
                                      key={name}
                                      variant="secondary"
                                      className="text-[10px] px-1.5 py-0.5 font-medium whitespace-nowrap"
                                    >
                                      {name}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">—</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {f.vencimento
                                ? format(new Date(f.vencimento + "T12:00:00"), "dd/MM/yyyy")
                                : "—"}
                            </TableCell>
                            <TableCell className="font-semibold">{brl(Number(f.valor))}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  f.status === "paga"
                                    ? "default"
                                    : f.status === "vencida" ||
                                        (f.status === "aberta" && daysDelayed > 0)
                                      ? "destructive"
                                      : f.status === "cancelada"
                                        ? "secondary"
                                        : "outline"
                                }
                                className={
                                  f.status === "paga"
                                    ? "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent"
                                    : f.status === "aberta" && daysDelayed > 0
                                      ? "bg-rose-500 hover:bg-rose-600 text-white border-transparent"
                                      : f.status === "aberta"
                                        ? "bg-sky-500 hover:bg-sky-600 text-white border-transparent"
                                        : ""
                                }
                              >
                                {f.status === "aberta" && daysDelayed > 0
                                  ? "Vencida (Atrasada)"
                                  : f.status === "aberta"
                                    ? "Em Aberto"
                                    : f.status === "paga"
                                      ? "Pago"
                                      : f.status === "vencida"
                                        ? "Vencida"
                                        : "Cancelada"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {f.status === "paga" ? (
                                <div className="space-y-0.5">
                                  <div>
                                    {f.pago_em ? format(new Date(f.pago_em), "dd/MM/yyyy") : "—"}
                                  </div>
                                  <div className="font-semibold uppercase tracking-wider text-[10px] text-emerald-600 dark:text-emerald-400">
                                    {f.metodo || ""}
                                  </div>
                                </div>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell>
                              {f.status === "paga" ? (
                                daysDelayed > 0 ? (
                                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                    Pago com {daysDelayed}d de atraso
                                  </span>
                                ) : (
                                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                    <Check className="h-3 w-3" /> Pago em dia
                                  </span>
                                )
                              ) : f.status === "cancelada" ? (
                                "—"
                              ) : f.vencimento ? (
                                daysDelayed > 0 ? (
                                  <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {daysDelayed}{" "}
                                    dias de atraso
                                  </span>
                                ) : (
                                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> No prazo
                                  </span>
                                )
                              ) : (
                                <span className="text-xs text-muted-foreground italic">
                                  Sem vencimento
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div
                                className="flex justify-end gap-1.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {f.status !== "paga" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Confirmar Pagamento"
                                    className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                    onClick={() => handleOpenConfirmPayment(f)}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                                 <Button
                                   variant="ghost"
                                   size="icon"
                                   title="Ver Detalhes / Sessões"
                                   className="h-8 w-8 text-primary hover:text-primary-foreground hover:bg-primary/5"
                                   onClick={() => handleOpenInvoiceDetails(f)}
                                 >
                                   <Eye className="h-4 w-4" />
                                 </Button>
                                 <Button
                                   variant="ghost"
                                   size="icon"
                                   title="Editar Cobrança"
                                   className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                   onClick={() => handleOpenEdit(f)}
                                 >
                                   <Pencil className="h-4 w-4" />
                                 </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      title="Excluir Cobrança"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir Cobrança</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir esta cobrança? Todos os itens
                                        de faturamento associados a agendamentos serão mantidos, mas
                                        a cobrança em si será excluída.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                        onClick={() => deleteFaturaMutation.mutate(f.id)}
                                      >
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagamentos" className="space-y-6 mt-0">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-border shadow-sm relative overflow-hidden group hover:shadow-md transition duration-200">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              <CardContent className="flex items-center gap-4 p-5">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/5 text-primary">
                  <Calendar className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Total de Sessões
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {repasseCardsStats.totalSessões}
                  </div>
                  <div className="text-[11px] text-muted-foreground">No período selecionado</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-500/10 shadow-sm relative overflow-hidden group hover:shadow-md transition duration-200">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
              <CardContent className="flex items-center gap-4 p-5">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
                  <Check className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Repasse Pago
                  </div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {brl(repasseCardsStats.repassePago)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">Sessões com status Pago</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-500/10 shadow-sm relative overflow-hidden group hover:shadow-md transition duration-200">
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
              <CardContent className="flex items-center gap-4 p-5">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400">
                  <Clock className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Pendente de Pagamento
                  </div>
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {brl(repasseCardsStats.repassePendente)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Sessões com status Realizado ou Falta
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters Card */}
          <Card className="border-border shadow-sm">
            <CardContent className="flex flex-wrap items-end gap-4 p-4">
              <div className="space-y-1.5 flex-1 min-w-[200px] max-w-xs">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Profissional
                </Label>
                <Select value={selectedProfId} onValueChange={handleSelectProf}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Todos os Profissionais" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Profissionais</SelectItem>
                    {(profissionais || []).map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 flex-1 min-w-[200px] max-w-xs">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status da Sessão
                </Label>
                <Select value={sessionStatusFilter} onValueChange={setSessionStatusFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realizado_pago_falta">Realizados, Pagos & Faltas</SelectItem>
                    <SelectItem value="confirmado">Confirmados</SelectItem>
                    <SelectItem value="pago">Pagos</SelectItem>
                    <SelectItem value="realizado">Realizados</SelectItem>
                    <SelectItem value="todos">Todos os Status (exceto cancelados)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 flex justify-end self-center md:self-end">
                <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-500/10 rounded-lg px-3 py-2 flex items-center gap-1.5 max-w-md">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    Somente sessões nos status <strong>Realizado</strong>, <strong>Pago</strong> ou <strong>Falta</strong>{" "}
                    geram faturamento no sistema financeiro por padrão.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Calculation Content */}
          {loadingAgendamentos || loadingFaturaItens ? (
            <Card className="border-border shadow-sm p-8 text-center text-sm text-muted-foreground">
              Carregando dados de agendamentos e faturamento...
            </Card>
          ) : viewingProfDetail ? (
            /* DETAILED VIEW FOR A SPECIFIC PROFESSIONAL */
            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectProf("all")}
                      className="h-8 gap-1 font-semibold text-xs"
                    >
                      <ChevronLeft className="h-4 w-4" /> Voltar
                    </Button>
                    <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                      <span>
                        Detalhes do Profissional:{" "}
                        {profissionais.find((p: any) => p.id === viewingProfDetail)?.nome || "—"}
                      </span>
                      {isCoordenadora(viewingProfDetail) && (
                        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-[11px] font-bold border-transparent">
                          Bônus Coordenadora AP (+ R$ 300)
                        </Badge>
                      )}
                    </CardTitle>
                  </div>
                  <CardDescription className="mt-1 pl-12 sm:pl-16">
                    Lista detalhada de sessões e cálculo de repasse individualizado no período.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-6">
                {filteredRepasses.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Nenhuma sessão encontrada para este profissional nos critérios selecionados.
                  </div>
                ) : (
                  <>
                    {/* Professional Detailed Summary Stats */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Card className="border-border bg-muted/20 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Sessões no Período
                            </div>
                            <div className="text-xl font-bold">{repasseStats.totalSessões}</div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-border bg-muted/20 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950/20 dark:text-sky-400">
                            <DollarSign className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Faturamento Total
                            </div>
                            <div className="text-xl font-bold">
                              {brl(repasseStats.faturamentoBruto)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-border bg-muted/20 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                            <TrendingUp className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Repasse Profissional
                            </div>
                            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                              {brl(repasseStats.repasseProfissional)}
                            </div>
                            <div className="text-[9px] text-muted-foreground mt-0.5">
                              Apto:{" "}
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {brl(repasseStats.repasseApto)}
                              </span>{" "}
                              | Bloq:{" "}
                              <span className="font-semibold text-rose-500">
                                {brl(repasseStats.repasseBloqueado)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-border bg-muted/20 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400">
                            <TrendingDown className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Comissão Clínica
                            </div>
                            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                              {brl(repasseStats.comissaoClinica)}
                            </div>
                            <div className="text-[9px] text-muted-foreground mt-0.5">
                              Recebida:{" "}
                              <span className="font-semibold text-purple-600 dark:text-purple-400">
                                {brl(repasseStats.comissaoRecebida)}
                              </span>{" "}
                              | Pend:{" "}
                              <span className="font-semibold text-rose-500">
                                {brl(repasseStats.comissaoPendente)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Patient Billing Status Table */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                          Situação de Cobrança dos Pacientes do Profissional
                        </h3>
                        <span className="text-[11px] text-muted-foreground">
                          Consolidado de valores atendidos e cobranças por paciente deste
                          profissional no período
                        </span>
                      </div>
                      <div className="overflow-x-auto rounded-lg border border-border">
                        <Table>
                          <TableHeader className="bg-muted/40 font-semibold text-foreground">
                            <TableRow>
                              <TableHead>Paciente</TableHead>
                              <TableHead className="text-center">Qtd Sessões</TableHead>
                              <TableHead>Faturamento Total</TableHead>
                              <TableHead>Repasse Profissional</TableHead>
                              <TableHead>Status Geral</TableHead>
                              <TableHead>Responsável Financeiro</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {professionalPatients.map((p) => {
                              const resps = responsaveisMap.get(p.pacienteId) || [];
                              const primaryResp =
                                resps.find((r) => r.whatsapp) ||
                                resps.find((r) => r.telefone) ||
                                resps[0];
                              const patientBilling = consolidatedPatients.find(
                                (cp) => cp.pacienteId === p.pacienteId,
                              );
                              const totalPendente = patientBilling?.totalPendente || 0;

                              return (
                                <TableRow key={p.pacienteId} className="hover:bg-muted/30">
                                  <TableCell className="font-semibold text-foreground">
                                    {p.nome}
                                  </TableCell>
                                  <TableCell className="text-center font-medium">
                                    {p.totalSessões}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {brl(p.faturamentoBruto)}
                                  </TableCell>
                                  <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    <div className="space-y-0.5">
                                      <div>{brl(p.repasseProfissional)}</div>
                                      <div className="text-[10px] text-muted-foreground font-normal">
                                        Apto:{" "}
                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                          {brl(p.repasseApto)}
                                        </span>{" "}
                                        | Bloq:{" "}
                                        <span className="text-rose-500 font-semibold">
                                          {brl(p.repasseBloqueado)}
                                        </span>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={p.repasseBloqueado > 0 ? "destructive" : "default"}
                                      className={
                                        p.repasseBloqueado > 0
                                          ? "bg-rose-500 hover:bg-rose-600 text-white border-transparent"
                                          : "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent"
                                      }
                                    >
                                      {p.repasseBloqueado > 0 ? "Com Pendências" : "Em Dia"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {primaryResp ? (
                                      <div className="flex items-center gap-2">
                                        <div className="text-xs">
                                          <span className="font-semibold text-foreground block leading-tight">
                                            {primaryResp.nome}
                                          </span>
                                          {primaryResp.parentesco && (
                                            <span className="text-muted-foreground text-[10px]">
                                              {primaryResp.parentesco}
                                            </span>
                                          )}
                                        </div>
                                        {totalPendente > 0 &&
                                          (primaryResp.whatsapp || primaryResp.telefone) && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-7 px-2 text-[10px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-emerald-500/20 hover:border-emerald-500/40 flex items-center gap-1 shrink-0"
                                              onClick={() =>
                                                handleWhatsAppClick(
                                                  p.pacienteId,
                                                  totalPendente,
                                                  p.nome,
                                                )
                                              }
                                            >
                                              <MessageCircle className="h-3 w-3 fill-emerald-600/10 shrink-0" />
                                              Cobrar {brl(totalPendente)}
                                            </Button>
                                          )}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-muted-foreground italic">
                                        Sem responsável
                                      </span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Detailed Sessions List */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                          Sessões Detalhadas
                        </h3>
                        <span className="text-[11px] text-muted-foreground">
                          Lista de todos os atendimentos do profissional com elegibilidade para
                          repasse
                        </span>
                      </div>
                      <div className="overflow-x-auto rounded-lg border border-border">
                        <Table>
                          <TableHeader className="bg-muted/40 font-semibold text-foreground">
                            <TableRow>
                              <TableHead>Data / Hora</TableHead>
                              <TableHead>Paciente</TableHead>
                              <TableHead>Especialidade</TableHead>
                              <TableHead>Status da Sessão</TableHead>
                              <TableHead>Pagamento (Cliente)</TableHead>
                              <TableHead>Elegibilidade para Repasse</TableHead>
                              <TableHead>Valor Sessão</TableHead>
                              <TableHead>Regra (Prof / Clínica)</TableHead>
                              <TableHead>Repasse Profissional</TableHead>
                              <TableHead>Comissão Clínica</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredRepasses
                              .sort(
                                (a, b) =>
                                  new Date(a.data_inicio).getTime() -
                                  new Date(b.data_inicio).getTime(),
                              )
                              .map((a: any) => {
                                const val = getAppointmentValue(a);
                                const spec = getAppointmentSpecialty(a);
                                const {
                                  profPct,
                                  clinicPct,
                                  label: splitLabel,
                                } = getRepasseRates(spec);

                                const repasseVal = val * profPct;
                                const clinicVal = val * clinicPct;

                                return (
                                  <TableRow key={a.id} className="hover:bg-muted/30">
                                    <TableCell className="font-medium">
                                      {format(new Date(a.data_inicio), "dd/MM/yyyy HH:mm")}
                                    </TableCell>
                                    <TableCell className="font-semibold text-foreground">
                                      {a.pacientes?.nome || "Paciente Desconhecido"}
                                    </TableCell>
                                    <TableCell>
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                        {spec}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="secondary"
                                        className={
                                          a.status === "pago"
                                            ? "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent"
                                            : a.status === "confirmado"
                                              ? "bg-sky-500 hover:bg-sky-600 text-white border-transparent"
                                              : ""
                                        }
                                      >
                                        {a.status === "pago"
                                          ? "Pago"
                                          : a.status === "confirmado"
                                            ? "Confirmado"
                                            : a.status === "realizado"
                                              ? "Realizado"
                                              : a.status === "falta"
                                                ? "Falta"
                                                : a.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {(() => {
                                        const clientPayStatus = getPatientPaymentStatus(a);
                                        if (clientPayStatus === "paga") {
                                          return (
                                            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-transparent">
                                              Pago
                                            </Badge>
                                          );
                                        } else if (clientPayStatus === "vencida") {
                                          return (
                                            <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-transparent">
                                              Vencido
                                            </Badge>
                                          );
                                        } else if (clientPayStatus === "aberta") {
                                          return (
                                            <Badge className="bg-sky-500 hover:bg-sky-600 text-white border-transparent">
                                              Em Aberto
                                            </Badge>
                                          );
                                        } else {
                                          return (
                                            <Badge
                                              variant="outline"
                                              className="text-muted-foreground border-border"
                                            >
                                              Não Faturado
                                            </Badge>
                                          );
                                        }
                                      })()}
                                    </TableCell>
                                    <TableCell>
                                      {(() => {
                                        const clientPayStatus = getPatientPaymentStatus(a);
                                        if (clientPayStatus === "paga") {
                                          return (
                                            <Badge
                                              variant="outline"
                                              className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-500/20"
                                            >
                                              Apto para Repasse
                                            </Badge>
                                          );
                                        } else if (clientPayStatus === "nao_faturado") {
                                          return (
                                            <Badge
                                              variant="outline"
                                              className="text-muted-foreground border-border"
                                            >
                                              Não Faturado
                                            </Badge>
                                          );
                                        } else {
                                          return (
                                            <Badge
                                              variant="outline"
                                              className="bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-500/20"
                                            >
                                              Aguardando Cliente
                                            </Badge>
                                          );
                                        }
                                      })()}
                                    </TableCell>
                                    <TableCell className="font-semibold text-foreground">
                                      {brl(val)}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                      {splitLabel}
                                    </TableCell>
                                    <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                                      {brl(repasseVal)}
                                    </TableCell>
                                    <TableCell className="font-medium text-purple-600 dark:text-purple-400">
                                      {brl(clinicVal)}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            {isCoordenadora(viewingProfDetail) && (
                              <TableRow className="bg-yellow-500/5 hover:bg-yellow-500/10 border-t font-semibold">
                                <TableCell className="italic text-muted-foreground">—</TableCell>
                                <TableCell className="text-foreground font-bold">
                                  Bônus Especialidade Coordenadora AP
                                </TableCell>
                                <TableCell>
                                  <Badge className="bg-yellow-500 text-white font-bold border-transparent text-[10px] px-1.5 py-0.5">
                                    Bônus
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className="bg-emerald-500 text-white font-bold border-transparent text-[10px] px-1.5 py-0.5">
                                    Pago
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {(() => {
                                    const allPaid = filteredRepasses.every((a: any) => getPatientPaymentStatus(a) === "paga");
                                    return (
                                      <Badge className={allPaid ? "bg-emerald-500 text-white font-bold" : "bg-sky-500 text-white font-bold"}>
                                        {allPaid ? "Pago" : "Em Aberto"}
                                      </Badge>
                                    );
                                  })()}
                                </TableCell>
                                <TableCell>
                                  {(() => {
                                    const allPaid = filteredRepasses.every((a: any) => getPatientPaymentStatus(a) === "paga");
                                    return (
                                      <Badge variant="outline" className={allPaid ? "bg-emerald-50 text-emerald-700 border-emerald-500/20" : "bg-amber-50 text-amber-700 border-amber-500/20"}>
                                        {allPaid ? "Apto para Repasse" : "Aguardando Cliente"}
                                      </Badge>
                                    );
                                  })()}
                                </TableCell>
                                <TableCell className="text-foreground">R$ 300,00</TableCell>
                                <TableCell className="text-xs text-muted-foreground">100% Repasse</TableCell>
                                <TableCell className="text-emerald-600 dark:text-emerald-400">R$ 300,00</TableCell>
                                <TableCell className="text-purple-600 dark:text-purple-400">R$ 0,00</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            /* CONSOLIDATED VIEW OF ALL PROFESSIONALS */
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Resumo por Profissional</CardTitle>
                <CardDescription>
                  Valores totais a repassar e comissões consolidadas por profissional no período
                  selecionado.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-6 sm:pt-0">
                {consolidatedRepasses.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                    Nenhum profissional com sessões correspondentes no período.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <Table>
                      <TableHeader className="bg-muted/40 font-semibold text-foreground">
                        <TableRow>
                          <TableHead>Profissional</TableHead>
                          <TableHead>Especialidades Atendidas</TableHead>
                          <TableHead className="text-center">Qtd de Sessões</TableHead>
                          <TableHead>Faturamento Bruto</TableHead>
                          <TableHead>Repasse Profissional</TableHead>
                          <TableHead>Comissão Clínica</TableHead>
                          <TableHead className="w-[120px] text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {consolidatedRepasses.map((group) => {
                          const specsArr = Array.from(group.especialidades);

                          return (
                            <TableRow key={group.profissionalId} className="hover:bg-muted/30">
                              <TableCell className="font-semibold text-foreground">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-2.5 w-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: group.cor }}
                                  />
                                  <span>{group.nome}</span>
                                  {isCoordenadora(group.profissionalId) && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-yellow-500/10 text-yellow-700 border-yellow-500/20 font-bold shrink-0">
                                      Coord. (+R$300)
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {specsArr.map((spec) => (
                                    <span
                                      key={spec}
                                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground"
                                    >
                                      {spec}
                                    </span>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-medium">
                                {group.totalSessões}
                              </TableCell>
                              <TableCell className="font-semibold text-foreground">
                                {brl(group.faturamentoBruto)}
                              </TableCell>
                              <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                                <div className="space-y-0.5">
                                  <div>{brl(group.repasseProfissional)}</div>
                                  <div className="text-[10px] text-muted-foreground font-normal">
                                    Apto:{" "}
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                      {brl(group.repasseApto)}
                                    </span>{" "}
                                    | Bloq:{" "}
                                    <span className="text-rose-500 font-semibold">
                                      {brl(group.repasseBloqueado)}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="font-semibold text-purple-600 dark:text-purple-400">
                                <div className="space-y-0.5">
                                  <div>{brl(group.comissaoClinica)}</div>
                                  <div className="text-[10px] text-muted-foreground font-normal">
                                    Rec:{" "}
                                    <span className="text-purple-600 dark:text-purple-400 font-semibold">
                                      {brl(group.comissaoRecebida)}
                                    </span>{" "}
                                    | Pend:{" "}
                                    <span className="text-rose-500 font-semibold">
                                      {brl(group.comissaoPendente)}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1 font-semibold text-xs"
                                  onClick={() => handleSelectProf(group.profissionalId)}
                                >
                                  <Eye className="h-3.5 w-3.5" /> Detalhar
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Confirmar Pagamento Dialog */}
      <Dialog
        open={payDialog.open}
        onOpenChange={(open) => setPayDialog({ open, fatura: open ? payDialog.fatura : null })}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (payDialog.fatura) {
                confirmPaymentMutation.mutate(
                  {
                    id: payDialog.fatura.id,
                    pago_em: new Date(payForm.pago_em + "T12:00:00").toISOString(),
                    metodo: payForm.metodo,
                    observacoes: payForm.observacoes,
                  },
                  {
                    onSuccess: () => setPayDialog({ open: false, fatura: null }),
                  },
                );
              }
            }}
            className="space-y-4 pt-2"
          >
            <div className="space-y-1.5">
              <Label>Paciente</Label>
              <Input
                value={payDialog.fatura ? patientMap.get(payDialog.fatura.paciente_id) || "—" : ""}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Valor</Label>
                <Input
                  value={payDialog.fatura ? brl(Number(payDialog.fatura.valor)) : ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Data de Pagamento</Label>
                <Input
                  type="date"
                  required
                  value={payForm.pago_em}
                  onChange={(e) => setPayForm({ ...payForm, pago_em: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Método de Pagamento</Label>
              <Select
                value={payForm.metodo}
                onValueChange={(val) => setPayForm({ ...payForm, metodo: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="convenio">Convênio</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea
                placeholder="Alguma observação sobre o pagamento..."
                rows={2}
                value={payForm.observacoes}
                onChange={(e) => setPayForm({ ...payForm, observacoes: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPayDialog({ open: false, fatura: null })}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={confirmPaymentMutation.isPending}>
                {confirmPaymentMutation.isPending ? "Confirmando..." : "Confirmar Pagamento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Editar Cobrança Dialog */}
      <Dialog
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog({ open, fatura: open ? editDialog.fatura : null })}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cobrança</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editDialog.fatura) {
                editFaturaMutation.mutate(
                  {
                    id: editDialog.fatura.id,
                    competencia: faturaForm.competencia,
                    vencimento: faturaForm.vencimento ? faturaForm.vencimento : null,
                    valor: parseFloat(faturaForm.valor.replace(",", ".")),
                    status: faturaForm.status,
                    pago_em: faturaForm.status === "paga" && faturaForm.pago_em ? faturaForm.pago_em : null,
                    observacoes: faturaForm.observacoes,
                    profissional_id: faturaForm.profissional_id || null,
                    especialidade: faturaForm.especialidade || null,
                  },
                  {
                    onSuccess: () => setEditDialog({ open: false, fatura: null }),
                  },
                );
              }
            }}
            className="space-y-4 pt-2"
          >
            <div className="space-y-1.5">
              <Label>Paciente</Label>
              <Input
                value={
                  editDialog.fatura ? patientMap.get(editDialog.fatura.paciente_id) || "—" : ""
                }
                disabled
                className="bg-muted"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Mês de Competência</Label>
                <Input
                  type="month"
                  required
                  value={faturaForm.competencia ? faturaForm.competencia.substring(0, 7) : ""}
                  onChange={(e) => setFaturaForm({ ...faturaForm, competencia: e.target.value ? e.target.value + "-01" : "" })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Data de Vencimento</Label>
                <Input
                  type="date"
                  value={faturaForm.vencimento}
                  onChange={(e) => setFaturaForm({ ...faturaForm, vencimento: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Valor (R$)</Label>
                <Input
                  required
                  placeholder="0.00"
                  value={faturaForm.valor}
                  onChange={(e) => setFaturaForm({ ...faturaForm, valor: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={faturaForm.status}
                  onValueChange={(val) => setFaturaForm((prev) => ({
                    ...prev,
                    status: val,
                    pago_em: val === "paga" && !prev.pago_em ? format(new Date(), "yyyy-MM-dd") : prev.pago_em
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aberta">Em Aberto</SelectItem>
                    <SelectItem value="paga">Pago</SelectItem>
                    <SelectItem value="vencida">Vencida</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>



            {faturaForm.status === "paga" && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <Label>Data do Pagamento</Label>
                <Input
                  type="date"
                  required
                  value={faturaForm.pago_em || format(new Date(), "yyyy-MM-dd")}
                  onChange={(e) => setFaturaForm({ ...faturaForm, pago_em: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea
                placeholder="Observações da cobrança..."
                rows={2}
                value={faturaForm.observacoes}
                onChange={(e) => setFaturaForm({ ...faturaForm, observacoes: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialog({ open: false, fatura: null })}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={editFaturaMutation.isPending}>
                {editFaturaMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Nova Cobrança Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Cobrança Manual</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!faturaForm.paciente_id) {
                toast.error("Selecione um paciente.");
                return;
              }
              createFaturaMutation.mutate(
                {
                  paciente_id: faturaForm.paciente_id,
                  competencia: faturaForm.competencia,
                  vencimento: faturaForm.vencimento ? faturaForm.vencimento : null,
                  valor: parseFloat(faturaForm.valor.replace(",", ".")),
                  status: faturaForm.status,
                  observacoes: faturaForm.observacoes,
                  profissional_id: faturaForm.profissional_id || null,
                  especialidade: faturaForm.especialidade || null,
                },
                {
                  onSuccess: () => {
                    setCreateDialog(false);
                    setFaturaForm({
                      paciente_id: "",
                      competencia: format(startOfMonth(new Date()), "yyyy-MM-dd"),
                      vencimento: "",
                      valor: "",
                      status: "aberta",
                      pago_em: "",
                      observacoes: "",
                      profissional_id: "",
                      especialidade: "",
                    });
                  },
                },
              );
            }}
            className="space-y-4 pt-2"
          >
            <div className="space-y-1.5">
              <Label>Paciente</Label>
              <Select
                value={faturaForm.paciente_id}
                onValueChange={(val) => {
                  setFaturaForm((prev) => {
                    const p = patientDetailsMap.get(val);
                    const isApoio = prev.especialidade === "Apoio" || p?.cids_secundarios?.some((s: string) => s.toLowerCase() === "apoio" || s.toUpperCase() === "AP");
                    let profId = prev.profissional_id;
                    let spec = prev.especialidade;
                    if (isApoio) {
                      spec = "Apoio";
                      if (!profId && p?.paciente_profissional?.length > 0) {
                        profId = p.paciente_profissional[0].profissional_id;
                      }
                    }
                    const price = getFaturaPrice(val, profId, spec);
                    return { 
                      ...prev, 
                      paciente_id: val, 
                      profissional_id: profId,
                      especialidade: spec,
                      valor: price > 0 ? String(price) : "" 
                    };
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o paciente..." />
                </SelectTrigger>
                <SelectContent>
                  {(pacientes || []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Mês de Competência</Label>
                <Input
                  type="date"
                  required
                  value={faturaForm.competencia}
                  onChange={(e) => setFaturaForm({ ...faturaForm, competencia: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Data de Vencimento</Label>
                <Input
                  type="date"
                  value={faturaForm.vencimento}
                  onChange={(e) => setFaturaForm({ ...faturaForm, vencimento: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Valor (R$)</Label>
                <Input
                  required
                  placeholder="0.00"
                  value={faturaForm.valor}
                  onChange={(e) => setFaturaForm({ ...faturaForm, valor: e.target.value })}
                />
                {detectedDiscount ? (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1 animate-in fade-in duration-200">
                    🏷️ Desconto de paciente aplicado: {brl(Number(detectedDiscount.valor_sessao || 0))}
                  </span>
                ) : detectedSpecialtyRate ? (
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1 mt-1 animate-in fade-in duration-200">
                    ⭐ Valor padrão da especialidade: {brl(Number(detectedSpecialtyRate.valor_sessao || 0))}
                  </span>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={faturaForm.status}
                  onValueChange={(val) => setFaturaForm({ ...faturaForm, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aberta">Em Aberto</SelectItem>
                    <SelectItem value="paga">Pago</SelectItem>
                    <SelectItem value="vencida">Vencida</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Profissional</Label>
                <Select
                  value={faturaForm.profissional_id || "none"}
                  onValueChange={(val) => {
                    const pId = val === "none" ? "" : val;
                    const prof = (profissionais || []).find((p: any) => p.id === pId);
                    const specs = prof?.especialidade
                      ? prof.especialidade.split(",").map((s: string) => s.trim()).filter(Boolean)
                      : [];
                    const currentSpec = faturaForm.especialidade;
                    const nextSpec = specs.includes(currentSpec)
                      ? currentSpec
                      : (specs.length > 0 ? specs[0] : "");
                    setFaturaForm((prev) => {
                      const price = getFaturaPrice(prev.paciente_id, pId, nextSpec);
                      return {
                        ...prev,
                        profissional_id: pId,
                        especialidade: nextSpec,
                        valor: price > 0 ? String(price) : "",
                      };
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {(profissionais || []).map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
               <div className="space-y-1.5">
                <Label>Especialidade</Label>
                <Select
                  value={faturaForm.especialidade || "none"}
                  onValueChange={(val) => {
                    const spec = val === "none" ? "" : val;
                    setFaturaForm((prev) => {
                      let profId = prev.profissional_id;
                      if (spec === "Apoio" && !profId && prev.paciente_id) {
                        const p = patientDetailsMap.get(prev.paciente_id);
                        if (p?.paciente_profissional?.length > 0) {
                          profId = p.paciente_profissional[0].profissional_id;
                        }
                      }
                      const price = getFaturaPrice(prev.paciente_id, profId, spec);
                      return {
                        ...prev,
                        especialidade: spec,
                        profissional_id: profId,
                        valor: price > 0 ? String(price) : "",
                      };
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {availableSpecialties.map((spec: string) => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea
                placeholder="Observações da cobrança..."
                rows={2}
                value={faturaForm.observacoes}
                onChange={(e) => setFaturaForm({ ...faturaForm, observacoes: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createFaturaMutation.isPending}>
                {createFaturaMutation.isPending ? "Criando..." : "Criar Cobrança"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Faturas do Paciente Dialog */}
      <Dialog
        open={patientFaturasDialog.open}
        onOpenChange={(open) =>
          setPatientFaturasDialog({
            open,
            pacienteId: open ? patientFaturasDialog.pacienteId : "",
            pacienteNome: open ? patientFaturasDialog.pacienteNome : "",
          })
        }
      >
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                Faturas de {patientFaturasDialog.pacienteNome}
              </DialogTitle>
              <div className="text-sm text-muted-foreground mt-1">
                Visualização de todas as cobranças vinculadas a este paciente.
              </div>
            </div>
            <Button
              size="sm"
              className="gap-1.5 mr-6 font-semibold cursor-pointer"
              onClick={() => {
                setFaturaForm({
                  paciente_id: patientFaturasDialog.pacienteId,
                  competencia: format(startOfMonth(new Date()), "yyyy-MM-dd"),
                  vencimento: "",
                  valor: "",
                  status: "aberta",
                  pago_em: "",
                  observacoes: "",
                  profissional_id: "",
                  especialidade: "",
                });
                setCreateDialog(true);
              }}
            >
              <Plus className="h-4 w-4" /> Nova Cobrança
            </Button>
          </DialogHeader>

          <div className="py-4">
            {patientDetailedRows.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                Nenhuma fatura cadastrada para este paciente no período selecionado.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader className="bg-muted/40 font-semibold text-foreground">
                    <TableRow>
                      <TableHead>Competência</TableHead>
                      <TableHead>Sessão / Descrição</TableHead>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Dias de Atraso</TableHead>
                      <TableHead className="w-[140px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patientDetailedRows.map((row: any) => {
                      const daysDelayed = getDaysDelayed(row.fatura);
                      return (
                        <TableRow key={row.id}>
                          <TableCell>
                            {row.competencia
                              ? format(new Date(row.competencia + "T12:00:00"), "MM/yyyy")
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-xs text-foreground break-words max-w-[320px] md:max-w-md">{row.descricao}</div>
                          </TableCell>
                          <TableCell>
                            {row.profissionalNome && row.profissionalNome !== "—" ? (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0.5 font-medium whitespace-nowrap"
                              >
                                {row.profissionalNome}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {row.vencimento
                              ? format(new Date(row.vencimento + "T12:00:00"), "dd/MM/yyyy")
                              : "—"}
                          </TableCell>
                          <TableCell className="font-semibold">{brl(Number(row.valor))}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                row.status === "paga"
                                  ? "default"
                                  : row.status === "vencida" ||
                                      (row.status === "aberta" && daysDelayed > 0)
                                    ? "destructive"
                                    : row.status === "cancelada"
                                      ? "secondary"
                                      : "outline"
                              }
                              className={
                                row.status === "paga"
                                  ? "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent"
                                  : row.status === "aberta" && daysDelayed > 0
                                    ? "bg-rose-500 hover:bg-rose-600 text-white border-transparent"
                                    : row.status === "aberta"
                                      ? "bg-sky-500 hover:bg-sky-600 text-white border-transparent"
                                      : ""
                              }
                            >
                              {row.status === "aberta" && daysDelayed > 0
                                ? "Vencida (Atrasada)"
                                : row.status === "aberta"
                                  ? "Em Aberto"
                                  : row.status === "paga"
                                    ? "Pago"
                                    : row.status === "vencida"
                                      ? "Vencida"
                                      : "Cancelada"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {row.status === "paga" ? (
                              <div className="space-y-0.5">
                                <div>
                                  {row.pago_em ? format(new Date(row.pago_em), "dd/MM/yyyy") : "—"}
                                </div>
                                <div className="font-semibold uppercase tracking-wider text-[10px] text-emerald-600 dark:text-emerald-400">
                                  {row.metodo || ""}
                                </div>
                              </div>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            {row.status === "paga" ? (
                              daysDelayed > 0 ? (
                                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                  Pago com {daysDelayed}d de atraso
                                </span>
                              ) : (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                  <Check className="h-3 w-3" /> Pago em dia
                                </span>
                              )
                            ) : row.status === "cancelada" ? (
                              "—"
                            ) : row.vencimento ? (
                              daysDelayed > 0 ? (
                                <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                                  <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {daysDelayed}{" "}
                                  dias de atraso
                                </span>
                              ) : (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> No prazo
                                </span>
                              )
                            ) : (
                              <span className="text-xs text-muted-foreground italic">
                                Sem vencimento
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div
                              className="flex justify-end gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {row.status !== "paga" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Confirmar Pagamento"
                                  className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                  onClick={async () => {
                                    if (row.isFaturaOnly || !row.item?.agendamento_id) {
                                      handleOpenConfirmPayment(row.fatura);
                                    } else {
                                      if (confirm(`Confirmar o pagamento da sessão "${row.descricao}"?`)) {
                                        await updateAppointmentStatusMutation.mutateAsync({
                                          id: row.item.agendamento_id,
                                          status: "pago",
                                        });
                                      }
                                    }
                                  }}
                                  disabled={!row.isFaturaOnly && row.item?.agendamento_id && updateAppointmentStatusMutation.isPending}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Ver Detalhes / Sessões"
                                className="h-8 w-8 text-primary hover:text-primary-foreground hover:bg-primary/5"
                                onClick={() => handleOpenInvoiceDetails(row.fatura)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Editar Cobrança"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => handleOpenEdit(row.fatura)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title={row.isFaturaOnly ? "Excluir Cobrança" : "Excluir Sessão"}
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir {row.isFaturaOnly ? "Cobrança" : "Sessão"}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {row.isFaturaOnly
                                        ? "Tem certeza que deseja excluir esta cobrança manual? Esta ação não pode ser desfeita."
                                        : `Tem certeza que deseja excluir a sessão "${row.descricao}" desta cobrança? O valor da cobrança pai será recalculado automaticamente.`}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                      onClick={() => {
                                        if (row.isFaturaOnly) {
                                          deleteFaturaMutation.mutate(row.faturaId);
                                        } else {
                                          deleteFaturaItemMutation.mutate(row.item.id);
                                        }
                                      }}
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Detalhes da Cobrança Dialog */}
      <Dialog
        open={invoiceDetailsDialog.open}
        onOpenChange={(open) =>
          setInvoiceDetailsDialog({
            open,
            fatura: open ? invoiceDetailsDialog.fatura : null,
          })
        }
      >
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <span>Detalhes da Cobrança</span>
              {activeDetailedFatura && (
                <Badge variant="outline" className="text-sm bg-primary/5">
                  {patientMap.get(activeDetailedFatura.paciente_id) || "—"}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {activeDetailedFatura && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-4">
              {/* Left Column: General Info Form */}
              <div className="lg:col-span-5 space-y-4 border-r border-border/60 pr-0 lg:pr-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Informações Gerais
                </h3>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    editFaturaMutation.mutate({
                      id: activeDetailedFatura.id,
                      competencia: detailsFaturaForm.competencia,
                      vencimento: detailsFaturaForm.vencimento ? detailsFaturaForm.vencimento : null,
                      valor: Number(activeDetailedFatura.valor) || 0,
                      status: detailsFaturaForm.status,
                      pago_em: detailsFaturaForm.status === "paga" && detailsFaturaForm.pago_em ? detailsFaturaForm.pago_em : null,
                      metodo: detailsFaturaForm.status === "paga" ? detailsFaturaForm.metodo : null,
                      observacoes: detailsFaturaForm.observacoes,
                      profissional_id: detailsFaturaForm.profissional_id || null,
                      especialidade: detailsFaturaForm.especialidade || null,
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Mês de Competência</Label>
                      <Input
                        type="month"
                        required
                        value={detailsFaturaForm.competencia ? detailsFaturaForm.competencia.substring(0, 7) : ""}
                        onChange={(e) =>
                          setDetailsFaturaForm({
                            ...detailsFaturaForm,
                            competencia: e.target.value ? e.target.value + "-01" : "",
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Vencimento</Label>
                      <Input
                        type="date"
                        value={detailsFaturaForm.vencimento}
                        onChange={(e) =>
                          setDetailsFaturaForm({
                            ...detailsFaturaForm,
                            vencimento: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Profissional Principal</Label>
                      <Select
                        value={detailsFaturaForm.profissional_id || "none"}
                        onValueChange={(val) => {
                          const pId = val === "none" ? "" : val;
                          const prof = (profissionais || []).find((p: any) => p.id === pId);
                          const specs = prof?.especialidade
                            ? prof.especialidade.split(",").map((s: string) => s.trim()).filter(Boolean)
                            : [];
                          const currentSpec = detailsFaturaForm.especialidade;
                          const nextSpec = specs.includes(currentSpec)
                            ? currentSpec
                            : (specs.length > 0 ? specs[0] : "");
                          setDetailsFaturaForm({
                            ...detailsFaturaForm,
                            profissional_id: pId,
                            especialidade: nextSpec,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {(profissionais || []).map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Especialidade Principal</Label>
                      <Select
                        value={detailsFaturaForm.especialidade || "none"}
                        onValueChange={(val) =>
                          setDetailsFaturaForm({
                            ...detailsFaturaForm,
                            especialidade: val === "none" ? "" : val,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          {detailsAvailableSpecialties.map((spec: string) => (
                            <SelectItem key={spec} value={spec}>
                              {spec}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Status</Label>
                    <Select
                      value={detailsFaturaForm.status}
                      onValueChange={(val) =>
                        setDetailsFaturaForm((prev) => ({
                          ...prev,
                          status: val,
                          pago_em: val === "paga" && !prev.pago_em ? format(new Date(), "yyyy-MM-dd") : prev.pago_em,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aberta">Em Aberto</SelectItem>
                        <SelectItem value="paga">Pago</SelectItem>
                        <SelectItem value="vencida">Vencida</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {detailsFaturaForm.status === "paga" && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Data do Pagamento</Label>
                        <Input
                          type="date"
                          required
                          value={detailsFaturaForm.pago_em || format(new Date(), "yyyy-MM-dd")}
                          onChange={(e) =>
                            setDetailsFaturaForm({ ...detailsFaturaForm, pago_em: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Método</Label>
                        <Select
                          value={detailsFaturaForm.metodo || "pix"}
                          onValueChange={(val) =>
                            setDetailsFaturaForm({ ...detailsFaturaForm, metodo: val })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pix">PIX</SelectItem>
                            <SelectItem value="dinheiro">Dinheiro</SelectItem>
                            <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                            <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                            <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                            <SelectItem value="boleto">Boleto</SelectItem>
                            <SelectItem value="convenio">Convênio</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Observações</Label>
                    <Textarea
                      placeholder="Observações da cobrança..."
                      rows={2}
                      value={detailsFaturaForm.observacoes}
                      onChange={(e) =>
                        setDetailsFaturaForm({ ...detailsFaturaForm, observacoes: e.target.value })
                      }
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full font-semibold"
                    disabled={editFaturaMutation.isPending}
                  >
                    {editFaturaMutation.isPending ? "Salvando..." : "Salvar Informações Gerais"}
                  </Button>
                </form>
              </div>

              {/* Right Column: Sessions List, Edit and Add */}
              <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Sessões e Itens Faturados
                    </h3>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground block font-semibold uppercase">
                        Valor Total
                      </span>
                      <span className="text-2xl font-bold text-primary">
                        {brl(Number(activeDetailedFatura.valor) || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Sessions Table */}
                  <div className="border border-border rounded-lg overflow-hidden bg-card/50">
                    <Table>
                      <TableHeader className="bg-muted/40 font-semibold">
                        <TableRow>
                          <TableHead>Descrição da Sessão</TableHead>
                          <TableHead className="w-[120px]">Valor (R$)</TableHead>
                          <TableHead className="w-[130px]">Status</TableHead>
                          <TableHead className="w-[100px] text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          let items = faturaItens.filter((item: any) => item.fatura_id === activeDetailedFatura.id);
                          if (activeDetailedFatura.especialidade === "Apoio") {
                            items = items.filter((item: any) => !item.agendamento_id);
                          }
                          const sortedItems = items.sort((a: any, b: any) => {
                            const dateA = a.agendamento_id ? agendamentoDateMap.get(a.agendamento_id) : null;
                            const dateB = b.agendamento_id ? agendamentoDateMap.get(b.agendamento_id) : null;
                            if (dateA && dateB) {
                              return new Date(dateA).getTime() - new Date(dateB).getTime();
                            }
                            return (a.descricao || "").localeCompare(b.descricao || "");
                          });
                          if (sortedItems.length === 0) {
                            return (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-6 text-xs text-muted-foreground italic">
                                  Nenhuma sessão faturada vinculada. A cobrança é manual ou está sem itens.
                                </TableCell>
                              </TableRow>
                            );
                          }
                          return sortedItems.map((item: any) => {
                            const isEditing = editingItemId === item.id;
                            const appStatus = item.agendamento_id ? agendamentoStatusMap.get(item.agendamento_id) : null;
                            return (
                              <TableRow key={item.id} className="hover:bg-muted/10">
                                <TableCell>
                                  {isEditing ? (
                                    <Input
                                      value={editingItemDesc}
                                      onChange={(e) => setEditingItemDesc(e.target.value)}
                                      className="h-8 text-xs"
                                    />
                                  ) : (
                                    <span className="text-xs font-semibold text-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/50">
                                      {item.descricao}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isEditing ? (
                                    <Input
                                      value={editingItemVal}
                                      onChange={(e) => setEditingItemVal(e.target.value)}
                                      placeholder="0.00"
                                      className="h-8 text-xs font-semibold"
                                    />
                                  ) : (
                                    <span className="text-xs font-semibold text-foreground">
                                      {brl(Number(item.total) || 0)}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isEditing && item.agendamento_id ? (
                                    <Select
                                      value={editingItemStatus}
                                      onValueChange={setEditingItemStatus}
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="realizado">Realizado</SelectItem>
                                        <SelectItem value="pago">Pago</SelectItem>
                                        <SelectItem value="falta">Falta</SelectItem>
                                        <SelectItem value="confirmado">Confirmado</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : item.agendamento_id ? (
                                    <Badge
                                      variant={
                                        appStatus === "pago"
                                          ? "default"
                                          : appStatus === "falta"
                                            ? "destructive"
                                            : "outline"
                                      }
                                      className={
                                        appStatus === "pago"
                                          ? "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent text-[10px] px-1.5 py-0.5"
                                          : appStatus === "realizado"
                                            ? "bg-sky-500 hover:bg-sky-600 text-white border-transparent text-[10px] px-1.5 py-0.5"
                                            : appStatus === "falta"
                                              ? "bg-rose-500 hover:bg-rose-600 text-white border-transparent text-[10px] px-1.5 py-0.5"
                                              : "text-[10px] px-1.5 py-0.5"
                                      }
                                    >
                                      {appStatus === "pago"
                                        ? "Pago"
                                        : appStatus === "realizado"
                                          ? "Realizado"
                                          : appStatus === "falta"
                                            ? "Falta"
                                            : appStatus || "—"}
                                    </Badge>
                                  ) : (
                                    <span className="text-xs text-muted-foreground italic">Manual</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    {isEditing ? (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                          onClick={async () => {
                                            const val = parseFloat(editingItemVal.replace(",", "."));
                                            if (isNaN(val) || val < 0) {
                                              toast.error("Valor inválido.");
                                              return;
                                            }
                                            if (!editingItemDesc.trim()) {
                                              toast.error("Descrição é obrigatória.");
                                              return;
                                            }
                                            try {
                                              if (item.agendamento_id && editingItemStatus && editingItemStatus !== appStatus) {
                                                await updateAppointmentStatusMutation.mutateAsync({
                                                  id: item.agendamento_id,
                                                  status: editingItemStatus,
                                                });
                                              }
                                              await editFaturaItemMutation.mutateAsync({
                                                id: item.id,
                                                descricao: editingItemDesc,
                                                valor_unitario: val,
                                              });
                                              setEditingItemId(null);
                                            } catch (err) {
                                              // Handled by query mutation onError
                                            }
                                          }}
                                          disabled={editFaturaItemMutation.isPending || updateAppointmentStatusMutation.isPending}
                                        >
                                          <Check className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                          onClick={() => setEditingItemId(null)}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                          onClick={() => {
                                            setEditingItemId(item.id);
                                            setEditingItemDesc(item.descricao || "");
                                            setEditingItemVal(String(item.valor_unitario || item.total || 0));
                                            setEditingItemStatus(appStatus || "");
                                          }}
                                        >
                                          <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                          onClick={() => {
                                            if (
                                              confirm(
                                                `Tem certeza que deseja excluir a sessão "${item.descricao}" desta cobrança?`
                                              )
                                            ) {
                                              deleteFaturaItemMutation.mutate(item.id);
                                            }
                                          }}
                                          disabled={deleteFaturaItemMutation.isPending}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          });
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Add Session Form */}
                <div className="border border-border/80 bg-muted/20 p-3 rounded-lg space-y-2 mt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Adicionar Sessão / Item Manual
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-8">
                      <Input
                        placeholder="Ex: Psicoterapia - 24/06/2026 16:00"
                        value={newItemDesc}
                        onChange={(e) => setNewItemDesc(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <Input
                        placeholder="0.00"
                        value={newItemVal}
                        onChange={(e) => setNewItemVal(e.target.value)}
                        className="h-9 text-xs font-semibold"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <Button
                        type="button"
                        size="icon"
                        className="h-9 w-full sm:w-9"
                        onClick={() => {
                          const val = parseFloat(newItemVal.replace(",", "."));
                          if (isNaN(val) || val < 0) {
                            toast.error("Valor inválido.");
                            return;
                          }
                          if (!newItemDesc.trim()) {
                            toast.error("Descrição é obrigatória.");
                            return;
                          }
                          createFaturaItemMutation.mutate({
                            fatura_id: activeDetailedFatura.id,
                            descricao: newItemDesc,
                            valor_unitario: val,
                          }, {
                            onSuccess: () => {
                              setNewItemDesc("");
                              setNewItemVal("");
                            }
                          });
                        }}
                        disabled={createFaturaItemMutation.isPending}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {detectedDetailsDiscount && (
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 animate-in fade-in duration-200">
                      🏷️ Desconto de paciente aplicado: {brl(Number(detectedDetailsDiscount.valor_sessao || 0))}
                    </div>
                  )}
                  {detectedDetailsSpecialtyRate && (
                    <div className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold mt-1 animate-in fade-in duration-200">
                      ⭐ Valor padrão da especialidade: {brl(Number(detectedDetailsSpecialtyRate.valor_sessao || 0))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DiretoriaPage() {
  const { loading } = useAuth();
  const [unlocked, setUnlocked] = useState(() => {
    if (typeof window !== "undefined") {
      return window.sessionStorage.getItem("diretoria_unlocked") === "true";
    }
    return false;
  });

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!unlocked) {
    return (
      <PasswordGate
        onUnlock={() => {
          setUnlocked(true);
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem("diretoria_unlocked", "true");
          }
        }}
      />
    );
  }

  return <DiretoriaPageContent />;
}
