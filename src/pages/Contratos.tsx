import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Plus, Search, FileText, DollarSign, Users, AlertCircle, Edit, TrendingUp, Trash2, Building2, FileStack, Milestone, FilePlus2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ContratoDialogWizard } from '@/components/contratos/ContratoDialogWizard';
import { FornecedorDialog } from '@/components/contratos/FornecedorDialog';
import { MarcosDialog } from '@/components/contratos/MarcosDialog';
import { DocumentosDialog } from '@/components/contratos/DocumentosDialog';
import { AditivosDialog } from '@/components/contratos/AditivosDialog';
import RelatoriosContratos from '@/components/contratos/RelatoriosContratos';
import TemplatesContratos from '@/components/contratos/TemplatesContratos';
import { useContratosStats } from '@/hooks/useContratosStats';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatDateOnly } from '@/lib/date-utils';
import { formatStatus, getContratoStatusColor, getCriticidadeColor } from '@/lib/text-utils';

interface Contrato {
  id: string;
  numero_contrato: string;
  nome: string;
  tipo: string;
  status: string;
  valor: number;
  moeda: string;
  data_inicio: string;
  data_fim: string;
  data_assinatura: string;
  renovacao_automatica: boolean;
  prazo_renovacao: number;
  gestor_contrato: string;
  fornecedor_id: string;
  area_solicitante: string;
  objeto: string;
  observacoes: string;
  clausulas_especiais: string;
  penalidades: string;
  sla_principal: string;
  confidencial: boolean;
  fornecedores?: {
    nome: string;
    avaliacao_risco: string;
  } | null;
}

interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  contato_responsavel: string;
  tipo: string;
  status: string;
  categoria: string;
  avaliacao_risco: string;
  data_cadastro: string;
  observacoes: string;
  contratos_count?: number;
}

export default function Contratos() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTermFornecedor, setSearchTermFornecedor] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [statusFornecedorFilter, setStatusFornecedorFilter] = useState('todos');
  const [categoriaFornecedorFilter, setCategoriaFornecedorFilter] = useState('todos');
  const [riscoFornecedorFilter, setRiscoFornecedorFilter] = useState('todos');
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
  const [selectedFornecedor, setSelectedFornecedor] = useState<Fornecedor | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fornecedorDialogOpen, setFornecedorDialogOpen] = useState(false);
  const [marcosDialogOpen, setMarcosDialogOpen] = useState(false);
  const [documentosDialogOpen, setDocumentosDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('contratos');
  const [aditivosDialogOpen, setAditivosDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; type: 'contrato' | 'fornecedor' }>({
    open: false,
    id: '',
    type: 'contrato'
  });
  const { toast } = useToast();
  
  // Paginação
  const [currentPageContratos, setCurrentPageContratos] = useState(1);
  const [currentPageFornecedores, setCurrentPageFornecedores] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Buscar estatísticas dos contratos
  const { data: statsContratos } = useContratosStats();

  useEffect(() => {
    fetchData();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPageContratos(1);
  }, [searchTerm, statusFilter, tipoFilter]);

  useEffect(() => {
    setCurrentPageFornecedores(1);
  }, [searchTermFornecedor, statusFornecedorFilter, categoriaFornecedorFilter, riscoFornecedorFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchContratos(),
        fetchFornecedores()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos contratos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchContratos = async () => {
    const { data, error } = await supabase
      .from('contratos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Buscar dados dos fornecedores separadamente
    if (data && data.length > 0) {
      const fornecedorIds = [...new Set(data.map(c => c.fornecedor_id).filter(Boolean))];
      const { data: fornecedoresData } = await supabase
        .from('fornecedores')
        .select('id, nome, avaliacao_risco')
        .in('id', fornecedorIds);

      // Combinar os dados
      const contratosComFornecedores = data.map(contrato => ({
        ...contrato,
        fornecedores: fornecedoresData?.find(f => f.id === contrato.fornecedor_id) || null
      }));
      
      setContratos(contratosComFornecedores as Contrato[]);
    } else {
      setContratos([]);
    }
  };

  const fetchFornecedores = async () => {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .order('nome');

    if (error) throw error;

    // Buscar contagem de contratos por fornecedor
    const { data: contratosData } = await supabase
      .from('contratos')
      .select('fornecedor_id');

    const contratosCountMap: Record<string, number> = {};
    (contratosData || []).forEach(c => {
      if (c.fornecedor_id) {
        contratosCountMap[c.fornecedor_id] = (contratosCountMap[c.fornecedor_id] || 0) + 1;
      }
    });

    const fornecedoresComContagem = (data || []).map(f => ({
      ...f,
      contratos_count: contratosCountMap[f.id] || 0
    }));

    setFornecedores(fornecedoresComContagem);
  };

  const handleEdit = (item: Contrato | Fornecedor, type: 'contrato' | 'fornecedor') => {
    if (type === 'contrato') {
      setSelectedContrato(item as Contrato);
      setDialogOpen(true);
    } else {
      setSelectedFornecedor(item as Fornecedor);
      setFornecedorDialogOpen(true);
    }
  };

  const handleDelete = (id: string, type: 'contrato' | 'fornecedor') => {
    setDeleteConfirm({ open: true, id, type });
  };

  const confirmDelete = async () => {
    try {
      const { error } = await supabase
        .from(deleteConfirm.type === 'contrato' ? 'contratos' : 'fornecedores')
        .delete()
        .eq('id', deleteConfirm.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${deleteConfirm.type === 'contrato' ? 'Contrato' : 'Fornecedor'} excluído com sucesso`,
      });

      fetchData();
      setDeleteConfirm({ open: false, id: '', type: 'contrato' });
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro",
        description: `Erro ao excluir ${deleteConfirm.type === 'contrato' ? 'contrato' : 'fornecedor'}`,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={`${getContratoStatusColor(status)} whitespace-nowrap`}>
        {formatStatus(status)}
      </Badge>
    );
  };

  const getRiskBadge = (risk: string) => {
    return (
      <Badge className={`${getCriticidadeColor(risk)} whitespace-nowrap`}>
        {formatStatus(risk)}
      </Badge>
    );
  };

  const getVencimentoBadge = (dataFim: string | null) => {
    if (!dataFim) return null;
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataVenc = new Date(dataFim + 'T00:00:00');
    const diffDays = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <Badge variant="destructive" className="ml-2 text-xs whitespace-nowrap">Vencido</Badge>;
    } else if (diffDays <= 30) {
      return <Badge variant="secondary" className="ml-2 text-xs bg-amber-100 text-amber-800 whitespace-nowrap">{diffDays}d</Badge>;
    }
    return null;
  };

  // Categorias únicas de fornecedores
  const categoriasFornecedor = useMemo(() => {
    const cats = new Set(fornecedores.map(f => f.categoria).filter(Boolean));
    return Array.from(cats) as string[];
  }, [fornecedores]);

  const filteredContratos = useMemo(() => {
    return contratos.filter(contrato => {
      const matchesSearch = contrato.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           contrato.numero_contrato.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           contrato.fornecedores?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'todos' || contrato.status === statusFilter;
      const matchesTipo = tipoFilter === 'todos' || contrato.tipo === tipoFilter;
      
      return matchesSearch && matchesStatus && matchesTipo;
    });
  }, [contratos, searchTerm, statusFilter, tipoFilter]);

  const filteredFornecedores = useMemo(() => {
    return fornecedores.filter(fornecedor => {
      const matchesSearch = fornecedor.nome.toLowerCase().includes(searchTermFornecedor.toLowerCase()) ||
             fornecedor.cnpj?.toLowerCase().includes(searchTermFornecedor.toLowerCase());
      const matchesStatus = statusFornecedorFilter === 'todos' || fornecedor.status === statusFornecedorFilter;
      const matchesCategoria = categoriaFornecedorFilter === 'todos' || fornecedor.categoria === categoriaFornecedorFilter;
      const matchesRisco = riscoFornecedorFilter === 'todos' || fornecedor.avaliacao_risco === riscoFornecedorFilter;
      return matchesSearch && matchesStatus && matchesCategoria && matchesRisco;
    });
  }, [fornecedores, searchTermFornecedor, statusFornecedorFilter, categoriaFornecedorFilter, riscoFornecedorFilter]);

  // Paginação
  const totalPagesContratos = Math.ceil(filteredContratos.length / itemsPerPage);
  const totalPagesFornecedores = Math.ceil(filteredFornecedores.length / itemsPerPage);

  const paginatedContratos = useMemo(() => {
    const start = (currentPageContratos - 1) * itemsPerPage;
    return filteredContratos.slice(start, start + itemsPerPage);
  }, [filteredContratos, currentPageContratos, itemsPerPage]);

  const paginatedFornecedores = useMemo(() => {
    const start = (currentPageFornecedores - 1) * itemsPerPage;
    return filteredFornecedores.slice(start, start + itemsPerPage);
  }, [filteredFornecedores, currentPageFornecedores, itemsPerPage]);

  if (loading) {
    return <div className="flex items-center justify-center h-96">Carregando...</div>;
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <PageHeader
          title="Contratos"
          description="Gerencie contratos, fornecedores e acompanhe vencimentos de forma centralizada"
        />

        {/* Cards de KPI */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total de Contratos"
            value={statsContratos?.total || 0}
            description={`${statsContratos?.ativos || 0} ativos`}
            icon={<FileText className="h-4 w-4 text-muted-foreground" />}
            loading={!statsContratos}
          />

          <StatCard
            title="Valor Total"
            value={new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              notation: 'compact'
            }).format(statsContratos?.valorTotal || 0)}
            description="Valor em contratos ativos"
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            variant="success"
            loading={!statsContratos}
          />

          <StatCard
            title="Vencimentos"
            value={statsContratos?.vencendo30Dias || 0}
            description="Próximos 30 dias"
            icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
            variant={statsContratos?.vencendo30Dias ? "warning" : "default"}
            loading={!statsContratos}
          />

          <StatCard
            title="Renovação Automática"
            value={`${statsContratos?.total ? Math.round((statsContratos?.renovacaoAutomatica / statsContratos?.total) * 100) : 0}%`}
            description={`${statsContratos?.renovacaoAutomatica || 0} de ${statsContratos?.total || 0}`}
            icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            variant="info"
            loading={!statsContratos}
          />
        </div>

        {/* Tabs */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contratos" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Contratos</span>
            </TabsTrigger>
            <TabsTrigger value="fornecedores" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Fornecedores</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contratos" className="space-y-4">
            <Card className="rounded-lg border overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6 pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Buscar contratos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="flex gap-2">
                      <RelatoriosContratos />
                      <TemplatesContratos />
                      <Button size="sm" onClick={() => { setSelectedContrato(null); setDialogOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Contrato
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="rascunho">Rascunho</SelectItem>
                        <SelectItem value="negociacao">Negociação</SelectItem>
                        <SelectItem value="aprovacao">Aprovação</SelectItem>
                        <SelectItem value="suspenso">Suspenso</SelectItem>
                        <SelectItem value="encerrado">Encerrado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={tipoFilter} onValueChange={setTipoFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="servicos">Serviços</SelectItem>
                        <SelectItem value="licenciamento">Licenciamento</SelectItem>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                        <SelectItem value="consultoria">Consultoria</SelectItem>
                        <SelectItem value="produto">Produto</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(Number(v))}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedContratos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="p-0">
                          <EmptyState
                            icon={<FileText className="h-8 w-8" />}
                            title='Nenhum contrato encontrado'
                            description='Comece criando contratos para gerenciar suas parcerias.'
                            action={{
                              label: 'Novo Contrato',
                              onClick: () => { setSelectedContrato(null); setDialogOpen(true); }
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedContratos.map((contrato) => (
                        <TableRow key={contrato.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{contrato.nome}</div>
                              <div className="text-sm text-muted-foreground">{contrato.numero_contrato}</div>
                            </div>
                          </TableCell>
                          <TableCell>{contrato.fornecedores?.nome || '-'}</TableCell>
                          <TableCell>{getStatusBadge(contrato.status)}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize whitespace-nowrap">{formatStatus(contrato.tipo)}</Badge></TableCell>
                          <TableCell>
                            {contrato.valor 
                              ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(contrato.valor))
                              : 'N/A'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center whitespace-nowrap">
                              {formatDateOnly(contrato.data_fim)}
                              {getVencimentoBadge(contrato.data_fim)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => { setSelectedContrato(contrato); setDocumentosDialogOpen(true); }}
                                  >
                                    <FileStack className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Documentos</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => { setSelectedContrato(contrato); setMarcosDialogOpen(true); }}
                                  >
                                    <Milestone className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Marcos</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => { setSelectedContrato(contrato); setAditivosDialogOpen(true); }}
                                  >
                                    <FilePlus2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Aditivos</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(contrato, 'contrato')}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(contrato.id, 'contrato')}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Excluir</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Paginação */}
                {totalPagesContratos > 1 && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <span className="text-sm text-muted-foreground">
                      Mostrando {((currentPageContratos - 1) * itemsPerPage) + 1} a {Math.min(currentPageContratos * itemsPerPage, filteredContratos.length)} de {filteredContratos.length}
                    </span>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPageContratos(p => Math.max(1, p - 1))}
                            className={currentPageContratos === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        {Array.from({ length: Math.min(5, totalPagesContratos) }, (_, i) => {
                          let page = i + 1;
                          if (totalPagesContratos > 5) {
                            if (currentPageContratos > 3) {
                              page = currentPageContratos - 2 + i;
                            }
                            if (page > totalPagesContratos) {
                              page = totalPagesContratos - 4 + i;
                            }
                          }
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPageContratos(page)}
                                isActive={currentPageContratos === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPageContratos(p => Math.min(totalPagesContratos, p + 1))}
                            className={currentPageContratos === totalPagesContratos ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fornecedores Tab */}
          <TabsContent value="fornecedores" className="space-y-4">
            <Card className="rounded-lg border overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6 pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Buscar fornecedores..."
                        value={searchTermFornecedor}
                        onChange={(e) => setSearchTermFornecedor(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => { setSelectedFornecedor(null); setFornecedorDialogOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Fornecedor
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <Select value={statusFornecedorFilter} onValueChange={setStatusFornecedorFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos Status</SelectItem>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="bloqueado">Bloqueado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={categoriaFornecedorFilter} onValueChange={setCategoriaFornecedorFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todas Categorias</SelectItem>
                        {categoriasFornecedor.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={riscoFornecedorFilter} onValueChange={setRiscoFornecedorFilter}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Risco" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos Riscos</SelectItem>
                        <SelectItem value="baixo">Baixo</SelectItem>
                        <SelectItem value="medio">Médio</SelectItem>
                        <SelectItem value="alto">Alto</SelectItem>
                        <SelectItem value="critico">Crítico</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(Number(v))}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Contratos</TableHead>
                      <TableHead>Risco</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedFornecedores.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="p-0">
                          <EmptyState
                            icon={<Users className="h-8 w-8" />}
                            title='Nenhum fornecedor encontrado'
                            description='Cadastre fornecedores para associar aos contratos.'
                            action={{
                              label: 'Novo Fornecedor',
                              onClick: () => { setSelectedFornecedor(null); setFornecedorDialogOpen(true); }
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedFornecedores.map((fornecedor) => (
                        <TableRow key={fornecedor.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{fornecedor.nome}</div>
                              <div className="text-sm text-muted-foreground">{fornecedor.cnpj}</div>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="capitalize whitespace-nowrap">{formatStatus(fornecedor.tipo)}</Badge></TableCell>
                          <TableCell><Badge variant="secondary" className="capitalize whitespace-nowrap">{fornecedor.categoria || '-'}</Badge></TableCell>
                          <TableCell>
                            <Badge variant="outline">{fornecedor.contratos_count || 0}</Badge>
                          </TableCell>
                          <TableCell>{fornecedor.avaliacao_risco ? getRiskBadge(fornecedor.avaliacao_risco) : '-'}</TableCell>
                          <TableCell>{getStatusBadge(fornecedor.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(fornecedor, 'fornecedor')}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(fornecedor.id, 'fornecedor')}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Excluir</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Paginação */}
                {totalPagesFornecedores > 1 && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <span className="text-sm text-muted-foreground">
                      Mostrando {((currentPageFornecedores - 1) * itemsPerPage) + 1} a {Math.min(currentPageFornecedores * itemsPerPage, filteredFornecedores.length)} de {filteredFornecedores.length}
                    </span>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPageFornecedores(p => Math.max(1, p - 1))}
                            className={currentPageFornecedores === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        {Array.from({ length: Math.min(5, totalPagesFornecedores) }, (_, i) => {
                          let page = i + 1;
                          if (totalPagesFornecedores > 5) {
                            if (currentPageFornecedores > 3) {
                              page = currentPageFornecedores - 2 + i;
                            }
                            if (page > totalPagesFornecedores) {
                              page = totalPagesFornecedores - 4 + i;
                            }
                          }
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPageFornecedores(page)}
                                isActive={currentPageFornecedores === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPageFornecedores(p => Math.min(totalPagesFornecedores, p + 1))}
                            className={currentPageFornecedores === totalPagesFornecedores ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Dialogs */}
        <ContratoDialogWizard
          contrato={selectedContrato}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={fetchData}
          fornecedores={fornecedores}
        />

        <FornecedorDialog
          fornecedor={selectedFornecedor}
          open={fornecedorDialogOpen}
          onOpenChange={setFornecedorDialogOpen}
          onSuccess={fetchData}
        />

        <MarcosDialog
          contrato={selectedContrato}
          open={marcosDialogOpen}
          onOpenChange={setMarcosDialogOpen}
        />

        <DocumentosDialog
          contrato={selectedContrato}
          open={documentosDialogOpen}
          onOpenChange={setDocumentosDialogOpen}
        />

        <AditivosDialog
          contrato={selectedContrato}
          open={aditivosDialogOpen}
          onOpenChange={setAditivosDialogOpen}
        />

        <ConfirmDialog
          open={deleteConfirm.open}
          onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
          title={`Excluir ${deleteConfirm.type === 'contrato' ? 'Contrato' : 'Fornecedor'}`}
          description={`Tem certeza que deseja excluir este ${deleteConfirm.type === 'contrato' ? 'contrato' : 'fornecedor'}? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
          variant="destructive"
          onConfirm={confirmDelete}
        />
      </div>
    </TooltipProvider>
  );
}
