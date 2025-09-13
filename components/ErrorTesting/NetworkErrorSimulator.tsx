'use client';

import { useState } from 'react';

export default function NetworkErrorSimulator() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const simulateNetworkError = async (type: string) => {
    setIsLoading(true);
    setLastResult(null);

    try {
      switch (type) {
        case 'fetch-404':
          await fetch('/api/non-existent-endpoint');
          break;
        
        case 'fetch-500':
          await fetch('/api/test-error/500');
          break;
        
        case 'fetch-timeout':
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 2000);
          await fetch('/api/test-error/timeout', { 
            signal: controller.signal 
          });
          break;
        
        case 'cors-error':
          await fetch('https://httpstat.us/200', { 
            mode: 'cors',
            headers: { 'X-Custom-Header': 'test' }
          });
          break;
        
        case 'json-parse':
          const response = await fetch('/api/test-error/invalid-json');
          await response.json(); // This will fail
          break;
        
        case 'network-offline':
          // Simulate offline by trying to fetch from a non-existent domain
          await fetch('https://non-existent-domain-12345.com/api');
          break;
        
        default:
          throw new Error('Unknown network error type');
      }
      setLastResult('Unexpected success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLastResult(`Error caught: ${errorMessage}`);
      
      // Log to error logger if available
      if (window.errorLogger) {
        window.errorLogger.logError({
          message: `Network Error Test: ${errorMessage}`,
          errorType: 'network',
          additional: { testType: type, simulated: true }
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const networkTests = [
    {
      id: 'fetch-404',
      label: '404 Not Found',
      description: 'Fetch non-existent API endpoint'
    },
    {
      id: 'fetch-500',
      label: '500 Server Error',
      description: 'Trigger server error response'
    },
    {
      id: 'fetch-timeout',
      label: 'Request Timeout',
      description: 'Abort request after 2 seconds'
    },
    {
      id: 'cors-error',
      label: 'CORS Error',
      description: 'Cross-origin request failure'
    },
    {
      id: 'json-parse',
      label: 'JSON Parse Error',
      description: 'Invalid JSON response parsing'
    },
    {
      id: 'network-offline',
      label: 'Network Offline',
      description: 'Simulate offline network condition'
    }
  ];

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Network Error Simulator
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          Test various network error scenarios to verify error handling
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {networkTests.map((test) => (
          <div
            key={test.id}
            className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
          >
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              {test.label}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              {test.description}
            </p>
            <button
              onClick={() => simulateNetworkError(test.id)}
              disabled={isLoading}
              className="w-full px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {isLoading ? 'Testing...' : 'Test'}
            </button>
          </div>
        ))}
      </div>

      {/* Results */}
      {lastResult && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            Last Test Result:
          </h3>
          <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
            {lastResult}
          </pre>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
          Testing Notes:
        </h4>
        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Network errors are automatically logged to the error logger</li>
          <li>• Check browser Network tab to see actual HTTP responses</li>
          <li>• Some tests may take a few seconds to complete</li>
          <li>• CORS errors are browser-dependent and may vary</li>
        </ul>
      </div>
    </div>
  );
}