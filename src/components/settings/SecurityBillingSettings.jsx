import React, { useState, useEffect} from "react";
import { useTranslation} from "react-i18next";
import { getTerm} from "@/config/industries";
import { base44} from "@/api/base44Client";
import { supabase} from "@/api/supabaseClient";
import { useAuth} from "@/lib/AuthContext";
import { useToast} from "@/components/ui/use-toast";
import { Input} from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import { Button} from "@/components/ui/button";
import { Progress} from "@/components/ui/progress";
import { SectionCard, FormRow, Field} from "./SettingsShared";

export function CurrencySettings({ activeIndustry, company, onSave, saving}) {
 const { t} = useTranslation();
 const [form, setForm] = useState({
 currency: company?.currency || "GHS",
 currency_position: "before",
 decimal_separator: ".",
 thousands_separator: ",",
 decimal_places: "2",
});

 useEffect(() => {
 if (company?.currency) {
 setForm(prev => ({ ...prev, currency: company.currency}));
}
}, [company]);

 return (
 <SectionCard title="Currency Settings" subtitle="Configure defaults for billing values, separator layout, and local symbols" onSave={() => onSave({ currency: form.currency})} saving={saving}>
 <FormRow>
 <Field label="System Default Currency">
 <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v})}>
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
 <Select value={form.currency_position} onValueChange={v => setForm({ ...form, currency_position: v})}>
 <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="before">{t("before_amount_gh_100", "Before amount (GH₵100)")}</SelectItem>
 <SelectItem value="after">{t("after_amount_100_gh", "After amount (100 GH₵)")}</SelectItem>
 </SelectContent>
 </Select>
 </Field>
 <Field label="Decimal Separator">
 <Select value={form.decimal_separator} onValueChange={v => setForm({ ...form, decimal_separator: v})}>
 <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value=".">{t("period", "Period ( . )")}</SelectItem>
 <SelectItem value=",">{t("comma", "Comma ( , )")}</SelectItem>
 </SelectContent>
 </Select>
 </Field>
 <Field label="Thousands Separator">
 <Select value={form.thousands_separator} onValueChange={v => setForm({ ...form, thousands_separator: v})}>
 <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value=",">{t("comma", ", (comma)")}</SelectItem>
 <SelectItem value=".">{t("period", ". (period)")}</SelectItem>
 <SelectItem value=" ">{t("space", "Space")}</SelectItem>
 </SelectContent>
 </Select>
 </Field>
 <Field label="Decimal Places">
 <Select value={form.decimal_places} onValueChange={v => setForm({ ...form, decimal_places: v})}>
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

export function SecuritySettings() {
 const { t} = useTranslation();
 const { toast} = useToast();
 const [form, setForm] = useState({ new_password: "", confirm_password: ""});
 const [saving, setSaving] = useState(false);
 const [passphrase, setPassphrase] = useState(() => {
 return localStorage.getItem('base44_e2ee_passphrase') || "";
});

 const handleUpdatePassword = async () => {
 if (!form.new_password) return;
 if (form.new_password !== form.confirm_password) {
 toast({ title: "Passwords do not match", variant: "destructive"});
 return;
}
 if (form.new_password.length < 6) {
 toast({ title: "Password must be at least 6 characters", variant: "destructive"});
 return;
}
 setSaving(true);
 try {
 await base44.auth.updateUser({ password: form.new_password});
 toast({ title: "Password updated successfully"});
 setForm({ new_password: "", confirm_password: ""});
} catch (err) {
 toast({ title: "Failed to update password", description: err.message, variant: "destructive"});
} finally {
 setSaving(false);
}
};

 const handleSavePassphrase = () => {
 try {
 localStorage.setItem('base44_e2ee_passphrase', passphrase);
 toast({ title: "Passphrase saved!", description: "Zero-Trust local encryption is now active for sensitive fields."});
} catch (e) {
 toast({ title: "Failed to save passphrase", variant: "destructive"});
}
};

 return (
 <div className="space-y-6">
 <SectionCard title="Access Security" subtitle="Update account authorization credentials" onSave={handleUpdatePassword} saving={saving}>
 <FormRow>
 <Field label="New Secure Password">
 <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" type="password" value={form.new_password} onChange={e => setForm({ ...form, new_password: e.target.value})} placeholder="Enter new password" />
 </Field>
 <Field label="Confirm Security Password">
 <Input className="h-11 bg-muted/20 border-border/60 focus:border-primary/80 transition-colors" type="password" value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value})} placeholder="Confirm new password" />
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
 "🔑 Zero-Trust Framework: All sensitive text fields are cryptographically encrypted directly inside your local web browser using AES-GCM-256 before leaving your computer. Store this passphrase securely; if lost, encrypted data cannot be recovered."
 )}
 </div>
 </div>
 </SectionCard>
 </div>
 );
}

export function BillingSettings({ company, activeIndustry}) {
 const { t} = useTranslation();
 const { user, refreshUser} = useAuth();
 const companyId = user?.company_id;
 const [activeUsersCount, setActiveUsersCount] = useState(0);
 const [activeCasesCount, setActiveCasesCount] = useState(0);
 const [invoices, setInvoices] = useState([]);
 const [loadingPlan, setLoadingPlan] = useState(null);
 const { toast} = useToast();

 useEffect(() => {
 if (!companyId) return;
 const fetchUsage = async () => {
 const { count: usersCount} = await supabase
 .from('profiles')
 .select('*', { count: 'exact', head: true})
 .eq('company_id', companyId);
 if (usersCount !== null) setActiveUsersCount(usersCount);

 const { count: casesCount} = await supabase
 .from('legal_cases')
 .select('*', { count: 'exact', head: true})
 .eq('company_id', companyId);
 if (casesCount !== null) setActiveCasesCount(casesCount);

 const { data: invoiceData} = await supabase
 .from('subscription_invoices')
 .select('*')
 .eq('company_id', companyId)
 .order('created_date', { ascending: false});
 if (invoiceData) setInvoices(invoiceData);
};
 fetchUsage();
}, [companyId]);

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
 ? 'bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/20 text-primary/90 dark:text-primary/70 border-slate-200' 
 : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200/50 animate-pulse'
}`}>
 {currentStatus}
 </span>
 </h3>
 </div>
 <p className="text-xs text-muted-foreground leading-relaxed">
 {t(
 "process_payments_directly_usin",
 "Process payments directly using our secure local checkout system. Upgrades propagate instantly."
 )}
 </p>
 </div>

 <div className="bg-card/30 border border-border/70 rounded-2xl p-5 space-y-4 ">
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
 <span>{t("active_case_files", "Active Files")}</span>
 <span className="text-foreground">{activeCasesCount} / {currentPlan === 'starter' ? 10 : 'Unlimited'}</span>
 </div>
 <Progress value={currentPlan === 'starter' ? (activeCasesCount / 10) * 100 : 8} className="h-2 bg-muted/40 [&>div]:bg-primary" />
 </div>
 </div>
 </div>
 </SectionCard>
 
 <div className="bg-card/45 backdrop-blur-xl rounded-3xl border border-border/60 p-8 space-y-6 -black/5 hover:border-border/80 transition-colors">
 <div>
 <h2 className="text-xl font-extrabold text-foreground">{t("upgrade_platform_model", "Upgrade Platform Model")}</h2>
 <p className="text-sm text-muted-foreground mt-1.5">{t(
 "scale_up_features_team_counts_",
 "Scale up features, team counts, and client space instantly."
 )}</p>
 </div>
 <div className="pt-4 border-t border-border/50">
 <Button 
 onClick={() => window.location.href = '/pricing'} 
 className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-bold px-8 h-12 rounded-xl text-sm transition-transform hover:-translate-y-0.5"
 >
 {t("explore_corporate_pricing", "Explore Corporate Pricing")}
 </Button>
 </div>
 </div>
 
 <div className="bg-card/45 backdrop-blur-xl rounded-3xl border border-border/60 p-8 space-y-6 -black/5 hover:border-border/80 transition-colors">
 <div>
 <h2 className="text-xl font-extrabold text-foreground">{t("invoice_ledger", "Invoice Ledger")}</h2>
 <p className="text-sm text-muted-foreground mt-1.5">{t(
 "view_platform_service_receipts",
 "View platform service receipts processed via the payment gateway."
 )}</p>
 </div>

 {invoices.length === 0 ? (
 <div className="text-center py-10 text-sm text-muted-foreground font-semibold bg-muted/10 rounded-2xl border border-dashed border-primary/50">
 {t("no_service_invoices_recorded", "No service invoices recorded.")}
 </div>
 ) : (
 <div className="overflow-x-auto rounded-xl border border-border/85 ">
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
 <span className="inline-flex py-0.5 px-2.5 rounded-full text-[10px] font-bold bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/20 text-primary/90 dark:text-primary/70 border border-slate-200 uppercase select-none">
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
