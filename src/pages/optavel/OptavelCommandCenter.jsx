import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, BarChart2, Briefcase, Megaphone, TrendingUp, DollarSign, Users, LifeBuoy, Handshake, ArrowRight, CheckCircle2, Users as UsersIcon, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useQuery } from '@powersync/react';
import { useAuth } from '@/lib/AuthContext';

const MODULES = [
  {
    id: 'executive',
    title: 'Executive',
    description: 'OKRs, Decisions, Cap Table',
    path: '/optavel/executive',
    icon: BarChart2,
    color: 'text-indigo-600',
    bg: 'bg-indigo-100',
    solid: 'bg-indigo-600'
  },
  {
    id: 'product',
    title: 'Product & Eng',
    description: 'Sprints, Kanban, Bugs',
    path: '/optavel/product',
    icon: Briefcase,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    solid: 'bg-blue-600'
  },
  {
    id: 'marketing',
    title: 'Marketing',
    description: 'Campaigns, SEO, Budget',
    path: '/optavel/marketing',
    icon: Megaphone,
    color: 'text-pink-600',
    bg: 'bg-pink-100',
    solid: 'bg-pink-600'
  },
  {
    id: 'sales',
    title: 'Sales',
    description: 'CRM Pipeline, Deals',
    path: '/optavel/sales',
    icon: TrendingUp,
    color: 'text-amber-500',
    bg: 'bg-amber-100',
    solid: 'bg-amber-500'
  },
  {
    id: 'finance',
    title: 'Finance',
    description: 'Ledger, Revenue, Expenses',
    path: '/optavel/finance',
    icon: DollarSign,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
    solid: 'bg-emerald-600'
  },
  {
    id: 'hr',
    title: 'HR & Team',
    description: 'Directory, Time Off',
    path: '/optavel/hr',
    icon: Users,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
    solid: 'bg-purple-600'
  },
  {
    id: 'support',
    title: 'Support',
    description: 'Tickets, NPS',
    path: '/optavel/support',
    icon: LifeBuoy,
    color: 'text-rose-600',
    bg: 'bg-rose-100',
    solid: 'bg-rose-600'
  },
  {
    id: 'partnerships',
    title: 'Partnerships',
    description: 'Resellers, Directory',
    path: '/optavel/partnerships',
    icon: Handshake,
    color: 'text-cyan-600',
    bg: 'bg-cyan-100',
    solid: 'bg-cyan-600'
  }
];

export default function OptavelCommandCenter() {
  const { user } = useAuth();
  const { data: tasksData } = useQuery('SELECT COUNT(*) as count FROM optavel_tasks WHERE status != ?', ['done']);
  const { data: employeesData } = useQuery('SELECT COUNT(*) as count FROM optavel_employees');
  const { data: ticketsData } = useQuery('SELECT COUNT(*) as count FROM optavel_support_tickets WHERE status != ?', ['resolved']);

  const activeTasks = tasksData?.[0]?.count || 0;
  const totalEmployees = employeesData?.[0]?.count || 0;
  const openTickets = ticketsData?.[0]?.count || 0;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col items-center py-6 px-6">
      
      <div className="w-full max-w-7xl">
        {/* Massive Colorful Header like Pharmacy */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-emerald-500 to-blue-600 p-8 md:p-10 mb-8 shadow-lg shadow-primary/20 text-white">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-10 -mb-16 w-48 h-48 bg-black opacity-10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-inner">
                <LayoutDashboard className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Command Center</h1>
                <p className="text-primary-foreground/90 font-medium text-lg">Welcome back, {user?.user_metadata?.full_name || 'Admin'} 👋</p>
                <p className="text-primary-foreground/70 text-sm mt-1">{today}</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-primary-foreground/80 font-medium text-sm mb-1 uppercase tracking-wider">System Status</p>
              <div className="text-4xl font-black tabular-nums">All Systems Operational</div>
            </div>
          </div>
        </div>

        {/* Top Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Active Tasks Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md text-xs font-bold">
                <ArrowUpRight className="w-3 h-3" />
                <span>+12%</span>
              </div>
            </div>
            <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-1">{activeTasks}</h3>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Active Tasks</p>
            <p className="text-xs text-slate-500 mt-1">across all projects</p>
          </div>
          
          {/* Total Employees Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                <UsersIcon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md text-xs font-bold">
                <ArrowUpRight className="w-3 h-3" />
                <span>+4%</span>
              </div>
            </div>
            <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-1">{totalEmployees}</h3>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Employees</p>
            <p className="text-xs text-slate-500 mt-1">active staff members</p>
          </div>

          {/* Open Tickets Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-rose-600 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded-md text-xs font-bold">
                <ArrowDownRight className="w-3 h-3" />
                <span>-2%</span>
              </div>
            </div>
            <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-1">{openTickets}</h3>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Open Support Tickets</p>
            <p className="text-xs text-slate-500 mt-1">requiring attention</p>
          </div>
        </div>

        {/* Modules Grid */}
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 pl-2">Software Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MODULES.map(mod => {
            const Icon = mod.icon;
            return (
              <Link key={mod.id} to={mod.path}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-slate-300 dark:hover:border-slate-700 flex flex-col min-h-[220px]">
                
                <div className="flex-1">
                  <div className={`w-14 h-14 rounded-2xl ${mod.bg} flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon className={`w-7 h-7 ${mod.color}`} />
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{mod.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{mod.description}</p>
                </div>

                <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className={`text-xs font-bold ${mod.color}`}>Access Module</span>
                  <div className={`w-6 h-6 rounded-full ${mod.bg} flex items-center justify-center transition-all duration-300 group-hover:translate-x-1`}>
                    <ArrowRight className={`w-3 h-3 ${mod.color}`} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
}
