// app/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ReactNode } from "react";
import { NavigationProvider } from "@/context/NavigationContext";
import LoadingModal from "@/components/LoadingModal";

export function Providers({ children }: { children: ReactNode }) {
  // Create a client instance for each browser session
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationProvider>
        {children}
        <LoadingModal />
      </NavigationProvider>
    </QueryClientProvider>
  );
}
