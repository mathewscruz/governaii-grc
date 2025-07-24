import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface Requirement {
  id: string;
  framework_id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  categoria: string;
  peso: number;
  obrigatorio: boolean;
  referencia_externa?: string;
  ordem: number;
}

interface RequirementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  frameworkId: string;
  requirement?: Requirement | null;
  onSuccess: () => void;
}

export const RequirementDialog = ({
  open,
  onOpenChange,
  frameworkId,
  requirement,
  onSuccess
}: RequirementDialogProps) => {
  const [formData, setFormData] = useState({
    codigo: requirement?.codigo || '',
    titulo: requirement?.titulo || '',
    descricao: requirement?.descricao || '',
    categoria: requirement?.categoria || '',
    peso: requirement?.peso || 1,
    obrigatorio: requirement?.obrigatorio || false,
    referencia_externa: requirement?.referencia_externa || '',
    ordem: requirement?.ordem || 1
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const requirementData = {
        ...formData,
        framework_id: frameworkId,
      };

      if (requirement) {
        const { error } = await supabase
          .from('gap_analysis_requirements')
          .update(requirementData)
          .eq('id', requirement.id);
        
        if (error) throw error;
        
        toast({
          title: "Requisito atualizado",
          description: "O requisito foi atualizado com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from('gap_analysis_requirements')
          .insert([requirementData]);
        
        if (error) throw error;
        
        toast({
          title: "Requisito criado",
          description: "O requisito foi criado com sucesso.",
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar requisito:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o requisito.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const categorias = [
    'Governança',
    'Segurança',
    'Operações',
    'Conformidade',
    'Gestão de Riscos',
    'Controles Internos',
    'Auditoria',
    'Monitoramento'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {requirement ? 'Editar Requisito' : 'Novo Requisito'}
          </DialogTitle>
          <DialogDescription>
            {requirement 
              ? 'Edite as informações do requisito selecionado.' 
              : 'Adicione um novo requisito ao framework.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                placeholder="Ex: REQ-001"
                required
              />
            </div>
            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Select 
                value={formData.categoria} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria} value={categoria}>
                      {categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              placeholder="Digite o título do requisito"
              required
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descreva detalhadamente o requisito"
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="peso">Peso</Label>
              <Input
                id="peso"
                type="number"
                min="1"
                max="10"
                value={formData.peso}
                onChange={(e) => setFormData(prev => ({ ...prev, peso: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div>
              <Label htmlFor="ordem">Ordem</Label>
              <Input
                id="ordem"
                type="number"
                min="1"
                value={formData.ordem}
                onChange={(e) => setFormData(prev => ({ ...prev, ordem: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div className="flex items-center space-x-2 mt-6">
              <Switch
                id="obrigatorio"
                checked={formData.obrigatorio}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, obrigatorio: checked }))}
              />
              <Label htmlFor="obrigatorio">Obrigatório</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="referencia_externa">Referência Externa</Label>
            <Input
              id="referencia_externa"
              value={formData.referencia_externa}
              onChange={(e) => setFormData(prev => ({ ...prev, referencia_externa: e.target.value }))}
              placeholder="Ex: ISO 27001:2013 - A.5.1.1"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : requirement ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};