import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { Shield, FileWarning, CheckCircle, Search, Plus, CreditCard, Activity} from 'lucide-react';
import { useIndustryRecords, useMutateIndustryRecord} from '@/hooks/useIndustryData';
import { Button} from "@/components/ui/button";
import { Input} from "@/components/ui/input";
import { toast} from 'react-hot-toast';
import { useAuth} from '@/lib/AuthContext';
import { Badge} from "@/components/ui/badge";

export default function PolicyholderPortal() {
 const { t} = useTranslation();
 const { user} = useAuth();

 // Real Database Hooks
 const { data: dbPolicies = [], isLoading: isPolLoading} = useIndustryRecords('policy');
 const { data: dbClaims = [], isLoading: isClaimsLoading} = useIndustryRecords('claim');
 const mutateRecord = useMutateIndustryRecord();

 const [showClaimModal, setShowClaimModal] = useState(false);
 const [claimData, setClaimData] = useState({ policyNumber: '', claimType: 'Auto', description: '', amount: ''});

 // For demo, we just map everything (in real world, filtering by user.id/email happens in hook/backend)
 const policies = dbPolicies.map(r => ({ id: r.id, status: r.status, ...r.data}));
 const claims = dbClaims.map(r => ({ id: r.id, status: r.status, ...r.data}));

 const handleFileClaim = () => {
 if (!claimData.policyNumber.trim() || !claimData.description.trim()) {
 return toast.error("Please provide policy number and description");
}

 const claimNumber = `CLM-${Math.floor(1000 + Math.random() * 9000)}`;

 mutateRecord.mutate({
 recordType: 'claim',
 payload: {
 claimNumber,
 policyNumber: claimData.policyNumber,
 claimantName: user?.name || 'Policyholder',
 claimType: claimData.claimType,
 incidentDate: new Date().toISOString().split('T')[0],
 claimAmount: parseFloat(claimData.amount) || 0,
 description: claimData.description
},
 status: 'Submitted',
 searchText: `${claimData.policyNumber} ${claimData.claimType} ${claimData.description}`
}, {
 onSuccess: () => {
 toast.success(`Claim ${claimNumber} submitted successfully!`);
 setShowClaimModal(false);
 setClaimData({ policyNumber: '', claimType: 'Auto', description: '', amount: ''});
}
});
};

 const isLoading = isPolLoading || isClaimsLoading;

 if (isLoading) {
 return <div className="py-12 text-center text-[#71717a] dark:text-gray-400">{t("loading_your_coverage_details", "Loading your coverage details...")}</div>;
}

 return (
 <div className="space-y-6 max-w-5xl mx-auto">
 {/* Header */}
 <div className="bg-gradient-to-r from-primary/90 to-primary/80 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
 <div className="relative z-10">
 <h1 className="text-2xl md:text-3xl font-semibold mb-2 tracking-[-0.02em]">{t("my_coverage_portal", "My Coverage Portal")}</h1>
 <p className="text-primary/10 max-w-xl">{t(
 "welcome_back_view_your_active_",
 "Welcome back. View your active policies, file new claims, and track your claim status instantly."
 )}</p>
 </div>
 <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
 <Shield className="w-64 h-64" />
 </div>
 </div>
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Left Column (Policies) */}
 <div className="col-span-1 lg:col-span-2 space-y-6">
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 md:p-5 border-b border-primary/40 bg-muted/50 flex justify-between items-center">
 <h3 className="font-semibold text-card-foreground flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"><Shield className="w-5 h-5 text-primary" /> {t("active_policies", "Active Policies")}</h3>
 </div>
 <div className="p-0">
 {policies.length === 0 ? (
 <div className="py-8 text-center text-[#71717a] dark:text-gray-400">{t("no_active_policies_found", "No active policies found.")}</div>
 ) : (
 <div className="divide-y divide-border">
 {policies.map(policy => {
 return (
 <div key={policy.id} className="p-5 hover:bg-muted/30 transition-colors">
 <div className="flex justify-between items-start mb-3">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <h4 className="font-semibold text-lg text-foreground">{policy.policyType} {t("insurance", "Insurance")}</h4>
 <Badge variant="outline" className={`${policy.status === 'Active' ? 'bg-slate-100 text-primary/90 border-primary/20' : 'bg-red-100 text-red-700 border-red-200'}`}>{policy.status}</Badge>
 </div>
 <p className="text-xs text-[#71717a] dark:text-gray-400 font-mono tracking-[0.04em]">{policy.policyNumber}</p>
 </div>
 <div className="text-right">
 <p className="text-xs text-[#71717a] dark:text-gray-400 uppercase font-semibold tracking-wider tracking-[0.04em]">{t("premium", "Premium")}</p>
 <p className="font-semibold text-primary">${Number(policy.premium).toLocaleString()}</p>
 </div>
 </div>
 <div className="bg-muted/50 rounded-xl p-3 grid grid-cols-2 gap-4 text-sm">
 <div>
 <p className="text-[#71717a] dark:text-gray-400 text-xs tracking-[0.04em]">{t("coverage_period", "Coverage Period")}</p>
 <p className="font-medium">{policy.startDate} {t("to", "to")} {policy.endDate}</p>
 </div>
 <div>
 <p className="text-[#71717a] dark:text-gray-400 text-xs tracking-[0.04em]">{t("sum_insured", "Sum Insured")}</p>
 <p className="font-medium">${Number(policy.sumInsured).toLocaleString()}</p>
 </div>
 </div>
 </div>
 );
})}
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Right Column (Claims Info) */}
 <div className="space-y-6">
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/40 bg-muted/50">
 <h3 className="font-semibold text-card-foreground flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"><FileWarning className="w-5 h-5 text-amber-600" /> {t("claim_center", "Claim Center")}</h3>
 </div>
 <div className="p-4 space-y-4">
 <Button onClick={() => setShowClaimModal(true)} className="w-full bg-primary hover:bg-primary text-white flex items-center justify-center gap-2 h-12">
 <Plus className="w-5 h-5" /> {t("file_a_new_claim", "File a New Claim")}
 </Button>
 
 <div className="pt-2">
 <h4 className="font-semibold text-sm mb-3 text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">{t("recent_claims", "Recent Claims")}</h4>
 {claims.length === 0 ? (
 <p className="text-xs text-[#71717a] dark:text-gray-400 text-center py-4 bg-muted/50 rounded-xl tracking-[0.04em]">{t("no_claims_history", "No claims history.")}</p>
 ) : (
 <div className="space-y-3">
 {claims.slice(0, 4).map(claim => {
 return (
 <div key={claim.id} className="flex justify-between items-center p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:border-primary/20 transition-colors bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <p className="font-semibold text-sm text-foreground">{claim.claimType} {t("claim", "Claim")}</p>
 <p className="text-[10px] text-[#71717a] dark:text-gray-400 mt-0.5">{claim.incidentDate}</p>
 </div>
 <div className="text-right">
 <p className="font-semibold text-xs tracking-[0.04em]">${Number(claim.claimAmount).toLocaleString()}</p>
 <span className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 inline-block ${claim.status === 'Paid' || claim.status === 'Approved' ? 'bg-slate-100 text-primary/90' : 'bg-amber-100 text-amber-700'}`}>
 {claim.status}
 </span>
 </div>
 </div>
 );
})}
 </div>
 )}
 </div>
 </div>
 </div>
 
 <div className="bg-gradient-to-br from-card to-muted rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 text-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CreditCard className="w-8 h-8 text-primary mx-auto mb-2" />
 <h4 className="font-semibold text-sm">{t("need_to_pay_your_premium", "Need to pay your premium?")}</h4>
 <p className="text-xs text-[#71717a] dark:text-gray-400 mt-1 mb-3 tracking-[0.04em]">{t(
 "keep_your_coverage_active_by_s",
 "Keep your coverage active by settling your upcoming bills."
 )}</p>
 <Button variant="outline" className="w-full text-primary border-primary/20 hover:bg-slate-50">{t("make_a_payment", "Make a Payment")}</Button>
 </div>
 </div>
 </div>
 {showClaimModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <FileWarning className="w-5 h-5 text-red-600"/> {t("file_a_claim", "File a Claim")}
 </h2>
 <div className="space-y-3">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("policy_number", "Policy Number")}</label>
 <select value={claimData.policyNumber} onChange={e => setClaimData({ ...claimData, policyNumber: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm text-foreground">
 <option value="">{t("select_a_policy", "Select a policy...")}</option>
 {policies.map(p => {
 return (<option key={p.id} value={p.policyNumber}>{p.policyType}- {p.policyNumber}</option>);
})}
 </select>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("claim_type", "Claim Type")}</label>
 <select value={claimData.claimType} onChange={e => setClaimData({...claimData, claimType: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm text-foreground">
 <option>{t("auto", "Auto")}</option>
 <option>{t("health", "Health")}</option>
 <option>{t("property", "Property")}</option>
 <option>{t("life", "Life")}</option>
 <option>{t("business", "Business")}</option>
 </select>
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("est_amount", "Est. Amount ($)")}</label>
 <Input type="number" value={claimData.amount} onChange={e => setClaimData({...claimData, amount: e.target.value})} className="mt-1" placeholder="1500" />
 </div>
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("incident_description", "Incident Description")}</label>
 <textarea 
 value={claimData.description} 
 onChange={e => setClaimData({ ...claimData, description: e.target.value})} 
 className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm text-foreground min-h-[80px]" 
 placeholder="Briefly describe what happened..." 
 />
 </div>
 </div>
 <div className="flex gap-3 pt-4">
 <Button variant="outline" className="flex-1" onClick={() => setShowClaimModal(false)}>{t("cancel", "Cancel")}</Button>
 <Button className="flex-1 bg-primary hover:bg-primary text-white" onClick={handleFileClaim}>{t("submit_claim", "Submit Claim")}</Button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
