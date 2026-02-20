import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TemplatesManager } from '@/components/due-diligence/TemplatesManager';
import { AssessmentsManagerEnhanced } from '@/components/due-diligence/AssessmentsManagerEnhanced';
import { FornecedoresManager } from '@/components/due-diligence/FornecedoresManager';
import { DueDiligenceDashboard } from '@/components/due-diligence/DueDiligenceDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';

export default function DueDiligence() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('fornecedores');
  const [assessmentFilter, setAssessmentFilter] = useState<{ fornecedorId?: string; fornecedorNome?: string } | null>(null);

  useEffect(() => {
    const handleNavigation = (event: CustomEvent) => {
      setActiveTab(event.detail.tab);
      if (event.detail.filter) {
        setAssessmentFilter(event.detail.filter);
      }
    };

    const handleCreateAssessmentFromTemplate = (event: CustomEvent) => {
      setActiveTab('assessments');
      setTimeout(() => {
        const createEvent = new CustomEvent('createAssessment', {
          detail: { templateId: event.detail.templateId, templateNome: event.detail.templateNome }
        });
        window.dispatchEvent(createEvent);
      }, 100);
    };
    
    window.addEventListener('navigateToDueDiligence', handleNavigation as EventListener);
    window.addEventListener('createAssessmentFromTemplate', handleCreateAssessmentFromTemplate as EventListener);
    
    return () => {
      window.removeEventListener('navigateToDueDiligence', handleNavigation as EventListener);
      window.removeEventListener('createAssessmentFromTemplate', handleCreateAssessmentFromTemplate as EventListener);
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Due Diligence"
        description="Gerencie avaliações digitais de fornecedores com questionários personalizados e scoring automático"
      />

      {/* Dashboard always visible on top */}
      <DueDiligenceDashboard />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
          <TabsTrigger value="assessments">Avaliações</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="fornecedores" className="space-y-6">
          <FornecedoresManager />
        </TabsContent>

        <TabsContent value="assessments" className="space-y-6">
          <AssessmentsManagerEnhanced filter={assessmentFilter} />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <TemplatesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
