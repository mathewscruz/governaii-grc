import React, { useState, useEffect } from "react";
import { Plus, Settings, Trash2, Eye, EyeOff, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import { supabase } from "@/integrations/supabase/client";
import { AssessmentView } from "./AssessmentView";
import { FrameworkDialog } from "./FrameworkDialog";
import { FrameworkVisibilityDialog } from "./FrameworkVisibilityDialog";
import { toast } from "sonner";
import { Framework } from "./types";
import ConfirmDialog from "@/components/ConfirmDialog";

interface FrameworkTabsViewProps {
  onCreateFramework: () => void;
}

export const FrameworkTabsView: React.FC<FrameworkTabsViewProps> = ({
  onCreateFramework
}) => {
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(null);
  const [isFrameworkDialogOpen, setIsFrameworkDialogOpen] = useState(false);
  const [isVisibilityDialogOpen, setIsVisibilityDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("new");
  const [visibleFrameworks, setVisibleFrameworks] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; framework: Framework | null }>({ open: false, framework: null });

  const { data: frameworks = [], loading: isLoading, refetch, error } = useOptimizedQuery(
    async () => {
      const { data, error } = await supabase
        .from('gap_analysis_frameworks')
        .select('*')
        .eq('tipo', 'personalizado')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    },
    [],
    {
      cacheKey: 'gap-frameworks-tabs',
      cacheDuration: 5,
      staleTime: 2
    }
  ) as { data: Framework[], loading: boolean, refetch: () => void, error: any };

  // Carregar visibilidade dos frameworks do localStorage
  useEffect(() => {
    if (!Array.isArray(frameworks) || frameworks.length === 0) return;
    
    const saved = localStorage.getItem('gap-analysis-visible-frameworks');
    if (saved) {
      try {
        const parsedVisible = JSON.parse(saved);
        setVisibleFrameworks(new Set(parsedVisible));
      } catch (error) {
        console.error('Erro ao carregar visibilidade dos frameworks:', error);
      }
    } else {
      // Por padrão, mostrar todos os frameworks
      setVisibleFrameworks(new Set(frameworks.map(f => f.id)));
    }
  }, [frameworks]);

  // Salvar visibilidade no localStorage
  const saveVisibility = (visible: Set<string>) => {
    setVisibleFrameworks(visible);
    localStorage.setItem('gap-analysis-visible-frameworks', JSON.stringify(Array.from(visible)));
  };

  // Filtrar frameworks visíveis
  const visibleFrameworksList = Array.isArray(frameworks) ? frameworks.filter(f => visibleFrameworks.has(f.id)) : [];

  const handleFrameworkSuccess = () => {
    refetch();
    setIsFrameworkDialogOpen(false);
    toast.success("Framework salvo com sucesso!");
  };

  const handleDeleteFramework = (framework: Framework) => {
    setDeleteConfirm({ open: true, framework });
  };

  const confirmDeleteFramework = async () => {
    const framework = deleteConfirm.framework;
    if (!framework) return;

    try {
      const { error } = await supabase
        .from('gap_analysis_frameworks')
        .delete()
        .eq('id', framework.id);

      if (error) throw error;

      toast.success("Framework excluído com sucesso!");
      setDeleteConfirm({ open: false, framework: null });
      refetch();
      
      if (activeTab === framework.id) {
        setActiveTab("new");
      }
    } catch (error: any) {
      toast.error("Erro ao excluir framework: " + error.message);
      setDeleteConfirm({ open: false, framework: null });
    }
  };

  const handleEditFramework = (framework: Framework) => {
    setSelectedFramework(framework);
    setIsFrameworkDialogOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedFramework(null);
    setIsFrameworkDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-muted rounded"></div>
        <div className="h-64 bg-muted rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <p className="text-muted-foreground">Erro ao carregar frameworks</p>
        <Button onClick={() => refetch()} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-lg border overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Input
                  placeholder="Buscar frameworks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsVisibilityDialogOpen(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Visibilidade
                </Button>
              </div>
            </div>
            
            {showFilters && (
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <p className="text-sm text-muted-foreground">Filtros serão implementados em breve</p>
              </div>
            )}
          </div>

          {visibleFrameworksList.length > 0 && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0">
                <TabsTrigger
                  value="new"
                  className="flex items-center gap-2 h-10 px-4 rounded-t-md border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  <Plus className="h-4 w-4" />
                  Novo Framework
                </TabsTrigger>
                
                {visibleFrameworksList
                  .filter(framework => 
                    searchTerm === '' || 
                    framework.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    framework.tipo_framework.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((framework: Framework) => (
                  <TabsTrigger
                    key={framework.id}
                    value={framework.id}
                    className="flex items-center gap-2 h-10 px-4 rounded-t-md border-b-2 border-transparent data-[state=active]:border-primary group"
                  >
                    <span>{framework.nome}</span>
                    <Badge variant="secondary" className="text-xs">
                      {framework.versao}
                    </Badge>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditFramework(framework);
                        }}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFramework(framework);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>

            <TabsContent value="new" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Criar Novo Framework</CardTitle>
                </CardHeader>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground mb-6">
                    Clique no botão abaixo para criar um novo framework de conformidade.
                  </p>
                  <Button onClick={handleCreateNew} size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Criar Framework
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

              {visibleFrameworksList.map((framework: Framework) => (
                <TabsContent key={framework.id} value={framework.id} className="mt-6">
                  <AssessmentView
                    frameworkId={framework.id}
                    frameworkName={framework.nome}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {visibleFrameworksList.length === 0 && frameworks.length > 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Nenhum framework selecionado para exibição.
            </p>
            <Button
              variant="outline"
              onClick={() => setIsVisibilityDialogOpen(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurar Visibilidade
            </Button>
          </CardContent>
        </Card>
      )}

      <FrameworkDialog
        open={isFrameworkDialogOpen}
        onOpenChange={setIsFrameworkDialogOpen}
        onSuccess={handleFrameworkSuccess}
        framework={selectedFramework}
      />

      <FrameworkVisibilityDialog
        open={isVisibilityDialogOpen}
        onOpenChange={setIsVisibilityDialogOpen}
        frameworks={frameworks}
        visibleFrameworks={visibleFrameworks}
        onSave={saveVisibility}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
        title="Excluir Framework"
        description={`Tem certeza que deseja excluir o framework "${deleteConfirm.framework?.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={confirmDeleteFramework}
      />
    </div>
  );
};