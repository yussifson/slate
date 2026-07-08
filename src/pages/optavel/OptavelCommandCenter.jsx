import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, BarChart2, Briefcase, Megaphone, TrendingUp, DollarSign, Users, LifeBuoy, Handshake, ArrowRight } from 'lucide-react';

const MODULES = [
  {
    id: 'executive',
    title: 'Executive',
    description: 'OKRs, Decisions, Cap Table',
    path: '/optavel/executive',
    icon: BarChart2
  },
  {
    id: 'product',
    title: 'Product & Eng',
    description: 'Sprints, Kanban, Bugs',
    path: '/optavel/product',
    icon: Briefcase
  },
  {
    id: 'marketing',
    title: 'Marketing',
    description: 'Campaigns, SEO, Budget',
    path: '/optavel/marketing',
    icon: Megaphone
  },
  {
    id: 'sales',
    title: 'Sales',
    description: 'CRM Pipeline, Deals',
    path: '/optavel/sales',
    icon: TrendingUp
  },
  {
    id: 'finance',
    title: 'Finance',
    description: 'Ledger, Revenue, Expenses',
    path: '/optavel/finance',
    icon: DollarSign
  },
  {
    id: 'hr',
    title: 'HR & Team',
    description: 'Directory, Time Off',
    path: '/optavel/hr',
    icon: Users
  },
  {
    id: 'support',
    title: 'Support',
    description: 'Tickets, NPS',
    path: '/optavel/support',
    icon: LifeBuoy
  },
  {
    id: 'partnerships',
    title: 'Partnerships',
    description: 'Resellers, Directory',
    path: '/optavel/partnerships',
    icon: Handshake
  }
];

export default function OptavelCommandCenter() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-20 px-6">
      
      {/* Header section - Clean and authoritative */}
      <div className="text-center max-w-2xl mb-16">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-6 ring-1 ring-primary/20">
          <LayoutDashboard className="w-6 h-6" />
        </div>
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-4">
          Command Center
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Central operations hub for OptaVel OS. Access department-specific workflows, analytics, and team collaborations from one secure portal.
        </p>
      </div>

      {/* Grid - Minimalist, professional cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
        {MODULES.map(mod => {
          const Icon = mod.icon;
          return (
            <Link key={mod.id} to={mod.path}
              className="group relative bg-card border border-border rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 hover:border-primary/30 flex flex-col min-h-[200px]">
              
              <div className="flex-1">
                {/* Elegant Icon Container */}
                <div className="w-10 h-10 rounded-xl bg-muted/50 border border-border flex items-center justify-center mb-5 group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground text-muted-foreground transition-all duration-300">
                  <Icon className="w-5 h-5" />
                </div>
                
                <h3 className="text-lg font-bold text-foreground mb-1">{mod.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{mod.description}</p>
              </div>

              {/* Minimalist Action indicator */}
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-border/40">
                <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">Access Module</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all duration-300 group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
