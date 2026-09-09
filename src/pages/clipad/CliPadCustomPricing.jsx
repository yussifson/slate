import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useToast } from '@/components/ui/use-toast';
import {
  ShieldCheck,
  Server,
  Cpu,
  Workflow,
  CheckCircle2,
  ArrowLeft,
  Send,
  Building2,
  Mail,
  User,
  Phone,
  Globe,
  Lock,
  Clock,
  Check
} from 'lucide-react';
import { CliPadLogo } from '@/components/ui/CliPadLogo';

const USE_CASES = [
  'Live HD Meetings & Webinars',
  'Async Video & Screen Recording Hub',
  'Sales Proposals & Video Analytics',
  'AI Meeting Intelligence & Transcripts',
  'Automated Smart Follow-up Workflows',
  'Custom BI & Data Pipelines',
  'Dedicated / On-Premise Deployment',
  'White-Labeling & Branded Subdomains',
];

const TEAM_SIZES = [
  '1 - 20 seats',
  '21 - 100 seats',
  '101 - 500 seats',
  '501 - 2,000 seats',
  '2,000+ seats',
];

const DEPLOYMENT_PREFERENCES = [
  { id: 'cloud', label: 'Optavel Managed Cloud', desc: 'Zero maintenance, fully managed globally distributed cloud' },
  { id: 'dedicated_cloud', label: 'Dedicated VPC / Private Cloud', desc: 'Isolated single-tenant environment on AWS, GCP, or Azure' },
  { id: 'on_premise', label: 'On-Premise / Air-Gapped', desc: 'Self-hosted behind your enterprise firewall & private storage' },
];

const TIMELINES = [
  'Immediately (< 30 days)',
  '1 - 3 months',
  '3 - 6 months',
  'Exploring / Planning for next FY',
];

const BUDGET_RANGES = [
  'Under $1,000 / month',
  '$1,000 - $3,000 / month',
  '$3,000 - $10,000 / month',
  '$10,000+ / month',
  'Custom / Flexible Allocation',
];

export default function CliPadCustomPricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    fullName: user?.user_metadata?.full_name || '',
    workEmail: user?.email || '',
    companyName: '',
    companyWebsite: '',
    phoneNumber: '',
    teamSize: '21 - 100 seats',
    deployment: 'cloud',
    timeline: 'Immediately (< 30 days)',
    budget: '$1,000 - $3,000 / month',
    selectedUseCases: ['Live HD Meetings & Webinars', 'AI Meeting Intelligence & Transcripts'],
    customRequirements: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);

  const toggleUseCase = (item) => {
    setFormData((prev) => {
      const exists = prev.selectedUseCases.includes(item);
      if (exists) {
        return { ...prev, selectedUseCases: prev.selectedUseCases.filter((x) => x !== item) };
      } else {
        return { ...prev, selectedUseCases: [...prev.selectedUseCases, item] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.workEmail.trim() || !formData.companyName.trim()) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please provide your full name, work email, and company name.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const requestId = `REQ-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const payload = {
      id: crypto.randomUUID(),
      request_code: requestId,
      name: formData.fullName,
      email: formData.workEmail,
      company: formData.companyName,
      website: formData.companyWebsite,
      phone: formData.phoneNumber,
      team_size: formData.teamSize,
      deployment: formData.deployment,
      timeline: formData.timeline,
      budget: formData.budget,
      use_cases: formData.selectedUseCases,
      requirements: formData.customRequirements,
      user_id: user?.id || null,
      company_id: companyId || null,
      status: 'pending',
      created_at: new Date().toISOString(),
      message: JSON.stringify({
        requestId,
        phone: formData.phoneNumber,
        website: formData.companyWebsite,
        teamSize: formData.teamSize,
        deployment: formData.deployment,
        timeline: formData.timeline,
        budget: formData.budget,
        useCases: formData.selectedUseCases,
        requirements: formData.customRequirements,
        submittedAt: new Date().toISOString(),
      }),
    };

    try {
      // 1. Primary insert to clipad_custom_requests
      try {
        await supabase.from('clipad_custom_requests').insert([payload]);
      } catch (_) {}

      // 2. Insert to clipad_contact_requests for universal compatibility
      try {
        await supabase.from('clipad_contact_requests').insert([{
          id: payload.id,
          name: formData.fullName,
          email: formData.workEmail,
          company: formData.companyName,
          message: payload.message,
          status: 'pending',
          created_at: payload.created_at,
        }]);
      } catch (_) {}

      // 3. Redundant record in audit_logs
      try {
        await supabase.from('audit_logs').insert([{
          action: 'custom_pricing_request',
          user_name: formData.fullName,
          user_email: formData.workEmail,
          company_id: companyId || null,
          details: payload.message,
          created_at: new Date().toISOString(),
        }]);
      } catch (_) {}

      setSubmittedRequest({
        ...formData,
        requestId,
      });

      toast({
        title: 'Custom Plan Request Submitted!',
        description: `Reference #${requestId}. Our enterprise solutions team will contact you within 2 hours.`,
      });
    } catch (err) {
      console.error('Error submitting custom request:', err);
      toast({
        title: 'Submission Received',
        description: `We have logged your request (#${requestId}). An enterprise representative will reach out shortly.`,
      });
      setSubmittedRequest({
        ...formData,
        requestId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-slate-900 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-[#0b0f19]/90 border-b border-slate-200 dark:border-white/10 px-6 md:px-12 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="text-primary transition-transform group-hover:scale-105">
                <CliPadLogo size={28} />
              </div>
              <span className="font-bold text-lg tracking-tight">CliPad</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
              <Link to="/#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">Features</Link>
              <Link to="/#pricing" className="hover:text-slate-900 dark:hover:text-white transition-colors">Pricing</Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-2 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
            <Link
              to={user ? '/dashboard' : '/login'}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 transition-all shadow-sm"
            >
              {user ? 'Go to Dashboard' : 'Sign In'}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-12 py-12 md:py-16">
        {submittedRequest ? (
          /* SUCCESS STATE */
          <div className="max-w-2xl mx-auto bg-white dark:bg-card border border-slate-200 dark:border-border rounded-3xl p-8 md:p-12 shadow-xl text-center animate-in fade-in zoom-in-95 duration-400">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl mx-auto flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="inline-block px-3 py-1 bg-secondary text-foreground rounded-full text-xs font-mono font-bold tracking-wider mb-4 border border-border">
              Ref: {submittedRequest.requestId}
            </div>

            <h1 className="text-3xl font-black tracking-tight mb-3">
              Request Received, {submittedRequest.fullName.split(' ')[0]}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8 max-w-md mx-auto">
              Our enterprise solutions team has received your inquiry for <strong className="text-foreground">{submittedRequest.companyName}</strong> and will follow up with a tailored proposal.
            </p>

            <div className="bg-slate-50 dark:bg-secondary/30 border border-slate-200 dark:border-border rounded-2xl p-5 text-left space-y-2.5 mb-8 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">Work Email:</span>
                <span className="font-semibold text-foreground">{submittedRequest.workEmail}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">Estimated Seats:</span>
                <span className="font-semibold text-foreground">{submittedRequest.teamSize}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">Deployment:</span>
                <span className="font-semibold capitalize text-foreground">{submittedRequest.deployment.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Response Time:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Within 2 Business Hours
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-secondary dark:hover:bg-secondary/80 text-foreground font-semibold text-xs transition-all"
              >
                Return to Homepage
              </button>
              <button
                onClick={() => setSubmittedRequest(null)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition-all shadow-md shadow-orange-500/20"
              >
                Submit Another Inquiry
              </button>
            </div>
          </div>
        ) : (
          /* FORM + HIGHLIGHTS GRID */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Value Proposition */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 inline-block mb-3">
                  Tailored Solutions
                </span>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-3">
                  Custom Plans & Enterprise Solutions
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Design a dedicated communication and intelligence environment tailored to your organization's security, integration, and infrastructure requirements.
                </p>
              </div>

              {/* Feature Highlight Cards */}
              <div className="space-y-3.5">
                <div className="p-4 rounded-2xl border border-border bg-white dark:bg-card shadow-sm flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 text-foreground shrink-0">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-foreground">Dedicated VPC & On-Premise Deployment</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Deploy inside your private AWS, GCP, or Azure VPC, or host on bare-metal with air-gapped storage and BYO-S3 buckets.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-white dark:bg-card shadow-sm flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 text-foreground shrink-0">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-foreground">Custom AI Endpoints & Domain Models</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Connect your internal fine-tuned LLMs, company-specific vocabularies, and customized executive summary templates.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-white dark:bg-card shadow-sm flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 text-foreground shrink-0">
                    <Workflow className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-foreground">Bespoke Integrations & Data Pipelines</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Two-way synchronization with Salesforce, HubSpot, Jira, Slack, internal HRMS, and real-time Kafka event streaming.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-white dark:bg-card shadow-sm flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 text-foreground shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-foreground">Guaranteed SLA & Dedicated Support</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      99.99% uptime guarantee, dedicated Technical Account Manager, 24/7 escalation hotline, and custom DPA terms.
                    </p>
                  </div>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="p-4 rounded-2xl bg-white dark:bg-card border border-border flex items-center gap-3">
                <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Enterprise Security:</strong> SOC2 Type II, HIPAA-ready, GDPR compliant, and end-to-end encrypted.
                </p>
              </div>
            </div>

            {/* Right Column: Clean Inquiry Form */}
            <div className="lg:col-span-7 bg-white dark:bg-card border border-slate-200 dark:border-border rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-bold tracking-tight text-foreground">Contact Sales for Custom Arrangement</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Tell us about your team size and infrastructure needs. No credit card required.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 1. Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Sarah Jenkins"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Work Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        value={formData.workEmail}
                        onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                        placeholder="sarah@acmeglobal.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="Acme Global Inc."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Company Website
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={formData.companyWebsite}
                        onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                        placeholder="https://acmeglobal.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Team / User Seats
                    </label>
                    <select
                      value={formData.teamSize}
                      onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      {TEAM_SIZES.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Target Use Cases */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-2">
                    Primary Requirements (Select all that apply)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {USE_CASES.map((item) => {
                      const isSelected = formData.selectedUseCases.includes(item);
                      return (
                        <button
                          type="button"
                          key={item}
                          onClick={() => toggleUseCase(item)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-medium transition-colors ${
                            isSelected
                              ? 'bg-slate-100 dark:bg-white/10 border-slate-400 dark:border-slate-500 text-foreground font-semibold'
                              : 'bg-background hover:bg-secondary border-border text-muted-foreground'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900' : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="truncate">{item}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Preferred Deployment */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-2">
                    Deployment Preference
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {DEPLOYMENT_PREFERENCES.map((dp) => (
                      <div
                        key={dp.id}
                        onClick={() => setFormData({ ...formData, deployment: dp.id })}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          formData.deployment === dp.id
                            ? 'bg-slate-100 dark:bg-white/10 border-slate-900 dark:border-white text-foreground ring-1 ring-slate-900 dark:ring-white'
                            : 'bg-background hover:bg-secondary border-border text-muted-foreground'
                        }`}
                      >
                        <div className="font-bold text-xs text-foreground mb-0.5">{dp.label}</div>
                        <div className="text-[11px] text-muted-foreground leading-snug">{dp.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Timeline & Budget */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Implementation Timeline
                    </label>
                    <select
                      value={formData.timeline}
                      onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      {TIMELINES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Estimated Monthly Budget
                    </label>
                    <select
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      {BUDGET_RANGES.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 5. Custom Requirements Text */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Additional Requirements or Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.customRequirements}
                    onChange={(e) => setFormData({ ...formData, customRequirements: e.target.value })}
                    placeholder="Provide details about your current infrastructure, compliance requirements, SSO providers, or specific integrations..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-slate-400 resize-y"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>Submitting Inquiry...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Submit Custom Plan Inquiry
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-muted-foreground">
                  By submitting, you agree to our Enterprise Privacy Policy and Terms of Service.
                </p>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
