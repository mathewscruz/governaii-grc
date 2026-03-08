import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, measurePerformance } from '@/lib/logger';

interface QueryOptions {
  cacheKey?: string;
  cacheDuration?: number; // em minutos
  refetchOnMount?: boolean;
  staleTime?: number; // em minutos
}

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const queryCache = new Map<string, { data: any; timestamp: number }>();

export function useOptimizedQuery<T>(
  queryFn: () => Promise<{ data: T; error: any }>,
  dependencies: any[] = [],
  options: QueryOptions = {}
) {
  const {
    cacheKey,
    cacheDuration = 5, // 5 minutos por padrão
    refetchOnMount = true,
    staleTime = 1 // 1 minuto por padrão
  } = options;

  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: true,
    error: null,
    lastFetched: null
  });

  const isStale = useCallback(() => {
    if (!state.lastFetched) return true;
    const now = Date.now();
    const staleTimeMs = staleTime * 60 * 1000;
    return (now - state.lastFetched) > staleTimeMs;
  }, [state.lastFetched, staleTime]);

  const getCachedData = useCallback(() => {
    if (!cacheKey) return null;
    
    const cached = queryCache.get(cacheKey);
    if (!cached) return null;
    
    const now = Date.now();
    const cacheExpiry = cacheDuration * 60 * 1000;
    
    if ((now - cached.timestamp) > cacheExpiry) {
      queryCache.delete(cacheKey);
      return null;
    }
    
    return cached.data;
  }, [cacheKey, cacheDuration]);

  const setCachedData = useCallback((data: T) => {
    if (cacheKey) {
      queryCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
    }
  }, [cacheKey]);

  const executeQuery = useCallback(async (force = false, retryCount = 0) => {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 segundo

    // Verificar cache primeiro se não forçado
    if (!force) {
      const cachedData = getCachedData();
      if (cachedData) {
        setState(prev => ({
          ...prev,
          data: cachedData,
          loading: false,
          error: null,
          lastFetched: Date.now()
        }));
        logger.debug('Query served from cache', { cacheKey, module: 'cache' });
        return;
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      logger.debug('Executing optimized query', { cacheKey, force, retryCount });
      
      const result = await measurePerformance(
        `query_${cacheKey || 'unnamed'}`,
        queryFn,
        { cacheKey, module: 'query', retryCount }
      );

      if (result.error) {
        throw new Error(result.error.message || 'Query failed');
      }

      setState({
        data: result.data,
        loading: false,
        error: null,
        lastFetched: Date.now()
      });

      // Armazenar no cache
      setCachedData(result.data);

      logger.info('Query executed successfully', { 
        cacheKey, 
        hasData: !!result.data,
        module: 'query',
        retryCount
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isNetworkError = errorMessage.includes('Failed to fetch') || errorMessage.includes('503');
      
      logger.error('Query execution failed', {
        error: errorMessage,
        cacheKey,
        module: 'query',
        retryCount,
        isNetworkError
      });

      // Retry logic para erros de rede
      if (isNetworkError && retryCount < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCount); // Backoff exponencial
        logger.info('Retrying query after delay', { cacheKey, delay, retryCount: retryCount + 1 });
        
        setTimeout(() => {
          executeQuery(force, retryCount + 1);
        }, delay);
        return;
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  }, [queryFn, getCachedData, setCachedData, cacheKey]);

  const refetch = useCallback(() => executeQuery(true), [executeQuery]);

  useEffect(() => {
    if (refetchOnMount || isStale()) {
      executeQuery();
    }
  }, [...dependencies, refetchOnMount]);

  return {
    ...state,
    refetch,
    isStale: isStale()
  };
}