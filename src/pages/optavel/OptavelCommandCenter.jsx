import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, BarChart2, Briefcase, Megaphone, TrendingUp, DollarSign, Users, LifeBuoy, Handshake, ArrowRight, CheckCircle2, Users as UsersIcon, AlertCircle } from 'lucide-react';
import { useQuery } from '@powersync/react';

const MODULES = [
  {
    id: 'executive',
    title: 'Executive',
    description: 'OKRs, Decisions, Cap Table',
    path: '/optavel/executive',
    icon: BarChart2,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10 group-hover:bg-indigo-500',
    border: 'hover:border-indigo-500/30'
  },
  {
    id: 'product',
    title: 'Product & Eng',
    description: 'Sprints, Kanban, Bugs',
    path: '/optavel/product',
    icon: Briefcase,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 group-hover:bg-blue-500',
    border: 'hover:border-blue-500/30'
  },
  {
    id: 'marketing',
    title: 'Marketing',
    description: 'Campaigns, SEO, Budget',
    path: '/optavel/marketing',
    icon: Megaphone,
    color: 'text-pink-500',
    bg: 'bg-pink-500/10 group-hover:bg-pink-500',
    border: 'hover:border-pink-500/30'
  },
  {
    id: 'sales',
    title: 'Sales',
    description: 'CRM Pipeline, Deals',
    path: '/optavel/sales',
    icon: TrendingUp,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10 group-hover:bg-amber-500',
    border: 'hover:border-amber-500/30'
  },
  {
    id: 'finance',
    title: 'Finance',
    description: 'Ledger, Revenue, Expenses',
    path: '/optavel/finance',
    icon: DollarSign,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 group-hover:bg-emerald-500',
    border: 'hover:border-emerald-500/30'
  },
  {
    id: 'hr',
    title: 'HR & Team',
    description: 'Directory, Time Off',
    path: '/optavel/hr',
    icon: Users,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10 group-hover:bg-purple-500',
    border: 'hover:border-purple-500/30'
  },
  {
    id: 'support',
    title: 'Support',
    description: 'Tickets, NPS',
    path: '/optavel/support',
    icon: LifeBuoy,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10 group-hover:bg-rose-500',
    border: 'hover:border-rose-500/30'
  },
  {
    id: 'partnerships',
    title: 'Partnerships',
    description: 'Resellers, Directory',
    path: '/optavel/partnerships',
    icon: Handshake,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10 group-hover:bg-cyan-500',
    border: 'hover:border-cyan-500/30'
  }
];

export default function OptavelCommandCenter() {
  const { data: tasksData } = useQuery('SELECT COUNT(*) as count FROM optavel_tasks WHERE status != ?', ['done']);
  const { data: employeesData } = useQuery('SELECT COUNT(*) as count FROM optavel_employees');
  const { data: ticketsData } = useQuery('SELECT COUNT(*) as count FROM optavel_support_tickets WHERE status != ?', ['resolved']);

  const activeTasks = tasksData?.[0]?.count || 0;
  const totalEmployees = employeesData?.[0]?.count || 0;
  const openTickets = ticketsData?.[0]?.count || 0;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-10 px-6">
      
      {/* Top Stats Section */}
      <div className="w-full max-w-6xl mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Command Center</h1>
            <p className="text-sm text-muted-foreground">Real-time overview of your Software organization</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Active Tasks</p>
              <h3 className="text-3xl font-bold text-foreground">{activeTasks}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Employees</p>
              <h3 className="text-3xl font-bold text-foreground">{totalEmployees}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-purple-500" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Open Support Tickets</p>
              <h3 className="text-3xl font-bold text-foreground">{openTickets}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-rose-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid - Minimalist, professional cards with varied colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
        {MODULES.map(mod => {
          const Icon = mod.icon;
          return (
            <Link key={mod.id} to={mod.path}
              className={`group relative bg-card border border-border rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 flex flex-col min-h-[200px] ${mod.border}`}>
              
              <div className="flex-1">
                {/* Colored Icon Container */}
                <div className={`w-10 h-10 rounded-xl border border-border flex items-center justify-center mb-5 transition-all duration-300 group-hover:text-white ${mod.bg} ${mod.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <h3 className="text-lg font-bold text-foreground mb-1">{mod.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{mod.description}</p>
              </div>

              {/* Minimalist Action indicator */}
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-border/40">
                <span className={`text-xs font-semibold text-muted-foreground transition-colors group-hover:${mod.color}`}>Access Module</span>
                <ArrowRight className={`w-4 h-4 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:${mod.color}`} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
