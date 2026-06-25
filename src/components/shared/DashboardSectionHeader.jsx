import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, MoreVertical } from 'lucide-react';

/**
 * Premium Dashboard Section Header
 * Elegant header with optional actions and animations
 */
export const DashboardSectionHeader = ({
  title,
  subtitle,
  icon: Icon,
  action,
  onActionClick,
  rightContent,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex items-center justify-between gap-4 mb-6 ${className}`}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2.5 rounded-lg bg-white/10 dark:bg-white/5 text-primary">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {rightContent}
        {action && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onActionClick}
            className="px-4 py-2 rounded-lg bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 text-primary font-medium transition-all duration-200 flex items-center gap-2 text-sm"
          >
            {action}
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default DashboardSectionHeader;
