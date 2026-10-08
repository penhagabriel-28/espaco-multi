import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ContaRecorrente,
  CONTAS_RECORRENTES_DEFAULT,
  brl,
} from "@/lib/despesasRecorrentes";
import {
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Building2,
  Calendar,
  DollarSign,
  Layers,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

interface GerenciarContasRecorrentesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contas: ContaRecorrente[];
  onSave: (novasContas: ContaRecorrente[]) => void;
}

export function GerenciarContasRecorrentesDialog({
  open,
  onOpenChange,
  contas,
  onSave,
}: GerenciarContasRecorrentesDialogProps) {
  const [lista, setLista] = useState<ContaRecorrente[]>(contas);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states for creating / editing
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"fixo" | "variavel">("fixo");
  const [valorPadrao, setValorPadrao] = useState("");
  const [categoria, setCategoria] = useState("Outros");
  const [diaVencimento, setDiaVencimento] = useState("10");
  const [isEmprestimo, setIsEmprestimo] = useState(false);
  const [totalParcelas, setTotalParcelas] = useState("36");
  const [parcelaBase, setParcelaBase] = useState("28");
  const [mesBase, setMesBase] = useState("2026-06");
  const [valorParcela, setValorParcela] = useState("417");
  const [observacoes, setObservacoes] = useState("");

  const resetForm = () => {
    setEditingId(null);
    setNome("");
    setTipo("fixo");
    setValorPadrao("");
    setCategoria("Outros");
    setDiaVencimento("10");
    setIsEmprestimo(false);
    setTotalParcelas("36");
    setParcelaBase("28");
    setMesBase("2026-06");
    setValorParcela("417");
    setObservacoes("");
  };

  const handleStartEdit = (conta: ContaRecorrente) => {
    setEditingId(conta.id);
    setNome(conta.nome);
    setTipo(conta.tipo);
    setValorPadrao(conta.valorPadrao > 0 ? String(conta.valorPadrao) : "");
    setCategoria(conta.categoria || "Outros");
    setDiaVencimento(String(conta.diaVencimento || 10));
    setIsEmprestimo(!!conta.isEmprestimo);
    setTotalParcelas(String(conta.totalParcelas || 36));
    setParcelaBase(String(conta.parcelaBase ?? 28));
    setMesBase(conta.mesBase || "2026-06");
    setValorParcela(String(conta.valorParcela || conta.valorPadrao || 417));
    setObservacoes(conta.observacoes || "");
  };

  const handleSaveConta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("Informe o nome da conta recorrente.");
      return;
    }

    const valNum = parseFloat(valorPadrao.replace(",", ".")) || 0;
    const diaNum = parseInt(diaVencimento, 10) || 10;
    const totParcNum = parseInt(totalParcelas, 10) || 36;
    const parcBaseNum = parseInt(parcelaBase, 10) || 28;
    const valParcNum = parseFloat(valorParcela.replace(",", ".")) || valNum || 417;

    if (tipo === "fixo" && valNum <= 0 && !isEmprestimo) {
      toast.error("Para contas fixas, informe um valor padrão válido.");
      return;
    }

    const contaAtualizada: ContaRecorrente = {
      id: editingId || `custom_${Date.now()}`,
      nome: nome.trim(),
      tipo,
      valorPadrao: tipo === "fixo" ? (isEmprestimo ? valParcNum : valNum) : 0,
      categoria,
      diaVencimento: diaNum,
      ativo: true,
      isEmprestimo,
      totalParcelas: isEmprestimo ? totParcNum : undefined,
      parcelaBase: isEmprestimo ? parcBaseNum : undefined,
      mesBase: isEmprestimo ? mesBase : undefined,
      valorParcela: isEmprestimo ? valParcNum : undefined,
      observacoes: observacoes.trim() || undefined,
    };

    let novaLista: ContaRecorrente[];
    if (editingId) {
      novaLista = lista.map((c) => (c.id === editingId ? contaAtualizada : c));
      toast.success(`Conta "${contaAtualizada.nome}" atualizada!`);
    } else {
      novaLista = [...lista, contaAtualizada];
      toast.success(`Conta "${contaAtualizada.nome}" adicionada!`);
    }

    setLista(novaLista);
    onSave(novaLista);
    resetForm();
  };

  const handleDelete = (id: string) => {
    const item = lista.find((c) => c.id === id);
    const novaLista = lista.filter((c) => c.id !== id);
    setLista(novaLista);
    onSave(novaLista);
    if (editingId === id) resetForm();
    toast.success(`Conta "${item?.nome || ""}" excluída com sucesso!`);
  };

  const handleToggleAtivo = (id: string, ativo: boolean) => {
    const novaLista = lista.map((c) => (c.id === id ? { ...c, ativo } : c));
    setLista(novaLista);
    onSave(novaLista);
  };

  const handleRestaurarPadrao = () => {
    setLista(CONTAS_RECORRENTES_DEFAULT);
    onSave(CONTAS_RECORRENTES_DEFAULT);
    resetForm();
    toast.success("Contas recorrentes restauradas para o padrão da clínica!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                Gerenciar Contas Recorrentes
              </DialogTitle>
              <DialogDescription className="text-xs">
                Defina quais contas fixas e variáveis aparecem automaticamente a cada mês para
                previsão financeira.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Form for Add/Edit */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                {editingId ? (
                  <>
                    <Pencil className="h-4 w-4 text-primary" /> Editar Conta: {nome || "..."}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 text-primary" /> Nova Conta Recorrente
                  </>
                )}
              </span>
              {editingId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={resetForm}
                >
                  Cancelar Edição
                </Button>
              )}
            </div>

            <form onSubmit={handleSaveConta} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="rec-nome" className="text-xs font-medium">
                    Nome da Conta *
                  </Label>
                  <Input
                    id="rec-nome"
                    placeholder="Ex: Aluguel, Energia, Contador..."
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rec-tipo" className="text-xs font-medium">
                    Tipo de Despesa *
                  </Label>
                  <Select
                    value={tipo}
                    onValueChange={(val: "fixo" | "variavel") => setTipo(val)}
                  >
                    <SelectTrigger id="rec-tipo" className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixo">Fixo (Valor pré-definido)</SelectItem>
                      <SelectItem value="variavel">Variável (Sem valor pré-definido)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {tipo === "fixo" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="rec-val" className="text-xs font-medium">
                      Valor Previsto (R$) *
                    </Label>
                    <Input
                      id="rec-val"
                      placeholder="0,00"
                      value={valorPadrao}
                      onChange={(e) => setValorPadrao(e.target.value)}
                      required={!isEmprestimo}
                      className="h-9 text-sm"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="rec-cat" className="text-xs font-medium">
                    Categoria
                  </Label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger id="rec-cat" className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aluguel">Aluguel / Condomínio</SelectItem>
                      <SelectItem value="Salários">Salários / Honorários</SelectItem>
                      <SelectItem value="Impostos">Impostos / Taxas</SelectItem>
                      <SelectItem value="Materiais">Materiais / Escritório</SelectItem>
                      <SelectItem value="Limpeza">Limpeza / Conservação</SelectItem>
                      <SelectItem value="Utilidades">Água / Luz / Internet</SelectItem>
                      <SelectItem value="Marketing">Marketing / Divulgação</SelectItem>
                      <SelectItem value="Outros">Outros Gastos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rec-dia" className="text-xs font-medium">
                    Dia Vencimento Sugerido
                  </Label>
                  <Input
                    id="rec-dia"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="10"
                    value={diaVencimento}
                    onChange={(e) => setDiaVencimento(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {/* Empréstimo Switch & Extra Fields */}
              <div className="rounded-lg border bg-background/60 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="switch-emprestimo" className="text-xs font-semibold cursor-pointer">
                      É Empréstimo / Financiamento com Parcelas?
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Calcula automaticamente qual parcela está pagando no mês e quantas faltam.
                    </p>
                  </div>
                  <Switch
                    id="switch-emprestimo"
                    checked={isEmprestimo}
                    onCheckedChange={setIsEmprestimo}
                  />
                </div>

                {isEmprestimo && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t">
                    <div className="space-y-1">
                      <Label className="text-[11px]">Total Parcelas</Label>
                      <Input
                        type="number"
                        value={totalParcelas}
                        onChange={(e) => setTotalParcelas(e.target.value)}
                        className="h-8 text-xs"
                        placeholder="36"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Parcela Base</Label>
                      <Input
                        type="number"
                        value={parcelaBase}
                        onChange={(e) => setParcelaBase(e.target.value)}
                        className="h-8 text-xs"
                        placeholder="28"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Mês Base (AAAA-MM)</Label>
                      <Input
                        type="text"
                        value={mesBase}
                        onChange={(e) => setMesBase(e.target.value)}
                        className="h-8 text-xs"
                        placeholder="2026-06"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Valor Parcela (R$)</Label>
                      <Input
                        type="text"
                        value={valorParcela}
                        onChange={(e) => setValorParcela(e.target.value)}
                        className="h-8 text-xs"
                        placeholder="417,00"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetForm}
                    className="h-8 text-xs"
                  >
                    Cancelar
                  </Button>
                )}
                <Button type="submit" size="sm" className="h-8 text-xs font-semibold">
                  {editingId ? "Salvar Alterações" : "+ Adicionar à Lista"}
                </Button>
              </div>
            </form>
          </div>

          {/* List of current accounts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Contas Recorrentes Cadastradas ({lista.length})
              </h4>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Restaurar Padrões
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Restaurar contas para o padrão?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso redefinirá a lista para as contas padrões da clínica (Aluguel,
                      Empréstimo, Contador, Energia, Imposto, Pagamento de Pessoal, Supermercado).
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRestaurarPadrao}>
                      Restaurar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="divide-y rounded-xl border bg-card overflow-hidden">
              {lista.map((c) => (
                <div
                  key={c.id}
                  className={`flex flex-wrap items-center justify-between gap-3 p-3 transition-colors ${
                    !c.ativo ? "opacity-60 bg-muted/30" : "hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={c.ativo}
                      onCheckedChange={(checked) => handleToggleAtivo(c.id, checked)}
                      title={c.ativo ? "Ativa (visível)" : "Inativa (oculta)"}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{c.nome}</span>
                        <Badge
                          variant={c.tipo === "fixo" ? "default" : "secondary"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {c.tipo === "fixo" ? "Fixo" : "Variável"}
                        </Badge>
                        {c.isEmprestimo && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-600 dark:text-amber-400">
                            Empréstimo ({c.totalParcelas}x)
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span>Cat: {c.categoria}</span>
                        <span>•</span>
                        <span>Vencimento dia {c.diaVencimento || 10}</span>
                        {c.tipo === "fixo" && (
                          <>
                            <span>•</span>
                            <span className="font-medium text-foreground">
                              {brl(c.valorPadrao)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-auto">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleStartEdit(c)}
                      title="Editar Conta"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Excluir Conta"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir conta recorrente?</AlertDialogTitle>
                          <AlertDialogDescription>
                            A conta "{c.nome}" será removida da previsão mensal de despesas.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(c.id)}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-muted/10">
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Concluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
