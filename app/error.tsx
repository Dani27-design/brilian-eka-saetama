'use client';

import { useEffect } from 'react';
import { errorLogger } from '@/utils/errorLogger';
import { sanitizeErrorMessage, generateErrorId } from '@/utils/errorSanitizer';
import ErrorLayout from '@/components/ErrorPages/ErrorLayout';
import Error500 from '@/components/ErrorPages/Error500';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error for mobile debugging with sanitized data
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
          global: true,
          sanitized: true
        }
      });
    }
  }, [error]);

  return (
    <html>
      <body className="font-inter">
        <ErrorLayout errorCode="500" showLines={true}>
          <Error500 
            isAdmin={false}
            errorId={error.digest}
          />
        </ErrorLayout>
      </body>
    </html>
  );
}