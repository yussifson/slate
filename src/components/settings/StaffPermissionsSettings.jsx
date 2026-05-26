import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield } from "lucide-react";

const PERMISSION_GROUPS = [
  {
    label: "Cases",
    perms: [
      { key: "can_view_cases", label: "View Cases" },
      { key: "can_create_cases", label: "Create Cases" },
      { key: "can_edit_cases", label: "Edit Cases" },
      { key: "can_delete_cases", label: "Delete Cases" },
    ],
  },
  {
    label: "Clients",
    perms: [
      { key: "can_view_clients", label: "View Clients" },
      { key: "can_create_clients", label: "Create Clients" },
      { key: "can_edit_clients", label: "Edit Clients" },
      { key: "can_delete_clients", label: "Delete Clients" },
    ],
  },
  {
    label: "Finance",
    perms: [
      { key: "can_view_invoices", label: "View Invoices" },
      { key: "can_create_invoices", label: "Create Invoices" },
    ],
  },
  {
    label: "Documents",
    perms: [
      { key: "can_view_documents", label: "View Documents" },
      { key: "can_upload_documents", label: "Upload Documents" },
      { key: "can_delete_documents", label: "Delete Documents" },
    ],
  },
  {
    label: "Tasks",
    perms: [
      { key: "can_view_tasks", label: "View Tasks" },
      { key: "can_create_tasks", label: "Create Tasks" },
    ],
  },
  {
    label: "Other",
    perms: [
      { key: "can_view_team", label: "View Team" },
      { key: "can_view_reports", label: "View Reports" },
      { key: "can_manage_leave", label: "Manage Leave" },
    ],
  },
];

const DEFAULTS = {
  can_view_cases: true, can_create_cases: false, can_edit_cases: false, can_delete_cases: false,
  can_view_clients: true, can_create_clients: false, can_edit_clients: false, can_delete_clients: false,
  can_view_invoices: false, can_create_invoices: false,
  can_view_documents: true, can_upload_documents: true, can_delete_documents: false,
  can_view_tasks: true, can_create_tasks: true,
  can_view_team: false, can_view_reports: false, can_manage_leave: false,
};

export default function StaffPermissionsSettings() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [selectedStaff, setSelectedStaff] = useState(null);

  const { data: staff = [], isLoading: loadingStaff } = useQuery({
    queryKey: ["staff", companyId],
    queryFn: () => base44.entities.StaffRecord.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ["staff-permissions", companyId],
    queryFn: () => base44.entities.StaffPermission.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ staffEmail, staffName, key, value }) => {
      const existing = permissions.find(p => p.staff_email === staffEmail);
      if (existing) {
        return base44.entities.StaffPermission.update(existing.id, { [key]: value });
      } else {
        return base44.entities.StaffPermission.create({
          company_id: companyId,
          staff_email: staffEmail,
          staff_name: staffName,
          ...DEFAULTS,
          [key]: value,
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff-permissions", companyId] }),
  });

  const getPermission = (staffEmail, key) => {
    const p = permissions.find(p => p.staff_email === staffEmail);
    return p ? (p[key] ?? DEFAULTS[key]) : DEFAULTS[key];
  };

  const activeStaff = selectedStaff || staff[0];

  if (loadingStaff) return <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>;

  if (!staff.length) return (
    <div className="text-center py-10 text-muted-foreground text-sm">
      <Shield className="w-8 h-8 mx-auto mb-2 opacity-40" />
      No staff members found. Add staff first.
    </div>
  );

  return (
    <div className="flex gap-4 items-start">
      {/* Staff list */}
      <div className="w-48 shrink-0 bg-muted/30 rounded-xl border border-border overflow-hidden">
        {staff.map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedStaff(s)}
            className={`w-full text-left px-3 py-2.5 text-sm transition-colors border-b border-border last:border-0 ${activeStaff?.id === s.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground"}`}
          >
            <p className="font-medium truncate">{s.full_name}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{s.role?.replace(/_/g, " ")}</p>
          </button>
        ))}
      </div>

      {/* Permissions panel */}
      {activeStaff && (
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{activeStaff.full_name?.[0]}</span>
            </div>
            <div>
              <p className="font-semibold text-sm">{activeStaff.full_name}</p>
              <Badge variant="outline" className="text-[10px] capitalize">{activeStaff.role?.replace(/_/g, " ")}</Badge>
            </div>
          </div>

          {PERMISSION_GROUPS.map(group => (
            <div key={group.label} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-muted/40 border-b border-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</p>
              </div>
              <div className="divide-y divide-border">
                {group.perms.map(perm => (
                  <div key={perm.key} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm">{perm.label}</span>
                    <Switch
                      checked={getPermission(activeStaff.user_email, perm.key)}
                      onCheckedChange={(val) => updateMutation.mutate({
                        staffEmail: activeStaff.user_email,
                        staffName: activeStaff.full_name,
                        key: perm.key,
                        value: val,
                      })}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}