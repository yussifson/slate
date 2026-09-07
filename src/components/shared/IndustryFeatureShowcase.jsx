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
    <div className="relative z-10 w-full max-w-2xl bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-950/95 backdrop-blur-3xl rounded-[2.5rem] border border-white/[0.12] shadow-[0_32px_100px_-20px_rgba(0,0,0,0.7)] p-8 lg:p-12 flex flex-col justify-between text-white overflow-hidden">
      {/* Ambient background glow orbs */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

      <div className="relative z-10">
        {/* Header Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-semibold text-emerald-300 mb-6 backdrop-blur-md shadow-sm">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="tracking-wide uppercase text-[11px] font-bold">{showcase.badge || 'Enterprise Operating System'}</span>
        </div>

        <h3 className="text-3xl lg:text-4xl font-extrabold text-white mb-3 leading-[1.12] tracking-tight">
          {showcase.title}
        </h3>
        <p className="text-sm lg:text-[15px] text-slate-300/90 font-normal max-w-lg leading-relaxed mb-8">
          {showcase.subtitle}
        </p>

        {/* Floating Command Preview Card */}
        <div className="mb-8 p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl space-y-3.5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-2 font-semibold text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Dedicated Enterprise Instance</span>
            </span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase tracking-wider">
              Live & Synced
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center text-xs pt-1">
            <div className="bg-white/[0.04] p-3 rounded-xl border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider mb-0.5">Data Scope</span>
              <span className="font-bold text-white tracking-tight">100% Isolated</span>
            </div>
            <div className="bg-white/[0.04] p-3 rounded-xl border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider mb-0.5">Sync Latency</span>
              <span className="font-bold text-emerald-400 tracking-tight">&lt; 30ms</span>
            </div>
            <div className="bg-white/[0.04] p-3 rounded-xl border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider mb-0.5">Security</span>
              <span className="font-bold text-indigo-300 tracking-tight">Postgres RLS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-6 border-t border-white/10">
        {showcase.features.map((feat, idx) => {
          const IconComponent = ICON_MAP[feat.icon] || Zap;
          return (
            <div 
              key={idx} 
              className="group/feature p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/20 transition-all duration-300 shadow-sm"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-300 mb-3 group-hover/feature:scale-105 group-hover/feature:bg-emerald-500/25 transition-all">
                <IconComponent className="w-4.5 h-4.5" />
              </div>
              <h4 className="text-xs font-bold text-white mb-1 tracking-tight">{feat.title}</h4>
              <p className="text-[11px] text-slate-300/80 leading-relaxed line-clamp-2">{feat.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
