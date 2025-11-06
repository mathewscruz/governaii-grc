import React, { useState, useMemo } from 'react';
import { Plus, Users, Shield, AlertTriangle, CheckCircle, Clock, Edit, BarChart3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import ContaDialog from '@/components/contas-privilegiadas/ContaDialog';
import SistemaDialog from '@/components/contas-privilegiadas/SistemaDialog';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatDateOnly } from '@/lib/date-utils';

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
  const [searchContasTerm, setSearchContasTerm] = useState('');
  const [searchSistemasTerm, setSearchSistemasTerm] = useState('');
  const [statusContaFilter, setStatusContaFilter] = useState('todos');
  const [nivelFilter, setNivelFilter] = useState('todos');
  const [statusSistemaFilter, setStatusSistemaFilter] = useState('todos');
  const [tipoSistemaFilter, setTipoSistemaFilter] = useState('todos');
  const [criticidadeSistemaFilter, setCriticidadeSistemaFilter] = useState('todos');
  const [sortContasField, setSortContasField] = useState('usuario_beneficiario');
  const [sortContasDirection, setSortContasDirection] = useState<'asc' | 'desc'>('asc');
  const [sortSistemasField, setSortSistemasField] = useState('nome_sistema');
  const [sortSistemasDirection, setSortSistemasDirection] = useState<'asc' | 'desc'>('asc');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: string;
    nome: string;
    tipo: 'conta' | 'sistema';
  }>({ open: false, id: '', nome: '', tipo: 'conta' });
  const { toast } = useToast();

  // Buscar contas privilegiadas
  const { data: contas = [], refetch: refetchContas, isLoading: loadingContas } = useQuery({
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
  const { data: sistemas = [], refetch: refetchSistemas, isLoading: loadingSistemas } = useQuery({
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

  const handleDeleteConta = (contaId: string, usuarioNome: string) => {
    setDeleteConfirm({ open: true, id: contaId, nome: usuarioNome, tipo: 'conta' });
  };

  const handleDeleteSistema = async (sistemaId: string, sistemaNome: string) => {
    // Verificar se há contas vinculadas
    const { data: contasVinculadas } = await supabase
      .from('contas_privilegiadas' as any)
      .select('id')
      .eq('sistema_id', sistemaId);

    if (contasVinculadas && contasVinculadas.length > 0) {
      toast({
        title: "Não é possível excluir",
        description: `O sistema "${sistemaNome}" possui ${contasVinculadas.length} conta(s) vinculada(s). Exclua-as primeiro.`,
        variant: "destructive",
      });
      return;
    }

    setDeleteConfirm({ open: true, id: sistemaId, nome: sistemaNome, tipo: 'sistema' });
  };

  const confirmDelete = async () => {
    const { id, tipo } = deleteConfirm;

    if (tipo === 'conta') {
      const { error } = await supabase
        .from('contas_privilegiadas' as any)
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro ao excluir conta",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Conta excluída",
        description: `A conta foi excluída com sucesso.`,
      });
      refetchContas();
    } else {
      const { error } = await supabase
        .from('sistemas_privilegiados' as any)
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro ao excluir sistema",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sistema excluído",
        description: `O sistema foi excluído com sucesso.`,
      });
      refetchSistemas();
    }

    setDeleteConfirm({ open: false, id: '', nome: '', tipo: 'conta' });
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
      'critico': 'bg-red-100 text-red-800 border-red-200',
      'alto': 'bg-orange-100 text-orange-800 border-orange-200',
      'alta': 'bg-red-100 text-red-800 border-red-200',
      'media': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'medio': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'baixa': 'bg-green-100 text-green-800 border-green-200',
      'baixo': 'bg-green-100 text-green-800 border-green-200',
    };

    return (
      <Badge className={colors[criticidade as keyof typeof colors] || colors.media}>
        {criticidade.charAt(0).toUpperCase() + criticidade.slice(1)}
      </Badge>
    );
  };

  const capitalizeText = (text: string) => {
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  // Filtrar e ordenar contas
  const filteredAndSortedContas = useMemo(() => {
    let filtered = contas.filter(conta => {
      const matchesSearch = searchContasTerm === '' || 
        conta.usuario_beneficiario.toLowerCase().includes(searchContasTerm.toLowerCase()) ||
        conta.email_beneficiario?.toLowerCase().includes(searchContasTerm.toLowerCase()) ||
        conta.sistemas_privilegiados?.nome_sistema.toLowerCase().includes(searchContasTerm.toLowerCase());
      
      const matchesStatus = statusContaFilter === 'todos' || conta.status === statusContaFilter;
      const matchesNivel = nivelFilter === 'todos' || conta.nivel_privilegio === nivelFilter;

      return matchesSearch && matchesStatus && matchesNivel;
    });

    // Ordenar
    filtered.sort((a, b) => {
      let aValue = a[sortContasField as keyof ContaPrivilegiada];
      let bValue = b[sortContasField as keyof ContaPrivilegiada];

      if (sortContasField === 'sistema') {
        aValue = a.sistemas_privilegiados?.nome_sistema || '';
        bValue = b.sistemas_privilegiados?.nome_sistema || '';
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortContasDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) return sortContasDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortContasDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [contas, searchContasTerm, statusContaFilter, nivelFilter, sortContasField, sortContasDirection]);

  // Filtrar e ordenar sistemas
  const filteredAndSortedSistemas = useMemo(() => {
    let filtered = sistemas.filter(sistema => {
      const matchesSearch = searchSistemasTerm === '' || 
        sistema.nome_sistema.toLowerCase().includes(searchSistemasTerm.toLowerCase()) ||
        sistema.tipo_sistema.toLowerCase().includes(searchSistemasTerm.toLowerCase()) ||
        sistema.responsavel_sistema?.toLowerCase().includes(searchSistemasTerm.toLowerCase());
      
      const matchesStatus = statusSistemaFilter === 'todos' || (sistema.ativo ? 'ativo' : 'inativo') === statusSistemaFilter;
      const matchesTipo = tipoSistemaFilter === 'todos' || sistema.tipo_sistema === tipoSistemaFilter;
      const matchesCriticidade = criticidadeSistemaFilter === 'todos' || sistema.criticidade === criticidadeSistemaFilter;

      return matchesSearch && matchesStatus && matchesTipo && matchesCriticidade;
    });

    // Ordenar
    filtered.sort((a, b) => {
      const aValue = a[sortSistemasField as keyof SistemaPrivilegiado];
      const bValue = b[sortSistemasField as keyof SistemaPrivilegiado];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortSistemasDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) return sortSistemasDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortSistemasDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [sistemas, searchSistemasTerm, statusSistemaFilter, tipoSistemaFilter, criticidadeSistemaFilter, sortSistemasField, sortSistemasDirection]);

  // Configuração das colunas para DataTable de Contas
  const contasColumns = [
    {
      key: 'usuario_beneficiario',
      label: 'Usuário',
      sortable: true,
      render: (_: any, conta: ContaPrivilegiada) => (
        <div>
          <div className="font-medium">{conta.usuario_beneficiario}</div>
          {conta.email_beneficiario && (
            <div className="text-sm text-muted-foreground">{conta.email_beneficiario}</div>
          )}
        </div>
      )
    },
    {
      key: 'sistema',
      label: 'Sistema',
      sortable: true,
      render: (_: any, conta: ContaPrivilegiada) => (
        <div>
          <div className="font-medium">{conta.sistemas_privilegiados?.nome_sistema}</div>
          <div className="text-sm text-muted-foreground">
            {capitalizeText(conta.sistemas_privilegiados?.tipo_sistema || '')}
          </div>
        </div>
      )
    },
    {
      key: 'tipo_acesso',
      label: 'Tipo de Acesso',
      sortable: true,
      render: (_: any, conta: ContaPrivilegiada) => (
        <Badge variant="secondary">{capitalizeText(conta.tipo_acesso)}</Badge>
      )
    },
    {
      key: 'nivel_privilegio',
      label: 'Nível',
      sortable: true,
      render: (_: any, conta: ContaPrivilegiada) => (
        <Badge variant={conta.nivel_privilegio === 'critico' ? 'destructive' : 'secondary'}>
          {capitalizeText(conta.nivel_privilegio)}
        </Badge>
      )
    },
    {
      key: 'data_expiracao',
      label: 'Data Expiração',
      sortable: true,
      render: (_: any, conta: ContaPrivilegiada) => formatDateOnly(conta.data_expiracao)
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: any, conta: ContaPrivilegiada) => getStatusBadge(conta.status)
    },
    {
      key: 'acoes',
      label: 'Ações',
      render: (_: any, conta: ContaPrivilegiada) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditConta(conta)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteConta(conta.id, conta.usuario_beneficiario)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  // Configuração das colunas para DataTable de Sistemas
  const sistemasColumns = [
    {
      key: 'nome_sistema',
      label: 'Nome do Sistema',
      sortable: true,
      render: (_: any, sistema: SistemaPrivilegiado) => (
        <div className="font-medium">{sistema.nome_sistema}</div>
      )
    },
    {
      key: 'tipo_sistema',
      label: 'Tipo',
      sortable: true,
      render: (_: any, sistema: SistemaPrivilegiado) => (
        <Badge variant="outline">{capitalizeText(sistema.tipo_sistema)}</Badge>
      )
    },
    {
      key: 'criticidade',
      label: 'Criticidade',
      sortable: true,
      render: (_: any, sistema: SistemaPrivilegiado) => getCriticidadeBadge(sistema.criticidade)
    },
    {
      key: 'responsavel_sistema',
      label: 'Responsável',
      sortable: true,
      render: (_: any, sistema: SistemaPrivilegiado) => sistema.responsavel_sistema || '-'
    },
    {
      key: 'url_sistema',
      label: 'URL',
      render: (_: any, sistema: SistemaPrivilegiado) => (
        sistema.url_sistema ? (
          <a 
            href={sistema.url_sistema} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Acessar
          </a>
        ) : '-'
      )
    },
    {
      key: 'acoes',
      label: 'Ações',
      render: (_: any, sistema: SistemaPrivilegiado) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditSistema(sistema)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteSistema(sistema.id, sistema.nome_sistema)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  // Filtros para contas
  const contasFilters = [
    {
      key: 'status',
      label: 'Status',
      value: statusContaFilter,
      onChange: setStatusContaFilter,
      options: [
        { value: 'todos', label: 'Todos os status' },
        { value: 'ativo', label: 'Ativo' },
        { value: 'expirado', label: 'Expirado' },
        { value: 'pendente_aprovacao', label: 'Pendente' },
        { value: 'revogado', label: 'Revogado' },
      ]
    },
    {
      key: 'nivel',
      label: 'Nível de Privilégio',
      value: nivelFilter,
      onChange: setNivelFilter,
      options: [
        { value: 'todos', label: 'Todos os níveis' },
        { value: 'critico', label: 'Crítico' },
        { value: 'alto', label: 'Alto' },
        { value: 'medio', label: 'Médio' },
        { value: 'baixo', label: 'Baixo' },
      ]
    }
  ];

  // Filtros para sistemas
  const sistemasFilters = [
    {
      key: 'status',
      label: 'Status',
      value: statusSistemaFilter,
      onChange: setStatusSistemaFilter,
      options: [
        { value: 'todos', label: 'Todos' },
        { value: 'ativo', label: 'Ativo' },
        { value: 'inativo', label: 'Inativo' },
      ]
    },
    {
      key: 'tipo',
      label: 'Tipo',
      value: tipoSistemaFilter,
      onChange: setTipoSistemaFilter,
      options: [
        { value: 'todos', label: 'Todos os tipos' },
        { value: 'erp', label: 'ERP' },
        { value: 'banco_dados', label: 'Banco de Dados' },
        { value: 'servidor', label: 'Servidor' },
        { value: 'aplicacao', label: 'Aplicação' },
        { value: 'nuvem', label: 'Nuvem' },
        { value: 'outro', label: 'Outro' },
      ]
    },
    {
      key: 'criticidade',
      label: 'Criticidade',
      value: criticidadeSistemaFilter,
      onChange: setCriticidadeSistemaFilter,
      options: [
        { value: 'todos', label: 'Todas' },
        { value: 'critico', label: 'Crítico' },
        { value: 'alto', label: 'Alto' },
        { value: 'medio', label: 'Médio' },
        { value: 'baixo', label: 'Baixo' },
      ]
    }
  ];

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
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleRelatorios}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Relatórios
            </Button>
            <Button size="sm" onClick={() => setShowContaDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
          </div>

          <DataTable
            data={filteredAndSortedContas}
            columns={contasColumns}
            loading={loadingContas}
            searchable
            searchPlaceholder="Buscar contas..."
            searchValue={searchContasTerm}
            onSearchChange={setSearchContasTerm}
            filters={contasFilters}
            sortField={sortContasField}
            sortDirection={sortContasDirection}
            onSort={(field) => {
              if (sortContasField === field) {
                setSortContasDirection(sortContasDirection === 'asc' ? 'desc' : 'asc');
              } else {
                setSortContasField(field);
                setSortContasDirection('asc');
              }
            }}
            emptyState={{
              icon: <Users className="h-8 w-8" />,
              title: searchContasTerm ? "Nenhuma conta encontrada" : "Nenhuma conta cadastrada",
              description: searchContasTerm 
                ? "Tente ajustar os termos de busca ou limpe os filtros."
                : "Comece cadastrando um sistema privilegiado e depois adicione contas de acesso.",
              action: !searchContasTerm ? {
                label: "Cadastrar Sistema",
                onClick: () => setShowSistemaDialog(true)
              } : undefined
            }}
            onRefresh={refetchContas}
          />
        </TabsContent>

        <TabsContent value="sistemas" className="space-y-6">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowSistemaDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Sistema
            </Button>
          </div>

          <DataTable
            data={filteredAndSortedSistemas}
            columns={sistemasColumns}
            loading={loadingSistemas}
            searchable
            searchPlaceholder="Buscar sistemas..."
            searchValue={searchSistemasTerm}
            onSearchChange={setSearchSistemasTerm}
            filters={sistemasFilters}
            sortField={sortSistemasField}
            sortDirection={sortSistemasDirection}
            onSort={(field) => {
              if (sortSistemasField === field) {
                setSortSistemasDirection(sortSistemasDirection === 'asc' ? 'desc' : 'asc');
              } else {
                setSortSistemasField(field);
                setSortSistemasDirection('asc');
              }
            }}
            emptyState={{
              icon: <Shield className="h-8 w-8" />,
              title: searchSistemasTerm ? "Nenhum sistema encontrado" : "Nenhum sistema cadastrado",
              description: searchSistemasTerm 
                ? "Tente ajustar os termos de busca."
                : "Cadastre os sistemas que possuem contas privilegiadas.",
              action: !searchSistemasTerm ? {
                label: "Cadastrar Primeiro Sistema",
                onClick: () => setShowSistemaDialog(true)
              } : undefined
            }}
            onRefresh={refetchSistemas}
          />
        </TabsContent>
      </Tabs>

      {/* Diálogos */}
      <ContaDialog
        open={showContaDialog}
        conta={selectedConta}
        sistemas={sistemas}
        onClose={handleCloseContaDialog}
      />

      <SistemaDialog
        open={showSistemaDialog}
        sistema={selectedSistema}
        onClose={handleCloseSistemaDialog}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
        title={`Excluir ${deleteConfirm.tipo === 'conta' ? 'Conta' : 'Sistema'}`}
        description={`Tem certeza que deseja excluir "${deleteConfirm.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}