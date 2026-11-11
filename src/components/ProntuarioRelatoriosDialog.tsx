import { useState, useMemo } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatCPF, formatBirthDateForDisplay } from "@/components/PacienteFormDialog";

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
  to: {
    especialidade: "to",
    titulo: "Plano Terapia Ocupacional (TO)",
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

  const [activePlanTab, setActivePlanTab] = useState("pp");
  const [objetivoCompartilhado, setObjetivoCompartilhado] = useState(
    prontuarioData.objetivo_compartilhado || ""
  );
  const [isEditingObjetivo, setIsEditingObjetivo] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);

  // Local plan being edited
  const [currentPlanForm, setCurrentPlanForm] = useState<PlanoEspecialidade>(() => {
    return (
      prontuarioData.planos["pp"] || {
        especialidade: "pp",
        titulo: "Plano PP (Psicopedagogia)",
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

              {/* Tabs dos Planos por Especialidade (PP, Fono, Psico, TO, ABA) */}
              <Tabs value={activePlanTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="h-8 p-0.5 bg-muted/60 border border-border/60 flex flex-wrap max-w-full justify-start gap-1">
                  <TabsTrigger value="pp" className="text-xs h-7 px-3">
                    Plano PP
                  </TabsTrigger>
                  <TabsTrigger value="fono" className="text-xs h-7 px-3">
                    Plano Fono
                  </TabsTrigger>
                  <TabsTrigger value="psico" className="text-xs h-7 px-3">
                    Plano Psico
                  </TabsTrigger>
                  <TabsTrigger value="to" className="text-xs h-7 px-3">
                    Plano TO
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
                        const ajusteTexto =
                          ag.observacoes?.replace(/\[Tipo:.*?\]/g, "").trim() ||
                          planoAba?.observacoes_medica ||
                          "";

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
                                {hasAba && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] py-0 px-1.5 font-medium border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 gap-1 mr-1"
                                  >
                                    <Activity className="h-2.5 w-2.5" />
                                    Plano ABA ({planoAba.programas.length} progs)
                                  </Badge>
                                )}
                                {ajusteTexto ? (
                                  <p className="line-clamp-2 text-foreground text-xs leading-relaxed">
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
                                className="h-7 text-xs px-2.5 gap-1 hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-950/30"
                              >
                                <Eye className="h-3.5 w-3.5 text-purple-600" />
                                Ver Relatório
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
          onSessionUpdated={() => {
            onProntuarioUpdated?.();
          }}
        />
      )}
    </>
  );
}

export function DetalhesSessaoDialog({
  session,
  pacienteNome,
  open,
  onOpenChange,
  onSessionUpdated,
}: {
  session: any;
  pacienteNome?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionUpdated?: () => void;
}) {
  const [sessionNoteEdit, setSessionNoteEdit] = useState(session?.observacoes || "");
  const [isSavingSessionNote, setIsSavingSessionNote] = useState(false);

  const handleSaveSessionAdjustment = async () => {
    if (!session?.id) return;
    setIsSavingSessionNote(true);
    try {
      const { error } = await supabase
        .from("agendamentos")
        .update({ observacoes: sessionNoteEdit })
        .eq("id", session.id);

      if (error) throw error;
      toast.success("Ajuste da sessão atualizado com sucesso!");
      onSessionUpdated?.();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro ao salvar ajuste da sessão: " + err.message);
    } finally {
      setIsSavingSessionNote(false);
    }
  };

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-full max-h-[85vh] flex flex-col p-5 overflow-hidden">
        <DialogHeader className="pb-2.5 border-b border-border/60 shrink-0">
          <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-purple-600" />
            Relatório da Sessão: {session.paciente?.nome || pacienteNome || "Paciente"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Atendimento realizado em{" "}
            {session.data_inicio
              ? format(new Date(session.data_inicio), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })
              : "—"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3.5 py-2 text-xs">
          <div className="grid grid-cols-2 gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/60">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                Profissional
              </span>
              <span className="font-semibold text-foreground text-xs">
                {session.profissionais?.nome || "—"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                Serviço / Especialidade
              </span>
              <span className="font-medium text-foreground text-xs">
                {session.servicos?.nome || "Sessão"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                Status
              </span>
              <Badge variant="secondary" className="capitalize text-[10px]">
                {session.status || "Realizado"}
              </Badge>
            </div>
            {session.profissionais?.cor && (
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                  Identificador
                </span>
                <span
                  className="inline-block w-4 h-4 rounded-full mt-0.5"
                  style={{ backgroundColor: session.profissionais.cor }}
                />
              </div>
            )}
          </div>

          {/* Plano ABA programas se houver */}
          {session.plano_aba?.programas?.length > 0 && (
            <div className="space-y-2 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
              <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" />
                Programas do Plano ABA Aplicados
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {session.plano_aba.programas.map((prog: any, idx: number) => {
                  const respCount = Object.keys(prog.respostas || {}).length;
                  return (
                    <div
                      key={idx}
                      className="p-2 rounded bg-background border border-border/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-medium text-foreground block">
                          {prog.nome || `Programa ${idx + 1}`}
                        </span>
                        {prog.descricao && (
                          <span className="text-[10px] text-muted-foreground block">
                            {prog.descricao}
                          </span>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {respCount} tentativas
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ajuste / Orientação / Observações da Sessão */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">
                Ajuste / Orientação & Observações da Sessão
              </Label>
              <span className="text-[10px] text-muted-foreground">Editável pelo profissional</span>
            </div>
            <Textarea
              value={sessionNoteEdit}
              onChange={(e) => setSessionNoteEdit(e.target.value)}
              rows={5}
              className="text-xs resize-y"
              placeholder="Descreva a evolução do paciente, condutas adotadas e orientações para a família..."
            />
          </div>
        </div>

        <div className="pt-2 border-t border-border/60 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs"
          >
            Fechar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSaveSessionAdjustment}
            disabled={isSavingSessionNote}
            className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium gap-1"
          >
            <Check className="h-3.5 w-3.5" />
            Salvar Ajuste da Sessão
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
