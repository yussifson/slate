import { motion } from 'framer-motion';

export default function PageHeader({ 
  icon: Icon, 
  title, 
  subtitle, 
  metric, 
  metricLabel,
  actions,
  children 
}) {
  return (
    <motion.div 
      className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 p-8 text-white mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 bg-black/5" />
      <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-12 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute top-8 right-32 w-24 h-24 bg-white/5 rounded-full" />
      
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              <p className="text-emerald-100 text-sm mt-1">{subtitle}</p>
            </div>
          </div>
        </div>
        
        {metric !== undefined && (
          <div className="text-right">
            <p className="text-white/70 text-sm font-medium">{metricLabel}</p>
            <p className="text-3xl font-bold mt-1">{metric}</p>
          </div>
        )}
      </div>

      {/* Actions Row */}
      {(actions || children) && (
        <div className="relative z-10 mt-6 flex items-center gap-3 flex-wrap">
          {children}
          {actions && actions.map((action, i) => (
            <motion.div key={i} whileHover={{ scale: 1.05 }}>
              {action}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
