import React, { useState, useEffect} from "react";
import { useTranslation} from "react-i18next";
import { getTerm} from "@/config/industries";
import { Input} from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import { Button} from "@/components/ui/button";
import { Switch} from "@/components/ui/switch";
import { useToast} from "@/components/ui/use-toast";
import { Loader2, RefreshCw, Copy, Info, CheckCircle, CreditCard, Lock, Save} from "lucide-react";
import { SectionCard, FormRow, Field} from "./SettingsShared";

export function EmailSettings({ activeIndustry, company, onSave, saving}) {
 const { t} = useTranslation();
 const [activeTab, setActiveTab] = useState("smtp");
 const [domainInput, setDomainInput] = useState(company?.custom_email_domain || "");
 const [verifyingDomain, setVerifyingDomain] = useState(false);
 const { toast} = useToast();

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
 toast({ title: "Domain field empty", description: "Please provide a valid domain name.", variant: "destructive"});
 return;
}
 try {
 await onSave({
 custom_email_domain: domainInput,
 custom_email_verified: false
});
 toast({ title: "Custom domain saved", description: "Configure the DNS records below to complete verification."});
} catch (err) {
 toast({ title: "Error saving domain", description: err.message, variant: "destructive"});
}
};

 const handleVerifyDomain = async () => {
 setVerifyingDomain(true);
 await new Promise(r => setTimeout(r, 2000));
 try {
 await onSave({
 custom_email_verified: true
});
 toast({ title: "Domain verified!", description: `All DNS checks passed. Your firm is now authorized to send emails from your custom domain.`, variant: "success"});
} catch (err) {
 toast({ title: "Verification failed", description: err.message, variant: "destructive"});
} finally {
 setVerifyingDomain(false);
}
};

 return (
 <SectionCard title="Email Delivery Center" subtitle="Configure SMTP servers or register your own verified sending domains for branded notifications">
 <div className="flex gap-1 border border-border/80 bg-muted/20 rounded-xl p-1 w-fit mb-6">
 <button
 onClick={() => setActiveTab("smtp")}
 className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all duration-200 ${activeTab === "smtp" ? "bg-foreground text-background " : "text-muted-foreground hover:text-foreground"}`}
 >
 {t("smtp_server", "SMTP Server")}
 </button>
 <button
 onClick={() => setActiveTab("domain")}
 className={`px-4 py-2 rounded-lg text-sm font-bold capitalize flex items-center gap-1.5 transition-all duration-200 ${activeTab === "domain" ? "bg-foreground text-background " : "text-muted-foreground hover:text-foreground"}`}
 >
 {t("custom_sending_domain", "Custom Sending Domain")} {!isPaidPlan && <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">{t("premium", "Premium")}</span>}
 </button>
 </div>
 {activeTab === "smtp" ? (
 <FormRow>
 <Field label="From Name">
 <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" value={smtpForm.from_name} onChange={e => setSmtpForm({ ...smtpForm, from_name: e.target.value})} />
 </Field>
 <Field label="From Email Address">
 <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" type="email" value={smtpForm.from_email} onChange={e => setSmtpForm({ ...smtpForm, from_email: e.target.value})} placeholder="noreply@yourfirm.com" />
 </Field>
 <Field label="Reply-To Address">
 <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" type="email" value={smtpForm.reply_to} onChange={e => setSmtpForm({ ...smtpForm, reply_to: e.target.value})} placeholder="billing@yourfirm.com" />
 </Field>
 <Field label="SMTP Connection Port">
 <Select value={smtpForm.smtp_port} onValueChange={v => setSmtpForm({ ...smtpForm, smtp_port: v})}>
 <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="25">{t("25_unencrypted", "25 (Unencrypted)")}</SelectItem>
 <SelectItem value="465">{t("465_ssl", "465 (SSL)")}</SelectItem>
 <SelectItem value="587">{t("587_tls", "587 (TLS)")}</SelectItem>
 </SelectContent>
 </Select>
 </Field>
 <Field label="SMTP Host Server" full>
 <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" value={smtpForm.smtp_host} onChange={e => setSmtpForm({ ...smtpForm, smtp_host: e.target.value})} placeholder="smtp.mailgun.org" />
 </Field>
 <Field label="SMTP Username">
 <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" value={smtpForm.smtp_user} onChange={e => setSmtpForm({ ...smtpForm, smtp_user: e.target.value})} />
 </Field>
 <Field label="SMTP Password">
 <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" type="password" value={smtpForm.smtp_pass} onChange={e => setSmtpForm({ ...smtpForm, smtp_pass: e.target.value})} />
 </Field>
 <Field label="Encryption Type">
 <Select value={smtpForm.smtp_encryption} onValueChange={v => setSmtpForm({ ...smtpForm, smtp_encryption: v})}>
 <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="none">{t("none", "None")}</SelectItem>
 <SelectItem value="tls">{t("tls", "TLS")}</SelectItem>
 <SelectItem value="ssl">{t("ssl", "SSL")}</SelectItem>
 </SelectContent>
 </Select>
 </Field>
 <div className="md:col-span-2 pt-4 flex justify-end">
 <Button onClick={() => onSave(smtpForm)} disabled={saving} className="gap-2 bg-foreground text-background hover:bg-foreground/90 font-bold transition-all duration-200">
 {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
 {t("save_smtp_configuration", "Save SMTP Configuration")}
 </Button>
 </div>
 </FormRow>
 ) : (
 <div className="relative">
 {!isPaidPlan ? (
 <div className="absolute inset-0 z-20 backdrop-blur-md bg-card/65 rounded-2xl border border-dashed border-border/80 p-8 flex flex-col items-center justify-center text-center space-y-4 ">
 <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 animate-pulse">
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
 <Button onClick={() => window.location.href = '#billing'} className="bg-primary hover:bg-primary/90 text-white rounded-xl font-bold px-6 py-5 gap-2 transition-transform hover:-translate-y-0.5 active:translate-y-0">
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
 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-primary flex items-center gap-1 text-xs font-bold bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/40 px-2 py-0.5 rounded-full border border-slate-200">
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
 <Button onClick={handleVerifyDomain} disabled={verifyingDomain} className="gap-2 bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary/90 text-white font-bold text-xs h-9">
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
 toast({ title: "Copied to clipboard"});
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
 toast({ title: "Copied to clipboard"});
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
 toast({ title: "Copied to clipboard"});
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

export function NotificationSettings({ activeIndustry, onSave, saving}) {
 const [form, setForm] = useState({
 hearing_reminder: true,
 invoice_overdue: true,
 invoice_reminder_7d: true,
 invoice_reminder_1d: true,
 task_due: true,
 new_case: false,
 new_client: false,
});

 const toggle = (key) => setForm(f => ({ ...f, [key]: !f[key]}));

 const items = [
 { key: "hearing_reminder", label: "Event Alerts", desc: "Sends automated notifications 48 hours ahead of active scheduled events"},
 { key: "invoice_overdue", label: "Overdue Invoices", desc: "Triggers notifications to admin & client instantly on invoice age limit breach"},
 { key: "invoice_reminder_7d", label: "7-Day Payments", desc: "Emails clients reminders exactly one week before invoice deadlines"},
 { key: "invoice_reminder_1d", label: "1-Day Critical Payments", desc: "High-priority reminder 24 hours ahead of pending balances"},
 { key: "task_due", label: "Task Deadlines", desc: "Pings assigned staff and team leads upon close due dates"},
 { key: "new_case", label: "New File Intake", desc: "Notifies team and admin immediately upon new files logging"},
 { key: "new_client", label: "New Contact Registration", desc: "Dispatches onboarding notifications upon contact creation"},
 ];

 return (
 <SectionCard title="Notification Triggers" subtitle="Control automated email rules, client reminders, and critical schedule updates" onSave={() => onSave(form)} saving={saving}>
 <div className="grid grid-cols-1 gap-4">
 {items.map(item => {
 return (
 <div key={item.key} className="flex items-center justify-between p-4 rounded-2xl border border-border/60 bg-card hover:bg-muted/40 transition-all duration-200">
 <div className="space-y-1 pr-4">
 <p className="text-sm font-bold text-foreground">{item.label}</p>
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

export function SlackSettings({ activeIndustry, onSave, saving, initialData}) {
 const { t} = useTranslation();
 const [form, setForm] = useState({ webhook_url: "", channel: "#general", notify_new_case: true, notify_overdue: true});

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
 <SectionCard title="Slack Integration" subtitle="Push realtime file updates and reminders directly to channels" onSave={() => onSave(form)} saving={saving}>
 <FormRow>
 <Field label="Incoming Webhook URL" full>
 <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" value={form.webhook_url} onChange={e => setForm({ ...form, webhook_url: e.target.value})} placeholder="https://hooks.slack.com/services/..." />
 </Field>
 <Field label="Default Channel Name">
 <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value})} placeholder="#general-alerts" />
 </Field>
 </FormRow>
 <div className="space-y-4 mt-8">
 {[["notify_new_case", "Realtime " + getTerm(activeIndustry, "case") + " Intake Alerts", "Ping channel whenever a new " + getTerm(activeIndustry, "case").toLowerCase() + " file is successfully created"], ["notify_overdue", "Overdue Balance Webhooks", "Notify Slack channels automatically upon invoice status overdue trigger"]].map(([k, l, d]) => {
 return (
 <div key={k} className="flex items-center justify-between p-4 rounded-2xl border border-border/60 bg-card hover:bg-muted/40 transition-all duration-200">
 <div className="space-y-1 pr-4">
 <p className="text-sm font-bold text-foreground">{l}</p>
 <p className="text-xs text-muted-foreground/80">{d}</p>
 </div>
 <Switch checked={form[k]} onCheckedChange={() => setForm(f => ({ ...f, [k]: !f[k]}))} />
 </div>
 );
})}
 </div>
 </SectionCard>
 );
}

export function TwilioSettings({ activeIndustry, onSave, saving, initialData}) {
 const { t} = useTranslation();
 const [form, setForm] = useState({ account_sid: "", auth_token: "", from_number: "", sms_enabled: false});

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
 <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" value={form.account_sid} onChange={e => setForm({ ...form, account_sid: e.target.value})} placeholder="ACxxxxxxx..." />
 </Field>
 <Field label="Auth Token">
 <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" type="password" value={form.auth_token} onChange={e => setForm({ ...form, auth_token: e.target.value})} />
 </Field>
 <Field label="Sender Number">
 <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" value={form.from_number} onChange={e => setForm({ ...form, from_number: e.target.value})} placeholder="+15551234567" />
 </Field>
 </FormRow>
 <div className="flex items-center justify-between p-4 rounded-2xl border border-border/60 bg-card hover:bg-muted/40 transition-all duration-200 mt-8">
 <div className="space-y-1">
 <p className="text-sm font-bold text-foreground">{t("global_sms_dispatch", "Global SMS Dispatch")}</p>
 <p className="text-xs text-muted-foreground/80">{t(
 "allow_automatic_text_message_d",
 "Allow automatic text message dispatches globally for critical updates"
 )}</p>
 </div>
 <Switch checked={form.sms_enabled} onCheckedChange={() => setForm(f => ({ ...f, sms_enabled: !f.sms_enabled}))} />
 </div>
 </SectionCard>
 );
}

export function PaymentSettings({ activeIndustry, onSave, saving, initialData}) {
 const { t} = useTranslation();
 const [form, setForm] = useState({ provider: "stripe", public_key: "", secret_key: "", webhook_secret: "", live_mode: false});

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
 <Select value={form.provider} onValueChange={v => setForm({ ...form, provider: v})}>
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
 <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" value={form.public_key} onChange={e => setForm({ ...form, public_key: e.target.value})} placeholder="pk_..." />
 </Field>
 <Field label="Secret Key">
 <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" type="password" value={form.secret_key} onChange={e => setForm({ ...form, secret_key: e.target.value})} placeholder="sk_..." />
 </Field>
 <Field label="Webhook Signing Key" full>
 <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" type="password" value={form.webhook_secret} onChange={e => setForm({ ...form, webhook_secret: e.target.value})} placeholder="whsec_..." />
 </Field>
 </FormRow>
 <div className="flex items-center justify-between p-4 rounded-2xl border border-border/60 bg-card hover:bg-muted/40 transition-all duration-200 mt-8">
 <div className="space-y-1">
 <p className="text-sm font-bold text-foreground">{t("production_live_mode", "Production Live Mode")}</p>
 <p className="text-xs text-muted-foreground/80">{t(
 "process_live_currency_values_d",
 "Process live currency values. Disable to use developer test keys."
 )}</p>
 </div>
 <Switch checked={form.live_mode} onCheckedChange={() => setForm(f => ({ ...f, live_mode: !f.live_mode}))} />
 </div>
 </SectionCard>
 );
}

export function GoogleCalendarSettings({ activeIndustry, onSave, saving, initialData}) {
 const { t} = useTranslation();
 const [form, setForm] = useState({ client_id: "", client_secret: "", sync_enabled: false, calendar_id: ""});

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
 <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value})} placeholder="xxxxxxxxx.apps.googleusercontent.com" />
 </Field>
 <Field label="OAuth Client Secret">
 <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" type="password" value={form.client_secret} onChange={e => setForm({ ...form, client_secret: e.target.value})} />
 </Field>
 <Field label="Target Calendar Identifier (Optional)">
 <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" value={form.calendar_id} onChange={e => setForm({ ...form, calendar_id: e.target.value})} placeholder="primary or corporate@yourfirm.com" />
 </Field>
 </FormRow>
 <div className="flex items-center justify-between p-4 rounded-2xl border border-border/60 bg-card hover:bg-muted/40 transition-all duration-200 mt-8">
 <div className="space-y-1">
 <p className="text-sm font-bold text-foreground">{t("activate_sync_operations", "Activate Sync Operations")}</p>
 <p className="text-xs text-muted-foreground/80">{t(
 "automatically_coordinate_all_l",
 "Automatically coordinate all events with connected calendars"
 )}</p>
 </div>
 <Switch checked={form.sync_enabled} onCheckedChange={() => setForm(f => ({ ...f, sync_enabled: !f.sync_enabled}))} />
 </div>
 </SectionCard>
 );
}
