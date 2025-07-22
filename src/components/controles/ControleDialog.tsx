import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Controle {
  id: string;
  nome: string;
  descricao?: string;
  tipo: string;
  categoria_id?: string;
  processo?: string;
  area?: string;
  responsavel?: string;
  frequencia?: string;
  status: string;
  criticidade: string;
  data_implementacao?: string;
  proxima_avaliacao?: string;
}

interface Categoria {
  id: string;
  nome: string;
  cor: string;
}

interface ControleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  controle: Controle | null;
  categorias: Categoria[];
}

export default function ControleDialog({ open, onOpenChange, controle, categorias }: ControleDialogProps) {
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    tipo: "preventivo",
    categoria_id: "",
    processo: "",
    area: "",
    responsavel: "",
    frequencia: "",
    status: "ativo",
    criticidade: "medio",
    data_implementacao: "",
    proxima_avaliacao: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (controle) {
      setFormData({
        nome: controle.nome || "",
        descricao: controle.descricao || "",
        tipo: controle.tipo || "preventivo",
        categoria_id: controle.categoria_id || "",
        processo: controle.processo || "",
        area: controle.area || "",
        responsavel: controle.responsavel || "",
        frequencia: controle.frequencia || "",
        status: controle.status || "ativo",
        criticidade: controle.criticidade || "medio",
        data_implementacao: controle.data_implementacao || "",
        proxima_avaliacao: controle.proxima_avaliacao || ""
      });
    } else {
      setFormData({
        nome: "",
        descricao: "",
        tipo: "preventivo",
        categoria_id: "",
        processo: "",
        area: "",
        responsavel: "",
        frequencia: "",
        status: "ativo",
        criticidade: "medio",
        data_implementacao: "",
        proxima_avaliacao: ""
      });
    }
  }, [controle, open]);

  const saveControleMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Obter empresa_id do usuário atual
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.empresa_id) {
        throw new Error('Empresa não encontrada');
      }

      const controleData = {
        ...data,
        empresa_id: profile.empresa_id,
        categoria_id: data.categoria_id || null,
        data_implementacao: data.data_implementacao || null,
        proxima_avaliacao: data.proxima_avaliacao || null
      };

      if (controle) {
        const { error } = await supabase
          .from('controles')
          .update(controleData)
          .eq('id', controle.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('controles')
          .insert([controleData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controles'] });
      toast({
        title: controle ? "Controle atualizado" : "Controle criado",
        description: controle ? "O controle foi atualizado com sucesso." : "O controle foi criado com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível ${controle ? 'atualizar' : 'criar'} o controle: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "O nome do controle é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    saveControleMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {controle ? "Editar Controle" : "Novo Controle"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome do controle"
                required
              />
            </div>

            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventivo">Preventivo</SelectItem>
                  <SelectItem value="detectivo">Detectivo</SelectItem>
                  <SelectItem value="corretivo">Corretivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descrição do controle"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Select value={formData.categoria_id} onValueChange={(value) => setFormData(prev => ({ ...prev, categoria_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem categoria</SelectItem>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="processo">Processo</Label>
              <Input
                id="processo"
                value={formData.processo}
                onChange={(e) => setFormData(prev => ({ ...prev, processo: e.target.value }))}
                placeholder="Processo relacionado"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="area">Área</Label>
              <Input
                id="area"
                value={formData.area}
                onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                placeholder="Área responsável"
              />
            </div>

            <div>
              <Label htmlFor="responsavel">Responsável</Label>
              <Input
                id="responsavel"
                value={formData.responsavel}
                onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
                placeholder="Responsável pelo controle"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="frequencia">Frequência</Label>
              <Select value={formData.frequencia} onValueChange={(value) => setFormData(prev => ({ ...prev, frequencia: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diaria">Diária</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="em_revisao">Em Revisão</SelectItem>
                  <SelectItem value="descontinuado">Descontinuado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="criticidade">Criticidade</Label>
              <Select value={formData.criticidade} onValueChange={(value) => setFormData(prev => ({ ...prev, criticidade: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixo">Baixo</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                  <SelectItem value="critico">Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data_implementacao">Data de Implementação</Label>
              <Input
                id="data_implementacao"
                type="date"
                value={formData.data_implementacao}
                onChange={(e) => setFormData(prev => ({ ...prev, data_implementacao: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="proxima_avaliacao">Próxima Avaliação</Label>
              <Input
                id="proxima_avaliacao"
                type="date"
                value={formData.proxima_avaliacao}
                onChange={(e) => setFormData(prev => ({ ...prev, proxima_avaliacao: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveControleMutation.isPending}>
              {saveControleMutation.isPending ? "Salvando..." : (controle ? "Atualizar" : "Criar")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}