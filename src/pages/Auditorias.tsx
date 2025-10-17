
import { useState } from "react";
import { Plus, FileText, AlertTriangle, CheckCircle, User, Edit, Trash2, Eye, Clock, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { useUsuariosEmpresa } from "@/hooks/useAuditoriaData";
import { capitalizeText } from "@/lib/text-utils";
import AuditoriaDialog from "@/components/auditorias/AuditoriaDialog";
import TrabalhosDialog from "@/components/auditorias/TrabalhosDialog";
import AchadosDialog from "@/components/auditorias/AchadosDialog";
import RecomendacoesDialog from "@/components/auditorias/RecomendacoesDialog";
import EvidenciasDialog from "@/components/auditorias/EvidenciasDialog";

const getStatusBadgeVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
  switch (status) {
    case 'planejamento':
      return 'outline';
    case 'em_andamento':
      return 'default';
    case 'concluida':
      return 'secondary';
    case 'cancelada':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const getStatusCustomClass = (status: string) => {
  switch (status) {
    case 'concluida':
      return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200';
    default:
      return '';
  }
};

const getPrioridadeBadgeVariant = (prioridade: string): "default" | "destructive" | "secondary" | "outline" => {
  switch (prioridade) {
    case 'critica':
      return 'destructive';
    case 'alta':
      return 'default';
    case 'media':
      return 'secondary';
    case 'baixa':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getPrioridadeCustomClass = (prioridade: string) => {
  switch (prioridade) {
    case 'critica':
      return 'bg-red-600 text-white border-red-700 hover:bg-red-700';
    case 'alta':
      return 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200';
    default:
      return '';
  }
};

const getTipoBadgeVariant = (tipo: string): "default" | "destructive" | "secondary" | "outline" => {
  switch (tipo) {
    case 'interna':
      return 'default';
    case 'externa':
      return 'destructive';
    case 'compliance':
      return 'outline';
    case 'operacional':
      return 'secondary';
    case 'ti':
      return 'default';
    default:
      return 'secondary';
  }
};

const getTipoCustomClass = (tipo: string) => {
  switch (tipo) {
    case 'ti':
      return 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200';
    case 'compliance':
      return 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200';
    default:
      return '';
  }
};

const Auditorias = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [selectedAuditoria, setSelectedAuditoria] = useState<any>(null);
  const [showAuditoriaDialog, setShowAuditoriaDialog] = useState(false);
  const [showTrabalhosDialog, setShowTrabalhosDialog] = useState(false);
  const [showAchadosDialog, setShowAchadosDialog] = useState(false);
  const [showRecomendacoesDialog, setShowRecomendacoesDialog] = useState(false);
  const [showEvidenciasDialog, setShowEvidenciasDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { data: usuarios } = useUsuariosEmpresa();

  const { data: auditorias, isLoading, refetch } = useQuery({
    queryKey: ['auditorias', searchTerm, statusFilter, tipoFilter],
    queryFn: async () => {
      let query = supabase
        .from('auditorias')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`nome.ilike.%${searchTerm}%,descricao.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== 'todos') {
        query = query.eq('status', statusFilter);
      }

      if (tipoFilter !== 'todos') {
        query = query.eq('tipo', tipoFilter);
      }

      const { data, error } = await query;

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar auditorias",
          variant: "destructive",
        });
        throw error;
      }

      return data || [];
    },
  });

  // Buscar contagens para todas as auditorias de uma vez
  const { data: auditoriasCounts } = useQuery({
    queryKey: ['auditorias-counts', auditorias?.map(a => a.id)],
    queryFn: async () => {
      if (!auditorias || auditorias.length === 0) return {};
      
      const counts: any = {};
      
      for (const auditoria of auditorias) {
        const trabalhosRes = await supabase
          .from('auditoria_trabalhos')
          .select('id', { count: 'exact', head: true })
          .eq('auditoria_id', auditoria.id);
          
        const achadosRes = await supabase
          .from('auditoria_achados')
          .select('id', { count: 'exact', head: true })
          .eq('auditoria_id', auditoria.id);
          
        const recomendacoesRes = await supabase
          .from('auditoria_recomendacoes')
          .select('*, auditoria_achados!inner(auditoria_id)', { count: 'exact', head: true })
          .eq('auditoria_achados.auditoria_id', auditoria.id);
        
        counts[auditoria.id] = {
          trabalhos: trabalhosRes.count ?? 0,
          achados: achadosRes.count ?? 0,
          recomendacoes: recomendacoesRes.count ?? 0,
        };
      }
      
      return counts;
    },
    enabled: !!auditorias && auditorias.length > 0,
  });

  const handleEdit = (auditoria: any) => {
    setSelectedAuditoria(auditoria);
    setShowAuditoriaDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta auditoria?')) return;

    const { error } = await supabase
      .from('auditorias')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir auditoria",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Auditoria excluída com sucesso",
    });
    refetch();
  };

  const handleOpenTrabalhos = (auditoria: any) => {
    setSelectedAuditoria(auditoria);
    setShowTrabalhosDialog(true);
  };

  const handleOpenAchados = (auditoria: any) => {
    setSelectedAuditoria(auditoria);
    setShowAchadosDialog(true);
  };

  const handleOpenRecomendacoes = (auditoria: any) => {
    setSelectedAuditoria(auditoria);
    setShowRecomendacoesDialog(true);
  };

  const handleOpenEvidencias = (auditoria: any) => {
    setSelectedAuditoria(auditoria);
    setShowEvidenciasDialog(true);
  };

  const statsCards = [
    {
      title: "Total de Auditorias",
      value: auditorias?.length || 0,
      description: "Auditorias cadastradas",
      icon: FileText,
    },
    {
      title: "Em Andamento",
      value: auditorias?.filter(a => a.status === 'em_andamento').length || 0,
      description: "Auditorias ativas",
      icon: Clock,
    },
    {
      title: "Concluídas",
      value: auditorias?.filter(a => a.status === 'concluida').length || 0,
      description: "Auditorias finalizadas",
      icon: CheckCircle,
    },
    {
      title: "Pendentes",
      value: auditorias?.filter(a => a.status === 'planejamento').length || 0,
      description: "Aguardando início",
      icon: AlertTriangle,
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditorias"
        description="Gerencie e monitore auditorias internas e externas"
        actions={undefined}
      />

      {/* StatCards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={<stat.icon className="h-4 w-4" />}
            loading={isLoading}
          />
        ))}
      </div>


      <Card className="rounded-lg border overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between gap-4 mb-4">
              <Input
                placeholder="Buscar auditorias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
                <Button size="sm" onClick={() => setShowAuditoriaDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Auditoria
                </Button>
              </div>
            </div>
            {showFilters && (
              <div className="flex gap-4 items-center flex-wrap p-4 bg-muted/50 rounded-lg mb-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    <SelectItem value="planejamento">Planejamento</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={tipoFilter} onValueChange={setTipoFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Tipos</SelectItem>
                    <SelectItem value="interna">Interna</SelectItem>
                    <SelectItem value="externa">Externa</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="operacional">Operacional</SelectItem>
                    <SelectItem value="ti">TI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Data Início</TableHead>
                  <TableHead>Auditor</TableHead>
                  <TableHead>Trabalhos</TableHead>
                  <TableHead>Achados</TableHead>
                  <TableHead>Recomendações</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                    </TableRow>
                  ))
                ) : !auditorias || auditorias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="p-0">
                      <EmptyState
                        icon={<FileText className="h-8 w-8" />}
                        title="Nenhuma auditoria encontrada"
                        description="Ainda não há auditorias cadastradas. Comece criando a primeira auditoria."
                        action={{
                          label: "Nova Auditoria",
                          onClick: () => {
                            setSelectedAuditoria(null);
                            setShowAuditoriaDialog(true);
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  <TooltipProvider>
                    {auditorias.map((auditoria) => {
                      const counts = auditoriasCounts?.[auditoria.id] || { trabalhos: 0, achados: 0, recomendacoes: 0 };
                      const auditorResponsavel = usuarios?.find((u: any) => u.user_id === auditoria.auditor_responsavel);
                      
                      return (
                        <TableRow key={auditoria.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{auditoria.nome}</div>
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {auditoria.descricao || 'Sem descrição'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={getTipoBadgeVariant(auditoria.tipo)}
                              className={getTipoCustomClass(auditoria.tipo)}
                            >
                              {capitalizeText(auditoria.tipo)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={getStatusBadgeVariant(auditoria.status)}
                              className={getStatusCustomClass(auditoria.status)}
                            >
                              {capitalizeText(auditoria.status.replace(/_/g, ' '))}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={getPrioridadeBadgeVariant(auditoria.prioridade)}
                              className={getPrioridadeCustomClass(auditoria.prioridade)}
                            >
                              {capitalizeText(auditoria.prioridade)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {auditoria.data_inicio 
                              ? new Date(auditoria.data_inicio).toLocaleDateString('pt-BR')
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span className="text-sm">
                                {auditorResponsavel?.nome || 'Não definido'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              <span>{counts.trabalhos}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="w-4 h-4" />
                              <span>{counts.achados}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-4 w-4" />
                              <span>{counts.recomendacoes}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEdit(auditoria)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar auditoria</TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleOpenTrabalhos(auditoria)}
                                  >
                                    <FileText className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Trabalhos ({counts.trabalhos})</TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleOpenAchados(auditoria)}
                                  >
                                    <AlertTriangle className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Achados ({counts.achados})</TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleOpenRecomendacoes(auditoria)}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Recomendações ({counts.recomendacoes})</TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleOpenEvidencias(auditoria)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Evidências</TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDelete(auditoria.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Excluir auditoria</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TooltipProvider>
                )}
              </TableBody>
            </Table>
        </CardContent>
      </Card>
      <AuditoriaDialog
        open={showAuditoriaDialog}
        onOpenChange={setShowAuditoriaDialog}
        auditoria={selectedAuditoria}
        onSuccess={() => {
          refetch();
          setShowAuditoriaDialog(false);
        }}
      />

      <TrabalhosDialog
        open={showTrabalhosDialog}
        onOpenChange={setShowTrabalhosDialog}
        auditoria={selectedAuditoria}
      />

      <AchadosDialog
        open={showAchadosDialog}
        onOpenChange={setShowAchadosDialog}
        auditoria={selectedAuditoria}
      />

      <RecomendacoesDialog
        open={showRecomendacoesDialog}
        onOpenChange={setShowRecomendacoesDialog}
        auditoria={selectedAuditoria}
      />

      <EvidenciasDialog
        open={showEvidenciasDialog}
        onOpenChange={setShowEvidenciasDialog}
        auditoria={selectedAuditoria}
      />
    </div>
  );
};

export default Auditorias;
