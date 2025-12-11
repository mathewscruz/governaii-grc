import React, { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Server, Shield, Lock, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable } from '@/components/ui/data-table';
import ConfirmDialog from '@/components/ConfirmDialog';
import SistemaDialog from '@/components/contas-privilegiadas/SistemaDialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { formatStatus, capitalizeText, getCriticidadeColor } from '@/lib/text-utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SistemaPrivilegiado {
  id: string;
  nome_sistema: string;
  tipo_sistema: string;
  criticidade: string;
  responsavel_sistema?: string;
  url_sistema?: string;
  categoria?: string;
  ativo: boolean;
  icone?: string;
  imagem_url?: string;
}

export default function SistemasContent() {
  const [showSistemaDialog, setShowSistemaDialog] = useState(false);
  const [selectedSistema, setSelectedSistema] = useState<SistemaPrivilegiado | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [criticidadeFilter, setCriticidadeFilter] = useState('todos');
  const [sortField, setSortField] = useState('nome_sistema');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: string;
    nome: string;
  }>({ open: false, id: '', nome: '' });
  const { toast } = useToast();

  // Buscar sistemas
  const { data: sistemas = [], refetch: refetchSistemas, isLoading } = useQuery({
    queryKey: ['sistemas-privilegiados-governanca'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sistemas_privilegiados' as any)
        .select('*')
        .order('nome_sistema');

      if (error) throw error;
      return (data || []) as unknown as SistemaPrivilegiado[];
    },
  });

  // Métricas
  const sistemasAtivos = sistemas.filter(s => s.ativo).length;
  const sistemasCriticos = sistemas.filter(s => s.criticidade === 'critica' || s.criticidade === 'alta').length;

  const handleEditSistema = (sistema: SistemaPrivilegiado) => {
    setSelectedSistema(sistema);
    setShowSistemaDialog(true);
  };

  const handleCloseSistemaDialog = () => {
    setSelectedSistema(null);
    setShowSistemaDialog(false);
    refetchSistemas();
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

    setDeleteConfirm({ open: true, id: sistemaId, nome: sistemaNome });
  };

  const confirmDelete = async () => {
    const { error } = await supabase
      .from('sistemas_privilegiados' as any)
      .delete()
      .eq('id', deleteConfirm.id);

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
    setDeleteConfirm({ open: false, id: '', nome: '' });
  };

  const getCriticidadeBadge = (criticidade: string) => {
    return (
      <Badge className={`${getCriticidadeColor(criticidade)} whitespace-nowrap`}>
        {formatStatus(criticidade)}
      </Badge>
    );
  };

  // Filtrar e ordenar
  const filteredAndSortedSistemas = useMemo(() => {
    let filtered = sistemas.filter(sistema => {
      const matchesSearch = searchTerm === '' || 
        sistema.nome_sistema.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sistema.tipo_sistema.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sistema.responsavel_sistema?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'todos' || (sistema.ativo ? 'ativo' : 'inativo') === statusFilter;
      const matchesTipo = tipoFilter === 'todos' || sistema.tipo_sistema === tipoFilter;
      const matchesCriticidade = criticidadeFilter === 'todos' || sistema.criticidade === criticidadeFilter;

      return matchesSearch && matchesStatus && matchesTipo && matchesCriticidade;
    });

    filtered.sort((a, b) => {
      const aValue = a[sortField as keyof SistemaPrivilegiado];
      const bValue = b[sortField as keyof SistemaPrivilegiado];

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
  }, [sistemas, searchTerm, statusFilter, tipoFilter, criticidadeFilter, sortField, sortDirection]);

  // Configuração das colunas
  const sistemasColumns = [
    {
      key: 'nome_sistema',
      label: 'Sistema',
      sortable: true,
      render: (_: any, sistema: SistemaPrivilegiado) => (
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 overflow-hidden">
            {sistema.imagem_url ? (
              <img 
                src={sistema.imagem_url} 
                alt={sistema.nome_sistema}
                className="w-full h-full object-contain"
              />
            ) : (
              <Server className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="font-medium">{sistema.nome_sistema}</div>
        </div>
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
      key: 'categoria',
      label: 'Categoria',
      sortable: true,
      render: (_: any, sistema: SistemaPrivilegiado) => sistema.categoria ? capitalizeText(sistema.categoria.replace('_', ' ')) : '-'
    },
    {
      key: 'ativo',
      label: 'Status',
      sortable: true,
      render: (_: any, sistema: SistemaPrivilegiado) => (
        <Badge variant={sistema.ativo ? "default" : "secondary"} className="whitespace-nowrap">
          {sistema.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      )
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
        <TooltipProvider>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditSistema(sistema)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteSistema(sistema.id, sistema.nome_sistema)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Excluir</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      )
    }
  ];

  // Configuração dos filtros
  const sistemasFilters = [
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: 'todos', label: 'Todos' },
        { value: 'ativo', label: 'Ativo' },
        { value: 'inativo', label: 'Inativo' },
      ]
    },
    {
      key: 'tipo',
      label: 'Tipo',
      value: tipoFilter,
      onChange: setTipoFilter,
      options: [
        { value: 'todos', label: 'Todos' },
        { value: 'aplicacao', label: 'Aplicação' },
        { value: 'banco_dados', label: 'Banco de Dados' },
        { value: 'sistema_operacional', label: 'Sistema Operacional' },
        { value: 'rede', label: 'Rede/Infraestrutura' },
        { value: 'nuvem', label: 'Nuvem' },
        { value: 'erp', label: 'ERP' },
        { value: 'crm', label: 'CRM' },
        { value: 'bi', label: 'Business Intelligence' },
        { value: 'seguranca', label: 'Segurança' },
        { value: 'outro', label: 'Outro' },
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
    }
  ];

  return (
    <div className="space-y-6">
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Sistemas"
          value={sistemas.length}
          icon={<Server className="h-5 w-5" />}
        />
        <StatCard
          title="Sistemas Ativos"
          value={sistemasAtivos}
          icon={<Monitor className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Criticidade Alta"
          value={sistemasCriticos}
          icon={<Shield className="h-5 w-5" />}
          variant="warning"
        />
        <StatCard
          title="Sistemas Inativos"
          value={sistemas.length - sistemasAtivos}
          icon={<Lock className="h-5 w-5" />}
          variant="default"
        />
      </div>

      {/* Tabela de Sistemas */}
      <Card className="rounded-lg border overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-semibold">Sistemas Cadastrados</h3>
            <Button onClick={() => setShowSistemaDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Sistema
            </Button>
          </div>
          
          <DataTable
            data={filteredAndSortedSistemas}
            columns={sistemasColumns}
            searchPlaceholder="Buscar sistemas..."
            filters={sistemasFilters}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={(field) => {
              if (field === sortField) {
                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              } else {
                setSortField(field);
                setSortDirection('asc');
              }
            }}
            emptyState={{
              title: "Nenhum sistema encontrado",
              description: "Cadastre um novo sistema para começar a gerenciar acessos privilegiados.",
              icon: <Server className="h-12 w-12" />,
            }}
            loading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <SistemaDialog
        open={showSistemaDialog}
        onClose={handleCloseSistemaDialog}
        sistema={selectedSistema}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
        title="Excluir Sistema"
        description={`Tem certeza que deseja excluir o sistema "${deleteConfirm.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
