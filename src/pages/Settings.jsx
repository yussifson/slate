import React, { useState} from "react";
import { useTranslation} from "react-i18next";
import { useQuery, useQueryClient} from "@tanstack/react-query";
import { powerSync} from "@/api/PowerSyncConnector";
import { base44} from "@/api/base44Client";
import { supabase} from "@/api/supabaseClient";
import { useAuth} from "@/lib/AuthContext";
import { useToast} from "@/components/ui/use-toast";
import { getSubdomainAndBase} from "@/lib/domainUtils";

import {
 Settings2, Palette, DollarSign, ShieldCheck, Lock, CreditCard, Building
} from "lucide-react";

import { SystemSettings, BrandSettings} from "@/components/settings/SystemBrandSettings";
import { CurrencySettings, SecuritySettings, BillingSettings} from "@/components/settings/SecurityBillingSettings";
const SECTIONS = [
 { id: "system", label: "System Configuration", icon: Settings2, cat: "General"},
 { id: "brand", label: "Brand & Identity", icon: Palette, cat: "General"},
 { id: "security", label: "Security & Encryption", icon: Lock, cat: "Security & Access"},
 { id: "billing", label: "Billing & Subscriptions",icon: CreditCard, cat: "Billing"},
 { id: "currency", label: "Regional Currency", icon: DollarSign, cat: "Billing"},
];

export default function Settings() {
 const { t} = useTranslation();
 const { user, refreshUser} = useAuth();
 const { toast} = useToast();
 const queryClient = useQueryClient();
 const companyId = user?.company_id || null;
 const activeIndustry = sessionStorage.getItem("slate_industry_override") || user?.company_industry || "law";
 
 const [activeSection, setActiveSection] = useState("system");
 const [saving, setSaving] = useState(false);

 const { data: company} = useQuery({
 queryKey: ["company", companyId],
 queryFn: async () => {
 if (!companyId) return null;
 const { data} = await powerSync.execute('SELECT * FROM companies WHERE id = ?', [companyId]).then(res => ({ data: res.rows._array[0] || null, error: null}));
 return data;
},
 enabled: !!companyId});

 const updateCompany = async (data) => {
 if (!company) return;
 setSaving(true);
 try {
 await base44.entities.Company.update(company.id, data);
 queryClient.invalidateQueries({ queryKey: ["company", companyId]});
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
 case "system": return <SystemSettings activeIndustry={activeIndustry} company={company} onSave={fakeSuccess} saving={saving} />;
 case "brand": return <BrandSettings activeIndustry={activeIndustry} company={company} onSave={company ? async d => { 
 try {
 await updateCompany({ 
 name: d.name, logo_url: d.logo_url, subdomain: d.subdomain,
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
 <div className="flex flex-col h-full bg-background md:flex-row rounded-tl-2xl overflow-hidden border-t border-l border-primary/40">
 
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

 {/* Mobile Nav Select (Fallback) */}
 <div className="md:hidden p-4 border-b border-primary/40 w-full bg-background sticky top-0 z-10">
 <h1 className="text-xl font-semibold mb-4">Settings</h1>
 <select 
 value={activeSection}
 onChange={(e) => setActiveSection(e.target.value)}
 className="w-full bg-muted border-none rounded-xl px-4 py-3 font-medium text-sm focus:ring-2 focus:ring-foreground"
 >
 {SECTIONS.map(s => (
 <option key={s.id} value={s.id}>{s.label}</option>
 ))}
 </select>
 </div>

 {/* Main Content Area */}
 <div className="flex-1 overflow-y-auto bg-background p-6 md:p-10 lg:p-16">
 <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
 {renderActiveSection()}
 </div>
 </div>

 </div>
 );
}