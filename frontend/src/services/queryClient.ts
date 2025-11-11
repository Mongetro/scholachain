// frontend/src/services/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

/**
 * React Query client configuration
 * Centralized configuration for all API queries and mutations
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
