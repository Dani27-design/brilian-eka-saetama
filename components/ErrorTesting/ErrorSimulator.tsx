'use client';

import { useState, useEffect } from 'react';

interface ErrorSimulatorProps {
  errorType?: 'render' | 'useEffect' | 'eventHandler' | 'async';
  delay?: number;
  children?: React.ReactNode;
}

export default function ErrorSimulator({ 
  errorType = 'render', 
  delay = 0,
  children 
}: ErrorSimulatorProps) {
  const [shouldError, setShouldError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (shouldError && errorType === 'useEffect') {
      setTimeout(() => {
        throw new Error('ErrorSimulator: useEffect error triggered');
      }, delay);
    }
  }, [shouldError, errorType, delay]);

  const handleErrorClick = async () => {
    if (errorType === 'eventHandler') {
      setTimeout(() => {
        throw new Error('ErrorSimulator: Event handler error triggered');
      }, delay);
    } else if (errorType === 'async') {
      setTimeout(() => {
        Promise.reject(new Error('ErrorSimulator: Async error triggered'));
      }, delay);
    } else {
      setShouldError(true);
    }
  };

  // Render error - throws during component render
  if (shouldError && errorType === 'render') {
    throw new Error('ErrorSimulator: Render error triggered');
  }

  if (!mounted) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
          Error Simulator ({errorType})
        </h3>
        <span className="text-xs text-red-600 dark:text-red-400">
          {delay > 0 && `${delay}ms delay`}
        </span>
      </div>
      
      {children && (
        <div className="mb-3 text-sm text-red-700 dark:text-red-300">
          {children}
        </div>
      )}

      <button
        onClick={handleErrorClick}
        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
      >
        Trigger {errorType} Error
      </button>

      {shouldError && errorType === 'useEffect' && (
        <div className="mt-2 text-xs text-red-600">
          useEffect error will trigger in {delay}ms...
        </div>
      )}
    </div>
  );
}

// Specialized error components
export function RenderError({ delay = 0 }: { delay?: number }) {
  return (
    <ErrorSimulator errorType="render" delay={delay}>
      Throws error during component render phase
    </ErrorSimulator>
  );
}

export function EffectError({ delay = 1000 }: { delay?: number }) {
  return (
    <ErrorSimulator errorType="useEffect" delay={delay}>
      Throws error in useEffect hook
    </ErrorSimulator>
  );
}

export function EventError({ delay = 0 }: { delay?: number }) {
  return (
    <ErrorSimulator errorType="eventHandler" delay={delay}>
      Throws error in event handler
    </ErrorSimulator>
  );
}

export function AsyncError({ delay = 500 }: { delay?: number }) {
  return (
    <ErrorSimulator errorType="async" delay={delay}>
      Creates unhandled promise rejection
    </ErrorSimulator>
  );
}