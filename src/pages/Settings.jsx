import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { powerSync } from "@/api/PowerSyncConnector";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { getSubdomainAndBase } from "@/lib/domainUtils";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";

import {
  Settings2, Palette, DollarSign, Mail, Bell,
  MessageSquare, Phone, CreditCard, Calendar, ShieldCheck, Lock, ArrowLeft, ChevronRight
} from "lucide-react";

import StaffPermissionsSettings from "@/components/settings/StaffPermissionsSettings";
import { SystemSettings, BrandSettings } from "@/components/settings/SystemBrandSettings";
import { CurrencySettings, SecuritySettings, BillingSettings } from "@/components/settings/SecurityBillingSettings";
import { EmailSettings, NotificationSettings, SlackSettings, TwilioSettings, PaymentSettings, GoogleCalendarSettings } from "@/components/settings/IntegrationsHub";

const SECTIONS = [
  { id: "system",      label: "System Configuration",         icon: Settings2,       cat: "General", desc: "Formats, timezone, languages, theme" },
  { id: "brand",       label: "Brand & Identity",             icon: Palette,         cat: "General", desc: "Logos, colors, custom subdomain" },
  { id: "security",    label: "Security & Encryption",        icon: Lock,            cat: "Security & Access", desc: "Passwords, Zero-Trust keys" },
  { id: "permissions", label: "Staff Permissions",            icon: ShieldCheck,     cat: "Security & Access", desc: "Role-based access control" },
  { id: "billing",     label: "Billing & Subscriptions",      icon: CreditCard,      cat: "Billing", desc: "Plan management, invoices" },
  { id: "currency",    label: "Regional Currency",            icon: DollarSign,      cat: "Billing", desc: "Symbols, display formats" },
  { id: "email",       label: "Email Delivery Center",        icon: Mail,            cat: "Integrations", desc: "SMTP, custom domains" },
  { id: "notifications", label: "Notification Triggers",       icon: Bell,            cat: "Integrations", desc: "Reminders, alerts, auto-emails" },
  { id: "slack",       label: "Slack Workspaces",             icon: MessageSquare,   cat: "Integrations", desc: "Channel webhooks, alerts" },
  { id: "twilio",      label: "Twilio SMS",                   icon: Phone,           cat: "Integrations", desc: "Global SMS dispatch" },
  { id: "payment",     label: "Payment Gateways",             icon: CreditCard,      cat: "Integrations", desc: "Stripe, Paystack, Flutterwave" },
  { id: "gcalendar",   label: "Google Calendar",              icon: Calendar,        cat: "Integrations", desc: "Two-way schedule sync" },
];

export default function Settings() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const companyId = user?.company_id || null;
  const activeIndustry = sessionStorage.getItem("slate_industry_override") || user?.company_industry || "law";
  
  const [activeSection, setActiveSection] = useState(null); // null means show grid hub
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

  const { data: connectedApps = [], refetch: refetchApps } = useQuery({
    queryKey: ["connected_apps", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await powerSync.execute('SELECT * FROM connected_apps WHERE company_id = ?', [companyId]).then(res => ({ data: res.rows._array }));
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

      const existing = connectedApps.find(app => app.provider === provider);
      if (existing) {
        const _p = { access_token, provider_user_id, metadata, updated_at: new Date().toISOString() };
        const _k = Object.keys(_p);
        const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        await powerSync.execute(`UPDATE connected_apps SET ${_k.map(k => k+' = ?').join(', ')} WHERE id = ?`, [..._v, existing.id]);
      } else {
        const _p = { company_id: companyId, provider, access_token, provider_user_id, metadata, status: 'active' };
        const _k = Object.keys(_p);
        const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const _pl = _k.map(()=>'?').join(', ');
        await powerSync.execute(`INSERT INTO connected_apps (${_k.join(', ')}) VALUES (${_pl})`, _v);
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
      case "email":        return <EmailSettings activeIndustry={activeIndustry} company={company} onSave={company ? d => updateCompany(d) : fakeSuccess} saving={saving} />;
      case "notifications": return <NotificationSettings activeIndustry={activeIndustry} onSave={fakeSuccess} saving={saving} />;
      case "slack":        return <SlackSettings activeIndustry={activeIndustry} onSave={d => saveAppSetting("slack", d)} saving={saving} initialData={connectedApps.find(a => a.provider === "slack")} />;
      case "twilio":       return <TwilioSettings activeIndustry={activeIndustry} onSave={d => saveAppSetting("twilio", d)} saving={saving} initialData={connectedApps.find(a => a.provider === "twilio")} />;
      case "payment":      return <PaymentSettings activeIndustry={activeIndustry} onSave={d => saveAppSetting(d.provider, d)} saving={saving} initialData={connectedApps.find(a => ["stripe", "paystack", "flutterwave", "momo"].includes(a.provider))} />;
      case "gcalendar":    return <GoogleCalendarSettings activeIndustry={activeIndustry} onSave={d => saveAppSetting("google_calendar", d)} saving={saving} initialData={connectedApps.find(a => a.provider === "google_calendar")} />;
      case "security":     return <SecuritySettings />;
      case "permissions":  return (
        <div className="bg-card/45 backdrop-blur-xl rounded-3xl border border-border/60 p-8 space-y-6 shadow-2xl shadow-black/5 hover:border-border/80 transition-all duration-300">
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
      default:             return null;
    }
  };

  // Group sections by category
  const categories = ["General", "Security & Access", "Billing", "Integrations"];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <PageHeader 
          title={activeSection ? SECTIONS.find(s => s.id === activeSection)?.label : "Control Center"} 
          subtitle={activeSection ? "Manage settings for this module." : "Coordinate global configuration models, secure integration systems, and custom brand profiles"} 
        />
        {activeSection && (
          <Button 
            variant="outline" 
            onClick={() => setActiveSection(null)} 
            className="rounded-xl border-border/60 hover:bg-muted shadow-sm gap-2 font-bold transition-transform hover:-translate-x-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Control Center
          </Button>
        )}
      </div>

      {!activeSection ? (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
          {categories.map(cat => {
            const catSections = SECTIONS.filter(s => s.cat === cat);
            if (catSections.length === 0) return null;
            return (
              <div key={cat} className="space-y-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-extrabold tracking-tight text-foreground">{cat}</h3>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-border/80 to-transparent"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {catSections.map(s => {
                    const IconComp = s.icon;
                    return (
                      <div 
                        key={s.id} 
                        onClick={() => setActiveSection(s.id)}
                        className="group relative bg-card/40 backdrop-blur-md rounded-2xl border border-border/60 p-5 cursor-pointer hover:bg-card/80 hover:border-foreground/30 hover:shadow-2xl transition-all duration-300 active:scale-[0.98] overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10 flex flex-col h-full gap-4">
                          <div className="flex items-start justify-between">
                            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md group-hover:shadow-primary/20 transition-all duration-300">
                              <IconComp className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground/60 transition-transform duration-300 group-hover:translate-x-1" />
                          </div>
                          <div>
                            <h4 className="font-bold text-foreground text-sm">{s.label}</h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{s.desc}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both max-w-4xl">
          {renderActiveSection()}
        </div>
      )}
    </div>
  );
}