import { useState, useEffect } from "react";
import { DialogShell } from "@/components/ui/dialog-shell";
import { GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { logger } from "@/lib/logger";

interface FluxoDadosDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  fluxo?: any;
}

export function FluxoDadosDialog({ isOpen, onClose, onSave, fluxo }: FluxoDadosDialogProps) {
  const [formData, setFormData] = useState({
    nome_fluxo: fluxo?.nome_fluxo || "",
    dados_pessoais_id: fluxo?.dados_pessoais_id || "",
    sistema_origem: fluxo?.sistema_origem || "",
    sistema_destino: fluxo?.sistema_destino || "",
    tipo_transferencia: fluxo?.tipo_transferencia || "",
    frequencia: fluxo?.frequencia || "",
    volume_aproximado: fluxo?.volume_aproximado || "",
    criptografia_transit: fluxo?.criptografia_transit || false,
    aprovacao_necessaria: fluxo?.aprovacao_necessaria || false,
    responsavel_fluxo: fluxo?.responsavel_fluxo || "",
    mapeamento_campos: fluxo?.mapeamento_campos || "",
    observacoes: fluxo?.observacoes || "",
    status: fluxo?.status || "ativo"
  });
  const [dadosPessoais, setDadosPessoais] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { empresaId } = useEmpresaId();

  useEffect(() => {
    if (isOpen) {
      loadDadosPessoais();
      loadUsuarios();
    }
  }, [isOpen]);

  const loadDadosPessoais = async () => {
    try {
      if (!empresaId) return;
      const { data, error } = await supabase
        .from('dados_pessoais')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('nome');
      
      if (error) throw error;
      setDadosPessoais(data || []);
    } catch (error) {
      logger.error('Erro ao carregar dados pessoais', { error });
    }
  };

  const loadUsuarios = async () => {
    try {
      if (!empresaId) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, nome, email')
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      logger.error('Erro ao carregar usuários', { error });
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.empresa_id) {
        throw new Error('Empresa não encontrada');
      }

      const payload = {
        ...formData,
        empresa_id: profile.empresa_id,
        mapeamento_campos: formData.mapeamento_campos ? JSON.parse(formData.mapeamento_campos) : null
      };

      if (fluxo?.id) {
        const { error } = await supabase
          .from('dados_fluxos')
          .update(payload)
          .eq('id', fluxo.id);
        
        if (error) throw error;
        toast({ title: "Fluxo de dados atualizado com sucesso!" });
      } else {
        const { error } = await supabase
          .from('dados_fluxos')
          .insert([payload]);
        
        if (error) throw error;
        toast({ title: "Fluxo de dados criado com sucesso!" });
      }
      
      onSave();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar fluxo de dados",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogShell
        open={isOpen}
        onOpenChange={onClose}
        title={`${fluxo?.id ? "Editar" : "Novo"} Fluxo de Dados`}
        icon={GitBranch}
        size="lg"
        onSubmit={handleSave}
      >
<div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome_fluxo">Nome do Fluxo *</Label>
              <Input
                id="nome_fluxo"
                value={formData.nome_fluxo}
                onChange={(e) => setFormData({ ...formData, nome_fluxo: e.target.value })}
                placeholder="Ex: Transferência dados CRM para ERP"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dados_pessoais_id">Dados Pessoais *</Label>
              <Select value={formData.dados_pessoais_id} onValueChange={(value) => setFormData({ ...formData, dados_pessoais_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione os dados" />
                </SelectTrigger>
                <SelectContent>
                  {dadosPessoais.map((dado) => (
                    <SelectItem key={dado.id} value={dado.id}>
                      {dado.nome} ({dado.categoria_dados})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sistema_origem">Sistema Origem *</Label>
              <Input
                id="sistema_origem"
                value={formData.sistema_origem}
                onChange={(e) => setFormData({ ...formData, sistema_origem: e.target.value })}
                placeholder="Ex: CRM Salesforce"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sistema_destino">Sistema Destino *</Label>
              <Input
                id="sistema_destino"
                value={formData.sistema_destino}
                onChange={(e) => setFormData({ ...formData, sistema_destino: e.target.value })}
                placeholder="Ex: ERP SAP"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_transferencia">Tipo de Transferência *</Label>
              <Select value={formData.tipo_transferencia} onValueChange={(value) => setFormData({ ...formData, tipo_transferencia: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="api">API REST</SelectItem>
                  <SelectItem value="arquivo">Arquivo (CSV/Excel)</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="automatico">Automático</SelectItem>
                  <SelectItem value="etl">ETL/Pipeline</SelectItem>
                  <SelectItem value="sync">Sincronização</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequencia">Frequência</Label>
              <Select value={formData.frequencia} onValueChange={(value) => setFormData({ ...formData, frequencia: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tempo_real">Tempo Real</SelectItem>
                  <SelectItem value="diaria">Diária</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="eventual">Eventual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="volume_aproximado">Volume Aproximado</Label>
              <Input
                id="volume_aproximado"
                value={formData.volume_aproximado}
                onChange={(e) => setFormData({ ...formData, volume_aproximado: e.target.value })}
                placeholder="Ex: 1000 registros/dia"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsavel_fluxo">Responsável pelo Fluxo</Label>
              <Select value={formData.responsavel_fluxo} onValueChange={(value) => setFormData({ ...formData, responsavel_fluxo: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.user_id} value={usuario.user_id}>
                      {usuario.nome} ({usuario.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="criptografia_transit"
                checked={formData.criptografia_transit}
                onCheckedChange={(checked) => setFormData({ ...formData, criptografia_transit: !!checked })}
              />
              <Label htmlFor="criptografia_transit">Criptografia em Trânsito</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="aprovacao_necessaria"
                checked={formData.aprovacao_necessaria}
                onCheckedChange={(checked) => setFormData({ ...formData, aprovacao_necessaria: !!checked })}
              />
              <Label htmlFor="aprovacao_necessaria">Aprovação Necessária</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="suspenso">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mapeamento_campos">Mapeamento de Campos (JSON)</Label>
            <Textarea
              id="mapeamento_campos"
              value={formData.mapeamento_campos}
              onChange={(e) => setFormData({ ...formData, mapeamento_campos: e.target.value })}
              placeholder='Ex: {"nome": "customer_name", "email": "customer_email"}'
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações adicionais sobre o fluxo"
            />
          </div>
        </div>

        </DialogShell>
  );
}