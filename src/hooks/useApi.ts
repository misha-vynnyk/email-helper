/**
 * useApi Hook
 * Generic hook for API data fetching with loading and error states
 */

import { useCallback,useEffect, useState } from "react";

import { logger } from "../utils/logger";

interface UseApiOptions<T> {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  autoFetch?: boolean;
}

export function useApi<T>(apiFunction: () => Promise<T>, options: UseApiOptions<T> = {}) {
  const { initialData, onSuccess, onError, autoFetch = true } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction();
      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      onError?.(error);
      logger.error("useApi", "API call failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, onSuccess, onError]);

  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally fetch once on mount / when autoFetch flips; `fetch` is excluded since callers may pass unmemoized apiFunction/onSuccess/onError, which would otherwise re-trigger fetch on every render
  }, [autoFetch]);

  const refetch = useCallback(() => {
    return fetch();
  }, [fetch]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}
