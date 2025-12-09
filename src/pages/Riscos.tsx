import { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Plus, Search, AlertTriangle, TrendingUp, CheckCircle, Shield, Settings, Tag, Edit, FileText, Trash2, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { capitalizeText, formatStatus } from '@/lib/text-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useRiscosStats } from '@/hooks/useRiscosStats';
import { useToast } from '@/hooks/use-toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { RiscoDialog } from '@/components/riscos/RiscoDialog';
import { TratamentosDialog } from '@/components/riscos/TratamentosDialog';
import { MatrizDialog } from '@/components/riscos/MatrizDialog';
import { CategoriasDialog } from '@/components/riscos/CategoriasDialog';
import { RiscoAnexosIcone } from '@/components/riscos/RiscoAnexosIcone';
import { RiskScoreCard } from '@/components/riscos/RiskScoreCard';

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
  const [showFilters, setShowFilters] = useState(false);

  const fetchRiscos = async () => {
    try {
      const { data, error } = await supabase
        .from('riscos')
        .select(`
          id,
          nome,
          descricao,
          matriz_id,
          categoria_id,
          probabilidade_inicial,
          impacto_inicial,
          probabilidade_residual,
          impacto_residual,
          nivel_risco_inicial,
          nivel_risco_residual,
          status,
          responsavel,
          controles_existentes,
          causas,
          consequencias,
          aceito,
          justificativa_aceite,
          created_at,
          categoria:riscos_categorias(nome, cor),
          matriz:riscos_matrizes(nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Normalizar categoria (pode vir como array do Supabase)
      if (data && data.length > 0) {
        const normalizedData = data.map(risco => ({
          ...risco,
          categoria: Array.isArray(risco.categoria) && risco.categoria.length > 0 
            ? risco.categoria[0] 
            : risco.categoria
        }));

        // Buscar nomes dos responsáveis
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
      console.error('Erro ao carregar configuração da matriz:', error);
    }
  };


  useEffect(() => {
    if (profile) {
      fetchRiscos();
      fetchMatrizConfig();
    }
  }, [profile]);

  // Detectar se veio com itemId do dashboard
  useEffect(() => {
    const itemId = location.state?.itemId;
    if (itemId && riscos.length > 0) {
      const risco = riscos.find(r => r.id === itemId);
      if (risco) {
        setEditingRisco(risco);
        setRiscoDialogOpen(true);
        // Limpar o state para evitar reaberturas
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
    // Invalidar cache de stats para forçar recálculo em tempo real
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

  const getNivelBadgeVariant = (nivel: string) => {
    if (matrizConfig) {
      const nivelConfig = matrizConfig.niveis_risco.find(n => n.nivel === nivel);
      if (nivelConfig?.cor) {
        return 'default';
      }
    }

    // Fallback para cores padrão se não houver configuração
    switch (nivel) {
      case 'Crítico':
      case 'Muito Alto':
        return 'destructive';
      case 'Alto':
        return 'destructive';
      case 'Médio':
        return 'secondary';
      case 'Baixo':
      case 'Muito Baixo':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getNivelBadgeStyle = (nivel: string) => {
    if (matrizConfig) {
      const nivelConfig = matrizConfig.niveis_risco.find(n => n.nivel === nivel);
      if (nivelConfig?.cor) {
        return {
          backgroundColor: nivelConfig.cor,
          color: 'white',
          borderColor: nivelConfig.cor
        };
      }
    }
    return {};
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'identificado':
        return 'secondary';
      case 'analisado':
        return 'outline';
      case 'tratado':
        return 'default';
      case 'monitorado':
        return 'secondary';
      case 'aceito':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleSort = (field: string) => {
    // TODO: Implement sorting logic if needed
    console.log('Sort by:', field);
  };

  const getSortIcon = (field: string) => {
    // TODO: Implement sort icon logic if needed
    return null;
  };


  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando riscos...</p>
          </div>
        </div>
      </div>
    );
  }

  const riscoColumns = [
    {
      key: 'nome',
      label: 'Nome',
      sortable: true,
      className: undefined,
      render: (value: string) => <span className="font-medium">{value}</span>
    },
    {
      key: 'categoria',
      label: 'Categoria',
      className: undefined,
      render: (value: any) => value ? (
        <div className="flex items-center gap-2">
          {value.cor && (
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: value.cor }}
            />
          )}
          <span className="text-sm">{value.nome}</span>
        </div>
      ) : '-'
    },
    {
      key: 'nivel_risco_inicial',
      label: 'Nível Inicial',
      className: undefined,
      render: (value: string) => (
        <Badge 
          variant={getNivelBadgeVariant(value)}
          style={getNivelBadgeStyle(value)}
        >
          {value}
        </Badge>
      )
    },
    {
      key: 'nivel_risco_residual',
      label: 'Nível Residual',
      className: undefined,
      render: (value: string) => value ? (
        <Badge 
          variant={getNivelBadgeVariant(value)}
          style={getNivelBadgeStyle(value)}
        >
          {value}
        </Badge>
      ) : <Badge variant="outline">Não avaliado</Badge>
    },
    {
      key: 'status',
      label: 'Status',
      className: undefined,
      render: (value: string) => {
        return (
          <Badge variant={getStatusBadgeVariant(value)} className="whitespace-nowrap">
            {formatStatus(value)}
          </Badge>
        );
      }
    },
    {
      key: 'responsavel',
      label: 'Responsável',
      className: undefined,
      render: (value: string, risco: Risco) => {
        if (risco.responsavel_nome) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer">
                    {risco.responsavel_foto && (
                      <AvatarImage src={risco.responsavel_foto} alt={risco.responsavel_nome} />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {risco.responsavel_nome
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{risco.responsavel_nome}</p>
                </TooltipContent>
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
      className: 'w-[120px]',
      render: (value: any, risco: Risco) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openTratamentosDialog(risco)}
            title="Gerenciar Tratamentos"
          >
            <Shield className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(risco)}
            title="Editar Risco"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDeleteDialog(risco)}
            title="Excluir Risco"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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
        { value: 'identificado', label: 'Identificado' },
        { value: 'analisado', label: 'Analisado' },
        { value: 'tratado', label: 'Tratado' },
        { value: 'monitorado', label: 'Monitorado' },
        { value: 'aceito', label: 'Aceito' }
      ],
      value: statusFilter,
      onChange: setStatusFilter
    },
    {
      key: 'nivel',
      label: 'Nível',
      type: 'select' as const,
      options: [
        { value: 'Crítico', label: 'Crítico' },
        { value: 'Alto', label: 'Alto' },
        { value: 'Médio', label: 'Médio' },
        { value: 'Baixo', label: 'Baixo' }
      ],
      value: nivelFilter,
      onChange: setNivelFilter
    },
    {
      key: 'aceito',
      label: 'Aceito',
      type: 'select' as const,
      options: [
        { value: 'aceito', label: 'Aceitos' },
        { value: 'nao_aceito', label: 'Não Aceitos' }
      ],
      value: aceitoFilter,
      onChange: setAceitoFilter
    }
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <PageHeader
          title="Gestão de Riscos"
          description="Identifique, avalie e monitore riscos organizacionais de forma estruturada"
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

        <Card className="rounded-lg border overflow-hidden">
          <CardContent className="p-0">
            {/* Custom header with search and action buttons */}
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2 flex-1 max-w-lg">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar riscos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {idsFilter.length > 0 && (
                    <Badge variant="secondary" className="flex items-center gap-1 whitespace-nowrap">
                      Filtro da Matriz ({idsFilter.length})
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={clearIdsFilter}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCategoriasDialogOpen(true)} className="whitespace-nowrap">
                    <Tag className="mr-2 h-4 w-4" />
                    Categorias
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setMatrizDialogOpen(true)} className="whitespace-nowrap">
                    <Settings className="mr-2 h-4 w-4" />
                    Matriz
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                  </Button>
                  <Button size="sm" onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Risco
                  </Button>
                </div>
              </div>

              {/* Filters row */}
              {showFilters && (
                <div className="flex gap-4 items-center flex-wrap p-4 bg-muted/50 rounded-lg">
                  {filters.map((filter) => (
                    <Select key={filter.key} value={filter.value} onValueChange={filter.onChange}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder={filter.label} />
                      </SelectTrigger>
                      <SelectContent>
                        {filter.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ))}
                </div>
              )}
            </div>

            {/* Table integrated directly */}
            <Table>
                <TableHeader>
                  <TableRow>
                    {riscoColumns.map((column) => (
                      <TableHead
                        key={String(column.key)}
                        className={cn(
                          column.className,
                          column.sortable && "cursor-pointer hover:bg-muted/50 transition-colors"
                        )}
                        onClick={() => column.sortable && handleSort(String(column.key))}
                      >
                        <div className="flex items-center gap-2">
                          {column.label}
                          {column.sortable && getSortIcon(String(column.key))}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        {riscoColumns.map((_, cellIndex) => (
                          <TableCell key={cellIndex}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredRiscos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={riscoColumns.length} className="p-0">
                        <EmptyState
                          icon={<AlertTriangle className="h-8 w-8" />}
                          title={searchTerm || statusFilter !== '' || nivelFilter !== '' || aceitoFilter !== ''
                            ? 'Nenhum risco encontrado'
                            : 'Nenhum risco cadastrado'}
                          description={searchTerm || statusFilter !== '' || nivelFilter !== '' || aceitoFilter !== ''
                            ? 'Tente ajustar os filtros para encontrar o que procura.'
                            : 'Comece identificando e cadastrando os riscos da sua organização.'}
                          action={!searchTerm && statusFilter === '' && nivelFilter === '' && aceitoFilter === '' ? {
                            label: 'Cadastrar Primeiro Risco',
                            onClick: openCreateDialog
                          } : undefined}
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRiscos.map((item, index) => (
                      <TableRow key={item.id || index} className="hover:bg-muted/50 transition-colors">
                        {riscoColumns.map((column) => (
                          <TableCell
                            key={String(column.key)}
                            className={column.className}
                          >
                            {column.render
                              ? column.render(String(item[column.key as keyof typeof item] || ''), item)
                              : String(item[column.key as keyof typeof item] || '-')
                            }
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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
      </div>
    </TooltipProvider>
  );
}
