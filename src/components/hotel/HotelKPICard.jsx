import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';

/**
 * Premium KPI Card Component for Hotel Dashboard
 * Features:
 * - Luxury burgundy/gold accent theme
 * - Smooth animations on mount and hover
 * - Trending indicators with animated direction
 * - Support for custom icons and rich metadata
 */
export const HotelKPICard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'hotel',
  onClick,
  interactive = false,
  delay = 0,
}) => {
  const isPositive = trend === 'up';

  const colorClasses = {
    hotel: 'from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20',
    occupancy: 'from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20',
    revenue: 'from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20',
    guest: 'from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20',
  };

  const accentColors = {
    hotel: 'text-red-600 dark:text-red-400',
    occupancy: 'text-emerald-600 dark:text-emerald-400',
    revenue: 'text-amber-600 dark:text-amber-400',
    guest: 'text-blue-600 dark:text-blue-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.34, 1.56, 0.64, 1],
      }}
      whileHover={interactive ? { y: -4, transition: { duration: 0.2 } } : {}}
      onClick={onClick}
      className={`relative group overflow-hidden rounded-2xl border border-white/10 dark:border-white/5 p-6 cursor-${interactive ? 'pointer' : 'default'} transition-all duration-300 ${
        interactive ? 'hover:border-white/20 dark:hover:border-white/10' : ''
      }`}
    >
      {/* Gradient background with animation */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} dark:${colorClasses[color]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      {/* Decorative accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        {/* Header with icon */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {title}
            </p>
          </div>
          {Icon && (
            <div className={`p-2.5 rounded-xl bg-white/10 dark:bg-white/5 ${accentColors[color]}`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Main value */}
        <div className="mb-4">
          <p className="text-3xl font-bold tracking-tight tabular-nums">
            {value}
          </p>
        </div>

        {/* Subtitle and trend */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          {trendValue && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${
              isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
      </div>

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute -inset-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/5" />
      </div>
    </motion.div>
  );
};

export default HotelKPICard;
