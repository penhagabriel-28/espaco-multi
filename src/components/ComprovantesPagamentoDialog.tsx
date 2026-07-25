import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase as supabaseClient } from "@/integrations/supabase/client";
const supabase = supabaseClient as any;
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Upload,
  FileText,
  Trash2,
  Eye,
  Download,
  Calendar,
  Search,
  CheckCircle2,
  ArrowUpDown,
  Filter,
  FileCheck,
  X,
  ExternalLink,
  Plus,
  Clock,
  AlertTriangle,
} from "lucide-react";

export interface ComprovanteItem {
  id: string;
  fatura_id?: string | null;
  fatura_ids?: string[] | string | null;
  paciente_id?: string | null;
  nome_arquivo: string;
  tipo_arquivo: string;
  url_arquivo: string;
  data_pagamento: string;
  valor: number;
  metodo: string;
  observacoes?: string | null;
  created_at?: string;
}

interface ComprovantesPagamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacientes: any[];
  faturas?: any[];
  initialPacienteId?: string | null;
}

export function ComprovantesPagamentoDialog({
  open,
  onOpenChange,
  pacientes = [],
  faturas = [],
  initialPacienteId = null,
}: ComprovantesPagamentoDialogProps) {
  const queryClient = useQueryClient();

  // State
  const [selectedPacienteId, setSelectedPacienteId] = useState<string>(
    initialPacienteId || "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortAscending, setSortAscending] = useState(true); // Default to Ascending Chronological Order

  // Upload Form State
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [formPacienteId, setFormPacienteId] = useState<string>(
    initialPacienteId || "none"
  );
  const [formSelectedFaturaIds, setFormSelectedFaturaIds] = useState<string[]>([]);
  const [formDataPagamento, setFormDataPagamento] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [formValor, setFormValor] = useState<string>("");
  const [formMetodo, setFormMetodo] = useState<string>("pix");
  const [formObservacoes, setFormObservacoes] = useState<string>("");

  // Preview Image Modal State
  const [viewImageModal, setViewImageModal] = useState<{
    open: boolean;
    url: string;
    title: string;
  }>({ open: false, url: "", title: "" });

  // Sync initialPacienteId when changed externally
  React.useEffect(() => {
    if (initialPacienteId) {
      setSelectedPacienteId(initialPacienteId);
      setFormPacienteId(initialPacienteId);
    }
  }, [initialPacienteId]);

  // Map of patients for fast lookup
  const patientMap = useMemo(() => {
    return new Map<string, string>(pacientes.map((p) => [p.id, p.nome]));
  }, [pacientes]);

  // Fetch comprovantes from database with local storage fallback
  const { data: rawComprovantes = [], isLoading } = useQuery<ComprovanteItem[]>({
    queryKey: ["dir-comprovantes"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("comprovantes_pagamento")
          .select("*")
          .order("data_pagamento", { ascending: true }) // CRITICAL: Cronological ascending!
          .order("created_at", { ascending: true });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn("Retrying/Fallback from localStorage for comprovantes:", err);
        const stored = localStorage.getItem("local_comprovantes_pagamento");
        return stored ? JSON.parse(stored) : [];
      }
    },
    enabled: open,
  });

  // Filtered and sorted patient's faturas for form dropdown (Most recent consultation first)
  const rawPatientFaturas = useMemo(() => {
    if (!formPacienteId || formPacienteId === "none") return [];
    return (faturas || []).filter((f) => f.paciente_id === formPacienteId);
  }, [faturas, formPacienteId]);

  // Fetch fatura_itens for patient's faturas to get exact consultation dates
  const faturaIds = useMemo(() => {
    return (rawPatientFaturas || []).map((f) => f.id);
  }, [rawPatientFaturas]);

  const { data: formFaturaItens = [] } = useQuery<any[]>({
    queryKey: ["dir-comprovante-fatura-itens", faturaIds],
    queryFn: async () => {
      if (faturaIds.length === 0) return [];
      const { data, error } = await supabase
        .from("fatura_itens")
        .select("id, fatura_id, agendamento_id, descricao")
        .in("fatura_id", faturaIds);
      if (error) return [];
      return data || [];
    },
    enabled: open && faturaIds.length > 0,
  });

  const agendamentoIds = useMemo(() => {
    return (formFaturaItens || [])
      .map((item) => item.agendamento_id)
      .filter(Boolean) as string[];
  }, [formFaturaItens]);

  const { data: formAgendamentos = [] } = useQuery<any[]>({
    queryKey: ["dir-comprovante-agendamentos", agendamentoIds],
    queryFn: async () => {
      if (agendamentoIds.length === 0) return [];
      const { data, error } = await supabase
        .from("agendamentos")
        .select("id, data_inicio")
        .in("id", agendamentoIds);
      if (error) return [];
      return data || [];
    },
    enabled: open && agendamentoIds.length > 0,
  });

  const agendamentoDateMap = useMemo(() => {
    const map = new Map<string, string>();
    (formAgendamentos || []).forEach((ag) => {
      if (ag.id && ag.data_inicio) {
        map.set(ag.id, ag.data_inicio);
      }
    });
    return map;
  }, [formAgendamentos]);

  // Helper to format exact consultation date(s) for a fatura instead of due date
  const getFaturaConsultationDateLabel = (fatura: any): string => {
    if (!fatura) return "—";

    const datesSet = new Set<string>();

    // 1. Check faturaItens linked to this fatura
    const items = (formFaturaItens || []).filter(
      (item: any) => item.fatura_id === fatura.id
    );

    items.forEach((item: any) => {
      // Check linked agendamento data_inicio
      if (item.agendamento_id && agendamentoDateMap.has(item.agendamento_id)) {
        const rawDate = agendamentoDateMap.get(item.agendamento_id);
        if (rawDate) {
          try {
            const dStr = rawDate.substring(0, 10);
            const [y, m, d] = dStr.split("-");
            if (y && m && d) {
              datesSet.add(`${d}/${m}/${y}`);
            }
          } catch {
            // ignore
          }
        }
      }

      // Check item description for date pattern DD/MM/YYYY
      if (item.descricao) {
        const match = item.descricao.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (match) {
          datesSet.add(match[0]);
        }
      }
    });

    // 2. Check fatura observacoes if no item dates found
    if (datesSet.size === 0 && fatura.observacoes) {
      const match = fatura.observacoes.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (match) {
        datesSet.add(match[0]);
      }
    }

    // 3. Fallback: parse competencia / vencimento / created_at if no item date found
    if (datesSet.size === 0) {
      const rawDate = fatura.competencia || fatura.vencimento || fatura.created_at;
      if (rawDate) {
        try {
          const dStr = typeof rawDate === "string" ? rawDate.substring(0, 10) : "";
          if (dStr.includes("-")) {
            const [y, m, d] = dStr.split("-");
            if (y && m && d) {
              return `${d}/${m}/${y}`;
            }
          }
        } catch {
          // ignore
        }
      }
      return "Data N/I";
    }

    return Array.from(datesSet).join(", ");
  };

  // Sort patientFaturas in descending order of consultation date (most recent first)
  const patientFaturas = useMemo(() => {
    if (rawPatientFaturas.length === 0) return [];
    const list = [...rawPatientFaturas];

    const getFaturaTimestamp = (f: any): number => {
      const items = (formFaturaItens || []).filter(
        (item: any) => item.fatura_id === f.id
      );

      for (const item of items) {
        if (item.agendamento_id && agendamentoDateMap.has(item.agendamento_id)) {
          const rawDate = agendamentoDateMap.get(item.agendamento_id);
          if (rawDate) {
            const t = new Date(rawDate).getTime();
            if (!isNaN(t) && t > 0) return t;
          }
        }
        if (item.descricao) {
          const match = item.descricao.match(/(\d{2})\/(\d{2})\/(\d{4})/);
          if (match) {
            const [_, d, m, y] = match;
            const t = new Date(Number(y), Number(m) - 1, Number(d)).getTime();
            if (!isNaN(t) && t > 0) return t;
          }
        }
      }

      if (f.observacoes) {
        const match = f.observacoes.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (match) {
          const [_, d, m, y] = match;
          const t = new Date(Number(y), Number(m) - 1, Number(d)).getTime();
          if (!isNaN(t) && t > 0) return t;
        }
      }

      const rawDate = f.competencia || f.vencimento || f.created_at;
      if (rawDate) {
        const t = new Date(rawDate).getTime();
        if (!isNaN(t) && t > 0) return t;
      }

      return 0;
    };

    return list.sort((a, b) => getFaturaTimestamp(b) - getFaturaTimestamp(a));
  }, [rawPatientFaturas, formFaturaItens, agendamentoDateMap]);

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error("O arquivo excede o limite de 15MB.");
      return;
    }

    setUploadFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload mutation
  const uploadComprovanteMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile || !filePreview) {
        throw new Error("Selecione um arquivo de comprovante.");
      }
      if (!formPacienteId || formPacienteId === "none") {
        throw new Error("Selecione o paciente relacionado.");
      }
      if (patientFaturas.length > 0 && formSelectedFaturaIds.length === 0) {
        throw new Error("Selecione ao menos uma consulta para vincular o comprovante.");
      }
      if (!formDataPagamento) {
        throw new Error("Informe a data de pagamento.");
      }

      const fileExt = uploadFile.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `comprovantes/${fileName}`;

      let fileUrl = filePreview; // Default to base64 Data URL fallback

      // Try uploading to Supabase Storage if bucket exists
      try {
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("comprovantes")
          .upload(filePath, uploadFile);

        if (!uploadErr && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from("comprovantes")
            .getPublicUrl(filePath);
          if (publicUrlData?.publicUrl) {
            fileUrl = publicUrlData.publicUrl;
          }
        }
      } catch (storageErr) {
        console.warn("Storage bucket fallback to Data URL:", storageErr);
      }

      const selectedFaturasSum = (patientFaturas || [])
        .filter((f) => formSelectedFaturaIds.includes(f.id))
        .reduce((sum, f) => sum + (Number(f.valor) || 0), 0);

      const newRecord: Partial<ComprovanteItem> = {
        id: crypto.randomUUID(),
        paciente_id: (formPacienteId && formPacienteId !== "none") ? formPacienteId : null,
        fatura_id: formSelectedFaturaIds[0] || null,
        fatura_ids: formSelectedFaturaIds.length > 0 ? JSON.stringify(formSelectedFaturaIds) : null,
        nome_arquivo: uploadFile.name,
        tipo_arquivo: uploadFile.type || "application/octet-stream",
        url_arquivo: fileUrl,
        data_pagamento: formDataPagamento,
        valor: formValor ? parseFloat(formValor.replace(",", ".")) : selectedFaturasSum,
        metodo: formMetodo,
        observacoes: formObservacoes.trim() || null,
        created_at: new Date().toISOString(),
      };

      // Try inserting into DB
      try {
        const { data, error } = await supabase
          .from("comprovantes_pagamento")
          .insert(newRecord)
          .select();
        if (error) throw error;
        return data?.[0] || newRecord;
      } catch (dbErr) {
        console.warn("DB insert failed, saving to local storage fallback:", dbErr);
        const stored = localStorage.getItem("local_comprovantes_pagamento");
        const list = stored ? JSON.parse(stored) : [];
        list.push(newRecord);
        localStorage.setItem("local_comprovantes_pagamento", JSON.stringify(list));
        return newRecord;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dir-comprovantes"] });
      toast.success("Comprovante cadastrado com sucesso!");
      resetForm();
      setShowUploadForm(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao salvar comprovante.");
    },
  });

  // Delete mutation
  const deleteComprovanteMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from("comprovantes_pagamento")
          .delete()
          .eq("id", id);
        if (error) throw error;
      } catch (dbErr) {
        console.warn("DB delete failed, deleting from local storage fallback:", dbErr);
        const stored = localStorage.getItem("local_comprovantes_pagamento");
        if (stored) {
          const list = JSON.parse(stored).filter((item: any) => item.id !== id);
          localStorage.setItem("local_comprovantes_pagamento", JSON.stringify(list));
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dir-comprovantes"] });
      toast.success("Comprovante excluído!");
    },
    onError: (err: any) => {
      toast.error("Erro ao excluir comprovante: " + err.message);
    },
  });

  const resetForm = () => {
    setUploadFile(null);
    setFilePreview(null);
    setFormPacienteId(initialPacienteId || "none");
    setFormSelectedFaturaIds([]);
    setFormValor("");
    setFormObservacoes("");
    setFormDataPagamento(format(new Date(), "yyyy-MM-dd"));
    setFormMetodo("pix");
  };

  // Filter and Sort Comprovantes
  // CRITICAL REQUIREMENT: Default to Ascending Chronological Order by Data de Pagamento!
  const sortedAndFilteredComprovantes = useMemo(() => {
    let result = [...rawComprovantes];

    // Filter by Patient
    if (selectedPacienteId && selectedPacienteId !== "all") {
      result = result.filter((item) => item.paciente_id === selectedPacienteId);
    }

    // Filter by Date Range
    if (startDate) {
      result = result.filter((item) => item.data_pagamento >= startDate);
    }
    if (endDate) {
      result = result.filter((item) => item.data_pagamento <= endDate);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) => {
        const pName = item.paciente_id ? (patientMap.get(item.paciente_id) || "").toLowerCase() : "";
        const fileName = (item.nome_arquivo || "").toLowerCase();
        const obs = (item.observacoes || "").toLowerCase();
        return pName.includes(q) || fileName.includes(q) || obs.includes(q);
      });
    }

    // CRITICAL SORTING: Chronological Order of data_pagamento
    result.sort((a, b) => {
      const dateA = new Date(a.data_pagamento).getTime();
      const dateB = new Date(b.data_pagamento).getTime();
      if (dateA !== dateB) {
        return sortAscending ? dateA - dateB : dateB - dateA;
      }
      // Secondary sort by creation timestamp
      const createdA = new Date(a.created_at || 0).getTime();
      const createdB = new Date(b.created_at || 0).getTime();
      return sortAscending ? createdA - createdB : createdB - createdA;
    });

    return result;
  }, [
    rawComprovantes,
    selectedPacienteId,
    startDate,
    endDate,
    searchQuery,
    sortAscending,
    patientMap,
  ]);

  const totalValor = useMemo(() => {
    return sortedAndFilteredComprovantes.reduce(
      (sum, item) => sum + (Number(item.valor) || 0),
      0
    );
  }, [sortedAndFilteredComprovantes]);

  const brl = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      const [y, m, d] = dateStr.substring(0, 10).split("-");
      return `${d}/${m}/${y}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-6">
          <DialogHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-primary">
                <FileCheck className="h-5 w-5" /> Central de Comprovantes de Pagamento
              </DialogTitle>
              <DialogDescription className="text-xs">
                Upload e visualização dos comprovantes anexados às cobranças, ordenados em ordem cronológica crescente.
              </DialogDescription>
            </div>
            <Button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="gap-1.5 text-xs font-semibold shrink-0"
              variant={showUploadForm ? "secondary" : "default"}
            >
              {showUploadForm ? (
                <>
                  <X className="h-4 w-4" /> Cancelar Upload
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Novo Comprovante
                </>
              )}
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pt-4 pr-1">
            {/* Upload Form Accordion/Panel */}
            {showUploadForm && (
              <Card className="border-primary/30 bg-primary/5 shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Upload className="h-4 w-4 text-primary" /> Upload de Novo Comprovante
                    </h3>
                    <Badge variant="outline" className="text-[10px] bg-background">
                      PDF, PNG, JPG ou WEBP (Máx 15MB)
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left: Drag and drop dropzone */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Arquivo do Comprovante *</Label>
                      <div className="relative border-2 border-dashed border-primary/30 rounded-xl p-4 text-center bg-background hover:bg-muted/40 transition duration-200 cursor-pointer flex flex-col items-center justify-center min-h-[160px]">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        {uploadFile ? (
                          <div className="space-y-2 flex flex-col items-center">
                            {uploadFile.type.startsWith("image/") && filePreview ? (
                              <img
                                src={filePreview}
                                alt="Preview"
                                className="h-20 max-w-full object-contain rounded border shadow-sm"
                              />
                            ) : (
                              <FileText className="h-12 w-12 text-primary" />
                            )}
                            <div className="text-xs font-medium text-foreground truncate max-w-[220px]">
                              {uploadFile.name}
                            </div>
                            <Badge variant="secondary" className="text-[10px]">
                              {(uploadFile.size / 1024).toFixed(0)} KB
                            </Badge>
                          </div>
                        ) : (
                          <div className="space-y-1.5 flex flex-col items-center text-muted-foreground">
                            <Upload className="h-8 w-8 text-primary/60" />
                            <span className="text-xs font-semibold text-foreground">
                              Clique para escolher ou arraste o arquivo aqui
                            </span>
                            <span className="text-[10px]">Imagens (PNG, JPG) ou Arquivo PDF</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Metadata inputs */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Data de Pagamento *</Label>
                          <Input
                            type="date"
                            required
                            value={formDataPagamento}
                            onChange={(e) => setFormDataPagamento(e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Valor (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formValor}
                            onChange={(e) => setFormValor(e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Paciente Relacionado *</Label>
                        <Select
                          value={formPacienteId}
                          onValueChange={(val) => {
                            setFormPacienteId(val);
                            setFormSelectedFaturaIds([]);
                          }}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Selecione o paciente..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Selecione um paciente...</SelectItem>
                            {pacientes.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {formPacienteId && formPacienteId !== "none" && (
                        <div className="space-y-2 border rounded-xl p-3 bg-background border-border/80 shadow-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                            <div>
                              <Label className="text-xs font-bold text-foreground block">
                                Vincular às Consultas (Obrigatório) *
                              </Label>
                              <span className="text-[10px] text-muted-foreground">
                                Escolha uma ou mais consultas correspondentes ao comprovante.
                              </span>
                            </div>
                            {patientFaturas.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-[10px] px-2 border-primary/20 text-primary hover:bg-primary/10"
                                  onClick={() => {
                                    const allIds = patientFaturas.map((f) => f.id);
                                    setFormSelectedFaturaIds(allIds);
                                    const totalSum = patientFaturas.reduce((sum, f) => sum + (Number(f.valor) || 0), 0);
                                    setFormValor(totalSum > 0 ? totalSum.toFixed(2) : "");
                                  }}
                                >
                                  Selecionar Todas
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground"
                                  onClick={() => {
                                    setFormSelectedFaturaIds([]);
                                    setFormValor("");
                                  }}
                                >
                                  Limpar
                                </Button>
                              </div>
                            )}
                          </div>

                          {patientFaturas.length === 0 ? (
                            <div className="p-3 text-center text-xs text-muted-foreground italic">
                              Nenhuma consulta/fatura aberta encontrada para este paciente.
                            </div>
                          ) : (
                            <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin">
                              {patientFaturas.map((f) => {
                                const isSelected = formSelectedFaturaIds.includes(f.id);
                                const consultDateLabel = getFaturaConsultationDateLabel(f);

                                const toggleSelect = () => {
                                  let nextIds: string[];
                                  if (isSelected) {
                                    nextIds = formSelectedFaturaIds.filter((id) => id !== f.id);
                                  } else {
                                    nextIds = [...formSelectedFaturaIds, f.id];
                                  }
                                  setFormSelectedFaturaIds(nextIds);

                                  const nextSum = patientFaturas
                                    .filter((pf) => nextIds.includes(pf.id))
                                    .reduce((sum, pf) => sum + (Number(pf.valor) || 0), 0);
                                  if (nextSum > 0) {
                                    setFormValor(nextSum.toFixed(2));
                                  }
                                };

                                return (
                                  <div
                                    key={f.id}
                                    onClick={toggleSelect}
                                    className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition duration-150 ${
                                      isSelected
                                        ? "bg-primary/10 border-primary/40 font-semibold text-primary"
                                        : "bg-muted/30 border-border/60 hover:bg-muted/60 text-foreground"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={toggleSelect}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <span className="truncate">
                                        Consulta em <strong>{consultDateLabel}</strong>
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className={isSelected ? "font-bold text-primary" : "text-muted-foreground"}>
                                        {brl(Number(f.valor))}
                                      </span>
                                      {f.status === "paga" ? (
                                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold text-[9px] gap-1 px-1.5 py-0 uppercase">
                                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> PAGA
                                        </Badge>
                                      ) : f.status === "vencida" ? (
                                        <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold text-[9px] gap-1 px-1.5 py-0 uppercase">
                                          <AlertTriangle className="h-3 w-3 text-rose-600" /> VENCIDA
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-bold text-[9px] gap-1 px-1.5 py-0 uppercase">
                                          <Clock className="h-3 w-3 text-amber-600" /> EM ABERTO
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {formSelectedFaturaIds.length > 0 && (
                            <div className="flex items-center justify-between text-[11px] font-semibold text-primary pt-1 border-t border-border/40">
                              <span>{formSelectedFaturaIds.length} consulta(s) selecionada(s)</span>
                              <span>
                                Total Calculado:{" "}
                                {brl(
                                  patientFaturas
                                    .filter((f) => formSelectedFaturaIds.includes(f.id))
                                    .reduce((sum, f) => sum + (Number(f.valor) || 0), 0)
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-1">
                        <Label className="text-xs">Forma de Pagamento</Label>
                        <Select value={formMetodo} onValueChange={setFormMetodo}>
                          <SelectTrigger className="h-9 text-xs">
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

                      <div className="space-y-1">
                        <Label className="text-xs">Observações / Detalhes</Label>
                        <Textarea
                          placeholder="Notas adicionais, nº da transação, etc..."
                          rows={2}
                          value={formObservacoes}
                          onChange={(e) => setFormObservacoes(e.target.value)}
                          className="text-xs resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        resetForm();
                        setShowUploadForm(false);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => uploadComprovanteMutation.mutate()}
                      disabled={uploadComprovanteMutation.isPending || !uploadFile || !formDataPagamento}
                      className="gap-1.5 font-semibold"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {uploadComprovanteMutation.isPending ? "Enviando..." : "Salvar Comprovante"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filter and Order Controls */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md space-y-3 p-3.5 rounded-xl border border-border/60 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Order Indicator Banner */}
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Ordenação:{" "}
                    {sortAscending
                      ? "Ordem Cronológica Crescente (Mais Antigos → Mais Recentes)"
                      : "Ordem Decrescente (Mais Recentes → Mais Antigos)"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] px-2 gap-1 border border-primary/20 hover:bg-primary/10"
                    onClick={() => setSortAscending(!sortAscending)}
                    title="Alternar ordem de exibição"
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    {sortAscending ? "Mudar p/ Decrescente" : "Mudar p/ Crescente"}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-background text-xs px-2.5 py-1 font-semibold">
                    {sortedAndFilteredComprovantes.length}{" "}
                    {sortedAndFilteredComprovantes.length === 1
                      ? "comprovante"
                      : "comprovantes"}
                  </Badge>
                  <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1 font-bold">
                    Total: {brl(totalValor)}
                  </Badge>
                </div>
              </div>

              {/* Filter inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar arquivo, obs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs bg-background"
                  />
                </div>

                <div>
                  <Select
                    value={selectedPacienteId}
                    onValueChange={(val) => setSelectedPacienteId(val)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="Filtrar por paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Pacientes</SelectItem>
                      {pacientes.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Data Início"
                    className="h-8 text-xs bg-background"
                    title="Data início do pagamento"
                  />
                </div>

                <div>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="Data Fim"
                    className="h-8 text-xs bg-background"
                    title="Data fim do pagamento"
                  />
                </div>
              </div>
            </div>

            {/* List / Gallery View */}
            {isLoading ? (
              <div className="p-12 text-center text-sm text-muted-foreground">
                Carregando comprovantes de pagamento...
              </div>
            ) : sortedAndFilteredComprovantes.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground border border-dashed rounded-xl space-y-2">
                <FileCheck className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                <p className="font-semibold text-foreground">Nenhum comprovante encontrado</p>
                <p className="text-xs">
                  {rawComprovantes.length === 0
                    ? "Faça o upload do primeiro comprovante clicando no botão 'Novo Comprovante' acima."
                    : "Nenhum comprovante corresponde aos filtros aplicados."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {sortedAndFilteredComprovantes.map((item) => {
                  const isImage = item.tipo_arquivo?.startsWith("image/") || 
                    item.url_arquivo?.startsWith("data:image/") ||
                    /\.(jpg|jpeg|png|webp|gif)$/i.test(item.nome_arquivo);

                  const patientName = item.paciente_id
                    ? patientMap.get(item.paciente_id) || "Paciente Desconhecido"
                    : "Sem Paciente Atribuído";

                  return (
                    <Card
                      key={item.id}
                      className="border-border shadow-sm hover:shadow-md transition duration-200 overflow-hidden flex flex-col justify-between"
                    >
                      <CardContent className="p-3.5 space-y-3">
                        {/* Header: Date + Patient */}
                        <div className="flex items-start justify-between gap-2 border-b pb-2">
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/5 text-primary border-primary/20 font-bold shrink-0">
                                📅 {formatDateDisplay(item.data_pagamento)}
                              </Badge>
                              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px] px-1.5 py-0 font-bold shrink-0">
                                {brl(Number(item.valor || 0))}
                              </Badge>
                            </div>
                            <div className="font-bold text-sm text-foreground truncate mt-1" title={patientName}>
                              {patientName}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                            title="Excluir comprovante"
                            onClick={() => {
                              if (confirm(`Excluir o comprovante '${item.nome_arquivo}'?`)) {
                                deleteComprovanteMutation.mutate(item.id);
                              }
                            }}
                            disabled={deleteComprovanteMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* File preview thumbnail & details */}
                        <div className="flex items-center gap-3">
                          {isImage ? (
                            <div
                              className="h-16 w-16 rounded-lg border bg-muted overflow-hidden shrink-0 cursor-pointer hover:opacity-90 transition relative group"
                              onClick={() =>
                                setViewImageModal({
                                  open: true,
                                  url: item.url_arquivo,
                                  title: item.nome_arquivo,
                                })
                              }
                            >
                              <img
                                src={item.url_arquivo}
                                alt={item.nome_arquivo}
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                <Eye className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="h-16 w-16 rounded-lg border bg-primary/10 flex flex-col items-center justify-center shrink-0 text-primary">
                              <FileText className="h-7 w-7" />
                              <span className="text-[9px] font-bold uppercase mt-0.5">PDF</span>
                            </div>
                          )}

                          <div className="space-y-1 min-w-0 flex-1 text-xs">
                            <div className="font-semibold text-foreground truncate" title={item.nome_arquivo}>
                              {item.nome_arquivo}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                              <span>Forma: <strong className="text-foreground uppercase">{item.metodo || "pix"}</strong></span>
                            </div>
                            {item.observacoes && (
                              <p className="text-[11px] text-muted-foreground italic line-clamp-2" title={item.observacoes}>
                                "{item.observacoes}"
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Linked Sessions Status Badges */}
                        <div className="pt-2 border-t border-border/40 space-y-1">
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Sessões Vinculadas:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {(() => {
                              let fatIds: string[] = [];
                              if (item.fatura_ids) {
                                try {
                                  if (Array.isArray(item.fatura_ids)) fatIds = item.fatura_ids;
                                  else if (typeof item.fatura_ids === "string") fatIds = JSON.parse(item.fatura_ids);
                                } catch {
                                  fatIds = [item.fatura_id].filter(Boolean) as string[];
                                }
                              } else if (item.fatura_id) {
                                fatIds = [item.fatura_id];
                              }

                              if (fatIds.length === 0) {
                                return <Badge variant="outline" className="text-[10px] text-muted-foreground">Fatura Geral / Sem vínculo</Badge>;
                              }

                              return fatIds.map((fId) => {
                                const fat = (faturas || []).find((f) => f.id === fId);
                                const dateLabel = fat ? getFaturaConsultationDateLabel(fat) : "Sessão";
                                const status = fat?.status || "paga";

                                if (status === "paga") {
                                  return (
                                    <Badge key={fId} className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] px-2 py-0.5 font-bold gap-1">
                                      <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Consulta {dateLabel} (PAGA)
                                    </Badge>
                                  );
                                }
                                if (status === "vencida") {
                                  return (
                                    <Badge key={fId} className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 text-[10px] px-2 py-0.5 font-bold gap-1">
                                      <AlertTriangle className="h-3 w-3 text-rose-600" /> Consulta {dateLabel} (VENCIDA)
                                    </Badge>
                                  );
                                }
                                return (
                                  <Badge key={fId} className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] px-2 py-0.5 font-bold gap-1">
                                    <Clock className="h-3 w-3 text-amber-600" /> Consulta {dateLabel} (EM ABERTO)
                                  </Badge>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      </CardContent>

                      {/* Footer Actions */}
                      <div className="bg-muted/30 px-3.5 py-2 border-t border-border/50 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-muted-foreground">
                          {item.created_at ? format(new Date(item.created_at), "dd/MM/yyyy HH:mm") : ""}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {isImage ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[11px] px-2 gap-1"
                              onClick={() =>
                                setViewImageModal({
                                  open: true,
                                  url: item.url_arquivo,
                                  title: item.nome_arquivo,
                                })
                              }
                            >
                              <Eye className="h-3 w-3" /> Visualizar
                            </Button>
                          ) : (
                            <a
                              href={item.url_arquivo}
                              target="_blank"
                              rel="noreferrer"
                              download={item.nome_arquivo}
                            >
                              <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 gap-1">
                                <ExternalLink className="h-3 w-3" /> Abrir PDF
                              </Button>
                            </a>
                          )}

                          <a
                            href={item.url_arquivo}
                            download={item.nome_arquivo}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Zoom Modal */}
      <Dialog
        open={viewImageModal.open}
        onOpenChange={(open) => setViewImageModal({ ...viewImageModal, open })}
      >
        <DialogContent className="max-w-3xl p-4 flex flex-col items-center">
          <DialogHeader className="w-full flex flex-row items-center justify-between pb-2 border-b">
            <DialogTitle className="text-sm font-semibold truncate">
              {viewImageModal.title}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[75vh] w-full flex items-center justify-center overflow-auto py-2 bg-black/5 dark:bg-black/40 rounded-lg">
            <img
              src={viewImageModal.url}
              alt={viewImageModal.title}
              className="max-h-[70vh] max-w-full object-contain rounded"
            />
          </div>
          <div className="w-full flex justify-end gap-2 pt-2">
            <a
              href={viewImageModal.url}
              download={viewImageModal.title}
              target="_blank"
              rel="noreferrer"
            >
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" /> Baixar Imagem
              </Button>
            </a>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setViewImageModal({ ...viewImageModal, open: false })}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
