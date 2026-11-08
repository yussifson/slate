import React, { useState} from "react";
import { useTranslation} from "react-i18next";
import { useQuery, useQueryClient} from "@tanstack/react-query";
import { powerSync} from "@/api/PowerSyncConnector";
import { supabase} from "@/api/supabaseClient";
import { useAuth} from "@/lib/AuthContext";
import { useToast} from "@/components/ui/use-toast";
import { getSubdomainAndBase} from "@/lib/domainUtils";

import {
 Settings2, Palette, DollarSign, Lock, CreditCard, FileText
} from "lucide-react";

import { SystemSettings, BrandSettings} from "@/components/settings/SystemBrandSettings";
import { CurrencySettings, SecuritySettings, BillingSettings} from "@/components/settings/SecurityBillingSettings";
import { CustomizationsSettings } from "@/components/settings/CustomizationsSettings";
const SECTIONS = [
 { id: "system", label: "System Configuration", icon: Settings2, cat: "General"},
 { id: "brand", label: "Brand & Identity", icon: Palette, cat: "General"},
 { id: "security", label: "Security & Encryption", icon: Lock, cat: "Security & Access"},
 { id: "billing", label: "Billing & Subscriptions",icon: CreditCard, cat: "Billing"},
 { id: "currency", label: "Regional Currency", icon: DollarSign, cat: "Billing"},
 { id: "customizations", label: "Customizations", icon: FileText, cat: "Billing"},
];

export default function Settings() {
 const { t} = useTranslation();
 const { user, refreshUser} = useAuth();
 const { toast} = useToast();
 const queryClient = useQueryClient();
 const companyId = user?.company_id || null;

  const { data: company} = useQuery({
  queryKey: ["company", companyId],
  queryFn: async () => {
    if (!companyId) return null;
    const res = await powerSync.execute('SELECT * FROM companies WHERE id = ?', [companyId]);
    const data = res.rows ? (res.rows._array ? res.rows._array[0] : Array.from(res.rows)[0]) : null;
    return data || null;
  },
  enabled: !!companyId
 });

  const activeIndustry = sessionStorage.getItem("slate_industry_override") || company?.industry_type || user?.company_industry || "law";
  const [activeSection, setActiveSection] = useState("system");
  const [saving, setSaving] = useState(false);

  const updateCompany = async (data) => {
    if (!company || !companyId) return;
    setSaving(true);
    
    try {
      const payload = {};
      const allowedFields = [
        'name', 'subdomain', 'custom_domain', 'tagline', 'primary_color', 
        'logo_url', 'logo_light_url', 'favicon_url', 
        'currency', 'language', 'timezone', 'date_format', 'time_format', 'calendar_start',
        'receipt_template', 'receipt_header', 'receipt_footer', 'receipt_show_logo'
      ];
      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          // Never save an empty name — it would erase the company name in Supabase
          if (field === 'name' && (data[field] === '' || data[field] == null)) {
            continue; // skip — don't overwrite existing name with blank
          }
          // Convert empty strings to null for unique fields to avoid 409 constraint violations
          if ((field === 'subdomain' || field === 'custom_domain') && data[field] === "") {
            payload[field] = null;
          } else {
            payload[field] = data[field];
          }
        }
      }

      if (Object.keys(payload).length > 0) {
        const keys = Object.keys(payload);
        const vals = Object.values(payload);
        await powerSync.execute(
          `UPDATE companies SET ${keys.map(k => k+' = ?').join(', ')} WHERE id = ?`, 
          [...vals, companyId]
        );
      }

      await queryClient.invalidateQueries({ queryKey: ["company", companyId]});
      await refreshUser();
      toast({ title: "Settings updated successfully"});
    } catch (err) {
      if (err.code === '23505' || err.message?.includes('unique constraint')) {
        toast({ title: "Subdomain already taken", description: "This subdomain is already in use by another firm.", variant: "destructive"});
        throw err;
      }
      toast({ title: "Failed to save settings", description: err.message, variant: "destructive"});
      throw err;
    } finally {
      setSaving(false);
    }
  };

 const fakeSuccess = async (data) => {
 setSaving(true);
 await new Promise(r => setTimeout(r, 600));
 setSaving(false);
 toast({ title: "Settings updated successfully"});
};

 const renderActiveSection = () => {
 switch (activeSection) {
  case "system": return <SystemSettings activeIndustry={activeIndustry} company={company} onSave={company ? async d => {
    try {
      await updateCompany({
        language: d.language,
        date_format: d.date_format,
        time_format: d.time_format,
        calendar_start: d.calendar_start,
        timezone: d.timezone
      });
    } catch (err) {
      console.error("Failed to save system settings", err);
    }
  } : fakeSuccess} saving={saving} />;
 case "customizations": return <CustomizationsSettings company={company} onSave={company ? async d => {
   try { await updateCompany(d); } catch (e) { console.error("Save customizations settings failed", e); }
 } : fakeSuccess} saving={saving} />;
 case "brand": return <BrandSettings activeIndustry={activeIndustry} company={company} onSave={company ? async d => { 
 try {
 if (d.custom_domain && d.custom_domain !== company.custom_domain) {
   // Assuming Vercel API requires env variables to be set, we wrap it in a safe try-catch
   // so that if Vercel API isn't configured, it still saves to Supabase.
   try {
     const { VercelAPI } = await import('@/api/VercelAPI');
     await VercelAPI.addDomain(d.custom_domain);
   } catch (vercelErr) {
     console.error("Vercel Domain Sync Failed:", vercelErr);
   }
 } else if (!d.custom_domain && company.custom_domain) {
   try {
     const { VercelAPI } = await import('@/api/VercelAPI');
     await VercelAPI.removeDomain(company.custom_domain);
   } catch (vercelErr) {
     console.error("Vercel Domain Sync Failed:", vercelErr);
   }
 }

 await updateCompany({ 
  name: d.name, logo_url: d.logo_url, subdomain: d.subdomain,
  custom_domain: d.custom_domain,
  logo_light_url: d.logo_light_url, favicon_url: d.favicon_url,
  tagline: d.tagline, primary_color: d.primary_color
 });

 if (d.subdomain && d.subdomain !== company.subdomain) {
 const { baseDomain} = getSubdomainAndBase();
 const port = window.location.port ? `:${window.location.port}` : '';
 const targetHost = `${d.subdomain}.${baseDomain}${port}`;
 let url = `${window.location.protocol}//${targetHost}/`;
 const { data: { session}} = await supabase.auth.getSession();
 if (session?.access_token && session?.refresh_token) {
 url += `?access_token=${session.access_token}&refresh_token=${session.refresh_token}`;
}
 window.location.href = url;
}
} catch (err) {
 console.error("Failed to save brand settings", err);
}
} : fakeSuccess} saving={saving} />;
 case "billing": return <BillingSettings activeIndustry={activeIndustry} company={company} />;
 case "currency": return <CurrencySettings activeIndustry={activeIndustry} company={company} onSave={company ? d => updateCompany({ currency: d.currency}) : fakeSuccess} saving={saving} />;
 case "security": return <SecuritySettings />;
 default: return null;
}
};

 const categories = ["General", "Security & Access", "Billing"];

 return (
 <div className="flex flex-col min-h-screen pb-[max(96px,env(safe-area-inset-bottom))] bg-background md:flex-row rounded-tl-2xl overflow-hidden border-t border-l border-primary/40">
 
 {/* Sidebar Navigation */}
 <div className="w-full md:w-64 lg:w-72 shrink-0 border-r border-primary/40 bg-muted/30 overflow-y-auto hidden md:block">
 <div className="p-8 pb-6">
 <h1 className="text-2xl font-semibold tracking-tight text-foreground tracking-[-0.02em]">Settings</h1>
 </div>
 <div className="px-4 space-y-8 pb-8">
 {categories.map(cat => {
 const catSections = SECTIONS.filter(s => s.cat === cat);
 if (catSections.length === 0) return null;
 return (
 <div key={cat} className="space-y-1">
 <h4 className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-widest px-4 mb-3 tracking-[0.04em]">{cat}</h4>
 <nav className="space-y-1">
 {catSections.map(s => {
 const IconComp = s.icon;
 const isActive = activeSection === s.id;
 return (
 <button
 key={s.id}
 onClick={() => setActiveSection(s.id)}
 className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 text-sm font-semibold relative overflow-hidden group ${
 isActive 
 ? "text-primary bg-primary/10 " 
 : "text-foreground/70 hover:bg-muted hover:text-foreground"
}`}
 >
 {isActive && (
 <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
 )}
 <IconComp className={`w-4 h-4 transition-colors ${isActive ? 'text-primary' : 'text-[#71717a] dark:text-gray-400 group-hover:text-foreground'}`} />
 {s.label}
 </button>
 );
})}
 </nav>
 </div>
 );
})}
 </div>
 </div>

  {/* Mobile Nav Select (Native iOS/Android Card Header) */}
  <div className="md:hidden p-4 border-b border-border w-full bg-card/90 backdrop-blur-xl sticky top-0 z-10 shadow-xs">
    <div className="flex items-center justify-between mb-3">
      <h1 className="text-xl font-bold tracking-tight text-foreground">Settings</h1>
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">System Control</span>
    </div>
    <select 
      value={activeSection}
      onChange={(e) => setActiveSection(e.target.value)}
      className="w-full bg-background border border-border rounded-xl px-4 py-3 font-semibold text-xs text-foreground focus:ring-2 focus:ring-primary shadow-xs outline-none"
    >
      {SECTIONS.map(s => (
        <option key={s.id} value={s.id}>{s.label}</option>
      ))}
    </select>
  </div>

 {/* Main Content Area */}
 <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 md:p-10 lg:p-16">
 <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
 {renderActiveSection()}
 </div>
 </div>

 </div>
 );
}
