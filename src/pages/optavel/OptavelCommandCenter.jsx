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
  const { data: tasksData } = useQuery('SELECT COUNT(*) as count FROM optavel_tasks WHERE status != ? AND company_id = ?', ['done', user?.company_id]);
  const { data: employeesData } = useQuery('SELECT COUNT(*) as count FROM univ_hr_employees WHERE company_id = ?', [user?.company_id]);
  const { data: ticketsData } = useQuery('SELECT COUNT(*) as count FROM optavel_support_tickets WHERE status != ? AND company_id = ?', ['resolved', user?.company_id]);
  const { data: dealsData } = useQuery('SELECT COUNT(*) as count FROM optavel_deal_rooms WHERE stage != ? AND company_id = ?', ['closed_lost', user?.company_id]);

  const activeTasks = tasksData?.[0]?.count || 0;
  const totalEmployees = employeesData?.[0]?.count || 0;
  const openTickets = ticketsData?.[0]?.count || 0;
  const activeDeals = dealsData?.[0]?.count || 0;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background flex flex-col items-center py-6 px-6">
      
      <div className="w-full max-w-7xl">
        {/* Massive Colorful Header like Pharmacy */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-orange-500 p-6 md:p-8 mb-8 shadow-sm text-white">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-10 -mb-16 w-48 h-48 bg-black opacity-10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-inner">
                <LayoutDashboard className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-xl md:text-2xl mb-0.5">Welcome back, {user?.user_metadata?.full_name || 'Admin'} 👋</p>
                <p className="text-white/80 text-sm">{today}</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-white/80 font-medium text-xs mb-1 uppercase tracking-wider">System Status</p>
              <div className="text-2xl md:text-3xl font-black tabular-nums">All Systems Operational</div>
            </div>
          </div>
        </div>

        {/* Top Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Tasks Card */}
          <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
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
            <p className="text-sm font-semibold text-slate-700 dark:text-foreground">Active Tasks</p>
            <p className="text-xs text-slate-500 mt-1">across all projects</p>
          </div>
          
          {/* Total Employees Card */}
          <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
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
            <p className="text-sm font-semibold text-slate-700 dark:text-foreground">Total Employees</p>
            <p className="text-xs text-slate-500 mt-1">active staff members</p>
          </div>

          {/* Open Tickets Card */}
          <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
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
            <p className="text-sm font-semibold text-slate-700 dark:text-foreground">Open Support Tickets</p>
            <p className="text-xs text-slate-500 mt-1">requiring attention</p>
          </div>

          {/* Active Deals Card */}
          <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md text-xs font-bold">
                <ArrowUpRight className="w-3 h-3" />
                <span>+8%</span>
              </div>
            </div>
            <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-1">{activeDeals}</h3>
            <p className="text-sm font-semibold text-slate-700 dark:text-foreground">Active Deals</p>
            <p className="text-xs text-slate-500 mt-1">in sales pipeline</p>
          </div>
        </div>

        {/* Modules Grid */}
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 pl-2">Software Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MODULES.map(mod => {
            const Icon = mod.icon;
            return (
              <Link key={mod.id} to={mod.path}
                className="group bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-slate-300 dark:hover:border-slate-700 flex flex-col min-h-[220px]">
                
                <div className="flex-1">
                  <div className={`w-14 h-14 rounded-2xl ${mod.bg} flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon className={`w-7 h-7 ${mod.color}`} />
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{mod.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-muted-foreground leading-relaxed">{mod.description}</p>
                </div>

                <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-border">
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
