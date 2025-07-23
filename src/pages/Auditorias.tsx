
import { useState } from "react";
import { Plus, FileText, AlertTriangle, CheckCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuditoriaData, useUsuariosEmpresa } from "@/hooks/useAuditoriaData";
import AuditoriaDialog from "@/components/auditorias/AuditoriaDialog";
import TrabalhosDialog from "@/components/auditorias/TrabalhosDialog";
import AchadosDialog from "@/components/auditorias/AchadosDialog";
import RecomendacoesDialog from "@/components/auditorias/RecomendacoesDialog";
import EvidenciasDialog from "@/components/auditorias/EvidenciasDialog";

const AuditoriaCard = ({ auditoria, usuarios, onEdit, onDelete, onOpenTrabalhos, onOpenAchados, onOpenRecomendacoes, onOpenEvidencias }: any) => {
  const { trabalhoCount, achadoCount, recomendacaoCount } = useAuditoriaData(auditoria.id);
  
  const auditorResponsavel = usuarios?.find((u: any) => u.user_id === auditoria.auditor_responsavel);

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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{auditoria.nome}</CardTitle>
            <CardDescription className="line-clamp-2">
              {auditoria.descricao || 'Sem descrição'}
            </CardDescription>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {getStatusBadge(auditoria.status)}
          {getPrioridadeBadge(auditoria.prioridade)}
          <Badge variant="outline">{auditoria.tipo}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          
          {auditoria.data_inicio && (
            <div className="text-sm text-muted-foreground">
              <strong>Data de Início:</strong>{' '}
              {new Date(auditoria.data_inicio).toLocaleDateString('pt-BR')}
            </div>
          )}

          {auditoria.data_fim_prevista && (
            <div className="text-sm text-muted-foreground">
              <strong>Previsão de Conclusão:</strong>{' '}
              {new Date(auditoria.data_fim_prevista).toLocaleDateString('pt-BR')}
            </div>
          )}

          {/* Contadores */}
          <div className="flex gap-4 pt-2 border-t">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>{trabalhoCount} trabalhos</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <AlertTriangle className="w-4 h-4" />
              <span>{achadoCount} achados</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4" />
              <span>{recomendacaoCount} recomendações</span>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(auditoria)}
            >
              Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenTrabalhos(auditoria)}
            >
              Trabalhos ({trabalhoCount})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenAchados(auditoria)}
            >
              Achados ({achadoCount})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenRecomendacoes(auditoria)}
            >
              Recomendações ({recomendacaoCount})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenEvidencias(auditoria)}
            >
              Evidências
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(auditoria.id)}
            >
              Excluir
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Auditorias = () => {
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
        toast.error('Erro ao carregar auditorias');
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
      toast.error('Erro ao excluir auditoria');
      return;
    }

    toast.success('Auditoria excluída com sucesso');
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Auditorias</h1>
          <p className="text-muted-foreground">
            Gerencie auditorias internas e externas
          </p>
        </div>
        <Button 
          onClick={() => {
            setSelectedAuditoria(null);
            setShowAuditoriaDialog(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Auditoria
        </Button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : auditorias && auditorias.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auditorias.map((auditoria) => (
            <AuditoriaCard
              key={auditoria.id}
              auditoria={auditoria}
              usuarios={usuarios}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onOpenTrabalhos={handleOpenTrabalhos}
              onOpenAchados={handleOpenAchados}
              onOpenRecomendacoes={handleOpenRecomendacoes}
              onOpenEvidencias={handleOpenEvidencias}
            />
          ))}
        </div>
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
