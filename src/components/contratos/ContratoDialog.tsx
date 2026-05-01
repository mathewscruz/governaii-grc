import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { FileSignature, DollarSign, Calendar, FileText, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useIntegrationNotify } from '@/hooks/useIntegrationNotify';
import { WizardDialog, WizardTab, WizardTabState } from '@/components/ui/wizard-dialog';
import { WizardSummaryCard, WizardSummaryRow } from '@/components/ui/wizard-summary-card';
import { FieldHelpTooltip } from '@/components/ui/field-help-tooltip';
import { useWizardDraft } from '@/hooks/useWizardDraft';
import { logger } from '@/lib/logger';
import { formatStatus } from '@/lib/text-utils';

interface Contrato {
  id: string;
  numero_contrato: string; nome: string; tipo: string; status: string;
  valor: number; moeda: string; data_inicio: string; data_fim: string; data_assinatura: string;
  renovacao_automatica: boolean; prazo_renovacao: number; fornecedor_id: string;
  gestor_contrato: string; area_solicitante: string; objeto: string; observacoes: string;
  clausulas_especiais: string; penalidades: string; sla_principal: string; confidencial: boolean;
}
interface Fornecedor { id: string; nome: string; }

interface ContratoDialogProps {
  contrato: Contrato | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  fornecedores: Fornecedor[];
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ativo: 'default', rascunho: 'outline', encerrado: 'secondary', cancelado: 'destructive',
};

const BLANK = {
  numero_contrato: '', nome: '', tipo: 'servicos', status: 'rascunho', valor: '', moeda: 'BRL',
  data_inicio: '', data_fim: '', data_assinatura: '', renovacao_automatica: false, prazo_renovacao: '30',
  fornecedor_id: '', gestor_contrato: '', area_solicitante: '', objeto: '', observacoes: '',
  clausulas_especiais: '', penalidades: '', sla_principal: '', confidencial: false,
};

export function ContratoDialog({ contrato, open, onOpenChange, onSuccess, fornecedores }: ContratoDialogProps) {
  const [formData, setFormData] = useState(BLANK);
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('identificacao');
  const [initialSnapshot, setInitialSnapshot] = useState('');
  const { toast } = useToast();
  const { notify } = useIntegrationNotify();

  useEffect(() => {
    if (open) {
      fetchUsuarios();
      const next = contrato
        ? {
            numero_contrato: contrato.numero_contrato || '', nome: contrato.nome || '',
            tipo: contrato.tipo || 'servicos', status: contrato.status || 'rascunho',
            valor: contrato.valor?.toString() || '', moeda: contrato.moeda || 'BRL',
            data_inicio: contrato.data_inicio || '', data_fim: contrato.data_fim || '',
            data_assinatura: contrato.data_assinatura || '',
            renovacao_automatica: contrato.renovacao_automatica || false,
            prazo_renovacao: contrato.prazo_renovacao?.toString() || '30',
            fornecedor_id: contrato.fornecedor_id || '', gestor_contrato: contrato.gestor_contrato || '',
            area_solicitante: contrato.area_solicitante || '', objeto: contrato.objeto || '',
            observacoes: contrato.observacoes || '', clausulas_especiais: contrato.clausulas_especiais || '',
            penalidades: contrato.penalidades || '', sla_principal: contrato.sla_principal || '',
            confidencial: contrato.confidencial || false,
          }
        : BLANK;
      setFormData(next);
      setInitialSnapshot(JSON.stringify(next));
      setActiveTab('identificacao');
    }
  }, [contrato, open]);

  const isDirty = JSON.stringify(formData) !== initialSnapshot;
  const update = (patch: Partial<typeof BLANK>) => setFormData((p) => ({ ...p, ...patch }));

  const { hasDraft, savedAt, loadDraft, clearDraft } = useWizardDraft({
    storageKey: 'contrato', recordId: contrato?.id, values: formData, enabled: open,
  });

  useEffect(() => {
    if (open && !contrato && hasDraft) {
      const d = loadDraft();
      if (d) setFormData(d as typeof BLANK);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('user_id, nome').eq('ativo', true).order('nome');
      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) { logger.error('Erro ao carregar usuários:', error); }
  };

  const handleSubmit = async () => {
    if (!formData.nome || !formData.numero_contrato || !formData.fornecedor_id) {
      setActiveTab('identificacao');
      toast({ title: "Erro", description: "Preencha número, nome e fornecedor.", variant: "destructive" });
      return;
    }
    if (formData.data_inicio && formData.data_fim && new Date(formData.data_inicio) > new Date(formData.data_fim)) {
      setActiveTab('financeiro');
      toast({ title: "Erro", description: "Data início deve ser anterior à data fim.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('empresa_id').eq('user_id', user?.id).single();

      const contratoData = {
        numero_contrato: formData.numero_contrato, nome: formData.nome, tipo: formData.tipo,
        status: formData.status, valor: formData.valor ? parseFloat(formData.valor) : null,
        moeda: formData.moeda, data_inicio: formData.data_inicio || null,
        data_fim: formData.data_fim || null, data_assinatura: formData.data_assinatura || null,
        renovacao_automatica: formData.renovacao_automatica,
        prazo_renovacao: formData.prazo_renovacao ? parseInt(formData.prazo_renovacao) : null,
        fornecedor_id: formData.fornecedor_id, gestor_contrato: formData.gestor_contrato || null,
        area_solicitante: formData.area_solicitante, objeto: formData.objeto,
        observacoes: formData.observacoes, clausulas_especiais: formData.clausulas_especiais,
        penalidades: formData.penalidades, sla_principal: formData.sla_principal,
        confidencial: formData.confidencial, empresa_id: profile?.empresa_id, created_by: user?.id,
      };

      const { error } = contrato
        ? await supabase.from('contratos').update(contratoData).eq('id', contrato.id)
        : await supabase.from('contratos').insert([contratoData]);
      if (error) throw error;

      if (!contrato) {
        notify('contrato_criado', {
          titulo: `Novo contrato: ${formData.nome}`, descricao: formData.objeto,
          link: `${window.location.origin}/contratos`,
          dados: { tipo: formData.tipo, numero: formData.numero_contrato },
        });
      }

      toast({ title: "Sucesso", description: `Contrato ${contrato ? 'atualizado' : 'criado'} com sucesso` });
      clearDraft();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      logger.error('Erro ao salvar contrato:', error);
      toast({ title: "Erro", description: "Erro ao salvar contrato", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const identState: WizardTabState =
    formData.numero_contrato && formData.nome && formData.fornecedor_id ? 'complete' : 'pending';
  const finanState: WizardTabState = formData.valor || formData.data_inicio ? 'complete' : 'pending';
  const condState: WizardTabState = formData.objeto || formData.sla_principal ? 'complete' : 'pending';
  const govState: WizardTabState = formData.gestor_contrato || formData.area_solicitante ? 'complete' : 'pending';

  const fornecedorNome = fornecedores.find((f) => f.id === formData.fornecedor_id)?.nome;

  const tabs: WizardTab[] = useMemo(() => [
    {
      id: 'identificacao', label: 'Identificação', icon: FileSignature, state: identState, hint: 'Número, fornecedor, tipo',
      content: (
        <div className="space-y-5 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Número do Contrato <span className="text-destructive">*</span>
                <FieldHelpTooltip content="Identificador único, ex: CT-2024-001" />
              </Label>
              <Input value={formData.numero_contrato} onChange={(e) => update({ numero_contrato: e.target.value })} placeholder="Ex: CT-2024-001" />
            </div>
            <div className="space-y-2">
              <Label>Nome do Contrato <span className="text-destructive">*</span></Label>
              <Input value={formData.nome} onChange={(e) => update({ nome: e.target.value })} placeholder="Nome descritivo" />
            </div>
            <div className="space-y-2">
              <Label>Fornecedor <span className="text-destructive">*</span></Label>
              <Select value={formData.fornecedor_id} onValueChange={(v) => update({ fornecedor_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {fornecedores.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={formData.tipo} onValueChange={(v) => update({ tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="servicos">Serviços</SelectItem>
                  <SelectItem value="licenciamento">Licenciamento</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="consultoria">Consultoria</SelectItem>
                  <SelectItem value="produto">Produto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => update({ status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="negociacao">Negociação</SelectItem>
                  <SelectItem value="aprovacao">Aprovação</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="suspenso">Suspenso</SelectItem>
                  <SelectItem value="encerrado">Encerrado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'financeiro', label: 'Financeiro & Prazos', icon: DollarSign, state: finanState, hint: 'Valor e datas',
      content: (
        <div className="space-y-5 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Valor
                <FieldHelpTooltip content="Valor total do contrato. Use ponto para decimais." />
              </Label>
              <Input type="number" step="0.01" value={formData.valor} onChange={(e) => update({ valor: e.target.value })} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Moeda</Label>
              <Select value={formData.moeda} onValueChange={(v) => update({ moeda: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">BRL</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prazo Renovação (dias)</Label>
              <Input type="number" value={formData.prazo_renovacao} onChange={(e) => update({ prazo_renovacao: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Início</Label>
              <Input type="date" value={formData.data_inicio} onChange={(e) => update({ data_inicio: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Fim</Label>
              <Input type="date" value={formData.data_fim} onChange={(e) => update({ data_fim: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Assinatura</Label>
              <Input type="date" value={formData.data_assinatura} onChange={(e) => update({ data_assinatura: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border p-3">
            <Switch checked={formData.renovacao_automatica} onCheckedChange={(c) => update({ renovacao_automatica: c })} id="ren-auto" />
            <Label htmlFor="ren-auto" className="cursor-pointer">Renovação Automática</Label>
            <FieldHelpTooltip content="Se ativado, o contrato se renova automaticamente ao vencer." />
          </div>
        </div>
      ),
    },
    {
      id: 'condicoes', label: 'Condições', icon: FileText, state: condState, hint: 'Objeto, SLA, cláusulas',
      content: (
        <div className="space-y-5 max-w-3xl">
          <div className="space-y-2">
            <Label>Objeto do Contrato</Label>
            <Textarea value={formData.objeto} onChange={(e) => update({ objeto: e.target.value })} rows={4} placeholder="Descrição detalhada do objeto..." />
          </div>
          <div className="space-y-2">
            <Label>SLA Principal</Label>
            <Textarea value={formData.sla_principal} onChange={(e) => update({ sla_principal: e.target.value })} rows={3} placeholder="Principais SLAs e indicadores..." />
          </div>
          <div className="space-y-2">
            <Label>Cláusulas Especiais</Label>
            <Textarea value={formData.clausulas_especiais} onChange={(e) => update({ clausulas_especiais: e.target.value })} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Penalidades</Label>
            <Textarea value={formData.penalidades} onChange={(e) => update({ penalidades: e.target.value })} rows={3} />
          </div>
        </div>
      ),
    },
    {
      id: 'governanca', label: 'Governança', icon: Shield, state: govState, hint: 'Gestor, área, observações',
      content: (
        <div className="space-y-5 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Gestor do Contrato
                <FieldHelpTooltip content="Pessoa responsável por acompanhar a execução do contrato." />
              </Label>
              <Select value={formData.gestor_contrato} onValueChange={(v) => update({ gestor_contrato: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o gestor" /></SelectTrigger>
                <SelectContent>
                  {usuarios.map((u) => <SelectItem key={u.user_id} value={u.user_id}>{u.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Área Solicitante</Label>
              <Input value={formData.area_solicitante} onChange={(e) => update({ area_solicitante: e.target.value })} placeholder="Ex: TI, Financeiro" />
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border p-3">
            <Switch checked={formData.confidencial} onCheckedChange={(c) => update({ confidencial: c })} id="conf" />
            <Label htmlFor="conf" className="cursor-pointer">Confidencial</Label>
            <FieldHelpTooltip content="Restringe acesso a usuários autorizados." />
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={formData.observacoes} onChange={(e) => update({ observacoes: e.target.value })} rows={3} />
          </div>
        </div>
      ),
    },
  ], [formData, fornecedores, usuarios, identState, finanState, condState, govState]);

  const summary = (
    <WizardSummaryCard title="Resumo do Contrato">
      <WizardSummaryRow label="Nome" value={formData.nome || <span className="text-muted-foreground italic">Sem nome</span>} highlight />
      <WizardSummaryRow label="Nº" value={formData.numero_contrato || '—'} />
      <WizardSummaryRow label="Fornecedor" value={fornecedorNome || <span className="text-muted-foreground italic">—</span>} />
      <WizardSummaryRow
        label="Status"
        value={<Badge variant={STATUS_VARIANT[formData.status] || 'outline'} className="text-[10px] capitalize">{formData.status.replace('_', ' ')}</Badge>}
      />
      <WizardSummaryRow
        label="Valor"
        value={formData.valor ? `${formData.moeda} ${parseFloat(formData.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : <span className="text-muted-foreground italic">—</span>}
      />
    </WizardSummaryCard>
  );

  const draftLabel = !contrato && hasDraft && savedAt
    ? `Rascunho às ${new Date(savedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    : undefined;

  return (
    <WizardDialog
      open={open}
      onOpenChange={onOpenChange}
      title={contrato ? 'Editar Contrato' : 'Novo Contrato'}
      description="Identifique o contrato, defina valores, prazos e governança."
      icon={FileSignature}
      tabs={tabs}
      summary={summary}
      activeTab={activeTab}
      onActiveTabChange={setActiveTab}
      onSubmit={handleSubmit}
      submitLabel={contrato ? 'Atualizar' : 'Criar'}
      isSubmitting={loading}
      submitDisabled={loading}
      isDirty={isDirty}
      draftLabel={draftLabel}
      size="xl"
    />
  );
}
