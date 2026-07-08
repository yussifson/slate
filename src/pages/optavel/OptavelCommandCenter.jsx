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
  const { data: dealsData } = useQuery('SELECT COUNT(*) as count FROM optavel_deal_rooms WHERE stage != ?', ['closed_lost']);

  const activeTasks = tasksData?.[0]?.count || 0;
  const totalEmployees = employeesData?.[0]?.count || 0;
  const openTickets = ticketsData?.[0]?.count || 0;
  const activeDeals = dealsData?.[0]?.count || 0;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col items-center py-6 px-6">
      
      <div className="w-full max-w-7xl">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 p-8 sm:p-10 text-white shadow-2xl shadow-emerald-500/20 mb-8">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl mix-blend-overlay pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-emerald-900 opacity-20 rounded-full blur-2xl mix-blend-overlay pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                  <LayoutDashboard className="w-6 h-6 text-emerald-100" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Welcome back, {user?.company_name || user?.user_metadata?.full_name || 'Admin'}</h1>
              </div>
              <p className="text-emerald-100 text-lg font-medium tracking-wide">Platform Command Center</p>
              <div className="mt-6 flex items-center gap-4 text-sm font-medium text-emerald-100/80">
                <span className="flex items-center gap-2">
                  {today}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-inner">
              <div className="text-right">
                <p className="text-xs text-emerald-200 font-bold uppercase tracking-wider mb-1">System Status</p>
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                  All Systems Operational
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          <div className="bg-card rounded-2xl border-0 p-5 flex items-center gap-5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground tracking-[-0.03em]">{activeTasks}</p>
              <p className="text-sm font-medium text-muted-foreground tracking-tight mt-0.5">Active Tasks</p>
            </div>
          </div>
          
          <div className="bg-card rounded-2xl border-0 p-5 flex items-center gap-5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
              <UsersIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground tracking-[-0.03em]">{totalEmployees}</p>
              <p className="text-sm font-medium text-muted-foreground tracking-tight mt-0.5">Total Employees</p>
            </div>
          </div>

          <div className="bg-card rounded-2xl border-0 p-5 flex items-center gap-5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground tracking-[-0.03em]">{openTickets}</p>
              <p className="text-sm font-medium text-muted-foreground tracking-tight mt-0.5">Open Tickets</p>
            </div>
          </div>

          <div className="bg-card rounded-2xl border-0 p-5 flex items-center gap-5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground tracking-[-0.03em]">{activeDeals}</p>
              <p className="text-sm font-medium text-muted-foreground tracking-tight mt-0.5">Active Deals</p>
            </div>
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
