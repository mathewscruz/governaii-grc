import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdherenceAssessmentView } from '@/components/gap-analysis/adherence/AdherenceAssessmentView';
import { AdherenceResultView } from '@/components/gap-analysis/adherence/AdherenceResultView';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHeader } from '@/components/ui/page-header';

export default function GapAnalysisAderencia() {
  const [selectedAdherenceAssessment, setSelectedAdherenceAssessment] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'list' | 'result'>('list');

  const renderBackButton = () => (
    <Button 
      variant="ghost" 
      onClick={() => {
        setCurrentView('list');
        setSelectedAdherenceAssessment(null);
      }}
      className="mb-4"
    >
      <ChevronLeft className="h-4 w-4 mr-2" />
      Voltar para Lista
    </Button>
  );

  if (currentView === 'result' && selectedAdherenceAssessment) {
    return (
      <ErrorBoundary>
        <div className="container mx-auto p-6 space-y-6">
          {renderBackButton()}
          <AdherenceResultView
            assessment={selectedAdherenceAssessment}
            onBack={() => setCurrentView('list')}
          />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <PageHeader
          title="Avaliação de Aderência"
          description="Analise documentos corporativos com IA comparando com frameworks regulatórios"
        />

        <AdherenceAssessmentView
          onViewResult={(assessment) => {
            setSelectedAdherenceAssessment(assessment);
            setCurrentView('result');
          }}
        />
      </div>
    </ErrorBoundary>
  );
}
