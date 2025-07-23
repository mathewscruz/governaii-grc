import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { FornecedorSelector } from './FornecedorSelector';
import { useToast } from '@/hooks/use-toast';
import { Copy, Mail, ExternalLink } from 'lucide-react';

interface Template {
  id: string;
  nome: string;
  categoria: string;
}

interface Assessment {
  id: string;
  fornecedor_nome: string;
  fornecedor_email: string;
  status: string;
  data_envio: string;
  data_conclusao: string | null;
  score_final: number | null;
  link_token: string;
  template: {
    nome: string;
    categoria: string;
  };
}

interface AssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessment?: Assessment;
  mode?: 'create' | 'view';
  onSuccess: () => void;
}

export function AssessmentDialog({ 
  open, 
  onOpenChange, 
  assessment, 
  mode = 'create', 
  onSuccess 
}: AssessmentDialogProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [formData, setFormData] = useState({
    template_id: '',
    fornecedor_nome: '',
    fornecedor_email: '',
    observacoes: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      if (mode === 'create') {
        fetchTemplates();
        setFormData({
          template_id: '',
          fornecedor_nome: '',
          fornecedor_email: '',
          observacoes: ''
        });
      } else if (mode === 'view' && assessment) {
        setFormData({
          template_id: '',
          fornecedor_nome: assessment.fornecedor_nome,
          fornecedor_email: assessment.fornecedor_email,
          observacoes: ''
        });
      }
    }
  }, [open, mode, assessment]);

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      
      const { data, error } = await supabase
        .from('due_diligence_templates')
        .select('id, nome, categoria')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar templates:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os templates.",
        variant: "destructive",
      });
    } finally {
      setLoadingTemplates(false);
    }
  };

  const generateUniqueToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.template_id || !formData.fornecedor_nome.trim() || !formData.fornecedor_email.trim()) {
      toast({
        title: "Erro",
        description: "Todos os campos obrigatórios devem ser preenchidos.",
        variant: "destructive",
      });
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.fornecedor_email)) {
      toast({
        title: "Erro",
        description: "Digite um email válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Buscar dados do usuário
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Usuário não autenticado');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile?.empresa_id) throw new Error('Empresa não encontrada');

      // Gerar token único
      const linkToken = generateUniqueToken();

      // Calcular data de expiração (30 dias)
      const dataExpiracao = new Date();
      dataExpiracao.setDate(dataExpiracao.getDate() + 30);

      // Criar avaliação
      const { data: newAssessment, error } = await supabase
        .from('due_diligence_assessments')
        .insert({
          template_id: formData.template_id,
          fornecedor_nome: formData.fornecedor_nome,
          fornecedor_email: formData.fornecedor_email,
          link_token: linkToken,
          observacoes: formData.observacoes || null,
          data_expiracao: dataExpiracao.toISOString(),
          empresa_id: profile.empresa_id,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Buscar nome do template selecionado
      const selectedTemplate = templates.find(t => t.id === formData.template_id);
      const templateNome = selectedTemplate?.nome || 'Due Diligence';

      // Buscar dados da empresa atual
      const { data: profileData } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      let empresaNome = 'GovernAI';
      let empresaLogoUrl = null;

      if (profileData?.empresa_id) {
        const { data: empresaData } = await supabase
          .from('empresas')
          .select('nome, logo_url')
          .eq('id', profileData.empresa_id)
          .single();
        
        if (empresaData) {
          empresaNome = empresaData.nome;
          empresaLogoUrl = empresaData.logo_url;
        }
      }

      // Enviar email de convite automaticamente
      const assessmentLink = `${window.location.origin}/assessment/${linkToken}`;
      
      console.log('Enviando email de convite...', {
        type: 'send',
        assessment_id: newAssessment.id,
        fornecedor_nome: formData.fornecedor_nome,
        fornecedor_email: formData.fornecedor_email,
        template_nome: templateNome,
        assessment_link: assessmentLink,
        empresa_nome: empresaNome,
        empresa_logo_url: empresaLogoUrl
      });

      try {
        const emailResponse = await supabase.functions.invoke('send-due-diligence-email', {
          body: {
            type: 'send',
            assessment_id: newAssessment.id,
            fornecedor_nome: formData.fornecedor_nome,
            fornecedor_email: formData.fornecedor_email,
            template_nome: templateNome,
            assessment_link: assessmentLink,
            data_expiracao: dataExpiracao.toISOString(),
            empresa_nome: empresaNome,
            empresa_logo_url: empresaLogoUrl
          }
        });

        console.log('Resposta do email:', emailResponse);

        toast({
          title: "Avaliação criada e enviada",
          description: `Avaliação para "${formData.fornecedor_nome}" criada e convite enviado por email.`,
        });
      } catch (emailError: any) {
        console.error('Erro ao enviar email:', emailError);
        toast({
          title: "Avaliação criada",
          description: `Avaliação criada, mas houve erro no envio do email: ${emailError.message}`,
          variant: "destructive",
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao criar avaliação:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar a avaliação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyAssessmentLink = async () => {
    if (!assessment?.link_token) return;
    
    const link = `${window.location.origin}/assessment/${assessment.link_token}`;
    
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Link copiado",
        description: "O link da avaliação foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluido':
        return <Badge className="bg-green-100 text-green-800">Concluído</Badge>;
      case 'em_andamento':
        return <Badge variant="secondary">Em Andamento</Badge>;
      case 'enviado':
        return <Badge variant="outline">Enviado</Badge>;
      case 'expirado':
        return <Badge variant="destructive">Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (mode === 'view' && assessment) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Avaliação</DialogTitle>
            <DialogDescription>
              Informações sobre a avaliação enviada ao fornecedor
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fornecedor</Label>
                <p className="font-medium">{assessment.fornecedor_nome}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="text-sm text-muted-foreground">{assessment.fornecedor_email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Template</Label>
                <p className="font-medium">{assessment.template.nome}</p>
              </div>
              <div>
                <Label>Status</Label>
                <div className="mt-1">
                  {getStatusBadge(assessment.status)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data de Envio</Label>
                <p className="text-sm">{new Date(assessment.data_envio).toLocaleString('pt-BR')}</p>
              </div>
              {assessment.data_conclusao && (
                <div>
                  <Label>Data de Conclusão</Label>
                  <p className="text-sm">{new Date(assessment.data_conclusao).toLocaleString('pt-BR')}</p>
                </div>
              )}
            </div>

            {assessment.score_final && (
              <div>
                <Label>Score Final</Label>
                <p className="text-2xl font-bold text-primary">{assessment.score_final.toFixed(1)}%</p>
              </div>
            )}

            <div>
              <Label>Link da Avaliação</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAssessmentLink}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copiar Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/assessment/${assessment.link_token}`, '_blank')}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Avaliação</DialogTitle>
          <DialogDescription>
            Crie uma nova avaliação para enviar ao fornecedor
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template">Template *</Label>
            <Select
              value={formData.template_id}
              onValueChange={(value) => setFormData({ ...formData, template_id: value })}
              disabled={loadingTemplates}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingTemplates ? "Carregando..." : "Selecione um template"} />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.nome} ({template.categoria})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

            <FornecedorSelector
              value={{
                nome: formData.fornecedor_nome,
                email: formData.fornecedor_email
              }}
              onChange={(fornecedor) => setFormData(prev => ({
                ...prev,
                fornecedor_nome: fornecedor.nome,
                fornecedor_email: fornecedor.email
              }))}
            />

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Informações adicionais sobre esta avaliação..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Avaliação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}