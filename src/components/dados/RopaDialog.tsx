import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RopaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  ropa?: any;
}

export function RopaDialog({ isOpen, onClose, onSave, ropa }: RopaDialogProps) {
  const [formData, setFormData] = useState({
    nome_tratamento: ropa?.nome_tratamento || "",
    finalidade: ropa?.finalidade || "",
    base_legal: ropa?.base_legal || "",
    categoria_titulares: ropa?.categoria_titulares || "",
    origem_dados: ropa?.origem_dados || "",
    compartilhamento_dados: ropa?.compartilhamento_dados || "",
    transferencia_internacional: ropa?.transferencia_internacional || false,
    pais_destino: ropa?.pais_destino || "",
    adequacao_destino: ropa?.adequacao_destino || "",
    prazo_retencao: ropa?.prazo_retencao || "",
    medidas_seguranca: ropa?.medidas_seguranca || "",
    responsavel_tratamento: ropa?.responsavel_tratamento || "",
    encarregado_dados: ropa?.encarregado_dados || "",
    controlador_conjunto: ropa?.controlador_conjunto || "",
    operador_dados: ropa?.operador_dados || "",
    data_inicio: ropa?.data_inicio ? new Date(ropa.data_inicio) : undefined,
    data_fim: ropa?.data_fim ? new Date(ropa.data_fim) : undefined,
    status: ropa?.status || "ativo",
    observacoes: ropa?.observacoes || ""
  });
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadUsuarios();
    }
  }, [isOpen]);

  const loadUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, nome, email')
        .order('nome');
      
      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
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
        data_inicio: formData.data_inicio ? format(formData.data_inicio, 'yyyy-MM-dd') : null,
        data_fim: formData.data_fim ? format(formData.data_fim, 'yyyy-MM-dd') : null,
        empresa_id: profile.empresa_id,
        ...(ropa?.id ? {} : { created_by: (await supabase.auth.getUser()).data.user?.id })
      };

      if (ropa?.id) {
        const { error } = await supabase
          .from('ropa_registros')
          .update(payload)
          .eq('id', ropa.id);
        
        if (error) throw error;
        toast({ title: "Registro ROPA atualizado com sucesso!" });
      } else {
        const { error } = await supabase
          .from('ropa_registros')
          .insert([payload]);
        
        if (error) throw error;
        toast({ title: "Registro ROPA criado com sucesso!" });
      }
      
      onSave();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar registro ROPA",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {ropa?.id ? "Editar Registro ROPA" : "Novo Registro ROPA"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome_tratamento">Nome do Tratamento *</Label>
              <Input
                id="nome_tratamento"
                value={formData.nome_tratamento}
                onChange={(e) => setFormData({ ...formData, nome_tratamento: e.target.value })}
                placeholder="Ex: Gestão de clientes"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria_titulares">Categoria de Titulares *</Label>
              <Select value={formData.categoria_titulares} onValueChange={(value) => setFormData({ ...formData, categoria_titulares: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clientes">Clientes</SelectItem>
                  <SelectItem value="funcionarios">Funcionários</SelectItem>
                  <SelectItem value="fornecedores">Fornecedores</SelectItem>
                  <SelectItem value="prospects">Prospects</SelectItem>
                  <SelectItem value="parceiros">Parceiros</SelectItem>
                  <SelectItem value="visitantes">Visitantes</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="finalidade">Finalidade *</Label>
            <Textarea
              id="finalidade"
              value={formData.finalidade}
              onChange={(e) => setFormData({ ...formData, finalidade: e.target.value })}
              placeholder="Descreva a finalidade específica do tratamento"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base_legal">Base Legal *</Label>
              <Select value={formData.base_legal} onValueChange={(value) => setFormData({ ...formData, base_legal: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a base legal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consentimento">Consentimento</SelectItem>
                  <SelectItem value="legitimo_interesse">Legítimo Interesse</SelectItem>
                  <SelectItem value="execucao_contrato">Execução de Contrato</SelectItem>
                  <SelectItem value="cumprimento_obrigacao">Cumprimento de Obrigação Legal</SelectItem>
                  <SelectItem value="protecao_vida">Proteção da Vida</SelectItem>
                  <SelectItem value="exercicio_direitos">Exercício de Direitos</SelectItem>
                  <SelectItem value="politicas_publicas">Políticas Públicas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="origem_dados">Origem dos Dados</Label>
              <Select value={formData.origem_dados} onValueChange={(value) => setFormData({ ...formData, origem_dados: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diretamente_titular">Diretamente do Titular</SelectItem>
                  <SelectItem value="terceiros">Terceiros</SelectItem>
                  <SelectItem value="publico">Fonte Pública</SelectItem>
                  <SelectItem value="misto">Misto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="compartilhamento_dados">Compartilhamento de Dados</Label>
              <Select value={formData.compartilhamento_dados} onValueChange={(value) => setFormData({ ...formData, compartilhamento_dados: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o compartilhamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao_compartilha">Não Compartilha</SelectItem>
                  <SelectItem value="interno">Interno</SelectItem>
                  <SelectItem value="terceiros">Terceiros</SelectItem>
                  <SelectItem value="subsidiarias">Subsidiárias</SelectItem>
                  <SelectItem value="parceiros">Parceiros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prazo_retencao">Prazo de Retenção *</Label>
              <Input
                id="prazo_retencao"
                value={formData.prazo_retencao}
                onChange={(e) => setFormData({ ...formData, prazo_retencao: e.target.value })}
                placeholder="Ex: 5 anos após fim do contrato"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="transferencia_internacional"
              checked={formData.transferencia_internacional}
              onCheckedChange={(checked) => setFormData({ ...formData, transferencia_internacional: !!checked })}
            />
            <Label htmlFor="transferencia_internacional">Transferência Internacional</Label>
          </div>

          {formData.transferencia_internacional && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pais_destino">País de Destino</Label>
                <Input
                  id="pais_destino"
                  value={formData.pais_destino}
                  onChange={(e) => setFormData({ ...formData, pais_destino: e.target.value })}
                  placeholder="Ex: Estados Unidos"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adequacao_destino">Adequação do Destino</Label>
                <Select value={formData.adequacao_destino} onValueChange={(value) => setFormData({ ...formData, adequacao_destino: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a adequação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adequado">País Adequado</SelectItem>
                    <SelectItem value="garantias">Garantias Específicas</SelectItem>
                    <SelectItem value="autorizacao_anpd">Autorização ANPD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsavel_tratamento">Responsável pelo Tratamento</Label>
              <Select value={formData.responsavel_tratamento} onValueChange={(value) => setFormData({ ...formData, responsavel_tratamento: value })}>
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
            <div className="space-y-2">
              <Label htmlFor="encarregado_dados">Encarregado de Dados (DPO)</Label>
              <Select value={formData.encarregado_dados} onValueChange={(value) => setFormData({ ...formData, encarregado_dados: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o encarregado" />
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
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.data_inicio ? format(formData.data_inicio, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.data_inicio}
                    onSelect={(date) => setFormData({ ...formData, data_inicio: date })}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Data de Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.data_fim ? format(formData.data_fim, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.data_fim}
                    onSelect={(date) => setFormData({ ...formData, data_fim: date })}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="medidas_seguranca">Medidas de Segurança</Label>
            <Textarea
              id="medidas_seguranca"
              value={formData.medidas_seguranca}
              onChange={(e) => setFormData({ ...formData, medidas_seguranca: e.target.value })}
              placeholder="Descreva as medidas de segurança aplicadas"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações adicionais"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}