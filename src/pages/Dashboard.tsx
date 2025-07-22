
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, TrendingUp, Users, Building, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { MatrizVisualizacao } from '@/components/riscos/MatrizVisualizacao';

interface DashboardStats {
  totalRiscos: number;
  riscosAltos: number;
  totalAtivos: number;
  totalUsuarios: number;
  tratamentosPendentes: number;
  tratamentosConcluidos: number;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalRiscos: 0,
    riscosAltos: 0,
    totalAtivos: 0,
    totalUsuarios: 0,
    tratamentosPendentes: 0,
    tratamentosConcluidos: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchDashboardStats();
    }
  }, [profile]);

  const fetchDashboardStats = async () => {
    try {
      // Buscar estatísticas de riscos
      const { data: riscos } = await supabase
        .from('riscos')
        .select('nivel_risco_inicial');

      // Buscar estatísticas de ativos
      const { data: ativos } = await supabase
        .from('ativos')
        .select('id');

      // Buscar estatísticas de usuários (apenas para super admin)
      let usuarios = [];
      if (profile?.role === 'super_admin') {
        const { data: usuariosData } = await supabase
          .from('profiles')
          .select('id');
        usuarios = usuariosData || [];
      } else {
        const { data: usuariosData } = await supabase
          .from('profiles')
          .select('id')
          .eq('empresa_id', profile?.empresa_id);
        usuarios = usuariosData || [];
      }

      // Buscar estatísticas de tratamentos
      const { data: tratamentos } = await supabase
        .from('riscos_tratamentos')
        .select('status');

      const newStats: DashboardStats = {
        totalRiscos: riscos?.length || 0,
        riscosAltos: riscos?.filter(r => 
          r.nivel_risco_inicial === 'Alto' || 
          r.nivel_risco_inicial === 'Crítico' || 
          r.nivel_risco_inicial === 'Muito Alto'
        ).length || 0,
        totalAtivos: ativos?.length || 0,
        totalUsuarios: usuarios.length,
        tratamentosPendentes: tratamentos?.filter(t => t.status === 'pendente').length || 0,
        tratamentosConcluidos: tratamentos?.filter(t => t.status === 'concluído').length || 0
      };

      setStats(newStats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl space-y-6">
      {/* Título */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral dos riscos e ativos da organização
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Riscos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRiscos}</div>
            <div className="flex items-center mt-2">
              <Badge variant="destructive" className="mr-2">
                {stats.riscosAltos} Altos/Críticos
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos Cadastrados</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAtivos}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Total de ativos monitorados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsuarios}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {profile?.role === 'super_admin' ? 'Total no sistema' : 'Na sua empresa'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tratamentos Pendentes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tratamentosPendentes}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Requerem atenção
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tratamentos Concluídos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tratamentosConcluidos}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Com sucesso
            </p>
          </CardContent>
        </Card>

        {profile?.role === 'super_admin' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empresas Ativas</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground mt-2">
                Total no sistema
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Matriz de Risco */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MatrizVisualizacao />
        
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              Funcionalidade em desenvolvimento. Em breve você verá aqui as atividades mais recentes relacionadas aos riscos e tratamentos.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
