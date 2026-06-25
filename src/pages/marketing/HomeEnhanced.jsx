import confetti from "canvas-confetti";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { createPortal } from 'react-dom';
import {
  ArrowRight, ArrowUpRight,
  Scale, Shield, Users, Clock, Briefcase, Smartphone, Heart, Building2, Truck,
  Star, ChevronRight, BarChart3, FileText, Bell, CreditCard,
  Sparkles, Zap, Lightbulb, Target, Rocket, CheckCircle2,
  LayoutGrid, Gauge, Lock, Headphones, TrendingUp, Code,
  Layers, Activity, Filter, Search, Settings, Database,
  Cloud, AlertCircle, PlayCircle, Video, BookOpen, Award,
  Unlock, Eye, Compass, Workflow, GitBranch, ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

/* ────────────────────────────────── */
/* ANIMATIONS & UTILITIES */
/* ────────────────────────────────── */

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

/* ────────────────────────────────── */
/* SUITES SECTION (from existing) */
/* ────────────────────────────────── */

const suites = [
  {
    id: 'retail',
    name: 'Retail WorkSlate',
    tagline: 'Multi-Store POS & Inventory',
    description: 'Unify your retail operations with centralized inventory management, multi-store POS, and detailed sales analytics.',
    features: ['Multi-Store Cloud POS', 'Real-time Inventory', 'Supplier Management', 'Sales Analytics'],
    icon: ShoppingBag
  },
  {
    id: 'hospital',
    name: 'Healthcare WorkSlate',
    tagline: 'Clinic & Hospital Management',
    description: 'Streamline patient onboarding, appointment scheduling, and staff rostering with our secure health-compliant platform.',
    features: ['Patient Records & History', 'Appointment Scheduling', 'Medical Billing', 'Staff Rostering'],
    icon: Heart
  },
  {
    id: 'school',
    name: 'Education WorkSlate',
    tagline: 'School & Campus Management',
    description: 'Unify student records, grading, fee collection, and parent communication in a single intuitive system.',
    features: ['Student Information System', 'Fee Collection', 'Gradebook & Exams', 'Parent Portal'],
    icon: BookOpen
  },
  {
    id: 'hotel',
    name: 'Hospitality WorkSlate',
    tagline: 'Hotel & Property Management',
    description: 'Deliver exceptional guest experiences with integrated booking, housekeeping, and point-of-sale systems.',
    features: ['Booking & Reservations', 'Housekeeping Manager', 'Restaurant POS', 'Guest CRM'],
    icon: Building2
  },
  {
    id: 'logistics',
    name: 'Logistics WorkSlate',
    tagline: 'Freight & Delivery Management',
    description: 'Optimize your supply chain with real-time fleet tracking, dispatch routing, and automated invoicing.',
    features: ['Fleet & Asset Tracking', 'Dispatch Management', 'Automated Invoicing', 'Driver App'],
    icon: Truck
  },
  {
    id: 'law',
    name: 'Law Firm WorkSlate',
    tagline: 'Legal Practice Management',
    description: 'A complete ecosystem for modern law firms to manage cases, track billable hours, and collaborate securely.',
    features: ['Case Management', 'Conflict Checking', 'Legal Billing', 'Secure Portal'],
    icon: Briefcase
  }
];

function SuitesSection() {
  const { t } = useTranslation();
  const [activeSuite, setActiveSuite] = useState(suites[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className="py-20 md:py-32 lg:py-40 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <FadeIn>
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold uppercase tracking-widest mb-6">
              <Sparkles className="w-3 h-3 mr-2" /> Industry Solutions
            </span>
            <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
              Purpose-Built for Every Industry
            </h2>
            <p className="text-xl text-slate-600 leading-relaxed font-medium">
              Deploy specialized WorkSlates designed by experts in your field, pre-configured with all the tools you need to excel
            </p>
          </div>
        </FadeIn>

        {/* Suite Selector */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {suites.map(suite => {
            const isActive = activeSuite.id === suite.id;
            return (
              <motion.button
                key={suite.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveSuite(suite)}
                className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {suite.name.replace(' WorkSlate', '')}
              </motion.button>
            );
          })}
        </div>

        {/* Active Suite Display */}
        <motion.div
          key={activeSuite.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          <div className="bg-white border border-slate-200 rounded-2xl p-12 md:p-16 shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl flex items-center justify-center text-emerald-600">
                    {activeSuite.icon && <activeSuite.icon className="w-6 h-6" />}
                  </div>
                  <span className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold">
                    {activeSuite.name}
                  </span>
                </div>
                <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                  {activeSuite.tagline}
                </h3>
                <p className="text-lg text-slate-600 mb-10 leading-relaxed font-medium">
                  {activeSuite.description}
                </p>

                {/* Features Grid */}
                <div className="space-y-4 mb-10">
                  {activeSuite.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <span className="font-medium text-slate-700">{feat}</span>
                    </div>
                  ))}
                </div>

                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-6 px-10 rounded-xl font-bold flex items-center gap-2">
                  Explore {activeSuite.name.replace(' WorkSlate', '')} <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 aspect-square flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white">
                    {activeSuite.icon && <activeSuite.icon className="w-10 h-10" />}
                  </div>
                  <p className="text-slate-500 font-medium">Dashboard Preview</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ────────────────────────────────── */
/* MAIN HOME COMPONENT */
/* ────────────────────────────────── */

export default function HomeEnhanced() {
  const { t } = useTranslation();
  const [aiPrompt, setAiPrompt] = useState("");
  const [orbitStage, setOrbitStage] = useState("idle");
  const [progressMsg, setProgressMsg] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleAiSubmit = (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
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
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
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
    <div className="overflow-x-hidden bg-white">
      <Helmet>
        <title>Slate - Enterprise Workspace Management Platform</title>
        <meta name="description" content="Slate is the world's most comprehensive AI-powered workspace platform for enterprises. Manage operations, clients, finances, HR, and more in one unified system." />
        <meta property="og:title" content="Slate - Enterprise Workspace" />
      </Helmet>

      {/* ════════════════════════════════ HERO SECTION ════════════════════════════════ */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 via-white to-white pointer-events-none" />
        
        {/* Decorative blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Badge */}
          <FadeIn>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-sm font-semibold text-emerald-700 mb-8 hover:shadow-lg transition-shadow"
            >
              <Sparkles className="w-4 h-4" />
              Trusted by 10,000+ Enterprise Teams Worldwide
            </motion.div>
          </FadeIn>

          {/* Main Headline */}
          <FadeIn delay="delay-100">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-slate-900 leading-[1.05] max-w-5xl mb-8">
              The Unified Workspace{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                That Powers Enterprise Operations
              </span>
            </h1>
          </FadeIn>

          {/* Subheading */}
          <FadeIn delay="delay-200">
            <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mb-12 leading-relaxed font-medium">
              Replace your fragmented tech stack with Slate—one intelligent platform that manages CRM, projects, payments, HR, compliance, and unlimited custom modules. Built for enterprises. Powered by Orbit AI.
            </p>
          </FadeIn>

          {/* CTA Section */}
          <FadeIn delay="delay-300">
            <div className="flex flex-col sm:flex-row gap-6 mb-20">
              <Button
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-6 px-10 rounded-xl font-bold text-lg flex items-center gap-2 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                Start Your Free Trial <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                className="border-2 border-slate-300 text-slate-900 py-6 px-10 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all"
              >
                <PlayCircle className="w-5 h-5 mr-2" /> Watch Demo
              </Button>
            </div>
          </FadeIn>

          {/* Trust Indicators */}
          <FadeIn delay="delay-400">
            <div className="flex flex-wrap gap-8 md:gap-12">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                <span className="font-semibold text-slate-700">14-day free trial, no credit card</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                <span className="font-semibold text-slate-700">Enterprise-grade security & compliance</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                <span className="font-semibold text-slate-700">30+ pre-built industry solutions</span>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Hero Dashboard Image */}
        <FadeIn delay="delay-500" className="mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow duration-300">
              <img 
                src="/images/hero_dashboard_ui.png" 
                alt="Slate Enterprise Dashboard" 
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <PlayCircle className="w-20 h-20 text-white" />
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ════════════════════════════════ CORE FEATURES ════════════════════════════════ */}
      <section className="py-20 md:py-32 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-widest mb-6">
                <Zap className="w-3 h-3 mr-2" /> Core Features
              </span>
              <h2 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6">
                Enterprise-Grade Features Built In
              </h2>
              <p className="text-xl text-slate-600 font-medium">
                Everything you need to manage your entire business operation
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: LayoutGrid,
                title: 'Universal Dashboard',
                desc: 'Customizable dashboard with real-time widgets, KPIs, and performance metrics across all modules'
              },
              {
                icon: Users,
                title: 'Smart Client Portal',
                desc: 'Secure, branded portal for clients to collaborate, sign documents, and track progress'
              },
              {
                icon: Clock,
                title: 'Time & Project Tracking',
                desc: 'Native time tracking with project billables, resource allocation, and profitability analysis'
              },
              {
                icon: CreditCard,
                title: 'Integrated Payments',
                desc: 'Accept payments locally via Paystack, M-Pesa, and international providers with automated invoicing'
              },
              {
                icon: Shield,
                title: 'Bank-Grade Security',
                desc: 'End-to-end encryption, role-based access control, SOC 2, ISO 27001, and full compliance'
              },
              {
                icon: Smartphone,
                title: 'WhatsApp & Email Sync',
                desc: 'Automatic communication logging with complete audit trails and message history'
              },
              {
                icon: BarChart3,
                title: 'Advanced Analytics',
                desc: 'Real-time dashboards, custom reports, forecasting, and business intelligence'
              },
              {
                icon: Sparkles,
                title: 'Orbit AI Assistant',
                desc: 'Your intelligent agent that understands context and executes tasks across the platform'
              },
              {
                icon: Workflow,
                title: 'Workflow Automation',
                desc: 'Build complex automations without coding using our visual workflow builder'
              }
            ].map((feature, idx) => (
              <FadeIn key={idx} delay={`delay-${Math.min(idx * 75, 300)}`}>
                <motion.div
                  whileHover={{ y: -8 }}
                  className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════ ORBIT AI SECTION ════════════════════════════════ */}
      <section className="py-20 md:py-32 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500 rounded-full mix-blend-screen filter blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500 rounded-full mix-blend-screen filter blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <div>
                <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-widest mb-6">
                  <Sparkles className="w-3 h-3 mr-2" /> AI Intelligence
                </span>
                <h2 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
                  Meet Orbit—Your Enterprise AI Agent
                </h2>
                <p className="text-xl text-emerald-100 mb-10 leading-relaxed font-medium">
                  Orbit isn't just a chatbot. It's an intelligent agent that understands your business context, integrates with all your workflows, and automates complex tasks across the entire platform.
                </p>

                <ul className="space-y-4 mb-12">
                  {[
                    'Saves 14+ hours per week per employee',
                    'Understands 30+ industry sectors natively',
                    'Bank-grade secure long-term memory',
                    'Learns your business processes automatically'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>

                <Button className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 py-6 px-10 rounded-xl font-bold text-lg flex items-center gap-2 shadow-xl shadow-emerald-500/30">
                  Explore Orbit AI <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </FadeIn>

            <FadeIn delay="delay-200">
              <div className="relative">
                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl border border-emerald-400/30 p-8 aspect-square flex items-center justify-center">
                  <div className="text-center">
                    <Sparkles className="w-24 h-24 text-emerald-400 mx-auto mb-6 animate-pulse" />
                    <p className="text-emerald-200 font-medium text-lg">AI Dashboard Preview</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════ SUITES SECTION ════════════════════════════════ */}
      <SuitesSection />

      {/* ════════════════════════════════ TRUST & SOCIAL PROOF ════════════════════════════════ */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-lg font-semibold text-slate-600 mb-8">
                Trusted by 10,000+ Organizations Worldwide
              </p>
              <div className="flex flex-wrap justify-center gap-12 items-center">
                {['Acme Corp', 'Tech Ventures', 'Global Solutions', 'Enterprise Pro', 'Innovation Labs'].map((name, idx) => (
                  <div key={idx} className="text-slate-400 font-bold text-lg hover:text-slate-600 transition-colors">
                    {name}
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Stats */}
          <FadeIn delay="delay-200">
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { label: 'Active Users', value: '100K+' },
                { label: 'Transactions', value: '$2B+' },
                { label: 'Uptime', value: '99.99%' },
                { label: 'Data Centers', value: '4 Global' }
              ].map((stat, idx) => (
                <div key={idx} className="text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                  <p className="text-4xl md:text-5xl font-extrabold text-emerald-600 mb-2">{stat.value}</p>
                  <p className="text-slate-600 font-semibold">{stat.label}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ════════════════════════════════ FINAL CTA ════════════════════════════════ */}
      <section className="py-20 md:py-32 bg-gradient-to-r from-emerald-500 to-teal-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-transparent" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <FadeIn>
            <h2 className="text-5xl md:text-6xl font-extrabold mb-6">
              Ready to Transform Your Enterprise?
            </h2>
            <p className="text-xl md:text-2xl mb-12 leading-relaxed opacity-95">
              Join thousands of enterprises using Slate to streamline operations and accelerate growth
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                onClick={() => navigate('/signup')}
                className="bg-white text-emerald-600 hover:bg-slate-100 py-6 px-12 rounded-xl font-bold text-lg"
              >
                Start Free Trial Today
              </Button>
              <Button
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 py-6 px-12 rounded-xl font-bold text-lg"
              >
                Schedule a Demo
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
