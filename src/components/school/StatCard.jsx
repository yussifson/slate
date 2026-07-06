import { motion } from 'framer-motion';

export default function StatCard({
  icon: Icon,
  label,
  value,
  description,
  color = 'emerald',
  bgColor = 'bg-emerald-50 dark:bg-emerald-900/20',
  textColor = 'text-emerald-700 dark:text-emerald-400',
  iconColor = 'text-emerald-600'
}) {
  const colorMap = {
    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-400', icon: 'text-emerald-600' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-400', icon: 'text-blue-600' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-400', icon: 'text-orange-600' },
    red: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-400', icon: 'text-red-600' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-400', icon: 'text-purple-600' }
  };

  const colors = colorMap[color] || colorMap.emerald;

  return (
    <motion.div
      className="bg-card rounded-2xl border border-border/50 p-6 hover:shadow-lg hover:-translate-y-1 transition-all"
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
      </div>
      
      <p className={`text-sm font-medium ${colors.text} mb-1`}>{label}</p>
      <p className="text-2xl font-bold text-foreground mb-2">{value}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </motion.div>
  );
}
