import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BarChart3, TrendingUp, Users, Building, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const CASE_STUDIES = [
  {
    company: "Kamara Group",
    logo: "MK",
    industry: "Finance & Consulting",
    metric: "40% reduction",
    metricLabel: "in administrative time",
    quote: "\"Slate completely transformed how our firm operates. We reduced administrative time by 40% in the very first month, allowing us to focus entirely on our clients.\"",
    author: "Mariama Kamara",
    role: "Managing Partner",
    bg: "bg-blue-500/10",
    text: "text-blue-600",
    border: "border-blue-500/20"
  },
  {
    company: "Nexus Logistics",
    logo: "NL",
    industry: "Supply Chain",
    metric: "2.5x faster",
    metricLabel: "fulfillment processing",
    quote: "\"The level of automation is unprecedented. I can finally focus on strategic growth rather than day-to-day operations. The ROI was immediate.\"",
    author: "David Chen",
    role: "Operations Director",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600",
    border: "border-emerald-500/20"
  },
  {
    company: "Aether Healthcare",
    logo: "AH",
    industry: "Healthcare Provider",
    metric: "100% compliance",
    metricLabel: "across all 50 clinics",
    quote: "\"Security and speed were our top priorities. This platform delivered on both without compromising on design. Data visibility across departments improved by 100%.\"",
    author: "Dr. Sarah Jenkins",
    role: "Chief Medical Officer",
    bg: "bg-purple-500/10",
    text: "text-purple-600",
    border: "border-purple-500/20"
  }
];

export default function Customers() {
  const { t } = useTranslation();

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-slate-900/5 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-8 uppercase tracking-widest">
            {t("customer_success", "Customer Success")}
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tight tracking-[-0.02em] leading-tight">
            Trusted by the world's <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-600">
              most innovative teams.
            </span>
          </h1>
          <p className="text-xl text-slate-600 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
            See how forward-thinking enterprises are using Slate to unify their operations, reduce costs, and scale faster.
          </p>
        </div>
      </section>

      {/* Featured Case Studies */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {CASE_STUDIES.map((study, idx) => (
              <div key={idx} className="group relative bg-white rounded-3xl p-8 border-[0.5px] border-black/9 dark:border-white/8 hover:shadow-[0_20px_80px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div className={`w-14 h-14 rounded-2xl ${study.bg} ${study.text} ${study.border} border flex items-center justify-center font-bold text-xl`}>
                    {study.logo}
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{study.industry}</span>
                </div>
                
                <div className="mb-8 flex-1">
                  <div className="text-4xl font-black text-slate-900 mb-2 tracking-tight">{study.metric}</div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{study.metricLabel}</div>
                </div>

                <blockquote className="text-lg text-slate-700 font-medium leading-relaxed mb-8">
                  {study.quote}
                </blockquote>

                <div className="flex items-center gap-4 pt-6 border-t border-slate-100 mt-auto">
                  <div>
                    <div className="font-bold text-slate-900">{study.author}</div>
                    <div className="text-sm text-slate-500 font-medium">{study.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Metrics */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 50% 50%, #10b981 0%, transparent 50%)'}}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            <div>
              <div className="text-5xl font-black text-emerald-400 mb-2">99.99%</div>
              <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Uptime SLA</div>
            </div>
            <div>
              <div className="text-5xl font-black text-emerald-400 mb-2">2M+</div>
              <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Tasks Automated</div>
            </div>
            <div>
              <div className="text-5xl font-black text-emerald-400 mb-2">150+</div>
              <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Countries</div>
            </div>
            <div>
              <div className="text-5xl font-black text-emerald-400 mb-2">SOC2</div>
              <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Type II Certified</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 bg-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Ready to transform your workflow?</h2>
          <p className="text-lg text-slate-600 mb-10">Join thousands of companies already using Slate to accelerate their growth.</p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/signup">
              <Button className="h-12 px-8 rounded-full bg-primary hover:bg-primary/90 text-white font-semibold text-base transition-all">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" className="h-12 px-8 rounded-full border-primary/20 hover:bg-slate-50 font-semibold text-base">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
