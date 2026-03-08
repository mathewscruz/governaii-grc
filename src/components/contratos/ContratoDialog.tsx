import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useIntegrationNotify } from '@/hooks/useIntegrationNotify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AuthProvider } from '@/components/AuthProvider';

interface Contrato {
  id: string;
  numero_contrato: string;
  nome: string;
  tipo: string;
  status: string;
  valor: number;
  moeda: string;
  data_inicio: string;
  data_fim: string;
  data_assinatura: string;
  renovacao_automatica: boolean;
  prazo_renovacao: number;
  fornecedor_id: string;
  gestor_contrato: string;
  area_solicitante: string;
  objeto: string;
  observacoes: string;
  clausulas_especiais: string;
  penalidades: string;
  sla_principal: string;
  confidencial: boolean;
}

interface Fornecedor {
  id: string;
  nome: string;
}

interface ContratoDialogProps {
  contrato: Contrato | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  fornecedores: Fornecedor[];
}

export function ContratoDialog({ contrato, open, onOpenChange, onSuccess, fornecedores }: ContratoDialogProps) {
  const [formData, setFormData] = useState({
    numero_contrato: '',
    nome: '',
    tipo: 'servicos',
    status: 'rascunho',
    valor: '',
    moeda: 'BRL',
    data_inicio: '',
    data_fim: '',
    data_assinatura: '',
    renovacao_automatica: false,
    prazo_renovacao: '30',
    fornecedor_id: '',
    gestor_contrato: '',
    area_solicitante: '',
    objeto: '',
    observacoes: '',
    clausulas_especiais: '',
    penalidades: '',
    sla_principal: '',
    confidencial: false
  });
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchUsuarios();
      if (contrato) {
        setFormData({
          numero_contrato: contrato.numero_contrato || '',
          nome: contrato.nome || '',
          tipo: contrato.tipo || 'servicos',
          status: contrato.status || 'rascunho',
          valor: contrato.valor?.toString() || '',
          moeda: contrato.moeda || 'BRL',
          data_inicio: contrato.data_inicio || '',
          data_fim: contrato.data_fim || '',
          data_assinatura: contrato.data_assinatura || '',
          renovacao_automatica: contrato.renovacao_automatica || false,
          prazo_renovacao: contrato.prazo_renovacao?.toString() || '30',
          fornecedor_id: contrato.fornecedor_id || '',
          gestor_contrato: contrato.gestor_contrato || '',
          area_solicitante: contrato.area_solicitante || '',
          objeto: contrato.objeto || '',
          observacoes: contrato.observacoes || '',
          clausulas_especiais: contrato.clausulas_especiais || '',
          penalidades: contrato.penalidades || '',
          sla_principal: contrato.sla_principal || '',
          confidencial: contrato.confidencial || false
        });
      } else {
        setFormData({
          numero_contrato: '',
          nome: '',
          tipo: 'servicos',
          status: 'rascunho',
          valor: '',
          moeda: 'BRL',
          data_inicio: '',
          data_fim: '',
          data_assinatura: '',
          renovacao_automatica: false,
          prazo_renovacao: '30',
          fornecedor_id: '',
          gestor_contrato: '',
          area_solicitante: '',
          objeto: '',
          observacoes: '',
          clausulas_especiais: '',
          penalidades: '',
          sla_principal: '',
          confidencial: false
        });
      }
    }
  }, [contrato, open]);

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.numero_contrato || !formData.fornecedor_id) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Validação de datas
    if (formData.data_inicio && formData.data_fim) {
      if (new Date(formData.data_inicio) > new Date(formData.data_fim)) {
        toast({
          title: "Erro",
          description: "A data de início não pode ser posterior à data de fim",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('user_id', user?.id)
        .single();

      const contratoData = {
        numero_contrato: formData.numero_contrato,
        nome: formData.nome,
        tipo: formData.tipo,
        status: formData.status,
        valor: formData.valor ? parseFloat(formData.valor) : null,
        moeda: formData.moeda,
        data_inicio: formData.data_inicio || null,
        data_fim: formData.data_fim || null,
        data_assinatura: formData.data_assinatura || null,
        renovacao_automatica: formData.renovacao_automatica,
        prazo_renovacao: formData.prazo_renovacao ? parseInt(formData.prazo_renovacao) : null,
        fornecedor_id: formData.fornecedor_id,
        gestor_contrato: formData.gestor_contrato || null,
        area_solicitante: formData.area_solicitante,
        objeto: formData.objeto,
        observacoes: formData.observacoes,
        clausulas_especiais: formData.clausulas_especiais,
        penalidades: formData.penalidades,
        sla_principal: formData.sla_principal,
        confidencial: formData.confidencial,
        empresa_id: profile?.empresa_id,
        created_by: user?.id
      };

      let error;
      
      if (contrato) {
        const { error: updateError } = await supabase
          .from('contratos')
          .update(contratoData)
          .eq('id', contrato.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('contratos')
          .insert([contratoData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Contrato ${contrato ? 'atualizado' : 'criado'} com sucesso`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar contrato:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar contrato",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {contrato ? 'Editar Contrato' : 'Novo Contrato'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero_contrato">Número do Contrato *</Label>
              <Input
                id="numero_contrato"
                value={formData.numero_contrato}
                onChange={(e) => setFormData({ ...formData, numero_contrato: e.target.value })}
                placeholder="Ex: CT-2024-001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Contrato *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Contrato de Licenciamento de Software"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fornecedor_id">Fornecedor *</Label>
              <Select value={formData.fornecedor_id} onValueChange={(value) => setFormData({ ...formData, fornecedor_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores.map((fornecedor) => (
                    <SelectItem key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="valor">Valor</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data de Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_fim">Data de Fim</Label>
              <Input
                id="data_fim"
                type="date"
                value={formData.data_fim}
                onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_assinatura">Data de Assinatura</Label>
              <Input
                id="data_assinatura"
                type="date"
                value={formData.data_assinatura}
                onChange={(e) => setFormData({ ...formData, data_assinatura: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gestor_contrato">Gestor do Contrato</Label>
              <Select value={formData.gestor_contrato} onValueChange={(value) => setFormData({ ...formData, gestor_contrato: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gestor" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.user_id} value={usuario.user_id}>
                      {usuario.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="area_solicitante">Área Solicitante</Label>
              <Input
                id="area_solicitante"
                value={formData.area_solicitante}
                onChange={(e) => setFormData({ ...formData, area_solicitante: e.target.value })}
                placeholder="Ex: TI, Financeiro, RH"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prazo_renovacao">Prazo Renovação (dias)</Label>
              <Input
                id="prazo_renovacao"
                type="number"
                value={formData.prazo_renovacao}
                onChange={(e) => setFormData({ ...formData, prazo_renovacao: e.target.value })}
                placeholder="30"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="objeto">Objeto do Contrato</Label>
              <Textarea
                id="objeto"
                value={formData.objeto}
                onChange={(e) => setFormData({ ...formData, objeto: e.target.value })}
                placeholder="Descrição detalhada do objeto do contrato..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sla_principal">SLA Principal</Label>
              <Textarea
                id="sla_principal"
                value={formData.sla_principal}
                onChange={(e) => setFormData({ ...formData, sla_principal: e.target.value })}
                placeholder="Descrição dos principais SLAs e indicadores..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clausulas_especiais">Cláusulas Especiais</Label>
              <Textarea
                id="clausulas_especiais"
                value={formData.clausulas_especiais}
                onChange={(e) => setFormData({ ...formData, clausulas_especiais: e.target.value })}
                placeholder="Cláusulas especiais e observações importantes..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="penalidades">Penalidades</Label>
              <Textarea
                id="penalidades"
                value={formData.penalidades}
                onChange={(e) => setFormData({ ...formData, penalidades: e.target.value })}
                placeholder="Descrição das penalidades e multas aplicáveis..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações adicionais..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="renovacao_automatica"
                checked={formData.renovacao_automatica}
                onCheckedChange={(checked) => setFormData({ ...formData, renovacao_automatica: checked })}
              />
              <Label htmlFor="renovacao_automatica">Renovação Automática</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="confidencial"
                checked={formData.confidencial}
                onCheckedChange={(checked) => setFormData({ ...formData, confidencial: checked })}
              />
              <Label htmlFor="confidencial">Confidencial</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (contrato ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}