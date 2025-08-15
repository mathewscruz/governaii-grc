import { useState } from 'react';
import { DueDiligenceDashboard } from '@/components/due-diligence/DueDiligenceDashboard';
import { TemplatesManager } from '@/components/due-diligence/TemplatesManager';
import { AssessmentsManagerEnhanced } from '@/components/due-diligence/AssessmentsManagerEnhanced';
import { ReportsView } from '@/components/due-diligence/ReportsView';
import { ModuleIntegrations } from '@/components/due-diligence/ModuleIntegrations';
import { FornecedoresManager } from '@/components/due-diligence/FornecedoresManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';

export default function DueDiligence() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Due Diligence"
        description="Gerencie avaliações digitais de fornecedores com questionários personalizados e scoring automático"
      />

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