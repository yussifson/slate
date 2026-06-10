import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Activity, Users, DollarSign, Briefcase } from 'lucide-react';

export default function UnivDashboard({
  kpis = [
    { title: 'Total Revenue', value: '$45,231.89', change: '+20.1%', trend: 'up', icon: DollarSign },
    { title: 'Active Users', value: '2,350', change: '+180', trend: 'up', icon: Users },
    { title: 'Sales', value: '+12,234', change: '+19%', trend: 'up', icon: Briefcase },
    { title: 'Active Now', value: '573', change: '-12', trend: 'down', icon: Activity }
  ],
  title = "Dashboard",
  subtitle = "Overview of your workspace performance."
}) {
  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto custom-scrollbar pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">{title}</h2>
           <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={kpi.title} 
            className="bg-card border border-border rounded-2xl p-5 shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                <h3 className="text-2xl font-bold text-foreground mt-2">{kpi.value}</h3>
              </div>
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className={`flex items-center font-bold ${kpi.trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {kpi.trend === 'up' ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                {kpi.change}
              </span>
              <span className="text-muted-foreground ml-2">from last month</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts & Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[300px] flex flex-col"
        >
          <div className="mb-4">
            <h3 className="text-lg font-bold text-foreground">Overview Analytics</h3>
            <p className="text-sm text-muted-foreground">Monthly performance metrics.</p>
          </div>
          {/* Mock Chart Area */}
          <div className="flex-1 border border-border border-dashed rounded-xl flex items-end justify-between p-4 pt-12 gap-2 relative bg-muted/10">
            <div className="absolute top-1/2 left-0 w-full border-t border-border border-dashed"></div>
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className="w-full bg-primary/20 rounded-t-sm relative group hover:bg-primary/40 transition-colors" style={{ height: `${Math.random() * 80 + 20}%` }}>
                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {Math.floor(Math.random() * 1000)}
                 </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col"
        >
          <div className="mb-4">
            <h3 className="text-lg font-bold text-foreground">Recent Activity</h3>
            <p className="text-sm text-muted-foreground">Latest actions across workspace.</p>
          </div>
          <div className="flex-1 space-y-4">
            {[
              { text: "Alice updated the schema", time: "10 mins ago" },
              { text: "Bob closed Invoice #001", time: "1 hr ago" },
              { text: "New lead captured", time: "2 hrs ago" },
              { text: "System backup completed", time: "5 hrs ago" }
            ].map((act, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5"></div>
                  {i !== 3 && <div className="w-0.5 h-full bg-border mt-2"></div>}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium text-foreground">{act.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
