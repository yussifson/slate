import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Scale, CheckCircle, Loader2, Phone, Mail, User, Building2, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { useQuery } from "@tanstack/react-query";

const CASE_TYPES = [
  { value: "civil", label: "Civil Litigation" },
  { value: "criminal", label: "Criminal Defense" },
  { value: "corporate", label: "Corporate / Business Law" },
  { value: "family", label: "Family Law" },
  { value: "property", label: "Property / Real Estate" },
  { value: "labor", label: "Labor & Employment" },
  { value: "tax", label: "Tax Law" },
  { value: "other", label: "Other / Not Sure" },
];

const URGENCY_CONFIG = {
  low: { label: "Not Urgent", color: "bg-slate-100 text-slate-600" },
  medium: { label: "Within 1–2 Weeks", color: "bg-blue-100 text-blue-700" },
  high: { label: "Within a Few Days", color: "bg-amber-100 text-amber-700" },
  urgent: { label: "Extremely Urgent", color: "bg-red-100 text-red-700" },
};

export default function IntakeForm() {
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", organization: "",
    case_type: "", case_description: "", urgency: "medium", preferred_contact: "email",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  // Derive company_id from URL param if embedded (?firm=xxx)
  const urlParams = new URLSearchParams(window.location.search);
  const companyId = urlParams.get("firm") || "";

  const { data: company } = useQuery({
    queryKey: ["company-intake", companyId],
    queryFn: () => base44.entities.Company.findUnique({ filter: { id: companyId } }),
    enabled: !!companyId,
  });

  const firmName = company?.name || "Law Firm";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Create lead
    const lead = await base44.entities.Lead.create({
      ...form,
      company_id: companyId,
      source: "web_form",
      status: "new",
    });

    // Send confirmation to prospective client
    await base44.integrations.Core.SendEmail({
      to: form.email,
      from_name: `${firmName} Legal Intake`,
      subject: `We received your inquiry — ${firmName}`,
      body: `Dear ${form.full_name},

Thank you for reaching out. We have received your legal inquiry and a member of our team will be in touch shortly.

Your Reference: ${lead.id?.slice(-8).toUpperCase()}
Matter Type: ${CASE_TYPES.find(t => t.value === form.case_type)?.label || form.case_type}
Urgency: ${URGENCY_CONFIG[form.urgency]?.label || form.urgency}

We aim to respond within 24 business hours. If this is an emergency, please call us directly.

Best regards,
${firmName} Intake Team`,
    });

    // Notify internal intake team
    await base44.integrations.Core.SendEmail({
      to: company?.admin_email || company?.email || "intake@example.com",
      from_name: `${firmName} System`,
      subject: `[NEW LEAD] ${form.full_name} — ${form.case_type}`,
      body: `A new intake form has been submitted.

Name: ${form.full_name}
Email: ${form.email}
Phone: ${form.phone || "N/A"}
Organization: ${form.organization || "Individual"}
Case Type: ${CASE_TYPES.find(t => t.value === form.case_type)?.label || form.case_type}
Urgency: ${URGENCY_CONFIG[form.urgency]?.label || form.urgency}
Preferred Contact: ${form.preferred_contact}

Case Description:
${form.case_description}

View in App: ${window.location.origin}/leads`,
    });

    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Inquiry Received!</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Thank you, <strong>{form.full_name}</strong>. We've received your inquiry and sent a confirmation to <strong>{form.email}</strong>.
          </p>
          <p className="text-sm text-muted-foreground">
            A member of our team will contact you shortly via your preferred method.
          </p>
          <Badge className="mt-4 bg-blue-100 text-blue-700">Response expected within 24 business hours</Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            {company?.logo_url || company?.logo_light_url ? (
              <img src={company.logo_url || company.logo_light_url} alt="Logo" className="h-10 max-w-[200px] object-contain rounded" />
            ) : (
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Scale className="w-5 h-5 text-white" />
              </div>
            )}
            <span className="text-xl font-bold text-foreground">{firmName}</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Start Your Legal Journey</h1>
          <p className="text-sm text-muted-foreground mt-1">Fill out the form below and our team will be in touch within 24 hours.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-border p-6 space-y-5">
          {/* Personal Info */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Your Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Full Name <span className="text-red-500">*</span></Label>
                <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="John Mensah" required />
              </div>
              <div className="space-y-1.5">
                <Label>Email Address <span className="text-red-500">*</span></Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" required />
              </div>
              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+233 20 000 0000" />
              </div>
              <div className="space-y-1.5">
                <Label>Organization (if applicable)</Label>
                <Input value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} placeholder="Company name or leave blank" />
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* Case Info */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Case Details
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Type of Legal Matter <span className="text-red-500">*</span></Label>
                  <Select value={form.case_type} onValueChange={v => setForm({ ...form, case_type: v })} required>
                    <SelectTrigger><SelectValue placeholder="Select matter type..." /></SelectTrigger>
                    <SelectContent>
                      {CASE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Urgency</Label>
                  <Select value={form.urgency} onValueChange={v => setForm({ ...form, urgency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(URGENCY_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Describe Your Situation <span className="text-red-500">*</span></Label>
                <textarea
                  value={form.case_description}
                  onChange={e => setForm({ ...form, case_description: e.target.value })}
                  placeholder="Please describe your legal matter in as much detail as possible..."
                  required
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* Contact preference */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" /> Preferred Contact Method
            </h3>
            <div className="flex gap-2 flex-wrap">
              {[["email", "Email", Mail], ["phone", "Phone Call", Phone], ["whatsapp", "WhatsApp", Phone]].map(([val, label, IconComp]) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setForm({ ...form, preferred_contact: val })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${form.preferred_contact === val ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                >
                  <IconComp className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <Button type="submit" disabled={submitting} className="w-full h-11 text-base font-semibold gap-2">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Scale className="w-5 h-5" />}
            {submitting ? "Submitting..." : "Submit Inquiry"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By submitting this form you agree to our privacy policy. Your information is confidential and protected.
          </p>
        </form>
      </div>
    </div>
  );
}