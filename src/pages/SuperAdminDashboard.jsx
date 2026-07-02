import { useTranslation} from "react-i18next";
import React, { useState, useEffect} from "react";
import { base44} from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import { useAuth} from "@/lib/AuthContext";
import { getTerm} from "@/config/industries";
import { Building2, Settings2, UserCog, Plus, Handshake } from "lucide-react";
import { Button} from "@/components/ui/button";
import { Badge} from "@/components/ui/badge";
import { useToast} from "@/components/ui/use-toast";
import CompanyFormDialog from "@/components/superadmin/CompanyFormDialog";
import FirmStaffManager from "@/components/superadmin/FirmStaffManager";
import PartnerApplicationsDialog from "@/components/superadmin/PartnerApplicationsDialog";
import { useCompany } from "@/hooks/useCompanyId";
import { useNavigate } from "react-router-dom";

export default function SuperAdminDashboard() {
 const { t} = useTranslation();
 const navigate = useNavigate();
 const { toast} = useToast();
 const queryClient = useQueryClient();
 const { company, isLoading} = useCompany();
 const [showForm, setShowForm] = useState(false);
 const [managingStaff, setManagingStaff] = useState(false);
 const [showPartners, setShowPartners] = useState(false);
 const { user, refreshUser } = useAuth();
 const activeIndustry = user?.company_industry || "law";

 useEffect(() => {
 if (!isLoading && user?.company_id && company) {
 navigate("/my-dashboard", { replace: true});
}
}, [isLoading, user?.company_id, company, navigate]);

 const createMutation = useMutation({
 mutationFn: async ({ form, adminName}) => {
 const created = await base44.entities.Company.create(form);
 
 // Link the current user's profile to the new company
 if (user?.id) {
 const _payload = {
 company_id: created.id,
 company_name: created.name
};
 if (user?.role !== 'super_admin') {
 _payload.role = "company_admin";
}
 await base44.entities.Profile.update(user.id, _payload);
 // Immediately refresh the Auth context so the rest of the app gets the new company_id
 await refreshUser();
}

 if (form.admin_email) {
 try {
 // Invite user to the platform with a temporary password
 const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
 const { registerSchoolUser} = await import('@/api/authUtils');
 await registerSchoolUser(form.admin_email, tempPassword, 'admin', created.id, adminName || form.admin_email.split("@")[0]);
 toast({ title: "Success", description: `Company added! Admin password: ${tempPassword}`, duration: 10000});
} catch (e) {
 console.warn("Could not send invite (might already exist):", e);
}
 await base44.entities.StaffRecord.create({
 company_id: created.id,
 user_email: form.admin_email,
 full_name: adminName || form.admin_email.split("@")[0],
 role: "company_admin",
 status: "active",
 currency: form.currency || "GHS"});
}
 return created;
},
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["single-company"]});
 setShowForm(false);
 toast({ title: "Firm created successfully"});
}});

 const updateMutation = useMutation({
 mutationFn: ({ id, data}) => base44.entities.Company.update(id, data),
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["single-company"]});
 setShowForm(false);
 toast({ title: "Firm updated"});
}});

 if (isLoading) {
 return (
 <div className="flex items-center justify-center h-40 text-[#71717a] dark:text-gray-400 text-sm">
 {t("loading_firm_settings", "Loading firm settings...")}
 </div>
 );
}

 return (
 <div className="space-y-6 max-w-2xl">
 <div className="relative overflow-hidden bg-gradient-to-br from-primary/90 to-primary/70 rounded-md-[2.5rem] p-5 md:p-8 md:p-12 text-white border-[0.5px] border-black/9 dark:border-white/8 border-white/10">
 <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6">
 <div className="text-center md:text-left">
 <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 tracking-[-0.02em]">Welcome back, {user?.user_metadata?.full_name || 'Admin'}</h1>
 <p className="text-primary/10 font-medium text-lg">System Configuration & {getTerm(activeIndustry, "venue") || "Firm"} Setup</p>
 </div>
 {!company && (
  <div className="flex flex-col sm:flex-row items-center gap-3">
    <div className="flex items-center bg-white dark:bg-slate-900/40/10 p-2 rounded-2xl backdrop-blur-md border-[0.5px] border-black/9 dark:border-white/8 border-white/20  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
      <Button onClick={() => setShowForm(true)} size="sm" className="gap-2.5 text-sm font-semibold bg-white dark:bg-slate-900/40 text-primary/70 hover:bg-white dark:bg-slate-900/40/90 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <Plus className="w-4 h-4" /> {t("setup_firm", "Setup " + (getTerm(activeIndustry, "venue") || "Firm"))}
      </Button>
    </div>
    <div className="flex items-center bg-white dark:bg-slate-900/40/10 p-2 rounded-2xl backdrop-blur-md border-[0.5px] border-black/9 dark:border-white/8 border-white/20  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
      <Button onClick={() => setShowPartners(true)} size="sm" className="gap-2.5 text-sm font-semibold bg-white dark:bg-slate-900/40 text-primary/70 hover:bg-white dark:bg-slate-900/40/90 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <Handshake className="w-4 h-4" /> Partner Applications
      </Button>
    </div>
  </div>
 )}
 </div>
 </div>
 {company ? (
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-5 space-y-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
 <span className="text-lg font-semibold text-primary">{company.name?.[0]?.toUpperCase()}</span>
 </div>
 <div className="flex-1">
 <h2 className="text-base font-semibold">{company.name}</h2>
 <p className="text-sm text-[#71717a] dark:text-gray-400">{company.email}</p>
 <div className="flex items-center gap-2 mt-1">
 <Badge className="text-[10px] bg-slate-100 text-primary/90">{company.status}</Badge>
 <span className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{company.country} · {company.city}</span>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
 <div className="bg-muted/40 rounded-xl p-3">
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("currency", "Currency")}</p>
 <p className="font-medium mt-0.5">{company.currency}</p>
 </div>
 <div className="bg-muted/40 rounded-xl p-3">
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("plan", "Plan")}</p>
 <p className="font-medium mt-0.5 capitalize">{company.subscription_plan}</p>
 </div>
 <div className="bg-muted/40 rounded-xl p-3">
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("max_users", "Max Users")}</p>
 <p className="font-medium mt-0.5">{company.max_users}</p>
 </div>
 <div className="bg-muted/40 rounded-xl p-3">
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("max_cases", "Max " + (getTerm(activeIndustry, "cases") || "Cases"))}</p>
 <p className="font-medium mt-0.5">{company.max_cases}</p>
 </div>
 </div>

 <div className="flex flex-wrap gap-2 pt-1">
 <Button variant="outline" size="sm" className="gap-2.5" onClick={() => setShowForm(true)}>
 <Settings2 className="w-3.5 h-3.5" /> {t("edit_firm_details", "Edit " + (getTerm(activeIndustry, "venue") || "Firm") + " Details")}
 </Button>
 <Button variant="outline" size="sm" className="gap-2.5" onClick={() => setManagingStaff(true)}>
 <UserCog className="w-3.5 h-3.5" /> {t("manage_team", "Manage Team")}
 </Button>
 <Button variant="outline" size="sm" className="gap-2.5 border-primary/40 text-primary hover:bg-primary/5 hover:text-primary" onClick={() => setShowPartners(true)}>
 <Handshake className="w-3.5 h-3.5" /> Partner Applications
 </Button>
 </div>
 </div>
 ) : (
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-dashed border-primary/40 rounded-xl p-10 text-center space-y-3 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Building2 className="w-10 h-10 text-[#71717a] dark:text-gray-400/40 mx-auto" />
 <p className="text-sm text-[#71717a] dark:text-gray-400">{t("no_firm_configured_yet", "No " + (getTerm(activeIndustry, "venue") || "firm").toLowerCase() + " configured yet.")}</p>
 <Button onClick={() => setShowForm(true)} size="sm">{t("setup_your_firm", "Setup Your " + (getTerm(activeIndustry, "venue") || "Firm"))}</Button>
 </div>
 )}
 <CompanyFormDialog
 open={showForm}
 onClose={() => setShowForm(false)}
 onSubmit={({ form, adminName}) =>
 company
 ? updateMutation.mutate({ id: company.id, data: form})
 : createMutation.mutate({ form, adminName})
}
 initialData={company || null}
 />
 {managingStaff && company && (
 <FirmStaffManager firm={company} onClose={() => setManagingStaff(false)} />
 )}
 <PartnerApplicationsDialog
 open={showPartners}
 onOpenChange={setShowPartners}
 />
 </div>
 );
}