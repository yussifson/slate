import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  Scale,
  Shield,
  Users,
  Clock,
  Briefcase,
  Smartphone,
  Star,
  ChevronRight,
  BarChart3,
  FileText,
  Bell,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ------------------------------------------------------------------ */
/*  Fade-in-up observer hook                                          */
/* ------------------------------------------------------------------ */
function useFadeInOnScroll() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('opacity-100', 'translate-y-0');
          el.classList.remove('opacity-0', 'translate-y-8');
          observer.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function FadeIn({ children, className = '', delay = '' }) {
  const ref = useFadeInOnScroll();
  return (
    <div
      ref={ref}
      className={`opacity-0 translate-y-8 transition-all duration-700 ease-out ${delay} ${className}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                              */
/* ------------------------------------------------------------------ */
const features = [
  {
    icon: Scale,
    title: 'Customer & Pipeline Tracking',
    description:
      'Manage business operations from intake to resolution. Customize stages, set reminders, and track client documents in one central view.',
    image: '/images/feature_pipeline.png'
  },
  {
    icon: Users,
    title: 'Smart Client Portal',
    description:
      'Give clients a secure, branded environment to sign documents, review milestones, and communicate directly with your team.',
    image: '/images/client_portal_ui.png'
  },
  {
    icon: Clock,
    title: 'Integrated Time Tracking',
    description:
      'Bill accurately with live timers for consultations, research, meetings, and project delivery — then convert hours to invoices.',
    image: '/images/feature_time.png'
  },
  {
    icon: Smartphone,
    title: 'WhatsApp & Email Sync',
    description:
      'Communicate with clients via WhatsApp and automatic email logging. Retain a clear audit trail of all correspondence.',
    image: '/images/feature_sync.png'
  },
  {
    icon: Briefcase,
    title: 'HR & Payroll Control',
    description:
      'Manage associate leaves, staff performance dashboards, and monthly salary slips under one secure portal.',
    image: '/images/feature_hr.png'
  },
  {
    icon: Shield,
    title: 'Bank-Grade Compliance',
    description:
      'Client confidentiality, encrypted storage, automatic daily backups, and robust role-based access permissions.',
    image: '/images/feature_security.png'
  },
  {
    icon: Sparkles,
    title: 'Orbit AI Assistant',
    description:
      'Your built-in enterprise AI. Orbit can search records, navigate the app, create tasks, and automate workflows via simple chat commands.',
    image: '/images/hero_dashboard_ui_clean_1779790623615.png' 
  }
];

const testimonials = [
  {
    quote:
      'Optalflow completely transformed our practice. We moved from paper files to a digital pipeline and reduced document turnaround by 60%.',
    author: 'Adama Mensah',
    role: 'Managing Partner',
    firm: 'Mensah & Partners',
    rating: 5,
  },
  {
    quote:
      'The custom-branded client portal lets us serve high-net-worth clients under their own secure domain. Best investment we made this year.',
    author: 'Chinedu Okafor',
    role: 'Senior Partner',
    firm: 'Temple Chambers, Lagos',
    rating: 5,
  },
  {
    quote:
      'Managing schedules, billing via Paystack, and email sync has never been this seamless. Highly recommended for any organization.',
    author: 'Mariama Kamara',
    role: 'Founder',
    firm: 'Kamara Group',
    rating: 5,
  },
];

const firms = [
  'KAPLAN & STRATTON',
  'ALN ADVOCATES',
  'BOWMANS LEGAL',
  'ENS AFRICA',
  'WERKSMANS',
  'CLIFFE DEKKER',
];

const suites = [
  {
    id: 'law',
    name: 'Law Firm Workspace',
    tagline: 'Legal Practice Management',
    description: 'A complete ecosystem for modern law firms to manage cases, track billable hours, and collaborate with clients securely.',
    features: ['Case & Matter Management', 'Conflict Checking', 'Legal Billing & Trust Accounting', 'Secure Client Portal']
  },
  {
    id: 'hospital',
    name: 'Healthcare Workspace',
    tagline: 'Clinic & Hospital Management',
    description: 'Streamline patient onboarding, appointment scheduling, and staff rostering with our secure health-compliant platform.',
    features: ['Patient Records & History', 'Appointment Scheduling', 'Medical Billing', 'Staff Rostering']
  },
  {
    id: 'school',
    name: 'Education Workspace',
    tagline: 'School & Campus Management',
    description: 'Unify student records, grading, fee collection, and parent communication in a single intuitive system.',
    features: ['Student Information System', 'Fee Collection', 'Gradebook & Exams', 'Parent Portal']
  },
  {
    id: 'hotel',
    name: 'Hospitality Workspace',
    tagline: 'Hotel & Property Management',
    description: 'Deliver exceptional guest experiences with integrated booking, housekeeping, and point-of-sale systems.',
    features: ['Booking & Reservations', 'Housekeeping Manager', 'Restaurant POS', 'Guest CRM']
  },
  {
    id: 'church',
    name: 'Ministry Workspace',
    tagline: 'Church & Congregation Management',
    description: 'Engage your congregation with powerful tools for donation tracking, event scheduling, and member communication.',
    features: ['Member Database', 'Donation & Tithing', 'Event Management', 'Volunteer Scheduling']
  },
  {
    id: 'insurance',
    name: 'Insurance Workspace',
    tagline: 'Agency & Policy Management',
    description: 'Accelerate policy issuance, manage claims efficiently, and track commissions with our dedicated insurance suite.',
    features: ['Policy Administration', 'Claims Processing', 'Commission Tracking', 'Client Portal']
  },
  {
    id: 'retail',
    name: 'Retail Workspace',
    tagline: 'Multi-Store POS & Inventory',
    description: 'Unify your retail operations with centralized inventory management, multi-store POS, and detailed sales analytics.',
    features: ['Multi-Store Cloud POS', 'Real-time Inventory', 'Supplier Management', 'Sales Analytics']
  },
  {
    id: 'logistics',
    name: 'Logistics Workspace',
    tagline: 'Freight & Delivery Management',
    description: 'Optimize your supply chain with real-time fleet tracking, dispatch routing, and automated invoicing.',
    features: ['Fleet & Asset Tracking', 'Dispatch Management', 'Automated Invoicing', 'Driver App Integration']
  },
  {
    id: 'hr',
    name: 'HR & ERP Workspace',
    tagline: 'Enterprise Resource Planning',
    description: 'Manage your most valuable assets with our comprehensive HR suite, including payroll, performance, and leave management.',
    features: ['Automated Payroll', 'Leave & Attendance', 'Performance Reviews', 'Employee Self-Service']
  }
];

function SuitesSection() {
  const [activeSuite, setActiveSuite] = useState(suites[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className="py-24 md:py-32 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <FadeIn>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
              Tailored suites for your industry
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed font-medium">
              We've built specialized operational systems that adapt to your specific business model and workflows.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 relative items-start">
          {/* Left Tabs Column (Navigation) */}
          <div className="lg:col-span-4 relative z-10 lg:pr-6">
            <div className="mb-10">
              <h3 className="text-slate-900 font-extrabold text-2xl md:text-3xl mb-3 tracking-tight">Select your sector</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Explore how our unified workspace adapts to your specific operational needs and scales with your business.
              </p>
            </div>
            
            <div className="flex flex-col relative border-l border-slate-200">
              {suites.map((suite) => (
                <button
                  key={suite.id}
                  onClick={() => setActiveSuite(suite)}
                  className={`w-full text-left px-6 py-4 md:py-5 transition-all duration-300 relative group overflow-hidden ${
                    activeSuite.id === suite.id
                      ? 'bg-gradient-to-r from-blue-50/80 to-transparent'
                      : 'bg-transparent hover:bg-slate-50'
                  }`}
                >
                  {/* Active Indicator Line */}
                  {activeSuite.id === suite.id ? (
                    <div className="absolute top-0 left-[-1px] w-[3px] h-full bg-blue-600 rounded-r-full shadow-[0_0_10px_rgba(37,99,235,0.4)]"></div>
                  ) : (
                    <div className="absolute top-0 left-[-1px] w-[3px] h-full bg-slate-300 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center rounded-r-full"></div>
                  )}
                  
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <div className={`font-bold text-base transition-colors ${activeSuite.id === suite.id ? 'text-blue-700' : 'text-slate-700 group-hover:text-slate-900'}`}>
                        {suite.name}
                      </div>
                      <div className={`text-[13px] font-medium mt-1 transition-colors ${activeSuite.id === suite.id ? 'text-blue-600/80' : 'text-slate-500'}`}>
                        {suite.tagline}
                      </div>
                    </div>
                    
                    {/* Arrow Icon on Active */}
                    <div className={`transition-all duration-300 ${activeSuite.id === suite.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Content Column (Sticky) */}
          <div className="lg:col-span-8 lg:sticky lg:top-24">
            <div className="bg-white border border-slate-200/60 rounded-[2rem] p-10 md:p-14 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden">
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-100/50 via-transparent to-transparent opacity-60 rounded-bl-[100px] pointer-events-none"></div>
              
              <div className="relative z-10">
                <FadeIn key={activeSuite.id}>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm border border-blue-100/50">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </span>
                    <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-widest">
                      {activeSuite.name}
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest">
                      <Sparkles className="w-3.5 h-3.5" /> Orbit AI Powered
                    </div>
                  </div>
                  
                  <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-[1.1] tracking-tight">
                    {activeSuite.tagline}
                  </h3>
                  
                  <p className="text-xl text-slate-600 mb-10 leading-relaxed font-medium">
                    {activeSuite.description}
                  </p>
                  
                  {/* Features List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeSuite.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-3 bg-white border border-slate-100 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-blue-100 transition-all">
                        <div className="mt-0.5 w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="font-bold text-slate-700 text-sm leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-12 pt-8 border-t border-slate-100 flex items-center">
                    <Button 
                      onClick={() => setIsModalOpen(true)}
                      className="bg-blue-600 text-white hover:bg-blue-700 font-bold py-6 px-10 rounded-full shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5"
                    >
                      Explore {activeSuite.name} details
                    </Button>
                  </div>
                </FadeIn>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal / Popup for Workspace Details */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsModalOpen(false)}
          ></div>
          
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex-none p-6 sm:p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
              <div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-widest mb-3">
                  Workspace Module
                </div>
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{activeSuite.name}</h3>
                <p className="text-slate-500 font-medium mt-2 max-w-2xl">{activeSuite.description}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors -mr-2 -mt-2"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white">
              <div className="max-w-3xl mx-auto">
                <h4 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  Core Features & Capabilities
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  {activeSuite.features.map((feat, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:border-blue-100 transition-colors">
                      <h5 className="font-bold text-slate-900 text-lg mb-2">{feat}</h5>
                      <p className="text-slate-500 text-sm leading-relaxed font-medium">
                        Powerful tools to automate this aspect of your business, integrating seamlessly with your broader operations.
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="bg-blue-600 rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/3"></div>
                  <h4 className="text-2xl font-bold mb-4 relative z-10">Ready to transform your workflow?</h4>
                  <p className="text-blue-100 font-medium mb-8 max-w-lg relative z-10">
                    Get started today and see how {activeSuite.name} can streamline your daily operations and boost your bottom line.
                  </p>
                  <Button className="bg-white text-blue-600 hover:bg-slate-50 font-bold py-6 px-8 rounded-xl shadow-lg relative z-10">
                    Start Your Free Trial
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      , document.body)}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
export default function Home() {
  return (
    <div className="overflow-x-hidden">
      {/* ============================================================ */}
      {/*  HERO                                                        */}
      {/* ============================================================ */}
      <section className="relative py-10 md:py-14 lg:py-16">
        {/* Soft light background */}
        <div className="absolute inset-0 bg-slate-50 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600 mb-8 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-green-500" />
              Trusted by 500+ Enterprise Teams &nbsp;&bull;&nbsp; <span className="font-bold text-blue-600 flex items-center gap-1"><Sparkles className="w-3 h-3"/> Powered by Orbit AI</span>
            </div>
          </FadeIn>

          {/* Headline */}
          <FadeIn delay="delay-100">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1] max-w-4xl mx-auto mb-6">
              The unified workspace that turns hours into{' '}
              <span className="bg-green-100 text-slate-900 px-4 py-1 rounded-[1.5rem] inline-block mt-2">
                clear profit
              </span>
            </h1>
          </FadeIn>

          {/* Subtitle */}
          <FadeIn delay="delay-200">
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Built for teams that take operations seriously. Manage cases, automate client communication, log billable hours,
              process payments, and track HR — all in one place.
            </p>
          </FadeIn>

          {/* CTA buttons */}
          <FadeIn delay="delay-300">
            <div className="flex flex-col items-center justify-center mb-16">
              <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
                <div className="bg-white border border-slate-100 px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-800 shadow-sm">Project Profitability</div>
                <div className="bg-white border border-slate-100 px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-800 shadow-sm">Billing & Invoicing</div>
                <div className="bg-white border border-slate-100 px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-800 shadow-sm">Client Portal</div>
                <div className="bg-white border border-slate-100 px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-800 shadow-sm">HR & Payroll</div>
                <div className="bg-primary/5 border border-primary/10 text-primary px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm">All Features</div>
              </div>
            </div>
          </FadeIn>

          {/* Dashboard mockup */}
          <FadeIn delay="delay-[400ms]">
            <div className="relative w-full max-w-6xl mx-auto h-[400px] md:h-[550px] rounded-2xl border border-slate-200/80 bg-slate-50 shadow-2xl overflow-hidden flex items-center justify-center">
              <img src="/images/hero_dashboard_ui.png" alt="Optalflow Dashboard Mockup" className="w-full h-full object-cover object-top" />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  ORBIT AI HERO (INTERACTIVE DEMO)                            */}
      {/* ============================================================ */}
      <section className="py-20 md:py-24 bg-white text-slate-900 relative overflow-hidden border-t border-slate-100">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/40 blur-[120px] rounded-full pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <FadeIn>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest mb-6">
                  <Sparkles className="w-3.5 h-3.5" />
                  Meet Orbit AI
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6 leading-[1.1]">
                  Your proactive <br/><span className="text-blue-600">enterprise co-pilot</span>
                </h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed font-medium">
                  Orbit isn't just a chatbot. It's an intelligent agent embedded directly into your workflow. 
                  Ask it to analyze data, schedule appointments, or draft emails — it executes actions automatically across the entire Optalflow suite.
                </p>
                <ul className="space-y-4 mb-10 text-slate-700 font-medium">
                  <li className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0"><Clock className="w-4 h-4" /></div> Saves an average of 14 hours per week</li>
                  <li className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0"><Shield className="w-4 h-4" /></div> Bank-grade secure long-term memory</li>
                  <li className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0"><Briefcase className="w-4 h-4" /></div> Understands all 9 industry sectors natively</li>
                </ul>
              </div>
            </FadeIn>

            <FadeIn delay="delay-200">
              <div className="relative rounded-2xl border border-blue-900/50 bg-blue-950 shadow-2xl shadow-blue-900/20 overflow-hidden aspect-video flex flex-col font-mono text-sm transform rotate-1 hover:rotate-0 transition-transform duration-500">
                {/* Terminal Header */}
                <div className="bg-blue-900/40 px-4 py-3 border-b border-blue-900/50 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  <span className="ml-4 text-blue-300/70 text-xs font-bold tracking-wider uppercase flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-blue-400"/> Orbit Agent Execution</span>
                </div>
                {/* Terminal Body */}
                <div className="p-6 text-slate-200 space-y-4 flex-1 overflow-hidden relative">
                  <div className="flex gap-3">
                    <span className="text-green-400 font-bold shrink-0">User</span>
                    <span className="font-semibold text-slate-100">Create a new task to review the Q3 financial report by Friday.</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-blue-400 font-bold shrink-0 flex items-center gap-1">Orbit</span>
                    <span>
                      <span className="animate-pulse text-blue-400">_</span>
                    </span>
                  </div>
                  {/* CSS Animated Typing effect overlay (Simulated) */}
                  <div className="absolute top-14 left-[58px] bottom-0 right-0 bg-blue-950 animate-[slideRight_4s_steps(40)_forwards] origin-left z-10" />
                  <div className="flex gap-3 mt-0 absolute top-[44px] w-full text-slate-200">
                     <span className="text-blue-400 font-bold opacity-0 shrink-0">Orbit</span>
                     <span className="whitespace-pre-line leading-relaxed">
                        I've created the task: "Review Q3 financial report".
                        <br/><span className="text-blue-400/70 font-medium text-xs">&gt; Action: create_record [Task ID: 89f2a]</span>
                        <br/>Due date set to Friday.
                        <br/><span className="text-blue-400/70 font-medium text-xs">&gt; Action: navigate_to [/tasks]</span>
                     </span>
                  </div>
                </div>
              </div>
            </FadeIn>

          </div>
        </div>
      </section>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideRight {
          0% { transform: scaleX(1); }
          100% { transform: scaleX(0); }
        }
      `}} />

      {/* ============================================================ */}
      {/*  ORBIT VIDEO SECTION                                         */}
      {/* ============================================================ */}
      <section className="py-24 md:py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5">
                  <h2 className="text-3xl md:text-5xl font-black tracking-tight text-blue-600 mb-6">
                    See Orbit in action
                  </h2>
                  <p className="text-lg text-slate-600 leading-relaxed font-medium mb-8">
                    Watch how easily you can navigate the system, manage your workload, and delegate complex tasks to your AI co-pilot using simple natural language.
                  </p>
                  <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-full px-8 font-bold">
                    Book a Live Demo
                  </Button>
                </FadeIn>
              </div>
              
              <div className="lg:col-span-7">
                <FadeIn delay="delay-200">
                  <div className="relative rounded-[2rem] border border-slate-200 bg-slate-50 shadow-2xl overflow-hidden aspect-[16/9] group cursor-pointer flex items-center justify-center">
                    <img src="/images/hero_dashboard_ui_new_1779826400711.png" alt="Demo Video Thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                    {/* Play Button Overlay */}
                    <div className="relative z-10 w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
                      <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-blue-600 border-b-[12px] border-b-transparent ml-2"></div>
                    </div>
                  </div>
                </FadeIn>
              </div>
           </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  HOW IT WORKS                                                */}
      {/* ============================================================ */}
      <section className="py-20 md:py-32 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
              Workflow
            </span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
              How Optalflow works
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed font-medium">
              We've streamlined the entire project lifecycle so your team can focus on execution, not administration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-[52px] left-[15%] right-[15%] h-0.5 bg-slate-200" />
            
            {[
              {
                step: '01',
                title: 'Onboard Clients',
                desc: 'Send automated intake forms and secure portal invitations to start new relationships on the right foot.',
                icon: Users
              },
              {
                step: '02',
                title: 'Track & Execute',
                desc: 'Log billable hours natively, manage project pipelines, and collaborate securely in real-time.',
                icon: Clock
              },
              {
                step: '03',
                title: 'Bill & Review',
                desc: 'Generate branded invoices instantly from tracked time and accept seamless local payments.',
                icon: CreditCard
              }
            ].map((step, i) => (
              <FadeIn key={i} delay={`delay-${(i + 1) * 100}`}>
                <div className="relative bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center z-10 group hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 mx-auto bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                    <step.icon className="w-8 h-8" />
                  </div>
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-blue-600 text-white font-black rounded-xl flex items-center justify-center text-lg shadow-lg transform rotate-6 group-hover:rotate-12 transition-transform">
                    {step.step}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">{step.title}</h3>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SOCIAL PROOF STRIP                                          */}
      {/* ============================================================ */}
      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-xl font-medium text-slate-500 text-center mb-10">
              Trusted by over 10 000 companies worldwide
            </p>
          </FadeIn>

          <FadeIn delay="delay-100">
            <div className="flex flex-wrap justify-center items-center gap-x-14 gap-y-6">
              {firms.map((firm) => (
                <span
                  key={firm}
                  className="text-xl font-bold text-slate-400 hover:text-slate-600 transition-opacity duration-300 cursor-default select-none tracking-tight"
                >
                  {firm}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FEATURES GRID                                               */}
      {/* ============================================================ */}
      {/* ============================================================ */}
      {/*  FEATURES GRID (Bento Box Style)                           */}
      {/* ============================================================ */}
      <section className="py-24 md:py-32 bg-slate-50 border-y border-slate-100 relative overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-20">
              <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-white border border-slate-200 text-blue-600 text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
                Unified Architecture
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
                Built for the complexities of modern business
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed font-medium">
                Unify case files, client relationships, time tracking, billing,
                and employee metrics in one beautifully designed, secure platform.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, i) => {
              const isLarge = i === 0 || i === 3;
              return (
                <FadeIn key={i} delay={`delay-[${i * 80}ms]`} className={isLarge ? "md:col-span-2" : "md:col-span-1"}>
                  <div className={`group relative bg-white rounded-[2rem] border border-slate-200/80 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_40px_-10px_rgba(37,99,235,0.1)] hover:-translate-y-1 hover:border-blue-200/60 transition-all duration-500 overflow-hidden h-full flex flex-col justify-between ${isLarge ? 'bg-gradient-to-b from-white to-slate-50/50' : ''}`}>
                    {/* Hover Gradient Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 via-transparent to-blue-600/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    
                    <div className="relative z-10 px-8 pt-8 lg:px-10 lg:pt-10 pb-2">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50/60 border border-blue-100/40 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:shadow-lg group-hover:shadow-blue-600/20 transition-all duration-500">
                        <feature.icon className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors duration-500" strokeWidth={1.5} />
                      </div>
                      <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-4 group-hover:text-blue-700 transition-colors duration-300">
                        {feature.title}
                      </h4>
                      <p className="text-base text-slate-600 leading-relaxed font-medium">
                        {feature.description}
                      </p>
                    </div>
                    
                    {/* Edge-to-edge Premium Image Presentation */}
                    <div className="mt-auto relative w-full pt-8 px-6 lg:px-8 pb-0 flex items-end justify-center">
                      <div className="w-full rounded-t-[1.25rem] border-t border-l border-r border-slate-200/60 shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.1)] overflow-hidden transform translate-y-4 group-hover:translate-y-1 transition-transform duration-700 bg-white">
                        <img src={feature.image} alt={feature.title} className="block w-full h-auto object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>
                    </div>
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SUITES SECTION (Interactive)                                */}
      {/* ============================================================ */}
      <SuitesSection />

      {/* ============================================================ */}
      {/*  TESTIMONIALS                                                */}
      {/* ============================================================ */}
      <section className="py-24 md:py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-20">
              <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest mb-6">
                Client Success
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                What our customers say
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <FadeIn key={idx} delay={`delay-[${idx * 120}ms]`}>
                <div className="bg-white border border-slate-200 rounded-[2rem] p-10 flex flex-col justify-between hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 h-full group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5 text-[8rem] font-serif leading-none font-black text-blue-900 group-hover:text-blue-600 group-hover:opacity-10 transition-colors duration-500">"</div>
                  
                  <div className="relative z-10">
                    <div className="flex gap-1.5 mb-8">
                      {Array.from({ length: t.rating }).map((_, si) => (
                        <Star
                          key={si}
                          className="w-5 h-5 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    <blockquote className="text-lg text-slate-700 leading-relaxed font-medium mb-10">
                      "{t.quote}"
                    </blockquote>
                  </div>

                  <div className="flex items-center gap-4 pt-6 border-t border-slate-100 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg shadow-inner">
                      {t.author
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-900">
                        {t.author}
                      </p>
                      <p className="text-sm font-medium text-slate-500">
                        {t.role}, {t.firm}
                      </p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  CTA BANNER                                                  */}
      {/* ============================================================ */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="relative bg-gradient-to-br from-primary to-blue-700 rounded-3xl px-6 py-20 md:py-24 md:px-12 text-center overflow-hidden shadow-[0_20px_60px_hsl(var(--primary)/0.3)]">
              {/* Decorative glow circles */}
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.2)_0%,transparent_50%)] pointer-events-none" />
              <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-white/[0.07] blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-[1.1]">
                  Ready to modernize your organization?
                </h2>
                <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-2xl mx-auto font-medium">
                  Create your workspace, invite associates, and start managing
                  cases in minutes.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                  <Link to="/signup">
                    <Button className="bg-white text-primary hover:bg-white/90 font-bold text-base py-6 px-10 rounded-xl shadow-xl group transition-all hover:scale-[1.02]">
                      Start Your Free Trial
                      <ChevronRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/contact">
                    <Button
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10 font-bold text-base py-6 px-10 rounded-xl transition-all hover:scale-[1.02] bg-transparent"
                    >
                      Contact Sales
                    </Button>
                  </Link>
                </div>
                
                <div className="pt-8 flex flex-wrap justify-center gap-6 text-sm text-white/70 font-medium">
                  <span className="flex items-center gap-1.5"><Shield className="w-4 h-4"/> SOC2 Certified</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4"/> 5-Minute Setup</span>
                  <span className="flex items-center gap-1.5"><CreditCard className="w-4 h-4"/> No Credit Card Required</span>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
