import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import { Plus, Calendar, CheckCircle, XCircle, Clock, User } from "lucide-react";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { isSuperAdmin } from "@/lib/constants";

const LEAVE_TYPES = ["annual", "sick", "maternity", "paternity", "bereavement", "unpaid", "other"];
const STATUS_COLORS = { pending: "bg-amber-100 text-amber-700", approved: "bg-slate-100 text-primary/90", rejected: "bg-red-100 text-red-700", cancelled: "bg-gray-100 text-gray-600" };
const LEAVE_TYPE_COLORS = { annual: "bg-orange-100 text-orange-700", sick: "bg-red-100 text-red-700", maternity: "bg-slate-100 text-primary/90", paternity: "bg-slate-100 text-primary/90", bereavement: "bg-gray-100 text-gray-600", unpaid: "bg-orange-100 text-orange-700", other: "bg-slate-100 text-slate-600" };

export default function LeaveManagement() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = user?.company_id;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const isAdmin = user?.role === "company_admin" || user?.role === "hr" || isSuperAdmin(user);

  const { data: allLeaves = [] } = useQuery({
    queryKey: ["leaves", companyId],
    queryFn: () => base44.entities.LeaveRequest.filter({ company_id: companyId }, "-created_date", 100),
    enabled: !!companyId,
  });

  const { data: staffRecords = [] } = useQuery({
    queryKey: ["staff", companyId],
    queryFn: () => base44.entities.StaffRecord.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const staffInfo = data._for_staff_email
        ? { staff_email: data._for_staff_email, staff_name: data._for_staff_name }
        : { staff_email: user.email, staff_name: user.full_name };
      const { _for_staff_email, _for_staff_name, ...rest } = data;
      return base44.entities.LeaveRequest.create({ ...rest, ...staffInfo, company_id: companyId });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["leaves"] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LeaveRequest.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leaves"] }),
  });

  const myLeaves = allLeaves.filter(l => l.staff_email === user?.email);
  const pendingLeaves = allLeaves.filter(l => l.status === "pending");
  const teamLeaves = isAdmin ? allLeaves : myLeaves;

  const handleApprove = (leave) => updateMutation.mutate({ id: leave.id, data: { status: "approved", reviewed_by: user.email, reviewed_at: new Date().toISOString() } });
  const handleReject = (leave) => updateMutation.mutate({ id: leave.id, data: { status: "rejected", reviewed_by: user.email, reviewed_at: new Date().toISOString() } });

  const getStaffLeaveBalance = (email) => {
    const record = staffRecords.find(s => s.user_email === email);
    const usedDays = allLeaves.filter(l => l.staff_email === email && l.status === "approved" && l.leave_type === "annual").reduce((s, l) => s + (l.days_requested || 0), 0);
    return { total: record?.leave_balance || 21, used: usedDays, remaining: (record?.leave_balance || 21) - usedDays };
  };

  const myBalance = getStaffLeaveBalance(user?.email);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        subtitle={isAdmin ? `${pendingLeaves.length} pending request(s)` : `My leave balance: ${myBalance.remaining} days remaining`}
        actions={<Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5"><Plus className="w-4 h-4" />{t("request_leave", "Request Leave")}</Button>}
      />
      {/* My Balance */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Entitlement", value: myBalance.total, color: "bg-slate-50 dark:bg-slate-800/50 text-primary" },
          { label: "Days Used", value: myBalance.used, color: "bg-amber-50 text-amber-600" },
          { label: "Days Remaining", value: myBalance.remaining, color: "bg-slate-50 dark:bg-slate-800/50 text-primary" },
        ].map(s => {
          return (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", s.color)}><Calendar className="w-4 h-4" /></div>
              <div><p className="text-xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </div>
          );
        })}
      </div>
      <Tabs defaultValue={isAdmin ? "all" : "mine"}>
        <TabsList>
          {isAdmin && <TabsTrigger value="all" className="gap-1.5">{t("all_requests", "All Requests")} {pendingLeaves.length > 0 && <Badge className="bg-amber-100 text-amber-700 text-[9px] h-4 px-1">{pendingLeaves.length}</Badge>}</TabsTrigger>}
          <TabsTrigger value="mine">{t("my_requests", "My Requests")}</TabsTrigger>
          {isAdmin && <TabsTrigger value="balances">{t("staff_balances", "Staff Balances")}</TabsTrigger>}
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <LeaveList leaves={teamLeaves} isAdmin={isAdmin} onApprove={handleApprove} onReject={handleReject} />
        </TabsContent>
        <TabsContent value="mine" className="mt-4">
          <LeaveList leaves={myLeaves} isAdmin={false} onApprove={handleApprove} onReject={handleReject} />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="balances" className="mt-4">
            <div className="bg-card border border-border rounded-xl divide-y divide-border">
              {staffRecords.map(s => {
                const bal = getStaffLeaveBalance(s.user_email);
                const pct = Math.min((bal.used / bal.total) * 100, 100);
                return (
                  <div key={s.id} className="px-4 py-3 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{s.full_name?.[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{s.full_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-muted rounded-full h-1.5">
                          <div className="bg-primary rounded-full h-1.5" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{bal.used}/{bal.total} {t("days_used", "days used")}</span>
                      </div>
                    </div>
                    <Badge className={cn("text-[10px]", bal.remaining < 5 ? "bg-red-100 text-red-700" : "bg-slate-100 text-primary/90")}>
                      {bal.remaining} {t("days_left", "days left")}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        )}
      </Tabs>
      <LeaveRequestDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isAdmin={isAdmin}
        staffRecords={staffRecords}
      />
    </div>
  );
}

function LeaveList({ leaves, isAdmin, onApprove, onReject }) {
  const { t } = useTranslation();
  if (leaves.length === 0) return (
    <div className="bg-card border border-border rounded-xl p-10 text-center">
      <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">{t("no_leave_requests_found", "No leave requests found")}</p>
    </div>
  );
  return (
    <div className="bg-card border border-border rounded-xl divide-y divide-border">
      {leaves.map(leave => {
        return (
          <div key={leave.id} className="px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0"><User className="w-4 h-4 text-muted-foreground" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-medium">{leave.staff_name}</span>
                <Badge className={cn("text-[9px] h-4 px-1.5 capitalize", LEAVE_TYPE_COLORS[leave.leave_type])}>{leave.leave_type}</Badge>
                <Badge className={cn("text-[9px] h-4 px-1.5", STATUS_COLORS[leave.status])}>{leave.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {leave.start_date && format(parseISO(leave.start_date), "MMM d")}– {leave.end_date && format(parseISO(leave.end_date), "MMM d, yyyy")}· {leave.days_requested} {t("day_s", "day(s)")}
              </p>
              {leave.reason && <p className="text-xs text-muted-foreground truncate">{leave.reason}</p>}
            </div>
            {isAdmin && leave.status === "pending" && (
              <div className="flex items-center gap-1.5 shrink-0">
                <Button size="sm" className="h-7 text-xs gap-1 bg-primary hover:bg-primary/90" onClick={() => onApprove(leave)}>
                  <CheckCircle className="w-3 h-3" />{t("approve", "Approve")}
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => onReject(leave)}>
                  <XCircle className="w-3 h-3" />{t("reject", "Reject")}
                </Button>
              </div>
            )}
            {leave.reviewed_by && leave.status !== "pending" && (
              <span className="text-[10px] text-muted-foreground shrink-0">{t("by", "by")} {leave.reviewed_by.split("@")[0]}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LeaveRequestDialog({ open, onClose, onSubmit, isAdmin, staffRecords }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ leave_type: "annual", start_date: "", end_date: "", reason: "", _for_staff_email: "", _for_staff_name: "" });
  const days = form.start_date && form.end_date ? Math.max(1, differenceInCalendarDays(parseISO(form.end_date), parseISO(form.start_date)) + 1) : 0;
  const handleSubmit = (e) => { e.preventDefault(); onSubmit({ ...form, days_requested: days }); };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t("request_leave", "Request Leave")}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isAdmin && (
            <div>
              <Label>{t("for_team_member", "For Team Member")} <span className="text-muted-foreground text-xs">{t("leave_blank_for_yourself", "(leave blank for yourself)")}</span></Label>
              <Select value={form._for_staff_email} onValueChange={(v) => {
                const s = staffRecords.find(sr => sr.user_email === v);
                setForm(p => ({ ...p, _for_staff_email: v, _for_staff_name: s?.full_name || "" }));
              }}>
                <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                <SelectContent>
                  {staffRecords.map(s => {
                    return <SelectItem key={s.user_email} value={s.user_email}>{s.full_name}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>{t("leave_type", "Leave Type")}</Label>
            <Select value={form.leave_type} onValueChange={(v) => setForm(p => ({ ...p, leave_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LEAVE_TYPES.map(item => {
                return <SelectItem key={item} value={item} className="capitalize">{item}</SelectItem>;
              })}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>{t("start_date", "Start Date")}</Label><Input type="date" value={form.start_date} onChange={(e) => setForm(p => ({ ...p, start_date: e.target.value }))} required /></div>
            <div><Label>{t("end_date", "End Date")}</Label><Input type="date" value={form.end_date} onChange={(e) => setForm(p => ({ ...p, end_date: e.target.value }))} required /></div>
          </div>
          {days > 0 && <p className="text-sm text-primary font-medium">{days} {t("working_day_s_requested", "working day(s) requested")}</p>}
          <div><Label>{t("reason_optional", "Reason (optional)")}</Label><Textarea value={form.reason} onChange={(e) => setForm(p => ({ ...p, reason: e.target.value }))} className="resize-none h-20" /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>{t("cancel", "Cancel")}</Button>
            <Button type="submit">{t("submit_request", "Submit Request")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}