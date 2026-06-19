import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from 'react';
import { powerSync } from "@/api/PowerSyncConnector";
import { useQuery as usePSQuery } from "@powersync/react";
import { useQuery } from "@tanstack/react-query";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {Edit2, CheckCircle2, AlertOctagon, Search, UserCheck, MessageSquare, Layers, Users, Clock} from "lucide-react";
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useImpersonation } from '@/lib/ImpersonationContext';
import PageHeader from '@/components/shared/PageHeader';
import FirmFeaturesManager from '@/components/superadmin/FirmFeaturesManager';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/api/supabaseClient';
import { OrbitLoader } from "@/components/ui/orbit-loader";

export default function AdminFirms() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { startImpersonation } = useImpersonation();
  const { notify } = useNotifications();

  const { data: companies = [], isLoading: loadingCompanies } = usePSQuery("SELECT * FROM companies");
  const { data: profiles = [], isLoading: loadingProfiles } = usePSQuery("SELECT company_id, email FROM profiles");
  const { data: cases = [], isLoading: loadingCases } = usePSQuery("SELECT company_id FROM industry_records WHERE record_type = 'case'");
  const loading = loadingCompanies || loadingProfiles || loadingCases;

  // Live sessions to derive last-activity per firm
  const { data: activeSessions = [] } = useQuery({
    queryKey: ['admin_active_sessions_firms'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_active_sessions');
      if (error) return [];
      return data || [];
    }
  });

  // Build a map of company_id -> last activity timestamp
  const firmLastActivity = useMemo(() => {
    const map = {};
    profiles.forEach(p => {
      const session = activeSessions.find(s => s.email === p.email);
      if (session) {
        const existing = map[p.company_id];
        const ts = new Date(session.last_sign_in_at);
        if (!existing || ts > new Date(existing)) {
          map[p.company_id] = session.last_sign_in_at;
        }
      }
    });
    return map;
  }, [profiles, activeSessions]);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [featuresCompany, setFeaturesCompany] = useState(null);

  // Quota Modal
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [maxUsers, setMaxUsers] = useState(0);
  const [maxCases, setMaxCases] = useState(0);
  const [subPlan, setSubPlan] = useState('starter');
  const [subStatus, setSubStatus] = useState('trial');
  const [updatingQuota, setUpdatingQuota] = useState(false);

  // Message Modal
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const handleToggleStatus = async (company) => {
    const nextStatus = company.status === 'active' ? 'suspended' : 'active';
    try {
      (async () => {
        const _payload = { status: nextStatus };
        const _keys = Object.keys(_payload);
        const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        await powerSync.execute(`UPDATE companies SET ${_keys.map(k => k+' = ?').join(', ')} WHERE id = ?`, [..._vals, company.id]);
      })();
      toast({ title: `Firm status updated`, description: `${company.name} is now ${nextStatus}.` });
    } catch (err) {
      toast({ title: "Operation failed", description: err.message, variant: "destructive" });
    }
  };

  const handleOpenEditDialog = (company) => {
    setSelectedCompany(company);
    setMaxUsers(company.max_users || 3);
    setMaxCases(company.max_cases || 10);
    setSubPlan(company.subscription_plan || 'starter');
    setSubStatus(company.subscription_status || 'trial');
    setEditDialogOpen(true);
  };

  const handleOpenMessageDialog = (company) => {
    setSelectedCompany(company);
    setMessageContent('');
    setMessageDialogOpen(true);
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !selectedCompany) return;
    setSendingMessage(true);
    try {
      await notify({
        recipientEmail: selectedCompany.email,
        title: `Message from Platform Support`,
        message: messageContent,
        type: "SYSTEM_ALERT",
        data: { from: "Super Admin" }
      });
      toast({ title: "Message sent", description: `Your message has been dispatched to the admin of ${selectedCompany.name}.` });
      setMessageDialogOpen(false);
    } catch (err) {
      toast({ title: "Message failed", description: err.message, variant: "destructive" });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSaveQuotas = async () => {
    if (!selectedCompany) return;
    setUpdatingQuota(true);
    try {
      (async () => {
        const _payload = {
          max_users: maxUsers,
          max_cases: maxCases,
          subscription_plan: subPlan,
          subscription_status: subStatus
        };
        const _keys = Object.keys(_payload);
        const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        await powerSync.execute(`UPDATE companies SET ${_keys.map(k => k+' = ?').join(', ')} WHERE id = ?`, [..._vals, selectedCompany.id]);
      })();
      toast({ title: "Limits updated successfully" });
      setEditDialogOpen(false);
    } catch (err) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingQuota(false);
    }
  };

  const handleImpersonate = (company) => {
    startImpersonation(company);
    toast({ title: "Impersonation Active", description: `You are now viewing the system as ${company.name}. Navigate to the dashboard to see their data.` });
    window.location.href = '/';
  };

  const filteredCompanies = companies.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subdomain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader 
        title="Registered Firms" 
        subtitle="Manage limits, impersonate users, and suspend access." 
        action={
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#71717a] dark:text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input 
              type="text" 
              placeholder="Search subdomain or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl border-primary/40"
            />
          </div>
        }
      />
      {loading ? (
        <div className="flex justify-center py-24">
          <OrbitLoader size="md" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCompanies.length === 0 ? (
            <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 text-center py-12 text-slate-400 text-sm font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
              {t("no_firms_found_matching_query", "No firms found matching query.")}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredCompanies.map((c, idx) => {
                const activeUsers = profiles.filter(p => p.company_id === c.id).length;
                const activeCases = cases.filter(cs => cs.company_id === c.id).length;
                return (
                  <div key={idx} className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm hover:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                    <div className="flex-1">
                      <div className="flex items-start justify-between md:justify-start gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 leading-tight">{c.name}</h3>
                          <p className="font-mono text-[11px] text-primary mt-1">{c.subdomain}{t("slate_optavel_com", ".slate.optavel.com")}</p>
                        </div>
                        <span className={`md:hidden inline-flex py-1 px-2.5 rounded-full text-[10px] font-semibold uppercase ${c.status === 'active' ? 'bg-slate-50 dark:bg-slate-800/50 text-primary/90 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40' : 'bg-red-50 text-red-700 border-[0.5px] border-black/9 dark:border-white/8 border-red-100'}`}>
                          {c.status}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400 tracking-[0.04em]">
                        <span className="flex items-center gap-2"><Users className="w-3.5 h-3.5" /> {activeUsers} / {c.max_users || '∞'} Users</span>
                        <span className="flex items-center gap-2"><Layers className="w-3.5 h-3.5" /> {activeCases} / {c.max_cases || '∞'} Cases</span>
                        <span>{c.email}</span>
                        {firmLastActivity[c.id] ? (
                          <span className="flex items-center gap-2 text-emerald-600 font-semibold">
                            <Clock className="w-3.5 h-3.5" /> Active {new Date(firmLastActivity[c.id]).toLocaleString()}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 italic">
                            <Clock className="w-3.5 h-3.5" /> No recent session
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex gap-2 items-center">
                        <Badge className="text-[10px] font-semibold uppercase py-0.5 px-2 bg-slate-100 text-slate-700 dark:text-slate-300 border-none tracking-[0.04em]">{c.subscription_plan}</Badge>
                        <span className="text-[10px] font-semibold text-slate-400 capitalize">({c.subscription_status})</span>
                      </div>
                    </div>
                    
                    <div className="hidden md:flex flex-col items-center justify-center px-4">
                      <span className={`inline-flex py-1 px-2.5 rounded-full text-[10px] font-semibold uppercase ${c.status === 'active' ? 'bg-slate-50 dark:bg-slate-800/50 text-primary/90 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40' : 'bg-red-50 text-red-700 border-[0.5px] border-black/9 dark:border-white/8 border-red-100'}`}>
                        {c.status}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-2">{new Date(c.created_date || c.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="flex flex-wrap md:flex-nowrap items-center gap-2 pt-3 md:pt-0 border-t border-slate-100 dark:border-slate-800/50 md:border-none mt-2 md:mt-0">
                      <Button variant="outline" size="sm" onClick={() => setFeaturesCompany(c)} className="flex-1 md:flex-none h-9 text-xs gap-2.5 px-3 rounded-xl border-primary/20 text-violet-700 bg-violet-50 hover:bg-violet-100 tracking-[0.04em]">
                        <Layers className="w-3.5 h-3.5" /> Features
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleImpersonate(c)} className="flex-1 md:flex-none h-9 text-xs gap-2.5 px-3 rounded-xl border-primary/20 text-primary/90 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 hover:text-primary/80 tracking-[0.04em]">
                        <UserCheck className="w-3.5 h-3.5" /> {t("impersonate", "Impersonate")}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(c)} className="flex-1 md:flex-none h-9 text-xs gap-2.5 px-3 rounded-xl border-primary/20 text-amber-700 bg-amber-50 hover:bg-amber-100 tracking-[0.04em]">
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenMessageDialog(c)} className="flex-1 md:flex-none h-9 text-xs gap-2.5 px-3 rounded-xl border-primary/20 text-blue-700 bg-blue-50 hover:bg-blue-100 tracking-[0.04em]">
                        <MessageSquare className="w-3.5 h-3.5" /> Message
                      </Button>
                      <Button variant={c.status === 'active' ? 'destructive' : 'default'} size="sm" onClick={() => handleToggleStatus(c)} className="flex-1 md:flex-none h-9 text-xs gap-2.5 px-3 rounded-xl tracking-[0.04em]">
                        {c.status === 'active' ? <AlertOctagon className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        {c.status === 'active' ? 'Suspend' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-slate-900/40 p-6 font-sans hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <DialogDescription className="sr-only">Details about the firm</DialogDescription>
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100 font-extrabold text-base flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4 text-primary" />
              {t("message_firm_admin", "Message Firm Admin:")} {selectedCompany?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 text-sm text-slate-700 dark:text-slate-300">
            <div className="space-y-1.5">
              <label className="font-semibold uppercase tracking-wide text-[10px] text-slate-500 dark:text-slate-400 block tracking-[0.04em]">{t("message_content", "Message Content")}</label>
              <textarea 
                value={messageContent} 
                onChange={(e) => setMessageContent(e.target.value)}
                rows={4}
                placeholder="Type your message to the firm administrator here..."
                className="w-full p-3 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none bg-slate-50 dark:bg-slate-800/50 text-sm resize-none"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setMessageDialogOpen(false)} className="flex-1 rounded-xl text-slate-700 dark:text-slate-300 border-primary/40 h-11">
              {t("cancel", "Cancel")}
            </Button>
            <Button onClick={handleSendMessage} disabled={sendingMessage} className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl h-11">
              {sendingMessage ? <OrbitLoader size="sm" /> : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Quota & Plans Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-slate-900/40 p-6 font-sans hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <DialogDescription className="sr-only">Adjust firm quota settings</DialogDescription>
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100 font-extrabold text-base flex items-center gap-2.5">
              <Edit2 className="w-4 h-4 text-primary" />
              {t("manage_limits", "Manage Limits:")} {selectedCompany?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 text-sm text-slate-700 dark:text-slate-300">
            <div className="space-y-1.5">
              <label className="font-semibold uppercase tracking-wide text-[10px] text-slate-500 dark:text-slate-400 block tracking-[0.04em]">{t("subscription_tier", "Subscription Tier")}</label>
              <select 
                value={subPlan} 
                onChange={(e) => setSubPlan(e.target.value)}
                className="w-full p-2.5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-1 focus:ring-primary focus:outline-none bg-slate-50 dark:bg-slate-800/50 text-sm"
              >
                <option value="starter">{t("starter_plan_29_mo", "Starter Plan ($29/mo)")}</option>
                <option value="professional">{t("professional_plan_79_mo", "Professional Plan ($79/mo)")}</option>
                <option value="enterprise">{t("enterprise_plan_199_mo", "Enterprise Plan ($199/mo)")}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold uppercase tracking-wide text-[10px] text-slate-500 dark:text-slate-400 block tracking-[0.04em]">{t("subscription_status", "Subscription Status")}</label>
              <select 
                value={subStatus} 
                onChange={(e) => setSubStatus(e.target.value)}
                className="w-full p-2.5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-1 focus:ring-primary focus:outline-none bg-slate-50 dark:bg-slate-800/50 text-sm"
              >
                <option value="trial">{t("trialing", "Trialing")}</option>
                <option value="active">{t("active_paid", "Active (Paid)")}</option>
                <option value="expired">{t("expired_trial_end", "Expired (Trial End)")}</option>
                <option value="inactive">{t("inactive", "Inactive")}</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold uppercase tracking-wide text-[10px] text-slate-500 dark:text-slate-400 block tracking-[0.04em]">{t("max_active_users", "Max Active Users")}</label>
                <Input 
                  type="number"
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(parseInt(e.target.value) || 0)}
                  className="rounded-xl border-primary/40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold uppercase tracking-wide text-[10px] text-slate-500 dark:text-slate-400 block tracking-[0.04em]">{t("max_active_cases", "Max Active Cases")}</label>
                <Input 
                  type="number"
                  value={maxCases}
                  onChange={(e) => setMaxCases(parseInt(e.target.value) || 0)}
                  className="rounded-xl border-primary/40"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="flex-1 rounded-xl text-slate-700 dark:text-slate-300 border-primary/40 h-11">
              {t("cancel", "Cancel")}
            </Button>
            <Button onClick={handleSaveQuotas} disabled={updatingQuota} className="flex-1 bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl h-11">
              {updatingQuota ? <OrbitLoader size="sm" /> : "Save Limits"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {featuresCompany && (
        <FirmFeaturesManager
          firm={featuresCompany}
          onClose={() => setFeaturesCompany(null)}
        />
      )}
    </div>
  );
}
