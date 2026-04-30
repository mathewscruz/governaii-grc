import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { DollarSign, TrendingUp, TrendingDown, BarChart3, Sparkles, Building2, AlertTriangle, Loader2, Cpu } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// --- Constants: AI models, pricing, and function mapping ---

interface ModelPricing {
  label: string;
  provider: string;
  inputPer1kTokens: number;  // USD
  outputPer1kTokens: number; // USD
  avgCostPerReqBRL: number;  // BRL estimated avg per request
  functions: string[];       // funcionalidade values that use this model
}

const MODEL_PRICING: Record<string, ModelPricing> = {
  'claude-sonnet-4-20250514': {
    label: 'Claude Sonnet 4',
    provider: 'Anthropic',
    inputPer1kTokens: 0.003,
    outputPer1kTokens: 0.015,
    avgCostPerReqBRL: 0.20,
    functions: ['analyze_document_adherence', 'docgen-chat'],
  },
  'google/gemini-3-flash-preview': {
    label: 'Gemini 3 Flash Preview',
    provider: 'Google',
    inputPer1kTokens: 0.00015,
    outputPer1kTokens: 0.0006,
    avgCostPerReqBRL: 0.03,
    functions: ['akuria_chat', 'ai-assistant', 'calculate-assessment-score', 'populate-requirement-guidance', 'populate-requirement-guidance-batch', 'suggest_risk_treatment'],
  },
};

// Build reverse map: funcionalidade prefix → model key
function getModelForFunc(funcionalidade: string): string | null {
  for (const [modelKey, info] of Object.entries(MODEL_PRICING)) {
    for (const fn of info.functions) {
      if (funcionalidade === fn || funcionalidade.startsWith(fn + ':')) return modelKey;
    }
  }
  return null;
}

// --- Interfaces ---

interface EmpresaFinanceiro {
  id: string;
  nome: string;
  plano_nome: string;
  receita_mensal: number;
  requisicoes: number;
  custo_estimado: number;
  margem: number;
  margem_percent: number;
  status: 'rentavel' | 'limite' | 'deficitario';
}

interface ModelStats {
  model: string;
  label: string;
  provider: string;
  avgCostBRL: number;
  reqs: number;
  totalCostBRL: number;
}

export function FinanceiroIATab() {
  const [empresas, setEmpresas] = useState<EmpresaFinanceiro[]>([]);
  const [modelStats, setModelStats] = useState<ModelStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [overrideCost, setOverrideCost] = useState(0.05);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [avgCostPerReq, setAvgCostPerReq] = useState(0);
  const [planPrices, setPlanPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchData();
  }, [overrideEnabled, overrideCost]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: empresasData, error: empErr } = await supabase
        .from('empresas')
        .select(`id, nome, creditos_consumidos, plano:planos(nome, creditos_franquia, preco_mensal)`)
        .order('nome');
      if (empErr) throw empErr;

      // Build plan prices dynamically from DB
      const pricesMap: Record<string, number> = { 'Free': 0 };
      (empresasData || []).forEach((e: any) => {
        if (e.plano?.nome) pricesMap[e.plano.nome] = Number(e.plano.preco_mensal) || 0;
      });
      setPlanPrices(pricesMap);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: consumoData, error: consErr } = await supabase
        .from('creditos_consumo')
        .select('empresa_id, funcionalidade')
        .gte('created_at', startOfMonth.toISOString());
      if (consErr) throw consErr;

      // Build model stats & per-empresa costs
      const modelReqCount: Record<string, number> = {};
      const reqCountByEmpresa: Record<string, { total: number; cost: number }> = {};
      const funcCount: Record<string, number> = {};

      (consumoData || []).forEach((c: any) => {
        const model = getModelForFunc(c.funcionalidade);
        const costPerReq = model ? MODEL_PRICING[model].avgCostPerReqBRL : 0.03;
        const modelKey = model || 'unknown';

        modelReqCount[modelKey] = (modelReqCount[modelKey] || 0) + 1;
        funcCount[c.funcionalidade] = (funcCount[c.funcionalidade] || 0) + 1;

        if (!reqCountByEmpresa[c.empresa_id]) reqCountByEmpresa[c.empresa_id] = { total: 0, cost: 0 };
        reqCountByEmpresa[c.empresa_id].total += 1;
        reqCountByEmpresa[c.empresa_id].cost += overrideEnabled ? overrideCost : costPerReq;
      });

      // Compute weighted avg cost
      const totalReqs = Object.values(reqCountByEmpresa).reduce((s, e) => s + e.total, 0);
      const totalCost = Object.values(reqCountByEmpresa).reduce((s, e) => s + e.cost, 0);
      const computedAvg = totalReqs > 0 ? totalCost / totalReqs : 0;
      setAvgCostPerReq(computedAvg);

      // Model stats
      const stats: ModelStats[] = Object.entries(MODEL_PRICING).map(([key, info]) => {
        const reqs = modelReqCount[key] || 0;
        return {
          model: key,
          label: info.label,
          provider: info.provider,
          avgCostBRL: info.avgCostPerReqBRL,
          reqs,
          totalCostBRL: reqs * info.avgCostPerReqBRL,
        };
      });
      setModelStats(stats);

      // Empresas
      const mapped: EmpresaFinanceiro[] = (empresasData || []).map((e: any) => {
        const planoNome = e.plano?.nome || 'Free';
        const receita = planPrices[planoNome] || 0;
        const empData = reqCountByEmpresa[e.id] || { total: 0, cost: 0 };
        const custo = empData.cost;
        const margem = receita - custo;
        const margemPct = receita > 0 ? (margem / receita) * 100 : (empData.total > 0 ? -100 : 0);
        let status: 'rentavel' | 'limite' | 'deficitario' = 'rentavel';
        if (margemPct < 10) status = 'limite';
        if (margem < 0) status = 'deficitario';

        return {
          id: e.id,
          nome: e.nome,
          plano_nome: planoNome,
          receita_mensal: receita,
          requisicoes: empData.total,
          custo_estimado: custo,
          margem,
          margem_percent: margemPct,
          status,
        };
      });

      setEmpresas(mapped);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    const receita = empresas.reduce((s, e) => s + e.receita_mensal, 0);
    const custo = empresas.reduce((s, e) => s + e.custo_estimado, 0);
    const reqs = empresas.reduce((s, e) => s + e.requisicoes, 0);
    return {
      receita,
      custo,
      margem: receita - custo,
      margemPct: receita > 0 ? ((receita - custo) / receita) * 100 : 0,
      totalReqs: reqs,
      deficitarios: empresas.filter(e => e.status === 'deficitario').length,
    };
  }, [empresas]);

  const handleAIAnalysis = async () => {
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const payload = {
        receita_total: totals.receita,
        custo_total: totals.custo,
        margem_bruta: totals.margem,
        margem_percent: totals.margemPct,
        total_requisicoes: totals.totalReqs,
        custo_medio_por_req: avgCostPerReq,
        modelos_em_uso: modelStats.map(m => ({
          modelo: m.label,
          provider: m.provider,
          custo_medio_req: m.avgCostBRL,
          requisicoes: m.reqs,
          custo_total: m.totalCostBRL,
        })),
        empresas_deficitarias: empresas.filter(e => e.status === 'deficitario').map(e => ({
          nome: e.nome, plano: e.plano_nome, reqs: e.requisicoes, margem: e.margem
        })),
        planos: Object.entries(planPrices).map(([nome, preco]) => ({ nome, preco })),
        empresas_por_plano: Object.entries(
          empresas.reduce((acc, e) => { acc[e.plano_nome] = (acc[e.plano_nome] || 0) + 1; return acc; }, {} as Record<string, number>)
        ).map(([plano, qtd]) => ({ plano, qtd })),
      };

      const { data, error } = await supabase.functions.invoke('ai-module-assistant', {
        body: { action: 'pricing_analysis', data: payload },
      });

      if (error) throw error;
      if (data?.data) {
        const d = data.data;
        const parts: string[] = [];
        if (d.resumo) parts.push(`**Resumo:** ${d.resumo}`);
        if (d.diagnostico) parts.push(`**Diagnóstico:** ${d.diagnostico}`);
        if (d.recomendacoes?.length) {
          parts.push('**Recomendações:**');
          d.recomendacoes.forEach((r: string, i: number) => parts.push(`${i + 1}. ${r}`));
        }
        if (d.alerta_empresas) parts.push(`**Alertas:** ${d.alerta_empresas}`);
        if (d.conclusao) parts.push(`**Conclusão:** ${d.conclusao}`);
        setAiAnalysis(parts.join('\n\n') || JSON.stringify(d, null, 2));
      }
    } catch (err: any) {
      if (err?.message?.includes('402')) {
        toast.error('Créditos de IA esgotados');
      } else {
        toast.error('Erro ao gerar análise IA');
      }
    } finally {
      setAiLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      rentavel: { label: 'Rentável', variant: 'default' },
      limite: { label: 'No Limite', variant: 'secondary' },
      deficitario: { label: 'Déficit', variant: 'destructive' },
    };
    const s = map[status] || map.rentavel;
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const columns = [
    { key: 'nome', label: 'Empresa', sortable: true, render: (v: string) => <span className="font-medium">{v}</span> },
    { key: 'plano_nome', label: 'Plano', render: (v: string) => <Badge variant="outline">{v}</Badge> },
    { key: 'receita_mensal', label: 'Receita/mês', sortable: true, render: (v: number) => `R$ ${v.toFixed(2)}` },
    { key: 'requisicoes', label: 'Requisições', sortable: true },
    { key: 'custo_estimado', label: 'Custo Est.', sortable: true, render: (v: number) => `R$ ${v.toFixed(2)}` },
    {
      key: 'margem', label: 'Margem', sortable: true, render: (v: number, row: EmpresaFinanceiro) => (
        <span className={v < 0 ? 'text-destructive font-semibold' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}>
          R$ {v.toFixed(2)} ({row.margem_percent.toFixed(0)}%)
        </span>
      )
    },
    { key: 'status', label: 'Status', render: (v: string) => statusBadge(v) },
  ];

  const CHART_COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--accent))',
    'hsl(262, 83%, 58%)',
    'hsl(220, 70%, 50%)',
  ];

  return (
    <div className="space-y-6">
      {/* Card: Modelos IA em Uso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Modelos de IA em Uso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 font-medium text-muted-foreground">Modelo</th>
                  <th className="pb-2 font-medium text-muted-foreground">Provider</th>
                  <th className="pb-2 font-medium text-muted-foreground">Input/1K tokens</th>
                  <th className="pb-2 font-medium text-muted-foreground">Output/1K tokens</th>
                  <th className="pb-2 font-medium text-muted-foreground">Custo médio/req (R$)</th>
                  <th className="pb-2 font-medium text-muted-foreground">Funções</th>
                  <th className="pb-2 font-medium text-muted-foreground text-right">Reqs no mês</th>
                  <th className="pb-2 font-medium text-muted-foreground text-right">Custo total (R$)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(MODEL_PRICING).map(([key, info]) => {
                  const stat = modelStats.find(m => m.model === key);
                  return (
                    <tr key={key} className="border-b border-border/50">
                      <td className="py-2 font-medium">{info.label}</td>
                      <td className="py-2">
                        <Badge variant="outline" className="text-xs">{info.provider}</Badge>
                      </td>
                      <td className="py-2 font-mono text-xs">${info.inputPer1kTokens.toFixed(5)}</td>
                      <td className="py-2 font-mono text-xs">${info.outputPer1kTokens.toFixed(4)}</td>
                      <td className="py-2 font-mono text-xs">R$ {info.avgCostPerReqBRL.toFixed(3)}</td>
                      <td className="py-2">
                        <div className="flex flex-wrap gap-1">
                          {info.functions.map(fn => (
                            <Badge key={fn} variant="secondary" className="text-[10px]">{fn}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 text-right font-semibold">{stat?.reqs || 0}</td>
                      <td className="py-2 text-right font-semibold">R$ {(stat?.totalCostBRL || 0).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td colSpan={4} className="pt-2">Custo médio ponderado por requisição:</td>
                  <td className="pt-2 font-mono">R$ {avgCostPerReq.toFixed(3)}</td>
                  <td></td>
                  <td className="pt-2 text-right">{totals.totalReqs}</td>
                  <td className="pt-2 text-right">R$ {totals.custo.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Override toggle */}
          <div className="flex items-center gap-4 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Switch checked={overrideEnabled} onCheckedChange={setOverrideEnabled} id="override" />
              <Label htmlFor="override" className="text-xs text-muted-foreground">Simular custo fixo por requisição</Label>
            </div>
            {overrideEnabled && (
              <div className="flex items-center gap-2">
                <Label className="text-xs">R$</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.001"
                  value={overrideCost}
                  onChange={(e) => setOverrideCost(parseFloat(e.target.value) || 0.05)}
                  className="w-24 h-8 text-xs"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Receita Total Mensal"
          value={`R$ ${totals.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          description={`${empresas.filter(e => e.receita_mensal > 0).length} empresas ativas`}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          title="Custo Estimado IA"
          value={`R$ ${totals.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          description={`${totals.totalReqs} req · média R$ ${avgCostPerReq.toFixed(3)}/req`}
          icon={<Sparkles className="h-4 w-4" />}
        />
        <StatCard
          title="Margem Bruta"
          value={`R$ ${totals.margem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          description={`${totals.margemPct.toFixed(1)}% de margem`}
          icon={totals.margem >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        />
        <StatCard
          title="Empresas em Déficit"
          value={totals.deficitarios}
          description={totals.deficitarios > 0 ? 'Atenção necessária' : 'Tudo saudável'}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      {/* Tabela rentabilidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Rentabilidade por Empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={empresas}
            columns={columns}
            loading={loading}
            searchPlaceholder="Buscar empresa..."
            paginated
            emptyState={{
              icon: <Building2 className="h-8 w-8" />,
              title: 'Nenhuma empresa',
              description: 'Sem dados disponíveis.',
            }}
          />
        </CardContent>
      </Card>

      {/* Gráfico consumo por modelo */}
      {modelStats.some(m => m.reqs > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Consumo por Modelo IA (mês atual)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelStats.filter(m => m.reqs > 0)} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs fill-muted-foreground" />
                  <YAxis
                    dataKey="label"
                    type="category"
                    width={160}
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number, name: string) => {
                      if (name === 'reqs') return [`${value} requisições`, 'Requisições'];
                      return [`R$ ${value.toFixed(2)}`, 'Custo'];
                    }}
                  />
                  <Bar dataKey="reqs" radius={[0, 4, 4, 0]}>
                    {modelStats.filter(m => m.reqs > 0).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Análise IA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Análise de Precificação com IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleAIAnalysis} disabled={aiLoading || loading}>
            {aiLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {aiLoading ? 'Analisando...' : 'Gerar Análise de Rentabilidade'}
          </Button>

          {aiAnalysis && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2 text-sm leading-relaxed whitespace-pre-line">
              {aiAnalysis.split('\n').map((line, i) => {
                if (line.startsWith('**') && line.includes(':**')) {
                  const [label, ...rest] = line.split(':**');
                  return (
                    <p key={i}>
                      <strong>{label.replace(/\*\*/g, '')}:</strong> {rest.join(':**').replace(/\*\*/g, '')}
                    </p>
                  );
                }
                if (line.match(/^\d+\./)) return <p key={i} className="pl-4">{line}</p>;
                if (line.trim() === '') return <br key={i} />;
                return <p key={i}>{line.replace(/\*\*/g, '')}</p>;
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
