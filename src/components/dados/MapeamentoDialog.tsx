import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MapeamentoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  mapeamento?: any;
}

export function MapeamentoDialog({ isOpen, onClose, onSave, mapeamento }: MapeamentoDialogProps) {
  const [formData, setFormData] = useState({
    dados_pessoais_id: mapeamento?.dados_pessoais_id || "",
    ativo_id: mapeamento?.ativo_id || "",
    tipo_armazenamento: mapeamento?.tipo_armazenamento || "primario",
    localizacao_dados: mapeamento?.localizacao_dados || "",
    criptografia_aplicada: mapeamento?.criptografia_aplicada || false,
    controles_acesso: mapeamento?.controles_acesso || "",
    volume_aproximado: mapeamento?.volume_aproximado || "",
    frequencia_acesso: mapeamento?.frequencia_acesso || "",
    observacoes: mapeamento?.observacoes || ""
  });
  const [dadosPessoais, setDadosPessoais] = useState<any[]>([]);
  const [ativos, setAtivos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadDadosPessoais();
      loadAtivos();
    }
  }, [isOpen]);

  const loadDadosPessoais = async () => {
    try {
      const { data, error } = await supabase
        .from('dados_pessoais')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      setDadosPessoais(data || []);
    } catch (error) {
      console.error('Erro ao carregar dados pessoais:', error);
    }
  };

  const loadAtivos = async () => {
    try {
      const { data, error } = await supabase
        .from('ativos')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      setAtivos(data || []);
    } catch (error) {
      console.error('Erro ao carregar ativos:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      if (mapeamento?.id) {
        const { error } = await supabase
          .from('dados_mapeamento')
          .update(formData)
          .eq('id', mapeamento.id);
        
        if (error) throw error;
        toast({ title: "Mapeamento atualizado com sucesso!" });
      } else {
        const { error } = await supabase
          .from('dados_mapeamento')
          .insert([formData]);
        
        if (error) throw error;
        toast({ title: "Mapeamento criado com sucesso!" });
      }
      
      onSave();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar mapeamento",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mapeamento?.id ? "Editar Mapeamento" : "Novo Mapeamento Dados x Ativo"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dados_pessoais_id">Dados Pessoais *</Label>
              <Select value={formData.dados_pessoais_id} onValueChange={(value) => setFormData({ ...formData, dados_pessoais_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione os dados pessoais" />
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
            <div className="space-y-2">
              <Label htmlFor="ativo_id">Ativo *</Label>
              <Select value={formData.ativo_id} onValueChange={(value) => setFormData({ ...formData, ativo_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ativo" />
                </SelectTrigger>
                <SelectContent>
                  {ativos.map((ativo) => (
                    <SelectItem key={ativo.id} value={ativo.id}>
                      {ativo.nome} ({ativo.tipo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_armazenamento">Tipo de Armazenamento *</Label>
              <Select value={formData.tipo_armazenamento} onValueChange={(value) => setFormData({ ...formData, tipo_armazenamento: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primario">Primário</SelectItem>
                  <SelectItem value="backup">Backup</SelectItem>
                  <SelectItem value="temporario">Temporário</SelectItem>
                  <SelectItem value="cache">Cache</SelectItem>
                  <SelectItem value="arquivo">Arquivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="localizacao_dados">Localização dos Dados</Label>
              <Select value={formData.localizacao_dados} onValueChange={(value) => setFormData({ ...formData, localizacao_dados: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a localização" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="servidor_local">Servidor Local</SelectItem>
                  <SelectItem value="cloud_publica">Cloud Pública</SelectItem>
                  <SelectItem value="cloud_privada">Cloud Privada</SelectItem>
                  <SelectItem value="hibrido">Híbrido</SelectItem>
                  <SelectItem value="terceiros">Terceiros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="volume_aproximado">Volume Aproximado</Label>
              <Select value={formData.volume_aproximado} onValueChange={(value) => setFormData({ ...formData, volume_aproximado: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o volume" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pequeno">Pequeno (&lt; 1k registros)</SelectItem>
                  <SelectItem value="medio">Médio (1k - 100k registros)</SelectItem>
                  <SelectItem value="grande">Grande (100k - 1M registros)</SelectItem>
                  <SelectItem value="muito_grande">Muito Grande (&gt; 1M registros)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequencia_acesso">Frequência de Acesso</Label>
              <Select value={formData.frequencia_acesso} onValueChange={(value) => setFormData({ ...formData, frequencia_acesso: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diaria">Diária</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="eventual">Eventual</SelectItem>
                  <SelectItem value="rara">Rara</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="criptografia_aplicada"
              checked={formData.criptografia_aplicada}
              onCheckedChange={(checked) => setFormData({ ...formData, criptografia_aplicada: !!checked })}
            />
            <Label htmlFor="criptografia_aplicada">Criptografia Aplicada</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="controles_acesso">Controles de Acesso</Label>
            <Textarea
              id="controles_acesso"
              value={formData.controles_acesso}
              onChange={(e) => setFormData({ ...formData, controles_acesso: e.target.value })}
              placeholder="Descreva os controles de acesso aplicados (autenticação, autorização, etc.)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações adicionais sobre o mapeamento"
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