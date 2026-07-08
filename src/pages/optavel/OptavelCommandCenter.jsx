import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, BarChart2, Briefcase, Megaphone, TrendingUp, DollarSign, Users, LifeBuoy, Handshake, ChevronRight, Zap } from 'lucide-react';

const MODULES = [
  {
    id: 'executive',
    title: 'Executive',
    description: 'OKRs, Decisions, Cap Table',
    path: '/optavel/executive',
    icon: BarChart2,
    gradient: 'from-blue-500 to-indigo-500',
    shadow: 'shadow-blue-500/20'
  },
  {
    id: 'product',
    title: 'Product & Eng',
    description: 'Sprints, Kanban, Bugs',
    path: '/optavel/product',
    icon: Briefcase,
    gradient: 'from-emerald-500 to-teal-500',
    shadow: 'shadow-emerald-500/20'
  },
  {
    id: 'marketing',
    title: 'Marketing',
    description: 'Campaigns, SEO, Budget',
    path: '/optavel/marketing',
    icon: Megaphone,
    gradient: 'from-pink-500 to-rose-500',
    shadow: 'shadow-pink-500/20'
  },
  {
    id: 'sales',
    title: 'Sales',
    description: 'CRM Pipeline, Deals',
    path: '/optavel/sales',
    icon: TrendingUp,
    gradient: 'from-amber-500 to-orange-500',
    shadow: 'shadow-amber-500/20'
  },
  {
    id: 'finance',
    title: 'Finance',
    description: 'Ledger, Revenue, Expenses',
    path: '/optavel/finance',
    icon: DollarSign,
    gradient: 'from-green-500 to-emerald-500',
    shadow: 'shadow-green-500/20'
  },
  {
    id: 'hr',
    title: 'HR & Team',
    description: 'Directory, Time Off',
    path: '/optavel/hr',
    icon: Users,
    gradient: 'from-purple-500 to-fuchsia-500',
    shadow: 'shadow-purple-500/20'
  },
  {
    id: 'support',
    title: 'Support',
    description: 'Tickets, NPS',
    path: '/optavel/support',
    icon: LifeBuoy,
    gradient: 'from-cyan-500 to-blue-500',
    shadow: 'shadow-cyan-500/20'
  },
  {
    id: 'partnerships',
    title: 'Partnerships',
    description: 'Resellers, Directory',
    path: '/optavel/partnerships',
    icon: Handshake,
    gradient: 'from-yellow-500 to-amber-500',
    shadow: 'shadow-yellow-500/20'
  }
];

export default function OptavelCommandCenter() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center py-16 px-6">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Header */}
      <div className="text-center max-w-3xl mb-16 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold text-sm mb-6 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
          <ShieldAlert className="w-4 h-4" /> OptaVel Internal OS
        </div>
        <h1 className="text-5xl font-black text-foreground tracking-tight mb-6 leading-tight">
          Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">Command Center</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Central operations hub for OptaVel OS. Access department-specific workflows, analytics, and team collaborations from one secure portal.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl relative z-10">
        {MODULES.map(mod => {
          const Icon = mod.icon;
          return (
            <Link key={mod.id} to={mod.path}
              className="group relative bg-card/60 backdrop-blur-xl border border-border rounded-3xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-primary/50 overflow-hidden flex flex-col justify-between min-h-[220px]">
              
              {/* Subtle hover gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${mod.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              
              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mod.gradient} p-0.5 mb-6 shadow-lg ${mod.shadow} group-hover:scale-110 transition-transform duration-300`}>
                  <div className="w-full h-full bg-card rounded-[14px] flex items-center justify-center">
                    <Icon className={`w-6 h-6 text-transparent bg-clip-text bg-gradient-to-br ${mod.gradient}`} style={{ color: 'inherit' }} />
                    <Icon className="w-6 h-6 absolute text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{mod.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{mod.description}</p>
              </div>

              <div className="relative z-10 flex items-center justify-between mt-6 pt-4 border-t border-border/50 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1">
                  Launch Module <Zap className="w-3 h-3" />
                </span>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-primary" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
