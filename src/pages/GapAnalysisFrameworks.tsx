import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHeader } from '@/components/ui/page-header';
import { FrameworkCard } from '@/components/gap-analysis/FrameworkCard';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';

interface Framework {
  id: string;
  nome: string;
  versao: string;
  tipo_framework: string;
  descricao?: string;
  tipo?: string;
}

export default function GapAnalysisFrameworks() {
  const navigate = useNavigate();
  const { empresaId } = useEmpresaId();
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [requirementCounts, setRequirementCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFrameworks();
  }, []);

  const loadFrameworks = async () => {
    try {
      setLoading(true);

      // Buscar apenas frameworks globais (compartilhados entre todas as empresas)
      const { data: fws, error: fwError } = await supabase
        .from('gap_analysis_frameworks')
        .select('*')
        .is('empresa_id', null)
        .eq('is_template', true)
        .order('nome', { ascending: true });

      if (fwError) throw fwError;

      setFrameworks(fws || []);

      // Buscar contagem de requisitos para cada framework
      const counts: Record<string, number> = {};
      for (const fw of fws || []) {
        const { count, error: countError } = await supabase
          .from('gap_analysis_requirements')
          .select('*', { count: 'exact', head: true })
          .eq('framework_id', fw.id);

        if (!countError) {
          counts[fw.id] = count || 0;
        }
      }

      setRequirementCounts(counts);
    } catch (error) {
      console.error('Erro ao carregar frameworks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFrameworkClick = (framework: Framework) => {
    navigate(`/gap-analysis/framework/${framework.id}`);
  };

  if (loading) {
    return (
      <ErrorBoundary>
        <div className="space-y-6">
          <PageHeader
            title="Frameworks de Conformidade"
            description="Selecione um framework para avaliar a conformidade organizacional"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <PageHeader
          title="Frameworks de Conformidade"
          description="Selecione um framework para avaliar a conformidade organizacional"
        />

        {/* Framework Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {frameworks.map((framework) => (
            <FrameworkCard
              key={framework.id}
              id={framework.id}
              nome={framework.nome}
              versao={framework.versao}
              tipo_framework={framework.tipo_framework}
              descricao={framework.descricao}
              requirementCount={requirementCounts[framework.id] || 0}
              onClick={() => handleFrameworkClick(framework)}
            />
          ))}
        </div>

        {frameworks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhum framework disponível. Entre em contato com o administrador.
            </p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
