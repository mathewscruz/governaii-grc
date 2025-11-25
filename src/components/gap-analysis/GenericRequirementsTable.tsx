import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { toast } from "sonner";
import { FrameworkConfig } from "@/lib/framework-configs";
import { NISTRequirementDetailDialog } from "./nist/NISTRequirementDetailDialog";

interface Requirement {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  categoria: string;
  area_responsavel: string | null;
  peso: number | null;
  conformity_status?: string | null;
  evidence_status?: string | null;
  evidence_files?: any[];
  observacoes?: string | null;
  plano_acao?: string | null;
  prazo_implementacao?: string | null;
  responsavel_avaliacao?: string | null;
}

interface GenericRequirementsTableProps {
  frameworkId: string;
  frameworkName: string;
  config: FrameworkConfig;
  onStatusChange?: () => void;
}

export const GenericRequirementsTable: React.FC<GenericRequirementsTableProps> = ({
  frameworkId,
  frameworkName,
  config,
  onStatusChange,
}) => {
  const { empresaId } = useEmpresaId();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const loadRequirements = async () => {
    if (!empresaId) return;

    try {
      setLoading(true);

      const { data: reqs, error: reqError } = await supabase
        .from('gap_analysis_requirements')
        .select('*')
        .eq('framework_id', frameworkId)
        .order('ordem', { ascending: true });

      if (reqError) throw reqError;

      const { data: evals, error: evalError } = await supabase
        .from('gap_analysis_evaluations')
        .select('requirement_id, conformity_status')
        .eq('framework_id', frameworkId)
        .eq('empresa_id', empresaId);

      if (evalError) throw evalError;

      const evalMap = new Map(evals?.map(e => [e.requirement_id, e.conformity_status]) || []);

      const merged = (reqs || []).map(req => ({
        ...req,
        codigo: req.codigo || '',
        descricao: req.descricao || '',
        categoria: req.categoria || 'Outros',
        conformity_status: evalMap.get(req.id) || 'nao_avaliado',
      }));

      setRequirements(merged);
    } catch (error: any) {
      console.error('Erro ao carregar requisitos:', error);
      toast.error('Erro ao carregar requisitos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequirements();
  }, [frameworkId, empresaId]);

  const handleStatusChange = async (requirementId: string, newStatus: string) => {
    if (!empresaId) return;

    try {
      const { data: existing } = await supabase
        .from('gap_analysis_evaluations')
        .select('id')
        .eq('requirement_id', requirementId)
        .eq('framework_id', frameworkId)
        .eq('empresa_id', empresaId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('gap_analysis_evaluations')
          .update({ conformity_status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('gap_analysis_evaluations')
          .insert({
            requirement_id: requirementId,
            empresa_id: empresaId,
            conformity_status: newStatus,
          });

        if (error) throw error;
      }

      await loadRequirements();
      onStatusChange?.();
      toast.success('Status atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleRowClick = (requirement: Requirement) => {
    setSelectedRequirement(requirement);
    setDetailDialogOpen(true);
  };

  const handleDetailDialogClose = () => {
    setDetailDialogOpen(false);
    setSelectedRequirement(null);
    loadRequirements();
    onStatusChange?.();
  };

  const getStatusBadge = (status?: string | null) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      conforme: { label: 'Conforme', variant: 'default' },
      parcial: { label: 'Parcial', variant: 'secondary' },
      nao_conforme: { label: 'Não Conforme', variant: 'destructive' },
      nao_aplicavel: { label: 'N/A', variant: 'outline' },
      nao_avaliado: { label: 'Não Avaliado', variant: 'outline' },
    };

    const s = statusMap[status || 'nao_avaliado'];
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const categories = [...new Set(requirements.map(r => r.categoria || 'Outros'))].sort();
  
  const filteredRequirements = activeTab === 'all' 
    ? requirements 
    : requirements.filter(r => (r.categoria || 'Outros') === activeTab);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se framework tem seções, usar tabs por seção
  if (config.sections && config.sections.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Requisitos do {frameworkName}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={config.sections[0].id}>
            <TabsList className="mb-4">
              {config.sections.map(section => (
                <TabsTrigger key={section.id} value={section.id}>
                  {section.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {config.sections.map(section => {
              const sectionReqs = requirements.filter(r => section.filter(r.categoria));
              const sectionCategories = [...new Set(sectionReqs.map(r => r.categoria || 'Outros'))].sort();

              return (
                <TabsContent key={section.id} value={section.id}>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="all">Todos</TabsTrigger>
                      {sectionCategories.map(cat => (
                        <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>
                      ))}
                    </TabsList>

                    <TabsContent value={activeTab}>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-32">Código</TableHead>
                            <TableHead>Requisito</TableHead>
                            <TableHead className="w-48">Área</TableHead>
                            <TableHead className="w-32">Status</TableHead>
                            <TableHead className="w-48">Avaliação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(activeTab === 'all' ? sectionReqs : sectionReqs.filter(r => (r.categoria || 'Outros') === activeTab))
                            .map(req => (
                              <TableRow 
                                key={req.id} 
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => handleRowClick(req)}
                              >
                                <TableCell className="font-mono text-sm">{req.codigo}</TableCell>
                                <TableCell>{req.titulo}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{req.area_responsavel || '-'}</TableCell>
                                <TableCell>{getStatusBadge(req.conformity_status)}</TableCell>
                                <TableCell>
                                  <Select
                                    value={req.conformity_status || 'nao_avaliado'}
                                    onValueChange={(value) => handleStatusChange(req.id, value)}
                                  >
                                    <SelectTrigger onClick={(e) => e.stopPropagation()}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="conforme">Conforme</SelectItem>
                                      <SelectItem value="parcial">Parcial</SelectItem>
                                      <SelectItem value="nao_conforme">Não Conforme</SelectItem>
                                      <SelectItem value="nao_aplicavel">N/A</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TabsContent>
                  </Tabs>
                </TabsContent>
              );
            })}
          </Tabs>

          {selectedRequirement && (
            <NISTRequirementDetailDialog
              open={detailDialogOpen}
              onOpenChange={setDetailDialogOpen}
              requirement={selectedRequirement}
              frameworkId={frameworkId}
              onClose={handleDetailDialogClose}
            />
          )}
        </CardContent>
      </Card>
    );
  }

  // Caso padrão: tabs por categoria
  return (
    <Card>
      <CardHeader>
        <CardTitle>Requisitos do {frameworkName}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">Todos ({requirements.length})</TabsTrigger>
            {categories.map(cat => {
              const count = requirements.filter(r => (r.categoria || 'Outros') === cat).length;
              return (
                <TabsTrigger key={cat} value={cat}>
                  {cat} ({count})
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={activeTab}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Código</TableHead>
                  <TableHead>Requisito</TableHead>
                  <TableHead className="w-48">Área</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="w-48">Avaliação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequirements.map(req => (
                  <TableRow 
                    key={req.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(req)}
                  >
                    <TableCell className="font-mono text-sm">{req.codigo}</TableCell>
                    <TableCell>{req.titulo}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{req.area_responsavel || '-'}</TableCell>
                    <TableCell>{getStatusBadge(req.conformity_status)}</TableCell>
                    <TableCell>
                      <Select
                        value={req.conformity_status || 'nao_avaliado'}
                        onValueChange={(value) => handleStatusChange(req.id, value)}
                      >
                        <SelectTrigger onClick={(e) => e.stopPropagation()}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conforme">Conforme</SelectItem>
                          <SelectItem value="parcial">Parcial</SelectItem>
                          <SelectItem value="nao_conforme">Não Conforme</SelectItem>
                          <SelectItem value="nao_aplicavel">N/A</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>

        {selectedRequirement && (
          <NISTRequirementDetailDialog
            open={detailDialogOpen}
            onOpenChange={setDetailDialogOpen}
            requirement={selectedRequirement}
            frameworkId={frameworkId}
            onClose={handleDetailDialogClose}
          />
        )}
      </CardContent>
    </Card>
  );
};
