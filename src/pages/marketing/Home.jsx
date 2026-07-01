import confetti from "canvas-confetti";
import { useTranslation} from "react-i18next";
import { useState, useEffect, useRef} from "react";
import { useNavigate} from "react-router-dom";
import { useAuth} from "@/lib/AuthContext";
import { Link} from 'react-router-dom';
import { Helmet} from 'react-helmet-async';
import { createPortal} from 'react-dom';
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
 Sparkles} from 'lucide-react';
import { Button} from '@/components/ui/button';

/* ------------------------------------------------------------------ */
/* Fade-in-up observer hook */
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
 { threshold: 0.12}
 );
 observer.observe(el);
 return () => observer.disconnect();
}, []);
 return ref;
}

function FadeIn({ children, className = '', delay = ''}) {
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
/* Data */
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
 image: '/images/orbit_dashboard_mockup.png' 
}
];

const testimonials = [
 {
 quote:
 'Slate completely transformed our practice. We moved from paper files to a digital pipeline and reduced document turnaround by 60%.',
 author: 'Adama Mensah',
 role: 'Managing Partner',
 firm: 'Mensah & Partners',
 rating: 5},
 {
 quote:
 'The custom-branded client portal lets us serve high-net-worth clients under their own secure domain. Best investment we made this year.',
 author: 'Chinedu Okafor',
 role: 'Senior Partner',
 firm: 'Temple Chambers, Lagos',
 rating: 5},
 {
 quote:
 'Managing schedules, billing via Paystack, and email sync has never been this seamless. Highly recommended for any organization.',
 author: 'Mariama Kamara',
 role: 'Founder',
 firm: 'Kamara Group',
 rating: 5},
];

const firms = [
 {
 name: 'Vertex',
 logo: (
 <svg className="w-6 h-6 mr-2 text-primary" fill="currentColor" viewBox="0 0 24 24">
 <path d="M12 2L2 22h5l5-10 5 10h5L12 2z" />
 </svg>
 ),
 font: 'font-sans font-black tracking-tighter'
},
 {
 name: 'Nexus Cloud',
 logo: (
 <svg className="w-6 h-6 mr-2 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
 <circle cx="8" cy="12" r="6" />
 <circle cx="16" cy="12" r="6" />
 </svg>
 ),
 font: 'font-sans font-semibold tracking-tight'
},
 {
 name: 'Strata Financial',
 logo: (
 <svg className="w-6 h-6 mr-2 text-primary" fill="currentColor" viewBox="0 0 24 24">
 <path d="M3 6h18v4H3zM3 14h18v4H3z" />
 </svg>
 ),
 font: 'font-serif font-semibold tracking-tight'
},
 {
 name: 'LUMINA',
 logo: (
 <svg className="w-6 h-6 mr-2 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
 </svg>
 ),
 font: 'font-sans font-extrabold uppercase tracking-widest text-sm'
},
 {
 name: 'QUANTUM',
 logo: (
 <svg className="w-6 h-6 mr-2 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
 <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(45 12 12)" />
 <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-45 12 12)" />
 <circle cx="12" cy="12" r="2" fill="currentColor" />
 </svg>
 ),
 font: 'font-sans font-semibold tracking-[0.2em] text-sm'
},
 {
 name: 'Echo Systems',
 logo: (
 <svg className="w-6 h-6 mr-2 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m-4-6v4m-4-2v.01m16-.01v.01m-4-2v4" />
 </svg>
 ),
 font: 'font-sans font-medium tracking-wide'
},
 {
 name: 'FORGE',
 logo: (
 <svg className="w-6 h-6 mr-2 text-slate-800" fill="currentColor" viewBox="0 0 24 24">
 <path d="M4 6h16l-2 12H6L4 6zm4 0V4h8v2H8z" />
 </svg>
 ),
 font: 'font-serif font-black uppercase tracking-tight'
},
 {
 name: 'Nova Retail',
 logo: (
 <svg className="w-6 h-6 mr-2 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
 <path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7z" />
 </svg>
 ),
 font: 'font-sans font-semibold tracking-tight'
},
 {
 name: 'Zenith Media',
 logo: (
 <svg className="w-6 h-6 mr-2 text-primary" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
 <path d="M4 20h16L4 4h16" />
 </svg>
 ),
 font: 'font-serif font-semibold italic'
},
 {
 name: 'APEX',
 logo: (
 <svg className="w-6 h-6 mr-2 text-primary/90" fill="currentColor" viewBox="0 0 24 24">
 <path d="M12 2L1 21h22L12 2zm0 4.5l7 12H5l7-12z" />
 </svg>
 ),
 font: 'font-sans font-black tracking-widest uppercase text-sm'
}
];

const suites = [
 {
 id: 'retail',
 name: 'Retail WorkSlate',
 tagline: 'Multi-Store POS & Inventory',
 description: 'Unify your retail operations with centralized inventory management, multi-store POS, and detailed sales analytics.',
 features: ['Multi-Store Cloud POS', 'Real-time Inventory', 'Supplier Management', 'Sales Analytics']
},
 {
 id: 'hospital',
 name: 'Healthcare WorkSlate',
 tagline: 'Clinic & Hospital Management',
 description: 'Streamline patient onboarding, appointment scheduling, and staff rostering with our secure health-compliant platform.',
 features: ['Patient Records & History', 'Appointment Scheduling', 'Medical Billing', 'Staff Rostering']
},
 {
 id: 'school',
 name: 'Education WorkSlate',
 tagline: 'School & Campus Management',
 description: 'Unify student records, grading, fee collection, and parent communication in a single intuitive system.',
 features: ['Student Information System', 'Fee Collection', 'Gradebook & Exams', 'Parent Portal']
},
 {
 id: 'hotel',
 name: 'Hospitality WorkSlate',
 tagline: 'Hotel & Property Management',
 description: 'Deliver exceptional guest experiences with integrated booking, housekeeping, and point-of-sale systems.',
 features: ['Booking & Reservations', 'Housekeeping Manager', 'Restaurant POS', 'Guest CRM']
},
 {
 id: 'religion',
 name: 'Religion WorkSlate',
 tagline: 'Religious Organization Management',
 description: 'Engage your congregation with powerful tools for donation tracking, event scheduling, and member communication.',
 features: ['Member Database', 'Donations & Contributions', 'Event Management', 'Volunteer Scheduling']
},
 {
 id: 'insurance',
 name: 'Insurance WorkSlate',
 tagline: 'Agency & Policy Management',
 description: 'Accelerate policy issuance, manage claims efficiently, and track commissions with our dedicated insurance suite.',
 features: ['Policy Administration', 'Claims Processing', 'Commission Tracking', 'Client Portal']
},
 {
 id: 'logistics',
 name: 'Logistics WorkSlate',
 tagline: 'Freight & Delivery Management',
 description: 'Optimize your supply chain with real-time fleet tracking, dispatch routing, and automated invoicing.',
 features: ['Fleet & Asset Tracking', 'Dispatch Management', 'Automated Invoicing', 'Driver App Integration']
},
 {
 id: 'hr',
 name: 'HR & ERP WorkSlate',
 tagline: 'Enterprise Resource Planning',
 description: 'Manage your most valuable assets with our comprehensive HR suite, including payroll, performance, and leave management.',
 features: ['Automated Payroll', 'Leave & Attendance', 'Performance Reviews', 'Employee Self-Service']
},
 {
 id: 'law',
 name: 'Law Firm WorkSlate',
 tagline: 'Legal Practice Management',
 description: 'A complete ecosystem for modern law firms to manage cases, track billable hours, and collaborate with clients securely.',
 features: ['Case & Matter Management', 'Conflict Checking', 'Legal Billing & Trust Accounting', 'Secure Client Portal']
}
 ];
 
 function SuitesSection() {
 const { t} = useTranslation();
 const [activeSuite, setActiveSuite] = useState(suites[0]);
 const [isModalOpen, setIsModalOpen] = useState(false);
 
 return (
 <section className="py-16 md:py-24 lg:py-32 bg-slate-50 relative overflow-hidden">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
 <FadeIn>
 <div className="text-center max-w-3xl mx-auto mb-16">
 <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6 tracking-[-0.02em]">
 {t("tailored_suites_for_your_indus", "Tailored suites for your industry")}
 </h2>
 <p className="text-lg text-slate-600 leading-relaxed font-medium">
 {t(
 "we_ve_built_specialized_operat",
 "We've built specialized operational systems that adapt to your specific business model and workflows."
 )}
 </p>
 </div>
 </FadeIn>
 
 {/* Top Tabs Column (Navigation) */}
 <div className="flex overflow-x-auto justify-start lg:justify-center items-center gap-3 mb-12 pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
 {suites.map(suite => {
 const isActive = activeSuite.id === suite.id;
 return (
 <button
 key={suite.id}
 onClick={() => setActiveSuite(suite)}
 className={`flex-none flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-sm whitespace-nowrap transition-all duration-300 transform ${
 isActive
 ? 'bg-primary text-white -primary/30 scale-105'
 : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40'
}`}
 >
 {suite.name.replace(' WorkSlate', '')}
 </button>
 );
})}
 </div>

 <div className="max-w-5xl mx-auto relative items-start">
 {/* Content Container */}
 <div className="bg-white border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[2.5rem] p-8 md:p-14 -[0_20px_60px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="relative z-10">
 <FadeIn key={activeSuite.id}>
 <div className="flex flex-col md:flex-row gap-10 items-start">
 <div className="flex-1">
 <div className="flex flex-wrap items-center gap-3 mb-6">
 <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-primary border-[0.5px] border-black/9 dark:border-white/8 border-primary/40">
 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
 </svg>
 </span>
 <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-widest tracking-[0.04em]">
 {activeSuite.name}
 </div>
 <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-primary/90 text-xs font-semibold uppercase tracking-widest tracking-[0.04em]">
 <Sparkles className="w-3.5 h-3.5" /> {t("orbit_ai_powered", "Orbit AI Powered")}
 </div>
 </div>
 
 <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-[1.1] tracking-tight tracking-[-0.02em]">
 {activeSuite.tagline}
 </h3>
 
 <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed font-medium">
 {activeSuite.description}
 </p>
 
 {/* Features List */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {activeSuite.features.map((feat, idx) => {
 return (
 <div key={idx} className="flex items-start gap-3 bg-white border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 rounded-xl hover:border-primary/40 transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="mt-0.5 w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-primary shrink-0">
 <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
 </svg>
 </div>
 <span className="font-semibold text-slate-700 text-sm leading-snug">{feat}</span>
 </div>
 );
})}
 </div>
 
 <div className="mt-12 pt-8 border-t border-primary/40 flex items-center">
 <Button 
 onClick={() => setIsModalOpen(true)}
 className="bg-primary text-white hover:bg-primary/90 font-semibold py-6 px-10 rounded-full -emerald-600/20 transition-all hover:-translate-y-0.5"
 >
 {t("explore", "Explore")} {activeSuite.name} {t("details", "details")}
 </Button>
 </div>
 </div>
 </div>
 </FadeIn>
 </div>
 </div>
 </div>
 </div>
 
 {/* Modal / Popup for WorkSlate Details */}
 {isModalOpen && typeof document !== 'undefined' && createPortal(
 <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
 <div 
 className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
 onClick={() => setIsModalOpen(false)}
 ></div>
 
 <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-md-[2rem] overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {/* Header */}
 <div className="flex-none p-6 sm:p-8 border-b border-primary/40 flex justify-between items-start bg-slate-50/50">
 <div>
 <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-[10px] font-semibold uppercase tracking-widest mb-3 tracking-[0.04em]">
 {t("workslate_module", "WorkSlate Slate")}
 </div>
 <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight tracking-[-0.02em]">{activeSuite.name}</h3>
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
 <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="max-w-3xl mx-auto">
 <h4 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
 <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-primary">
 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
 </svg>
 </div>
 {t("core_features_capabilities", "Core Features & Capabilities")}
 </h4>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
 {activeSuite.features.map((feat, idx) => {
 return (
 <div key={idx} className="bg-slate-50 rounded-2xl p-6 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:border-primary/40 transition-colors">
 <h5 className="font-semibold text-slate-900 text-lg mb-2">{feat}</h5>
 <p className="text-slate-500 text-sm leading-relaxed font-medium">
 {t(
 "powerful_tools_to_automate_thi",
 "Powerful tools to automate this aspect of your business, integrating seamlessly with your broader operations."
 )}
 </p>
 </div>
 );
})}
 </div>
 
 <div className="bg-primary rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden mt-6">
 <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-[50px] -translate-y-1/2 translate-x-1/3 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"></div>
 <h4 className="text-2xl font-semibold mb-4 relative z-10 tracking-[-0.02em]">{t("ready_to_transform_your_workfl", "Ready to transform your workflow?")}</h4>
 <p className="text-primary/10 font-medium mb-8 max-w-lg relative z-10 text-white/80">
 {t("get_started_today_and_see_how", "Get started today and see how")} {activeSuite.name} {t(
 "can_streamline_your_daily_oper",
 "can streamline your daily operations and boost your bottom line."
 )}
 </p>
 <Link to="/signup">
 <Button className="bg-white text-primary hover:bg-slate-50 font-semibold py-6 px-8 rounded-xl relative z-10 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {t("start_your_free_trial", "Start Your Free Trial")}
 </Button>
 </Link>
 </div>
 </div>
 </div>
 </div>
 </div>,
 document.body
 )}
 </section>
 );
}

/* ------------------------------------------------------------------ */
export default function Home() {
 const { t} = useTranslation();
 
 const [aiPrompt, setAiPrompt] = useState("");
 const [showFirmAlert, setShowFirmAlert] = useState(false);
 const [orbitStage, setOrbitStage] = useState("idle");
 const [progressMsg, setProgressMsg] = useState("");
 const navigate = useNavigate();
 const { user} = useAuth();

 const handleAiSubmit = (e) => {
 e.preventDefault();
 if (!aiPrompt.trim()) return;

 if (user && user.company_id) {
 setShowFirmAlert(true);
 return;
}

 setOrbitStage("building");
 const msgs = [
 "Analyzing industry requirements...", 
 "Synthesizing universal components...", 
 "Structuring dynamic database...", 
 "Finalizing your workspace..."
 ];
 let i = 0;
 setProgressMsg(msgs[0]);
 const intv = setInterval(() => {
 i++;
 if (i < msgs.length) {
 setProgressMsg(msgs[i]);
} else {
 clearInterval(intv);
 setOrbitStage("success");
 confetti({ particleCount: 150, spread: 80, origin: { y: 0.5}});
}
}, 1500);
};

 const handleAccessWorkspace = () => {
 localStorage.setItem("pendingOrbitPrompt", aiPrompt);
 if (user) {
 navigate("/onboarding");
} else {
 navigate("/signup");
}
};
return (
 <div className="overflow-x-hidden">
 <Helmet>
 <title>Slate - The Ultimate AI Workslate</title>
 <meta name="description" content="Slate is an AI-powered workspace replacing multiple tools with one cohesive ecosystem. Simplify communication, scheduling, cases, and payments." />
 <meta property="og:title" content="Slate - The Ultimate AI Workspace" />
 <meta property="og:description" content="Replace fragmented tools with an intelligent, cohesive workspace built for maximum operational excellence." />
 </Helmet>

 {/* ============================================================ */}
 {/* HERO */}
 {/* ============================================================ */}
 <section className="relative pt-8 pb-10 md:pt-14 lg:py-16">
 {/* Soft light background */}
 <div className="absolute inset-0 bg-slate-50 pointer-events-none" />

 <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
 {/* Badge */}
 <FadeIn>
 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-xs font-semibold text-slate-600 mb-8  tracking-[0.04em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <span className="flex h-2 w-2 rounded-full bg-primary" />
 {t("trusted_by_500_enterprise_team", "Trusted by 500+ Enterprise Teams  •")} <span className="font-semibold text-primary flex items-center gap-2"><Sparkles className="w-3 h-3"/> {t("powered_by_orbit_ai", "Powered by Orbit AI")}</span>
 </div>
 </FadeIn>

 {/* Headline */}
 <FadeIn delay="delay-100">
 <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-slate-900 leading-[1.05] max-w-4xl mx-auto mb-6">
 {t(
 "the_work_made_effortless_that_tur",
 "The unified workspace that turns hours into"
 )}{' '}
 <span className="bg-slate-100 text-slate-900 px-4 py-1.5 rounded-2xl inline-block mt-2 shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] border-[0.5px] border-slate-200">
 {t("clear_profit", "clear profit")}
 </span>
 </h1>
 </FadeIn>

 {/* Subtitle */}
 <FadeIn delay="delay-200">
 <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
 {t(
 "built_for_teams_that_take_oper",
 "Built for teams that take operations seriously. Manage cases, automate client communication, log billable hours,\n process payments, and track HR — all in one place."
 )}
 </p>
 </FadeIn>

 
 {/* AI Input Box */}
 <FadeIn delay="delay-250">
 <div className="max-w-4xl mx-auto mb-10 relative z-20">
 
 {orbitStage === "idle" && (
 <form onSubmit={handleAiSubmit} className="flex flex-col items-center group w-full">
 <div className="w-full relative p-[1px] rounded-2xl overflow-hidden transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)]">
 
 {/* Elegant Gradient Border */}
 <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-transparent to-primary/20 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
 
 {/* Inner White Container */}
 <div className="relative bg-white dark:bg-slate-900 backdrop-blur-xl rounded-2xl p-6 sm:p-8 text-center flex flex-col h-full w-full z-10 border border-primary/10">
 <div className="mb-6 flex flex-col items-center">
 <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
   <Sparkles className="w-5 h-5 text-primary" />
 </div>
 <h2 className="font-bold text-slate-900 dark:text-white text-3xl sm:text-4xl tracking-tight leading-tight">
 Can't find your preferred workslate? <br/><span className="text-primary font-black mt-2 inline-block">Build it with Orbit Build</span>
 </h2>
 <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm max-w-2xl mx-auto">Describe your dream workspace in plain english, and our AI will build a custom enterprise system tailored exactly to your needs.</p>
 </div>
 <div className="relative w-full text-left">
   <textarea
   value={aiPrompt}
   onChange={(e) => {
   setAiPrompt(e.target.value);
   setShowFirmAlert(false);
   }}
   placeholder="e.g. I need a CRM for my logistics company to manage delivery drivers and track client invoices..."
   className="w-full h-24 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-slate-900 dark:text-white placeholder-slate-400 font-medium text-base border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none resize-none transition-all"
   />
 </div>
 <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
 <div className="flex items-center gap-2">
   <span className="flex h-2 w-2 relative">
     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75"></span>
     <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
   </span>
   <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest tracking-[0.04em]">Powered by Orbit Intelligence</span>
 </div>
 <button
 type="submit"
 disabled={!aiPrompt.trim()}
 className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white px-8 py-3.5 rounded-xl font-semibold tracking-wide shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
 >
 <Sparkles className="w-4 h-4" />
 Build with Orbit
 </button>
 </div>
 </div>
 </div>
 </form>
 )}

 {orbitStage === "building" && (
 <div className="w-full relative">
 <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-orange-400 rounded-3xl blur opacity-40 animate-pulse"></div>
 <div className="relative bg-white rounded-3xl p-12 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex flex-col items-center justify-center min-h-[300px] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
 <Sparkles className="w-8 h-8 text-emerald-500 animate-spin-slow" />
 </div>
 <div className="w-full max-w-md h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
 <div className="h-full bg-gradient-to-r from-emerald-500 to-orange-400 rounded-full animate-progress" style={{width: '60%', animation: 'progress 6s ease-in-out forwards'}}></div>
 </div>
 <h3 className="font-semibold text-slate-800 text-xl">{progressMsg}</h3>
 <p className="text-sm text-slate-500 font-medium mt-2">Please wait while Orbit constructs your platform...</p>
 </div>
 </div>
 )}

 {orbitStage === "success" && (
 <div className="w-full relative">
 <div className="relative bg-white rounded-3xl p-12 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex flex-col items-center justify-center min-h-[300px] transition-all duration-300  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white mb-6 -emerald-500/30 transform scale-110">
 <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
 </div>
 <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-orange-500 mb-3 tracking-tight tracking-[-0.02em]">Workspace Assembled!</h3>
 <p className="text-slate-500 font-medium text-lg mb-8 text-center max-w-md">Your custom Slate environment has been pre-configured by Orbit AI.</p>
 <button
 onClick={handleAccessWorkspace}
 className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-12 py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:-translate-y-1 transition-all text-lg w-full sm:w-auto"
 >
 Access Your Workspace <ArrowRight className="w-6 h-6" />
 </button>
 </div>
 </div>
 )}
 
 {showFirmAlert && (
 <div className="mt-6 bg-orange-50 border-[0.5px] border-black/9 dark:border-white/8 border-orange-200 text-orange-800 px-6 py-4 rounded-xl text-sm font-medium flex items-center justify-center gap-3">
 <span className="w-2 h-2 rounded-full bg-orange-500/10"></span>
 You already have an active firm! Head over to your Dashboard and use <strong className="text-orange-900">Orbit Board</strong> to create a new slate.
 </div>
 )}
 </div>
 </FadeIn>


 {/* CTA buttons */}
 <FadeIn delay="delay-300">
 <div className="flex flex-col items-center justify-center mb-16">
 <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
 <div className="bg-white border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-800  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("project_profitability", "Project Profitability")}</div>
 <div className="bg-white border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-800  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("billing_invoicing", "Billing & Invoicing")}</div>
 <div className="bg-white border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-800  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("client_portal", "Client Portal")}</div>
 <div className="bg-white border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-800  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("hr_payroll", "HR & Payroll")}</div>
 <div className="bg-slate-50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-primary px-6 py-2.5 rounded-xl text-sm font-semibold ">{t("all_features", "All Features")}</div>
 </div>
 </div>
 </FadeIn>

 {/* Dashboard mockup */}
 <FadeIn delay="delay-500">
 <div className="relative w-full max-w-6xl mx-auto rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-slate-50 overflow-hidden flex items-center justify-center">
 <img src="/images/hero_dashboard_ui.png" alt="Slate Dashboard Mockup" className="w-full h-auto object-contain" />
 </div>
 </FadeIn>
 </div>
 </section>
 {/* ============================================================ */}
 {/* ORBIT AI HERO (INTERACTIVE DEMO) */}
 {/* ============================================================ */}
 <section className="py-20 md:py-24 bg-white text-slate-900 relative overflow-hidden border-t border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
 
 <FadeIn>
 <div>
 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-primary/90 text-xs font-semibold uppercase tracking-widest mb-6 tracking-[0.04em]">
 <Sparkles className="w-3.5 h-3.5" />
 {t("your_intelligent_agent", "Your Intelligent Agent")}
 </div>
 <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6 leading-[1.1] tracking-[-0.02em]">
 {t("meet", "Meet")} <br/>
 <span className="text-primary text-6xl md:text-8xl font-extrabold pb-2 inline-block tracking-tighter tracking-[-0.02em]">
 {t("orbit_ai", "Orbit AI")}
 </span>
 </h2>
 <p className="text-lg text-slate-600 mb-8 leading-relaxed font-medium">
 {t(
 "orbit_isn_t_just_a_chatbot_it_",
 "Orbit isn't just a chatbot. It's an intelligent agent embedded directly into your workflow. \n Ask it to analyze data, schedule appointments, or draft emails — it executes actions automatically across the entire Slate suite."
 )}
 </p>
 <ul className="space-y-4 mb-10 text-slate-700 font-medium">
 <li className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-primary shrink-0"><Clock className="w-4 h-4" /></div> {t("saves_an_average_of_14_hours_p", "Saves an average of 14 hours per week")}</li>
 <li className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-primary shrink-0"><Shield className="w-4 h-4" /></div> {t("bank_grade_secure_long_term_me", "Bank-grade secure long-term memory")}</li>
 <li className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-primary shrink-0"><Briefcase className="w-4 h-4" /></div> {t(
 "understands_all_9_industry_sec",
 "Understands all 9 industry sectors natively"
 )}</li>
 </ul>
 </div>
 </FadeIn>

 <FadeIn delay="delay-200">
 <div className="relative rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-white overflow-hidden transform rotate-1 hover:rotate-0 transition-transform duration-500 group hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <img 
 src="/images/orbit_dashboard_mockup.png" 
 alt="Slate Dashboard featuring Orbit AI Panel" 
 className="w-full h-auto block" 
 />
 </div>
 </FadeIn>

 </div>
 </div>
 </section>
 <style dangerouslySetInnerHTML={{__html: `
 @keyframes slideRight {
 0% { transform: scaleX(1);}
 100% { transform: scaleX(0);}
}
 `}} />
 {/* ============================================================ */}
 {/* HOW IT WORKS */}
 {/* ============================================================ */}
 <section className="py-16 md:py-24 lg:py-32 bg-slate-50 border-t border-primary/40">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
 <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-white border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-slate-600 text-xs font-semibold uppercase tracking-wider mb-6  tracking-[0.04em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {t("workflow", "Workflow")}
 </span>
 <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-900 mb-6 tracking-[-0.02em]">
 {t("how_slate_works", "How Slate works")}
 </h2>
 <p className="text-lg text-slate-600 leading-relaxed font-medium">
 {t(
 "we_ve_streamlined_the_entire_p",
 "We've streamlined the entire project lifecycle so your team can focus on execution, not administration."
 )}
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 relative">
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
 ].map((step, i) => {
 return (
 <FadeIn key={i} delay={`delay-${(i + 1) * 100}`}>
 <div className="relative bg-white rounded-3xl p-8 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-center z-10 group transition- hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="w-16 h-16 mx-auto bg-slate-50 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ">
 <step.icon className="w-8 h-8" />
 </div>
 <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary text-white font-black rounded-xl flex items-center justify-center text-lg transform rotate-6 group-hover:rotate-12 transition-transform">
 {step.step}
 </div>
 <h3 className="text-2xl font-semibold text-slate-900 mb-4 tracking-[-0.02em]">{step.title}</h3>
 <p className="text-slate-600 font-medium leading-relaxed">
 {step.desc}
 </p>
 </div>
 </FadeIn>
 );
})}
 </div>
 </div>
 </section>
 {/* ============================================================ */}
 {/* SOCIAL PROOF STRIP (Animated Marquee) */}
 {/* ============================================================ */}
 <section className="py-20 md:py-24 bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200 overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
      <FadeIn>
        <p className="text-xl font-medium text-slate-500 text-center">
          {t("trusted_by_over_10_000_compani", "Trusted by over 10 000 companies worldwide")}
        </p>
      </FadeIn>
    </div>

    <div className="relative flex overflow-x-hidden w-full group">
      <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-white to-transparent z-10"></div>
      <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white to-transparent z-10"></div>
      
      <div className="animate-marquee flex whitespace-nowrap items-center gap-16 py-4 group-hover:[animation-play-state:paused]">
        {firms.map((firm, idx) => (
          <div key={`firm-1-${idx}`} className="flex items-center cursor-default select-none transition-transform duration-300 opacity-60 hover:opacity-100">
            {firm.logo}
            <span className={`text-slate-900 ${firm.font} text-xl ml-2`}>{firm.name}</span>
          </div>
        ))}
      </div>
      <div className="animate-marquee2 flex whitespace-nowrap items-center gap-16 py-4 absolute top-0 group-hover:[animation-play-state:paused]">
        {firms.map((firm, idx) => (
          <div key={`firm-2-${idx}`} className="flex items-center cursor-default select-none transition-transform duration-300 opacity-60 hover:opacity-100">
            {firm.logo}
            <span className={`text-slate-900 ${firm.font} text-xl ml-2`}>{firm.name}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
  {/* ============================================================ */}
  {/* BENTO BOX FEATURES GRID */}
  {/* ============================================================ */}
  <section className="py-20 md:py-24 lg:py-32 bg-slate-900 overflow-hidden relative">
    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3"></div>
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <FadeIn>
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">
            Enterprise Capabilities
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-6">
            Everything you need. <br/> <span className="text-slate-400">Nothing you don't.</span>
          </h2>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Large Feature 1 */}
        <FadeIn delay="delay-100" className="md:col-span-2">
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 h-full flex flex-col justify-between group hover:bg-white/10 transition-colors duration-300">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Customer & Pipeline Tracking</h3>
              <p className="text-slate-400 font-medium max-w-md">Manage business operations from intake to resolution. Customize stages, set reminders, and track client documents in one central view.</p>
            </div>
            <div className="mt-8 rounded-xl overflow-hidden border border-white/10 relative h-48 bg-slate-800">
               {/* Decorative Abstract UI */}
               <div className="absolute inset-x-4 bottom-0 h-3/4 bg-slate-900 rounded-t-xl border-t border-x border-white/10 shadow-2xl p-4">
                 <div className="flex gap-2 mb-4">
                   <div className="w-2 h-2 rounded-full bg-red-500"></div>
                   <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                   <div className="w-2 h-2 rounded-full bg-green-500"></div>
                 </div>
                 <div className="h-4 w-1/3 bg-slate-700 rounded mb-4"></div>
                 <div className="space-y-2">
                   <div className="h-2 w-full bg-slate-800 rounded"></div>
                   <div className="h-2 w-5/6 bg-slate-800 rounded"></div>
                 </div>
               </div>
            </div>
          </div>
        </FadeIn>

        {/* Small Feature 1 */}
        <FadeIn delay="delay-200">
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 h-full group hover:bg-white/10 transition-colors duration-300">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Smart Client Portal</h3>
            <p className="text-slate-400 font-medium">Give clients a secure, branded environment to sign documents, review milestones, and communicate directly with your team.</p>
          </div>
        </FadeIn>

        {/* Small Feature 2 */}
        <FadeIn delay="delay-100">
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 h-full group hover:bg-white/10 transition-colors duration-300">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Integrated Time Tracking</h3>
            <p className="text-slate-400 font-medium">Bill accurately with live timers for consultations, research, meetings, and project delivery — then convert hours to invoices.</p>
          </div>
        </FadeIn>

        {/* Large Feature 2 */}
        <FadeIn delay="delay-200" className="md:col-span-2">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] p-8 h-full flex flex-col sm:flex-row items-center justify-between gap-8 group transition-colors duration-300">
            <div className="flex-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Orbit AI Assistant</h3>
              <p className="text-emerald-100/70 font-medium max-w-sm">Your built-in enterprise AI. Orbit can search records, navigate the app, create tasks, and automate workflows via simple chat commands.</p>
            </div>
            <div className="w-full sm:w-1/2 h-48 bg-slate-900 rounded-xl border border-emerald-500/20 relative overflow-hidden flex items-center justify-center">
               <Sparkles className="w-20 h-20 text-emerald-500/30 animate-pulse" />
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  </section>

 {/* ============================================================ */}
 {/* SUITES SECTION (Interactive) */}
 {/* ============================================================ */}
 <SuitesSection />
 {/* ============================================================ */}
 {/* TESTIMONIALS */}
 {/* ============================================================ */}
 <section className="py-16 md:py-24 lg:py-32 bg-white relative hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
 <FadeIn>
 <div className="text-center max-w-2xl mx-auto mb-20">
 <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-slate-50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-primary/90 text-xs font-semibold uppercase tracking-widest mb-6 tracking-[0.04em]">
 {t("client_success", "Client Success")}
 </span>
 <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight tracking-[-0.02em]">
 {t("what_our_customers_say", "What our customers say")}
 </h2>
 </div>
 </FadeIn>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
 {testimonials.map((item, idx) => {
 return (
 <FadeIn key={idx} delay={`delay-[${idx * 120}ms]`}>
 <div className="bg-white border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[2rem] p-10 flex flex-col justify-between hover:border-primary/30 -emerald-900/5 transition-all duration-300 h-full group relative overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="absolute top-0 right-0 p-8 opacity-5 text-[8rem] font-serif leading-none font-black text-primary/70 group-hover:text-primary group-hover:opacity-10 transition-colors duration-500">"</div>
 
 <div className="relative z-10">
 <div className="flex gap-2.5 mb-8">
 {Array.from({ length: item.rating}).map((_, si) => {
 return (
 <Star
 key={si}
 className="w-5 h-5 fill-amber-400 text-amber-400"
 />
 );
})}
 </div>
 <blockquote className="text-lg text-slate-700 leading-relaxed font-medium mb-10">
 "{item.quote}"
 </blockquote>
 </div>

 <div className="flex items-center gap-4 pt-6 border-t border-primary/40 relative z-10">
 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center text-primary/90 font-semibold text-lg ">
 {item.author
 .split(' ')
 .map((n) => n[0])
 .join('')}
 </div>
 <div>
 <p className="text-base font-semibold text-slate-900">
 {item.author}
 </p>
 <p className="text-sm font-medium text-slate-500">
 {item.role}, {item.firm}
 </p>
 </div>
 </div>
 </div>
 </FadeIn>
 );
})}
 </div>
 </div>
 </section>
 {/* ============================================================ */}
 {/* CTA BANNER */}
 {/* ============================================================ */}
 <section className="py-16 md:py-24 lg:py-32">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <FadeIn>
 <div className="relative bg-gradient-to-br from-primary to-primary/90 rounded-[2.5rem] px-8 py-24 md:px-16 text-center overflow-hidden shadow-[0_20px_50px_-12px_rgba(16,185,129,0.3)]">
 {/* Decorative glow circles */}
 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15)_0%,transparent_70%)] pointer-events-none" />
 
 <div className="relative z-10 max-w-3xl mx-auto space-y-6">
 <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-black text-white tracking-tighter leading-[1] tracking-[-0.03em]">
 {t("ready_to_modernize_your_organi", "Ready to modernize your organization?")}
 </h2>
 <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-xl mx-auto font-medium">
 {t(
 "create_your_workspace_invite_a",
 "Create your workslate, invite associates, and start managing cases in minutes."
 )}
 </p>

 <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
 <Link to="/signup">
 <Button className="bg-white text-primary hover:bg-slate-50 font-bold text-lg py-7 px-10 rounded-2xl group transition-all hover:scale-[1.02] shadow-xl">
 {t("start_your_free_trial", "Start Your Free Trial")}
 <ChevronRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" />
 </Button>
 </Link>
 <Link to="/contact">
 <Button
 variant="outline"
 className="border-white/20 text-white hover:bg-white/10 font-bold text-lg py-7 px-10 rounded-2xl transition-all hover:scale-[1.02] bg-transparent backdrop-blur-sm"
 >
 {t("contact_sales", "Contact Sales")}
 </Button>
 </Link>
 </div>
 
 <div className="pt-8 flex flex-wrap justify-center gap-8 text-sm text-white/80 font-medium">
 <span className="flex items-center gap-2.5"><Shield className="w-4 h-4"/> {t("soc2_certified", "SOC2 Certified")}</span>
 <span className="flex items-center gap-2.5"><Clock className="w-4 h-4"/> {t("5_minute_setup", "5-Minute Setup")}</span>
 <span className="flex items-center gap-2.5"><CreditCard className="w-4 h-4"/> {t("no_credit_card_required", "No Credit Card Required")}</span>
 </div>
 </div>
 </div>
 </FadeIn>
 </div>
 </section>
 </div>
 );
}
