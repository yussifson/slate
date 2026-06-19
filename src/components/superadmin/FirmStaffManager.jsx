import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { UserCog, Mail, Trash2, UserPlus, Users } from "lucide-react";

const ROLES = [
  { value: "company_admin", label: "Company Admin" },
  { value: "lawyer", label: "Lawyer" },
  { value: "paralegal", label: "Paralegal" },
  { value: "hr", label: "HR" },
  { value: "finance", label: "Finance" },
  { value: "support", label: "Support" },
];

const ROLE_COLORS = {
  company_admin: "bg-slate-100 text-primary/90",
  lawyer: "bg-orange-100 text-orange-700",
  paralegal: "bg-slate-100 text-primary/90",
  hr: "bg-amber-100 text-amber-700",
  finance: "bg-slate-100 text-primary/90",
  support: "bg-slate-100 text-slate-600",
};

const emptyInvite = { full_name: "", user_email: "", role: "lawyer", department: "", bar_number: "" };

export default function FirmStaffManager({ firm, onClose }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [invite, setInvite] = useState(emptyInvite);
  const [inviting, setInviting] = useState(false);

  const { data: staffRecords = [], isLoading } = useQuery({
    queryKey: ["firm-staff", firm.id],
    queryFn: () => base44.entities.StaffRecord.filter({ company_id: firm.id }),
    enabled: !!firm.id,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => base44.entities.StaffRecord.update(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["firm-staff", firm.id] });
      toast({ title: "Role updated" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.StaffRecord.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["firm-staff", firm.id] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.StaffRecord.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["firm-staff", firm.id] });
      toast({ title: "Staff member removed" });
    },
  });

  const handleInvite = async () => {
    if (!invite.user_email || !invite.full_name) return;
    setInviting(true);
    try {
      // Register user to the platform with a temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
      const { registerSchoolUser } = await import('@/api/authUtils');
      const { user, error } = await registerSchoolUser(
        invite.user_email, 
        tempPassword, 
        invite.role, 
        firm.id, 
        invite.full_name
      );
      
      if (error && error.message !== 'already registered in this firm') {
        throw error;
      }

      // Create their staff record
      await base44.entities.StaffRecord.create({
        company_id: firm.id,
        user_email: invite.user_email,
        full_name: invite.full_name,
        role: invite.role,
        department: invite.department || undefined,
        bar_number: invite.bar_number || undefined,
        status: "active",
        currency: firm.currency || "GHS",
      });
      queryClient.invalidateQueries({ queryKey: ["firm-staff", firm.id] });
      toast({ 
        title: `✓ Invited ${invite.full_name}`, 
        description: `Their temporary password is: ${tempPassword}. Please share it with them.`,
        duration: 10000 
      });
      setInvite(emptyInvite);
    } catch (err) {
      toast({ title: "Invite failed", description: err?.message || "Please try again.", variant: "destructive" });
    }
    setInviting(false);
  };

  return (
    <Dialog open={!!firm} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-primary/40">
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="w-4 h-4" />
            {t("team", "Team —")} {firm.name}
          </DialogTitle>
          <p className="text-xs text-[#71717a] dark:text-gray-400 mt-0.5 tracking-[0.04em]">{t(
            "invite_staff_and_manage_their_",
            "Invite staff and manage their roles for this firm."
          )}</p>
        </DialogHeader>

        {/* Invite Section */}
        <div className="px-6 py-4 bg-muted/30 border-b border-primary/40 space-y-3">
          <p className="text-xs font-semibold text-foreground flex items-center gap-2.5 tracking-[0.04em]"><UserPlus className="w-3.5 h-3.5" />{t("invite_new_team_member", "Invite New Team Member")}</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs tracking-[0.04em]">{t("full_name", "Full Name *")}</Label>
              <Input
                className="mt-1 h-8 text-sm"
                placeholder="Jane Asante"
                value={invite.full_name}
                onChange={e => setInvite(p => ({ ...p, full_name: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs tracking-[0.04em]">{t("email_address", "Email Address *")}</Label>
              <Input
                className="mt-1 h-8 text-sm"
                type="email"
                placeholder="jane@firm.com"
                value={invite.user_email}
                onChange={e => setInvite(p => ({ ...p, user_email: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs tracking-[0.04em]">{t("role", "Role")}</Label>
              <Select value={invite.role} onValueChange={v => setInvite(p => ({ ...p, role: v }))}>
                <SelectTrigger className="mt-1 h-8 text-xs tracking-[0.04em]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => {
                    return <SelectItem key={r.value} value={r.value} className="text-xs tracking-[0.04em]">{r.label}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs tracking-[0.04em]">{t("department", "Department")} <span className="text-[#71717a] dark:text-gray-400">{t("optional", "(optional)")}</span></Label>
              <Input
                className="mt-1 h-8 text-sm"
                placeholder="e.g. Litigation"
                value={invite.department}
                onChange={e => setInvite(p => ({ ...p, department: e.target.value }))}
              />
            </div>
            {["company_admin", "lawyer"].includes(invite.role) && (
              <div className="col-span-2">
                <Label className="text-xs tracking-[0.04em]">{t("bar_number", "Bar Number")} <span className="text-[#71717a] dark:text-gray-400">{t("optional_for_lawyers", "(optional, for lawyers)")}</span></Label>
                <Input
                  className="mt-1 h-8 text-sm"
                  placeholder="BAR-XXXXXX"
                  value={invite.bar_number}
                  onChange={e => setInvite(p => ({ ...p, bar_number: e.target.value }))}
                />
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={handleInvite} disabled={inviting || !invite.user_email || !invite.full_name} className="gap-2.5">
              <Mail className="w-3.5 h-3.5" />
              {inviting ? "Sending invite..." : "Send Invite & Create Login"}
            </Button>
          </div>
          <p className="text-[10px] text-[#71717a] dark:text-gray-400">{t(
            "an_email_invite_will_be_sent_o",
            "An email invite will be sent. Once they log in, their account will be linked to this firm."
          )}</p>
        </div>

        {/* Staff List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          <p className="text-xs font-semibold text-foreground flex items-center gap-2.5 mb-3 tracking-[0.04em]">
            <Users className="w-3.5 h-3.5" />
            {t("current_team", "Current Team (")}{staffRecords.length})
                      </p>
          {isLoading ? (
            <p className="text-center text-sm text-[#71717a] dark:text-gray-400 py-6">{t("loading_team", "Loading team...")}</p>
          ) : staffRecords.length === 0 ? (
            <div className="text-center py-8 text-sm text-[#71717a] dark:text-gray-400">{t(
              "no_team_members_yet_invite_som",
              "No team members yet. Invite someone above."
            )}</div>
          ) : staffRecords.map(staff => {
            return (
              <div key={staff.id} className="flex items-center gap-3 p-3 bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-primary tracking-[0.04em]">{staff.full_name?.[0]?.toUpperCase() || "?"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{staff.full_name}</p>
                  <p className="text-xs text-[#71717a] dark:text-gray-400 truncate tracking-[0.04em]">{staff.user_email}</p>
                  {staff.department && <p className="text-[10px] text-[#71717a] dark:text-gray-400">{staff.department}</p>}
                </div>
                {/* Role selector */}
                <Select value={staff.role} onValueChange={v => updateRoleMutation.mutate({ id: staff.id, role: v })}>
                  <SelectTrigger className="w-36 h-7 text-xs tracking-[0.04em]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => {
                      return <SelectItem key={r.value} value={r.value} className="text-xs tracking-[0.04em]">{r.label}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
                {/* Status toggle */}
                <button
                  onClick={() => toggleStatusMutation.mutate({ id: staff.id, status: staff.status === "active" ? "inactive" : "active" })}
                  title="Toggle active/inactive"
                >
                  <Badge className={`text-[10px] cursor-pointer shrink-0 ${staff.status === "active" ? "bg-slate-100 text-primary/90" : "bg-slate-100 text-slate-500"}`}>
                    {staff.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </button>
                {/* Remove */}
                <Button
                  variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                  onClick={() => { if (window.confirm(`Remove ${staff.full_name} from this firm?`)) removeMutation.mutate(staff.id); }}
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end px-6 pb-5 pt-3 border-t border-primary/40">
          <Button variant="outline" onClick={onClose}>{t("close", "Close")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}