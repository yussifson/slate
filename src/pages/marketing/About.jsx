import { Link } from 'react-router-dom';
import { Target, Shield, Users, Globe, Clock, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function About() {
  const values = [
    {
      icon: Target,
      title: "Our Mission",
      description: "To build the most secure, comprehensive practice operating system that empowers African legal practitioners to automate manual tasks and serve clients seamlessly."
    },
    {
      icon: Shield,
      title: "Bank-Grade Confidentiality",
      description: "We hold client secrecy and legal integrity as our ultimate directive. Every transaction, case document, and link is encrypted with advanced protocols."
    },
    {
      icon: Users,
      title: "Inclusivity & Growth",
      description: "We are committed to building local digital infrastructures, serving small chambers and elite firms in Nigeria, Ghana, Sierra Leone, South Africa, and beyond."
    }
  ];

  const stats = [
    { value: "500+", label: "Advocates", icon: Users },
    { value: "12", label: "Countries", icon: Globe },
    { value: "99.9%", label: "Uptime", icon: Clock },
    { value: "24/7", label: "Support", icon: Headphones },
  ];

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-sm font-semibold uppercase tracking-widest text-primary mb-4">
            Our Story
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6 max-w-3xl mx-auto leading-tight">
            Digitizing legal operations across Africa
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Founded by a team of legal practitioners and engineers, LexAfrica is the first dedicated SaaS legal practice manager custom-built for regional advocacy requirements.
          </p>
        </div>
      </section>

      {/* Story Section — Two Column */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Narrative */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground leading-tight">
                Why we built LexAfrica
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Advocacy in the African continent has long relied on legacy software, paper files, or separate applications for emails, calendars, billing, and team communication. This fragmentation leads to lost billable hours, administrative confusion, and security liabilities.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                We created LexAfrica to provide a single, premium, cohesive ecosystem. An OS where an advocate can check case pipelines, message a client, sync court calendars, track consulting hours, and receive card or bank transfer payments in one click.
              </p>
            </div>

            {/* Right — Stats Card */}
            <div className="rounded-2xl border border-border/60 p-10 bg-card shadow-sm hover:shadow-lg transition-shadow duration-300 aspect-video flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-transparent pointer-events-none" />
              <div className="text-center space-y-3 relative z-10">
                <span className="font-black text-6xl bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                  500+
                </span>
                <p className="text-base font-semibold uppercase tracking-wider text-muted-foreground">
                  Active advocates and counsels
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="bg-card border-y border-border py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold uppercase tracking-widest text-primary mb-4">
              Our Principles
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
              The values that drive us
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((v, i) => (
              <div
                key={i}
                className="bg-background border border-border/60 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <v.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-3">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="py-20 md:py-28 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mx-auto mb-3">
                  <stat.icon className="w-5 h-5" />
                </div>
                <p className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
                  {stat.value}
                </p>
                <p className="text-base text-muted-foreground font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Join the future of legal practice
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Sign up today to create a dedicated subdomain workspace for your partners, lawyers, and clients. Explore the trial with no commitment.
          </p>
          <div className="pt-4">
            <Link to="/signup">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 px-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-base">
                Start Free Trial Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
