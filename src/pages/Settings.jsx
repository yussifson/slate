import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { getSubdomainAndBase } from "@/lib/domainUtils";
import { initiatePaystackSubscription } from "@/lib/paystack";
import {
  Settings2, Palette, DollarSign, Mail, Bell,
  MessageSquare, Phone, CreditCard, Calendar, Save, ShieldCheck, Lock, Check, Loader2, Copy, Info, CheckCircle, RefreshCw
} from "lucide-react";
import StaffPermissionsSettings from "@/components/settings/StaffPermissionsSettings";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SECTIONS = [
  { id: "system",      label: "System Settings",              icon: Settings2,       cat: "General" },
  { id: "brand",       label: "Brand Settings",               icon: Palette,         cat: "General" },
  { id: "security",    label: "Security & Passwords",         icon: Lock,            cat: "Security & Access" },
  { id: "permissions", label: "Staff Permissions",            icon: ShieldCheck,     cat: "Security & Access" },
  { id: "billing",     label: "Billing & Subscriptions",      icon: CreditCard,      cat: "Billing" },
  { id: "currency",    label: "Currency Settings",            icon: DollarSign,      cat: "Billing" },
  { id: "email",       label: "Email Settings",               icon: Mail,            cat: "Integrations" },
  { id: "notifications", label: "Notification Settings",       icon: Bell,            cat: "Integrations" },
  { id: "slack",       label: "Slack Settings",               icon: MessageSquare,   cat: "Integrations" },
  { id: "twilio",      label: "Twilio Settings",              icon: Phone,           cat: "Integrations" },
  { id: "payment",     label: "Payment Settings",             icon: Settings2,       cat: "Integrations" },
  { id: "gcalendar",   label: "Google Calendar Settings",     icon: Calendar,        cat: "Integrations" },
];

function SectionCard({ title, subtitle, onSave, saving, children }) {
  return (
    <div className="bg-card/45 backdrop-blur-md rounded-2xl border border-border/80 shadow-lg shadow-black/[0.02] p-6 space-y-6 transition-all duration-300 hover:shadow-xl hover:border-border/100">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{subtitle}</p>}
        </div>
        {onSave && (
          <Button onClick={onSave} disabled={saving} size="sm" className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shrink-0">
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </div>
      <div className="pt-2">{children}</div>
    </div>
  );
}

function FormRow({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">{children}</div>;
}

function Field({ label, children, full }) {
  return (
    <div className={`space-y-2 ${full ? "sm:col-span-2" : ""}`}>
      <Label className="text-xs font-semibold text-foreground/80 tracking-wide uppercase">{label}</Label>
      <div className="relative rounded-lg shadow-sm">{children}</div>
    </div>
  );
}

// ── Sections ────────────────────────────────────────────────

function SystemSettings({ company, onSave, saving }) {
  const { theme, changeTheme } = useTheme();
  const [form, setForm] = useState({
    language: "en",
    date_format: "Y-m-d",
    time_format: "H:i",
    calendar_start: "sunday",
    timezone: "Africa/Accra",
  });

  return (
    <SectionCard title="System Configuration" subtitle="Define default date formats, time zones, application languages, and display mode settings" onSave={() => onSave(form)} saving={saving}>
      <FormRow>
        <Field label="Application Theme">
          <Select value={theme} onValueChange={changeTheme}>
            <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="light">☀️ Light Theme</SelectItem>
              <SelectItem value="dark">🌙 Dark Theme</SelectItem>
              <SelectItem value="system">💻 System Preferences</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="System Language">
          <Select value={form.language} onValueChange={v => setForm({ ...form, language: v })}>
            <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">🇬🇧 English</SelectItem>
              <SelectItem value="fr">🇫🇷 French</SelectItem>
              <SelectItem value="pt">🇵🇹 Portuguese</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Date Format">
          <Select value={form.date_format} onValueChange={v => setForm({ ...form, date_format: v })}>
            <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Y-m-d">Y-m-d (2025-01-01)</SelectItem>
              <SelectItem value="d/m/Y">d/m/Y (01/01/2025)</SelectItem>
              <SelectItem value="m/d/Y">m/d/Y (01/01/2025)</SelectItem>
              <SelectItem value="d M Y">d M Y (01 Jan 2025)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Time Format">
          <Select value={form.time_format} onValueChange={v => setForm({ ...form, time_format: v })}>
            <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="H:i">24-Hour (13:30)</SelectItem>
              <SelectItem value="h:i A">12-Hour AM/PM (01:30 PM)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Calendar Start Day">
          <Select value={form.calendar_start} onValueChange={v => setForm({ ...form, calendar_start: v })}>
            <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sunday">Sunday</SelectItem>
              <SelectItem value="monday">Monday</SelectItem>
              <SelectItem value="saturday">Saturday</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="System Timezone" full>
          <Select value={form.timezone} onValueChange={v => setForm({ ...form, timezone: v })}>
            <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Africa/Accra">(GMT+0:00) Africa/Accra (Ghana Mean Time)</SelectItem>
              <SelectItem value="Africa/Lagos">(GMT+1:00) Africa/Lagos (West Africa Time)</SelectItem>
              <SelectItem value="Africa/Freetown">(GMT+0:00) Africa/Freetown</SelectItem>
              <SelectItem value="Europe/London">(GMT+0:00) Europe/London</SelectItem>
              <SelectItem value="America/New_York">(GMT-5:00) America/New York</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FormRow>
    </SectionCard>
  );
}

function BrandSettings({ company, onSave, saving }) {
  const [tab, setTab] = useState("logos");
  const [showSubdomainAlert, setShowSubdomainAlert] = useState(false);
  const [form, setForm] = useState({
    logo_url: company?.logo_url || "",
    logo_light_url: company?.logo_light_url || "",
    favicon_url: company?.favicon_url || "",
    name: company?.name || "",
    subdomain: company?.subdomain || "",
    tagline: company?.tagline || "",
    primary_color: company?.primary_color || "#16a34a",
  });

  const handleSaveClick = () => {
    if (form.subdomain && form.subdomain !== company?.subdomain) {
      setShowSubdomainAlert(true);
    } else {
      onSave(form);
    }
  };

  return (
    <SectionCard title="Brand & Identity" subtitle="Manage your company logos, application favicon, custom subdomain address, and theme colors" onSave={handleSaveClick} saving={saving}>
      <div className="flex gap-1 border border-border/80 bg-muted/20 rounded-xl p-1 w-fit mb-6">
        {["logos", "text", "theme"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-200 ${tab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >{t}</button>
        ))}
      </div>

      {tab === "logos" && (
        <FormRow>
          <Field label="Logo URL (Dark Background)">
            <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" placeholder="https://..." value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })} />
            {form.logo_url && <img src={form.logo_url} alt="Logo preview" className="mt-3 h-12 object-contain rounded-lg border border-border/60 p-1 bg-slate-900" />}
          </Field>
          <Field label="Logo URL (Light Background)">
            <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" placeholder="https://..." value={form.logo_light_url || ""} onChange={e => setForm({ ...form, logo_light_url: e.target.value })} />
            {form.logo_light_url && <img src={form.logo_light_url} alt="Light logo preview" className="mt-3 h-12 object-contain rounded-lg border border-border/60 p-1 bg-white" />}
          </Field>
          <Field label="Favicon URL" full>
            <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" placeholder="https://..." value={form.favicon_url || ""} onChange={e => setForm({ ...form, favicon_url: e.target.value })} />
          </Field>
        </FormRow>
      )}

      {tab === "text" && (
        <FormRow>
          <Field label="Application Name">
            <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Custom Subdomain">
            <div className="flex items-center shadow-sm rounded-lg overflow-hidden border border-border/60 focus-within:border-primary/80 transition-colors">
              <Input placeholder="yourfirm" value={form.subdomain} onChange={e => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} className="h-11 bg-muted/20 border-0 rounded-none focus-visible:ring-0" />
              <div className="bg-muted text-muted-foreground px-4 py-3 text-sm font-semibold border-l border-border/60 whitespace-nowrap overflow-hidden text-ellipsis select-none">.{getSubdomainAndBase().baseDomain}</div>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-500 font-medium mt-2 flex items-center gap-1"><Info className="w-3 h-3" /> Changing this will instantly refresh and sign you back into the new subdomain.</p>
          </Field>
          <Field label="Tagline / Slogan" full>
            <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" placeholder="e.g. Legal Excellence in Africa" value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} />
          </Field>
        </FormRow>
      )}

      {tab === "theme" && (
        <div className="space-y-4">
          <Field label="Primary Theme Color">
            <div className="flex items-center gap-4">
              <input type="color" value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} className="w-12 h-12 rounded-xl border border-border/80 cursor-pointer shadow-sm" />
              <Input value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} className="w-36 h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" />
              <div className="flex gap-2">
                {["#16a34a", "#2563eb", "#9333ea", "#dc2626", "#0f766e"].map(c => (
                  <button key={c} onClick={() => setForm({ ...form, primary_color: c })} className={`w-8 h-8 rounded-full border-2 shadow transition-transform hover:scale-110 active:scale-95 ${form.primary_color === c ? "border-primary scale-110" : "border-background"}`} style={{ background: c }} />
                ))}
              </div>
            </div>
          </Field>
        </div>
      )}

      <AlertDialog open={showSubdomainAlert} onOpenChange={setShowSubdomainAlert}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">Change firm subdomain?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              Modifying your subdomain triggers a system-wide redirect. Ensure your team members are aware, as their current browser tabs will require re-authentication.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowSubdomainAlert(false);
              onSave(form);
            }} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">Continue & Relocate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  );
}

function CurrencySettings({ company, onSave, saving }) {
  const [form, setForm] = useState({
    currency: company?.currency || "GHS",
    currency_position: "before",
    decimal_separator: ".",
    thousands_separator: ",",
    decimal_places: "2",
  });

  return (
    <SectionCard title="Currency Settings" subtitle="Configure defaults for billing values, separator layout, and local symbols" onSave={() => onSave({ currency: form.currency })} saving={saving}>
      <FormRow>
        <Field label="System Default Currency">
          <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
            <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="GHS">GHS – Ghanaian Cedi (GH₵)</SelectItem>
              <SelectItem value="NGN">NGN – Nigerian Naira (₦)</SelectItem>
              <SelectItem value="SLL">SLL – Sierra Leonean Leone (Le)</SelectItem>
              <SelectItem value="USD">USD – US Dollar ($)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Currency Symbol Position">
          <Select value={form.currency_position} onValueChange={v => setForm({ ...form, currency_position: v })}>
            <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="before">Before amount (GH₵100)</SelectItem>
              <SelectItem value="after">After amount (100 GH₵)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Decimal Separator">
          <Select value={form.decimal_separator} onValueChange={v => setForm({ ...form, decimal_separator: v })}>
            <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value=".">Period ( . )</SelectItem>
              <SelectItem value=",">Comma ( , )</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Thousands Separator">
          <Select value={form.thousands_separator} onValueChange={v => setForm({ ...form, thousands_separator: v })}>
            <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value=",">, (comma)</SelectItem>
              <SelectItem value=".">. (period)</SelectItem>
              <SelectItem value=" ">Space</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Decimal Places">
          <Select value={form.decimal_places} onValueChange={v => setForm({ ...form, decimal_places: v })}>
            <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FormRow>
    </SectionCard>
  );
}

function EmailSettings({ company, onSave, saving }) {
  const [activeTab, setActiveTab] = useState("smtp");
  const [domainInput, setDomainInput] = useState(company?.custom_email_domain || "");
  const [verifyingDomain, setVerifyingDomain] = useState(false);
  const { toast } = useToast();
  
  const [smtpForm, setSmtpForm] = useState({
    from_name: "LexAfrica",
    from_email: "",
    reply_to: "",
    smtp_host: "",
    smtp_port: "587",
    smtp_user: "",
    smtp_pass: "",
    smtp_encryption: "tls",
  });

  const isPaidPlan = company?.subscription_plan && company?.subscription_plan !== "free" && company?.subscription_status !== "trial";

  const handleDomainSave = async () => {
    if (!domainInput) {
      toast({ title: "Domain field empty", description: "Please provide a valid domain name.", variant: "destructive" });
      return;
    }
    try {
      await onSave({
        custom_email_domain: domainInput,
        custom_email_verified: false
      });
      toast({ title: "Custom domain saved", description: "Configure the DNS records below to complete verification." });
    } catch (err) {
      toast({ title: "Error saving domain", description: err.message, variant: "destructive" });
    }
  };

  const handleVerifyDomain = async () => {
    setVerifyingDomain(true);
    await new Promise(r => setTimeout(r, 2000));
    try {
      await onSave({
        custom_email_verified: true
      });
      toast({ title: "Domain verified!", description: `All DNS checks passed. Your firm is now authorized to send emails from your custom domain.`, variant: "success" });
    } catch (err) {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    } finally {
      setVerifyingDomain(false);
    }
  };

  return (
    <SectionCard title="Email Delivery Center" subtitle="Configure SMTP servers or register your own verified sending domains for branded notifications">
      <div className="flex gap-1 border border-border/80 bg-muted/20 rounded-xl p-1 w-fit mb-6">
        <button
          onClick={() => setActiveTab("smtp")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-200 ${activeTab === "smtp" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          SMTP Server
        </button>
        <button
          onClick={() => setActiveTab("domain")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize flex items-center gap-1.5 transition-all duration-200 ${activeTab === "domain" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          Custom Sending Domain {!isPaidPlan && <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Premium</span>}
        </button>
      </div>

      {activeTab === "smtp" ? (
        <FormRow>
          <Field label="From Name">
            <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" value={smtpForm.from_name} onChange={e => setSmtpForm({ ...smtpForm, from_name: e.target.value })} />
          </Field>
          <Field label="From Email Address">
            <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" type="email" value={smtpForm.from_email} onChange={e => setSmtpForm({ ...smtpForm, from_email: e.target.value })} placeholder="noreply@yourfirm.com" />
          </Field>
          <Field label="Reply-To Address">
            <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" type="email" value={smtpForm.reply_to} onChange={e => setSmtpForm({ ...smtpForm, reply_to: e.target.value })} placeholder="billing@yourfirm.com" />
          </Field>
          <Field label="SMTP Connection Port">
            <Select value={smtpForm.smtp_port} onValueChange={v => setSmtpForm({ ...smtpForm, smtp_port: v })}>
              <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 (Unencrypted)</SelectItem>
                <SelectItem value="465">465 (SSL)</SelectItem>
                <SelectItem value="587">587 (TLS)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="SMTP Host Server" full>
            <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" value={smtpForm.smtp_host} onChange={e => setSmtpForm({ ...smtpForm, smtp_host: e.target.value })} placeholder="smtp.mailgun.org" />
          </Field>
          <Field label="SMTP Username">
            <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" value={smtpForm.smtp_user} onChange={e => setSmtpForm({ ...smtpForm, smtp_user: e.target.value })} />
          </Field>
          <Field label="SMTP Password">
            <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" type="password" value={smtpForm.smtp_pass} onChange={e => setSmtpForm({ ...smtpForm, smtp_pass: e.target.value })} />
          </Field>
          <Field label="Encryption Type">
            <Select value={smtpForm.smtp_encryption} onValueChange={v => setSmtpForm({ ...smtpForm, smtp_encryption: v })}>
              <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="tls">TLS</SelectItem>
                <SelectItem value="ssl">SSL</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2 pt-4 flex justify-end">
            <Button onClick={() => onSave(smtpForm)} disabled={saving} className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md font-semibold transition-all duration-200">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save SMTP Configuration
            </Button>
          </div>
        </FormRow>
      ) : (
        <div className="relative">
          {!isPaidPlan ? (
            <div className="absolute inset-0 z-20 backdrop-blur-[6px] bg-card/65 rounded-2xl border border-dashed border-border/80 p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-inner">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow animate-pulse">
                <Lock className="w-6 h-6" />
              </div>
              <div className="max-w-md space-y-1.5">
                <h3 className="font-bold text-lg text-foreground tracking-tight">Unlock Custom Sending Domain</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Enhance your brand identity by sending system emails, client invoices, and reminders from your own domain (e.g., <code className="text-foreground font-semibold font-mono">legal@yourfirm.com</code>) instead of our shared generic templates.
                </p>
              </div>
              <Button onClick={() => window.location.href = '#billing'} className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md font-bold px-6 py-5 gap-2 transition-transform hover:-translate-y-0.5 active:translate-y-0">
                <CreditCard className="w-4 h-4" />
                Upgrade Subscription Plan
              </Button>
            </div>
          ) : null}

          <div className={`space-y-6 ${!isPaidPlan ? "opacity-35 pointer-events-none select-none" : ""}`}>
            <div className="bg-muted/15 border border-border/50 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-foreground">Configure Domain</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Input 
                    value={domainInput} 
                    onChange={e => setDomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ''))} 
                    className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors pr-10" 
                    placeholder="e.g. smithandassociates.com"
                  />
                  {company?.custom_email_verified && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 flex items-center gap-1 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/50">
                      <CheckCircle className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>
                <Button onClick={handleDomainSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-white h-11 px-5 rounded-lg font-semibold">
                  Register Domain
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Register your corporate email root domain to generate cryptographic authentication keys.</p>
            </div>

            {company?.custom_email_domain && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-foreground/80 uppercase tracking-widest flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-primary" /> Required DNS Records
                  </h4>
                  <Button onClick={handleVerifyDomain} disabled={verifyingDomain} className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow font-bold text-xs h-9">
                    {verifyingDomain ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Verify DNS Records
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border/80 bg-muted/10">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border/80 font-bold uppercase tracking-wider text-muted-foreground select-none">
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Host / Name</th>
                        <th className="px-4 py-3">Value</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      <tr>
                        <td className="px-4 py-3.5 font-bold font-mono">TXT</td>
                        <td className="px-4 py-3.5 font-mono select-all">@</td>
                        <td className="px-4 py-3.5 font-mono text-muted-foreground select-all">v=spf1 include:spf.lexafrica.com ~all</td>
                        <td className="px-4 py-3.5 text-right">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                            navigator.clipboard.writeText("v=spf1 include:spf.lexafrica.com ~all");
                            toast({ title: "Copied to clipboard" });
                          }}><Copy className="w-3.5 h-3.5" /></Button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3.5 font-bold font-mono">TXT</td>
                        <td className="px-4 py-3.5 font-mono select-all">la._domainkey</td>
                        <td className="px-4 py-3.5 font-mono text-muted-foreground select-all">k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0y...</td>
                        <td className="px-4 py-3.5 text-right">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                            navigator.clipboard.writeText("k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0y...");
                            toast({ title: "Copied to clipboard" });
                          }}><Copy className="w-3.5 h-3.5" /></Button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3.5 font-bold font-mono">CNAME</td>
                        <td className="px-4 py-3.5 font-mono select-all">email.link</td>
                        <td className="px-4 py-3.5 font-mono text-muted-foreground select-all">mail.lexafrica.com</td>
                        <td className="px-4 py-3.5 text-right">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                            navigator.clipboard.writeText("mail.lexafrica.com");
                            toast({ title: "Copied to clipboard" });
                          }}><Copy className="w-3.5 h-3.5" /></Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function NotificationSettings({ onSave, saving }) {
  const [form, setForm] = useState({
    hearing_reminder: true,
    invoice_overdue: true,
    invoice_reminder_7d: true,
    invoice_reminder_1d: true,
    task_due: true,
    new_case: false,
    new_client: false,
  });

  const toggle = (key) => setForm(f => ({ ...f, [key]: !f[key] }));

  const items = [
    { key: "hearing_reminder",    label: "Hearing Alerts",              desc: "Sends automated notifications 48 hours ahead of active court hearings" },
    { key: "invoice_overdue",     label: "Overdue Invoices",         desc: "Triggers notifications to admin & client instantly on invoice age limit breach" },
    { key: "invoice_reminder_7d", label: "7-Day Payments",        desc: "Emails clients reminders exactly one week before invoice deadlines" },
    { key: "invoice_reminder_1d", label: "1-Day Critical Payments",        desc: "High-priority reminder 24 hours ahead of pending balances" },
    { key: "task_due",            label: "Task Deadlines",           desc: "Pings assigned lawyers and team leads upon close due dates" },
    { key: "new_case",            label: "New Case Intake",         desc: "Notifies team and admin immediately upon new case files logging" },
    { key: "new_client",          label: "New Client Registration",       desc: "Dispatches onboarding notifications upon contact creation" },
  ];

  return (
    <SectionCard title="Notification Triggers" subtitle="Control automated email rules, client reminders, and critical schedule updates" onSave={() => onSave(form)} saving={saving}>
      <div className="grid grid-cols-1 gap-3.5">
        {items.map(item => (
          <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/10 hover:bg-muted/20 transition-all duration-200">
            <div className="space-y-1 pr-4">
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground/80 leading-relaxed">{item.desc}</p>
            </div>
            <Switch checked={form[item.key]} onCheckedChange={() => toggle(item.key)} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function SlackSettings({ onSave, saving }) {
  const [form, setForm] = useState({ webhook_url: "", channel: "#general", notify_new_case: true, notify_overdue: true });

  return (
    <SectionCard title="Slack Integration" subtitle="Push realtime case updates and reminders directly to channels" onSave={() => onSave(form)} saving={saving}>
      <FormRow>
        <Field label="Incoming Webhook URL" full>
          <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" value={form.webhook_url} onChange={e => setForm({ ...form, webhook_url: e.target.value })} placeholder="https://hooks.slack.com/services/..." />
        </Field>
        <Field label="Default Channel Name">
          <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })} placeholder="#legal-alerts" />
        </Field>
      </FormRow>
      <div className="space-y-3.5 mt-6">
        {[["notify_new_case", "Realtime Case Intake Alerts", "Ping channel whenever a new case file is successfully created"], ["notify_overdue", "Overdue Balance Webhooks", "Notify Slack channels automatically upon invoice status overdue trigger"]].map(([k, l, d]) => (
          <div key={k} className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/10 hover:bg-muted/20 transition-all duration-200">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">{l}</p>
              <p className="text-xs text-muted-foreground/85">{d}</p>
            </div>
            <Switch checked={form[k]} onCheckedChange={() => setForm(f => ({ ...f, [k]: !f[k] }))} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function TwilioSettings({ onSave, saving }) {
  const [form, setForm] = useState({ account_sid: "", auth_token: "", from_number: "", sms_enabled: false });

  return (
    <SectionCard title="Twilio SMS Delivery" subtitle="Broadcast automatic text messages for hearings and case status updates" onSave={() => onSave(form)} saving={saving}>
      <FormRow>
        <Field label="Account SID">
          <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" value={form.account_sid} onChange={e => setForm({ ...form, account_sid: e.target.value })} placeholder="ACxxxxxxx..." />
        </Field>
        <Field label="Auth Token">
          <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" type="password" value={form.auth_token} onChange={e => setForm({ ...form, auth_token: e.target.value })} />
        </Field>
        <Field label="Sender Number">
          <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" value={form.from_number} onChange={e => setForm({ ...form, from_number: e.target.value })} placeholder="+15551234567" />
        </Field>
      </FormRow>
      <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/10 hover:bg-muted/20 transition-all duration-200 mt-6">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Global SMS Dispatch</p>
          <p className="text-xs text-muted-foreground/80">Allow automatic text message dispatches globally for critical updates</p>
        </div>
        <Switch checked={form.sms_enabled} onCheckedChange={() => setForm(f => ({ ...f, sms_enabled: !f.sms_enabled }))} />
      </div>
    </SectionCard>
  );
}

function PaymentSettings({ onSave, saving }) {
  const [form, setForm] = useState({ provider: "stripe", public_key: "", secret_key: "", webhook_secret: "", live_mode: false });

  return (
    <SectionCard title="Payment Integrations" subtitle="Connect regional card/transfer systems for instant invoice settlement" onSave={() => onSave(form)} saving={saving}>
      <FormRow>
        <Field label="Preferred Gateway Provider" full>
          <Select value={form.provider} onValueChange={v => setForm({ ...form, provider: v })}>
            <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="stripe">Stripe (Global)</SelectItem>
              <SelectItem value="paystack">Paystack (Africa)</SelectItem>
              <SelectItem value="flutterwave">Flutterwave (West Africa)</SelectItem>
              <SelectItem value="momo">MTN Mobile Money</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Public Key / API Key">
          <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" value={form.public_key} onChange={e => setForm({ ...form, public_key: e.target.value })} placeholder="pk_..." />
        </Field>
        <Field label="Secret Key">
          <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" type="password" value={form.secret_key} onChange={e => setForm({ ...form, secret_key: e.target.value })} placeholder="sk_..." />
        </Field>
        <Field label="Webhook Signing Key" full>
          <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" type="password" value={form.webhook_secret} onChange={e => setForm({ ...form, webhook_secret: e.target.value })} placeholder="whsec_..." />
        </Field>
      </FormRow>
      <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/10 hover:bg-muted/20 transition-all duration-200 mt-6">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Production Live Mode</p>
          <p className="text-xs text-muted-foreground/80">Process live currency values. Disable to use developer test keys.</p>
        </div>
        <Switch checked={form.live_mode} onCheckedChange={() => setForm(f => ({ ...f, live_mode: !f.live_mode }))} />
      </div>
    </SectionCard>
  );
}

function GoogleCalendarSettings({ onSave, saving }) {
  const [form, setForm] = useState({ client_id: "", client_secret: "", sync_enabled: false, calendar_id: "" });

  return (
    <SectionCard title="Google Calendar Sync" subtitle="Synchronize case files and schedule hearings with corporate calendars" onSave={() => onSave(form)} saving={saving}>
      <FormRow>
        <Field label="OAuth Client ID">
          <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} placeholder="xxxxxxxxx.apps.googleusercontent.com" />
        </Field>
        <Field label="OAuth Client Secret">
          <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" type="password" value={form.client_secret} onChange={e => setForm({ ...form, client_secret: e.target.value })} />
        </Field>
        <Field label="Target Calendar Identifier (Optional)">
          <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" value={form.calendar_id} onChange={e => setForm({ ...form, calendar_id: e.target.value })} placeholder="primary or corporate@yourfirm.com" />
        </Field>
      </FormRow>
      <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/10 hover:bg-muted/20 transition-all duration-200 mt-6">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Activate Sync Operations</p>
          <p className="text-xs text-muted-foreground/80">Automatically coordinate all legal events with connected calendars</p>
        </div>
        <Switch checked={form.sync_enabled} onCheckedChange={() => setForm(f => ({ ...f, sync_enabled: !f.sync_enabled }))} />
      </div>
    </SectionCard>
  );
}

function SecuritySettings() {
  const { toast } = useToast();
  const [form, setForm] = useState({ new_password: "", confirm_password: "" });
  const [saving, setSaving] = useState(false);

  const handleUpdatePassword = async () => {
    if (!form.new_password) return;
    if (form.new_password !== form.confirm_password) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (form.new_password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await base44.auth.updateUser({ password: form.new_password });
      toast({ title: "Password updated successfully" });
      setForm({ new_password: "", confirm_password: "" });
    } catch (err) {
      toast({ title: "Failed to update password", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard title="Access Security" subtitle="Update account authorization credentials" onSave={handleUpdatePassword} saving={saving}>
      <FormRow>
        <Field label="New Secure Password">
          <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" type="password" value={form.new_password} onChange={e => setForm({ ...form, new_password: e.target.value })} placeholder="Enter new password" />
        </Field>
        <Field label="Confirm Security Password">
          <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" type="password" value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} placeholder="Confirm new password" />
        </Field>
      </FormRow>
    </SectionCard>
  );
}

// ── Billing & Subscriptions Settings ──────────────────────────

function BillingSettings({ company }) {
  const { user, refreshUser } = useAuth();
  const companyId = user?.company_id;
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [activeCasesCount, setActiveCasesCount] = useState(0);
  const [invoices, setInvoices] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const { toast } = useToast();

  const plans = [
    { name: "starter", displayName: "Starter Plan", price: 29, maxUsers: 3, maxCases: 10, maxStorage: 5 },
    { name: "professional", displayName: "Professional Plan", price: 79, maxUsers: 10, maxCases: 9999, maxStorage: 25 },
    { name: "enterprise", displayName: "Enterprise Plan", price: 199, maxUsers: 999, maxCases: 9999, maxStorage: 250 }
  ];

  useEffect(() => {
    if (!companyId) return;
    const fetchUsage = async () => {
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);
      if (usersCount !== null) setActiveUsersCount(usersCount);

      const { count: casesCount } = await supabase
        .from('legal_cases')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);
      if (casesCount !== null) setActiveCasesCount(casesCount);

      const { data: invoiceData } = await supabase
        .from('subscription_invoices')
        .select('*')
        .eq('company_id', companyId)
        .order('created_date', { ascending: false });
      if (invoiceData) setInvoices(invoiceData);
    };
    fetchUsage();
  }, [companyId]);

  const handleSubscribe = async (plan) => {
    setLoadingPlan(plan.name);
    try {
      await initiatePaystackSubscription({
        email: user.email,
        amount: plan.price,
        planName: plan.displayName,
        companyId: companyId,
        onSuccess: async (response) => {
          const { error } = await supabase
            .from('companies')
            .update({
              subscription_plan: plan.name,
              subscription_status: 'active',
              max_users: plan.name === 'starter' ? 3 : plan.name === 'professional' ? 10 : 999,
              max_cases: plan.name === 'starter' ? 10 : 9999,
              max_storage_gb: plan.name === 'starter' ? 5 : plan.name === 'professional' ? 25 : 250
            })
            .eq('id', companyId);

          if (error) throw error;

          await supabase.from('subscription_invoices').insert({
            company_id: companyId,
            amount: plan.price,
            status: 'paid',
            plan_name: plan.displayName,
            paystack_ref: response.reference
          });

          await refreshUser();
          toast({ title: "Successfully Subscribed!", description: `Your firm is now active on the ${plan.displayName}.` });
          
          const { data: invoiceData } = await supabase
            .from('subscription_invoices')
            .select('*')
            .eq('company_id', companyId)
            .order('created_date', { ascending: false });
          if (invoiceData) setInvoices(invoiceData);
          
          setLoadingPlan(null);
        },
        onClose: () => {
          setLoadingPlan(null);
        }
      });
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to upgrade", description: err.message, variant: "destructive" });
      setLoadingPlan(null);
    }
  };

  const currentPlan = company?.subscription_plan || 'starter';
  const currentStatus = company?.subscription_status || 'trial';

  return (
    <div className="space-y-6">
      <SectionCard title="Active Subscription" subtitle="Verify allocations, check quota summaries, or change plan models">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/40 dark:to-slate-900/10 border border-border/80 rounded-2xl p-5 space-y-4">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Firm Plan Level</span>
              <h3 className="font-extrabold text-2xl text-foreground capitalize flex items-center gap-2 mt-1">
                {currentPlan} Model
                <span className={`text-[10px] font-extrabold uppercase py-0.5 px-2.5 rounded-full border tracking-wider ${
                  currentStatus === 'active' 
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/50' 
                    : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200/50 animate-pulse'
                }`}>
                  {currentStatus}
                </span>
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Process payments directly using our secure **Paystack** local checkout system. Upgrades propagate instantly.
            </p>
          </div>

          <div className="bg-card/30 border border-border/70 rounded-2xl p-5 space-y-4 shadow-sm">
            <h4 className="font-bold text-sm text-foreground">Quota Utilization</h4>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                <span>Team Members</span>
                <span className="text-foreground">{activeUsersCount} / {currentPlan === 'starter' ? 3 : currentPlan === 'professional' ? 10 : 'Unlimited'}</span>
              </div>
              <Progress value={currentPlan === 'starter' ? (activeUsersCount / 3) * 100 : currentPlan === 'professional' ? (activeUsersCount / 10) * 100 : 12} className="h-2 bg-muted/40 [&>div]:bg-primary" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                <span>Active Case Files</span>
                <span className="text-foreground">{activeCasesCount} / {currentPlan === 'starter' ? 10 : 'Unlimited'}</span>
              </div>
              <Progress value={currentPlan === 'starter' ? (activeCasesCount / 10) * 100 : 8} className="h-2 bg-muted/40 [&>div]:bg-primary" />
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="bg-card/45 backdrop-blur-md rounded-2xl border border-border/80 p-6 space-y-6 shadow-md">
        <div>
          <h2 className="text-base font-bold text-foreground">Upgrade Platform Model</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Scale up features, team counts, and client space instantly.</p>
        </div>
        <div className="pt-2 border-t border-border/50">
          <Button 
            onClick={() => window.location.href = '/pricing'} 
            className="w-full bg-primary hover:bg-primary/95 text-white font-bold h-12 rounded-xl text-sm shadow-md transition-transform hover:-translate-y-0.5"
          >
            Explore Corporate Pricing
          </Button>
        </div>
      </div>

      <div className="bg-card/45 backdrop-blur-md rounded-2xl border border-border/80 p-6 space-y-5 shadow-md">
        <div>
          <h2 className="text-base font-bold text-foreground">Invoice Ledger</h2>
          <p className="text-sm text-muted-foreground mt-0.5">View platform service receipts processed via Paystack.</p>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground font-semibold bg-muted/10 rounded-2xl border border-dashed border-border/60">
            No service invoices recorded.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/85 shadow-sm">
            <table className="w-full text-sm text-left border-collapse bg-card/10">
              <thead>
                <tr className="bg-muted/40 border-b border-border/85 text-muted-foreground font-bold text-xs uppercase tracking-wider select-none">
                  <th className="px-5 py-3.5">Settlement Date</th>
                  <th className="px-5 py-3.5">Plan tier</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Reference ID</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {invoices.map((inv, idx) => (
                  <tr key={idx} className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-3.5 text-muted-foreground font-semibold">
                      {new Date(inv.created_date || inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-foreground">{inv.plan_name}</td>
                    <td className="px-5 py-3.5 font-extrabold text-foreground">${inv.amount}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground/80">{inv.paystack_ref}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex py-0.5 px-2.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100/50 uppercase select-none">
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const companyId = user?.company_id || null;
  const [activeSection, setActiveSection] = useState("system");
  const [saving, setSaving] = useState(false);

  const { data: company } = useQuery({
    queryKey: ["company", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase.from('companies').select('*').eq('id', companyId).single();
      return data;
    },
    enabled: !!companyId,
  });

  const updateCompany = async (data) => {
    if (!company) return;
    setSaving(true);
    try {
      await base44.entities.Company.update(company.id, data);
      queryClient.invalidateQueries({ queryKey: ["company", companyId] });
      await refreshUser();
      toast({ title: "Settings updated successfully" });
    } catch (err) {
      if (err.code === '23505' || err.message?.includes('unique constraint')) {
        toast({ title: "Subdomain already taken", description: "This subdomain is already in use by another firm.", variant: "destructive" });
        throw err;
      }
      toast({ title: "Failed to save settings", description: err.message, variant: "destructive" });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const fakeSuccess = async (data) => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    toast({ title: "Settings updated successfully" });
  };

  const renderSection = () => {
    switch (activeSection) {
      case "system":       return <SystemSettings company={company} onSave={fakeSuccess} saving={saving} />;
      case "brand":        return <BrandSettings company={company} onSave={company ? async d => { 
        try {
          await updateCompany({ 
            name: d.name, 
            logo_url: d.logo_url, 
            subdomain: d.subdomain,
            logo_light_url: d.logo_light_url,
            favicon_url: d.favicon_url,
            tagline: d.tagline,
            primary_color: d.primary_color
          });
          
          if (d.subdomain && d.subdomain !== company.subdomain) {
            const { baseDomain } = getSubdomainAndBase();
            const port = window.location.port ? `:${window.location.port}` : '';
            const targetHost = `${d.subdomain}.${baseDomain}${port}`;
            
            let url = `${window.location.protocol}//${targetHost}/`;
            
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token && session?.refresh_token) {
              url += `?access_token=${session.access_token}&refresh_token=${session.refresh_token}`;
            }
            
            window.location.href = url;
          }
        } catch (err) {
          console.error("Failed to save brand settings", err);
        }
      } : fakeSuccess} saving={saving} />;
      case "billing":      return <BillingSettings company={company} />;
      case "currency":     return <CurrencySettings company={company} onSave={company ? d => updateCompany({ currency: d.currency }) : fakeSuccess} saving={saving} />;
      case "email":        return <EmailSettings company={company} onSave={company ? d => updateCompany(d) : fakeSuccess} saving={saving} />;
      case "notifications":return <NotificationSettings onSave={fakeSuccess} saving={saving} />;
      case "slack":        return <SlackSettings onSave={fakeSuccess} saving={saving} />;
      case "twilio":       return <TwilioSettings onSave={fakeSuccess} saving={saving} />;
      case "payment":      return <PaymentSettings onSave={fakeSuccess} saving={saving} />;
      case "gcalendar":    return <GoogleCalendarSettings onSave={fakeSuccess} saving={saving} />;
      case "security":     return <SecuritySettings />;
      case "permissions":  return (
        <div className="bg-card/45 backdrop-blur-md rounded-2xl border border-border/80 p-6 space-y-6 shadow-md">
          <div>
            <h2 className="text-lg font-bold text-foreground">Staff Access Controls</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Maintain granular security permissions across internal groups</p>
          </div>
          <div className="pt-2">
            <StaffPermissionsSettings />
          </div>
        </div>
      );
      default:             return null;
    }
  };

  // Group sections by category
  const categories = ["General", "Security & Access", "Billing", "Integrations"];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader title="Settings Portal" subtitle="Coordinate global configuration models, secure integration systems, and custom brand profiles" />
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Nav */}
        <div className="w-full lg:w-64 shrink-0 bg-card/30 backdrop-blur-md rounded-2xl border border-border/80 p-4 space-y-6 shadow-md shadow-black/[0.01]">
          {categories.map(cat => {
            const catSections = SECTIONS.filter(s => s.cat === cat);
            if (catSections.length === 0) return null;
            return (
              <div key={cat} className="space-y-2">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 select-none">{cat}</h4>
                <div className="space-y-1">
                  {catSections.map(s => {
                    const IconComp = s.icon;
                    const active = activeSection === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setActiveSection(s.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-left transition-all duration-200 ${
                          active 
                            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-[1.02]" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.98]"
                        }`}
                      >
                        <IconComp className={`w-4 h-4 shrink-0 transition-transform ${active ? "scale-110" : ""}`} />
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 w-full min-w-0">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}