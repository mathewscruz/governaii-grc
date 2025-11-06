
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Plus, FileText, AlertTriangle, CheckCircle, Clock, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { useUsuariosEmpresa } from "@/hooks/useAuditoriaData";
import AuditoriaDialog from "@/components/auditorias/AuditoriaDialog";
import TrabalhosDialog from "@/components/auditorias/TrabalhosDialog";
import AchadosDialog from "@/components/auditorias/AchadosDialog";
import RecomendacoesDialog from "@/components/auditorias/RecomendacoesDialog";
import EvidenciasDialog from "@/components/auditorias/EvidenciasDialog";
import ControlesAuditoriaDialog from "@/components/auditorias/ControlesAuditoriaDialog";
import { AuditoriaCardAccordion } from "@/components/auditorias/AuditoriaCardAccordion";
import ConfirmDialog from "@/components/ConfirmDialog";

const Auditorias = () => {
  const { toast } = useToast();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [selectedAuditoria, setSelectedAuditoria] = useState<any>(null);
  const [showAuditoriaDialog, setShowAuditoriaDialog] = useState(false);
  const [showTrabalhosDialog, setShowTrabalhosDialog] = useState(false);
  const [showAchadosDialog, setShowAchadosDialog] = useState(false);
  const [showRecomendacoesDialog, setShowRecomendacoesDialog] = useState(false);
  const [showEvidenciasDialog, setShowEvidenciasDialog] = useState(false);
  const [showControlesDialog, setShowControlesDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; nome?: string }>({ open: false, id: '' });

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
        
        const controlesRes = await supabase
          .from('controles_auditorias')
          .select('id', { count: 'exact', head: true })
          .eq('auditoria_id', auditoria.id);
        
        counts[auditoria.id] = {
          trabalhos: trabalhosRes.count ?? 0,
          achados: achadosRes.count ?? 0,
          recomendacoes: recomendacoesRes.count ?? 0,
          controles: controlesRes.count ?? 0,
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

  const handleDelete = (id: string, nome?: string) => {
    setDeleteConfirm({ open: true, id, nome });
  };

  const confirmDelete = async () => {
    const { id } = deleteConfirm;
    
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
      setDeleteConfirm({ open: false, id: '' });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Auditoria excluída com sucesso",
    });
    setDeleteConfirm({ open: false, id: '' });
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

  const handleOpenControles = (auditoria: any) => {
    setSelectedAuditoria(auditoria);
    setShowControlesDialog(true);
  };

  // Detectar se veio com itemId do dashboard
  useEffect(() => {
    const itemId = location.state?.itemId;
    if (itemId && auditorias && auditorias.length > 0) {
      const auditoria = auditorias.find(a => a.id === itemId);
      if (auditoria) {
        setSelectedAuditoria(auditoria);
        setShowAuditoriaDialog(true);
        // Limpar o state para evitar reaberturas
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, auditorias]);

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
          
          {isLoading ? (
            <div className="space-y-1 px-4 pb-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : !auditorias || auditorias.length === 0 ? (
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
          ) : (
            <div className="space-y-1 px-4 pb-4">
              {auditorias.map((auditoria) => {
                const counts = auditoriasCounts?.[auditoria.id] || { trabalhos: 0, achados: 0, recomendacoes: 0, controles: 0 };
                const auditorResponsavel = usuarios?.find((u: any) => u.user_id === auditoria.auditor_responsavel);
                
                return (
                  <AuditoriaCardAccordion
                    key={auditoria.id}
                    auditoria={auditoria}
                    counts={counts}
                    onEdit={() => handleEdit(auditoria)}
                    onDelete={() => handleDelete(auditoria.id, auditoria.nome)}
                    onOpenTrabalhos={() => handleOpenTrabalhos(auditoria)}
                    onOpenAchados={() => handleOpenAchados(auditoria)}
                    onOpenRecomendacoes={() => handleOpenRecomendacoes(auditoria)}
                    onOpenEvidencias={() => handleOpenEvidencias(auditoria)}
                    onOpenControles={() => handleOpenControles(auditoria)}
                    auditorNome={auditorResponsavel?.nome}
                  />
                );
              })}
            </div>
          )}
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

      <ControlesAuditoriaDialog
        open={showControlesDialog}
        onOpenChange={setShowControlesDialog}
        auditoria={selectedAuditoria}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
        title="Excluir Auditoria"
        description={`Tem certeza que deseja excluir "${deleteConfirm.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default Auditorias;
