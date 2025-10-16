import { useState, useEffect } from "react";
import { Plus, Shield, AlertTriangle, CheckCircle, Clock, Link, BarChart3, Activity, Target, TrendingUp, Edit, Trash2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ControleDialog from "@/components/controles/ControleDialog";
import CategoriasDialog from "@/components/controles/CategoriasDialog";
import TestesList from "@/components/controles/TestesList";
import ControlesVinculacaoDialog from "@/components/controles/ControlesVinculacaoDialog";
import { RelatoriosDialog } from "@/components/controles/RelatoriosDialog";
import { useControlesStats } from "@/hooks/useControlesStats";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { capitalizeText, getControleStatusColor, getCriticidadeColor, getControleTipoColor } from '@/lib/text-utils';

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
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [criticidadeFilter, setCriticidadeFilter] = useState<string>("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, tipoFilter, criticidadeFilter]);
  
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
    const colorClasses = getControleStatusColor(status);
    const displayText = status.replace(/_/g, ' ');
    
    return (
      <Badge 
        variant="outline" 
        className={colorClasses}
      >
        {capitalizeText(displayText)}
      </Badge>
    );
  };

  const getCriticidadeBadge = (criticidade: string) => {
    const colorClasses = getCriticidadeColor(criticidade);
    
    return (
      <Badge 
        variant="outline" 
        className={colorClasses}
      >
        {capitalizeText(criticidade)}
      </Badge>
    );
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
          <span className="font-medium">{controle.nome}</span>
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
        <Badge 
          variant="outline" 
          className={getControleTipoColor(controle.tipo)}
        >
          {capitalizeText(controle.tipo)}
        </Badge>
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
        actions={undefined}
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
          <Card className="rounded-lg border overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <Input
                    placeholder="Buscar controles..."
                    className="max-w-sm"
                  />
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCategoriasDialogOpen(true)}
                    >
                      Categorias
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      Filtros
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setRelatoriosDialogOpen(true)}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Relatórios
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => setControleDialogOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Controle
                    </Button>
                  </div>
                </div>
              </div>
              {showFilters && (
                <div className="flex gap-4 items-center flex-wrap p-4 bg-muted/50 rounded-lg mb-4">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Status</SelectItem>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="em_revisao">Em Revisão</SelectItem>
                      <SelectItem value="descontinuado">Descontinuado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={tipoFilter} onValueChange={setTipoFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Tipos</SelectItem>
                      <SelectItem value="preventivo">Preventivo</SelectItem>
                      <SelectItem value="detectivo">Detectivo</SelectItem>
                      <SelectItem value="corretivo">Corretivo</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={criticidadeFilter} onValueChange={setCriticidadeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Criticidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas as Criticidades</SelectItem>
                      <SelectItem value="baixo">Baixo</SelectItem>
                      <SelectItem value="medio">Médio</SelectItem>
                      <SelectItem value="alto">Alto</SelectItem>
                      <SelectItem value="critico">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criticidade</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Próxima Avaliação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                      </TableRow>
                    ))
                  ) : controles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="p-0">
                        <EmptyState
                          icon={<Shield className="h-12 w-12" />}
                          title="Nenhum controle cadastrado"
                          description="Comece criando seu primeiro controle interno"
                          action={{
                            label: "Criar Primeiro Controle",
                            onClick: () => setControleDialogOpen(true)
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ) : (() => {
                    // Aplicar filtros
                    const filteredControles = controles.filter(controle => {
                      const matchStatus = statusFilter === "todos" || controle.status === statusFilter;
                      const matchTipo = tipoFilter === "todos" || controle.tipo === tipoFilter;
                      const matchCriticidade = criticidadeFilter === "todos" || controle.criticidade === criticidadeFilter;
                      
                      return matchStatus && matchTipo && matchCriticidade;
                    });

                    // Calcular paginação
                    const indexOfLastItem = currentPage * itemsPerPage;
                    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                    const currentControles = filteredControles.slice(indexOfFirstItem, indexOfLastItem);
                    const totalPages = Math.ceil(filteredControles.length / itemsPerPage);

                    return (
                      <>
                        {currentControles.map((controle) => (
                      <TableRow key={controle.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTipoIcon(controle.tipo)}
                            <span className="font-medium">{controle.nome}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {controle.categoria ? (
                            <Badge 
                              variant="outline" 
                              style={{ borderColor: controle.categoria.cor, color: controle.categoria.cor }}
                            >
                              {controle.categoria.nome}
                            </Badge>
                          ) : <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={getControleTipoColor(controle.tipo)}
                          >
                            {capitalizeText(controle.tipo)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(controle.status)}
                        </TableCell>
                        <TableCell>
                          {getCriticidadeBadge(controle.criticidade)}
                        </TableCell>
                        <TableCell>
                          {controle.responsavel || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          {controle.proxima_avaliacao ? 
                            new Date(controle.proxima_avaliacao).toLocaleDateString() : 
                            <span className="text-muted-foreground">-</span>
                          }
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Paginação */}
                    {totalPages > 1 && (
                      <TableRow>
                        <TableCell colSpan={8}>
                          <div className="flex items-center justify-between px-2 py-4">
                            <div className="text-sm text-muted-foreground">
                              Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredControles.length)} de {filteredControles.length} controles
                            </div>
                            <Pagination>
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious 
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                  />
                                </PaginationItem>
                                
                                {[...Array(totalPages)].map((_, index) => {
                                  const pageNumber = index + 1;
                                  
                                  if (
                                    pageNumber === 1 ||
                                    pageNumber === totalPages ||
                                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                  ) {
                                    return (
                                      <PaginationItem key={pageNumber}>
                                        <PaginationLink
                                          onClick={() => setCurrentPage(pageNumber)}
                                          isActive={currentPage === pageNumber}
                                          className="cursor-pointer"
                                        >
                                          {pageNumber}
                                        </PaginationLink>
                                      </PaginationItem>
                                    );
                                  } else if (
                                    pageNumber === currentPage - 2 ||
                                    pageNumber === currentPage + 2
                                  ) {
                                    return (
                                      <PaginationItem key={pageNumber}>
                                        <PaginationEllipsis />
                                      </PaginationItem>
                                    );
                                  }
                                  return null;
                                })}
                                
                                <PaginationItem>
                                  <PaginationNext 
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                  />
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })()}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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