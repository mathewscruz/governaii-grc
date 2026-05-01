import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  CheckCircle,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

import { AkurisPulse } from '@/components/ui/AkurisPulse';
interface RelatorioMetricas {
  total_denuncias: number;
  denuncias_periodo: number;
  tempo_medio_resolucao: number;
  taxa_resolucao: number;
  denuncias_por_status: { status: string; count: number; label: string }[];
  denuncias_por_categoria: { categoria: string; count: number; cor: string }[];
  denuncias_por_gravidade: { gravidade: string; count: number; label: string }[];
  timeline_denuncias: { data: string; count: number }[];
}

const CORES_GRAFICOS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
];

export function RelatoriosDenuncia() {
  const [metricas, setMetricas] = useState<RelatorioMetricas | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('30dias');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  useEffect(() => {
    carregarRelatorio();
  }, [periodo, dateRange]);

  const carregarRelatorio = async () => {
    setLoading(true);
    try {
      let dataInicio: Date;
      let dataFim: Date = new Date();

      // Definir período
      switch (periodo) {
        case '7dias':
          dataInicio = subDays(new Date(), 7);
          break;
        case '30dias':
          dataInicio = subDays(new Date(), 30);
          break;
        case '90dias':
          dataInicio = subDays(new Date(), 90);
          break;
        case 'mes_atual':
          dataInicio = startOfMonth(new Date());
          dataFim = endOfMonth(new Date());
          break;
        case 'personalizado':
          dataInicio = dateRange?.from || subDays(new Date(), 30);
          dataFim = dateRange?.to || new Date();
          break;
        default:
          dataInicio = subDays(new Date(), 30);
      }

      // Buscar denúncias do período
      const { data: denuncias, error } = await supabase
        .from('denuncias')
        .select(`
          *,
          categoria:denuncias_categorias(nome, cor)
        `)
        .gte('created_at', dataInicio.toISOString())
        .lte('created_at', dataFim.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar total geral
      const { count: totalGeral } = await supabase
        .from('denuncias')
        .select('*', { count: 'exact', head: true });

      // Processar métricas
      const total_denuncias = totalGeral || 0;
      const denuncias_periodo = denuncias?.length || 0;
      
      // Calcular tempo médio de resolução
      const denunciasResolvidas = denuncias?.filter(d => 
        ['resolvida', 'arquivada'].includes(d.status) && d.data_conclusao
      ) || [];
      
      const tempo_medio_resolucao = denunciasResolvidas.length > 0
        ? denunciasResolvidas.reduce((acc, d) => {
            const inicio = new Date(d.created_at);
            const fim = new Date(d.data_conclusao);
            return acc + (fim.getTime() - inicio.getTime());
          }, 0) / denunciasResolvidas.length / (1000 * 60 * 60 * 24) // em dias
        : 0;

      const taxa_resolucao = denuncias_periodo > 0 
        ? (denunciasResolvidas.length / denuncias_periodo) * 100 
        : 0;

      // Agrupar por status
      const statusMap = {
        nova: 'Nova',
        em_analise: 'Em Análise',
        em_investigacao: 'Em Investigação',
        resolvida: 'Resolvida',
        arquivada: 'Arquivada'
      };

      const denuncias_por_status = Object.entries(statusMap).map(([status, label]) => ({
        status,
        label,
        count: denuncias?.filter(d => d.status === status).length || 0
      }));

      // Agrupar por categoria
      const categoriaGroups = denuncias?.reduce((acc, d) => {
        const categoria = d.categoria?.nome || 'Sem categoria';
        const cor = d.categoria?.cor || '#6B7280';
        if (!acc[categoria]) {
          acc[categoria] = { count: 0, cor };
        }
        acc[categoria].count++;
        return acc;
      }, {} as Record<string, { count: number; cor: string }>);

      const denuncias_por_categoria = Object.entries(categoriaGroups || {}).map(([categoria, data]) => ({
        categoria,
        count: data.count,
        cor: data.cor
      }));

      // Agrupar por gravidade
      const gravidadeMap = {
        baixa: 'Baixa',
        media: 'Média',
        alta: 'Alta',
        critica: 'Crítica'
      };

      const denuncias_por_gravidade = Object.entries(gravidadeMap).map(([gravidade, label]) => ({
        gravidade,
        label,
        count: denuncias?.filter(d => d.gravidade === gravidade).length || 0
      }));

      // Timeline (últimos 30 dias)
      const timeline_denuncias = Array.from({ length: 30 }, (_, i) => {
        const data = subDays(new Date(), 29 - i);
        const dataStr = format(data, 'dd/MM');
        const count = denuncias?.filter(d => 
          format(new Date(d.created_at), 'dd/MM/yyyy') === format(data, 'dd/MM/yyyy')
        ).length || 0;
        
        return { data: dataStr, count };
      });

      setMetricas({
        total_denuncias,
        denuncias_periodo,
        tempo_medio_resolucao,
        taxa_resolucao,
        denuncias_por_status,
        denuncias_por_categoria,
        denuncias_por_gravidade,
        timeline_denuncias
      });
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportarRelatorio = () => {
    if (!metricas) return;

    const dadosCSV = [
      ['Período', periodo],
      ['Total de Denúncias', metricas.total_denuncias],
      ['Denúncias no Período', metricas.denuncias_periodo],
      ['Tempo Médio de Resolução (dias)', metricas.tempo_medio_resolucao.toFixed(1)],
      ['Taxa de Resolução (%)', metricas.taxa_resolucao.toFixed(1)],
      [''],
      ['Status', 'Quantidade'],
      ...metricas.denuncias_por_status.map(item => [item.label, item.count]),
      [''],
      ['Categoria', 'Quantidade'],
      ...metricas.denuncias_por_categoria.map(item => [item.categoria, item.count]),
      [''],
      ['Gravidade', 'Quantidade'],
      ...metricas.denuncias_por_gravidade.map(item => [item.label, item.count])
    ];

    const csvContent = dadosCSV.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-denuncias-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <AkurisPulse size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Relatórios e Analytics</h2>
          <p className="text-muted-foreground">
            Análise estatística das denúncias recebidas
          </p>
        </div>
        
        <Button onClick={exportarRelatorio}>
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Período de Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                <SelectItem value="90dias">Últimos 90 dias</SelectItem>
                <SelectItem value="mes_atual">Mês atual</SelectItem>
                <SelectItem value="personalizado">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            
            {periodo === 'personalizado' && (
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Métricas principais */}
      {metricas && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Denúncias</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metricas.total_denuncias}</div>
                <p className="text-xs text-muted-foreground">
                  {metricas.denuncias_periodo} no período selecionado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metricas.tempo_medio_resolucao.toFixed(1)} dias
                </div>
                <p className="text-xs text-muted-foreground">
                  Para resolução
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Resolução</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {metricas.taxa_resolucao.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Denúncias resolvidas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {metricas.denuncias_por_status
                    .filter(s => ['nova', 'em_analise', 'em_investigacao'].includes(s.status))
                    .reduce((acc, s) => acc + s.count, 0)
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Requerem atenção
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Denúncias por Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metricas.denuncias_por_status}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Categorias */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Denúncias por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metricas.denuncias_por_categoria}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ categoria, count }) => `${categoria}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {metricas.denuncias_por_categoria.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Gravidade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Denúncias por Gravidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metricas.denuncias_por_gravidade.map((item, index) => (
                    <div key={item.gravidade} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: CORES_GRAFICOS[index] }}
                        />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Evolução Temporal
                </CardTitle>
                <CardDescription>
                  Denúncias recebidas nos últimos 30 dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metricas.timeline_denuncias}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="data" 
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}