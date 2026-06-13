import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { powerSync } from "@/api/PowerSyncConnector";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { getSubdomainAndBase } from "@/lib/domainUtils";

import {
  Settings2, Palette, DollarSign, ShieldCheck, Lock, CreditCard
} from "lucide-react";

import StaffPermissionsSettings from "@/components/settings/StaffPermissionsSettings";
import { SystemSettings, BrandSettings } from "@/components/settings/SystemBrandSettings";
import { CurrencySettings, SecuritySettings, BillingSettings } from "@/components/settings/SecurityBillingSettings";

const SECTIONS = [
  { id: "system",      label: "System Configuration",   icon: Settings2,       cat: "General" },
  { id: "brand",       label: "Brand & Identity",       icon: Palette,         cat: "General" },
  { id: "security",    label: "Security & Encryption",  icon: Lock,            cat: "Security & Access" },
  { id: "permissions", label: "Staff Permissions",      icon: ShieldCheck,     cat: "Security & Access" },
  { id: "billing",     label: "Billing & Subscriptions",icon: CreditCard,      cat: "Billing" },
  { id: "currency",    label: "Regional Currency",      icon: DollarSign,      cat: "Billing" },
];

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
      const { data } = await powerSync.execute('SELECT * FROM companies WHERE id = ?', [companyId]).then(res => ({ data: res.rows._array })).single();
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

  const renderActiveSection = () => {
    switch (activeSection) {
      case "system":       return <SystemSettings activeIndustry={activeIndustry} company={company} onSave={fakeSuccess} saving={saving} />;
      case "brand":        return <BrandSettings activeIndustry={activeIndustry} company={company} onSave={company ? async d => { 
        try {
          await updateCompany({ 
            name: d.name, logo_url: d.logo_url, subdomain: d.subdomain,
            logo_light_url: d.logo_light_url, favicon_url: d.favicon_url,
            tagline: d.tagline, primary_color: d.primary_color
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
      case "security":     return <SecuritySettings />;
      case "permissions":  return (
        <div className="bg-card/45 backdrop-blur-xl rounded-3xl border border-border/60 p-8 space-y-6 shadow-2xl shadow-black/5">
          <div>
            <h2 className="text-xl font-extrabold text-foreground">{t("staff_access_controls", "Staff Access Controls")}</h2>
            <p className="text-sm text-muted-foreground mt-1.5">{t(
              "maintain_granular_security_per",
              "Maintain granular security permissions across internal groups"
            )}</p>
          </div>
          <div className="pt-4 border-t border-border/40">
            <StaffPermissionsSettings />
          </div>
        </div>
      );
      default: return null;
    }
  };

  const categories = ["General", "Security & Access", "Billing"];

  return (
    <div className="flex flex-col h-full bg-card/20 rounded-[2rem] overflow-hidden shadow-2xl shadow-black/5 border border-border/40 max-w-7xl mx-auto my-6 backdrop-blur-3xl ring-1 ring-white/10">
      {/* Header */}
      <div className="px-10 py-10 border-b border-border/30 bg-card/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Workspace Settings</h1>
          <p className="text-muted-foreground mt-3 text-base max-w-xl leading-relaxed">Manage your core configurations, enforce security policies, and monitor billing directly from the control center.</p>
        </div>
      </div>

      {/* Split Pane */}
      <div className="flex flex-1 overflow-hidden min-h-[600px]">
        
        {/* Sidebar Navigation */}
        <div className="w-72 shrink-0 border-r border-border/30 bg-card/40 overflow-y-auto p-6 hidden md:block backdrop-blur-xl">
          <div className="space-y-10">
            {categories.map(cat => {
              const catSections = SECTIONS.filter(s => s.cat === cat);
              if (catSections.length === 0) return null;
              return (
                <div key={cat} className="space-y-4">
                  <h4 className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest px-4">{cat}</h4>
                  <nav className="space-y-1.5">
                    {catSections.map(s => {
                      const IconComp = s.icon;
                      const isActive = activeSection === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setActiveSection(s.id)}
                          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-300 text-sm font-bold relative overflow-hidden group ${
                            isActive 
                              ? "text-primary bg-primary/10 shadow-sm" 
                              : "text-foreground/70 hover:bg-muted/80 hover:text-foreground"
                          }`}
                        >
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-r-full" />
                          )}
                          <IconComp className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground/80 group-hover:scale-110'}`} />
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
        <div className="md:hidden p-4 border-b border-border/30 w-full bg-card/60 backdrop-blur-xl">
          <select 
            value={activeSection}
            onChange={(e) => setActiveSection(e.target.value)}
            className="w-full bg-background border border-border/50 rounded-2xl px-4 py-3.5 font-bold text-sm focus:ring-2 focus:ring-primary/20 shadow-sm"
          >
            {SECTIONS.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-background/30 custom-scrollbar">
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both ease-out">
            {renderActiveSection()}
          </div>
        </div>

      </div>
    </div>
  );
}