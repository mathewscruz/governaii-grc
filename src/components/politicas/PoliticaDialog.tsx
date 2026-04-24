import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { FileText, ListChecks, ShieldCheck, ScrollText } from 'lucide-react';
import { WizardDialog, WizardTab, WizardTabState } from '@/components/ui/wizard-dialog';
import { WizardSummaryCard, WizardSummaryRow } from '@/components/ui/wizard-summary-card';
import { FieldHelpTooltip } from '@/components/ui/field-help-tooltip';
import { useWizardDraft } from '@/hooks/useWizardDraft';
import { Badge } from '@/components/ui/badge';

interface PoliticaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  politica?: any;
  loading?: boolean;
}

const CATEGORIA_LABELS: Record<string, string> = {
  seguranca: 'Segurança da Informação',
  privacidade: 'Privacidade e Proteção de Dados',
  compliance: 'Compliance',
  rh: 'Recursos Humanos',
  ti: 'Tecnologia da Informação',
  operacional: 'Operacional',
  outra: 'Outra',
};

export function PoliticaDialog({ open, onOpenChange, onSave, politica, loading }: PoliticaDialogProps) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('seguranca');
  const [conteudo, setConteudo] = useState('');
  const [requerAceite, setRequerAceite] = useState(true);
  const [requerQuestionario, setRequerQuestionario] = useState(false);
  const [notaMinima, setNotaMinima] = useState(70);
  const [activeTab, setActiveTab] = useState('identificacao');
  const [initialSnapshot, setInitialSnapshot] = useState<string>('');

  useEffect(() => {
    if (politica) {
      setTitulo(politica.titulo || '');
      setDescricao(politica.descricao || '');
      setCategoria(politica.categoria || 'seguranca');
      setConteudo(politica.conteudo || '');
      setRequerAceite(politica.requer_aceite ?? true);
      setRequerQuestionario(politica.requer_questionario ?? false);
      setNotaMinima(politica.nota_minima_aprovacao || 70);
    } else {
      setTitulo('');
      setDescricao('');
      setCategoria('seguranca');
      setConteudo('');
      setRequerAceite(true);
      setRequerQuestionario(false);
      setNotaMinima(70);
    }
    setActiveTab('identificacao');
  }, [politica, open]);

  // Snapshot to detect dirty state
  useEffect(() => {
    if (open) {
      setInitialSnapshot(
        JSON.stringify({ titulo, descricao, categoria, conteudo, requerAceite, requerQuestionario, notaMinima })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const currentValues = { titulo, descricao, categoria, conteudo, requerAceite, requerQuestionario, notaMinima };
  const isDirty = JSON.stringify(currentValues) !== initialSnapshot;

  const { hasDraft, savedAt, loadDraft, clearDraft } = useWizardDraft({
    storageKey: 'politica',
    recordId: politica?.id,
    values: currentValues,
    enabled: open,
  });

  // Restore draft offer (auto-restore on first open without record)
  useEffect(() => {
    if (open && !politica && hasDraft) {
      const draft = loadDraft();
      if (draft) {
        setTitulo(draft.titulo ?? '');
        setDescricao(draft.descricao ?? '');
        setCategoria(draft.categoria ?? 'seguranca');
        setConteudo(draft.conteudo ?? '');
        setRequerAceite(draft.requerAceite ?? true);
        setRequerQuestionario(draft.requerQuestionario ?? false);
        setNotaMinima(draft.notaMinima ?? 70);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSave = () => {
    if (!titulo.trim()) {
      setActiveTab('identificacao');
      return;
    }
    onSave({
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      categoria,
      conteudo: conteudo.trim() || null,
      requer_aceite: requerAceite,
      requer_questionario: requerQuestionario,
      nota_minima_aprovacao: notaMinima,
    });
    clearDraft();
  };

  // Tab states
  const identState: WizardTabState = titulo.trim() ? 'complete' : 'pending';
  const conteudoState: WizardTabState = conteudo.trim().length > 50 ? 'complete' : conteudo.trim() ? 'partial' : 'pending';
  const validacaoState: WizardTabState = requerAceite || requerQuestionario ? 'complete' : 'partial';

  const tabs: WizardTab[] = useMemo(
    () => [
      {
        id: 'identificacao',
        label: 'Identificação',
        icon: FileText,
        state: identState,
        hint: 'Título e categoria',
        content: (
          <div className="space-y-5 max-w-2xl">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Título <span className="text-destructive">*</span>
                <FieldHelpTooltip content="Nome curto e descritivo da política. Ex: Política de Senhas" />
              </Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Nome da política" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Breve descrição do propósito desta política"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Categoria
                <FieldHelpTooltip content="Área ou domínio ao qual a política se aplica." />
              </Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIA_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ),
      },
      {
        id: 'conteudo',
        label: 'Conteúdo',
        icon: ScrollText,
        state: conteudoState,
        hint: 'Texto integral',
        content: (
          <div className="space-y-2 max-w-3xl">
            <Label className="flex items-center gap-1">
              Conteúdo da Política
              <FieldHelpTooltip content="Texto completo. Use parágrafos curtos e objetivos. Recomendamos pelo menos 50 caracteres." />
            </Label>
            <Textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="Texto completo da política..."
              rows={18}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {conteudo.length} caracteres
            </p>
          </div>
        ),
      },
      {
        id: 'validacao',
        label: 'Validação',
        icon: ShieldCheck,
        state: validacaoState,
        hint: 'Aceite e questionário',
        content: (
          <div className="space-y-5 max-w-2xl">
            <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
              <div className="space-y-1">
                <Label className="flex items-center gap-1">
                  Requer Aceite
                  <FieldHelpTooltip content="Usuários precisam confirmar leitura da política." />
                </Label>
                <p className="text-xs text-muted-foreground">
                  Cada usuário precisará marcar que leu e concorda com a política.
                </p>
              </div>
              <Switch checked={requerAceite} onCheckedChange={setRequerAceite} />
            </div>

            <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
              <div className="space-y-1">
                <Label className="flex items-center gap-1">
                  Questionário de Validação
                  <FieldHelpTooltip content="Após a leitura, o usuário responde perguntas para comprovar que entendeu o conteúdo." />
                </Label>
                <p className="text-xs text-muted-foreground">
                  Perguntas após a leitura para validar a compreensão do conteúdo.
                </p>
              </div>
              <Switch checked={requerQuestionario} onCheckedChange={setRequerQuestionario} />
            </div>

            {requerQuestionario && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Nota Mínima para Aprovação (%)
                  <FieldHelpTooltip content="Percentual mínimo de acertos no questionário para considerar a política como compreendida." />
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={notaMinima}
                  onChange={(e) => setNotaMinima(Number(e.target.value))}
                />
              </div>
            )}
          </div>
        ),
      },
    ],
    [titulo, descricao, categoria, conteudo, requerAceite, requerQuestionario, notaMinima, identState, conteudoState, validacaoState]
  );

  const summary = (
    <WizardSummaryCard title="Resumo da Política">
      <WizardSummaryRow label="Título" value={titulo || <span className="text-muted-foreground italic">Sem título</span>} highlight />
      <WizardSummaryRow label="Categoria" value={CATEGORIA_LABELS[categoria]} />
      <WizardSummaryRow
        label="Conteúdo"
        value={
          conteudo
            ? <Badge variant="outline" className="text-[10px]">{conteudo.length} chars</Badge>
            : <span className="text-muted-foreground italic">Vazio</span>
        }
      />
      <WizardSummaryRow
        label="Aceite obrigatório"
        value={requerAceite ? <Badge variant="default" className="text-[10px]">Sim</Badge> : <span className="text-muted-foreground">Não</span>}
      />
      <WizardSummaryRow
        label="Questionário"
        value={requerQuestionario ? <Badge variant="default" className="text-[10px]">{notaMinima}% mín.</Badge> : <span className="text-muted-foreground">Não</span>}
      />
    </WizardSummaryCard>
  );

  const draftLabel = !politica && hasDraft && savedAt
    ? `Rascunho salvo às ${new Date(savedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    : undefined;

  return (
    <WizardDialog
      open={open}
      onOpenChange={onOpenChange}
      title={politica ? 'Editar Política' : 'Nova Política'}
      description="Defina título, conteúdo e regras de validação."
      icon={ListChecks}
      tabs={tabs}
      summary={summary}
      activeTab={activeTab}
      onActiveTabChange={setActiveTab}
      onSubmit={handleSave}
      submitLabel={politica ? 'Salvar' : 'Criar'}
      isSubmitting={loading}
      submitDisabled={!titulo.trim() || loading}
      isDirty={isDirty}
      draftLabel={draftLabel}
      size="lg"
    />
  );
}
