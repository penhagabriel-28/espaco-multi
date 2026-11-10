import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  GripVertical,
  Users,
  Calendar,
  Loader2,
  MessageCircle,
  Clock,
  Search,
  CheckCircle2,
  Phone,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { format, addMonths, startOfMonth, endOfMonth, differenceInDays, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, isProfissionalAdmin, isProfissionalClinico, isProfActiveInPeriod } from "@/lib/utils";
import { formatBirthDateForDisplay } from "@/components/PacienteFormDialog";

export const Route = createFileRoute("/_app/profissionais")({
  component: ProfissionaisPage,
});

const CORES = [
  "#3b82f6",
  "#fb923c",
  "#10b981",
  "#a78bfa",
  "#ec4899",
  "#f59e0b",
  "#06b6d4",
  "#ef4444",
];

const PLANOS_AP = [
  { label: "1x na semana: R$ 240,00", value: "240" },
  { label: "2x na semana: R$ 360,00", value: "360" },
  { label: "Semana inteira: R$ 450,00", value: "450" },
];

const formatDisplayValue = (val: any) => {
  if (val === undefined || val === null || val === "") return "0";
  const num = Number(val);
  return isNaN(num) ? "0" : num.toFixed(0);
};

function ProfissionaisPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const [feriasOpen, setFeriasOpen] = useState(false);
  const [feriasStart, setFeriasStart] = useState("");
  const [feriasEnd, setFeriasEnd] = useState("");
  const [selectedProfForFerias, setSelectedProfForFerias] = useState<any>(null);

  const applyProfFeriasMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProfForFerias || !feriasStart || !feriasEnd) {
        throw new Error("Selecione o período de férias");
      }
      const startIso = new Date(feriasStart + "T00:00:00").toISOString();
      const endIso = new Date(feriasEnd + "T23:59:59").toISOString();

      const { error } = await supabase
        .from("agendamentos")
        .update({ status: "ferias" })
        .eq("profissional_id", selectedProfForFerias.id)
        .gte("data_inicio", startIso)
        .lte("data_inicio", endIso);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Férias do profissional aplicadas com sucesso!");
      setFeriasOpen(false);
      qc.invalidateQueries({ queryKey: ["profissionais-agendamentos"] });
    },
    onError: (err: any) => {
      toast.error("Erro ao aplicar férias: " + err.message);
    }
  });

  const handleApplyProfFerias = () => {
    if (!feriasStart || !feriasEnd) {
      toast.error("Por favor, informe a data de início e fim.");
      return;
    }
    applyProfFeriasMutation.mutate();
  };

  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), "yyyy-MM"));

  const monthOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    for (let i = -6; i <= 3; i++) {
      const d = addMonths(today, i);
      const value = format(d, "yyyy-MM");
      const label = format(d, "MMMM 'de' yyyy", { locale: ptBR });
      options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return options;
  }, []);

  const startOfSelectedMonth = useMemo(() => {
    if (!selectedMonth || typeof selectedMonth !== "string" || !selectedMonth.includes("-")) {
      return startOfMonth(new Date());
    }
    const [year, month] = selectedMonth.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);
    return isNaN(d.getTime()) ? startOfMonth(new Date()) : startOfMonth(d);
  }, [selectedMonth]);

  const endOfSelectedMonth = useMemo(() => {
    if (!selectedMonth || typeof selectedMonth !== "string" || !selectedMonth.includes("-")) {
      return endOfMonth(new Date());
    }
    const [year, month] = selectedMonth.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);
    return isNaN(d.getTime()) ? endOfMonth(new Date()) : endOfMonth(d);
  }, [selectedMonth]);

  const {
    data: agendamentos = [],
    isLoading: loadingAgendamentos,
    isError: errorAgendamentos,
    refetch: refetchAgendamentos,
  } = useQuery({
    queryKey: ["profissionais-agendamentos", selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select("id, profissional_id, status")
        .gte("data_inicio", startOfSelectedMonth.toISOString())
        .lte("data_inicio", endOfSelectedMonth.toISOString());
      if (error) throw error;
      return data ?? [];
    },
  });

  const {
    data = [],
    isLoading: loadingProfs,
    isError: errorProfs,
    refetch: refetchProfs,
  } = useQuery({
    queryKey: ["profissionais"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profissionais")
        .select("*")
        .order("cor")
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });

  const {
    data: pacientes = [],
    isLoading: loadingPacientes,
    isError: errorPacientes,
    refetch: refetchPacientes,
  } = useQuery({
    queryKey: ["pacientes-nomes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pacientes").select("id, nome");
      if (error) throw error;
      return data ?? [];
    },
  });

  const {
    data: pacienteProfissional = [],
    isLoading: loadingPP,
    isError: errorPP,
    refetch: refetchPP,
  } = useQuery({
    queryKey: ["paciente-profissional"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paciente_profissional")
        .select("paciente_id, profissional_id, pacientes(nome)");
      if (error) throw error;
      return data ?? [];
    },
  });

  const isLoading = loadingAgendamentos || loadingProfs || loadingPacientes || loadingPP;
  const isError = errorAgendamentos || errorProfs || errorPacientes || errorPP;

  const handleRetry = () => {
    refetchAgendamentos();
    refetchProfs();
    refetchPacientes();
    refetchPP();
  };

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profissionais").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profissional removido");
      qc.invalidateQueries({ queryKey: ["profissionais"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const [orderIds, setOrderIds] = useState<string[]>(() => {
    try {
      const savedOrder = localStorage.getItem("profissionais_ordem");
      const parsed = savedOrder ? JSON.parse(savedOrder) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Error parsing profissionais_ordem from localStorage:", e);
      return [];
    }
  });

  const navigate = useNavigate();
  const [tabFilter, setTabFilter] = useState<"todos" | "clinicos" | "administrativo" | "espera">("todos");
  const [filaSearch, setFilaSearch] = useState("");
  const [filaProfFilter, setFilaProfFilter] = useState("all");
  const [filaSpecFilter, setFilaSpecFilter] = useState("all");

  const {
    data: pacientesFila = [],
    isLoading: loadingFila,
    refetch: refetchFila,
  } = useQuery({
    queryKey: ["pacientes-fila-espera"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pacientes")
        .select("id, nome, data_nascimento, cid_principal, cids_secundarios, status, tipo_atendimento, convenio_nome, observacoes, created_at")
        .or("status.eq.lista_espera,status.eq.espera")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60 * 1000,
  });

  const { data: responsaveisFila = [] } = useQuery({
    queryKey: ["responsaveis-fila-espera"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("responsaveis")
        .select("id, paciente_id, nome, parentesco, telefone, whatsapp, email");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60 * 1000,
  });

  const responsavelByPacienteMap = useMemo(() => {
    const map = new Map<string, any>();
    responsaveisFila.forEach((r: any) => {
      if (!map.has(r.paciente_id)) {
        map.set(r.paciente_id, r);
      }
    });
    return map;
  }, [responsaveisFila]);

  const profsByPacienteMap = useMemo(() => {
    const map = new Map<string, any[]>();
    (pacienteProfissional || []).forEach((pp: any) => {
      const prof = (data || []).find((pr: any) => pr.id === pp.profissional_id);
      if (prof) {
        const list = map.get(pp.paciente_id) || [];
        list.push(prof);
        map.set(pp.paciente_id, list);
      }
    });
    return map;
  }, [pacienteProfissional, data]);

  const allFilaSpecs = useMemo(() => {
    const set = new Set<string>();
    pacientesFila.forEach((p: any) => {
      if (p.cid_principal) set.add(p.cid_principal);
      if (Array.isArray(p.cids_secundarios)) {
        p.cids_secundarios.forEach((s: string) => {
          if (s) set.add(s);
        });
      }
    });
    return Array.from(set).sort();
  }, [pacientesFila]);

  const filteredFila = useMemo(() => {
    let list = pacientesFila;

    if (filaProfFilter !== "all") {
      list = list.filter((p: any) => {
        const profs = profsByPacienteMap.get(p.id) || [];
        return profs.some((pr: any) => pr.id === filaProfFilter);
      });
    }

    if (filaSpecFilter !== "all") {
      list = list.filter((p: any) => {
        const specs = [p.cid_principal, ...(Array.isArray(p.cids_secundarios) ? p.cids_secundarios : [])].filter(Boolean);
        return specs.some((s: string) => s.toLowerCase() === filaSpecFilter.toLowerCase());
      });
    }

    if (filaSearch.trim()) {
      const term = filaSearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      list = list.filter((p: any) => {
        const pNorm = (p.nome || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const resp = responsavelByPacienteMap.get(p.id);
        const rNorm = (resp?.nome || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const telNorm = (resp?.telefone || resp?.whatsapp || "").replace(/\D/g, "");
        return pNorm.includes(term) || rNorm.includes(term) || telNorm.includes(term);
      });
    }

    return list;
  }, [pacientesFila, filaProfFilter, filaSpecFilter, filaSearch, profsByPacienteMap, responsavelByPacienteMap]);

  const handleContactWhatsApp = (paciente: any, responsavel: any, profs: any[]) => {
    const phone = responsavel?.whatsapp || responsavel?.telefone;
    if (!phone) {
      toast.error(`Nenhum telefone cadastrado para o responsável de ${paciente.nome}.`);
      return;
    }

    const cleanNum = String(phone).replace(/\D/g, "");
    if (!cleanNum) {
      toast.error("Número de telefone inválido.");
      return;
    }

    const phoneWithCountry = cleanNum.length === 10 || cleanNum.length === 11 ? `55${cleanNum}` : cleanNum;

    const profNames = profs.map((p: any) => p.nome).join(", ");
    const profPart = profNames ? ` com o(a) profissional *${profNames}*` : "";
    const specs = [paciente.cid_principal, ...(Array.isArray(paciente.cids_secundarios) ? paciente.cids_secundarios : [])].filter(Boolean);
    const specPart = specs.length > 0 ? ` na área de *${specs.join(", ")}*` : "";

    const greeting = responsavel?.nome ? `Olá ${responsavel.nome}!` : "Olá!";
    const textMsg = `${greeting} Aqui é da equipe da *Clínica Espaço Multi*. 🏥\n\nEstamos entrando em contato sobre a lista de espera do(a) paciente *${paciente.nome}*${profPart || specPart}.\n\n✨ *Uma vaga foi liberada!* Poderia confirmar se você ainda tem interesse para realizarmos o agendamento?`;

    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(textMsg)}`;
    window.open(url, "_blank");
  };

  const activatePatientMutation = useMutation({
    mutationFn: async (pacienteId: string) => {
      const { error } = await supabase
        .from("pacientes")
        .update({ status: "ativo" })
        .eq("id", pacienteId);
      if (error) throw error;
    },
    onSuccess: (_, pacienteId) => {
      const p = pacientesFila.find((item: any) => item.id === pacienteId);
      toast.success(`${p?.nome || "Paciente"} foi ativado(a) com sucesso e saiu da fila de espera!`);
      qc.invalidateQueries({ queryKey: ["pacientes-fila-espera"] });
      qc.invalidateQueries({ queryKey: ["pacientes"] });
      qc.invalidateQueries({ queryKey: ["prof-pacientes"] });
    },
    onError: (err: any) => {
      toast.error("Erro ao ativar paciente: " + err.message);
    },
  });

  const activeDataInMonth = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    return data.filter((p) => isProfActiveInPeriod(p, selectedMonth, selectedMonth, true));
  }, [data, selectedMonth]);

  const orderedData = useMemo(() => {
    if (!activeDataInMonth.length) return [];
    if (!orderIds.length) return activeDataInMonth;
    return [...activeDataInMonth].sort((a, b) => {
      const idxA = orderIds.indexOf(a.id);
      const idxB = orderIds.indexOf(b.id);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }, [activeDataInMonth, orderIds]);

  const filteredOrderedData = useMemo(() => {
    if (!Array.isArray(orderedData)) return [];
    if (tabFilter === "clinicos") {
      return orderedData.filter((p) => isProfissionalClinico(p));
    }
    if (tabFilter === "administrativo") {
      return orderedData.filter((p) => isProfissionalAdmin(p));
    }
    return orderedData;
  }, [orderedData, tabFilter]);

  const totalClinicos = useMemo(
    () => (orderedData || []).filter((p) => isProfissionalClinico(p)).length,
    [orderedData],
  );
  const totalAdmin = useMemo(
    () => (orderedData || []).filter((p) => isProfissionalAdmin(p)).length,
    [orderedData],
  );

  const aniversariantesDoMes = useMemo(() => {
    if (!Array.isArray(activeDataInMonth)) return [];
    const currentMonthNum = new Date().getMonth() + 1;
    const currentDayNum = new Date().getDate();

    return activeDataInMonth
      .map((p: any) => {
        const dateStr = p.data_nascimento || (p.valores_config as any)?.data_nascimento;
        if (!dateStr || typeof dateStr !== "string") return null;
        const parts = dateStr.split("-");
        if (parts.length !== 3) return null;
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        if (month !== currentMonthNum) return null;

        const isToday = day === currentDayNum;
        return {
          id: p.id,
          nome: p.nome,
          especialidade: p.especialidade,
          cor: p.cor,
          dia: day,
          dataNascimento: dateStr,
          isToday,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.dia - b!.dia);
  }, [activeDataInMonth]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando profissionais...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[50vh] items-center justify-center animate-in fade-in duration-300">
        <Card className="max-w-md w-full border-destructive/20 shadow-lg">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
              <span className="font-bold text-xl">!</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg text-foreground">Erro ao carregar profissionais</h3>
              <p className="text-xs text-muted-foreground">
                Não foi possível carregar os dados dos profissionais do banco de dados. Verifique a sua conexão ou tente novamente.
              </p>
            </div>
            <Button onClick={handleRetry} className="w-full h-9 text-xs">
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData("text/plain");
    if (!sourceIndexStr) return;
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (sourceIndex === targetIndex) return;

    const items = [...orderedData];
    const [reorderedItem] = items.splice(sourceIndex, 1);
    items.splice(targetIndex, 0, reorderedItem);

    const orderIds = items.map((p) => p.id);
    setOrderIds(orderIds);
    localStorage.setItem("profissionais_ordem", JSON.stringify(orderIds));
  };

  const renderFilaEsperaView = () => {
    return (
      <div className="space-y-4 animate-in fade-in duration-200">
        {/* Banner informativo da Fila */}
        <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-base shrink-0">
                  ⏳
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    Fila de Espera — Ordem de Chegada
                    <Badge variant="outline" className="text-xs font-bold border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300">
                      {pacientesFila.length} {pacientesFila.length === 1 ? "paciente" : "pacientes"}
                    </Badge>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pacientes ordenados do primeiro ao mais recente na fila. Utilize o botão do WhatsApp para avisar a família imediatamente assim que uma vaga abrir.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 shrink-0 self-start sm:self-auto"
                onClick={() => navigate({ to: "/pacientes" })}
              >
                <Plus className="h-3.5 w-3.5" /> Cadastrar Paciente na Fila
              </Button>
            </div>

            {/* Filtros da Fila */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-border/40">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  placeholder="Buscar por paciente, responsável ou telefone..."
                  value={filaSearch}
                  onChange={(e) => setFilaSearch(e.target.value)}
                  className="h-8 text-xs pl-8"
                />
              </div>

              <Select value={filaProfFilter} onValueChange={setFilaProfFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Filtrar por profissional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    Todos os Profissionais
                  </SelectItem>
                  {(data || []).map((prof: any) => (
                    <SelectItem key={prof.id} value={prof.id} className="text-xs">
                      {prof.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filaSpecFilter} onValueChange={setFilaSpecFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Filtrar por especialidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    Todas as Especialidades
                  </SelectItem>
                  {allFilaSpecs.map((spec: string) => (
                    <SelectItem key={spec} value={spec} className="text-xs">
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Pacientes na Fila */}
        {loadingFila ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredFila.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-2">
              <p className="text-base">🎉</p>
              <p className="text-sm font-medium text-foreground">
                {pacientesFila.length === 0
                  ? "Nenhum paciente aguardando na lista de espera no momento."
                  : "Nenhum paciente encontrado com os filtros selecionados."}
              </p>
              <p className="text-xs text-muted-foreground">
                Ao cadastrar um novo paciente na aba "Pacientes" com o status "Lista de espera", ele aparecerá aqui automaticamente ordenado por chegada.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFila.map((paciente: any, index: number) => {
              const resp = responsavelByPacienteMap.get(paciente.id);
              const profs = profsByPacienteMap.get(paciente.id) || [];
              const rawDate = paciente.created_at ? new Date(paciente.created_at) : null;
              const daysWaiting = rawDate ? differenceInDays(new Date(), rawDate) : 0;
              const formattedDate = rawDate ? format(rawDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "Data não informada";
              const age = paciente.data_nascimento ? differenceInYears(new Date(), new Date(paciente.data_nascimento)) : null;

              const isFirst = index === 0;
              const isTopThree = index < 3;

              return (
                <Card
                  key={paciente.id}
                  className={cn(
                    "relative flex flex-col justify-between border transition-all hover:shadow-md",
                    isFirst
                      ? "border-amber-500 bg-amber-500/[0.04] dark:bg-amber-950/20 shadow-xs ring-1 ring-amber-500/30"
                      : "border-border/80 bg-card"
                  )}
                >
                  <CardContent className="p-4 flex flex-col flex-1 justify-between gap-3">
                    <div className="space-y-3">
                      {/* Top Header: Rank + Name */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <Badge
                            className={cn(
                              "text-xs font-bold px-2 py-0.5 shrink-0 rounded-md shadow-xs",
                              isFirst
                                ? "bg-amber-500 text-white hover:bg-amber-600"
                                : isTopThree
                                ? "bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-500/40"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            #{index + 1} na Fila
                          </Badge>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-sm text-foreground truncate leading-tight">
                              {paciente.nome}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                              {age !== null ? (
                                <span>{age} anos ({formatBirthDateForDisplay(paciente.data_nascimento)})</span>
                              ) : (
                                <span>Idade não informada</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 font-medium shrink-0"
                        >
                          ⏳ Espera
                        </Badge>
                      </div>

                      {/* Chegada & Tempo na fila */}
                      <div className="p-2 rounded-md bg-muted/40 border border-border/50 text-[11px] space-y-1">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-amber-600" /> Entrada na fila:
                          </span>
                          <span className="font-medium text-foreground">{formattedDate}</span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Tempo aguardando:</span>
                          <span className={cn(
                            "font-semibold",
                            daysWaiting > 30 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
                          )}>
                            {daysWaiting === 0 ? "Hoje" : `${daysWaiting} ${daysWaiting === 1 ? "dia" : "dias"}`}
                          </span>
                        </div>
                      </div>

                      {/* Especialidades / CID */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                          Especialidade / Demanda:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {paciente.cid_principal ? (
                            <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                              {paciente.cid_principal}
                            </Badge>
                          ) : null}
                          {Array.isArray(paciente.cids_secundarios) &&
                            paciente.cids_secundarios.map((cid: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-[10px] bg-muted/70 text-muted-foreground">
                                {cid}
                              </Badge>
                            ))}
                          {!paciente.cid_principal && (!paciente.cids_secundarios || paciente.cids_secundarios.length === 0) && (
                            <span className="text-[11px] text-muted-foreground italic">Não especificada</span>
                          )}
                        </div>
                      </div>

                      {/* Profissional Vinculado / Solicitado */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                          Profissional Solicitado:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {profs.length > 0 ? (
                            profs.map((pr: any) => (
                              <Badge
                                key={pr.id}
                                variant="outline"
                                className="text-[10px] bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25 gap-1"
                              >
                                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: pr.cor || "#0ea5e9" }} />
                                {pr.nome}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">Qualquer profissional disponível</span>
                          )}
                        </div>
                      </div>

                      {/* Responsável & Contato */}
                      <div className="p-2.5 rounded-md border border-border/50 bg-background/50 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                            Responsável:
                          </span>
                          <span className="font-medium text-foreground truncate max-w-[150px]">
                            {resp?.nome || "Não informado"} {resp?.parentesco ? `(${resp.parentesco})` : ""}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> Telefone:
                          </span>
                          <span className="font-mono font-medium text-foreground">
                            {resp?.whatsapp || resp?.telefone || "Sem contato"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="pt-2 border-t border-border/40 space-y-2">
                      <Button
                        type="button"
                        className="w-full h-8 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        onClick={() => handleContactWhatsApp(paciente, resp, profs)}
                      >
                        <MessageCircle className="h-4 w-4" /> Chamar WhatsApp (Vaga Aberta)
                      </Button>

                      <div className="grid grid-cols-2 gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] gap-1 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                          onClick={() => {
                            if (confirm(`Deseja efetivar a vaga e ativar ${paciente.nome}? Ele(a) sairá da fila de espera.`)) {
                              activatePatientMutation.mutate(paciente.id);
                            }
                          }}
                          disabled={activatePatientMutation.isPending}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Efetivar Vaga
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                          onClick={() => navigate({ to: "/pacientes" })}
                        >
                          <ExternalLink className="h-3 w-3" /> Ver Cadastro
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border/80 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) setEditing(null);
          }}
        >
          <Button
            type="button"
            className="gap-1.5 h-9 text-xs self-end sm:self-auto"
            onClick={() => setOpen(true)}
          >
            <Plus className="h-4 w-4" /> Novo profissional
          </Button>
          {open && (
            <ProfForm
              prof={editing}
              onSaved={() => {
                setOpen(false);
                setEditing(null);
                qc.invalidateQueries({ queryKey: ["profissionais"] });
              }}
            />
          )}
        </Dialog>
      </div>

      {/* Filter Tabs for Clinicos vs Administrativo */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/60 rounded-lg w-fit border border-border/50 text-xs">
        <Button
          variant={tabFilter === "todos" ? "default" : "ghost"}
          size="sm"
          className="h-7 text-xs font-medium px-3"
          onClick={() => setTabFilter("todos")}
        >
          Todos ({orderedData.length})
        </Button>
        <Button
          variant={tabFilter === "clinicos" ? "default" : "ghost"}
          size="sm"
          className="h-7 text-xs font-medium px-3 gap-1.5"
          onClick={() => setTabFilter("clinicos")}
        >
          <span>🩺</span> Clínicos / Terapeutas ({totalClinicos})
        </Button>
        <Button
          variant={tabFilter === "administrativo" ? "default" : "ghost"}
          size="sm"
          className="h-7 text-xs font-medium px-3 gap-1.5"
          onClick={() => setTabFilter("administrativo")}
        >
          <span>💼</span> Administrativo ({totalAdmin})
        </Button>
        <Button
          variant={tabFilter === "espera" ? "default" : "ghost"}
          size="sm"
          className={cn(
            "h-7 text-xs font-medium px-3 gap-1.5",
            tabFilter === "espera"
              ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs font-semibold"
              : "text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/30"
          )}
          onClick={() => setTabFilter("espera")}
        >
          <span>⏳</span> Fila de Espera ({pacientesFila.length})
        </Button>
      </div>

      {tabFilter === "espera" ? (
        renderFilaEsperaView()
      ) : (
        <>
          {aniversariantesDoMes.length > 0 && (
        <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-orange-500/5 dark:from-amber-950/20 dark:to-orange-950/20 shadow-sm">
          <CardContent className="p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🎂</span>
              <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                Aniversariantes do Mês (Equipe)
              </h3>
              <Badge variant="secondary" className="ml-auto text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 capitalize">
                {format(new Date(), "MMMM", { locale: ptBR })}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {aniversariantesDoMes.map((prof: any) => (
                <div
                  key={prof.id}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border bg-card/90 text-xs shadow-xs transition-all",
                    prof.isToday && "border-amber-500 bg-amber-50/90 dark:bg-amber-950/60 ring-2 ring-amber-500/40"
                  )}
                >
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: prof.cor || "var(--primary)" }}
                  />
                  <span className="font-medium text-foreground">{prof.nome}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] h-4 px-1.5 font-normal",
                      prof.isToday
                        ? "bg-amber-500 text-white font-semibold border-amber-500"
                        : "bg-muted/60"
                    )}
                  >
                    {prof.isToday ? "Hoje! 🎉" : `Dia ${prof.dia}`}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {data.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhum profissional cadastrado.
          </CardContent>
        </Card>
      ) : filteredOrderedData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {tabFilter === "administrativo"
              ? "Nenhum profissional administrativo cadastrado."
              : "Nenhum profissional clínico cadastrado."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          {filteredOrderedData.map((p, idx) => {
            const isAdm = isProfissionalAdmin(p);
            return (
              <Card
                key={p.id}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, idx)}
                className={cn(
                  "cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow relative group h-full flex flex-col",
                  isAdm && "border-indigo-500/20 bg-gradient-to-b from-indigo-500/[0.03] to-transparent",
                )}
              >
                <CardContent className="p-4 flex flex-col flex-1 justify-between">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  {/* Upper block with all details */}
                  <div className="space-y-3 flex-1 flex flex-col justify-start">
                    {/* Header (avatar + name + status) */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className="h-10 w-10 shrink-0 rounded-full border border-border/20 shadow-sm flex items-center justify-center text-white font-bold text-xs"
                          style={{ background: p.cor || "var(--primary)" }}
                        >
                          {isAdm ? "💼" : (p.nome?.[0] || "P")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold text-sm text-foreground">{p.nome}</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {isAdm ? (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-2 py-0.5 font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 gap-1"
                              >
                                <span>💼</span> {(p as any).cargo || (p.valores_config as any)?.cargo || p.especialidade || "Administrativo"}
                              </Badge>
                            ) : p.especialidade ? (
                              p.especialidade
                                .split(",")
                                .map((s: string) => s.trim())
                                .filter(Boolean)
                                .map((esp: string) => (
                                   <Badge
                                    key={esp}
                                    variant="outline"
                                    className="text-[9px] px-1.5 py-0 font-medium bg-primary/5 border-primary/20 text-primary"
                                  >
                                    {esp}
                                  </Badge>
                                ))
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {p.valores_config && (p.valores_config as any).ativo_ate && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/40 font-medium">
                            Ativo até: {String((p.valores_config as any).ativo_ate).split("-").reverse().join("/")}
                          </span>
                        )}
                        <Badge
                          variant={isProfActiveInPeriod(p, selectedMonth, selectedMonth, true) ? "default" : "secondary"}
                          onDragStart={(e) => e.stopPropagation()}
                          className="shrink-0 text-[10px] h-5 px-1.5"
                        >
                          {isProfActiveInPeriod(p, selectedMonth, selectedMonth, true) ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>

                    {/* Details Box */}
                    {isAdm ? (
                      <div className="space-y-2 text-[11px] text-muted-foreground bg-indigo-500/5 dark:bg-indigo-950/20 p-2.5 rounded border border-indigo-500/20 mt-1">
                        <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                          <span className="truncate">Função: {(p as any).cargo || (p.valores_config as any)?.cargo || p.especialidade || "Administrativo"}</span>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal shrink-0">
                            Equipe Interna
                          </span>
                        </div>
                        <p className="text-[10.5px] text-muted-foreground">
                          Membro administrativo • Não participa de agendamento de consultas.
                        </p>
                        {(p.email || p.telefone) && (
                          <div className="pt-1.5 border-t border-indigo-500/10 space-y-0.5 text-[11px] text-foreground/80">
                            {p.email && <div className="truncate">✉️ {p.email}</div>}
                            {p.telefone && <div>📞 {p.telefone}</div>}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1 text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded border border-border/40 mt-1">
                        {p.valores_config && Array.isArray((p.valores_config as any).especialidades) && (p.valores_config as any).especialidades.length > 0 ? (
                          (p.valores_config as any).especialidades
                            .filter((esp: any) => {
                              if (!esp || !esp.nome) return false;
                              const activeSpecs = p.especialidade
                                ? p.especialidade
                                    .split(",")
                                    .map((s: string) => s.trim().toLowerCase())
                                : [];
                              return activeSpecs.includes(String(esp.nome).toLowerCase());
                            })
                            .slice(0, 2)
                            .map((esp: any, espIdx: number) => {
                              const espNomeUpper = String(esp?.nome || "").toUpperCase();
                              if (espNomeUpper === "AP") {
                                const plano = PLANOS_AP.find(
                                  (pl) => pl.value === String(esp.plano_mensal),
                                );
                                return (
                                  <div
                                    key={esp?.nome || `ap-${espIdx}`}
                                    className="flex justify-between gap-4"
                                  >
                                    <span className="font-medium text-foreground">AP:</span>
                                    <span className="font-semibold text-foreground">
                                      {plano ? `R$ ${plano.value}` : "Não config."}
                                    </span>
                                  </div>
                                );
                              }
                              const isSupervisorABA = String(esp?.nome || "").toLowerCase() === "supervisor aba";
                              const isAtABA = String(esp?.nome || "").toLowerCase() === "at aba";
                              let valStr = "";
                              if (isSupervisorABA) {
                                valStr = `Ana. R$ ${formatDisplayValue(esp?.valor_avaliacao)}`;
                              } else if (isAtABA) {
                                valStr = `Sess. R$ ${formatDisplayValue(esp?.valor_sessao)}`;
                              } else {
                                valStr = `Sess. R$ ${formatDisplayValue(esp?.valor_sessao)} | Ana. R$ ${formatDisplayValue(esp?.valor_avaliacao)}`;
                              }
                              return (
                                <div
                                  key={esp?.nome || `esp-${espIdx}`}
                                  className="flex justify-between gap-4"
                                >
                                  <span className="font-medium truncate">{esp?.nome || "Especialidade"}:</span>
                                  <span className="font-semibold text-foreground shrink-0">{valStr}</span>
                                </div>
                              );
                            })
                        ) : p.valor_sessao ? (
                          <div className="flex justify-between gap-4">
                            <span className="font-medium text-foreground">Geral:</span>
                            <span className="font-semibold text-foreground">
                              R$ {formatDisplayValue(p.valor_sessao)}/sessão
                            </span>
                          </div>
                        ) : (
                          <div className="italic text-muted-foreground text-center py-1">
                            Valores não configurados
                          </div>
                        )}
                        {p.valores_config && Array.isArray((p.valores_config as any).especialidades) && (p.valores_config as any).especialidades.length > 2 && (
                          <div className="text-[10px] text-muted-foreground/80 italic text-right pt-0.5">
                            + {(p.valores_config as any).especialidades.length - 2} especialidade(s)
                          </div>
                        )}
                      </div>
                    )}

                    {/* Summary Badges (Pacientes & Descontos & Sessões / Contatos) */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(() => {
                        const acompanhados = (pacienteProfissional || []).filter(
                          (m: any) => m && m.profissional_id === p.id,
                        );
                        const descontosCount = p.valores_config && Array.isArray((p.valores_config as any).descontos)
                          ? (p.valores_config as any).descontos.length
                          : 0;
                        const sessionsCount = (agendamentos || []).filter(
                          (a: any) => a && a.profissional_id === p.id && a.status !== "cancelado"
                        ).length;
                        
                        const birthDateStr = (p as any).data_nascimento || (p.valores_config as any)?.data_nascimento;
                        let formattedBirth = null;
                        if (birthDateStr && typeof birthDateStr === "string" && birthDateStr.includes("-")) {
                          const parts = birthDateStr.split("-");
                          if (parts.length === 3) {
                            formattedBirth = `${parts[2]}/${parts[1]}`;
                          }
                        }

                        if (isAdm) {
                          return (
                            <>
                              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-normal bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shrink-0 border border-indigo-500/20">
                                💼 Administrativo
                              </Badge>
                              {formattedBirth && (
                                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-normal bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 shrink-0 border border-amber-500/20">
                                  🎂 Nasc. {formattedBirth}
                                </Badge>
                              )}
                            </>
                          );
                        }

                        return (
                          <>
                            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-normal bg-muted/60 text-muted-foreground hover:bg-muted/60 shrink-0">
                              👥 {acompanhados.length} {acompanhados.length === 1 ? "Paciente" : "Pacientes"}
                            </Badge>
                            {descontosCount > 0 && (
                              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-normal bg-muted/60 text-muted-foreground hover:bg-muted/60 shrink-0">
                                🏷️ {descontosCount} {descontosCount === 1 ? "Desconto" : "Descontos"}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-normal bg-primary/10 text-primary hover:bg-primary/10 shrink-0 border border-primary/10">
                              📅 {sessionsCount} {sessionsCount === 1 ? "Sessão" : "Sessões"}
                            </Badge>
                            {formattedBirth && (
                              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-normal bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 shrink-0 border border-amber-500/20">
                                🎂 Nasc. {formattedBirth}
                              </Badge>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Footer with Edit/Delete Buttons */}
                  <div
                    className="mt-4 pt-2 border-t border-border/30 flex justify-end items-center gap-2"
                    onDragStart={(e) => e.stopPropagation()}
                  >
                    <div className="flex gap-1">
                      {!isAdm && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/20"
                          onClick={() => {
                            setSelectedProfForFerias(p);
                            setFeriasStart(format(new Date(), "yyyy-MM-dd"));
                            setFeriasEnd(format(new Date(), "yyyy-MM-dd"));
                            setFeriasOpen(true);
                          }}
                          title="Lançar Férias para o Profissional"
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setEditing(p);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          if (confirm(`Remover ${p.nome}?`)) del.mutate(p.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      </>
    )}

      {feriasOpen && (
        <Dialog open={feriasOpen} onOpenChange={setFeriasOpen}>
          <DialogContent className="max-w-md animate-in fade-in duration-200">
            <DialogHeader>
              <DialogTitle>Lançar Férias - {selectedProfForFerias?.nome}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-xs text-muted-foreground">
                Todos os agendamentos do profissional <strong>{selectedProfForFerias?.nome}</strong> no período selecionado serão atualizados para o status **"FÉRIAS"**.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={feriasStart}
                    onChange={(e) => setFeriasStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={feriasEnd}
                    onChange={(e) => setFeriasEnd(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setFeriasOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => handleApplyProfFerias()}
                  disabled={applyProfFeriasMutation.isPending}
                >
                  {applyProfFeriasMutation.isPending ? "Aplicando..." : "Confirmar Férias"}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

const parseMoneyValue = (val: any) => {
  if (val === undefined || val === null || val === "") return null;
  const cleaned = String(val).replace(",", ".").trim();
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
};

function ProfForm({ prof, onSaved }: { prof: any; onSaved: () => void }) {
  const qc = useQueryClient();
  const { data: pacientes = [] } = useQuery({
    queryKey: ["pacientes-min-prof"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pacientes").select("id, nome").order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: acompanhadosRaw = [] } = useQuery({
    queryKey: ["prof-pacientes-details", prof?.id],
    queryFn: async () => {
      if (!prof?.id) return [];
      const { data, error } = await supabase
        .from("paciente_profissional")
        .select(`
          paciente_id,
          pacientes (
            id,
            nome,
            status,
            created_at,
            data_nascimento,
            cid_principal,
            cids_secundarios,
            responsaveis (
              id,
              nome,
              parentesco,
              telefone,
              whatsapp
            )
          )
        `)
        .eq("profissional_id", prof.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!prof?.id,
  });

  const acompanhados = useMemo(() => {
    return (acompanhadosRaw || []).filter(
      (item: any) =>
        item.pacientes?.status !== "lista_espera" &&
        item.pacientes?.status !== "espera"
    );
  }, [acompanhadosRaw]);

  const filaProfissional = useMemo(() => {
    return (acompanhadosRaw || [])
      .filter(
        (item: any) =>
          item.pacientes?.status === "lista_espera" ||
          item.pacientes?.status === "espera"
      )
      .sort(
        (a: any, b: any) =>
          new Date(a.pacientes?.created_at || 0).getTime() -
          new Date(b.pacientes?.created_at || 0).getTime()
      );
  }, [acompanhadosRaw]);

  const activateFromFormMutation = useMutation({
    mutationFn: async (pacienteId: string) => {
      const { error } = await supabase
        .from("pacientes")
        .update({ status: "ativo" })
        .eq("id", pacienteId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Paciente ativado com sucesso e liberado da fila de espera!");
      qc.invalidateQueries({ queryKey: ["prof-pacientes-details", prof?.id] });
      qc.invalidateQueries({ queryKey: ["pacientes-fila-espera"] });
      qc.invalidateQueries({ queryKey: ["pacientes"] });
      qc.invalidateQueries({ queryKey: ["paciente-profissional"] });
    },
    onError: (err: any) => {
      toast.error("Erro ao ativar paciente: " + err.message);
    },
  });

  const handleWhatsAppContactProf = (pac: any) => {
    const resps = pac?.responsaveis || [];
    const resp = resps[0];
    const phone = resp?.whatsapp || resp?.telefone;
    if (!phone) {
      toast.error(`Nenhum telefone cadastrado para o responsável de ${pac?.nome || "paciente"}.`);
      return;
    }

    const cleanNum = String(phone).replace(/\D/g, "");
    if (!cleanNum) {
      toast.error("Número de telefone inválido.");
      return;
    }

    const phoneWithCountry = cleanNum.length === 10 || cleanNum.length === 11 ? `55${cleanNum}` : cleanNum;
    const profPart = prof?.nome ? ` com o(a) profissional *${prof.nome}*` : "";
    const greeting = resp?.nome ? `Olá ${resp.nome}!` : "Olá!";
    const textMsg = `${greeting} Aqui é da equipe da *Clínica Espaço Multi*. 🏥\n\nEstamos entrando em contato sobre a lista de espera do(a) paciente *${pac.nome}*${profPart}.\n\n✨ *Uma vaga foi liberada!* Poderia confirmar se você ainda tem interesse para realizarmos o agendamento?`;

    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(textMsg)}`;
    window.open(url, "_blank");
  };

  const config: any = {
    especialidades: (prof?.valores_config as any)?.especialidades || [],
    descontos: (prof?.valores_config as any)?.descontos || [],
    ativo_ate: (prof?.valores_config as any)?.ativo_ate,
    data_nascimento: prof?.data_nascimento ?? ((prof?.valores_config as any)?.data_nascimento || ""),
  };

  const initialTipo = prof?.tipo ?? ((prof?.valores_config as any)?.tipo || "clinico");
  const initialCargo =
    prof?.cargo ??
    ((prof?.valores_config as any)?.cargo || (initialTipo === "administrativo" ? prof?.especialidade : "") || "");

  const [form, setForm] = useState(() => {
    const initialSpecs =
      prof?.especialidade && initialTipo !== "administrativo"
        ? prof.especialidade
            .split(", ")
            .filter(Boolean)
            .map((s: string) => {
              const existing = config.especialidades?.find(
                (e: any) => e && e.nome && e.nome.toLowerCase() === s.toLowerCase(),
              );
              return {
                nome: s,
                valor_sessao:
                  existing?.valor_sessao !== undefined && existing?.valor_sessao !== null
                    ? String(existing.valor_sessao)
                    : "",
                valor_avaliacao:
                  existing?.valor_avaliacao !== undefined && existing?.valor_avaliacao !== null
                    ? String(existing.valor_avaliacao)
                    : "",
                plano_mensal:
                  existing?.plano_mensal !== undefined && existing?.plano_mensal !== null
                    ? String(existing.plano_mensal)
                    : "",
              };
            })
        : [{ nome: "", valor_sessao: "", valor_avaliacao: "", plano_mensal: "" }];

    return {
      nome: prof?.nome ?? "",
      tipo: initialTipo as "clinico" | "administrativo",
      cargo: initialCargo ?? "",
      especialidades: initialSpecs,
      email: prof?.email ?? "",
      telefone: prof?.telefone ?? "",
      data_nascimento: prof?.data_nascimento ?? (config.data_nascimento || ""),
      cor: prof?.cor ?? CORES[0],
      ativo: prof?.ativo ?? true,
      ativo_ate: config.ativo_ate ?? "",
    };
  });

  const [descontos, setDescontos] = useState<any[]>(() => config.descontos || []);
  const [newDesc, setNewDesc] = useState({
    paciente_id: "",
    especialidade: "",
    valor_sessao: "",
    valor_avaliacao: "",
  });

  // Set default specialty for new discount when specialties change
  useEffect(() => {
    const activeSpecs = form.especialidades
      .map((e: any) => e?.nome?.trim())
      .filter(Boolean);
    if (activeSpecs.length > 0 && !activeSpecs.includes(newDesc.especialidade)) {
      setNewDesc((prev) => ({ ...prev, especialidade: activeSpecs[0] }));
    }
  }, [form.especialidades]);

  const m = useMutation({
    mutationFn: async () => {
      const isAdm = form.tipo === "administrativo";
      const activeSpecs = isAdm
        ? []
        : form.especialidades.filter((e: any) => e && e.nome && e.nome.trim());

      const payloadConfig = {
        tipo: form.tipo,
        cargo: isAdm ? form.cargo?.trim() || "Administrativo" : null,
        especialidades: activeSpecs.map((v: any) => {
          const nomeLower = v.nome?.trim().toLowerCase() || "";
          const isAP = nomeLower === "ap";
          const isSupervisorABA = nomeLower === "supervisor aba";
          const isAtABA = nomeLower === "at aba";
          return {
            nome: v.nome?.trim() || "",
            valor_sessao: isAP || isSupervisorABA ? null : parseMoneyValue(v.valor_sessao),
            valor_avaliacao: isAP || isAtABA ? null : parseMoneyValue(v.valor_avaliacao),
            plano_mensal: isAP ? v.plano_mensal || null : null,
          };
        }),
        descontos: isAdm
          ? []
          : (descontos || [])
              .filter((d: any) => d && d.paciente_id)
              .map((d: any) => {
                const specLower = d.especialidade?.toLowerCase() || "";
                const isSupervisorABA = specLower === "supervisor aba";
                const isAtABA = specLower === "at aba";
                return {
                  paciente_id: d.paciente_id,
                  especialidade: d.especialidade,
                  valor_sessao: isSupervisorABA ? null : parseMoneyValue(d.valor_sessao),
                  valor_avaliacao: isAtABA ? null : parseMoneyValue(d.valor_avaliacao),
                };
              }),
        ativo_ate: form.ativo_ate || null,
        data_nascimento: form.data_nascimento || null,
      };

      const payload: any = {
        nome: form.nome,
        especialidade: isAdm
          ? form.cargo?.trim() || "Administrativo"
          : activeSpecs.map((e: any) => e.nome?.trim() || "").filter(Boolean).join(", ") || null,
        email: form.email || null,
        telefone: form.telefone || null,
        cor: form.cor,
        ativo: form.ativo,
        valores_config: payloadConfig,
      };

      if (prof) {
        const { error } = await supabase.from("profissionais").update(payload).eq("id", prof.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("profissionais").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(prof ? "Atualizado" : "Cadastrado");
      qc.invalidateQueries({ queryKey: ["paciente-profissional"] });
      onSaved();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const isAdm = form.tipo === "administrativo";

  const renderGeralForm = () => (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Tipo de Profissional *</Label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 rounded-lg border border-border/50">
          <button
            type="button"
            onClick={() => setForm({ ...form, tipo: "clinico" })}
            className={cn(
              "flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-all",
              form.tipo === "clinico"
                ? "bg-background text-primary shadow-xs border border-border/50"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>🩺</span> Clínico / Terapeuta
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, tipo: "administrativo" })}
            className={cn(
              "flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-all",
              form.tipo === "administrativo"
                ? "bg-background text-indigo-600 dark:text-indigo-400 shadow-xs border border-border/50"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>💼</span> Equipe Administrativa
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Nome Completo *</Label>
        <Input
          required
          placeholder="Ex.: Maria Eduarda Santos"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
        />
      </div>

      {isAdm ? (
        <div className="space-y-3 p-3.5 rounded-lg border border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-950/20 animate-in fade-in duration-200">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span>💼</span> Cargo / Função Administrativa *
            </Label>
            <Input
              required={isAdm}
              placeholder="Ex.: Recepcionista, Secretária, Gerente Financeiro, Apoio Geral"
              value={form.cargo}
              onChange={(e) => setForm({ ...form, cargo: e.target.value })}
            />
          </div>
          <div className="text-[11px] text-muted-foreground bg-background/80 p-2.5 rounded border border-indigo-500/20 leading-relaxed">
            💡 <strong>Aviso:</strong> Profissionais administrativos são registrados para a equipe interna e <strong>não</strong> aparecerão na grade de marcação de consultas ou relatórios clínicos.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Especialidades & Valores</Label>
            <div className="space-y-3">
              {form.especialidades.map((esp: any, index: number) => (
                <div
                  key={index}
                  className="border p-3.5 rounded-lg bg-accent/10 space-y-2.5 relative group"
                >
                  <div className="flex gap-2 items-center">
                    <Input
                      required={!isAdm}
                      value={esp.nome}
                      onChange={(e) => {
                        const next = [...form.especialidades];
                        next[index].nome = e.target.value;
                        setForm({ ...form, especialidades: next });
                      }}
                      placeholder={`Especialidade ${index + 1}`}
                      className="font-semibold text-sm"
                    />
                    {form.especialidades.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          setForm({
                            ...form,
                            especialidades: form.especialidades.filter(
                              (_: any, i: number) => i !== index,
                            ),
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {esp.nome.trim() && (
                    <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-200">
                      {esp.nome.toUpperCase() === "AP" ? (
                        <div className="col-span-2 space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Plano Mensal (AP)</Label>
                          <Select
                            value={esp.plano_mensal}
                            onValueChange={(val) => {
                              const next = [...form.especialidades];
                              next[index].plano_mensal = val;
                              setForm({ ...form, especialidades: next });
                            }}
                          >
                            <SelectTrigger className="w-full h-8 text-xs">
                              <SelectValue placeholder="Selecione um plano..." />
                            </SelectTrigger>
                            <SelectContent>
                              {PLANOS_AP.map((plano) => (
                                <SelectItem key={plano.value} value={plano.value}>
                                  {plano.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <>
                          {esp.nome.toLowerCase() !== "supervisor aba" && (
                            <div
                              className={`space-y-1 ${esp.nome.toLowerCase() === "at aba" ? "col-span-2" : ""}`}
                            >
                              <Label className="text-[11px] text-muted-foreground">
                                Sessão Padrão (R$)
                              </Label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Ex.: 100.00"
                                value={esp.valor_sessao}
                                onChange={(e) => {
                                  const next = [...form.especialidades];
                                  next[index].valor_sessao = e.target.value;
                                  setForm({ ...form, especialidades: next });
                                }}
                                className="h-8 text-xs"
                              />
                            </div>
                          )}
                          {esp.nome.toLowerCase() !== "at aba" && (
                            <div
                              className={`space-y-1 ${esp.nome.toLowerCase() === "supervisor aba" ? "col-span-2" : ""}`}
                            >
                              <Label className="text-[11px] text-muted-foreground">
                                Anamnese Padrão (R$)
                              </Label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Ex.: 200.00"
                                value={esp.valor_avaliacao}
                                onChange={(e) => {
                                  const next = [...form.especialidades];
                                  next[index].valor_avaliacao = e.target.value;
                                  setForm({ ...form, especialidades: next });
                                }}
                                className="h-8 text-xs"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={() =>
                setForm({
                  ...form,
                  especialidades: [
                    ...form.especialidades,
                    { nome: "", valor_sessao: "", valor_avaliacao: "", plano_mensal: "" },
                  ],
                })
              }
            >
              <Plus className="h-4 w-4 mr-1.5" /> Adicionar especialidade
            </Button>
          </div>
        </div>
      )}

      {/* Contact & Agenda Color */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>E-mail</Label>
          <Input
            type="email"
            placeholder="email@espacomulti.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Telefone</Label>
          <Input
            placeholder="(00) 00000-0000"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Data de Nascimento</Label>
          <Input
            type="date"
            value={form.data_nascimento}
            onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Cor de Identificação</Label>
        <div className="flex flex-wrap gap-2">
          {CORES.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setForm({ ...form, cor: c })}
              className={`h-7 w-7 rounded-full ring-offset-2 transition ${form.cor === c ? "ring-2 ring-foreground" : ""}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <input
          type="checkbox"
          id="ativo"
          checked={form.ativo}
          onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <Label htmlFor="ativo" className="text-sm font-medium leading-none cursor-pointer">
          Ativo
        </Label>
      </div>

      <div className="space-y-1.5 pt-2">
        <Label htmlFor="ativo_ate">Ativo até (Mês/Ano) - Opcional</Label>
        <Input
          type="month"
          id="ativo_ate"
          value={form.ativo_ate || ""}
          onChange={(e) => setForm({ ...form, ativo_ate: e.target.value })}
          className="w-full"
        />
        <p className="text-[11px] text-muted-foreground">
          Se definido, o profissional aparecerá como ativo no sistema até o mês selecionado. A partir do mês seguinte, ele será tratado como inativo.
        </p>
      </div>
    </div>
  );

  const renderDescontosForm = () => {
    const activeSpecs = form.especialidades
      .map((e: any) => e?.nome?.trim())
      .filter(Boolean);

    return (
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Configure descontos e valores especiais de sessões e anamneses para pacientes
          selecionados.
        </p>

        {activeSpecs.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground border rounded-lg">
            Adicione e salve especialidades na aba "Dados Gerais & Valores" primeiro.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 p-3 border border-dashed rounded-lg bg-muted/40">
              <div className="space-y-1.5">
                <Label>Paciente</Label>
                <Select
                  value={newDesc.paciente_id}
                  onValueChange={(v) => setNewDesc({ ...newDesc, paciente_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(pacientes || []).map((p: any) => (
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
                  value={newDesc.especialidade}
                  onValueChange={(v) => setNewDesc({ ...newDesc, especialidade: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeSpecs.map((s: string) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {newDesc.especialidade && newDesc.especialidade.toLowerCase() !== "supervisor aba" && (
                <div
                  className={`space-y-1.5 ${newDesc.especialidade.toLowerCase() === "at aba" ? "col-span-2" : ""}`}
                >
                  <Label>Valor Sessão (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ex.: 120"
                    value={newDesc.valor_sessao}
                    onChange={(e) => setNewDesc({ ...newDesc, valor_sessao: e.target.value })}
                  />
                </div>
              )}
              {newDesc.especialidade && newDesc.especialidade.toLowerCase() !== "at aba" && (
                <div
                  className={`space-y-1.5 ${newDesc.especialidade.toLowerCase() === "supervisor aba" ? "col-span-2" : ""}`}
                >
                  <Label>Valor Anamnese (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ex.: 180"
                    value={newDesc.valor_avaliacao}
                    onChange={(e) => setNewDesc({ ...newDesc, valor_avaliacao: e.target.value })}
                  />
                </div>
              )}
              <div className="col-span-2 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (!newDesc.paciente_id || !newDesc.especialidade) {
                      toast.error("Selecione o paciente e a especialidade");
                      return;
                    }
                    const specLower = newDesc.especialidade.toLowerCase();
                    const isSupervisorABA = specLower === "supervisor aba";
                    const isAtABA = specLower === "at aba";
                    const needsSession = !isSupervisorABA;
                    const needsAnamnese = !isAtABA;

                    if (needsSession && !newDesc.valor_sessao) {
                      toast.error("Preencha o valor da sessão");
                      return;
                    }
                    if (needsAnamnese && !newDesc.valor_avaliacao) {
                      toast.error("Preencha o valor da anamnese");
                      return;
                    }

                    const newRule = {
                      paciente_id: newDesc.paciente_id,
                      especialidade: newDesc.especialidade,
                      valor_sessao: needsSession
                        ? (parseMoneyValue(newDesc.valor_sessao) ?? 0)
                        : null,
                      valor_avaliacao: needsAnamnese
                        ? (parseMoneyValue(newDesc.valor_avaliacao) ?? 0)
                        : null,
                    };
                    const exists = (descontos || []).some(
                      (d: any) =>
                        d &&
                        d.paciente_id === newRule.paciente_id &&
                        d.especialidade === newRule.especialidade,
                    );
                    if (exists) {
                      toast.error("Já existe desconto para este paciente nesta especialidade");
                      return;
                    }
                    setDescontos([...(descontos || []), newRule]);
                    setNewDesc({
                      paciente_id: "",
                      especialidade: activeSpecs[0] || "",
                      valor_sessao: "",
                      valor_avaliacao: "",
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Adicionar Desconto
                </Button>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table className="w-full">
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Especialidade</TableHead>
                    <TableHead>Sessão</TableHead>
                    <TableHead>Anamnese</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!descontos || descontos.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-xs text-muted-foreground py-6"
                      >
                        Nenhum valor com desconto cadastrado para este profissional.
                      </TableCell>
                    </TableRow>
                  ) : (
                    descontos.map((d: any, idx: number) => {
                      if (!d) return null;
                      const pac = (pacientes || []).find((p: any) => p.id === d.paciente_id);
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium text-xs">
                            {pac?.nome || "Carregando..."}
                          </TableCell>
                          <TableCell className="text-xs">{d.especialidade}</TableCell>
                          <TableCell className="text-xs font-semibold text-primary">
                            {d.especialidade?.toLowerCase() === "supervisor aba"
                              ? "—"
                              : `R$ ${Number(d.valor_sessao ?? 0).toFixed(2)}`}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-primary">
                            {d.especialidade?.toLowerCase() === "at aba"
                              ? "—"
                              : `R$ ${Number(d.valor_avaliacao ?? 0).toFixed(2)}`}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                setDescontos(descontos.filter((_: any, i: number) => i !== idx))
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderPacientesForm = () => {
    return (
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Lista de pacientes associados ao profissional para acompanhamento de sessões e especialidades.
        </p>
        <div className="border rounded-lg overflow-hidden bg-card">
          <div className="divide-y divide-border/60 max-h-[40vh] overflow-y-auto pr-1">
            {acompanhados.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-10">
                Nenhum paciente associado a este profissional no momento.
              </div>
            ) : (
              acompanhados.map((item: any) => {
                const pac = item.pacientes;
                return (
                  <div
                    key={item.paciente_id}
                    className="flex items-center justify-between p-3 hover:bg-muted/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-xs text-foreground truncate">
                        {pac?.nome || "Carregando..."}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFilaEsperaForm = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Pacientes aguardando vaga vinculados a este profissional, por ordem de chegada na fila.
          </p>
          <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-700 dark:text-amber-300 font-semibold shrink-0">
            {filaProfissional.length} na fila
          </Badge>
        </div>

        <div className="border rounded-lg overflow-hidden bg-card">
          <div className="divide-y divide-border/60 max-h-[40vh] overflow-y-auto pr-1">
            {filaProfissional.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-10">
                Nenhum paciente na fila de espera para este profissional.
              </div>
            ) : (
              filaProfissional.map((item: any, idx: number) => {
                const pac = item.pacientes;
                const resp = pac?.responsaveis?.[0];
                const rawDate = pac?.created_at ? new Date(pac.created_at) : null;
                const daysWaiting = rawDate ? differenceInDays(new Date(), rawDate) : 0;
                const formattedDate = rawDate ? format(rawDate, "dd/MM/yyyy", { locale: ptBR }) : "";

                return (
                  <div
                    key={item.paciente_id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-2 hover:bg-muted/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Badge className="h-6 px-1.5 text-xs font-bold bg-amber-500 text-white shrink-0">
                        #{idx + 1}
                      </Badge>
                      <div className="min-w-0">
                        <div className="font-medium text-xs text-foreground truncate">
                          {pac?.nome || "Carregando..."}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                          {formattedDate && <span>Desde {formattedDate}</span>}
                          {formattedDate && <span>•</span>}
                          <span className="text-amber-700 dark:text-amber-400 font-medium">
                            {daysWaiting === 0 ? "Hoje" : `${daysWaiting} dias aguardando`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
                        onClick={() => handleWhatsAppContactProf(pac)}
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> Chamar WhatsApp
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-50"
                        onClick={() => {
                          if (confirm(`Deseja efetivar a vaga e ativar ${pac?.nome}? Ele(a) sairá da fila de espera.`)) {
                            activateFromFormMutation.mutate(pac.id);
                          }
                        }}
                        disabled={activateFromFormMutation.isPending}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Efetivar
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6">
      <DialogHeader>
        <DialogTitle>{prof ? "Editar profissional" : "Novo profissional"}</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          m.mutate();
        }}
        className="flex-1 flex flex-col overflow-hidden space-y-3"
      >
        {prof && form.tipo !== "administrativo" ? (
          <Tabs defaultValue="geral" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-4 shrink-0">
              <TabsTrigger value="geral" className="text-xs">Dados Gerais & Valores</TabsTrigger>
              <TabsTrigger value="descontos" className="text-xs">Descontos</TabsTrigger>
              <TabsTrigger value="pacientes" className="text-xs">Pacientes ({acompanhados.length})</TabsTrigger>
              <TabsTrigger value="espera" className="text-xs gap-1 text-amber-700 dark:text-amber-400">
                ⏳ Fila ({filaProfissional.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="geral" className="flex-1 overflow-y-auto py-2 pr-1 space-y-3">
              {renderGeralForm()}
            </TabsContent>

            <TabsContent value="descontos" className="flex-1 overflow-y-auto py-2 pr-1 space-y-3">
              {renderDescontosForm()}
            </TabsContent>

            <TabsContent value="pacientes" className="flex-1 overflow-y-auto py-2 pr-1 space-y-3">
              {renderPacientesForm()}
            </TabsContent>

            <TabsContent value="espera" className="flex-1 overflow-y-auto py-2 pr-1 space-y-3">
              {renderFilaEsperaForm()}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex-1 overflow-y-auto py-2 pr-1 space-y-3">{renderGeralForm()}</div>
        )}
        <DialogFooter className="shrink-0 pt-2 border-t">
          <Button type="submit" disabled={m.isPending}>
            Salvar
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
