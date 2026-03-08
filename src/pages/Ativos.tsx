import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Server, Activity, AlertTriangle, TrendingUp, Upload, Shield, CloudCog, Loader2, MoreHorizontal, Edit, Trash2, Wrench, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useAtivosStats } from '@/hooks/useAtivosStats';
import ImportacaoAtivos from '@/components/ativos/ImportacaoAtivos';
import AtivoDialog from '@/components/ativos/AtivoDialog';
import ManutencaoDialog from '@/components/ativos/ManutencaoDialog';
import TrilhaAuditoriaAtivos from '@/components/ativos/TrilhaAuditoriaAtivos';
import { formatDateOnly } from '@/lib/date-utils';
import { getCriticidadeColor, getItemStatusColor, formatStatus } from '@/lib/text-utils';
import { logger } from '@/lib/logger';

interface Ativo {
  id: string;
  nome: string;
  tipo: string;
  descricao: string | null;
  proprietario: string | null;
  proprietario_nome?: string | null;
  proprietario_avatar?: string | null;
  localizacao: string | null;
  valor_negocio: string | null;
  criticidade: string;
  status: string;
  data_aquisicao: string | null;
  fornecedor: string | null;
  versao: string | null;
  tags: string[] | null;
  imei: string | null;
  cliente: string | null;
  quantidade: number | null;
  created_at: string;
}

const tiposAtivo = [
  { value: 'servidor', label: 'Servidor' },
  { value: 'aplicacao', label: 'Aplicação' },
  { value: 'banco_dados', label: 'Banco de Dados' },
  { value: 'rede', label: 'Equipamento de Rede' },
  { value: 'endpoint', label: 'Endpoint' },
  { value: 'dispositivo_movel', label: 'Dispositivo Móvel' },
  { value: 'armazenamento', label: 'Armazenamento' },
  { value: 'software', label: 'Software' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'almoxarifado_equipamento', label: 'Equipamento de Almoxarifado' },
  { value: 'almoxarifado_ferramenta', label: 'Ferramenta' },
  { value: 'almoxarifado_material', label: 'Material de Consumo' },
  { value: 'almoxarifado_epi', label: 'Equipamento de Proteção Individual' },
  { value: 'mobiliario', label: 'Mobiliário' },
  { value: 'equipamento_escritorio', label: 'Equipamento de Escritório' },
  { value: 'equipamento_comunicacao', label: 'Equipamento de Comunicação' },
  { value: 'material_escritorio', label: 'Material de Escritório' },
  { value: 'veiculo_terrestre', label: 'Veículo Terrestre' },
  { value: 'veiculo_aereo', label: 'Veículo Aéreo' },
  { value: 'maquina_pesada', label: 'Máquina Pesada' },
  { value: 'equipamento_transporte', label: 'Equipamento de Transporte' },
  { value: 'imovel', label: 'Imóvel' },
  { value: 'estrutura_fisica', label: 'Estrutura Física' },
  { value: 'instalacao_eletrica', label: 'Instalação Elétrica' },
  { value: 'instalacao_hidraulica', label: 'Instalação Hidráulica' },
  { value: 'equipamento_seguranca', label: 'Equipamento de Segurança' },
  { value: 'sistema_monitoramento', label: 'Sistema de Monitoramento' },
  { value: 'controle_acesso', label: 'Controle de Acesso' },
  { value: 'equipamento_bombeiro', label: 'Equipamento de Combate a Incêndio' },
  { value: 'maquina_producao', label: 'Máquina de Produção' },
  { value: 'ferramenta_producao', label: 'Ferramenta de Produção' },
  { value: 'equipamento_medicao', label: 'Equipamento de Medição' },
  { value: 'equipamento_teste', label: 'Equipamento de Teste' },
  { value: 'equipamento_medico', label: 'Equipamento Médico' },
  { value: 'equipamento_laboratorio', label: 'Equipamento de Laboratório' },
  { value: 'outros', label: 'Outros' }
];

const criticidades = [
  { value: 'critico', label: 'Crítico', color: 'destructive' },
  { value: 'alto', label: 'Alto', color: 'warning' },
  { value: 'medio', label: 'Médio', color: 'default' },
  { value: 'baixo', label: 'Baixo', color: 'secondary' },
];

const statusOptions = [
  { value: 'ativo', label: 'Ativo', color: 'success' },
  { value: 'inativo', label: 'Inativo', color: 'secondary' },
  { value: 'descontinuado', label: 'Descontinuado', color: 'destructive' },
];

const valoresNegocio = ['alto', 'medio', 'baixo'];

const initialFormData = {
  nome: '',
  tipo: '',
  descricao: '',
  proprietario: '',
  localizacao: '',
  valor_negocio: '',
  criticidade: 'medio',
  status: 'ativo',
  data_aquisicao: '',
  fornecedor: '',
  versao: '',
  tags: '',
  imei: '',
  cliente: '',
  quantidade: 1,
};

const Ativos = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useAtivosStats();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const [statusFilter, setStatusFilter] = useState('todos');
  const [criticidadeFilter, setCriticidadeFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [valorNegocioFilter, setValorNegocioFilter] = useState('todos');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [importDialog, setImportDialog] = useState(false);
  const [azureSyncing, setAzureSyncing] = useState(false);
  const [editingAtivo, setEditingAtivo] = useState<Ativo | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; ativoId: string }>({ open: false, ativoId: '' });
  const [formData, setFormData] = useState(initialFormData);

  // Manutenção & Auditoria dialogs
  const [manutencaoDialog, setManutencaoDialog] = useState<{ open: boolean; ativoId: string; ativoNome: string }>({ open: false, ativoId: '', ativoNome: '' });
  const [trilhaDialog, setTrilhaDialog] = useState<{ open: boolean; ativoId?: string }>({ open: false });

  // Fetch ativos with React Query
  const { data: ativos = [], isLoading: loading } = useQuery<Ativo[]>({
    queryKey: ['ativos', profile?.empresa_id],
    queryFn: async (): Promise<Ativo[]> => {
      const { data, error } = await supabase
        .from('ativos')
        .select('*')
        .eq('empresa_id', profile!.empresa_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const proprietarioIds = data.map(a => a.proprietario).filter(p => p && p.trim() !== '');
        
        if (proprietarioIds.length > 0) {
          const { data: profiles } = await supabase
            .rpc('get_profiles_by_text_ids', { text_ids: proprietarioIds });

          if (profiles) {
            const profileMap = new Map(
              profiles.map((p: any) => [p.user_id.toString(), { nome: p.nome, foto_url: p.foto_url }])
            );
            return data.map(ativo => {
              const profileData = (ativo.proprietario && ativo.proprietario.trim() !== '') 
                ? profileMap.get(ativo.proprietario) : null;
              return { ...ativo, proprietario_nome: profileData?.nome || null, proprietario_avatar: profileData?.foto_url || null } as Ativo;
            });
          }
        }
      }
      return (data || []) as Ativo[];
    },
    enabled: !!profile?.empresa_id,
  });

  // Azure integration
  const { data: azureIntegration } = useQuery({
    queryKey: ['azure-integration', profile?.empresa_id],
    queryFn: async () => {
      if (!profile?.empresa_id) return null;
      // @ts-ignore
      const result = await supabase
        .from('integracoes_config')
        .select('id, configuracoes')
        .eq('empresa_id', profile.empresa_id)
        .eq('tipo_integracao', 'azure')
        .eq('ativo', true)
        .limit(1);
      return result.data?.[0] || null;
    },
    enabled: !!profile?.empresa_id,
  });

  const invalidateAtivos = () => queryClient.invalidateQueries({ queryKey: ['ativos'] });

  const handleAzureSync = async () => {
    if (!azureIntegration || !profile?.empresa_id) return;
    setAzureSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('azure-integration', {
        body: { action: 'sync', empresa_id: profile.empresa_id, config: azureIntegration.configuracoes }
      });
      if (error) throw error;
      toast({ title: "Sincronização concluída", description: `${data.synced_count || 0} dispositivos sincronizados do Azure/Intune` });
      invalidateAtivos();
    } catch (error: any) {
      logger.error('Azure sync error', { error: error?.message });
      toast({ title: "Erro na sincronização", description: error.message || "Falha ao sincronizar com Azure", variant: "destructive" });
    } finally {
      setAzureSyncing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.empresa_id) {
      toast({ title: "Erro", description: "Usuário deve estar vinculado a uma empresa", variant: "destructive" });
      return;
    }
    try {
      const ativoData = {
        ...formData,
        empresa_id: profile.empresa_id,
        proprietario: formData.proprietario || null,
        localizacao: formData.localizacao || null,
        data_aquisicao: formData.data_aquisicao || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : null,
      };
      if (editingAtivo) {
        const { error } = await supabase.from('ativos').update(ativoData).eq('id', editingAtivo.id);
        if (error) throw error;
        toast({ title: "Sucesso", description: "Ativo atualizado com sucesso!" });
      } else {
        const { error } = await supabase.from('ativos').insert(ativoData);
        if (error) throw error;
        toast({ title: "Sucesso", description: "Ativo criado com sucesso!" });
      }
      setIsDialogOpen(false);
      setEditingAtivo(null);
      setFormData(initialFormData);
      invalidateAtivos();
    } catch (error: any) {
      logger.error('Error saving ativo', { error: error?.message });
      toast({ title: "Erro", description: error.message || "Erro ao salvar ativo", variant: "destructive" });
    }
  };

  const handleEdit = (ativo: Ativo) => {
    setEditingAtivo(ativo);
    setFormData({
      nome: ativo.nome,
      tipo: ativo.tipo,
      descricao: ativo.descricao || '',
      proprietario: ativo.proprietario || '',
      localizacao: ativo.localizacao || '',
      valor_negocio: ativo.valor_negocio || '',
      criticidade: ativo.criticidade,
      status: ativo.status,
      data_aquisicao: ativo.data_aquisicao || '',
      fornecedor: ativo.fornecedor || '',
      versao: ativo.versao || '',
      tags: ativo.tags ? ativo.tags.join(', ') : '',
      imei: ativo.imei || '',
      cliente: ativo.cliente || '',
      quantidade: ativo.quantidade || 1,
    });
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const { error } = await supabase.from('ativos').delete().eq('id', deleteConfirm.ativoId);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Ativo excluído com sucesso!" });
      invalidateAtivos();
    } catch (error: any) {
      logger.error('Error deleting ativo', { error: error?.message });
      toast({ title: "Erro", description: error.message || "Erro ao excluir ativo", variant: "destructive" });
    }
  };

  const getTipoLabel = (value: string) => tiposAtivo.find(t => t.value === value)?.label || value;

  const filteredAndSortedAtivos = useMemo(() => {
    let filtered = ativos.filter(ativo => {
      const matchesSearch = searchTerm === '' || 
        ativo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ativo.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ativo.proprietario_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ativo.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ativo.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ativo.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'todos' || ativo.status === statusFilter;
      const matchesCriticidade = criticidadeFilter === 'todos' || ativo.criticidade === criticidadeFilter;
      const matchesTipo = tipoFilter === 'todos' || ativo.tipo === tipoFilter;
      const matchesValorNegocio = valorNegocioFilter === 'todos' || ativo.valor_negocio === valorNegocioFilter;
      return matchesSearch && matchesStatus && matchesCriticidade && matchesTipo && matchesValorNegocio;
    });

    filtered.sort((a, b) => {
      const aValue = a[sortField as keyof Ativo];
      const bValue = b[sortField as keyof Ativo];
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      if ((aValue ?? '') < (bValue ?? '')) return sortDirection === 'asc' ? -1 : 1;
      if ((aValue ?? '') > (bValue ?? '')) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [ativos, searchTerm, statusFilter, criticidadeFilter, tipoFilter, valorNegocioFilter, sortField, sortDirection]);

  const exportData = () => {
    const csvContent = [
      ['Nome', 'Tipo', 'Status', 'Criticidade', 'Proprietário', 'Localização', 'Data Aquisição'].join(','),
      ...filteredAndSortedAtivos.map(ativo => [
        ativo.nome,
        getTipoLabel(ativo.tipo),
        statusOptions.find(s => s.value === ativo.status)?.label || ativo.status,
        criticidades.find(c => c.value === ativo.criticidade)?.label || ativo.criticidade,
        ativo.proprietario_nome || '',
        ativo.localizacao || '',
        ativo.data_aquisicao ? formatDateOnly(ativo.data_aquisicao) : ''
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `ativos-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: Column<Ativo>[] = [
    {
      key: 'nome',
      label: 'Nome',
      sortable: true,
      render: (_: any, ativo: Ativo) => <span className="font-medium">{ativo.nome}</span>
    },
    {
      key: 'tipo',
      label: 'Tipo',
      sortable: true,
      render: (_: any, ativo: Ativo) => getTipoLabel(ativo.tipo)
    },
    {
      key: 'criticidade',
      label: 'Criticidade',
      sortable: true,
      render: (_: any, ativo: Ativo) => (
        <Badge className={`${getCriticidadeColor(ativo.criticidade)} border whitespace-nowrap`}>
          {criticidades.find(c => c.value === ativo.criticidade)?.label || ativo.criticidade}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: any, ativo: Ativo) => (
        <Badge className={`${getItemStatusColor(ativo.status)} border whitespace-nowrap`}>
          {formatStatus(ativo.status)}
        </Badge>
      )
    },
    {
      key: 'proprietario',
      label: 'Proprietário',
      render: (_: any, ativo: Ativo) => {
        if (!ativo.proprietario_nome) return '-';
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer">
                  {ativo.proprietario_avatar && <AvatarImage src={ativo.proprietario_avatar} alt={ativo.proprietario_nome} />}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {ativo.proprietario_nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent><p>{ativo.proprietario_nome}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
    },
    {
      key: 'localizacao',
      label: 'Localização',
      sortable: true,
      render: (_: any, ativo: Ativo) => ativo.localizacao || '-'
    },
    {
      key: 'acoes',
      label: 'Ações',
      render: (_: any, ativo: Ativo) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            <DropdownMenuItem onClick={() => handleEdit(ativo)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setManutencaoDialog({ open: true, ativoId: ativo.id, ativoNome: ativo.nome })}>
              <Wrench className="h-4 w-4 mr-2" />
              Manutenções
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTrilhaDialog({ open: true, ativoId: ativo.id })}>
              <History className="h-4 w-4 mr-2" />
              Trilha de Auditoria
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteConfirm({ open: true, ativoId: ativo.id })}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const filters = [
    {
      key: 'status', label: 'Status', value: statusFilter, onChange: setStatusFilter,
      options: [{ value: 'todos', label: 'Todos os status' }, ...statusOptions.map(s => ({ value: s.value, label: s.label }))]
    },
    {
      key: 'criticidade', label: 'Criticidade', value: criticidadeFilter, onChange: setCriticidadeFilter,
      options: [{ value: 'todos', label: 'Todas' }, ...criticidades.map(c => ({ value: c.value, label: c.label }))]
    },
    {
      key: 'tipo', label: 'Tipo', value: tipoFilter, onChange: setTipoFilter,
      options: [{ value: 'todos', label: 'Todos os tipos' }, ...tiposAtivo.map(t => ({ value: t.value, label: t.label }))]
    },
    {
      key: 'valor_negocio', label: 'Valor de Negócio', value: valorNegocioFilter, onChange: setValorNegocioFilter,
      options: [{ value: 'todos', label: 'Todos' }, ...valoresNegocio.map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))]
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Ativos"
        description="Gerencie todos os ativos da organização de forma centralizada"
        actions={
          <div className="flex items-center gap-2">
            {azureIntegration && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={handleAzureSync} disabled={azureSyncing} className="gap-2">
                      {azureSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudCog className="h-4 w-4" />}
                      Sincronizar Azure
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Sincronizar dispositivos do Microsoft Intune/Azure AD</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button variant="outline" size="sm" onClick={() => setTrilhaDialog({ open: true })}>
              <History className="h-4 w-4 mr-2" />
              Trilha de Auditoria
            </Button>
          </div>
        }
      />

      <AtivoDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isEditing={!!editingAtivo}
      />

      {/* Cards de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Ativos"
          value={stats?.total || 0}
          description={`Críticos: ${stats?.criticos || 0} | Altos: ${stats?.altos || 0}`}
          icon={<Server className="h-4 w-4 text-muted-foreground" />}
          variant={stats?.criticos ? "destructive" : "default"}
          loading={statsLoading}
        />
        <StatCard
          title="Ativos"
          value={stats?.ativos || 0}
          description={`${stats?.inativos || 0} inativos | ${stats?.descontinuados || 0} descontinuados`}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          variant="success"
          loading={statsLoading}
        />
        <StatCard
          title="Alto Valor"
          value={stats?.altoValorNegocio || 0}
          description={`${stats?.percentualAltoValor || 0}% do total`}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          variant="warning"
          loading={statsLoading}
        />
        <StatCard
          title="Criticidade Alta"
          value={(stats?.criticos || 0) + (stats?.altos || 0)}
          description="Requerem atenção especial"
          icon={<Shield className="h-4 w-4 text-muted-foreground" />}
          variant="info"
          loading={statsLoading}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button onClick={() => setImportDialog(true)} variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Importar
        </Button>
        <Button size="sm" onClick={() => {
          setEditingAtivo(null);
          setFormData(initialFormData);
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Ativo
        </Button>
      </div>

      {/* DataTable */}
      <Card className="rounded-lg border overflow-hidden">
        <CardContent className="p-0">
          <DataTable
            data={filteredAndSortedAtivos}
            columns={columns}
            loading={loading}
            searchable
            searchPlaceholder="Buscar ativos..."
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
            onExport={exportData}
            emptyState={{
              icon: <Server className="h-8 w-8" />,
              title: searchTerm ? "Nenhum ativo encontrado" : "Nenhum ativo cadastrado",
              description: searchTerm 
                ? "Tente ajustar os termos de busca ou limpe os filtros."
                : "Comece cadastrando os ativos da sua organização.",
              action: !searchTerm ? {
                label: "Cadastrar Primeiro Ativo",
                onClick: () => setIsDialogOpen(true)
              } : undefined
            }}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        onConfirm={confirmDelete}
        title="Excluir Ativo"
        description="Tem certeza que deseja excluir este ativo? Esta ação não pode ser desfeita."
      />

      <ImportacaoAtivos
        open={importDialog}
        onOpenChange={setImportDialog}
        onSuccess={invalidateAtivos}
      />

      <ManutencaoDialog
        ativoId={manutencaoDialog.ativoId}
        ativoNome={manutencaoDialog.ativoNome}
        open={manutencaoDialog.open}
        onOpenChange={(open) => setManutencaoDialog(prev => ({ ...prev, open }))}
      />

      <TrilhaAuditoriaAtivos
        ativoId={trilhaDialog.ativoId}
        open={trilhaDialog.open}
        onOpenChange={(open) => setTrilhaDialog(prev => ({ ...prev, open }))}
      />
    </div>
  );
};

export default Ativos;
