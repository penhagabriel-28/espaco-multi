import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  CalendarOff,
  FileText,
  HeartPulse,
  Sparkles,
  Eye,
  Check,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { differenceInYears, format } from "date-fns";
import {
  PacienteFormDialog,
  formatBirthDateForDisplay,
  formatCPF,
  parseCpfFromObs,
  parseEnderecoFromObs,
  parseEnderecoSecFromObs,
  parseEmailFromObs,
  encodeEnderecoToObs,
  getCleanObservacoes,
} from "@/components/PacienteFormDialog";
import {
  ProntuarioRelatoriosDialog,
  DetalhesSessaoDialog,
  parseProntuario,
  serializeProntuarioInObs,
  DEFAULT_PLANOS,
  cleanSessionMeta,
} from "@/components/ProntuarioRelatoriosDialog";
import { isProfissionalAdmin, cn } from "@/lib/utils";
import {
  getDefaultRoomIdForProfessional,
  isDefaultRoomForProfessional,
} from "@/lib/defaultRooms";

export const Route = createFileRoute("/_app/pacientes/$id")({
  component: PacienteDetail,
});

function PacienteDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [respOpen, setRespOpen] = useState(false);
  const [agendaFixaOpen, setAgendaFixaOpen] = useState(false);
  const [feriasOpen, setFeriasOpen] = useState(false);
  const [gerarSemanaOpen, setGerarSemanaOpen] = useState(false);

  // Prontuário & Sessões states
  const [prontuarioOpen, setProntuarioOpen] = useState(false);
  const [selectedSessionForModal, setSelectedSessionForModal] = useState<any>(null);
  const [activePlanTabInline, setActivePlanTabInline] = useState("geral");
  const [isEditingSharedGoal, setIsEditingSharedGoal] = useState(false);
  const [sharedGoalText, setSharedGoalText] = useState("");

  // Sincronização em tempo real em todos os dispositivos (celular, tablet, notebook)
  useEffect(() => {
    if (!id) return;
    const channelId = `paciente-detail-realtime-${id}-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pacientes",
          filter: `id=eq.${id}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["paciente", id] });
          qc.invalidateQueries({ queryKey: ["pacientes"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agendamentos",
          filter: `paciente_id=eq.${id}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["paciente-ags", id] });
          qc.invalidateQueries({ queryKey: ["ags"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "responsaveis",
          filter: `paciente_id=eq.${id}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["responsaveis", id] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "paciente_profissional",
          filter: `paciente_id=eq.${id}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["paciente-profissionais-detail", id] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [id, qc]);

  const { data: paciente, isLoading: loadingPac, isError: errorPac, error: errPac } = useQuery({
    queryKey: ["paciente", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("pacientes").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 1000,
  });

  const { data: responsaveis = [] } = useQuery({
    queryKey: ["responsaveis", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("responsaveis")
        .select("*")
        .eq("paciente_id", id)
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10 * 1000,
  });

  const { data: ags = [] } = useQuery({
    queryKey: ["paciente-ags", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select("*, profissionais(nome, cor, especialidade, registro), servicos(nome)")
        .eq("paciente_id", id)
        .order("data_inicio", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10 * 1000,
  });

  const { data: accompanyingProfs = [] } = useQuery({
    queryKey: ["paciente-profissionais-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paciente_profissional")
        .select("*, profissionais(nome, cor)")
        .eq("paciente_id", id);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10 * 1000,
  });

  const delResp = useMutation({
    mutationFn: async (rid: string) => {
      const { error } = await supabase.from("responsaveis").delete().eq("id", rid);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Responsável removido");
      qc.invalidateQueries({ queryKey: ["responsaveis", id] });
    },
  });

  const { data: servicos = [] } = useQuery({
    queryKey: ["servicos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("servicos").select("*").eq("ativo", true).order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: salas = [] } = useQuery({
    queryKey: ["salas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("salas").select("*").eq("ativo", true).order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: profissionaisList = [] } = useQuery({
    queryKey: ["profissionais-list-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profissionais")
        .select("id, nome, cor, especialidade, valores_config, ativo")
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });

  const targetMonth = new Date().toISOString().substring(0, 7);
  const activeProfs = (profissionaisList || []).filter((p: any) => {
    if (isProfissionalAdmin(p)) return false;
    if (p.ativo) return true;
    const config = p.valores_config as any;
    return config?.ativo_ate && targetMonth <= config.ativo_ate;
  });

  const diasFixos = parseDiasFixos(paciente?.observacoes);
  const prontuarioData = parseProntuario(paciente?.observacoes);

  const saveSharedGoalMutation = useMutation({
    mutationFn: async (newGoal: string) => {
      const updated = {
        ...prontuarioData,
        objetivo_compartilhado: newGoal.trim(),
      };
      const newObs = serializeProntuarioInObs(paciente?.observacoes, updated);
      const { error } = await supabase
        .from("pacientes")
        .update({ observacoes: newObs })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Objetivo compartilhado atualizado com sucesso!");
      setIsEditingSharedGoal(false);
      qc.invalidateQueries({ queryKey: ["paciente", id] });
    },
    onError: (e: any) => toast.error("Erro ao salvar objetivo compartilhado: " + e.message),
  });

  const handleRemoveDiaFixo = async (dfId: string) => {
    if (!paciente) return;
    const currentDiasFixos = parseDiasFixos(paciente.observacoes);
    const updated = currentDiasFixos.filter((x) => x.id !== dfId);
    const newObs = serializeObservacoes(paciente.observacoes, updated);
    
    const { error } = await supabase
      .from("pacientes")
      .update({ observacoes: newObs })
      .eq("id", id);
      
    if (error) {
      toast.error("Erro ao remover horário fixo: " + error.message);
    } else {
      toast.success("Horário fixo removido com sucesso");
      qc.invalidateQueries({ queryKey: ["paciente", id] });
    }
  };

  if (loadingPac) {
    return (
      <div className="space-y-4 p-4">
        <p className="text-sm text-muted-foreground">Carregando dados do paciente…</p>
      </div>
    );
  }

  if (errorPac || !paciente) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link to="/pacientes">
            <ArrowLeft className="h-4 w-4" /> Voltar para Pacientes
          </Link>
        </Button>
        <Card className="border-destructive/30">
          <CardContent className="py-8 text-center text-sm text-destructive">
            Não foi possível carregar os dados deste paciente. {(errPac as any)?.message || ""}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link to="/pacientes">
            <ArrowLeft className="h-4 w-4" /> Pacientes
          </Link>
        </Button>
      </div>

      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Bloco: Nome + Status + Botões Destacados AO LADO DO NOME */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {paciente.nome}
                </CardTitle>
                <Badge
                  variant={paciente.status === "ativo" ? "default" : "secondary"}
                  className="capitalize font-semibold text-xs px-2.5 py-0.5"
                >
                  {paciente.status.replace("_", " ")}
                </Badge>
              </div>

              {/* Botões Destacados Imediatamente ao Lado do Nome */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setProntuarioOpen(true)}
                  className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md px-3.5 h-9 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <FileText className="h-4 w-4" /> Relatórios
                </Button>
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 font-medium border-border/80 shadow-xs h-9 px-3 hover:bg-accent cursor-pointer"
                    >
                      <Pencil className="h-4 w-4 text-purple-600 dark:text-purple-400" /> Editar
                    </Button>
                  </DialogTrigger>
                  {editOpen && (
                    <PacienteFormDialog
                      paciente={paciente}
                      onSaved={() => {
                        setEditOpen(false);
                        qc.invalidateQueries({ queryKey: ["paciente", id] });
                        qc.invalidateQueries({ queryKey: ["pacientes"] });
                        qc.invalidateQueries({ queryKey: ["responsaveis", id] });
                      }}
                    />
                  )}
                </Dialog>
              </div>
            </div>

            {/* Data de Nascimento */}
            <div className="text-xs sm:text-sm text-muted-foreground font-medium bg-muted/40 px-3 py-1.5 rounded-lg border border-border/40 shrink-0">
              {paciente.data_nascimento
                ? `Nasc. ${formatBirthDateForDisplay(paciente.data_nascimento)}`
                : "Data de nascimento não informada"}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Info label="CID(s)" value={paciente.cid_principal} />
          <div className="sm:col-span-1">
            <div className="text-xs text-muted-foreground">Especialidades desejadas</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {Array.isArray(paciente.cids_secundarios) && paciente.cids_secundarios.length > 0 ? (
                (paciente.cids_secundarios as string[]).map((spec: string) => (
                  <Badge key={spec} variant="secondary">
                    {spec}
                  </Badge>
                ))
              ) : (
                <span className="text-sm font-medium">—</span>
              )}
            </div>
          </div>
          <div className="sm:col-span-1">
            <div className="text-xs text-muted-foreground">Profissionais Acompanhantes</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {(accompanyingProfs || []).length > 0 ? (
                (accompanyingProfs || []).map((item: any) => (
                  <Badge
                    key={item.profissional_id}
                    variant="outline"
                    className="px-2 py-0.5 border-l-[3px]"
                    style={{ borderLeftColor: item.profissionais?.cor || "var(--primary)" }}
                  >
                    {item.profissionais?.nome}
                  </Badge>
                ))
              ) : (
                <span className="text-sm font-medium">—</span>
              )}
            </div>
          </div>
          <Info
            label="Atendimento"
            value={
              paciente.tipo_atendimento === "convenio"
                ? `Convênio: ${paciente.convenio_nome ?? "—"}`
                : `Particular (${paciente.valor_mensal && paciente.valor_mensal > 0 ? "Mensal" : "Por Sessão"})`
            }
          />

          <Info
            label="CPF do Responsável"
            value={
              paciente.cpf
                ? formatCPF(paciente.cpf)
                : parseCpfFromObs(paciente.observacoes)
                ? formatCPF(parseCpfFromObs(paciente.observacoes))
                : (responsaveis[0] as any)?.cpf
                ? formatCPF((responsaveis[0] as any).cpf)
                : "Não informado"
            }
          />

          <Info
            label="E-mail"
            value={
              responsaveis[0]?.email ||
              parseEmailFromObs(paciente.observacoes) ||
              "Não informado"
            }
          />

          <Info
            label="Endereço"
            value={
              (paciente as any).endereco ||
              parseEnderecoFromObs(paciente.observacoes) ||
              (responsaveis[0] as any)?.endereco ||
              "Não informado"
            }
          />

          <Info
            label="Cadastrado em"
            value={(() => {
              try {
                return paciente.created_at ? format(new Date(paciente.created_at), "dd/MM/yyyy") : "—";
              } catch {
                return "—";
              }
            })()}
          />
          {getCleanObservacoes(paciente.observacoes) && (
            <div className="sm:col-span-2">
              <div className="text-xs text-muted-foreground">Observações</div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{getCleanObservacoes(paciente.observacoes)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CARD PRONTUÁRIO MULTIPROFISSIONAL */}
      <Card className="border-purple-200 dark:border-purple-900 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-purple-50/50 dark:bg-purple-950/20 border-b pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-600 text-white shadow-sm">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                Prontuário Multiprofissional
                <Badge variant="outline" className="text-purple-700 border-purple-300 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-300 text-xs font-normal">
                  Equipe Integrada
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Planos por especialidade, objetivo compartilhado e relatórios de cada atendimento
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setProntuarioOpen(true)}
              className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-sm text-xs font-medium"
            >
              <FileText className="h-4 w-4" />
              Abrir Janela de Relatórios
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* SEÇÃO 1: OBJETIVO COMPARTILHADO (TODOS VISUALIZAR) */}
          <div className="rounded-xl border border-purple-200 dark:border-purple-800/60 bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-purple-50/70 dark:from-purple-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
                <h4 className="text-xs sm:text-sm font-bold text-purple-950 dark:text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                  Objetivo Compartilhado (Todos Visualizar)
                </h4>
              </div>
              {!isEditingSharedGoal && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSharedGoalText(prontuarioData.objetivo_compartilhado);
                    setIsEditingSharedGoal(true);
                  }}
                  className="h-7 text-xs text-purple-700 hover:text-purple-800 hover:bg-purple-100/60 dark:text-purple-300 gap-1 px-2"
                >
                  <Pencil className="h-3 w-3" />
                  Editar
                </Button>
              )}
            </div>

            {isEditingSharedGoal ? (
              <div className="space-y-2 pt-1">
                <Textarea
                  value={sharedGoalText}
                  onChange={(e) => setSharedGoalText(e.target.value)}
                  rows={3}
                  className="text-xs bg-background"
                  placeholder="Defina o objetivo terapêutico compartilhado visível para todas as especialidades..."
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingSharedGoal(false)}
                    className="h-7 text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => saveSharedGoalMutation.mutate(sharedGoalText)}
                    disabled={saveSharedGoalMutation.isPending}
                    className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1"
                  >
                    <Check className="h-3 w-3" />
                    Salvar Objetivo
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-foreground leading-relaxed italic bg-background/60 p-3 rounded-lg border border-purple-200/50 dark:border-purple-800/40">
                {prontuarioData.objetivo_compartilhado ? (
                  `"${prontuarioData.objetivo_compartilhado}"`
                ) : (
                  <span className="text-muted-foreground not-italic">
                    Nenhum objetivo compartilhado cadastrado ainda. Clique em "Editar" para alinhar o foco central do paciente entre toda a equipe.
                  </span>
                )}
              </p>
            )}
          </div>

          {/* SEÇÃO 2: PLANOS POR ESPECIALIDADE */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-2">
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Planos de Intervenção Terapêutica
                </h4>
                <p className="text-xs text-muted-foreground">
                  Alinhe metas e condutas específicas de cada especialidade
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setProntuarioOpen(true)}
                className="h-8 text-xs gap-1 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300"
              >
                <Plus className="h-3.5 w-3.5" />
                Criar / Editar Plano
              </Button>
            </div>

            <Tabs value={activePlanTabInline} onValueChange={setActivePlanTabInline} className="w-full">
              <TabsList className="grid grid-cols-2 sm:grid-cols-5 h-auto p-1 bg-muted/60">
                <TabsTrigger value="geral" className="text-xs py-1.5 font-medium">Plano Geral</TabsTrigger>
                <TabsTrigger value="pp" className="text-xs py-1.5">Plano PP</TabsTrigger>
                <TabsTrigger value="fono" className="text-xs py-1.5">Plano Fono</TabsTrigger>
                <TabsTrigger value="psico" className="text-xs py-1.5">Plano Psico</TabsTrigger>
                <TabsTrigger value="aba" className="text-xs py-1.5">Plano ABA</TabsTrigger>
              </TabsList>

              {["geral", "pp", "fono", "psico", "aba"].map((tabKey) => {
                const plano = prontuarioData.planos[tabKey] || DEFAULT_PLANOS[tabKey] || {
                  especialidade: tabKey,
                  titulo: `Plano ${tabKey.toUpperCase()}`,
                  objetivos_especificos: "",
                  conduta_intervencao: "",
                  orientacoes_familia: "",
                };
                const hasContent = Boolean(
                  plano.objetivos_especificos?.trim() ||
                  plano.conduta_intervencao?.trim() ||
                  plano.orientacoes_familia?.trim()
                );

                return (
                  <TabsContent key={tabKey} value={tabKey} className="mt-3">
                    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs sm:text-sm text-foreground">
                          {plano.titulo || `Plano ${tabKey.toUpperCase()}`}
                        </span>
                        {plano.data_atualizacao && (
                          <span className="text-[11px] text-muted-foreground">
                            Atualizado em: {format(new Date(plano.data_atualizacao), "dd/MM/yyyy")}
                          </span>
                        )}
                      </div>

                      {hasContent ? (
                        <div className="grid gap-3 sm:grid-cols-3 text-xs">
                          <div className="p-3 rounded-md bg-background border space-y-1">
                            <span className="font-bold text-[11px] text-muted-foreground block uppercase">
                              Objetivos Específicos
                            </span>
                            <p className="whitespace-pre-wrap text-foreground">
                              {plano.objetivos_especificos || "—"}
                            </p>
                          </div>
                          <div className="p-3 rounded-md bg-background border space-y-1">
                            <span className="font-bold text-[11px] text-muted-foreground block uppercase">
                              Conduta / Intervenção
                            </span>
                            <p className="whitespace-pre-wrap text-foreground">
                              {plano.conduta_intervencao || "—"}
                            </p>
                          </div>
                          <div className="p-3 rounded-md bg-background border space-y-1">
                            <span className="font-bold text-[11px] text-muted-foreground block uppercase">
                              Orientações à Família / Escola
                            </span>
                            <p className="whitespace-pre-wrap text-foreground">
                              {plano.orientacoes_familia || "—"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 border border-dashed rounded-md bg-background/50">
                          <p className="text-xs text-muted-foreground">
                            Nenhum plano detalhado cadastrado para {plano.titulo || tabKey.toUpperCase()}.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setProntuarioOpen(true)}
                            className="mt-2 text-xs h-7 gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            Cadastrar Plano
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>

          {/* SEÇÃO 3: RESULTADOS (TODOS VISUALIZAR) / RELATÓRIO DE CADA SESSÃO */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Resultados das Sessões (Todos Visualizar)
                </h4>
                <p className="text-xs text-muted-foreground">
                  Acesse o relatório de cada sessão e veja os ajustes clínicos registrados
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {ags.length} {ags.length === 1 ? "sessão" : "sessões"}
              </Badge>
            </div>

            {ags.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground border rounded-lg bg-muted/10">
                Nenhuma sessão registrada para este paciente ainda.
              </div>
            ) : (
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="w-[150px] text-xs font-bold">Data</TableHead>
                      <TableHead className="w-[180px] text-xs font-bold">Profissional</TableHead>
                      <TableHead className="text-xs font-bold">Ajuste / Orientação</TableHead>
                      <TableHead className="w-[130px] text-right text-xs font-bold">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ags.map((ag: any) => {
                      const dataFormatada = (() => {
                        try {
                          return ag.data_inicio
                            ? format(new Date(ag.data_inicio), "dd/MM/yyyy HH:mm")
                            : "—";
                        } catch {
                          return "—";
                        }
                      })();
                      const profNome = ag.profissionais?.nome || "Profissional";
                      const profCor = ag.profissionais?.cor || "#9333ea";
                      const servNome = ag.servicos?.nome;
                      const cleanObs = cleanSessionMeta(ag.observacoes);
                      const hasAba = Boolean(ag.plano_aba?.programas?.length);
                      const isReportFilled = Boolean(cleanObs && cleanObs.length > 0);

                      return (
                        <TableRow key={ag.id} className="hover:bg-muted/30">
                          <TableCell className="text-xs font-medium whitespace-nowrap">
                            {dataFormatada}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: profCor }}
                              />
                              <span className="font-medium text-foreground">{profNome}</span>
                            </div>
                            {servNome && (
                              <span className="text-[10px] text-muted-foreground block pl-3.5">
                                {servNome}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {hasAba && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] py-0 px-1.5 font-medium border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 gap-1"
                                  >
                                    <Activity className="h-2.5 w-2.5" />
                                    Plano ABA ({ag.plano_aba.programas.length} progs)
                                  </Badge>
                                )}
                                {isReportFilled ? (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] py-0 px-1.5 font-medium border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 gap-1"
                                  >
                                    <Check className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
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
                              {cleanObs ? (
                                <p className="line-clamp-2 text-foreground text-xs leading-relaxed whitespace-pre-line">
                                  {cleanObs}
                                </p>
                              ) : (
                                <span className="text-muted-foreground italic text-[11px]">
                                  Sem observações registradas nesta sessão
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSessionForModal(ag)}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Responsáveis</CardTitle>
          <Dialog open={respOpen} onOpenChange={setRespOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </DialogTrigger>
            <ResponsavelDialog
              pacienteId={id}
              onSaved={() => {
                setRespOpen(false);
                qc.invalidateQueries({ queryKey: ["responsaveis", id] });
              }}
            />
          </Dialog>
        </CardHeader>
        <CardContent>
          {(responsaveis || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum responsável cadastrado.</p>
          ) : (
            <div className="divide-y">
              {(responsaveis || []).map((r) => (
                <div key={r.id} className="flex items-center gap-3 py-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {r.nome}{" "}
                      {r.parentesco && (
                        <span className="text-muted-foreground">• {r.parentesco}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5 mt-0.5">
                      <div>
                        {[
                          r.telefone,
                          r.whatsapp && `WhatsApp: ${r.whatsapp}`,
                          (r as any).cpf && `CPF: ${formatCPF((r as any).cpf)}`,
                          r.email,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </div>
                      {((r as any).endereco || parseEnderecoFromObs(paciente?.observacoes)) && (
                        <div className="text-[11px] text-muted-foreground/80">
                          Endereço: {(r as any).endereco || parseEnderecoFromObs(paciente?.observacoes)}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => delResp.mutate(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CARD AGENDA FIXA SEMANAL */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Agenda Fixa Semanal</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Configuração dos dias e horários fixos do paciente por profissional</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={gerarSemanaOpen} onOpenChange={setGerarSemanaOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1" disabled={diasFixos.length === 0}>
                  <Calendar className="h-4 w-4" /> Gerar Semana
                </Button>
              </DialogTrigger>
              {gerarSemanaOpen && (
                <GerarSemanaDialog
                  paciente={paciente}
                  diasFixos={diasFixos}
                  onSaved={() => {
                    setGerarSemanaOpen(false);
                    qc.invalidateQueries({ queryKey: ["paciente-ags", id] });
                  }}
                  onClose={() => setGerarSemanaOpen(false)}
                />
              )}
            </Dialog>

            <Dialog open={feriasOpen} onOpenChange={setFeriasOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive">
                  <CalendarOff className="h-4 w-4" /> Férias
                </Button>
              </DialogTrigger>
              {feriasOpen && (
                <FeriasDialog
                  pacienteId={id}
                  onSaved={() => {
                    setFeriasOpen(false);
                    qc.invalidateQueries({ queryKey: ["paciente-ags", id] });
                  }}
                  onClose={() => setFeriasOpen(false)}
                />
              )}
            </Dialog>

            <Dialog open={agendaFixaOpen} onOpenChange={setAgendaFixaOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" /> Horário Fixo
                </Button>
              </DialogTrigger>
              {agendaFixaOpen && (
                <AgendaFixaFormDialog
                  paciente={paciente}
                  profissionais={activeProfs}
                  salas={salas}
                  servicos={servicos}
                  onSaved={() => {
                    setAgendaFixaOpen(false);
                    qc.invalidateQueries({ queryKey: ["paciente", id] });
                  }}
                />
              )}
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {diasFixos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum horário fixo configurado.</p>
          ) : (
            <div className="divide-y">
              {diasFixos.map((df) => {
                const prof = activeProfs.find((p) => p.id === df.profissional_id);
                const sala = salas.find((s) => s.id === df.sala_id);
                const serv = servicos.find((s) => s.id === df.servico_id);
                const diasSemanaNomes = [
                  "Domingo",
                  "Segunda-feira",
                  "Terça-feira",
                  "Quarta-feira",
                  "Quinta-feira",
                  "Sexta-feira",
                  "Sábado",
                ];
                return (
                  <div key={df.id} className="flex items-center gap-3 py-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {diasSemanaNomes[df.dia_semana]} • {df.hora_inicio} - {df.hora_fim}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Profissional: <span className="font-semibold">{prof?.nome || "—"}</span>
                        {serv && ` • Serviço: ${serv.nome}`}
                        {sala && ` • Sala: ${sala.nome}`}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveDiaFixo(df.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Histórico de agendamentos</span>
            <Badge variant="outline" className="text-xs font-normal">
              {(ags || []).length} {(ags || []).length === 1 ? "sessão" : "sessões"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(ags || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem agendamentos.</p>
          ) : (
            <div className="divide-y">
              {(ags || []).map((a: any) => {
                const cleanObs = cleanSessionMeta(a.observacoes);
                const isReportFilled = Boolean(cleanObs && cleanObs.length > 0);
                return (
                  <div key={a.id} className="flex items-center justify-between gap-3 py-3 text-sm flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-8 w-1 rounded-full shrink-0"
                        style={{ background: a.profissionais?.cor }}
                      />
                      <div className="min-w-[130px] font-medium text-xs sm:text-sm">
                        {(() => {
                          try {
                            return a.data_inicio ? format(new Date(a.data_inicio), "dd/MM/yyyy HH:mm") : "—";
                          } catch {
                            return "—";
                          }
                        })()}
                      </div>
                      <div className="truncate text-muted-foreground text-xs sm:text-sm">
                        {a.servicos?.nome} • {a.profissionais?.nome}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="capitalize text-xs">
                        {a.status}
                      </Badge>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedSessionForModal(a)}
                        className={cn(
                          "h-8 px-2.5 sm:px-3 text-xs gap-1.5 font-medium transition-all shadow-sm",
                          isReportFilled
                            ? "border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 hover:text-purple-800 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
                            : "border-slate-200 text-slate-700 bg-slate-50 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                        )}
                        title="Ver ou preencher relatório da sessão"
                      >
                        <FileText className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Relatório da Sessão</span>
                        {isReportFilled && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Relatório preenchido" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DIALOG RELATÓRIOS / PRONTUÁRIO COMPLETO */}
      {paciente && (
        <ProntuarioRelatoriosDialog
          open={prontuarioOpen}
          onOpenChange={setProntuarioOpen}
          paciente={paciente}
          responsaveis={responsaveis}
          agendamentos={ags}
          onProntuarioUpdated={() => {
            qc.invalidateQueries({ queryKey: ["paciente", id] });
            qc.invalidateQueries({ queryKey: ["paciente-ags", id] });
          }}
        />
      )}

      {/* DIALOG DETALHES DA SESSÃO */}
      {selectedSessionForModal && (
        <DetalhesSessaoDialog
          open={!!selectedSessionForModal}
          onOpenChange={(open) => !open && setSelectedSessionForModal(null)}
          session={selectedSessionForModal}
          pacienteNome={paciente?.nome}
          paciente={paciente}
          responsaveis={responsaveis}
          enderecoPaciente={paciente?.endereco || parseEnderecoFromObs(paciente?.observacoes) || ""}
          onSessionUpdated={() => {
            qc.invalidateQueries({ queryKey: ["paciente-ags", id] });
          }}
        />
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium">{value ?? "—"}</div>
    </div>
  );
}

function ResponsavelDialog({ pacienteId, onSaved }: { pacienteId: string; onSaved: () => void }) {
  const [form, setForm] = useState({
    nome: "",
    parentesco: "",
    telefone: "",
    whatsapp: "",
    cpf: "",
    email: "",
    endereco: "",
  });
  const m = useMutation({
    mutationFn: async () => {
      const cleanCpf = form.cpf ? form.cpf.replace(/\D/g, "") : null;
      const payload: any = {
        ...form,
        cpf: cleanCpf,
        paciente_id: pacienteId,
      };
      let res = await supabase.from("responsaveis").insert(payload);
      if (res.error && (res.error.message?.includes("cpf") || res.error.message?.includes("endereco") || (res.error as any).code === "42703")) {
        delete payload.cpf;
        delete payload.endereco;
        res = await supabase.from("responsaveis").insert(payload);
      }
      if (res.error) throw res.error;

      if (form.endereco && form.endereco.trim()) {
        const { data: pData } = await supabase.from("pacientes").select("observacoes").eq("id", pacienteId).single();
        if (pData) {
          const updatedObs = encodeEnderecoToObs(pData.observacoes, form.endereco.trim());
          await supabase.from("pacientes").update({ observacoes: updatedObs }).eq("id", pacienteId);
        }
      }
    },
    onSuccess: () => {
      toast.success("Responsável adicionado com sucesso");
      qc.invalidateQueries({ queryKey: ["paciente", pacienteId] });
      qc.invalidateQueries({ queryKey: ["responsaveis", pacienteId] });
      qc.invalidateQueries({ queryKey: ["responsaveis"] });
      onSaved();
    },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Novo responsável</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          m.mutate();
        }}
        className="space-y-3"
      >
        <div className="space-y-1.5">
          <Label>Nome *</Label>
          <Input
            required
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Parentesco</Label>
          <Input
            value={form.parentesco}
            onChange={(e) => setForm({ ...form, parentesco: e.target.value })}
            placeholder="Mãe, Pai, Responsável legal…"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>WhatsApp</Label>
            <Input
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>CPF</Label>
            <Input
              value={form.cpf}
              onChange={(e) => setForm({ ...form, cpf: formatCPF(e.target.value) })}
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="exemplo@email.com"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Endereço</Label>
          <Input
            value={form.endereco}
            onChange={(e) => setForm({ ...form, endereco: e.target.value })}
            placeholder="Rua, número, bairro, cidade..."
          />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={m.isPending}>
            Salvar
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

// ============ HELPER TYPES & FUNCTIONS FOR DIAS FIXOS ============

interface DiaFixo {
  id: string;
  profissional_id: string;
  servico_id: string | null;
  sala_id: string | null;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
}

const parseDiasFixos = (observacoes: string | null | undefined): DiaFixo[] => {
  if (!observacoes) return [];
  const match = observacoes.match(/<!--DIAS_FIXOS:(.*?)-->/);
  if (match) {
    try {
      return JSON.parse(match[1]);
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

// ============ DIALOGS FOR AGENDA FIXA & FERIAS ============

function AgendaFixaFormDialog({
  paciente,
  profissionais,
  salas,
  servicos,
  onSaved,
}: {
  paciente: any;
  profissionais: any[];
  salas: any[];
  servicos: any[];
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    profissional_id: "",
    servico_id: "",
    sala_id: "",
    dia_semana: "1",
    hora_inicio: "08:00",
    hora_fim: "09:00",
  });

  const m = useMutation({
    mutationFn: async () => {
      if (!form.profissional_id) {
        throw new Error("Selecione um profissional.");
      }
      const currentDiasFixos = parseDiasFixos(paciente.observacoes);
      
      const newSlot: DiaFixo = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        profissional_id: form.profissional_id,
        servico_id: form.servico_id || null,
        sala_id: form.sala_id || null,
        dia_semana: Number(form.dia_semana),
        hora_inicio: form.hora_inicio,
        hora_fim: form.hora_fim,
      };

      const updated = [...currentDiasFixos, newSlot];
      const newObs = serializeObservacoes(paciente.observacoes, updated);

      const { error } = await supabase
        .from("pacientes")
        .update({ observacoes: newObs })
        .eq("id", paciente.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Horário fixo adicionado");
      onSaved();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Adicionar horário fixo semanal</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          m.mutate();
        }}
        className="space-y-3"
      >
        <div className="space-y-1.5">
          <Label>Profissional *</Label>
          <select
            required
            value={form.profissional_id}
            onChange={(e) => {
              const profId = e.target.value;
              const defaultRoomId = getDefaultRoomIdForProfessional(profId, profissionais, salas);
              setForm({
                ...form,
                profissional_id: profId,
                sala_id: defaultRoomId || form.sala_id,
              });
            }}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Selecione um profissional...</option>
            {profissionais.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Serviço (Opcional)</Label>
            <select
              value={form.servico_id}
              onChange={(e) => setForm({ ...form, servico_id: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecione um serviço...</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Sala (Opcional)</Label>
            <select
              value={form.sala_id}
              onChange={(e) => setForm({ ...form, sala_id: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecione uma sala...</option>
              {salas.map((s) => {
                const isDefault = isDefaultRoomForProfessional(form.profissional_id, s.id, profissionais, salas);
                return (
                  <option key={s.id} value={s.id}>
                    {s.nome} {isDefault ? "(Padrão)" : ""}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Dia da Semana</Label>
          <select
            value={form.dia_semana}
            onChange={(e) => setForm({ ...form, dia_semana: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="1">Segunda-feira</option>
            <option value="2">Terça-feira</option>
            <option value="3">Quarta-feira</option>
            <option value="4">Quinta-feira</option>
            <option value="5">Sexta-feira</option>
            <option value="6">Sábado</option>
            <option value="0">Domingo</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Hora Início</Label>
            <Input
              type="time"
              required
              value={form.hora_inicio}
              onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Hora Fim</Label>
            <Input
              type="time"
              required
              value={form.hora_fim}
              onChange={(e) => setForm({ ...form, hora_fim: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="submit" disabled={m.isPending}>
            Salvar
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function GerarSemanaDialog({
  paciente,
  diasFixos,
  onSaved,
  onClose,
}: {
  paciente: any;
  diasFixos: DiaFixo[];
  onSaved: () => void;
  onClose: () => void;
}) {
  const [semanaInicio, setSemanaInicio] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split("T")[0];
  });

  const getMondayOfDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const mondayDate = getMondayOfDate(semanaInicio);
  const sundayDate = new Date(mondayDate);
  sundayDate.setDate(mondayDate.getDate() + 6);

  const m = useMutation({
    mutationFn: async () => {
      const startIso = new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate(), 0, 0, 0).toISOString();
      const endIso = new Date(sundayDate.getFullYear(), sundayDate.getMonth(), sundayDate.getDate(), 23, 59, 59).toISOString();

      const { data: existingAgs, error: fetchError } = await supabase
        .from("agendamentos")
        .select("data_inicio")
        .eq("paciente_id", paciente.id)
        .gte("data_inicio", startIso)
        .lte("data_inicio", endIso);

      if (fetchError) throw fetchError;

      const occurrencesToInsert = [];
      for (const df of diasFixos) {
        const targetDayDate = new Date(mondayDate);
        const diff = df.dia_semana - 1;
        targetDayDate.setDate(mondayDate.getDate() + (diff < 0 ? 6 : diff));

        const [startH, startM] = df.hora_inicio.split(":").map(Number);
        const [endH, endM] = df.hora_fim.split(":").map(Number);

        const occStart = new Date(targetDayDate.getFullYear(), targetDayDate.getMonth(), targetDayDate.getDate(), startH, startM, 0);
        const occEnd = new Date(targetDayDate.getFullYear(), targetDayDate.getMonth(), targetDayDate.getDate(), endH, endM, 0);

        const occStartIso = occStart.toISOString();
        const occEndIso = occEnd.toISOString();

        const isDuplicate = (existingAgs || []).some((ea: any) => {
          const eaTime = new Date(ea.data_inicio).getTime();
          return Math.abs(eaTime - occStart.getTime()) < 60000;
        });

        if (!isDuplicate) {
          occurrencesToInsert.push({
            paciente_id: paciente.id,
            profissional_id: df.profissional_id,
            servico_id: df.servico_id || null,
            sala_id: df.sala_id || null,
            data_inicio: occStartIso,
            data_fim: occEndIso,
            status: "confirmado",
            recorrencia: "unica",
            observacoes: "Gerado via Agenda Fixa",
          });
        }
      }

      if (occurrencesToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("agendamentos")
          .insert(occurrencesToInsert as any);
        if (insertError) throw insertError;
      }

      return occurrencesToInsert.length;
    },
    onSuccess: (count) => {
      if (count === 0) {
        toast.info("Todos os horários desta semana já estavam agendados.");
      } else {
        toast.success(`Gerado(s) ${count} agendamento(s) para a semana com sucesso!`);
      }
      onSaved();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Gerar agendamentos da semana</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          m.mutate();
        }}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label>Selecione um dia da semana desejada</Label>
          <Input
            type="date"
            required
            value={semanaInicio}
            onChange={(e) => setSemanaInicio(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Será gerada a semana de: <strong>{format(mondayDate, "dd/MM/yyyy")}</strong> até <strong>{format(sundayDate, "dd/MM/yyyy")}</strong>
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={m.isPending}>
            Gerar Agendamentos
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function FeriasDialog({
  pacienteId,
  onSaved,
  onClose,
}: {
  pacienteId: string;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    data_inicio: "",
    data_fim: "",
  });

  const m = useMutation({
    mutationFn: async () => {
      if (!form.data_inicio || !form.data_fim) {
        throw new Error("Preencha as datas de início e fim.");
      }
      const startIso = new Date(form.data_inicio + "T00:00:00").toISOString();
      const endIso = new Date(form.data_fim + "T23:59:59").toISOString();

      if (startIso > endIso) {
        throw new Error("A data de início deve ser anterior à data de fim.");
      }

      const { error } = await supabase
        .from("agendamentos")
        .update({
          status: "cancelado",
          motivo_cancelamento: "Férias do paciente",
        })
        .eq("paciente_id", pacienteId)
        .gte("data_inicio", startIso)
        .lte("data_inicio", endIso);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Período de férias marcado. Agendamentos cancelados.");
      onSaved();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Marcar férias do paciente</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          m.mutate();
        }}
        className="space-y-3"
      >
        <p className="text-xs text-muted-foreground">
          Isso mudará o status de todos os agendamentos do paciente no período informado para <strong>Cancelado</strong>.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Data Início</Label>
            <Input
              type="date"
              required
              value={form.data_inicio}
              onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Data Fim</Label>
            <Input
              type="date"
              required
              value={form.data_fim}
              onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={m.isPending} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
            Confirmar Cancelamentos
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
