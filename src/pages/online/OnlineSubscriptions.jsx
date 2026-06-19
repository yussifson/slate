import React from 'react';
import { CreditCard, CheckCircle2, Clock, ShieldCheck, ArrowRight} from 'lucide-react';

export default function OnlineSubscriptions() {
 return (
 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto py-8 px-4">
 <div className="text-center max-w-2xl mx-auto mb-12">
 <h1 className="text-4xl font-semibold font-display text-[var(--color-text-primary)] mb-4 tracking-[-0.02em]">Pro Membership</h1>
 <p className="text-lg text-[var(--color-text-secondary)]">Unlock unlimited access to all premium courses, live sessions, and exclusive community forums.</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
 {/* Monthly Plan */}
 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-8 hover:border-[var(--primary)] transition-colors relative flex flex-col">
 <h2 className="text-2xl font-semibold font-display text-[var(--color-text-primary)] mb-2 tracking-[-0.02em]">Monthly</h2>
 <p className="text-[var(--color-text-secondary)] text-sm mb-6">Perfect for short-term learning goals.</p>
 <div className="flex items-end gap-2 mb-8">
 <span className="text-5xl font-semibold font-display text-[var(--color-text-primary)] tracking-[-0.02em]">$29</span>
 <span className="text-[var(--color-text-secondary)] font-medium mb-1">/month</span>
 </div>
 
 <div className="space-y-4 flex-1 mb-8">
 <div className="flex items-start gap-3">
 <CheckCircle2 className="w-5 h-5 text-[var(--color-success)] flex-shrink-0" />
 <span className="text-sm text-[var(--color-text-primary)]">Access to 500+ courses</span>
 </div>
 <div className="flex items-start gap-3">
 <CheckCircle2 className="w-5 h-5 text-[var(--color-success)] flex-shrink-0" />
 <span className="text-sm text-[var(--color-text-primary)]">Weekly live Q&A sessions</span>
 </div>
 <div className="flex items-start gap-3">
 <CheckCircle2 className="w-5 h-5 text-[var(--color-success)] flex-shrink-0" />
 <span className="text-sm text-[var(--color-text-primary)]">Community forum access</span>
 </div>
 <div className="flex items-start gap-3">
 <CheckCircle2 className="w-5 h-5 text-[var(--color-success)] flex-shrink-0" />
 <span className="text-sm text-[var(--color-text-primary)]">Cancel anytime</span>
 </div>
 </div>

 <button className="w-full py-3 bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-[var(--color-text-primary)] font-semibold rounded-md-[var(--radius-md)] hover:bg-[var(--color-surface-2)] transition-colors">
 Subscribe Monthly
 </button>
 </div>

 {/* Annual Plan */}
 <div className="bg-[var(--primary)] rounded-md-[var(--radius-xl)] p-8 relative flex flex-col text-white transform md:-translate-y-4 border-[0.5px] border-black/9 dark:border-white/8 border-[var(--primary)]">
 <div className="absolute top-0 right-0 bg-[var(--color-warning)] text-[var(--color-warning-foreground)] text-xs font-semibold px-3 py-1 rounded-md-bl-[var(--radius-lg)] rounded-md-tr-[var(--radius-xl)] uppercase tracking-wider tracking-[0.04em]">
 Best Value
 </div>
 <h2 className="text-2xl font-semibold font-display mb-2 tracking-[-0.02em]">Annually</h2>
 <p className="text-white/80 text-sm mb-6">Commit to your growth and save 20%.</p>
 <div className="flex items-end gap-2 mb-8">
 <span className="text-5xl font-semibold font-display tracking-[-0.02em]">$278</span>
 <span className="text-white/80 font-medium mb-1">/year</span>
 </div>
 
 <div className="space-y-4 flex-1 mb-8">
 <div className="flex items-start gap-3">
 <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
 <span className="text-sm">Everything in Monthly</span>
 </div>
 <div className="flex items-start gap-3">
 <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
 <span className="text-sm font-semibold">1-on-1 Mentorship Session</span>
 </div>
 <div className="flex items-start gap-3">
 <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
 <span className="text-sm font-semibold">Downloadable offline courses</span>
 </div>
 <div className="flex items-start gap-3">
 <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
 <span className="text-sm font-semibold">Official physical certificate</span>
 </div>
 </div>

 <button className="w-full py-3 bg-white dark:bg-slate-900/40 text-[var(--primary)] font-semibold rounded-md-[var(--radius-md)] hover:bg-gray-50 transition-colors  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 Subscribe Annually
 </button>
 </div>
 </div>

 <div className="max-w-4xl mx-auto mt-12 bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 flex items-center justify-between">
 <div>
 <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-[var(--color-success)]" /> 30-Day Money-Back Guarantee</h3>
 <p className="text-sm text-[var(--color-text-secondary)] mt-1">If you're not completely satisfied, we'll refund your payment. No questions asked.</p>
 </div>
 </div>
 </div>
 );
}
