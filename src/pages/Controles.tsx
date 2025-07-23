import { useState } from "react";
import { Plus, Shield, AlertTriangle, CheckCircle, Clock, Link, BarChart3, Activity, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ControleDialog from "@/components/controles/ControleDialog";
import CategoriasDialog from "@/components/controles/CategoriasDialog";
import TestesList from "@/components/controles/TestesList";
import ControlesVinculacaoDialog from "@/components/controles/ControlesVinculacaoDialog";
import ControlesDashboard from "@/components/controles/ControlesDashboard";
import { useControlesStats } from "@/hooks/useControlesStats";

interface Controle {
  id: string;
  nome: string;
  descricao?: string;
  tipo: string;
  processo?: string;
  area?: string;
  responsavel?: string;
  frequencia?: string;
  status: string;
  criticidade: string;
  data_implementacao?: string;
  proxima_avaliacao?: string;
  categoria?: {
    nome: string;
    cor: string;
  };
}

interface Categoria {
  id: string;
  nome: string;
  descricao?: string;
  cor: string;
}

export default function Controles() {
  const [controleDialogOpen, setControleDialogOpen] = useState(false);
  const [categoriasDialogOpen, setCategoriasDialogOpen] = useState(false);
  const [editingControle, setEditingControle] = useState<Controle | null>(null);
  const [selectedControleForTests, setSelectedControleForTests] = useState<Controle | null>(null);
  const [vinculacaoDialogOpen, setVinculacaoDialogOpen] = useState(false);
  const [selectedControleForVinculacao, setSelectedControleForVinculacao] = useState<Controle | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Buscar estatísticas dos controles
  const { data: stats } = useControlesStats();

  // Buscar controles
  const { data: controles = [], isLoading } = useQuery({
    queryKey: ['controles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('controles')
        .select(`
          *,
          categoria:controles_categorias(nome, cor)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Controle[];
    }
  });

  // Buscar categorias
  const { data: categorias = [] } = useQuery({
    queryKey: ['controles_categorias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('controles_categorias')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data as Categoria[];
    }
  });

  // Deletar controle
  const deleteControleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('controles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controles'] });
      toast({
        title: "Controle excluído",
        description: "O controle foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o controle.",
        variant: "destructive",
      });
    }
  });

  const handleEdit = (controle: Controle) => {
    setEditingControle(controle);
    setControleDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este controle?")) {
      deleteControleMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ativo: "default",
      inativo: "secondary",
      em_revisao: "outline",
      descontinuado: "destructive"
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || "default"}>{status}</Badge>;
  };

  const getCriticidadeBadge = (criticidade: string) => {
    const variants = {
      baixo: "secondary",
      medio: "default", 
      alto: "destructive",
      critico: "destructive"
    } as const;
    
    return <Badge variant={variants[criticidade as keyof typeof variants] || "default"}>{criticidade}</Badge>;
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'preventivo': return <Shield className="w-4 h-4 text-blue-500" />;
      case 'detectivo': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'corretivo': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Controles</h1>
          <p className="text-muted-foreground">
            Gerencie e monitore seus controles de segurança
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setCategoriasDialogOpen(true)}
          >
            Categorias
          </Button>
          <Button onClick={() => setControleDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Controle
          </Button>
        </div>
      </div>

      {/* Cards de KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Controles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.ativos || 0} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticos & Altos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.criticos || 0) + (stats?.altos || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.criticos || 0} críticos, {stats?.altos || 0} altos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliações Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.vencendoAvaliacao || 0}</div>
            <p className="text-xs text-muted-foreground">
              Próximos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efetividade</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total ? Math.round((stats?.preventivos / stats?.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Controles preventivos
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="controles">Controles</TabsTrigger>
          <TabsTrigger value="testes" disabled={!selectedControleForTests}>
            Testes {selectedControleForTests && `- ${selectedControleForTests.nome}`}
          </TabsTrigger>
          <TabsTrigger value="vinculacoes" disabled={!selectedControleForVinculacao}>
            Vinculações {selectedControleForVinculacao && `- ${selectedControleForVinculacao.nome}`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <ControlesDashboard />
        </TabsContent>

        <TabsContent value="controles" className="space-y-6">
          {/* Lista de Controles */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {controles.map((controle) => (
              <Card key={controle.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTipoIcon(controle.tipo)}
                      <CardTitle className="text-lg">{controle.nome}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      {getStatusBadge(controle.status)}
                      {getCriticidadeBadge(controle.criticidade)}
                    </div>
                  </div>
                  {controle.categoria && (
                    <Badge 
                      variant="outline" 
                      style={{ borderColor: controle.categoria.cor, color: controle.categoria.cor }}
                    >
                      {controle.categoria.nome}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {controle.descricao || "Sem descrição"}
                  </CardDescription>
                  
                  <div className="space-y-2 text-sm">
                    {controle.processo && (
                      <div><strong>Processo:</strong> {controle.processo}</div>
                    )}
                    {controle.area && (
                      <div><strong>Área:</strong> {controle.area}</div>
                    )}
                    {controle.responsavel && (
                      <div><strong>Responsável:</strong> {controle.responsavel}</div>
                    )}
                    {controle.frequencia && (
                      <div><strong>Frequência:</strong> {controle.frequencia}</div>
                    )}
                    {controle.proxima_avaliacao && (
                      <div><strong>Próxima Avaliação:</strong> {new Date(controle.proxima_avaliacao).toLocaleDateString()}</div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(controle)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedControleForTests(controle);
                        // Mudar para a aba de testes
                        const tabsTrigger = document.querySelector('[value="testes"]') as HTMLElement;
                        if (tabsTrigger) tabsTrigger.click();
                      }}
                    >
                      Testes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedControleForVinculacao(controle);
                        setVinculacaoDialogOpen(true);
                      }}
                    >
                      <Link className="w-4 h-4 mr-1" />
                      Vincular
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(controle.id)}
                    >
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {controles.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum controle cadastrado</h3>
                <p className="text-muted-foreground mb-4">
                  Comece criando seu primeiro controle interno
                </p>
                <Button onClick={() => setControleDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Controle
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="testes">
          {selectedControleForTests ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setSelectedControleForTests(null)}
                >
                  ← Voltar aos Controles
                </Button>
              </div>
              <TestesList 
                controleId={selectedControleForTests.id} 
                controleNome={selectedControleForTests.nome}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selecione um controle</h3>
                <p className="text-muted-foreground">
                  Clique em "Testes" em um controle para visualizar seu histórico de testes
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="vinculacoes">
          {selectedControleForVinculacao ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setSelectedControleForVinculacao(null)}
                >
                  ← Voltar aos Controles
                </Button>
              </div>
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Link className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Gerencie as Vinculações</h3>
                  <p className="text-muted-foreground mb-4">
                    Vincule este controle a riscos e ativos para mapear sua cobertura
                  </p>
                  <Button onClick={() => setVinculacaoDialogOpen(true)}>
                    Abrir Editor de Vinculações
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Link className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selecione um controle</h3>
                <p className="text-muted-foreground">
                  Clique em "Vincular" em um controle para gerenciar suas vinculações
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <ControleDialog
        open={controleDialogOpen}
        onOpenChange={(open) => {
          setControleDialogOpen(open);
          if (!open) setEditingControle(null);
        }}
        controle={editingControle}
        categorias={categorias}
      />

      <CategoriasDialog
        open={categoriasDialogOpen}
        onOpenChange={setCategoriasDialogOpen}
      />

      <ControlesVinculacaoDialog
        open={vinculacaoDialogOpen}
        onOpenChange={setVinculacaoDialogOpen}
        controleId={selectedControleForVinculacao?.id}
        controleNome={selectedControleForVinculacao?.nome}
      />
    </div>
  );
}