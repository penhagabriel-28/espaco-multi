import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Printer,
  Plus,
  Pencil,
  Check,
  Calendar,
  User,
  Activity,
  Sparkles,
  Eye,
  HeartPulse,
  MapPin,
  Phone,
  FileCheck2,
  Users,
  Copy,
  CheckCheck,
  Stethoscope,
  Brain,
  GraduationCap,
  Target,
  Download,
  RotateCcw,
  AlertCircle,
  FileCode,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatCPF, formatBirthDateForDisplay, parseEmailFromObs } from "@/components/PacienteFormDialog";

export interface PlanoEspecialidade {
  especialidade: string;
  titulo: string;
  profissional_nome?: string;
  data_atualizacao?: string;
  objetivos_especificos: string;
  conduta_intervencao?: string;
  orientacoes_familia?: string;
}

export interface ProntuarioData {
  objetivo_compartilhado: string;
  planos: Record<string, PlanoEspecialidade>;
}

export const DEFAULT_PLANOS: Record<string, PlanoEspecialidade> = {
  geral: {
    especialidade: "geral",
    titulo: "Plano Geral",
    objetivos_especificos: "",
    conduta_intervencao: "",
    orientacoes_familia: "",
  },
  pp: {
    especialidade: "pp",
    titulo: "Plano PP (Psicopedagogia)",
    objetivos_especificos: "",
    conduta_intervencao: "",
    orientacoes_familia: "",
  },
  fono: {
    especialidade: "fono",
    titulo: "Plano Fonoaudiologia",
    objetivos_especificos: "",
    conduta_intervencao: "",
    orientacoes_familia: "",
  },
  psico: {
    especialidade: "psico",
    titulo: "Plano Psicologia",
    objetivos_especificos: "",
    conduta_intervencao: "",
    orientacoes_familia: "",
  },
  aba: {
    especialidade: "aba",
    titulo: "Plano ABA",
    objetivos_especificos: "",
    conduta_intervencao: "",
    orientacoes_familia: "",
  },
};

export const parseProntuario = (rawObs: string | null | undefined): ProntuarioData => {
  if (!rawObs) {
    return {
      objetivo_compartilhado: "",
      planos: { ...DEFAULT_PLANOS },
    };
  }
  const match = rawObs.match(/<!--PRONTUARIO:(.*?)-->/);
  if (match) {
    try {
      const parsed = JSON.parse(decodeURIComponent(match[1]));
      return {
        objetivo_compartilhado: parsed.objetivo_compartilhado || "",
        planos: {
          ...DEFAULT_PLANOS,
          ...(parsed.planos || {}),
        },
      };
    } catch (e) {
      console.error("Erro ao fazer parse do prontuário", e);
    }
  }
  return {
    objetivo_compartilhado: "",
    planos: { ...DEFAULT_PLANOS },
  };
};

export const serializeProntuarioInObs = (
  rawObs: string | null | undefined,
  prontuario: ProntuarioData
): string => {
  const current = rawObs || "";
  const tag = `<!--PRONTUARIO:${encodeURIComponent(JSON.stringify(prontuario))}-->`;
  if (/<!--PRONTUARIO:.*?-->/.test(current)) {
    return current.replace(/<!--PRONTUARIO:.*?-->/, tag);
  }
  return `${current}\n\n${tag}`.trim();
};

export interface ProntuarioRelatoriosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paciente: any;
  responsaveis?: any[];
  agendamentos?: any[];
  profissionaisAcompanhantes?: any[];
  enderecoPaciente?: string;
  onProntuarioUpdated?: () => void;
}

export function ProntuarioRelatoriosDialog({
  open,
  onOpenChange,
  paciente,
  responsaveis = [],
  agendamentos = [],
  profissionaisAcompanhantes = [],
  enderecoPaciente = "",
  onProntuarioUpdated,
}: ProntuarioRelatoriosDialogProps) {
  // Prontuario data loaded from patient observations metadata
  const prontuarioData = useMemo(() => {
    return parseProntuario(paciente?.observacoes);
  }, [paciente?.observacoes]);

  const [activePlanTab, setActivePlanTab] = useState("geral");
  const [objetivoCompartilhado, setObjetivoCompartilhado] = useState(
    prontuarioData.objetivo_compartilhado || ""
  );
  const [isEditingObjetivo, setIsEditingObjetivo] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);

  // Sincronização em tempo real de prontuário e relatórios entre todos os dispositivos
  useEffect(() => {
    setObjetivoCompartilhado(prontuarioData.objetivo_compartilhado || "");
  }, [prontuarioData.objetivo_compartilhado]);

  useEffect(() => {
    if (!open || !paciente?.id) return;
    const channelId = `prontuario-modal-realtime-${paciente.id}-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pacientes",
          filter: `id=eq.${paciente.id}`,
        },
        () => {
          onProntuarioUpdated?.();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agendamentos",
          filter: `paciente_id=eq.${paciente.id}`,
        },
        () => {
          onProntuarioUpdated?.();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [open, paciente?.id, onProntuarioUpdated]);

  // Local plan being edited
  const [currentPlanForm, setCurrentPlanForm] = useState<PlanoEspecialidade>(() => {
    return (
      prontuarioData.planos["geral"] || {
        especialidade: "geral",
        titulo: "Plano Geral",
        objetivos_especificos: "",
        conduta_intervencao: "",
        orientacoes_familia: "",
      }
    );
  });

  // Selected session for detailed report modal
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [sessionNoteEdit, setSessionNoteEdit] = useState("");
  const [isSavingSessionNote, setIsSavingSessionNote] = useState(false);

  // Sync when tab or patient changes
  const handleTabChange = (key: string) => {
    setActivePlanTab(key);
    setIsEditingPlan(false);
    const existing = prontuarioData.planos[key] || {
      especialidade: key,
      titulo: DEFAULT_PLANOS[key]?.titulo || `Plano ${key.toUpperCase()}`,
      objetivos_especificos: "",
      conduta_intervencao: "",
      orientacoes_familia: "",
    };
    setCurrentPlanForm(existing);
  };

  // Save Objetivo Compartilhado
  const handleSaveObjetivoCompartilhado = async () => {
    if (!paciente?.id) return;
    try {
      const updated: ProntuarioData = {
        ...prontuarioData,
        objetivo_compartilhado: objetivoCompartilhado.trim(),
      };
      const newObs = serializeProntuarioInObs(paciente.observacoes, updated);
      const { error } = await supabase
        .from("pacientes")
        .update({ observacoes: newObs })
        .eq("id", paciente.id);

      if (error) throw error;
      toast.success("Objetivo compartilhado atualizado com sucesso!");
      setIsEditingObjetivo(false);
      onProntuarioUpdated?.();
    } catch (err: any) {
      toast.error("Erro ao salvar objetivo: " + err.message);
    }
  };

  // Save Plan
  const handleSavePlan = async () => {
    if (!paciente?.id) return;
    try {
      const updated: ProntuarioData = {
        ...prontuarioData,
        planos: {
          ...prontuarioData.planos,
          [activePlanTab]: {
            ...currentPlanForm,
            data_atualizacao: new Date().toISOString(),
          },
        },
      };
      const newObs = serializeProntuarioInObs(paciente.observacoes, updated);
      const { error } = await supabase
        .from("pacientes")
        .update({ observacoes: newObs })
        .eq("id", paciente.id);

      if (error) throw error;
      toast.success(`Plano ${currentPlanForm.titulo} salvo com sucesso!`);
      setIsEditingPlan(false);
      onProntuarioUpdated?.();
    } catch (err: any) {
      toast.error("Erro ao salvar plano: " + err.message);
    }
  };

  // Save Session Note / Adjustment
  const handleSaveSessionAdjustment = async () => {
    if (!selectedSession?.id) return;
    setIsSavingSessionNote(true);
    try {
      const { error } = await supabase
        .from("agendamentos")
        .update({ observacoes: sessionNoteEdit })
        .eq("id", selectedSession.id);

      if (error) throw error;
      toast.success("Ajuste da sessão atualizado com sucesso!");
      setSelectedSession((prev: any) => ({ ...prev, observacoes: sessionNoteEdit }));
      onProntuarioUpdated?.();
    } catch (err: any) {
      toast.error("Erro ao salvar ajuste da sessão: " + err.message);
    } finally {
      setIsSavingSessionNote(false);
    }
  };

  // Print format
  const handlePrint = () => {
    window.print();
  };

  const primaryResp = responsaveis[0] || null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl w-[96vw] max-h-[92vh] flex flex-col p-4 sm:p-6 overflow-hidden">
          {/* Header */}
          <DialogHeader className="pb-3 border-b border-border/60 shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 shadow-xs">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    Prontuário & Relatórios do Paciente
                    <Badge
                      variant="outline"
                      className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 border-purple-500/30 bg-purple-500/5"
                    >
                      Multidisciplinar
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Histórico clínico, planos terapêuticos e relatórios de sessões de{" "}
                    <strong className="text-foreground">{paciente?.nome}</strong>
                  </DialogDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="h-8 text-xs gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                  Imprimir / PDF
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1 print:overflow-visible">
            {/* ======================================================== */}
            {/* SEÇÃO 1: DADOS PESSOAIS (Conforme Anexo)                 */}
            {/* ======================================================== */}
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  Dados Pessoais
                </span>
                <Badge variant={paciente?.status === "ativo" ? "default" : "secondary"} className="text-[10px]">
                  {paciente?.status === "ativo" ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Nome do Paciente</span>
                  <span className="font-semibold text-foreground text-[13px]">{paciente?.nome}</span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Nascimento / Idade</span>
                  <span className="font-medium text-foreground">
                    {paciente?.data_nascimento
                      ? `${formatBirthDateForDisplay(paciente.data_nascimento)}`
                      : "Não informado"}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">CID(s)</span>
                  <span className="font-medium text-foreground">
                    {paciente?.cid_principal || "Não informado"}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Responsável Principal</span>
                  <span className="font-medium text-foreground">
                    {primaryResp?.nome || "Não informado"}
                    {primaryResp?.parentesco ? ` (${primaryResp.parentesco})` : ""}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Contato / Telefone</span>
                  <span className="font-medium text-foreground">
                    {primaryResp?.telefone || primaryResp?.whatsapp || "Não informado"}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">E-mail</span>
                  <span className="font-medium text-foreground">
                    {primaryResp?.email || parseEmailFromObs(paciente?.observacoes) || "Não informado"}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">CPF do Responsável</span>
                  <span className="font-medium text-foreground">
                    {paciente?.cpf || primaryResp?.cpf ? formatCPF(paciente?.cpf || primaryResp?.cpf) : "Não informado"}
                  </span>
                </div>

                <div className="sm:col-span-2 md:col-span-3">
                  <span className="text-muted-foreground block text-[11px] flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-rose-500" />
                    Endereço
                  </span>
                  <span className="font-medium text-foreground">
                    {enderecoPaciente || primaryResp?.endereco || paciente?.endereco || "Não informado"}
                  </span>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* SEÇÃO 2: PLANOS TERAPÊUTICOS (Conforme Anexo)           */}
            {/* ======================================================== */}
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-500/20 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-purple-600/10 flex items-center justify-center text-purple-700 dark:text-purple-300">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-200">
                      Planos Terapêuticos por Especialidade
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Defina e visualize os planos específicos de cada área
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant={isEditingPlan ? "secondary" : "default"}
                  className="h-7 text-xs gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium"
                  onClick={() => setIsEditingPlan(!isEditingPlan)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {isEditingPlan ? "Cancelar Edição" : "Editar / Criar Plano"}
                </Button>
              </div>

              {/* Tabs dos Planos (Plano Geral, PP, Fono, Psico, ABA) */}
              <Tabs value={activePlanTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="h-8 p-0.5 bg-muted/60 border border-border/60 flex flex-wrap max-w-full justify-start gap-1">
                  <TabsTrigger value="geral" className="text-xs h-7 px-3 font-medium">
                    Plano Geral
                  </TabsTrigger>
                  <TabsTrigger value="pp" className="text-xs h-7 px-3">
                    Plano PP
                  </TabsTrigger>
                  <TabsTrigger value="fono" className="text-xs h-7 px-3">
                    Plano Fono
                  </TabsTrigger>
                  <TabsTrigger value="psico" className="text-xs h-7 px-3">
                    Plano Psico
                  </TabsTrigger>
                  <TabsTrigger value="aba" className="text-xs h-7 px-3">
                    Plano ABA
                  </TabsTrigger>
                </TabsList>

                {/* Área onde o plano aparece ("plano aparecer") */}
                <div className="mt-3 rounded-lg border border-border/80 bg-background p-3 text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <FileCheck2 className="h-4 w-4 text-purple-600" />
                      {currentPlanForm.titulo}
                    </span>
                    {currentPlanForm.data_atualizacao && (
                      <span className="text-[10px] text-muted-foreground">
                        Atualizado em:{" "}
                        {format(new Date(currentPlanForm.data_atualizacao), "dd/MM/yyyy HH:mm")}
                      </span>
                    )}
                  </div>

                  {isEditingPlan ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Título do Plano</Label>
                        <Input
                          value={currentPlanForm.titulo}
                          onChange={(e) =>
                            setCurrentPlanForm({ ...currentPlanForm, titulo: e.target.value })
                          }
                          className="h-8 text-xs"
                          placeholder="Ex: Plano Psicopedagógico (PP)..."
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">
                          Objetivos Específicos & Metas do Plano
                        </Label>
                        <Textarea
                          value={currentPlanForm.objetivos_especificos}
                          onChange={(e) =>
                            setCurrentPlanForm({
                              ...currentPlanForm,
                              objetivos_especificos: e.target.value,
                            })
                          }
                          rows={4}
                          className="text-xs resize-y"
                          placeholder="Descreva as metas terapêuticas, programas específicos e condutas desta especialidade..."
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">
                          Conduta / Métodos de Intervenção
                        </Label>
                        <Textarea
                          value={currentPlanForm.conduta_intervencao || ""}
                          onChange={(e) =>
                            setCurrentPlanForm({
                              ...currentPlanForm,
                              conduta_intervencao: e.target.value,
                            })
                          }
                          rows={2}
                          className="text-xs resize-y"
                          placeholder="Estratégias metodológicas, recursos didáticos, tempo de atenção..."
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">
                          Orientações para a Família e Escola
                        </Label>
                        <Textarea
                          value={currentPlanForm.orientacoes_familia || ""}
                          onChange={(e) =>
                            setCurrentPlanForm({
                              ...currentPlanForm,
                              orientacoes_familia: e.target.value,
                            })
                          }
                          rows={2}
                          className="text-xs resize-y"
                          placeholder="Orientações e manejo comportamental para o ambiente doméstico..."
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSavePlan}
                          className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium gap-1"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Salvar Plano {currentPlanForm.titulo}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div>
                        <span className="font-semibold text-muted-foreground block text-[11px]">
                          Objetivos Específicos & Metas
                        </span>
                        {currentPlanForm.objetivos_especificos ? (
                          <p className="whitespace-pre-wrap text-foreground mt-0.5 text-xs leading-relaxed">
                            {currentPlanForm.objetivos_especificos}
                          </p>
                        ) : (
                          <p className="text-muted-foreground italic text-xs mt-0.5">
                            Nenhum objetivo específico registrado para este plano. Clique em "Editar / Criar Plano" acima para preencher.
                          </p>
                        )}
                      </div>

                      {currentPlanForm.conduta_intervencao && (
                        <div>
                          <span className="font-semibold text-muted-foreground block text-[11px]">
                            Conduta / Estratégias
                          </span>
                          <p className="whitespace-pre-wrap text-foreground mt-0.5 text-xs leading-relaxed">
                            {currentPlanForm.conduta_intervencao}
                          </p>
                        </div>
                      )}

                      {currentPlanForm.orientacoes_familia && (
                        <div>
                          <span className="font-semibold text-muted-foreground block text-[11px]">
                            Orientações para Família e Escola
                          </span>
                          <p className="whitespace-pre-wrap text-foreground mt-0.5 text-xs leading-relaxed">
                            {currentPlanForm.orientacoes_familia}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Tabs>

              {/* • Objetivo Compartilhado (Todos Visualizar) */}
              <div className="rounded-lg border-2 border-indigo-500/40 bg-indigo-50/50 dark:bg-indigo-950/20 p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wide text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    • Objetivo Compartilhado (Todos Visualizar)
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 px-2"
                    onClick={() => setIsEditingObjetivo(!isEditingObjetivo)}
                  >
                    {isEditingObjetivo ? "Cancelar" : "Editar Objetivo"}
                  </Button>
                </div>

                {isEditingObjetivo ? (
                  <div className="space-y-2">
                    <Textarea
                      value={objetivoCompartilhado}
                      onChange={(e) => setObjetivoCompartilhado(e.target.value)}
                      rows={3}
                      className="text-xs bg-background resize-y"
                      placeholder="Insira a meta ou objetivo compartilhado que todos os profissionais devem focar com o paciente..."
                    />
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveObjetivoCompartilhado}
                        className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium gap-1"
                      >
                        <Check className="h-3 w-3" />
                        Salvar Objetivo Compartilhado
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {objetivoCompartilhado ? (
                      <p className="whitespace-pre-wrap text-foreground font-medium leading-relaxed">
                        {objetivoCompartilhado}
                      </p>
                    ) : (
                      <p className="text-muted-foreground italic text-xs">
                        Nenhum objetivo transdisciplinar compartilhado definido ainda. Clique em "Editar Objetivo" para registrar a meta comum da equipe.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ======================================================== */}
            {/* SEÇÃO 3: RESULTADOS (TODOS VISUALIZAR) (Conforme Anexo) */}
            {/* ======================================================== */}
            <div className="rounded-xl border border-border/80 bg-background overflow-hidden text-xs space-y-0">
              <div className="px-4 py-3 bg-muted/30 border-b border-border/60 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Resultados & Relatórios das Sessões (Todos Visualizar)
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Histórico de atendimentos com relatório de cada sessão, evolução e orientações
                  </p>
                </div>

                <Badge variant="outline" className="text-[11px]">
                  {agendamentos.length} sessão(ões) registradas
                </Badge>
              </div>

              {agendamentos.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum atendimento ou sessão registrado para este paciente até o momento.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/20">
                        <TableHead className="w-[140px] text-xs font-bold">Data</TableHead>
                        <TableHead className="w-[200px] text-xs font-bold">Profissional</TableHead>
                        <TableHead className="text-xs font-bold">Ajuste / Orientação / Relatório</TableHead>
                        <TableHead className="w-[130px] text-right text-xs font-bold">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agendamentos.map((ag: any) => {
                        const profNome = ag.profissionais?.nome || "Profissional";
                        const profCor = ag.profissionais?.cor || "#8b5cf6";
                        const servNome = ag.servicos?.nome || "";
                        const dataFormatada = ag.data_inicio
                          ? format(new Date(ag.data_inicio), "dd/MM/yyyy HH:mm")
                          : "—";

                        const planoAba = ag.plano_aba as any;
                        const hasAba = !!planoAba?.programas?.length;
                        const rawObs = ag.observacoes || "";
                        const cleanObs = rawObs
                          .replace(/\[Tipo:\s*[^\]]+\]/gi, "")
                          .replace(/\[Meio:\s*[^\]]+\]/gi, "")
                          .replace(/\[Endereço:\s*[^\]]+\]/gi, "")
                          .replace(/\[Email:\s*[^\]]+\]/gi, "")
                          .trim();
                        const isReportFilled = Boolean(cleanObs && cleanObs.length > 0);
                        const ajusteTexto = cleanObs || planoAba?.observacoes_medica || "";

                        return (
                          <TableRow key={ag.id} className="hover:bg-muted/40 transition-colors">
                            {/* Data */}
                            <TableCell className="font-medium whitespace-nowrap text-xs">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span>{dataFormatada}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground capitalize block ml-5">
                                {ag.status || "agendado"}
                              </span>
                            </TableCell>

                            {/* Profissional */}
                            <TableCell className="text-xs">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="h-2.5 w-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: profCor }}
                                />
                                <span className="font-semibold text-foreground truncate max-w-[170px]">
                                  {profNome}
                                </span>
                              </div>
                              {servNome && (
                                <span className="text-[10px] text-muted-foreground block truncate ml-4">
                                  {servNome}
                                </span>
                              )}
                            </TableCell>

                            {/* Ajuste / Orientação */}
                            <TableCell className="text-xs">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-1">
                                  {hasAba && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] py-0 px-1.5 font-medium border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 gap-1"
                                    >
                                      <Activity className="h-2.5 w-2.5" />
                                      Plano ABA ({planoAba.programas.length} progs)
                                    </Badge>
                                  )}
                                  {isReportFilled ? (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] py-0 px-1.5 font-medium border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 gap-1"
                                    >
                                      <FileCheck2 className="h-2.5 w-2.5 text-emerald-600" />
                                      Relatório Preenchido
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] py-0 px-1.5 font-medium border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10"
                                    >
                                      Pendente
                                    </Badge>
                                  )}
                                </div>
                                {ajusteTexto ? (
                                  <p className="line-clamp-2 text-foreground text-xs leading-relaxed whitespace-pre-line">
                                    {ajusteTexto}
                                  </p>
                                ) : (
                                  <span className="text-muted-foreground italic text-[11px]">
                                    Sem observações registradas nesta sessão
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            {/* Ações */}
                            <TableCell className="text-right whitespace-nowrap">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedSession(ag);
                                  setSessionNoteEdit(ag.observacoes || "");
                                }}
                                className="h-8 text-xs px-3 gap-1.5 border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 hover:text-purple-800 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300 font-medium shadow-sm transition-all"
                              >
                                <FileText className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                Relatório da Sessão
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhado da Sessão Selecionada */}
      {selectedSession && (
        <DetalhesSessaoDialog
          open={!!selectedSession}
          onOpenChange={(open) => !open && setSelectedSession(null)}
          session={selectedSession}
          pacienteNome={paciente?.nome}
          paciente={paciente}
          responsaveis={responsaveis}
          enderecoPaciente={enderecoPaciente}
          onSessionUpdated={() => {
            onProntuarioUpdated?.();
          }}
        />
      )}
    </>
  );
}

export type ClinicalSpecialty = "fono" | "psicoterapia" | "psicopedagogia" | "aba";

export const CLINICAL_SPECIALTIES_INFO: Record<
  ClinicalSpecialty,
  {
    name: string;
    sublabel: string;
    baseNormativa: string;
    council: string;
    colorBadge: string;
  }
> = {
  fono: {
    name: "Fonoaudiologia",
    sublabel: "CFFa nº 645/2021",
    baseNormativa: "Resolução CFFa nº 645/2021 e Guia para Registro em Prontuário (CFFa)",
    council: "CFFa",
    colorBadge: "bg-blue-500/10 text-blue-700 border-blue-300 dark:text-blue-300",
  },
  psicoterapia: {
    name: "Psicoterapia (Psicologia)",
    sublabel: "CFP nº 01/2009",
    baseNormativa: "Resolução CFP nº 01/2009 (alterada pela 05/2010) e Manual de Documentos Psicológicos do CFP",
    council: "CRP",
    colorBadge: "bg-purple-500/10 text-purple-700 border-purple-300 dark:text-purple-300",
  },
  psicopedagogia: {
    name: "Psicopedagogia",
    sublabel: "ABPp / Sem CID",
    baseNormativa: "Código de Ética da ABPp e Lei nº 15.519/2026 (Sem emissão de CID/laudo médico)",
    council: "CBO 2394-25 / ABPp",
    colorBadge: "bg-amber-500/10 text-amber-700 border-amber-300 dark:text-amber-300",
  },
  aba: {
    name: "Terapia ABA",
    sublabel: "Análise do Comportamento",
    baseNormativa: "Diretrizes e Nota Técnica do CFP e Normas do Conselho de Classe Competente",
    council: "Conselho Competente (CRP/CREFONO/CREFITO)",
    colorBadge: "bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:text-emerald-300",
  },
};

export function detectSpecialty(
  servicoNome?: string,
  profissionalEspecialidade?: string,
  observacoes?: string
): ClinicalSpecialty {
  const combined = `${servicoNome || ""} ${profissionalEspecialidade || ""} ${observacoes || ""}`.toLowerCase();
  if (combined.includes("fono") || combined.includes("audiolog") || combined.includes("voz")) return "fono";
  if (combined.includes("aba") || combined.includes("comportament") || combined.includes("dtt")) return "aba";
  if (combined.includes("psicopedag") || combined.includes("aprendiz") || combined.includes("pp")) return "psicopedagogia";
  if (combined.includes("psico") || combined.includes("terapia") || combined.includes("psi")) return "psicoterapia";
  return "psicopedagogia";
}

function calculateAge(birthDateStr?: string | null): string {
  if (!birthDateStr) return "[Não informado na sessão]";
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return "[Não informado na sessão]";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age > 0 ? `${age} anos` : "Menos de 1 ano";
}

function calculateDuration(start?: string | null, end?: string | null): string {
  if (!start || !end) return "50 minutos";
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return "50 minutos";
  const diffMinutes = Math.round((e.getTime() - s.getTime()) / (1000 * 60));
  return diffMinutes > 0 ? `${diffMinutes} minutos` : "50 minutos";
}

export function generateClinicalReportTemplate({
  specialty,
  session,
  paciente,
  responsaveis = [],
  enderecoPaciente = "",
}: {
  specialty: ClinicalSpecialty;
  session?: any;
  paciente?: any;
  responsaveis?: any[];
  enderecoPaciente?: string;
}): string {
  const pacienteNome =
    paciente?.nome ||
    session?.paciente?.nome ||
    session?.pacientes?.nome ||
    "[Não informado na sessão]";

  const dataNasc = paciente?.data_nascimento
    ? formatBirthDateForDisplay(paciente.data_nascimento)
    : "[Não informado na sessão]";

  const idade = calculateAge(paciente?.data_nascimento);

  const respPrincipal = responsaveis?.[0];
  const responsavelInfo = respPrincipal?.nome
    ? `${respPrincipal.nome}${respPrincipal.parentesco ? ` (${respPrincipal.parentesco})` : ""}${respPrincipal.telefone ? ` - Contato: ${respPrincipal.telefone}` : ""}`
    : (paciente?.responsavel_nome
        ? `${paciente.responsavel_nome}${paciente.telefone ? ` - Contato: ${paciente.telefone}` : ""}`
        : "[Não informado na sessão]");

  const contatoInfo =
    paciente?.telefone || respPrincipal?.telefone || "[Não informado na sessão]";

  const profissionalNome = session?.profissionais?.nome || "[Não informado na sessão]";
  const registroProfissional =
    session?.profissionais?.registro || "[Não informado na sessão]";
  const especialidadeProfissional =
    session?.profissionais?.especialidade ||
    session?.servicos?.nome ||
    CLINICAL_SPECIALTIES_INFO[specialty].name;

  const dataSessao = session?.data_inicio
    ? format(new Date(session.data_inicio), "dd/MM/yyyy", { locale: ptBR })
    : format(new Date(), "dd/MM/yyyy", { locale: ptBR });

  const dataExtenso = session?.data_inicio
    ? format(new Date(session.data_inicio), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  const horarioSessao = session?.data_inicio
    ? `${format(new Date(session.data_inicio), "HH:mm", { locale: ptBR })}${
        session.data_fim
          ? ` às ${format(new Date(session.data_fim), "HH:mm", { locale: ptBR })}`
          : ""
      }`
    : "[Não informado na sessão]";

  const duracaoSessao = calculateDuration(session?.data_inicio, session?.data_fim);
  const diagnosticoBase =
    paciente?.cids_secundarios || paciente?.cid || "[Não informado na sessão]";

  const planoAba = session?.plano_aba;
  let programasAbaStr = "";
  if (planoAba?.programas && Array.isArray(planoAba.programas) && planoAba.programas.length > 0) {
    programasAbaStr =
      "- **Programas ABA Aplicados e Medidas:**\n" +
      planoAba.programas
        .map((p: any, idx: number) => {
          const respCount = p.respostas ? Object.keys(p.respostas).length : 0;
          return `  - Programa ${idx + 1}: **${p.nome || "Não especificado"}** — ${
            respCount > 0 ? `${respCount} tentativas registradas` : "em aplicação"
          }${p.descricao ? ` (${p.descricao})` : ""}`;
        })
        .join("\n");
  } else {
    programasAbaStr =
      "- **Programas ABA Aplicados e Medidas:** [Registrar taxa de acertos, frequência de respostas corretas, ensaios discretos executados]";
  }

  if (specialty === "fono") {
    return `# RELATÓRIO DE EVOLUÇÃO CLÍNICA EM FONOAUDIOLOGIA
*Base Normativa: Resolução CFFa nº 645/2021 e Guia para Registro em Prontuário do CFFa*

## 1. Identificação do Paciente
- **Nome Completo:** ${pacienteNome}
- **Data de Nascimento:** ${dataNasc} (Idade: ${idade})
- **Contato:** ${contatoInfo}
- **Responsável Legal:** ${responsavelInfo}

## 2. Identificação do Profissional
- **Fonoaudiólogo(a) Responsável:** ${profissionalNome}
- **Profissão:** Fonoaudiologia
- **Registro Profissional:** CFFa nº ${registroProfissional}

## 3. Data e Horário do Atendimento
- **Data da Sessão:** ${dataSessao}
- **Horário:** ${horarioSessao} (Duração: ${duracaoSessao})
- **Tipo de Atendimento:** Sessão de Terapia Fonoaudiológica [ou: Avaliação / Reavaliação / Orientação]

## 4. Anamnese e Queixa Fonoaudiológica
- **Resumo da Demanda / Queixa Principal:** [Descrever a queixa clínica ou motivo da busca fonoaudiológica]

## 5. Procedimentos e Testes Realizados na Sessão
- **Instrumentos e Técnicas Aplicadas:** [Descrever objetivamente os exercícios miofuncionais, treino auditivo, motricidade orofacial, articulação, deglutição ou estimulação de linguagem trabalhados na sessão]

## 6. Evolução e Descrição do Atendimento
- **Aspectos Trabalhados e Respostas do Paciente:** [Descrever o engajamento, desempenho sonoro/articulatório, respostas funcionais, facilidades e dificuldades observadas]

## 7. Diagnóstico Fonoaudiológico e Prognóstico
- **Hipótese / Conclusão Diagnóstica:** [Descrever conclusão ou registrar: 'Avaliação inconclusa até a presente data, conforme prerrogativa da Resolução CFFa nº 645/2021']
- **Prognóstico:** [Favorável / Reservado / Em evolução continuada]

## 8. Condutas e Orientações Fornecidas
- **Orientações ao Paciente / Responsável:** [Orientações práticas de estimulação diária no domicílio e condutas prescritas para a rotina]

## 9. Encaminhamentos Realizados / Retornos Recebidos
- **Encaminhamentos:** [Registrar interconsultas com Neurologia, Ortodontia, Otorrinolaringologia, etc., ou '[Não informado na sessão]']

## 10. Registro de Assiduidade e Ocorrências
- **Faltas / Atrasos / Intercorrências:** Atendimento realizado no horário previsto, sem intercorrências registradas.

## 11. Termo de Consentimento e Privacidade (LGPD)
- Os dados sensíveis contidos neste prontuário são tratados estritamente para fins de acompanhamento terapêutico fonoaudiológico, sob sigilo profissional e em conformidade com a LGPD (Lei nº 13.709/2018).

---
**Local e Data:** São Luís - MA, ${dataExtenso}  

____________________________________________________  
**${profissionalNome}**  
Fonoaudiólogo(a) — CFFa nº ${registroProfissional}`;
  }

  if (specialty === "psicoterapia") {
    return `# REGISTRO DE EVOLUÇÃO PSICOTERAPÊUTICA
*Base Normativa: Resolução CFP nº 01/2009 (alterada pela 05/2010) e Manual de Documentos Psicológicos do CFP*

## 1. Identificação do Paciente / Usuário
- **Nome Completo:** ${pacienteNome}
- **Nome Social:** [Não informado na sessão]
- **Data de Nascimento:** ${dataNasc} (Idade: ${idade})
- **Documento de Identificação:** [Não informado na sessão]
- **Contato:** ${contatoInfo}
- **Responsável Legal:** ${responsavelInfo}

## 2. Identificação do Profissional
- **Psicólogo(a) Responsável:** ${profissionalNome}
- **Registro Profissional:** CRP nº ${registroProfissional}

## 3. Dados do Atendimento
- **Data da Sessão:** ${dataSessao}
- **Horário:** ${horarioSessao} (Duração: ${duracaoSessao})
- **Modalidade:** Sessão de Psicoterapia Individual

## 4. Avaliação da Demanda
- **Motivo da Busca / Demanda Terapêutica:** [Síntese da demanda clínica acolhida e foco do processo psicoterápico em andamento]

## 5. Objetivos Terapêuticos
- **Metas do Enquadre:** [Metas de curto, médio e longo prazo estabelecidas no plano terapêutico singular]

## 6. Evolução da Sessão (Síntese Técnico-Científica)
- **Procedimentos e Manejos Adotados:** [Descrever atividades realizadas, procedimentos técnico-científicos adotados segundo a abordagem clínica de referência]
- **Processos e Respostas Observados:** [Síntese compreensiva das manifestações emocionais, elaborações do paciente e dinâmicas observadas ao longo do tempo — sem transcrição literal de falas, respeitando o princípio ético da síntese clínica do CFP]

## 7. Encaminhamentos, Intercorrências ou Encerramento
- **Encaminhamentos / Rede de Cuidados:** [Registrar encaminhamentos para Psiquiatria, Neurologia, Escola, ou 'Nenhum encaminhamento necessário nesta sessão']

## 8. Documentos Complementares
- **Referências a Registros / Avaliações:** [Referência a laudos, instrumentos de avaliação psicológica aplicados ou '[Não informado na sessão]']

## 9. Sigilo Profissional e Guarda Documental
- O presente registro tem natureza estritamente sigilosa, com guarda sob responsabilidade do profissional/instituição e acesso restrito ao paciente ou representante legal, conforme normas vigentes do CFP.

---
**Local e Data:** São Luís - MA, ${dataExtenso}  

____________________________________________________  
**${profissionalNome}**  
Psicólogo(a) Clínico(a) — CRP nº ${registroProfissional}`;
  }

  if (specialty === "psicopedagogia") {
    return `# RELATÓRIO DE SESSÃO PSICOPEDAGÓGICA
*Base Normativa: Código de Ética da ABPp, Lei nº 15.519/2026 e Padrões Técnicos de Relatório Psicopedagógico*

## 1. Dados Pessoais do Aprendente
- **Nome Completo:** ${pacienteNome}
- **Data de Nascimento:** ${dataNasc} (Idade: ${idade})
- **Escola / Instituição de Ensino:** [Não informado na sessão]
- **Série / Ano Escolar:** [Não informado na sessão]
- **Responsáveis Legais:** ${responsavelInfo}
- **Contato:** ${contatoInfo}

## 2. Dados Técnicos da Avaliação / Intervenção
- **Data da Sessão:** ${dataSessao}
- **Local:** Espaço MULTI
- **Duração do Atendimento:** ${duracaoSessao}
- **Tipo de Atendimento:** Intervenção Psicopedagógica Clínica

## 3. Queixa / Demanda Psicopedagógica
- **Resumo da Demanda:** [Dificuldades relatadas no processo de ensino-aprendizagem, leitura, escrita, cálculo ou organização do pensamento]

## 4. Dados Relevantes da Anamnese
- **Histórico e Contexto:** [Dados relevantes sobre histórico escolar, desenvolvimento psicomotor e dinâmica familiar/escolar relacionados à sessão]

## 5. Aspectos Trabalhados na Sessão
- **Funções Cognitivas e Executivas:** [Atenção concentrada, memória de trabalho, planejamento, flexibilidade cognitiva]
- **Leitura, Escrita e Linguagem:** [Decodificação, compreensão textual, fluência leitora e consciência fonológica]
- **Raciocínio Lógico-Matemático:** [Construção do número, seriação, conservação de quantidade e resolução de problemas]
- **Aspectos Emocionais e Vínculo com o Saber:** [Postura diante do erro, tolerância à frustração e relação com o aprender]

## 6. Instrumentos, Recursos e Estratégias Utilizados
- **Recursos Pedagógicos:** [Jogos de regras, atividades estruturadas, desafios lógico-matemáticos, materiais multissensoriais e mediação psicopedagógica]

## 7. Análise dos Resultados da Sessão
- **Avanços e Desafios Observados:** [Respostas do aprendente às mediações, estratégias espontâneas adotadas e barreiras que ainda persistem]

## 8. Hipótese Diagnóstica Psicopedagógica
- **Formulação da Natureza da Aprendizagem:** [Caracterização psicopedagógica dos processos e estilos de aprendizagem do aprendente — *Nota Ética: O presente documento possui finalidade exclusivamente psicopedagógica, não configurando laudo médico e prescindindo de CID, em estrita conformidade com as diretrizes da ABPp*]

## 9. Recomendações e Encaminhamentos
- **Orientações à Família:** [Estratégias de rotina, mediação de tarefas domiciliares e incentivo cognitivo]
- **Orientações à Escola:** [Adequações pedagógicas, tempo estendido para avaliações e suporte mediado em sala]
- **Encaminhamentos:** [Encaminhamentos a Fonoaudiologia, Psicologia, Neuropediatria quando achados indicarem necessidade de diagnóstico clínico complementar]

---
**Local e Data:** São Luís - MA, ${dataExtenso}  

____________________________________________________  
**${profissionalNome}**  
Psicopedagogo(a) — CBO: 2394-25 / Inscrição ABPp: ${registroProfissional || "[Não informado na sessão]"}  
*(Documento emitido conforme parâmetros éticos da Associação Brasileira de Psicopedagogia — ABPp)*`;
  }

  // Terapia ABA
  return `# RELATÓRIO DE SESSÃO DE TERAPIA ABA
*Análise do Comportamento Aplicada — Base Normativa: Diretrizes e Nota Técnica do CFP e Normas do Conselho de Classe Competente*

## 1. Identificação do Paciente / Aprendiz
- **Nome Completo:** ${pacienteNome}
- **Idade:** ${idade}
- **Diagnóstico de Base (estabelecido por médico especialista):** ${diagnosticoBase}
- **Responsável Legal:** ${responsavelInfo}

## 2. Identificação do Profissional e Conselho de Classe Competente
- **Terapeuta / Aplicador(a) ABA:** ${profissionalNome}
- **Formação de Base:** ${especialidadeProfissional}
- **Conselho de Classe Competente:** ${registroProfissional || "[Não informado na sessão]"} (ex.: CRP / CREFONO / CREFITO)
- **Coordenação / Supervisão do Caso:** [Não informado na sessão]

## 3. Dados da Sessão
- **Data da Sessão:** ${dataSessao}
- **Horário:** ${horarioSessao}
- **Duração:** ${duracaoSessao}
- **Ambiente de Aplicação:** Sala Clínica Estruturada

## 4. Objetivos do Plano de Intervenção Comportamental (PEI)
- **Comportamentos-Alvo:** [Comunicação funcional, seguimento de instruções, imitação motora, ecoico, tato, intraverbal, habilidades sociais e redução de comportamentos disruptivos]

## 5. Procedimentos ABA Aplicados na Sessão
- **Estratégias Comportamentais:** [Ensino por Tentativas Discretas (DTT), Ensino em Ambiente Natural (NET), Modelagem, Encadeamento e Procedimento de Dica / Esvaecimento (Prompt Fading)]
- **Esquema de Reforçamento:** [Reforçamento diferencial (DRA/DRI), emparelhamento de reforçadores e acesso a reforçadores contingentes à resposta correta]

## 6. Coleta de Dados e Medidas Objetivas
${programasAbaStr}
- **Comportamentos Concorrentes / Desafiadores:** [Frequência, duração ou intensidade registradas — ou 'Zero ocorrência de comportamentos disruptivos na sessão']

## 7. Análise de Progresso e Desempenho
- **Resposta às Contingências:** [Taxa de acertos independentes vs. com nível de dica, aquisição e retenção dos alvos trabalhados]
- **Generalização e Manutenção:** [Desempenho com variação de estímulos instrutivos, materiais e interlocutores]

## 8. Supervisão e Equipe Multidisciplinar
- **Alinhamento do Plano de Ensino:** [Sessão alinhada com coordenação/supervisão ABA e registro em folha de dados comportamentais]

## 9. Encaminhamentos e Recomendações
- **Ajustes no Plano Comportamental:** [Critério de aprendizagem atingido para progressão de fase ou necessidade de reforço em alvos específicos]
- **Orientações para o Contexto Domiciliar (Treino de Pais):** [Recomendações práticas para manutenção das contingências no ambiente doméstico]

---
**Local e Data:** São Luís - MA, ${dataExtenso}  

____________________________________________________  
**${profissionalNome}**  
Terapeuta ABA — Registro Conselho: ${registroProfissional || "[Não informado na sessão]"}`;
}

function formatInlineMarkdown(text: string) {
  const parts: (string | React.ReactNode)[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|\[Não informado na sessão\]|\[Não informado\])/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token === "[Não informado na sessão]" || token === "[Não informado]") {
      parts.push(
        <span
          key={match.index}
          className="inline-block px-1.5 py-0.2 text-[10px] font-mono text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded font-normal italic mx-0.5"
        >
          {token}
        </span>
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={match.index} className="italic text-foreground/80">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

function ClinicalMarkdownView({ content }: { content: string }) {
  if (!content || !content.trim()) {
    return (
      <div className="p-8 text-center text-muted-foreground italic text-xs">
        Nenhum relatório preenchido nesta sessão. Escolha um dos modelos técnicos acima para estruturar a evolução clínica.
      </div>
    );
  }

  const lines = content.split("\n");

  return (
    <div className="p-4 bg-background rounded-lg border border-border/80 space-y-2 text-xs leading-relaxed font-sans text-foreground">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h1
              key={idx}
              className="text-sm md:text-base font-extrabold text-purple-900 dark:text-purple-300 pb-1.5 border-b border-purple-200 dark:border-purple-800 tracking-wide uppercase"
            >
              {trimmed.substring(2)}
            </h1>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2
              key={idx}
              className="text-xs md:text-sm font-bold text-foreground mt-3 mb-1 flex items-center gap-1.5 text-purple-800 dark:text-purple-300"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0 inline-block" />
              {trimmed.substring(3)}
            </h2>
          );
        }
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={idx} className="text-xs font-semibold text-foreground/90 mt-2 mb-0.5">
              {trimmed.substring(4)}
            </h3>
          );
        }
        if (trimmed.startsWith("---")) {
          return <hr key={idx} className="my-3 border-border/60" />;
        }
        if (trimmed.startsWith("- ")) {
          const bulletContent = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2 ml-2 my-0.5 text-xs text-foreground/90">
              <span className="text-purple-600 font-bold shrink-0 leading-tight">•</span>
              <span className="leading-snug">{formatInlineMarkdown(bulletContent)}</span>
            </div>
          );
        }
        return (
          <p key={idx} className="text-xs text-foreground/90 leading-relaxed">
            {formatInlineMarkdown(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatInlineHtml(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(
      /\[Não informado na sessão\]/g,
      '<span style="color:#b45309;font-style:italic;">[Não informado na sessão]</span>'
    )
    .replace(
      /\[Não informado\]/g,
      '<span style="color:#b45309;font-style:italic;">[Não informado]</span>'
    );
}

function renderMarkdownToHtml(markdown: string): string {
  if (!markdown) return "<p>Nenhum registro</p>";
  return markdown
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "<br/>";
      if (trimmed.startsWith("# ")) return `<h1>${escapeHtml(trimmed.substring(2))}</h1>`;
      if (trimmed.startsWith("## ")) return `<h2>${escapeHtml(trimmed.substring(3))}</h2>`;
      if (trimmed.startsWith("### ")) return `<h3>${escapeHtml(trimmed.substring(4))}</h3>`;
      if (trimmed.startsWith("---")) return "<hr/>";
      if (trimmed.startsWith("- ")) {
        return `<li>${formatInlineHtml(trimmed.substring(2))}</li>`;
      }
      return `<p>${formatInlineHtml(trimmed)}</p>`;
    })
    .join("\n");
}

function cleanSessionMeta(raw?: string | null): string {
  if (!raw) return "";
  return raw
    .replace(/\[Tipo:\s*[^\]]+\]/gi, "")
    .replace(/\[Meio:\s*[^\]]+\]/gi, "")
    .replace(/\[Endereço:\s*[^\]]+\]/gi, "")
    .replace(/\[Email:\s*[^\]]+\]/gi, "")
    .trim();
}

function mergeSessionMeta(oldRaw: string | null | undefined, newText: string): string {
  const meta: string[] = [];
  if (oldRaw) {
    const tipo = oldRaw.match(/\[Tipo:[^\]]+\]/i);
    if (tipo) meta.push(tipo[0]);
    const meio = oldRaw.match(/\[Meio:[^\]]+\]/i);
    if (meio) meta.push(meio[0]);
  }
  const clean = newText.trim();
  if (meta.length > 0) {
    return `${meta.join(" ")}\n${clean}`.trim();
  }
  return clean;
}

export interface DetalhesSessaoDialogProps {
  session: any;
  pacienteNome?: string;
  paciente?: any;
  responsaveis?: any[];
  enderecoPaciente?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionUpdated?: (newNote?: string) => void;
}

export function DetalhesSessaoDialog({
  session,
  pacienteNome: initialPacienteNome,
  paciente,
  open,
  onOpenChange,
  onSessionUpdated,
}: DetalhesSessaoDialogProps) {
  const pacienteNome =
    session?.paciente?.nome ||
    session?.pacientes?.nome ||
    paciente?.nome ||
    initialPacienteNome ||
    "Paciente";

  const dataFormatada = useMemo(() => {
    try {
      return session?.data_inicio
        ? format(new Date(session.data_inicio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
        : "—";
    } catch {
      return "—";
    }
  }, [session?.data_inicio]);

  const dataCurta = useMemo(() => {
    try {
      return session?.data_inicio
        ? format(new Date(session.data_inicio), "dd/MM", { locale: ptBR })
        : "";
    } catch {
      return "";
    }
  }, [session?.data_inicio]);

  const [sessionNoteEdit, setSessionNoteEdit] = useState("");
  const [isSavingSessionNote, setIsSavingSessionNote] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!session) return;
    const cleaned = cleanSessionMeta(session.observacoes);
    if (cleaned) {
      setSessionNoteEdit(cleaned);
    } else {
      setSessionNoteEdit(
`Data e hora da sessão
Atendimento dia ${dataCurta || format(new Date(), "dd/MM")}
Identificação do Paciente: ${pacienteNome}
`
      );
    }
  }, [session?.id, session?.observacoes, dataCurta, pacienteNome]);

  const handleCopyReport = async () => {
    if (!sessionNoteEdit) {
      toast.error("Nenhum texto para copiar");
      return;
    }
    try {
      await navigator.clipboard.writeText(sessionNoteEdit);
      setCopied(true);
      toast.success("Observações copiadas para a área de transferência!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar texto");
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Não foi possível abrir janela de impressão. Permita pop-ups.");
      return;
    }
    const title = `Relatório da Sessão - ${pacienteNome}`;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 36px; color: #111; line-height: 1.6; font-size: 14px; }
            h1 { font-size: 18px; border-bottom: 2px solid #7c3aed; padding-bottom: 8px; color: #5b21b6; text-transform: uppercase; margin-bottom: 16px; }
            .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; }
            .info-box div { margin: 3px 0; }
            .content { white-space: pre-wrap; font-size: 14px; line-height: 1.8; color: #1e293b; }
            @media print { body { padding: 15px; } }
          </style>
        </head>
        <body>
          <h1>Relatório da Sessão</h1>
          <div class="info-box">
            <div><strong>Paciente:</strong> ${pacienteNome}</div>
            <div><strong>Profissional:</strong> ${session?.profissionais?.nome || "Profissional"} (${session?.servicos?.nome || "Atendimento"})</div>
            <div><strong>Data e Horário:</strong> ${dataFormatada}</div>
          </div>
          <div class="content">${(sessionNoteEdit || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  const handleSaveSessionAdjustment = async () => {
    if (!session?.id) return;
    setIsSavingSessionNote(true);
    try {
      const fullNote = mergeSessionMeta(session.observacoes, sessionNoteEdit);
      const { error } = await supabase
        .from("agendamentos")
        .update({ observacoes: fullNote })
        .eq("id", session.id);

      if (error) throw error;
      toast.success("Relatório da sessão salvo com sucesso!");
      onSessionUpdated?.(fullNote);
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro ao salvar relatório da sessão: " + err.message);
    } finally {
      setIsSavingSessionNote(false);
    }
  };

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] flex flex-col p-5 overflow-hidden">
        {/* Header */}
        <DialogHeader className="pb-3 border-b border-border/60 shrink-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-600" />
                Relatório da Sessão: {pacienteNome}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Atendimento realizado em <strong>{dataFormatada}</strong>
              </DialogDescription>
            </div>
            <Badge variant="outline" className="text-xs capitalize border-purple-200 text-purple-700 bg-purple-50">
              {session.status || "Realizado"}
            </Badge>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-3.5 py-3 text-xs">
          {/* Card Resumo do Atendimento */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border border-border/60 text-xs">
            <div>
              <span className="text-[11px] text-muted-foreground block font-medium">Profissional</span>
              <span className="font-semibold text-foreground text-xs block truncate">
                {session.profissionais?.nome || "Profissional"}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block font-medium">Serviço / Especialidade</span>
              <span className="font-medium text-foreground text-xs block truncate">
                {session.servicos?.nome || "Atendimento Clínico"}
              </span>
            </div>
          </div>

          {/* Campo Simples de Observação */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">
                Observações / Relato da Sessão
              </Label>
              <span className="text-[11px] text-muted-foreground">
                Campo livre de relato da sessão
              </span>
            </div>
            <Textarea
              value={sessionNoteEdit}
              onChange={(e) => setSessionNoteEdit(e.target.value)}
              rows={11}
              className="text-sm leading-relaxed p-3.5 rounded-lg border bg-background text-foreground resize-y min-h-[220px] focus-visible:ring-purple-500"
              placeholder="Digite o relato da sessão..."
            />
            <p className="text-[11px] text-muted-foreground italic">
              Descreva os acontecimentos da sessão, comportamento do paciente, tarefas trabalhadas e intercorrências.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyReport}
              className="h-8 text-xs px-2.5 gap-1.5 text-muted-foreground hover:text-foreground"
            >
              {copied ? (
                <>
                  <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copiar
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 text-xs px-2.5 gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimir
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs px-3"
            >
              Fechar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSavingSessionNote}
              onClick={handleSaveSessionAdjustment}
              className="h-8 text-xs px-4 gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-xs"
            >
              <Check className="h-3.5 w-3.5" />
              {isSavingSessionNote ? "Salvando..." : "Salvar Relatório da Sessão"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
