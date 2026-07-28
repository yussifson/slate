import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { ShieldCheck, MonitorSmartphone, LayoutGrid, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AccountPortal() {
  const { user, profile } = useAuth();
  
  const isSuperAdmin = profile?.role === 'super_admin' || user?.role === 'super_admin';
  const isPremium = profile?.plan === 'premium' || user?.plan === 'premium';
  
  const getInitials = (fullName, email) => {
    if (fullName) {
       const parts = fullName.split(' ');
       if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
       return fullName.substring(0, 2).toUpperCase();
    }
    if (email) return email.substring(0, 2).toUpperCase();
    return 'U';
  };

  const nameDisplay = user?.full_name 
    ? user.full_name
    : user?.email;

  const initials = getInitials(user?.full_name, user?.email);

  return (
    <div className="animate-in fade-in duration-300 max-w-4xl mx-auto space-y-10">
      
      {/* Premium Profile Header Section */}
      <div className="bg-white dark:bg-card border border-slate-200 dark:border-white/5 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        {/* Decorative dynamic ambient glow */}
        <div className="absolute -right-16 -top-16 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        
        <div className="relative group cursor-pointer shrink-0">
          <div className={`w-24 h-24 md:w-28 md:h-28 rounded-full bg-slate-900 text-white flex items-center justify-center text-3xl font-bold shadow-md relative z-10 transition-transform group-hover:scale-105 duration-300 overflow-hidden ${
             isSuperAdmin ? 'ring-4 ring-red-500/20' :
             isPremium ? 'ring-4 ring-primary/20' : 'ring-4 ring-slate-100 dark:ring-white/5'
          }`}>
            {user?.avatar_url ? (
               <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
               initials
            )}
          </div>
          
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-md border border-slate-200 dark:border-white/10 z-20 transition-transform group-hover:scale-110">
             <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
             </svg>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {nameDisplay}
            </h1>
            {isPremium && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 px-2 py-0.5 rounded-full shadow-sm">
                <Crown className="w-3 h-3 text-emerald-500" /> Premium
              </span>
            )}
            {isSuperAdmin && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-500/20 px-2 py-0.5 rounded-full shadow-sm">
                Super Admin
              </span>
            )}
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-[15px] font-medium leading-relaxed max-w-xl">
            Manage your personal credentials, customize visual security levels, track linked devices, and configure active subscriptions across all Optavel applications.
          </p>
        </div>
      </div>

      {/* Grid of Action Cards - Mockup Inspired */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Personal Info Card */}
        <Link to="/personal-info" className="flex flex-col p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-card hover:shadow-md transition-shadow group relative">
           <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[30%] bg-blue-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 shrink-0 border border-blue-100 dark:border-blue-900/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
           </div>
           <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Personal info</h2>
           <p className="text-slate-500 dark:text-slate-400 text-xs md:text-[13px] leading-relaxed mb-6 flex-1">
             Manage your profile credentials, configure email contacts, customize notification channels, and update onboarding preferences.
           </p>
           <div className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mt-auto group-hover:underline">
             Configure Profile
           </div>
        </Link>

        {/* Security Card */}
        <Link to="/security" className="flex flex-col p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-card hover:shadow-md transition-shadow group relative">
           <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[30%] bg-emerald-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 shrink-0 border border-emerald-100 dark:border-emerald-900/20">
              <ShieldCheck className="w-5 h-5" strokeWidth={2} />
           </div>
           <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Security Hub</h2>
           <p className="text-slate-500 dark:text-slate-400 text-xs md:text-[13px] leading-relaxed mb-6 flex-1">
             Upgrade authentication standards, adjust Multi-Factor setup, view active login sessions, and retrieve backup code sheets.
           </p>
           <div className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mt-auto group-hover:underline">
             Manage Security
           </div>
        </Link>

        {/* Payments & Subscriptions Card */}
        <Link to="/subscriptions" className="flex flex-col p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-card hover:shadow-md transition-shadow group relative">
           <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[30%] bg-purple-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6 shrink-0 border border-purple-100 dark:border-purple-900/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
           </div>
           <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Billing & Plans</h2>
           <p className="text-slate-500 dark:text-slate-400 text-xs md:text-[13px] leading-relaxed mb-6 flex-1">
             Review invoices, track recurring license balances, update primary credit/debit profiles, and configure upgrade paths.
           </p>
           <div className="text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mt-auto group-hover:underline">
             Review Billing
           </div>
        </Link>

      </div>
    </div>
  );
}
