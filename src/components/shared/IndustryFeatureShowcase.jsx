import React from 'react';
import { getIndustryFeatures } from '@/lib/companyDomainResolver';
import {
  Building2, Users, FileText, BarChart3, Scale, ShieldCheck, Clock, FolderOpen,
  GraduationCap, Calendar, Award, Users2, Stethoscope, Bed, Pill, Receipt,
  BedDouble, BellRing, TrendingUp, ShoppingCart, Package, Truck, Tag, Zap, BarChart2,
  Compass, CheckCircle2, Sparkles, Layers, Landmark, Lock, Server, Cpu
} from 'lucide-react';

const ICON_MAP = {
  Building2, Users, FileText, BarChart3, Scale, ShieldCheck, Clock, FolderOpen,
  GraduationCap, Calendar, Award, Users2, Stethoscope, Bed, Pill, Receipt,
  BedDouble, BellRing, TrendingUp, ShoppingCart, Package, Truck, Tag, Zap, BarChart2,
  Compass, CheckCircle2, Sparkles, Layers, Landmark, Lock, Server, Cpu
};

export default function IndustryFeatureShowcase({ companyName, industryType }) {
  const showcase = getIndustryFeatures(industryType, companyName || 'Workspace');

  return (
    <div className="relative z-10 w-full max-w-xl bg-[#1E293B]/90 backdrop-blur-2xl rounded-3xl border border-[#334155] p-8 lg:p-10 flex flex-col justify-between text-slate-100 overflow-hidden">
      {/* Header Status Indicator */}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-[#0F172A] border border-emerald-500/30 text-xs font-semibold text-emerald-400 mb-6">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="tracking-wide text-[11px] font-bold text-emerald-300">{showcase.badge || 'Enterprise Suite'}</span>
        </div>

        <h3 className="text-3xl lg:text-4xl font-extrabold text-slate-100 mb-3 leading-[1.15] tracking-tight">
          {showcase.title}
        </h3>
        <p className="text-sm text-slate-300 font-normal max-w-lg leading-relaxed mb-6">
          {showcase.subtitle}
        </p>

        {/* Operational Telemetry Grid */}
        <div className="mb-6 p-4 rounded-2xl bg-[#0F172A]/80 border border-[#334155] space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-2 font-bold text-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Verified Enterprise Workspace</span>
            </span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">
              Live & Synced
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center text-xs pt-0.5">
            <div className="bg-[#1E293B] p-2.5 rounded-xl border border-[#334155]">
              <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">Platform</span>
              <span className="font-bold text-slate-100 tracking-tight">Real-Time</span>
            </div>
            <div className="bg-[#1E293B] p-2.5 rounded-xl border border-[#334155]">
              <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">Security</span>
              <span className="font-bold text-emerald-400 tracking-tight">Encrypted</span>
            </div>
            <div className="bg-[#1E293B] p-2.5 rounded-xl border border-[#334155]">
              <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">Cloud Sync</span>
              <span className="font-bold text-indigo-400 tracking-tight">99.9% Uptime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 border-t border-[#334155]">
        {showcase.features.map((feat, idx) => {
          const IconComponent = ICON_MAP[feat.icon] || Zap;
          return (
            <div 
              key={idx} 
              className="p-4 rounded-2xl bg-[#0F172A]/70 hover:bg-[#0F172A] border border-[#334155] hover:border-emerald-500/40 transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2.5">
                <IconComponent className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-100 mb-1 tracking-tight">{feat.title}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{feat.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
