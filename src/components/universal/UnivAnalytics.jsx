import React from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { BarChart2, PieChart, TrendingUp, Download, Filter, Calendar } from 'lucide-react';

export default function UnivAnalytics({
  title = "Analytics & Reports",
  subtitle = "Detailed insights into your workspace performance."
}) {
  const companyId = useCompanyId();

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto custom-scrollbar pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">{title}</h2>
           <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors">
            <Calendar className="w-4 h-4" /> This Month
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors">
            <Filter className="w-4 h-4" /> Filters
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Trend Chart Mock */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[350px] flex flex-col"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Growth Trend</h3>
              <p className="text-sm text-muted-foreground mt-1">Monthly recurring metrics</p>
            </div>
            <select className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none">
              <option>Revenue</option>
              <option>Users</option>
              <option>Sessions</option>
            </select>
          </div>
          <div className="flex-1 border border-border border-dashed rounded-xl flex items-end justify-between p-4 pt-12 gap-2 relative bg-muted/5">
            {/* Mock Line Chart points */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
               <polyline 
                 points="0,200 50,180 100,100 150,120 200,80 250,150 300,50 350,90 400,20" 
                 fill="none" 
                 stroke="currentColor" 
                 className="text-primary/50"
                 strokeWidth="4" 
                 strokeLinejoin="round"
                 vectorEffect="non-scaling-stroke"
               />
               <polyline 
                 points="0,250 50,220 100,150 150,170 200,130 250,200 300,100 350,140 400,60" 
                 fill="none" 
                 stroke="currentColor" 
                 className="text-slate-400/30"
                 strokeWidth="2" 
                 strokeLinejoin="round"
                 vectorEffect="non-scaling-stroke"
                 strokeDasharray="5,5"
               />
            </svg>
            {Array(9).fill(0).map((_, i) => (
              <div key={i} className="w-full flex justify-center z-10">
                 <div className="w-1 h-full bg-border/30 relative">
                   <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-medium">M{i+1}</div>
                 </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Distribution Chart Mock */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[350px] flex flex-col"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2"><PieChart className="w-5 h-5 text-purple-500" /> Segment Distribution</h3>
              <p className="text-sm text-muted-foreground mt-1">Data grouped by category</p>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center gap-8">
            {/* CSS Pie Chart Mock */}
            <div className="relative w-48 h-48 rounded-full border-[16px] border-muted bg-transparent overflow-hidden shadow-inner">
               <div className="absolute inset-0 rounded-full border-[16px] border-primary" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%, 0 100%, 0 50%)' }}></div>
               <div className="absolute inset-0 rounded-full border-[16px] border-purple-500" style={{ clipPath: 'polygon(50% 50%, 0 50%, 0 0, 50% 0)' }}></div>
               <div className="absolute inset-0 rounded-full border-[16px] border-orange-500" style={{ clipPath: 'polygon(50% 50%, 50% 0, 100% 0)' }}></div>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Enterprise', color: 'bg-primary', value: '55%' },
                { label: 'SMB', color: 'bg-purple-500', value: '25%' },
                { label: 'Startups', color: 'bg-orange-500', value: '10%' },
                { label: 'Other', color: 'bg-muted', value: '10%' }
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-sm ${item.color}`}></div>
                  <div className="w-24 text-sm font-medium text-foreground">{item.label}</div>
                  <div className="font-bold text-sm">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Metrics Data Table */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col"
      >
        <div className="p-5 border-b border-border flex items-center gap-2">
           <BarChart2 className="w-5 h-5 text-muted-foreground" />
           <h3 className="text-lg font-bold text-foreground">Detailed Metrics</h3>
        </div>
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
            <tr>
              <th className="p-4 font-semibold">Metric Name</th>
              <th className="p-4 font-semibold text-right">Current Period</th>
              <th className="p-4 font-semibold text-right">Previous Period</th>
              <th className="p-4 font-semibold text-right">Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[
              { name: 'Total Revenue', cur: '$45,231', prev: '$38,100', var: '+18.7%', pos: true },
              { name: 'New Customers', cur: '142', prev: '98', var: '+44.9%', pos: true },
              { name: 'Churn Rate', cur: '2.1%', prev: '1.8%', var: '+0.3%', pos: false },
              { name: 'Avg Deal Size', cur: '$4,200', prev: '$4,500', var: '-6.6%', pos: false },
            ].map((row, i) => (
              <tr key={i} className="hover:bg-muted/30 transition-colors">
                <td className="p-4 font-medium text-foreground">{row.name}</td>
                <td className="p-4 text-right font-bold">{row.cur}</td>
                <td className="p-4 text-right text-muted-foreground">{row.prev}</td>
                <td className="p-4 text-right">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${row.pos ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                    {row.var}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
