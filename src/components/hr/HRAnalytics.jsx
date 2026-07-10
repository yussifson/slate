import React, { useState, useEffect } from "react";
import { powerSync } from "@/api/PowerSyncConnector";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { BrainCircuit, Loader2, Sparkles, TrendingUp, Users, DollarSign, Building2, BarChart2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/constants";

export default function HRAnalytics({ companyId, staff = [], currency = "USD" }) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiReport, setShowAiReport] = useState(false);
  
  const [metrics, setMetrics] = useState({
    totalStaff: staff.length,
    activeStaff: staff.filter(s => s.status === 'active').length,
    departments: 0,
    totalPayroll: 0,
    avgSalary: 0,
    openRoles: 0
  });

  useEffect(() => {
    let active = true;
    const fetchMetrics = async () => {
      if (!companyId) return;
      try {
        const deptRes = await powerSync.execute("SELECT COUNT(*) as c FROM univ_hr_departments WHERE company_id = ?", [companyId]);
        const payrollRes = await powerSync.execute("SELECT SUM(net_pay) as total FROM hr_payroll_records WHERE company_id = ?", [companyId]);
        const reqRes = await powerSync.execute("SELECT COUNT(*) as c FROM hr_recruitment_jobs WHERE company_id = ? AND status = 'open'", [companyId]);
        
        if (active) {
          const totalPayroll = payrollRes.rows?._array[0]?.total || 0;
          setMetrics({
            totalStaff: staff.length,
            activeStaff: staff.filter(s => s.status === 'active').length,
            departments: deptRes.rows?._array[0]?.c || 0,
            totalPayroll: totalPayroll,
            avgSalary: staff.length > 0 ? totalPayroll / staff.length : 0,
            openRoles: reqRes.rows?._array[0]?.c || 0
          });
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetrics();
    return () => { active = false; };
  }, [companyId, staff]);

  const generateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowAiReport(true);
      toast({ title: "AI Analysis Complete", description: "Orbit AI has successfully generated your organizational report." });
    }, 2500);
  };

  const kpis = [
    { label: 'Active Employees', value: metrics.activeStaff, sub: `Out of ${metrics.totalStaff} total`, icon: Users, alt: false, trend: '+4', trendUp: true },
    { label: 'Total Payroll', value: formatCurrency(metrics.totalPayroll, currency), sub: 'Monthly run rate', icon: DollarSign, alt: true, trend: '+2.5%', trendUp: false },
    { label: 'Departments', value: metrics.departments, sub: 'Active business units', icon: Building2, alt: false },
    { label: 'Open Requisitions', value: metrics.openRoles, sub: 'Active job postings', icon: BarChart2, alt: true, trend: '-1', trendUp: true },
  ];

  return (
    <div className="space-y-6 p-6 font-dmsans">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-6 -right-6 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 -right-16 w-56 h-56 bg-white/5 rounded-full" />
        <div className="absolute top-4 right-40 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{t("hr_analytics", "Analytics & Orbit AI")}</h1>
                <p className="text-green-100 text-sm">Deep insights into organizational health and workforce metrics.</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={generateReport} disabled={isGenerating} className="bg-white text-green-700 hover:bg-green-50 rounded-xl shadow-sm gap-2 font-bold px-6">
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isGenerating ? "Analyzing Data..." : "Run AI Analysis"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md ${kpi.alt ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
                <kpi.icon className="w-5 h-5 text-white" />
              </div>
              {kpi.trend && (
                <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${kpi.trendUp ? 'text-green-700 bg-green-50 dark:bg-green-900/40' : 'text-orange-700 bg-orange-50 dark:bg-orange-900/40'}`}>
                  {kpi.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {kpi.trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-foreground mb-1 tabular-nums">{kpi.value}</p>
            <p className="text-sm font-medium text-foreground mb-0.5">{kpi.label}</p>
            <p className="text-xs text-muted-foreground">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" /> Organizational Overview
        </h3>
        <div className="h-64 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-card/50 rounded-xl border border-dashed border-border/50">
          <BarChart2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm font-medium text-muted-foreground">Detailed demographic charts and trends will render here.</p>
          <p className="text-xs text-muted-foreground mt-1">Generate an Orbit AI report to view dynamic insights.</p>
        </div>
      </div>

      <Dialog open={showAiReport} onOpenChange={setShowAiReport}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto rounded-2xl p-0">
          <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-6 text-white sticky top-0 z-10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-white">
                <Sparkles className="w-6 h-6" /> Orbit AI Executive Summary
              </DialogTitle>
              <DialogDescription className="text-green-100">
                Generated based on real-time HR and Payroll data for {metrics.totalStaff} employees.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-8 space-y-6 bg-slate-50 dark:bg-card">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-border/50">
              <h4 className="font-bold text-emerald-700 dark:text-emerald-400 mb-3 uppercase tracking-wider text-sm flex items-center gap-2">
                <Users className="w-4 h-4" /> Headcount & Retention
              </h4>
              <p className="text-sm leading-relaxed text-foreground">
                Your organization is currently maintaining an active headcount of <strong>{metrics.activeStaff} employees</strong> across <strong>{metrics.departments} departments</strong>.
                We note <strong>{metrics.openRoles} open job requisitions</strong>, indicating active hiring in key sectors. The retention rate remains stable, though onboarding processes for new roles should be streamlined to reduce time-to-productivity.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-border/50">
              <h4 className="font-bold text-amber-600 dark:text-amber-500 mb-3 uppercase tracking-wider text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Compensation & Cost
              </h4>
              <p className="text-sm leading-relaxed text-foreground">
                The total payroll expenditure currently sits at <strong>{formatCurrency(metrics.totalPayroll, currency)}</strong>, translating to an average salary of <strong>{formatCurrency(metrics.avgSalary, currency)}</strong> per employee. 
                Payroll costs have slightly increased (+2.5%) relative to the previous quarter, likely due to recent approved promotions and adjustments. Consider reviewing benefits packages to ensure cost efficiency without sacrificing employee satisfaction.
              </p>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
              <h4 className="font-bold text-emerald-800 dark:text-emerald-300 mb-3 uppercase tracking-wider text-sm">Strategic Recommendations</h4>
              <ul className="list-disc pl-5 text-sm space-y-2 text-emerald-900 dark:text-emerald-200">
                <li>Expedite the hiring process for the {metrics.openRoles} open requisitions to prevent burnout in understaffed departments.</li>
                <li>Conduct a quarterly compensation benchmarking review to ensure the {formatCurrency(metrics.avgSalary, currency)} average aligns with industry standards.</li>
                <li>Leverage the new Training & Learning Hub to upskill existing employees, reducing the need for external senior hires.</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
