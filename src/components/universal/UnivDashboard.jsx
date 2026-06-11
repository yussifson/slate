import React from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Activity, Users, Database, FileText, CheckSquare, Calendar, Folder } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

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

  const statsMap = records.reduce((acc, curr) => {
    acc[curr.record_type] = (acc[curr.record_type] || 0) + 1;
    return acc;
  }, {});

  const statKeys = Object.keys(statsMap);
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
    if (kpis.length < 4) {
       kpis.push({ title: 'Total Entries', value: records.length, change: 'Active', trend: 'up', icon: Activity });
    }
  }

  const chartData = [
    { name: 'Mon', activity: 40, leads: 24 },
    { name: 'Tue', activity: 70, leads: 13 },
    { name: 'Wed', activity: 45, leads: 55 },
    { name: 'Thu', activity: 90, leads: 39 },
    { name: 'Fri', activity: 65, leads: 48 },
    { name: 'Sat', activity: 85, leads: 21 },
    { name: 'Sun', activity: 100, leads: 43 },
  ];

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto custom-scrollbar pb-8">
      <div className="view-header flex items-center justify-between mb-6 shrink-0 px-1 pt-2">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">{title}</h2>
           <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
      </div>

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
          <div className="flex-1 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
                <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="activity" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorActivity)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col min-h-[350px]"
        >
          <div className="mb-4">
            <h3 className="text-lg font-bold text-foreground">Weekly Leads</h3>
            <p className="text-sm text-muted-foreground">Lead generation metrics.</p>
          </div>
          <div className="flex-1 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
                <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="leads" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
