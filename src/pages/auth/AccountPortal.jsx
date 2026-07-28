import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { ShieldCheck, MonitorSmartphone, LayoutGrid, Crown, ArrowRight, User, Settings, Sparkles } from 'lucide-react';
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
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto space-y-10">
      
      {/* Premium Header Banner with custom background gradients */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-950 text-white p-8 sm:p-10 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
          <div className="relative shrink-0 group">
            <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-primary text-white flex items-center justify-center text-3xl font-bold shadow-lg overflow-hidden transition-transform group-hover:scale-105 duration-300 ring-4 ring-white/10 dark:ring-black/20 ${
              isSuperAdmin ? 'border-2 border-red-500' : isPremium ? 'border-2 border-amber-400' : ''
            }`}>
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            {isPremium && (
              <span className="absolute -top-2.5 -right-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-black text-[10px] font-bold py-1 px-2.5 rounded-full shadow-md border border-white/20 flex items-center gap-1">
                <Crown className="w-3 h-3" /> Premium
              </span>
            )}
            {isSuperAdmin && (
              <span className="absolute -top-2.5 -right-2.5 bg-gradient-to-r from-red-600 to-rose-500 text-white text-[10px] font-bold py-1 px-2.5 rounded-full shadow-md border border-white/20">
                Admin
              </span>
            )}
          </div>

          <div className="text-center md:text-left flex-1 space-y-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              <Sparkles className="w-3 h-3" /> Identity Account
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Welcome back, {nameDisplay}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
              Manage your profile configurations, active ecosystem subscriptions, connected devices, security checkpoints, and privacy parameters from a single pane.
            </p>
          </div>
        </div>
      </div>

      {/* Modern Mockup styled Cards grid */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 px-1">Settings Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Card 1: Personal Info */}
          <Link to="/personal-info" className="group relative flex flex-col p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-[#111827] hover:shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300">
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 transition-transform group-hover:scale-105 duration-300">
              <User className="w-5 h-5" strokeWidth={2} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 tracking-tight">Personal Profile</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-6 flex-1 font-medium">
              Update your personal credentials, customize avatar displays, and check sync metadata.
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mt-auto group-hover:translate-x-1 transition-transform">
              Edit Details <ArrowRight className="w-3 h-3" />
            </span>
          </Link>

          {/* Card 2: Security */}
          <Link to="/security" className="group relative flex flex-col p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-[#111827] hover:shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 transition-transform group-hover:scale-105 duration-300">
              <ShieldCheck className="w-5 h-5" strokeWidth={2} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 tracking-tight">Security Center</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-6 flex-1 font-medium">
              Manage multi-factor verification, audit login alerts, and update account access keys.
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mt-auto group-hover:translate-x-1 transition-transform">
              Review Settings <ArrowRight className="w-3 h-3" />
            </span>
          </Link>

          {/* Card 3: Payments & Billing */}
          <Link to="/subscriptions" className="group relative flex flex-col p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-[#111827] hover:shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300">
            <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 transition-transform group-hover:scale-105 duration-300">
              <MonitorSmartphone className="w-5 h-5" strokeWidth={2} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 tracking-tight">Ecosystem Subscriptions</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-6 flex-1 font-medium">
              Manage active licenses, plan configurations, billing methods, and invoices.
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mt-auto group-hover:translate-x-1 transition-transform">
              Manage Billing <ArrowRight className="w-3 h-3" />
            </span>
          </Link>

        </div>
      </div>

    </div>
  );
}
