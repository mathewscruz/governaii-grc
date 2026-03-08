import React, { useState, useMemo } from 'react';
import { Plus, Shield, AlertTriangle, CheckCircle, Clock, Edit, Trash2, MoreHorizontal, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ContaDialog from '@/components/contas-privilegiadas/ContaDialog';
import { Card, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatDateOnly } from '@/lib/date-utils';
import { capitalizeText, getItemStatusColor } from '@/lib/text-utils';
import { exportCSV } from '@/lib/csv-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export default function ContasPrivilegiadas() {
  const [showContaDialog, setShowContaDialog] = useState(false);
  const [selectedConta, setSelectedConta] = useState<ContaPrivilegiada | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [nivelFilter, setNivelFilter] = useState('todos');
  const [sortField, setSortField] = useState('usuario_beneficiario');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: string;
    nome: string;
  }>({ open: false, id: '', nome: '' });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { empresaId } = useEmpresaId();

  // Buscar contas privilegiadas
  const { data: contas = [], isLoading } = useQuery({
    queryKey: ['contas-privilegiadas', empresaId],
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
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ContaPrivilegiada[];
    },
    enabled: !!empresaId,
  });

  // Buscar sistemas para o dropdown no dialog
  const { data: sistemas = [] } = useQuery({
    queryKey: ['sistemas-privilegiados', empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sistemas_privilegiados' as any)
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .order('nome_sistema');

      if (error) throw error;
      return data || [];
    },
    enabled: !!empresaId,
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

  const handleCloseContaDialog = () => {
    setSelectedConta(null);
    setShowContaDialog(false);
    queryClient.invalidateQueries({ queryKey: ['contas-privilegiadas'] });
  };

  const handleDeleteConta = (contaId: string, usuarioNome: string) => {
    setDeleteConfirm({ open: true, id: contaId, nome: usuarioNome });
  };

  const confirmDelete = async () => {
    const { id } = deleteConfirm;

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
      description: "A conta foi excluída com sucesso.",
    });
    
    queryClient.invalidateQueries({ queryKey: ['contas-privilegiadas'] });
    setDeleteConfirm({ open: false, id: '', nome: '' });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { icon: React.ComponentType<any>, label: string }> = {
      'ativo': { icon: CheckCircle, label: 'Ativo' },
      'expirado': { icon: AlertTriangle, label: 'Expirado' },
      'pendente_aprovacao': { icon: Clock, label: 'Pendente Aprovação' },
      'revogado': { icon: Shield, label: 'Revogado' },
    };

    const config = statusConfig[status] || statusConfig.pendente_aprovacao;
    const Icon = config.icon;

    return (
      <Badge className={`${getItemStatusColor(status)} flex items-center gap-1 whitespace-nowrap`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Filtrar e ordenar contas
  const filteredAndSortedContas = useMemo(() => {
    let filtered = contas.filter(conta => {
      const matchesSearch = searchTerm === '' || 
        conta.usuario_beneficiario.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conta.email_beneficiario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conta.sistemas_privilegiados?.nome_sistema.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'todos' || conta.status === statusFilter;
      const matchesNivel = nivelFilter === 'todos' || conta.nivel_privilegio === nivelFilter;

      return matchesSearch && matchesStatus && matchesNivel;
    });

    // Ordenar
    filtered.sort((a, b) => {
      let aValue = a[sortField as keyof ContaPrivilegiada];
      let bValue = b[sortField as keyof ContaPrivilegiada];

      if (sortField === 'sistema') {
        aValue = a.sistemas_privilegiados?.nome_sistema || '';
        bValue = b.sistemas_privilegiados?.nome_sistema || '';
      }

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
  }, [contas, searchTerm, statusFilter, nivelFilter, sortField, sortDirection]);

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
      render: (_: any, conta: ContaPrivilegiada) => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const expiracao = new Date(conta.data_expiracao + 'T00:00:00');
        const diffDays = Math.ceil((expiracao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0 && conta.status === 'ativo') {
          return (
            <div className="flex items-center gap-2">
              <span>{formatDateOnly(conta.data_expiracao)}</span>
              <Badge variant="destructive" className="whitespace-nowrap">Expirada</Badge>
            </div>
          );
        } else if (diffDays <= 30 && diffDays >= 0 && conta.status === 'ativo') {
          return (
            <div className="flex items-center gap-2">
              <span>{formatDateOnly(conta.data_expiracao)}</span>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 whitespace-nowrap">Vence em {diffDays}d</Badge>
            </div>
          );
        }

        return formatDateOnly(conta.data_expiracao);
      }
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditConta(conta)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDeleteConta(conta.id, conta.usuario_beneficiario)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const contasFilters = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'todos', label: 'Todos os Status' },
        { value: 'ativo', label: 'Ativo' },
        { value: 'expirado', label: 'Expirado' },
        { value: 'pendente_aprovacao', label: 'Pendente Aprovação' },
        { value: 'revogado', label: 'Revogado' },
      ],
      value: statusFilter,
      onChange: setStatusFilter,
    },
    {
      key: 'nivel',
      label: 'Nível',
      options: [
        { value: 'todos', label: 'Todos os Níveis' },
        { value: 'critico', label: 'Crítico' },
        { value: 'alto', label: 'Alto' },
        { value: 'medio', label: 'Médio' },
        { value: 'baixo', label: 'Baixo' },
      ],
      value: nivelFilter,
      onChange: setNivelFilter,
    },
  ];

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contas Privilegiadas"
        description="Gerencie contas com acessos privilegiados aos sistemas"
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Contas Ativas"
          value={contasAtivas}
          loading={isLoading}
        />
        <StatCard
          title="Pendentes"
          value={contasPendentes}
          loading={isLoading}
        />
        <StatCard
          title="Vencendo em 30 dias"
          value={contasVencendo}
          loading={isLoading}
          variant={contasVencendo > 0 ? 'warning' : 'default'}
        />
        <StatCard
          title="Expiradas"
          value={contasExpiradas}
          loading={isLoading}
          variant={contasExpiradas > 0 ? 'destructive' : 'default'}
        />
      </div>

      <Card className="rounded-lg border overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 pb-4 flex items-center justify-between gap-4">
            <div className="flex-1" />
            <Button onClick={() => setShowContaDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Conta
            </Button>
          </div>
          <DataTable
            data={filteredAndSortedContas}
            columns={contasColumns}
            loading={isLoading}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Buscar contas..."
            filters={contasFilters}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            emptyState={{
              title: "Nenhuma conta encontrada",
              description: searchTerm || statusFilter !== 'todos' || nivelFilter !== 'todos'
                ? "Tente ajustar os filtros de busca"
                : "Adicione a primeira conta privilegiada"
            }}
          />
        </CardContent>
      </Card>

      <ContaDialog
        open={showContaDialog}
        onClose={handleCloseContaDialog}
        conta={selectedConta}
        sistemas={sistemas}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => !open && setDeleteConfirm({ open: false, id: '', nome: '' })}
        onConfirm={confirmDelete}
        title="Excluir Conta"
        description={`Tem certeza que deseja excluir a conta de "${deleteConfirm.nome}"? Esta ação não pode ser desfeita.`}
        variant="destructive"
      />
    </div>
  );
}
