import React from 'react';
import { Users, TrendingUp, DollarSign, Link as LinkIcon, Copy} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip} from 'recharts';

export default function OnlineAffiliates() {
 const chartData = [
 { name: 'Mon', clicks: 120, conversions: 12},
 { name: 'Tue', clicks: 190, conversions: 19},
 { name: 'Wed', clicks: 150, conversions: 15},
 { name: 'Thu', clicks: 220, conversions: 22},
 { name: 'Fri', clicks: 280, conversions: 28},
 { name: 'Sat', clicks: 350, conversions: 35},
 { name: 'Sun', clicks: 310, conversions: 31},
 ];

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 py-6">
 <div className="border-b border-primary/40 pb-4 flex justify-between items-end">
 <div>
 <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">Affiliate Dashboard</h1>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Track your referrals, conversions, and commission payouts.</p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 flex flex-col justify-center">
 <div className="flex items-center gap-3 mb-2">
 <div className="w-10 h-10 rounded-md-full bg-[var(--color-info-subtle)] flex items-center justify-center text-[var(--color-info)]">
 <Users className="w-5 h-5" />
 </div>
 <h3 className="font-semibold text-[var(--color-text-secondary)] text-sm uppercase tracking-wider tracking-[0.04em]">Total Referrals</h3>
 </div>
 <p className="text-4xl font-semibold font-display text-[var(--color-text-primary)] tracking-[-0.02em]">1,248</p>
 </div>
 
 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 flex flex-col justify-center">
 <div className="flex items-center gap-3 mb-2">
 <div className="w-10 h-10 rounded-md-full bg-[var(--color-warning-subtle)] flex items-center justify-center text-[var(--color-warning)]">
 <TrendingUp className="w-5 h-5" />
 </div>
 <h3 className="font-semibold text-[var(--color-text-secondary)] text-sm uppercase tracking-wider tracking-[0.04em]">Conversion Rate</h3>
 </div>
 <p className="text-4xl font-semibold font-display text-[var(--color-text-primary)] tracking-[-0.02em]">4.2%</p>
 </div>
 
 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 flex flex-col justify-center">
 <div className="flex items-center gap-3 mb-2">
 <div className="w-10 h-10 rounded-md-full bg-[var(--color-success-subtle)] flex items-center justify-center text-[var(--color-success)]">
 <DollarSign className="w-5 h-5" />
 </div>
 <h3 className="font-semibold text-[var(--color-text-secondary)] text-sm uppercase tracking-wider tracking-[0.04em]">Earned Commission</h3>
 </div>
 <p className="text-4xl font-semibold font-display text-[var(--color-text-primary)] tracking-[-0.02em]">$4,250</p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6">
 <h2 className="font-semibold text-[var(--color-text-primary)] mb-6 font-display">Performance Overview</h2>
 <div className="h-[300px] w-full">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0}}>
 <defs>
 <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3}/>
 <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--primary) / 0.4)" />
 <XAxis dataKey="name" tick={{fill: 'var(--color-text-secondary)', fontSize: 12}} axisLine={false} tickLine={false} />
 <YAxis tick={{fill: 'var(--color-text-secondary)', fontSize: 12}} axisLine={false} tickLine={false} />
 <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface-0)', borderColor: "hsl(var(--primary) / 0.4)", borderRadius: '8px'}} />
 <Area type="monotone" dataKey="clicks" stroke="var(--chart-1)" fillOpacity={1} fill="url(#colorClicks)" strokeWidth={2} name="Clicks" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 <div className="space-y-6">
 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6">
 <h2 className="font-semibold text-[var(--color-text-primary)] mb-4 font-display flex items-center gap-2">
 <LinkIcon className="w-5 h-5 text-[var(--primary)]" /> Your Affiliate Link
 </h2>
 <p className="text-sm text-[var(--color-text-secondary)] mb-4">Share this link to earn a 20% commission on every course purchased.</p>
 <div className="flex bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-md)] p-1">
 <input 
 type="text" 
 readOnly 
 value="https://airflake.com/ref/johndoe123" 
 className="w-full bg-transparent px-3 text-[var(--text-sm)] text-[var(--color-text-primary)] focus:outline-none"
 />
 <button className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-2 rounded-md-[var(--radius-sm)] hover:bg-[var(--color-surface-2)] transition-colors text-[var(--color-text-primary)] ">
 <Copy className="w-4 h-4" />
 </button>
 </div>
 </div>

 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6">
 <h2 className="font-semibold text-[var(--color-text-primary)] mb-4 font-display">Recent Payouts</h2>
 <div className="space-y-3">
 <div className="flex justify-between items-center py-2 border-b border-primary/40">
 <div>
 <p className="text-sm font-semibold text-[var(--color-text-primary)]">Oct 01, 2026</p>
 <p className="text-xs text-[var(--color-text-secondary)] tracking-[0.04em]">PayPal</p>
 </div>
 <span className="font-semibold text-[var(--color-success)]">+$450.00</span>
 </div>
 <div className="flex justify-between items-center py-2 border-b border-primary/40">
 <div>
 <p className="text-sm font-semibold text-[var(--color-text-primary)]">Sep 01, 2026</p>
 <p className="text-xs text-[var(--color-text-secondary)] tracking-[0.04em]">PayPal</p>
 </div>
 <span className="font-semibold text-[var(--color-success)]">+$320.00</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
