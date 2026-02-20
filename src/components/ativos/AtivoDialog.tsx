import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import LocalizacaoSelect from '@/components/ativos/LocalizacaoSelect';
import { UserSelect } from '@/components/riscos/UserSelect';

interface AtivoFormData {
  nome: string;
  tipo: string;
  descricao: string;
  proprietario: string;
  localizacao: string;
  valor_negocio: string;
  criticidade: string;
  status: string;
  data_aquisicao: string;
  fornecedor: string;
  versao: string;
  tags: string;
  imei: string;
  cliente: string;
  quantidade: number;
}

interface AtivoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: AtivoFormData;
  setFormData: React.Dispatch<React.SetStateAction<AtivoFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  isEditing: boolean;
}

const tiposAtivo = [
  { value: 'servidor', label: 'Servidor' },
  { value: 'aplicacao', label: 'Aplicação' },
  { value: 'banco_dados', label: 'Banco de Dados' },
  { value: 'rede', label: 'Equipamento de Rede' },
  { value: 'endpoint', label: 'Endpoint' },
  { value: 'dispositivo_movel', label: 'Dispositivo Móvel' },
  { value: 'armazenamento', label: 'Armazenamento' },
  { value: 'software', label: 'Software' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'almoxarifado_equipamento', label: 'Equipamento de Almoxarifado' },
  { value: 'almoxarifado_ferramenta', label: 'Ferramenta' },
  { value: 'almoxarifado_material', label: 'Material de Consumo' },
  { value: 'almoxarifado_epi', label: 'Equipamento de Proteção Individual' },
  { value: 'mobiliario', label: 'Mobiliário' },
  { value: 'equipamento_escritorio', label: 'Equipamento de Escritório' },
  { value: 'equipamento_comunicacao', label: 'Equipamento de Comunicação' },
  { value: 'material_escritorio', label: 'Material de Escritório' },
  { value: 'veiculo_terrestre', label: 'Veículo Terrestre' },
  { value: 'veiculo_aereo', label: 'Veículo Aéreo' },
  { value: 'maquina_pesada', label: 'Máquina Pesada' },
  { value: 'equipamento_transporte', label: 'Equipamento de Transporte' },
  { value: 'imovel', label: 'Imóvel' },
  { value: 'estrutura_fisica', label: 'Estrutura Física' },
  { value: 'instalacao_eletrica', label: 'Instalação Elétrica' },
  { value: 'instalacao_hidraulica', label: 'Instalação Hidráulica' },
  { value: 'equipamento_seguranca', label: 'Equipamento de Segurança' },
  { value: 'sistema_monitoramento', label: 'Sistema de Monitoramento' },
  { value: 'controle_acesso', label: 'Controle de Acesso' },
  { value: 'equipamento_bombeiro', label: 'Equipamento de Combate a Incêndio' },
  { value: 'maquina_producao', label: 'Máquina de Produção' },
  { value: 'ferramenta_producao', label: 'Ferramenta de Produção' },
  { value: 'equipamento_medicao', label: 'Equipamento de Medição' },
  { value: 'equipamento_teste', label: 'Equipamento de Teste' },
  { value: 'equipamento_medico', label: 'Equipamento Médico' },
  { value: 'equipamento_laboratorio', label: 'Equipamento de Laboratório' },
  { value: 'outros', label: 'Outros' }
];

const criticidades = [
  { value: 'critico', label: 'Crítico' },
  { value: 'alto', label: 'Alto' },
  { value: 'medio', label: 'Médio' },
  { value: 'baixo', label: 'Baixo' },
];

const statusOptions = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'descontinuado', label: 'Descontinuado' },
];

const valoresNegocio = ['alto', 'medio', 'baixo'];

const AtivoDialog: React.FC<AtivoDialogProps> = ({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  isEditing,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Ativo' : 'Novo Ativo'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize as informações do ativo' : 'Cadastre um novo ativo na plataforma'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-140px)] pr-4">
          <form onSubmit={onSubmit} className="space-y-4 px-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({...prev, nome: e.target.value}))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData(prev => ({...prev, tipo: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposAtivo.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({...prev, descricao: e.target.value}))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="proprietario">Proprietário</Label>
                <UserSelect
                  value={formData.proprietario}
                  onValueChange={(value) => setFormData(prev => ({...prev, proprietario: value}))}
                  placeholder="Selecionar proprietário..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="localizacao">Localização</Label>
                <LocalizacaoSelect
                  value={formData.localizacao}
                  onValueChange={(value) => setFormData(prev => ({...prev, localizacao: value}))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente</Label>
                <Input
                  id="cliente"
                  value={formData.cliente}
                  onChange={(e) => setFormData(prev => ({...prev, cliente: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imei">IMEI</Label>
                <Input
                  id="imei"
                  value={formData.imei}
                  onChange={(e) => setFormData(prev => ({...prev, imei: e.target.value}))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({...prev, tags: e.target.value}))}
                  placeholder="Ex: servidor, crítico, backup (separadas por vírgula)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantidade">Quantidade</Label>
                <Input
                  id="quantidade"
                  type="number"
                  min="1"
                  value={formData.quantidade}
                  onChange={(e) => setFormData(prev => ({...prev, quantidade: parseInt(e.target.value) || 1}))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="criticidade">Criticidade</Label>
                <Select value={formData.criticidade} onValueChange={(value) => setFormData(prev => ({...prev, criticidade: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {criticidades.map((crit) => (
                      <SelectItem key={crit.value} value={crit.value}>
                        {crit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor_negocio">Valor de Negócio</Label>
                <Select value={formData.valor_negocio} onValueChange={(value) => setFormData(prev => ({...prev, valor_negocio: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {valoresNegocio.map((valor) => (
                      <SelectItem key={valor} value={valor}>
                        {valor.charAt(0).toUpperCase() + valor.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({...prev, status: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_aquisicao">Data de Aquisição</Label>
                <Input
                  id="data_aquisicao"
                  type="date"
                  value={formData.data_aquisicao}
                  onChange={(e) => setFormData(prev => ({...prev, data_aquisicao: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fornecedor">Fornecedor</Label>
                <Input
                  id="fornecedor"
                  value={formData.fornecedor}
                  onChange={(e) => setFormData(prev => ({...prev, fornecedor: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="versao">Versão</Label>
                <Input
                  id="versao"
                  value={formData.versao}
                  onChange={(e) => setFormData(prev => ({...prev, versao: e.target.value}))}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {isEditing ? 'Atualizar' : 'Criar'} Ativo
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AtivoDialog;
