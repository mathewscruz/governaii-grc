import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { DollarSign, TrendingUp, TrendingDown, BarChart3, Sparkles, Building2, AlertTriangle, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { STRIPE_PLANS } from '@/lib/stripe-plans';

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

interface ConsumoFuncionalidade {
  funcionalidade: string;
  total: number;
  custo: number;
}

const PLAN_PRICES: Record<string, number> = {
  'Free': 0,
  'Starter': STRIPE_PLANS.starter.monthly_price,
  'Professional': STRIPE_PLANS.professional.monthly_price,
  'Enterprise': STRIPE_PLANS.enterprise.monthly_price,
};

export function FinanceiroIATab() {
  const [empresas, setEmpresas] = useState<EmpresaFinanceiro[]>([]);
  const [consumoPorFunc, setConsumoPorFunc] = useState<ConsumoFuncionalidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [custoReq, setCustoReq] = useState(0.15);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [custoReq]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch empresas with plan info
      const { data: empresasData, error: empErr } = await supabase
        .from('empresas')
        .select(`id, nome, creditos_consumidos, plano:planos(nome, creditos_franquia)`)
        .order('nome');

      if (empErr) throw empErr;

      // Fetch consumption by functionality (current month)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: consumoData, error: consErr } = await supabase
        .from('creditos_consumo')
        .select('empresa_id, funcionalidade')
        .gte('created_at', startOfMonth.toISOString());

      if (consErr) throw consErr;

      // Count per empresa
      const reqCountByEmpresa: Record<string, number> = {};
      const funcCount: Record<string, number> = {};

      (consumoData || []).forEach((c: any) => {
        reqCountByEmpresa[c.empresa_id] = (reqCountByEmpresa[c.empresa_id] || 0) + 1;
        funcCount[c.funcionalidade] = (funcCount[c.funcionalidade] || 0) + 1;
      });

      const mapped: EmpresaFinanceiro[] = (empresasData || []).map((e: any) => {
        const planoNome = e.plano?.nome || 'Free';
        const receita = PLAN_PRICES[planoNome] || 0;
        const reqs = reqCountByEmpresa[e.id] || 0;
        const custo = reqs * custoReq;
        const margem = receita - custo;
        const margemPct = receita > 0 ? (margem / receita) * 100 : (reqs > 0 ? -100 : 0);
        let status: 'rentavel' | 'limite' | 'deficitario' = 'rentavel';
        if (margemPct < 10) status = 'limite';
        if (margem < 0) status = 'deficitario';

        return {
          id: e.id,
          nome: e.nome,
          plano_nome: planoNome,
          receita_mensal: receita,
          requisicoes: reqs,
          custo_estimado: custo,
          margem,
          margem_percent: margemPct,
          status,
        };
      });

      setEmpresas(mapped);

      const funcArr: ConsumoFuncionalidade[] = Object.entries(funcCount)
        .map(([f, t]) => ({ funcionalidade: f, total: t, custo: t * custoReq }))
        .sort((a, b) => b.total - a.total);

      setConsumoPorFunc(funcArr);
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
      custoMedio: reqs > 0 ? custo / reqs : 0,
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
        custo_por_req: custoReq,
        empresas_deficitarias: empresas.filter(e => e.status === 'deficitario').map(e => ({
          nome: e.nome, plano: e.plano_nome, reqs: e.requisicoes, margem: e.margem
        })),
        top_funcionalidades: consumoPorFunc.slice(0, 5).map(f => ({ nome: f.funcionalidade, reqs: f.total })),
        planos: Object.entries(PLAN_PRICES).map(([nome, preco]) => ({ nome, preco })),
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
    'hsl(340, 75%, 55%)',
    'hsl(160, 60%, 45%)',
    'hsl(30, 80%, 55%)',
    'hsl(190, 70%, 50%)',
  ];

  return (
    <div className="space-y-6">
      {/* Custo por requisição configurável */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-4 flex-wrap">
            <div className="space-y-1">
              <Label htmlFor="custoReq" className="text-sm font-medium">Custo estimado por requisição IA (R$)</Label>
              <Input
                id="custoReq"
                type="number"
                step="0.01"
                min="0.01"
                value={custoReq}
                onChange={(e) => setCustoReq(parseFloat(e.target.value) || 0.15)}
                className="w-32"
              />
            </div>
            <p className="text-xs text-muted-foreground pb-2">
              Ajuste para simular diferentes cenários de custo.
            </p>
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
          description={`${totals.totalReqs} requisições no mês`}
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

      {/* Gráfico consumo por funcionalidade */}
      {consumoPorFunc.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Consumo por Funcionalidade (mês atual)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consumoPorFunc.slice(0, 10)} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs fill-muted-foreground" />
                  <YAxis
                    dataKey="funcionalidade"
                    type="category"
                    width={180}
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => [`${value} requisições`, 'Total']}
                  />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                    {consumoPorFunc.slice(0, 10).map((_, i) => (
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
