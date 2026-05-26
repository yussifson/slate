import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  const plans = [
    {
      name: "Starter",
      description: "Ideal for solo advocates and boutique law chambers starting out.",
      price: { monthly: 29, yearly: 24 },
      quota: "Up to 3 active users",
      features: [
        "Up to 10 active Cases",
        "Up to 50 active Clients",
        "Matter & Pipeline Tracking",
        "Document storage (5 GB)",
        "Email & Invoicing support",
        "Paystack checkout portal",
        "Standard email support"
      ],
      cta: "Start Free Trial",
      popular: false,
    },
    {
      name: "Professional",
      description: "Perfect for growing mid-sized law firms and partnerships.",
      price: { monthly: 79, yearly: 64 },
      quota: "Up to 10 active users",
      features: [
        "Unlimited active Cases",
        "Unlimited active Clients",
        "Interactive Client Portals",
        "Document storage (25 GB)",
        "WhatsApp & Email Syncing",
        "Staff Payroll & Leave tools",
        "Conflict Checker module",
        "Priority 24/7 support"
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      description: "Custom capabilities for multi-office corporate law firms.",
      price: { monthly: 199, yearly: 159 },
      quota: "Unlimited active users",
      features: [
        "Unlimited Cases & Clients",
        "Everything in Professional",
        "Dedicated Database server",
        "Document storage (250 GB)",
        "Custom branding & Favicon",
        "Legal research assistant API",
        "Data Export (JSON, Excel)",
        "Dedicated Account Executive"
      ],
      cta: "Contact Sales",
      popular: false,
    }
  ];

  const faqs = [
    {
      q: "Can I upgrade or downgrade my plan later?",
      a: "Yes! You can instantly modify your subscription inside the Settings panel at any time. When upgrading, Paystack will charge a prorated amount. When downgrading, your credits will be automatically applied to future cycles."
    },
    {
      q: "How does the 14-day free trial work?",
      a: "You get full, unrestricted access to Airzyle for 14 days under your selected plan. No credit card is required to sign up. Before the trial ends, we will notify you to add your payment details via Paystack to keep using the workspace."
    },
    {
      q: "Is client data stored securely?",
      a: "Absolutely. All databases are securely hosted in virtual networks with bank-grade encryption at rest and in transit. Document uploads are stored in private cloud buckets with authorized-only pre-signed retrieval urls."
    },
    {
      q: "What payment options does Paystack support?",
      a: "Paystack processes card payments (Visa, Mastercard, Verve), direct mobile bank transfers, USSD bank codes, and popular mobile money wallets (MTN, Telecel, AirtelTigo) depending on your firm's country."
    }
  ];

  return (
    <div className="overflow-x-hidden">
      {/* Pricing Header */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">
            Simple Pricing
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-5">
            Plans built for every size of firm
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            Select a transparent plan to optimize your legal work. Save up to 20% by subscribing to a yearly billing cycle.
          </p>

          {/* Billing period toggle */}
          <div className="inline-flex items-center gap-1 bg-card p-1.5 rounded-full border border-border shadow-sm">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`text-sm font-semibold py-2.5 px-6 rounded-full transition-all duration-200 ${
                billingPeriod === 'monthly'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`text-sm font-semibold py-2.5 px-6 rounded-full transition-all duration-200 flex items-center gap-2 ${
                billingPeriod === 'yearly'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <span className="text-xs font-bold bg-amber-500 text-white py-0.5 px-2 rounded-full leading-none">
                -20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="pb-24 md:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((p, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-8 flex flex-col justify-between border transition-all duration-300 hover:shadow-lg ${
                p.popular
                  ? 'ring-2 ring-primary border-primary bg-card shadow-md'
                  : 'border-border/60 bg-card hover:border-border'
              }`}
            >
              {/* Popular badge */}
              {p.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold tracking-wide uppercase py-1.5 px-5 rounded-full shadow-md">
                  Most Popular
                </div>
              )}

              <div>
                <div className="mb-6">
                  <h3 className="font-extrabold text-xl text-foreground mb-1.5">{p.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                </div>

                {/* Price section */}
                <div className="mb-8">
                  <span className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
                    ${billingPeriod === 'monthly' ? p.price.monthly : p.price.yearly}
                  </span>
                  <span className="text-muted-foreground text-base font-medium ml-1">/ month</span>
                  <div className="text-sm text-muted-foreground mt-1 font-medium">
                    Billed {billingPeriod === 'monthly' ? 'monthly' : 'annually'}
                  </div>
                </div>

                <hr className="border-border/60 mb-8" />

                {/* Quota limit info */}
                <div className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
                  {p.quota}
                </div>

                {/* Features checklist */}
                <ul className="space-y-3.5 mb-8">
                  {p.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-foreground/80">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA action */}
              <div>
                {p.name === 'Enterprise' ? (
                  <Link to="/contact" className="w-full block">
                    <Button variant="outline" className="w-full py-3 px-6 text-sm font-semibold border-border hover:bg-muted/40 rounded-xl text-foreground">
                      {p.cta}
                    </Button>
                  </Link>
                ) : (
                  <Link to={`/signup?plan=${p.name.toLowerCase()}&billing=${billingPeriod}`} className="w-full block">
                    <Button className={`w-full py-3 px-6 text-sm font-semibold rounded-xl ${
                      p.popular
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm'
                        : 'bg-foreground hover:bg-foreground/90 text-background'
                    }`}>
                      {p.cta}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-card border-t border-border py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">
              Common Questions
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {faqs.map((faq, index) => (
              <div key={index} className="space-y-3">
                <h4 className="font-semibold text-foreground flex items-start gap-3 text-base leading-snug">
                  <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed pl-8">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
