import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Copy, Trash2, FileText, Settings, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TemplateDialog } from './TemplateDialog';
import ConfirmDialog from '@/components/ConfirmDialog';

interface Template {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  ativo: boolean;
  versao: number;
  created_at: string;
  padrao?: boolean;
  _count?: {
    questions: number;
    assessments: number;
  };
}

export function TemplatesManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [templateDialog, setTemplateDialog] = useState<{
    open: boolean;
    template?: Template;
    mode?: 'create' | 'edit' | 'duplicate' | 'questions';
  }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    template?: Template;
  }>({ open: false });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('due_diligence_templates')
        .select(`
          id,
          nome,
          descricao,
          categoria,
          ativo,
          versao,
          created_at,
          padrao
        `)
        .order('padrao', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar contagem de perguntas e avaliações para cada template
      const templatesWithCounts = await Promise.all(
        (data || []).map(async (template) => {
          const [questionsCount, assessmentsCount] = await Promise.all([
            supabase
              .from('due_diligence_questions')
              .select('id', { count: 'exact' })
              .eq('template_id', template.id),
            supabase
              .from('due_diligence_assessments')
              .select('id', { count: 'exact' })
              .eq('template_id', template.id)
          ]);

          return {
            ...template,
            _count: {
              questions: questionsCount.count || 0,
              assessments: assessmentsCount.count || 0
            }
          };
        })
      );

      setTemplates(templatesWithCounts);
    } catch (error: any) {
      console.error('Erro ao buscar templates:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os templates.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (template: Template) => {
    try {
      // Verificar se o template tem avaliações
      if (template._count?.assessments && template._count.assessments > 0) {
        toast({
          title: "Não é possível excluir",
          description: "Este template possui avaliações vinculadas e não pode ser excluído.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('due_diligence_templates')
        .delete()
        .eq('id', template.id);

      if (error) throw error;

      toast({
        title: "Template excluído",
        description: "O template foi excluído com sucesso.",
      });

      fetchTemplates();
    } catch (error: any) {
      console.error('Erro ao excluir template:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o template.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialog({ open: false });
    }
  };

  const toggleTemplateStatus = async (template: Template) => {
    try {
      const { error } = await supabase
        .from('due_diligence_templates')
        .update({ ativo: !template.ativo })
        .eq('id', template.id);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Template ${!template.ativo ? 'ativado' : 'desativado'} com sucesso.`,
      });

      fetchTemplates();
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do template.",
        variant: "destructive",
      });
    }
  };

  const getCategoryColor = (categoria: string) => {
    const colors: Record<string, string> = {
      'seguranca': 'bg-red-100 text-red-800',
      'Segurança': 'bg-red-100 text-red-800', 
      'Privacidade': 'bg-blue-100 text-blue-800',
      'compliance': 'bg-blue-100 text-blue-800',
      'financeiro': 'bg-green-100 text-green-800',
      'operacional': 'bg-purple-100 text-purple-800',
      'geral': 'bg-gray-100 text-gray-800'
    };
    return colors[categoria] || colors['geral'];
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
              <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded animate-pulse"></div>
                <div className="h-3 bg-muted rounded w-3/4 animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Templates de Questionários</h2>
          <p className="text-muted-foreground">
            Crie e gerencie templates reutilizáveis para avaliações de fornecedores
          </p>
        </div>
        <Button 
          onClick={() => setTemplateDialog({ open: true, mode: 'create' })}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Template
        </Button>
      </div>

      {templates.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className={`${!template.ativo ? 'opacity-60' : ''} ${template.padrao ? 'border-amber-200 bg-amber-50/50' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{template.nome}</CardTitle>
                      {template.padrao && (
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                          <Star className="h-3 w-3 mr-1" />
                          Padrão
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-1">
                      {template.descricao || 'Sem descrição'}
                    </CardDescription>
                  </div>
                  <Badge className={getCategoryColor(template.categoria)}>
                    {template.categoria}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{template._count?.questions || 0} perguntas</span>
                  <span>{template._count?.assessments || 0} avaliações</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={template.ativo ? "default" : "secondary"}>
                      {template.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">v{template.versao}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTemplateDialog({ 
                        open: true, 
                        template, 
                        mode: 'questions' 
                      })}
                      title="Gerenciar perguntas"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTemplateDialog({ 
                        open: true, 
                        template, 
                        mode: 'edit' 
                      })}
                      title="Editar template"
                      disabled={template.padrao}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTemplateDialog({ 
                        open: true, 
                        template, 
                        mode: 'duplicate' 
                      })}
                      title="Duplicar template"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTemplateStatus(template)}
                      title="Alterar status"
                      disabled={template.padrao}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteDialog({ open: true, template })}
                      title="Excluir template"
                      disabled={template.padrao || (!!template._count?.assessments && template._count.assessments > 0)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Criado em {new Date(template.created_at).toLocaleDateString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie seu primeiro template de questionário para começar a avaliar fornecedores
            </p>
            <Button 
              onClick={() => setTemplateDialog({ open: true, mode: 'create' })}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Criar Primeiro Template
            </Button>
          </CardContent>
        </Card>
      )}

      <TemplateDialog
        open={templateDialog.open}
        onOpenChange={(open) => setTemplateDialog({ open })}
        template={templateDialog.template}
        mode={templateDialog.mode}
        onSuccess={() => {
          fetchTemplates();
          setTemplateDialog({ open: false });
        }}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open })}
        title="Excluir Template"
        description={`Tem certeza que deseja excluir o template "${deleteDialog.template?.nome}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => deleteDialog.template && handleDeleteTemplate(deleteDialog.template)}
      />
    </div>
  );
}