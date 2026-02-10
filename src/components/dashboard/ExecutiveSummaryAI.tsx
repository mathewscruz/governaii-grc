import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Sparkles, RefreshCw, AlertTriangle, CheckCircle2, 
  ArrowRight, FileDown, Loader2, TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import { HealthScoreGauge } from './HealthScoreGauge';
import { useLanguage } from '@/contexts/LanguageContext';

interface Recomendacao {
  prioridade: 'alta' | 'media' | 'baixa';
  acao: string;
  impacto: string;
}

interface AISummary {
  resumo: string;
  destaques: string[];
  alertas: string[];
  recomendacoes: Recomendacao[];
  healthScore: number;
  generatedAt: string;
}

export function ExecutiveSummaryAI() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('dashboard-ai-summary');
      
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      
      setSummary(data);
      toast({ title: t('dashboard.summaryGenerated'), description: t('dashboard.summaryUpdated') });
    } catch (err: any) {
      const msg = err?.message || t('dashboard.errorGenerating');
      setError(msg);
      toast({ title: t('dashboard.error'), description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    if (!summary) return;
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      const margin = 20;
      let y = margin;

      doc.setFontSize(20);
      doc.setTextColor(13, 148, 136);
      doc.text(`GovernAII - ${t('dashboard.summary')}`, margin, y);
      y += 10;

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Gerado em: ${new Date(summary.generatedAt).toLocaleString('pt-BR')}`, margin, y);
      y += 10;

      // Health Score
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text(`Score de Saúde Organizacional: ${summary.healthScore}/100`, margin, y);
      y += 12;

      // Resumo
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(t('dashboard.summary'), margin, y);
      y += 7;
      doc.setFontSize(10);
      doc.setTextColor(60);
      const resumoLines = doc.splitTextToSize(summary.resumo, 170);
      doc.text(resumoLines, margin, y);
      y += resumoLines.length * 5 + 8;

      // Destaques
      if (summary.destaques.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text('Destaques Positivos', margin, y);
        y += 7;
        doc.setFontSize(10);
        doc.setTextColor(60);
        summary.destaques.forEach(d => {
          const lines = doc.splitTextToSize(`• ${d}`, 170);
          doc.text(lines, margin, y);
          y += lines.length * 5 + 3;
        });
        y += 5;
      }

      // Alertas
      if (summary.alertas.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text('Alertas', margin, y);
        y += 7;
        doc.setFontSize(10);
        doc.setTextColor(60);
        summary.alertas.forEach(a => {
          const lines = doc.splitTextToSize(`⚠ ${a}`, 170);
          doc.text(lines, margin, y);
          y += lines.length * 5 + 3;
        });
        y += 5;
      }

      // Recomendações
      if (summary.recomendacoes.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text('Recomendações', margin, y);
        y += 7;
        doc.setFontSize(10);
        summary.recomendacoes.forEach((r, i) => {
          doc.setTextColor(0);
          const prioLabel = r.prioridade === 'alta' ? '[ALTA]' : r.prioridade === 'media' ? '[MÉDIA]' : '[BAIXA]';
          const lines = doc.splitTextToSize(`${i + 1}. ${prioLabel} ${r.acao} → ${r.impacto}`, 170);
          doc.text(lines, margin, y);
          y += lines.length * 5 + 3;
        });
      }

      doc.save('resumo-executivo-governaii.pdf');
    });
  };

  const prioridadeConfig = {
    alta: { color: 'destructive' as const, icon: TrendingUp },
    media: { color: 'warning' as const, icon: Minus },
    baixa: { color: 'info' as const, icon: TrendingDown },
  };

  if (!summary && !loading) {
    return (
      <Card className="border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="flex flex-col sm:flex-row items-center gap-6 py-8 px-6">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{t('dashboard.summaryWithAI')}</h3>
            </div>
            <p className="text-sm text-muted-foreground max-w-lg">
              {t('dashboard.summaryDesc')}
            </p>
            {/* Preview skeleton */}
            <div className="space-y-2 pt-2">
              <Skeleton className="h-3 w-full max-w-md opacity-40" />
              <Skeleton className="h-3 w-3/4 max-w-sm opacity-30" />
              <Skeleton className="h-3 w-1/2 max-w-xs opacity-20" />
            </div>
          </div>
          <Button onClick={generateSummary} className="gap-2 shrink-0">
            <Sparkles className="h-4 w-4" />
            {t('dashboard.generateAnalysis')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <CardTitle className="text-lg">{t('dashboard.generatingAnalysis')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={generateSummary} className="gap-2">
            <RefreshCw className="h-4 w-4" /> {t('dashboard.tryAgain')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{t('dashboard.summary')}</CardTitle>
            <Badge variant="soft" className="text-xs">
              {new Date(summary.generatedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportPDF} className="gap-1">
              <FileDown className="h-4 w-4" /> PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={generateSummary} className="gap-1">
              <RefreshCw className="h-4 w-4" /> {t('common.update')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Health Score + Resumo */}
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
          <HealthScoreGauge score={summary.healthScore} />
          <div>
            <p className="text-sm text-muted-foreground leading-relaxed">{summary.resumo}</p>
          </div>
        </div>

        {/* Destaques + Alertas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.destaques.length > 0 && (
            <div className="p-4 rounded-lg border bg-success/5 border-success/20">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" /> {t('dashboard.positiveHighlights')}
              </h4>
              <ul className="space-y-2">
                {summary.destaques.map((d, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.alertas.length > 0 && (
            <div className="p-4 rounded-lg border bg-warning/5 border-warning/20">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" /> {t('dashboard.alerts')}
              </h4>
              <ul className="space-y-2">
                {summary.alertas.map((a, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Recomendações */}
        {summary.recomendacoes.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" /> {t('dashboard.prioritizedRecommendations')}
            </h4>
            <div className="space-y-3">
              {summary.recomendacoes.map((rec, i) => {
                const config = prioridadeConfig[rec.prioridade] || prioridadeConfig.baixa;
                const Icon = config.icon;
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card/50">
                    <Badge variant={config.color} className="shrink-0 mt-0.5">
                      <Icon className="h-3 w-3 mr-1" />
                      {rec.prioridade === 'alta' ? t('dashboard.highPriority') : rec.prioridade === 'media' ? t('dashboard.mediumPriority') : t('dashboard.lowPriority')}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{rec.acao}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{rec.impacto}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
