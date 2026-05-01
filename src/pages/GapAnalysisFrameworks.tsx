import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { FrameworkCard } from '@/components/gap-analysis/FrameworkCard';
import { FrameworkComparisonRadar } from '@/components/gap-analysis/FrameworkComparisonRadar';
import { WelcomeHero } from '@/components/gap-analysis/WelcomeHero';
import { FrameworkCatalog } from '@/components/gap-analysis/FrameworkCatalog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useDebounce } from '@/hooks/useDebounce';
import { Activity, TrendingUp, AlertTriangle, Shield, Target, Search, ChevronDown } from 'lucide-react';
import { logger } from '@/lib/logger';

interface Framework {
  id: string;
  nome: string;
  versao: string;
  tipo_framework: string;
  descricao?: string;
}

interface FrameworkProgress {
  totalRequirements: number;
  evaluatedRequirements: number;
  conformeCount: number;
  averageScore: number;
}

interface StatusCounts {
  conforme: number;
  parcial: number;
  nao_conforme: number;
  nao_aplicavel: number;
  nao_avaliado: number;
}

// Frameworks recomendados (em ordem de prioridade) usados quando ainda não há nada ativo.
const SUGGESTED_NAMES = ['ISO 27001', 'ISO/IEC 27001', 'LGPD', 'NIST CSF 2.0', 'NIST CSF'];

// Filtros de categoria — alinhados com FrameworkCatalog
const CATEGORY_OPTIONS: { id: string; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'seguranca', label: 'Segurança' },
  { id: 'privacidade', label: 'Privacidade' },
  { id: 'governanca', label: 'Governança' },
  { id: 'qualidade', label: 'Qualidade' },
];

function getCategory(tipo: string): string {
  const t = tipo?.toLowerCase() || '';
  if (t.includes('privacidade') || t.includes('privacy') || t.includes('lgpd') || t.includes('gdpr')) return 'privacidade';
  if (t.includes('governanca') || t.includes('governance') || t.includes('cobit') || t.includes('sox')) return 'governanca';
  if (t.includes('qualidade') || t.includes('quality') || t.includes('iso 9') || t.includes('itil')) return 'qualidade';
  return 'seguranca';
}

export default function GapAnalysisFrameworks() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const empresaId = profile?.empresa_id;
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [requirementCounts, setRequirementCounts] = useState<Record<string, number>>({});
  const [frameworkProgress, setFrameworkProgress] = useState<Record<string, FrameworkProgress>>({});
  const [frameworkStatusCounts, setFrameworkStatusCounts] = useState<Record<string, StatusCounts>>({});
  const [loading, setLoading] = useState(true);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const debouncedSearch = useDebounce(searchTerm, 250);

  useEffect(() => {
    loadFrameworks();
  }, [empresaId]);

  const loadFrameworks = async () => {
    try {
      setLoading(true);
      const { data: fws, error: fwError } = await supabase
        .from('gap_analysis_frameworks')
        .select('*')
        .is('empresa_id', null)
        .eq('is_template', true)
        .order('nome', { ascending: true });

      if (fwError) throw fwError;
      setFrameworks(fws || []);

      const frameworkIds = (fws || []).map(fw => fw.id);
      const counts: Record<string, number> = {};
      const progress: Record<string, FrameworkProgress> = {};
      const statusCountsMap: Record<string, StatusCounts> = {};

      if (frameworkIds.length > 0) {
        const { data: allRequirements, error: reqError } = await supabase
          .from('gap_analysis_requirements')
          .select('id, framework_id')
          .in('framework_id', frameworkIds);

        if (!reqError && allRequirements) {
          allRequirements.forEach(req => {
            counts[req.framework_id] = (counts[req.framework_id] || 0) + 1;
          });

          if (empresaId) {
            const { data: allEvaluations, error: evalError } = await supabase
              .from('gap_analysis_evaluations')
              .select('conformity_status, framework_id')
              .in('framework_id', frameworkIds)
              .eq('empresa_id', empresaId);

            if (!evalError && allEvaluations) {
              const evalsByFramework = new Map<string, typeof allEvaluations>();
              allEvaluations.forEach(ev => {
                const existing = evalsByFramework.get(ev.framework_id) || [];
                existing.push(ev);
                evalsByFramework.set(ev.framework_id, existing);
              });

              frameworkIds.forEach(fwId => {
                const evals = evalsByFramework.get(fwId) || [];
                const evaluated = evals.filter(e =>
                  e.conformity_status && e.conformity_status !== 'nao_avaliado'
                );
                const conforme = evals.filter(e => e.conformity_status === 'conforme').length;
                const parcial = evals.filter(e => e.conformity_status === 'parcial').length;
                const nao_conforme = evals.filter(e => e.conformity_status === 'nao_conforme').length;
                const nao_aplicavel = evals.filter(e => e.conformity_status === 'nao_aplicavel').length;
                const totalReqs = counts[fwId] || 0;
                const nao_avaliado = totalReqs - conforme - parcial - nao_conforme - nao_aplicavel;

                statusCountsMap[fwId] = { conforme, parcial, nao_conforme, nao_aplicavel, nao_avaliado: Math.max(0, nao_avaliado) };

                // Calculate score considering ALL requirements (not just evaluated ones)
                let avgScore = 0;
                if (totalReqs > 0) {
                  const applicableCount = totalReqs - nao_aplicavel;
                  if (applicableCount > 0) {
                    const totalScore = evals.reduce((acc, e) => {
                      if (e.conformity_status === 'conforme') return acc + 100;
                      if (e.conformity_status === 'parcial') return acc + 50;
                      return acc;
                    }, 0);
                    avgScore = Math.round(totalScore / applicableCount);
                  }
                }

                progress[fwId] = {
                  totalRequirements: totalReqs,
                  evaluatedRequirements: evaluated.length,
                  conformeCount: conforme,
                  averageScore: avgScore
                };
              });
            }
          }
        }
      }

      setRequirementCounts(counts);
      setFrameworkProgress(progress);
      setFrameworkStatusCounts(statusCountsMap);
    } catch (error) {
      logger.error('Erro ao carregar frameworks', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const { activeFrameworks, availableFrameworks } = useMemo(() => {
    const active: Framework[] = [];
    const available: Framework[] = [];
    frameworks.forEach(fw => {
      const p = frameworkProgress[fw.id];
      if (p && p.evaluatedRequirements > 0) {
        active.push(fw);
      } else {
        available.push(fw);
      }
    });
    return { activeFrameworks: active, availableFrameworks: available };
  }, [frameworks, frameworkProgress]);

  // Helper genérico de filtragem (busca + categoria)
  const matchesFilters = (fw: Framework) => {
    if (categoryFilter !== 'all' && getCategory(fw.tipo_framework) !== categoryFilter) return false;
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return true;
    return (
      fw.nome.toLowerCase().includes(term) ||
      fw.tipo_framework?.toLowerCase().includes(term) ||
      fw.descricao?.toLowerCase().includes(term)
    );
  };

  const filteredActiveFrameworks = useMemo(
    () => activeFrameworks.filter(matchesFilters),
    [activeFrameworks, debouncedSearch, categoryFilter]
  );

  const filteredAvailableFrameworks = useMemo(
    () => availableFrameworks.filter(matchesFilters),
    [availableFrameworks, debouncedSearch, categoryFilter]
  );

  const hasActiveFrameworks = activeFrameworks.length > 0;
  const hasFilters = debouncedSearch.trim() !== '' || categoryFilter !== 'all';

  // Stats relevantes
  const relevantStats = useMemo(() => {
    if (!hasActiveFrameworks) return null;

    // Conformidade geral (média ponderada)
    let totalWeightedScore = 0;
    let totalWeight = 0;
    activeFrameworks.forEach(fw => {
      const p = frameworkProgress[fw.id];
      if (p && p.evaluatedRequirements > 0) {
        totalWeightedScore += p.averageScore * p.evaluatedRequirements;
        totalWeight += p.evaluatedRequirements;
      }
    });
    const overallCompliance = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;

    // Requisitos críticos (não conformes)
    let criticalCount = 0;
    activeFrameworks.forEach(fw => {
      const sc = frameworkStatusCounts[fw.id];
      if (sc) criticalCount += sc.nao_conforme;
    });

    let totalEvaluated = 0;
    activeFrameworks.forEach(fw => {
      const p = frameworkProgress[fw.id];
      if (p) totalEvaluated += p.evaluatedRequirements;
    });

    return { overallCompliance, criticalCount, totalEvaluated };
  }, [activeFrameworks, frameworkProgress, frameworkStatusCounts, hasActiveFrameworks]);

  // Radar data
  const comparisonData = useMemo(() => {
    return activeFrameworks.map(fw => ({
      name: fw.nome,
      score: frameworkProgress[fw.id]?.averageScore || 0,
    }));
  }, [activeFrameworks, frameworkProgress]);

  // Frameworks recomendados (busca dinâmica por priority list + fallback de tipo)
  const suggestedFrameworks = useMemo(() => {
    const found = SUGGESTED_NAMES
      .map(name => frameworks.find(fw => fw.nome === name))
      .filter(Boolean) as Framework[];
    // Deduplicar por id
    const seen = new Set<string>();
    const unique = found.filter(fw => (seen.has(fw.id) ? false : seen.add(fw.id)));
    if (unique.length >= 3) return unique.slice(0, 3);
    // Fallback: completar com primeiros frameworks de cada categoria principal
    const fallbacks = ['seguranca', 'privacidade', 'governanca']
      .map(cat => frameworks.find(fw => getCategory(fw.tipo_framework) === cat && !seen.has(fw.id)))
      .filter(Boolean) as Framework[];
    return [...unique, ...fallbacks].slice(0, 3);
  }, [frameworks]);

  const handleFrameworkClick = (framework: Framework) => {
    navigate(`/gap-analysis/framework/${framework.id}`);
  };

  if (loading) {
    return (
      <ErrorBoundary>
        <div className="space-y-6">
          <PageHeader title="Gap Analysis" description="Avalie a conformidade da sua organização com frameworks regulatórios" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3].map(i => (<div key={i} className="h-24 bg-muted rounded-lg" />))}
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Barra unificada de busca + filtros (usada quando há frameworks)
  const FilterBar = (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[220px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar framework por nome, tipo ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 h-9"
        />
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {CATEGORY_OPTIONS.map(opt => {
          const active = categoryFilter === opt.id;
          return (
            <Badge
              key={opt.id}
              variant={active ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => setCategoryFilter(opt.id)}
            >
              {opt.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <PageHeader title="Gap Analysis" description="Avalie a conformidade da sua organização com frameworks regulatórios" />

        {/* Conditional Hero */}
        {!hasActiveFrameworks ? (
          <WelcomeHero
            suggestedFrameworks={suggestedFrameworks}
            onFrameworkClick={(id) => navigate(`/gap-analysis/framework/${id}`)}
            onShowCatalog={() => setShowCatalog(true)}
          />
        ) : (
          <>
            {/* Relevant Stats */}
            {relevantStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  title="Conformidade Geral"
                  value={`${relevantStats.overallCompliance}%`}
                  icon={<TrendingUp />}
                  description="Média ponderada dos frameworks ativos"
                  variant={
                    relevantStats.overallCompliance >= 70 ? 'success' :
                    relevantStats.overallCompliance >= 40 ? 'warning' : 'destructive'
                  }
                  showAccent
                />
                <StatCard
                  title="Requisitos Críticos"
                  value={relevantStats.criticalCount}
                  icon={<AlertTriangle />}
                  description="Marcados como Não Conforme"
                  variant="destructive"
                  drillDown="gap_analysis"
                />
                <StatCard
                  title="Total Avaliados"
                  value={relevantStats.totalEvaluated}
                  icon={<Target />}
                  description="Requisitos avaliados nos frameworks ativos"
                  variant="info"
                  drillDown="gap_analysis"
                />
              </div>
            )}

            {/* Radar comparativo — só faz sentido com 3+ frameworks ativos */}
            {comparisonData.length >= 3 && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <button type="button" className="flex items-center gap-2 group text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronDown className="h-4 w-4 transition-transform group-data-[state=closed]:-rotate-90" />
                    <span>Ver maturidade comparativa entre frameworks</span>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <FrameworkComparisonRadar data={comparisonData} />
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Barra de busca unificada */}
            {FilterBar}

            {/* Active frameworks */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Frameworks Ativos
                <span className="text-sm font-normal text-muted-foreground">
                  ({hasFilters ? `${filteredActiveFrameworks.length} de ${activeFrameworks.length}` : activeFrameworks.length})
                </span>
              </h2>
              {filteredActiveFrameworks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredActiveFrameworks.map((framework) => (
                    <FrameworkCard
                      key={framework.id}
                      id={framework.id}
                      nome={framework.nome}
                      versao={framework.versao}
                      tipo_framework={framework.tipo_framework}
                      descricao={framework.descricao}
                      requirementCount={requirementCounts[framework.id] || 0}
                      progress={frameworkProgress[framework.id]}
                      statusCounts={frameworkStatusCounts[framework.id]}
                      variant="active"
                      onClick={() => handleFrameworkClick(framework)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Nenhum framework ativo corresponde aos filtros.</p>
              )}
            </div>
          </>
        )}

        {/* Available frameworks - colapsável quando há ativos */}
        {(hasActiveFrameworks || showCatalog) && availableFrameworks.length > 0 && (
          hasActiveFrameworks ? (
            <Collapsible open={catalogOpen} onOpenChange={setCatalogOpen}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <CollapsibleTrigger asChild>
                  <button type="button" className="flex items-center gap-2 group">
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${catalogOpen ? 'rotate-0' : '-rotate-90'}`} />
                    <h2 className="text-lg font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                      Frameworks Disponíveis
                      <span className="text-sm font-normal text-muted-foreground">
                        ({hasFilters && catalogOpen ? `${filteredAvailableFrameworks.length} de ${availableFrameworks.length}` : availableFrameworks.length})
                      </span>
                    </h2>
                  </button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="mt-3">
                <FrameworkCatalog
                  frameworks={filteredAvailableFrameworks}
                  requirementCounts={requirementCounts}
                  onFrameworkClick={handleFrameworkClick}
                />
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                Frameworks Disponíveis
                <span className="text-sm font-normal text-muted-foreground">({availableFrameworks.length})</span>
              </h2>
              {FilterBar}
              <FrameworkCatalog
                frameworks={filteredAvailableFrameworks}
                requirementCounts={requirementCounts}
                onFrameworkClick={handleFrameworkClick}
              />
            </div>
          )
        )}

        {frameworks.length === 0 && (
          <EmptyState
            icon={<Shield className="h-8 w-8" />}
            title="Nenhum framework disponível"
            description="Entre em contato com o administrador para habilitar frameworks de conformidade."
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
