import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

export const LogisticsKPICard = ({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  color = 'logistics',
  status = 'optimal',
  trend,
  trendValue,
  delay = 0,
}) => {
  const colorConfigs = {
    logistics: {
      bg: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
      border: 'border-blue-200/50 dark:border-blue-800/30',
      icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    },
    shipments: {
      bg: 'from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30',
      border: 'border-purple-200/50 dark:border-purple-800/30',
      icon: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
    },
    delivery: {
      bg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
      border: 'border-emerald-200/50 dark:border-emerald-800/30',
      icon: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    },
    performance: {
      bg: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
      border: 'border-amber-200/50 dark:border-amber-800/30',
      icon: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    },
  };

  const statusIcons = {
    optimal: <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
    warning: <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
    critical: <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />,
  };

  const config = colorConfigs[color] || colorConfigs.logistics;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`
        relative overflow-hidden rounded-xl p-6 border
        bg-gradient-to-br ${config.bg}
        ${config.border}
        hover:shadow-lg transition-shadow duration-300
      `}
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        initial={false}
      />

      {/* Top Section: Icon + Status */}
      <div className="relative z-10 flex items-start justify-between mb-4">
        <motion.div
          className={`p-3 rounded-lg ${config.icon}`}
          whileHover={{ scale: 1.1 }}
        >
          <Icon className="w-6 h-6" />
        </motion.div>
        {statusIcons[status]}
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider mb-2">
        {title}
      </h3>

      {/* Value */}
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.1 }}
      >
        <p className="text-3xl md:text-4xl font-bold text-foreground mb-1">
          {value}
        </p>
        {unit && (
          <p className="text-xs text-muted-foreground font-medium">
            {unit}
          </p>
        )}
      </motion.div>

      {/* Subtitle & Trend */}
      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        {trendValue && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${
            trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' :
            trend === 'down' ? 'text-red-600 dark:text-red-400' :
            'text-muted-foreground'
          }`}>
            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LogisticsKPICard;
