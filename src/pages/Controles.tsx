import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Plus, Shield, AlertTriangle, CheckCircle, Clock, Link, BarChart3, Activity, Target, TrendingUp, Edit, Trash2, Filter, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ControleDialog from "@/components/controles/ControleDialog";
import CategoriasDialog from "@/components/controles/CategoriasDialog";
import TestesDialog from "@/components/controles/TestesDialog";
import ControlesVinculacaoDialog from "@/components/controles/ControlesVinculacaoDialog";
import { RelatoriosDialog } from "@/components/controles/RelatoriosDialog";
import { useControlesStats } from "@/hooks/useControlesStats";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/ui/data-table";
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
import { capitalizeText } from '@/lib/text-utils';
import { formatDateOnly } from '@/lib/date-utils';

interface Controle {
  id: string;
  nome: string;
  descricao?: string;
  tipo: string;
  processo?: string;
  area?: string;
  responsavel_id?: string;
  responsavel_nome?: string;
  responsavel_foto?: string;
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
  const location = useLocation();
  const [controleDialogOpen, setControleDialogOpen] = useState(false);
  const [categoriasDialogOpen, setCategoriasDialogOpen] = useState(false);
  const [testesDialogOpen, setTestesDialogOpen] = useState(false);
  const [vinculacaoDialogOpen, setVinculacaoDialogOpen] = useState(false);
  const [relatoriosDialogOpen, setRelatoriosDialogOpen] = useState(false);
  const [editingControle, setEditingControle] = useState<Controle | null>(null);
  const [selectedControleForTests, setSelectedControleForTests] = useState<Controle | null>(null);
  const [selectedControleForVinculacao, setSelectedControleForVinculacao] = useState<Controle | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; controleId: string }>({
    open: false,
    controleId: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [criticidadeFilter, setCriticidadeFilter] = useState<string>("todos");
  const [searchValue, setSearchValue] = useState<string>("");
  const [sortField, setSortField] = useState<string>("nome");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, tipoFilter, criticidadeFilter, searchValue]);

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
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
      
      // Buscar nomes e fotos dos responsáveis
      if (data && data.length > 0) {
        const responsavelIds = data
          .map(c => c.responsavel_id)
          .filter(r => r && r.trim() !== '');
        
        if (responsavelIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, nome, foto_url')
            .in('user_id', responsavelIds);
          
          const profileMap = new Map(
            profiles?.map(p => [p.user_id, { nome: p.nome, foto_url: p.foto_url }]) || []
          );
          
          const mappedData = data.map(controle => {
            const profileData = (controle.responsavel_id && controle.responsavel_id.trim() !== '') 
              ? profileMap.get(controle.responsavel_id) 
              : null;
            return {
              ...controle,
              responsavel_nome: profileData?.nome || null,
              responsavel_foto: profileData?.foto_url || null
            };
          });
          
          return mappedData as Controle[];
        }
      }
      
      return data as Controle[];
    }
  });

  // Detectar se veio com itemId do dashboard
  useEffect(() => {
    const itemId = location.state?.itemId;
    if (itemId && controles.length > 0) {
      const controle = controles.find(c => c.id === itemId);
      if (controle) {
        setEditingControle(controle);
        setControleDialogOpen(true);
        // Limpar o state para evitar reaberturas
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, controles]);

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

  // Filter and sort data
  const sortedControles = useMemo(() => {
    const filtered = controles.filter(controle => {
      const matchStatus = statusFilter === "todos" || controle.status === statusFilter;
      const matchTipo = tipoFilter === "todos" || controle.tipo === tipoFilter;
      const matchCriticidade = criticidadeFilter === "todos" || controle.criticidade === criticidadeFilter;
      const matchSearch = !searchValue || 
        controle.nome.toLowerCase().includes(searchValue.toLowerCase()) ||
        controle.descricao?.toLowerCase().includes(searchValue.toLowerCase());
      
      return matchStatus && matchTipo && matchCriticidade && matchSearch;
    });

    return filtered.sort((a, b) => {
      let aVal: any = a[sortField as keyof Controle];
      let bVal: any = b[sortField as keyof Controle];
      
      // Tratamento especial para datas
      if (sortField === 'proxima_avaliacao' || sortField === 'data_implementacao') {
        aVal = aVal ? new Date(aVal as string).getTime() : 0;
        bVal = bVal ? new Date(bVal as string).getTime() : 0;
      }
      
      // Tratamento para categoria (objeto aninhado)
      if (sortField === 'categoria') {
        aVal = a.categoria?.nome || '';
        bVal = b.categoria?.nome || '';
      }
      
      // Tratamento para responsável
      if (sortField === 'responsavel') {
        aVal = a.responsavel_nome || '';
        bVal = b.responsavel_nome || '';
      }
      
      // Comparação
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [controles, sortField, sortDirection, statusFilter, tipoFilter, criticidadeFilter, searchValue]);

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case 'ativo':
        return 'default';
      case 'inativo':
        return 'secondary';
      case 'em_revisao':
        return 'outline';
      case 'descontinuado':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusCustomClass = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200';
      case 'em_revisao':
        return 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200';
      default:
        return '';
    }
  };

  const getStatusBadge = (status: string) => {
    const displayText = status.replace(/_/g, ' ');
    
    return (
      <Badge 
        variant={getStatusBadgeVariant(status)} 
        className={`${getStatusCustomClass(status)} whitespace-nowrap`}
      >
        {capitalizeText(displayText)}
      </Badge>
    );
  };

  const getCriticidadeBadgeVariant = (criticidade: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (criticidade) {
      case 'critico':
        return 'destructive';
      case 'alto':
        return 'default';
      case 'medio':
        return 'secondary';
      case 'baixo':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getCriticidadeCustomClass = (criticidade: string) => {
    switch (criticidade) {
      case 'critico':
        return 'bg-red-600 text-white border-red-700 hover:bg-red-700';
      case 'alto':
        return 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200';
      default:
        return '';
    }
  };

  const getCriticidadeBadge = (criticidade: string) => {
    return (
      <Badge 
        variant={getCriticidadeBadgeVariant(criticidade)} 
        className={getCriticidadeCustomClass(criticidade)}
      >
        {capitalizeText(criticidade)}
      </Badge>
    );
  };

  const getTipoBadgeVariant = (tipo: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (tipo) {
      case 'preventivo':
        return 'default';
      case 'detectivo':
        return 'secondary';
      case 'corretivo':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getTipoCustomClass = (tipo: string) => {
    switch (tipo) {
      case 'corretivo':
        return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200';
      default:
        return '';
    }
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
      render: (value: any, controle: Controle) => (
        <span className="font-medium">{controle.nome}</span>
      )
    },
    {
      key: 'categoria' as keyof Controle,
      label: 'Categoria',
      sortable: true,
      render: (value: any, controle: Controle) => controle.categoria ? (
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
      sortable: true,
      render: (value: any, controle: Controle) => (
        <Badge 
          variant={getTipoBadgeVariant(controle.tipo)} 
          className={getTipoCustomClass(controle.tipo)}
        >
          {capitalizeText(controle.tipo)}
        </Badge>
      )
    },
    {
      key: 'status' as keyof Controle,
      label: 'Status',
      sortable: true,
      render: (value: any, controle: Controle) => getStatusBadge(controle.status)
    },
    {
      key: 'criticidade' as keyof Controle,
      label: 'Criticidade',
      sortable: true,
      render: (value: any, controle: Controle) => getCriticidadeBadge(controle.criticidade)
    },
    {
      key: 'responsavel' as keyof Controle,
      label: 'Responsável',
      sortable: true,
      render: (value: any, controle: Controle) => {
        if (controle.responsavel_nome) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer">
                    {controle.responsavel_foto && (
                      <AvatarImage src={controle.responsavel_foto} alt={controle.responsavel_nome} />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {controle.responsavel_nome
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{controle.responsavel_nome}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }
        return <span className="text-muted-foreground">-</span>;
      }
    },
    {
      key: 'proxima_avaliacao' as keyof Controle,
      label: 'Vencimento da Avaliação',
      sortable: true,
      render: (value: any, controle: Controle) => controle.proxima_avaliacao ? 
        formatDateOnly(controle.proxima_avaliacao) : 
        <span className="text-muted-foreground">-</span>
    },
    {
      key: 'actions' as keyof Controle,
      label: 'Ações',
      sortable: false,
      render: (value: any, controle: Controle) => (
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
              setTestesDialogOpen(true);
            }}
            title="Gerenciar Testes"
          >
            <TestTube className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedControleForVinculacao(controle);
              setVinculacaoDialogOpen(true);
            }}
            title="Gerenciar Vinculações"
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
          title="Vencimento Próximo"
          value={stats?.vencendoAvaliacao || 0}
          description="Próximo 1 mês"
          icon={<Clock className="h-4 w-4" />}
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

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex-1"></div>
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

      {/* DataTable with sorting */}
      <DataTable
        data={sortedControles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
        columns={controlesColumns}
        loading={isLoading}
        searchable={true}
        searchPlaceholder="Buscar controles..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'todos', label: 'Todos os Status' },
              { value: 'ativo', label: 'Ativo' },
              { value: 'inativo', label: 'Inativo' },
              { value: 'em_revisao', label: 'Em Revisão' },
              { value: 'descontinuado', label: 'Descontinuado' },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
          {
            key: 'tipo',
            label: 'Tipo',
            options: [
              { value: 'todos', label: 'Todos os Tipos' },
              { value: 'preventivo', label: 'Preventivo' },
              { value: 'detectivo', label: 'Detectivo' },
              { value: 'corretivo', label: 'Corretivo' },
            ],
            value: tipoFilter,
            onChange: setTipoFilter,
          },
          {
            key: 'criticidade',
            label: 'Criticidade',
            options: [
              { value: 'todos', label: 'Todas as Criticidades' },
              { value: 'baixo', label: 'Baixo' },
              { value: 'medio', label: 'Médio' },
              { value: 'alto', label: 'Alto' },
              { value: 'critico', label: 'Crítico' },
            ],
            value: criticidadeFilter,
            onChange: setCriticidadeFilter,
          },
        ]}
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

      {/* Pagination */}
      {sortedControles.length > itemsPerPage && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, sortedControles.length)} de {sortedControles.length} controles
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {[...Array(Math.ceil(sortedControles.length / itemsPerPage))].map((_, index) => {
                const pageNumber = index + 1;
                const totalPages = Math.ceil(sortedControles.length / itemsPerPage);
                
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
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(sortedControles.length / itemsPerPage)))}
                  className={currentPage === Math.ceil(sortedControles.length / itemsPerPage) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

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

      <TestesDialog
        open={testesDialogOpen}
        onOpenChange={(open) => {
          setTestesDialogOpen(open);
          if (!open) setSelectedControleForTests(null);
        }}
        controleId={selectedControleForTests?.id}
        controleNome={selectedControleForTests?.nome}
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