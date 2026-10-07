import { useState, useEffect, useMemo } from "react";
import { format, subMonths, parseISO, addDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Sparkles,
  Users,
  Settings,
  Send,
  Check,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  Info,
  DollarSign,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { formatCPF } from "@/components/PacienteFormDialog";
import { splitResponsibleNames } from "@/routes/_app.relatorios";
import { cn } from "@/lib/utils";

export interface GrupoNfMembro {
  paciente_id: string;
  paciente_nome: string;
  responsavel_id?: string;
  responsavel_nome: string;
  responsavel_cpf: string;
  responsavel_email?: string;
  responsavel_endereco?: string;
  profissional_id?: string;
  especialidades?: string;
  valor_padrao?: number | null;
  ativo: boolean;
}

interface GrupoNotasFiscaisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activePatients: any[];
  responsaveis: any[];
  activeProfessionals: any[];
  pacienteProfissionais: any[];
  tiposDocumento: any[];
  reportRequests: any[];
  onOpenAccountantDialog: (targetMonth?: string) => void;
}

const STORAGE_KEY = "grupo_recorrente_notas_fiscais";

const APOIO_RATES_MAP: Record<string, number> = {
  "1x": 140.0,
  "2x": 240.0,
  "3x": 340.0,
};

const isApoioSpec = (spec: any) => {
  if (!spec) return false;
  const s = String(spec).trim().toLowerCase();
  return s === "apoio" || s === "ap";
};

// Helper to extract <!--GRUPO_NF:...--> from patient observations
export function parseGrupoNfTag(observacoes: string | null | undefined): Partial<GrupoNfMembro> | null {
  if (!observacoes) return null;
  const match = observacoes.match(/<!--GRUPO_NF:(.*?)-->/);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      console.error("Erro ao fazer parse de GRUPO_NF", e);
    }
  }
  return null;
}

export function GrupoNotasFiscaisDialog({
  open,
  onOpenChange,
  activePatients,
  responsaveis,
  activeProfessionals,
  pacienteProfissionais,
  tiposDocumento,
  reportRequests,
  onOpenAccountantDialog,
}: GrupoNotasFiscaisDialogProps) {
  const qc = useQueryClient();
  const [currentTab, setCurrentTab] = useState<"gerar" | "membros">("gerar");

  // Reference month selector (default: previous month, since invoices are usually requested for the finished month)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return format(subMonths(new Date(), 1), "yyyy-MM");
  });

  const [dataSolicitacao, setDataSolicitacao] = useState<string>(() => {
    return format(new Date(), "yyyy-MM-dd");
  });

  const [dataLimite, setDataLimite] = useState<string>(() => {
    return format(addDays(new Date(), 10), "yyyy-MM-dd");
  });

  // Master list of members in the recurring group
  const [membros, setMembros] = useState<GrupoNfMembro[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSavingMembros, setIsSavingMembros] = useState(false);

  // State for batch generation selection and values
  // Map of paciente_id -> { selected: boolean, valor: string, isExisting: boolean, existingId?: string }
  const [batchItemsState, setBatchItemsState] = useState<
    Record<string, { selected: boolean; valor: string; isExisting: boolean; existingDate?: string }>
  >({});
  const [isLoadingFaturas, setIsLoadingFaturas] = useState(false);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);

  // New member form inside the management tab
  const [newPacId, setNewPacId] = useState("");
  const [newRespNome, setNewRespNome] = useState("");
  const [newRespCpf, setNewRespCpf] = useState("");
  const [newRespEmail, setNewRespEmail] = useState("");
  const [newRespEndereco, setNewRespEndereco] = useState("");
  const [newProfId, setNewProfId] = useState("");
  const [newEspecialidades, setNewEspecialidades] = useState("");

  // Last 12 months for selector
  const availableMonths = useMemo(() => {
    const list: { value: string; label: string; fullLabel: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = subMonths(now, i);
      const val = format(d, "yyyy-MM");
      const label = format(d, "MMM/yy", { locale: ptBR });
      const fullLabel = format(d, "MMMM 'de' yyyy", { locale: ptBR });
      list.push({
        value: val,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        fullLabel: fullLabel.charAt(0).toUpperCase() + fullLabel.slice(1),
      });
    }
    return list;
  }, []);

  // 1. INITIALIZE GROUP MEMBERS (Database tag > localStorage > Auto-seed from history)
  useEffect(() => {
    if (activePatients.length === 0) return;

    // A. Check database tags in pacientes
    const fromDb: GrupoNfMembro[] = [];
    activePatients.forEach((p) => {
      const tag = parseGrupoNfTag(p.observacoes);
      if (tag) {
        fromDb.push({
          paciente_id: p.id,
          paciente_nome: p.nome,
          responsavel_id: tag.responsavel_id,
          responsavel_nome: tag.responsavel_nome || "",
          responsavel_cpf: tag.responsavel_cpf || p.cpf || "",
          responsavel_email: tag.responsavel_email || "",
          responsavel_endereco: tag.responsavel_endereco || "",
          profissional_id: tag.profissional_id,
          especialidades: tag.especialidades || (Array.isArray(p.cids_secundarios) ? p.cids_secundarios.join(", ") : ""),
          valor_padrao: tag.valor_padrao ?? null,
          ativo: tag.ativo ?? true,
        });
      }
    });

    if (fromDb.length > 0) {
      setMembros(fromDb);
      setIsInitialized(true);
      return;
    }

    // B. Check localStorage
    if (typeof window !== "undefined") {
      const localStr = window.localStorage.getItem(STORAGE_KEY);
      if (localStr) {
        try {
          const parsed = JSON.parse(localStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Update names with current active patients
            const merged = parsed
              .map((item: any) => {
                const pac = activePatients.find((p) => p.id === item.paciente_id);
                if (!pac) return null;
                return {
                  ...item,
                  paciente_nome: pac.nome,
                  responsavel_cpf: item.responsavel_cpf || pac.cpf || "",
                };
              })
              .filter(Boolean) as GrupoNfMembro[];

            if (merged.length > 0) {
              setMembros(merged);
              setIsInitialized(true);
              return;
            }
          }
        } catch (e) {
          console.error("Erro ao ler grupo do localStorage:", e);
        }
      }
    }

    // C. Auto-seed from historical 'Nota Fiscal' in controle_relatorios
    const nfRequests = reportRequests.filter(
      (r) => r.tipo_documento?.nome?.toLowerCase() === "nota fiscal"
    );

    if (nfRequests.length > 0) {
      const mapByPatient = new Map<string, GrupoNfMembro>();
      nfRequests.forEach((req) => {
        if (!req.paciente_id || mapByPatient.has(req.paciente_id)) return;
        const pac = activePatients.find((p) => p.id === req.paciente_id);
        if (!pac) return; // Only active patients

        mapByPatient.set(req.paciente_id, {
          paciente_id: req.paciente_id,
          paciente_nome: pac.nome,
          responsavel_id: req.responsavel_id,
          responsavel_nome: req.responsavel_nome || "",
          responsavel_cpf: req.responsavel_cpf || pac.cpf || "",
          responsavel_email: req.responsavel_email || "",
          responsavel_endereco: req.responsavel_endereco || "",
          profissional_id: req.profissional_id || "",
          especialidades:
            req.especialidades ||
            (Array.isArray(pac.cids_secundarios) ? pac.cids_secundarios.join(", ") : ""),
          valor_padrao: (req.valor_total && req.valor_total > 1 ? req.valor_total : null) || (pac.valor_mensal && Number(pac.valor_mensal) > 1 ? Number(pac.valor_mensal) : null),
          ativo: true,
        });
      });

      const initialList = Array.from(mapByPatient.values()).sort((a, b) =>
        a.paciente_nome.localeCompare(b.paciente_nome)
      );

      setMembros(initialList);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialList));
      }
      setIsInitialized(true);
    }
  }, [activePatients, reportRequests]);

  // 2. Fetch and calculate month totals for all members whenever selectedMonth or membros changes
  // Exactly matches the calculation used in the 'Diretoria' page
  useEffect(() => {
    if (!open || membros.length === 0) return;

    let isMounted = true;
    const calculateTotals = async () => {
      setIsLoadingFaturas(true);

      const patientIds = membros.map((m) => m.paciente_id);
      const monthDate = parseISO(`${selectedMonth}-01`);
      const minDate = format(startOfMonth(monthDate), "yyyy-MM-dd");
      const maxDate = format(endOfMonth(monthDate), "yyyy-MM-dd");

      try {
        // Query faturas for this month period exactly like Diretoria
        const { data: faturasData } = await supabase
          .from("faturas")
          .select("id, paciente_id, competencia, vencimento, valor, status, especialidade, profissional_id, observacoes")
          .in("paciente_id", patientIds)
          .gte("competencia", minDate)
          .lte("competencia", maxDate)
          .neq("status", "cancelada");

        // Query fatura_itens for these faturas
        const fatIds = (faturasData || []).map((f: any) => f.id);
        let faturaItensData: any[] = [];
        if (fatIds.length > 0) {
          const { data: itemsData } = await supabase
            .from("fatura_itens")
            .select("id, fatura_id, total, valor_unitario, agendamento_id, descricao")
            .in("fatura_id", fatIds);
          faturaItensData = itemsData || [];
        }

        // Query patient details (valor_mensal, apoio_frequencia, apoio_valor_personalizado)
        const { data: dbPacientes } = await supabase
          .from("pacientes")
          .select("id, nome, valor_mensal, apoio_frequencia, apoio_valor_personalizado")
          .in("id", patientIds);
        const patientDetailsMap = new Map((dbPacientes || []).map((p: any) => [p.id, p]));

        const getApoioFaturaValor = (fatura: any, p: any) => {
          if (!p) return Number(fatura?.valor) || 0;
          const freq = p.apoio_frequencia || "2x";
          const customVal = p.apoio_valor_personalizado;
          if (customVal !== null && customVal !== undefined && String(customVal) !== "") {
            const numVal = Number(customVal);
            if (freq !== "avulso" || numVal > 60) return numVal;
            const sessionsCount = faturaItensData.filter(
              (item: any) => item.fatura_id === fatura?.id && item.agendamento_id
            ).length;
            return sessionsCount > 0 ? sessionsCount * numVal : numVal;
          }
          if (freq === "avulso") {
            const sessionsCount = faturaItensData.filter(
              (item: any) => item.fatura_id === fatura?.id && item.agendamento_id
            ).length;
            return sessionsCount > 0 ? sessionsCount * 50.0 : 50.0;
          }
          return APOIO_RATES_MAP[freq] ?? 240.0;
        };

        const getFaturaEffectiveValue = (fatura: any) => {
          if (!fatura) return 0;
          const p = patientDetailsMap.get(fatura.paciente_id);
          if (isApoioSpec(fatura.especialidade)) {
            if (fatura.status === "paga" && Number(fatura.valor) > 0) {
              return Number(fatura.valor);
            }
            return getApoioFaturaValor(fatura, p);
          }
          if (fatura.status === "paga" && Number(fatura.valor) > 0) {
            return Number(fatura.valor);
          }
          if (fatura.observacoes?.includes("Saldo restante") && Number(fatura.valor) > 0) {
            return Number(fatura.valor);
          }
          const items = faturaItensData.filter((item: any) => item.fatura_id === fatura.id);
          if (items.length > 0) {
            const itemsTotal = items.reduce(
              (acc: number, item: any) => acc + (Number(item.total) || 0),
              0
            );
            if (itemsTotal > 0) return itemsTotal;
          }
          return Number(fatura.valor) || 0;
        };

        // Map totals by patient (consolidated across all faturas in the competence)
        const totalByPatient = new Map<string, number>();
        (faturasData || []).forEach((f: any) => {
          const val = getFaturaEffectiveValue(f);
          totalByPatient.set(f.paciente_id, (totalByPatient.get(f.paciente_id) || 0) + val);
        });

        // Check which patients ALREADY have a Nota Fiscal request for this reference month
        const existingReqsByPatient = new Map<string, any>();
        reportRequests.forEach((req: any) => {
          const isNotaFiscal = req.tipo_documento?.nome?.toLowerCase() === "nota fiscal";
          if (!isNotaFiscal || !req.paciente_id) return;

          const reqMeses = req.meses_referencia || "";
          const reqObs = req.observacoes || "";
          const reqDateMonth = req.data_solicitacao ? req.data_solicitacao.substring(0, 7) : "";

          const matchesMonth =
            reqMeses.includes(selectedMonth) ||
            reqObs.includes(selectedMonth) ||
            (reqDateMonth === selectedMonth && !reqMeses);

          if (matchesMonth) {
            existingReqsByPatient.set(req.paciente_id, req);
          }
        });

        if (!isMounted) return;

        // Build batchItemsState
        const newState: Record<
          string,
          { selected: boolean; valor: string; isExisting: boolean; existingDate?: string }
        > = {};

        membros.forEach((m) => {
          const pacFromProp = activePatients.find((p) => p.id === m.paciente_id);
          const pacDetails = patientDetailsMap.get(m.paciente_id) || pacFromProp;
          const calculatedVal = totalByPatient.get(m.paciente_id);
          const pacValorMensal = pacDetails?.valor_mensal ? Number(pacDetails.valor_mensal) : 0;
          const defaultVal = m.valor_padrao ? Number(m.valor_padrao) : 0;

          // If no faturas in this month, check if there's an active monthly plan
          let fallbackVal = 0;
          if (pacDetails) {
            const apoioVal = getApoioFaturaValor({ paciente_id: m.paciente_id }, pacDetails);
            if (apoioVal > 0) {
              fallbackVal = apoioVal;
            } else if (pacValorMensal > 1) {
              fallbackVal = pacValorMensal;
            } else if (defaultVal > 1) {
              fallbackVal = defaultVal;
            }
          } else if (defaultVal > 1) {
            fallbackVal = defaultVal;
          }

          const finalValNum =
            calculatedVal !== undefined && calculatedVal > 0
              ? calculatedVal
              : fallbackVal;

          const existing = existingReqsByPatient.get(m.paciente_id);
          const isExisting = !!existing;

          newState[m.paciente_id] = {
            // If already existing, don't check by default to avoid accidental duplicate
            // If active and not existing, check by default!
            selected: m.ativo && !isExisting,
            valor: finalValNum > 0 ? finalValNum.toFixed(2) : "0.00",
            isExisting,
            existingDate: existing?.data_solicitacao
              ? format(parseISO(existing.data_solicitacao), "dd/MM/yyyy")
              : undefined,
          };
        });

        setBatchItemsState(newState);
      } catch (err) {
        console.error("Erro ao calcular faturas para o mês:", err);
      } finally {
        if (isMounted) setIsLoadingFaturas(false);
      }
    };

    calculateTotals();

    return () => {
      isMounted = false;
    };
  }, [open, selectedMonth, membros, reportRequests, activePatients]);

  // Handle toggle selection for one patient
  const handleToggleSelect = (pacienteId: string) => {
    setBatchItemsState((prev) => ({
      ...prev,
      [pacienteId]: {
        ...prev[pacienteId],
        selected: !prev[pacienteId]?.selected,
      },
    }));
  };

  // Handle value change for one patient
  const handleValueChange = (pacienteId: string, val: string) => {
    setBatchItemsState((prev) => ({
      ...prev,
      [pacienteId]: {
        ...prev[pacienteId],
        valor: val,
      },
    }));
  };

  // Toggle select all
  const allSelected = useMemo(() => {
    const activeMembros = membros.filter((m) => m.ativo);
    if (activeMembros.length === 0) return false;
    return activeMembros.every((m) => batchItemsState[m.paciente_id]?.selected);
  }, [membros, batchItemsState]);

  const handleToggleSelectAll = () => {
    const nextVal = !allSelected;
    setBatchItemsState((prev) => {
      const updated = { ...prev };
      membros.forEach((m) => {
        if (m.ativo) {
          updated[m.paciente_id] = {
            ...updated[m.paciente_id],
            selected: nextVal,
          };
        }
      });
      return updated;
    });
  };

  // Summary counts and total
  const batchSummary = useMemo(() => {
    let count = 0;
    let total = 0;
    Object.entries(batchItemsState).forEach(([pacId, item]) => {
      if (item.selected) {
        count++;
        total += Number(item.valor || 0);
      }
    });
    return { count, total };
  }, [batchItemsState]);

  // Save member modifications to database & localStorage
  const handleSaveMembrosConfig = async (newMembrosList: GrupoNfMembro[]) => {
    setIsSavingMembros(true);
    try {
      // 1. Update localStorage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newMembrosList));
      }

      // 2. Persist in database (pacientes.observacoes)
      for (const m of newMembrosList) {
        const pac = activePatients.find((p) => p.id === m.paciente_id);
        if (!pac) continue;

        const currentObs = pac.observacoes || "";
        const cleanObs = currentObs.replace(/<!--GRUPO_NF:.*?-->/g, "").trim();
        const tagPayload = {
          ativo: m.ativo,
          responsavel_id: m.responsavel_id || null,
          responsavel_nome: m.responsavel_nome,
          responsavel_cpf: m.responsavel_cpf,
          responsavel_email: m.responsavel_email || null,
          responsavel_endereco: m.responsavel_endereco || null,
          profissional_id: m.profissional_id || null,
          especialidades: m.especialidades || null,
          valor_padrao: m.valor_padrao || null,
        };
        const newObs = `${cleanObs}\n\n<!--GRUPO_NF:${JSON.stringify(tagPayload)}-->`.trim();

        await supabase.from("pacientes").update({ observacoes: newObs }).eq("id", m.paciente_id);
      }

      setMembros(newMembrosList);
      qc.invalidateQueries({ queryKey: ["active-patients-list"] });
      toast.success("Grupo de Notas Fiscais salvo com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar membros do grupo:", err);
      toast.error("Erro ao salvar membros: " + (err.message || "Tente novamente"));
    } finally {
      setIsSavingMembros(false);
    }
  };

  // Toggle member active status
  const handleToggleMemberActive = (pacienteId: string) => {
    const updated = membros.map((m) =>
      m.paciente_id === pacienteId ? { ...m, ativo: !m.ativo } : m
    );
    setMembros(updated);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  };

  // Remove member from recurring group
  const handleRemoveMember = async (pacienteId: string) => {
    const pac = activePatients.find((p) => p.id === pacienteId);
    if (!confirm(`Remover "${pac?.nome || "este paciente"}" do Grupo Recorrente de Notas Fiscais?`)) {
      return;
    }

    const updated = membros.filter((m) => m.paciente_id !== pacienteId);
    setMembros(updated);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }

    if (pac) {
      const cleanObs = (pac.observacoes || "").replace(/<!--GRUPO_NF:.*?-->/g, "").trim();
      await supabase.from("pacientes").update({ observacoes: cleanObs || null }).eq("id", pacienteId);
      qc.invalidateQueries({ queryKey: ["active-patients-list"] });
    }

    toast.success("Paciente removido do grupo.");
  };

  // Add new member to group
  const handleAddNewMember = () => {
    if (!newPacId) {
      toast.error("Selecione um paciente.");
      return;
    }
    if (!newRespNome.trim()) {
      toast.error("Informe o nome do responsável solicitante.");
      return;
    }

    if (membros.some((m) => m.paciente_id === newPacId)) {
      toast.error("Este paciente já está no grupo recorrente.");
      return;
    }

    const pac = activePatients.find((p) => p.id === newPacId);
    const newMember: GrupoNfMembro = {
      paciente_id: newPacId,
      paciente_nome: pac?.nome || "—",
      responsavel_nome: newRespNome.trim(),
      responsavel_cpf: newRespCpf.replace(/\D/g, ""),
      responsavel_email: newRespEmail.trim() || undefined,
      responsavel_endereco: newRespEndereco.trim() || undefined,
      profissional_id: newProfId || undefined,
      especialidades: newEspecialidades || undefined,
      ativo: true,
    };

    const updated = [...membros, newMember].sort((a, b) =>
      a.paciente_nome.localeCompare(b.paciente_nome)
    );

    handleSaveMembrosConfig(updated);

    // Reset form
    setNewPacId("");
    setNewRespNome("");
    setNewRespCpf("");
    setNewRespEmail("");
    setNewRespEndereco("");
    setNewProfId("");
    setNewEspecialidades("");
  };

  // Helper when picking patient in new member form
  const handleSelectNewPac = (pacId: string) => {
    setNewPacId(pacId);
    const pac = activePatients.find((p) => p.id === pacId);

    // Responsibles for this patient
    const rawResps = responsaveis.filter((r) => r.paciente_id === pacId);
    const parsedResps: any[] = [];
    rawResps.forEach((r: any) => {
      const splitNames = splitResponsibleNames(r.nome);
      if (splitNames.length > 1) {
        splitNames.forEach((sName: string, idx: number) => {
          parsedResps.push({
            ...r,
            id: `${r.id}_${idx}`,
            rawId: r.id,
            nome: sName,
            cpf: idx === 0 ? r.cpf : null,
          });
        });
      } else {
        parsedResps.push({
          ...r,
          rawId: r.id,
        });
      }
    });

    const defaultResp = parsedResps.length === 1 ? parsedResps[0] : null;
    const defaultCpf = defaultResp?.cpf ? formatCPF(defaultResp.cpf) : (pac?.cpf ? formatCPF(pac.cpf) : "");

    // Assigned professional
    const assignedProfs = pacienteProfissionais
      .filter((pp: any) => pp.paciente_id === pacId)
      .map((pp: any) => pp.profissionais)
      .filter(Boolean);
    const defaultProfId = assignedProfs.length === 1 ? assignedProfs[0].id : "";

    const defaultSpecs = Array.isArray(pac?.cids_secundarios) && pac.cids_secundarios.length > 0
      ? pac.cids_secundarios.join(", ")
      : "";

    setNewRespNome(defaultResp?.nome || "");
    setNewRespCpf(defaultCpf);
    setNewRespEmail(defaultResp?.email || "");
    setNewRespEndereco(defaultResp?.endereco || "");
    setNewProfId(defaultProfId);
    setNewEspecialidades(defaultSpecs);
  };

  // 3. EXECUTE BATCH GENERATION
  const handleGenerateBatch = async (andOpenAccountant: boolean = true) => {
    const selectedEntries = membros.filter(
      (m) => batchItemsState[m.paciente_id]?.selected
    );

    if (selectedEntries.length === 0) {
      toast.error("Nenhum paciente selecionado para gerar solicitações.");
      return;
    }

    const notaFiscalTipo = tiposDocumento.find(
      (t: any) => t.nome?.toLowerCase() === "nota fiscal"
    );

    setIsGeneratingBatch(true);

    try {
      let createdCount = 0;
      const errors: string[] = [];

      for (const m of selectedEntries) {
        const stateItem = batchItemsState[m.paciente_id];
        const valorNum = Number(stateItem?.valor || 0);
        const cleanCpf = m.responsavel_cpf ? m.responsavel_cpf.replace(/\D/g, "") : null;

        const payload: any = {
          paciente_id: m.paciente_id,
          responsavel_nome: m.responsavel_nome,
          responsavel_cpf: cleanCpf,
          profissional_id: m.profissional_id || null,
          tipo_documento_id: notaFiscalTipo?.id || null,
          data_solicitacao: dataSolicitacao,
          data_limite: dataLimite,
          valor_total: valorNum > 0 ? valorNum : null,
          especialidades: m.especialidades || null,
          observacoes: `[Mês de Referência: ${selectedMonth}]`,
          responsavel_email: m.responsavel_email || null,
          responsavel_endereco: m.responsavel_endereco || null,
          meses_referencia: selectedMonth,
        };

        let res = await supabase.from("controle_relatorios").insert(payload);

        // Fallback for missing columns in controle_relatorios
        if (
          res.error &&
          (res.error.message?.includes("responsavel_email") ||
            res.error.message?.includes("responsavel_endereco") ||
            res.error.message?.includes("meses_referencia"))
        ) {
          delete payload.responsavel_email;
          delete payload.responsavel_endereco;
          delete payload.meses_referencia;
          res = await supabase.from("controle_relatorios").insert(payload);
        }

        if (res.error) {
          errors.push(`${m.paciente_nome}: ${res.error.message}`);
        } else {
          createdCount++;
        }
      }

      await qc.invalidateQueries({ queryKey: ["controle-relatorios"] });

      if (createdCount > 0) {
        toast.success(
          `🎉 ${createdCount} solicitações de Nota Fiscal geradas com sucesso para ${selectedMonth}!`
        );
      }

      if (errors.length > 0) {
        toast.error(`Falha em ${errors.length} paciente(s): ` + errors[0]);
      }

      onOpenChange(false);

      if (andOpenAccountant) {
        // Small delay to let database invalidate and dialog close smoothly
        setTimeout(() => {
          onOpenAccountantDialog(selectedMonth);
        }, 200);
      }
    } catch (err: any) {
      console.error("Erro ao gerar lote de notas fiscais:", err);
      toast.error("Erro ao gerar lote: " + (err.message || "Tente novamente"));
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  Solicitações Mensais de Notas Fiscais
                  <Badge variant="secondary" className="font-normal text-xs">
                    {membros.filter((m) => m.ativo).length} no grupo fixo
                  </Badge>
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Gere o lote mensal de solicitações de nota fiscal e envie diretamente ao contador em poucos cliques.
                </p>
              </div>
            </div>
          </div>

          <Tabs
            value={currentTab}
            onValueChange={(val: any) => setCurrentTab(val)}
            className="w-full mt-3"
          >
            <TabsList className="grid grid-cols-2 w-full max-w-sm">
              <TabsTrigger value="gerar" className="gap-2 text-xs">
                <Send className="h-3.5 w-3.5" />
                Lote do Mês (Gerar)
              </TabsTrigger>
              <TabsTrigger value="membros" className="gap-2 text-xs">
                <Users className="h-3.5 w-3.5" />
                Gerenciar Grupo Fixo ({membros.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </DialogHeader>

        {/* TAB 1: GERAR LOTE DO MÊS */}
        {currentTab === "gerar" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 pb-3 space-y-4 border-b bg-muted/10">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1 - Mês de Referência */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      Mês de Referência
                    </Label>
                  </div>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione o mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMonths.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.fullLabel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1.5 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2 rounded-full"
                      onClick={() => setSelectedMonth(format(subMonths(new Date(), 1), "yyyy-MM"))}
                    >
                      Mês Anterior
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2 rounded-full"
                      onClick={() => setSelectedMonth(format(new Date(), "yyyy-MM"))}
                    >
                      Mês Atual
                    </Button>
                  </div>
                </div>

                {/* 2 - Data da Solicitação */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Data da Solicitação</Label>
                  <Input
                    type="date"
                    value={dataSolicitacao}
                    onChange={(e) => setDataSolicitacao(e.target.value)}
                    className="h-9"
                  />
                  <span className="text-[10px] text-muted-foreground block">
                    Data registrada no sistema
                  </span>
                </div>

                {/* 3 - Prazo Limite */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Prazo Limite (+10 dias)</Label>
                  <Input
                    type="date"
                    value={dataLimite}
                    onChange={(e) => setDataLimite(e.target.value)}
                    className="h-9"
                  />
                  <span className="text-[10px] text-muted-foreground block">
                    Prazo para conclusão/emissão
                  </span>
                </div>
              </div>
            </div>

            {/* LISTA DE PACIENTES DO LOTE */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={allSelected}
                    onCheckedChange={handleToggleSelectAll}
                  />
                  <Label
                    htmlFor="select-all"
                    className="text-xs font-medium cursor-pointer text-muted-foreground"
                  >
                    Selecionar todos os ativos ({membros.filter((m) => m.ativo).length})
                  </Label>
                </div>

                {isLoadingFaturas ? (
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    Buscando valores das faturas de {selectedMonth}…
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Valores preenchidos automaticamente com base nas faturas de {selectedMonth}
                  </span>
                )}
              </div>

              {membros.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-xl space-y-3">
                  <Users className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-sm font-medium text-foreground">
                    Nenhum paciente cadastrado no Grupo Recorrente ainda.
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Vá na aba "Gerenciar Grupo Fixo" para cadastrar os pacientes cujos responsáveis pedem nota fiscal todo mês.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentTab("membros")}
                    className="gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar Pacientes ao Grupo
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {membros.map((m) => {
                    const itemState = batchItemsState[m.paciente_id] || {
                      selected: false,
                      valor: "0.00",
                      isExisting: false,
                    };

                    return (
                      <div
                        key={m.paciente_id}
                        className={cn(
                          "flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all gap-3",
                          itemState.selected
                            ? "bg-card border-primary/40 shadow-sm"
                            : "bg-muted/10 border-border opacity-70",
                          itemState.isExisting && "bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/40"
                        )}
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <Checkbox
                            id={`pac-${m.paciente_id}`}
                            checked={itemState.selected}
                            onCheckedChange={() => handleToggleSelect(m.paciente_id)}
                            className="mt-1 sm:mt-0"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <label
                                htmlFor={`pac-${m.paciente_id}`}
                                className="font-semibold text-sm cursor-pointer hover:text-primary transition-colors text-foreground"
                              >
                                {m.paciente_nome}
                              </label>

                              {itemState.isExisting ? (
                                <Badge
                                  variant="outline"
                                  className="border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-[10px] py-0"
                                >
                                  ✓ Já gerada em {itemState.existingDate || selectedMonth}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="border-emerald-400/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 text-[10px] py-0"
                                >
                                  Pendente
                                </Badge>
                              )}

                              {!m.ativo && (
                                <Badge variant="secondary" className="text-[10px] py-0">
                                  Inativo no grupo
                                </Badge>
                              )}
                            </div>

                            <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                              <span>
                                <strong className="text-foreground font-medium">Resp:</strong>{" "}
                                {m.responsavel_nome}
                              </span>
                              {m.responsavel_cpf && (
                                <span className="font-mono text-[11px]">
                                  (CPF: {formatCPF(m.responsavel_cpf)})
                                </span>
                              )}
                              {m.especialidades && (
                                <span className="text-[11px] text-muted-foreground italic">
                                  • {m.especialidades}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Valor input */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pl-7 sm:pl-0">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">
                            Valor R$:
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={itemState.valor}
                            onChange={(e) => handleValueChange(m.paciente_id, e.target.value)}
                            className="w-28 h-8 text-right font-mono font-medium text-xs"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* FOOTER ACTION BAR */}
            <DialogFooter className="p-4 border-t bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="text-xs">
                  <span className="text-muted-foreground">Selecionados: </span>
                  <span className="font-bold text-foreground">{batchSummary.count}</span>
                  <span className="text-muted-foreground"> | Soma Total: </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(batchSummary.total)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isGeneratingBatch}
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleGenerateBatch(false)}
                  disabled={isGeneratingBatch || batchSummary.count === 0}
                  className="gap-1.5"
                >
                  {isGeneratingBatch ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  )}
                  Apenas Gerar
                </Button>

                <Button
                  type="button"
                  onClick={() => handleGenerateBatch(true)}
                  disabled={isGeneratingBatch || batchSummary.count === 0}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  {isGeneratingBatch ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Gerar e Abrir Envio ao Contador
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}

        {/* TAB 2: GERENCIAR GRUPO FIXO */}
        {currentTab === "membros" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Formulário para Adicionar Novo Paciente ao Grupo */}
              <div className="bg-muted/30 border rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <Plus className="h-4 w-4 text-primary" />
                    Adicionar Paciente ao Grupo Recorrente
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    Os dados são puxados automaticamente do cadastro
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Paciente</Label>
                    <Select value={newPacId} onValueChange={handleSelectNewPac}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecione o paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {activePatients
                          .filter((p) => !membros.some((m) => m.paciente_id === p.id))
                          .map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nome}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Responsável Solicitante</Label>
                    <Input
                      value={newRespNome}
                      onChange={(e) => setNewRespNome(e.target.value)}
                      placeholder="Nome completo do responsável"
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">CPF do Responsável</Label>
                    <Input
                      value={newRespCpf}
                      onChange={(e) => setNewRespCpf(formatCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      className="h-9 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">E-mail (opcional)</Label>
                    <Input
                      type="email"
                      value={newRespEmail}
                      onChange={(e) => setNewRespEmail(e.target.value)}
                      placeholder="exemplo@email.com"
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Endereço (opcional)</Label>
                    <Input
                      value={newRespEndereco}
                      onChange={(e) => setNewRespEndereco(e.target.value)}
                      placeholder="Rua, número, bairro"
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Especialidades Atendidas</Label>
                    <Input
                      value={newEspecialidades}
                      onChange={(e) => setNewEspecialidades(e.target.value)}
                      placeholder="Ex: Fonoaudiologia, AT ABA"
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddNewMember}
                    disabled={!newPacId || !newRespNome.trim() || isSavingMembros}
                    className="gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar ao Grupo
                  </Button>
                </div>
              </div>

              {/* Lista dos Membros Cadastrados */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Pacientes Fixos do Mês ({membros.length})
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Ative ou desative temporariamente pacientes que não solicitarão nota neste período.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSaveMembrosConfig(membros)}
                    disabled={isSavingMembros}
                    className="gap-1.5"
                  >
                    {isSavingMembros ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Salvar Grupo
                  </Button>
                </div>

                <div className="divide-y border rounded-xl bg-card overflow-hidden">
                  {membros.map((m, idx) => (
                    <div
                      key={m.paciente_id}
                      className={cn(
                        "p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/10 transition-colors",
                        !m.ativo && "opacity-60 bg-muted/20"
                      )}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground font-semibold">
                            #{idx + 1}
                          </span>
                          <span className="font-semibold text-sm text-foreground">
                            {m.paciente_nome}
                          </span>
                          {!m.ativo && (
                            <Badge variant="secondary" className="text-[10px] py-0">
                              Desativado
                            </Badge>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <div>
                            <strong className="text-foreground">Responsável:</strong> {m.responsavel_nome}
                            {m.responsavel_cpf && (
                              <span className="font-mono ml-1.5">
                                (CPF: {formatCPF(m.responsavel_cpf)})
                              </span>
                            )}
                          </div>
                          {m.especialidades && (
                            <div className="text-[11px] text-muted-foreground">
                              Especialidades: {m.especialidades}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 self-end sm:self-center">
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`switch-${m.paciente_id}`}
                            checked={m.ativo}
                            onCheckedChange={() => handleToggleMemberActive(m.paciente_id)}
                          />
                          <Label
                            htmlFor={`switch-${m.paciente_id}`}
                            className="text-xs cursor-pointer text-muted-foreground whitespace-nowrap"
                          >
                            {m.ativo ? "Ativo" : "Inativo"}
                          </Label>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                          title="Remover do grupo recorrente"
                          onClick={() => handleRemoveMember(m.paciente_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 border-t bg-card flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentTab("gerar")}
                className="gap-1.5"
              >
                Voltar para Geração do Lote
              </Button>

              <Button
                type="button"
                onClick={() => handleSaveMembrosConfig(membros)}
                disabled={isSavingMembros}
                className="gap-1.5"
              >
                {isSavingMembros ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
