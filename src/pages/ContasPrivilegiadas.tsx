import React, { useState } from 'react';
import { Plus, Users, Shield, AlertTriangle, CheckCircle, Clock, Edit, BarChart3, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import ContaDialog from '@/components/contas-privilegiadas/ContaDialog';
import SistemaDialog from '@/components/contas-privilegiadas/SistemaDialog';
import { DataTable } from '@/components/ui/data-table';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';

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

  const contasColumns = [
    {
      key: 'usuario_beneficiario' as keyof ContaPrivilegiada,
      label: 'Usuário',
      sortable: true,
      render: (conta: ContaPrivilegiada) => (
        <div>
          <div className="font-medium">{conta.usuario_beneficiario}</div>
          {conta.email_beneficiario && (
            <div className="text-sm text-muted-foreground">{conta.email_beneficiario}</div>
          )}
        </div>
      )
    },
    {
      key: 'sistemas_privilegiados' as keyof ContaPrivilegiada,
      label: 'Sistema',
      render: (conta: ContaPrivilegiada) => (
        <div>
          <div className="font-medium">{conta.sistemas_privilegiados?.nome_sistema}</div>
          <div className="text-sm text-muted-foreground">
            {conta.sistemas_privilegiados?.tipo_sistema}
          </div>
        </div>
      )
    },
    {
      key: 'tipo_acesso' as keyof ContaPrivilegiada,
      label: 'Tipo de Acesso',
      render: (conta: ContaPrivilegiada) => (
        <Badge variant="secondary">{conta.tipo_acesso}</Badge>
      )
    },
    {
      key: 'nivel_privilegio' as keyof ContaPrivilegiada,
      label: 'Nível',
      render: (conta: ContaPrivilegiada) => (
        <Badge variant={conta.nivel_privilegio === 'alto' ? 'destructive' : 'secondary'}>
          {conta.nivel_privilegio}
        </Badge>
      )
    },
    {
      key: 'data_expiracao' as keyof ContaPrivilegiada,
      label: 'Data Expiração',
      render: (conta: ContaPrivilegiada) => 
        new Date(conta.data_expiracao).toLocaleDateString('pt-BR')
    },
    {
      key: 'status' as keyof ContaPrivilegiada,
      label: 'Status',
      render: (conta: ContaPrivilegiada) => getStatusBadge(conta.status)
    },
    {
      key: 'actions' as keyof ContaPrivilegiada,
      label: 'Ações',
      render: (conta: ContaPrivilegiada) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleEditConta(conta)}
        >
          <Edit className="h-4 w-4" />
        </Button>
      )
    }
  ];

  const sistemasColumns = [
    {
      key: 'nome_sistema' as keyof SistemaPrivilegiado,
      label: 'Nome do Sistema',
      sortable: true,
      render: (sistema: SistemaPrivilegiado) => (
        <div className="font-medium">{sistema.nome_sistema}</div>
      )
    },
    {
      key: 'tipo_sistema' as keyof SistemaPrivilegiado,
      label: 'Tipo',
      render: (sistema: SistemaPrivilegiado) => (
        <Badge variant="outline">{sistema.tipo_sistema}</Badge>
      )
    },
    {
      key: 'criticidade' as keyof SistemaPrivilegiado,
      label: 'Criticidade',
      render: (sistema: SistemaPrivilegiado) => getCriticidadeBadge(sistema.criticidade)
    },
    {
      key: 'responsavel_sistema' as keyof SistemaPrivilegiado,
      label: 'Responsável',
      render: (sistema: SistemaPrivilegiado) => sistema.responsavel_sistema || '-'
    },
    {
      key: 'url_sistema' as keyof SistemaPrivilegiado,
      label: 'URL',
      render: (sistema: SistemaPrivilegiado) => sistema.url_sistema ? (
        <a 
          href={sistema.url_sistema} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Acessar
        </a>
      ) : '-'
    },
    {
      key: 'actions' as keyof SistemaPrivilegiado,
      label: 'Ações',
      render: (sistema: SistemaPrivilegiado) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleEditSistema(sistema)}
        >
          <Edit className="h-4 w-4" />
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contas Privilegiadas"
        description="Gerencie e monitore acessos privilegiados aos sistemas críticos"
        actions={
          <div className="flex gap-2">
            <Button onClick={() => setShowSistemaDialog(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Novo Sistema
            </Button>
            <Button onClick={() => setShowContaDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
          </div>
        }
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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Contas Privilegiadas
                </CardTitle>
                <Button onClick={handleRelatorios} variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Relatórios
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={contas}
                columns={contasColumns}
                emptyState={{
                  icon: <Users className="h-12 w-12" />,
                  title: "Nenhuma conta privilegiada",
                  description: "Comece criando sua primeira conta privilegiada",
                  action: {
                    label: "Nova Conta",
                    onClick: () => setShowContaDialog(true)
                  }
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sistemas" className="space-y-6">
          <DataTable
            data={sistemas}
            columns={sistemasColumns}
            emptyState={{
              icon: <Shield className="h-12 w-12" />,
              title: "Nenhum sistema cadastrado",
              description: "Comece criando seu primeiro sistema privilegiado",
              action: {
                label: "Novo Sistema",
                onClick: () => setShowSistemaDialog(true)
              }
            }}
          />
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