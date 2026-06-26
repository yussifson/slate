import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from 'react';
import { Shield, FileWarning, CheckCircle, Search, Plus, CreditCard, Activity, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/AuthContext';
import { Badge } from "@/components/ui/badge";
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from '@/api/PowerSyncConnector';
import { supabase } from "@/api/supabaseClient";

export default function PolicyholderPortal() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();

  const [policies, setPolicies] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimData, setClaimData] = useState({ policy_number: '', claim_type: 'Auto', description: '', amount: '' });

  useEffect(() => {
    if (companyId) {
      fetchData();
      const channelPol = supabase.channel('univ_insurancepolicy_changes_portal')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_insurancepolicy', filter: `company_id=eq.${companyId}` }, () => fetchData())
        .subscribe();
      const channelClaim = supabase.channel('insurance_claims_changes_portal')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'insurance_claims', filter: `company_id=eq.${companyId}` }, () => fetchData())
        .subscribe();
      return () => { 
        supabase.removeChannel(channelPol); 
        supabase.removeChannel(channelClaim); 
      };
    }
  }, [companyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [policiesData, claimsData] = await Promise.all([
        powerSync.getAll(`SELECT * FROM univ_insurancepolicy WHERE company_id = ? ORDER BY created_at DESC`, [companyId]),
        powerSync.getAll(`SELECT * FROM insurance_claims WHERE company_id = ? ORDER BY created_at DESC`, [companyId])
      ]);
      setPolicies(policiesData || []);
      setClaims(claimsData || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load coverage details');
    } finally {
      setLoading(false);
    }
  };

  const handleFileClaim = async (e) => {
    e.preventDefault();
    if (!claimData.policy_number.trim() || !claimData.description.trim()) {
      return toast.error("Please provide policy number and description");
    }

    try {
      const claimNumber = `CLM-${Math.floor(1000 + Math.random() * 9000)}`;
      const id = crypto.randomUUID();
      const incidentDate = new Date().toISOString().split('T')[0];

      await powerSync.execute(
        `INSERT INTO insurance_claims (id, company_id, case_number, client_name, policy_number, case_type, claim_amount, incident_date, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [id, companyId, claimNumber, user?.name || 'Policyholder', claimData.policy_number, claimData.claim_type, parseFloat(claimData.amount) || 0, incidentDate, claimData.description, 'Submitted']
      );

      toast.success(`Claim ${claimNumber} submitted successfully!`);
      setShowClaimModal(false);
      setClaimData({ policy_number: '', claim_type: 'Auto', description: '', amount: '' });
      fetchData();
    } catch (err) {
      toast.error('Failed to file claim: ' + err.message);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-[#71717a] dark:text-gray-400">{t("loading_your_coverage_details", "Loading your coverage details...")}</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/90 to-primary/80 rounded-3xl p-8 text-white relative overflow-hidden shadow-sm">
        <div className="relative z-10">
          <h1 className="text-3xl font-semibold mb-2 tracking-[-0.02em]">{t("my_coverage_portal", "My Coverage Portal")}</h1>
          <p className="text-primary/10 max-w-xl text-sm leading-relaxed">{t("welcome_back_view_your_active_", "Welcome back. View your active policies, file new claims, and track your claim status instantly.")}</p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
          <Shield className="w-64 h-64" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Policies) */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden shadow-sm hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <div className="p-5 border-b border-primary/40 bg-muted/20 flex justify-between items-center">
              <h3 className="font-semibold text-card-foreground flex items-center gap-2 tracking-[-0.02em]"><Shield className="w-5 h-5 text-primary" /> {t("active_policies", "Active Policies")}</h3>
            </div>
            <div className="p-0">
              {policies.length === 0 ? (
                <div className="py-12 text-center text-[#71717a] dark:text-gray-400">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  {t("no_active_policies_found", "No active policies found.")}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {policies.map(policy => (
                    <motion.div initial={{opacity:0, y:5}} animate={{opacity:1, y:0}} key={policy.id} className="p-5 hover:bg-muted/30 transition-colors group cursor-pointer">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1.5">
                            <h4 className="font-semibold text-lg text-foreground tracking-[-0.01em]">{policy.coverage_type} {t("insurance", "Insurance")}</h4>
                            <Badge variant="outline" className={`font-semibold tracking-wider text-[9px] uppercase px-2 py-0.5 border-0 ${policy.status === 'Active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10' : 'bg-red-50 text-red-700 dark:bg-red-500/10'}`}>{policy.status}</Badge>
                          </div>
                          <p className="text-xs text-[#71717a] dark:text-gray-400 font-mono tracking-[0.04em]">{policy.policy_number}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-[#71717a] dark:text-gray-400 uppercase font-semibold tracking-wider mb-0.5">{t("premium", "Premium")}</p>
                          <p className="font-bold text-primary">${Number(policy.premium_amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                        </div>
                      </div>
                      <div className="bg-muted/40 rounded-xl p-4 grid grid-cols-2 gap-4 text-sm group-hover:bg-muted/60 transition-colors">
                        <div>
                          <p className="text-[#71717a] dark:text-gray-400 text-[11px] font-semibold tracking-wider uppercase mb-1">{t("coverage_period", "Coverage Period")}</p>
                          <p className="font-medium text-sm text-foreground">{policy.start_date || 'N/A'} <span className="text-[#71717a] px-1">to</span> {policy.end_date || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[#71717a] dark:text-gray-400 text-[11px] font-semibold tracking-wider uppercase mb-1">{t("sum_insured", "Sum Insured")}</p>
                          <p className="font-medium text-sm text-foreground">${Number(policy.sum_insured || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Claims Info) */}
        <div className="space-y-6 school-page-enter font-dmsans">
          <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden shadow-sm hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <div className="p-5 border-b border-primary/40 bg-muted/20">
              <h3 className="font-semibold text-card-foreground flex items-center gap-2 tracking-[-0.02em]"><FileWarning className="w-5 h-5 text-amber-600" /> {t("claim_center", "Claim Center")}</h3>
            </div>
            <div className="p-5 space-y-5">
              <Button onClick={() => setShowClaimModal(true)} className="w-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 h-12 rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)]">
                <Plus className="w-5 h-5" /> {t("file_a_new_claim", "File a New Claim")}
              </Button>
              
              <div className="pt-2">
                <h4 className="font-semibold text-[11px] mb-3 text-[#71717a] dark:text-gray-400 uppercase tracking-wider">{t("recent_claims", "Recent Claims")}</h4>
                {claims.length === 0 ? (
                  <p className="text-xs text-[#71717a] dark:text-gray-400 text-center py-6 bg-muted/30 rounded-xl">{t("no_claims_history", "No claims history.")}</p>
                ) : (
                  <div className="space-y-3">
                    {claims.slice(0, 4).map(claim => (
                      <div key={claim.id} className="flex justify-between items-center p-4 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:border-primary/60 transition-colors bg-card shadow-sm cursor-pointer hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                        <div>
                          <p className="font-semibold text-sm text-foreground tracking-[-0.01em]">{claim.case_type} {t("claim", "Claim")}</p>
                          <p className="text-[10px] text-[#71717a] dark:text-gray-400 mt-1">{claim.incident_date}</p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <p className="font-bold text-sm mb-1">${Number(claim.claim_amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                          <span className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${claim.status === 'Paid' || claim.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10' : claim.status === 'Rejected' ? 'bg-red-50 text-red-700 dark:bg-red-500/10' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10'}`}>
                            {claim.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-card to-muted rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-6 text-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <CreditCard className="w-8 h-8 text-primary mx-auto mb-3" />
            <h4 className="font-semibold text-sm tracking-[-0.01em]">{t("need_to_pay_your_premium", "Need to pay your premium?")}</h4>
            <p className="text-xs text-[#71717a] dark:text-gray-400 mt-1 mb-4 leading-relaxed">{t("keep_your_coverage_active_by_s", "Keep your coverage active by settling your upcoming bills.")}</p>
            <Button variant="outline" className="w-full text-primary border-primary/20 hover:bg-slate-50 rounded-xl h-10">{t("make_a_payment", "Make a Payment")}</Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showClaimModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} className="bg-card w-full max-w-md rounded-2xl flex flex-col shadow-xl border-[0.5px] border-black/9 dark:border-white/8">
              <div className="p-5 border-b border-border/40 flex justify-between items-center bg-muted/20">
                <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2 tracking-[-0.02em]">
                  <FileWarning className="w-5 h-5 text-red-600"/> {t("file_a_claim", "File a Claim")}
                </h2>
                <button onClick={() => setShowClaimModal(false)} className="p-1.5 bg-background rounded-full text-[#71717a] hover:text-foreground shadow-sm border border-border/40"><XCircle className="w-4 h-4"/></button>
              </div>
              <form onSubmit={handleFileClaim} className="p-5 space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider">{t("policy_number", "Policy Number")}</label>
                  <select required value={claimData.policy_number} onChange={e => setClaimData({ ...claimData, policy_number: e.target.value})} className="mt-1 w-full h-10 px-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 bg-background text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none">
                    <option value="">{t("select_a_policy", "Select a policy...")}</option>
                    {policies.map(p => (
                      <option key={p.id} value={p.policy_number}>{p.coverage_type} - {p.policy_number}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider">{t("claim_type", "Claim Type")}</label>
                    <select required value={claimData.claim_type} onChange={e => setClaimData({...claimData, claim_type: e.target.value})} className="mt-1 w-full h-10 px-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 bg-background text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none">
                      <option>{t("auto", "Auto")}</option>
                      <option>{t("health", "Health")}</option>
                      <option>{t("property", "Property")}</option>
                      <option>{t("life", "Life")}</option>
                      <option>{t("business", "Business")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider">{t("est_amount", "Est. Amount ($)")}</label>
                    <Input required type="number" value={claimData.amount} onChange={e => setClaimData({...claimData, amount: e.target.value})} className="mt-1 h-10 rounded-xl" placeholder="1500" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider">{t("incident_description", "Incident Description")}</label>
                  <textarea 
                    required
                    value={claimData.description} 
                    onChange={e => setClaimData({ ...claimData, description: e.target.value})} 
                    className="mt-1 w-full rounded-xl border-[0.5px] border-black/9 dark:border-white/8 bg-background p-3 text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none min-h-[100px] resize-none" 
                    placeholder="Briefly describe what happened..." 
                  />
                </div>
                <div className="flex gap-3 pt-4 border-t border-border/40">
                  <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setShowClaimModal(false)}>{t("cancel", "Cancel")}</Button>
                  <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm">{t("submit_claim", "Submit Claim")}</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
