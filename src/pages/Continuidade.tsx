import { useState } from 'react';
import { Plus, Shield, FileCheck, Clock, TestTube, ListTodo, Edit, Trash2, Eye, MoreHorizontal, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { DataTable, Column } from '@/components/ui/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useContinuidadeStats } from '@/hooks/useContinuidadeStats';
import { useToast } from '@/hooks/use-toast';
import { formatDateOnly } from '@/lib/date-utils';
import { exportCSV } from '@/lib/csv-utils';
import { PlanoDialog } from '@/components/continuidade/PlanoDialog';
import { PlanoDetalheDialog } from '@/components/continuidade/PlanoDetalheDialog';
import ConfirmDialog from '@/components/ConfirmDialog';

const statusMap: Record<string, { label: string; variant: any }> = {
  rascunho: { label: 'Rascunho', variant: 'secondary' },
  ativo: { label: 'Ativo', variant: 'success' },
  em_revisao: { label: 'Em Revisão', variant: 'warning' },
  desativado: { label: 'Desativado', variant: 'destructive' },
};

const tipoMap: Record<string, string> = {
  bcp: 'BCP',
  drp: 'DRP',
  ambos: 'BCP + DRP',
};

export default function Continuidade() {
  const { profile } = useAuth();
  const empresaId = profile?.empresa_id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useContinuidadeStats();

  const [planoDialog, setPlanoDialog] = useState<{ open: boolean; plano?: any }>({ open: false });
  const [detalheDialog, setDetalheDialog] = useState<{ open: boolean; plano?: any }>({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: '' });

  const { data: planos = [], isLoading } = useQuery({
    queryKey: ['continuidade-planos', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from('continuidade_planos')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!empresaId,
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['continuidade-planos'] });
    queryClient.invalidateQueries({ queryKey: ['continuidade-stats'] });
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('continuidade_planos').delete().eq('id', deleteConfirm.id);
      if (error) throw error;
      toast({ title: 'Plano excluído com sucesso' });
      refreshAll();
    } catch (error: any) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    }
    setDeleteConfirm({ open: false, id: '' });
  };

  const columns: Column<any>[] = [
    {
      key: 'nome',
      label: 'Nome',
      sortable: true,
      render: (_val, row) => (
        <button onClick={() => setDetalheDialog({ open: true, plano: row })} className="text-left hover:text-primary transition-colors font-medium">
          {row.nome}
        </button>
      ),
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (_val, row) => <Badge variant="outline">{tipoMap[row.tipo] || row.tipo}</Badge>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (_val, row) => {
        const st = statusMap[row.status] || statusMap.rascunho;
        return <Badge variant={st.variant}>{st.label}</Badge>;
      },
    },
    {
      key: 'rto_horas',
      label: 'RTO',
      render: (_val, row) => row.rto_horas != null ? `${row.rto_horas}h` : '—',
    },
    {
      key: 'rpo_horas',
      label: 'RPO',
      render: (_val, row) => row.rpo_horas != null ? `${row.rpo_horas}h` : '—',
    },
    {
      key: 'proxima_revisao',
      label: 'Próx. Revisão',
      render: (_val, row) => row.proxima_revisao ? formatDateOnly(row.proxima_revisao) : '—',
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (_val, row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setDetalheDialog({ open: true, plano: row })}>
              <Eye className="h-4 w-4 mr-2" /> Visualizar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPlanoDialog({ open: true, plano: row })}>
              <Edit className="h-4 w-4 mr-2" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteConfirm({ open: true, id: row.id })}>
              <Trash2 className="h-4 w-4 mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Continuidade de Negócios"
        description="Gerencie planos de continuidade (BCP) e recuperação de desastres (DRP)"
        actions={
          <Button onClick={() => setPlanoDialog({ open: true })}>
            <Plus className="h-4 w-4 mr-2" /> Novo Plano
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Total de Planos" value={stats?.total ?? 0} icon={<Shield className="h-5 w-5" />} variant="primary" loading={statsLoading} />
        <StatCard title="Planos Ativos" value={stats?.ativos ?? 0} icon={<FileCheck className="h-5 w-5" />} variant="success" loading={statsLoading} />
        <StatCard title="Em Revisão" value={stats?.emRevisao ?? 0} icon={<Clock className="h-5 w-5" />} variant="warning" loading={statsLoading} />
        <StatCard title="Testes Realizados" value={stats?.testesRealizados ?? 0} icon={<TestTube className="h-5 w-5" />} variant="info" loading={statsLoading} />
        <StatCard title="Tarefas Pendentes" value={stats?.tarefasPendentes ?? 0} icon={<ListTodo className="h-5 w-5" />} variant="destructive" loading={statsLoading} />
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : planos.length === 0 ? (
        <EmptyState
          icon={<Shield className="h-10 w-10" />}
          title="Nenhum plano cadastrado"
          description="Crie seu primeiro plano de continuidade de negócios ou recuperação de desastres."
          action={{ label: 'Criar Plano', onClick: () => setPlanoDialog({ open: true }) }}
        />
      ) : (
        <DataTable data={planos} columns={columns} searchable />
      )}

      {/* Dialogs */}
      <PlanoDialog
        open={planoDialog.open}
        onOpenChange={o => setPlanoDialog(p => ({ ...p, open: o }))}
        plano={planoDialog.plano}
        onSuccess={refreshAll}
      />

      <PlanoDetalheDialog
        open={detalheDialog.open}
        onOpenChange={o => setDetalheDialog(p => ({ ...p, open: o }))}
        plano={detalheDialog.plano}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={o => setDeleteConfirm(p => ({ ...p, open: o }))}
        title="Excluir Plano"
        description="Todas as tarefas e testes vinculados serão excluídos. Deseja continuar?"
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
