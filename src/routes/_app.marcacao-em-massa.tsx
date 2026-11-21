import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Calendar,
  CalendarPlus,
  Users,
  Stethoscope,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  Repeat,
  Check,
  CalendarDays,
  ExternalLink,
  ChevronRight,
  Info,
  Pencil,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { getDefaultRoomIdForProfessional, getDefaultRoomNameForProfessional } from "@/lib/defaultRooms";

export const Route = createFileRoute("/_app/marcacao-em-massa")({
  component: MarcacaoEmMassaPage,
});

interface DiaFixo {
  id: string;
  profissional_id: string;
  servico_id: string | null;
  sala_id: string | null;
  dia_semana: number; // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  hora_inicio: string;
  hora_fim: string;
}

const DIAS_SEMANA_NOMES = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const DIAS_SEMANA_ABREV = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const parseDiasFixos = (observacoes: string | null | undefined): DiaFixo[] => {
  if (!observacoes) return [];
  const match = observacoes.match(/<!--DIAS_FIXOS:(.*?)-->/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any, idx: number) => ({
          ...item,
          id: item.id || `slot_${idx}_${item.dia_semana}_${item.hora_inicio}`,
        }));
      }
    } catch (e) {
      console.error("Erro ao fazer parse dos dias fixos", e);
    }
  }
  return [];
};

const serializeObservacoes = (rawObs: string | null | undefined, diasFixos: DiaFixo[]): string => {
  const cleanObs = (rawObs || "").replace(/<!--DIAS_FIXOS:.*?-->/, "").trim();
  if (diasFixos.length > 0) {
    return `${cleanObs}\n\n<!--DIAS_FIXOS:${JSON.stringify(diasFixos)}-->`.trim();
  }
  return cleanObs;
};

function MarcacaoEmMassaPage() {
  const qc = useQueryClient();

  // Mês selecionado para a marcação (padrão: mês atual)
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date>(() => startOfMonth(new Date()));
  const [activeTab, setActiveTab] = useState<string>("recorrentes");

  // Filtros de busca
  const [searchPatient, setSearchPatient] = useState("");
  const [filterProfissional, setFilterProfissional] = useState("todos");

  // Itens selecionados para geração na aba recorrentes (chave: `${pacienteId}_${diaFixoId}`)
  const [selectedSlots, setSelectedSlots] = useState<Record<string, boolean>>({});

  // Modal para adicionar/editar horário fixo
  const [addFixSlotOpen, setAddFixSlotOpen] = useState(false);
  const [targetPatientForSlot, setTargetPatientForSlot] = useState<any>(null);

  // Estados do formulário de cadastro de horário recorrente
  const [newSlotPatientId, setNewSlotPatientId] = useState<string>("");
  const [newSlotProfId, setNewSlotProfId] = useState<string>("");
  const [newSlotSalaId, setNewSlotSalaId] = useState<string>("default");
  const [newSlotDays, setNewSlotDays] = useState<number[]>([1]);
  const [newSlotGlobalTime, setNewSlotGlobalTime] = useState<{ inicio: string; fim: string }>({
    inicio: "08:00",
    fim: "08:30",
  });
  const [newSlotDayTimes, setNewSlotDayTimes] = useState<Record<number, { inicio: string; fim: string }>>({
    1: { inicio: "08:00", fim: "08:30" },
    2: { inicio: "08:00", fim: "08:30" },
    3: { inicio: "08:00", fim: "08:30" },
    4: { inicio: "08:00", fim: "08:30" },
    5: { inicio: "08:00", fim: "08:30" },
    6: { inicio: "08:00", fim: "08:30" },
    0: { inicio: "08:00", fim: "08:30" },
  });

  const handleOpenAddFixSlot = (paciente?: any) => {
    setTargetPatientForSlot(paciente || null);
    setNewSlotPatientId(paciente?.id || "");
    setNewSlotProfId("");
    setNewSlotSalaId("default");
    setNewSlotDays([1]);
    setNewSlotGlobalTime({ inicio: "08:00", fim: "08:30" });
    setNewSlotDayTimes({
      1: { inicio: "08:00", fim: "08:30" },
      2: { inicio: "08:00", fim: "08:30" },
      3: { inicio: "08:00", fim: "08:30" },
      4: { inicio: "08:00", fim: "08:30" },
      5: { inicio: "08:00", fim: "08:30" },
      6: { inicio: "08:00", fim: "08:30" },
      0: { inicio: "08:00", fim: "08:30" },
    });
    setAddFixSlotOpen(true);
  };

  const handleApplySameTimeToAllDays = () => {
    setNewSlotDayTimes((prev) => {
      const updated = { ...prev };
      for (const d of newSlotDays) {
        updated[d] = {
          inicio: newSlotGlobalTime.inicio,
          fim: newSlotGlobalTime.fim,
        };
      }
      return updated;
    });
    toast.success("Horário aplicado a todos os dias selecionados!");
  };

  // Estados para Edição e Exclusão de Horário Recorrente
  const [editingSlot, setEditingSlot] = useState<{
    paciente: any;
    diaFixo: DiaFixo;
  } | null>(null);
  const [editProfId, setEditProfId] = useState<string>("");
  const [editDiaSemana, setEditDiaSemana] = useState<number>(1);
  const [editHoraInicio, setEditHoraInicio] = useState<string>("08:00");
  const [editHoraFim, setEditHoraFim] = useState<string>("08:30");
  const [editSalaId, setEditSalaId] = useState<string>("default");

  const [deletingSlot, setDeletingSlot] = useState<{
    paciente: any;
    diaFixo: DiaFixo;
  } | null>(null);

  const handleStartEdit = (item: { paciente: any; diaFixo: DiaFixo }) => {
    setEditingSlot({ paciente: item.paciente, diaFixo: item.diaFixo });
    setEditProfId(item.diaFixo.profissional_id || "");
    setEditDiaSemana(Number(item.diaFixo.dia_semana));
    setEditHoraInicio(item.diaFixo.hora_inicio || "08:00");
    setEditHoraFim(item.diaFixo.hora_fim || "08:30");
    setEditSalaId(item.diaFixo.sala_id || "default");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;

    const { paciente, diaFixo } = editingSlot;
    const currentDfs = parseDiasFixos(paciente.observacoes);

    const updatedDfs = currentDfs.map((df) => {
      if (df.id === diaFixo.id) {
        return {
          ...df,
          profissional_id: editProfId,
          dia_semana: editDiaSemana,
          hora_inicio: editHoraInicio,
          hora_fim: editHoraFim,
          sala_id: editSalaId === "default" ? null : editSalaId,
        };
      }
      return df;
    });

    const newObs = serializeObservacoes(paciente.observacoes, updatedDfs);

    const { error } = await supabase
      .from("pacientes")
      .update({ observacoes: newObs })
      .eq("id", paciente.id);

    if (error) {
      toast.error(`Erro ao atualizar horário: ${error.message}`);
    } else {
      toast.success("Horário recorrente atualizado com sucesso!");
      qc.invalidateQueries({ queryKey: ["massa-pacientes"] });
      setEditingSlot(null);
    }
  };

  const handleDeleteSlot = async () => {
    if (!deletingSlot) return;
    const { paciente, diaFixo } = deletingSlot;
    const currentDfs = parseDiasFixos(paciente.observacoes);

    const updatedDfs = currentDfs.filter((df) => df.id !== diaFixo.id);
    const newObs = serializeObservacoes(paciente.observacoes, updatedDfs);

    const { error } = await supabase
      .from("pacientes")
      .update({ observacoes: newObs })
      .eq("id", paciente.id);

    if (error) {
      toast.error(`Erro ao excluir horário: ${error.message}`);
    } else {
      toast.success("Horário recorrente excluído com sucesso!");
      qc.invalidateQueries({ queryKey: ["massa-pacientes"] });
      setDeletingSlot(null);
    }
  };

  // Estados da Aba 2: Escala dos Profissionais
  const [escalaProfId, setEscalaProfId] = useState<string>("");
  const [escalaDiasSelecionados, setEscalaDiasSelecionados] = useState<number[]>([]);
  const [escalaSlots, setEscalaSlots] = useState<
    Array<{
      id: string;
      hora_inicio: string;
      hora_fim: string;
      paciente_id: string;
      servico_id: string | null;
      sala_id: string | null;
    }>
  >([]);

  // Carregar Pacientes
  const { data: pacientes = [], isLoading: loadingPacientes } = useQuery({
    queryKey: ["massa-pacientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pacientes")
        .select("id, nome, status, observacoes, tipo_atendimento, valor_mensal, cids_secundarios")
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60 * 1000,
  });

  // Carregar Profissionais
  const { data: profissionais = [], isLoading: loadingProfissionais } = useQuery({
    queryKey: ["massa-profissionais"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profissionais")
        .select("id, nome, especialidade, cor, valores_config, ativo")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Carregar Salas
  const { data: salas = [] } = useQuery({
    queryKey: ["massa-salas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("salas").select("*").eq("ativo", true).order("nome");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });

  // Carregar Serviços
  const { data: servicos = [] } = useQuery({
    queryKey: ["massa-servicos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("servicos").select("*").order("nome");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });

  // Intervalo do mês selecionado
  const monthStart = useMemo(() => startOfMonth(selectedMonthDate), [selectedMonthDate]);
  const monthEnd = useMemo(() => endOfMonth(selectedMonthDate), [selectedMonthDate]);
  const daysInMonth = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd]
  );

  // Buscar agendamentos existentes no mês para verificação de conflitos e duplicidades
  const { data: agendamentosMes = [], isLoading: loadingAgsMes } = useQuery({
    queryKey: ["massa-agendamentos-mes", format(monthStart, "yyyy-MM")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select("id, paciente_id, profissional_id, data_inicio, data_fim, status, sala_id")
        .gte("data_inicio", monthStart.toISOString())
        .lte("data_inicio", monthEnd.toISOString());
      if (error) throw error;
      return data ?? [];
    },
  });

  // Lista consolidada de todos os horários fixos de todos os pacientes
  const allPatientSlots = useMemo(() => {
    const list: Array<{
      key: string;
      paciente: any;
      diaFixo: DiaFixo;
      profissional: any;
      sala: any;
      servico: any;
      datesInMonth: Date[];
      alreadyScheduledDates: Date[];
      newDatesToSchedule: Date[];
    }> = [];

    const activePacientes = pacientes.filter((p: any) => p.status === "ativo");

    for (const pac of activePacientes) {
      const dfs = parseDiasFixos(pac.observacoes);
      for (const df of dfs) {
        // Filtrar por profissional se selecionado
        if (filterProfissional !== "todos" && df.profissional_id !== filterProfissional) {
          continue;
        }

        // Filtrar por termo de busca do paciente
        if (searchPatient.trim()) {
          const term = searchPatient.toLowerCase();
          if (!pac.nome.toLowerCase().includes(term)) {
            continue;
          }
        }

        const prof = profissionais.find((p: any) => p.id === df.profissional_id);
        const sala = salas.find((s: any) => s.id === df.sala_id);
        const serv = servicos.find((s: any) => s.id === df.servico_id);

        // Encontrar todas as datas do mês que caem no dia da semana especificado
        const matchingDates = daysInMonth.filter((d) => getDay(d) === df.dia_semana);

        // Separar datas já agendadas e datas a agendar
        const [startH, startM] = df.hora_inicio.split(":").map(Number);
        const alreadyScheduled: Date[] = [];
        const newDates: Date[] = [];

        for (const dateItem of matchingDates) {
          const occTime = new Date(
            dateItem.getFullYear(),
            dateItem.getMonth(),
            dateItem.getDate(),
            startH,
            startM,
            0
          ).getTime();

          const isDuplicate = agendamentosMes.some((ea: any) => {
            const eaTime = new Date(ea.data_inicio).getTime();
            return (
              ea.paciente_id === pac.id &&
              ea.profissional_id === df.profissional_id &&
              Math.abs(eaTime - occTime) < 60000 &&
              ea.status !== "cancelado"
            );
          });

          if (isDuplicate) {
            alreadyScheduled.push(dateItem);
          } else {
            newDates.push(dateItem);
          }
        }

        const key = `${pac.id}_${df.id}`;
        list.push({
          key,
          paciente: pac,
          diaFixo: df,
          profissional: prof,
          sala,
          servico: serv,
          datesInMonth: matchingDates,
          alreadyScheduledDates: alreadyScheduled,
          newDatesToSchedule: newDates,
        });
      }
    }

    return list;
  }, [pacientes, profissionais, salas, servicos, daysInMonth, agendamentosMes, filterProfissional, searchPatient]);

  // Contagem de agendamentos novos a serem criados
  const totalNovosAgendamentos = useMemo(() => {
    let count = 0;
    for (const item of allPatientSlots) {
      if (selectedSlots[item.key] !== false) {
        // Marcado por padrão
        count += item.newDatesToSchedule.length;
      }
    }
    return count;
  }, [allPatientSlots, selectedSlots]);

  // Alternar seleção de todos os itens
  const handleToggleSelectAll = (checked: boolean) => {
    const updated: Record<string, boolean> = {};
    for (const item of allPatientSlots) {
      updated[item.key] = checked;
    }
    setSelectedSlots(updated);
  };

  // Mutation: Gerar agendamentos em massa para pacientes recorrentes
  const gerarRecorrentesMutation = useMutation({
    mutationFn: async () => {
      const occurrencesToInsert: any[] = [];

      for (const item of allPatientSlots) {
        // Se estiver selecionado e tiver datas novas a agendar
        const isSelected = selectedSlots[item.key] !== false;
        if (!isSelected || item.newDatesToSchedule.length === 0) continue;

        const [startH, startM] = item.diaFixo.hora_inicio.split(":").map(Number);
        const [endH, endM] = item.diaFixo.hora_fim.split(":").map(Number);

        // Fallback de sala se nula: pegar sala padrão do profissional
        const effectiveSalaId =
          item.diaFixo.sala_id ||
          getDefaultRoomIdForProfessional(item.diaFixo.profissional_id, profissionais, salas) ||
          null;

        // Fallback de serviço se nulo
        const effectiveServicoId =
          item.diaFixo.servico_id ||
          servicos.find((s: any) =>
            s.nome.toLowerCase().includes(item.profissional?.especialidade?.toLowerCase() || "")
          )?.id ||
          null;

        for (const dateItem of item.newDatesToSchedule) {
          const occStart = new Date(
            dateItem.getFullYear(),
            dateItem.getMonth(),
            dateItem.getDate(),
            startH,
            startM,
            0
          );
          const occEnd = new Date(
            dateItem.getFullYear(),
            dateItem.getMonth(),
            dateItem.getDate(),
            endH,
            endM,
            0
          );

          occurrencesToInsert.push({
            paciente_id: item.paciente.id,
            profissional_id: item.diaFixo.profissional_id,
            servico_id: effectiveServicoId,
            sala_id: effectiveSalaId,
            data_inicio: occStart.toISOString(),
            data_fim: occEnd.toISOString(),
            status: "confirmado",
            recorrencia: "unica",
            observacoes: "Gerado via Central de Marcação em Massa",
          });
        }
      }

      if (occurrencesToInsert.length === 0) {
        throw new Error("Nenhum agendamento novo selecionado para inserção.");
      }

      // Inserção em lotes de 50 para máxima confiabilidade
      const chunkSize = 50;
      for (let i = 0; i < occurrencesToInsert.length; i += chunkSize) {
        const chunk = occurrencesToInsert.slice(i, i + chunkSize);
        const { error } = await supabase.from("agendamentos").insert(chunk);
        if (error) throw error;
      }

      return occurrencesToInsert.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} agendamentos gerados com sucesso na Agenda!`, {
        action: {
          label: "Acessar Agenda",
          onClick: () => {
            window.location.href = "/agenda";
          },
        },
      });
      qc.invalidateQueries({ queryKey: ["ags"] });
      qc.invalidateQueries({ queryKey: ["massa-agendamentos-mes"] });
      qc.invalidateQueries({ queryKey: ["paciente-ags-dialog"] });
    },
    onError: (e: any) => {
      toast.error(`Erro ao gerar agendamentos: ${e.message}`);
    },
  });

  // Mutation: Gerar agendamentos da escala do profissional para os dias escolhidos no mês
  const gerarEscalaProfissionalMutation = useMutation({
    mutationFn: async () => {
      if (!escalaProfId) throw new Error("Selecione um profissional.");
      if (escalaDiasSelecionados.length === 0)
        throw new Error("Selecione pelo menos um dia no calendário do mês.");
      if (escalaSlots.length === 0) throw new Error("Adicione pelo menos um horário de atendimento.");

      const selectedProf = profissionais.find((p: any) => p.id === escalaProfId);
      const defaultSalaId = getDefaultRoomIdForProfessional(escalaProfId, profissionais, salas);

      const occurrencesToInsert: any[] = [];

      for (const dayNum of escalaDiasSelecionados) {
        const targetDate = new Date(
          selectedMonthDate.getFullYear(),
          selectedMonthDate.getMonth(),
          dayNum
        );

        for (const slot of escalaSlots) {
          const [startH, startM] = slot.hora_inicio.split(":").map(Number);
          const [endH, endM] = slot.hora_fim.split(":").map(Number);

          const occStart = new Date(
            targetDate.getFullYear(),
            targetDate.getMonth(),
            targetDate.getDate(),
            startH,
            startM,
            0
          );
          const occEnd = new Date(
            targetDate.getFullYear(),
            targetDate.getMonth(),
            targetDate.getDate(),
            endH,
            endM,
            0
          );

          // Verificar se já existe agendamento neste horário para o profissional
          const isDuplicate = agendamentosMes.some((ea: any) => {
            const eaTime = new Date(ea.data_inicio).getTime();
            return (
              ea.profissional_id === escalaProfId &&
              Math.abs(eaTime - occStart.getTime()) < 60000 &&
              ea.status !== "cancelado"
            );
          });

          if (!isDuplicate) {
            occurrencesToInsert.push({
              paciente_id: slot.paciente_id,
              profissional_id: escalaProfId,
              servico_id:
                slot.servico_id ||
                servicos.find((s: any) =>
                  s.nome.toLowerCase().includes(selectedProf?.especialidade?.toLowerCase() || "")
                )?.id ||
                null,
              sala_id: slot.sala_id || defaultSalaId || null,
              data_inicio: occStart.toISOString(),
              data_fim: occEnd.toISOString(),
              status: "confirmado",
              recorrencia: "unica",
              observacoes: `Escala mensal - ${selectedProf?.nome || "Profissional"}`,
            });
          }
        }
      }

      if (occurrencesToInsert.length === 0) {
        throw new Error(
          "Todos os horários para os dias escolhidos já estavam agendados ou conflitam com agendamentos existentes."
        );
      }

      const chunkSize = 50;
      for (let i = 0; i < occurrencesToInsert.length; i += chunkSize) {
        const chunk = occurrencesToInsert.slice(i, i + chunkSize);
        const { error } = await supabase.from("agendamentos").insert(chunk);
        if (error) throw error;
      }

      return occurrencesToInsert.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} sessões da escala do profissional geradas na Agenda!`, {
        action: {
          label: "Acessar Agenda",
          onClick: () => {
            window.location.href = "/agenda";
          },
        },
      });
      qc.invalidateQueries({ queryKey: ["ags"] });
      qc.invalidateQueries({ queryKey: ["massa-agendamentos-mes"] });
      setEscalaDiasSelecionados([]);
      setEscalaSlots([]);
    },
    onError: (e: any) => {
      toast.error(`Erro ao gerar escala: ${e.message}`);
    },
  });

  // Carregar pacientes habituais do profissional para a escala
  const handleCarregarHabituaisProfissional = () => {
    if (!escalaProfId) {
      toast.error("Selecione um profissional primeiro.");
      return;
    }

    const slotsDoProf: typeof escalaSlots = [];
    const prof = profissionais.find((p: any) => p.id === escalaProfId);
    const defaultSalaId = getDefaultRoomIdForProfessional(escalaProfId, profissionais, salas);

    for (const pac of pacientes) {
      const dfs = parseDiasFixos(pac.observacoes);
      for (const df of dfs) {
        if (df.profissional_id === escalaProfId) {
          slotsDoProf.push({
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
            hora_inicio: df.hora_inicio,
            hora_fim: df.hora_fim,
            paciente_id: pac.id,
            servico_id: df.servico_id,
            sala_id: df.sala_id || defaultSalaId || null,
          });
        }
      }
    }

    if (slotsDoProf.length === 0) {
      toast.info(
        "Nenhum horário fixo cadastrado para este profissional. Você pode adicionar manualmente os horários abaixo."
      );
      return;
    }

    setEscalaSlots(slotsDoProf);
    toast.success(`${slotsDoProf.length} horários habituais carregados para o profissional.`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Cabeçalho da Central */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 border-primary/30 text-primary bg-primary/5">
              <Sparkles className="h-3 w-3" /> Central Operacional
            </Badge>
            <span className="text-xs text-muted-foreground">• Reflexo instantâneo na Agenda</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1 flex items-center gap-2.5">
            <CalendarPlus className="h-6 w-6 text-primary" /> Central de Marcação em Massa
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Marque consultas recorrentes e organize a escala de dias dos profissionais para o mês de forma centralizada.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/agenda">
              <Calendar className="h-4 w-4" /> Acessar Agenda
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Link>
          </Button>
        </div>
      </div>

      {/* Seletor de Mês e Métricas Rápidas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 shadow-sm bg-card/60 backdrop-blur">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Mês de Referência
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setSelectedMonthDate(subMonths(selectedMonthDate, 1))}
              >
                &lt;
              </Button>
              <div className="flex-1 text-center font-semibold capitalize text-base">
                {format(selectedMonthDate, "MMMM 'de' yyyy", { locale: ptBR })}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setSelectedMonthDate(addMonths(selectedMonthDate, 1))}
              >
                &gt;
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 px-2 text-primary hover:bg-primary/10"
                onClick={() => setSelectedMonthDate(startOfMonth(new Date()))}
              >
                Atual
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Pacientes Recorrentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between">
            <div className="text-2xl font-bold">{allPatientSlots.length}</div>
            <div className="text-xs text-muted-foreground text-right">
              horários fixos cadastrados
              <br />
              <span className="font-medium text-primary">{totalNovosAgendamentos} sessões a gerar no mês</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Equipe Ativa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between">
            <div className="text-2xl font-bold">{profissionais.length}</div>
            <div className="text-xs text-muted-foreground text-right">
              profissionais disponíveis
              <br />
              <span className="font-medium text-emerald-600 dark:text-emerald-400">Prontos para escala mensal</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md h-10 p-1">
          <TabsTrigger value="recorrentes" className="gap-2 text-xs sm:text-sm">
            <Repeat className="h-4 w-4" /> Pacientes Recorrentes
          </TabsTrigger>
          <TabsTrigger value="escala" className="gap-2 text-xs sm:text-sm">
            <CalendarDays className="h-4 w-4" /> Escala dos Profissionais
          </TabsTrigger>
        </TabsList>

        {/* ============================================================== */}
        {/* ABA 1: PACIENTES RECORRENTES                                   */}
        {/* ============================================================== */}
        <TabsContent value="recorrentes" className="space-y-4">
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-4 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">Pacientes com Horários Recorrentes</CardTitle>
                  <CardDescription>
                    Selecione os horários que deseja lançar na Agenda para {format(selectedMonthDate, "MMMM 'de' yyyy", { locale: ptBR })}.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => handleOpenAddFixSlot()}
                  >
                    <Plus className="h-4 w-4" /> Novo Horário Recorrente
                  </Button>
                </div>
              </div>

              {/* Filtros da tabela */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar paciente..."
                    className="pl-8 h-9 text-xs"
                    value={searchPatient}
                    onChange={(e) => setSearchPatient(e.target.value)}
                  />
                </div>

                <div>
                  <Select value={filterProfissional} onValueChange={setFilterProfissional}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Filtrar profissional..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Profissionais</SelectItem>
                      {profissionais.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome} ({p.especialidade || "Geral"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                  <span>
                    Exibindo <strong>{allPatientSlots.length}</strong> horários fixos
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {allPatientSlots.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground space-y-2">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground/40" />
                  <div className="font-medium">Nenhum horário fixo recorrente encontrado</div>
                  <p className="text-xs max-w-sm mx-auto">
                    Adicione horários recorrentes para os pacientes clicando em &quot;Novo Horário Recorrente&quot; ou na ficha de cada paciente.
                  </p>
                </div>
              ) : (
                <div className="divide-y overflow-x-auto">
                  {/* Linha de seleção geral */}
                  <div className="bg-muted/40 px-4 py-2.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <div className="flex items-center gap-2.5">
                      <Checkbox
                        id="select-all"
                        checked={
                          allPatientSlots.length > 0 &&
                          allPatientSlots.every((item) => selectedSlots[item.key] !== false)
                        }
                        onCheckedChange={(checked) => handleToggleSelectAll(Boolean(checked))}
                      />
                      <label htmlFor="select-all" className="cursor-pointer font-medium text-foreground">
                        Selecionar Todos
                      </label>
                    </div>
                    <div>Situação no Mês Selecionado</div>
                  </div>

                  {allPatientSlots.map((item) => {
                    const isChecked = selectedSlots[item.key] !== false;
                    const totalDatas = item.datesInMonth.length;
                    const novasDatas = item.newDatesToSchedule.length;
                    const agendadasDatas = item.alreadyScheduledDates.length;

                    return (
                      <div
                        key={item.key}
                        className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/20 transition-colors ${
                          !isChecked ? "opacity-60" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={item.key}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              setSelectedSlots((prev) => ({
                                ...prev,
                                [item.key]: Boolean(checked),
                              }));
                            }}
                            className="mt-1"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <label htmlFor={item.key} className="font-semibold text-sm cursor-pointer hover:underline">
                                {item.paciente.nome}
                              </label>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                {DIAS_SEMANA_NOMES[item.diaFixo.dia_semana]}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1 font-medium text-foreground">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {item.diaFixo.hora_inicio} às {item.diaFixo.hora_fim}
                              </span>
                              <span>•</span>
                              <span>{item.profissional?.nome || "Sem profissional"}</span>
                              <span>•</span>
                              <span>{item.servico?.nome || item.profissional?.especialidade || "Atendimento"}</span>
                              <span>•</span>
                              <span>{item.sala?.nome || "Sala padrão"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status no Mês e Ações */}
                        <div className="flex items-center gap-2 sm:gap-3 md:text-right shrink-0">
                          <div className="text-xs">
                            {novasDatas > 0 ? (
                              <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-medium">
                                +{novasDatas} {novasDatas === 1 ? "sessão a criar" : "sessões a criar"}
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
                                <Check className="h-3 w-3" /> Todas já agendadas ({totalDatas})
                              </Badge>
                            )}

                            {agendadasDatas > 0 && novasDatas > 0 && (
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                ({agendadasDatas} já constam na agenda)
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 border-l pl-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                              title="Editar horário recorrente"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(item);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Excluir horário recorrente"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingSlot({ paciente: item.paciente, diaFixo: item.diaFixo });
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>

            <CardFooter className="p-4 sm:p-6 bg-muted/30 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                Total a ser lançado na Agenda:{" "}
                <strong className="text-foreground text-sm">{totalNovosAgendamentos} sessões</strong>
              </div>

              <Button
                size="default"
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                disabled={totalNovosAgendamentos === 0 || gerarRecorrentesMutation.isPending}
                onClick={() => gerarRecorrentesMutation.mutate()}
              >
                <CalendarPlus className="h-4 w-4" />
                {gerarRecorrentesMutation.isPending
                  ? "Gerando agendamentos..."
                  : `Gerar Agendamentos em Massa (${totalNovosAgendamentos})`}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* ABA 2: ESCALA DOS PROFISSIONAIS (DIAS DO MÊS)                  */}
        {/* ============================================================== */}
        <TabsContent value="escala" className="space-y-4">
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-4 border-b">
              <CardTitle className="text-lg">Escala de Atendimento dos Profissionais</CardTitle>
              <CardDescription>
                Selecione os dias específicos do mês que o profissional escolheu para atender e lance as sessões de uma vez na Agenda.
              </CardDescription>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">1. Selecione o Profissional</Label>
                  <Select value={escalaProfId} onValueChange={setEscalaProfId}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Escolha um profissional..." />
                    </SelectTrigger>
                    <SelectContent>
                      {profissionais.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: p.cor || "#3b82f6" }}
                            />
                            <span className="font-medium">{p.nome}</span>
                            <span className="text-xs text-muted-foreground">({p.especialidade || "Geral"})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end justify-between sm:justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-1.5 h-10 text-xs"
                    disabled={!escalaProfId}
                    onClick={handleCarregarHabituaisProfissional}
                  >
                    <Repeat className="h-4 w-4 text-primary" /> Carregar Horários Habituais do Profissional
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-6">
              {/* Passo 2: Seleção de Dias do Mês */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    2. Escolha os Dias do Mês de {format(selectedMonthDate, "MMMM 'de' yyyy", { locale: ptBR })}
                  </Label>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        // Todos os dias de Seg a Sex
                        const uDias = daysInMonth
                          .filter((d) => getDay(d) >= 1 && getDay(d) <= 5)
                          .map((d) => d.getDate());
                        setEscalaDiasSelecionados(uDias);
                      }}
                    >
                      Dias úteis
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        // Seg, Qua, Sex
                        const sqs = daysInMonth
                          .filter((d) => [1, 3, 5].includes(getDay(d)))
                          .map((d) => d.getDate());
                        setEscalaDiasSelecionados(sqs);
                      }}
                    >
                      Seg / Qua / Sex
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        // Ter, Qui
                        const tq = daysInMonth
                          .filter((d) => [2, 4].includes(getDay(d)))
                          .map((d) => d.getDate());
                        setEscalaDiasSelecionados(tq);
                      }}
                    >
                      Ter / Qui
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-rose-500 hover:text-rose-600"
                      onClick={() => setEscalaDiasSelecionados([])}
                    >
                      Limpar
                    </Button>
                  </div>
                </div>

                {/* Grade dos dias do mês */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {/* Cabeçalho dos dias da semana */}
                  {DIAS_SEMANA_ABREV.map((diaAbrev) => (
                    <div
                      key={diaAbrev}
                      className="text-center text-[11px] font-semibold text-muted-foreground uppercase py-1"
                    >
                      {diaAbrev}
                    </div>
                  ))}

                  {/* Espaços vazios antes do primeiro dia do mês */}
                  {Array.from({ length: getDay(monthStart) }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-12 rounded-lg bg-transparent" />
                  ))}

                  {/* Dias do mês */}
                  {daysInMonth.map((d) => {
                    const dayNum = d.getDate();
                    const isSelected = escalaDiasSelecionados.includes(dayNum);
                    const isToday = isSameDay(d, new Date());

                    return (
                      <button
                        type="button"
                        key={dayNum}
                        onClick={() => {
                          setEscalaDiasSelecionados((prev) =>
                            prev.includes(dayNum) ? prev.filter((x) => x !== dayNum) : [...prev, dayNum].sort((a, b) => a - b)
                          );
                        }}
                        className={`h-12 rounded-lg border text-left p-1.5 flex flex-col justify-between transition-all select-none ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary font-semibold shadow-sm"
                            : "bg-card hover:bg-muted/40 border-border text-foreground"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-xs ${isToday && !isSelected ? "text-primary font-bold" : ""}`}>
                            {dayNum}
                          </span>
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <span className={`text-[9px] ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                          {DIAS_SEMANA_ABREV[getDay(d)]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="text-xs text-muted-foreground">
                  <strong>{escalaDiasSelecionados.length}</strong> dia(s) selecionado(s) para a escala deste mês.
                </div>
              </div>

              {/* Passo 3: Horários e Pacientes a Lançar nesses Dias */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    3. Horários da Escala a Lançar nos Dias Escolhidos
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1 h-7 text-xs"
                    onClick={() => {
                      setEscalaSlots((prev) => [
                        ...prev,
                        {
                          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
                          hora_inicio: "08:00",
                          hora_fim: "08:30",
                          paciente_id: "",
                          servico_id: null,
                          sala_id: null,
                        },
                      ]);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar Horário
                  </Button>
                </div>

                {escalaSlots.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    <Clock className="h-8 w-8 mx-auto text-muted-foreground/40 mb-1.5" />
                    <div className="text-xs font-medium">Nenhum horário adicionado na escala ainda</div>
                    <p className="text-[11px] text-muted-foreground max-w-sm mx-auto mt-0.5">
                      Clique em &quot;Carregar Horários Habituais&quot; ou &quot;Adicionar Horário&quot; para definir a grade de atendimentos dos dias escolhidos.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {escalaSlots.map((slot, idx) => (
                      <div
                        key={slot.id}
                        className="p-3 bg-muted/30 rounded-lg border flex flex-col md:flex-row md:items-center gap-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground w-4">{idx + 1}.</span>
                          <Input
                            type="time"
                            className="h-8 text-xs w-24"
                            value={slot.hora_inicio}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEscalaSlots((prev) =>
                                prev.map((s) => (s.id === slot.id ? { ...s, hora_inicio: val } : s))
                              );
                            }}
                          />
                          <span className="text-xs text-muted-foreground">às</span>
                          <Input
                            type="time"
                            className="h-8 text-xs w-24"
                            value={slot.hora_fim}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEscalaSlots((prev) =>
                                prev.map((s) => (s.id === slot.id ? { ...s, hora_fim: val } : s))
                              );
                            }}
                          />
                        </div>

                        <div className="flex-1">
                          <Select
                            value={slot.paciente_id}
                            onValueChange={(val) => {
                              setEscalaSlots((prev) =>
                                prev.map((s) => (s.id === slot.id ? { ...s, paciente_id: val } : s))
                              );
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Selecione o paciente..." />
                            </SelectTrigger>
                            <SelectContent>
                              {pacientes
                                .filter((p: any) => p.status === "ativo")
                                .map((p: any) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.nome}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2">
                          <Select
                            value={slot.sala_id || "default"}
                            onValueChange={(val) => {
                              setEscalaSlots((prev) =>
                                prev.map((s) =>
                                  s.id === slot.id ? { ...s, sala_id: val === "default" ? null : val } : s
                                )
                              );
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs w-32">
                              <SelectValue placeholder="Sala..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Sala Padrão</SelectItem>
                              {salas.map((s: any) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              setEscalaSlots((prev) => prev.filter((s) => s.id !== slot.id));
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="p-4 sm:p-6 bg-muted/30 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                Total da escala:{" "}
                <strong className="text-foreground text-sm">
                  {escalaDiasSelecionados.length * escalaSlots.length} sessões
                </strong>{" "}
                ({escalaDiasSelecionados.length} dias × {escalaSlots.length} horários)
              </div>

              <Button
                size="default"
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                disabled={
                  !escalaProfId ||
                  escalaDiasSelecionados.length === 0 ||
                  escalaSlots.length === 0 ||
                  gerarEscalaProfissionalMutation.isPending
                }
                onClick={() => gerarEscalaProfissionalMutation.mutate()}
              >
                <CheckCircle2 className="h-4 w-4" />
                {gerarEscalaProfissionalMutation.isPending
                  ? "Lançando escala na Agenda..."
                  : `Confirmar e Lançar Escala na Agenda (${escalaDiasSelecionados.length * escalaSlots.length})`}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para Cadastrar Novo Horário Recorrente */}
      <Dialog open={addFixSlotOpen} onOpenChange={setAddFixSlotOpen}>
        <DialogContent className="sm:max-w-lg max-h-[92vh] flex flex-col p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Cadastrar Horário Recorrente</DialogTitle>
            <DialogDescription>
              Vincule horários fixos semanais para o paciente. Escolha múltiplos dias da semana e configure os horários de forma unificada ou individual.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newSlotPatientId || !newSlotProfId) {
                toast.error("Selecione o paciente e o profissional.");
                return;
              }
              if (newSlotDays.length === 0) {
                toast.error("Selecione pelo menos um dia da semana.");
                return;
              }

              const targetPac = pacientes.find((p: any) => p.id === newSlotPatientId);
              if (!targetPac) return;

              const currentDfs = parseDiasFixos(targetPac.observacoes);
              const newSlots: DiaFixo[] = newSlotDays.map((d) => ({
                id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
                profissional_id: newSlotProfId,
                servico_id: null,
                sala_id: newSlotSalaId === "default" ? null : newSlotSalaId,
                dia_semana: d,
                hora_inicio: newSlotDayTimes[d]?.inicio || newSlotGlobalTime.inicio,
                hora_fim: newSlotDayTimes[d]?.fim || newSlotGlobalTime.fim,
              }));

              const updatedDfs = [...currentDfs, ...newSlots];
              const newObs = serializeObservacoes(targetPac.observacoes, updatedDfs);

              const { error } = await supabase
                .from("pacientes")
                .update({ observacoes: newObs })
                .eq("id", newSlotPatientId);

              if (error) {
                toast.error(`Erro ao salvar: ${error.message}`);
              } else {
                toast.success(
                  newSlots.length === 1
                    ? "Horário recorrente cadastrado com sucesso!"
                    : `${newSlots.length} horários recorrentes cadastrados com sucesso!`
                );
                qc.invalidateQueries({ queryKey: ["massa-pacientes"] });
                setAddFixSlotOpen(false);
              }
            }}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="space-y-4 max-h-[62vh] overflow-y-auto pr-1 pb-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Paciente</Label>
                <Select value={newSlotPatientId} onValueChange={setNewSlotPatientId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Selecione o paciente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes
                      .filter((p: any) => p.status === "ativo")
                      .map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Profissional</Label>
                <Select value={newSlotProfId} onValueChange={setNewSlotProfId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Selecione o profissional..." />
                  </SelectTrigger>
                  <SelectContent>
                    {profissionais.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome} ({p.especialidade || "Geral"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Seleção de Múltiplos Dias da Semana */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">
                    Dias da Semana ({newSlotDays.length} selecionado(s))
                  </Label>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-[11px]"
                      onClick={() => setNewSlotDays([1, 3, 5])}
                    >
                      Seg/Qua/Sex
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-[11px]"
                      onClick={() => setNewSlotDays([2, 4])}
                    >
                      Ter/Qui
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-[11px]"
                      onClick={() => setNewSlotDays([1, 2, 3, 4, 5])}
                    >
                      Seg a Sex
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-[11px] text-rose-500 hover:text-rose-600"
                      onClick={() => setNewSlotDays([])}
                    >
                      Limpar
                    </Button>
                  </div>
                </div>

                {/* Botões dos 7 dias da semana */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                    const isSelected = newSlotDays.includes(d);
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => {
                          setNewSlotDays((prev) =>
                            prev.includes(d)
                              ? prev.filter((x) => x !== d)
                              : [...prev, d].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
                          );
                        }}
                        className={`h-9 px-2 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-1 select-none ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm font-semibold"
                            : "bg-background text-muted-foreground hover:bg-muted/50 border-input"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                        {DIAS_SEMANA_NOMES[d].split("-")[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Botão e campos para unificar o mesmo horário para todos os dias escolhidos */}
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>Definir mesmo horário para todos:</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs gap-1 border border-primary/20 bg-background hover:bg-primary hover:text-primary-foreground transition-colors shrink-0"
                    disabled={newSlotDays.length === 0}
                    onClick={handleApplySameTimeToAllDays}
                  >
                    <Check className="h-3.5 w-3.5" /> Replicar para os dias escolhidos
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">Início Padrão</span>
                    <Input
                      type="time"
                      value={newSlotGlobalTime.inicio}
                      onChange={(e) => setNewSlotGlobalTime((prev) => ({ ...prev, inicio: e.target.value }))}
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">Fim Padrão</span>
                    <Input
                      type="time"
                      value={newSlotGlobalTime.fim}
                      onChange={(e) => setNewSlotGlobalTime((prev) => ({ ...prev, fim: e.target.value }))}
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                </div>
              </div>

              {/* Horários individuais por dia selecionado */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Horários específicos por dia:
                </Label>
                {newSlotDays.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground bg-muted/20 border border-dashed rounded-lg">
                    Nenhum dia selecionado. Escolha ao menos um dia da semana acima.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {newSlotDays
                      .slice()
                      .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
                      .map((d) => (
                        <div
                          key={d}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-[110px]">
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                            <span className="text-xs font-semibold text-foreground">
                              {DIAS_SEMANA_NOMES[d]}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-muted-foreground">Início</span>
                              <Input
                                type="time"
                                value={newSlotDayTimes[d]?.inicio || newSlotGlobalTime.inicio}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setNewSlotDayTimes((prev) => ({
                                    ...prev,
                                    [d]: { ...(prev[d] || newSlotGlobalTime), inicio: val },
                                  }));
                                }}
                                className="h-7 w-20 text-xs bg-background px-1.5"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-muted-foreground">Fim</span>
                              <Input
                                type="time"
                                value={newSlotDayTimes[d]?.fim || newSlotGlobalTime.fim}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setNewSlotDayTimes((prev) => ({
                                    ...prev,
                                    [d]: { ...(prev[d] || newSlotGlobalTime), fim: val },
                                  }));
                                }}
                                className="h-7 w-20 text-xs bg-background px-1.5"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Sala (Opcional)</Label>
                <Select value={newSlotSalaId} onValueChange={setNewSlotSalaId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Sala Padrão..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Sala Padrão do Profissional</SelectItem>
                    {salas.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t mt-3 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setAddFixSlotOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!newSlotPatientId || !newSlotProfId || newSlotDays.length === 0}
                className="gap-1.5"
              >
                <Check className="h-4 w-4" />
                Salvar Horário Recorrente {newSlotDays.length > 1 ? `(${newSlotDays.length} dias)` : ""}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Horário Recorrente */}
      <Dialog open={!!editingSlot} onOpenChange={(open) => !open && setEditingSlot(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" /> Editar Horário Recorrente
            </DialogTitle>
            <DialogDescription>
              Altere o profissional, dia da semana, horários ou sala deste agendamento fixo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Paciente</Label>
              <Input
                value={editingSlot?.paciente?.nome || ""}
                disabled
                className="h-9 text-xs bg-muted/50 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Profissional</Label>
              <Select value={editProfId} onValueChange={setEditProfId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Selecione o profissional..." />
                </SelectTrigger>
                <SelectContent>
                  {profissionais.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome} ({p.especialidade || "Geral"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Dia da Semana</Label>
              <Select
                value={String(editDiaSemana)}
                onValueChange={(val) => setEditDiaSemana(Number(val))}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {DIAS_SEMANA_NOMES[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Início</Label>
                <Input
                  type="time"
                  value={editHoraInicio}
                  onChange={(e) => setEditHoraInicio(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Fim</Label>
                <Input
                  type="time"
                  value={editHoraFim}
                  onChange={(e) => setEditHoraFim(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Sala (Opcional)</Label>
              <Select value={editSalaId} onValueChange={setEditSalaId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Sala Padrão..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Sala Padrão do Profissional</SelectItem>
                  {salas.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-3 border-t flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingSlot(null)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="gap-1.5" disabled={!editProfId}>
                <Check className="h-4 w-4" />
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Exclusão de Horário Recorrente */}
      <AlertDialog open={!!deletingSlot} onOpenChange={(open) => !open && setDeletingSlot(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Excluir Horário Recorrente
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 pt-1 text-sm text-foreground/80">
              <p>
                Tem certeza que deseja remover o horário fixo de{" "}
                <strong className="text-foreground">{deletingSlot?.paciente?.nome}</strong>?
              </p>
              {deletingSlot && (
                <div className="p-2.5 rounded-md bg-muted text-xs text-muted-foreground space-y-0.5">
                  <div><strong>Dia:</strong> {DIAS_SEMANA_NOMES[deletingSlot.diaFixo.dia_semana]}</div>
                  <div><strong>Horário:</strong> {deletingSlot.diaFixo.hora_inicio} às {deletingSlot.diaFixo.hora_fim}</div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Esta ação remove o cadastro recorrente deste paciente. Agendamentos já lançados no calendário da Agenda não serão apagados.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSlot}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Horário
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default MarcacaoEmMassaPage;
