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
    <nav aria-label="Engineering sections" className="divide-y rounded-xl border bg-card">{tabs.map(({ path, label, icon: Icon, description }) => <Link key={path} to={path} className={cn('flex items-center gap-4 p-4 transition hover:bg-muted/60', activePath === path && 'bg-primary/5')}><span className={cn('rounded-lg p-2', activePath === path ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}><Icon className="size-5" /></span><span className="min-w-0 flex-1"><span className="block font-semibold">{label}</span><span className="mt-1 block text-sm text-muted-foreground">{description}</span></span><span className="text-xs font-medium text-muted-foreground">Open</span></Link>)}</nav>
    <section className="rounded-xl border border-dashed bg-card p-6"><div className="flex items-center gap-3"><Layers className="size-5 text-primary" /><div><h2 className="font-semibold">Engineering control centre</h2><p className="mt-1 text-sm text-muted-foreground">Use the list above to move between engineering workspaces.</p></div></div></section>
  </div></main>;
}
