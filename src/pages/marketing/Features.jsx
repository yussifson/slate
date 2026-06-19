import { useTranslation} from "react-i18next";
import { Link} from 'react-router-dom';
import { Helmet} from 'react-helmet-async';
import { Briefcase, Users, CreditCard, Mail, Shield, Clock, Check, ArrowRight, Globe, Sparkles} from 'lucide-react';
import { Button} from '@/components/ui/button';

export default function Features() {
 const { t} = useTranslation();
 const deepDives = [
 {
 badge: "Project Management",
 title: "Automate your workflow completely",
 description:
 "Manage client projects, deliverables, milestones, and outcome tracking. Move tasks through drag-and-drop pipelines to visualize stages effortlessly. Get smart alerts when deadlines approach.",
 bullets: [
 "Interactive project pipelines and customizable milestones",
 "Task logging with automated deadline notifications",
 "Detailed capacity planning to safeguard operational integrity",
 "Project outcome dashboards to analyze performance metrics",
 ],
 icon: Briefcase,
 align: "left",
 image: "/images/project_management_ui.png?v=2"
},
 {
 badge: "Secure Client Portal",
 title: "Deliver premium experiences to your clients",
 description:
 "Allow clients to check their project's progress, view active tasks, upload requested relevant materials, and digitally sign agreements. Fully customized under your own brand color and logo.",
 bullets: [
 "Self-service onboarding intake questionnaires",
 "Direct chat window with the lead project team",
 "Service agreements and signature signing prompts",
 "Transparent billable charts and payment histories",
 ],
 icon: Users,
 align: "right",
 image: "/images/client_portal_ui.png?v=2"
},
 {
 badge: "Time & Billing",
 title: "Accept payments locally with ease",
 description:
 "Record billable hours with accurate active timers. Automatically construct invoices based on time entries, flat fees, or advance retainer drawdowns. Process client payments securely.",
 bullets: [
 "Desktop active timers tracking research and execution",
 "Dynamic invoice templates matching your corporate letterhead",
 "Local payments processed via secure integrations",
 "Financial reporting tracking organization revenue and outstanding fees",
 ],
 icon: CreditCard,
 align: "left",
 image: "/images/billing_ui.png?v=2"
},
 {
 badge: "Offline First",
 title: "Work seamlessly without internet",
 description:
 "Lose connection? Keep working. Our robust offline-first architecture lets you access your data, edit cases, and track time even without internet. Changes sync automatically when you're back online.",
 bullets: [
 "Full read/write capabilities while disconnected",
 "Intelligent background sync on reconnection",
 "Local conflict resolution for offline edits",
 "No more 'loading forever' when on flaky networks",
 ],
 icon: Clock,
 align: "right",
 image: "/images/offline_feature_ui.png?v=2"
},
 {
 badge: "Ecosystem Integrations",
 title: "Connect all your favorite tools",
 description:
 "Slate acts as your central hub. Connect communication channels, calendar apps, and payment gateways seamlessly without leaving the platform.",
 bullets: [
 "Slack & Microsoft Teams instant notifications",
 "Google & Outlook Calendar bidirectional sync",
 "Stripe & local payment processor support",
 "Open API for custom enterprise connections",
 ],
 icon: Briefcase,
 align: "left",
 image: "/images/integrations_ui.png?v=2"
},
 {
 badge: "Orbit AI Assistant",
 title: "Your intelligent co-pilot",
 description:
 "Meet Orbit, an advanced AI integrated directly into your workslate. It understands your cases, summarizes documents, and answers questions using contextual data instantly.",
 bullets: [
 "Context-aware insights from your active screen",
 "Natural language search across the entire database",
 "Automated document summarization and extraction",
 "Actionable workflows launched via chat",
 ],
 icon: Briefcase,
 align: "right",
 image: "/images/orbit_dashboard_mockup.png?v=2"
},
 {
 badge: "Spotlight Search",
 title: "Navigate at the speed of thought",
 description:
 "Press Ctrl+K from anywhere in the app to open Spotlight Search. Instantly find clients, cases, documents, or jump to any settings page without clicking through menus.",
 bullets: [
 "Global search across all modules simultaneously",
 "Keyboard-first navigation for power users",
 "Instant context injection directly into Orbit AI",
 "Fuzzy matching for typos and partial words",
 ],
 icon: Briefcase,
 align: "left",
 image: "/images/spotlight_search_ui.png?v=2"
},
 {
 badge: "Global Localization",
 title: "Break language barriers instantly",
 description:
 "Translate your entire workspace, client portal, invoices, and system templates with one click. Support international clients in their preferred native language with high-fidelity system translations.",
 bullets: [
 "Complete multilingual system translation with full i18n support",
 "Tenant-level default language configurations",
 "Client-specific localized portal interfaces",
 "Dynamic date, number, and currency localization based on region",
 ],
 icon: Globe,
 align: "right",
 image: "/images/internationalization_ui.png?v=2"
},
 {
 badge: "AI WorkSlate Generation",
 title: "Build complex modules using natural language",
 description:
 "Describe your custom industry requirement or pipeline in natural language, and Slate instantly builds the forms, data structures, workflows, and navigation routes for you—no coding required.",
 bullets: [
 "Zero-code layout rendering for instantaneous deployment",
 "Intelligent data structure optimization tailored to your industry",
 "Dynamic pipeline routing and state transitions mapped automatically",
 "Enterprise-grade security policies applied dynamically to new modules",
 ],
 icon: Sparkles,
 align: "left",
 image: "/images/dynamic_modules_ui.png?v=2"
},
 ];

 const additionalFeatures = [
 {
 icon: Mail,
 title: "Integrated Email Sync",
 description:
 "Connect your workslate directly with Office 365 or Gmail. Read, flag, and reply to client emails right inside the project files."},
 {
 icon: Shield,
 title: "Compliance Audit Logs",
 description:
 "Maintain high-integrity logs tracking user logins, file modifications, client downloads, and sensitive database exports automatically."},
 {
 icon: Clock,
 title: "Leave & Payroll Tools",
 description:
 "Manage associate leave requests, store payroll structures, generate salary slips, and run performance analytics indicators."},
 ];

 return (
 <div className="overflow-x-hidden bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {/* ── Hero Header ── */}
 <section className="relative pt-8 pb-10 md:pt-14 md:pb-20 bg-slate-50 border-b border-primary/40">
 <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
 <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-white border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-slate-600 text-xs font-semibold uppercase tracking-wider mb-6  tracking-[0.04em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {t("core_features", "Core Features")}
 </span>
 <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-slate-900 mb-6 max-w-4xl mx-auto leading-[1.05]">
 {t("everything_your_business_team_", "Everything your business team needs to")}{' '}
 <span className="bg-slate-100 text-slate-900 px-4 py-1.5 rounded-2xl inline-block mt-2 shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] border-[0.5px] border-slate-200">
 {t("succeed", "succeed")}
 </span>
 </h1>
 <p className="text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">
 {t(
 "unlock_a_comprehensive_system_",
 "Unlock a comprehensive system built specifically for modern operational requirements. Minimize admin work and focus entirely on delivering value to your clients."
 )}
 </p>
 </div>
 </section>
 {/* ── Feature Deep Dives ── */}
 <section className="py-20 md:py-28 bg-slate-50">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-28 lg:space-y-32">
 {deepDives.map((feature, index) => {
 const Icon = feature.icon;
 const isReversed = feature.align === "right";

 return (
 <div
 key={index}
 className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-16 ${
 isReversed ? "lg:flex-row-reverse" : ""
}`}
 >
 {/* Text content */}
 <div className="flex-1 space-y-6">
 <span className="inline-flex px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest ring-1 ring-primary/20">
 {feature.badge}
 </span>

 <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tighter leading-[1.1]">
 {feature.title}
 </h2>

 <p className="text-lg text-slate-600 leading-relaxed font-medium">
 {feature.description}
 </p>

 <ul className="space-y-4 pt-4">
 {feature.bullets.map((bullet, idx) => {
 return (
 <li
 key={idx}
 className="flex items-start gap-3 text-base text-slate-700 font-medium"
 >
 <div className="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center text-primary mt-0.5 shrink-0">
 <Check className="w-3.5 h-3.5" strokeWidth={3} />
 </div>
 <span>{bullet}</span>
 </li>
 );
})}
 </ul>
 </div>
 {/* Stylized UI Mockup */}
 <div className="flex-1 w-full">
 <div className="w-full aspect-[4/3] rounded-[2rem] border border-slate-200/60 p-2 bg-white/50 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden relative group">
 <div className="absolute inset-2 rounded-[1.5rem] overflow-hidden bg-slate-100">
 <img 
 src={feature.image} 
 alt={`${feature.badge} Interface`} 
 className="w-full h-full object-cover object-center transform scale-[1.02] group-hover:scale-105 transition-transform duration-700"
 />
 </div>
 </div>
 </div>
 </div>
 );
})}
 </div>
 </section>
 {/* ── Additional Capabilities Grid ── */}
 <section className="py-20 md:py-28 bg-slate-50 border-t border-primary/40">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="text-center max-w-2xl mx-auto mb-16">
 <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-white border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-slate-600 text-xs font-semibold uppercase tracking-wider mb-6  tracking-[0.04em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {t("even_more_capabilities", "Even More Capabilities")}
 </span>
 <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 tracking-[-0.02em]">
 {t(
 "an_operating_system_packed_wit",
 "An operating system packed with integrations"
 )}
 </h2>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
 {additionalFeatures.map((feat, index) => {
 const FeatIcon = feat.icon;
 return (
 <div
 key={index}
 className="rounded-3xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-white p-8 space-y-5 transition- duration-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 >
 <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-primary">
 <FeatIcon className="w-6 h-6" />
 </div>
 <h3 className="font-semibold text-xl text-slate-900">
 {feat.title}
 </h3>
 <p className="text-base text-slate-600 leading-relaxed font-medium">
 {feat.description}
 </p>
 </div>
 );
})}
 </div>
 </div>
 </section>
 {/* ── CTA Footer ── */}
 <section className="py-24 md:py-32 bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
 <h2 className="text-4xl md:text-5xl font-semibold text-slate-900 tracking-tight mb-6 tracking-[-0.02em]">
 {t("supercharge_your_business_offi", "Supercharge your business office today")}
 </h2>
 <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
 {t(
 "sign_up_now_for_a_14_day_free_",
 "Sign up now for a 14-day free trial on your own customized\n subdomain. Set up takes less than 2 minutes."
 )}
 </p>
 <Link to="/signup">
 <Button className="bg-primary hover:bg-primary/90 text-white font-semibold py-6 px-10 rounded-full transition-all duration-200 text-base">
 {t("start_free_trial", "Start Free Trial")}
 <ArrowRight className="ml-2 w-5 h-5" />
 </Button>
 </Link>
 </div>
 </section>
 </div>
 );
}
