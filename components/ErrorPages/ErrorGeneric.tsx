'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ErrorGenericProps {
  errorCode?: string;
  title?: string;
  message?: string;
  isAdmin?: boolean;
  showReportButton?: boolean;
  onReset?: () => void;
}

const ERROR_MESSAGES: Record<string, { title: string; message: string }> = {
  '400': {
    title: 'Bad Request',
    message: 'The request could not be understood. Please check your input and try again.'
  },
  '401': {
    title: 'Authentication Required',
    message: 'You need to be logged in to access this page.'
  },
  '403': {
    title: 'Access Denied',
    message: 'You don\'t have permission to access this resource.'
  },
  '408': {
    title: 'Request Timeout',
    message: 'The request took too long to process. Please try again.'
  },
  '429': {
    title: 'Too Many Requests',
    message: 'You\'ve made too many requests. Please wait a moment and try again.'
  },
  '503': {
    title: 'Service Unavailable',
    message: 'Our service is temporarily unavailable. We\'ll be back soon!'
  },
  'default': {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again later.'
  }
};

export default function ErrorGeneric({
  errorCode = 'default',
  title,
  message,
  isAdmin = false,
  showReportButton = true,
  onReset
}: ErrorGenericProps) {
  const [reportSent, setReportSent] = useState(false);

  const errorInfo = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.default;
  const displayTitle = title || errorInfo.title;
  const displayMessage = message || errorInfo.message;

  const handleReport = () => {
    // Log error safely without exposing sensitive data
    if (typeof window !== 'undefined' && window.errorLogger) {
      window.errorLogger.logError({
        message: `User reported error: ${errorCode}`,
        errorType: 'error',
        additional: {
          userReported: true,
          errorCode,
          timestamp: new Date().toISOString()
        }
      });
    }
    setReportSent(true);
    setTimeout(() => setReportSent(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      {/* Error icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="relative mx-auto mb-8 flex h-32 w-32 items-center justify-center md:h-40 md:w-40"
      >
        <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 md:h-32 md:w-32">
          <span className="text-5xl font-bold text-primary md:text-6xl">
            {errorCode === 'default' ? '!' : errorCode}
          </span>
        </div>
      </motion.div>

      {/* Error message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h1 className="mb-4 text-3xl font-bold text-black dark:text-white md:text-5xl">
          {displayTitle}
        </h1>
        <p className="mb-8 text-lg text-waterloo dark:text-manatee">
          {displayMessage}
        </p>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col items-center justify-center gap-4 sm:flex-row"
      >
        {onReset && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-full border border-primary bg-transparent px-6 py-3 font-medium text-primary transition-all hover:bg-primary hover:text-white"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Try Again
          </button>
        )}
        
        <Link
          href={isAdmin ? '/admin/dashboard' : '/'}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-white transition-all hover:bg-primaryho"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          {isAdmin ? 'Dashboard' : 'Home'}
        </Link>
      </motion.div>

      {/* Report button */}
      {showReportButton && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          {!reportSent ? (
            <button
              onClick={handleReport}
              className="text-sm text-waterloo underline hover:text-primary dark:text-manatee"
            >
              Report this issue
            </button>
          ) : (
            <p className="text-sm text-green-600 dark:text-green-400">
              ✓ Issue reported. Thank you!
            </p>
          )}
        </motion.div>
      )}

      {/* Error code for 401 - Login prompt */}
      {errorCode === '401' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8"
        >
          <Link
            href={isAdmin ? '/admin/login' : '/'}
            className="inline-flex items-center gap-2 rounded-full border border-primary bg-transparent px-6 py-3 font-medium text-primary transition-all hover:bg-primary hover:text-white"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            Go to Login
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}