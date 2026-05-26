import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
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
    title: 'Case & Pipeline Tracking',
    description:
      'Manage business operations from intake to resolution. Customize stages, set reminders, and track client documents in one central view.',
  },
  {
    icon: Users,
    title: 'Smart Client Portal',
    description:
      'Give clients a secure, branded environment to sign documents, review milestones, and communicate directly with your team.',
  },
  {
    icon: Clock,
    title: 'Integrated Time Tracking',
    description:
      'Bill accurately with live timers for consultations, research, meetings, and project delivery — then convert hours to invoices.',
  },
  {
    icon: Smartphone,
    title: 'WhatsApp & Email Sync',
    description:
      'Communicate with clients via WhatsApp and automatic email logging. Retain a clear audit trail of all correspondence.',
  },
  {
    icon: Briefcase,
    title: 'HR & Payroll Control',
    description:
      'Manage associate leaves, staff performance dashboards, and monthly salary slips under one secure portal.',
  },
  {
    icon: Shield,
    title: 'Bank-Grade Compliance',
    description:
      'Client confidentiality, encrypted storage, automatic daily backups, and robust role-based access permissions.',
  },
];

const testimonials = [
  {
    quote:
      'Airzyle completely transformed our practice. We moved from paper files to a digital pipeline and reduced document turnaround by 60%.',
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

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
export default function Home() {
  return (
    <div className="overflow-x-hidden">
      {/* ============================================================ */}
      {/*  HERO                                                        */}
      {/* ============================================================ */}
      <section className="relative py-16 md:py-20 lg:py-24">
        {/* Soft Aurora Mesh Gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,hsl(var(--primary)/0.12)_0%,transparent_60%),radial-gradient(ellipse_at_80%_20%,hsl(280_65%_60%/0.08)_0%,transparent_50%)] pointer-events-none" />

        {/* Animated grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        {/* Floating shapes */}
        <div className="absolute top-20 left-[8%] w-72 h-72 rounded-full bg-primary/10 blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute bottom-16 right-[6%] w-96 h-96 rounded-full bg-primary/[0.07] blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-8 shadow-[0_0_15px_hsl(var(--primary)/0.2)]">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(var(--primary))]" />
              ✦ Trusted by 500+ Enterprise Teams
            </div>
          </FadeIn>

          {/* Headline */}
          <FadeIn delay="delay-100">
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tighter text-foreground leading-[1.05] max-w-4xl mx-auto mb-6">
              Streamline Your Business{' '}
              <br className="hidden sm:block" />
              Operations with{' '}
              <span className="bg-gradient-to-br from-white to-primary/80 bg-clip-text text-transparent drop-shadow-sm">
                Airzyle
              </span>
            </h1>
          </FadeIn>

          {/* Subtitle */}
          <FadeIn delay="delay-200">
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              Manage cases, automate client communication, log billable hours,
              process payments, and track HR — all from a single, secure platform
              built for growing organizations.
            </p>
          </FadeIn>

          {/* CTA buttons */}
          <FadeIn delay="delay-300">
            <div className="flex flex-col items-center justify-center mb-12">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link to="/signup">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base py-6 px-10 rounded-xl shadow-[0_4px_24px_hsl(var(--primary)/0.4)] group transition-all hover:scale-[1.02]">
                    Start Free Trial
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button
                    variant="outline"
                    className="border-white/10 bg-white/5 hover:bg-white/10 font-semibold text-base py-6 px-10 rounded-xl text-foreground transition-all hover:scale-[1.02]"
                  >
                    Watch Demo →
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-xs font-medium text-muted-foreground/60 tracking-wide">
                No credit card required · Setup in minutes
              </p>
            </div>
          </FadeIn>

          {/* Dashboard mockup */}
          <FadeIn delay="delay-[400ms]">
            <div className="relative max-w-5xl mx-auto glass-card rounded-2xl p-2 md:p-3 shadow-[0_40px_80px_rgba(0,0,0,0.4)] transform [transform:perspective(1200px)_rotateX(4deg)]">
              <div className="rounded-xl overflow-hidden border border-border bg-background">
                {/* Top bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card/80">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-400/70" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
                    <span className="w-3 h-3 rounded-full bg-green-400/70" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="w-64 h-6 rounded-md bg-muted/60 border border-border/40" />
                  </div>
                </div>

                {/* Dashboard body */}
                <div className="flex min-h-[320px] md:min-h-[420px]">
                  {/* Sidebar */}
                  <div className="hidden sm:flex w-48 border-r border-border bg-background/50 flex-col p-4 gap-3">
                    <div className="w-24 h-5 bg-primary/15 rounded-md mb-2" />
                    <div className="w-full h-9 bg-primary/10 border border-primary/20 rounded-lg flex items-center px-3 gap-2">
                      <div className="w-4 h-4 rounded bg-primary/30" />
                      <div className="w-16 h-2.5 bg-primary/30 rounded" />
                    </div>
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="w-full h-9 rounded-lg flex items-center px-3 gap-2">
                        <div className="w-4 h-4 rounded bg-muted-foreground/15" />
                        <div className="w-14 h-2.5 bg-muted-foreground/15 rounded" />
                      </div>
                    ))}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 p-5 md:p-6 space-y-5">
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1.5">
                        <div className="w-36 h-5 bg-foreground/10 rounded" />
                        <div className="w-52 h-3 bg-muted-foreground/15 rounded" />
                      </div>
                      <div className="w-24 h-9 bg-primary text-primary-foreground rounded-lg flex items-center justify-center text-xs font-bold shadow-sm">
                        + New Case
                      </div>
                    </div>

                    {/* Stats cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Active Cases', value: '127', icon: Scale },
                        { label: 'Hours This Week', value: '84.5', icon: Clock },
                        { label: 'Documents', value: '2,451', icon: FileText },
                        { label: 'Alerts', value: '12', icon: Bell },
                      ].map((stat) => (
                        <div key={stat.label} className="border border-border/80 rounded-xl p-4 bg-card/50 space-y-2 hover:bg-card transition-colors cursor-default">
                          <div className="flex items-center gap-1.5">
                            <stat.icon className="w-4 h-4 text-primary" />
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{stat.label}</span>
                          </div>
                          <div className="text-2xl font-black tracking-tight text-foreground">{stat.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Chart placeholder */}
                    <div className="border border-border/80 rounded-xl p-4 bg-card/50 flex items-end gap-2 h-32 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
                      {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 68].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-primary/40 rounded-t-sm hover:bg-primary transition-colors relative z-10"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SOCIAL PROOF STRIP                                          */}
      {/* ============================================================ */}
      <section className="py-20 md:py-28 border-y border-border/50 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 text-center mb-10">
              Trusted by teams at
            </p>
          </FadeIn>

          <FadeIn delay="delay-100">
            <div className="flex flex-wrap justify-center items-center gap-x-14 gap-y-6">
              {firms.map((firm) => (
                <span
                  key={firm}
                  className="text-base font-semibold text-foreground/40 hover:text-foreground/80 transition-opacity duration-300 cursor-default select-none tracking-wide"
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
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-primary mb-3">
                Features
              </p>
              <h2 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tighter mb-4">
                Built for the complexities of modern business
              </h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                Unify case files, client relationships, time tracking, billing,
                and employee metrics in one beautifully designed platform.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FadeIn key={i} delay={`delay-[${i * 80}ms]`}>
                <div className="group border border-border/80 bg-card/80 rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="text-xl font-bold text-foreground tracking-tight mb-3">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  TESTIMONIALS                                                */}
      {/* ============================================================ */}
      <section className="py-24 md:py-32 bg-card/20 border-y border-border/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-primary mb-3">
                Client Success
              </p>
              <h2 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tighter">
                What our customers say
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <FadeIn key={idx} delay={`delay-[${idx * 120}ms]`}>
                <div className="bg-card border border-border/80 rounded-2xl p-8 flex flex-col justify-between hover:border-primary/30 hover:shadow-lg transition-all duration-300 h-full group">
                  {/* Stars */}
                  <div>
                    <div className="flex gap-1 mb-5">
                      {Array.from({ length: t.rating }).map((_, si) => (
                        <Star
                          key={si}
                          className="w-5 h-5 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <blockquote className="text-base text-foreground leading-relaxed mb-8">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-4 pt-6 border-t border-border/60">
                    <div className="w-11 h-11 rounded-full border-2 border-primary/20 bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {t.author
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {t.author}
                      </p>
                      <p className="text-[13px] text-muted-foreground mt-0.5">
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
