import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Moon,
  LogIn,
  Calendar,
  Brush,
  Settings,
  AlertCircle,
  Clock,
} from 'lucide-react';

/**
 * Premium Room Status Badge for Hotel Operations
 * Animated status indicators with color-coded states
 */
export const RoomStatusBadge = ({ status, size = 'md', animated = true }) => {
  const statusConfig = {
    Available: {
      icon: CheckCircle2,
      color: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
      borderColor: 'border-emerald-200 dark:border-emerald-900/40',
      label: 'Available',
      dotColor: 'bg-emerald-500',
    },
    Occupied: {
      icon: Moon,
      color: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300',
      borderColor: 'border-red-200 dark:border-red-900/40',
      label: 'Occupied',
      dotColor: 'bg-red-500',
      pulse: true,
    },
    Arriving: {
      icon: LogIn,
      color: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
      borderColor: 'border-blue-200 dark:border-blue-900/40',
      label: 'Arriving',
      dotColor: 'bg-blue-500',
    },
    Reserved: {
      icon: Calendar,
      color: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
      borderColor: 'border-amber-200 dark:border-amber-900/40',
      label: 'Reserved',
      dotColor: 'bg-amber-500',
    },
    Cleaning: {
      icon: Brush,
      color: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
      borderColor: 'border-purple-200 dark:border-purple-900/40',
      label: 'Cleaning',
      dotColor: 'bg-purple-500',
      animate: true,
    },
    Maintenance: {
      icon: Settings,
      color: 'bg-slate-100 dark:bg-slate-950/40 text-slate-700 dark:text-slate-400',
      borderColor: 'border-slate-200 dark:border-slate-900/40',
      label: 'Maintenance',
      dotColor: 'bg-slate-500',
    },
    OutOfService: {
      icon: AlertCircle,
      color: 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
      borderColor: 'border-rose-200 dark:border-rose-900/40',
      label: 'Out of Service',
      dotColor: 'bg-rose-500',
    },
    PendingMaintenance: {
      icon: Clock,
      color: 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300',
      borderColor: 'border-orange-200 dark:border-orange-900/40',
      label: 'Pending',
      dotColor: 'bg-orange-500',
      pulse: true,
    },
  };

  const config = statusConfig[status] || statusConfig.Available;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const badgeContent = (
    <div className={`inline-flex items-center gap-2 rounded-full border font-medium transition-all duration-300 ${sizeClasses[size]} ${config.color} ${config.borderColor}`}>
      <div className="relative">
        <div
          className={`${config.dotColor} rounded-full ${
            size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-2.5 h-2.5'
          } ${config.pulse ? 'animate-pulse' : ''}`}
        />
        {config.animate && (
          <div
            className={`absolute inset-0 ${config.dotColor} rounded-full ${
              size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-2.5 h-2.5'
            } animate-ping opacity-75`}
          />
        )}
      </div>
      <Icon className={iconSizes[size]} />
      <span>{config.label}</span>
    </div>
  );

  if (!animated) {
    return badgeContent;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {badgeContent}
    </motion.div>
  );
};

export default RoomStatusBadge;
