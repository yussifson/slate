import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BriefcaseBusiness, Calculator, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { path: '/engineering', label: 'Engineering', icon: Layers, description: 'Engineering control centre and technical workflows.' },
  { path: '/jcl/projects', label: 'Projects', icon: BriefcaseBusiness, description: 'Project delivery, phases and technical coordination.' },
  { path: '/boq', label: 'Bill of Quantities', icon: Calculator, description: 'Quantities, rates and project measurement.' },
];

export default function JCLEngineering() {
  const location = useLocation();
  const activePath = location.pathname === '/engineering' ? '/engineering' : location.pathname;
  return <main className="min-h-full bg-background p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl space-y-6">
    <header><p className="text-sm font-medium text-primary">JCL Royal Group / Engineering</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Engineering</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Coordinate project technical work from one focused workspace.</p></header>
    <nav aria-label="Engineering sections" className="grid gap-3 md:grid-cols-3">{tabs.map(({ path, label, icon: Icon, description }) => <Link key={path} to={path} className={cn('group rounded-xl border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm', activePath === path && 'border-primary bg-primary/5 shadow-sm')}><div className="flex items-start justify-between gap-3"><span className={cn('rounded-lg p-2', activePath === path ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}><Icon className="size-5" /></span><span className="text-xs font-medium text-muted-foreground">Open</span></div><h2 className="mt-5 font-semibold">{label}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></Link>)}</nav>
    <section className="rounded-xl border border-dashed bg-card p-8 text-center"><Layers className="mx-auto size-8 text-primary" /><h2 className="mt-3 font-semibold">Engineering control centre</h2><p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">Use the tabs above to move between projects and the Bill of Quantities without adding more permanent items to the sidebar.</p></section>
  </div></main>;
}
