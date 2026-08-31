import React from 'react';
import { getIndustryFeatures } from '@/lib/companyDomainResolver';
import {
  Building2, Users, FileText, BarChart3, Scale, ShieldCheck, Clock, FolderOpen,
  GraduationCap, Calendar, Award, Users2, Stethoscope, Bed, Pill, Receipt,
  BedDouble, BellRing, TrendingUp, ShoppingCart, Package, Truck, Tag, Zap, BarChart2
} from 'lucide-react';

const ICON_MAP = {
  Building2, Users, FileText, BarChart3, Scale, ShieldCheck, Clock, FolderOpen,
  GraduationCap, Calendar, Award, Users2, Stethoscope, Bed, Pill, Receipt,
  BedDouble, BellRing, TrendingUp, ShoppingCart, Package, Truck, Tag, Zap, BarChart2
};

export default function IndustryFeatureShowcase({ companyName, industryType }) {
  const showcase = getIndustryFeatures(industryType, companyName || 'Workspace');

  return (
    <div className="relative z-10 w-full max-w-2xl bg-white/90 backdrop-blur-xl rounded-[2rem] border border-primary/20 shadow-[0_20px_80px_-20px_rgba(16,185,129,0.15)] p-10 lg:p-14 flex flex-col justify-between group hover:shadow-[0_20px_80px_-15px_rgba(16,185,129,0.2)] transition-all duration-500">
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-6 uppercase tracking-widest">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          {showcase.badge}
        </div>

        <h3 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-3 leading-[1.15] tracking-tight">
          {showcase.title}
        </h3>
        <p className="text-sm lg:text-base text-slate-600 font-medium max-w-lg leading-relaxed mb-8">
          {showcase.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-6 border-t border-primary/10">
        {showcase.features.map((feat, idx) => {
          const IconComponent = ICON_MAP[feat.icon] || Zap;
          return (
            <div key={idx} className="group/feature p-4 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-100 hover:border-primary/20 transition-all duration-300 hover:shadow-md">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3 group-hover/feature:scale-110 transition-transform">
                <IconComponent className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1 tracking-tight">{feat.title}</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">{feat.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
