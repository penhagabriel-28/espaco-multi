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
  Edit3,
  SlidersHorizontal,
} from "lucide-react";

const STORAGE_KEY_COBRANCA_TEMPLATE = "espaco_multi_cobranca_whatsapp_template";

const DEFAULT_COBRANCA_TEMPLATE = `Olá, @responsavel! Gostaríamos de lembrar do pagamento referente aos atendimentos de @mes de *@paciente* no valor total de *@valor*.@resumo

Nosso pix: @pix

Agradecemos a atenção! *@clinica*`;

function getSavedCobrancaTemplate(): string {
  if (typeof window === "undefined") return DEFAULT_COBRANCA_TEMPLATE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_COBRANCA_TEMPLATE);
    if (saved && saved.trim()) return saved;
  } catch (e) {
    console.error("Erro ao ler template do localStorage", e);
  }
  return DEFAULT_COBRANCA_TEMPLATE;
}

function saveCobrancaTemplate(template: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_COBRANCA_TEMPLATE, template);
  } catch (e) {
    console.error("Erro ao salvar template no localStorage", e);
  }
}

// Helper to resolve variables in a template
function resolveTemplateVariables(
  template: string,
  data: {
    paciente: string;
    responsavel: string;
    responsaveis?: string;
    valor: string;
    mes: string;
    pix: string;
    resumo: string;
    clinica: string;
    saudacao: string;
    extraResps?: { key: string; name: string }[];
  },
): string {
  let result = template;
  const replacements: Record<string, string> = {
    paciente: data.paciente,
    nome_paciente: data.paciente,
    responsavel: data.responsavel,
    nome_responsavel: data.responsavel,
    responsaveis: data.responsaveis || data.responsavel,
    nomes_responsaveis: data.responsaveis || data.responsavel,
    valor: data.valor,
    total: data.valor,
    valor_pendente: data.valor,
    mes: data.mes,
    mes_referencia: data.mes,
    pix: data.pix,
    chave_pix: data.pix,
    resumo: data.resumo,
    resumo_atendimentos: data.resumo,
    clinica: data.clinica,
    nome_clinica: data.clinica,
    saudacao: data.saudacao,
  };

  (data.extraResps || []).forEach((r) => {
    replacements[r.key] = r.name;
  });

  for (const [key, val] of Object.entries(replacements)) {
    const regex = new RegExp(`([@\\/]|\\{\\{?)${key}(\\}?\\}?)`, "gi");
    result = result.replace(regex, val);
  }

  return result;
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
  const brl = (val: number) => val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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

  // Data bundle for replacement
  const templateData = useMemo(() => {
    const extraResps = (responsaveis || []).map((r, idx) => ({
      key: `responsavel_${idx + 1}`,
      name: r.nome,
    }));

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
      extraResps,
    };
  }, [
    patientName,
    activeResp,
    allRespsNames,
    totalPendente,
    mesRef,
    defaultPix,
    summaryText,
    clinicaNome,
    saudacaoPeriodo,
    responsaveis,
  ]);

  // Messages state
  // messageText is the REAL editable text for this patient (e.g. "Olá, Amanda! ...")
  const [messageText, setMessageText] = useState("");
  // baseTemplateText is the underlying template with @ variables (e.g. "Olá, @responsavel! ...")
  const [baseTemplateText, setBaseTemplateText] = useState("");

  const [copied, setCopied] = useState(false);
  const [learnAndSave, setLearnAndSave] = useState(true);
  const [activeTab, setActiveTab] = useState<"message" | "template" | "preview">("message");

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

  // Function to generate the default real message from base template
  const generateRealMessageFromTemplate = (template: string) => {
    return resolveTemplateVariables(template, templateData);
  };

  // Initialize on open
  useEffect(() => {
    if (open) {
      const savedTemplate = getSavedCobrancaTemplate();
      setBaseTemplateText(savedTemplate);
      const initialRealMsg = resolveTemplateVariables(savedTemplate, templateData);
      setMessageText(initialRealMsg);
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
      setActiveTab("message");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patientId]);

  // When user changes the responsible in the dropdown, update the name in the message
  const handleRespChange = (newIndex: number) => {
    const oldResp = activeResp;
    setSelectedRespIndex(newIndex);
    const newResp = validResps[newIndex];
    if (newResp && oldResp && oldResp.nome !== newResp.nome) {
      // If the old responsible name was in messageText, replace with new
      if (messageText.includes(oldResp.nome)) {
        setMessageText((prev) => prev.replaceAll(oldResp.nome, newResp.nome));
      } else {
        // Re-generate if message was unmodified
        const updatedData = { ...templateData, responsavel: newResp.nome };
        setMessageText(resolveTemplateVariables(baseTemplateText, updatedData));
      }
    }
  };

  // Autocomplete variables items
  const mentionItems = useMemo(() => {
    const items = [
      {
        key: "paciente",
        label: "Nome do Paciente",
        value: templateData.paciente,
        icon: <User className="h-3.5 w-3.5 text-sky-500" />,
        hint: "Inserir nome do paciente",
      },
      {
        key: "responsavel",
        label: "Nome do Responsável",
        value: templateData.responsavel,
        icon: <Users className="h-3.5 w-3.5 text-emerald-500" />,
        hint: "Inserir nome do responsável selecionado",
      },
      {
        key: "responsaveis",
        label: "Todos os Responsáveis",
        value: templateData.responsaveis,
        icon: <Users className="h-3.5 w-3.5 text-indigo-500" />,
        hint: "Inserir nome de todos os responsáveis",
      },
      {
        key: "valor",
        label: "Valor Total Pendente",
        value: templateData.valor,
        icon: <DollarSign className="h-3.5 w-3.5 text-rose-500" />,
        hint: "Inserir valor pendente formatado em R$",
      },
      {
        key: "mes",
        label: "Mês de Referência",
        value: templateData.mes,
        icon: <Calendar className="h-3.5 w-3.5 text-amber-500" />,
        hint: "Inserir mês de competência",
      },
      {
        key: "pix",
        label: "Chave Pix",
        value: templateData.pix,
        icon: <QrCode className="h-3.5 w-3.5 text-teal-500" />,
        hint: "Inserir chave PIX",
      },
      {
        key: "resumo",
        label: "Resumo dos Atendimentos",
        value: templateData.resumo,
        icon: <FileText className="h-3.5 w-3.5 text-blue-500" />,
        hint: "Inserir detalhamento de sessões e pacotes",
      },
      {
        key: "clinica",
        label: "Nome da Clínica",
        value: templateData.clinica,
        icon: <Building className="h-3.5 w-3.5 text-purple-500" />,
        hint: "Inserir nome da clínica",
      },
      {
        key: "saudacao",
        label: "Saudação (Horário)",
        value: templateData.saudacao,
        icon: <Sparkles className="h-3.5 w-3.5 text-amber-500" />,
        hint: "Inserir Bom dia / Boa tarde / Olá",
      },
    ];

    // If patient has specific multiple responsibles, list them individually
    if ((responsaveis || []).length > 1) {
      responsaveis.forEach((r, idx) => {
        if (r?.nome) {
          items.push({
            key: `responsavel_${idx + 1}`,
            label: `${r.nome} (${r.parentesco || "Resp. " + (idx + 1)})`,
            value: r.nome,
            icon: <Users className="h-3.5 w-3.5 text-teal-500" />,
            hint: `Inserir ${r.nome}`,
          });
        }
      });
    }

    return items;
  }, [templateData, responsaveis]);

  // Filter mention items by user query
  const filteredMentionItems = useMemo(() => {
    if (!mentionState.open) return [];
    const q = mentionState.query.toLowerCase().trim();
    if (!q) return mentionItems;
    return mentionItems.filter(
      (item) =>
        item.key.toLowerCase().includes(q) ||
        item.label.toLowerCase().includes(q) ||
        item.value.toLowerCase().includes(q),
    );
  }, [mentionState.open, mentionState.query, mentionItems]);

  // Handle typing in textarea for @ or /
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    setMessageText(val);

    const textBeforeCursor = val.slice(0, cursorPos);
    // Matches @ or / followed by word characters right up to cursor
    const match = textBeforeCursor.match(/(?:^|\s)([@/])([a-zA-Z0-9_]*)$/);

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

  // Insert real text or tag at cursor position
  const insertContentAtCursor = (insertedText: string) => {
    const textarea = textareaRef.current;
    let newText = "";
    let newCursorPos = 0;

    if (mentionState.open && mentionState.startIndex >= 0) {
      const before = messageText.slice(0, mentionState.startIndex);
      const after = messageText.slice(mentionState.endIndex);
      newText = before + insertedText + " " + after;
      newCursorPos = before.length + insertedText.length + 1;
    } else if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = messageText.slice(0, start);
      const after = messageText.slice(end);
      newText = before + insertedText + " " + after;
      newCursorPos = before.length + insertedText.length + 1;
    } else {
      newText = messageText + (messageText ? " " : "") + insertedText;
      newCursorPos = newText.length;
    }

    setMessageText(newText);
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
    if (!mentionState.open || filteredMentionItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMentionState((prev) => ({
        ...prev,
        selectedIndex: (prev.selectedIndex + 1) % filteredMentionItems.length,
      }));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setMentionState((prev) => ({
        ...prev,
        selectedIndex:
          (prev.selectedIndex - 1 + filteredMentionItems.length) % filteredMentionItems.length,
      }));
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const selected = filteredMentionItems[mentionState.selectedIndex];
      if (selected) {
        // Inserts the actual real text value so the user can immediately edit it!
        insertContentAtCursor(selected.value);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setMentionState((prev) => ({ ...prev, open: false }));
    }
  };

  // Learning mechanism: Extract generalized template from edited real text
  const extractAndSaveLearnedTemplate = () => {
    let generalized = messageText;

    // Check if the user typed tags like @paciente or if they have actual names
    if (
      templateData.responsaveis &&
      templateData.responsaveis !== templateData.responsavel &&
      generalized.includes(templateData.responsaveis)
    ) {
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

    setBaseTemplateText(generalized);
    saveCobrancaTemplate(generalized);
    return generalized;
  };

  // Copy message to clipboard
  const handleCopyMessage = async () => {
    if (!messageText) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(messageText);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = messageText;
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

  // Open WhatsApp with current message
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

    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(messageText)}`;
    window.open(url, "_blank");
  };

  // Restore current message from template
  const handleResetCurrentMessage = () => {
    const regenerated = generateRealMessageFromTemplate(baseTemplateText);
    setMessageText(regenerated);
    toast.info("Mensagem restaurada a partir do modelo ativo!");
  };

  // Reset base template to factory default
  const handleResetToFactoryDefault = () => {
    setBaseTemplateText(DEFAULT_COBRANCA_TEMPLATE);
    saveCobrancaTemplate(DEFAULT_COBRANCA_TEMPLATE);
    const regenerated = generateRealMessageFromTemplate(DEFAULT_COBRANCA_TEMPLATE);
    setMessageText(regenerated);
    toast.info("Modelo original de fábrica restaurado com sucesso!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full p-4 sm:p-5 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="pb-2.5 border-b border-border/60 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-xs">
                <MessageCircle className="h-5 w-5 fill-emerald-600/20" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  Cobrança via WhatsApp
                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5"
                  >
                    Aprendizado Ativo ✨
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Texto pronto para envio. Edite livremente ou use{" "}
                  <kbd className="px-1 py-0.5 text-[10px] font-mono bg-muted border rounded">@</kbd>{" "}
                  ou{" "}
                  <kbd className="px-1 py-0.5 text-[10px] font-mono bg-muted border rounded">/</kbd>{" "}
                  para inserir e personalizar dados.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1">
          {/* Compact Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/60 text-xs">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">
                  Paciente:
                </span>
                <span className="font-semibold text-foreground">{patientName}</span>
              </div>
              <div className="text-muted-foreground/40">•</div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">
                  Pendente:
                </span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {brl(totalPendente)}
                </span>
                <span className="text-[10px] text-muted-foreground ml-1">
                  ({mesRef || "Geral"})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-border/40 justify-between sm:justify-end">
              <span className="text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap">
                Enviar para:
              </span>
              {validResps.length > 1 ? (
                <Select
                  value={String(selectedRespIndex)}
                  onValueChange={(val) => handleRespChange(Number(val))}
                >
                  <SelectTrigger className="h-6 text-xs bg-background py-0 px-2 min-w-[200px] border-emerald-500/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {validResps.map((r, idx) => (
                      <SelectItem key={idx} value={String(idx)} className="text-xs">
                        {r.nome} {r.parentesco ? `(${r.parentesco})` : ""} —{" "}
                        {r.whatsapp || r.telefone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="font-medium text-foreground text-xs truncate max-w-[260px]">
                  {activeResp?.nome || "Responsável"} (
                  {activeResp?.whatsapp || activeResp?.telefone || "Sem telefone"})
                </span>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <div className="flex items-center justify-between mb-2">
              <TabsList className="h-8 p-0.5 bg-muted/60 border border-border/60">
                <TabsTrigger
                  value="message"
                  className="text-xs h-7 px-3 gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs"
                >
                  <Edit3 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Mensagem para Envio (Texto Real)
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  className="text-xs h-7 px-3 gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Prévia do WhatsApp
                </TabsTrigger>
                <TabsTrigger
                  value="template"
                  className="text-xs h-7 px-2.5 gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs text-muted-foreground"
                >
                  <SlidersHorizontal className="h-3 w-3" />
                  Modelo com @
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetCurrentMessage}
                  className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                  title="Restaurar a mensagem sugerida pelo sistema para este paciente"
                >
                  <RotateCcw className="h-3 w-3" />
                  Restaurar Texto
                </Button>
              </div>
            </div>

            {/* TAB 1: Mensagem para Envio (Texto Real 100% Editável) */}
            <TabsContent
              value="message"
              className="mt-0 space-y-2 relative focus-visible:outline-hidden"
            >
              {/* Quick Insertion Chips (Inserts actual editable text) */}
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-muted/30 border border-border/50 text-xs">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1 mr-1">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Inserir no texto:
                </span>
                <button
                  type="button"
                  onClick={() => insertContentAtCursor(templateData.paciente)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-background hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 border border-border/70 hover:border-emerald-500/40 transition-colors shadow-2xs cursor-pointer"
                  title={`Inserir nome do paciente: ${templateData.paciente}`}
                >
                  <User className="h-3 w-3 text-sky-500" />
                  <span>{patientName.split(" ")[0]} (Paciente)</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertContentAtCursor(templateData.responsavel)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-background hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 border border-border/70 hover:border-emerald-500/40 transition-colors shadow-2xs cursor-pointer"
                  title={`Inserir nome do responsável: ${templateData.responsavel}`}
                >
                  <Users className="h-3 w-3 text-emerald-500" />
                  <span>{(activeResp?.nome || "Resp").split(" ")[0]} (Resp)</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertContentAtCursor(templateData.valor)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-background hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 border border-border/70 hover:border-emerald-500/40 transition-colors shadow-2xs cursor-pointer"
                  title={`Inserir valor: ${templateData.valor}`}
                >
                  <DollarSign className="h-3 w-3 text-rose-500" />
                  <span>{templateData.valor}</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertContentAtCursor(templateData.mes)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-background hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 border border-border/70 hover:border-emerald-500/40 transition-colors shadow-2xs cursor-pointer"
                  title={`Inserir mês: ${templateData.mes}`}
                >
                  <Calendar className="h-3 w-3 text-amber-500" />
                  <span>{templateData.mes}</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertContentAtCursor(templateData.pix)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-background hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 border border-border/70 hover:border-emerald-500/40 transition-colors shadow-2xs cursor-pointer"
                  title="Inserir Chave Pix"
                >
                  <QrCode className="h-3 w-3 text-teal-500" />
                  <span>Pix</span>
                </button>
                {templateData.resumo && (
                  <button
                    type="button"
                    onClick={() => insertContentAtCursor(templateData.resumo)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-background hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 border border-border/70 hover:border-emerald-500/40 transition-colors shadow-2xs cursor-pointer"
                    title="Inserir Resumo dos atendimentos"
                  >
                    <FileText className="h-3 w-3 text-blue-500" />
                    <span>Resumo</span>
                  </button>
                )}
              </div>

              {/* Editable Textarea with Mention Dropdown */}
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={messageText}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  rows={9}
                  className="font-sans text-xs sm:text-[13px] leading-relaxed resize-y min-h-[200px] bg-background border-border/80 focus-visible:ring-emerald-500/30"
                  placeholder="Mensagem de cobrança... Digite @ ou / para invocar dados do paciente e responsável"
                />

                {/* Autocomplete Mention Floating Dropdown */}
                {mentionState.open && filteredMentionItems.length > 0 && (
                  <div className="absolute z-50 left-2 bottom-full mb-1.5 w-72 sm:w-80 max-h-60 overflow-y-auto rounded-lg border border-border/80 bg-popover p-1 text-popover-foreground shadow-xl animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 flex items-center justify-between">
                      <span>Inserir Dados ({mentionState.trigger})</span>
                      <span className="text-[9px] lowercase font-normal">Use ↑↓ e Enter</span>
                    </div>
                    <div className="py-1 space-y-0.5">
                      {filteredMentionItems.map((item, index) => {
                        const isSelected = index === mentionState.selectedIndex;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              insertContentAtCursor(item.value);
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
                                <span className="font-semibold text-foreground text-xs block truncate">
                                  {item.value}
                                </span>
                                <span className="text-muted-foreground text-[10px] block truncate">
                                  {item.label}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 ml-1 shrink-0">
                              {mentionState.trigger}
                              {item.key}
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
                  Texto editável. Você pode alterar qualquer dado diretamente no campo acima.
                </span>
                <span>{messageText.length} caracteres</span>
              </div>
            </TabsContent>

            {/* TAB 2: Prévia Autêntica do WhatsApp */}
            <TabsContent value="preview" className="mt-0 focus-visible:outline-hidden">
              <div className="rounded-xl border border-border/80 bg-slate-100 dark:bg-slate-900/60 p-4 min-h-[220px] flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pb-2 border-b border-border/40">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                    Destinatário: {activeResp?.nome || "Responsável"} (
                    {activeResp?.whatsapp || activeResp?.telefone || "—"})
                  </span>
                  <span>Visualização no WhatsApp</span>
                </div>

                {/* WhatsApp Chat Bubble */}
                <div className="my-3 flex justify-end">
                  <div className="max-w-[92%] sm:max-w-[85%] rounded-2xl rounded-tr-xs bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/25 p-3.5 shadow-sm text-xs sm:text-[13px] text-foreground leading-relaxed whitespace-pre-wrap select-text">
                    {messageText}
                    <div className="flex items-center justify-end gap-1 mt-1.5 text-[10px] text-emerald-800/60 dark:text-emerald-300/60">
                      <span>{format(new Date(), "HH:mm")}</span>
                      <CheckCheck className="h-3.5 w-3.5 text-sky-500" />
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground text-center pt-2 border-t border-border/40">
                  Este é o texto exato que será enviado ou copiado.
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: Configurar Modelo Base com @ */}
            <TabsContent value="template" className="mt-0 space-y-2 focus-visible:outline-hidden">
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <AtSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    Fórmula do Modelo Base
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetToFactoryDefault}
                    className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                    title="Restaurar modelo original de fábrica"
                  >
                    Restaurar Padrão de Fábrica
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground mb-2">
                  Aqui você pode definir o esqueleto padrão do sistema usando as variáveis:{" "}
                  <code className="bg-background px-1 py-0.5 rounded text-[10px]">@paciente</code>,{" "}
                  <code className="bg-background px-1 py-0.5 rounded text-[10px]">
                    @responsavel
                  </code>
                  , <code className="bg-background px-1 py-0.5 rounded text-[10px]">@valor</code>,{" "}
                  <code className="bg-background px-1 py-0.5 rounded text-[10px]">@mes</code>,{" "}
                  <code className="bg-background px-1 py-0.5 rounded text-[10px]">@pix</code>,{" "}
                  <code className="bg-background px-1 py-0.5 rounded text-[10px]">@resumo</code>.
                </p>
                <Textarea
                  value={baseTemplateText}
                  onChange={(e) => {
                    const newTemplate = e.target.value;
                    setBaseTemplateText(newTemplate);
                    saveCobrancaTemplate(newTemplate);
                  }}
                  rows={6}
                  className="font-mono text-xs leading-relaxed bg-background"
                />
                <div className="flex justify-end mt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const updated = generateRealMessageFromTemplate(baseTemplateText);
                      setMessageText(updated);
                      setActiveTab("message");
                      toast.success("Mensagem do paciente atualizada com o novo modelo!");
                    }}
                    className="text-xs h-7"
                  >
                    Aplicar este modelo na mensagem atual
                  </Button>
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
                toast.success("Modelo aprendido e salvo para as próximas cobranças!");
              }}
              className="h-6 px-2 text-[11px] gap-1 shrink-0"
              title="Salvar alterações do texto como o novo modelo padrão"
            >
              <Sparkles className="h-3 w-3 text-amber-500" />
              Salvar Modelo
            </Button>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="pt-2.5 border-t border-border/60 shrink-0 gap-2 sm:gap-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between">
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
              title="Copiar texto para a área de transferência"
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
              title="Abrir o WhatsApp com esta mensagem"
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
