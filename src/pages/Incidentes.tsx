import { useState, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { useIncidentesStats } from '@/hooks/useIncidentesStats';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertTriangle,
  Shield,
  Calendar,
  Clock,
  MoreHorizontal,
  Edit,
  Trash2,
  Filter,
  MessageSquare,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatStatus, getCriticidadeColor, getWorkflowStatusColor } from '@/lib/text-utils';
import { formatDateOnly } from '@/lib/date-utils';
import { IncidenteDialog } from '@/components/incidentes/IncidenteDialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import { TratamentoDialog } from '@/components/incidentes/TratamentoDialog';
import { ComunicacaoDialog } from '@/components/incidentes/ComunicacaoDialog';
import { EvidenciaDialog } from '@/components/incidentes/EvidenciaDialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEmpresaId } from '@/hooks/useEmpresaId';

interface Incidente {
  id: string;
  titulo: string;
  descricao: string;
  tipo_incidente: string;
  categoria: string;
  criticidade: string;
  status: string;
  data_ocorrencia: string;
  data_deteccao: string;
  data_resolucao: string;
  responsavel_deteccao: string;
  responsavel_tratamento: string;
  created_at: string;
  tratamentos_count?: number;
  comunicacoes_count?: number;
  evidencias_count?: number;
}

export default function Incidentes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIncidente, setSelectedIncidente] = useState<Incidente | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [comunicacaoDialogOpen, setComunicacaoDialogOpen] = useState(false);
  const [evidenciaDialogOpen, setEvidenciaDialogOpen] = useState(false);
  const [tratamentoDialogOpen, setTratamentoDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; incidenteId: string }>({
    open: false,
    incidenteId: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [criticidadeFilter, setCriticidadeFilter] = useState<string>("todos");
  const [sortField, setSortField] = useState<string>('data_deteccao');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { empresaId } = useEmpresaId();
  
  const { data: statsIncidentes } = useIncidentesStats();

  // React Query for incidentes
  const { data: incidentes = [], isLoading: loading } = useQuery({
    queryKey: ['incidentes', empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidentes')
        .select('*')
        .eq('empresa_id', empresaId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Incidente[];
    },
    enabled: !!empresaId,
    staleTime: 1000 * 60 * 2,
  });

  const invalidateIncidentes = () => {
    queryClient.invalidateQueries({ queryKey: ['incidentes'] });
    queryClient.invalidateQueries({ queryKey: ['incidentes-stats'] });
  };

  // Aplicar filtros
  const filteredIncidentes = incidentes.filter(incidente => {
    const matchesSearch = searchTerm === '' || 
      incidente.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incidente.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incidente.responsavel_tratamento?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || incidente.status === statusFilter;
    const matchesTipo = tipoFilter === 'todos' || incidente.tipo_incidente === tipoFilter;
    const matchesCriticidade = criticidadeFilter === 'todos' || incidente.criticidade === criticidadeFilter;

    return matchesSearch && matchesStatus && matchesTipo && matchesCriticidade;
  });

  // Ordenar
  const sortedIncidentes = [...filteredIncidentes].sort((a, b) => {
    let aValue = a[sortField as keyof Incidente];
    let bValue = b[sortField as keyof Incidente];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleEdit = (incidente: Incidente) => {
    setSelectedIncidente(incidente);
    setEditDialogOpen(true);
  };

  const handleComunicacao = (incidente: Incidente) => {
    setSelectedIncidente(incidente);
    setComunicacaoDialogOpen(true);
  };

  const handleEvidencias = (incidente: Incidente) => {
    setSelectedIncidente(incidente);
    setEvidenciaDialogOpen(true);
  };

  const handleTratamentos = (incidente: Incidente) => {
    setSelectedIncidente(incidente);
    setTratamentoDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ open: true, incidenteId: id });
  };

  const confirmDelete = async () => {
    try {
      const { error } = await supabase
        .from('incidentes')
        .delete()
        .eq('id', deleteConfirm.incidenteId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Incidente excluído com sucesso!",
      });

      invalidateIncidentes();
      setDeleteConfirm({ open: false, incidenteId: '' });
    } catch (error: any) {
      logger.error('Erro ao excluir incidente', { error: error instanceof Error ? error.message : String(error) });
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir incidente",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      aberto: XCircle,
      investigacao: AlertCircle,
      contido: Clock,
      resolvido: CheckCircle,
      fechado: CheckCircle,
    };
    
    return icons[status as keyof typeof icons] || AlertCircle;
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const incidentesColumns = [
    {
      key: "titulo" as keyof Incidente,
      label: "Título",
      sortable: true,
      render: (_v: any, item: Incidente) => (
        <div className="font-medium">{item.titulo}</div>
      )
    },
    {
      key: "tipo_incidente" as keyof Incidente,
      label: "Tipo",
      sortable: true,
      render: (_v: any, item: Incidente) => (
        <Badge variant="outline" className="whitespace-nowrap">{formatStatus(item.tipo_incidente)}</Badge>
      )
    },
    {
      key: "criticidade" as keyof Incidente,
      label: "Criticidade",
      sortable: true,
      render: (_v: any, item: Incidente) => (
        <Badge className={`${getCriticidadeColor(item.criticidade)} whitespace-nowrap`}>
          {formatStatus(item.criticidade)}
        </Badge>
      )
    },
    {
      key: "status" as keyof Incidente,
      label: "Status",
      sortable: true,
      render: (_v: any, item: Incidente) => {
        const StatusIcon = getStatusIcon(item.status);
        return (
          <div className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4" />
            <Badge className={`${getWorkflowStatusColor(item.status)} whitespace-nowrap`}>
              {formatStatus(item.status)}
            </Badge>
          </div>
        );
      }
    },
    {
      key: "data_deteccao" as keyof Incidente,
      label: "Data Detecção",
      sortable: true,
      render: (_v: any, item: Incidente) => formatDateOnly(item.data_deteccao)
    },
    {
      key: "actions" as keyof Incidente,
      label: "Ações",
      render: (_v: any, item: Incidente) => (
        <TooltipProvider>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(item)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleComunicacao(item)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Comunicação
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEvidencias(item)}>
                <FileText className="mr-2 h-4 w-4" />
                Evidências
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTratamentos(item)}>
                <Shield className="mr-2 h-4 w-4" />
                Tratamentos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipProvider>
      )
    }
  ];

  const statsCards = [
    {
      title: "Total de Incidentes",
      value: statsIncidentes?.total || 0,
      description: `${statsIncidentes?.abertos || 0} abertos`,
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    {
      title: "Críticos/Altos",
      value: (statsIncidentes?.criticos || 0) + (statsIncidentes?.altos || 0),
      description: "Necessitam atenção imediata",
      icon: <Shield className="h-4 w-4" />,
    },
    {
      title: "Em Investigação",
      value: statsIncidentes?.investigacao || 0,
      description: "Sendo investigados",
      icon: <Clock className="h-4 w-4" />,
    },
    {
      title: "Este Mês",
      value: statsIncidentes?.mes || 0,
      description: "Novos incidentes",
      icon: <Calendar className="h-4 w-4" />,
    }
  ];

  const filters = [
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: 'todos', label: 'Todos os Status' },
        { value: 'aberto', label: 'Aberto' },
        { value: 'investigacao', label: 'Investigação' },
        { value: 'contido', label: 'Contido' },
        { value: 'resolvido', label: 'Resolvido' },
        { value: 'fechado', label: 'Fechado' },
      ]
    },
    {
      key: 'tipo',
      label: 'Tipo',
      value: tipoFilter,
      onChange: setTipoFilter,
      options: [
        { value: 'todos', label: 'Todos os Tipos' },
        { value: 'seguranca', label: 'Segurança' },
        { value: 'privacidade', label: 'Privacidade' },
        { value: 'disponibilidade', label: 'Disponibilidade' },
      ]
    },
    {
      key: 'criticidade',
      label: 'Criticidade',
      value: criticidadeFilter,
      onChange: setCriticidadeFilter,
      options: [
        { value: 'todos', label: 'Todas as Criticidades' },
        { value: 'baixa', label: 'Baixa' },
        { value: 'media', label: 'Média' },
        { value: 'alta', label: 'Alta' },
        { value: 'critica', label: 'Crítica' },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incidentes"
        description="Gerencie incidentes de segurança e acompanhe tratamentos"
        actions={undefined}
      />

      {/* StatCards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            loading={loading}
          />
        ))}
      </div>

      {/* Botão de ação */}
      <div className="flex justify-end">
        <IncidenteDialog 
          onSuccess={() => {
            invalidateIncidentes();
          }}
        />
      </div>

      {/* Dialog de Edição - controlado pelo dropdown */}
      {selectedIncidente && editDialogOpen && (
        <IncidenteDialog
          incidente={selectedIncidente}
          externalOpen={editDialogOpen}
          onExternalOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setSelectedIncidente(null);
          }}
          onSuccess={() => {
            invalidateIncidentes();
            setEditDialogOpen(false);
            setSelectedIncidente(null);
          }}
        />
      )}

      {/* Lista de Incidentes com DataTable */}
      <Card className="rounded-lg border overflow-hidden">
        <CardContent className="p-0">
          <DataTable
            data={sortedIncidentes}
            columns={incidentesColumns}
            loading={loading}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Buscar incidentes..."
            filters={filters}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            emptyState={{
              icon: <AlertTriangle className="h-8 w-8" />,
              title: 'Nenhum incidente encontrado',
              description: 'Registre o primeiro incidente para começar o monitoramento.'
            }}
          />
        </CardContent>
      </Card>

      {/* Dialog de Comunicação - controlado pelo dropdown */}
      {selectedIncidente && (
        <ComunicacaoDialog
          incidenteId={selectedIncidente.id}
          onSuccess={invalidateIncidentes}
          trigger={<span className="hidden" />}
          externalOpen={comunicacaoDialogOpen}
          onExternalOpenChange={(open) => {
            setComunicacaoDialogOpen(open);
            if (!open) setSelectedIncidente(null);
          }}
        />
      )}

      {/* Dialog de Evidências - controlado pelo dropdown */}
      {selectedIncidente && (
        <EvidenciaDialog
          incidenteId={selectedIncidente.id}
          onSuccess={invalidateIncidentes}
          trigger={<span className="hidden" />}
          externalOpen={evidenciaDialogOpen}
          onExternalOpenChange={(open) => {
            setEvidenciaDialogOpen(open);
            if (!open) setSelectedIncidente(null);
          }}
        />
      )}

      {/* Dialog de Tratamentos - controlado pelo dropdown */}
      {selectedIncidente && tratamentoDialogOpen && (
        <TratamentoDialog
          incidenteId={selectedIncidente.id}
          onSuccess={invalidateIncidentes}
          trigger={<span className="hidden" />}
        />
      )}

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
        title="Excluir Incidente"
        description="Tem certeza que deseja excluir este incidente? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
