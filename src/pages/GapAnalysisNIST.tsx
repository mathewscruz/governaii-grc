import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { NISTScoreDashboard } from "@/components/gap-analysis/nist/NISTScoreDashboard";
import { NISTRequirementsTable } from "@/components/gap-analysis/nist/NISTRequirementsTable";
import { useNISTScore } from "@/hooks/useNISTScore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEmpresaId } from "@/hooks/useEmpresaId";

export default function GapAnalysisNIST() {
  const navigate = useNavigate();
  const { empresaId } = useEmpresaId();
  const [frameworkId, setFrameworkId] = useState<string | null>(null);
  const [loadingFramework, setLoadingFramework] = useState(true);

  // Buscar o framework NIST da empresa
  useEffect(() => {
    const loadNISTFramework = async () => {
      if (!empresaId) return;

      try {
        const { data, error } = await supabase
          .from('gap_analysis_frameworks')
          .select('id')
          .eq('nome', 'NIST CSF')
          .limit(1)
          .single();

        if (error) throw error;

        if (data) {
          setFrameworkId(data.id);
        } else {
          toast.error('Framework NIST CSF 2.0 não encontrado');
        }
      } catch (error: any) {
        console.error('Error loading NIST framework:', error);
        toast.error('Erro ao carregar framework NIST');
      } finally {
        setLoadingFramework(false);
      }
    };

    loadNISTFramework();
  }, [empresaId]);

  const { data: scoreData, loading: loadingScore, refetch } = useNISTScore(frameworkId || '');

  const handleExport = () => {
    toast.info('Funcionalidade de exportação em desenvolvimento');
  };

  if (loadingFramework) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!frameworkId) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/gap-analysis/frameworks')}
          className="mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar aos Frameworks
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Framework NIST CSF 2.0 não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/gap-analysis/frameworks')}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <PageHeader
        title="NIST Cybersecurity Framework 2.0"
        description="Avaliação completa de maturidade em segurança cibernética baseada no NIST CSF 2.0"
        actions={
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        }
      />

      {loadingScore ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : scoreData ? (
        <>
          <NISTScoreDashboard {...scoreData} />
          <NISTRequirementsTable 
            frameworkId={frameworkId} 
            onStatusChange={refetch}
          />
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Erro ao carregar dados do NIST</p>
        </div>
      )}
    </div>
  );
}
