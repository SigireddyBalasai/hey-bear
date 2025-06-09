import { useCallback, useState } from 'react';

/**
 * Custom hook for managing loading states
 * Consolidates the repetitive loading state patterns found across the codebase
 */
export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);

  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const withLoading = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    try {
      setIsLoading(true);
      const result = await asyncFn();
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
    setIsLoading,
  };
}

/**
 * Hook for managing multiple loading states
 * Useful when you have different loading states for different operations
 */
export function useMultipleLoadingStates<T extends string>(
  keys: readonly T[],
  initialStates?: Partial<Record<T, boolean>>
): {
  loadingStates: Record<T, boolean>;
  setLoadingState: (key: T, loading: boolean) => void;
  isAnyLoading: boolean;
  withLoading: <R>(key: T, asyncFn: () => Promise<R>) => Promise<R>;
} {
  const [loadingStates, setLoadingStates] = useState<Record<T, boolean>>(
    keys.reduce(
      (acc, key) => ({
        ...acc,
        [key]: initialStates?.[key] ?? false,
      }),
      {} as Record<T, boolean>
    )
  );

  const setLoadingState = useCallback((key: T, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  const withLoading = useCallback(
    async <R>(key: T, asyncFn: () => Promise<R>): Promise<R> => {
      try {
        setLoadingState(key, true);
        const result = await asyncFn();
        return result;
      } finally {
        setLoadingState(key, false);
      }
    },
    [setLoadingState]
  );

  return {
    loadingStates,
    setLoadingState,
    isAnyLoading,
    withLoading,
  };
}
