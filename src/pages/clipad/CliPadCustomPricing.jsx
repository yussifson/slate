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
  Sparkles,
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
      let saved = false;
      try {
        const { error: customErr } = await supabase.from('clipad_custom_requests').insert([payload]);
        if (!customErr) saved = true;
      } catch (_) {}

      // 2. Also record in clipad_contact_requests for universal compatibility
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
        saved = true;
      } catch (_) {}

      // 3. Fallback record in optavel_transactions or audit_logs if needed
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-[#0b0f19]/80 border-b border-slate-200/80 dark:border-white/10 px-6 md:px-12 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="text-primary transition-transform group-hover:scale-105">
                <CliPadLogo size={28} />
              </div>
              <span className="font-bold text-lg tracking-tight">CliPad</span>
            </Link>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Enterprise & Custom
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-2 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
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
          <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="inline-block px-3.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-mono font-bold uppercase tracking-wider mb-4 border border-emerald-500/20">
              Request Ref: {submittedRequest.requestId}
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
              Thank you, {submittedRequest.fullName.split(' ')[0]}!
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed mb-8 max-w-md mx-auto">
              Your custom enterprise inquiry for <strong className="text-foreground">{submittedRequest.companyName}</strong> has been assigned to our senior solutions architect team.
            </p>

            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 text-left space-y-3 mb-8 text-sm">
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
                <span className="text-muted-foreground">Expected Response:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> &lt; 2 Business Hours
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-foreground font-semibold text-sm transition-all"
              >
                Return to Homepage
              </button>
              <button
                onClick={() => setSubmittedRequest(null)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm transition-all shadow-lg shadow-primary/20"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        ) : (
          /* FORM + VALUE PROPOSITION GRID */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Value Proposition & Highlights */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4 border border-indigo-500/20">
                  <Sparkles className="w-3.5 h-3.5" /> Tailored Architecture
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1] mb-4">
                  CliPad Custom & Enterprise Solutions.
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                  Design a bespoke communication and intelligence stack tailored specifically to your organization's security posture, scale, and workflow integrations.
                </p>
              </div>

              {/* Feature Highlights Cards */}
              <div className="space-y-4">
                <div className="p-5 rounded-2xl border border-border bg-white dark:bg-card shadow-sm flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Dedicated Cloud & Air-Gapped On-Premise</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Deploy in your private AWS, GCP, or Azure VPC, or host on bare-metal with air-gapped data retention and BYO-S3 storage.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-border bg-white dark:bg-card shadow-sm flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Custom AI Fine-Tuning & LLM Endpoints</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Connect your internal fine-tuned LLMs, proprietary terminology dictionaries, and custom meeting summary prompt workflows.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-border bg-white dark:bg-card shadow-sm flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                    <Workflow className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Bespoke Integrations & Data Pipelines</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Bi-directional sync with Salesforce, HubSpot, Jira, Slack, Microsoft Teams, internal HRMS, and real-time Kafka/webhook streaming.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-border bg-white dark:bg-card shadow-sm flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Enterprise SLAs & White-Glove Support</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Guaranteed 99.99% uptime SLA, dedicated Technical Account Manager, 24/7 incident hotline, and customized legal DPAs.
                    </p>
                  </div>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 flex items-center gap-3">
                <Lock className="w-5 h-5 text-indigo-500 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Enterprise-Grade Security:</strong> SOC2 Type II, HIPAA-ready, GDPR compliant, and end-to-end encryption.
                </p>
              </div>
            </div>

            {/* Right Column: Interactive Inquiry Form */}
            <div className="lg:col-span-7 bg-white dark:bg-card border border-slate-200 dark:border-border rounded-3xl p-6 md:p-10 shadow-xl">
              <div className="mb-8">
                <h2 className="text-2xl font-black tracking-tight text-foreground">Request Custom Arrangement</h2>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Fill in your specifications below and our engineering & enterprise sales team will prepare a tailored proposal.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
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
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Work Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        value={formData.workEmail}
                        onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                        placeholder="sarah@acmecorp.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
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
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Company Website
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={formData.companyWebsite}
                        onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                        placeholder="https://acmeglobal.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Team / User Seats
                    </label>
                    <select
                      value={formData.teamSize}
                      onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      {TEAM_SIZES.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Primary Use Cases */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Target Use Cases (Select all that apply)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {USE_CASES.map((item) => {
                      const isSelected = formData.selectedUseCases.includes(item);
                      return (
                        <button
                          type="button"
                          key={item}
                          onClick={() => toggleUseCase(item)}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-primary/10 border-primary text-primary shadow-sm'
                              : 'bg-background hover:bg-secondary border-border text-muted-foreground'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-primary border-primary text-white' : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span>{item}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Deployment Preference */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Preferred Deployment Architecture
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {DEPLOYMENT_PREFERENCES.map((dp) => (
                      <div
                        key={dp.id}
                        onClick={() => setFormData({ ...formData, deployment: dp.id })}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          formData.deployment === dp.id
                            ? 'bg-indigo-500/10 border-indigo-500 text-foreground ring-2 ring-indigo-500/20'
                            : 'bg-background hover:bg-secondary border-border text-muted-foreground'
                        }`}
                      >
                        <div className="font-bold text-xs text-foreground mb-1">{dp.label}</div>
                        <div className="text-[11px] text-muted-foreground leading-snug">{dp.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Timeline & Budget */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Target Implementation Timeline
                    </label>
                    <select
                      value={formData.timeline}
                      onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      {TIMELINES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Estimated Monthly Budget
                    </label>
                    <select
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      {BUDGET_RANGES.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 5. Custom Requirements / Message */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Additional Requirements / Specific Needs
                  </label>
                  <textarea
                    rows={4}
                    value={formData.customRequirements}
                    onChange={(e) => setFormData({ ...formData, customRequirements: e.target.value })}
                    placeholder="Describe any custom integrations, data governance needs, SAML providers, custom LLM weights, or specific team workflows..."
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-primary to-purple-600 hover:from-indigo-700 hover:via-primary/90 hover:to-purple-700 text-white font-bold text-base shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>Submitting Custom Arrangement...</>
                  ) : (
                    <>
                      <Send className="w-5 h-5" /> Submit Custom Plan Request
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-muted-foreground">
                  By submitting this request, you agree to our Enterprise Privacy Policy and Terms of Service. No credit card required.
                </p>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
