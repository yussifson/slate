import { Link } from 'react-router-dom';
import { Scale, Users, CreditCard, Mail, Database, Clock, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Features() {
  const deepDives = [
    {
      badge: "Matter Management",
      title: "Automate your case life cycle completely",
      description:
        "Manage client disputes, filings, hearings, and outcome tracking. Move cases through drag-and-drop pipelines to visualize stages effortlessly. Get smart alerts when court dates approach.",
      bullets: [
        "Interactive case pipelines and customizable milestones",
        "Hearing logging with automated court calendar notifications",
        "Detailed conflict checking to safeguard legal integrity",
        "Case outcome dashboards to analyze win/loss metrics",
      ],
      icon: Scale,
      align: "left",
    },
    {
      badge: "Secure Client Environment",
      title: "Deliver premium experiences with Client Portals",
      description:
        "Allow clients to check their case's progress, view active tasks, upload requested legal materials, and digitally sign retainers or signatures. Fully customized under your own brand color and logo.",
      bullets: [
        "Self-service onboarding intake questionnaires",
        "Direct chat window with the lead advocacy team",
        "Retainer agreements and signature signing prompts",
        "Transparent billable charts and payment histories",
      ],
      icon: Users,
      align: "right",
    },
    {
      badge: "Time & Billing",
      title: "Accept payments locally with Paystack",
      description:
        "Record billable hours with accurate active timers. Automatically construct invoices based on time entries, flat fees, or advance retainer drawdowns. Process client card payments locally using Paystack integrations.",
      bullets: [
        "Desktop active timers tracking research and consults",
        "Dynamic invoice templates matching your corporate letterhead",
        "Local payments processed via Paystack (card, bank transfer, USSD)",
        "Financial reporting tracking firm revenue and outstanding fees",
      ],
      icon: CreditCard,
      align: "left",
    },
  ];

  const additionalFeatures = [
    {
      icon: Mail,
      title: "Integrated Email Client",
      description:
        "Connect your workspace directly with Office 365 or Gmail. Read, flag, and reply to client emails right inside the case files.",
    },
    {
      icon: Database,
      title: "Compliance Audit Logs",
      description:
        "Maintain high-integrity logs tracking user logins, file modifications, client downloads, and sensitive database exports automatically.",
    },
    {
      icon: Clock,
      title: "Leave & Payroll Tools",
      description:
        "Manage associate leave requests, store payroll structures, generate salary slips, and run performance analytics indicators.",
    },
  ];

  return (
    <div className="overflow-x-hidden">
      {/* ── Hero Header ── */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-background to-background pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/[0.06] rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
            Core Features
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6 max-w-3xl mx-auto leading-[1.15]">
            Everything your legal team needs
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Unlock a comprehensive system built specifically for modern practice
            requirements. Minimize admin operations and focus entirely on
            protecting your clients.
          </p>
        </div>
      </section>

      {/* ── Feature Deep Dives ── */}
      <section className="py-20 md:py-28">
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
                  <span className="inline-flex px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                    {feature.badge}
                  </span>

                  <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight leading-tight">
                    {feature.title}
                  </h2>

                  <p className="text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>

                  <ul className="space-y-3 pt-2">
                    {feature.bullets.map((bullet, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-base text-foreground/85"
                      >
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-0.5 shrink-0">
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        </div>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Stylized UI Mockup */}
                <div className="flex-1 w-full">
                  <div className="aspect-[4/3] rounded-2xl border border-border/60 bg-card p-5 shadow-sm hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-primary/[0.08] pointer-events-none" />

                    <div className="relative w-full h-full bg-background rounded-xl border border-border/80 shadow-sm p-6 flex flex-col gap-4">
                      {/* Mockup header */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="w-24 h-3 bg-muted rounded-sm" />
                          <div className="w-14 h-2 bg-muted/60 rounded-sm" />
                        </div>
                      </div>

                      <hr className="border-border/50" />

                      {/* Mockup content rows */}
                      <div className="flex-1 space-y-3">
                        <div className="w-full h-3.5 bg-muted/30 rounded border border-border/20" />
                        <div className="w-11/12 h-3.5 bg-muted/30 rounded border border-border/20" />
                        <div className="w-4/5 h-3.5 bg-muted/30 rounded border border-border/20" />
                        <div className="w-9/12 h-3.5 bg-muted/30 rounded border border-border/20" />
                      </div>

                      {/* Mockup footer bar */}
                      <div className="flex items-center gap-2 pt-2">
                        <div className="w-16 h-6 bg-primary/15 rounded" />
                        <div className="w-16 h-6 bg-muted/40 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Additional Capabilities Grid ── */}
      <section className="py-20 md:py-28 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
              Even More Capabilities
            </span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              An operating system packed with integrations
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {additionalFeatures.map((feat, index) => {
              const FeatIcon = feat.icon;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-border/60 bg-background p-7 space-y-4 shadow-sm hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <FeatIcon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground">
                    {feat.title}
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-5">
            Supercharge your legal office today
          </h2>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed mb-8">
            Sign up now for a 14-day free trial on your own customized
            subdomain. Set up takes less than 2 minutes.
          </p>
          <Link to="/signup">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 px-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-base">
              Start Free Trial
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
