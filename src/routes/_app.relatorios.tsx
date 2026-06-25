import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Calendar,
  Users,
  FileText,
  Plus,
  Search,
  Pencil,
  Trash2,
  Check,
  Clock,
  AlertTriangle,
  Undo2,
  TrendingUp,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, differenceInDays, addDays, parseISO, isAfter } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/relatorios")({
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const qc = useQueryClient();
  const today = new Date();

  // 1. Existing general metrics state
  const [inicio, setInicio] = useState(format(startOfMonth(today), "yyyy-MM-dd"));
  const [fim, setFim] = useState(format(endOfMonth(today), "yyyy-MM-dd"));

  // 2. Report control state
  const [activeTab, setActiveTab] = useState("metricas");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "pendente" | "atrasado" | "entregue">("todos");
  
  // Dialog form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [formData, setFormData] = useState({
    id: "",
    paciente_id: "",
    responsavel_nome: "",
    data_solicitacao: format(new Date(), "yyyy-MM-dd"),
    data_limite: format(addDays(new Date(), 10), "yyyy-MM-dd"),
    data_entrega: "",
    observacoes: "",
  });

  // Queries
  const { data: agendamentos = [] } = useQuery({
    queryKey: ["rel-agendamentos", inicio, fim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select("id, status, data_inicio, profissional:profissionais(nome)")
        .gte("data_inicio", `${inicio}T00:00:00`)
        .lte("data_inicio", `${fim}T23:59:59`);
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: pacientesAtivos = 0 } = useQuery({
    queryKey: ["rel-pacientes-ativos"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("pacientes")
        .select("*", { count: "exact", head: true })
        .eq("status", "ativo");
      if (error) throw error;
      return count ?? 0;
    },
  });

  // Fetch report requests with fallback handling in case database table isn't created yet
  const { data: reportRequests = [] } = useQuery({
    queryKey: ["controle-relatorios"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("controle_relatorios")
          .select("*, paciente:pacientes(nome)")
          .order("data_solicitacao", { ascending: false });
        if (error) {
          console.warn("Table controle_relatorios may not exist yet:", error.message);
          return [];
        }
        return data ?? [];
      } catch (err) {
        console.error(err);
        return [];
      }
    },
  });

  // Fetch active patients list for request creation
  const { data: activePatients = [] } = useQuery({
    queryKey: ["active-patients-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pacientes")
        .select("id, nome")
        .eq("status", "ativo")
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch responsibles list for auto-suggestion
  const { data: responsaveis = [] } = useQuery({
    queryKey: ["responsaveis-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("responsaveis")
        .select("id, paciente_id, nome, parentesco");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Computed requests list with dynamic status calculation
  const computedRequests = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const todayParsed = parseISO(todayStr);

    return reportRequests.map((req: any) => {
      const dataLimite = parseISO(req.data_limite);
      const entregue = !!req.data_entrega;
      
      let status: "entregue" | "atrasado" | "pendente" = "pendente";
      let diasRestantes = 0;
      let diasAtraso = 0;

      if (entregue) {
        status = "entregue";
        const dataEntrega = parseISO(req.data_entrega);
        if (isAfter(dataEntrega, dataLimite)) {
          diasAtraso = differenceInDays(dataEntrega, dataLimite);
        }
      } else {
        if (isAfter(todayParsed, dataLimite)) {
          status = "atrasado";
          diasAtraso = differenceInDays(todayParsed, dataLimite);
        } else {
          status = "pendente";
          diasRestantes = differenceInDays(dataLimite, todayParsed);
        }
      }

      return {
        ...req,
        statusLabel: status,
        diasRestantes,
        diasAtraso,
      };
    });
  }, [reportRequests]);

  // General metrics calculations (original code)
  const stats = useMemo(() => {
    const total = agendamentos.length;
    const realizados = agendamentos.filter((a) => a.status === "realizado").length;
    const cancelados = agendamentos.filter((a) => a.status === "cancelado").length;
    const taxa = total > 0 ? Math.round((realizados / total) * 100) : 0;

    const porProfissional: Record<string, number> = {};
    agendamentos.forEach((a) => {
      const nome = a.profissional?.nome ?? "—";
      porProfissional[nome] = (porProfissional[nome] ?? 0) + 1;
    });
    const ranking = Object.entries(porProfissional).sort((a, b) => b[1] - a[1]);

    return { total, realizados, cancelados, taxa, ranking };
  }, [agendamentos]);

  // Report status stats summary
  const reportStats = useMemo(() => {
    const total = computedRequests.length;
    const entregues = computedRequests.filter((r) => r.statusLabel === "entregue").length;
    const atrasados = computedRequests.filter((r) => r.statusLabel === "atrasado").length;
    const pendentes = computedRequests.filter((r) => r.statusLabel === "pendente").length;
    return { total, entregues, atrasados, pendentes };
  }, [computedRequests]);

  // Filter and search logic
  const filteredRequests = useMemo(() => {
    return computedRequests.filter((req) => {
      // 1. Search Query
      const pacienteNome = req.paciente?.nome || "";
      const responsavelNome = req.responsavel_nome || "";
      const matchesSearch =
        pacienteNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        responsavelNome.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Status filter
      const matchesStatus = statusFilter === "todos" || req.statusLabel === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [computedRequests, searchQuery, statusFilter]);

  // Suggested responsibles based on selected patient in form
  const suggestedResponsibles = useMemo(() => {
    if (!formData.paciente_id) return [];
    return responsaveis.filter((r: any) => r.paciente_id === formData.paciente_id);
  }, [formData.paciente_id, responsaveis]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (data.id) {
        const { error } = await supabase
          .from("controle_relatorios")
          .update({
            paciente_id: data.paciente_id,
            responsavel_nome: data.responsavel_nome,
            data_solicitacao: data.data_solicitacao,
            data_limite: data.data_limite,
            data_entrega: data.data_entrega || null,
            observacoes: data.observacoes || null,
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("controle_relatorios")
          .insert({
            paciente_id: data.paciente_id,
            responsavel_nome: data.responsavel_nome,
            data_solicitacao: data.data_solicitacao,
            data_limite: data.data_limite,
            data_entrega: data.data_entrega || null,
            observacoes: data.observacoes || null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Registro de relatório salvo com sucesso!");
      qc.invalidateQueries({ queryKey: ["controle-relatorios"] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error("Erro ao salvar: " + err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("controle_relatorios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registro excluído com sucesso!");
      qc.invalidateQueries({ queryKey: ["controle-relatorios"] });
    },
    onError: (err: any) => {
      toast.error("Erro ao excluir: " + err.message);
    },
  });

  const toggleDeliveryMutation = useMutation({
    mutationFn: async ({ id, dataEntrega }: { id: string; dataEntrega: string | null }) => {
      const { error } = await supabase
        .from("controle_relatorios")
        .update({ data_entrega: dataEntrega })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Entrega atualizada com sucesso!");
      qc.invalidateQueries({ queryKey: ["controle-relatorios"] });
    },
    onError: (err: any) => {
      toast.error("Erro ao atualizar entrega: " + err.message);
    },
  });

  const resetForm = () => {
    setFormData({
      id: "",
      paciente_id: "",
      responsavel_nome: "",
      data_solicitacao: format(new Date(), "yyyy-MM-dd"),
      data_limite: format(addDays(new Date(), 10), "yyyy-MM-dd"),
      data_entrega: "",
      observacoes: "",
    });
    setEditingRequest(null);
  };

  const handleOpenNewDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (req: any) => {
    setEditingRequest(req);
    setFormData({
      id: req.id,
      paciente_id: req.paciente_id,
      responsavel_nome: req.responsavel_nome,
      data_solicitacao: req.data_solicitacao,
      data_limite: req.data_limite,
      data_entrega: req.data_entrega || "",
      observacoes: req.observacoes || "",
    });
    setDialogOpen(true);
  };

  const handleDataSolicitacaoChange = (val: string) => {
    try {
      const parsed = parseISO(val);
      const limit = addDays(parsed, 10);
      setFormData((prev) => ({
        ...prev,
        data_solicitacao: val,
        data_limite: format(limit, "yyyy-MM-dd"),
      }));
    } catch (err) {
      setFormData((prev) => ({ ...prev, data_solicitacao: val }));
    }
  };

  const handleDeleteRequest = (id: string, pacienteNome: string) => {
    if (confirm(`Tem certeza que deseja excluir o registro de relatório de ${pacienteNome}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleQuickDeliver = (id: string) => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    toggleDeliveryMutation.mutate({ id, dataEntrega: todayStr });
  };

  const handleQuickUndoDeliver = (id: string) => {
    toggleDeliveryMutation.mutate({ id, dataEntrega: null });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.paciente_id) {
      toast.error("Por favor, selecione um paciente.");
      return;
    }
    if (!formData.responsavel_nome.trim()) {
      toast.error("Por favor, informe o responsável solicitante.");
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="metricas" className="gap-2">
            <TrendingUp className="h-4 w-4" /> Métricas de Atendimento
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="gap-2">
            <FileText className="h-4 w-4" /> Entrega de Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metricas" className="mt-4 space-y-4">
          <Card>
            <CardContent className="flex flex-wrap items-end gap-3 p-4">
              <div className="space-y-1.5">
                <Label>Início</Label>
                <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Fim</Label>
                <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <RelatorioStat icon={Calendar} label="Agendamentos" value={String(stats.total)} />
            <RelatorioStat
              icon={CheckCircle2}
              label="Realizados"
              value={`${stats.realizados} (${stats.taxa}%)`}
            />
            <RelatorioStat icon={Users} label="Pacientes ativos" value={String(pacientesAtivos)} />
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Agendamentos por profissional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.ranking.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sem dados no período.</p>
                )}
                {stats.ranking.map(([nome, qtd]) => {
                  const max = stats.ranking[0]?.[1] ?? 1;
                  const pct = (qtd / max) * 100;
                  return (
                    <div key={nome}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{nome}</span>
                        <span className="text-muted-foreground">{qtd}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="relatorios" className="mt-4 space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <RelatorioStat icon={FileText} label="Total de Solicitações" value={String(reportStats.total)} />
            <RelatorioStat
              icon={Clock}
              label="Pendentes (No Prazo)"
              value={String(reportStats.pendentes)}
              variant="default"
            />
            <RelatorioStat
              icon={AlertTriangle}
              label="Atrasados"
              value={String(reportStats.atrasados)}
              variant={reportStats.atrasados > 0 ? "destructive" : "default"}
            />
            <RelatorioStat
              icon={CheckCircle2}
              label="Entregues"
              value={String(reportStats.entregues)}
              variant="success"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1 max-w-2xl">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar paciente ou responsável…"
                  className="pl-9"
                />
              </div>

              <div className="w-[180px]">
                <Select
                  value={statusFilter}
                  onValueChange={(val: any) => setStatusFilter(val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="atrasado">Atrasado</SelectItem>
                    <SelectItem value="entregue">Entregue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleOpenNewDialog} className="gap-1.5 shrink-0">
              <Plus className="h-4 w-4" /> Registrar Solicitação
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Responsável Solicitante</TableHead>
                      <TableHead>Data Solicitação</TableHead>
                      <TableHead>Prazo Limite</TableHead>
                      <TableHead>Status / Tempo</TableHead>
                      <TableHead>Data Entrega</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          Nenhum registro encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequests.map((req) => {
                        const pacienteNome = req.paciente?.nome || "—";
                        
                        return (
                          <TableRow key={req.id} className="group">
                            <TableCell className="font-medium">{pacienteNome}</TableCell>
                            <TableCell>{req.responsavel_nome}</TableCell>
                            <TableCell>
                              {req.data_solicitacao
                                ? format(parseISO(req.data_solicitacao), "dd/MM/yyyy")
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {req.data_limite
                                ? format(parseISO(req.data_limite), "dd/MM/yyyy")
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {req.statusLabel === "entregue" ? (
                                <Badge className="bg-emerald-500 hover:bg-emerald-600 gap-1 text-white border-0">
                                  <Check className="h-3 w-3" /> Entregue
                                </Badge>
                              ) : req.statusLabel === "atrasado" ? (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertTriangle className="h-3 w-3" /> Atrasado ({req.diasAtraso}d)
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100/80 gap-1 dark:bg-amber-950/40 dark:text-amber-300 border-0">
                                  <Clock className="h-3 w-3" /> {req.diasRestantes === 0 ? "Hoje!" : `${req.diasRestantes}d restantes`}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {req.data_entrega
                                ? format(parseISO(req.data_entrega), "dd/MM/yyyy")
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end items-center gap-1 opacity-90 group-hover:opacity-100">
                                {req.data_entrega ? (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    title="Desmarcar como Entregue"
                                    onClick={() => handleQuickUndoDeliver(req.id)}
                                    disabled={toggleDeliveryMutation.isPending}
                                  >
                                    <Undo2 className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                    title="Marcar como Entregue hoje"
                                    onClick={() => handleQuickDeliver(req.id)}
                                    disabled={toggleDeliveryMutation.isPending}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                                
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  title="Editar registro"
                                  onClick={() => handleOpenEditDialog(req)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  title="Excluir registro"
                                  onClick={() => handleDeleteRequest(req.id, pacienteNome)}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingRequest ? "Editar Solicitação de Relatório" : "Nova Solicitação de Relatório"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="paciente_id">Paciente</Label>
                <Select
                  value={formData.paciente_id}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, paciente_id: val, responsavel_nome: "" }))}
                  disabled={!!editingRequest}
                >
                  <SelectTrigger id="paciente_id">
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {activePatients.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsavel_nome">Responsável Solicitante</Label>
                <Input
                  id="responsavel_nome"
                  value={formData.responsavel_nome}
                  onChange={(e) => setFormData((prev) => ({ ...prev, responsavel_nome: e.target.value }))}
                  placeholder="Nome do responsável"
                />
                
                {suggestedResponsibles.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                    <span className="text-[10px] text-muted-foreground mr-1">Sugestões:</span>
                    {suggestedResponsibles.map((resp: any) => (
                      <Button
                        key={resp.id}
                        type="button"
                        variant="outline"
                        className="text-[10px] px-2 py-0.5 h-auto rounded-full bg-secondary/50 hover:bg-secondary border-0"
                        onClick={() => setFormData((prev) => ({ ...prev, responsavel_nome: resp.nome }))}
                      >
                        {resp.nome} {resp.parentesco ? `(${resp.parentesco})` : ""}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data_solicitacao">Data de Solicitação</Label>
                  <Input
                    id="data_solicitacao"
                    type="date"
                    value={formData.data_solicitacao}
                    onChange={(e) => handleDataSolicitacaoChange(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_limite">Prazo de Entrega (10 dias)</Label>
                  <Input
                    id="data_limite"
                    type="date"
                    value={formData.data_limite}
                    disabled
                    className="bg-muted text-muted-foreground cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_entrega">Data de Entrega (Opcional)</Label>
                <Input
                  id="data_entrega"
                  type="date"
                  value={formData.data_entrega}
                  onChange={(e) => setFormData((prev) => ({ ...prev, data_entrega: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações (Opcional)</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Ex: Responsável solicitou relatório para fins escolares/médicos..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RelatorioStat({
  icon: Icon,
  label,
  value,
  variant = "default",
}: {
  icon: any;
  label: string;
  value: string;
  variant?: "default" | "destructive" | "success";
}) {
  const iconColors = {
    default: "bg-primary/10 text-primary",
    destructive: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  };

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`grid h-10 w-10 place-items-center rounded-md ${iconColors[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-lg font-semibold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
