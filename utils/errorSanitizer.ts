// Utility functions for sanitizing error messages and ensuring security

export interface SanitizedError {
  message: string;
  code: string;
  id?: string;
  timestamp: string;
}

// Patterns that should be removed from error messages for security
const SENSITIVE_PATTERNS = [
  // File paths
  /\/[A-Za-z]:[\\\/].*/g, // Windows paths
  /\/Users\/[^\/\s]+/g, // macOS user directories
  /\/home\/[^\/\s]+/g, // Linux home directories
  /\/var\/[^\/\s]+/g, // System directories
  /\/opt\/[^\/\s]+/g, // Optional software directories
  
  // Credentials and secrets
  /password[=:\s]*[^\s&]+/gi,
  /passwd[=:\s]*[^\s&]+/gi,
  /token[=:\s]*[^\s&]+/gi,
  /key[=:\s]*[^\s&]+/gi,
  /secret[=:\s]*[^\s&]+/gi,
  /api[_-]?key[=:\s]*[^\s&]+/gi,
  /access[_-]?token[=:\s]*[^\s&]+/gi,
  /bearer[=:\s]*[^\s&]+/gi,
  /authorization[=:\s]*[^\s&]+/gi,
  
  // Database connection strings
  /mongodb:\/\/[^\s]+/gi,
  /postgres:\/\/[^\s]+/gi,
  /mysql:\/\/[^\s]+/gi,
  /redis:\/\/[^\s]+/gi,
  
  // Firebase and cloud credentials
  /firebase[A-Za-z]*[=:\s]*[^\s&]+/gi,
  /serviceAccount[A-Za-z]*[=:\s]*[^\s&]+/gi,
  /private[_-]?key[=:\s]*[^\s&]+/gi,
  /client[_-]?secret[=:\s]*[^\s&]+/gi,
  
  // IP addresses and internal domains
  /\b(?:192\.168|10\.|172\.(?:1[6-9]|2[0-9]|3[01])\.)[0-9.]+\b/g,
  /\b127\.0\.0\.1\b/g,
  /localhost[:\d]*/g,
  /\.local[:\d]*/g,
  
  // Email addresses (in error contexts)
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // Stack trace file paths
  /\s+at\s+[^\s]*\/[^\s]*:[0-9]+:[0-9]+/g,
];

/**
 * Sanitizes error messages by removing sensitive information
 */
export function sanitizeErrorMessage(message: string): string {
  let sanitized = message;
  
  SENSITIVE_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });
  
  // Remove multiple consecutive [REDACTED] occurrences
  sanitized = sanitized.replace(/(\[REDACTED\]\s*){2,}/g, '[REDACTED] ');
  
  // Trim and clean up
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Maps HTTP status codes to user-friendly error information
 */
export function getErrorInfo(statusCode: number | string): { title: string; message: string; code: string } {
  const code = String(statusCode);
  
  const errorMap: Record<string, { title: string; message: string }> = {
    '400': {
      title: 'Bad Request',
      message: 'The request could not be understood. Please check your input and try again.'
    },
    '401': {
      title: 'Authentication Required',
      message: 'You need to be logged in to access this resource.'
    },
    '403': {
      title: 'Access Denied',
      message: 'You don\'t have permission to access this resource.'
    },
    '404': {
      title: 'Page Not Found',
      message: 'The page you\'re looking for doesn\'t exist or has been moved.'
    },
    '408': {
      title: 'Request Timeout',
      message: 'The request took too long to process. Please try again.'
    },
    '429': {
      title: 'Too Many Requests',
      message: 'You\'ve made too many requests. Please wait a moment and try again.'
    },
    '500': {
      title: 'Server Error',
      message: 'Something went wrong on our end. Our team has been notified.'
    },
    '502': {
      title: 'Bad Gateway',
      message: 'There\'s a temporary issue with our servers. Please try again in a moment.'
    },
    '503': {
      title: 'Service Unavailable',
      message: 'Our service is temporarily unavailable. We\'ll be back soon!'
    },
    '504': {
      title: 'Gateway Timeout',
      message: 'The server took too long to respond. Please try again.'
    },
  };
  
  const errorInfo = errorMap[code] || {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again later.'
  };
  
  return {
    ...errorInfo,
    code
  };
}

/**
 * Creates a sanitized error object safe for client display
 */
export function createSanitizedError(
  error: Error,
  statusCode?: number,
  errorId?: string
): SanitizedError {
  const sanitizedMessage = sanitizeErrorMessage(error.message);
  const errorInfo = statusCode ? getErrorInfo(statusCode) : {
    title: 'Application Error',
    message: sanitizedMessage || 'An unexpected error occurred.',
    code: 'UNKNOWN'
  };
  
  return {
    message: errorInfo.message,
    code: errorInfo.code,
    id: errorId,
    timestamp: new Date().toISOString()
  };
}

/**
 * Checks if an error message contains sensitive information
 */
export function containsSensitiveInfo(message: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Generates a safe error ID for tracking (no sensitive data)
 */
export function generateErrorId(): string {
  return `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}