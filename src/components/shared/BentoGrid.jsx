import React from 'react';
import { motion } from 'framer-motion';

/**
 * Premium Bento Grid Layout Component
 * Responsive grid system with staggered animations
 * Perfect for dashboard layouts with mixed content sizes
 */
export const BentoGrid = ({
  children,
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 4,
  className = '',
}) => {
  const gridColsClasses = {
    sm: 'sm:grid-cols-1',
    md: 'md:grid-cols-2',
    lg: 'lg:grid-cols-3',
    xl: 'xl:grid-cols-4',
  };

  const gapClasses = {
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  };

  return (
    <div
      className={`grid grid-cols-1 ${gridColsClasses.md} ${gridColsClasses.lg} ${gridColsClasses.xl} ${gapClasses[gap] || 'gap-4'} ${className}`}
    >
      {children}
    </div>
  );
};

/**
 * Bento Grid Item - Individual grid cell with customizable spanning
 */
export const BentoGridItem = ({
  children,
  span = { sm: 1, md: 1, lg: 1 },
  delay = 0,
  className = '',
}) => {
  const spanClasses = {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3',
    4: 'col-span-4',
  };

  const responsiveClasses = `
    ${spanClasses[span.sm] || 'col-span-1'}
    md:${spanClasses[span.md] || 'col-span-1'}
    lg:${spanClasses[span.lg] || 'col-span-1'}
  `;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.34, 1.56, 0.64, 1],
      }}
      className={`${responsiveClasses} ${className}`}
    >
      {children}
    </motion.div>
  );
};

/**
 * Premium Container/Card for Bento Grid items
 */
export const BentoCard = ({
  children,
  className = '',
  interactive = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative group overflow-hidden rounded-2xl border border-white/10 dark:border-white/5 backdrop-blur-xl p-6 transition-all duration-300 ${
        interactive
          ? 'cursor-pointer hover:border-white/20 dark:hover:border-white/10 hover:bg-white/5 dark:hover:bg-white/5'
          : ''
      } ${className}`}
    >
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent dark:from-white/2 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default BentoGrid;
