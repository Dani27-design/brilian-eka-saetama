// Mobile Error Logger - Captures and stores errors for debugging on mobile devices

interface ErrorLog {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  errorType: 'error' | 'unhandledRejection' | 'console.error';
  additional?: any;
}

class MobileErrorLogger {
  private static instance: MobileErrorLogger;
  private errorLogs: ErrorLog[] = [];
  private maxLogs = 50; // Keep last 50 errors
  private storageKey = 'mobile_error_logs';

  private constructor() {
    if (typeof window !== 'undefined') {
      this.loadLogs();
      this.setupErrorHandlers();
    }
  }

  static getInstance(): MobileErrorLogger {
    if (!MobileErrorLogger.instance) {
      MobileErrorLogger.instance = new MobileErrorLogger();
    }
    return MobileErrorLogger.instance;
  }

  private loadLogs() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.errorLogs = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load error logs from localStorage');
    }
  }

  private saveLogs() {
    try {
      // Keep only the last maxLogs entries
      if (this.errorLogs.length > this.maxLogs) {
        this.errorLogs = this.errorLogs.slice(-this.maxLogs);
      }
      localStorage.setItem(this.storageKey, JSON.stringify(this.errorLogs));
    } catch (e) {
      console.warn('Failed to save error logs to localStorage');
    }
  }

  private setupErrorHandlers() {
    // Capture window errors
    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      this.logError({
        message: String(message),
        stack: error?.stack,
        errorType: 'error',
        additional: {
          source,
          lineno,
          colno
        }
      });
      
      // Call original handler if it exists
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error);
      }
      return false;
    };

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        errorType: 'unhandledRejection',
        additional: {
          promise: event.promise
        }
      });
    });

    // Override console.error to capture those as well
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.logError({
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '),
        errorType: 'console.error',
        additional: { args }
      });
      
      // Call original console.error
      originalConsoleError.apply(console, args);
    };
  }

  logError(error: Partial<ErrorLog>) {
    const errorLog: ErrorLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      message: error.message || 'Unknown error',
      stack: error.stack,
      errorType: error.errorType || 'error',
      additional: error.additional
    };

    this.errorLogs.push(errorLog);
    this.saveLogs();

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Error logged:', errorLog);
    }
  }

  getLogs(): ErrorLog[] {
    return [...this.errorLogs].reverse(); // Return newest first
  }

  clearLogs() {
    this.errorLogs = [];
    localStorage.removeItem(this.storageKey);
  }

  exportLogs(): string {
    return JSON.stringify(this.errorLogs, null, 2);
  }

  // Helper method to get device info
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      onLine: navigator.onLine,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString()
    };
  }
}

export const errorLogger = typeof window !== 'undefined' 
  ? MobileErrorLogger.getInstance() 
  : null;

export type { ErrorLog };