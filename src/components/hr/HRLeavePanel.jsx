import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, CheckCircle, XCircle, User, Calendar } from "lucide-react";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { cn } from "@/lib/utils";

const LEAVE_TYPES = ["annual", "sick", "maternity", "paternity", "bereavement", "unpaid", "other"];
const STATUS_COLORS = { pending: "bg-amber-100 text-amber-700", approved: "bg-slate-100 text-primary/90", rejected: "bg-red-100 text-red-700", cancelled: "bg-gray-100 text-gray-600" };
const LEAVE_COLORS = { annual: "bg-orange-100 text-orange-700", sick: "bg-red-100 text-red-700", maternity: "bg-slate-100 text-primary/90", paternity: "bg-slate-100 text-primary/90", bereavement: "bg-gray-100 text-gray-600", unpaid: "bg-orange-100 text-orange-700", other: "bg-slate-100 text-slate-600" };

export default function HRLeavePanel({ companyId, leaves, staff, isAdmin, user }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data) => {
      const staffInfo = data._for_staff_email
        ? { staff_email: data._for_staff_email, staff_name: data._for_staff_name }
        : { staff_email: user.email, staff_name: user.full_name };
      const { _for_staff_email, _for_staff_name, ...rest } = data;
      return base44.entities.LeaveRequest.create({ ...rest, ...staffInfo, company_id: companyId });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["leaves", companyId] }); setShowForm(false); }});

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LeaveRequest.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leaves", companyId] })});

  const myLeaves = leaves.filter(l => l.staff_email === user?.email);
  const pending = leaves.filter(l => l.status === "pending");

  const handleApprove = (leave) => updateMutation.mutate({ id: leave.id, data: { status: "approved", reviewed_by: user.email, reviewed_at: new Date().toISOString() } });
  const handleReject = (leave) => updateMutation.mutate({ id: leave.id, data: { status: "rejected", reviewed_by: user.email, reviewed_at: new Date().toISOString() } });

  const getBalance = (email) => {
    const record = staff.find(s => s.user_email === email);
    const used = leaves.filter(l => l.staff_email === email && l.status === "approved" && l.leave_type === "annual").reduce((s, l) => s + (l.days_requested || 0), 0);
    const total = record?.leave_balance || 21;
    return { total, used, remaining: total - used };
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" /> {t("request_leave", "Request Leave")}</Button>
      </div>
      <Tabs defaultValue={isAdmin ? "all" : "mine"}>
        <TabsList>
          {isAdmin && <TabsTrigger value="all">{t("all_requests", "All Requests")} {pending.length > 0 && <Badge className="ml-1 bg-amber-100 text-amber-700 text-[9px] h-4 px-1">{pending.length}</Badge>}</TabsTrigger>}
          <TabsTrigger value="mine">{t("my_requests", "My Requests")}</TabsTrigger>
          {isAdmin && <TabsTrigger value="balances">{t("staff_balances", "Staff Balances")}</TabsTrigger>}
        </TabsList>

        <TabsContent value="all" className="mt-3">
          <LeaveList leaves={isAdmin ? leaves : myLeaves} isAdmin={isAdmin} onApprove={handleApprove} onReject={handleReject} />
        </TabsContent>
        <TabsContent value="mine" className="mt-3">
          <LeaveList leaves={myLeaves} isAdmin={false} onApprove={handleApprove} onReject={handleReject} />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="balances" className="mt-3">
            <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl divide-y divide-border hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
              {staff.map(s => {
                const bal = getBalance(s.user_email);
                const pct = Math.min((bal.used / bal.total) * 100, 100);
                return (
                  <div key={s.id} className="px-4 py-3 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-primary tracking-[0.04em]">{s.full_name?.[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{s.full_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-muted rounded-full h-1.5">
                          <div className="bg-primary rounded-full h-1.5" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-[#71717a] dark:text-gray-400 shrink-0 tracking-[0.04em]">{bal.used}/{bal.total} {t("days_used", "days used")}</span>
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
      <LeaveRequestDialog open={showForm} onClose={() => setShowForm(false)} onSubmit={(d) => createMutation.mutate(d)} isAdmin={isAdmin} staffRecords={staff} />
    </div>
  );
}

function LeaveList({ leaves, isAdmin, onApprove, onReject }) {
  const { t } = useTranslation();
  if (!leaves.length) return (
    <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-10 text-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
      <Calendar className="w-10 h-10 text-[#71717a] dark:text-gray-400 mx-auto mb-2" />
      <p className="text-sm text-[#71717a] dark:text-gray-400">{t("no_leave_requests", "No leave requests")}</p>
    </div>
  );
  return (
    <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl divide-y divide-border hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
      {leaves.map(leave => {
        return (
          <div key={leave.id} className="px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center shrink-0"><User className="w-4 h-4 text-[#71717a] dark:text-gray-400" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-sm font-medium">{leave.staff_name}</span>
                <Badge className={cn("text-[9px] h-4 px-1.5 capitalize", LEAVE_COLORS[leave.leave_type])}>{leave.leave_type}</Badge>
                <Badge className={cn("text-[9px] h-4 px-1.5", STATUS_COLORS[leave.status])}>{leave.status}</Badge>
              </div>
              <p className="text-xs text-[#71717a] dark:text-gray-400 mt-0.5 tracking-[0.04em]">
                {leave.start_date && format(parseISO(leave.start_date), "MMM d")}– {leave.end_date && format(parseISO(leave.end_date), "MMM d, yyyy")}· {leave.days_requested} {t("day_s", "day(s)")}
              </p>
            </div>
            {isAdmin && leave.status === "pending" && (
              <div className="flex gap-2.5 shrink-0">
                <Button size="sm" className="h-7 text-xs bg-primary hover:bg-primary/90 gap-2 tracking-[0.04em]" onClick={() => onApprove(leave)}><CheckCircle className="w-3 h-3" />{t("approve", "Approve")}</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-2 text-red-600 border-red-200 tracking-[0.04em]" onClick={() => onReject(leave)}><XCircle className="w-3 h-3" />{t("reject", "Reject")}</Button>
              </div>
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
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t("request_leave", "Request Leave")}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isAdmin && (
            <div>
              <Label>{t("for_team_member", "For Team Member")} <span className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("blank_yourself", "(blank = yourself)")}</span></Label>
              <Select value={form._for_staff_email} onValueChange={v => { const s = staffRecords.find(sr => sr.user_email === v); set("_for_staff_email", v); set("_for_staff_name", s?.full_name || ""); }}>
                <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                <SelectContent>{staffRecords.map(s => {
                  return <SelectItem key={s.user_email} value={s.user_email}>{s.full_name}</SelectItem>;
                })}</SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>{t("leave_type", "Leave Type")}</Label>
            <Select value={form.leave_type} onValueChange={v => set("leave_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LEAVE_TYPES.map(item => {
                return <SelectItem key={item} value={item} className="capitalize">{item}</SelectItem>;
              })}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>{t("start_date", "Start Date")}</Label><Input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} required /></div>
            <div><Label>{t("end_date", "End Date")}</Label><Input type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} required /></div>
          </div>
          {days > 0 && <p className="text-sm text-primary font-medium">{days} {t("day_s_requested", "day(s) requested")}</p>}
          <div><Label>{t("reason", "Reason")}</Label><Textarea value={form.reason} onChange={e => set("reason", e.target.value)} className="resize-none h-20" /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>{t("cancel", "Cancel")}</Button>
            <Button type="submit">{t("submit_request", "Submit Request")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}