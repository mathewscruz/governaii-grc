import React, { useState } from 'react';
import { Plus, Users, Shield, AlertTriangle, CheckCircle, Clock, Edit, BarChart3, TrendingUp, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import ContaDialog from '@/components/contas-privilegiadas/ContaDialog';
import SistemaDialog from '@/components/contas-privilegiadas/SistemaDialog';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

interface ContaPrivilegiada {
  id: string;
  usuario_beneficiario: string;
  email_beneficiario?: string;
  tipo_acesso: string;
  nivel_privilegio: string;
  data_concessao: string;
  data_expiracao: string;
  status: string;
  justificativa_negocio: string;
  sistema_id: string;
  sistemas_privilegiados?: {
    nome_sistema: string;
    tipo_sistema: string;
    criticidade: string;
  };
}

interface SistemaPrivilegiado {
  id: string;
  nome_sistema: string;
  tipo_sistema: string;
  criticidade: string;
  responsavel_sistema?: string;
  url_sistema?: string;
  categoria?: string;
  ativo: boolean;
}

export default function ContasPrivilegiadas() {
  const [selectedTab, setSelectedTab] = useState('contas');
  const [showContaDialog, setShowContaDialog] = useState(false);
  const [showSistemaDialog, setShowSistemaDialog] = useState(false);
  const [selectedConta, setSelectedConta] = useState<ContaPrivilegiada | null>(null);
  const [selectedSistema, setSelectedSistema] = useState<SistemaPrivilegiado | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  // Buscar contas privilegiadas
  const { data: contas = [], refetch: refetchContas } = useQuery({
    queryKey: ['contas-privilegiadas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_privilegiadas' as any)
        .select(`
          *,
          sistemas_privilegiados (
            nome_sistema,
            tipo_sistema,
            criticidade
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ContaPrivilegiada[];
    },
  });

  // Buscar sistemas privilegiados
  const { data: sistemas = [], refetch: refetchSistemas } = useQuery({
    queryKey: ['sistemas-privilegiados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sistemas_privilegiados' as any)
        .select('*')
        .eq('ativo', true)
        .order('nome_sistema');

      if (error) throw error;
      return (data || []) as unknown as SistemaPrivilegiado[];
    },
  });

  // Calcular métricas do dashboard
  const contasAtivas = contas.filter(c => c.status === 'ativo').length;
  const contasExpiradas = contas.filter(c => c.status === 'expirado').length;
  const contasPendentes = contas.filter(c => c.status === 'pendente_aprovacao').length;
  
  // Contas que vencem nos próximos 30 dias
  const hoje = new Date();
  const em30Dias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);
  const contasVencendo = contas.filter(c => {
    const dataExpiracao = new Date(c.data_expiracao);
    return dataExpiracao <= em30Dias && dataExpiracao >= hoje && c.status === 'ativo';
  }).length;

  const handleEditConta = (conta: ContaPrivilegiada) => {
    setSelectedConta(conta);
    setShowContaDialog(true);
  };

  const handleEditSistema = (sistema: SistemaPrivilegiado) => {
    setSelectedSistema(sistema);
    setShowSistemaDialog(true);
  };

  const handleCloseContaDialog = () => {
    setSelectedConta(null);
    setShowContaDialog(false);
    refetchContas();
  };

  const handleCloseSistemaDialog = () => {
    setSelectedSistema(null);
    setShowSistemaDialog(false);
    refetchSistemas();
  };

  const handleRelatorios = () => {
    toast({
      title: "Relatórios",
      description: "Funcionalidade de relatórios em desenvolvimento",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ativo': { variant: 'default' as const, label: 'Ativo', icon: CheckCircle },
      'expirado': { variant: 'destructive' as const, label: 'Expirado', icon: AlertTriangle },
      'pendente_aprovacao': { variant: 'secondary' as const, label: 'Pendente', icon: Clock },
      'revogado': { variant: 'outline' as const, label: 'Revogado', icon: Shield },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente_aprovacao;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getCriticidadeBadge = (criticidade: string) => {
    const colors = {
      'alta': 'bg-red-100 text-red-800 border-red-200',
      'media': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'baixa': 'bg-green-100 text-green-800 border-green-200',
    };

    return (
      <Badge className={colors[criticidade as keyof typeof colors] || colors.media}>
        {criticidade.charAt(0).toUpperCase() + criticidade.slice(1)}
      </Badge>
    );
  };

  // Filtrar contas e sistemas baseado na busca
  const filteredContas = contas.filter(conta => 
    searchTerm === '' || 
    conta.usuario_beneficiario.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conta.email_beneficiario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conta.sistemas_privilegiados?.nome_sistema.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSistemas = sistemas.filter(sistema => 
    searchTerm === '' || 
    sistema.nome_sistema.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sistema.tipo_sistema.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sistema.responsavel_sistema?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Componente para tabela de contas
  const ContasTable = () => (
    <Card className="rounded-lg border overflow-hidden">
      <CardContent className="p-0">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar contas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRelatorios}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Relatórios
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button 
                size="sm"
                onClick={() => setShowContaDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Conta
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <p className="text-sm text-muted-foreground">Filtros serão implementados em breve</p>
            </div>
          )}
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Sistema</TableHead>
              <TableHead>Tipo de Acesso</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead>Data Expiração</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState
                    icon={<Users className="h-8 w-8" />}
                    title={searchTerm ? "Nenhuma conta encontrada" : "Nenhuma conta cadastrada"}
                    description={
                      searchTerm 
                        ? "Tente ajustar os termos de busca ou limpe os filtros para ver todas as contas."
                        : "Comece cadastrando um sistema privilegiado e depois adicione contas de acesso para monitorar e controlar acessos privilegiados aos sistemas críticos da sua empresa."
                    }
                    action={
                      !searchTerm 
                        ? {
                            label: "Cadastrar Primeiro Sistema",
                            onClick: () => setShowSistemaDialog(true),
                            variant: "default"
                          }
                        : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredContas.map((conta) => (
                <TableRow key={conta.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{conta.usuario_beneficiario}</div>
                      {conta.email_beneficiario && (
                        <div className="text-sm text-muted-foreground">{conta.email_beneficiario}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{conta.sistemas_privilegiados?.nome_sistema}</div>
                      <div className="text-sm text-muted-foreground">
                        {conta.sistemas_privilegiados?.tipo_sistema}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{conta.tipo_acesso}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={conta.nivel_privilegio === 'alto' ? 'destructive' : 'secondary'}>
                      {conta.nivel_privilegio}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(conta.data_expiracao).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(conta.status)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditConta(conta)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  // Componente para tabela de sistemas
  const SistemasTable = () => (
    <Card className="rounded-lg border overflow-hidden">
      <CardContent className="p-0">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar sistemas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button 
                size="sm"
                onClick={() => setShowSistemaDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Sistema
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <p className="text-sm text-muted-foreground">Filtros serão implementados em breve</p>
            </div>
          )}
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Sistema</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Criticidade</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSistemas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    icon={<Shield className="h-8 w-8" />}
                    title={searchTerm ? "Nenhum sistema encontrado" : "Nenhum sistema cadastrado"}
                    description={
                      searchTerm 
                        ? "Tente ajustar os termos de busca para encontrar os sistemas."
                        : "Cadastre os sistemas que possuem contas privilegiadas para começar a gerenciar os acessos críticos da sua organização de forma centralizada."
                    }
                    action={
                      !searchTerm 
                        ? {
                            label: "Cadastrar Primeiro Sistema",
                            onClick: () => setShowSistemaDialog(true),
                            variant: "default"
                          }
                        : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredSistemas.map((sistema) => (
                <TableRow key={sistema.id}>
                  <TableCell>
                    <div className="font-medium">{sistema.nome_sistema}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{sistema.tipo_sistema}</Badge>
                  </TableCell>
                  <TableCell>
                    {getCriticidadeBadge(sistema.criticidade)}
                  </TableCell>
                  <TableCell>
                    {sistema.responsavel_sistema || '-'}
                  </TableCell>
                  <TableCell>
                    {sistema.url_sistema ? (
                      <a 
                        href={sistema.url_sistema} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Acessar
                      </a>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditSistema(sistema)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
        <PageHeader
        title="Contas Privilegiadas"
        description="Gerencie e monitore acessos privilegiados aos sistemas críticos"
      />

      {/* StatCards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Contas"
          value={contas.length}
          description="Contas privilegiadas registradas"
          icon={<Users className="h-4 w-4" />}
        />

        <StatCard
          title="Contas Ativas"
          value={contasAtivas}
          description="Com acesso vigente"
          icon={<CheckCircle className="h-4 w-4" />}
          variant="success"
        />

        <StatCard
          title="Vencendo em 30 dias"
          value={contasVencendo}
          description="Requerem atenção"
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={contasVencendo > 0 ? "warning" : "default"}
        />

        <StatCard
          title="Pendentes"
          value={contasPendentes}
          description="Aguardando aprovação"
          icon={<Clock className="h-4 w-4" />}
          variant="info"
        />
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contas" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Contas Ativas</span>
          </TabsTrigger>
          <TabsTrigger value="sistemas" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Sistemas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contas" className="space-y-6">
          <ContasTable />
        </TabsContent>

        <TabsContent value="sistemas" className="space-y-6">
          <SistemasTable />
        </TabsContent>
      </Tabs>

      <ContaDialog
        open={showContaDialog}
        onClose={handleCloseContaDialog}
        conta={selectedConta}
        sistemas={sistemas}
      />

      <SistemaDialog
        open={showSistemaDialog}
        onClose={handleCloseSistemaDialog}
        sistema={selectedSistema}
      />
    </div>
  );
}