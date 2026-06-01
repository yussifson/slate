import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { UserCog, Search, Trash2, UserPlus, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import { format } from "date-fns";
import { useFirmSettings } from "@/hooks/useFirmSettings";
import AddOptionInline from "@/components/shared/AddOptionInline";
import { useToast } from "@/components/ui/use-toast";
import { useCompanyId, useCompany } from "@/hooks/useCompanyId";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import { useNotifications } from "@/hooks/useNotifications";

import { getIndustryRoles } from "@/config/industries";

const roleColors = {
  company_admin: "bg-purple-100 text-purple-700",
  lawyer: "bg-blue-100 text-blue-700",
  paralegal: "bg-cyan-100 text-cyan-700",
  hr: "bg-green-100 text-green-700",
  finance: "bg-amber-100 text-amber-700",
  support: "bg-slate-100 text-slate-600",
};

export default function Team() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const { company } = useCompany();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [search, setSearch] = useState("");
  const { notify } = useNotifications();

  const canManage = ["super_admin", "company_admin"].includes(user?.role);

  const handleAddClick = () => {
    const currentPlan = SUBSCRIPTION_PLANS[company?.subscription_plan] || SUBSCRIPTION_PLANS.free_trial;
    const userLimit = currentPlan.maxUsers || 5;
    
    if (staff.length >= userLimit) {
      toast({ 
        title: "Limit Reached", 
        description: `Your ${currentPlan.name} plan allows up to ${userLimit} team members. Please upgrade your plan.`, 
        variant: "destructive" 
      });
      return;
    }
    setShowCreate(true);
  };

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["staff", companyId],
    queryFn: () => base44.entities.StaffRecord.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.StaffRecord.create({ ...data, company_id: companyId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["staff"] }); setShowCreate(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.StaffRecord.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["staff"] }); setEditingStaff(null); },
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.StaffRecord.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({ title: "Staff member removed" });
    },
  });

  const filtered = staff.filter(s => !search || s.full_name?.toLowerCase().includes(search.toLowerCase()) || s.user_email?.toLowerCase().includes(search.toLowerCase()));

  const columns = [
    {
      header: "Staff Member",
      render: row => {
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{row.full_name?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <p className="font-medium text-sm">{row.full_name}</p>
              <p className="text-xs text-muted-foreground">{row.user_email}</p>
            </div>
          </div>
        );
      }
    },
    { header: "Role", render: row => {
      return <Badge className={`${roleColors[row.role] || "bg-gray-100 text-gray-600"} text-[10px] capitalize`}>{row.role?.replace(/_/g, " ")}</Badge>;
    } },
    { header: "Department", render: row => {
      return <span className="text-sm">{row.department || "—"}</span>;
    } },
    {
      header: "Status",
      render: row => {
        return (
          <Badge className={`text-[10px] ${row.status === "active" ? "bg-green-100 text-green-700" : row.status === "on_leave" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
            {row.status?.replace("_", " ")}
          </Badge>
        );
      }
    },
    { header: "Joined", render: row => {
      return <span className="text-xs text-muted-foreground">{row.hire_date ? format(new Date(row.hire_date), "MMM d, yyyy") : "—"}</span>;
    } },
    ...(canManage ? [{
      header: "Actions",
      render: row => {
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" size="sm" className="h-7 px-2 text-xs"
              onClick={(e) => { e.stopPropagation(); setEditingStaff(row); }}
            >
              {t("edit", "Edit")}
            </Button>
            <Button
              variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-50"
              onClick={(e) => { e.stopPropagation(); if (window.confirm(`Remove ${row.full_name}?`)) removeMutation.mutate(row.id); }}
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
            </Button>
          </div>
        );
      }
    }] : []),
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Team"
        subtitle={`${staff.filter(s => s.status === "active").length} active members`}
        actions={canManage && (
          <Button onClick={handleAddClick} size="sm" className="gap-1.5">
            <UserPlus className="w-4 h-4" /> {t("add_team_member", "Add Team Member")}
          </Button>
        )}
      />
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search team..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <DataTable columns={columns} data={filtered} isLoading={isLoading} onRowClick={canManage ? (row) => setEditingStaff(row) : undefined} emptyTitle="No team members" emptyIcon={UserCog} />
      {/* Create / Edit dialog */}
      <StaffDialog
        open={showCreate || !!editingStaff}
        onClose={() => { setShowCreate(false); setEditingStaff(null); }}
        industryRoles={getIndustryRoles(user?.company_industry)}
        onSubmit={async (data, password) => {
          if (editingStaff) {
            updateMutation.mutate({ id: editingStaff.id, data });
          } else {
            try {
              await base44.auth.register({ email: data.user_email, password });
              createMutation.mutate(data);
              
              await notify({
                recipientEmail: data.user_email,
                title: "Welcome to Optalflow!",
                message: `Your account has been created by ${user?.full_name || 'an Admin'}. You can now log in using this email address and the temporary password provided to you.`,
                type: "WELCOME"
              });

              toast({ title: `✓ Account created for ${data.full_name}`, description: `They can log in and change their password anytime.` });
            } catch (err) {
              toast({ title: "Account creation failed", description: err?.message || "Please try again.", variant: "destructive" });
            }
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const { company } = useCompany();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [search, setSearch] = useState("");
  const { notify } = useNotifications();

  const canManage = ["super_admin", "company_admin"].includes(user?.role);

  const handleAddClick = () => {
    const currentPlan = SUBSCRIPTION_PLANS[company?.subscription_plan] || SUBSCRIPTION_PLANS.free_trial;
    const userLimit = currentPlan.maxUsers || 5;
    
    if (staff.length >= userLimit) {
      toast({ 
        title: "Limit Reached", 
        description: `Your ${currentPlan.name} plan allows up to ${userLimit} team members. Please upgrade your plan.`, 
        variant: "destructive" 
      });
      return;
    }
    setShowCreate(true);
  };

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["staff", companyId],
    queryFn: () => base44.entities.StaffRecord.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.StaffRecord.create({ ...data, company_id: companyId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["staff"] }); setShowCreate(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.StaffRecord.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["staff"] }); setEditingStaff(null); },
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.StaffRecord.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({ title: "Staff member removed" });
    },
  });

  const filtered = staff.filter(s => !search || s.full_name?.toLowerCase().includes(search.toLowerCase()) || s.user_email?.toLowerCase().includes(search.toLowerCase()));

  const columns = [
    {
      header: "Staff Member",
      render: row => {
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{row.full_name?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <p className="font-medium text-sm">{row.full_name}</p>
              <p className="text-xs text-muted-foreground">{row.user_email}</p>
            </div>
          </div>
        );
      }
    },
    { header: "Role", render: row => {
      return <Badge className={`${roleColors[row.role] || "bg-gray-100 text-gray-600"} text-[10px] capitalize`}>{row.role?.replace(/_/g, " ")}</Badge>;
    } },
    { header: "Department", render: row => {
      return <span className="text-sm">{row.department || "—"}</span>;
    } },
    {
      header: "Status",
      render: row => {
        return (
          <Badge className={`text-[10px] ${row.status === "active" ? "bg-green-100 text-green-700" : row.status === "on_leave" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
            {row.status?.replace("_", " ")}
          </Badge>
        );
      }
    },
    { header: "Joined", render: row => {
      return <span className="text-xs text-muted-foreground">{row.hire_date ? format(new Date(row.hire_date), "MMM d, yyyy") : "—"}</span>;
    } },
    ...(canManage ? [{
      header: "Actions",
      render: row => {
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" size="sm" className="h-7 px-2 text-xs"
              onClick={(e) => { e.stopPropagation(); setEditingStaff(row); }}
            >
              {t("edit", "Edit")}
            </Button>
            <Button
              variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-50"
              onClick={(e) => { e.stopPropagation(); if (window.confirm(`Remove ${row.full_name}?`)) removeMutation.mutate(row.id); }}
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
            </Button>
          </div>
        );
      }
    }] : []),
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Team"
        subtitle={`${staff.filter(s => s.status === "active").length} active members`}
        actions={canManage && (
          <Button onClick={handleAddClick} size="sm" className="gap-1.5">
            <UserPlus className="w-4 h-4" /> {t("add_team_member", "Add Team Member")}
          </Button>
        )}
      />
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search team..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <DataTable columns={columns} data={filtered} isLoading={isLoading} onRowClick={canManage ? (row) => setEditingStaff(row) : undefined} emptyTitle="No team members" emptyIcon={UserCog} />
      {/* Create / Edit dialog */}
      <StaffDialog
        open={showCreate || !!editingStaff}
        onClose={() => { setShowCreate(false); setEditingStaff(null); }}
        industryRoles={getIndustryRoles(user?.company_industry)}
        onSubmit={async (data, password) => {
          if (editingStaff) {
            updateMutation.mutate({ id: editingStaff.id, data });
          } else {
            try {
              await base44.auth.register({ email: data.user_email, password });
              createMutation.mutate(data);
              
              await notify({
                recipientEmail: data.user_email,
                title: "Welcome to Optalflow!",
                message: `Your account has been created by ${user?.full_name || 'an Admin'}. You can now log in using this email address and the temporary password provided to you.`,
                type: "WELCOME"
              });

              toast({ title: `✓ Account created for ${data.full_name}`, description: `They can log in and change their password anytime.` });
            } catch (err) {
              toast({ title: "Account creation failed", description: err?.message || "Please try again.", variant: "destructive" });
            }
          }
        }}
        initialData={editingStaff}
        isNew={!editingStaff}
      />
    </div>
  );
}

function StaffDialog({ open, onClose, onSubmit, initialData, isNew, industryRoles = [] }) {
  const { t } = useTranslation();
  const { roles, addRole } = useFirmSettings();
  const [form, setForm] = useState({
    full_name: "", user_email: "", role: "lawyer", department: "",
    phone: "", hire_date: "", status: "active", bar_number: ""
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const defaultRole = industryRoles[0]?.value || "lawyer";
    if (initialData) setForm(initialData);
    else setForm({ full_name: "", user_email: "", role: defaultRole, department: "", phone: "", hire_date: "", status: "active", bar_number: "" });
    setPassword("");
    setShowPassword(false);
  }, [initialData, open, industryRoles]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(form, password);
    setSubmitting(false);
  };

  const triggerReset = async () => {
    try {
      await base44.auth.resetPasswordForEmail(form.user_email);
      toast({ title: "Password reset email sent!" });
    } catch (err) {
      toast({ title: "Failed to send reset email", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isNew ? <><UserPlus className="w-4 h-4" /> {t("add_team_member", "Add Team Member")}</> : <><UserCog className="w-4 h-4" /> {t("edit_staff_member", "Edit Staff Member")}</>}
          </DialogTitle>
          {isNew && <p className="text-xs text-muted-foreground mt-1">{t(
            "create_an_account_with_a_tempo",
            "Create an account with a temporary password. The team member can change it after logging in."
          )}</p>}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>{t("full_name", "Full Name *")}</Label>
              <Input className="mt-1" value={form.full_name} onChange={(e) => handleChange("full_name", e.target.value)} required />
            </div>
            <div>
              <Label>{t("email_address", "Email Address *")}</Label>
              <Input className="mt-1" value={form.user_email} onChange={(e) => handleChange("user_email", e.target.value)} type="email" required disabled={!isNew} />
              {!isNew && <p className="text-[10px] text-muted-foreground mt-0.5">{t("email_cannot_be_changed", "Email cannot be changed.")}</p>}
            </div>
            {isNew && (
              <div>
                <Label>{t("temporary_password", "Temporary Password *")}</Label>
                <div className="relative mt-1">
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                    className="pr-9"
                  />
                  <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(v => !v)}>
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
            <div>
              <Label>{t("phone", "Phone")} <span className="text-muted-foreground text-xs">{t("optional", "(optional)")}</span></Label>
              <Input className="mt-1" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
            </div>
            <div>
              <Label>{t("role", "Role")}</Label>
              <Select value={form.role} onValueChange={(v) => handleChange("role", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {industryRoles.map(r => {
                    return <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>;
                  })}
                  <AddOptionInline onAdd={(v) => { addRole(v); handleChange("role", v); }} placeholder="New custom role..." />
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("department", "Department")} <span className="text-muted-foreground text-xs">{t("optional", "(optional)")}</span></Label>
              <Input className="mt-1" value={form.department} onChange={(e) => handleChange("department", e.target.value)} />
            </div>
            <div>
              <Label>{t("hire_date", "Hire Date")} <span className="text-muted-foreground text-xs">{t("optional", "(optional)")}</span></Label>
              <Input className="mt-1" type="date" value={form.hire_date} onChange={(e) => handleChange("hire_date", e.target.value)} />
            </div>
            <div>
              <Label>{t("bar_number", "Bar Number")} <span className="text-muted-foreground text-xs">{t("optional", "(optional)")}</span></Label>
              <Input className="mt-1" value={form.bar_number} onChange={(e) => handleChange("bar_number", e.target.value)} placeholder="For lawyers" />
            </div>
            {!isNew && (
              <div>
                <Label>{t("status", "Status")}</Label>
                <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("active", "Active")}</SelectItem>
                    <SelectItem value="inactive">{t("inactive", "Inactive")}</SelectItem>
                    <SelectItem value="on_leave">{t("on_leave", "On Leave")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-between gap-2 pt-1">
            <div>
              {!isNew && (
                <Button type="button" variant="outline" onClick={triggerReset} className="text-xs h-9">
                  {t("send_password_reset_email", "Send Password Reset Email")}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="h-9">{t("cancel", "Cancel")}</Button>
              <Button type="submit" disabled={submitting} className="gap-1.5 h-9">
                {isNew ? (submitting ? "Creating..." : "Create Account") : (submitting ? "Saving..." : "Save Changes")}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}