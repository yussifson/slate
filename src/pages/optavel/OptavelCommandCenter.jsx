import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, BarChart2, Briefcase, Megaphone, TrendingUp, DollarSign, Users, LifeBuoy, Handshake } from 'lucide-react';

export default function OptavelCommandCenter() {
  const MODULES = [
    { title: 'Executive', path: '/optavel/executive', icon: BarChart2, color: 'violet', desc: 'OKRs, Decisions, Cap Table' },
    { title: 'Product & Eng', path: '/optavel/product-eng', icon: Briefcase, color: 'blue', desc: 'Sprints, Kanban, Bugs' },
    { title: 'Marketing', path: '/optavel/marketing', icon: Megaphone, color: 'pink', desc: 'Campaigns, SEO, Budget' },
    { title: 'Sales', path: '/optavel/sales', icon: TrendingUp, color: 'emerald', desc: 'CRM Pipeline, Deals' },
    { title: 'Finance', path: '/optavel/finance', icon: DollarSign, color: 'emerald', desc: 'Ledger, Revenue, Expenses' },
    { title: 'HR & Team', path: '/optavel/hr', icon: Users, color: 'pink', desc: 'Directory, Time Off' },
    { title: 'Support', path: '/optavel/support', icon: LifeBuoy, color: 'blue', desc: 'Tickets, NPS' },
    { title: 'Partnerships', path: '/optavel/partnerships', icon: Handshake, color: 'amber', desc: 'Resellers, Directory' },
  ];

  return (
    <div className="min-h-screen p-6 md:p-10 bg-background text-foreground" >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-muted rounded-2xl border border-border mb-4 shadow-2xl">
            <ShieldAlert className="w-10 h-10 text-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
            OptaVel OS
          </h1>
          <p className="text-muted-foreground mt-3 text-lg max-w-2xl mx-auto">
            Internal Operations Command Center. Select a module below to access department-specific workflows and analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODULES.map(mod => {
            const Icon = mod.icon;
            return (
              <Link key={mod.title} to={mod.path}
                className="group relative bg-muted backdrop-blur-xl border border-border rounded-2xl p-6 hover:bg-muted/80 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-primary/5 overflow-hidden block">
                <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-${mod.color}-500/10 blur-2xl group-hover:bg-${mod.color}-500/20 transition-all`} />
                <div className={`w-12 h-12 rounded-xl bg-${mod.color}-500/20 flex items-center justify-center mb-4 border border-${mod.color}-500/30`}>
                  <Icon className={`w-6 h-6 text-${mod.color}-400`} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-1">{mod.title}</h3>
                <p className="text-sm text-muted-foreground">{mod.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
