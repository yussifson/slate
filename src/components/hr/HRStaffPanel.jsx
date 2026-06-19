import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, UserCog } from "lucide-react";
import { format } from "date-fns";
import { useFirmSettings } from "@/hooks/useFirmSettings";
import AddOptionInline from "@/components/shared/AddOptionInline";

const roleColors = {
  company_admin: "bg-slate-100 text-primary/90",
  lawyer: "bg-orange-100 text-orange-700",
  paralegal: "bg-slate-100 text-primary/90",
  hr: "bg-slate-100 text-primary/90",
  finance: "bg-amber-100 text-amber-700",
  support: "bg-slate-100 text-slate-600",
};

export default function HRStaffPanel({ companyId, staff, currency, isAdmin }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: company } = { data: null };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.StaffRecord.create({ ...data, company_id: companyId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["staff", companyId] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.StaffRecord.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["staff", companyId] }); setEditing(null); },
  });

  const filtered = staff.filter(s =>
    !search || s.full_name?.toLowerCase().includes(search.toLowerCase()) || s.user_email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
          <Input placeholder="Search staff..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-1" /> {t("add_staff", "Add Staff")}
          </Button>
        )}
      </div>
      <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#71717a] dark:text-gray-400">{t("no_staff_found", "No staff found")}</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(s => {
              return (
                <div key={s.id} className="px-4 py-3 flex items-center gap-4 hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => isAdmin && setEditing(s)}>
                  <div className="w-9 h-9 rounded-md-full bg-slate-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-primary">{s.full_name?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{s.full_name}</p>
                    <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{s.user_email} {s.department ? `· ${s.department}` : ""}</p>
                  </div>
                  <Badge className={`${roleColors[s.role] || "bg-slate-100 text-slate-600"} text-[10px] capitalize`}>{s.role?.replace(/_/g, " ")}</Badge>
                  <Badge className={`text-[10px] ${s.status === "active" ? "bg-slate-100 text-primary/90" : s.status === "on_leave" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                    {s.status?.replace("_", " ")}
                  </Badge>
                  <span className="text-xs text-[#71717a] dark:text-gray-400 shrink-0 tracking-[0.04em]">{s.hire_date ? format(new Date(s.hire_date), "MMM d, yyyy") : "—"}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <StaffFormDialog
        open={showForm || !!editing}
        onClose={() => { setShowForm(false); setEditing(null); }}
        onSubmit={(data) => editing ? updateMutation.mutate({ id: editing.id, data }) : createMutation.mutate(data)}
        initialData={editing}
      />
    </div>
  );
}

function StaffFormDialog({ open, onClose, onSubmit, initialData }) {
  const { t } = useTranslation();
  const { roles, addRole } = useFirmSettings();
  const [form, setForm] = useState({ full_name: "", user_email: "", role: "lawyer", department: "", phone: "", hire_date: "", status: "active", bar_number: "", salary: "", leave_balance: 21 });

  useEffect(() => {
    if (initialData) setForm(initialData);
    else setForm({ full_name: "", user_email: "", role: "lawyer", department: "", phone: "", hire_date: "", status: "active", bar_number: "", salary: "", leave_balance: 21 });
  }, [initialData, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = (e) => { e.preventDefault(); onSubmit({ ...form, salary: form.salary ? Number(form.salary) : undefined }); };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{initialData ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>{t("full_name", "Full Name *")}</Label><Input value={form.full_name} onChange={e => set("full_name", e.target.value)} required /></div>
            <div><Label>{t("email", "Email *")}</Label><Input type="email" value={form.user_email} onChange={e => set("user_email", e.target.value)} required /></div>
            <div><Label>{t("phone", "Phone")}</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
            <div>
              <Label>{t("role", "Role")}</Label>
              <Select value={form.role} onValueChange={v => set("role", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map(r => {
                    return <SelectItem key={r} value={r} className="capitalize">{r.replace(/_/g, " ")}</SelectItem>;
                  })}
                  <AddOptionInline onAdd={(v) => { addRole(v); set("role", v); }} placeholder="New role..." />
                </SelectContent>
              </Select>
            </div>
            <div><Label>{t("department", "Department")}</Label><Input value={form.department} onChange={e => set("department", e.target.value)} /></div>
            <div><Label>{t("hire_date", "Hire Date")}</Label><Input type="date" value={form.hire_date} onChange={e => set("hire_date", e.target.value)} /></div>
            <div><Label>{t("status", "Status")}</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("active", "Active")}</SelectItem>
                  <SelectItem value="inactive">{t("inactive", "Inactive")}</SelectItem>
                  <SelectItem value="on_leave">{t("on_leave", "On Leave")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>{t("salary", "Salary")}</Label><Input type="number" min="0" value={form.salary} onChange={e => set("salary", e.target.value)} placeholder="0" /></div>
            <div><Label>{t("leave_balance_days", "Leave Balance (days)")}</Label><Input type="number" min="0" value={form.leave_balance} onChange={e => set("leave_balance", Number(e.target.value))} /></div>
            <div><Label>{t("bar_number", "Bar Number")}</Label><Input value={form.bar_number} onChange={e => set("bar_number", e.target.value)} placeholder="For lawyers" /></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>{t("cancel", "Cancel")}</Button>
            <Button type="submit">{initialData ? "Update" : "Add"} {t("staff", "Staff")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}