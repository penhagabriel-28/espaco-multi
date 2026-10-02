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
import { Input } from "@/components/ui/input";
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
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";

const STORAGE_KEY_COBRANCA_TEMPLATE = "espaco_multi_cobranca_whatsapp_template";

const DEFAULT_COBRANCA_TEMPLATE = `Olá @tratamento @responsavel,
@saudacao, tudo bem? 😊
Gostaríamos de lembrar do pagamento referente aos atendimentos de @mes de *@paciente* no valor total de *@valor*.

@resumo

Nosso pix: @pix

Agradecemos a atenção! *@clinica*`;

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizeSavedTemplate(raw: string): string {
  if (!raw || !raw.trim()) return DEFAULT_COBRANCA_TEMPLATE;

  let s = raw;

  // 1. Remove previous hardcoded patient/responsible names from user tests
  // Replace greetings with hardcoded names like "Dona Magna"
  s = s.replace(
    /(?:Olá|Oi|Bom dia|Boa tarde|Boa noite)[\s,]+(?:Dona\s+|Sra\.?\s+|Sr\.?\s+)?Magna(?:[\s,]+dos[\s,]+Santos[\s,]+Pereira)?/gi,
    (match) => {
      const greetingMatch = match.match(/^(Olá|Oi|Bom dia|Boa tarde|Boa noite)/i);
      const greet = greetingMatch ? greetingMatch[1] : "Olá";
      return `${greet} @tratamento @responsavel`;
    }
  );
  s = s.replace(/\bDona\s+Magna\b/gi, "@tratamento @responsavel");
  s = s.replace(/\bMagna\s+dos\s+Santos\s+Pereira\b/gi, "@responsavel");
  s = s.replace(/\bMagna\b/gi, "@responsavel");

  // Replace Francisco dos Santos Pereira
  s = s.replace(/\*?Francisco\s+dos\s+Santos\s+Pereira\*?/gi, "*@paciente*");

  // 2. Remove hardcoded summary from Francisco's invoice or any previous session details
  s = s.replace(
    /(?:\r?\n\s*)?Resumo(?:\s+dos\s+atendimentos)?:\s*[\r\n]+[•\-\*]\s*1\s*sessão.*Leandro\s+Moraes/gi,
    "\n@resumo"
  );
  s = s.replace(
    /(?:\r?\n\s*)?Resumo(?:\s+dos\s+atendimentos)?:\s*[\r\n]+(?:[•\-\*].*[\r\n]*)+/gi,
    "\n@resumo"
  );

  // 3. Remove hardcoded R$ 120,00 from previous test
  s = s.replace(/\*?R\$\s*120,00\*?/gi, "*@valor*");

  // 4. If the template contains "Olá, @responsavel!" (old default), modernize it
  if (s.includes("Olá, @responsavel! Gostaríamos de lembrar")) {
    s = s.replace(
      "Olá, @responsavel! Gostaríamos de lembrar",
      "Olá @tratamento @responsavel,\n@saudacao, tudo bem? 😊\nGostaríamos de lembrar"
    );
  }

  // 5. Ensure @resumo is present if absent
  if (!s.includes("@resumo")) {
    s = s.replace(/(\*?@valor\*?\.?)/, "$1\n@resumo");
  }

  // 6. Ensure greeting has @saudacao if it has literal "Boa tarde" etc.
  s = s.replace(/\b(Boa tarde|Bom dia|Boa noite), tudo bem\?/gi, "@saudacao, tudo bem?");

  return s;
}

function getSavedCobrancaTemplate(): string {
  if (typeof window === "undefined") return DEFAULT_COBRANCA_TEMPLATE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_COBRANCA_TEMPLATE);
    if (saved && saved.trim()) {
      const sanitized = sanitizeSavedTemplate(saved);
      if (sanitized !== saved) {
        localStorage.setItem(STORAGE_KEY_COBRANCA_TEMPLATE, sanitized);
      }
      return sanitized;
    }
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
    pacientePrimeiroNome: string;
    responsavel: string;
    responsavelCompleto: string;
    tratamento: string;
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

  // Handle @resumo first:
  // If data.resumo already contains "Resumo:", prevent double "Resumo:"
  const cleanResumo = data.resumo ? data.resumo.trim() : "";
  if (cleanResumo) {
    result = result.replace(
      /(?:\r?\n\s*)?Resumo(?:\s+dos\s+atendimentos)?:\s*[\r\n]*([@\/]|\{\{?)resumo(\}\}?)/gi,
      `\n\n${cleanResumo}`
    );
    result = result.replace(/([@\/]|\{\{?)resumo(\}\}?)/gi, `\n\n${cleanResumo}`);
  } else {
    result = result.replace(
      /(?:\r?\n\s*)?Resumo(?:\s+dos\s+atendimentos)?:\s*[\r\n]*([@\/]|\{\{?)resumo(\}\}?)/gi,
      ""
    );
    result = result.replace(/(?:\.?\s*)?([@\/]|\{\{?)resumo(\}\}?)/gi, "");
  }

  // Handle @tratamento: if empty, remove it cleanly without leaving awkward double spaces
  const cleanTratamento = data.tratamento ? data.tratamento.trim() : "";
  if (!cleanTratamento) {
    result = result.replace(/([@\/]|\{\{?)(?:tratamento|titulo)(\}\}?)\s*/gi, "");
  } else {
    result = result.replace(/([@\/]|\{\{?)(?:tratamento|titulo)(\}\}?)/gi, cleanTratamento);
  }

  const replacements: Record<string, string> = {
    paciente: data.paciente,
    nome_paciente: data.paciente,
    primeiro_nome_paciente: data.pacientePrimeiroNome,
    responsavel: data.responsavel,
    nome_responsavel: data.responsavel,
    primeiro_nome_responsavel: data.responsavel,
    responsavel_completo: data.responsavelCompleto,
    nome_completo_responsavel: data.responsavelCompleto,
    responsaveis: data.responsaveis || data.responsavel,
    nomes_responsaveis: data.responsaveis || data.responsavel,
    valor: data.valor,
    total: data.valor,
    valor_pendente: data.valor,
    mes: data.mes,
    mes_referencia: data.mes,
    pix: data.pix,
    chave_pix: data.pix,
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

  // Clean any accidental multiple spaces (except newlines)
  result = result.replace(/[ \t]{2,}/g, " ");
  // Clean 3+ consecutive newlines to 2 newlines
  result = result.replace(/\n{3,}/g, "\n\n");

  return result.trim();
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

    const respFullName = activeResp?.nome ? activeResp.nome.trim() : "Responsável";
    const respFirstName = respFullName.split(/\s+/)[0] || "Responsável";
    const pacienteFullName = patientName ? patientName.trim() : "Paciente";
    const pacienteFirstName = pacienteFullName.split(/\s+/)[0] || "Paciente";

    // Auto-detect title / treatment (Dona / Sr.) based on parentesco or first name
    const parentesco = String(activeResp?.parentesco || "").toLowerCase();
    const isFemale =
      parentesco.includes("mãe") ||
      parentesco.includes("mae") ||
      parentesco.includes("avó") ||
      parentesco.includes("avo") ||
      parentesco.includes("tia") ||
      parentesco.includes("madrasta") ||
      parentesco.includes("irmã") ||
      parentesco.includes("irma") ||
      (parentesco === "" && /[aáã]$/i.test(respFirstName) && !["luca", "lucas"].includes(respFirstName.toLowerCase()));

    const isMale =
      parentesco.includes("pai") ||
      parentesco.includes("avô") ||
      parentesco.includes("avo") ||
      parentesco.includes("tio") ||
      parentesco.includes("padrasto") ||
      parentesco.includes("irmão") ||
      parentesco.includes("irmao") ||
      (parentesco === "" && /[oóõ]$/i.test(respFirstName));

    const tratamento = isFemale ? "Dona" : (isMale ? "Sr." : "");

    return {
      paciente: pacienteFullName,
      pacientePrimeiroNome: pacienteFirstName,
      responsavel: respFirstName,
      responsavelCompleto: respFullName,
      tratamento,
      responsaveis: allRespsNames,
      valor: brl(totalPendente),
      mes: mesRef || "período",
      pix: defaultPix,
      resumo: summaryText || "",
      resumoRaw: summaryText || "",
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
  const [messageText, setMessageText] = useState("");
  const [baseTemplateText, setBaseTemplateText] = useState("");

  // Custom overrides for "@" variables (allows editing individual "@" values)
  const [customVariables, setCustomVariables] = useState<{
    tratamento?: string;
    responsavel?: string;
    paciente?: string;
    valor?: string;
    mes?: string;
    pix?: string;
    saudacao?: string;
    clinica?: string;
  }>({});
  const [isEditingVariablesOpen, setIsEditingVariablesOpen] = useState(false);

  const activeTemplateData = useMemo(() => {
    return {
      ...templateData,
      tratamento: customVariables.tratamento !== undefined ? customVariables.tratamento : templateData.tratamento,
      responsavel: customVariables.responsavel !== undefined ? customVariables.responsavel : templateData.responsavel,
      paciente: customVariables.paciente !== undefined ? customVariables.paciente : templateData.paciente,
      valor: customVariables.valor !== undefined ? customVariables.valor : templateData.valor,
      mes: customVariables.mes !== undefined ? customVariables.mes : templateData.mes,
      pix: customVariables.pix !== undefined ? customVariables.pix : templateData.pix,
      saudacao: customVariables.saudacao !== undefined ? customVariables.saudacao : templateData.saudacao,
      clinica: customVariables.clinica !== undefined ? customVariables.clinica : templateData.clinica,
    };
  }, [templateData, customVariables]);

  const [copied, setCopied] = useState(false);
  const [learnAndSave, setLearnAndSave] = useState(true);
  const [activeTab, setActiveTab] = useState<"message" | "template" | "preview">("message");

  // Mention State for @ or / in Message Textarea
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

  // Mention State for @ or / in Template Formula Textarea
  const templateTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [templateMentionState, setTemplateMentionState] = useState<{
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

  // Unified updater: updates template in state, localStorage, and immediately computes real message
  const updateTemplateAndMessage = (newTemplate: string, customVars = customVariables) => {
    setBaseTemplateText(newTemplate);
    saveCobrancaTemplate(newTemplate);
    const dataToUse = {
      ...templateData,
      tratamento: customVars.tratamento !== undefined ? customVars.tratamento : templateData.tratamento,
      responsavel: customVars.responsavel !== undefined ? customVars.responsavel : templateData.responsavel,
      paciente: customVars.paciente !== undefined ? customVars.paciente : templateData.paciente,
      valor: customVars.valor !== undefined ? customVars.valor : templateData.valor,
      mes: customVars.mes !== undefined ? customVars.mes : templateData.mes,
      pix: customVars.pix !== undefined ? customVars.pix : templateData.pix,
      saudacao: customVars.saudacao !== undefined ? customVars.saudacao : templateData.saudacao,
      clinica: customVars.clinica !== undefined ? customVars.clinica : templateData.clinica,
    };
    const realMsg = resolveTemplateVariables(newTemplate, dataToUse);
    setMessageText(realMsg);
  };

  const handleUpdateCustomVariable = (key: string, value: string) => {
    const updatedCustom = { ...customVariables, [key]: value };
    setCustomVariables(updatedCustom);
    updateTemplateAndMessage(baseTemplateText, updatedCustom);
  };

  // Function to generate the default real message from base template
  const generateRealMessageFromTemplate = (template: string, data = activeTemplateData) => {
    return resolveTemplateVariables(template, data);
  };

  // Initialize on open
  useEffect(() => {
    if (open) {
      const savedTemplate = getSavedCobrancaTemplate();
      setBaseTemplateText(savedTemplate);
      setCustomVariables({});
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
      setTemplateMentionState({
        open: false,
        trigger: "@",
        query: "",
        startIndex: -1,
        endIndex: -1,
        selectedIndex: 0,
      });
      setActiveTab("message");
    }
  }, [open, patientId, templateData]);

  // When user changes the responsible in the dropdown, update the name in the message
  const handleRespChange = (newIndex: number) => {
    setSelectedRespIndex(newIndex);
    const newResp = validResps[newIndex];
    if (newResp) {
      const respFullName = newResp.nome ? newResp.nome.trim() : "Responsável";
      const respFirstName = respFullName.split(/\s+/)[0] || "Responsável";
      const parentesco = String(newResp.parentesco || "").toLowerCase();
      const isFemale =
        parentesco.includes("mãe") ||
        parentesco.includes("mae") ||
        parentesco.includes("avó") ||
        parentesco.includes("avo") ||
        parentesco.includes("tia") ||
        parentesco.includes("madrasta") ||
        parentesco.includes("irmã") ||
        parentesco.includes("irma") ||
        (parentesco === "" && /[aáã]$/i.test(respFirstName) && !["luca", "lucas"].includes(respFirstName.toLowerCase()));

      const isMale =
        parentesco.includes("pai") ||
        parentesco.includes("avô") ||
        parentesco.includes("avo") ||
        parentesco.includes("tio") ||
        parentesco.includes("padrasto") ||
        parentesco.includes("irmão") ||
        parentesco.includes("irmao") ||
        (parentesco === "" && /[oóõ]$/i.test(respFirstName));

      const tratamento = isFemale ? "Dona" : (isMale ? "Sr." : "");

      const updatedCustom = {
        ...customVariables,
        responsavel: respFirstName,
        tratamento: customVariables.tratamento !== undefined ? customVariables.tratamento : tratamento,
      };
      setCustomVariables(updatedCustom);

      const updatedData = {
        ...activeTemplateData,
        responsavel: respFirstName,
        responsavelCompleto: respFullName,
        tratamento: updatedCustom.tratamento,
      };

      setMessageText(resolveTemplateVariables(baseTemplateText, updatedData));
    }
  };

  // Autocomplete variables items (for Message tab)
  const mentionItems = useMemo(() => {
    const items = [
      {
        key: "paciente",
        label: "Nome do Paciente",
        value: activeTemplateData.paciente,
        icon: <User className="h-3.5 w-3.5 text-sky-500" />,
        hint: "Inserir nome do paciente",
      },
      {
        key: "responsavel",
        label: "Nome do Responsável",
        value: activeTemplateData.tratamento ? `${activeTemplateData.tratamento} ${activeTemplateData.responsavel}` : activeTemplateData.responsavel,
        icon: <Users className="h-3.5 w-3.5 text-emerald-500" />,
        hint: "Inserir nome do responsável selecionado",
      },
      {
        key: "tratamento",
        label: "Tratamento (Dona / Sr.)",
        value: activeTemplateData.tratamento,
        icon: <Sparkles className="h-3.5 w-3.5 text-amber-500" />,
        hint: "Dona ou Sr. de acordo com o responsável",
      },
      {
        key: "responsavel_completo",
        label: "Nome Completo do Responsável",
        value: activeTemplateData.responsavelCompleto,
        icon: <Users className="h-3.5 w-3.5 text-teal-500" />,
        hint: "Inserir nome completo cadastrado",
      },
      {
        key: "responsaveis",
        label: "Todos os Responsáveis",
        value: activeTemplateData.responsaveis,
        icon: <Users className="h-3.5 w-3.5 text-indigo-500" />,
        hint: "Inserir nome de todos os responsáveis",
      },
      {
        key: "valor",
        label: "Valor Total Pendente",
        value: activeTemplateData.valor,
        icon: <DollarSign className="h-3.5 w-3.5 text-rose-500" />,
        hint: "Inserir valor pendente formatado em R$",
      },
      {
        key: "mes",
        label: "Mês de Referência",
        value: activeTemplateData.mes,
        icon: <Calendar className="h-3.5 w-3.5 text-amber-500" />,
        hint: "Inserir mês de competência",
      },
      {
        key: "pix",
        label: "Chave Pix",
        value: activeTemplateData.pix,
        icon: <QrCode className="h-3.5 w-3.5 text-teal-500" />,
        hint: "Inserir chave PIX",
      },
      {
        key: "resumo",
        label: "Resumo dos Atendimentos",
        value: activeTemplateData.resumo,
        icon: <FileText className="h-3.5 w-3.5 text-blue-500" />,
        hint: "Inserir detalhamento de sessões e pacotes",
      },
      {
        key: "clinica",
        label: "Nome da Clínica",
        value: activeTemplateData.clinica,
        icon: <Building className="h-3.5 w-3.5 text-purple-500" />,
        hint: "Inserir nome da clínica",
      },
      {
        key: "saudacao",
        label: "Saudação (Horário)",
        value: activeTemplateData.saudacao,
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
  }, [activeTemplateData, responsaveis]);

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

  // Template autocomplete variables items (for Formula tab)
  const templateMentionItems = useMemo(() => {
    const items = [
      {
        tag: "@paciente",
        label: "Paciente",
        example: activeTemplateData.paciente,
        icon: <User className="h-3.5 w-3.5 text-sky-500" />,
        hint: "Nome completo do paciente",
      },
      {
        tag: "@responsavel",
        label: "Responsável",
        example: activeTemplateData.responsavel,
        icon: <Users className="h-3.5 w-3.5 text-emerald-500" />,
        hint: "Nome do responsável",
      },
      {
        tag: "@tratamento",
        label: "Tratamento",
        example: activeTemplateData.tratamento || "(vazio)",
        icon: <Sparkles className="h-3.5 w-3.5 text-indigo-500" />,
        hint: "Dona, Sr., Sra. (ou vazio)",
      },
      {
        tag: "@saudacao",
        label: "Saudação",
        example: activeTemplateData.saudacao,
        icon: <Sparkles className="h-3.5 w-3.5 text-amber-500" />,
        hint: "Bom dia, Boa tarde ou Olá",
      },
      {
        tag: "@valor",
        label: "Valor Total",
        example: activeTemplateData.valor,
        icon: <DollarSign className="h-3.5 w-3.5 text-rose-500" />,
        hint: "Valor pendente formatado em R$",
      },
      {
        tag: "@mes",
        label: "Mês",
        example: activeTemplateData.mes,
        icon: <Calendar className="h-3.5 w-3.5 text-amber-500" />,
        hint: "Mês de referência (ex: Setembro)",
      },
      {
        tag: "@pix",
        label: "Chave Pix",
        example: activeTemplateData.pix,
        icon: <QrCode className="h-3.5 w-3.5 text-teal-500" />,
        hint: "Chave Pix da clínica",
      },
      {
        tag: "@resumo",
        label: "Resumo",
        example: activeTemplateData.resumo ? "Detalhamento das sessões" : "(sem sessões)",
        icon: <FileText className="h-3.5 w-3.5 text-blue-500" />,
        hint: "Lista detalhada dos atendimentos",
      },
      {
        tag: "@clinica",
        label: "Clínica",
        example: activeTemplateData.clinica,
        icon: <Building className="h-3.5 w-3.5 text-purple-500" />,
        hint: "Nome da clínica",
      },
      {
        tag: "@responsaveis",
        label: "Todos os Responsáveis",
        example: activeTemplateData.responsaveis,
        icon: <Users className="h-3.5 w-3.5 text-teal-500" />,
        hint: "Nomes de todos os responsáveis",
      },
    ];

    if ((responsaveis || []).length > 1) {
      responsaveis.forEach((r, idx) => {
        if (r?.nome) {
          items.push({
            tag: `@responsavel_${idx + 1}`,
            label: `${r.nome} (${r.parentesco || "Resp. " + (idx + 1)})`,
            example: r.nome,
            icon: <Users className="h-3.5 w-3.5 text-teal-500" />,
            hint: `Inserir ${r.nome}`,
          });
        }
      });
    }

    return items;
  }, [activeTemplateData, responsaveis]);

  const filteredTemplateMentionItems = useMemo(() => {
    if (!templateMentionState.open) return [];
    const q = templateMentionState.query.toLowerCase().trim();
    if (!q) return templateMentionItems;
    return templateMentionItems.filter(
      (item) =>
        item.tag.toLowerCase().includes(q) ||
        item.label.toLowerCase().includes(q) ||
        item.example.toLowerCase().includes(q),
    );
  }, [templateMentionState.open, templateMentionState.query, templateMentionItems]);

  const handleTemplateTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;

    updateTemplateAndMessage(val);

    const textBeforeCursor = val.slice(0, cursorPos);
    const match = textBeforeCursor.match(/(?:^|\s)([@/])([a-zA-Z0-9_]*)$/);

    if (match) {
      const trigger = match[1] as "@" | "/";
      const query = match[2];
      const triggerIndex = textBeforeCursor.lastIndexOf(trigger);

      setTemplateMentionState({
        open: true,
        trigger,
        query,
        startIndex: triggerIndex,
        endIndex: cursorPos,
        selectedIndex: 0,
      });
    } else {
      if (templateMentionState.open) {
        setTemplateMentionState((prev) => ({ ...prev, open: false }));
      }
    }
  };

  const insertTemplateTagAtCursor = (tag: string) => {
    const textarea = templateTextareaRef.current;
    let newTemplate = "";
    let newCursorPos = 0;

    if (templateMentionState.open && templateMentionState.startIndex >= 0) {
      const before = baseTemplateText.slice(0, templateMentionState.startIndex);
      const after = baseTemplateText.slice(templateMentionState.endIndex);
      newTemplate = before + tag + " " + after;
      newCursorPos = before.length + tag.length + 1;
    } else if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = baseTemplateText.slice(0, start);
      const after = baseTemplateText.slice(end);
      newTemplate = before + tag + " " + after;
      newCursorPos = before.length + tag.length + 1;
    } else {
      newTemplate = baseTemplateText + (baseTemplateText ? " " : "") + tag;
      newCursorPos = newTemplate.length;
    }

    updateTemplateAndMessage(newTemplate);
    setTemplateMentionState({
      open: false,
      trigger: "@",
      query: "",
      startIndex: -1,
      endIndex: -1,
      selectedIndex: 0,
    });

    setTimeout(() => {
      if (templateTextareaRef.current) {
        templateTextareaRef.current.focus();
        templateTextareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  const handleTemplateKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!templateMentionState.open || filteredTemplateMentionItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setTemplateMentionState((prev) => ({
        ...prev,
        selectedIndex: (prev.selectedIndex + 1) % filteredTemplateMentionItems.length,
      }));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setTemplateMentionState((prev) => ({
        ...prev,
        selectedIndex:
          (prev.selectedIndex - 1 + filteredTemplateMentionItems.length) % filteredTemplateMentionItems.length,
      }));
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const selected = filteredTemplateMentionItems[templateMentionState.selectedIndex];
      if (selected) {
        insertTemplateTagAtCursor(selected.tag);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setTemplateMentionState((prev) => ({ ...prev, open: false }));
    }
  };

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

    // 1. Abstract Summary (Resumo)
    if (templateData.resumoRaw && generalized.includes(templateData.resumoRaw.trim())) {
      generalized = generalized.replace(templateData.resumoRaw.trim(), "@resumo");
    } else if (templateData.resumo && generalized.includes(templateData.resumo.trim())) {
      generalized = generalized.replace(templateData.resumo.trim(), "@resumo");
    } else {
      // Abstract any "Resumo:\n• ..." block
      const summaryRegex = /(?:\r?\n\s*)?Resumo(?:\s+dos\s+atendimentos)?:\s*[\r\n]+(?:[•\-\*].*[\r\n]*)+/gi;
      if (summaryRegex.test(generalized)) {
        generalized = generalized.replace(summaryRegex, "\n@resumo");
      }
    }

    // 2. Abstract Patient (FullName, then FirstName)
    if (templateData.paciente && generalized.includes(templateData.paciente)) {
      generalized = generalized.replaceAll(`*${templateData.paciente}*`, "*@paciente*");
      generalized = generalized.replaceAll(templateData.paciente, "@paciente");
    }
    if (templateData.pacientePrimeiroNome && templateData.pacientePrimeiroNome.length > 2) {
      generalized = generalized.replace(
        new RegExp(`(de\\s+\\*?)${escapeRegex(templateData.pacientePrimeiroNome)}(\\*?)`, "gi"),
        `$1@paciente$2`
      );
    }

    // 3. Abstract Responsible (with Treatment if present)
    const respFirst = templateData.responsavel;
    const respFull = templateData.responsavelCompleto;

    // Check treatment + name e.g. "Dona Magna", "Sra. Magna", "Sr. Antônio"
    const treatRegex = new RegExp(`(Dona|Sra\\.?|Sr\\.?)\\s+(${escapeRegex(respFirst)}|${escapeRegex(respFull)})`, "gi");
    if (treatRegex.test(generalized)) {
      generalized = generalized.replace(treatRegex, "@tratamento @responsavel");
    }

    // Check greeting followed by name e.g. "Olá Magna", "Olá, Magna,"
    const greetingRespRegex = new RegExp(`(Ol[aá]|Oi|Bom dia|Boa tarde|Boa noite)[,!]?\\s+(${escapeRegex(respFirst)}|${escapeRegex(respFull)})`, "gi");
    if (greetingRespRegex.test(generalized)) {
      generalized = generalized.replace(greetingRespRegex, (match, greet) => {
        return `${greet}, @responsavel`;
      });
    }

    // Check all responsibles
    if (
      templateData.responsaveis &&
      templateData.responsaveis !== respFull &&
      templateData.responsaveis !== respFirst &&
      generalized.includes(templateData.responsaveis)
    ) {
      generalized = generalized.replaceAll(templateData.responsaveis, "@responsaveis");
    }

    // Check full name and first name anywhere else
    if (respFull && generalized.includes(respFull)) {
      generalized = generalized.replaceAll(respFull, "@responsavel");
    }
    if (respFirst && respFirst.length >= 3 && generalized.includes(respFirst)) {
      generalized = generalized.replaceAll(respFirst, "@responsavel");
    }

    // 4. Abstract Value
    if (templateData.valor && generalized.includes(templateData.valor)) {
      generalized = generalized.replaceAll(templateData.valor, "@valor");
    }
    const valNoSpace = templateData.valor.replace(/\s+/g, "");
    if (valNoSpace && generalized.includes(valNoSpace)) {
      generalized = generalized.replaceAll(valNoSpace, "@valor");
    }

    // 5. Abstract Month
    if (templateData.mes && generalized.includes(templateData.mes)) {
      generalized = generalized.replaceAll(templateData.mes, "@mes");
    }

    // 6. Abstract Pix
    if (templateData.pix && generalized.includes(templateData.pix)) {
      generalized = generalized.replaceAll(templateData.pix, "@pix");
    }

    // 7. Abstract Clinic
    if (templateData.clinica && generalized.includes(templateData.clinica)) {
      generalized = generalized.replaceAll(templateData.clinica, "@clinica");
    }

    // 8. Abstract Time Greeting (Bom dia / Boa tarde / Boa noite)
    const timeGreetingRegex = /\b(Bom dia|Boa tarde|Boa noite)\b/gi;
    if (timeGreetingRegex.test(generalized)) {
      generalized = generalized.replace(timeGreetingRegex, "@saudacao");
    }

    // Ensure @resumo is present if it was in the original template or patient has summary
    if (!generalized.includes("@resumo") && templateData.resumo) {
      generalized += "\n@resumo";
    }

    setBaseTemplateText(generalized);
    saveCobrancaTemplate(generalized);
    return generalized;
  };

  // Copy message to clipboard
  const handleCopyMessage = async () => {
    const textToCopy = resolveTemplateVariables(messageText, activeTemplateData);
    if (!textToCopy) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = textToCopy;
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

    const textToSend = resolveTemplateVariables(messageText, activeTemplateData);
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(textToSend)}`;
    window.open(url, "_blank");
  };

  // Restore current message from template
  const handleResetCurrentMessage = () => {
    const regenerated = generateRealMessageFromTemplate(baseTemplateText, activeTemplateData);
    setMessageText(regenerated);
    toast.info("Mensagem restaurada a partir do modelo ativo!");
  };

  // Reset base template to factory default
  const handleResetToFactoryDefault = () => {
    updateTemplateAndMessage(DEFAULT_COBRANCA_TEMPLATE);
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

          {/* Quick Edit Variables Section */}
          <div className="rounded-xl border border-border/70 bg-muted/30 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setIsEditingVariablesOpen(!isEditingVariablesOpen)}
              className="w-full px-3 py-2 flex items-center justify-between text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Editar Valores dos "@"</span>
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                  Personalizar dados nesta cobrança
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                {isEditingVariablesOpen ? "Ocultar" : "Personalizar @"}
                {isEditingVariablesOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </span>
            </button>

            {isEditingVariablesOpen && (
              <div className="p-3 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 bg-background/60 animate-in fade-in duration-150">
                {/* @tratamento */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-semibold text-muted-foreground">@tratamento</Label>
                    <span className="text-[10px] text-muted-foreground/80">Título / Cortesia</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Select
                      value={
                        ["", "Dona", "Sr.", "Sra.", "Seu", "Dra.", "Dr."].includes(activeTemplateData.tratamento)
                          ? (activeTemplateData.tratamento || "__vazio__")
                          : "__outro__"
                      }
                      onValueChange={(val) => {
                        if (val === "__vazio__") {
                          handleUpdateCustomVariable("tratamento", "");
                        } else if (val !== "__outro__") {
                          handleUpdateCustomVariable("tratamento", val);
                        }
                      }}
                    >
                      <SelectTrigger className="h-7 text-xs w-24 shrink-0">
                        <SelectValue placeholder="Escolha..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__vazio__">(Vazio)</SelectItem>
                        <SelectItem value="Dona">Dona</SelectItem>
                        <SelectItem value="Sr.">Sr.</SelectItem>
                        <SelectItem value="Sra.">Sra.</SelectItem>
                        <SelectItem value="Seu">Seu</SelectItem>
                        <SelectItem value="Dra.">Dra.</SelectItem>
                        <SelectItem value="Dr.">Dr.</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      className="h-7 text-xs flex-1"
                      value={activeTemplateData.tratamento}
                      onChange={(e) => handleUpdateCustomVariable("tratamento", e.target.value)}
                      placeholder="Ex: Dona, Sr., ou vazio"
                    />
                  </div>
                </div>

                {/* @responsavel */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">@responsavel</Label>
                  <Input
                    className="h-7 text-xs"
                    value={activeTemplateData.responsavel}
                    onChange={(e) => handleUpdateCustomVariable("responsavel", e.target.value)}
                    placeholder="Nome do responsável..."
                  />
                </div>

                {/* @paciente */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">@paciente</Label>
                  <Input
                    className="h-7 text-xs"
                    value={activeTemplateData.paciente}
                    onChange={(e) => handleUpdateCustomVariable("paciente", e.target.value)}
                    placeholder="Nome do paciente..."
                  />
                </div>

                {/* @valor */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">@valor</Label>
                  <Input
                    className="h-7 text-xs font-mono font-medium text-rose-600 dark:text-rose-400"
                    value={activeTemplateData.valor}
                    onChange={(e) => handleUpdateCustomVariable("valor", e.target.value)}
                    placeholder="Valor..."
                  />
                </div>

                {/* @mes */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">@mes</Label>
                  <Input
                    className="h-7 text-xs"
                    value={activeTemplateData.mes}
                    onChange={(e) => handleUpdateCustomVariable("mes", e.target.value)}
                    placeholder="Mês de referência..."
                  />
                </div>

                {/* @saudacao */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">@saudacao</Label>
                  <Select
                    value={activeTemplateData.saudacao}
                    onValueChange={(val) => handleUpdateCustomVariable("saudacao", val)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bom dia">Bom dia</SelectItem>
                      <SelectItem value="Boa tarde">Boa tarde</SelectItem>
                      <SelectItem value="Boa noite">Boa noite</SelectItem>
                      <SelectItem value="Olá">Olá</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* @pix */}
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-[11px] font-semibold text-muted-foreground">@pix (Chave Pix)</Label>
                  <Input
                    className="h-7 text-xs font-mono"
                    value={activeTemplateData.pix}
                    onChange={(e) => handleUpdateCustomVariable("pix", e.target.value)}
                    placeholder="Chave Pix..."
                  />
                </div>

                {/* @clinica */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">@clinica</Label>
                  <Input
                    className="h-7 text-xs"
                    value={activeTemplateData.clinica}
                    onChange={(e) => handleUpdateCustomVariable("clinica", e.target.value)}
                    placeholder="Nome da clínica..."
                  />
                </div>

                {/* Reset custom variables button */}
                <div className="flex items-end justify-end sm:col-span-3 pt-1 border-t border-border/40">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCustomVariables({});
                      const real = resolveTemplateVariables(baseTemplateText, templateData);
                      setMessageText(real);
                      toast.info("Valores das variáveis restaurados para o padrão!");
                    }}
                    className="h-7 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Restaurar Padrão dos @
                  </Button>
                </div>
              </div>
            )}
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
                {/@(tratamento|responsavel|paciente|valor|mes|pix|resumo|saudacao|clinica)/i.test(messageText) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const resolved = resolveTemplateVariables(messageText, activeTemplateData);
                      setMessageText(resolved);
                      toast.success("Variáveis @ no texto foram convertidas!");
                    }}
                    className="h-7 px-2 text-[11px] text-emerald-600 dark:text-emerald-400 border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 gap-1"
                    title="Converter variáveis @ digitadas no texto para os dados reais"
                  >
                    <Sparkles className="h-3 w-3 text-emerald-500" />
                    Converter @
                  </Button>
                )}
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
                  onClick={() => insertContentAtCursor(activeTemplateData.paciente)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-background hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 border border-border/70 hover:border-emerald-500/40 transition-colors shadow-2xs cursor-pointer"
                  title={`Inserir nome do paciente: ${activeTemplateData.paciente}`}
                >
                  <User className="h-3 w-3 text-sky-500" />
                  <span>{patientName.split(" ")[0]} (Paciente)</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertContentAtCursor(
                      activeTemplateData.tratamento
                        ? `${activeTemplateData.tratamento} ${activeTemplateData.responsavel}`
                        : activeTemplateData.responsavel
                    )
                  }
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-background hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 border border-border/70 hover:border-emerald-500/40 transition-colors shadow-2xs cursor-pointer"
                  title={`Inserir responsável: ${
                    activeTemplateData.tratamento ? `${activeTemplateData.tratamento} ` : ""
                  }${activeTemplateData.responsavel}`}
                >
                  <Users className="h-3 w-3 text-emerald-500" />
                  <span>
                    {activeTemplateData.tratamento ? `${activeTemplateData.tratamento} ` : ""}
                    {activeTemplateData.responsavel} (Resp)
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => insertContentAtCursor(activeTemplateData.valor)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-background hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 border border-border/70 hover:border-emerald-500/40 transition-colors shadow-2xs cursor-pointer"
                  title={`Inserir valor: ${activeTemplateData.valor}`}
                >
                  <DollarSign className="h-3 w-3 text-rose-500" />
                  <span>{activeTemplateData.valor}</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertContentAtCursor(activeTemplateData.mes)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-background hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 border border-border/70 hover:border-emerald-500/40 transition-colors shadow-2xs cursor-pointer"
                  title={`Inserir mês: ${activeTemplateData.mes}`}
                >
                  <Calendar className="h-3 w-3 text-amber-500" />
                  <span>{activeTemplateData.mes}</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertContentAtCursor(activeTemplateData.pix)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-background hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 border border-border/70 hover:border-emerald-500/40 transition-colors shadow-2xs cursor-pointer"
                  title="Inserir Chave Pix"
                >
                  <QrCode className="h-3 w-3 text-teal-500" />
                  <span>Pix</span>
                </button>
                {activeTemplateData.resumo && (
                  <button
                    type="button"
                    onClick={() => insertContentAtCursor(activeTemplateData.resumo)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-background hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 border border-border/70 hover:border-emerald-500/40 transition-colors shadow-2xs cursor-pointer"
                    title="Inserir Resumo dos atendimentos"
                  >
                    <FileText className="h-3 w-3 text-blue-500" />
                    <span>Resumo</span>
                  </button>
                )}
                {activeTemplateData.clinica && (
                  <button
                    type="button"
                    onClick={() => insertContentAtCursor(activeTemplateData.clinica)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-background hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 border border-border/70 hover:border-emerald-500/40 transition-colors shadow-2xs cursor-pointer"
                    title={`Inserir clínica: ${activeTemplateData.clinica}`}
                  >
                    <Building className="h-3 w-3 text-purple-500" />
                    <span>{activeTemplateData.clinica}</span>
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
            <TabsContent value="template" className="mt-0 space-y-2.5 focus-visible:outline-hidden">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs sm:text-sm">
                      <AtSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      Fórmula do Modelo Base com @
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5 font-normal"
                    >
                      Sincronização ao vivo ✨
                    </Badge>
                  </div>
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

                {/* Quick variable insertion chips for the formula */}
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-background border border-border/60">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1 mr-1">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    Inserir @ na fórmula:
                  </span>
                  {templateMentionItems.map((item) => (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => insertTemplateTagAtCursor(item.tag)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-muted/50 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 border border-border/70 hover:border-emerald-500/40 transition-colors shadow-2xs cursor-pointer"
                      title={`${item.label}: insere ${item.tag} (ex: ${item.example})`}
                    >
                      <span className="text-emerald-600 dark:text-emerald-400">{item.tag}</span>
                    </button>
                  ))}
                </div>

                {/* Formula Textarea with Mention Dropdown */}
                <div className="relative">
                  <Textarea
                    ref={templateTextareaRef}
                    value={baseTemplateText}
                    onChange={handleTemplateTextareaChange}
                    onKeyDown={handleTemplateKeyDown}
                    rows={7}
                    className="font-mono text-xs sm:text-[13px] leading-relaxed resize-y bg-background border-border/80 focus-visible:ring-emerald-500/30"
                    placeholder="Defina a mensagem padrão usando as tags @paciente, @responsavel, @valor, @mes, etc. Digite @ ou / para autocompletar."
                  />

                  {/* Autocomplete Mention Floating Dropdown for Template */}
                  {templateMentionState.open && filteredTemplateMentionItems.length > 0 && (
                    <div className="absolute z-50 left-2 bottom-full mb-1.5 w-72 sm:w-80 max-h-60 overflow-y-auto rounded-lg border border-border/80 bg-popover p-1 text-popover-foreground shadow-xl animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 flex items-center justify-between">
                        <span>Inserir Tag ({templateMentionState.trigger})</span>
                        <span className="text-[9px] lowercase font-normal">Use ↑↓ e Enter</span>
                      </div>
                      <div className="py-1 space-y-0.5">
                        {filteredTemplateMentionItems.map((item, index) => {
                          const isSelected = index === templateMentionState.selectedIndex;
                          return (
                            <button
                              key={item.tag}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                insertTemplateTagAtCursor(item.tag);
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
                                  <span className="font-semibold text-foreground text-xs block font-mono">
                                    {item.tag}
                                  </span>
                                  <span className="text-muted-foreground text-[10px] block truncate">
                                    {item.label} • Ex: {item.example}
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-emerald-500" />
                    Digite <kbd className="px-1 py-0.5 text-[9px] font-mono bg-muted border rounded">@</kbd> ou clique nos botões para inserir as variáveis.
                  </span>
                  <span>{baseTemplateText.length} caracteres</span>
                </div>

                {/* Real-Time Live Preview of the Rendered Result */}
                <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 text-xs">
                      <Eye className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      Resultado em Tempo Real (Aba "Mensagem para Envio"):
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveTab("message")}
                      className="h-6 px-2 text-[10px] text-emerald-700 dark:text-emerald-300 border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 gap-1"
                    >
                      <Edit3 className="h-3 w-3" />
                      Ver na Mensagem Real
                    </Button>
                  </div>
                  <div className="p-2.5 rounded-md bg-background border border-border/60 text-xs font-sans whitespace-pre-wrap text-foreground max-h-36 overflow-y-auto leading-relaxed select-text shadow-2xs">
                    {messageText}
                  </div>
                  <div className="text-[10px] text-emerald-800/70 dark:text-emerald-300/70 flex items-center gap-1">
                    <CheckCheck className="h-3 w-3 text-emerald-600" />
                    Este é o texto final real gerado pela fórmula acima para <strong>{patientName}</strong>.
                  </div>
                </div>

                {/* Quick button to open variables editor if collapsed */}
                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                  <span className="text-[11px] text-muted-foreground">
                    Precisa alterar algum dado dos @ (como nome, valor ou pix)?
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingVariablesOpen(true)}
                    className="h-6 px-2 text-[11px] gap-1 text-foreground"
                  >
                    <SlidersHorizontal className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    {isEditingVariablesOpen ? "Editar Valores dos @" : "Personalizar Valores dos @"}
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
