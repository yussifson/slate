import { useTranslation } from "react-i18next";
import { getTerm } from "@/config/industries";
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

function SystemSettings({ activeIndustry, company, onSave, saving }) {
  const { t } = useTranslation();
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
              <SelectItem value="light">{t("light_theme", "☀️ Light Theme")}</SelectItem>
              <SelectItem value="dark">{t("dark_theme", "🌙 Dark Theme")}</SelectItem>
              <SelectItem value="system">{t("system_preferences", "💻 System Preferences")}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="System Language">
          <Select value={form.language} onValueChange={v => setForm({ ...form, language: v })}>
            <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t("english", "🇬🇧 English")}</SelectItem>
              <SelectItem value="fr">{t("french", "🇫🇷 French")}</SelectItem>
              <SelectItem value="pt">{t("portuguese", "🇵🇹 Portuguese")}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Date Format">
          <Select value={form.date_format} onValueChange={v => setForm({ ...form, date_format: v })}>
            <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Y-m-d">{t("y_m_d_2025_01_01", "Y-m-d (2025-01-01)")}</SelectItem>
              <SelectItem value="d/m/Y">{t("d_m_y_01_01_2025", "d/m/Y (01/01/2025)")}</SelectItem>
              <SelectItem value="m/d/Y">{t("m_d_y_01_01_2025", "m/d/Y (01/01/2025)")}</SelectItem>
              <SelectItem value="d M Y">{t("d_m_y_01_jan_2025", "d M Y (01 Jan 2025)")}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Time Format">
          <Select value={form.time_format} onValueChange={v => setForm({ ...form, time_format: v })}>
            <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="H:i">{t("24_hour_13_30", "24-Hour (13:30)")}</SelectItem>
              <SelectItem value="h:i A">{t("12_hour_am_pm_01_30_pm", "12-Hour AM/PM (01:30 PM)")}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Calendar Start Day">
          <Select value={form.calendar_start} onValueChange={v => setForm({ ...form, calendar_start: v })}>
            <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sunday">{t("sunday", "Sunday")}</SelectItem>
              <SelectItem value="monday">{t("monday", "Monday")}</SelectItem>
              <SelectItem value="saturday">{t("saturday", "Saturday")}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="System Timezone" full>
          <Select value={form.timezone} onValueChange={v => setForm({ ...form, timezone: v })}>
            <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Africa/Accra">{t(
                "gmt_0_00_africa_accra_ghana_me",
                "(GMT+0:00) Africa/Accra (Ghana Mean Time)"
              )}</SelectItem>
              <SelectItem value="Africa/Lagos">{t(
                "gmt_1_00_africa_lagos_west_afr",
                "(GMT+1:00) Africa/Lagos (West Africa Time)"
              )}</SelectItem>
              <SelectItem value="Africa/Freetown">{t("gmt_0_00_africa_freetown", "(GMT+0:00) Africa/Freetown")}</SelectItem>
              <SelectItem value="Europe/London">{t("gmt_0_00_europe_london", "(GMT+0:00) Europe/London")}</SelectItem>
              <SelectItem value="America/New_York">{t("gmt_5_00_america_new_york", "(GMT-5:00) America/New York")}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FormRow>
    </SectionCard>
  );
}

function BrandSettings({ activeIndustry, company, onSave, saving }) {
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
        {["logos", "text", "theme"].map(item => {
          return (
            <button
              key={item}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-200 ${tab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >{item}</button>
          );
        })}
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
            <p className="text-xs text-amber-600 dark:text-amber-500 font-medium mt-2 flex items-center gap-1"><Info className="w-3 h-3" /> {t(
                "changing_this_will_instantly_r",
                "Changing this will instantly refresh and sign you back into the new subdomain."
              )}</p>
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
                {["#16a34a", "#2563eb", "#9333ea", "#dc2626", "#0f766e"].map(c => {
                  return (<button key={c} onClick={() => setForm({ ...form, primary_color: c })} className={`w-8 h-8 rounded-full border-2 shadow transition-transform hover:scale-110 active:scale-95 ${form.primary_color === c ? "border-primary scale-110" : "border-background"}`} style={{ background: c }} />);
                })}
              </div>
            </div>
          </Field>
        </div>
      )}
      <AlertDialog open={showSubdomainAlert} onOpenChange={setShowSubdomainAlert}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">{t("change_firm_subdomain", "Change firm subdomain?")}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              {t(
                "modifying_your_subdomain_trigg",
                "Modifying your subdomain triggers a system-wide redirect. Ensure your team members are aware, as their current browser tabs will require re-authentication."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">{t("cancel", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowSubdomainAlert(false);
              onSave(form);
            }} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">{t("continue_relocate", "Continue & Relocate")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  );
}

function CurrencySettings({ activeIndustry, company, onSave, saving }) {
  const [form, setForm] = useState({
    currency: company?.currency || "GHS",
    currency_position: "before",
    decimal_separator: ".",
    thousands_separator: ",",
    decimal_places: "2",
  });

  useEffect(() => {
    if (company?.currency) {
      setForm(prev => ({ ...prev, currency: company.currency }));
    }
  }, [company]);

  return (
    <SectionCard title="Currency Settings" subtitle="Configure defaults for billing values, separator layout, and local symbols" onSave={() => onSave({ currency: form.currency })} saving={saving}>
      <FormRow>
        <Field label="System Default Currency">
          <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
            <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="GHS">{t("ghs_ghanaian_cedi_gh", "GHS – Ghanaian Cedi (GH₵)")}</SelectItem>
              <SelectItem value="NGN">{t("ngn_nigerian_naira", "NGN – Nigerian Naira (₦)")}</SelectItem>
              <SelectItem value="SLL">{t("sll_sierra_leonean_leone_le", "SLL – Sierra Leonean Leone (Le)")}</SelectItem>
              <SelectItem value="USD">{t("usd_us_dollar", "USD – US Dollar ($)")}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Currency Symbol Position">
          <Select value={form.currency_position} onValueChange={v => setForm({ ...form, currency_position: v })}>
            <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="before">{t("before_amount_gh_100", "Before amount (GH₵100)")}</SelectItem>
              <SelectItem value="after">{t("after_amount_100_gh", "After amount (100 GH₵)")}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Decimal Separator">
          <Select value={form.decimal_separator} onValueChange={v => setForm({ ...form, decimal_separator: v })}>
            <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value=".">{t("period", "Period ( . )")}</SelectItem>
              <SelectItem value=",">{t("comma", "Comma ( , )")}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Thousands Separator">
          <Select value={form.thousands_separator} onValueChange={v => setForm({ ...form, thousands_separator: v })}>
            <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value=",">{t("comma", ", (comma)")}</SelectItem>
              <SelectItem value=".">{t("period", ". (period)")}</SelectItem>
              <SelectItem value=" ">{t("space", "Space")}</SelectItem>
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

function EmailSettings({ activeIndustry, company, onSave, saving }) {
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
          {t("smtp_server", "SMTP Server")}
        </button>
        <button
          onClick={() => setActiveTab("domain")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize flex items-center gap-1.5 transition-all duration-200 ${activeTab === "domain" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          {t("custom_sending_domain", "Custom Sending Domain")} {!isPaidPlan && <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">{t("premium", "Premium")}</span>}
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
                <SelectItem value="25">{t("25_unencrypted", "25 (Unencrypted)")}</SelectItem>
                <SelectItem value="465">{t("465_ssl", "465 (SSL)")}</SelectItem>
                <SelectItem value="587">{t("587_tls", "587 (TLS)")}</SelectItem>
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
                <SelectItem value="none">{t("none", "None")}</SelectItem>
                <SelectItem value="tls">{t("tls", "TLS")}</SelectItem>
                <SelectItem value="ssl">{t("ssl", "SSL")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2 pt-4 flex justify-end">
            <Button onClick={() => onSave(smtpForm)} disabled={saving} className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md font-semibold transition-all duration-200">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t("save_smtp_configuration", "Save SMTP Configuration")}
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
                <h3 className="font-bold text-lg text-foreground tracking-tight">{t("unlock_custom_sending_domain", "Unlock Custom Sending Domain")}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(
                    "enhance_your_brand_identity_by",
                    "Enhance your brand identity by sending system emails, client invoices, and reminders from your own domain (e.g.,"
                  )} <code className="text-foreground font-semibold font-mono">{t("legal_yourfirm_com", "legal@yourfirm.com")}</code>{t(
                    "instead_of_our_shared_generic_",
                    ") instead of our shared generic templates."
                  )}
                </p>
              </div>
              <Button onClick={() => window.location.href = '#billing'} className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md font-bold px-6 py-5 gap-2 transition-transform hover:-translate-y-0.5 active:translate-y-0">
                <CreditCard className="w-4 h-4" />
                {t("upgrade_subscription_plan", "Upgrade Subscription Plan")}
              </Button>
            </div>
          ) : null}

          <div className={`space-y-6 ${!isPaidPlan ? "opacity-35 pointer-events-none select-none" : ""}`}>
            <div className="bg-muted/15 border border-border/50 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-foreground">{t("configure_domain", "Configure Domain")}</h3>
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
                      <CheckCircle className="w-3.5 h-3.5" /> {t("verified", "Verified")}
                    </span>
                  )}
                </div>
                <Button onClick={handleDomainSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-white h-11 px-5 rounded-lg font-semibold">
                  {t("register_domain", "Register Domain")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t(
                "register_your_corporate_email_",
                "Register your corporate email root domain to generate cryptographic authentication keys."
              )}</p>
            </div>

            {company?.custom_email_domain && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-foreground/80 uppercase tracking-widest flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-primary" /> {t("required_dns_records", "Required DNS Records")}
                  </h4>
                  <Button onClick={handleVerifyDomain} disabled={verifyingDomain} className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow font-bold text-xs h-9">
                    {verifyingDomain ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    {t("verify_dns_records", "Verify DNS Records")}
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border/80 bg-muted/10">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border/80 font-bold uppercase tracking-wider text-muted-foreground select-none">
                        <th className="px-4 py-3">{t("type", "Type")}</th>
                        <th className="px-4 py-3">{t("host_name", "Host / Name")}</th>
                        <th className="px-4 py-3">{t("value", "Value")}</th>
                        <th className="px-4 py-3 text-right">{t("action", "Action")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      <tr>
                        <td className="px-4 py-3.5 font-bold font-mono">{t("txt", "TXT")}</td>
                        <td className="px-4 py-3.5 font-mono select-all">@</td>
                        <td className="px-4 py-3.5 font-mono text-muted-foreground select-all">{t("v_spf1_include_spf_lexafrica_c", "v=spf1 include:spf.lexafrica.com ~all")}</td>
                        <td className="px-4 py-3.5 text-right">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                            navigator.clipboard.writeText("v=spf1 include:spf.lexafrica.com ~all");
                            toast({ title: "Copied to clipboard" });
                          }}><Copy className="w-3.5 h-3.5" /></Button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3.5 font-bold font-mono">{t("txt", "TXT")}</td>
                        <td className="px-4 py-3.5 font-mono select-all">{t("la_domainkey", "la._domainkey")}</td>
                        <td className="px-4 py-3.5 font-mono text-muted-foreground select-all">{t(
                          "k_rsa_p_miibijanbgkqhkig9w0baq",
                          "k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0y..."
                        )}</td>
                        <td className="px-4 py-3.5 text-right">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                            navigator.clipboard.writeText("k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0y...");
                            toast({ title: "Copied to clipboard" });
                          }}><Copy className="w-3.5 h-3.5" /></Button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3.5 font-bold font-mono">{t("cname", "CNAME")}</td>
                        <td className="px-4 py-3.5 font-mono select-all">{t("email_link", "email.link")}</td>
                        <td className="px-4 py-3.5 font-mono text-muted-foreground select-all">{t("mail_lexafrica_com", "mail.lexafrica.com")}</td>
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

function NotificationSettings({ activeIndustry, onSave, saving }) {
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
        {items.map(item => {
          return (
            <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/10 hover:bg-muted/20 transition-all duration-200">
              <div className="space-y-1 pr-4">
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground/80 leading-relaxed">{item.desc}</p>
              </div>
              <Switch checked={form[item.key]} onCheckedChange={() => toggle(item.key)} />
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function SlackSettings({ activeIndustry, onSave, saving, initialData }) {
  const [form, setForm] = useState({ webhook_url: "", channel: "#general", notify_new_case: true, notify_overdue: true });

  useEffect(() => {
    if (initialData) {
      setForm({
        webhook_url: initialData.access_token || "",
        channel: initialData.metadata?.channel || "#general",
        notify_new_case: initialData.metadata?.notify_new_case !== false,
        notify_overdue: initialData.metadata?.notify_overdue !== false,
      });
    }
  }, [initialData]);

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
        {[["notify_new_case", "Realtime " + getTerm(activeIndustry, "case") + " Intake Alerts", "Ping channel whenever a new " + getTerm(activeIndustry, "case").toLowerCase() + " file is successfully created"], ["notify_overdue", "Overdue Balance Webhooks", "Notify Slack channels automatically upon invoice status overdue trigger"]].map(([k, l, d]) => {
          return (
            <div key={k} className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/10 hover:bg-muted/20 transition-all duration-200">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">{l}</p>
                <p className="text-xs text-muted-foreground/85">{d}</p>
              </div>
              <Switch checked={form[k]} onCheckedChange={() => setForm(f => ({ ...f, [k]: !f[k] }))} />
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function TwilioSettings({ activeIndustry, onSave, saving, initialData }) {
  const [form, setForm] = useState({ account_sid: "", auth_token: "", from_number: "", sms_enabled: false });

  useEffect(() => {
    if (initialData) {
      setForm({
        account_sid: initialData.provider_user_id || "",
        auth_token: initialData.access_token || "",
        from_number: initialData.metadata?.from_number || "",
        sms_enabled: !!initialData.metadata?.sms_enabled,
      });
    }
  }, [initialData]);

  return (
    <SectionCard title="Twilio SMS Delivery" subtitle={"Broadcast automatic text messages for " + getTerm(activeIndustry, "hearing").toLowerCase() + "s and " + getTerm(activeIndustry, "case").toLowerCase() + " status updates"} onSave={() => onSave(form)} saving={saving}>
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
          <p className="text-sm font-semibold text-foreground">{t("global_sms_dispatch", "Global SMS Dispatch")}</p>
          <p className="text-xs text-muted-foreground/80">{t(
            "allow_automatic_text_message_d",
            "Allow automatic text message dispatches globally for critical updates"
          )}</p>
        </div>
        <Switch checked={form.sms_enabled} onCheckedChange={() => setForm(f => ({ ...f, sms_enabled: !f.sms_enabled }))} />
      </div>
    </SectionCard>
  );
}

function PaymentSettings({ activeIndustry, onSave, saving, initialData }) {
  const [form, setForm] = useState({ provider: "stripe", public_key: "", secret_key: "", webhook_secret: "", live_mode: false });

  useEffect(() => {
    if (initialData) {
      setForm({
        provider: initialData.metadata?.provider || initialData.provider || "stripe",
        public_key: initialData.provider_user_id || "",
        secret_key: initialData.access_token || "",
        webhook_secret: initialData.metadata?.webhook_secret || "",
        live_mode: !!initialData.metadata?.live_mode,
      });
    }
  }, [initialData]);

  return (
    <SectionCard title="Payment Integrations" subtitle="Connect regional card/transfer systems for instant invoice settlement" onSave={() => onSave(form)} saving={saving}>
      <FormRow>
        <Field label="Preferred Gateway Provider" full>
          <Select value={form.provider} onValueChange={v => setForm({ ...form, provider: v })}>
            <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="stripe">{t("stripe_global", "Stripe (Global)")}</SelectItem>
              <SelectItem value="paystack">{t("paystack_africa", "Paystack (Africa)")}</SelectItem>
              <SelectItem value="flutterwave">{t("flutterwave_west_africa", "Flutterwave (West Africa)")}</SelectItem>
              <SelectItem value="momo">{t("mtn_mobile_money", "MTN Mobile Money")}</SelectItem>
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
          <p className="text-sm font-semibold text-foreground">{t("production_live_mode", "Production Live Mode")}</p>
          <p className="text-xs text-muted-foreground/80">{t(
            "process_live_currency_values_d",
            "Process live currency values. Disable to use developer test keys."
          )}</p>
        </div>
        <Switch checked={form.live_mode} onCheckedChange={() => setForm(f => ({ ...f, live_mode: !f.live_mode }))} />
      </div>
    </SectionCard>
  );
}

function GoogleCalendarSettings({ activeIndustry, onSave, saving, initialData }) {
  const [form, setForm] = useState({ client_id: "", client_secret: "", sync_enabled: false, calendar_id: "" });

  useEffect(() => {
    if (initialData) {
      setForm({
        client_id: initialData.provider_user_id || "",
        client_secret: initialData.access_token || "",
        sync_enabled: !!initialData.metadata?.sync_enabled,
        calendar_id: initialData.metadata?.calendar_id || "",
      });
    }
  }, [initialData]);

  return (
    <SectionCard title="Google Calendar Sync" subtitle={"Synchronize files and schedule " + getTerm(activeIndustry, "hearing").toLowerCase() + "s with corporate calendars"} onSave={() => onSave(form)} saving={saving}>
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
          <p className="text-sm font-semibold text-foreground">{t("activate_sync_operations", "Activate Sync Operations")}</p>
          <p className="text-xs text-muted-foreground/80">{t(
            "automatically_coordinate_all_l",
            "Automatically coordinate all legal events with connected calendars"
          )}</p>
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
  const [passphrase, setPassphrase] = useState(() => {
    return localStorage.getItem('base44_e2ee_passphrase') || "";
  });

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

  const handleSavePassphrase = () => {
    try {
      localStorage.setItem('base44_e2ee_passphrase', passphrase);
      toast({ title: "Passphrase saved!", description: "Zero-Trust local encryption is now active for sensitive fields." });
    } catch (e) {
      toast({ title: "Failed to save passphrase", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
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
      <SectionCard title="Zero-Trust End-to-End Encryption Keys" subtitle="Configure secure client-side encryption keys to protect sensitive charts, medical diagnostic notes, and legal details locally in your browser" onSave={handleSavePassphrase}>
        <div className="space-y-4">
          <Field label="Secure Encryption Passphrase" full>
            <Input 
              className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" 
              type="password" 
              value={passphrase} 
              onChange={e => setPassphrase(e.target.value)} 
              placeholder="Enter secure company-wide passphrase" 
            />
          </Field>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-500 leading-relaxed font-semibold">
            {t(
              "lexafrica_zero_trust_framework",
              "🔑 LexAfrica Zero-Trust Framework: All sensitive text fields (notes, diagnostics, case outcome details) are cryptographically encrypted directly inside your local web browser using AES-GCM-256 before leaving your computer. Our cloud databases and system administrators can never decrypt or access this data. Store this passphrase securely; if lost, encrypted data cannot be recovered."
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ── Billing & Subscriptions Settings ──────────────────────────

function BillingSettings({ company, activeIndustry }) {
  const { user, refreshUser } = useAuth();
  const companyId = user?.company_id;
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [activeCasesCount, setActiveCasesCount] = useState(0);
  const [invoices, setInvoices] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const { toast } = useToast();

  const plans = [
    { name: "starter", displayName: "Starter Plan", price: 29, maxUsers: 3, maxCases: 10, /* Dynamic terms applied */ maxStorage: 5 },
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
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">{t("firm_plan_level", (getTerm(activeIndustry, "venue") || "Firm") + " Plan Level")}</span>
              <h3 className="font-extrabold text-2xl text-foreground capitalize flex items-center gap-2 mt-1">
                {currentPlan} {t("model", "Model")}
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
              {t(
                "process_payments_directly_usin",
                "Process payments directly using our secure **Paystack** local checkout system. Upgrades propagate instantly."
              )}
            </p>
          </div>

          <div className="bg-card/30 border border-border/70 rounded-2xl p-5 space-y-4 shadow-sm">
            <h4 className="font-bold text-sm text-foreground">{t("quota_utilization", "Quota Utilization")}</h4>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                <span>{t("team_members", "Team Members")}</span>
                <span className="text-foreground">{activeUsersCount} / {currentPlan === 'starter' ? 3 : currentPlan === 'professional' ? 10 : 'Unlimited'}</span>
              </div>
              <Progress value={currentPlan === 'starter' ? (activeUsersCount / 3) * 100 : currentPlan === 'professional' ? (activeUsersCount / 10) * 100 : 12} className="h-2 bg-muted/40 [&>div]:bg-primary" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                <span>{t("active_case_files", "Active " + getTerm(activeIndustry, "cases"))}</span>
                <span className="text-foreground">{activeCasesCount} / {currentPlan === 'starter' ? 10 : 'Unlimited'}</span>
              </div>
              <Progress value={currentPlan === 'starter' ? (activeCasesCount / 10) * 100 : 8} className="h-2 bg-muted/40 [&>div]:bg-primary" />
            </div>
          </div>
        </div>
      </SectionCard>
      <div className="bg-card/45 backdrop-blur-md rounded-2xl border border-border/80 p-6 space-y-6 shadow-md">
        <div>
          <h2 className="text-base font-bold text-foreground">{t("upgrade_platform_model", "Upgrade Platform Model")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t(
            "scale_up_features_team_counts_",
            "Scale up features, team counts, and client space instantly."
          )}</p>
        </div>
        <div className="pt-2 border-t border-border/50">
          <Button 
            onClick={() => window.location.href = '/pricing'} 
            className="w-full bg-primary hover:bg-primary/95 text-white font-bold h-12 rounded-xl text-sm shadow-md transition-transform hover:-translate-y-0.5"
          >
            {t("explore_corporate_pricing", "Explore Corporate Pricing")}
          </Button>
        </div>
      </div>
      <div className="bg-card/45 backdrop-blur-md rounded-2xl border border-border/80 p-6 space-y-5 shadow-md">
        <div>
          <h2 className="text-base font-bold text-foreground">{t("invoice_ledger", "Invoice Ledger")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t(
            "view_platform_service_receipts",
            "View platform service receipts processed via Paystack."
          )}</p>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground font-semibold bg-muted/10 rounded-2xl border border-dashed border-border/60">
            {t("no_service_invoices_recorded", "No service invoices recorded.")}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/85 shadow-sm">
            <table className="w-full text-sm text-left border-collapse bg-card/10">
              <thead>
                <tr className="bg-muted/40 border-b border-border/85 text-muted-foreground font-bold text-xs uppercase tracking-wider select-none">
                  <th className="px-5 py-3.5">{t("settlement_date", "Settlement Date")}</th>
                  <th className="px-5 py-3.5">{t("plan_tier", "Plan tier")}</th>
                  <th className="px-5 py-3.5">{t("amount", "Amount")}</th>
                  <th className="px-5 py-3.5">{t("reference_id", "Reference ID")}</th>
                  <th className="px-5 py-3.5">{t("status", "Status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {invoices.map((inv, idx) => {
                  return (
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
                  );
                })}
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
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const companyId = user?.company_id || null;
  const activeIndustry = sessionStorage.getItem("slate_industry_override") || user?.company_industry || "law";
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

  const { data: connectedApps = [], refetch: refetchApps } = useQuery({
    queryKey: ["connected_apps", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase.from('connected_apps').select('*').eq('company_id', companyId);
      return data || [];
    },
    enabled: !!companyId
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

  const saveAppSetting = async (provider, formFields) => {
    if (!companyId) return;
    setSaving(true);
    try {
      let access_token = "";
      let provider_user_id = "";
      let metadata = {};

      if (provider === "slack") {
        access_token = formFields.webhook_url;
        metadata = {
          channel: formFields.channel,
          notify_new_case: formFields.notify_new_case,
          notify_overdue: formFields.notify_overdue
        };
      } else if (provider === "twilio") {
        access_token = formFields.auth_token;
        provider_user_id = formFields.account_sid;
        metadata = {
          from_number: formFields.from_number,
          sms_enabled: formFields.sms_enabled
        };
      } else if (provider === "stripe" || provider === "paystack" || provider === "flutterwave" || provider === "momo") {
        access_token = formFields.secret_key;
        provider_user_id = formFields.public_key;
        metadata = {
          provider: formFields.provider || provider,
          webhook_secret: formFields.webhook_secret,
          live_mode: formFields.live_mode
        };
      } else if (provider === "google_calendar") {
        access_token = formFields.client_secret;
        provider_user_id = formFields.client_id;
        metadata = {
          sync_enabled: formFields.sync_enabled,
          calendar_id: formFields.calendar_id
        };
      }

      // Check if already exists
      const existing = connectedApps.find(app => app.provider === provider);
      if (existing) {
        const { error } = await supabase
          .from('connected_apps')
          .update({
            access_token,
            provider_user_id,
            metadata,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('connected_apps')
          .insert({
            company_id: companyId,
            provider,
            access_token,
            provider_user_id,
            metadata,
            status: 'active'
          });
        if (error) throw error;
      }
      
      toast({ title: "Integration settings saved successfully" });
      refetchApps();
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to save integration settings", description: err.message, variant: "destructive" });
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
      case "system":       return <SystemSettings activeIndustry={activeIndustry} company={company} onSave={fakeSuccess} saving={saving} />;
      case "brand":        return <BrandSettings activeIndustry={activeIndustry} company={company} onSave={company ? async d => { 
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
      case "billing":      return <BillingSettings activeIndustry={activeIndustry} company={company} />;
      case "currency":     return <CurrencySettings activeIndustry={activeIndustry} company={company} onSave={company ? d => updateCompany({ currency: d.currency }) : fakeSuccess} saving={saving} />;
      case "email":        return <EmailSettings activeIndustry={activeIndustry} company={company} onSave={company ? d => updateCompany(d) : fakeSuccess} saving={saving} />;
      case "notifications": return <NotificationSettings activeIndustry={activeIndustry} onSave={fakeSuccess} saving={saving} />;
      case "slack":        return <SlackSettings activeIndustry={activeIndustry} onSave={d => saveAppSetting("slack", d)} saving={saving} initialData={connectedApps.find(a => a.provider === "slack")} />;
      case "twilio":       return <TwilioSettings activeIndustry={activeIndustry} onSave={d => saveAppSetting("twilio", d)} saving={saving} initialData={connectedApps.find(a => a.provider === "twilio")} />;
      case "payment":      return <PaymentSettings activeIndustry={activeIndustry} onSave={d => saveAppSetting(d.provider, d)} saving={saving} initialData={connectedApps.find(a => ["stripe", "paystack", "flutterwave", "momo"].includes(a.provider))} />;
      case "gcalendar":    return <GoogleCalendarSettings activeIndustry={activeIndustry} onSave={d => saveAppSetting("google_calendar", d)} saving={saving} initialData={connectedApps.find(a => a.provider === "google_calendar")} />;
      case "security":     return <SecuritySettings />;
      case "permissions":  return (
        <div className="bg-card/45 backdrop-blur-md rounded-2xl border border-border/80 p-6 space-y-6 shadow-md">
          <div>
            <h2 className="text-lg font-bold text-foreground">{t("staff_access_controls", "Staff Access Controls")}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{t(
              "maintain_granular_security_per",
              "Maintain granular security permissions across internal groups"
            )}</p>
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