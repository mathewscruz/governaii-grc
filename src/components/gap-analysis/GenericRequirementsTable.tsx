import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Search, X, AlertTriangle, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { toast } from "sonner";
import { FrameworkConfig, NIST_PILLAR_NAMES } from "@/lib/framework-configs";
import { NISTRequirementDetailDialog } from "./nist/NISTRequirementDetailDialog";
import { saveScoreHistory } from "@/hooks/useScoreHistory";

interface Requirement {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  categoria: string;
  area_responsavel: string | null;
  peso: number | null;
  obrigatorio?: boolean | null;
  conformity_status?: string | null;
  evidence_status?: string | null;
  evidence_files?: any[];
  observacoes?: string | null;
  plano_acao?: string | null;
  prazo_implementacao?: string | null;
  responsavel_avaliacao?: string | null;
  orientacao_implementacao?: string | null;
  exemplos_evidencias?: string | null;
  plano_acao_id?: string | null;
}

interface GenericRequirementsTableProps {
  frameworkId: string;
  frameworkName: string;
  config: FrameworkConfig;
  onStatusChange?: () => void;
  initialCategoryFilter?: string;
}

type StatusFilter = 'all' | 'conforme' | 'parcial' | 'nao_conforme' | 'nao_avaliado' | 'nao_aplicavel';

interface CategoryStats {
  total: number;
  conforme: number;
  parcial: number;
  nao_conforme: number;
  nao_avaliado: number;
  nao_aplicavel: number;
  percentage: number;
}

export const GenericRequirementsTable: React.FC<GenericRequirementsTableProps> = ({
  frameworkId,
  frameworkName,
  config,
  onStatusChange,
  initialCategoryFilter,
}) => {
  const { empresaId, loading: loadingEmpresa } = useEmpresaId();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [activeSection, setActiveSection] = useState<string>(config.sections?.[0]?.id || '');
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [onlyMandatory, setOnlyMandatory] = useState(false);

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
        .select('id, requirement_id, conformity_status, plano_acao_id, evidence_files')
        .eq('framework_id', frameworkId)
        .eq('empresa_id', empresaId);

      if (evalError) throw evalError;

      const evalMap = new Map(
        evals?.map(e => [e.requirement_id, { id: e.id, conformity_status: e.conformity_status, plano_acao_id: e.plano_acao_id, evidence_files: e.evidence_files }]) || []
      );

      const merged = (reqs || []).map(req => {
        const evaluation = evalMap.get(req.id);
        return {
          ...req,
          codigo: req.codigo || '',
          descricao: req.descricao || '',
          categoria: req.categoria || 'Outros',
          conformity_status: evaluation?.conformity_status || 'nao_avaliado',
          evaluation_id: evaluation?.id || null,
          plano_acao_id: evaluation?.plano_acao_id || null,
          evidence_files: Array.isArray(evaluation?.evidence_files) ? evaluation.evidence_files : [],
        };
      });

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

  // Sync with external category filter from CategoryStatusCards
  useEffect(() => {
    if (initialCategoryFilter) {
      setActiveTab(initialCategoryFilter);
    }
  }, [initialCategoryFilter]);

  const handleStatusChange = async (requirementId: string, newStatus: string) => {
    if (!empresaId) {
      toast.error('Erro: Empresa não identificada.');
      return;
    }
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
          .insert({ framework_id: frameworkId, requirement_id: requirementId, empresa_id: empresaId, conformity_status: newStatus });
        if (error) throw error;
      }

      await loadRequirements();
      // Use fresh data for score calculation after reload
      const { data: freshReqs } = await supabase
        .from('gap_analysis_requirements')
        .select('id, peso')
        .eq('framework_id', frameworkId);
      const { data: freshEvals } = await supabase
        .from('gap_analysis_evaluations')
        .select('requirement_id, conformity_status')
        .eq('framework_id', frameworkId)
        .eq('empresa_id', empresaId);
      
      const freshMerged = (freshReqs || []).map(req => {
        const ev = freshEvals?.find(e => e.requirement_id === req.id);
        return { ...req, conformity_status: ev?.conformity_status || 'nao_avaliado' } as Requirement;
      });
      const totalReqs = freshMerged.length;
      const evaluatedReqs = freshMerged.filter(r => r.conformity_status && r.conformity_status !== 'nao_aplicavel' && r.conformity_status !== 'nao_avaliado').length;
      const score = calculateScore(freshMerged);
      await saveScoreHistory(frameworkId, empresaId, score, totalReqs, evaluatedReqs);
      onStatusChange?.();
      toast.success('Status atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const calculateScore = (reqs: Requirement[]): number => {
    const applicable = reqs.filter(r => r.conformity_status !== 'nao_aplicavel');
    if (applicable.length === 0) return 0;
    let totalWeight = 0;
    let weightedScore = 0;
    applicable.forEach(req => {
      const weight = req.peso || 1;
      const statusScore = config.statusScores[req.conformity_status || 'nao_conforme'] || 0;
      totalWeight += weight;
      weightedScore += statusScore * weight;
    });
    return totalWeight > 0 ? weightedScore / totalWeight : 0;
  };

  const translateCategory = (cat: string) => {
    if (frameworkName.toLowerCase().includes('nist')) return NIST_PILLAR_NAMES[cat] || cat;
    return cat;
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
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }> = {
      conforme: { label: 'Conforme', variant: 'success' },
      parcial: { label: 'Parcial', variant: 'warning' },
      nao_conforme: { label: 'Não Conforme', variant: 'destructive' },
      nao_aplicavel: { label: 'N/A', variant: 'outline' },
      nao_avaliado: { label: 'Não Avaliado', variant: 'outline' },
    };
    const s = statusMap[status || 'nao_avaliado'];
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const getPriorityBadge = (peso: number | null, obrigatorio?: boolean | null) => {
    if (obrigatorio) return <Badge variant="destructive" className="text-xs">Obrigatório</Badge>;
    if ((peso || 0) >= 3) return <Badge variant="warning" className="text-xs">Alta</Badge>;
    if ((peso || 0) >= 2) return <Badge variant="outline" className="text-xs">Média</Badge>;
    return <Badge variant="secondary" className="text-xs">Baixa</Badge>;
  };

  // Compute category stats
  const categoryStatsMap = useMemo(() => {
    const map: Record<string, CategoryStats> = {};
    requirements.forEach(r => {
      const cat = r.categoria || 'Outros';
      if (!map[cat]) map[cat] = { total: 0, conforme: 0, parcial: 0, nao_conforme: 0, nao_avaliado: 0, nao_aplicavel: 0, percentage: 0 };
      map[cat].total++;
      const st = r.conformity_status || 'nao_avaliado';
      if (st in map[cat]) (map[cat] as any)[st]++;
    });
    Object.values(map).forEach(s => {
      const applicable = s.total - s.nao_aplicavel;
      s.percentage = applicable > 0 ? Math.round((s.conforme / applicable) * 100) : 0;
    });
    return map;
  }, [requirements]);

  // Filters
  const applyFilters = (reqs: Requirement[]) => {
    let filtered = reqs;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.codigo?.toLowerCase().includes(term) ||
        r.titulo?.toLowerCase().includes(term) ||
        r.descricao?.toLowerCase().includes(term)
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.conformity_status === statusFilter);
    }
    if (onlyMandatory) {
      filtered = filtered.filter(r => r.obrigatorio === true || (r.peso || 0) >= 3);
    }
    return filtered;
  };

  const categories = [...new Set(requirements.map(r => r.categoria || 'Outros'))].sort();

  const getFilteredRequirements = (baseReqs: Requirement[]) => {
    let filtered = activeTab === 'all'
      ? baseReqs
      : baseReqs.filter(r => (r.categoria || 'Outros') === activeTab);
    return applyFilters(filtered);
  };

  const filteredRequirements = getFilteredRequirements(requirements);
  const totalPages = Math.ceil(filteredRequirements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequirements = filteredRequirements.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, activeSection, itemsPerPage, searchTerm, statusFilter, onlyMandatory]);

  const clearFilters = () => { setSearchTerm(''); setStatusFilter('all'); setOnlyMandatory(false); };
  const hasActiveFilters = searchTerm.trim() !== '' || statusFilter !== 'all' || onlyMandatory;

  const SearchAndFilterBar = () => (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por código, título ou descrição..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-9" />
        {searchTerm && (
          <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearchTerm('')}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Status</SelectItem>
          <SelectItem value="conforme">Conforme</SelectItem>
          <SelectItem value="parcial">Parcial</SelectItem>
          <SelectItem value="nao_conforme">Não Conforme</SelectItem>
          <SelectItem value="nao_avaliado">Não Avaliado</SelectItem>
          <SelectItem value="nao_aplicavel">N/A</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex items-center gap-2">
        <Switch id="mandatory-filter" checked={onlyMandatory} onCheckedChange={setOnlyMandatory} />
        <Label htmlFor="mandatory-filter" className="text-sm cursor-pointer">Somente prioritários</Label>
      </div>
      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />Limpar
        </Button>
      )}
      <span className="text-sm text-muted-foreground ml-auto">{filteredRequirements.length} de {requirements.length} requisitos</span>
    </div>
  );

  const PaginationControls = ({ total, filtered }: { total: number; filtered: number }) => {
    const pages = Math.ceil(filtered / itemsPerPage);
    return (
      <div className="flex items-center justify-between mt-4 px-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Itens por página:</span>
          <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(Number(v))}>
            <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Página {currentPage} de {pages || 1} ({filtered} itens)</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(pages || 1, p + 1))} disabled={currentPage === (pages || 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const CategoryTabTrigger = ({ cat, reqs }: { cat: string; reqs: Requirement[] }) => {
    const stats = categoryStatsMap[cat];
    if (!stats) return <TabsTrigger value={cat}>{translateCategory(cat)}</TabsTrigger>;
    return (
      <TabsTrigger value={cat} className="flex flex-col items-start gap-0.5 py-2 px-3 h-auto">
        <span className="text-xs font-medium">{translateCategory(cat)}</span>
        <div className="flex items-center gap-1.5 w-full">
          <Progress value={stats.percentage} className="h-1.5 flex-1 min-w-[40px]" />
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">{stats.conforme}/{stats.total - stats.nao_aplicavel}</span>
        </div>
      </TabsTrigger>
    );
  };

  const renderTableContent = (reqs: Requirement[]) => {
    const filtered = applyFilters(reqs);
    const pages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

    return (
      <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Código</TableHead>
              <TableHead>Requisito</TableHead>
              <TableHead className="w-24">Prioridade</TableHead>
              <TableHead className="w-40">Área</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-20">Evidências</TableHead>
              <TableHead className="w-44">Avaliação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {hasActiveFilters ? 'Nenhum requisito encontrado com os filtros aplicados' : 'Nenhum requisito disponível'}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map(req => (
                <TableRow key={req.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleRowClick(req)}>
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center gap-1">
                      {(req.peso || 0) >= 3 && req.conformity_status === 'nao_conforme' && (
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      )}
                      {req.codigo}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{req.titulo}</p>
                      {req.descricao && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{req.descricao}</p>}
                    </div>
                  </TableCell>
                  <TableCell>{getPriorityBadge(req.peso, req.obrigatorio)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{req.area_responsavel || '-'}</TableCell>
                  <TableCell>{getStatusBadge(req.conformity_status)}</TableCell>
                  <TableCell>
                    {(req.evidence_files?.length || 0) > 0 ? (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Paperclip className="h-3.5 w-3.5" />
                        <span>{req.evidence_files!.length}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={req.conformity_status || 'nao_avaliado'}
                      onValueChange={(value) => handleStatusChange(req.id, value)}
                      disabled={loadingEmpresa || !empresaId}
                    >
                      <SelectTrigger onClick={(e) => e.stopPropagation()}>
                        <SelectValue placeholder={loadingEmpresa ? "Carregando..." : "Selecione..."} />
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
              ))
            )}
          </TableBody>
        </Table>
        <PaginationControls total={reqs.length} filtered={filtered.length} />
      </>
    );
  };

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
        <CardHeader><CardTitle>Requisitos do {frameworkName}</CardTitle></CardHeader>
        <CardContent>
          <SearchAndFilterBar />
          <Tabs value={activeSection} onValueChange={(v) => { setActiveSection(v); setActiveTab('all'); setCurrentPage(1); }}>
            <TabsList className="mb-4">
              {config.sections.map(section => (
                <TabsTrigger key={section.id} value={section.id}>{section.title}</TabsTrigger>
              ))}
            </TabsList>

            {config.sections.map(section => {
              const sectionReqs = requirements.filter(r => section.filter(r.codigo));
              const sectionCategories = [...new Set(sectionReqs.map(r => r.categoria || 'Outros'))].sort();

              return (
                <TabsContent key={section.id} value={section.id}>
                  <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); }}>
                    <TabsList className="mb-4 flex-wrap h-auto gap-1">
                      <TabsTrigger value="all">Todos</TabsTrigger>
                      {sectionCategories.map(cat => (
                        <CategoryTabTrigger key={cat} cat={cat} reqs={sectionReqs.filter(r => (r.categoria || 'Outros') === cat)} />
                      ))}
                    </TabsList>
                    <TabsContent value={activeTab}>
                      {renderTableContent(activeTab === 'all' ? sectionReqs : sectionReqs.filter(r => (r.categoria || 'Outros') === activeTab))}
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
      <CardHeader><CardTitle>Requisitos do {frameworkName}</CardTitle></CardHeader>
      <CardContent>
        <SearchAndFilterBar />
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); }}>
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            <TabsTrigger value="all">Todos ({requirements.length})</TabsTrigger>
            {categories.map(cat => (
              <CategoryTabTrigger key={cat} cat={cat} reqs={requirements.filter(r => (r.categoria || 'Outros') === cat)} />
            ))}
          </TabsList>
          <TabsContent value={activeTab}>
            {renderTableContent(activeTab === 'all' ? requirements : requirements.filter(r => (r.categoria || 'Outros') === activeTab))}
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
