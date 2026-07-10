import React, { useState, useEffect } from "react";
import { useTranslation} from "react-i18next";
import { useTheme} from "@/lib/ThemeContext";
import { Input} from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Info, CheckCircle2, Loader2 } from "lucide-react";
import { getSubdomainAndBase} from "@/lib/domainUtils";
import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle} from "@/components/ui/alert-dialog";
import { SectionCard, FormRow, Field} from "./SettingsShared";

export function SystemSettings({ activeIndustry, company, onSave, saving}) {
 const { t} = useTranslation();
 const { theme, changeTheme} = useTheme();
 const [form, setForm] = useState({
 language: company?.language || "en",
 date_format: company?.date_format || "Y-m-d",
 time_format: company?.time_format || "H:i",
 calendar_start: company?.calendar_start || "sunday",
 timezone: company?.timezone || "Africa/Accra"});

 useEffect(() => {
   if (company) {
     setForm(prev => ({
       ...prev,
       language: company.language || prev.language,
       date_format: company.date_format || prev.date_format,
       time_format: company.time_format || prev.time_format,
       calendar_start: company.calendar_start || prev.calendar_start,
       timezone: company.timezone || prev.timezone
     }));
   }
 }, [company]);

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
 <LanguageSwitcher 
   currentLanguage={form.language} 
   onChange={v => setForm({ ...form, language: v})} 
 />
 </Field>
 <Field label="Date Format">
 <Select value={form.date_format} onValueChange={v => setForm({ ...form, date_format: v})}>
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
 <Select value={form.time_format} onValueChange={v => setForm({ ...form, time_format: v})}>
 <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="H:i">{t("24_hour_13_30", "24-Hour (13:30)")}</SelectItem>
 <SelectItem value="h:i A">{t("12_hour_am_pm_01_30_pm", "12-Hour AM/PM (01:30 PM)")}</SelectItem>
 </SelectContent>
 </Select>
 </Field>
 <Field label="Calendar Start Day">
 <Select value={form.calendar_start} onValueChange={v => setForm({ ...form, calendar_start: v})}>
 <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="sunday">{t("sunday", "Sunday")}</SelectItem>
 <SelectItem value="monday">{t("monday", "Monday")}</SelectItem>
 <SelectItem value="saturday">{t("saturday", "Saturday")}</SelectItem>
 </SelectContent>
 </Select>
 </Field>
 <Field label="System Timezone" full>
 <Select value={form.timezone} onValueChange={v => setForm({ ...form, timezone: v})}>
 <SelectTrigger className="h-11 bg-muted/40 hover:bg-muted/60 transition-colors"><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="Africa/Accra">{t("gmt_0_00_africa_accra_ghana_me", "(GMT+0:00) Africa/Accra (Ghana Mean Time)")}</SelectItem>
 <SelectItem value="Africa/Lagos">{t("gmt_1_00_africa_lagos_west_afr", "(GMT+1:00) Africa/Lagos (West Africa Time)")}</SelectItem>
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

export function BrandSettings({ activeIndustry, company, onSave, saving}) {
 const { t} = useTranslation();
 const [tab, setTab] = useState("logos");
 const [showSubdomainAlert, setShowSubdomainAlert] = useState(false);
 const [form, setForm] = useState({
 logo_url: company?.logo_url || "",
 logo_light_url: company?.logo_light_url || "",
 favicon_url: company?.favicon_url || "",
 name: company?.name || "",
 subdomain: company?.subdomain || "",
 custom_domain: company?.custom_domain || "",
 tagline: company?.tagline || "",
 primary_color: company?.primary_color || "#16a34a"});

 useEffect(() => {
   if (company) {
     setForm({
       logo_url: company.logo_url || "",
       logo_light_url: company.logo_light_url || "",
       favicon_url: company.favicon_url || "",
       name: company.name || "",
       subdomain: company.subdomain || "",
       custom_domain: company.custom_domain || "",
       tagline: company.tagline || "",
       primary_color: company.primary_color || "#16a34a"
     });
   }
 }, [company]);

 const handleSaveClick = () => {
 if (form.subdomain && form.subdomain !== company?.subdomain) {
 setShowSubdomainAlert(true);
} else {
 onSave(form);
}
};

 return (
 <SectionCard title="Brand & Identity" subtitle="Manage your company logos, application favicon, custom subdomain address, and theme colors" onSave={handleSaveClick} saving={saving}>
 <div className="flex gap-2 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-muted/20 rounded-xl p-1 w-fit mb-6">
 {["logos", "text", "theme", "domain"].map(item => {
 return (
 <button
 key={item}
 onClick={() => setTab(item)}
 className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all duration-200 ${tab === item ? "bg-primary text-primary-foreground " : "text-[#71717a] dark:text-gray-400 hover:text-foreground"}`}
 >
 {item}
 </button>
 );
})}
 </div>
 {tab === "logos" && (
 <FormRow>
 <Field label="Logo URL (Dark Background)">
 <Input className="h-11 bg-muted/20 border-primary/40 focus:border-primary/80 transition-colors" placeholder="https://..." value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value})} />
 {form.logo_url && <img src={form.logo_url} alt="Logo preview" className="mt-3 h-12 object-contain rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-1 bg-slate-900" />}
 </Field>
 <Field label="Logo URL (Light Background)">
 <Input className="h-11 bg-muted/20 border-primary/40 focus:border-primary/80 transition-colors" placeholder="https://..." value={form.logo_light_url || ""} onChange={e => setForm({ ...form, logo_light_url: e.target.value})} />
 {form.logo_light_url && <img src={form.logo_light_url} alt="Light logo preview" className="mt-3 h-12 object-contain rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-1 bg-white dark:bg-card/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />}
 </Field>
 <Field label="Favicon URL" full>
 <Input className="h-11 bg-muted/20 border-primary/40 focus:border-primary/80 transition-colors" placeholder="https://..." value={form.favicon_url || ""} onChange={e => setForm({ ...form, favicon_url: e.target.value})} />
 </Field>
 </FormRow>
 )}
 {tab === "text" && (
 <FormRow>
 <Field label="Application Name">
 <Input className="h-11 bg-muted/20 border-primary/40 focus:border-primary/80 transition-colors" value={form.name} onChange={e => setForm({ ...form, name: e.target.value})} />
 </Field>
 <Field label="Custom Subdomain">
 <div className="flex items-center rounded-xl overflow-hidden border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 focus-within:border-primary/80 transition-colors">
 <Input placeholder="yourfirm" value={form.subdomain} onChange={e => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} className="h-11 bg-muted/20 border-0 rounded-none focus-visible:ring-0" />
 <div className="bg-muted text-[#71717a] dark:text-gray-400 px-4 py-3 text-sm font-semibold border-l border-primary/40 whitespace-nowrap overflow-hidden text-ellipsis select-none">.{getSubdomainAndBase().baseDomain}</div>
 </div>
 <p className="text-xs text-amber-600 dark:text-amber-500 font-medium mt-2 flex items-center gap-2 tracking-[0.04em]"><Info className="w-3 h-3" /> {t(
 "changing_this_will_instantly_r",
 "Changing this will instantly refresh and sign you back into the new subdomain."
 )}</p>
 </Field>
 <Field label="Tagline / Slogan" full>
 <Input className="h-11 bg-muted/20 border-primary/40 focus:border-primary/80 transition-colors" placeholder="e.g. Legal Excellence in Africa" value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value})} />
 </Field>
 </FormRow>
 )}
 {tab === "theme" && (
 <div className="space-y-4">
 <Field label="Primary Theme Color">
 <div className="flex items-center gap-4">
 <input type="color" value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value})} className="w-12 h-12 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 cursor-pointer " />
 <Input value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value})} className="w-36 h-11 bg-muted/20 border-primary/40 focus:border-primary/80 transition-colors" />
 <div className="flex gap-2">
 {["#16a34a", "#2563eb", "#9333ea", "#dc2626", "#0f766e"].map(c => {
 return (<button key={c} onClick={() => setForm({ ...form, primary_color: c})} className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 active:scale-95 ${form.primary_color === c ? "border-primary scale-110" : "border-background"}`} style={{ background: c}} />);
})}
 </div>
 </div>
 </Field>
 </div>
 )}
 {tab === "domain" && (
 <div className="space-y-6">
 <Field label="Custom Domain" full>
 {(!company?.custom_domain || form.custom_domain !== company.custom_domain) ? (
 <div className="flex flex-col gap-3">
 <div className="flex gap-2">
 <Input placeholder="e.g. app.mycompany.com" value={form.custom_domain} onChange={e => setForm({ ...form, custom_domain: e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, '')})} className="h-12 flex-1 bg-muted/20 border-primary/40 focus:border-primary transition-colors text-lg" />
 {(form.custom_domain && form.custom_domain !== company?.custom_domain) && (
 <button onClick={handleSaveClick} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 font-bold rounded-xl transition-all shadow-lg shadow-primary/20">
 Connect Domain
 </button>
 )}
 </div>
 {form.custom_domain && form.custom_domain !== company?.custom_domain && (
 <div className="p-5 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 mt-2">
 <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
 <Info className="w-4 h-4" /> DNS Configuration Required
 </h4>
 <p className="text-sm text-blue-800 dark:text-blue-200 mb-4 font-medium">
 To complete your custom domain setup, add the following record to your DNS provider (e.g. GoDaddy, Namecheap, Route53).
 </p>
 {form.custom_domain.split('.').length > 2 ? (
 <div className="bg-white dark:bg-card p-4 rounded-xl border border-blue-100 dark:border-blue-900 text-sm font-mono flex flex-col gap-2 shadow-sm">
 <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Type</span><strong className="text-slate-900 dark:text-white">CNAME</strong></div>
 <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Name</span><strong className="text-slate-900 dark:text-white">{form.custom_domain.split('.')[0]}</strong></div>
 <div className="flex justify-between"><span className="text-slate-500">Value</span><strong className="text-slate-900 dark:text-white">cname.vercel-dns.com</strong></div>
 </div>
 ) : (
 <div className="bg-white dark:bg-card p-4 rounded-xl border border-blue-100 dark:border-blue-900 text-sm font-mono flex flex-col gap-2 shadow-sm">
 <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Type</span><strong className="text-slate-900 dark:text-white">A</strong></div>
 <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Name</span><strong className="text-slate-900 dark:text-white">@</strong></div>
 <div className="flex justify-between"><span className="text-slate-500">Value</span><strong className="text-slate-900 dark:text-white">76.76.21.21</strong></div>
 </div>
 )}
 </div>
 )}
 </div>
 ) : (
 <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-6 bg-slate-50 dark:bg-card/50 relative overflow-hidden group">
 <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
 <div className="flex items-center justify-between">
 <div>
 <h4 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-1">
 {company.custom_domain}
 <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-500/30">Active</span>
 </h4>
 <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Your custom domain is configured and routing traffic.</p>
 </div>
 <button onClick={() => { setForm({ ...form, custom_domain: '' }); onSave({ ...form, custom_domain: '' }); }} className="text-red-500 hover:text-red-700 font-bold text-sm px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors">
 Remove
 </button>
 </div>
 </div>
 )}
 </Field>
 </div>
 )}
 <AlertDialog open={showSubdomainAlert || saving} onOpenChange={setShowSubdomainAlert}>
 <AlertDialogContent className={`rounded-2xl max-w-md ${saving ? 'p-0 overflow-hidden shadow-2xl bg-background border border-border' : ''}`}>
 {saving ? (
 <div className="p-10 flex flex-col items-center justify-center text-center text-foreground">
 <div className="relative mb-8 mt-4">
 <div className="w-20 h-20 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin"></div>
 <div className="absolute inset-0 flex items-center justify-center">
 <div className="w-8 h-8 bg-primary rounded-full animate-pulse blur-[2px]"></div>
 </div>
 </div>
 <h3 className="text-2xl font-bold mb-2 tracking-tight">Provisioning Infrastructure</h3>
 <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-[280px]">Configuring enterprise routing and synchronizing edge network settings...</p>
 
 <div className="w-full mt-10 mb-4 space-y-4 bg-muted/50 p-5 rounded-xl border border-border">
 <div className="flex items-center gap-3 text-xs font-semibold text-foreground/80">
 <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="w-2 h-2 bg-primary rounded-full"></div></div>
 Updating tenant registry
 </div>
 <div className="flex items-center gap-3 text-xs font-semibold text-foreground/80">
 <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="w-2 h-2 bg-primary rounded-full"></div></div>
 Synchronizing Vercel Edge Network
 </div>
 <div className="flex items-center gap-3 text-xs font-bold text-primary animate-pulse">
 <Loader2 className="w-4 h-4 animate-spin" /> Finalizing deployment...
 </div>
 </div>
 </div>
 ) : (
 <>
 <AlertDialogHeader>
 <AlertDialogTitle className="text-xl font-bold tracking-tight">{t("change_firm_subdomain", "Change routing architecture?")}</AlertDialogTitle>
 <AlertDialogDescription className="text-sm font-medium leading-relaxed mt-2 text-slate-500">
 {t(
 "modifying_your_subdomain_trigg",
 "Modifying your subdomain triggers a system-wide edge redirect. Ensure your team members are aware, as their current browser tabs will require re-authentication to the new zone."
 )}
 </AlertDialogDescription>
 </AlertDialogHeader>
 <AlertDialogFooter className="gap-3 mt-6">
 <AlertDialogCancel className="rounded-xl font-bold border-slate-200">{t("cancel", "Cancel")}</AlertDialogCancel>
 <AlertDialogAction onClick={() => {
 setShowSubdomainAlert(false);
 onSave(form);
}} className="bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-lg shadow-primary/20">{t("continue_relocate", "Execute Relocation")}</AlertDialogAction>
 </AlertDialogFooter>
 </>
 )}
 </AlertDialogContent>
 </AlertDialog>
 </SectionCard>
 );
}
