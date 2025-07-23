import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SolicitacaoTitularDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  solicitacao?: any;
}

export function SolicitacaoTitularDialog({ isOpen, onClose, onSave, solicitacao }: SolicitacaoTitularDialogProps) {
  const [formData, setFormData] = useState({
    tipo_solicitacao: solicitacao?.tipo_solicitacao || "",
    dados_titular: JSON.stringify(solicitacao?.dados_titular || { nome: "", email: "", documento: "" }, null, 2),
    dados_solicitados: solicitacao?.dados_solicitados || "",
    justificativa: solicitacao?.justificativa || "",
    canal_solicitacao: solicitacao?.canal_solicitacao || "",
    status: solicitacao?.status || "pendente",
    data_resposta: solicitacao?.data_resposta ? new Date(solicitacao.data_resposta) : undefined,
    prazo_resposta: solicitacao?.prazo_resposta ? new Date(solicitacao.prazo_resposta) : addDays(new Date(), 15),
    responsavel_analise: solicitacao?.responsavel_analise || "",
    observacoes_internas: solicitacao?.observacoes_internas || "",
    resposta_titular: solicitacao?.resposta_titular || "",
    evidencias_atendimento: solicitacao?.evidencias_atendimento || ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
        dados_titular: JSON.parse(formData.dados_titular),
        data_resposta: formData.data_resposta ? format(formData.data_resposta, 'yyyy-MM-dd HH:mm:ss') : null,
        prazo_resposta: format(formData.prazo_resposta, 'yyyy-MM-dd'),
        empresa_id: profile.empresa_id
      };

      if (solicitacao?.id) {
        const { error } = await supabase
          .from('dados_solicitacoes_titular')
          .update(payload)
          .eq('id', solicitacao.id);
        
        if (error) throw error;
        toast({ title: "Solicitação atualizada com sucesso!" });
      } else {
        const { error } = await supabase
          .from('dados_solicitacoes_titular')
          .insert([payload]);
        
        if (error) throw error;
        toast({ title: "Solicitação registrada com sucesso!" });
      }
      
      onSave();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar solicitação",
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
            {solicitacao?.id ? "Editar Solicitação" : "Nova Solicitação de Titular"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_solicitacao">Tipo de Solicitação *</Label>
              <Select value={formData.tipo_solicitacao} onValueChange={(value) => setFormData({ ...formData, tipo_solicitacao: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acesso">Acesso aos Dados</SelectItem>
                  <SelectItem value="correcao">Correção de Dados</SelectItem>
                  <SelectItem value="exclusao">Exclusão de Dados</SelectItem>
                  <SelectItem value="portabilidade">Portabilidade</SelectItem>
                  <SelectItem value="oposicao">Oposição ao Tratamento</SelectItem>
                  <SelectItem value="revogacao_consentimento">Revogação de Consentimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="canal_solicitacao">Canal da Solicitação</Label>
              <Select value={formData.canal_solicitacao} onValueChange={(value) => setFormData({ ...formData, canal_solicitacao: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="portal">Portal Web</SelectItem>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="telefone">Telefone</SelectItem>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dados_titular">Dados do Titular (JSON) *</Label>
            <Textarea
              id="dados_titular"
              value={formData.dados_titular}
              onChange={(e) => setFormData({ ...formData, dados_titular: e.target.value })}
              placeholder='{"nome": "João Silva", "email": "joao@email.com", "documento": "123.456.789-00"}'
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dados_solicitados">Dados Solicitados</Label>
            <Textarea
              id="dados_solicitados"
              value={formData.dados_solicitados}
              onChange={(e) => setFormData({ ...formData, dados_solicitados: e.target.value })}
              placeholder="Especifique quais dados pessoais são objeto da solicitação"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="justificativa">Justificativa</Label>
            <Textarea
              id="justificativa"
              value={formData.justificativa}
              onChange={(e) => setFormData({ ...formData, justificativa: e.target.value })}
              placeholder="Justificativa apresentada pelo titular"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="atendida">Atendida</SelectItem>
                  <SelectItem value="rejeitada">Rejeitada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prazo de Resposta</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.prazo_resposta, "dd/MM/yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.prazo_resposta}
                    onSelect={(date) => date && setFormData({ ...formData, prazo_resposta: date })}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {(formData.status === "em_analise" || formData.status === "atendida" || formData.status === "rejeitada") && (
            <>
              <div className="space-y-2">
                <Label htmlFor="observacoes_internas">Observações Internas</Label>
                <Textarea
                  id="observacoes_internas"
                  value={formData.observacoes_internas}
                  onChange={(e) => setFormData({ ...formData, observacoes_internas: e.target.value })}
                  placeholder="Observações internas para análise"
                />
              </div>

              {(formData.status === "atendida" || formData.status === "rejeitada") && (
                <>
                  <div className="space-y-2">
                    <Label>Data de Resposta</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.data_resposta ? format(formData.data_resposta, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.data_resposta}
                          onSelect={(date) => setFormData({ ...formData, data_resposta: date })}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resposta_titular">Resposta ao Titular</Label>
                    <Textarea
                      id="resposta_titular"
                      value={formData.resposta_titular}
                      onChange={(e) => setFormData({ ...formData, resposta_titular: e.target.value })}
                      placeholder="Resposta enviada ao titular"
                    />
                  </div>

                  {formData.status === "atendida" && (
                    <div className="space-y-2">
                      <Label htmlFor="evidencias_atendimento">Evidências de Atendimento</Label>
                      <Textarea
                        id="evidencias_atendimento"
                        value={formData.evidencias_atendimento}
                        onChange={(e) => setFormData({ ...formData, evidencias_atendimento: e.target.value })}
                        placeholder="Evidências de que a solicitação foi atendida"
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}
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