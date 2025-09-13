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
          globalError: true,
          sanitized: true
        }
      });
    }
  }, [error]);

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Application Error - PT Brilian Eka Saetama</title>
      </head>
      <body className="font-inter">
        <ErrorLayout errorCode="500" showLines={true}>
          <Error500 
            isAdmin={false}
            errorId={error.digest}
          />
          {/* Reset button at component level */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={reset}
              className="rounded-full border border-primary bg-transparent px-6 py-3 font-medium text-primary transition-all hover:bg-primary hover:text-white"
            >
              Reset Application
            </button>
          </div>
        </ErrorLayout>
      </body>
    </html>
  );
}