'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Error404Props {
  isAdmin?: boolean;
  suggestions?: Array<{ label: string; href: string }>;
}

export default function Error404({ isAdmin = false, suggestions }: Error404Props) {
  const [isHovered, setIsHovered] = useState(false);

  const defaultSuggestions = isAdmin
    ? [
        { label: 'Dashboard', href: '/admin/dashboard' },
        { label: 'Products', href: '/admin/products' },
        { label: 'Customers', href: '/admin/customers' },
      ]
    : [
        { label: 'Home', href: '/' },
        { label: 'About Us', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ];

  const links = suggestions || defaultSuggestions;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      {/* Animated 404 SVG */}
      <div
        className="relative mx-auto mb-8 h-64 w-64 md:h-80 md:w-80"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <svg
          viewBox="0 0 400 400"
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Animated 4 */}
          <motion.text
            x="50"
            y="250"
            className="fill-primary text-[180px] font-bold"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            4
          </motion.text>
          
          {/* Animated 0 as a searching eye */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5, type: 'spring' }}
          >
            <circle
              cx="200"
              cy="200"
              r="60"
              className="fill-none stroke-primary stroke-[8]"
            />
            {/* Eye pupil that follows mouse */}
            <motion.circle
              cx="200"
              cy="200"
              r="20"
              className="fill-primary"
              animate={{
                x: isHovered ? [0, 10, -10, 0] : 0,
                y: isHovered ? [0, -10, 10, 0] : 0,
              }}
              transition={{
                duration: 2,
                repeat: isHovered ? Infinity : 0,
                ease: "easeInOut"
              }}
            />
            {/* Magnifying glass handle */}
            <motion.line
              x1="245"
              y1="245"
              x2="290"
              y2="290"
              className="stroke-primary stroke-[8]"
              strokeLinecap="round"
            />
          </motion.g>
          
          {/* Animated 4 */}
          <motion.text
            x="300"
            y="250"
            className="fill-primary text-[180px] font-bold"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            4
          </motion.text>
        </svg>
      </div>

      {/* Error message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <h1 className="mb-4 text-3xl font-bold text-black dark:text-white md:text-5xl">
          Page Not Found
        </h1>
        <p className="mb-8 text-lg text-waterloo dark:text-manatee">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
      </motion.div>

      {/* Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="mb-8"
      >
        <p className="mb-4 text-sm text-waterloo dark:text-manatee">
          You might want to check out:
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {links.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className="rounded-full border border-stroke bg-white px-4 py-2 text-sm font-medium text-black transition-all hover:border-primary hover:bg-primary hover:text-white dark:border-strokedark dark:bg-blacksection dark:text-white dark:hover:border-primary dark:hover:bg-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="flex flex-col items-center justify-center gap-4 sm:flex-row"
      >
        <button
          onClick={() => window.history.back()}
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Go Back
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
    </motion.div>
  );
}