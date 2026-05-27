import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Info, Server, Shield, Database, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [showOffCloudDialog, setShowOffCloudDialog] = useState(false);

  const plans = [
    {
      name: "Starter",
      description: "Effortless time tracking with unlimited integrations for individuals",
      price: { monthly: 29, yearly: 24 },
      quota: "Up to 3 active users",
      features: [
        "Unlimited time tracking",
        "Unlimited clients & projects",
        "Exportable reports for projects",
        "Timer button in 50+ web apps",
        "Web app, mobile apps, and desktop apps",
        "Smart time links",
        "API access"
      ],
      cta: "Get started for free",
      popular: false,
    },
    {
      name: "Professional",
      description: "Seamless tracking and invoicing for small teams managing projects and budgets",
      price: { monthly: 79, yearly: 64 },
      quota: "Up to 10 active users",
      features: [
        "Everything in Starter +",
        "Billable rates & expenses",
        "Project budgets & alerts",
        "Time rounding",
        "Client invoicing",
        "Personalized My Timesheets",
        "Calendar sync (Google, Outlook)",
        "Task management",
        "Client, project, and team import"
      ],
      cta: "Get started for free",
      popular: true,
    },
    {
      name: "Enterprise",
      description: "Flexible, scalable solution for a large and dynamic organization",
      price: { monthly: 199, yearly: 159 },
      quota: "Unlimited active users",
      features: [
        "Everything in Professional +",
        "Time Off Module",
        "Team Timesheets",
        "App & Site Monitoring",
        "Screenshot capturing",
        "Activity tracking for teams",
        "Real-time notifications",
        "Advanced integrations: Jira, ClickUp",
        "Priority support for faster resolutions",
        "Secure deployment tailored to your needs"
      ],
      cta: "Contact us",
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
      a: "You get full, unrestricted access to Optalflow for 14 days under your selected plan. No credit card is required to sign up. Before the trial ends, we will notify you to add your payment details via Paystack to keep using the workspace."
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
    <div className="overflow-x-hidden bg-slate-50 min-h-screen">
      {/* Pricing Header */}
      <section className="pt-10 pb-12 md:pt-14 md:pb-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
            Choose the Right Plan for Your Team
          </h1>
          <p className="text-xl text-slate-800 font-medium mb-10 flex items-center justify-center gap-2">
            Start with a <span className="bg-green-100 text-green-800 px-3 py-0.5 rounded-md">14-day free trial.</span>
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-4 text-base font-medium text-slate-800">
            <span>Monthly</span>
            
            <button 
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-8 w-14 items-center rounded-full bg-blue-600 transition-colors"
            >
              <span 
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  billingPeriod === 'yearly' ? 'translate-x-7' : 'translate-x-1'
                }`} 
              />
            </button>

            <span className="flex items-center gap-2">
              Annually
              <span className="text-[11px] font-bold bg-cyan-400 text-white px-2 py-0.5 rounded-full">
                Save up to 20%
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* Connected Pricing Cards */}
      <section className="pb-20 md:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex flex-col lg:flex-row bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden lg:overflow-visible">
            {plans.map((p, i) => (
              <div
                key={i}
                className={`relative flex-1 p-8 lg:p-10 ${
                  p.popular
                    ? 'lg:scale-[1.03] lg:-my-4 lg:bg-white lg:rounded-[2rem] lg:border-2 lg:border-blue-500 lg:shadow-xl z-10'
                    : `border-b lg:border-b-0 lg:border-r border-slate-200 last:border-0 ${i === 0 ? 'lg:rounded-l-[2rem]' : ''} ${i === plans.length - 1 ? 'lg:rounded-r-[2rem]' : ''}`
                }`}
              >
                <div className="mb-6 h-[100px]">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-medium text-2xl text-slate-900">{p.name}</h3>
                    {p.popular && (
                      <span className="bg-cyan-400 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                        Most popular
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-[280px]">
                    {p.description}
                  </p>
                </div>

                {/* Price section */}
                <div className="mb-8">
                  <span className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                    ${billingPeriod === 'monthly' ? p.price.monthly : p.price.yearly}
                  </span>
                  <span className="text-slate-500 text-sm font-medium ml-1">/ mo</span>
                </div>

                {/* CTA action */}
                <div className="mb-10">
                  <Link to={`/signup?plan=${p.name.toLowerCase()}&billing=${billingPeriod}`} className="w-full block">
                    <Button 
                      variant={p.popular ? 'default' : 'outline'}
                      className={`w-full py-6 px-6 text-sm font-bold rounded-full transition-all hover:scale-[1.02] ${
                        p.popular 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                          : 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      {p.cta}
                    </Button>
                  </Link>
                </div>

                {/* Features checklist */}
                <ul className="space-y-4">
                  {p.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 font-medium leading-snug">
                      <div className="mt-0.5 shrink-0 rounded-full border border-green-500 flex items-center justify-center p-[2px]">
                        <Check className="w-3 h-3 text-green-500" strokeWidth={3} />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Off-Cloud / Enterprise Horizontal Banner */}
          <div className="mt-8 bg-white border border-slate-200 rounded-3xl p-8 lg:p-10 text-left flex flex-col md:flex-row items-center justify-between hover:shadow-xl transition-all duration-300 gap-8 relative z-0">
            <div className="flex-1">
              <h3 className="font-bold text-2xl text-slate-900 mb-2">Off-Cloud (On-Premise)</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6 max-w-xl">
                For organizations with strict data sovereignty requirements. Deploy Optalflow entirely on your own private servers.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                {[
                  "Self-hosted deployment",
                  "Air-gapped network support",
                  "Custom database integration",
                  "Dedicated solution engineer"
                ].map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-2.5 text-sm text-slate-700 font-medium">
                    <div className="shrink-0 rounded-full border border-green-500 flex items-center justify-center p-[2px]">
                      <Check className="w-3 h-3 text-green-500" strokeWidth={3} />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full md:w-72 shrink-0 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-10">
              <span className="text-3xl font-black text-slate-900 mb-6">Custom</span>
              <Button 
                onClick={() => setShowOffCloudDialog(true)}
                variant="outline"
                className="w-full py-6 rounded-full font-bold text-sm border-2 border-slate-900 text-slate-900 hover:bg-slate-50"
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Off-Cloud Dialog Modal */}
          <Dialog open={showOffCloudDialog} onOpenChange={setShowOffCloudDialog}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white border-0 rounded-[2rem] shadow-2xl flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="bg-slate-50 px-8 py-5 border-b border-slate-100 relative shrink-0">
                <div className="mx-auto w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-3 border border-blue-100 shadow-sm">
                  <Server className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-center">
                  <DialogTitle className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">Off-Cloud Enterprise</DialogTitle>
                  <DialogDescription className="text-slate-500 text-xs max-w-sm mx-auto leading-relaxed font-medium">
                    Deploy Optalflow securely on your own private infrastructure.
                  </DialogDescription>
                </div>
              </div>
              
              {/* Scrollable Content */}
              <div className="px-8 py-8 overflow-y-auto bg-white flex-1 custom-scrollbar">
                <div className="space-y-8">
                  <div>
                    <h4 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-xs border-b border-slate-100 pb-2">Deployment & Architecture</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                          <Server className="w-5 h-5 text-slate-700" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Self-Hosted / On-Premise</p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">Deploy the platform directly to your internal bare-metal servers or private AWS, Azure, and Google Cloud networks.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                          <Shield className="w-5 h-5 text-slate-700" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Air-Gapped Operation</p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">Optalflow can operate fully offline without external API dependencies, ensuring total data isolation for sensitive sectors.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-xs border-b border-slate-100 pb-2">Security & Integration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                          <Database className="w-5 h-5 text-slate-700" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Custom DB Integration</p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">Map Optalflow to your existing legacy databases. We support PostgreSQL, SQL Server, and custom on-prem storage pipelines.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                          <Check className="w-5 h-5 text-slate-700" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">SLA & Compliance</p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">Guaranteed 99.99% uptime SLA. Built to comply with GDPR, HIPAA, SOC2, and government data sovereignty laws.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-xs border-b border-slate-100 pb-2">Premium Support</h4>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                          <Headphones className="w-5 h-5 text-slate-700" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Dedicated Solution Engineer</p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">Your firm will be assigned a dedicated engineer to handle deployment, white-labeling, maintenance, and custom feature development. Direct phone line and prioritized ticketing included.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer CTA */}
              <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 sm:justify-between items-center flex-col sm:flex-row gap-4 shrink-0">
                <Button type="button" variant="ghost" onClick={() => setShowOffCloudDialog(false)} className="w-full sm:w-auto font-bold text-slate-600 hover:text-slate-900">
                  Close
                </Button>
                <Link to="/enterprise-contact" onClick={() => setShowOffCloudDialog(false)} className="w-full sm:w-auto block">
                  <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-8 rounded-full shadow-lg shadow-blue-600/20 transition-all hover:scale-105">
                    Build Custom Quote
                  </Button>
                </Link>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="mt-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 flex items-center justify-center gap-3">
                Full Plan <span className="bg-green-100 text-green-900 px-4 py-1 rounded-full">Comparison</span>
              </h2>
            </div>
            
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="py-5 px-6 font-bold text-slate-900 w-1/4">Features</th>
                    <th className="py-5 px-6 font-bold text-slate-900 w-1/4 text-center">Starter</th>
                    <th className="py-5 px-6 font-bold text-slate-900 w-1/4 text-center">Professional</th>
                    <th className="py-5 px-6 font-bold text-slate-900 w-1/4 text-center">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Category 1 */}
                  <tr>
                    <td colSpan="4" className="bg-slate-50 py-3 px-6 text-sm font-bold text-slate-500 uppercase tracking-wider">
                      Time Tracking
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-slate-700">Unlimited time tracking</td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-slate-700">Timer button in 50+ web apps</td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-slate-700">Time rounding</td>
                    <td className="py-4 px-6 text-center text-slate-300 font-bold">—</td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>

                  {/* Category 2 */}
                  <tr>
                    <td colSpan="4" className="bg-slate-50 py-3 px-6 text-sm font-bold text-slate-500 uppercase tracking-wider">
                      Project Management
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-slate-700">Unlimited clients & projects</td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-slate-700">Task management</td>
                    <td className="py-4 px-6 text-center text-slate-300 font-bold">—</td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-slate-700">Project budgets & alerts</td>
                    <td className="py-4 px-6 text-center text-slate-300 font-bold">—</td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>

                  {/* Category 3 */}
                  <tr>
                    <td colSpan="4" className="bg-slate-50 py-3 px-6 text-sm font-bold text-slate-500 uppercase tracking-wider">
                      Team & Security
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-slate-700">API Access</td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-slate-700">Time Off Module</td>
                    <td className="py-4 px-6 text-center text-slate-300 font-bold">—</td>
                    <td className="py-4 px-6 text-center text-slate-300 font-bold">—</td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-slate-700">Screenshot capturing</td>
                    <td className="py-4 px-6 text-center text-slate-300 font-bold">—</td>
                    <td className="py-4 px-6 text-center text-slate-300 font-bold">—</td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white border-t border-slate-200 py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {faqs.map((faq, index) => (
              <div key={index} className="space-y-3">
                <h4 className="font-bold text-slate-900 flex items-start gap-3 text-base leading-snug">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium pl-8">
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
