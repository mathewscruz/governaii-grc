import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';
import { useAuth } from '@/components/AuthProvider';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable, Column } from '@/components/ui/data-table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PlanoAcaoDialog } from '@/components/planos-acao/PlanoAcaoDialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { formatDateOnly } from '@/lib/date-utils';
import { Plus, ListTodo, Clock, CheckCircle2, AlertTriangle, XCircle, Pencil, Trash2, LayoutGrid, List, Target } from 'lucide-react';
import { differenceInDays } from 'date-fns';

const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
  pendente: { label: 'Pendente', variant: 'warning', icon: Clock },
  em_andamento: { label: 'Em Andamento', variant: 'info', icon: Target },
  concluido: { label: 'Concluído', variant: 'success', icon: CheckCircle2 },
  cancelado: { label: 'Cancelado', variant: 'secondary', icon: XCircle },
  atrasado: { label: 'Atrasado', variant: 'destructive', icon: AlertTriangle },
};

const prioridadeConfig: Record<string, { label: string; variant: any }> = {
  baixa: { label: 'Baixa', variant: 'secondary' },
  media: { label: 'Média', variant: 'default' },
  alta: { label: 'Alta', variant: 'warning' },
  critica: { label: 'Crítica', variant: 'destructive' },
};

const moduloLabels: Record<string, string> = {
  manual: 'Manual',
  riscos: 'Riscos',
  controles: 'Controles',
  frameworks: 'Frameworks',
  incidentes: 'Incidentes',
  auditorias: 'Auditorias',
  contratos: 'Contratos',
  documentos: 'Documentos',
  dados: 'Privacidade',
  'due-diligence': 'Due Diligence',
  denuncia: 'Denúncia',
  ativos: 'Ativos',
  'contas-privilegiadas': 'Contas Priv.',
};

export default function PlanosAcao() {
  const { empresaId } = useEmpresaId();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlano, setEditingPlano] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [prioridadeFilter, setPrioridadeFilter] = useState('todos');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'lista' | 'kanban'>('lista');
  const [activeTab, setActiveTab] = useState('todos');

  const { data: planos = [], isLoading } = useQuery({
    queryKey: ['planos-acao', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from('planos_acao')
        .select('*, profiles:responsavel_id(nome_completo, avatar_url)')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!empresaId,
  });

  // Auto-detect atrasados
  const processedPlanos = useMemo(() => {
    return planos.map((p: any) => {
      if (p.prazo && ['pendente', 'em_andamento'].includes(p.status)) {
        const diff = differenceInDays(new Date(p.prazo), new Date());
        if (diff < 0) return { ...p, _displayStatus: 'atrasado' };
      }
      return { ...p, _displayStatus: p.status };
    });
  }, [planos]);

  // Stats
  const stats = useMemo(() => {
    const total = processedPlanos.length;
    const pendentes = processedPlanos.filter((p: any) => p._displayStatus === 'pendente').length;
    const emAndamento = processedPlanos.filter((p: any) => p._displayStatus === 'em_andamento').length;
    const concluidos = processedPlanos.filter((p: any) => p._displayStatus === 'concluido').length;
    const atrasados = processedPlanos.filter((p: any) => p._displayStatus === 'atrasado').length;
    return { total, pendentes, emAndamento, concluidos, atrasados };
  }, [processedPlanos]);

  // Filter + search
  const filteredPlanos = useMemo(() => {
    let result = processedPlanos;

    if (activeTab === 'meus') {
      result = result.filter((p: any) => p.responsavel_id === user?.id || p.created_by === user?.id);
    }

    if (statusFilter !== 'todos') {
      result = result.filter((p: any) => p._displayStatus === statusFilter);
    }
    if (prioridadeFilter !== 'todos') {
      result = result.filter((p: any) => p.prioridade === prioridadeFilter);
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((p: any) =>
        p.titulo?.toLowerCase().includes(s) ||
        p.descricao?.toLowerCase().includes(s) ||
        p.registro_origem_titulo?.toLowerCase().includes(s)
      );
    }

    // Sort
    result.sort((a: any, b: any) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [processedPlanos, activeTab, statusFilter, prioridadeFilter, search, sortField, sortDirection, user?.id]);

  const handleSave = async (data: any) => {
    if (!empresaId || !user?.id) return;
    setSaving(true);
    try {
      if (editingPlano) {
        const { error } = await supabase.from('planos_acao').update(data).eq('id', editingPlano.id);
        if (error) throw error;
        toast.success('Plano de ação atualizado');
      } else {
        const { error } = await supabase.from('planos_acao').insert({
          ...data,
          empresa_id: empresaId,
          created_by: user.id,
        });
        if (error) throw error;
        toast.success('Plano de ação criado');
      }
      queryClient.invalidateQueries({ queryKey: ['planos-acao'] });
      setDialogOpen(false);
      setEditingPlano(null);
    } catch (error) {
      logger.error('Erro ao salvar plano de ação', error);
      toast.error('Erro ao salvar plano de ação');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from('planos_acao').delete().eq('id', deleteId);
      if (error) throw error;
      toast.success('Plano de ação excluído');
      queryClient.invalidateQueries({ queryKey: ['planos-acao'] });
    } catch (error) {
      logger.error('Erro ao excluir plano', error);
      toast.error('Erro ao excluir plano de ação');
    } finally {
      setDeleteId(null);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'titulo',
      label: 'Título',
      sortable: true,
      render: (_: any, item: any) => (
        <div className="max-w-xs">
          <p className="font-medium truncate">{item.titulo}</p>
          {item.registro_origem_titulo && (
            <p className="text-xs text-muted-foreground truncate">
              ↳ {moduloLabels[item.modulo_origem] || item.modulo_origem}: {item.registro_origem_titulo}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: any, item: any) => {
        const cfg = statusConfig[item._displayStatus] || statusConfig.pendente;
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    {
      key: 'prioridade',
      label: 'Prioridade',
      sortable: true,
      render: (val: string) => {
        const cfg = prioridadeConfig[val] || prioridadeConfig.media;
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    {
      key: 'responsavel_id',
      label: 'Responsável',
      render: (_: any, item: any) => (
        <span className="text-sm">{item.profiles?.nome_completo || '-'}</span>
      ),
    },
    {
      key: 'prazo',
      label: 'Prazo',
      sortable: true,
      render: (val: string, item: any) => {
        if (!val) return <span className="text-muted-foreground">-</span>;
        const isOverdue = item._displayStatus === 'atrasado';
        return (
          <span className={isOverdue ? 'text-destructive font-medium' : ''}>
            {formatDateOnly(val)}
          </span>
        );
      },
    },
    {
      key: 'modulo_origem',
      label: 'Origem',
      render: (val: string) => (
        <Badge variant="outline" className="text-xs">
          {moduloLabels[val] || val || 'Manual'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Ações',
      className: 'w-24',
      render: (_: any, item: any) => (
        <TooltipProvider>
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingPlano(item); setDialogOpen(true); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Excluir</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      ),
    },
  ];

  // Kanban view
  const kanbanColumns = ['pendente', 'em_andamento', 'concluido', 'atrasado', 'cancelado'];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planos de Ação"
        description="Gerencie todas as ações e pendências transversais do sistema"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Planos de Ação' }]}
        actions={
          <div className="flex gap-2">
            <div className="flex border rounded-md overflow-hidden">
              <Button variant={viewMode === 'lista' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('lista')} className="rounded-none">
                <List className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'kanban' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('kanban')} className="rounded-none">
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={() => { setEditingPlano(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Ação
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Total" value={stats.total} icon={<ListTodo className="h-5 w-5" />} variant="primary" />
        <StatCard title="Pendentes" value={stats.pendentes} icon={<Clock className="h-5 w-5" />} variant="warning" />
        <StatCard title="Em Andamento" value={stats.emAndamento} icon={<Target className="h-5 w-5" />} variant="info" />
        <StatCard title="Concluídos" value={stats.concluidos} icon={<CheckCircle2 className="h-5 w-5" />} variant="success" />
        <StatCard title="Atrasados" value={stats.atrasados} icon={<AlertTriangle className="h-5 w-5" />} variant="destructive" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="meus">Meus Itens</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {viewMode === 'lista' ? (
            <Card>
              <DataTable
                data={filteredPlanos}
                columns={columns}
                loading={isLoading}
                searchable
                searchPlaceholder="Buscar planos de ação..."
                searchValue={search}
                onSearchChange={setSearch}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                paginated
                pageSize={20}
                filters={[
                  {
                    key: 'status',
                    label: 'Status',
                    options: [
                      { value: 'todos', label: 'Todos os Status' },
                      { value: 'pendente', label: 'Pendente' },
                      { value: 'em_andamento', label: 'Em Andamento' },
                      { value: 'concluido', label: 'Concluído' },
                      { value: 'atrasado', label: 'Atrasado' },
                      { value: 'cancelado', label: 'Cancelado' },
                    ],
                    value: statusFilter,
                    onChange: setStatusFilter,
                  },
                  {
                    key: 'prioridade',
                    label: 'Prioridade',
                    options: [
                      { value: 'todos', label: 'Todas' },
                      { value: 'baixa', label: 'Baixa' },
                      { value: 'media', label: 'Média' },
                      { value: 'alta', label: 'Alta' },
                      { value: 'critica', label: 'Crítica' },
                    ],
                    value: prioridadeFilter,
                    onChange: setPrioridadeFilter,
                  },
                ]}
                emptyState={{
                  icon: <ListTodo className="h-12 w-12" />,
                  title: 'Nenhum plano de ação encontrado',
                  description: 'Crie um novo plano de ação para começar',
                  action: { label: 'Nova Ação', onClick: () => { setEditingPlano(null); setDialogOpen(true); } },
                }}
              />
            </Card>
          ) : (
            /* Kanban View */
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {kanbanColumns.map((colStatus) => {
                const cfg = statusConfig[colStatus];
                const items = filteredPlanos.filter((p: any) => p._displayStatus === colStatus);
                return (
                  <div key={colStatus} className="space-y-3">
                    <div className="flex items-center gap-2 px-2">
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      <span className="text-sm text-muted-foreground">({items.length})</span>
                    </div>
                    <div className="space-y-2 min-h-[200px]">
                      {items.map((item: any) => (
                        <Card
                          key={item.id}
                          className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => { setEditingPlano(item); setDialogOpen(true); }}
                        >
                          <p className="font-medium text-sm line-clamp-2">{item.titulo}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant={prioridadeConfig[item.prioridade]?.variant || 'default'} className="text-xs">
                              {prioridadeConfig[item.prioridade]?.label || item.prioridade}
                            </Badge>
                            {item.modulo_origem && item.modulo_origem !== 'manual' && (
                              <Badge variant="outline" className="text-xs">
                                {moduloLabels[item.modulo_origem] || item.modulo_origem}
                              </Badge>
                            )}
                          </div>
                          {item.prazo && (
                            <p className={`text-xs mt-2 ${item._displayStatus === 'atrasado' ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                              Prazo: {formatDateOnly(item.prazo)}
                            </p>
                          )}
                          {item.profiles?.nome_completo && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.profiles.nome_completo}
                            </p>
                          )}
                        </Card>
                      ))}
                      {items.length === 0 && (
                        <div className="text-center text-muted-foreground text-xs py-8 border-2 border-dashed rounded-lg">
                          Nenhuma ação
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <PlanoAcaoDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingPlano(null); }}
        onSave={handleSave}
        plano={editingPlano}
        loading={saving}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir Plano de Ação"
        description="Tem certeza que deseja excluir este plano de ação? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
