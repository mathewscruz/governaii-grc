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

interface FrameworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  framework?: any;
}

export function FrameworkDialog({ open, onOpenChange, onSuccess, framework }: FrameworkDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: framework?.nome || "",
    descricao: framework?.descricao || "",
    versao: framework?.versao || "",
    tipo_framework: framework?.tipo_framework || ""
  });

  const { toast } = useToast();
  const { user, profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile?.empresa_id) return;

    setLoading(true);
    try {
      const data = {
        ...formData,
        empresa_id: profile.empresa_id,
        created_by: user.id
      };

      if (framework) {
        const { error } = await supabase
          .from('gap_analysis_frameworks')
          .update(data)
          .eq('id', framework.id);

        if (error) throw error;
        toast({ title: "Framework atualizado com sucesso!" });
      } else {
        const { error } = await supabase
          .from('gap_analysis_frameworks')
          .insert(data);

        if (error) throw error;
        toast({ title: "Framework criado com sucesso!" });
      }

      onSuccess();
      onOpenChange(false);
      setFormData({ nome: "", descricao: "", versao: "", tipo_framework: "" });
    } catch (error) {
      console.error('Erro ao salvar framework:', error);
      toast({ 
        title: "Erro ao salvar framework",
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
            {framework ? "Editar Framework" : "Novo Framework"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Framework *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: ISO 27001, NIST, SOC 2"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="versao">Versão</Label>
            <Input
              id="versao"
              value={formData.versao}
              onChange={(e) => setFormData({ ...formData, versao: e.target.value })}
              placeholder="Ex: 2022, 1.1, v2.0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo_framework">Tipo do Framework</Label>
            <Select 
              value={formData.tipo_framework} 
              onValueChange={(value) => setFormData({ ...formData, tipo_framework: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seguranca">Segurança</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="operacional">Operacional</SelectItem>
                <SelectItem value="qualidade">Qualidade</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
                <SelectItem value="ambiental">Ambiental</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="governanca">Governança</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva o objetivo e escopo deste framework"
              rows={3}
            />
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
              {loading ? "Salvando..." : framework ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}