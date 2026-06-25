import React from 'react';
import { motion } from 'framer-motion';

/**
 * Premium Hotel Page Wrapper
 * Provides consistent premium styling for all hotel pages
 */
export const HotelPageWrapper = ({
  title,
  subtitle,
  icon: Icon,
  children,
  actions,
  className = '',
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/90">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 backdrop-blur-xl border-b border-white/10 dark:border-white/5">
        <div className="px-6 py-4">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              {Icon && (
                <div className="p-3 rounded-lg bg-white/10 dark:bg-white/5 text-red-600 dark:text-red-400">
                  <Icon className="w-6 h-6" />
                </div>
              )}
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-500 dark:from-red-400 dark:to-red-300 bg-clip-text text-transparent">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                )}
              </div>
            </div>

            {actions && (
              <motion.div
                className="flex gap-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {actions}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className={`px-6 py-8 ${className}`}>{children}</div>
    </div>
  );
};

export default HotelPageWrapper;
