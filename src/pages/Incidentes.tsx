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

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incidentes</h1>
          <p className="text-muted-foreground">
            Gerencie incidentes de segurança e acompanhe tratamentos
          </p>
        </div>
        <IncidenteDialog onSuccess={loadIncidentes} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Incidentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsIncidentes?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {statsIncidentes?.abertos || 0} abertos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticos/Altos</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{(statsIncidentes?.criticos || 0) + (statsIncidentes?.altos || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {statsIncidentes?.criticos || 0} críticos, {statsIncidentes?.altos || 0} altos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Investigação</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{statsIncidentes?.investigacao || 0}</div>
            <p className="text-xs text-muted-foreground">
              {statsIncidentes?.resolvidos || 0} resolvidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsIncidentes?.mes || 0}</div>
            <p className="text-xs text-muted-foreground">
              Novos incidentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar incidentes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Lista de Incidentes */}
      <Card>
        <CardHeader>
          <CardTitle>Incidentes Registrados</CardTitle>
          <CardDescription>
            Lista de todos os incidentes de segurança e privacidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando incidentes...</div>
          ) : filteredIncidentes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum incidente encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Criticidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Detecção</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Ações</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncidentes.map((incidente) => {
                  const StatusIcon = getStatusIcon(incidente.status);
                  return (
                    <TableRow key={incidente.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{incidente.titulo}</div>
                          {incidente.categoria && (
                            <div className="text-sm text-muted-foreground">
                              {incidente.categoria}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTipoIcon(incidente.tipo_incidente)}
                          <span className="capitalize">{incidente.tipo_incidente}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getCriticidadeBadge(incidente.criticidade)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusIcon className="h-4 w-4" />
                          {getStatusBadge(incidente.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(incidente.data_deteccao), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {incidente.responsavel_tratamento || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Ver detalhes</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <IncidenteDialog
                              incidente={incidente}
                              onSuccess={loadIncidentes}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  Editar
                                </DropdownMenuItem>
                              }
                            />
                            <TratamentoDialog
                              incidenteId={incidente.id}
                              onSuccess={loadIncidentes}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  Nova Ação
                                </DropdownMenuItem>
                              }
                            />
                            <ComunicacaoDialog
                              incidenteId={incidente.id}
                              onSuccess={loadIncidentes}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  Nova Comunicação
                                </DropdownMenuItem>
                              }
                            />
                            <EvidenciaDialog
                              incidenteId={incidente.id}
                              onSuccess={loadIncidentes}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  Nova Evidência
                                </DropdownMenuItem>
                              }
                            />
                            {incidente.status !== 'resolvido' && (
                              <DropdownMenuItem
                                onClick={() => updateIncidenteStatus(incidente.id, 'investigacao')}
                              >
                                Marcar como Em Investigação
                              </DropdownMenuItem>
                            )}
                            {incidente.status !== 'resolvido' && (
                              <DropdownMenuItem
                                onClick={() => updateIncidenteStatus(incidente.id, 'resolvido')}
                              >
                                Marcar como Resolvido
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}