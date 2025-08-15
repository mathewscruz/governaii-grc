import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DueDiligenceStats {
  totalTemplates: number;
  totalAssessments: number;
  activeAssessments: number;
  pendingAssessments: number;
  completedAssessments: number;
  expiredAssessments: number;
  totalFornecedores: number;
  assessmentsThisMonth: number;
  averageScore: number;
}

export const useDueDiligenceStats = () => {
  return useQuery({
    queryKey: ['due-diligence-stats'],
    queryFn: async (): Promise<DueDiligenceStats> => {
      try {
        // Buscar todos os templates (não apenas ativos)
        const { data: templates, error: templatesError } = await supabase
          .from('due_diligence_templates')
          .select('id, ativo');

        if (templatesError) {
          console.error('Erro ao buscar templates:', templatesError);
          throw templatesError;
        }

        // Buscar assessments com todos os dados necessários
        const { data: assessments, error } = await supabase
          .from('due_diligence_assessments')
          .select('status, created_at, data_expiracao, fornecedor_email, score_final');

        if (error) {
          console.error('Erro ao buscar assessments:', error);
          throw error;
        }

        console.log('Templates encontrados:', templates);
        console.log('Assessments encontrados:', assessments);

        // Contar fornecedores únicos nos assessments
        const uniqueFornecedores = new Set(
          assessments?.map(a => a.fornecedor_email).filter(Boolean) || []
        ).size;

        const total = assessments?.length || 0;
        
        // Verificar diferentes valores de status
        const statusCounts = assessments?.reduce((acc, a) => {
          acc[a.status] = (acc[a.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};
        
        console.log('Status counts:', statusCounts);

        // Usar diferentes variações de status
        const active = assessments?.filter(a => 
          a.status === 'ativo' || a.status === 'em_andamento' || a.status === 'enviado'
        ).length || 0;
        
        const pending = assessments?.filter(a => 
          a.status === 'pendente' || a.status === 'em_andamento' || a.status === 'enviado'
        ).length || 0;
        
        const completed = assessments?.filter(a => 
          a.status === 'concluido' || a.status === 'finalizado'
        ).length || 0;
        
        const hoje = new Date();
        // Assessments expirados
        const expired = assessments?.filter(a => {
          return a.data_expiracao && new Date(a.data_expiracao) < hoje && 
                 !['concluido', 'finalizado'].includes(a.status);
        }).length || 0;

        // Assessments deste mês
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const thisMonth = assessments?.filter(a => {
          return new Date(a.created_at) >= inicioMes;
        }).length || 0;

        // Calcular score médio - ser mais flexível com os scores
        const completedWithScores = assessments?.filter(a => 
          ['concluido', 'finalizado'].includes(a.status) && 
          a.score_final != null && 
          a.score_final > 0
        ) || [];
        
        console.log('Assessments concluídos com score:', completedWithScores);
        
        const averageScore = completedWithScores.length > 0 
          ? completedWithScores.reduce((sum, a) => sum + (a.score_final || 0), 0) / completedWithScores.length
          : 0;

        const result = {
          totalTemplates: templates?.length || 0,
          totalAssessments: total,
          activeAssessments: active,
          pendingAssessments: pending,
          completedAssessments: completed,
          expiredAssessments: expired,
          totalFornecedores: uniqueFornecedores,
          assessmentsThisMonth: thisMonth,
          averageScore
        };

        console.log('Resultado final das estatísticas:', result);
        return result;
      } catch (error) {
        console.error('Erro completo:', error);
        throw error;
      }
    },
  });
};