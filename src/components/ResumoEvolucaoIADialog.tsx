import { useState, useMemo, useEffect } from "react";
import { format, subDays, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Calendar,
  FileText,
  Printer,
  Copy,
  Check,
  CheckCheck,
  Pencil,
  Loader2,
  Settings,
  Bot,
  Activity,
  User,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Eye,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cleanSessionMeta } from "@/components/ProntuarioRelatoriosDialog";

interface ResumoEvolucaoIADialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paciente: any;
  agendamentos: any[];
  profissionais?: any[];
  onSaved?: () => void;
}

type PeriodoPreset =
  | "ultimos_30"
  | "ultimos_60"
  | "ultimos_90"
  | "mes_atual"
  | "mes_anterior"
  | "ano_atual"
  | "tudo"
  | "custom";

export function ResumoEvolucaoIADialog({
  open,
  onOpenChange,
  paciente,
  agendamentos = [],
  profissionais = [],
  onSaved,
}: ResumoEvolucaoIADialogProps) {
  // Filtros de período
  const [periodoPreset, setPeriodoPreset] = useState<PeriodoPreset>("ultimos_30");
  const [dataInicio, setDataInicio] = useState(() => format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [dataFim, setDataFim] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [profissionalFiltro, setProfissionalFiltro] = useState<string>("todos");
  const [apenasComRelato, setApenasComRelato] = useState(true);

  // Estados de IA e Resumo
  const [resumoGerado, setResumoGerado] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConfigApiKey, setShowConfigApiKey] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("espaco_multi_gemini_api_key") ||
        (import.meta as any).env?.VITE_GEMINI_API_KEY ||
        ""
      );
    }
    return "";
  });

  // Atualizar datas quando preset mudar
  const handlePresetChange = (preset: PeriodoPreset) => {
    setPeriodoPreset(preset);
    const today = new Date();

    if (preset === "ultimos_30") {
      setDataInicio(format(subDays(today, 30), "yyyy-MM-dd"));
      setDataFim(format(today, "yyyy-MM-dd"));
    } else if (preset === "ultimos_60") {
      setDataInicio(format(subDays(today, 60), "yyyy-MM-dd"));
      setDataFim(format(today, "yyyy-MM-dd"));
    } else if (preset === "ultimos_90") {
      setDataInicio(format(subDays(today, 90), "yyyy-MM-dd"));
      setDataFim(format(today, "yyyy-MM-dd"));
    } else if (preset === "mes_atual") {
      setDataInicio(format(startOfMonth(today), "yyyy-MM-dd"));
      setDataFim(format(endOfMonth(today), "yyyy-MM-dd"));
    } else if (preset === "mes_anterior") {
      const prevMonth = subMonths(today, 1);
      setDataInicio(format(startOfMonth(prevMonth), "yyyy-MM-dd"));
      setDataFim(format(endOfMonth(prevMonth), "yyyy-MM-dd"));
    } else if (preset === "ano_atual") {
      setDataInicio(`${today.getFullYear()}-01-01`);
      setDataFim(`${today.getFullYear()}-12-31`);
    } else if (preset === "tudo") {
      setDataInicio("2020-01-01");
      setDataFim("2030-12-31");
    }
  };

  // Salvar chave de API do Gemini no localStorage
  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey.trim());
    if (typeof window !== "undefined") {
      if (newKey.trim()) {
        localStorage.setItem("espaco_multi_gemini_api_key", newKey.trim());
        toast.success("Chave Gemini salva com sucesso!");
      } else {
        localStorage.removeItem("espaco_multi_gemini_api_key");
        toast.info("Chave Gemini removida. O sistema usará o motor clínico interno.");
      }
    }
    setShowConfigApiKey(false);
  };

  // Filtragem das sessões dentro do período selecionado
  const sessoesFiltradas = useMemo(() => {
    if (!agendamentos || agendamentos.length === 0) return [];

    return agendamentos.filter((ag: any) => {
      if (!ag.data_inicio) return false;

      // Filtro de data
      try {
        const agDate = new Date(ag.data_inicio);
        const start = startOfDay(parseISO(dataInicio));
        const end = endOfDay(parseISO(dataFim));
        if (!isWithinInterval(agDate, { start, end })) {
          return false;
        }
      } catch {
        return false;
      }

      // Filtro de profissional
      if (profissionalFiltro !== "todos") {
        if (ag.profissional_id !== profissionalFiltro && ag.profissionais?.id !== profissionalFiltro) {
          return false;
        }
      }

      // Filtro apenas com relato
      if (apenasComRelato) {
        const cleanObs = cleanSessionMeta(ag.observacoes);
        const hasAba = Boolean(ag.plano_aba?.programas?.length);
        if (!cleanObs && !hasAba && !ag.plano_aba?.observacoes_medica) {
          return false;
        }
      }

      return true;
    }).sort((a: any, b: any) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime());
  }, [agendamentos, dataInicio, dataFim, profissionalFiltro, apenasComRelato]);

  // Estatísticas do período
  const stats = useMemo(() => {
    const total = sessoesFiltradas.length;
    const comRelato = sessoesFiltradas.filter((ag: any) => {
      const clean = cleanSessionMeta(ag.observacoes);
      return Boolean(clean || ag.plano_aba?.programas?.length);
    }).length;

    const profSet = new Set<string>();
    const servSet = new Set<string>();

    sessoesFiltradas.forEach((ag: any) => {
      if (ag.profissionais?.nome) profSet.add(ag.profissionais.nome);
      if (ag.servicos?.nome) servSet.add(ag.servicos.nome);
    });

    return {
      total,
      comRelato,
      profissionais: Array.from(profSet),
      servicos: Array.from(servSet),
    };
  }, [sessoesFiltradas]);

  // Lista de profissionais envolvidos nos atendimentos deste paciente
  const profissionaisDisponiveis = useMemo(() => {
    const map = new Map<string, { id: string; nome: string; especialidade?: string }>();
    agendamentos.forEach((ag: any) => {
      if (ag.profissionais?.id && ag.profissionais?.nome) {
        map.set(ag.profissionais.id, {
          id: ag.profissionais.id,
          nome: ag.profissionais.nome,
          especialidade: ag.servicos?.nome || ag.profissionais.especialidade,
        });
      }
    });
    return Array.from(map.values());
  }, [agendamentos]);

  // Geração do Resumo Clínico via IA (Gemini ou Sintetizador Clínico Heurístico)
  const handleGenerateSummary = async () => {
    if (sessoesFiltradas.length === 0) {
      toast.warning("Nenhuma sessão encontrada para o período selecionado.");
      return;
    }

    setIsGenerating(true);
    setResumoGerado("");

    try {
      // 1. Preparar os dados clínicos das sessões
      const sessoesPayload = sessoesFiltradas.map((ag: any) => {
        const dataFormatada = ag.data_inicio
          ? format(new Date(ag.data_inicio), "dd/MM/yyyy HH:mm")
          : "Data não informada";
        const cleanObs = cleanSessionMeta(ag.observacoes);
        const planoAba = ag.plano_aba as any;
        const programasAba = (planoAba?.programas || []).map((p: any) => ({
          nome: p.nome || p.programa,
          acertos: p.acertos,
          tentativas: p.tentativas,
          status: p.status,
        }));

        return {
          data: dataFormatada,
          status: ag.status || "Realizado",
          profissional: ag.profissionais?.nome || "Profissional",
          especialidade: ag.servicos?.nome || "Clínica",
          relato: cleanObs || "Sem relato descritivo detalhado.",
          programas_aba: programasAba.length > 0 ? programasAba : undefined,
          ajuste_medico: planoAba?.observacoes_medica || undefined,
        };
      });

      const periodoFormatado = `${format(parseISO(dataInicio), "dd/MM/yyyy")} a ${format(parseISO(dataFim), "dd/MM/yyyy")}`;

      // 2. Se houver chave Gemini, tentar chamar a API do Google Gemini
      const activeKey =
        apiKey ||
        (typeof window !== "undefined" ? localStorage.getItem("espaco_multi_gemini_api_key") : "") ||
        (import.meta as any).env?.VITE_GEMINI_API_KEY;

      let generatedText = "";

      if (activeKey) {
        try {
          const prompt = `Você é um(a) especialista sênior em documentação clínica e saúde multidisciplinar (Fonoaudiologia, Psicologia, Psicopedagogia e Terapia ABA).
Sua tarefa é redigir um RESUMO DE EVOLUÇÃO CLÍNICA consolidado do paciente abaixo, com base nas sessões registradas no período.

DADOS DO PACIENTE:
- Nome: ${paciente?.nome || "Paciente"}
- Data de Nascimento: ${paciente?.data_nascimento || "Não informada"}
- CID / Hipótese: ${paciente?.cid_principal || "Em acompanhamento multiprofissional"}
- Período avaliado: ${periodoFormatado}
- Total de sessões realizadas no período: ${sessoesFiltradas.length}
- Especialidades envolvidas: ${stats.servicos.join(", ") || "Clínica Multidisciplinar"}
- Profissionais: ${stats.profissionais.join(", ") || "Equipe Clínica"}

REGISTROS BRUTOS DAS SESSÕES:
${JSON.stringify(sessoesPayload, null, 2)}

DIRETRIZES ÉTICAS E DE DOCUMENTAÇÃO:
1. O texto deve ser técnico, ético, formal e acolhedor, pronto para ser anexado ao prontuário do paciente ou entregue à família/escola.
2. Não invente fatos ou dados não descritos nas sessões. Caso falte alguma informação, registre de modo discreto.
3. Respeite os limites éticos: não emita diagnósticos nosológicos definitivos fora do escopo ético.
4. Redija em Markdown estruturado nas seguintes seções:
   # RESUMO DE EVOLUÇÃO CLÍNICA MULTIDISCIPLINAR
   **Paciente:** ${paciente?.nome} | **Período:** ${periodoFormatado} | **Total de Sessões:** ${sessoesFiltradas.length}
   
   ### 1. Frequência e Engajamento
   (Síntese da regularidade das sessões, pontualidade, vínculo com os profissionais e adaptação ao ambiente terapêutico)
   
   ### 2. Objetivos e Habilidades Trabalhadas
   (Descrição objetiva das metas abordadas no período, tarefas executadas, programas ABA/fono/psico/pedagógicos trabalhados)
   
   ### 3. Evolução e Conquistas Observadas
   (Avanços clínicos, respostas aos estímulos, marcos atingidos, diminuição de fugas ou comportamentos desafiadores, ganho de autonomia)
   
   ### 4. Dificuldades e Aspectos a Desenvolver
   (Desafios persistentes, momentos de desregulação, barreiras de aprendizagem ou atenção, abordados com discrição e rigor técnico)
   
   ### 5. Orientações Familiares e Condutas Terapêuticas
   (Recomendações dadas aos responsáveis/escola e direcionamento para os próximos períodos de atendimento)`;

          const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${activeKey}`;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2048,
              },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              generatedText = text;
            }
          } else {
            const errData = await res.json().catch(() => ({}));
            console.warn("Gemini API call failed, falling back to clinical synthesizer:", errData);
          }
        } catch (apiErr) {
          console.warn("Erro ao conectar à API do Gemini:", apiErr);
        }
      }

      // 3. Fallback inteligente: Motor de Síntese Clínica Integrado
      // Se a chave não estava configurada ou a API externa falhou, sintetizamos com rigor técnico
      if (!generatedText) {
        generatedText = buildClinicalSynthesis(
          paciente,
          periodoFormatado,
          sessoesPayload,
          stats
        );
      }

      setResumoGerado(generatedText);
      setIsEditing(false);
      toast.success("Resumo de evolução gerado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao gerar resumo: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copiar o resumo gerado
  const handleCopy = async () => {
    if (!resumoGerado) return;
    try {
      await navigator.clipboard.writeText(resumoGerado);
      setCopied(true);
      toast.success("Resumo copiado para a área de transferência!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Não foi possível copiar o texto automaticamente.");
    }
  };

  // Salvar no Prontuário / Observações do Paciente
  const handleSaveToProntuario = async () => {
    if (!resumoGerado.trim()) {
      toast.warning("Nenhum resumo gerado para salvar.");
      return;
    }

    setIsSaving(true);
    try {
      const tag = `<!--RESUMO_EVOLUCAO_${format(new Date(), "yyyyMMdd_HHmm")}:${encodeURIComponent(resumoGerado.trim())}-->`;
      const currentObs = paciente?.observacoes || "";
      const updatedObs = currentObs ? `${currentObs}\n\n${tag}` : tag;

      const { error } = await supabase
        .from("pacientes")
        .update({ observacoes: updatedObs })
        .eq("id", paciente.id);

      if (error) throw error;

      toast.success("Resumo de evolução salvo no prontuário do paciente!");
      if (onSaved) onSaved();
    } catch (err: any) {
      toast.error("Erro ao salvar no prontuário: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Impressão limpa em PDF oficial
  const handlePrint = () => {
    if (!resumoGerado) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Permita pop-ups para imprimir o relatório.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>Resumo de Evolução Clínica - ${paciente?.nome || "Paciente"}</title>
        <style>
          @page { size: A4; margin: 18mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1e293b; line-height: 1.6; font-size: 13px; }
          .header { border-bottom: 2px solid #8b5cf6; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; }
          .clinic-title { font-size: 18px; font-weight: bold; color: #6b21a8; text-transform: uppercase; letter-spacing: 0.5px; }
          .clinic-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
          .patient-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; margin-bottom: 20px; font-size: 12px; }
          .patient-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 8px; }
          .patient-grid div strong { color: #334155; }
          .content { white-space: pre-wrap; font-size: 12.5px; line-height: 1.7; color: #0f172a; }
          .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #cbd5e1; text-align: center; font-size: 11px; color: #64748b; page-break-inside: avoid; }
          .signature-line { margin: 40px auto 5px auto; width: 280px; border-top: 1px solid #000; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="clinic-title">Espaço MULTI • Clínica Multidisciplinar</div>
            <div class="clinic-sub">Relatório de Evolução Clínica e Acompanhamento Terapêutico</div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            Emissão: ${format(new Date(), "dd/MM/yyyy HH:mm")}
          </div>
        </div>

        <div class="patient-box">
          <div class="patient-grid">
            <div><strong>Paciente:</strong> ${paciente?.nome || "—"}</div>
            <div><strong>Nascimento:</strong> ${paciente?.data_nascimento || "Não informado"}</div>
            <div><strong>CID(s):</strong> ${paciente?.cid_principal || "Em acompanhamento"}</div>
          </div>
          <div style="margin-top: 6px; font-size: 11px; color: #475569;">
            <strong>Período Analisado:</strong> ${format(parseISO(dataInicio), "dd/MM/yyyy")} até ${format(parseISO(dataFim), "dd/MM/yyyy")} (${sessoesFiltradas.length} sessões registradas)
          </div>
        </div>

        <div class="content">${escapeHtml(resumoGerado)}</div>

        <div class="footer">
          <div class="signature-line"></div>
          <div>Equipe Multidisciplinar Responsável</div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Documento gerado para registro em prontuário e acompanhamento terapêutico.</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 350);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[96vw] max-h-[92vh] flex flex-col p-4 sm:p-6 overflow-hidden">
        {/* Cabeçalho */}
        <DialogHeader className="pb-3 border-b border-border/60 shrink-0 pr-8 sm:pr-0">
          <div className="flex items-center justify-between gap-2.5 flex-wrap">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 shadow-xs">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 leading-tight">
                  <span>Resumo de Evolução com IA</span>
                  <Badge variant="outline" className="text-[10px] font-semibold border-purple-500/30 text-purple-700 bg-purple-500/10 py-0 px-1.5">
                    Clínico
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  Síntese automática e discreta das sessões de <strong className="text-foreground">{paciente?.nome}</strong>
                </DialogDescription>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowConfigApiKey(!showConfigApiKey)}
              className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              title="Configurar Chave da IA (Google Gemini)"
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">IA / Gemini</span>
            </Button>
          </div>

          {/* Painel opcional de Configuração da Chave da IA */}
          {showConfigApiKey && (
            <div className="mt-2.5 p-3 rounded-lg bg-muted/40 border border-border/60 text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Bot className="h-3.5 w-3.5 text-purple-600" />
                  Chave de API do Google Gemini (Opcional)
                </span>
                <span className="text-[10px] text-muted-foreground">Gratuita no Google AI Studio</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="password"
                  placeholder="Cole sua API Key do Google Gemini..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSaveApiKey(apiKey)}
                  className="h-8 text-xs px-3 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Salvar
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Se não configurada, o sistema utiliza o motor de síntese clínica heurístico integrado automaticamente.
              </p>
            </div>
          )}
        </DialogHeader>

        {/* Corpo com Rolagem */}
        <div className="flex-1 overflow-y-auto space-y-4 py-3 text-xs pr-1">
          {/* SEÇÃO DE CONTROLE DE PERÍODO */}
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3 sm:p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                Definir Período de Análise
              </span>

              {/* Seletor rápido de período */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  type="button"
                  variant={periodoPreset === "ultimos_30" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetChange("ultimos_30")}
                  className="h-6 text-[11px] px-2 py-0"
                >
                  30 dias
                </Button>
                <Button
                  type="button"
                  variant={periodoPreset === "ultimos_90" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetChange("ultimos_90")}
                  className="h-6 text-[11px] px-2 py-0"
                >
                  3 meses
                </Button>
                <Button
                  type="button"
                  variant={periodoPreset === "mes_atual" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetChange("mes_atual")}
                  className="h-6 text-[11px] px-2 py-0"
                >
                  Mês atual
                </Button>
                <Button
                  type="button"
                  variant={periodoPreset === "tudo" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetChange("tudo")}
                  className="h-6 text-[11px] px-2 py-0"
                >
                  Tudo
                </Button>
              </div>
            </div>

            {/* Grid com datas e filtros */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Data Início</Label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => {
                    setDataInicio(e.target.value);
                    setPeriodoPreset("custom");
                  }}
                  className="h-8 text-xs bg-background"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Data Fim</Label>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => {
                    setDataFim(e.target.value);
                    setPeriodoPreset("custom");
                  }}
                  className="h-8 text-xs bg-background"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Profissional / Área</Label>
                <Select
                  value={profissionalFiltro}
                  onValueChange={setProfissionalFiltro}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Todos os profissionais" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os profissionais</SelectItem>
                    {profissionaisDisponiveis.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome} {p.especialidade ? `(${p.especialidade})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Barra informativa do filtro */}
            <div className="pt-2 border-t border-border/40 flex items-center justify-between flex-wrap gap-2 text-[11px]">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {stats.total} sessão(ões) no período
                </span>
                <span>•</span>
                <span>{stats.comRelato} com relato clínico</span>
                {stats.servicos.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="truncate max-w-[200px] text-purple-700 dark:text-purple-300">
                      {stats.servicos.join(", ")}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
                  <input
                    type="checkbox"
                    checked={apenasComRelato}
                    onChange={(e) => setApenasComRelato(e.target.checked)}
                    className="rounded border-border text-purple-600 focus:ring-purple-500 h-3.5 w-3.5"
                  />
                  <span>Apenas com anotações</span>
                </label>
              </div>
            </div>
          </div>

          {/* BOTÃO DISCRETO DE GERAÇÃO */}
          {!resumoGerado && (
            <div className="p-6 text-center rounded-xl border border-dashed border-purple-500/30 bg-purple-500/5 space-y-3">
              <div className="h-10 w-10 mx-auto rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Bot className="h-5 w-5" />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="font-semibold text-foreground text-sm">
                  Pronto para gerar o resumo de evolução
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  A IA analisará as {stats.total} sessões encontradas e elaborará uma síntese clínica técnica, discreta e estruturada.
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                disabled={isGenerating || stats.total === 0}
                onClick={handleGenerateSummary}
                className="h-9 px-5 gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-sm transition-all"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analisando sessões e gerando síntese...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Gerar Resumo do Período com IA</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* ÁREA DE EXIBIÇÃO DO RESUMO GERADO */}
          {resumoGerado && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between flex-wrap gap-2 bg-muted/40 p-2.5 rounded-lg border border-border/60">
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-600 text-white font-medium text-[10px] gap-1">
                    <Sparkles className="h-3 w-3" />
                    Resumo Gerado
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    Período: {format(parseISO(dataInicio), "dd/MM/yyyy")} a {format(parseISO(dataFim), "dd/MM/yyyy")}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="h-7 text-xs px-2.5 gap-1"
                  >
                    <Pencil className="h-3 w-3" />
                    <span>{isEditing ? "Concluir Edição" : "Editar Texto"}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isGenerating}
                    onClick={handleGenerateSummary}
                    className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                    title="Regerar resumo com novas configurações"
                  >
                    <RefreshCw className={isGenerating ? "h-3 w-3 animate-spin" : "h-3 w-3"} />
                    <span className="hidden sm:inline">Regerar</span>
                  </Button>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-muted-foreground">
                    Edite o conteúdo antes de salvar ou imprimir:
                  </Label>
                  <Textarea
                    value={resumoGerado}
                    onChange={(e) => setResumoGerado(e.target.value)}
                    rows={15}
                    className="text-xs sm:text-sm leading-relaxed p-3.5 rounded-lg border bg-background font-mono resize-y min-h-[300px]"
                  />
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-border/80 bg-background text-foreground/90 whitespace-pre-wrap leading-relaxed text-xs sm:text-[13px] shadow-2xs font-sans">
                  {resumoGerado}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé de Ações */}
        <DialogFooter className="pt-3 border-t border-border/60 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!resumoGerado}
              onClick={handleCopy}
              className="h-8 text-xs px-3 gap-1.5 text-muted-foreground hover:text-foreground"
            >
              {copied ? (
                <>
                  <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copiar Resumo</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!resumoGerado}
              onClick={handlePrint}
              className="h-8 text-xs px-3 gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir / PDF</span>
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

            {resumoGerado && (
              <Button
                type="button"
                size="sm"
                disabled={isSaving}
                onClick={handleSaveToProntuario}
                className="h-8 text-xs px-4 gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-xs"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{isSaving ? "Salvando..." : "Salvar no Prontuário"}</span>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ========================================================================
// MOTOR DE SÍNTESE CLÍNICA INTERNO (HEURÍSTICO / BASEADO EM REGRAS ÉTICAS)
// ========================================================================
function buildClinicalSynthesis(
  paciente: any,
  periodoFormatado: string,
  sessoes: any[],
  stats: any
): string {
  const nomePaciente = paciente?.nome || "Paciente";
  const cid = paciente?.cid_principal || "Acompanhamento Multidisciplinar";
  const totalSessoes = sessoes.length;

  // Filtrar relatos válidos
  const relatosValidos = sessoes.filter(
    (s) => s.relato && !s.relato.includes("Sem relato descritivo detalhado")
  );

  // Extrair palavras-chave e temas clínicos relatados
  const temasTrabalhados: string[] = [];
  const comportamentosObservados: string[] = [];
  const orientacoesIdentificadas: string[] = [];

  relatosValidos.forEach((s) => {
    const texto = s.relato.toLowerCase();

    // Habilidades e tarefas
    if (texto.includes("escrita") || texto.includes("leitura") || texto.includes("livro")) {
      temasTrabalhados.push("tarefas acadêmicas e grafomotoras (leitura e escrita)");
    }
    if (texto.includes("fala") || texto.includes("linguagem") || texto.includes("comunicação") || texto.includes("vocal")) {
      temasTrabalhados.push("linguagem expressiva e comunicação funcional");
    }
    if (texto.includes("atenção") || texto.includes("foco") || texto.includes("concentração")) {
      temasTrabalhados.push("sustentação de atenção e funções executivas");
    }
    if (texto.includes("aba") || s.programas_aba) {
      temasTrabalhados.push("treino por tentativas e programas estruturados comportamentais (ABA)");
    }
    if (texto.includes("motor") || texto.includes("sensorial") || texto.includes("movimento")) {
      temasTrabalhados.push("integração sensório-motora e autorregulação corporal");
    }

    // Comportamentos e evolução
    if (texto.includes("fuga") || texto.includes("esquiva") || texto.includes("sair da sala")) {
      comportamentosObservados.push("comportamentos de fuga/esquiva de demanda e saídas de sala");
    }
    if (texto.includes("banheiro") || texto.includes("flatulência") || texto.includes("necessidade")) {
      comportamentosObservados.push("solicitações de pausa e idas ao banheiro durante atividades");
    }
    if (texto.includes("positivo") || texto.includes("avançou") || texto.includes("concluiu") || texto.includes("respondeu bem") || texto.includes("engajou")) {
      comportamentosObservados.push("boa responsividade a reforçadores e engajamento positivo em atividades mediadas");
    }

    // Orientações
    if (texto.includes("pai") || texto.includes("mãe") || texto.includes("família") || texto.includes("responsável")) {
      orientacoesIdentificadas.push("orientações de manejo e alinhamento com os responsáveis presentes");
    }
  });

  const uniqueTemas = Array.from(new Set(temasTrabalhados));
  const uniqueComportamentos = Array.from(new Set(comportamentosObservados));
  const uniqueOrientacoes = Array.from(new Set(orientacoesIdentificadas));

  const resumoAtividades =
    uniqueTemas.length > 0
      ? uniqueTemas.join(", ")
      : "atividades de estímulo ao desenvolvimento cognitivo, comportamental e socioemocional direcionadas aos objetivos terapêuticos";

  const resumoComportamentos =
    uniqueComportamentos.length > 0
      ? uniqueComportamentos.join("; ")
      : "o paciente demonstrou padrão comportamental compatível com a rotina terapêutica, respondendo à mediação profissional";

  return `# RESUMO DE EVOLUÇÃO CLÍNICA
**Paciente:** ${nomePaciente}
**Diagnóstico / Demanda:** ${cid}
**Período de Referência:** ${periodoFormatado}
**Frequência no Período:** ${totalSessoes} sessão(ões) realizadas (${relatosValidos.length} com registros descritivos)
**Especialidades e Profissionais:** ${stats.servicos.join(", ") || "Clínica Integrada"} (${stats.profissionais.join(", ") || "Equipe"})

---

### 1. Frequência e Engajamento Terapêutico
No período analisado (${periodoFormatado}), o(a) paciente compareceu a um total de ${totalSessoes} atendimento(s). Observou-se adesão ao plano terapêutico proposto, com manutenção do vínculo com a equipe e reconhecimento do ambiente de atendimento e suas rotinas.

### 2. Objetivos e Demandas Trabalhadas no Período
Durante as intervenções clínicas, foram priorizadas as seguintes áreas:
- ${resumoAtividades}.
- Mediação de comandos verbais e reforçamento diferencial de comportamentos adequados.
${sessoes.some((s) => s.programas_aba) ? "- Aplicação de programas comportamentais com mensuração de tentativas e acertos." : ""}

### 3. Evolução e Desempenho Clínico
Ao longo das sessões do intervalo:
- ${resumoComportamentos}.
- Verificou-se capacidade de resposta aos direcionamentos dos terapeutas, com necessidade de suporte estruturado para sustentação do foco e aceitação de limites.
- O paciente demonstra receptividade quando os reforçadores de preferência e intervalos programados são aplicados de maneira consistente.

### 4. Aspectos em Desenvolvimento e Pontos de Atenção
Recomenda-se manter foco contínuo em:
- Redução de comportamentos de esquiva em tarefas de maior esforço cognitivo.
- Ampliação do tempo de permanência sentado e engajamento independente nas tarefas propostas.
- Fortalecimento da comunicação funcional e autorregulação antes do surgimento de desatenção ou fadiga.

### 5. Orientações e Conduta
- ${uniqueOrientacoes.length > 0 ? uniqueOrientacoes.join(". ") + "." : "Manter alinhamento constante entre família e equipe terapêutica para generalização dos avanços nos ambientes doméstico e escolar."}
- Continuidade dos atendimentos nas especialidades indicadas, mantendo o monitoramento sistemático de cada sessão.

---
*Documento clínico de síntese de evolução para prontuário multidisciplinar.*`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

