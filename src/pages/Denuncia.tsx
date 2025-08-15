import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { DenunciasDashboard } from '@/components/denuncia/DenunciasDashboard';
import { ConfiguracoesDenuncia } from '@/components/denuncia/ConfiguracoesDenuncia';
import { CategoriasDenuncia } from '@/components/denuncia/CategoriasDenuncia';
import { RelatoriosDenuncia } from '@/components/denuncia/RelatoriosDenuncia';
import { useDenunciasStats } from '@/hooks/useDenunciasStats';
import { Shield, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

export default function Denuncia() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('dashboard');
  const { data: stats, isLoading: statsLoading } = useDenunciasStats();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['dashboard', 'configuracoes', 'categorias', 'relatorios'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Canal de Denúncia"
        description="Gerencie denúncias e mantenha um ambiente ético e transparente"
      />

      {/* StatCards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total"
          value={stats?.total ?? 0}
          icon={<Shield className="h-4 w-4" />}
          description="Denúncias registradas"
          loading={statsLoading}
        />
        
        <StatCard
          title="Novas"
          value={stats?.novas ?? 0}
          icon={<AlertTriangle className="h-4 w-4" />}
          description="Aguardando análise"
          loading={statsLoading}
          variant="warning"
        />
        
        <StatCard
          title="Em Andamento"
          value={stats?.em_andamento ?? 0}
          icon={<Clock className="h-4 w-4" />}
          description="Sendo investigadas"
          loading={statsLoading}
          variant="default"
        />
        
        <StatCard
          title="Resolvidas"
          value={stats?.resolvidas ?? 0}
          icon={<CheckCircle className="h-4 w-4" />}
          description="Concluídas"
          loading={statsLoading}
          variant="success"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DenunciasDashboard />
        </TabsContent>

        <TabsContent value="configuracoes">
          <ConfiguracoesDenuncia />
        </TabsContent>

        <TabsContent value="categorias">
          <CategoriasDenuncia />
        </TabsContent>

        <TabsContent value="relatorios">
          <RelatoriosDenuncia />
        </TabsContent>
      </Tabs>
    </div>
  );
}