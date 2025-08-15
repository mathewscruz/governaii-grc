import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, Search, FileText, Calendar, DollarSign, Users, AlertCircle, CheckCircle, Clock, XCircle, Edit, FileEdit, BarChart3, Filter, Link2, TrendingUp, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ContratoDialog } from '@/components/contratos/ContratoDialog';
import { FornecedorDialog } from '@/components/contratos/FornecedorDialog';
import { MarcosDialog } from '@/components/contratos/MarcosDialog';
import { DocumentosDialog } from '@/components/contratos/DocumentosDialog';
import { AditivosDialog } from '@/components/contratos/AditivosDialog';
import RelatoriosContratos from '@/components/contratos/RelatoriosContratos';
import IntegracaoModulos from '@/components/contratos/IntegracaoModulos';
import TemplatesContratos from '@/components/contratos/TemplatesContratos';
import { useContratosStats } from '@/hooks/useContratosStats';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
}

interface DashboardData {
  totalContratos: number;
  contratosAtivos: number;
  contratosVencendo: number;
  valorTotal: number;
  fornecedoresAtivos: number;
}

export default function Contratos() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalContratos: 0,
    contratosAtivos: 0,
    contratosVencendo: 0,
    valorTotal: 0,
    fornecedoresAtivos: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
  const [selectedFornecedor, setSelectedFornecedor] = useState<Fornecedor | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fornecedorDialogOpen, setFornecedorDialogOpen] = useState(false);
  const [marcosDialogOpen, setMarcosDialogOpen] = useState(false);
  const [documentosDialogOpen, setDocumentosDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('contratos');
  const [aditivosDialogOpen, setAditivosDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Buscar estatísticas dos contratos
  const { data: statsContratos } = useContratosStats();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchContratos(),
        fetchFornecedores(),
        fetchDashboardData()
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
    setFornecedores(data || []);
  };

  const fetchDashboardData = async () => {
    const { data: contratos } = await supabase
      .from('contratos')
      .select('status, valor, data_fim');

    const { data: fornecedores } = await supabase
      .from('fornecedores')
      .select('status');

    const totalContratos = contratos?.length || 0;
    const contratosAtivos = contratos?.filter(c => c.status === 'ativo').length || 0;
    const valorTotal = contratos?.reduce((sum, c) => sum + (Number(c.valor) || 0), 0) || 0;
    const fornecedoresAtivos = fornecedores?.filter(f => f.status === 'ativo').length || 0;

    // Contratos vencendo nos próximos 30 dias
    const hoje = new Date();
    const em30Dias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);
    const contratosVencendo = contratos?.filter(c => {
      if (!c.data_fim) return false;
      const dataFim = new Date(c.data_fim);
      return dataFim >= hoje && dataFim <= em30Dias;
    }).length || 0;

    setDashboardData({
      totalContratos,
      contratosAtivos,
      contratosVencendo,
      valorTotal,
      fornecedoresAtivos
    });
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

  const handleDelete = async (id: string, type: 'contrato' | 'fornecedor') => {
    try {
      const { error } = await supabase
        .from(type === 'contrato' ? 'contratos' : 'fornecedores')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${type === 'contrato' ? 'Contrato' : 'Fornecedor'} excluído com sucesso`,
      });

      fetchData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro",
        description: `Erro ao excluir ${type === 'contrato' ? 'contrato' : 'fornecedor'}`,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      ativo: { color: 'bg-green-500', label: 'Ativo' },
      rascunho: { color: 'bg-gray-500', label: 'Rascunho' },
      negociacao: { color: 'bg-yellow-500', label: 'Negociação' },
      aprovacao: { color: 'bg-blue-500', label: 'Aprovação' },
      suspenso: { color: 'bg-orange-500', label: 'Suspenso' },
      encerrado: { color: 'bg-red-500', label: 'Encerrado' },
      cancelado: { color: 'bg-red-600', label: 'Cancelado' },
      inativo: { color: 'bg-gray-400', label: 'Inativo' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { color: 'bg-gray-500', label: status };
    return <Badge className={`${statusInfo.color} text-white`}>{statusInfo.label}</Badge>;
  };

  const getRiskBadge = (risk: string) => {
    const riskMap = {
      baixo: { color: 'bg-green-500', label: 'Baixo' },
      medio: { color: 'bg-yellow-500', label: 'Médio' },
      alto: { color: 'bg-orange-500', label: 'Alto' },
      critico: { color: 'bg-red-500', label: 'Crítico' }
    };
    
    const riskInfo = riskMap[risk as keyof typeof riskMap] || { color: 'bg-gray-500', label: risk };
    return <Badge className={`${riskInfo.color} text-white`}>{riskInfo.label}</Badge>;
  };

  const filteredContratos = contratos.filter(contrato => {
    const matchesSearch = contrato.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contrato.numero_contrato.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contrato.fornecedores?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || contrato.status === statusFilter;
    const matchesTipo = tipoFilter === 'todos' || contrato.tipo === tipoFilter;
    
    return matchesSearch && matchesStatus && matchesTipo;
  });

  const filteredFornecedores = fornecedores.filter(fornecedor => {
    return fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
           fornecedor.cnpj?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return <div className="flex items-center justify-center h-96">Carregando...</div>;
  }

  const contratoColumns = [
    {
      key: 'nome',
      label: 'Nome',
      sortable: true,
      render: (value: string, contrato: Contrato) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">{contrato.numero_contrato}</div>
        </div>
      )
    },
    {
      key: 'fornecedores',
      label: 'Fornecedor',
      render: (value: any) => value?.nome || '-'
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => getStatusBadge(value)
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (value: string) => <Badge variant="outline" className="capitalize">{value}</Badge>
    },
    {
      key: 'valor',
      label: 'Valor',
      render: (value: number) => value 
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
        : 'N/A'
    },
    {
      key: 'data_fim',
      label: 'Vencimento',
      render: (value: string) => value 
        ? format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })
        : '-'
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (value: any, contrato: Contrato) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(contrato, 'contrato')}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(contrato.id, 'contrato')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const fornecedorColumns = [
    {
      key: 'nome',
      label: 'Nome',
      sortable: true,
      render: (value: string, fornecedor: Fornecedor) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">{fornecedor.cnpj}</div>
        </div>
      )
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (value: string) => <Badge variant="outline" className="capitalize">{value}</Badge>
    },
    {
      key: 'categoria',
      label: 'Categoria',
      render: (value: string) => <Badge variant="secondary" className="capitalize">{value}</Badge>
    },
    {
      key: 'avaliacao_risco',
      label: 'Risco',
      render: (value: string) => getRiskBadge(value)
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => getStatusBadge(value)
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (value: any, fornecedor: Fornecedor) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(fornecedor, 'fornecedor')}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(fornecedor.id, 'fornecedor')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const contratoFilters = [
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'ativo', label: 'Ativo' },
        { value: 'rascunho', label: 'Rascunho' },
        { value: 'negociacao', label: 'Negociação' },
        { value: 'aprovacao', label: 'Aprovação' },
        { value: 'suspenso', label: 'Suspenso' },
        { value: 'encerrado', label: 'Encerrado' }
      ],
      value: statusFilter,
      onChange: setStatusFilter
    },
    {
      key: 'tipo',
      label: 'Tipo',
      type: 'select' as const,
      options: [
        { value: 'servicos', label: 'Serviços' },
        { value: 'licenciamento', label: 'Licenciamento' },
        { value: 'manutencao', label: 'Manutenção' },
        { value: 'consultoria', label: 'Consultoria' },
        { value: 'produto', label: 'Produto' }
      ],
      value: tipoFilter,
      onChange: setTipoFilter
    }
  ];

  return (
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
        <TabsList>
          <TabsTrigger value="contratos">Contratos</TabsTrigger>
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="integracoes">Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="contratos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Contratos
                </CardTitle>
                <div className="flex gap-2">
                  <RelatoriosContratos />
                  <TemplatesContratos />
                  <Button onClick={() => { setSelectedContrato(null); setDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Contrato
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={filteredContratos}
                columns={contratoColumns}
                loading={loading}
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Buscar contratos..."
                filters={contratoFilters}
                emptyState={{
                  icon: <FileText className="h-8 w-8" />,
                  title: 'Nenhum contrato encontrado',
                  description: 'Comece criando contratos para gerenciar suas parcerias.',
                  action: {
                    label: 'Novo Contrato',
                    onClick: () => { setSelectedContrato(null); setDialogOpen(true); }
                  }
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fornecedores Tab */}
        <TabsContent value="fornecedores" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Fornecedores
                </CardTitle>
                <Button onClick={() => { setSelectedFornecedor(null); setFornecedorDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Fornecedor
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={filteredFornecedores}
                columns={fornecedorColumns}
                loading={loading}
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Buscar fornecedores..."
                emptyState={{
                  icon: <Users className="h-8 w-8" />,
                  title: 'Nenhum fornecedor encontrado',
                  description: 'Cadastre fornecedores para associar aos contratos.',
                  action: {
                    label: 'Novo Fornecedor',
                    onClick: () => { setSelectedFornecedor(null); setFornecedorDialogOpen(true); }
                  }
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ContratoDialog
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
    </div>
  );
}
