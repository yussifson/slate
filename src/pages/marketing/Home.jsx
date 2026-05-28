import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Scale,
  Shield,
  Clock,
  Briefcase,
  Smartphone,
  Building2,
  Hexagon,
  Diamond,
  Pyramid,
  Box,
  ShieldCheck,
  Share2,
  Video,
  CreditCard,
  FileSignature,
  Slack
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      className={`opacity-0 translate-y-8 transition-all duration-1000 ease-out ${delay} ${className}`}
    >
      {children}
    </div>
  );
}

const features = [
  {
    icon: Scale,
    title: 'Case Intelligence',
    description:
      'Manage legal matters with precision. Set automated reminders, track critical documents, and monitor case pipelines with AI-powered insights.',
  },
  {
    icon: Building2,
    title: 'Exclusive Client Portal',
    description:
      'Provide a premium, branded experience for high-net-worth clients to review milestones and securely sign documents.',
  },
  {
    icon: Clock,
    title: 'Precision Time Tracking',
    description:
      'Capture every billable minute seamlessly. Transform court appearances and legal research into professional invoices instantly.',
  },
  {
    icon: Share2,
    title: 'Enterprise Integrations',
    description:
      'Seamlessly connect Zoom for telehealth/video consults, Stripe and Paystack for billing, DocuSign for signing, and Slack for real-time team synchronization.',
  },
  {
    icon: Briefcase,
    title: 'Firm Administration',
    description:
      'Centralize partner and associate management, from performance metrics to sophisticated payroll and HR controls.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description:
      'Bank-grade encryption, strict role-based access, and SOC2 compliance ensure your firm\'s data remains unconditionally protected.',
  },
];

const testimonials = [
  {
    quote:
      'LexAfrica has improved how our firm works day-to-day. The transition to a unified digital system was smooth, and our clients love the portal.',
    author: 'Adama Mensah',
    role: 'Managing Partner',
    firm: 'Mensah & Partners',
  },
  {
    quote:
      'It aligns perfectly with our standards. It has fundamentally modernized how we track time and manage complex corporate litigation.',
    author: 'Chinedu Okafor',
    role: 'Senior Partner',
    firm: 'Temple Chambers',
  },
  {
    quote:
      'A great tool for legal tech. The seamless integration of billing, communications, and case management provides us with an unparalleled advantage.',
    author: 'Mariama Kamara',
    role: 'Founder',
    firm: 'Kamara Advocacy',
  },
];

const firms = [
  { name: 'ZENITH CHAMBERS', icon: Hexagon },
  { name: 'STERLING ADVOCATES', icon: Diamond },
  { name: 'ADEBAYO & CO.', icon: ShieldCheck },
  { name: 'LUMINA LEGAL', icon: Pyramid },
  { name: 'VANGUARD SOLICITORS', icon: Box },
];

export default function Home() {
  return (
    <div className="overflow-x-hidden bg-background text-foreground selection:bg-primary/30">
      {/* HERO */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-24 pb-20 overflow-hidden">
        {/* Modern SaaS Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/40 blur-[100px] rounded-full" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10 w-full flex flex-col items-center">
          
          {/* Top Copy & CTA */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-background/50 backdrop-blur-sm text-xs font-semibold text-foreground mb-8 shadow-sm"
          >
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            LexAfrica 2.0 is now live
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.05] max-w-5xl mx-auto mb-6">
              The operating system for <br className="hidden md:block" />
              <span className="text-primary">modern law firms</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Manage cases, automate billing, and deliver exceptional client experiences with a single, unified platform designed for top-tier legal teams.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center gap-4 justify-center"
          >
            <Link to="/signup">
              <Button size="lg" className="h-14 px-8 text-base rounded-xl font-semibold shadow-xl shadow-primary/20 hover:scale-105 transition-transform bg-primary text-primary-foreground">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="lg" className="h-14 px-8 text-base rounded-xl font-semibold border-border text-foreground bg-background hover:bg-muted">
                Book a Demo
              </Button>
            </Link>
          </motion.div>

          {/* Wide Dashboard Mockup Below Hero */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            className="mt-20 w-full max-w-6xl mx-auto relative perspective-1000"
          >
            <div className="relative rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-2xl p-2 overflow-hidden ring-1 ring-border/5">
              <div className="absolute top-0 left-0 w-full h-8 bg-muted/30 border-b border-border/50 z-20"></div>
              <img 
                src="/dashboard_mockup.png" 
                alt="LexAfrica Dashboard Mockup" 
                className="w-full h-[250px] md:h-[400px] lg:h-[500px] object-cover object-left-top rounded-xl mt-6 relative z-10 shadow-sm"
              />
            </div>
          </motion.div>
        </div>
      </section>



      {/* SOCIAL PROOF */}
      <section className="py-16 border-y border-border/40 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center mb-8">
              Powering modern legal infrastructure for 5,000+ teams globally
            </p>
          </FadeIn>

          <FadeIn delay="delay-100">
            <div className="flex flex-wrap justify-center items-center gap-x-12 md:gap-x-20 gap-y-10">
              {firms.map((firm, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 text-foreground/60 hover:text-primary transition-colors duration-500 cursor-default select-none group"
                >
                  <firm.icon className="w-7 h-7 md:w-9 md:h-9 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.75} />
                  <span className="text-sm md:text-base font-bold font-sans tracking-widest uppercase mt-0.5">
                    {firm.name}
                  </span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-32 bg-background relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <div className="text-center max-w-3xl mx-auto mb-24">
              <h2 className="text-4xl md:text-5xl font-playfair font-normal text-foreground tracking-tight mb-6">
                Tools built for <span className="text-primary font-medium">legal teams</span>
              </h2>
              <p className="text-lg text-muted-foreground/80 leading-relaxed">
                LexAfrica is meticulously crafted to handle the rigorous demands of enterprise legal work, combining an intuitive interface with powerful features.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {features.map((feature, i) => (
              <FadeIn key={i} delay={`delay-[${i * 100}ms]`}>
                <div className="group relative p-8 border border-border/40 rounded-2xl hover:border-primary/50 transition-colors duration-500 bg-card">
                  <div className="mb-6 relative">
                    <feature.icon className="w-8 h-8 text-primary" strokeWidth={1.5} />
                  </div>
                  <h4 className="text-xl font-playfair font-semibold text-foreground tracking-wide mb-3">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-muted-foreground/80 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ENTERPRISE INTEGRATIONS HUB */}
      <section className="py-24 bg-muted/10 border-t border-border/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.01] to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-3.5 py-1 rounded-full mb-4 inline-block">
                LexAfrica Connectors
              </span>
              <h2 className="text-4xl md:text-5xl font-playfair font-normal text-foreground tracking-tight mt-3 mb-6">
                Unified with the apps <span className="text-primary font-medium">you trust</span>
              </h2>
              <p className="text-lg text-muted-foreground/80 leading-relaxed">
                Connect your business workflows seamlessly. From telemedicine and virtual client meetings to global payment gateways and automated signature cycles.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              {
                name: "Zoom Video",
                purpose: "Consultations & Video Meetings",
                desc: "Launch telehealth, legal counsel, or board meetings with auto-generated secure calendar rooms linked to client records.",
                color: "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:border-blue-500/40",
                icon: Video
              },
              {
                name: "Stripe Billing",
                purpose: "International Credit Card Gateways",
                desc: "Process multi-currency debit & credit card transactions instantly from global enterprise partners and high-net-worth clients.",
                color: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:border-indigo-500/40",
                icon: CreditCard
              },
              {
                name: "Paystack Payments",
                purpose: "Localized Direct Invoicing & Cards",
                desc: "Collect local bank transfers, mobile money, and card payments seamlessly across all emerging African market networks.",
                color: "bg-teal-500/10 border-teal-500/20 text-teal-400 hover:border-teal-500/40",
                icon: ShieldCheck
              },
              {
                name: "DocuSign e-Sign",
                purpose: "Secure Retainers & Agreements",
                desc: "Distribute service covenants, patient waivers, or logistics contracts and capture audit-trailed digital signatures in seconds.",
                color: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:border-yellow-500/40",
                icon: FileSignature
              },
              {
                name: "Slack Channel sync",
                purpose: "Real-time Corporate Alerts",
                desc: "Send instant notifications for case milestones, incoming billing items, leave management updates, and alert triggers.",
                color: "bg-pink-500/10 border-pink-500/20 text-pink-400 hover:border-pink-500/40",
                icon: Slack
              }
            ].map((app, i) => {
              const AppIcon = app.icon;
              return (
                <FadeIn key={i} delay={`delay-[${i * 100}ms]`}>
                  <div className={`h-full border rounded-2xl p-6 transition-all duration-300 hover:scale-[1.03] hover:shadow-md bg-card flex flex-col justify-between ${app.color}`}>
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-background border border-border/60 flex items-center justify-center mb-6 shadow-sm">
                        <AppIcon className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-lg text-foreground tracking-tight">{app.name}</h4>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-1 block">{app.purpose}</p>
                      <p className="text-xs text-muted-foreground/80 mt-4 leading-relaxed">{app.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-32 bg-muted/30 border-y border-border/40 text-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-20">
              <h2 className="text-3xl md:text-5xl font-playfair font-normal tracking-tight">
                Trusted by <span className="text-primary font-medium">leading chambers</span>
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <FadeIn key={idx} delay={`delay-[${idx * 150}ms]`}>
                <div className="flex flex-col justify-between h-full bg-background p-8 rounded-2xl border border-border/50 shadow-sm">
                  <div>
                    <blockquote className="text-lg text-foreground/80 leading-relaxed mb-8 font-playfair italic">
                      "{t.quote}"
                    </blockquote>
                  </div>
                  <div className="flex items-center pt-6 border-t border-border/50">
                    <div>
                      <p className="text-sm font-semibold text-foreground uppercase tracking-wide">
                        {t.author}
                      </p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-32 relative bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <FadeIn>
            <h2 className="text-5xl md:text-6xl font-playfair font-normal text-foreground tracking-tight mb-6">
              Let's talk about <span className="text-primary font-medium">your firm</span>
            </h2>
            <p className="text-xl text-muted-foreground/80 leading-relaxed max-w-2xl mx-auto mb-10">
              Discover how LexAfrica can streamline your day-to-day operations and improve client satisfaction.
            </p>

            <Link to="/contact">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-lg py-7 px-12 rounded-xl shadow-md transition-all hover:scale-[1.02] tracking-wide">
                Contact Sales
              </Button>
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
