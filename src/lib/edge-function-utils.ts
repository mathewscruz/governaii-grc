import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InvokeOptions {
  body?: Record<string, unknown>;
  /** Custom error messages per status code */
  errorMessages?: Partial<Record<number, string>>;
  /** Whether to show toast on error (default true) */
  showToast?: boolean;
}

interface InvokeResult<T = unknown> {
  data: T | null;
  error: Error | null;
}

const DEFAULT_ERROR_MESSAGES: Record<number, string> = {
  402: 'Créditos de IA esgotados. Atualize seu plano para continuar.',
  429: 'Muitas requisições. Aguarde um momento e tente novamente.',
  401: 'Sessão expirada. Faça login novamente.',
  403: 'Você não tem permissão para esta ação.',
  500: 'Erro interno no servidor. Tente novamente.',
};

/**
 * Centralized wrapper for invoking Supabase Edge Functions
 * with consistent error handling across the application.
 */
export async function invokeEdgeFunction<T = unknown>(
  functionName: string,
  options: InvokeOptions = {}
): Promise<InvokeResult<T>> {
  const { body, errorMessages = {}, showToast = true } = options;

  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: body || {},
    });

    if (error) {
      const statusCode = (error as any)?.status || 500;
      const messages = { ...DEFAULT_ERROR_MESSAGES, ...errorMessages };
      const message = messages[statusCode] || `Erro ao executar ${functionName}.`;

      if (showToast) {
        toast.error(message);
      }

      return { data: null, error: new Error(message) };
    }

    return { data: data as T, error: null };
  } catch (err) {
    const isNetworkError = !navigator.onLine || 
      (err instanceof TypeError && err.message.includes('fetch'));
    
    const message = isNetworkError
      ? 'Sem conexão com o servidor. Verifique sua internet.'
      : `Erro inesperado ao executar ${functionName}.`;

    if (showToast) {
      toast.error(message);
    }

    return { data: null, error: err instanceof Error ? err : new Error(message) };
  }
}
