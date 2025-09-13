'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ErrorTestPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleErrorTest = async (type: string) => {
    setIsLoading(type);
    try {
      switch (type) {
        case 'client-error':
          throw new Error('This is a test client-side error');
        
        case 'api-500':
          await fetch('/api/test-error/500');
          break;
        
        case 'api-404':
          await fetch('/api/test-error/404');
          break;
        
        case 'api-503':
          await fetch('/api/test-error/503');
          break;
        
        case 'network-timeout':
          await fetch('/api/test-error/timeout');
          break;
        
        case 'invalid-json':
          await fetch('/api/test-error/invalid-json');
          break;
        
        case 'navigate-404':
          router.push('/admin/non-existent-page');
          break;
        
        case 'navigate-public-404':
          router.push('/non-existent-page');
          break;
        
        case 'console-error':
          console.error('Test console error for error logging');
          break;
        
        case 'unhandled-rejection':
          Promise.reject(new Error('Test unhandled promise rejection'));
          break;
        
        default:
          throw new Error(`Unknown error type: ${type}`);
      }
    } catch (error) {
      console.error('Test error triggered:', error);
    } finally {
      setTimeout(() => setIsLoading(null), 1000);
    }
  };

  const testButtons = [
    {
      category: 'Client-Side Errors',
      tests: [
        { id: 'client-error', label: 'Throw Client Error', description: 'Triggers React Error Boundary' },
        { id: 'console-error', label: 'Console Error', description: 'Logs error to console and error logger' },
        { id: 'unhandled-rejection', label: 'Unhandled Promise', description: 'Creates unhandled promise rejection' },
      ]
    },
    {
      category: 'API Errors',
      tests: [
        { id: 'api-500', label: 'API 500 Error', description: 'Internal server error response' },
        { id: 'api-404', label: 'API 404 Error', description: 'Not found API response' },
        { id: 'api-503', label: 'API 503 Error', description: 'Service unavailable response' },
        { id: 'network-timeout', label: 'Network Timeout', description: 'Simulates network timeout' },
        { id: 'invalid-json', label: 'Invalid JSON', description: 'Malformed JSON response' },
      ]
    },
    {
      category: 'Navigation Errors',
      tests: [
        { id: 'navigate-404', label: 'Admin 404 Page', description: 'Navigate to non-existent admin page' },
        { id: 'navigate-public-404', label: 'Public 404 Page', description: 'Navigate to non-existent public page' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Error Page Testing Interface
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Test different error scenarios to see how the error pages and logging system work.
            </p>
          </div>

          {/* Quick Links */}
          <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Quick Access
            </h2>
            <div className="flex flex-wrap gap-2">
              <a
                href="/admin/debug"
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
              >
                View Error Logs
              </a>
              <a
                href="/non-existent-page"
                target="_blank"
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
              >
                Public 404 Page
              </a>
              <a
                href="/admin/non-existent-page"
                target="_blank"
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors"
              >
                Admin 404 Page
              </a>
            </div>
          </div>

          {/* Error Test Buttons */}
          <div className="space-y-8">
            {testButtons.map((category) => (
              <div key={category.category}>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {category.category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.tests.map((test) => (
                    <div
                      key={test.id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                    >
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        {test.label}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                        {test.description}
                      </p>
                      <button
                        onClick={() => handleErrorTest(test.id)}
                        disabled={isLoading === test.id}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                      >
                        {isLoading === test.id ? 'Triggering...' : 'Trigger Error'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h2 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              Testing Instructions
            </h2>
            <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
              <li>• <strong>Client Errors:</strong> Will trigger React Error Boundaries</li>
              <li>• <strong>API Errors:</strong> Test backend error responses</li>
              <li>• <strong>Navigation Errors:</strong> Open in new tabs to see 404 pages</li>
              <li>• <strong>Error Logging:</strong> Check /admin/debug after triggering errors</li>
              <li>• <strong>Mobile Testing:</strong> Test on mobile devices to verify responsive design</li>
            </ul>
          </div>

          {/* Developer Notes */}
          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Developer Notes
            </h2>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• All errors are sanitized to remove sensitive information</li>
              <li>• Error logging persists in localStorage for mobile debugging</li>
              <li>• React Error Boundaries catch component-level errors</li>
              <li>• Global error handlers catch unhandled errors</li>
              <li>• Error pages are responsive and accessible</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}