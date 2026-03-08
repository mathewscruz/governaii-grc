import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DadosPessoaisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  dados?: any;
}

export function DadosPessoaisDialog({ isOpen, onClose, onSave, dados }: DadosPessoaisDialogProps) {
  const [formData, setFormData] = useState({
    nome: dados?.nome || "",
    descricao: dados?.descricao || "",
    categoria_dados: dados?.categoria_dados || "",
    tipo_dados: dados?.tipo_dados || "",
    sensibilidade: dados?.sensibilidade || "comum",
    origem_coleta: dados?.origem_coleta || "",
    finalidade_tratamento: dados?.finalidade_tratamento || "",
    base_legal: dados?.base_legal || "",
    prazo_retencao: dados?.prazo_retencao || "",
    forma_coleta: dados?.forma_coleta || "",
    observacoes: dados?.observacoes || ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setFormData({
      nome: dados?.nome || "",
      descricao: dados?.descricao || "",
      categoria_dados: dados?.categoria_dados || "",
      tipo_dados: dados?.tipo_dados || "",
      sensibilidade: dados?.sensibilidade || "comum",
      origem_coleta: dados?.origem_coleta || "",
      finalidade_tratamento: dados?.finalidade_tratamento || "",
      base_legal: dados?.base_legal || "",
      prazo_retencao: dados?.prazo_retencao || "",
      forma_coleta: dados?.forma_coleta || "",
      observacoes: dados?.observacoes || ""
    });
  }, [dados]);

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
        ...(dados?.id ? {} : { created_by: (await supabase.auth.getUser()).data.user?.id })
      };

      if (dados?.id) {
        const { error } = await supabase
          .from('dados_pessoais')
          .update(payload)
          .eq('id', dados.id);
        
        if (error) throw error;
        toast({ title: "Dados pessoais atualizados com sucesso!" });
      } else {
        const { error } = await supabase
          .from('dados_pessoais')
          .insert([payload]);
        
        if (error) throw error;
        toast({ title: "Dados pessoais cadastrados com sucesso!" });
      }
      
      onSave();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar dados pessoais",
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
            {dados?.id ? "Editar Dados Pessoais" : "Cadastrar Dados Pessoais"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Dado *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: E-mail do cliente"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria_dados">Categoria *</Label>
              <Select value={formData.categoria_dados} onValueChange={(value) => setFormData({ ...formData, categoria_dados: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="identificacao">Identificação</SelectItem>
                  <SelectItem value="contato">Contato</SelectItem>
                  <SelectItem value="localizacao">Localização</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="saude">Saúde</SelectItem>
                  <SelectItem value="biometrico">Biométrico</SelectItem>
                  <SelectItem value="profissional">Profissional</SelectItem>
                  <SelectItem value="comportamental">Comportamental</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_dados">Tipo de Dados *</Label>
              <Select value={formData.tipo_dados} onValueChange={(value) => setFormData({ ...formData, tipo_dados: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comum">Dados Pessoais Comuns</SelectItem>
                  <SelectItem value="sensivel">Dados Pessoais Sensíveis</SelectItem>
                  <SelectItem value="infantil">Dados de Crianças/Adolescentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sensibilidade">Sensibilidade *</Label>
              <Select value={formData.sensibilidade} onValueChange={(value) => setFormData({ ...formData, sensibilidade: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a sensibilidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comum">Comum</SelectItem>
                  <SelectItem value="sensivel">Sensível</SelectItem>
                  <SelectItem value="muito_sensivel">Muito Sensível</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva o tipo de dado pessoal"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origem_coleta">Origem da Coleta</Label>
              <Select value={formData.origem_coleta} onValueChange={(value) => setFormData({ ...formData, origem_coleta: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formulario_web">Formulário Web</SelectItem>
                  <SelectItem value="sistema_interno">Sistema Interno</SelectItem>
                  <SelectItem value="terceiros">Terceiros</SelectItem>
                  <SelectItem value="publico">Fonte Pública</SelectItem>
                  <SelectItem value="diretamente_titular">Diretamente do Titular</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="forma_coleta">Forma de Coleta</Label>
              <Select value={formData.forma_coleta} onValueChange={(value) => setFormData({ ...formData, forma_coleta: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatica">Automática</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="importacao">Importação</SelectItem>
                  <SelectItem value="integracao">Integração</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="finalidade_tratamento">Finalidade do Tratamento *</Label>
            <Textarea
              id="finalidade_tratamento"
              value={formData.finalidade_tratamento}
              onChange={(e) => setFormData({ ...formData, finalidade_tratamento: e.target.value })}
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
              <Label htmlFor="prazo_retencao">Prazo de Retenção</Label>
              <Input
                id="prazo_retencao"
                value={formData.prazo_retencao}
                onChange={(e) => setFormData({ ...formData, prazo_retencao: e.target.value })}
                placeholder="Ex: 5 anos após fim do contrato"
              />
            </div>
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