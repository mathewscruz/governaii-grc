import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DueDiligenceDashboard } from '@/components/due-diligence/DueDiligenceDashboard';
import { TemplatesManager } from '@/components/due-diligence/TemplatesManager';
import { AssessmentsManagerEnhanced } from '@/components/due-diligence/AssessmentsManagerEnhanced';
import { ReportsView } from '@/components/due-diligence/ReportsView';
import { ModuleIntegrations } from '@/components/due-diligence/ModuleIntegrations';
import { FornecedoresManager } from '@/components/due-diligence/FornecedoresManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { useDueDiligenceStats } from '@/hooks/useDueDiligenceStats';
import { ClipboardList, Users, CheckCircle, TrendingUp } from 'lucide-react';

export default function DueDiligence() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const { data: stats, isLoading } = useDueDiligenceStats();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Due Diligence"
        description="Gerencie avaliações digitais de fornecedores com questionários personalizados e scoring automático"
      />

      {/* StatCards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Templates Ativos"
          value={stats?.totalTemplates || 0}
          description="Questionários disponíveis"
          icon={<ClipboardList className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          title="Total de Avaliações"
          value={stats?.totalAssessments || 0}
          description="Avaliações criadas"
          icon={<Users className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          title="Concluídas"
          value={stats?.completedAssessments || 0}
          description={`${(stats?.totalAssessments || 0) - (stats?.completedAssessments || 0)} pendentes`}
          icon={<CheckCircle className="h-4 w-4" />}
          loading={isLoading}
          variant="success"
        />
        <StatCard
          title="Score Médio"
          value={`${(stats?.averageScore || 0).toFixed(1)}%`}
          description="Média das avaliações concluídas"
          icon={<TrendingUp className="h-4 w-4" />}
          loading={isLoading}
          variant={stats?.averageScore >= 80 ? 'success' : stats?.averageScore >= 60 ? 'warning' : 'destructive'}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="assessments">Questionários</TabsTrigger>
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <DueDiligenceDashboard />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <TemplatesManager />
        </TabsContent>

        <TabsContent value="assessments" className="space-y-6">
          <AssessmentsManagerEnhanced />
        </TabsContent>

        <TabsContent value="fornecedores" className="space-y-6">
          <FornecedoresManager />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <ReportsView />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <ModuleIntegrations />
        </TabsContent>
      </Tabs>
    </div>
  );
}