import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GenericScoreDashboard } from '@/components/gap-analysis/GenericScoreDashboard';
import { GenericRequirementsTable } from '@/components/gap-analysis/GenericRequirementsTable';
import { CategoryBarChart } from '@/components/gap-analysis/CategoryBarChart';
import { CategoryStatusCards } from '@/components/gap-analysis/CategoryStatusCards';
import { FrameworkHistoryTab } from '@/components/gap-analysis/FrameworkHistoryTab';
import { AdherenceAssessmentView } from '@/components/gap-analysis/adherence/AdherenceAssessmentView';
import { AdherenceResultView } from '@/components/gap-analysis/adherence/AdherenceResultView';
import { AIRecommendationsButton } from '@/components/gap-analysis/AIRecommendationsCard';
import { RemediationTab } from '@/components/gap-analysis/RemediationTab';
import { FrameworkOnboarding } from '@/components/gap-analysis/FrameworkOnboarding';
import { JourneyProgressBar } from '@/components/gap-analysis/JourneyProgressBar';
import { exportFrameworkPDF } from '@/components/gap-analysis/ExportFrameworkPDF';
import { supabase } from '@/integrations/supabase/client';
import { getFrameworkConfig } from '@/lib/framework-configs';
import { useFrameworkScore } from '@/hooks/useFrameworkScore';
import { useEmpresaId } from '@/hooks/useEmpresaId';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const FRAMEWORK_DESCRIPTIONS: Record<string, string> = {
  'ISO 27001': 'Padrão internacional para gestão de segurança da informação (SGSI).',
  'LGPD': 'Lei Geral de Proteção de Dados — conformidade obrigatória para empresas que tratam dados pessoais no Brasil.',
  'NIST CSF 2.0': 'Framework de cibersegurança do NIST: Governar, Identificar, Proteger, Detectar, Responder e Recuperar.',
  'ISO 27701': 'Extensão da ISO 27001 focada em gestão de privacidade, alinhada à LGPD e GDPR.',
  'PCI DSS': 'Padrão de segurança para empresas que processam dados de cartões de pagamento.',
  'SOC 2': 'Framework de auditoria para controles de segurança, disponibilidade e confidencialidade.',
};

interface Framework {
  id: string;
  nome: string;
  versao: string;
  tipo_framework: string;
  descricao?: string;
}

export default function GapAnalysisFrameworkDetail() {
  const { frameworkId } = useParams<{ frameworkId: string }>();
  const navigate = useNavigate();
  const { empresaId } = useEmpresaId();
  const [framework, setFramework] = useState<Framework | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('avaliacao');
  const [scoreRefreshKey, setScoreRefreshKey] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedAdherenceAssessment, setSelectedAdherenceAssessment] = useState<any>(null);
  const [adherenceView, setAdherenceView] = useState<'list' | 'result'>('list');

  useEffect(() => {
    if (!frameworkId) return;
    const loadFramework = async () => {
      try {
        const { data, error } = await supabase
          .from('gap_analysis_frameworks')
          .select('*')
          .eq('id', frameworkId)
          .single();
        if (error) throw error;
        setFramework(data);
      } catch (error: any) {
        logger.error('Erro ao carregar framework', { error: error instanceof Error ? error.message : String(error) });
        toast.error('Framework não encontrado');
        navigate('/gap-analysis/frameworks');
      } finally {
        setLoading(false);
      }
    };
    loadFramework();
  }, [frameworkId, navigate]);

  const loadCategoryData = useCallback(async () => {
    if (!frameworkId || !empresaId) return;
    try {
      const [reqsRes, evalsRes] = await Promise.all([
        supabase.from('gap_analysis_requirements').select('id, categoria').eq('framework_id', frameworkId),
        supabase.from('gap_analysis_evaluations').select('requirement_id, conformity_status').eq('framework_id', frameworkId).eq('empresa_id', empresaId),
      ]);
      const reqs = reqsRes.data || [];
      const evals = evalsRes.data || [];
      const evalMap = new Map(evals.map(e => [e.requirement_id, e.conformity_status || 'nao_avaliado']));
      const catMap: Record<string, { conforme: number; parcial: number; nao_conforme: number; nao_aplicavel: number; nao_avaliado: number; total: number }> = {};
      reqs.forEach(r => {
        const cat = r.categoria || 'Outros';
        if (!catMap[cat]) catMap[cat] = { conforme: 0, parcial: 0, nao_conforme: 0, nao_aplicavel: 0, nao_avaliado: 0, total: 0 };
        catMap[cat].total++;
        const st = evalMap.get(r.id) || 'nao_avaliado';
        if (st in catMap[cat]) (catMap[cat] as any)[st]++;
        else catMap[cat].nao_avaliado++;
      });
      setCategoryData(Object.entries(catMap).map(([categoria, data]) => ({ categoria, ...data })).sort((a, b) => a.categoria.localeCompare(b.categoria)));
    } catch (e) { /* silent */ }
  }, [frameworkId, empresaId]);

  useEffect(() => { loadCategoryData(); }, [loadCategoryData]);

  const config = useMemo(() =>
    framework ? getFrameworkConfig(framework.nome, framework.tipo_framework) : null,
    [framework?.nome, framework?.tipo_framework]
  );

  const defaultConfig = useMemo(() => getFrameworkConfig('default')!, []);

  const {
    overallScore, pillarScores, domainScores, areaScores, sectionScores,
    categoryScores, totalRequirements, evaluatedRequirements, loading: scoreLoading,
  } = useFrameworkScore(frameworkId || '', config || defaultConfig, scoreRefreshKey);

  useEffect(() => {
    setShowOnboarding(!scoreLoading && evaluatedRequirements === 0 && totalRequirements > 0);
  }, [scoreLoading, evaluatedRequirements, totalRequirements]);

  const handleExportPDF = async () => {
    if (!framework || !config) return;
    setExporting(true);
    try {
      const { data: reqs } = await supabase
        .from('gap_analysis_requirements')
        .select('id, codigo, titulo, categoria, peso, area_responsavel')
        .eq('framework_id', frameworkId)
        .order('ordem', { ascending: true });

      const { data: evals } = await supabase
        .from('gap_analysis_evaluations')
        .select('requirement_id, conformity_status')
        .eq('framework_id', frameworkId)
        .eq('empresa_id', empresaId);

      const evalMap = new Map(evals?.map(e => [e.requirement_id, e.conformity_status]) || []);
      const requirements = (reqs || []).map(r => ({
        codigo: r.codigo || '', titulo: r.titulo, categoria: r.categoria || '',
        conformity_status: evalMap.get(r.id) || 'nao_avaliado', peso: r.peso, area_responsavel: r.area_responsavel,
      }));

      const { data: empresa } = await supabase.from('empresas').select('nome').eq('id', empresaId).single();

      await exportFrameworkPDF({
        frameworkName: framework.nome, frameworkVersion: framework.versao,
        frameworkType: framework.tipo_framework, overallScore, totalRequirements,
        evaluatedRequirements, pillarScores, categoryScores, requirements,
        empresaNome: empresa?.nome || 'Empresa',
        scoreType: config.scoreType as 'decimal' | 'percentage',
        maxScore: config.scoreType === 'percentage' ? 100 : 5,
      });
      toast.success('PDF exportado com sucesso');
    } catch (error: any) {
      logger.error('Erro ao exportar PDF', { error: error instanceof Error ? error.message : String(error) });
      toast.error('Erro ao exportar PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleScoreChange = useCallback(() => {
    setScoreRefreshKey(k => k + 1);
    loadCategoryData();
  }, [loadCategoryData]);

  if (loading || !framework || !config) {
    return (
      <ErrorBoundary>
        <div className="space-y-6 animate-pulse">
          <div className="h-24 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/gap-analysis/frameworks')}>
            <ChevronLeft className="h-4 w-4 mr-2" />Voltar
          </Button>
        </div>

        <PageHeader
          title={`${framework.nome} ${framework.versao}`}
          description={framework.descricao || FRAMEWORK_DESCRIPTIONS[framework.nome] || `Avaliação de conformidade ${framework.tipo_framework}`}
          actions={
            <div className="flex items-center gap-2">
              {empresaId && evaluatedRequirements > 0 && (
                <AIRecommendationsButton
                  frameworkId={frameworkId!}
                  frameworkNome={framework.nome}
                  empresaId={empresaId}
                  overallScore={overallScore}
                  totalRequirements={totalRequirements}
                  evaluatedRequirements={evaluatedRequirements}
                  scoreType={config.scoreType}
                />
              )}
              <Button onClick={handleExportPDF} variant="outline" disabled={exporting}>
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Exportando...' : 'Exportar PDF'}
              </Button>
            </div>
          }
        />

        {!showOnboarding && totalRequirements > 0 && (
          <JourneyProgressBar
            evaluatedRequirements={evaluatedRequirements}
            totalRequirements={totalRequirements}
            conformeCount={categoryData.reduce((sum, c) => sum + c.conforme, 0)}
            hasActionPlans={evaluatedRequirements > 0}
            naoConformeCount={categoryData.reduce((sum, c) => sum + c.nao_conforme, 0)}
          />
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="avaliacao">Avaliação Manual</TabsTrigger>
            <TabsTrigger value="documentos">Análise de Documentos</TabsTrigger>
            <TabsTrigger value="remediacao">Remediação</TabsTrigger>
            <TabsTrigger value="historico">Histórico e Evolução</TabsTrigger>
          </TabsList>

          <TabsContent value="avaliacao" className="space-y-6">
            {showOnboarding ? (
              <FrameworkOnboarding
                frameworkNome={framework.nome}
                frameworkVersao={framework.versao}
                frameworkTipo={framework.tipo_framework}
                totalRequirements={totalRequirements}
                onStart={() => setShowOnboarding(false)}
              />
            ) : (
              <>
                <GenericScoreDashboard
                  overallScore={overallScore}
                  pillarScores={pillarScores}
                  domainScores={domainScores}
                  areaScores={areaScores}
                  sectionScores={sectionScores}
                  categoryScores={categoryScores}
                  totalRequirements={totalRequirements}
                  evaluatedRequirements={evaluatedRequirements}
                  config={config}
                  loading={scoreLoading}
                  frameworkId={frameworkId!}
                />


                {/* Single chart + interactive category cards */}
                {categoryScores.length > 0 && (
                  <CategoryBarChart categoryScores={categoryScores} config={config} />
                )}

                {categoryData.length > 0 && (
                  <CategoryStatusCards
                    categories={categoryData}
                    onCategoryClick={(cat) => setActiveCategoryFilter(prev => prev === cat ? undefined : cat)}
                    activeCategory={activeCategoryFilter}
                  />
                )}

                <GenericRequirementsTable
                  frameworkId={frameworkId!}
                  frameworkName={framework.nome}
                  config={config}
                  onStatusChange={handleScoreChange}
                  initialCategoryFilter={activeCategoryFilter}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="documentos">
            {adherenceView === 'result' && selectedAdherenceAssessment ? (
              <AdherenceResultView
                assessment={selectedAdherenceAssessment}
                onBack={() => setAdherenceView('list')}
                frameworkId={frameworkId!}
                onApplied={handleScoreChange}
              />
            ) : (
              <AdherenceAssessmentView
                onViewResult={(assessment) => { setSelectedAdherenceAssessment(assessment); setAdherenceView('result'); }}
                frameworkId={frameworkId}
                frameworkNome={framework.nome}
              />
            )}
          </TabsContent>

          <TabsContent value="remediacao">
            <RemediationTab frameworkId={frameworkId!} frameworkName={framework.nome} />
          </TabsContent>

          <TabsContent value="historico">
            <FrameworkHistoryTab
              frameworkId={frameworkId!}
              frameworkName={framework.nome}
              frameworkVersion={framework.versao}
              frameworkType={framework.tipo_framework}
              scoreType={config.scoreType}
              currentScore={overallScore}
              totalRequirements={totalRequirements}
              evaluatedRequirements={evaluatedRequirements}
            />
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
}
