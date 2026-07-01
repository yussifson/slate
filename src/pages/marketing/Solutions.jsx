import React from 'react';
import { useTranslation } from 'react-i18next';
import { Briefcase, HeartPulse, Building2, Globe2, Lightbulb, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const SOLUTIONS = [
  {
    id: 'finance',
    icon: Briefcase,
    title: 'Financial Services',
    description: 'Secure, compliant workflows for wealth management, banking, and accounting firms. Complete audit trails built-in.',
    features: ['SOC2 Type II Compliant', 'Automated Client Onboarding', 'Secure Document Portals']
  },
  {
    id: 'healthcare',
    icon: HeartPulse,
    title: 'Healthcare & Biotech',
    description: 'HIPAA-ready infrastructure to manage patient data, clinical trials, and operational logistics with absolute privacy.',
    features: ['HIPAA Ready Architecture', 'Role-Based Access Control', 'Encrypted Data Storage']
  },
  {
    id: 'real-estate',
    icon: Building2,
    title: 'Real Estate & Property',
    description: 'End-to-end property management, tenant portals, and lease automation in a single unified dashboard.',
    features: ['Automated Billing', 'Tenant Portals', 'Maintenance Tracking']
  },
  {
    id: 'agencies',
    icon: Lightbulb,
    title: 'Creative Agencies',
    description: 'Streamline client approvals, project management, and time tracking without jumping between five different apps.',
    features: ['Client Approval Workflows', 'Time & Resource Tracking', 'Custom Branding']
  }
];

export default function Solutions() {
  const { t } = useTranslation();

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 bg-slate-50 overflow-hidden">
        <div className="absolute inset-0 bg-slate-900/5 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tight tracking-[-0.02em] leading-tight">
            Built for your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-600">
              exact industry.
            </span>
          </h1>
          <p className="text-xl text-slate-600 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
            Slate isn't a one-size-fits-all generic tool. Discover how our dynamic architecture adapts perfectly to the unique demands of your vertical.
          </p>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {SOLUTIONS.map((solution) => (
              <div key={solution.id} className="group bg-slate-50 rounded-[2rem] p-10 border-[0.5px] border-black/9 dark:border-white/8 hover:shadow-[0_20px_80px_-15px_rgba(0,0,0,0.07)] transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-white border-[0.5px] border-black/9 dark:border-white/8 flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform duration-300">
                  <solution.icon className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">{solution.title}</h3>
                <p className="text-lg text-slate-600 font-medium leading-relaxed mb-8">{solution.description}</p>
                
                <ul className="space-y-3 mb-10">
                  {solution.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-slate-700 font-medium">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <CheckIcon className="w-3 h-3 font-bold" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link to={`/contact?industry=${solution.id}`} className="inline-flex items-center font-bold text-primary hover:text-emerald-700 transition-colors">
                  Talk to an industry expert <LinkIcon className="w-4 h-4 ml-2" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* And Many More Section */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold text-slate-900 mb-10 tracking-tight">And rapidly expanding into...</h3>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {['Education & Schools', 'Legal Practices', 'Retail & E-Commerce', 'Non-Profits', 'Manufacturing & Logistics', 'Consulting Firms'].map((niche, i) => (
              <div key={i} className="bg-slate-50 border-[0.5px] border-primary/20 text-slate-700 font-semibold px-6 py-3 rounded-full hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow">
                {niche}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Solution CTA */}
      <section className="py-24 bg-slate-50 border-t border-primary/40 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <Globe2 className="w-16 h-16 text-primary mx-auto mb-8 opacity-80" />
          <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Don't see your industry?</h2>
          <p className="text-lg text-slate-600 mb-10 font-medium">
            Slate's Universal Operating System is completely modular. Our enterprise solutions team can architect a custom deployment specifically for your niche.
          </p>
          <Link to="/contact">
            <Button className="h-12 px-8 rounded-full bg-primary hover:bg-emerald-700 text-white font-black text-base transition-all">
              Request Custom Architecture
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function CheckIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}
