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
    <div className="relative z-10 w-full max-w-2xl bg-slate-900/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-[0_25px_90px_-20px_rgba(0,0,0,0.5)] p-8 lg:p-12 flex flex-col justify-between text-white overflow-hidden">
      {/* Ambient background glow orbs */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Header Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-emerald-300 mb-6 backdrop-blur-md">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          {showcase.badge || 'Enterprise Operating System'}
        </div>

        <h3 className="text-3xl lg:text-4xl font-extrabold text-white mb-3 leading-[1.15] tracking-tight">
          {showcase.title}
        </h3>
        <p className="text-sm lg:text-base text-slate-300 font-normal max-w-lg leading-relaxed mb-8">
          {showcase.subtitle}
        </p>

        {/* Floating Command Preview Card */}
        <div className="mb-8 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verified Enterprise Workspace
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase tracking-wider">
              Live & Synced
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
            <div className="bg-white/5 p-2 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block font-medium">Data Model</span>
              <span className="font-bold text-white">100% Isolated</span>
            </div>
            <div className="bg-white/5 p-2 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block font-medium">Sync Latency</span>
              <span className="font-bold text-emerald-400">&lt; 50ms</span>
            </div>
            <div className="bg-white/5 p-2 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block font-medium">Security</span>
              <span className="font-bold text-indigo-300">Row-Level RLS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4 border-t border-white/10">
        {showcase.features.map((feat, idx) => {
          const IconComponent = ICON_MAP[feat.icon] || Zap;
          return (
            <div key={idx} className="group/feature p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all duration-300">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-300 mb-2.5 group-hover/feature:scale-110 transition-transform">
                <IconComponent className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white mb-0.5 tracking-tight">{feat.title}</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">{feat.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
