
import { useState } from "react";
import { Plus, FileText, AlertTriangle, CheckCircle, User, Edit, Trash2, Eye, Clock } from "lucide-react";
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
import { useAuditoriaData, useUsuariosEmpresa } from "@/hooks/useAuditoriaData";
import AuditoriaDialog from "@/components/auditorias/AuditoriaDialog";
import TrabalhosDialog from "@/components/auditorias/TrabalhosDialog";
import AchadosDialog from "@/components/auditorias/AchadosDialog";
import RecomendacoesDialog from "@/components/auditorias/RecomendacoesDialog";
import EvidenciasDialog from "@/components/auditorias/EvidenciasDialog";

const getStatusBadge = (status: string) => {
  const statusMap = {
    planejamento: { label: "Planejamento", variant: "secondary" as const },
    em_andamento: { label: "Em Andamento", variant: "default" as const },
    concluida: { label: "Concluída", variant: "outline" as const },
    cancelada: { label: "Cancelada", variant: "destructive" as const },
  };
  
  const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const };
  return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
};

const getPrioridadeBadge = (prioridade: string) => {
  const prioridadeMap = {
    baixa: { label: "Baixa", variant: "outline" as const },
    media: { label: "Média", variant: "secondary" as const },
    alta: { label: "Alta", variant: "default" as const },
    critica: { label: "Crítica", variant: "destructive" as const },
  };
  
  const prioridadeInfo = prioridadeMap[prioridade as keyof typeof prioridadeMap] || { label: prioridade, variant: "secondary" as const };
  return <Badge variant={prioridadeInfo.variant}>{prioridadeInfo.label}</Badge>;
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
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Auditorias"
        description="Gerencie e monitore auditorias internas e externas"
        actions={
          <Button onClick={() => setShowAuditoriaDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Auditoria
          </Button>
        }
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

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar auditorias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
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
          <SelectTrigger className="w-full sm:w-[180px]">
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

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex space-x-4 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-4 bg-muted rounded w-1/6"></div>
                  <div className="h-4 bg-muted rounded w-1/6"></div>
                  <div className="h-4 bg-muted rounded w-1/6"></div>
                  <div className="h-4 bg-muted rounded w-1/6"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : auditorias && auditorias.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="relative overflow-auto">
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
                  <TooltipProvider>
                    {auditorias.map((auditoria) => {
                      const { trabalhoCount, achadoCount, recomendacaoCount } = useAuditoriaData(auditoria.id);
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
                            <Badge variant="outline">{auditoria.tipo}</Badge>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(auditoria.status)}
                          </TableCell>
                          <TableCell>
                            {getPrioridadeBadge(auditoria.prioridade)}
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
                              <span>{trabalhoCount}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="w-4 h-4" />
                              <span>{achadoCount}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              <span>{recomendacaoCount}</span>
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
                                <TooltipContent>Trabalhos ({trabalhoCount})</TooltipContent>
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
                                <TooltipContent>Achados ({achadoCount})</TooltipContent>
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
                                <TooltipContent>Recomendações ({recomendacaoCount})</TooltipContent>
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
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-4">Nenhuma auditoria encontrada</p>
            <Button 
              onClick={() => {
                setSelectedAuditoria(null);
                setShowAuditoriaDialog(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Criar primeira auditoria
            </Button>
          </CardContent>
        </Card>
      )}

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
