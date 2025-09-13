'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Lines from '@/components/Lines';

interface ErrorLayoutProps {
  children: React.ReactNode;
  errorCode?: string;
  showLines?: boolean;
  autoRedirect?: {
    enabled: boolean;
    seconds: number;
    path: string;
  };
}

export default function ErrorLayout({
  children,
  errorCode,
  showLines = true,
  autoRedirect
}: ErrorLayoutProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(autoRedirect?.seconds || 0);

  useEffect(() => {
    if (autoRedirect?.enabled && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (autoRedirect?.enabled && countdown === 0) {
      router.push(autoRedirect.path);
    }
  }, [countdown, autoRedirect, router]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-white dark:bg-blacksection">
      {/* Background decoration */}
      {showLines && <Lines />}
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 dark:from-primary/10 dark:to-primary/10" />
      
      {/* Animated circles - responsive sizes */}
      <div className="absolute -left-20 -top-20 h-40 w-40 animate-pulse rounded-full bg-primary/10 blur-3xl md:h-60 md:w-60" />
      <div className="absolute -bottom-20 -right-20 h-40 w-40 animate-pulse rounded-full bg-meta/10 blur-3xl md:h-60 md:w-60 animation-delay-2000" />
      
      {/* Error code watermark - responsive typography */}
      {errorCode && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none">
          <span className="text-[120px] font-bold text-stroke opacity-5 dark:text-strokedark sm:text-[150px] md:text-[200px] lg:text-[300px]">
            {errorCode}
          </span>
        </div>
      )}
      
      {/* Main content - improved responsive spacing */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 sm:py-16 lg:py-20">
        <div className="w-full max-w-sm sm:max-w-lg lg:max-w-2xl">
          {children}
          
          {/* Countdown indicator */}
          {autoRedirect?.enabled && countdown > 0 && (
            <div className="mt-8 text-center">
              <p className="text-sm text-waterloo dark:text-manatee">
                Redirecting in {countdown} seconds...
              </p>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-stroke dark:bg-strokedark">
                <div 
                  className="h-full bg-primary transition-all duration-1000"
                  style={{ 
                    width: `${((autoRedirect.seconds - countdown) / autoRedirect.seconds) * 100}%` 
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}