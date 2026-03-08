import { useState, useMemo } from 'react';
import { useIntegrationNotify } from '@/hooks/useIntegrationNotify';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable, Column } from '@/components/ui/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { PoliticaDialog } from '@/components/politicas/PoliticaDialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { formatDateOnly } from '@/lib/date-utils';
import { Plus, BookOpen, Users, CheckCircle2, Clock, Pencil, Trash2, Send, Eye, Award, BarChart3, MoreHorizontal } from 'lucide-react';

const categoriaLabels: Record<string, string> = {
  seguranca: 'Segurança', privacidade: 'Privacidade', compliance: 'Compliance',
  rh: 'RH', ti: 'TI', operacional: 'Operacional', outra: 'Outra',
};

const statusConfig: Record<string, { label: string; variant: any }> = {
  rascunho: { label: 'Rascunho', variant: 'warning' },
  publicada: { label: 'Publicada', variant: 'success' },
  em_revisao: { label: 'Em Revisão', variant: 'info' },
  arquivada: { label: 'Arquivada', variant: 'secondary' },
};

export default function Politicas() {
  const { user, profile } = useAuth();
  const empresaId = profile?.empresa_id;
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPolitica, setEditingPolitica] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState('politicas');

  // Buscar políticas
  const { data: politicas = [], isLoading } = useQuery({
    queryKey: ['politicas', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from('politicas')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!empresaId,
  });

  // Buscar aceites (para dashboard)
  const { data: aceites = [] } = useQuery({
    queryKey: ['politica-aceites', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from('politica_aceites')
        .select('*')
        .eq('empresa_id', empresaId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!empresaId,
  });

  // Buscar total de usuários para calcular aderência
  const { data: totalUsuarios = 0 } = useQuery({
    queryKey: ['total-usuarios', empresaId],
    queryFn: async () => {
      if (!empresaId) return 0;
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', empresaId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!empresaId,
  });

  const stats = useMemo(() => {
    const total = politicas.length;
    const publicadas = politicas.filter((p: any) => p.status === 'publicada').length;
    const totalAceites = aceites.filter((a: any) => a.aceito).length;
    const politicasPublicadas = politicas.filter((p: any) => p.status === 'publicada');
    const aceitesEsperados = politicasPublicadas.length * totalUsuarios;
    const aderencia = aceitesEsperados > 0 ? Math.round((totalAceites / aceitesEsperados) * 100) : 0;
    return { total, publicadas, aderencia, totalAceites };
  }, [politicas, aceites, totalUsuarios]);

  // Aderência por política
  const aderenciaPorPolitica = useMemo(() => {
    return politicas
      .filter((p: any) => p.status === 'publicada')
      .map((p: any) => {
        const aceitosPolitica = aceites.filter((a: any) => a.politica_id === p.id && a.aceito).length;
        const percentual = totalUsuarios > 0 ? Math.round((aceitosPolitica / totalUsuarios) * 100) : 0;
        return { ...p, aceitos: aceitosPolitica, totalUsuarios, percentual };
      });
  }, [politicas, aceites, totalUsuarios]);

  const filteredPoliticas = useMemo(() => {
    let result = politicas;
    if (categoriaFilter !== 'todos') result = result.filter((p: any) => p.categoria === categoriaFilter);
    if (statusFilter !== 'todos') result = result.filter((p: any) => p.status === statusFilter);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((p: any) => p.titulo?.toLowerCase().includes(s) || p.descricao?.toLowerCase().includes(s));
    }
    result.sort((a: any, b: any) => {
      const cmp = (a[sortField] || '') < (b[sortField] || '') ? -1 : 1;
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [politicas, categoriaFilter, statusFilter, search, sortField, sortDirection]);

  const { notify } = useIntegrationNotify();

  const handleSave = async (data: any) => {
    if (!empresaId || !user?.id) return;
    setSaving(true);
    try {
      if (editingPolitica) {
        const { error } = await supabase.from('politicas').update(data).eq('id', editingPolitica.id);
        if (error) throw error;
        toast.success('Política atualizada');
        notify('politica_atualizada', {
          titulo: `Política atualizada: ${data.titulo}`,
          descricao: data.descricao,
          link: `${window.location.origin}/politicas`,
          dados: { categoria: data.categoria },
        });
      } else {
        const { error } = await supabase.from('politicas').insert({
          ...data, empresa_id: empresaId, created_by: user.id,
        });
        if (error) throw error;
        toast.success('Política criada');
        notify('politica_criada', {
          titulo: `Nova política: ${data.titulo}`,
          descricao: data.descricao,
          link: `${window.location.origin}/politicas`,
          dados: { categoria: data.categoria },
        });
      }
      queryClient.invalidateQueries({ queryKey: ['politicas'] });
      setDialogOpen(false);
      setEditingPolitica(null);
    } catch (error) {
      logger.error('Erro ao salvar política', error);
      toast.error('Erro ao salvar política');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (politica: any) => {
    try {
      const { error } = await supabase.from('politicas').update({
        status: 'publicada',
        data_publicacao: new Date().toISOString(),
      }).eq('id', politica.id);
      if (error) throw error;
      toast.success('Política publicada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['politicas'] });
    } catch (error) {
      logger.error('Erro ao publicar política', error);
      toast.error('Erro ao publicar');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from('politicas').delete().eq('id', deleteId);
      if (error) throw error;
      toast.success('Política excluída');
      queryClient.invalidateQueries({ queryKey: ['politicas'] });
    } catch (error) {
      logger.error('Erro ao excluir política', error);
      toast.error('Erro ao excluir');
    } finally {
      setDeleteId(null);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  const columns: Column<any>[] = [
    {
      key: 'titulo', label: 'Título', sortable: true,
      render: (_: any, item: any) => (
        <div className="max-w-xs">
          <p className="font-medium truncate">{item.titulo}</p>
          {item.descricao && <p className="text-xs text-muted-foreground truncate">{item.descricao}</p>}
        </div>
      ),
    },
    {
      key: 'categoria', label: 'Categoria', sortable: true,
      render: (val: string) => <Badge variant="outline">{categoriaLabels[val] || val}</Badge>,
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (val: string) => {
        const cfg = statusConfig[val] || statusConfig.rascunho;
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    {
      key: 'versao', label: 'Versão',
      render: (val: number) => <span className="text-sm">v{val || 1}</span>,
    },
    {
      key: 'requer_aceite', label: 'Aceite',
      render: (val: boolean) => val ? <CheckCircle2 className="h-4 w-4 text-success" /> : <span className="text-muted-foreground">-</span>,
    },
    {
      key: 'created_at', label: 'Criada em', sortable: true,
      render: (val: string) => <span className="text-sm">{formatDateOnly(val)}</span>,
    },
    {
      key: 'actions', label: 'Ações', className: 'w-16',
      render: (_: any, item: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {item.status === 'rascunho' && (
              <DropdownMenuItem onClick={() => handlePublish(item)}>
                <Send className="h-4 w-4 mr-2" />Publicar
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => { setEditingPolitica(item); setDialogOpen(true); }}>
              <Pencil className="h-4 w-4 mr-2" />Editar
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(item.id)}>
              <Trash2 className="h-4 w-4 mr-2" />Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Políticas e Treinamentos"
        description="Gerencie políticas corporativas, aceites e questionários de validação"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Políticas e Treinamentos' }]}
        actions={
          <Button onClick={() => { setEditingPolitica(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />Nova Política
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total de Políticas" value={stats.total} icon={<BookOpen className="h-5 w-5" />} variant="primary" />
        <StatCard title="Publicadas" value={stats.publicadas} icon={<Send className="h-5 w-5" />} variant="success" />
        <StatCard title="Aceites Registrados" value={stats.totalAceites} icon={<Users className="h-5 w-5" />} variant="info" />
        <StatCard title="Aderência Geral" value={`${stats.aderencia}%`} icon={<BarChart3 className="h-5 w-5" />} variant={stats.aderencia >= 80 ? 'success' : stats.aderencia >= 50 ? 'warning' : 'destructive'} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="politicas">Políticas</TabsTrigger>
          <TabsTrigger value="aderencia">Dashboard de Aderência</TabsTrigger>
        </TabsList>

        <TabsContent value="politicas" className="mt-4">
          <Card>
            <DataTable
              data={filteredPoliticas}
              columns={columns}
              loading={isLoading}
              searchable
              searchPlaceholder="Buscar políticas..."
              searchValue={search}
              onSearchChange={setSearch}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              paginated
              pageSize={20}
              filters={[
                {
                  key: 'categoria', label: 'Categoria',
                  options: [
                    { value: 'todos', label: 'Todas' },
                    ...Object.entries(categoriaLabels).map(([k, v]) => ({ value: k, label: v })),
                  ],
                  value: categoriaFilter, onChange: setCategoriaFilter,
                },
                {
                  key: 'status', label: 'Status',
                  options: [
                    { value: 'todos', label: 'Todos' },
                    ...Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label })),
                  ],
                  value: statusFilter, onChange: setStatusFilter,
                },
              ]}
              emptyState={{
                icon: <BookOpen className="h-12 w-12" />,
                title: 'Nenhuma política encontrada',
                description: 'Crie a primeira política da sua empresa',
                action: { label: 'Nova Política', onClick: () => { setEditingPolitica(null); setDialogOpen(true); } },
              }}
            />
          </Card>
        </TabsContent>

        <TabsContent value="aderencia" className="mt-4">
          {aderenciaPorPolitica.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Sem dados de aderência</h3>
                <p className="text-sm text-muted-foreground">Publique políticas para começar a monitorar</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aderenciaPorPolitica.map((p: any) => (
                <Card key={p.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{p.titulo}</CardTitle>
                        <Badge variant="outline" className="mt-1 text-xs">{categoriaLabels[p.categoria]}</Badge>
                      </div>
                      <span className={`text-2xl font-bold ${p.percentual >= 80 ? 'text-success' : p.percentual >= 50 ? 'text-warning' : 'text-destructive'}`}>
                        {p.percentual}%
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress value={p.percentual} className="h-2 mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {p.aceitos} de {p.totalUsuarios} colaboradores aceitaram
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <PoliticaDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingPolitica(null); }}
        onSave={handleSave}
        politica={editingPolitica}
        loading={saving}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir Política"
        description="Tem certeza que deseja excluir esta política? Todos os aceites e questionários serão removidos."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
