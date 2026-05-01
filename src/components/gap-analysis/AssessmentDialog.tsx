import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { logger } from '@/lib/logger';

interface AssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  framework?: any;
  onSuccess: () => void;
  assessment?: any;
}

export function AssessmentDialog({ 
  open, 
  onOpenChange, 
  framework, 
  onSuccess, 
  assessment 
}: AssessmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: assessment?.nome || "",
    descricao: assessment?.descricao || "",
    data_inicio: assessment?.data_inicio || "",
    data_prevista_conclusao: assessment?.data_prevista_conclusao || "",
    status: assessment?.status || "em_andamento"
  });

  const { toast } = useToast();
  const { user, profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile?.empresa_id || !framework) return;

    setLoading(true);
    try {
      const data = {
        ...formData,
        framework_id: framework.id,
        empresa_id: profile.empresa_id,
        created_by: user.id,
        data_inicio: formData.data_inicio || null,
        data_prevista_conclusao: formData.data_prevista_conclusao || null
      };

      if (assessment) {
        const { error } = await supabase
          .from('gap_analysis_assessments')
          .update(data)
          .eq('id', assessment.id);

        if (error) throw error;
        toast({ title: "Avaliação atualizada com sucesso!" });
      } else {
        const { error } = await supabase
          .from('gap_analysis_assessments')
          .insert(data);

        if (error) throw error;
        toast({ title: "Avaliação criada com sucesso!" });
      }

      onSuccess();
      onOpenChange(false);
      setFormData({
        nome: "",
        descricao: "",
        data_inicio: "",
        data_prevista_conclusao: "",
        status: "em_andamento"
      });
    } catch (error) {
      logger.error('Erro ao salvar avaliação:', error);
      toast({ 
        title: "Erro ao salvar avaliação",
        description: "Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {assessment ? "Editar Avaliação" : "Nova Avaliação"}
            {framework && (
              <p className="text-sm text-muted-foreground font-normal mt-1">
                Framework: {framework.nome}
              </p>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Avaliação *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Avaliação ISO 27001 - Q1 2024"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva o objetivo e escopo desta avaliação"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="data_prevista_conclusao">Previsão de Conclusão</Label>
              <Input
                id="data_prevista_conclusao"
                type="date"
                value={formData.data_prevista_conclusao}
                onChange={(e) => setFormData({ ...formData, data_prevista_conclusao: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="pausada">Pausada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : assessment ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}