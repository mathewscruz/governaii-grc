import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Copy, Trash2, FileText, Settings, Star, RefreshCw, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

const fetchTemplates = async (): Promise<Template[]> => {
  console.log('🔄 Iniciando busca de templates...');
  
  // Buscar templates primeiro
  const { data: templatesData, error: templatesError } = await supabase
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

  if (templatesError) {
    console.error('❌ Erro ao buscar templates:', templatesError);
    throw templatesError;
  }

  console.log('✅ Templates encontrados:', templatesData?.length || 0);

  // Buscar contagem de perguntas e avaliações para cada template
  const templatesWithCounts = await Promise.all(
    (templatesData || []).map(async (template) => {
      console.log(`🔍 Buscando dados para template: ${template.nome} (ID: ${template.id})`);
      
      const [questionsResult, assessmentsResult] = await Promise.all([
        supabase
          .from('due_diligence_questions')
          .select('id', { count: 'exact', head: true })
          .eq('template_id', template.id),
        supabase
          .from('due_diligence_assessments')
          .select('id', { count: 'exact', head: true })
          .eq('template_id', template.id)
      ]);

      const questionsCount = questionsResult.count || 0;
      const assessmentsCount = assessmentsResult.count || 0;
      
      console.log(`📊 Template ${template.nome}: ${questionsCount} perguntas, ${assessmentsCount} avaliações`);

      if (questionsResult.error) {
        console.error('❌ Erro ao buscar perguntas:', questionsResult.error);
      }
      
      if (assessmentsResult.error) {
        console.error('❌ Erro ao buscar avaliações:', assessmentsResult.error);
      }

      return {
        ...template,
        _count: {
          questions: questionsCount,
          assessments: assessmentsCount
        }
      };
    })
  );

  console.log('✅ Templates com contagens processados:', templatesWithCounts);
  return templatesWithCounts;
};

export function TemplatesManager() {
  const [templateDialog, setTemplateDialog] = useState<{
    open: boolean;
    template?: Template;
    mode?: 'create' | 'edit' | 'duplicate' | 'questions';
  }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    template?: Template;
  }>({ open: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // React Query para gerenciar os templates
  const {
    data: templates = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['due-diligence-templates'],
    queryFn: fetchTemplates,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });

  // Mostrar erro se houver
  if (error) {
    console.error('❌ Erro na query de templates:', error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar os templates.",
      variant: "destructive",
    });
  }

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

      // Invalidar cache e refazer busca
      queryClient.invalidateQueries({ queryKey: ['due-diligence-templates'] });
      refetch();
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

      // Invalidar cache e refazer busca
      queryClient.invalidateQueries({ queryKey: ['due-diligence-templates'] });
      refetch();
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Templates de Questionários</h2>
            <p className="text-muted-foreground">
              Carregando templates...
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="h-5 bg-muted rounded w-3/4 animate-pulse mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-3 bg-muted rounded w-16 animate-pulse"></div>
                        <div className="h-3 bg-muted rounded w-16 animate-pulse"></div>
                        <div className="h-5 bg-muted rounded w-12 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-4">
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Card className="rounded-lg border overflow-hidden">
      <CardContent className="p-0">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Input
                placeholder="Buscar templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''} mr-2`} />
                Atualizar
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button 
                size="sm"
                onClick={() => setTemplateDialog({ open: true, mode: 'create' })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Template
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <p className="text-sm text-muted-foreground">Filtros serão implementados em breve</p>
            </div>
          )}
        </div>

        {templates.length > 0 ? (
          <div className="space-y-3">
            {templates.filter(template => 
              searchTerm === '' || 
              template.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
              template.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
              template.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
            ).map((template) => (
            <Card key={template.id} className={`${!template.ativo ? 'opacity-60' : ''} ${template.padrao ? 'border-amber-200 bg-amber-50/50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold truncate">{template.nome}</h3>
                          {template.padrao && (
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Padrão
                            </Badge>
                          )}
                          <Badge className={getCategoryColor(template.categoria)}>
                            {template.categoria}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {template.descricao || 'Sem descrição'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{template._count?.questions || 0} perguntas</span>
                        <span>{template._count?.assessments || 0} avaliações</span>
                        <Badge variant={template.ativo ? "default" : "secondary"}>
                          {template.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <span className="text-xs">v{template.versao}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-4">
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
                
                <div className="text-xs text-muted-foreground mt-2 border-t pt-2">
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
      </CardContent>
    </Card>

    <div>
      <TemplateDialog
        open={templateDialog.open}
        onOpenChange={(open) => setTemplateDialog({ open })}
        template={templateDialog.template}
        mode={templateDialog.mode}
        onSuccess={() => {
          // Invalidar cache e refazer busca
          queryClient.invalidateQueries({ queryKey: ['due-diligence-templates'] });
          refetch();
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
    </div>
  );
}