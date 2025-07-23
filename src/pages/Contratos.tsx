import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, FileText, Calendar, DollarSign, Users, AlertCircle, CheckCircle, Clock, XCircle, Edit, FileEdit, Bell, BarChart3, Filter, Link2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ContratoDialog } from '@/components/contratos/ContratoDialog';
import { FornecedorDialog } from '@/components/contratos/FornecedorDialog';
import { MarcosDialog } from '@/components/contratos/MarcosDialog';
import { DocumentosDialog } from '@/components/contratos/DocumentosDialog';
import { AditivosDialog } from '@/components/contratos/AditivosDialog';
import RelatoriosContratos from '@/components/contratos/RelatoriosContratos';
import IntegracaoModulos from '@/components/contratos/IntegracaoModulos';
import { useContratosStats } from '@/hooks/useContratosStats';
import TemplatesContratos from '@/components/contratos/TemplatesContratos';
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Contratos</h1>
          <p className="text-muted-foreground">
            Gerencie contratos, fornecedores e acompanhe vencimentos
          </p>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contratos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalContratos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dashboardData.contratosAtivos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencendo (30 dias)</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{dashboardData.contratosVencendo}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(dashboardData.valorTotal)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fornecedores Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.fornecedoresAtivos}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList>
          <TabsTrigger value="contratos">Contratos</TabsTrigger>
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
        </TabsList>

        {/* Contratos Tab */}
        <TabsContent value="contratos" className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="flex gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contratos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-80"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
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
                <SelectTrigger className="w-40">
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
            </div>
              <div className="flex gap-2">
                <RelatoriosContratos />
                <TemplatesContratos />
                <Button onClick={() => { setSelectedContrato(null); setDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Contrato
                </Button>
              </div>
          </div>

          <div className="grid gap-4">
            {filteredContratos.map((contrato) => (
              <Card key={contrato.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{contrato.nome}</CardTitle>
                      <CardDescription>
                        {contrato.numero_contrato} • {contrato.fornecedores?.nome}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(contrato.status)}
                      {contrato.fornecedores?.avaliacao_risco && getRiskBadge(contrato.fornecedores.avaliacao_risco)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Tipo:</span>
                      <p className="capitalize">{contrato.tipo}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Valor:</span>
                      <p>
                        {contrato.valor 
                          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(contrato.valor))
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Vigência:</span>
                      <p>
                        {contrato.data_inicio && contrato.data_fim
                          ? `${format(new Date(contrato.data_inicio), 'dd/MM/yyyy', { locale: ptBR })} - ${format(new Date(contrato.data_fim), 'dd/MM/yyyy', { locale: ptBR })}`
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => { setSelectedContrato(contrato); setMarcosDialogOpen(true); }}
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        Marcos
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => { setSelectedContrato(contrato); setDocumentosDialogOpen(true); }}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Docs
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => { setSelectedContrato(contrato); setAditivosDialogOpen(true); }}
                      >
                        <FileEdit className="h-4 w-4 mr-1" />
                        Aditivos
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(contrato, 'contrato')}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredContratos.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum contrato encontrado</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Fornecedores Tab */}
        <TabsContent value="fornecedores" className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar fornecedores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-80"
              />
            </div>
            <Button onClick={() => { setSelectedFornecedor(null); setFornecedorDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Fornecedor
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredFornecedores.map((fornecedor) => (
              <Card key={fornecedor.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{fornecedor.nome}</CardTitle>
                      <CardDescription>{fornecedor.cnpj}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(fornecedor.status)}
                      {getRiskBadge(fornecedor.avaliacao_risco)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Email:</span>
                      <p>{fornecedor.email || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Categoria:</span>
                      <p className="capitalize">{fornecedor.categoria || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Risco:</span>
                      <p className="capitalize">{fornecedor.avaliacao_risco}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(fornecedor, 'fornecedor')}
                      >
                        Editar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredFornecedores.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum fornecedor encontrado</p>
              </CardContent>
            </Card>
          )}
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
