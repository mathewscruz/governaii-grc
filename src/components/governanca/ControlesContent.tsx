import { useState, useEffect, useMemo } from "react";
import { useEmpresaId } from '@/hooks/useEmpresaId';
import { useLocation, useSearchParams } from "react-router-dom";
import { Plus, Shield, AlertTriangle, CheckCircle, Clock, Link, BarChart3, Activity, Target, TrendingUp, Edit, Trash2, Filter, TestTube, Download, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ControleDetalheDialog } from "@/components/controles/ControleDetalheDialog";
import CategoriasDialog from "@/components/controles/CategoriasDialog";
import TestesDialog from "@/components/controles/TestesDialog";
import ControlesVinculacaoDialog from "@/components/controles/ControlesVinculacaoDialog";
import { RelatoriosDialog } from "@/components/controles/RelatoriosDialog";
import { useControlesStats } from "@/hooks/useControlesStats";
import { StatCard } from "@/components/ui/stat-card";
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
import { capitalizeText, formatStatus, getCriticidadeColor, getItemStatusColor, getControleTipoColor } from '@/lib/text-utils';
import { formatDateOnly } from '@/lib/date-utils';

interface Controle {
  id: string;
  codigo?: string;
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
  testesCount?: number;
}

interface Categoria {
  id: string;
  nome: string;
  descricao?: string;
  cor: string;
}

export default function ControlesContent() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [controleDialogOpen, setControleDialogOpen] = useState(false);
  const [categoriasDialogOpen, setCategoriasDialogOpen] = useState(false);
  const [testesDialogOpen, setTestesDialogOpen] = useState(false);
  const [vinculacaoDialogOpen, setVinculacaoDialogOpen] = useState(false);
  const [relatoriosDialogOpen, setRelatoriosDialogOpen] = useState(false);
  const [editingControle, setEditingControle] = useState<Controle | null>(null);
  const [selectedControleForTests, setSelectedControleForTests] = useState<Controle | null>(null);
  const [selectedControleForVinculacao, setSelectedControleForVinculacao] = useState<Controle | null>(null);
  const [selectedControleForDetail, setSelectedControleForDetail] = useState<Controle | null>(null);
  const [detalheDialogOpen, setDetalheDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; controleId: string }>({
    open: false,
    controleId: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [criticidadeFilter, setCriticidadeFilter] = useState<string>("todos");
  const [auditoriaFilter, setAuditoriaFilter] = useState<string>("todas");
  const [searchValue, setSearchValue] = useState<string>("");
  const [sortField, setSortField] = useState<string>("nome");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { empresaId } = useEmpresaId();
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, tipoFilter, criticidadeFilter, auditoriaFilter, searchValue]);

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

  // Buscar auditorias para o filtro
  const { data: auditorias = [] } = useQuery({
    queryKey: ['auditorias-lista', empresaId],
    queryFn: async () => {
      const { data } = await supabase
        .from('auditorias')
        .select('id, nome')
        .eq('empresa_id', empresaId!)
        .order('nome');
      return data || [];
    },
    enabled: !!empresaId,
  });

  // Buscar controles
  const { data: controles = [], isLoading } = useQuery({
    queryKey: ['controles', empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('controles')
        .select(`
          *,
          categoria:controles_categorias(nome, cor)
        `)
        .eq('empresa_id', empresaId!)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Buscar nomes e fotos dos responsáveis e contagem de testes
      if (data && data.length > 0) {
        const responsavelIds = data
          .map(c => c.responsavel_id)
          .filter(r => r && r.trim() !== '');
        
        // Buscar contagem de testes para cada controle (filtrado por IDs da empresa)
        const ids = data.map(c => c.id);
        const { data: testes } = await supabase
          .from('controles_testes')
          .select('controle_id')
          .in('controle_id', ids);
        
        const testesCountMap = new Map<string, number>();
        testes?.forEach(t => {
          const count = testesCountMap.get(t.controle_id) || 0;
          testesCountMap.set(t.controle_id, count + 1);
        });
        
        let profileMap = new Map<string, { nome: string; foto_url: string | null }>();
        
        if (responsavelIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, nome, foto_url')
            .in('user_id', responsavelIds);
          
          profileMap = new Map(
            profiles?.map(p => [p.user_id, { nome: p.nome, foto_url: p.foto_url }]) || []
          );
        }
        
        const mappedData = data.map(controle => {
          const profileData = (controle.responsavel_id && controle.responsavel_id.trim() !== '') 
            ? profileMap.get(controle.responsavel_id) 
            : null;
          return {
            ...controle,
            responsavel_nome: profileData?.nome || null,
            responsavel_foto: profileData?.foto_url || null,
            testesCount: testesCountMap.get(controle.id) || 0
          };
        });
        
        return mappedData as Controle[];
      }
      
      return data as Controle[];
    },
    enabled: !!empresaId,
  });

  // Buscar vínculos controles-auditorias (filtrado pelos controles da empresa)
  const controleIds = useMemo(() => controles.map(c => c.id), [controles]);
  const { data: vinculos = [] } = useQuery({
    queryKey: ['controles-auditorias-vinculos', empresaId, controleIds],
    queryFn: async () => {
      if (controleIds.length === 0) return [];
      const { data } = await supabase
        .from('controles_auditorias')
        .select('controle_id, auditoria_id')
        .in('controle_id', controleIds);
      return data || [];
    },
    enabled: !!empresaId && controleIds.length > 0
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

  // Detectar parâmetro de controle na URL (deep link do e-mail)
  useEffect(() => {
    const controleId = searchParams.get('controle');
    if (controleId && controles.length > 0) {
      const controle = controles.find(c => c.id === controleId);
      if (controle) {
        setSelectedControleForDetail(controle);
        setDetalheDialogOpen(true);
        // Limpar o parâmetro da URL para evitar reabrir em refresh
        searchParams.delete('controle');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, controles, setSearchParams]);

  // Buscar categorias filtradas por empresa
  const { data: categorias = [] } = useQuery({
    queryKey: ['controles_categorias', empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('controles_categorias')
        .select('*')
        .eq('empresa_id', empresaId!)
        .order('nome');
      
      if (error) throw error;
      return data as Categoria[];
    },
    enabled: !!empresaId
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

  const handleOpenDetail = (controle: Controle) => {
    setSelectedControleForDetail(controle);
    setDetalheDialogOpen(true);
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
      const matchAuditoria = auditoriaFilter === "todas" || 
        vinculos.some(v => v.controle_id === controle.id && v.auditoria_id === auditoriaFilter);
      const matchSearch = !searchValue || 
        controle.nome.toLowerCase().includes(searchValue.toLowerCase()) ||
        controle.descricao?.toLowerCase().includes(searchValue.toLowerCase());
      
      return matchStatus && matchTipo && matchCriticidade && matchAuditoria && matchSearch;
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
  }, [controles, sortField, sortDirection, statusFilter, tipoFilter, criticidadeFilter, auditoriaFilter, vinculos, searchValue]);

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={`${getItemStatusColor(status)} whitespace-nowrap`}>
        {formatStatus(status)}
      </Badge>
    );
  };

  const getCriticidadeBadge = (criticidade: string) => {
    return (
      <Badge className={`${getCriticidadeColor(criticidade)} whitespace-nowrap`}>
        {formatStatus(criticidade)}
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
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const controlesColumns = [
    {
      key: 'codigo' as keyof Controle,
      label: 'Código',
      sortable: true,
      render: (value: any, controle: Controle) => (
        <span className="font-mono text-xs text-muted-foreground">
          {controle.codigo || '-'}
        </span>
      )
    },
    {
      key: 'nome' as keyof Controle,
      label: 'Nome',
      sortable: true,
      render: (value: any, controle: Controle) => (
        <button 
          className="font-medium text-left hover:text-primary hover:underline transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenDetail(controle);
          }}
        >
          {controle.nome}
        </button>
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
        <Badge className={`${getControleTipoColor(controle.tipo)} whitespace-nowrap`}>
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
      key: 'testesCount' as keyof Controle,
      label: 'Testes',
      sortable: true,
      render: (value: any, controle: Controle) => (
        <Badge 
          variant={controle.testesCount && controle.testesCount > 0 ? "secondary" : "outline"}
          className="whitespace-nowrap"
        >
          {controle.testesCount || 0}
        </Badge>
      )
    },
    {
      key: 'proxima_avaliacao' as keyof Controle,
      label: 'Vencimento',
      sortable: true,
      render: (value: any, controle: Controle) => {
        if (!controle.proxima_avaliacao) {
          return <span className="text-muted-foreground">-</span>;
        }
        
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataAvaliacao = new Date(controle.proxima_avaliacao);
        dataAvaliacao.setHours(0, 0, 0, 0);
        const isVencido = dataAvaliacao < hoje;
        
        return (
          <span className={isVencido ? "text-destructive font-medium" : ""}>
            {formatDateOnly(controle.proxima_avaliacao)}
            {isVencido && <span className="ml-1 text-xs">(Vencido)</span>}
          </span>
        );
      }
    },
    {
      key: 'actions' as keyof Controle,
      label: 'Ações',
      sortable: false,
      render: (value: any, controle: Controle) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(controle)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setSelectedControleForTests(controle);
              setTestesDialogOpen(true);
            }}>
              <TestTube className="h-4 w-4 mr-2" />
              Gerenciar Testes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setSelectedControleForVinculacao(controle);
              setVinculacaoDialogOpen(true);
            }}>
              <Link className="h-4 w-4 mr-2" />
              Gerenciar Vinculações
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(controle.id)} className="text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  return (
    <div className="space-y-6">
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
          title="Avaliações Vencidas"
          value={stats?.vencidos || 0}
          description="Requerem atenção imediata"
          icon={<AlertTriangle className="h-4 w-4" />}
          variant="destructive"
          loading={isLoading}
        />
        <StatCard
          title="Vencendo em 30 Dias"
          value={stats?.vencendoAvaliacao || 0}
          description="Próximas avaliações"
          icon={<Clock className="h-4 w-4" />}
          variant="warning"
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={() => {
                const headers = ["Código", "Nome", "Tipo", "Status", "Criticidade", "Responsável", "Testes"];
                const rows = sortedControles.map(c => [
                  c.codigo || '',
                  c.nome,
                  c.tipo,
                  c.status,
                  c.criticidade,
                  c.responsavel_nome || '',
                  c.testesCount || 0
                ]);
                const csvContent = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
                const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `controles_${new Date().toISOString().split("T")[0]}.csv`;
                link.click();
                toast({ title: "Exportação concluída", description: "O arquivo CSV foi baixado." });
              }}>
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Exportar CSV</TooltipContent>
          </Tooltip>
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
      <Card className="rounded-lg border overflow-hidden">
        <CardContent className="p-0">
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
              {
                key: 'auditoria',
                label: 'Auditoria',
                options: [
                  { value: 'todas', label: 'Todas as Auditorias' },
                  ...auditorias.map(a => ({ value: a.id, label: a.nome }))
                ],
                value: auditoriaFilter,
                onChange: setAuditoriaFilter,
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
        </CardContent>
      </Card>

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

      <ControleDetalheDialog
        open={detalheDialogOpen}
        onOpenChange={(open) => {
          setDetalheDialogOpen(open);
          if (!open) setSelectedControleForDetail(null);
        }}
        controle={selectedControleForDetail}
        onEdit={() => {
          setDetalheDialogOpen(false);
          if (selectedControleForDetail) {
            handleEdit(selectedControleForDetail);
          }
        }}
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
