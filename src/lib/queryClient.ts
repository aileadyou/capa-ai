import { QueryClient } from "@tanstack/react-query";

// Single shared client. Data is server-authoritative now, so we keep a short
// stale window and let mutations invalidate precisely.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
