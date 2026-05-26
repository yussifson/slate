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
import { useImpersonation } from "@/lib/ImpersonationContext";
import { isSuperAdmin } from "@/lib/constants";
import { getSubdomainAndBase } from "@/lib/domainUtils";
import { initiatePaystackSubscription } from "@/lib/paystack";
import {
  Settings2, Palette, DollarSign, Mail, Bell,
  MessageSquare, Phone, CreditCard, Calendar, Save, Upload, ShieldCheck, Lock, Check, Loader2, Sparkles
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
  { id: "system",      label: "System Settings",              icon: Settings2 },
  { id: "brand",       label: "Brand Settings",               icon: Palette },
  { id: "billing",     label: "Billing & Subscriptions",      icon: CreditCard },
  { id: "currency",    label: "Currency Settings",            icon: DollarSign },
  { id: "security",    label: "Security & Passwords",         icon: Lock },
  { id: "permissions", label: "Staff Permissions",            icon: ShieldCheck },
  { id: "email",       label: "Email Settings",               icon: Mail },
  { id: "notifications", label: "Email Notification Settings", icon: Bell },
  { id: "slack",       label: "Slack Settings",               icon: MessageSquare },
  { id: "twilio",      label: "Twilio Settings",              icon: Phone },
  { id: "payment",     label: "Payment Settings",             icon: Settings2 },
  { id: "gcalendar",   label: "Google Calendar Settings",     icon: Calendar },
];

function SectionCard({ title, subtitle, onSave, saving, children }) {
  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {onSave && (
          <Button onClick={onSave} disabled={saving} size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}

function FormRow({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, children, full }) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label className="text-xs font-medium text-foreground">{label}</Label>
      {children}
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
    <SectionCard title="System Settings" subtitle="Configure system-wide settings for your application" onSave={() => onSave(form)} saving={saving}>
      <FormRow>
        <Field label="Application Theme">
          <Select value={theme} onValueChange={changeTheme}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="light">☀️ Light Mode</SelectItem>
              <SelectItem value="dark">🌙 Dark Mode</SelectItem>
              <SelectItem value="system">💻 System Theme</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Default Language">
          <Select value={form.language} onValueChange={v => setForm({ ...form, language: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">🇬🇧 English</SelectItem>
              <SelectItem value="fr">🇫🇷 French</SelectItem>
              <SelectItem value="pt">🇵🇹 Portuguese</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Date Format">
          <Select value={form.date_format} onValueChange={v => setForm({ ...form, date_format: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
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
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="H:i">H:i (13:30)</SelectItem>
              <SelectItem value="h:i A">h:i A (01:30 PM)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Calendar Start Day">
          <Select value={form.calendar_start} onValueChange={v => setForm({ ...form, calendar_start: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sunday">Sunday</SelectItem>
              <SelectItem value="monday">Monday</SelectItem>
              <SelectItem value="saturday">Saturday</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Default Timezone" full>
          <Select value={form.timezone} onValueChange={v => setForm({ ...form, timezone: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
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
    <SectionCard title="Brand Settings" subtitle="Customize your application's branding and appearance" onSave={handleSaveClick} saving={saving}>
      <div className="flex gap-1 border border-border rounded-lg p-1 w-fit">
        {["logos", "text", "theme"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${tab === t ? "bg-green-600 text-white" : "text-muted-foreground hover:text-foreground"}`}
          >{t}</button>
        ))}
      </div>

      {tab === "logos" && (
        <FormRow>
          <Field label="Logo URL (Dark Background)">
            <Input placeholder="https://..." value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })} />
            {form.logo_url && <img src={form.logo_url} alt="Logo preview" className="mt-2 h-10 object-contain rounded border border-border" />}
          </Field>
          <Field label="Favicon URL" full>
            <Input placeholder="https://..." value={form.favicon_url || ""} onChange={e => setForm({ ...form, favicon_url: e.target.value })} />
          </Field>
        </FormRow>
      )}

      {tab === "text" && (
        <FormRow>
          <Field label="Application Name">
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Custom Subdomain">
            <div className="flex items-center">
              <Input placeholder="yourfirm" value={form.subdomain} onChange={e => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} className="rounded-r-none" />
              <div className="bg-muted border border-l-0 border-border text-muted-foreground px-3 py-2 text-sm rounded-r-md whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">.{getSubdomainAndBase().baseDomain}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Changing this will instantly log you out and redirect you.</p>
          </Field>
          <Field label="Tagline / Slogan" full>
            <Input placeholder="e.g. Legal Excellence in Africa" value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} />
          </Field>
        </FormRow>
      )}

      {tab === "theme" && (
        <div className="space-y-4">
          <Field label="Primary Color">
            <div className="flex items-center gap-3">
              <input type="color" value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} className="w-10 h-10 rounded border border-border cursor-pointer" />
              <Input value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} className="w-32" />
              <div className="flex gap-2">
                {["#16a34a", "#2563eb", "#9333ea", "#dc2626"].map(c => (
                  <button key={c} onClick={() => setForm({ ...form, primary_color: c })} className="w-6 h-6 rounded-full border-2 border-white shadow" style={{ background: c }} />
                ))}
              </div>
            </div>
          </Field>
        </div>
      )}

      <AlertDialog open={showSubdomainAlert} onOpenChange={setShowSubdomainAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Subdomain?</AlertDialogTitle>
            <AlertDialogDescription>
              After saving, an automatic refresh will happen to take you to the new subdomain. 
              The old subdomain will be out of use completely forever.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowSubdomainAlert(false);
              onSave(form);
            }} className="bg-red-600 hover:bg-red-700 text-white">Continue and Change</AlertDialogAction>
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
    <SectionCard title="Currency Settings" subtitle="Configure how currency values are displayed" onSave={() => onSave({ currency: form.currency })} saving={saving}>
      <FormRow>
        <Field label="Default Currency">
          <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
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
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="before">Before amount (GH₵100)</SelectItem>
              <SelectItem value="after">After amount (100 GH₵)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Decimal Separator">
          <Select value={form.decimal_separator} onValueChange={v => setForm({ ...form, decimal_separator: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value=".">Period ( . )</SelectItem>
              <SelectItem value=",">Comma ( , )</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Thousands Separator">
          <Select value={form.thousands_separator} onValueChange={v => setForm({ ...form, thousands_separator: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value=",">, (comma)</SelectItem>
              <SelectItem value=".">. (period)</SelectItem>
              <SelectItem value=" ">Space</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Decimal Places">
          <Select value={form.decimal_places} onValueChange={v => setForm({ ...form, decimal_places: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
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

function EmailSettings({ onSave, saving }) {
  const [form, setForm] = useState({
    from_name: "Optalflow",
    from_email: "",
    reply_to: "",
    smtp_host: "",
    smtp_port: "587",
    smtp_user: "",
    smtp_pass: "",
    smtp_encryption: "tls",
  });

  return (
    <SectionCard title="Email Settings" subtitle="Configure outgoing email server (SMTP)" onSave={() => onSave(form)} saving={saving}>
      <FormRow>
        <Field label="From Name">
          <Input value={form.from_name} onChange={e => setForm({ ...form, from_name: e.target.value })} />
        </Field>
        <Field label="From Email">
          <Input type="email" value={form.from_email} onChange={e => setForm({ ...form, from_email: e.target.value })} placeholder="noreply@yourfirm.com" />
        </Field>
        <Field label="Reply-To Email">
          <Input type="email" value={form.reply_to} onChange={e => setForm({ ...form, reply_to: e.target.value })} placeholder="billing@yourfirm.com" />
        </Field>
        <Field label="SMTP Port">
          <Select value={form.smtp_port} onValueChange={v => setForm({ ...form, smtp_port: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="465">465 (SSL)</SelectItem>
              <SelectItem value="587">587 (TLS)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="SMTP Host" full>
          <Input value={form.smtp_host} onChange={e => setForm({ ...form, smtp_host: e.target.value })} placeholder="smtp.gmail.com" />
        </Field>
        <Field label="SMTP Username">
          <Input value={form.smtp_user} onChange={e => setForm({ ...form, smtp_user: e.target.value })} />
        </Field>
        <Field label="SMTP Password">
          <Input type="password" value={form.smtp_pass} onChange={e => setForm({ ...form, smtp_pass: e.target.value })} />
        </Field>
        <Field label="Encryption">
          <Select value={form.smtp_encryption} onValueChange={v => setForm({ ...form, smtp_encryption: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="tls">TLS</SelectItem>
              <SelectItem value="ssl">SSL</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FormRow>
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
    { key: "hearing_reminder",    label: "Hearing Reminders",              desc: "48h before scheduled hearings" },
    { key: "invoice_overdue",     label: "Overdue Invoice Alerts",         desc: "Email client + admin when invoice goes overdue" },
    { key: "invoice_reminder_7d", label: "7-Day Payment Reminders",        desc: "Email client 7 days before due date" },
    { key: "invoice_reminder_1d", label: "1-Day Payment Reminders",        desc: "Email client 1 day before due date" },
    { key: "task_due",            label: "Task Due Date Alerts",           desc: "Notify assignee when a task is due" },
    { key: "new_case",            label: "New Case Notifications",         desc: "Notify admin when a new case is created" },
    { key: "new_client",          label: "New Client Notifications",       desc: "Notify admin when a new client is added" },
  ];

  return (
    <SectionCard title="Email Notification Settings" subtitle="Control which automated email notifications are sent" onSave={() => onSave(form)} saving={saving}>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
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
    <SectionCard title="Slack Settings" subtitle="Send notifications to your Slack workspace" onSave={() => onSave(form)} saving={saving}>
      <FormRow>
        <Field label="Slack Webhook URL" full>
          <Input value={form.webhook_url} onChange={e => setForm({ ...form, webhook_url: e.target.value })} placeholder="https://hooks.slack.com/services/..." />
        </Field>
        <Field label="Default Channel">
          <Input value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })} placeholder="#legal-alerts" />
        </Field>
      </FormRow>
      <div className="space-y-2">
        {[["notify_new_case", "Notify on new case"], ["notify_overdue", "Notify on overdue invoice"]].map(([k, l]) => (
          <div key={k} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
            <p className="text-sm">{l}</p>
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
    <SectionCard title="Twilio Settings" subtitle="Send SMS notifications via Twilio" onSave={() => onSave(form)} saving={saving}>
      <FormRow>
        <Field label="Account SID">
          <Input value={form.account_sid} onChange={e => setForm({ ...form, account_sid: e.target.value })} placeholder="ACxxxxxxx..." />
        </Field>
        <Field label="Auth Token">
          <Input type="password" value={form.auth_token} onChange={e => setForm({ ...form, auth_token: e.target.value })} />
        </Field>
        <Field label="From Phone Number">
          <Input value={form.from_number} onChange={e => setForm({ ...form, from_number: e.target.value })} placeholder="+15551234567" />
        </Field>
      </FormRow>
      <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
        <div>
          <p className="text-sm font-medium">Enable SMS Notifications</p>
          <p className="text-xs text-muted-foreground">Send SMS reminders for hearings and overdue invoices</p>
        </div>
        <Switch checked={form.sms_enabled} onCheckedChange={() => setForm(f => ({ ...f, sms_enabled: !f.sms_enabled }))} />
      </div>
    </SectionCard>
  );
}

function PaymentSettings({ onSave, saving }) {
  const [form, setForm] = useState({ provider: "stripe", public_key: "", secret_key: "", webhook_secret: "", live_mode: false });

  return (
    <SectionCard title="Payment Settings" subtitle="Configure your payment gateway integration" onSave={() => onSave(form)} saving={saving}>
      <FormRow>
        <Field label="Payment Provider" full>
          <Select value={form.provider} onValueChange={v => setForm({ ...form, provider: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="stripe">Stripe</SelectItem>
              <SelectItem value="paystack">Paystack</SelectItem>
              <SelectItem value="flutterwave">Flutterwave</SelectItem>
              <SelectItem value="momo">MTN Mobile Money</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Public / API Key">
          <Input value={form.public_key} onChange={e => setForm({ ...form, public_key: e.target.value })} placeholder="pk_..." />
        </Field>
        <Field label="Secret Key">
          <Input type="password" value={form.secret_key} onChange={e => setForm({ ...form, secret_key: e.target.value })} placeholder="sk_..." />
        </Field>
        <Field label="Webhook Secret" full>
          <Input type="password" value={form.webhook_secret} onChange={e => setForm({ ...form, webhook_secret: e.target.value })} placeholder="whsec_..." />
        </Field>
      </FormRow>
      <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
        <div>
          <p className="text-sm font-medium">Live Mode</p>
          <p className="text-xs text-muted-foreground">Toggle off to use test/sandbox credentials</p>
        </div>
        <Switch checked={form.live_mode} onCheckedChange={() => setForm(f => ({ ...f, live_mode: !f.live_mode }))} />
      </div>
    </SectionCard>
  );
}

function GoogleCalendarSettings({ onSave, saving }) {
  const [form, setForm] = useState({ client_id: "", client_secret: "", sync_enabled: false, calendar_id: "" });

  return (
    <SectionCard title="Google Calendar Settings" subtitle="Sync hearings with Google Calendar" onSave={() => onSave(form)} saving={saving}>
      <FormRow>
        <Field label="Google Client ID">
          <Input value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} placeholder="xxxxxxxxx.apps.googleusercontent.com" />
        </Field>
        <Field label="Google Client Secret">
          <Input type="password" value={form.client_secret} onChange={e => setForm({ ...form, client_secret: e.target.value })} />
        </Field>
        <Field label="Calendar ID (optional)">
          <Input value={form.calendar_id} onChange={e => setForm({ ...form, calendar_id: e.target.value })} placeholder="primary or specific@group.calendar.google.com" />
        </Field>
      </FormRow>
      <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
        <div>
          <p className="text-sm font-medium">Enable Calendar Sync</p>
          <p className="text-xs text-muted-foreground">Automatically sync hearings to/from Google Calendar</p>
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
    <SectionCard title="Security & Passwords" subtitle="Update your account password" onSave={handleUpdatePassword} saving={saving}>
      <FormRow>
        <Field label="New Password">
          <Input type="password" value={form.new_password} onChange={e => setForm({ ...form, new_password: e.target.value })} placeholder="Enter new password" />
        </Field>
        <Field label="Confirm New Password">
          <Input type="password" value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} placeholder="Confirm new password" />
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
      // 1. Fetch users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);
      if (usersCount !== null) setActiveUsersCount(usersCount);

      // 2. Fetch cases count
      const { count: casesCount } = await supabase
        .from('legal_cases')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);
      if (casesCount !== null) setActiveCasesCount(casesCount);

      // 3. Fetch invoices
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
          // 1. Update company record in Supabase
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

          // 2. Add invoice entry
          await supabase.from('subscription_invoices').insert({
            company_id: companyId,
            amount: plan.price,
            status: 'paid',
            plan_name: plan.displayName,
            paystack_ref: response.reference
          });

          // Refresh user & UI
          await refreshUser();
          toast({ title: "Successfully Subscribed!", description: `Your firm is now active on the ${plan.displayName}.` });
          
          // Re-fetch invoices
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
      <SectionCard title="Current Subscription Plan" subtitle="Manage your active subscriptions and check quota allocations">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Plan Info */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Active Plan</span>
              <h3 className="font-extrabold text-2xl text-slate-900 capitalize flex items-center gap-2">
                {currentPlan} Plan
                <span className={`text-[10px] font-bold uppercase py-0.5 px-2 rounded-full border ${
                  currentStatus === 'active' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                    : 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
                }`}>
                  {currentStatus}
                </span>
              </h3>
            </div>
            <div className="text-sm text-slate-600 leading-relaxed">
              Accept credit card or bank payments locally via our secure **Paystack** checkout. Upgrades take effect instantly.
            </div>
          </div>

          {/* Usage Quotas */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h4 className="font-bold text-sm text-slate-900">Resource Quota Usage</h4>
            
            {/* Users */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>Active Users</span>
                <span>{activeUsersCount} / {currentPlan === 'starter' ? 3 : currentPlan === 'professional' ? 10 : 'Unlimited'}</span>
              </div>
              <Progress value={currentPlan === 'starter' ? (activeUsersCount / 3) * 100 : currentPlan === 'professional' ? (activeUsersCount / 10) * 100 : 10} className="h-2 bg-slate-100 [&>div]:bg-primary animate-pulse" />
            </div>

            {/* Cases */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>Active Cases</span>
                <span>{activeCasesCount} / {currentPlan === 'starter' ? 10 : 'Unlimited'}</span>
              </div>
              <Progress value={currentPlan === 'starter' ? (activeCasesCount / 10) * 100 : 5} className="h-2 bg-slate-100 [&>div]:bg-primary" />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Choose Plan Section */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">Available Subscription Plans</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Upgrade or downgrade your practice plan seamlessly via Paystack.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p, idx) => {
            const isCurrent = currentPlan === p.name;
            return (
              <div key={idx} className={`border rounded-xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow bg-white ${isCurrent ? 'border-primary shadow-sm' : 'border-slate-150'}`}>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{p.displayName}</h3>
                  <div className="my-3">
                    <span className="text-2xl font-black text-slate-900">${p.price}</span>
                    <span className="text-slate-400 text-xs">/mo</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-600 mb-6">
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary shrink-0" /> {p.maxUsers === 999 ? 'Unlimited' : `${p.maxUsers} Users`}</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary shrink-0" /> {p.maxCases === 9999 ? 'Unlimited' : `${p.maxCases} Cases`}</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary shrink-0" /> {p.maxStorage} GB Storage</li>
                  </ul>
                </div>

                <Button
                  onClick={() => handleSubscribe(p)}
                  disabled={isCurrent || loadingPlan !== null}
                  className={`w-full py-4 text-xs font-bold ${
                    isCurrent 
                      ? 'bg-slate-100 hover:bg-slate-100 text-slate-405 border border-slate-200 cursor-not-allowed text-slate-400' 
                      : 'bg-primary hover:bg-primary/95 text-white'
                  }`}
                >
                  {loadingPlan === p.name ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : isCurrent ? (
                    "Current Plan"
                  ) : (
                    "Select Plan"
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoice History */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Billing Invoice History</h2>
          <p className="text-sm text-muted-foreground mt-0.5">View and download transaction receipts processed via Paystack.</p>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No subscription invoices recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-150">
            <table className="w-full text-sm text-left border-collapse bg-white">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Plan Name</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Payment Ref</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5 text-slate-600 font-medium">
                      {new Date(inv.created_date || inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{inv.plan_name}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">${inv.amount}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-400">{inv.paystack_ref}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex py-0.5 px-2.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
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
      toast({ title: "Settings saved" });
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
    toast({ title: "Settings saved" });
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
            
            // Pass session via query parameters so AuthContext can manually restore it synchronously
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token && session?.refresh_token) {
              url += `?access_token=${session.access_token}&refresh_token=${session.refresh_token}`;
            }
            
            // Force redirect immediately
            window.location.href = url;
          }
        } catch (err) {
          console.error("Failed to save brand settings", err);
        }
      } : fakeSuccess} saving={saving} />;
      case "billing":      return <BillingSettings company={company} />;
      case "currency":     return <CurrencySettings company={company} onSave={company ? d => updateCompany({ currency: d.currency }) : fakeSuccess} saving={saving} />;
      case "email":        return <EmailSettings onSave={fakeSuccess} saving={saving} />;
      case "notifications":return <NotificationSettings onSave={fakeSuccess} saving={saving} />;
      case "slack":        return <SlackSettings onSave={fakeSuccess} saving={saving} />;
      case "twilio":       return <TwilioSettings onSave={fakeSuccess} saving={saving} />;
      case "payment":      return <PaymentSettings onSave={fakeSuccess} saving={saving} />;
      case "gcalendar":    return <GoogleCalendarSettings onSave={fakeSuccess} saving={saving} />;
      case "security":     return <SecuritySettings />;
      case "permissions":  return (
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold">Staff Permissions</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Control what each staff member can access and do</p>
          </div>
          <StaffPermissionsSettings />
        </div>
      );
      default:             return null;
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" subtitle="Manage system, brand, and integration settings" />
      <div className="flex gap-6 items-start">
        {/* Left nav */}
        <div className="w-56 shrink-0 bg-card rounded-xl border border-border overflow-hidden">
          {SECTIONS.map(s => {
            const IconComp = s.icon;
            const active = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors ${active ? "bg-primary/10 text-primary font-medium border-l-2 border-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                <IconComp className="w-4 h-4 shrink-0" />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}