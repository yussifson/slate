import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Activity, Users, Database, FileText, CheckSquare, Calendar, Folder } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';

export default function UnivDashboard({
  title = "Dashboard",
  subtitle = "Overview of your workspace performance.",
  companyId
}) {

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['orbit_dynamic_records', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('industry_records')
        .select('record_type')
        .eq('company_id', companyId)
        .eq('industry', 'orbit_build_data');
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId
  });

  // Aggregate stats by record_type
  const statsMap = records.reduce((acc, curr) => {
    acc[curr.record_type] = (acc[curr.record_type] || 0) + 1;
    return acc;
  }, {});

  const statKeys = Object.keys(statsMap);
  
  // If no data yet, show some placeholders so it doesn't look empty
  let kpis = [];
  
  const getIconForType = (type) => {
    const t = type.toLowerCase();
    if (t.includes('user') || t.includes('client') || t.includes('customer')) return Users;
    if (t.includes('file') || t.includes('doc') || t.includes('asset')) return Folder;
    if (t.includes('task') || t.includes('project') || t.includes('board')) return CheckSquare;
    if (t.includes('event') || t.includes('schedule') || t.includes('calendar')) return Calendar;
    return Database;
  };

  if (statKeys.length === 0) {
    kpis = [
      { title: 'Total Records', value: '0', change: 'Ready', trend: 'up', icon: Database },
      { title: 'System Status', value: 'Online', change: 'Stable', trend: 'up', icon: Activity },
    ];
  } else {
    kpis = statKeys.map(key => ({
      title: `Total ${key}`,
      value: statsMap[key],
      change: '+1',
      trend: 'up',
      icon: getIconForType(key)
    }));
    
    // Ensure we have at least a few cards
    if (kpis.length < 4) {
       kpis.push({ title: 'Total Entries', value: records.length, change: 'Active', trend: 'up', icon: Activity });
    }
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto custom-scrollbar pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0 px-1 pt-2">
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
            key={kpi.title + idx} 
            className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground truncate max-w-[120px]">{kpi.title}</p>
                <h3 className="text-2xl font-bold text-foreground mt-2">
                  {isLoading ? '...' : kpi.value}
                </h3>
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
              <span className="text-muted-foreground ml-2">since creation</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Placeholder Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col min-h-[350px]"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-foreground">Activity Overview</h3>
            <select className="bg-background border border-border rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="flex-1 flex items-end justify-between gap-2 mt-4">
            {/* Simple mock bar chart */}
            {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
              <div key={i} className="w-full bg-primary/10 rounded-t-lg relative group">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 0.3 + (i * 0.1), duration: 0.5 }}
                  className="absolute bottom-0 w-full bg-primary rounded-t-lg group-hover:bg-primary/80 transition-colors"
                ></motion.div>
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
