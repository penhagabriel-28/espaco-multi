import React, { useState, useEffect, useMemo, useRef } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageCircle,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ExternalLink,
  AtSign,
  User,
  Users,
  DollarSign,
  Calendar,
  QrCode,
  FileText,
  Building,
  CheckCheck,
} from "lucide-react";

export const STORAGE_KEY_COBRANCA_TEMPLATE = "espaco_multi_cobranca_whatsapp_template";

export const DEFAULT_COBRANCA_TEMPLATE = `Olá, @responsavel! Gostaríamos de lembrar do pagamento referente aos atendimentos de @mes de *@paciente* no valor total de *@valor*.@resumo

Nosso pix: @pix

Agradecemos a atenção! *@clinica*`;

export function getSavedCobrancaTemplate(): string {
  if (typeof window === "undefined") return DEFAULT_COBRANCA_TEMPLATE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_COBRANCA_TEMPLATE);
    if (saved && saved.trim()) return saved;
  } catch (e) {
    console.error("Erro ao ler template do localStorage", e);
  }
  return DEFAULT_COBRANCA_TEMPLATE;
}

export function saveCobrancaTemplate(template: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_COBRANCA_TEMPLATE, template);
  } catch (e) {
    console.error("Erro ao salvar template no localStorage", e);
  }
}

export interface WhatsAppCobrancaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
  totalPendente: number;
  responsaveis: any[];
  mesRef: string;
  summaryText: string;
  defaultPix?: string;
  clinicaNome?: string;
}

interface MentionVariable {
  key: string;
  label: string;
  category: string;
  icon: React.ReactNode;
  getDescription: () => string;
}

export function WhatsAppCobrancaDialog({
  open,
  onOpenChange,
  patientId,
  patientName,
  totalPendente,
  responsaveis,
  mesRef,
  summaryText,
  defaultPix = "54.747.611/0001-27",
  clinicaNome = "Espaço Multi",
}: WhatsAppCobrancaDialogProps) {
  const brl = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Filter responsaveis with phone/whatsapp
  const validResps = useMemo(() => {
    return (responsaveis || []).filter((r) => r.whatsapp || r.telefone);
  }, [responsaveis]);

  const [selectedRespIndex, setSelectedRespIndex] = useState(0);

  // Active responsible
  const activeResp = useMemo(() => {
    if (validResps.length === 0) {
      return responsaveis?.[0] || null;
    }
    return validResps[selectedRespIndex] || validResps[0];
  }, [validResps, selectedRespIndex, responsaveis]);

  const allRespsNames = useMemo(() => {
    const names = (responsaveis || []).map((r) => r.nome).filter(Boolean);
    if (names.length === 0) return activeResp?.nome || "Responsável";
    if (names.length === 1) return names[0];
    return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
  }, [responsaveis, activeResp]);

  const saudacaoPeriodo = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Bom dia";
    if (hour >= 12 && hour < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  // Text message state
  const [templateText, setTemplateText] = useState("");
  const [copied, setCopied] = useState(false);
  const [learnAndSave, setLearnAndSave] = useState(true);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  // Mention State for @ or /
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionState, setMentionState] = useState<{
    open: boolean;
    trigger: "@" | "/";
    query: string;
    startIndex: number;
    endIndex: number;
    selectedIndex: number;
  }>({
    open: false,
    trigger: "@",
    query: "",
    startIndex: -1,
    endIndex: -1,
    selectedIndex: 0,
  });

  // Load template on open
  useEffect(() => {
    if (open) {
      const saved = getSavedCobrancaTemplate();
      setTemplateText(saved);
      setSelectedRespIndex(0);
      setCopied(false);
      setMentionState({
        open: false,
        trigger: "@",
        query: "",
        startIndex: -1,
        endIndex: -1,
        selectedIndex: 0,
      });
      setActiveTab("edit");
    }
  }, [open, patientId]);

  // Variables mapping data
  const templateData = useMemo(() => {
    return {
      paciente: patientName || "Paciente",
      responsavel: activeResp?.nome || "Responsável",
      responsaveis: allRespsNames,
      valor: brl(totalPendente),
      mes: mesRef || "período",
      pix: defaultPix,
      resumo: summaryText || "",
      clinica: clinicaNome,
      saudacao: saudacaoPeriodo,
    };
  }, [patientName, activeResp, allRespsNames, totalPendente, mesRef, defaultPix, summaryText, clinicaNome, saudacaoPeriodo]);

  // Resolve template with actual data
  const resolvedMessage = useMemo(() => {
    let result = templateText;
    const replacements: Record<string, string> = {
      paciente: templateData.paciente,
      nome_paciente: templateData.paciente,
      responsavel: templateData.responsavel,
      nome_responsavel: templateData.responsavel,
      responsaveis: templateData.responsaveis,
      nomes_responsaveis: templateData.responsaveis,
      valor: templateData.valor,
      total: templateData.valor,
      valor_pendente: templateData.valor,
      mes: templateData.mes,
      mes_referencia: templateData.mes,
      pix: templateData.pix,
      chave_pix: templateData.pix,
      resumo: templateData.resumo,
      resumo_atendimentos: templateData.resumo,
      clinica: templateData.clinica,
      nome_clinica: templateData.clinica,
      saudacao: templateData.saudacao,
    };

    // Specific individual responsibles if multiple exist
    (responsaveis || []).forEach((r, idx) => {
      if (r?.nome) {
        replacements[`responsavel_${idx + 1}`] = r.nome;
      }
    });

    for (const [key, val] of Object.entries(replacements)) {
      const regex = new RegExp(`([@\\/]|\\{\\{?)${key}(\\}?\\}?)`, "gi");
      result = result.replace(regex, val);
    }

    return result;
  }, [templateText, templateData, responsaveis]);

  // Dynamic variable list for autocomplete and chips
  const mentionVariables: MentionVariable[] = useMemo(() => {
    const list: MentionVariable[] = [
      {
        key: "paciente",
        label: "Nome do Paciente",
        category: "Paciente",
        icon: <User className="h-3.5 w-3.5 text-sky-500" />,
        getDescription: () => templateData.paciente,
      },
      {
        key: "responsavel",
        label: "Nome do Responsável",
        category: "Responsável",
        icon: <Users className="h-3.5 w-3.5 text-emerald-500" />,
        getDescription: () => templateData.responsavel,
      },
      {
        key: "responsaveis",
        label: "Todos os Responsáveis",
        category: "Responsável",
        icon: <Users className="h-3.5 w-3.5 text-indigo-500" />,
        getDescription: () => templateData.responsaveis,
      },
      {
        key: "valor",
        label: "Valor Total Pendente",
        category: "Cobrança",
        icon: <DollarSign className="h-3.5 w-3.5 text-rose-500" />,
        getDescription: () => templateData.valor,
      },
      {
        key: "mes",
        label: "Mês de Referência",
        category: "Cobrança",
        icon: <Calendar className="h-3.5 w-3.5 text-amber-500" />,
        getDescription: () => templateData.mes,
      },
      {
        key: "pix",
        label: "Chave Pix",
        category: "Cobrança",
        icon: <QrCode className="h-3.5 w-3.5 text-teal-500" />,
        getDescription: () => templateData.pix,
      },
      {
        key: "resumo",
        label: "Resumo dos Atendimentos",
        category: "Atendimentos",
        icon: <FileText className="h-3.5 w-3.5 text-blue-500" />,
        getDescription: () => "Detalhamento das sessões e pacotes do mês",
      },
      {
        key: "clinica",
        label: "Nome da Clínica",
        category: "Geral",
        icon: <Building className="h-3.5 w-3.5 text-purple-500" />,
        getDescription: () => templateData.clinica,
      },
    ];

    // If patient has specific multiple responsibles, list them individually
    if ((responsaveis || []).length > 1) {
      responsaveis.forEach((r, idx) => {
        if (r?.nome) {
          list.push({
            key: `responsavel_${idx + 1}`,
            label: `${r.nome} (${r.parentesco || "Resp. " + (idx + 1)})`,
            category: "Responsável Específico",
            icon: <Users className="h-3.5 w-3.5 text-teal-500" />,
            getDescription: () => r.nome,
          });
        }
      });
    }

    return list;
  }, [templateData, responsaveis]);

  // Filter mention variables by query
  const filteredMentionVariables = useMemo(() => {
    if (!mentionState.open) return [];
    const q = mentionState.query.toLowerCase().trim();
    if (!q) return mentionVariables;
    return mentionVariables.filter(
      (v) =>
        v.key.toLowerCase().includes(q) ||
        v.label.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        v.getDescription().toLowerCase().includes(q)
    );
  }, [mentionState.open, mentionState.query, mentionVariables]);

  // Textarea input handler with mention trigger detection
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    setTemplateText(val);

    const textBeforeCursor = val.slice(0, cursorPos);
    // Matches @ or / followed by word characters right up to cursor
    const match = textBeforeCursor.match(/(?:^|\s)([@\/])([a-zA-Z0-9_]*)$/);

    if (match) {
      const trigger = match[1] as "@" | "/";
      const query = match[2];
      const triggerIndex = textBeforeCursor.lastIndexOf(trigger);

      setMentionState({
        open: true,
        trigger,
        query,
        startIndex: triggerIndex,
        endIndex: cursorPos,
        selectedIndex: 0,
      });
    } else {
      if (mentionState.open) {
        setMentionState((prev) => ({ ...prev, open: false }));
      }
    }
  };

  // Insert variable into textarea
  const insertVariable = (variableKey: string) => {
    const textarea = textareaRef.current;
    const trigger = mentionState.open ? mentionState.trigger : "@";
    const replacement = `${trigger}${variableKey} `;

    let newText = "";
    let newCursorPos = 0;

    if (mentionState.open && mentionState.startIndex >= 0) {
      const before = templateText.slice(0, mentionState.startIndex);
      const after = templateText.slice(mentionState.endIndex);
      newText = before + replacement + after;
      newCursorPos = before.length + replacement.length;
    } else if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = templateText.slice(0, start);
      const after = templateText.slice(end);
      newText = before + replacement + after;
      newCursorPos = before.length + replacement.length;
    } else {
      newText = templateText + ` ${replacement}`;
      newCursorPos = newText.length;
    }

    setTemplateText(newText);
    setMentionState({
      open: false,
      trigger: "@",
      query: "",
      startIndex: -1,
      endIndex: -1,
      selectedIndex: 0,
    });

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  // Keyboard navigation for mentions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!mentionState.open || filteredMentionVariables.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMentionState((prev) => ({
        ...prev,
        selectedIndex: (prev.selectedIndex + 1) % filteredMentionVariables.length,
      }));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setMentionState((prev) => ({
        ...prev,
        selectedIndex:
          (prev.selectedIndex - 1 + filteredMentionVariables.length) %
          filteredMentionVariables.length,
      }));
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const selected = filteredMentionVariables[mentionState.selectedIndex];
      if (selected) {
        insertVariable(selected.key);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setMentionState((prev) => ({ ...prev, open: false }));
    }
  };

  // Learn and extract template from current text
  const extractAndSaveLearnedTemplate = () => {
    let generalized = templateText;

    // If user edited text without using @ tags, automatically generalize their text
    if (templateData.responsaveis && templateData.responsaveis !== templateData.responsavel && generalized.includes(templateData.responsaveis)) {
      generalized = generalized.replaceAll(templateData.responsaveis, "@responsaveis");
    }
    if (templateData.responsavel && generalized.includes(templateData.responsavel)) {
      generalized = generalized.replaceAll(templateData.responsavel, "@responsavel");
    }
    if (templateData.paciente && generalized.includes(templateData.paciente)) {
      generalized = generalized.replaceAll(templateData.paciente, "@paciente");
    }
    if (templateData.valor && generalized.includes(templateData.valor)) {
      generalized = generalized.replaceAll(templateData.valor, "@valor");
    }
    if (templateData.mes && generalized.includes(templateData.mes)) {
      generalized = generalized.replaceAll(templateData.mes, "@mes");
    }
    if (templateData.pix && generalized.includes(templateData.pix)) {
      generalized = generalized.replaceAll(templateData.pix, "@pix");
    }
    if (templateData.clinica && generalized.includes(templateData.clinica)) {
      generalized = generalized.replaceAll(templateData.clinica, "@clinica");
    }

    saveCobrancaTemplate(generalized);
    return generalized;
  };

  // Copy resolved message to clipboard
  const handleCopyMessage = async () => {
    if (!resolvedMessage) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(resolvedMessage);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = resolvedMessage;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopied(true);

      if (learnAndSave) {
        extractAndSaveLearnedTemplate();
        toast.success("Mensagem copiada e novo modelo aprendido pelo sistema!");
      } else {
        toast.success("Mensagem copiada para a área de transferência!");
      }

      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      toast.error("Não foi possível copiar a mensagem automaticamente.");
    }
  };

  // Open WhatsApp with resolved message
  const handleOpenWhatsApp = () => {
    if (!activeResp) {
      toast.error("Nenhum responsável com telefone cadastrado.");
      return;
    }

    const num = activeResp.whatsapp || activeResp.telefone;
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

    if (learnAndSave) {
      extractAndSaveLearnedTemplate();
    }

    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(resolvedMessage)}`;
    window.open(url, "_blank");
  };

  // Restore factory default template
  const handleResetToDefault = () => {
    setTemplateText(DEFAULT_COBRANCA_TEMPLATE);
    saveCobrancaTemplate(DEFAULT_COBRANCA_TEMPLATE);
    toast.info("Modelo padrão original da clínica restaurado!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full p-4 sm:p-6 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="pb-3 border-b border-border/60 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-sm">
                <MessageCircle className="h-5 w-5 fill-emerald-600/20" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  Cobrança via WhatsApp
                  <Badge variant="outline" className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5">
                    Aprendizado Ativo ✨
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Edite, copie ou envie. Digite <kbd className="px-1 py-0.5 text-[10px] font-mono bg-muted border rounded">@</kbd> ou <kbd className="px-1 py-0.5 text-[10px] font-mono bg-muted border rounded">/</kbd> para invocar dados do paciente e responsável.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
          {/* Patient and Responsible Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/60 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Paciente
              </span>
              <span className="font-semibold text-foreground text-sm truncate block mt-0.5">
                {patientName}
              </span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                Competência: <strong className="text-foreground">{mesRef || "Geral"}</strong>
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Total Pendente
              </span>
              <span className="font-bold text-rose-600 dark:text-rose-400 text-sm block mt-0.5">
                {brl(totalPendente)}
              </span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                Pix: <span className="font-mono text-foreground">{defaultPix}</span>
              </span>
            </div>

            {/* Multiple Responsibles Selector if available */}
            <div className="sm:col-span-2 pt-1 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  Responsável para Envio {validResps.length > 1 ? `(${validResps.length} cadastrados)` : ""}
                </span>
                {validResps.length > 1 ? (
                  <Select
                    value={String(selectedRespIndex)}
                    onValueChange={(val) => setSelectedRespIndex(Number(val))}
                  >
                    <SelectTrigger className="h-7 text-xs mt-1 w-full max-w-md bg-background">
                      <SelectValue placeholder="Selecione o responsável..." />
                    </SelectTrigger>
                    <SelectContent>
                      {validResps.map((r, idx) => (
                        <SelectItem key={idx} value={String(idx)} className="text-xs">
                          {r.nome} {r.parentesco ? `(${r.parentesco})` : ""} — {r.whatsapp || r.telefone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="font-medium text-foreground block mt-0.5 text-xs">
                    {activeResp?.nome || "Sem responsável"}
                    {activeResp?.parentesco ? ` (${activeResp.parentesco})` : ""} •{" "}
                    <span className="font-mono text-muted-foreground">
                      {activeResp?.whatsapp || activeResp?.telefone || "Sem telefone"}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tabs: Editor vs WhatsApp Preview */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <div className="flex items-center justify-between mb-2">
              <TabsList className="h-8 p-0.5 bg-muted/60 border border-border/60">
                <TabsTrigger value="edit" className="text-xs h-7 px-3 gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs">
                  <AtSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Editor do Modelo (@)
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-xs h-7 px-3 gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs">
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Prévia do WhatsApp
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetToDefault}
                  className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                  title="Restaurar mensagem padrão de fábrica da clínica"
                >
                  <RotateCcw className="h-3 w-3" />
                  Restaurar Padrão
                </Button>
              </div>
            </div>

            {/* TAB 1: Editor com Variáveis e Invocação (@ e /) */}
            <TabsContent value="edit" className="mt-0 space-y-2 relative focus-visible:outline-hidden">
              {/* Quick Insertion Chips */}
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-muted/30 border border-border/50 text-xs">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1 mr-1">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Inserir:
                </span>
                {mentionVariables.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVariable(v.key)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-background hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 border border-border/70 hover:border-emerald-500/40 transition-colors shadow-2xs cursor-pointer"
                    title={`Inserir @${v.key} (${v.label}: ${v.getDescription()})`}
                  >
                    {v.icon}
                    <span>@{v.key}</span>
                  </button>
                ))}
              </div>

              {/* Textarea with Mention Support */}
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={templateText}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  rows={9}
                  className="font-sans text-xs sm:text-[13px] leading-relaxed resize-y min-h-[190px] bg-background border-border/80 focus-visible:ring-emerald-500/30"
                  placeholder="Escreva a mensagem... Digite @ ou / para invocar variáveis como @paciente ou @responsavel"
                />

                {/* Autocomplete Mention Floating Dropdown */}
                {mentionState.open && filteredMentionVariables.length > 0 && (
                  <div
                    className="absolute z-50 left-2 bottom-full mb-1.5 w-72 sm:w-80 max-h-60 overflow-y-auto rounded-lg border border-border/80 bg-popover p-1 text-popover-foreground shadow-xl animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 flex items-center justify-between">
                      <span>Invocar Variável ({mentionState.trigger})</span>
                      <span className="text-[9px] lowercase font-normal">Use ↑↓ e Enter</span>
                    </div>
                    <div className="py-1 space-y-0.5">
                      {filteredMentionVariables.map((item, index) => {
                        const isSelected = index === mentionState.selectedIndex;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              insertVariable(item.key);
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded-md flex items-center justify-between text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 font-semibold"
                                : "hover:bg-muted text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="shrink-0">{item.icon}</span>
                              <div className="truncate">
                                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold mr-1">
                                  {mentionState.trigger}{item.key}
                                </span>
                                <span className="text-muted-foreground text-[11px] truncate">
                                  {item.label}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] text-muted-foreground/80 truncate max-w-[90px] ml-1 shrink-0 text-right">
                              {item.getDescription()}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Status and Character count */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Dica: digite <strong className="text-foreground">@</strong> ou <strong className="text-foreground">/</strong> em qualquer parte do texto.
                </span>
                <span>{templateText.length} caracteres</span>
              </div>
            </TabsContent>

            {/* TAB 2: Prévia Autêntica do WhatsApp */}
            <TabsContent value="preview" className="mt-0 focus-visible:outline-hidden">
              <div className="rounded-xl border border-border/80 bg-slate-100 dark:bg-slate-900/60 p-4 min-h-[220px] flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pb-2 border-b border-border/40">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                    Destinatário: {activeResp?.nome || "Responsável"} ({activeResp?.whatsapp || activeResp?.telefone || "—"})
                  </span>
                  <span>Prévia em tempo real</span>
                </div>

                {/* WhatsApp Chat Bubble */}
                <div className="my-3 flex justify-end">
                  <div className="max-w-[92%] sm:max-w-[85%] rounded-2xl rounded-tr-xs bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/25 p-3.5 shadow-sm text-xs sm:text-[13px] text-foreground leading-relaxed whitespace-pre-wrap select-text">
                    {resolvedMessage}
                    <div className="flex items-center justify-end gap-1 mt-1.5 text-[10px] text-emerald-800/60 dark:text-emerald-300/60">
                      <span>{format(new Date(), "HH:mm")}</span>
                      <CheckCheck className="h-3.5 w-3.5 text-sky-500" />
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground text-center pt-2 border-t border-border/40">
                  Este é o texto exato com todos os dados preenchidos que será enviado ou copiado.
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Learning toggle option */}
          <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="learn-template-checkbox"
                checked={learnAndSave}
                onCheckedChange={(checked) => setLearnAndSave(Boolean(checked))}
              />
              <Label
                htmlFor="learn-template-checkbox"
                className="text-xs font-medium text-foreground cursor-pointer select-none"
              >
                Aprender com este texto e sugerir este modelo para as próximas cobranças
              </Label>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                extractAndSaveLearnedTemplate();
                toast.success("Modelo salvo e aprendido com sucesso!");
              }}
              className="h-6 px-2 text-[11px] gap-1 shrink-0"
              title="Salvar modelo atual agora"
            >
              <Sparkles className="h-3 w-3 text-amber-500" />
              Salvar Modelo
            </Button>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="pt-3 border-t border-border/60 shrink-0 gap-2 sm:gap-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Fechar
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyMessage}
              className={`text-xs gap-1.5 transition-all cursor-pointer ${
                copied
                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"
                  : "hover:bg-muted"
              }`}
              title="Copiar texto final preenchido para a área de transferência"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copiar Texto</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleOpenWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-sm cursor-pointer"
              title="Abrir o WhatsApp com a mensagem preenchida"
            >
              <MessageCircle className="h-3.5 w-3.5 fill-white/20" />
              <span>Abrir no WhatsApp</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
