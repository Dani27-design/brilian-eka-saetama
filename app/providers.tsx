// app/providers.tsx
"use client"; // Add this line to mark as Client Component

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react"; // Import useState
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  // Create a client instance for each browser session
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
