import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Download, TrendingUp, TrendingDown, DollarSign, CalendarIcon, Users, BarChart3 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RelatorioData {
  contratos: any[];
  fornecedores: any[];
  marcos: any[];
  aditivos: any[];
}

interface FiltrosRelatorio {
  periodo: 'mes' | 'trimestre' | 'ano' | 'personalizado';
  dataInicio?: Date;
  dataFim?: Date;
  status?: string;
  tipo?: string;
  fornecedor?: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function RelatoriosContratos() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState<RelatorioData>({
    contratos: [],
    fornecedores: [],
    marcos: [],
    aditivos: []
  });
  const [filtros, setFiltros] = useState<FiltrosRelatorio>({
    periodo: 'mes'
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      carregarDados();
    }
  }, [open, filtros]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const { dataInicio, dataFim } = calcularPeriodo();

      // Carregar contratos
      const { data: contratos } = await supabase
        .from('contratos')
        .select(`
          *,
          fornecedores!inner(nome, avaliacao_risco)
        `)
        .gte('created_at', dataInicio.toISOString())
        .lte('created_at', dataFim.toISOString());

      // Carregar marcos
      const { data: marcos } = await supabase
        .from('contrato_marcos')
        .select(`
          *,
          contratos!inner(numero_contrato, nome)
        `)
        .gte('data_prevista', format(dataInicio, 'yyyy-MM-dd'))
        .lte('data_prevista', format(dataFim, 'yyyy-MM-dd'));

      // Carregar aditivos
      const { data: aditivos } = await supabase
        .from('contrato_aditivos')
        .select(`
          *,
          contratos!inner(numero_contrato, nome)
        `)
        .gte('created_at', dataInicio.toISOString())
        .lte('created_at', dataFim.toISOString());

      // Carregar fornecedores
      const { data: fornecedores } = await supabase
        .from('fornecedores')
        .select('*');

      setDados({
        contratos: contratos || [],
        fornecedores: fornecedores || [],
        marcos: marcos || [],
        aditivos: aditivos || []
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do relatório",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calcularPeriodo = () => {
    const hoje = new Date();
    let dataInicio: Date;
    let dataFim: Date;

    switch (filtros.periodo) {
      case 'mes':
        dataInicio = startOfMonth(hoje);
        dataFim = endOfMonth(hoje);
        break;
      case 'trimestre':
        dataInicio = startOfMonth(subMonths(hoje, 3));
        dataFim = endOfMonth(hoje);
        break;
      case 'ano':
        dataInicio = new Date(hoje.getFullYear(), 0, 1);
        dataFim = new Date(hoje.getFullYear(), 11, 31);
        break;
      case 'personalizado':
        dataInicio = filtros.dataInicio || startOfMonth(hoje);
        dataFim = filtros.dataFim || endOfMonth(hoje);
        break;
      default:
        dataInicio = startOfMonth(hoje);
        dataFim = endOfMonth(hoje);
    }

    return { dataInicio, dataFim };
  };

  const exportarRelatorio = async (formato: 'excel' | 'pdf') => {
    try {
      // Aqui você implementaria a lógica de exportação
      toast({
        title: "Exportando...",
        description: `Gerando relatório em ${formato.toUpperCase()}`,
      });

      // Simular exportação
      setTimeout(() => {
        toast({
          title: "Sucesso",
          description: `Relatório exportado em ${formato.toUpperCase()}`,
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar relatório",
        variant: "destructive"
      });
    }
  };

  const dadosGraficoContratosStatus = () => {
    const statusCount = dados.contratos.reduce((acc, contrato) => {
      acc[contrato.status] = (acc[contrato.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCount).map(([status, count]) => ({
      name: status,
      value: count
    }));
  };

  const dadosGraficoValorPorTipo = () => {
    const tipoValue = dados.contratos.reduce((acc, contrato) => {
      const valor = parseFloat(contrato.valor) || 0;
      acc[contrato.tipo] = (acc[contrato.tipo] || 0) + valor;
      return acc;
    }, {});

    return Object.entries(tipoValue).map(([tipo, valor]) => ({
      tipo,
      valor: valor
    }));
  };

  const dadosGraficoMarcosPorMes = () => {
    const marcosPorMes = dados.marcos.reduce((acc, marco) => {
      const mes = format(new Date(marco.data_prevista), 'MMM/yyyy', { locale: ptBR });
      acc[mes] = (acc[mes] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(marcosPorMes).map(([mes, count]) => ({
      mes,
      marcos: count
    }));
  };

  const estatisticasGerais = {
    totalContratos: dados.contratos.length,
    valorTotal: dados.contratos.reduce((sum, c) => sum + (parseFloat(c.valor) || 0), 0),
    contratosAtivos: dados.contratos.filter(c => c.status === 'ativo').length,
    marcosVencendo: dados.marcos.filter(m => {
      const diasRestantes = Math.ceil((new Date(m.data_prevista).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return diasRestantes <= 30 && diasRestantes >= 0;
    }).length
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <BarChart3 className="h-4 w-4 mr-2" />
          Relatórios
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Relatórios de Contratos</DialogTitle>
          <DialogDescription>
            Análise detalhada dos contratos, fornecedores e marcos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={filtros.periodo} onValueChange={(value: any) => setFiltros(prev => ({ ...prev, periodo: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mes">Este mês</SelectItem>
                    <SelectItem value="trimestre">Último trimestre</SelectItem>
                    <SelectItem value="ano">Este ano</SelectItem>
                    <SelectItem value="personalizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>

                  {filtros.periodo === 'personalizado' && (
                    <>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("justify-start text-left font-normal", !filtros.dataInicio && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filtros.dataInicio ? format(filtros.dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Data início"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={filtros.dataInicio} onSelect={(date) => setFiltros(prev => ({ ...prev, dataInicio: date }))} className="p-3 pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("justify-start text-left font-normal", !filtros.dataFim && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filtros.dataFim ? format(filtros.dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Data fim"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={filtros.dataFim} onSelect={(date) => setFiltros(prev => ({ ...prev, dataFim: date }))} className="p-3 pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                    </>
                  )}

                <div className="flex gap-2">
                  <Button onClick={() => exportarRelatorio('excel')} size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button onClick={() => exportarRelatorio('pdf')} size="sm" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="text-center py-8">Carregando dados...</div>
          ) : (
            <>
              {/* Estatísticas Gerais */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Contratos</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{estatisticasGerais.totalContratos}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(estatisticasGerais.valorTotal)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{estatisticasGerais.contratosAtivos}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Marcos Vencendo</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{estatisticasGerais.marcosVencendo}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Contratos por Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={dadosGraficoContratosStatus()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {dadosGraficoContratosStatus().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Valor por Tipo de Contrato</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dadosGraficoValorPorTipo()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="tipo" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => [
                            new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(value),
                            'Valor'
                          ]}
                        />
                        <Bar dataKey="valor" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Marcos por Mês</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dadosGraficoMarcosPorMes()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="marcos" stroke="hsl(var(--primary))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Tabela de Fornecedores por Risco */}
              <Card>
                <CardHeader>
                  <CardTitle>Fornecedores por Avaliação de Risco</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {['alto', 'medio', 'baixo'].map(risco => {
                      const fornecedoresRisco = dados.fornecedores.filter(f => f.avaliacao_risco === risco);
                      const contratosPorRisco = dados.contratos.filter(c => 
                        fornecedoresRisco.some(f => f.id === c.fornecedor_id)
                      );
                      
                      return (
                        <div key={risco} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              risco === 'alto' ? 'bg-red-500' : 
                              risco === 'medio' ? 'bg-yellow-500' : 'bg-green-500'
                            }`} />
                            <span className="capitalize">{risco} Risco</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{fornecedoresRisco.length} fornecedores</div>
                            <div className="text-sm text-muted-foreground">
                              {contratosPorRisco.length} contratos
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}