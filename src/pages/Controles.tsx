import { useState } from "react";
import { Plus, Shield, AlertTriangle, CheckCircle, Clock, Link, BarChart3, Activity, Target, TrendingUp, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ControleDialog from "@/components/controles/ControleDialog";
import CategoriasDialog from "@/components/controles/CategoriasDialog";
import TestesList from "@/components/controles/TestesList";
import ControlesVinculacaoDialog from "@/components/controles/ControlesVinculacaoDialog";
import { RelatoriosDialog } from "@/components/controles/RelatoriosDialog";
import { useControlesStats } from "@/hooks/useControlesStats";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import ConfirmDialog from '@/components/ConfirmDialog';

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
  const [relatoriosDialogOpen, setRelatoriosDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; controleId: string }>({
    open: false,
    controleId: ''
  });
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

  const handleDelete = (id: string) => {
    setDeleteConfirm({ open: true, controleId: id });
  };

  const confirmDelete = () => {
    deleteControleMutation.mutate(deleteConfirm.controleId);
    setDeleteConfirm({ open: false, controleId: '' });
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

  const controlesColumns = [
    {
      key: 'nome' as keyof Controle,
      label: 'Nome',
      sortable: true,
      render: (controle: Controle) => (
        <div className="flex items-center gap-2">
          {getTipoIcon(controle.tipo)}
          <div>
            <div className="font-medium">{controle.nome}</div>
            <div className="text-sm text-muted-foreground">{controle.descricao || "Sem descrição"}</div>
          </div>
        </div>
      )
    },
    {
      key: 'categoria' as keyof Controle,
      label: 'Categoria',
      render: (controle: Controle) => controle.categoria ? (
        <Badge 
          variant="outline" 
          style={{ borderColor: controle.categoria.cor, color: controle.categoria.cor }}
        >
          {controle.categoria.nome}
        </Badge>
      ) : <span className="text-muted-foreground">-</span>
    },
    {
      key: 'tipo' as keyof Controle,
      label: 'Tipo',
      render: (controle: Controle) => (
        <Badge variant="secondary">{controle.tipo}</Badge>
      )
    },
    {
      key: 'status' as keyof Controle,
      label: 'Status',
      render: (controle: Controle) => getStatusBadge(controle.status)
    },
    {
      key: 'criticidade' as keyof Controle,
      label: 'Criticidade',
      render: (controle: Controle) => getCriticidadeBadge(controle.criticidade)
    },
    {
      key: 'responsavel' as keyof Controle,
      label: 'Responsável',
      render: (controle: Controle) => controle.responsavel || <span className="text-muted-foreground">-</span>
    },
    {
      key: 'proxima_avaliacao' as keyof Controle,
      label: 'Próxima Avaliação',
      render: (controle: Controle) => controle.proxima_avaliacao ? 
        new Date(controle.proxima_avaliacao).toLocaleDateString() : 
        <span className="text-muted-foreground">-</span>
    },
    {
      key: 'actions' as keyof Controle,
      label: 'Ações',
      render: (controle: Controle) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(controle)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedControleForTests(controle);
              const tabsTrigger = document.querySelector('[value="testes"]') as HTMLElement;
              if (tabsTrigger) tabsTrigger.click();
            }}
          >
            Testes
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedControleForVinculacao(controle);
              setVinculacaoDialogOpen(true);
            }}
          >
            <Link className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(controle.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Controles"
        description="Gerencie e monitore seus controles de segurança"
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setCategoriasDialogOpen(true)}
            >
              Categorias
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setRelatoriosDialogOpen(true)}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Relatórios
            </Button>
            <Button onClick={() => setControleDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Controle
            </Button>
          </div>
        }
      />

      {/* Cards de KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Controles"
          value={stats?.total || 0}
          description={`${stats?.ativos || 0} ativos`}
          icon={<Shield className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          title="Críticos & Altos"
          value={(stats?.criticos || 0) + (stats?.altos || 0)}
          description={`${stats?.criticos || 0} críticos, ${stats?.altos || 0} altos`}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant="warning"
          loading={isLoading}
        />
        <StatCard
          title="Avaliações Pendentes"
          value={stats?.vencendoAvaliacao || 0}
          description="Próximos 30 dias"
          icon={<Clock className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          title="Efetividade"
          value={`${stats?.total ? Math.round((stats?.preventivos / stats?.total) * 100) : 0}%`}
          description="Controles preventivos"
          icon={<TrendingUp className="h-4 w-4" />}
          variant="success"
          loading={isLoading}
        />
      </div>

      <Tabs defaultValue="controles" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="controles">Controles</TabsTrigger>
          <TabsTrigger value="testes" disabled={!selectedControleForTests}>
            Testes {selectedControleForTests && `- ${selectedControleForTests.nome}`}
          </TabsTrigger>
          <TabsTrigger value="vinculacoes" disabled={!selectedControleForVinculacao}>
            Vinculações {selectedControleForVinculacao && `- ${selectedControleForVinculacao.nome}`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="controles" className="space-y-6">
          <DataTable
            data={controles}
            columns={controlesColumns}
            loading={isLoading}
            emptyState={{
              icon: <Shield className="h-12 w-12" />,
              title: "Nenhum controle cadastrado",
              description: "Comece criando seu primeiro controle interno",
              action: {
                label: "Criar Primeiro Controle",
                onClick: () => setControleDialogOpen(true)
              }
            }}
          />
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
            <EmptyState
              icon={<Shield className="h-12 w-12" />}
              title="Selecione um controle"
              description="Clique em 'Testes' em um controle para visualizar seu histórico de testes"
            />
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
              <EmptyState
                icon={<Link className="h-12 w-12" />}
                title="Gerencie as Vinculações"
                description="Vincule este controle a riscos e ativos para mapear sua cobertura"
                action={{
                  label: "Abrir Editor de Vinculações",
                  onClick: () => setVinculacaoDialogOpen(true)
                }}
              />
            </div>
          ) : (
            <EmptyState
              icon={<Link className="h-12 w-12" />}
              title="Selecione um controle"
              description="Clique em 'Vincular' em um controle para gerenciar suas vinculações"
            />
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

      <RelatoriosDialog
        open={relatoriosDialogOpen}
        onOpenChange={setRelatoriosDialogOpen}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
        title="Excluir Controle"
        description="Tem certeza que deseja excluir este controle? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}