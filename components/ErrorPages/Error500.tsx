'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Error500Props {
  isAdmin?: boolean;
  errorId?: string;
}

export default function Error500({ isAdmin = false, errorId }: Error500Props) {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      {/* Animated Server Error SVG */}
      <div className="relative mx-auto mb-8 h-64 w-64 md:h-80 md:w-80">
        <svg
          viewBox="0 0 400 400"
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Server rack */}
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Server body */}
            <rect
              x="100"
              y="100"
              width="200"
              height="200"
              rx="10"
              className="fill-stroke dark:fill-strokedark"
            />
            
            {/* Server slots */}
            {[0, 1, 2].map((index) => (
              <g key={index}>
                <rect
                  x="120"
                  y={130 + index * 50}
                  width="160"
                  height="30"
                  rx="5"
                  className="fill-white dark:fill-blacksection"
                />
                {/* Status LED */}
                <circle
                  cx="140"
                  cy={145 + index * 50}
                  r="5"
                  className={index === 1 ? "fill-red-500" : "fill-green-500"}
                >
                  {index === 1 && (
                    <animate
                      attributeName="opacity"
                      values="1;0.3;1"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  )}
                </circle>
              </g>
            ))}
          </motion.g>

          {/* Error symbols */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {/* Warning triangle */}
            <path
              d="M 200 50 L 250 120 L 150 120 Z"
              className="fill-none stroke-red-500 stroke-[3]"
            />
            <text
              x="200"
              y="105"
              textAnchor="middle"
              className="fill-red-500 text-2xl font-bold"
            >
              !
            </text>
          </motion.g>

          {/* Smoke effect */}
          {isAnimating && (
            <motion.g>
              {[...Array(5)].map((_, i) => (
                <motion.circle
                  key={i}
                  cx={180 + i * 10}
                  cy="90"
                  r="8"
                  className="fill-gray-400 opacity-40"
                  initial={{ y: 0, opacity: 0.4 }}
                  animate={{
                    y: -50,
                    opacity: 0,
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.2,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                />
              ))}
            </motion.g>
          )}

          {/* 500 text */}
          <motion.text
            x="200"
            y="350"
            textAnchor="middle"
            className="fill-primary text-6xl font-bold"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            500
          </motion.text>
        </svg>
      </div>

      {/* Error message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <h1 className="mb-4 text-3xl font-bold text-black dark:text-white md:text-5xl">
          Server Error
        </h1>
        <p className="mb-4 text-lg text-waterloo dark:text-manatee">
          Something went wrong on our end. Our team has been notified and is working on a fix.
        </p>
        
        {/* Error ID (safe to show) */}
        {errorId && (
          <p className="mb-8 text-sm text-waterloo dark:text-manatee">
            Error Reference: <code className="rounded bg-stroke px-2 py-1 dark:bg-strokedark">{errorId}</code>
          </p>
        )}
      </motion.div>

      {/* Status indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="mb-8"
      >
        <div className="inline-flex items-center gap-3 rounded-full bg-red-50 px-4 py-2 dark:bg-red-900/20">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
          </span>
          <span className="text-sm font-medium text-red-800 dark:text-red-300">
            Our engineers are investigating
          </span>
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="flex flex-col items-center justify-center gap-4 sm:flex-row"
      >
        <button
          onClick={() => window.location.reload()}
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

      {/* Help section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="mt-12 text-sm text-waterloo dark:text-manatee"
      >
        <p>
          Need immediate assistance?{' '}
          <a
            href="mailto:support@brilianekas.com"
            className="text-primary underline hover:text-primaryho"
          >
            Contact Support
          </a>
        </p>
      </motion.div>
    </motion.div>
  );
}