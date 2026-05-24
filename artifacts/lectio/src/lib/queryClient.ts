import { QueryClient } from "@tanstack/react-query";

export const queryClient: QueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 402) return false;
        return failureCount < 2;
      },
    },
  },
});
