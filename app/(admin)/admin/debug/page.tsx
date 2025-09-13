'use client';

import { useState, useEffect } from 'react';
import { errorLogger, type ErrorLog } from '@/utils/errorLogger';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/db/firebase/firebaseConfig';
import { RenderError, EffectError, EventError, AsyncError } from '@/components/ErrorTesting/ErrorSimulator';
import NetworkErrorSimulator from '@/components/ErrorTesting/NetworkErrorSimulator';
import AuthErrorSimulator from '@/components/ErrorTesting/AuthErrorSimulator';

export default function DebugPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'logs' | 'testing'>('logs');
  const [errorStats, setErrorStats] = useState<{[key: string]: number}>({});
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        router.push('/admin/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (isAuthenticated && errorLogger) {
      const currentLogs = errorLogger.getLogs();
      setLogs(currentLogs);
      setDeviceInfo(errorLogger.getDeviceInfo());
      
      // Calculate error statistics
      const stats = currentLogs.reduce((acc, log) => {
        acc[log.errorType] = (acc[log.errorType] || 0) + 1;
        return acc;
      }, {} as {[key: string]: number});
      setErrorStats(stats);
    }
  }, [isAuthenticated]);

  // Auto-refresh logs every 5 seconds when on logs tab
  useEffect(() => {
    if (activeTab === 'logs' && isAuthenticated && errorLogger) {
      const interval = setInterval(() => {
        if (errorLogger) {
          const currentLogs = errorLogger.getLogs();
          setLogs(currentLogs);
          
          const stats = currentLogs.reduce((acc, log) => {
            acc[log.errorType] = (acc[log.errorType] || 0) + 1;
            return acc;
          }, {} as {[key: string]: number});
          setErrorStats(stats);
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [activeTab, isAuthenticated]);

  const handleClearLogs = () => {
    if (errorLogger && confirm('Are you sure you want to clear all error logs?')) {
      errorLogger.clearLogs();
      setLogs([]);
    }
  };

  const handleExportLogs = () => {
    if (errorLogger) {
      const data = errorLogger.exportLogs();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `error-logs-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleRefresh = () => {
    if (errorLogger) {
      const currentLogs = errorLogger.getLogs();
      setLogs(currentLogs);
      setDeviceInfo(errorLogger.getDeviceInfo());
      
      const stats = currentLogs.reduce((acc, log) => {
        acc[log.errorType] = (acc[log.errorType] || 0) + 1;
        return acc;
      }, {} as {[key: string]: number});
      setErrorStats(stats);
    }
  };

  const getErrorSeverityColor = (errorType: string) => {
    const colors = {
      'error': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-700',
      'unhandledRejection': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-700',
      'console.error': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700',
      'network': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-700',
      'authentication': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700'
    };
    return colors[errorType as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600';
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
              Error Debug Console
            </h1>
            
            {/* Tab Navigation */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'logs'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Error Logs ({logs.length})
              </button>
              <button
                onClick={() => setActiveTab('testing')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'testing'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Error Testing
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          {activeTab === 'logs' && Object.keys(errorStats).length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Error Statistics
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(errorStats).map(([type, count]) => (
                  <span
                    key={type}
                    className={`px-2 py-1 rounded text-xs font-medium border ${getErrorSeverityColor(type)}`}
                  >
                    {type}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Content based on active tab */}
          {activeTab === 'logs' && (
            <>
              {/* Device Info */}
              {deviceInfo && (
                <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
                    Device Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Platform:</span>{' '}
                      <span className="text-gray-900 dark:text-white">{deviceInfo.platform}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Screen:</span>{' '}
                      <span className="text-gray-900 dark:text-white">{deviceInfo.screenResolution}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Viewport:</span>{' '}
                      <span className="text-gray-900 dark:text-white">{deviceInfo.viewportSize}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Online:</span>{' '}
                      <span className="text-gray-900 dark:text-white">{deviceInfo.onLine ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-gray-600 dark:text-gray-400">User Agent:</span>{' '}
                      <span className="text-gray-900 dark:text-white text-xs break-all">
                        {deviceInfo.userAgent}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 mb-6">
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Refresh Logs
                </button>
                <button
                  onClick={handleExportLogs}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  disabled={logs.length === 0}
                >
                  Export Logs
                </button>
                <button
                  onClick={handleClearLogs}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  disabled={logs.length === 0}
                >
                  Clear All Logs
                </button>
                <a
                  href="/admin/error-test"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  Full Testing Suite
                </a>
              </div>

              {/* Error Count */}
              <div className="mb-4">
                <span className="text-gray-600 dark:text-gray-400">
                  Total Errors: <span className="font-bold text-gray-900 dark:text-white">{logs.length}</span>
                  <span className="ml-4 text-xs">Auto-refreshes every 5 seconds</span>
                </span>
              </div>
            </>
          )}
          
          {activeTab === 'testing' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Quick Error Testing
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                  Test error components directly from the debug console. All errors will be logged and appear in the Error Logs tab.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RenderError delay={0} />
                  <EffectError delay={1000} />
                  <EventError delay={500} />
                  <AsyncError delay={300} />
                </div>
              </div>
              
              <NetworkErrorSimulator />
              <AuthErrorSimulator />
              
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
                  Additional Testing
                </h3>
                <p className="text-sm text-green-800 dark:text-green-200 mb-4">
                  For comprehensive testing including error page navigation and API testing, visit the full testing suite.
                </p>
                <a
                  href="/admin/error-test"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Open Full Testing Suite →
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Error Logs - Only show when logs tab is active */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  No error logs found. Errors will appear here when they occur.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Try the Error Testing tab to generate test errors.
                </p>
              </div>
            ) : (
              logs
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((log) => (
                <div
                  key={log.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-l-4 border-gray-200 dark:border-gray-600 p-4"
                  style={{
                    borderLeftColor: log.errorType === 'error' ? '#ef4444' : 
                                   log.errorType === 'unhandledRejection' ? '#f97316' :
                                   log.errorType === 'console.error' ? '#eab308' :
                                   log.errorType === 'network' ? '#a855f7' :
                                   log.errorType === 'authentication' ? '#3b82f6' : '#6b7280'
                  }}
                >
                  <div className="flex flex-wrap justify-between items-start mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getErrorSeverityColor(log.errorType)}`}>
                      {log.errorType}
                    </span>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                      {log.additional?.errorId && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          ID: {log.additional.errorId.slice(0, 8)}...
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="font-medium text-gray-900 dark:text-white break-words">
                      {log.message}
                    </p>
                  </div>

                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-3 break-all">
                    <span className="font-medium">URL:</span> {log.url}
                  </div>

                  {/* Additional tags for better categorization */}
                  {log.additional && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {log.additional.sanitized && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 text-xs rounded">
                          Sanitized
                        </span>
                      )}
                      {log.additional.simulated && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 text-xs rounded">
                          Test Error
                        </span>
                      )}
                      {log.additional.adminError && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 text-xs rounded">
                          Admin
                        </span>
                      )}
                    </div>
                  )}

                  {log.stack && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                        View Stack Trace
                      </summary>
                      <pre className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-all border">
                        {log.stack}
                      </pre>
                    </details>
                  )}

                  {log.additional && Object.keys(log.additional).length > 0 && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                        Additional Information
                      </summary>
                      <pre className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-xs overflow-x-auto border">
                        {JSON.stringify(log.additional, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}