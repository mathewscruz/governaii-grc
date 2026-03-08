import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';
import { useAuth } from '@/components/AuthProvider';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RelatorioDialog } from '@/components/relatorios/RelatorioDialog';
import { RelatorioPreviewDialog } from '@/components/relatorios/RelatorioPreviewDialog';
import { generateTemplatePDF } from '@/components/relatorios/generateTemplatePDF';
import ConfirmDialog from '@/components/ConfirmDialog';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { formatDateOnly } from '@/lib/date-utils';
import { 
  Plus, FileText, Download, Pencil, Trash2, Eye, MoreHorizontal,
  FileBarChart, BarChart3, Shield, AlertTriangle, BookOpen, Clock, Loader2
} from 'lucide-react';

const templateConfigs: Record<string, { nome: string; descricao: string; icon: any; cor: string }> = {
  lgpd_anpd: { nome: 'Relatório LGPD para ANPD', descricao: 'Relatório completo de conformidade com a LGPD para apresentação à ANPD', icon: Shield, cor: 'text-emerald-600' },
  iso27001_auditoria: { nome: 'Status ISO 27001 para Auditoria', descricao: 'Status de implementação dos controles ISO 27001 para auditoria externa', icon: FileBarChart, cor: 'text-blue-600' },
  executivo_trimestral: { nome: 'Resumo Executivo Trimestral', descricao: 'Panorama trimestral de riscos, compliance e incidentes para diretoria', icon: BarChart3, cor: 'text-primary' },
  riscos_geral: { nome: 'Panorama de Riscos', descricao: 'Visão consolidada de todos os riscos, tratamentos e matriz de calor', icon: AlertTriangle, cor: 'text-amber-600' },
  incidentes_periodo: { nome: 'Incidentes por Período', descricao: 'Análise de incidentes de segurança com timeline e métricas', icon: AlertTriangle, cor: 'text-destructive' },
  compliance_geral: { nome: 'Status Geral de Compliance', descricao: 'Aderência a frameworks, controles e políticas ativas', icon: BookOpen, cor: 'text-violet-600' },
};

export default function Relatorios() {
  const { empresaId } = useEmpresaId();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRelatorio, setEditRelatorio] = useState<any>(null);
  const [previewRelatorio, setPreviewRelatorio] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('meus');

  const { data: relatorios = [], isLoading } = useQuery({
    queryKey: ['relatorios-customizados', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from('relatorios_customizados')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!empresaId,
  });

  const stats = useMemo(() => ({
    total: relatorios.length,
    publicados: relatorios.filter((r: any) => r.status === 'publicado').length,
    rascunhos: relatorios.filter((r: any) => r.status === 'rascunho').length,
  }), [relatorios]);

  const handleCreate = async (data: any) => {
    if (!empresaId || !user?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('relatorios_customizados').insert({
        ...data,
        empresa_id: empresaId,
        created_by: user.id,
      });
      if (error) throw error;
      toast.success('Relatório criado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['relatorios-customizados'] });
      setDialogOpen(false);
    } catch (error) {
      logger.error('Erro ao criar relatório', error);
      toast.error('Erro ao criar relatório');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from('relatorios_customizados').delete().eq('id', deleteId).eq('empresa_id', empresaId);
      if (error) throw error;
      toast.success('Relatório excluído');
      queryClient.invalidateQueries({ queryKey: ['relatorios-customizados'] });
    } catch (error) {
      logger.error('Erro ao excluir relatório', error);
      toast.error('Erro ao excluir relatório');
    } finally {
      setDeleteId(null);
    }
  };

  const handleExportPDF = async (relatorio: any) => {
    if (!empresaId) return;
    setExporting(relatorio.id);
    try {
      if (relatorio.template_base && templateConfigs[relatorio.template_base]) {
        await generateTemplatePDF(relatorio, empresaId);
      } else {
        // Relatório customizado sem template - exportar básico
        const jsPDF = (await import('jspdf')).default;
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text(relatorio.nome, 20, 30);
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(relatorio.descricao || 'Sem descrição', 20, 45);
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 60);
        doc.text(`Status: ${relatorio.status}`, 20, 70);
        doc.save(`${relatorio.nome.replace(/\s+/g, '_')}.pdf`);
      }
      toast.success('PDF exportado com sucesso');
    } catch (error) {
      logger.error('Erro ao exportar PDF', error);
      toast.error('Erro ao exportar PDF');
    } finally {
      setExporting(null);
    }
  };

  const handleEdit = async (data: any) => {
    if (!editRelatorio) return;
    try {
      const { error } = await supabase.from('relatorios_customizados').update({
        nome: data.nome,
        descricao: data.descricao,
        template_base: data.template_base,
      }).eq('id', editRelatorio.id);
      if (error) throw error;
      toast.success('Relatório atualizado');
      queryClient.invalidateQueries({ queryKey: ['relatorios-customizados'] });
      setEditRelatorio(null);
    } catch (error) {
      logger.error('Erro ao editar relatório', error);
      toast.error('Erro ao editar relatório');
    }
  };

  const handleCreateFromTemplate = async (templateKey: string) => {
    if (!empresaId || !user?.id) return;
    const config = templateConfigs[templateKey];
    if (!config) return;
    
    setSaving(true);
    try {
      const { error } = await supabase.from('relatorios_customizados').insert({
        empresa_id: empresaId,
        nome: config.nome,
        descricao: config.descricao,
        tipo: 'template',
        template_base: templateKey,
        configuracao: { widgets: [], template: templateKey },
        status: 'rascunho',
        created_by: user.id,
      });
      if (error) throw error;
      toast.success(`Relatório "${config.nome}" criado a partir do template`);
      queryClient.invalidateQueries({ queryKey: ['relatorios-customizados'] });
      setActiveTab('meus');
    } catch (error) {
      logger.error('Erro ao criar relatório de template', error);
      toast.error('Erro ao criar relatório');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Crie e gerencie relatórios customizáveis para auditorias, diretoria e órgãos reguladores"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Relatórios' }]}
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Relatório
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total de Relatórios" value={stats.total} icon={<FileText className="h-5 w-5" />} variant="primary" />
        <StatCard title="Publicados" value={stats.publicados} icon={<Eye className="h-5 w-5" />} variant="success" />
        <StatCard title="Rascunhos" value={stats.rascunhos} icon={<Clock className="h-5 w-5" />} variant="warning" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="meus">Meus Relatórios</TabsTrigger>
          <TabsTrigger value="templates">Templates Pré-definidos</TabsTrigger>
        </TabsList>

        <TabsContent value="meus" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6"><div className="h-24 bg-muted rounded" /></CardContent>
                </Card>
              ))}
            </div>
          ) : relatorios.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Nenhum relatório criado</h3>
                <p className="text-muted-foreground text-sm mt-1 mb-4">Comece criando um novo relatório ou use um template</p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />Novo Relatório
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatorios.map((rel: any) => (
                <Card key={rel.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{rel.nome}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{rel.descricao || 'Sem descrição'}</p>
                      </div>
                      <Badge variant={rel.status === 'publicado' ? 'success' : rel.status === 'arquivado' ? 'secondary' : 'warning'}>
                        {rel.status === 'publicado' ? 'Publicado' : rel.status === 'arquivado' ? 'Arquivado' : 'Rascunho'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {rel.template_base && templateConfigs[rel.template_base] && (
                      <Badge variant="outline" className="mb-3 text-xs">
                        {templateConfigs[rel.template_base].nome}
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground mb-3">
                      Criado em {formatDateOnly(rel.created_at)}
                    </p>
                    <TooltipProvider>
                      <div className="flex gap-1">
                        {rel.template_base && templateConfigs[rel.template_base] && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewRelatorio(rel)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Visualizar</TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleExportPDF(rel)} disabled={exporting === rel.id}>
                              {exporting === rel.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Exportar PDF</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditRelatorio(rel)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(rel.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir</TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(templateConfigs).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <Card key={key} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => handleCreateFromTemplate(key)}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-primary/10 ${config.cor}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{config.nome}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{config.descricao}</p>
                        <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-xs group-hover:underline">
                          Usar este template →
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <RelatorioDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleCreate}
        loading={saving}
      />

      <RelatorioDialog
        open={!!editRelatorio}
        onOpenChange={(open) => !open && setEditRelatorio(null)}
        onSave={handleEdit}
        relatorio={editRelatorio}
        loading={saving}
      />

      {previewRelatorio && empresaId && (
        <RelatorioPreviewDialog
          open={!!previewRelatorio}
          onOpenChange={(open) => !open && setPreviewRelatorio(null)}
          relatorio={previewRelatorio}
          empresaId={empresaId}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir Relatório"
        description="Tem certeza que deseja excluir este relatório?"
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
