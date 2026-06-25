import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Zap, AlertTriangle } from 'lucide-react';

/**
 * Premium KPI Card Component for Logistics Dashboard
 * Features:
 * - Ocean blue/mint green accent theme
 * - Real-time status indicators
 * - Animated micro-interactions
 * - Support for performance benchmarking
 */
export const LogisticsKPICard = ({
  title,
  value,
  unit = '',
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'logistics',
  status, // 'optimal', 'warning', 'critical'
  onClick,
  interactive = false,
  delay = 0,
}) => {
  const isPositive = trend === 'up';

  const colorClasses = {
    logistics: 'from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20',
    shipments: 'from-cyan-50 to-cyan-100/50 dark:from-cyan-950/30 dark:to-cyan-900/20',
    fleet: 'from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20',
    delivery: 'from-indigo-50 to-indigo-100/50 dark:from-indigo-950/30 dark:to-indigo-900/20',
    performance: 'from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20',
  };

  const accentColors = {
    logistics: 'text-blue-600 dark:text-blue-400',
    shipments: 'text-cyan-600 dark:text-cyan-400',
    fleet: 'text-emerald-600 dark:text-emerald-400',
    delivery: 'text-indigo-600 dark:text-indigo-400',
    performance: 'text-orange-600 dark:text-orange-400',
  };

  const statusIndicators = {
    optimal: 'bg-emerald-500 dark:bg-emerald-400',
    warning: 'bg-amber-500 dark:bg-amber-400 animate-pulse',
    critical: 'bg-red-500 dark:bg-red-400 animate-pulse',
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
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        {/* Header with icon and status */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {title}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {status && (
              <div className={`w-2.5 h-2.5 rounded-full ${statusIndicators[status]}`} />
            )}
            {Icon && (
              <div className={`p-2.5 rounded-xl bg-white/10 dark:bg-white/5 ${accentColors[color]}`}>
                <Icon className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>

        {/* Main value with unit */}
        <div className="mb-4">
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold tracking-tight tabular-nums">{value}</p>
            {unit && <span className="text-sm font-medium text-muted-foreground">{unit}</span>}
          </div>
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

export default LogisticsKPICard;
