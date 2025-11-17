/**
 * useApi Hook
 * Generic hook for API data fetching with loading and error states
 */

import { useState, useEffect, useCallback } from "react";

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
