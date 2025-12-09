import { useState, useMemo } from 'react';
import { Plus, Key, AlertTriangle, CheckCircle, Clock, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ChaveDialog } from '@/components/ativos/ChaveDialog';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent } from '@/components/ui/card';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useChavesStats } from '@/hooks/useChavesStats';
import { formatDateOnly } from '@/lib/date-utils';

interface ChaveCriptografica {
  id: string;
  nome: string;
  tipo_chave: string;
  ambiente: string;
  sistema_aplicacao?: string;
  localizacao: string;
  data_criacao: string;
  data_ultima_rotacao?: string;
  data_proxima_rotacao: string;
  periodicidade_rotacao?: string;
  criticidade: string;
  status: string;
  algoritmo?: string;
  observacoes?: string;
  responsavel?: string;
  responsavel_nome?: string | null;
  responsavel_avatar?: string | null;
  rotacao_automatica: boolean;
}

export default function AtivosChaves() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedChave, setSelectedChave] = useState<ChaveCriptografica | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [criticidadeFilter, setCriticidadeFilter] = useState('todos');
  const [ambienteFilter, setAmbienteFilter] = useState('todos');
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
  const { data: stats, isLoading: statsLoading } = useChavesStats();

  // Buscar chaves
  const { data: chaves = [], refetch, isLoading } = useQuery({
    queryKey: ['ativos-chaves'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ativos_chaves_criptograficas')
        .select('*')
        .order('data_proxima_rotacao');

      if (error) throw error;
      
      // Fetch responsible user profiles
      if (data && data.length > 0) {
        const responsavelIds = data
          .map(c => c.responsavel)
          .filter(r => r && r.trim() !== '');
        
        if (responsavelIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .rpc('get_profiles_by_text_ids', { text_ids: responsavelIds });
          
          if (!profilesError && profiles) {
            const profileMap = new Map(
              profiles.map((p: any) => [p.user_id.toString(), { nome: p.nome, foto_url: p.foto_url }])
            );
            
            return data.map(chave => {
              const profileData = (chave.responsavel && chave.responsavel.trim() !== '')
                ? profileMap.get(chave.responsavel)
                : null;
              
              return {
                ...chave,
                responsavel_nome: profileData?.nome || null,
                responsavel_avatar: profileData?.foto_url || null
              };
            }) as ChaveCriptografica[];
          }
        }
      }
      
      return (data || []) as ChaveCriptografica[];
    },
  });

  const handleNew = () => {
    setSelectedChave(null);
    setDialogOpen(true);
  };

  const handleEdit = (chave: ChaveCriptografica) => {
    setSelectedChave(chave);
    setDialogOpen(true);
  };

  const handleDelete = (id: string, nome: string) => {
    setDeleteConfirm({ open: true, id, nome });
  };

  const confirmDelete = async () => {
    const { error } = await supabase
      .from('ativos_chaves_criptograficas')
      .delete()
      .eq('id', deleteConfirm.id);

    if (error) {
      toast({
        title: "Erro ao excluir chave",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Chave excluída",
      description: "A chave foi excluída com sucesso.",
    });
    
    refetch();
    setDeleteConfirm({ open: false, id: '', nome: '' });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ativa': { variant: 'default' as const, label: 'Ativa', icon: CheckCircle },
      'expirada': { variant: 'destructive' as const, label: 'Expirada', icon: AlertTriangle },
      'revogada': { variant: 'outline' as const, label: 'Revogada', icon: AlertTriangle },
      'em_rotacao': { variant: 'secondary' as const, label: 'Em Rotação', icon: Clock },
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


  // Filtrar e ordenar chaves
  const filteredAndSortedChaves = useMemo(() => {
    let filtered = chaves.filter(chave => {
      const matchesSearch = searchTerm === '' || 
        chave.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chave.tipo_chave.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chave.sistema_aplicacao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chave.localizacao.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'todos' || chave.status === statusFilter;
      const matchesCriticidade = criticidadeFilter === 'todos' || chave.criticidade === criticidadeFilter;
      const matchesAmbiente = ambienteFilter === 'todos' || chave.ambiente === ambienteFilter;
      const matchesTipo = tipoFilter === 'todos' || chave.tipo_chave === tipoFilter;

      return matchesSearch && matchesStatus && matchesCriticidade && matchesAmbiente && matchesTipo;
    });

    // Ordenar
    filtered.sort((a, b) => {
      const aValue = a[sortField as keyof ChaveCriptografica];
      const bValue = b[sortField as keyof ChaveCriptografica];

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
  }, [chaves, searchTerm, statusFilter, criticidadeFilter, ambienteFilter, tipoFilter, sortField, sortDirection]);

  // Configuração das colunas
  const columns = [
    {
      key: 'nome',
      label: 'Nome da Chave',
      sortable: true,
      render: (_: any, chave: ChaveCriptografica) => (
        <div>
          <div className="font-medium">{chave.nome}</div>
          {chave.sistema_aplicacao && (
            <div className="text-sm text-muted-foreground">{chave.sistema_aplicacao}</div>
          )}
        </div>
      )
    },
    {
      key: 'tipo_chave',
      label: 'Tipo',
      sortable: true,
      render: (_: any, chave: ChaveCriptografica) => (
        <Badge variant="outline">{chave.tipo_chave}</Badge>
      )
    },
    {
      key: 'ambiente',
      label: 'Ambiente',
      sortable: true,
      render: (_: any, chave: ChaveCriptografica) => (
        <Badge variant="secondary">{chave.ambiente}</Badge>
      )
    },
    {
      key: 'localizacao',
      label: 'Localização',
      sortable: true,
    },
    {
      key: 'data_proxima_rotacao',
      label: 'Próxima Rotação',
      sortable: true,
      render: (_: any, chave: ChaveCriptografica) => formatDateOnly(chave.data_proxima_rotacao)
    },
    {
      key: 'criticidade',
      label: 'Criticidade',
      sortable: true,
      render: (_: any, chave: ChaveCriptografica) => getCriticidadeBadge(chave.criticidade)
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: any, chave: ChaveCriptografica) => getStatusBadge(chave.status)
    },
    {
      key: 'responsavel',
      label: 'Responsável',
      render: (_: any, chave: ChaveCriptografica) => {
        if (!chave.responsavel_nome) return '-';
        
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer">
                  {chave.responsavel_avatar && (
                    <AvatarImage src={chave.responsavel_avatar} alt={chave.responsavel_nome} />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {chave.responsavel_nome
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{chave.responsavel_nome}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
    },
    {
      key: 'acoes',
      label: 'Ações',
      render: (_: any, chave: ChaveCriptografica) => (
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(chave)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Editar chave</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(chave.id, chave.nome)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Excluir chave</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
        { value: 'expirada', label: 'Expirada' },
        { value: 'revogada', label: 'Revogada' },
        { value: 'em_rotacao', label: 'Em Rotação' },
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
      key: 'ambiente',
      label: 'Ambiente',
      value: ambienteFilter,
      onChange: setAmbienteFilter,
      options: [
        { value: 'todos', label: 'Todos os ambientes' },
        { value: 'producao', label: 'Produção' },
        { value: 'homologacao', label: 'Homologação' },
        { value: 'desenvolvimento', label: 'Desenvolvimento' },
        { value: 'qa', label: 'QA' },
      ]
    },
    {
      key: 'tipo',
      label: 'Tipo',
      value: tipoFilter,
      onChange: setTipoFilter,
      options: [
        { value: 'todos', label: 'Todos os tipos' },
        { value: 'api_key', label: 'API Key' },
        { value: 'certificado_ssl', label: 'Certificado SSL' },
        { value: 'ssh_key', label: 'SSH Key' },
        { value: 'token_acesso', label: 'Token de Acesso' },
        { value: 'secret_key', label: 'Secret Key' },
        { value: 'outro', label: 'Outro' },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chaves Criptográficas"
        description="Gerencie e monitore chaves criptográficas e rotações"
      />

      {/* StatCards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Chaves"
          value={stats?.total ?? 0}
          description="Chaves registradas"
          icon={<Key className="h-4 w-4" />}
          loading={statsLoading}
        />

        <StatCard
          title="Chaves Ativas"
          value={stats?.ativas ?? 0}
          description="Em uso"
          icon={<CheckCircle className="h-4 w-4" />}
          loading={statsLoading}
          variant="success"
        />

        <StatCard
          title="Rotações Pendentes"
          value={stats?.rotacao30dias ?? 0}
          description="Próximos 30 dias"
          icon={<Clock className="h-4 w-4" />}
          loading={statsLoading}
          variant="warning"
        />

        <StatCard
          title="Críticas"
          value={stats?.criticas ?? 0}
          description="Alta prioridade"
          icon={<AlertTriangle className="h-4 w-4" />}
          loading={statsLoading}
          variant="destructive"
        />
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Chave
        </Button>
      </div>

      <Card className="rounded-lg border overflow-hidden">
        <CardContent className="p-0">
          <DataTable
            data={filteredAndSortedChaves}
            columns={columns}
            loading={isLoading}
            searchable
            searchPlaceholder="Buscar chaves..."
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
            onExport={() => {
              const csvContent = [
                ['Nome', 'Tipo', 'Ambiente', 'Localização', 'Próxima Rotação', 'Criticidade', 'Status', 'Responsável'].join(','),
                ...filteredAndSortedChaves.map(c => [
                  c.nome,
                  c.tipo_chave,
                  c.ambiente,
                  c.localizacao,
                  formatDateOnly(c.data_proxima_rotacao),
                  c.criticidade,
                  c.status,
                  c.responsavel_nome || ''
                ].join(','))
              ].join('\n');

              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = `chaves-criptograficas-${new Date().toISOString().split('T')[0]}.csv`;
              link.click();
            }}
            emptyState={{
              icon: <Key className="h-8 w-8" />,
              title: searchTerm ? "Nenhuma chave encontrada" : "Nenhuma chave cadastrada",
              description: searchTerm 
                ? "Tente ajustar os termos de busca ou limpe os filtros."
                : "Comece cadastrando as chaves criptográficas da sua organização para monitorar rotações e manter a segurança.",
              action: !searchTerm ? {
                label: "Cadastrar Primeira Chave",
                onClick: handleNew
              } : undefined
            }}
            onRefresh={refetch}
          />
        </CardContent>
      </Card>

      {/* Diálogos */}
      <ChaveDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSelectedChave(null);
            refetch();
          }
        }}
        chave={selectedChave}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
        title="Excluir Chave Criptográfica"
        description={`Tem certeza que deseja excluir a chave "${deleteConfirm.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}