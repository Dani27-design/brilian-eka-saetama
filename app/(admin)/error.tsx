'use client';

import { useEffect } from 'react';
import { errorLogger } from '@/utils/errorLogger';
import { sanitizeErrorMessage, generateErrorId } from '@/utils/errorSanitizer';
import ErrorLayout from '@/components/ErrorPages/ErrorLayout';
import Error500 from '@/components/ErrorPages/Error500';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error for debugging with sanitized data
    if (errorLogger) {
      const errorId = error.digest || generateErrorId();
      errorLogger.logError({
        message: sanitizeErrorMessage(error.message),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        errorType: 'error',
        additional: {
          errorId,
          digest: error.digest,
          name: error.name,
          adminError: true,
          sanitized: true
        }
      });
    }
  }, [error]);

  return (
    <ErrorLayout errorCode="500" showLines={false}>
      <Error500 
        isAdmin={true}
        errorId={error.digest}
      />
    </ErrorLayout>
  );
}