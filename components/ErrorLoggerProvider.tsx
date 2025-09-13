'use client';

import { useEffect } from 'react';
import { errorLogger } from '@/utils/errorLogger';

export default function ErrorLoggerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize error logger on mount
    if (errorLogger) {
      console.log('Error logger initialized and ready');
    }
  }, []);

  return <>{children}</>;
}