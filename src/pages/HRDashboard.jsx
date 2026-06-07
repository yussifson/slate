import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, CalendarDays, MessageSquareWarning, TrendingUp, DollarSign, Clock, CheckCircle, XCircle, User, AlertCircle, ArrowUpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/constants";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { isSuperAdmin } from "@/lib/constants";

// Sub-panel imports
import HRStaffPanel from "@/components/hr/HRStaffPanel";
import HRLeavePanel from "@/components/hr/HRLeavePanel";
import HRSalaryPanel from "@/components/hr/HRSalaryPanel";
import HRComplaintsPanel from "@/components/hr/HRComplaintsPanel";
import HRPromotionsPanel from "@/components/hr/HRPromotionsPanel";
import HRPayrollPanel from "@/components/hr/HRPayrollPanel";

function MetricCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function HRDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = user?.company_id;
  const isAdmin = user?.role === "company_admin" || user?.role === "hr" || isSuperAdmin(user);

  const { data: staff = [] } = useQuery({
    queryKey: ["staff", companyId],
    queryFn: () => base44.entities.StaffRecord.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const { data: leaves = [] } = useQuery({
    queryKey: ["leaves", companyId],
    queryFn: () => base44.entities.LeaveRequest.filter({ company_id: companyId }, "-created_date", 200),
    enabled: !!companyId,
  });

  const { data: complaints = [] } = useQuery({
    queryKey: ["complaints", companyId],
    queryFn: () => base44.entities.HRComplaint.filter({ company_id: companyId }, "-created_date", 100),
    enabled: !!companyId,
  });

  const { data: promotions = [] } = useQuery({
    queryKey: ["promotions", companyId],
    queryFn: () => base44.entities.Promotion.filter({ company_id: companyId }, "-created_date", 100),
    enabled: !!companyId,
  });

  const { data: company } = useQuery({
    queryKey: ["company", companyId],
    queryFn: async () => { const list = await base44.entities.Company.list(); return list.find(c => c.id === companyId) || null; },
    enabled: !!companyId,
  });

  const currency = company?.currency || "GHS";
  const activeStaff = staff.filter(s => s.status === "active").length;
  const pendingLeaves = leaves.filter(l => l.status === "pending").length;
  const openComplaints = complaints.filter(c => c.status === "open" || c.status === "under_review").length;
  const pendingPromotions = promotions.filter(p => p.status === "pending").length;
  const totalSalary = staff.reduce((s, m) => s + (m.salary || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="HR Management" subtitle="Team, payroll, leave, complaints and promotions" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard icon={Users} label="Active Staff" value={activeStaff} color="bg-emerald-50 text-emerald-600" />
        <MetricCard icon={DollarSign} label={`Monthly Payroll (${currency})`} value={formatCurrency(totalSalary, currency)} color="bg-green-50 text-green-600" />
        <MetricCard icon={CalendarDays} label="Pending Leave" value={pendingLeaves} color="bg-amber-50 text-amber-600" />
        <MetricCard icon={MessageSquareWarning} label="Open Complaints" value={openComplaints} color="bg-red-50 text-red-600" />
        <MetricCard icon={ArrowUpCircle} label="Pending Promotions" value={pendingPromotions} color="bg-purple-50 text-purple-600" />
      </div>
      <Tabs defaultValue="team">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="team">{t("team", "Team")}</TabsTrigger>
          <TabsTrigger value="salary">{t("salary", "Salary")}</TabsTrigger>
          <TabsTrigger value="leave">
            {t("leave", "Leave")} {pendingLeaves > 0 && <Badge className="ml-1 bg-amber-100 text-amber-700 text-[9px] h-4 px-1">{pendingLeaves}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="complaints">
            {t("complaints", "Complaints")} {openComplaints > 0 && <Badge className="ml-1 bg-red-100 text-red-700 text-[9px] h-4 px-1">{openComplaints}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="promotions">
            {t("promotions", "Promotions")} {pendingPromotions > 0 && <Badge className="ml-1 bg-purple-100 text-purple-700 text-[9px] h-4 px-1">{pendingPromotions}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="payroll">{t("payroll", "Payroll")}</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-4">
          <HRStaffPanel companyId={companyId} staff={staff} currency={currency} isAdmin={isAdmin} />
        </TabsContent>
        <TabsContent value="salary" className="mt-4">
          <HRSalaryPanel companyId={companyId} staff={staff} currency={currency} isAdmin={isAdmin} />
        </TabsContent>
        <TabsContent value="leave" className="mt-4">
          <HRLeavePanel companyId={companyId} leaves={leaves} staff={staff} isAdmin={isAdmin} user={user} />
        </TabsContent>
        <TabsContent value="complaints" className="mt-4">
          <HRComplaintsPanel companyId={companyId} complaints={complaints} staff={staff} isAdmin={isAdmin} user={user} />
        </TabsContent>
        <TabsContent value="promotions" className="mt-4">
          <HRPromotionsPanel companyId={companyId} promotions={promotions} staff={staff} currency={currency} isAdmin={isAdmin} user={user} />
        </TabsContent>
        <TabsContent value="payroll" className="mt-4">
          <HRPayrollPanel companyId={companyId} staff={staff} currency={currency} isAdmin={isAdmin} leaves={leaves} user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}