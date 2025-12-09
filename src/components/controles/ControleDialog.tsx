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
import { UserSelect } from "@/components/riscos/UserSelect";
import { RiscoSelect } from "@/components/controles/RiscoSelect";
import { AuditoriasMultiSelect } from "@/components/controles/AuditoriasMultiSelect";

// Função para converter data do input para formato date-only sem timezone
const formatDateForDatabase = (dateString: string): string | null => {
  if (!dateString) return null;
  // Garante que a data seja salva como date-only sem conversão de timezone
  return dateString;
};

// Função para converter data do banco para o input
const formatDateForInput = (dateString: string | null): string => {
  if (!dateString) return '';
  // Remove qualquer informação de timezone e retorna apenas YYYY-MM-DD
  return dateString.split('T')[0];
};

interface Controle {
  id: string;
  nome: string;
  descricao?: string;
  tipo: string;
  categoria_id?: string;
  area?: string;
  responsavel_id?: string;
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
    categoria_id: "sem_categoria",
    risco_id: "",
    area: "",
    responsavel_id: "",
    frequencia: "",
    status: "ativo",
    criticidade: "medio",
    data_implementacao: "",
    proxima_avaliacao: "",
    auditorias_ids: [] as string[]
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (controle) {
      // Buscar risco vinculado
      const fetchRiscoVinculado = async () => {
        const { data } = await supabase
          .from('controles_riscos')
          .select('risco_id')
          .eq('controle_id', controle.id)
          .maybeSingle();
        
        return data?.risco_id || "";
      };

      // Buscar auditorias vinculadas
      const fetchAuditoriasVinculadas = async () => {
        const { data } = await supabase
          .from('controles_auditorias')
          .select('auditoria_id')
          .eq('controle_id', controle.id);
        
        return data?.map(item => item.auditoria_id) || [];
      };

      Promise.all([fetchRiscoVinculado(), fetchAuditoriasVinculadas()]).then(
        ([riscoId, auditoriasIds]) => {
          setFormData({
            nome: controle.nome || "",
            descricao: controle.descricao || "",
            tipo: controle.tipo || "preventivo",
            categoria_id: controle.categoria_id || "sem_categoria",
            risco_id: riscoId,
            area: controle.area || "",
            responsavel_id: controle.responsavel_id || "",
            frequencia: controle.frequencia || "",
            status: controle.status || "ativo",
            criticidade: controle.criticidade || "medio",
            data_implementacao: formatDateForInput(controle.data_implementacao),
            proxima_avaliacao: formatDateForInput(controle.proxima_avaliacao),
            auditorias_ids: auditoriasIds
          });
        }
      );
    } else {
      setFormData({
        nome: "",
        descricao: "",
        tipo: "preventivo",
        categoria_id: "sem_categoria",
        risco_id: "",
        area: "",
        responsavel_id: "",
        frequencia: "",
        status: "ativo",
        criticidade: "medio",
        data_implementacao: "",
        proxima_avaliacao: "",
        auditorias_ids: []
      });
    }
  }, [controle, open]);

  const saveControleMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.empresa_id) {
        throw new Error('Empresa não encontrada');
      }

      const controleData = {
        nome: data.nome,
        descricao: data.descricao,
        tipo: data.tipo,
        categoria_id: data.categoria_id === "sem_categoria" ? null : data.categoria_id,
        responsavel_id: data.responsavel_id || null,
        area: data.area,
        frequencia: data.frequencia,
        status: data.status,
        criticidade: data.criticidade,
        data_implementacao: formatDateForDatabase(data.data_implementacao),
        proxima_avaliacao: formatDateForDatabase(data.proxima_avaliacao),
        empresa_id: profile.empresa_id
      };

      let controleId: string;
      const previousResponsavelId = controle?.responsavel_id;
      const isNewResponsavel = data.responsavel_id && 
        ((!controle && data.responsavel_id) || (controle && previousResponsavelId !== data.responsavel_id));

      if (controle) {
        const { error } = await supabase
          .from('controles')
          .update(controleData)
          .eq('id', controle.id);
        if (error) throw error;
        controleId = controle.id;
      } else {
        const { data: newControle, error } = await supabase
          .from('controles')
          .insert([controleData])
          .select()
          .single();
        if (error) throw error;
        controleId = newControle.id;
      }

      // Gerenciar relacionamento com risco
      await supabase
        .from('controles_riscos')
        .delete()
        .eq('controle_id', controleId);

      if (data.risco_id) {
        await supabase
          .from('controles_riscos')
          .insert([{
            controle_id: controleId,
            risco_id: data.risco_id,
            tipo_vinculacao: 'mitigacao'
          }]);
      }

      // Gerenciar relacionamentos com auditorias
      await supabase
        .from('controles_auditorias')
        .delete()
        .eq('controle_id', controleId);

      if (data.auditorias_ids.length > 0) {
        const auditoriasInserts = data.auditorias_ids.map(auditoriaId => ({
          controle_id: controleId,
          auditoria_id: auditoriaId
        }));

        await supabase
          .from('controles_auditorias')
          .insert(auditoriasInserts);
      }

      // Send notification to new responsible user
      if (isNewResponsavel && data.responsavel_id) {
        try {
          console.log("Sending controle notification to:", data.responsavel_id);
          const { error: notificationError } = await supabase.functions.invoke('send-controle-notification', {
            body: {
              controle_id: controleId,
              controle_nome: data.nome,
              controle_descricao: data.descricao,
              proxima_avaliacao: data.proxima_avaliacao,
              responsavel_id: data.responsavel_id
            }
          });
          
          if (notificationError) {
            console.error("Error sending notification:", notificationError);
          } else {
            console.log("Controle notification sent successfully");
          }
        } catch (notifyError) {
          console.error("Failed to send controle notification:", notifyError);
          // Don't throw - notification failure shouldn't block the save
        }
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
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
              placeholder="Descrição do controle (suporta quebras de linha)"
              rows={6}
              className="whitespace-pre-wrap"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Select value={formData.categoria_id || "sem_categoria"} onValueChange={(value) => setFormData(prev => ({ ...prev, categoria_id: value === "sem_categoria" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem_categoria">Sem categoria</SelectItem>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="risco">Risco Relacionado</Label>
              <RiscoSelect
                value={formData.risco_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, risco_id: value }))}
                placeholder="Nenhum risco"
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
              <UserSelect
                value={formData.responsavel_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, responsavel_id: value }))}
                placeholder="Selecionar responsável..."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="auditorias">Auditorias Relacionadas</Label>
            <AuditoriasMultiSelect
              value={formData.auditorias_ids}
              onValueChange={(value) => setFormData(prev => ({ ...prev, auditorias_ids: value }))}
              placeholder="Nenhuma auditoria selecionada"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Selecione as auditorias onde este controle será testado/avaliado
            </p>
          </div>

          <div className="grid grid-cols-3 gap-5">
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
              <Label htmlFor="proxima_avaliacao">Vencimento da Avaliação</Label>
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