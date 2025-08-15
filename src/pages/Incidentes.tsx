import { useState, useEffect } from 'react';
import { useIncidentesStats } from '@/hooks/useIncidentesStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertTriangle,
  Shield,
  Database,
  Search,
  MoreHorizontal,
  Calendar,
  Clock,
  Users,
  FileText,
  MessageSquare,
  Play,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  const [filteredIncidentes, setFilteredIncidentes] = useState<Incidente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIncidente, setSelectedIncidente] = useState<Incidente | null>(null);
  const [metrics, setMetrics] = useState({
    total: 0,
    abertos: 0,
    investigacao: 0,
    resolvidos: 0,
    criticos: 0,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; incidenteId: string }>({
    open: false,
    incidenteId: ''
  });
  const { toast } = useToast();
  
  // Buscar estatísticas dos incidentes
  const { data: statsIncidentes } = useIncidentesStats();

  const loadIncidentes = async () => {
    try {
      setLoading(true);
      
      // Buscar incidentes com contadores
      const { data: incidentesData, error } = await supabase
        .from('incidentes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedData = incidentesData || [];

      setIncidentes(processedData);
      setFilteredIncidentes(processedData);

      // Calcular métricas
      const total = processedData.length;
      const abertos = processedData.filter(i => i.status === 'aberto').length;
      const investigacao = processedData.filter(i => i.status === 'investigacao').length;
      const resolvidos = processedData.filter(i => i.status === 'resolvido').length;
      const criticos = processedData.filter(i => i.criticidade === 'critica').length;

      setMetrics({ total, abertos, investigacao, resolvidos, criticos });
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

  useEffect(() => {
    const filtered = incidentes.filter(incidente =>
      incidente.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incidente.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incidente.responsavel_tratamento?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredIncidentes(filtered);
  }, [searchTerm, incidentes]);

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

  const getStatusBadge = (status: string) => {
    const variants = {
      aberto: 'destructive',
      investigacao: 'secondary',
      contido: 'default',
      resolvido: 'secondary',
      fechado: 'outline',
    };
    
    const labels = {
      aberto: 'Aberto',
      investigacao: 'Investigação',
      contido: 'Contido',
      resolvido: 'Resolvido',
      fechado: 'Fechado',
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getCriticidadeBadge = (criticidade: string) => {
    const variants = {
      baixa: 'outline',
      media: 'secondary',
      alta: 'default',
      critica: 'destructive',
    };

    return (
      <Badge variant={variants[criticidade as keyof typeof variants] as any}>
        {criticidade.charAt(0).toUpperCase() + criticidade.slice(1)}
      </Badge>
    );
  };

  const getTipoIcon = (tipo: string) => {
    const icons = {
      seguranca: Shield,
      privacidade: Database,
      disponibilidade: AlertTriangle,
    };
    
    const Icon = icons[tipo as keyof typeof icons] || AlertTriangle;
    return <Icon className="h-4 w-4" />;
  };

  const updateIncidenteStatus = async (incidenteId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('incidentes')
        .update({ 
          status: newStatus,
          ...(newStatus === 'resolvido' ? { data_resolucao: new Date().toISOString() } : {})
        })
        .eq('id', incidenteId);

      if (error) throw error;
      
      toast({ title: `Status atualizado para ${newStatus}` });
      loadIncidentes();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
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
    
    const Icon = icons[status as keyof typeof icons] || AlertCircle;
    return Icon;
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
        <Badge variant="outline">{item.tipo_incidente}</Badge>
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
        return <Badge variant={variant}>{item.criticidade}</Badge>;
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
            <Badge variant={variant}>{item.status}</Badge>
          </div>
        );
      }
    },
    {
      key: "data_deteccao" as keyof Incidente,
      label: "Data Detecção",
      sortable: true,
      render: (item: Incidente) => (
        format(new Date(item.data_deteccao), 'dd/MM/yyyy', { locale: ptBR })
      )
    },
    {
      key: "actions" as keyof Incidente,
      label: "Ações",
      render: (item: Incidente) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {}}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {}}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Comunicação
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {}}>
              <FileText className="mr-2 h-4 w-4" />
              Evidências
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(item.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incidentes"
        description="Gerencie incidentes de segurança e acompanhe tratamentos"
        actions={<IncidenteDialog onSuccess={loadIncidentes} />}
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

      {/* Lista de Incidentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Lista de Incidentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredIncidentes}
            columns={incidentesColumns}
            loading={loading}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Buscar incidentes..."
            emptyState={{
              icon: <AlertTriangle className="h-8 w-8" />,
              title: 'Nenhum incidente encontrado',
              description: 'Registre o primeiro incidente para começar o monitoramento.',
              action: {
                label: 'Novo Incidente',
                onClick: () => {} // O IncidenteDialog já está no header
              }
            }}
          />
        </CardContent>
      </Card>

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