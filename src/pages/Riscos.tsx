import { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Plus, AlertTriangle, TrendingUp, CheckCircle, Shield, Settings, Tag, Edit, Trash2, X, History, Clock, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatStatus, getRiscoStatusColor, getNivelRiscoColor } from '@/lib/text-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useRiscosStats } from '@/hooks/useRiscosStats';
import { useToast } from '@/hooks/use-toast';
import { formatDateOnly } from '@/lib/date-utils';
import { differenceInDays } from 'date-fns';
import ConfirmDialog from '@/components/ConfirmDialog';
import { RiscoDialog } from '@/components/riscos/RiscoDialog';
import { TratamentosDialog } from '@/components/riscos/TratamentosDialog';
import { MatrizDialog } from '@/components/riscos/MatrizDialog';
import { CategoriasDialog } from '@/components/riscos/CategoriasDialog';
import { RiscoAnexosIcone } from '@/components/riscos/RiscoAnexosIcone';
import { RiskScoreCard } from '@/components/riscos/RiskScoreCard';
import { MatrizVisualizacao } from '@/components/riscos/MatrizVisualizacao';
import { TrilhaAuditoriaRiscos } from '@/components/riscos/TrilhaAuditoriaRiscos';
import { HistoricoAvaliacoesDialog } from '@/components/riscos/HistoricoAvaliacoesDialog';
import { AprovacaoRiscoDialog } from '@/components/riscos/AprovacaoRiscoDialog';
import { exportRiscosPDF, exportRiscosCSV } from '@/components/riscos/ExportRiscosPDF';

interface Risco {
  id: string;
  nome: string;
  descricao?: string;
  matriz_id?: string;
  categoria_id?: string;
  probabilidade_inicial?: string;
  impacto_inicial?: string;
  probabilidade_residual?: string;
  impacto_residual?: string;
  nivel_risco_inicial: string;
  nivel_risco_residual?: string;
  status: string;
  responsavel?: string;
  responsavel_nome?: string;
  responsavel_foto?: string;
  controles_existentes?: string;
  causas?: string;
  consequencias?: string;
  aceito: boolean;
  justificativa_aceite?: string;
  categoria?: { nome: string; cor?: string };
  matriz?: { nome: string };
  created_at: string;
  tratamentos_count?: number;
  data_proxima_revisao?: string;
  status_aprovacao?: string;
  aprovador_id?: string;
  historico_aprovacao?: any;
  created_by?: string;
}


interface MatrizConfig {
  niveis_risco: Array<{ min: number; max: number; nivel: string; cor?: string }>;
}

export function Riscos() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const { data: stats, refetch: refetchStats } = useRiscosStats();
  const [searchParams, setSearchParams] = useSearchParams();
  const [riscos, setRiscos] = useState<Risco[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [nivelFilter, setNivelFilter] = useState<string>('');
  const [aceitoFilter, setAceitoFilter] = useState<string>('');
  const [idsFilter, setIdsFilter] = useState<string[]>([]);
  const [riscoDialogOpen, setRiscoDialogOpen] = useState(false);
  const [matrizDialogOpen, setMatrizDialogOpen] = useState(false);
  const [editingRisco, setEditingRisco] = useState<Risco | null>(null);
  const [tratamentosDialogOpen, setTratamentosDialogOpen] = useState(false);
  const [tratamentosRisco, setTratamentosRisco] = useState<Risco | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [riscoToDelete, setRiscoToDelete] = useState<Risco | null>(null);
  const [matrizConfig, setMatrizConfig] = useState<MatrizConfig | null>(null);
  const [categoriasDialogOpen, setCategoriasDialogOpen] = useState(false);
  
  // Novos estados para dialogs
  const [auditRisco, setAuditRisco] = useState<Risco | null>(null);
  const [historicoRisco, setHistoricoRisco] = useState<Risco | null>(null);
  const [aprovacaoRisco, setAprovacaoRisco] = useState<Risco | null>(null);
  
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fetchRiscos = async () => {
    try {
      const { data, error } = await supabase
        .from('riscos')
        .select(`
          id, nome, descricao, matriz_id, categoria_id,
          probabilidade_inicial, impacto_inicial,
          probabilidade_residual, impacto_residual,
          nivel_risco_inicial, nivel_risco_residual,
          status, responsavel, controles_existentes,
          causas, consequencias, aceito, justificativa_aceite,
          created_at, data_proxima_revisao,
          status_aprovacao, aprovador_id, historico_aprovacao,
          categoria:riscos_categorias(nome, cor),
          matriz:riscos_matrizes(nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Buscar contagem de tratamentos
      const riscoIds = data?.map(r => r.id) || [];
      let tratamentosCount: Record<string, number> = {};
      
      if (riscoIds.length > 0) {
        const { data: tratamentos } = await supabase
          .from('riscos_tratamentos')
          .select('risco_id')
          .in('risco_id', riscoIds);
        
        tratamentosCount = (tratamentos || []).reduce((acc, t) => {
          acc[t.risco_id] = (acc[t.risco_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }
      
      if (data && data.length > 0) {
        const normalizedData = data.map(risco => ({
          ...risco,
          categoria: Array.isArray(risco.categoria) && risco.categoria.length > 0 
            ? risco.categoria[0] 
            : risco.categoria,
          tratamentos_count: tratamentosCount[risco.id] || 0
        }));

        const responsavelIds = normalizedData
          .map(r => r.responsavel)
          .filter(r => r && r.trim() !== '');
        
        if (responsavelIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, nome, foto_url')
            .in('user_id', responsavelIds);
          
          const profileMap = new Map(
            profiles?.map(p => [p.user_id, { nome: p.nome, foto_url: p.foto_url }]) || []
          );
          
          const mappedData = normalizedData.map(risco => {
            const profileData = (risco.responsavel && risco.responsavel.trim() !== '') 
              ? profileMap.get(risco.responsavel) 
              : null;
            return {
              ...risco,
              responsavel_nome: profileData?.nome || null,
              responsavel_foto: profileData?.foto_url || null
            };
          });
          
          setRiscos(mappedData);
        } else {
          setRiscos(normalizedData);
        }
      } else {
        setRiscos(data || []);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar riscos: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMatrizConfig = async () => {
    try {
      const { data } = await supabase
        .from('riscos_matriz_configuracao')
        .select('niveis_risco')
        .limit(1)
        .single();

      if (data) {
        setMatrizConfig({
          niveis_risco: data.niveis_risco as Array<{ min: number; max: number; nivel: string; cor?: string }>
        });
      }
    } catch (error) {
      logger.error('Erro ao carregar configuração da matriz', { error: error instanceof Error ? error.message : String(error) });
    }
  };


  useEffect(() => {
    if (profile) {
      fetchRiscos();
      fetchMatrizConfig();
    }
  }, [profile]);

  useEffect(() => {
    const itemId = location.state?.itemId;
    if (itemId && riscos.length > 0) {
      const risco = riscos.find(r => r.id === itemId);
      if (risco) {
        setEditingRisco(risco);
        setRiscoDialogOpen(true);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, riscos]);

  useEffect(() => {
    const ids = searchParams.get('ids');
    if (ids) {
      setIdsFilter(ids.split(','));
    }
  }, [searchParams]);

  const filteredRiscos = riscos.filter(risco => {
    const matchesSearch = risco.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         risco.responsavel?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || statusFilter === 'all' || risco.status === statusFilter;
    const matchesNivel = !nivelFilter || nivelFilter === 'all' || risco.nivel_risco_inicial === nivelFilter;
    const matchesAceito = !aceitoFilter || aceitoFilter === 'all' || 
                         (aceitoFilter === 'aceito' && risco.aceito) ||
                         (aceitoFilter === 'nao_aceito' && !risco.aceito);
    const matchesIds = idsFilter.length === 0 || idsFilter.includes(risco.id);

    return matchesSearch && matchesStatus && matchesNivel && matchesAceito && matchesIds;
  });

  const clearIdsFilter = () => {
    setIdsFilter([]);
    setSearchParams({});
  };

  const handleEdit = (risco: Risco) => {
    setEditingRisco(risco);
    setRiscoDialogOpen(true);
  };

  const openTratamentosDialog = (risco: Risco) => {
    setTratamentosRisco(risco);
    setTratamentosDialogOpen(true);
  };

  const openDeleteDialog = (risco: Risco) => {
    setRiscoToDelete(risco);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!riscoToDelete) return;

    try {
      const { error } = await supabase
        .from('riscos')
        .delete()
        .eq('id', riscoToDelete.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Risco excluído com sucesso!",
      });
      setDeleteDialogOpen(false);
      setRiscoToDelete(null);
      fetchRiscos();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao excluir risco: " + error.message,
        variant: "destructive",
      });
    }
  };

  const openCreateDialog = () => {
    setEditingRisco(null);
    setRiscoDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    setRiscoDialogOpen(false);
    setEditingRisco(null);
    fetchRiscos();
    refetchStats();
  };

  const handleMatrizDialogSuccess = () => {
    setMatrizDialogOpen(false);
    fetchRiscos();
    fetchMatrizConfig();
  };

  const handleCategoriasDialogSuccess = () => {
    setCategoriasDialogOpen(false);
    fetchRiscos();
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedRiscos = [...filteredRiscos].sort((a, b) => {
    let aValue: any = a[sortField as keyof Risco];
    let bValue: any = b[sortField as keyof Risco];
    
    if (sortField === 'categoria') {
      aValue = a.categoria?.nome || '';
      bValue = b.categoria?.nome || '';
    }
    
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';
    
    if (typeof aValue === 'string') {
      const comparison = aValue.localeCompare(bValue, 'pt-BR', { sensitivity: 'base' });
      return sortDirection === 'asc' ? comparison : -comparison;
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getRevisaoBadge = (dataRevisao?: string) => {
    if (!dataRevisao) return null;
    const dias = differenceInDays(new Date(dataRevisao), new Date());
    if (dias < 0) {
      return <Badge className="bg-red-100 text-red-800 border-red-200 whitespace-nowrap">Vencida</Badge>;
    }
    if (dias <= 7) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 whitespace-nowrap">{dias}d</Badge>;
    }
    return <span className="text-sm text-muted-foreground whitespace-nowrap">{formatDateOnly(dataRevisao)}</span>;
  };

  const getAprovacaoBadge = (status?: string) => {
    switch (status) {
      case 'aprovado': return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">✓</Badge>;
      case 'rejeitado': return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">✗</Badge>;
      case 'pendente': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">⏳</Badge>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-4 w-24 mb-3" /><Skeleton className="h-8 w-16 mb-2" /><Skeleton className="h-4 w-32" /></CardContent></Card>
          ))}
        </div>
        <Card className="rounded-lg border overflow-hidden">
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const riscoColumns: Array<{
    key: string;
    label: string;
    sortable?: boolean;
    className?: string;
    render?: (value: any, risco: Risco) => React.ReactNode;
  }> = [
    {
      key: 'nome',
      label: 'Nome',
      sortable: true,
      render: (value: any, risco: Risco) => (
        <div className="flex items-center gap-1.5">
          <span className="font-medium">{value}</span>
          {getAprovacaoBadge(risco.status_aprovacao)}
        </div>
      )
    },
    {
      key: 'categoria',
      label: 'Categoria',
      render: (value: any) => value ? (
        <div className="flex items-center gap-2">
          {value.cor && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: value.cor }} />}
          <span className="text-sm">{value.nome}</span>
        </div>
      ) : '-'
    },
    {
      key: 'nivel_risco_inicial',
      label: 'Nível Inicial',
      render: (value: string) => (
        <Badge className={`${getNivelRiscoColor(value)} border whitespace-nowrap`}>{value}</Badge>
      )
    },
    {
      key: 'nivel_risco_residual',
      label: 'Nível Residual',
      render: (value: string) => value ? (
        <Badge className={`${getNivelRiscoColor(value)} border whitespace-nowrap`}>{value}</Badge>
      ) : <Badge className="bg-muted text-muted-foreground border whitespace-nowrap">Não avaliado</Badge>
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <Badge className={`${getRiscoStatusColor(value)} border whitespace-nowrap`}>{formatStatus(value)}</Badge>
      )
    },
    {
      key: 'data_proxima_revisao',
      label: 'Revisão',
      render: (value: string) => getRevisaoBadge(value) || <span className="text-muted-foreground text-sm">-</span>
    },
    {
      key: 'tratamentos_count',
      label: 'Tratam.',
      className: 'text-center',
      render: (value: number, risco: Risco) => (
        <Button variant="ghost" size="sm" className="flex items-center gap-1" onClick={() => openTratamentosDialog(risco)}>
          <Shield className="h-4 w-4" />
          <Badge variant={value > 0 ? "default" : "outline"} className="ml-1">{value || 0}</Badge>
        </Button>
      )
    },
    {
      key: 'responsavel',
      label: 'Resp.',
      render: (value: string, risco: Risco) => {
        if (risco.responsavel_nome) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer">
                    {risco.responsavel_foto && <AvatarImage src={risco.responsavel_foto} alt={risco.responsavel_nome} />}
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {risco.responsavel_nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent><p>{risco.responsavel_nome}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }
        return '-';
      }
    },
    {
      key: 'actions',
      label: 'Ações',
      className: 'w-[140px]',
      render: (value: any, risco: Risco) => (
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => setHistoricoRisco(risco)}>
                <Clock className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Histórico avaliações</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => setAuditRisco(risco)}>
                <History className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Trilha de auditoria</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => handleEdit(risco)}>
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Editar</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(risco)} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Excluir</p></TooltipContent>
          </Tooltip>
        </div>
      )
    }
  ];

  const filters = [
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'Todos' },
        { value: 'identificado', label: 'Identificado' },
        { value: 'analisado', label: 'Analisado' },
        { value: 'tratado', label: 'Tratado' },
        { value: 'monitorado', label: 'Monitorado' },
        { value: 'aceito', label: 'Aceito' }
      ],
      value: statusFilter,
      onChange: (value: string) => setStatusFilter(value === 'all' ? '' : value)
    },
    {
      key: 'nivel',
      label: 'Nível',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'Todos' },
        { value: 'Crítico', label: 'Crítico' },
        { value: 'Muito Alto', label: 'Muito Alto' },
        { value: 'Alto', label: 'Alto' },
        { value: 'Médio', label: 'Médio' },
        { value: 'Baixo', label: 'Baixo' },
        { value: 'Muito Baixo', label: 'Muito Baixo' }
      ],
      value: nivelFilter,
      onChange: (value: string) => setNivelFilter(value === 'all' ? '' : value)
    },
    {
      key: 'aceito',
      label: 'Aceito',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'Todos' },
        { value: 'aceito', label: 'Aceitos' },
        { value: 'nao_aceito', label: 'Não Aceitos' }
      ],
      value: aceitoFilter,
      onChange: (value: string) => setAceitoFilter(value === 'all' ? '' : value)
    }
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <PageHeader
          title="Gestão de Riscos"
          description="Identifique, avalie e monitore riscos organizacionais de forma estruturada"
        />

        {/* KPI Cards + Matriz */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="Total de Riscos"
              value={stats?.total || 0}
              description={`${stats?.criticos || 0} críticos, ${stats?.altos || 0} altos`}
              icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
              variant={stats?.criticos ? "destructive" : "default"}
              loading={!stats}
            />
            <StatCard
              title="Tratamentos Concluídos"
              value={stats?.tratamentos_concluidos || 0}
              description={`${stats?.tratamentos_andamento || 0} em andamento`}
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
              variant="success"
              loading={!stats}
            />
            <StatCard
              title="Riscos Aceitos"
              value={stats?.aceitos || 0}
              description="Aceitos formalmente"
              icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
              variant="warning"
              loading={!stats}
            />
            <RiskScoreCard stats={stats} loading={!stats} />
          </div>
          <div className="lg:col-span-1">
            <MatrizVisualizacao />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            {idsFilter.length > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1 whitespace-nowrap">
                Filtro da Matriz ({idsFilter.length})
                <Button variant="ghost" size="sm" className="h-4 w-4 p-0 hover:bg-transparent" onClick={clearIdsFilter}>
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportRiscosCSV(sortedRiscos)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportRiscosPDF(sortedRiscos, stats)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Exportar PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={() => setCategoriasDialogOpen(true)} className="whitespace-nowrap">
              <Tag className="mr-2 h-4 w-4" />
              Categorias
            </Button>
            <Button variant="outline" size="sm" onClick={() => setMatrizDialogOpen(true)} className="whitespace-nowrap">
              <Settings className="mr-2 h-4 w-4" />
              Matriz
            </Button>
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Risco
            </Button>
          </div>
        </div>

        {/* DataTable */}
        <Card className="rounded-lg border overflow-hidden">
          <CardContent className="p-0">
            <DataTable
              data={sortedRiscos}
              columns={riscoColumns as Column<Risco>[]}
              loading={loading}
              searchable
              searchPlaceholder="Buscar riscos..."
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              filters={filters}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              emptyState={{
                icon: <AlertTriangle className="h-8 w-8" />,
                title: searchTerm || statusFilter !== '' || nivelFilter !== '' || aceitoFilter !== ''
                  ? 'Nenhum risco encontrado'
                  : 'Nenhum risco cadastrado',
                description: searchTerm || statusFilter !== '' || nivelFilter !== '' || aceitoFilter !== ''
                  ? 'Tente ajustar os filtros para encontrar o que procura.'
                  : 'Comece identificando e cadastrando os riscos da sua organização.',
                action: !searchTerm && statusFilter === '' && nivelFilter === '' && aceitoFilter === '' ? {
                  label: 'Cadastrar Primeiro Risco',
                  onClick: openCreateDialog
                } : undefined
              }}
            />
          </CardContent>
        </Card>
        
        {/* Dialogs */}
        <RiscoDialog
          open={riscoDialogOpen}
          onOpenChange={setRiscoDialogOpen}
          risco={editingRisco}
          onSuccess={handleDialogSuccess}
        />

        <TratamentosDialog
          open={tratamentosDialogOpen}
          onOpenChange={setTratamentosDialogOpen}
          risco={tratamentosRisco}
          onSuccess={fetchRiscos}
        />

        <MatrizDialog
          open={matrizDialogOpen}
          onOpenChange={setMatrizDialogOpen}
          onSuccess={handleMatrizDialogSuccess}
        />

        <CategoriasDialog
          open={categoriasDialogOpen}
          onOpenChange={setCategoriasDialogOpen}
          onSuccess={handleCategoriasDialogSuccess}
        />

        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Excluir Risco"
          description={`Tem certeza que deseja excluir o risco "${riscoToDelete?.nome}"? Esta ação não pode ser desfeita.`}
          onConfirm={handleDelete}
        />

        {/* Novos Dialogs */}
        {auditRisco && (
          <TrilhaAuditoriaRiscos
            open={!!auditRisco}
            onOpenChange={(open) => !open && setAuditRisco(null)}
            riscoId={auditRisco.id}
            riscoNome={auditRisco.nome}
          />
        )}

        {historicoRisco && (
          <HistoricoAvaliacoesDialog
            open={!!historicoRisco}
            onOpenChange={(open) => !open && setHistoricoRisco(null)}
            riscoId={historicoRisco.id}
            riscoNome={historicoRisco.nome}
          />
        )}

        {aprovacaoRisco && (
          <AprovacaoRiscoDialog
            open={!!aprovacaoRisco}
            onOpenChange={(open) => !open && setAprovacaoRisco(null)}
            risco={aprovacaoRisco}
            onSuccess={() => { setAprovacaoRisco(null); fetchRiscos(); }}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
