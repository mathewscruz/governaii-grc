import { useState, useMemo } from 'react';
import { Plus, FileCheck, AlertTriangle, CheckCircle, Clock, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { LicencaDialog } from '@/components/ativos/LicencaDialog';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useLicencasStats } from '@/hooks/useLicencasStats';

interface Licenca {
  id: string;
  nome: string;
  tipo_licenca: string;
  fornecedor: string;
  chave_licenca?: string;
  quantidade_licencas: number;
  data_aquisicao: string;
  data_vencimento: string;
  custo_mensal?: number;
  criticidade: string;
  status: string;
  observacoes?: string;
  responsavel?: string;
}

export default function AtivosLicencas() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLicenca, setSelectedLicenca] = useState<Licenca | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [criticidadeFilter, setCriticidadeFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [sortField, setSortField] = useState('nome');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: string;
    nome: string;
  }>({ open: false, id: '', nome: '' });
  const { toast } = useToast();

  // Buscar estatísticas
  const { data: stats, isLoading: statsLoading } = useLicencasStats();

  // Buscar licenças
  const { data: licencas = [], refetch, isLoading } = useQuery({
    queryKey: ['ativos-licencas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ativos_licencas')
        .select('*')
        .order('data_vencimento');

      if (error) throw error;
      return (data || []) as Licenca[];
    },
  });

  const handleNew = () => {
    setSelectedLicenca(null);
    setDialogOpen(true);
  };

  const handleEdit = (licenca: Licenca) => {
    setSelectedLicenca(licenca);
    setDialogOpen(true);
  };

  const handleDelete = (id: string, nome: string) => {
    setDeleteConfirm({ open: true, id, nome });
  };

  const confirmDelete = async () => {
    const { error } = await supabase
      .from('ativos_licencas')
      .delete()
      .eq('id', deleteConfirm.id);

    if (error) {
      toast({
        title: "Erro ao excluir licença",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Licença excluída",
      description: "A licença foi excluída com sucesso.",
    });
    
    refetch();
    setDeleteConfirm({ open: false, id: '', nome: '' });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ativa': { variant: 'default' as const, label: 'Ativa', icon: CheckCircle },
      'vencida': { variant: 'destructive' as const, label: 'Vencida', icon: AlertTriangle },
      'a_vencer': { variant: 'secondary' as const, label: 'A Vencer', icon: Clock },
      'cancelada': { variant: 'outline' as const, label: 'Cancelada', icon: Clock },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ativa;
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
      'critica': 'bg-red-100 text-red-800 border-red-200',
      'alta': 'bg-orange-100 text-orange-800 border-orange-200',
      'media': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'baixa': 'bg-green-100 text-green-800 border-green-200',
    };

    return (
      <Badge className={colors[criticidade as keyof typeof colors] || colors.media}>
        {criticidade.charAt(0).toUpperCase() + criticidade.slice(1)}
      </Badge>
    );
  };

  // Função para formatar data sem conversão de timezone
  const formatDateOnly = (dateString: string) => {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  // Filtrar e ordenar licenças
  const filteredAndSortedLicencas = useMemo(() => {
    let filtered = licencas.filter(licenca => {
      const matchesSearch = searchTerm === '' || 
        licenca.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        licenca.tipo_licenca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        licenca.fornecedor.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'todos' || licenca.status === statusFilter;
      const matchesCriticidade = criticidadeFilter === 'todos' || licenca.criticidade === criticidadeFilter;
      const matchesTipo = tipoFilter === 'todos' || licenca.tipo_licenca === tipoFilter;

      return matchesSearch && matchesStatus && matchesCriticidade && matchesTipo;
    });

    // Ordenar
    filtered.sort((a, b) => {
      const aValue = a[sortField as keyof Licenca];
      const bValue = b[sortField as keyof Licenca];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [licencas, searchTerm, statusFilter, criticidadeFilter, tipoFilter, sortField, sortDirection]);

  // Configuração das colunas
  const columns = [
    {
      key: 'nome',
      label: 'Nome da Licença',
      sortable: true,
      render: (_: any, licenca: Licenca) => (
        <div>
          <div className="font-medium">{licenca.nome}</div>
          <div className="text-sm text-muted-foreground">{licenca.fornecedor}</div>
        </div>
      )
    },
    {
      key: 'tipo_licenca',
      label: 'Tipo',
      sortable: true,
      render: (_: any, licenca: Licenca) => (
        <Badge variant="outline">{licenca.tipo_licenca}</Badge>
      )
    },
    {
      key: 'quantidade_licencas',
      label: 'Quantidade',
      sortable: true,
    },
    {
      key: 'data_vencimento',
      label: 'Data Vencimento',
      sortable: true,
      render: (_: any, licenca: Licenca) => formatDateOnly(licenca.data_vencimento)
    },
    {
      key: 'custo_mensal',
      label: 'Custo Mensal',
      sortable: true,
      render: (_: any, licenca: Licenca) => (
        licenca.custo_mensal 
          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(licenca.custo_mensal)
          : '-'
      )
    },
    {
      key: 'criticidade',
      label: 'Criticidade',
      sortable: true,
      render: (_: any, licenca: Licenca) => getCriticidadeBadge(licenca.criticidade)
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: any, licenca: Licenca) => getStatusBadge(licenca.status)
    },
    {
      key: 'acoes',
      label: 'Ações',
      render: (_: any, licenca: Licenca) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(licenca)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(licenca.id, licenca.nome)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  // Configuração dos filtros
  const filters = [
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: 'todos', label: 'Todos os status' },
        { value: 'ativa', label: 'Ativa' },
        { value: 'vencida', label: 'Vencida' },
        { value: 'a_vencer', label: 'A Vencer' },
        { value: 'cancelada', label: 'Cancelada' },
      ]
    },
    {
      key: 'criticidade',
      label: 'Criticidade',
      value: criticidadeFilter,
      onChange: setCriticidadeFilter,
      options: [
        { value: 'todos', label: 'Todas' },
        { value: 'critica', label: 'Crítica' },
        { value: 'alta', label: 'Alta' },
        { value: 'media', label: 'Média' },
        { value: 'baixa', label: 'Baixa' },
      ]
    },
    {
      key: 'tipo',
      label: 'Tipo',
      value: tipoFilter,
      onChange: setTipoFilter,
      options: [
        { value: 'todos', label: 'Todos os tipos' },
        { value: 'perpetua', label: 'Perpétua' },
        { value: 'anual', label: 'Anual' },
        { value: 'mensal', label: 'Mensal' },
        { value: 'trial', label: 'Trial' },
        { value: 'outro', label: 'Outro' },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Licenças de Software"
        description="Gerencie e monitore licenças e suas renovações"
      />

      {/* StatCards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Licenças"
          value={stats?.total ?? 0}
          description="Licenças registradas"
          icon={<FileCheck className="h-4 w-4" />}
          loading={statsLoading}
        />

        <StatCard
          title="Licenças Ativas"
          value={stats?.ativas ?? 0}
          description="Em vigor"
          icon={<CheckCircle className="h-4 w-4" />}
          loading={statsLoading}
          variant="success"
        />

        <StatCard
          title="A Vencer"
          value={stats?.vencendo30dias ?? 0}
          description="Próximos 30 dias"
          icon={<Clock className="h-4 w-4" />}
          loading={statsLoading}
          variant="warning"
        />

        <StatCard
          title="Vencidas"
          value={stats?.vencidas ?? 0}
          description="Expiradas"
          icon={<AlertTriangle className="h-4 w-4" />}
          loading={statsLoading}
          variant="destructive"
        />
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Licença
        </Button>
      </div>

      <DataTable
        data={filteredAndSortedLicencas}
        columns={columns}
        loading={isLoading}
        searchable
        searchPlaceholder="Buscar licenças..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={(field) => {
          if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
          } else {
            setSortField(field);
            setSortDirection('asc');
          }
        }}
        emptyState={{
          icon: <FileCheck className="h-8 w-8" />,
          title: searchTerm ? "Nenhuma licença encontrada" : "Nenhuma licença cadastrada",
          description: searchTerm 
            ? "Tente ajustar os termos de busca ou limpe os filtros."
            : "Comece cadastrando as licenças de software da sua organização para monitorar renovações e custos.",
          action: !searchTerm ? {
            label: "Cadastrar Primeira Licença",
            onClick: handleNew
          } : undefined
        }}
        onRefresh={refetch}
      />

      {/* Diálogos */}
      <LicencaDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSelectedLicenca(null);
            refetch();
          }
        }}
        licenca={selectedLicenca}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
        title="Excluir Licença"
        description={`Tem certeza que deseja excluir a licença "${deleteConfirm.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}