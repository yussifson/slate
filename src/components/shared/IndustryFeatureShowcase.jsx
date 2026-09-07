import React from 'react';
import { getIndustryFeatures } from '@/lib/companyDomainResolver';
import {
  Building2, Users, FileText, BarChart3, Scale, ShieldCheck, Clock, FolderOpen,
  GraduationCap, Calendar, Award, Users2, Stethoscope, Bed, Pill, Receipt,
  BedDouble, BellRing, TrendingUp, ShoppingCart, Package, Truck, Tag, Zap, BarChart2,
  Compass, CheckCircle2, Sparkles, Layers, Landmark
} from 'lucide-react';

const ICON_MAP = {
  Building2, Users, FileText, BarChart3, Scale, ShieldCheck, Clock, FolderOpen,
  GraduationCap, Calendar, Award, Users2, Stethoscope, Bed, Pill, Receipt,
  BedDouble, BellRing, TrendingUp, ShoppingCart, Package, Truck, Tag, Zap, BarChart2,
  Compass, CheckCircle2, Sparkles, Layers, Landmark
};

export default function IndustryFeatureShowcase({ companyName, industryType }) {
  const showcase = getIndustryFeatures(industryType, companyName || 'Workspace');

  return (
    <div className="relative z-10 w-full max-w-xl bg-white/95 backdrop-blur-2xl rounded-[2.5rem] border border-slate-200/90 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] p-8 lg:p-10 flex flex-col justify-between text-slate-900 overflow-hidden">
      {/* Ambient background glow orbs */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-[90px] pointer-events-none" />

      <div className="relative z-10">
        {/* Header Pill */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-semibold text-emerald-800 mb-5 shadow-xs">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          <span className="tracking-wide uppercase text-[11px] font-bold">{showcase.badge || 'Enterprise Suite'}</span>
        </div>

        <h3 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-2.5 leading-[1.15] tracking-tight">
          {showcase.title}
        </h3>
        <p className="text-sm text-slate-600 font-normal max-w-lg leading-relaxed mb-6">
          {showcase.subtitle}
        </p>

        {/* Business Status & Verification Card */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-700">
            <span className="flex items-center gap-2 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Verified Enterprise Workspace</span>
            </span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold uppercase tracking-wider">
              Live & Synced
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center text-xs pt-0.5">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-xs">
              <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider mb-0.5">Platform</span>
              <span className="font-bold text-slate-900 tracking-tight">Real-Time</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-xs">
              <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider mb-0.5">Security</span>
              <span className="font-bold text-emerald-700 tracking-tight">Encrypted</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-xs">
              <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider mb-0.5">Cloud Sync</span>
              <span className="font-bold text-indigo-700 tracking-tight">99.9% Uptime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5 border-t border-slate-200/80">
        {showcase.features.map((feat, idx) => {
          const IconComponent = ICON_MAP[feat.icon] || Zap;
          return (
            <div 
              key={idx} 
              className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-emerald-50/30 border border-slate-200/70 hover:border-emerald-500/30 transition-all duration-200 shadow-xs"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-100/80 border border-emerald-200/80 flex items-center justify-center text-emerald-700 mb-2.5 shadow-xs">
                <IconComponent className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-0.5 tracking-tight">{feat.title}</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">{feat.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
