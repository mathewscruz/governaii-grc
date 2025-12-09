import { useState, useEffect } from 'react';
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
import { formatStatus } from '@/lib/text-utils';
import { formatDateOnly } from '@/lib/date-utils';
import { IncidenteDialog } from '@/components/incidentes/IncidenteDialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import { TratamentoDialog } from '@/components/incidentes/TratamentoDialog';
import { ComunicacaoDialog } from '@/components/incidentes/ComunicacaoDialog';
import { EvidenciaDialog } from '@/components/incidentes/EvidenciaDialog';

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
  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIncidente, setSelectedIncidente] = useState<Incidente | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [comunicacaoDialogOpen, setComunicacaoDialogOpen] = useState(false);
  const [evidenciaDialogOpen, setEvidenciaDialogOpen] = useState(false);
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
  
  const { data: statsIncidentes } = useIncidentesStats();

  const loadIncidentes = async () => {
    try {
      setLoading(true);
      
      const { data: incidentesData, error } = await supabase
        .from('incidentes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setIncidentes(incidentesData || []);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidentes();
  }, []);

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

      loadIncidentes();
      setDeleteConfirm({ open: false, incidenteId: '' });
    } catch (error: any) {
      console.error('Erro ao excluir incidente:', error);
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
      render: (item: Incidente) => (
        <div className="font-medium">{item.titulo}</div>
      )
    },
    {
      key: "tipo_incidente" as keyof Incidente,
      label: "Tipo",
      sortable: true,
      render: (item: Incidente) => (
        <Badge variant="outline" className="whitespace-nowrap">{formatStatus(item.tipo_incidente)}</Badge>
      )
    },
    {
      key: "criticidade" as keyof Incidente,
      label: "Criticidade",
      sortable: true,
      render: (item: Incidente) => {
        const variant = item.criticidade === 'critica' ? 'destructive' :
                       item.criticidade === 'alta' ? 'destructive' :
                       item.criticidade === 'media' ? 'secondary' : 'outline';
        return <Badge variant={variant} className="whitespace-nowrap">{formatStatus(item.criticidade)}</Badge>;
      }
    },
    {
      key: "status" as keyof Incidente,
      label: "Status",
      sortable: true,
      render: (item: Incidente) => {
        const StatusIcon = getStatusIcon(item.status);
        const variant = item.status === 'resolvido' || item.status === 'fechado' ? 'default' :
                       item.status === 'aberto' ? 'destructive' : 'secondary';
        return (
          <div className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4" />
            <Badge variant={variant} className="whitespace-nowrap">{formatStatus(item.status)}</Badge>
          </div>
        );
      }
    },
    {
      key: "data_deteccao" as keyof Incidente,
      label: "Data Detecção",
      sortable: true,
      render: (item: Incidente) => formatDateOnly(item.data_deteccao)
    },
    {
      key: "actions" as keyof Incidente,
      label: "Ações",
      render: (item: Incidente) => (
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
            onRefresh={loadIncidentes}
            emptyState={{
              icon: <AlertTriangle className="h-8 w-8" />,
              title: 'Nenhum incidente encontrado',
              description: 'Registre o primeiro incidente para começar o monitoramento.'
            }}
          />
          <div className="p-4 border-t">
            <IncidenteDialog 
              incidente={selectedIncidente} 
              onSuccess={() => {
                loadIncidentes();
                setEditDialogOpen(false);
                setSelectedIncidente(null);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Comunicação */}
      <ComunicacaoDialog
        incidenteId={selectedIncidente?.id || ''}
      />

      {/* Dialog de Evidências */}
      <EvidenciaDialog
        incidenteId={selectedIncidente?.id || ''}
      />

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
