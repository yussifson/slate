import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Building2, Settings2, UserCog, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import CompanyFormDialog from "@/components/superadmin/CompanyFormDialog";
import FirmStaffManager from "@/components/superadmin/FirmStaffManager";
import { useCompany } from "@/hooks/useCompanyId";

export default function SuperAdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { company, isLoading } = useCompany();
  const [showForm, setShowForm] = useState(false);
  const [managingStaff, setManagingStaff] = useState(false);
  const { user, refreshUser } = useAuth();
  const createMutation = useMutation({
    mutationFn: async ({ form, adminName }) => {
      const created = await base44.entities.Company.create(form);
      
      // Link the current user's profile to the new company
      if (user?.id) {
        await base44.entities.Profile.update(user.id, {
          company_id: created.id,
          company_name: created.name,
          role: "company_admin"
        });
        // Immediately refresh the Auth context so the rest of the app gets the new company_id
        await refreshUser();
      }

      if (form.admin_email) {
        try {
          await base44.users.inviteUser(form.admin_email, "admin");
        } catch (e) {
          console.warn("Could not send invite (might already exist):", e);
        }
        await base44.entities.StaffRecord.create({
          company_id: created.id,
          user_email: form.admin_email,
          full_name: adminName || form.admin_email.split("@")[0],
          role: "company_admin",
          status: "active",
          currency: form.currency || "GHS",
        });
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["single-company"] });
      setShowForm(false);
      toast({ title: "Firm created successfully" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Company.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["single-company"] });
      setShowForm(false);
      toast({ title: "Firm updated" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        Loading firm settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Firm Setup</h1>
          <p className="text-sm text-muted-foreground">Configure your law firm and manage team members.</p>
        </div>
        {!company && (
          <Button onClick={() => setShowForm(true)} size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> Setup Firm
          </Button>
        )}
      </div>

      {company ? (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-primary">{company.name?.[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold">{company.name}</h2>
              <p className="text-sm text-muted-foreground">{company.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="text-[10px] bg-green-100 text-green-700">{company.status}</Badge>
                <span className="text-xs text-muted-foreground">{company.country} · {company.city}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Currency</p>
              <p className="font-medium mt-0.5">{company.currency}</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Plan</p>
              <p className="font-medium mt-0.5 capitalize">{company.subscription_plan}</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Max Users</p>
              <p className="font-medium mt-0.5">{company.max_users}</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Max Cases</p>
              <p className="font-medium mt-0.5">{company.max_cases}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowForm(true)}>
              <Settings2 className="w-3.5 h-3.5" /> Edit Firm Details
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setManagingStaff(true)}>
              <UserCog className="w-3.5 h-3.5" /> Manage Team
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center space-y-3">
          <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">No firm configured yet.</p>
          <Button onClick={() => setShowForm(true)} size="sm">Setup Your Firm</Button>
        </div>
      )}

      <CompanyFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={({ form, adminName }) =>
          company
            ? updateMutation.mutate({ id: company.id, data: form })
            : createMutation.mutate({ form, adminName })
        }
        initialData={company || null}
      />

      {managingStaff && company && (
        <FirmStaffManager firm={company} onClose={() => setManagingStaff(false)} />
      )}
    </div>
  );
}