import { useState } from "react";
import { format, addDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pencil,
  CheckCircle2,
  Calendar,
  User,
  FileText,
  DollarSign,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface BatchEditRelatoriosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  activeProfessionals: any[];
  tiposDocumento: any[];
  onSuccess: () => void;
}

export function BatchEditRelatoriosDialog({
  open,
  onOpenChange,
  selectedIds,
  activeProfessionals,
  tiposDocumento,
  onSuccess,
}: BatchEditRelatoriosDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field toggles
  const [applyProfissional, setApplyProfissional] = useState(false);
  const [profissionalId, setProfissionalId] = useState<string>("none");

  const [applyTipoDoc, setApplyTipoDoc] = useState(false);
  const [tipoDocId, setTipoDocId] = useState<string>("");

  const [applyDataSolicitacao, setApplyDataSolicitacao] = useState(false);
  const [dataSolicitacao, setDataSolicitacao] = useState(() => format(new Date(), "yyyy-MM-dd"));

  const [applyDataLimite, setApplyDataLimite] = useState(false);
  const [dataLimite, setDataLimite] = useState(() => format(addDays(new Date(), 10), "yyyy-MM-dd"));

  const [applyEntrega, setApplyEntrega] = useState(false);
  const [entregaAction, setEntregaAction] = useState<"hoje" | "data" | "remover">("hoje");
  const [dataEntregaCustom, setDataEntregaCustom] = useState(() => format(new Date(), "yyyy-MM-dd"));

  const [applyMesesRef, setApplyMesesRef] = useState(false);
  const [mesesRef, setMesesRef] = useState(() => format(new Date(), "yyyy-MM"));

  const [applyValor, setApplyValor] = useState(false);
  const [valorTotal, setValorTotal] = useState("");

  const [applyObservacoes, setApplyObservacoes] = useState(false);
  const [observacoesMode, setObservacoesMode] = useState<"replace" | "append">("append");
  const [observacoesText, setObservacoesText] = useState("");

  const hasAnyFieldSelected =
    applyProfissional ||
    applyTipoDoc ||
    applyDataSolicitacao ||
    applyDataLimite ||
    applyEntrega ||
    applyMesesRef ||
    applyValor ||
    applyObservacoes;

  const handleResetForm = () => {
    setApplyProfissional(false);
    setProfissionalId("none");
    setApplyTipoDoc(false);
    setTipoDocId("");
    setApplyDataSolicitacao(false);
    setApplyDataLimite(false);
    setApplyEntrega(false);
    setEntregaAction("hoje");
    setApplyMesesRef(false);
    setApplyValor(false);
    setValorTotal("");
    setApplyObservacoes(false);
    setObservacoesMode("append");
    setObservacoesText("");
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      toast.error("Nenhuma solicitação selecionada.");
      return;
    }

    if (!hasAnyFieldSelected) {
      toast.error("Ative ao menos um campo para aplicar as alterações em lote.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Build common update payload
      const commonPayload: Record<string, any> = {};

      if (applyProfissional) {
        commonPayload.profissional_id = profissionalId === "none" ? null : profissionalId;
      }

      if (applyTipoDoc && tipoDocId) {
        commonPayload.tipo_documento_id = tipoDocId;
      }

      if (applyDataSolicitacao && dataSolicitacao) {
        commonPayload.data_solicitacao = dataSolicitacao;
      }

      if (applyDataLimite && dataLimite) {
        commonPayload.data_limite = dataLimite;
      }

      if (applyEntrega) {
        if (entregaAction === "hoje") {
          commonPayload.data_entrega = format(new Date(), "yyyy-MM-dd");
        } else if (entregaAction === "data" && dataEntregaCustom) {
          commonPayload.data_entrega = dataEntregaCustom;
        } else if (entregaAction === "remover") {
          commonPayload.data_entrega = null;
        }
      }

      if (applyMesesRef && mesesRef) {
        commonPayload.meses_referencia = mesesRef;
      }

      if (applyValor) {
        const valNum = Number(valorTotal.replace(",", "."));
        commonPayload.valor_total = isNaN(valNum) || valNum <= 0 ? null : valNum;
      }

      if (applyObservacoes && observacoesMode === "replace") {
        commonPayload.observacoes = observacoesText.trim() || null;
      }

      // If append mode for observacoes is requested, we need to read current observacoes per record
      if (applyObservacoes && observacoesMode === "append" && observacoesText.trim()) {
        const { data: existingRows } = await supabase
          .from("controle_relatorios")
          .select("id, observacoes")
          .in("id", selectedIds);

        for (const row of existingRows || []) {
          const rowPayload = { ...commonPayload };
          const currentObs = row.observacoes ? row.observacoes.trim() : "";
          const appended = currentObs
            ? `${currentObs}\n${observacoesText.trim()}`
            : observacoesText.trim();
          rowPayload.observacoes = appended;

          let res = await supabase
            .from("controle_relatorios")
            .update(rowPayload)
            .eq("id", row.id);

          if (
            res.error &&
            (res.error.message?.includes("responsavel_email") ||
              res.error.message?.includes("responsavel_endereco") ||
              res.error.message?.includes("meses_referencia"))
          ) {
            delete rowPayload.meses_referencia;
            res = await supabase
              .from("controle_relatorios")
              .update(rowPayload)
              .eq("id", row.id);
          }

          if (res.error) throw res.error;
        }
      } else {
        // Direct batch update with PostgREST in("id", selectedIds)
        let res = await supabase
          .from("controle_relatorios")
          .update(commonPayload)
          .in("id", selectedIds);

        if (
          res.error &&
          (res.error.message?.includes("responsavel_email") ||
            res.error.message?.includes("responsavel_endereco") ||
            res.error.message?.includes("meses_referencia"))
        ) {
          delete commonPayload.meses_referencia;
          res = await supabase
            .from("controle_relatorios")
            .update(commonPayload)
            .in("id", selectedIds);
        }

        if (res.error) throw res.error;
      }

      toast.success(
        `${selectedIds.length} ${
          selectedIds.length === 1 ? "solicitação atualizada" : "solicitações atualizadas"
        } com sucesso!`
      );
      handleResetForm();
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error("Erro ao atualizar em lote:", err);
      toast.error("Erro ao atualizar solicitações em lote: " + (err.message || "Tente novamente"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) handleResetForm();
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-[620px] max-h-[92vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b bg-card">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                Editar Solicitações em Lote
                <Badge variant="secondary" className="font-semibold text-xs px-2 py-0.5">
                  {selectedIds.length} {selectedIds.length === 1 ? "selecionada" : "selecionadas"}
                </Badge>
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ative apenas os campos que deseja alterar em lote para todos os registros selecionados.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(92vh-180px)] scrollbar-thin">
          {/* Field 1: Profissional */}
          <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2.5 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <Label htmlFor="toggle-prof" className="font-semibold text-sm cursor-pointer">
                  Profissional Atribuído
                </Label>
              </div>
              <Switch
                id="toggle-prof"
                checked={applyProfissional}
                onCheckedChange={setApplyProfissional}
              />
            </div>

            {applyProfissional && (
              <div className="pt-2 border-t space-y-1.5 animate-in fade-in duration-200">
                <Select value={profissionalId} onValueChange={setProfissionalId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground italic">Nenhum (Não atribuído)</span>
                    </SelectItem>
                    {activeProfessionals.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Selecione o profissional para assumir todas as solicitações selecionadas.
                </p>
              </div>
            )}
          </div>

          {/* Field 2: Tipo de Documento */}
          <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2.5 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <Label htmlFor="toggle-tipo" className="font-semibold text-sm cursor-pointer">
                  Tipo de Documento
                </Label>
              </div>
              <Switch
                id="toggle-tipo"
                checked={applyTipoDoc}
                onCheckedChange={setApplyTipoDoc}
              />
            </div>

            {applyTipoDoc && (
              <div className="pt-2 border-t space-y-1.5 animate-in fade-in duration-200">
                <Select value={tipoDocId} onValueChange={setTipoDocId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione o tipo de documento" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposDocumento.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Field 3: Datas (Solicitação e Prazo) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2.5 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <Label htmlFor="toggle-datasol" className="font-semibold text-sm cursor-pointer">
                    Data da Solicitação
                  </Label>
                </div>
                <Switch
                  id="toggle-datasol"
                  checked={applyDataSolicitacao}
                  onCheckedChange={setApplyDataSolicitacao}
                />
              </div>

              {applyDataSolicitacao && (
                <div className="pt-2 border-t space-y-1.5 animate-in fade-in duration-200">
                  <Input
                    type="date"
                    value={dataSolicitacao}
                    onChange={(e) => setDataSolicitacao(e.target.value)}
                    className="h-9"
                  />
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2.5 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <Label htmlFor="toggle-datalimite" className="font-semibold text-sm cursor-pointer">
                    Prazo Limite
                  </Label>
                </div>
                <Switch
                  id="toggle-datalimite"
                  checked={applyDataLimite}
                  onCheckedChange={setApplyDataLimite}
                />
              </div>

              {applyDataLimite && (
                <div className="pt-2 border-t space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="date"
                      value={dataLimite}
                      onChange={(e) => setDataLimite(e.target.value)}
                      className="h-9"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDataLimite(format(addDays(new Date(), 10), "yyyy-MM-dd"))}
                      className="h-9 text-[11px] whitespace-nowrap px-2"
                      title="+10 dias a partir de hoje"
                    >
                      +10d
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Field 4: Status / Data de Entrega */}
          <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2.5 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <Label htmlFor="toggle-entrega" className="font-semibold text-sm cursor-pointer">
                  Status de Conclusão / Entrega
                </Label>
              </div>
              <Switch
                id="toggle-entrega"
                checked={applyEntrega}
                onCheckedChange={setApplyEntrega}
              />
            </div>

            {applyEntrega && (
              <div className="pt-2 border-t space-y-3 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={entregaAction === "hoje" ? "default" : "outline"}
                    onClick={() => setEntregaAction("hoje")}
                    className="text-xs h-8"
                  >
                    Entregue Hoje
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={entregaAction === "data" ? "default" : "outline"}
                    onClick={() => setEntregaAction("data")}
                    className="text-xs h-8"
                  >
                    Outra Data
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={entregaAction === "remover" ? "default" : "outline"}
                    onClick={() => setEntregaAction("remover")}
                    className="text-xs h-8 text-rose-600 hover:text-rose-700"
                  >
                    Desmarcar Entrega
                  </Button>
                </div>

                {entregaAction === "data" && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Data em que foi entregue:</Label>
                    <Input
                      type="date"
                      value={dataEntregaCustom}
                      onChange={(e) => setDataEntregaCustom(e.target.value)}
                      className="h-9"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Field 5: Mês de Referência & Valor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2.5 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <Label htmlFor="toggle-mesref" className="font-semibold text-sm cursor-pointer">
                    Mês de Referência
                  </Label>
                </div>
                <Switch
                  id="toggle-mesref"
                  checked={applyMesesRef}
                  onCheckedChange={setApplyMesesRef}
                />
              </div>

              {applyMesesRef && (
                <div className="pt-2 border-t space-y-1.5 animate-in fade-in duration-200">
                  <Input
                    type="month"
                    value={mesesRef}
                    onChange={(e) => setMesesRef(e.target.value)}
                    className="h-9"
                  />
                  <p className="text-[11px] text-muted-foreground">Ex: 2026-09 (Setembro/2026)</p>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2.5 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <Label htmlFor="toggle-valor" className="font-semibold text-sm cursor-pointer">
                    Valor Total (R$)
                  </Label>
                </div>
                <Switch
                  id="toggle-valor"
                  checked={applyValor}
                  onCheckedChange={setApplyValor}
                />
              </div>

              {applyValor && (
                <div className="pt-2 border-t space-y-1.5 animate-in fade-in duration-200">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={valorTotal}
                    onChange={(e) => setValorTotal(e.target.value)}
                    className="h-9 font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Field 6: Observações */}
          <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2.5 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <Label htmlFor="toggle-obs" className="font-semibold text-sm cursor-pointer">
                  Observações
                </Label>
              </div>
              <Switch
                id="toggle-obs"
                checked={applyObservacoes}
                onCheckedChange={setApplyObservacoes}
              />
            </div>

            {applyObservacoes && (
              <div className="pt-2 border-t space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={observacoesMode === "append" ? "default" : "outline"}
                    onClick={() => setObservacoesMode("append")}
                    className="text-xs h-7"
                  >
                    Acrescentar ao final
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={observacoesMode === "replace" ? "default" : "outline"}
                    onClick={() => setObservacoesMode("replace")}
                    className="text-xs h-7"
                  >
                    Substituir texto
                  </Button>
                </div>

                <Textarea
                  value={observacoesText}
                  onChange={(e) => setObservacoesText(e.target.value)}
                  placeholder={
                    observacoesMode === "append"
                      ? "Texto para adicionar às observações existentes..."
                      : "Novo texto para substituir as observações..."
                  }
                  className="min-h-[70px] text-xs"
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            {!hasAnyFieldSelected ? (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-3.5 w-3.5" />
                Ative ao menos um campo acima para aplicar.
              </span>
            ) : (
              <span>
                Pronto para atualizar <strong>{selectedIds.length}</strong> itens.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              disabled={!hasAnyFieldSelected || isSubmitting}
              className="gap-1.5 font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Atualizando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Aplicar em Lote ({selectedIds.length})
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
