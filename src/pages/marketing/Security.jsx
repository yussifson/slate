import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Lock, Server, CheckCircle2, FileCheck, Database, Key, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const SECURITY_FEATURES = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "All data is encrypted at rest using AES-256 and in transit via TLS 1.3, ensuring military-grade security for your sensitive information."
  },
  {
    icon: Database,
    title: "Row-Level Security (RLS)",
    description: "Total logical isolation of tenant data. Our architecture guarantees that one organization can never access another's data under any circumstances."
  },
  {
    icon: Key,
    title: "Enterprise SSO & MFA",
    description: "SAML 2.0, OAuth, and mandatory Multi-Factor Authentication available for all enterprise organizations out of the box."
  },
  {
    icon: Server,
    title: "Global Data Residency",
    description: "Choose exactly where your data lives. We offer deployment regions in the US, EU, and APAC to comply with local data sovereignty laws."
  },
  {
    icon: FileCheck,
    title: "Comprehensive Audit Logs",
    description: "Immutable, searchable audit trails for every action taken within your workspace. Exportable to your SIEM of choice."
  },
  {
    icon: Shield,
    title: "Continuous Penetration Testing",
    description: "We employ independent, CREST-approved security firms to conduct deep-dive penetration tests on a quarterly basis."
  }
];

export default function Security() {
  const { t } = useTranslation();

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-slate-900 to-slate-900"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 mb-8 uppercase tracking-widest">
            <Shield className="w-4 h-4" />
            {t("trust_center", "Trust Center")}
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tight tracking-[-0.02em] leading-tight">
            Security is our <br />
            <span className="text-emerald-400">foundational layer.</span>
          </h1>
          <p className="text-xl text-slate-300 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
            Bank-grade security, uncompromising privacy, and continuous compliance. Built into the core of Slate, not bolted on as an afterthought.
          </p>
        </div>
      </section>

      {/* Compliance Badges */}
      <section className="py-16 border-b border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Placeholder SVG badges for compliance */}
            <div className="flex items-center gap-3 text-2xl font-black text-slate-800"><CheckCircle2 className="w-8 h-8 text-primary" /> SOC 2 Type II</div>
            <div className="flex items-center gap-3 text-2xl font-black text-slate-800"><CheckCircle2 className="w-8 h-8 text-primary" /> GDPR Compliant</div>
            <div className="flex items-center gap-3 text-2xl font-black text-slate-800"><CheckCircle2 className="w-8 h-8 text-primary" /> HIPAA Ready</div>
            <div className="flex items-center gap-3 text-2xl font-black text-slate-800"><CheckCircle2 className="w-8 h-8 text-primary" /> ISO 27001</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Enterprise-grade protection</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SECURITY_FEATURES.map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-3xl border-[0.5px] border-black/9 dark:border-white/8 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed font-medium">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Report Security Issue */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <Globe className="w-8 h-8 text-slate-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Vulnerability Disclosure</h2>
          <p className="text-lg text-slate-600 mb-8 font-medium">
            We believe in the power of the open security community. If you believe you have found a security vulnerability in Slate, please report it to our security team. We run a private bug bounty program.
          </p>
          <a href="mailto:security@optavel.com" className="inline-flex items-center text-primary font-bold hover:underline">
            Contact security@optavel.com &rarr;
          </a>
        </div>
      </section>
    </div>
  );
}
