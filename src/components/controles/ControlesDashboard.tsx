import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, TrendingUp, AlertTriangle, CheckCircle, Clock, Shield, Target, FileBarChart, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardStats {
  totalControles: number;
  controlesAtivos: number;
  controlesEmRevisao: number;
  controlesCriticos: number;
  testesRealizados: number;
  testesEficazes: number;
  testesIneficazes: number;
  proximosVencimentos: number;
  coberturaRiscos: number;
  coberturaAtivos: number;
}

interface ControleVencimento {
  id: string;
  nome: string;
  proxima_avaliacao: string;
  responsavel?: string;
  diasRestantes: number;
}

interface TesteRecente {
  id: string;
  controle_nome: string;
  data_teste: string;
  resultado: string;
  testador?: string;
}

export default function ControlesDashboard() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [responsavelFilter, setResponsavelFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  // Buscar estatísticas
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', dateRange],
    queryFn: async (): Promise<DashboardStats> => {
      // Buscar controles
      const { data: controles } = await supabase
        .from('controles')
        .select('*');

      // Buscar testes
      const { data: testes } = await supabase
        .from('controles_testes')
        .select('*')
        .gte('data_teste', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('data_teste', format(dateRange.to, 'yyyy-MM-dd'));

      // Buscar vinculações
      const { data: vinculacoesRiscos } = await supabase
        .from('controles_riscos')
        .select('controle_id, risco_id');

      const { data: vinculacoesAtivos } = await supabase
        .from('controles_ativos')
        .select('controle_id, ativo_id');

      // Buscar total de riscos e ativos
      const { data: totalRiscos } = await supabase
        .from('riscos')
        .select('id');

      const { data: totalAtivos } = await supabase
        .from('ativos')
        .select('id');

      const totalControles = controles?.length || 0;
      const controlesAtivos = controles?.filter(c => c.status === 'ativo').length || 0;
      const controlesEmRevisao = controles?.filter(c => c.status === 'em_revisao').length || 0;
      const controlesCriticos = controles?.filter(c => ['alto', 'critico'].includes(c.criticidade)).length || 0;

      const testesRealizados = testes?.length || 0;
      const testesEficazes = testes?.filter(t => t.resultado === 'eficaz').length || 0;
      const testesIneficazes = testes?.filter(t => t.resultado === 'ineficaz').length || 0;

      // Calcular próximos vencimentos (próximos 30 dias)
      const hoje = new Date();
      const em30Dias = new Date();
      em30Dias.setDate(hoje.getDate() + 30);
      
      const proximosVencimentos = controles?.filter(c => {
        if (!c.proxima_avaliacao) return false;
        const dataAvaliacao = new Date(c.proxima_avaliacao);
        return dataAvaliacao >= hoje && dataAvaliacao <= em30Dias;
      }).length || 0;

      // Calcular cobertura
      const riscosUnicos = new Set(vinculacoesRiscos?.map(v => v.risco_id));
      const ativosUnicos = new Set(vinculacoesAtivos?.map(v => v.ativo_id));
      
      const coberturaRiscos = totalRiscos?.length ? Math.round((riscosUnicos.size / totalRiscos.length) * 100) : 0;
      const coberturaAtivos = totalAtivos?.length ? Math.round((ativosUnicos.size / totalAtivos.length) * 100) : 0;

      return {
        totalControles,
        controlesAtivos,
        controlesEmRevisao,
        controlesCriticos,
        testesRealizados,
        testesEficazes,
        testesIneficazes,
        proximosVencimentos,
        coberturaRiscos,
        coberturaAtivos,
      };
    }
  });

  // Buscar controles próximos do vencimento
  const { data: controlesVencimento = [] } = useQuery({
    queryKey: ['controles-vencimento'],
    queryFn: async (): Promise<ControleVencimento[]> => {
      const hoje = new Date();
      const em30Dias = new Date();
      em30Dias.setDate(hoje.getDate() + 30);

      const { data } = await supabase
        .from('controles')
        .select('id, nome, proxima_avaliacao, responsavel')
        .not('proxima_avaliacao', 'is', null)
        .gte('proxima_avaliacao', format(hoje, 'yyyy-MM-dd'))
        .lte('proxima_avaliacao', format(em30Dias, 'yyyy-MM-dd'))
        .order('proxima_avaliacao');

      return data?.map(controle => ({
        ...controle,
        diasRestantes: Math.ceil((new Date(controle.proxima_avaliacao!).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      })) || [];
    }
  });

  // Buscar testes recentes
  const { data: testesRecentes = [] } = useQuery({
    queryKey: ['testes-recentes'],
    queryFn: async (): Promise<TesteRecente[]> => {
      const { data } = await supabase
        .from('controles_testes')
        .select(`
          id,
          data_teste,
          resultado,
          testador,
          controle:controles(nome)
        `)
        .order('data_teste', { ascending: false })
        .limit(10);

      return data?.map(teste => ({
        ...teste,
        controle_nome: (teste.controle as any)?.nome || 'N/A'
      })) || [];
    }
  });

  const getResultadoBadge = (resultado: string) => {
    const variants = {
      eficaz: "default",
      ineficaz: "destructive",
      parcial: "secondary"
    } as const;
    
    return <Badge variant={variants[resultado as keyof typeof variants] || "default"}>{resultado}</Badge>;
  };

  const getUrgenciaBadge = (dias: number) => {
    if (dias <= 7) return <Badge variant="destructive">Urgente</Badge>;
    if (dias <= 15) return <Badge variant="secondary">Atenção</Badge>;
    return <Badge variant="outline">Normal</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="w-5 h-5" />
            Dashboard de Controles
          </CardTitle>
          <CardDescription>
            Monitoramento e análise dos controles internos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      <>
                        {format(dateRange.from, "dd MMM", { locale: ptBR })} - {format(dateRange.to, "dd MMM", { locale: ptBR })}
                      </>
                    ) : (
                      <span>Selecionar período</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="em_revisao">Em Revisão</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Responsável..."
              value={responsavelFilter}
              onChange={(e) => setResponsavelFilter(e.target.value)}
              className="w-[200px]"
            />

            <Button variant="outline" className="ml-auto">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Controles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalControles || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.controlesAtivos || 0} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Eficácia</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.testesRealizados ? Math.round((stats.testesEficazes / stats.testesRealizados) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.testesEficazes || 0} de {stats?.testesRealizados || 0} testes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos Vencimentos</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.proximosVencimentos || 0}</div>
            <p className="text-xs text-muted-foreground">
              Próximos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobertura de Riscos</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.coberturaRiscos || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Ativos: {stats?.coberturaAtivos || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas e Vencimentos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Controles Próximos do Vencimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {controlesVencimento.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum controle próximo do vencimento</p>
              ) : (
                controlesVencimento.map((controle) => (
                  <div key={controle.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{controle.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {controle.responsavel && `Responsável: ${controle.responsavel}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Vence em {format(new Date(controle.proxima_avaliacao), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getUrgenciaBadge(controle.diasRestantes)}
                      <span className="text-xs text-muted-foreground">
                        {controle.diasRestantes} dias
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Testes Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testesRecentes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum teste realizado recentemente</p>
              ) : (
                testesRecentes.map((teste) => (
                  <div key={teste.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{teste.controle_nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {teste.testador && `Por: ${teste.testador}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(teste.data_teste), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <div>
                      {getResultadoBadge(teste.resultado)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}