'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthErrorSimulator() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const router = useRouter();

  const simulateAuthError = async (type: string) => {
    setIsLoading(true);
    setLastResult(null);

    try {
      switch (type) {
        case 'expired-token':
          // Simulate expired token by clearing localStorage
          localStorage.removeItem('firebase-auth-token');
          localStorage.removeItem('firebase-user');
          setLastResult('Token cleared - try accessing protected page');
          break;
        
        case 'invalid-session':
          // Simulate invalid session
          localStorage.setItem('firebase-auth-token', 'invalid-token-12345');
          setLastResult('Invalid token set - try accessing protected page');
          break;
        
        case 'permission-denied':
          // Test Firestore permission denied
          await fetch('/api/test-auth/permission-denied');
          break;
        
        case 'unauthorized-api':
          // Test unauthorized API call
          await fetch('/api/test-auth/unauthorized');
          break;
        
        case 'force-logout':
          // Force logout and redirect
          localStorage.clear();
          sessionStorage.clear();
          router.push('/admin/auth/signin');
          setLastResult('Forced logout - redirecting to signin');
          break;
        
        case 'corrupt-session':
          // Corrupt session data
          localStorage.setItem('firebase-user', '{ invalid json');
          localStorage.setItem('firebase-auth-token', 'corrupted-token-data');
          setLastResult('Session data corrupted - try refreshing page');
          break;
        
        default:
          throw new Error('Unknown auth error type');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLastResult(`Error: ${errorMessage}`);
      
      // Log to error logger if available
      if (window.errorLogger) {
        window.errorLogger.logError({
          message: `Auth Error Test: ${errorMessage}`,
          errorType: 'authentication',
          additional: { testType: type, simulated: true }
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const authTests = [
    {
      id: 'expired-token',
      label: 'Expired Token',
      description: 'Clear auth token to simulate expiration',
      warning: 'Will log you out'
    },
    {
      id: 'invalid-session',
      label: 'Invalid Session',
      description: 'Set invalid token in localStorage',
      warning: 'May require re-login'
    },
    {
      id: 'permission-denied',
      label: 'Permission Denied',
      description: 'Simulate Firestore permission error',
      warning: null
    },
    {
      id: 'unauthorized-api',
      label: 'Unauthorized API',
      description: 'Test 401 unauthorized response',
      warning: null
    },
    {
      id: 'force-logout',
      label: 'Force Logout',
      description: 'Clear all session data and redirect',
      warning: 'Will log you out'
    },
    {
      id: 'corrupt-session',
      label: 'Corrupt Session',
      description: 'Corrupt localStorage session data',
      warning: 'May require refresh'
    }
  ];

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Authentication Error Simulator
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          Test authentication and authorization error scenarios
        </p>
        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200">
          ⚠️ Some tests will log you out or require page refresh
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {authTests.map((test) => (
          <div
            key={test.id}
            className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {test.label}
              </h3>
              {test.warning && (
                <span className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded">
                  {test.warning}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              {test.description}
            </p>
            <button
              onClick={() => simulateAuthError(test.id)}
              disabled={isLoading}
              className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
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
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {lastResult}
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
          Quick Recovery Actions:
        </h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              setLastResult('All local storage cleared');
            }}
            className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
          >
            Clear All Storage
          </button>
          <button
            onClick={() => window.location.reload()}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
          >
            Refresh Page
          </button>
          <button
            onClick={() => router.push('/admin/auth/signin')}
            className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}