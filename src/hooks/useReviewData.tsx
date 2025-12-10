import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "./useEmpresaId";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export const useReviewData = () => {
  const { empresaId } = useEmpresaId();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const invalidateCache = () => {
    queryClient.invalidateQueries({ queryKey: [`review-stats-${empresaId}`] });
    queryClient.invalidateQueries({ queryKey: [`reviews-${empresaId}`] });
    queryClient.invalidateQueries({ queryKey: [`review-items-`] });
  };

  const createReview = async (data: any) => {
    try {
      const { data: review, error } = await supabase
        .from("access_reviews")
        .insert({
          ...data,
          empresa_id: empresaId,
        })
        .select()
        .single();

      if (error) throw error;

      // Buscar contas do sistema e criar itens
      const { data: contas, error: contasError } = await supabase
        .from("contas_privilegiadas")
        .select("*")
        .eq("sistema_id", data.sistema_id)
        .eq("status", "ativo");

      if (contasError) throw contasError;

      if (contas && contas.length > 0) {
        const items = contas.map((conta) => ({
          review_id: review.id,
          conta_id: conta.id,
          usuario_beneficiario: conta.usuario_beneficiario,
          email_beneficiario: conta.email_beneficiario,
          tipo_acesso: conta.tipo_acesso,
          nivel_privilegio: conta.nivel_privilegio,
          data_concessao: conta.data_concessao,
          data_expiracao: conta.data_expiracao,
          justificativa_original: conta.justificativa_negocio,
        }));

        const { error: itemsError } = await supabase
          .from("access_review_items")
          .insert(items);

        if (itemsError) throw itemsError;

        // Atualizar total de contas
        await supabase
          .from("access_reviews")
          .update({ total_contas: contas.length })
          .eq("id", review.id);
      }

      invalidateCache();
      toast({
        title: "Sucesso",
        description: "Revisão criada com sucesso",
      });

      return review;
    } catch (error: any) {
      toast({
        title: "Erro ao criar revisão",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateReview = async (id: string, data: any) => {
    try {
      const { error } = await supabase
        .from("access_reviews")
        .update(data)
        .eq("id", id);

      if (error) throw error;

      invalidateCache();
      toast({
        title: "Sucesso",
        description: "Revisão atualizada com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar revisão",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteReview = async (id: string) => {
    try {
      const { error } = await supabase
        .from("access_reviews")
        .delete()
        .eq("id", id);

      if (error) throw error;

      invalidateCache();
      toast({
        title: "Sucesso",
        description: "Revisão excluída com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir revisão",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateReviewItem = async (itemId: string, data: any) => {
    try {
      const { error } = await supabase
        .from("access_review_items")
        .update({
          ...data,
          data_revisao: new Date().toISOString(),
        })
        .eq("id", itemId);

      if (error) throw error;

      invalidateCache();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar item",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const finalizeReview = async (reviewId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("finalize-review", {
        body: { reviewId },
      });

      if (error) throw error;

      invalidateCache();
      toast({
        title: "Sucesso",
        description: "Revisão finalizada com sucesso",
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Erro ao finalizar revisão",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    createReview,
    updateReview,
    deleteReview,
    updateReviewItem,
    finalizeReview,
  };
};
