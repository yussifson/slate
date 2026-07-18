import React, { useState, useEffect } from "react";
import { powerSync } from "@/api/PowerSyncConnector";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, Users, CheckCircle2, Clock, AlertCircle, ArrowUpRight, ArrowDownRight, Tag } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function HRPromotionsPanel({ companyId, staff, currency, isAdmin, user }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [promotions, setPromotions] = useState([]);

  useEffect(() => {
    let active = true;
    const fetchPromotions = async () => {
      if (!companyId) return;
      try {
        const res = await powerSync.execute(
          "SELECT p.*, s.name as full_name FROM univ_erp_promotions p LEFT JOIN univ_hr_employees s ON p.staff_id = s.id WHERE p.company_id = ? ORDER BY p.created_at DESC",
          [companyId]
        );
        if (active) setPromotions(res.rows?._array || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPromotions();
    return () => { active = false; };
  }, [companyId]);

  const updateStatus = async (id, status) => {
    try {
      await powerSync.execute("UPDATE univ_erp_promotions SET status = ? WHERE id = ?", [status, id]);
      const res = await powerSync.execute(
        "SELECT p.*, s.name as full_name FROM univ_erp_promotions p LEFT JOIN univ_hr_employees s ON p.staff_id = s.id WHERE p.company_id = ? ORDER BY p.created_at DESC",
        [companyId]
      );
      setPromotions(res.rows?._array || []);
      toast({ title: `Promotion marked as ${status}` });
    } catch (e) {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const pendingPromotions = promotions.filter(p => p.status === "pending").length;
  const approvedPromotions = promotions.filter(p => p.status === "approved").length;
  const totalPromotions = promotions.length;

  const kpis = [
    { label: 'Total Requests', value: totalPromotions, sub: 'All time', icon: Users, alt: false, trend: '+3', trendUp: true },
    { label: 'Pending Review', value: pendingPromotions, sub: 'Needs attention', icon: Clock, alt: true },
    { label: 'Approved', value: approvedPromotions, sub: 'Successfully promoted', icon: CheckCircle2, alt: false },
    { label: 'Rejected', value: totalPromotions - pendingPromotions - approvedPromotions, sub: 'Denied requests', icon: AlertCircle, alt: true },
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
                <ArrowUpCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{t("promotions", "Promotions")}</h1>
                <p className="text-green-100 text-sm">Manage staff promotions, title changes, and salary adjustments.</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur gap-2 text-xs font-bold">
                Request Promotion
              </Button>
            )}
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
            <p className={`text-xs ${(!kpi.trendUp && kpi.icon === Clock) ? 'text-orange-500' : 'text-muted-foreground'}`}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
        {promotions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ArrowUpCircle className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold text-foreground">No Promotions Found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">There are currently no promotion requests or history to display for your organization.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {promotions.map(promo => (
              <div key={promo.id} className="p-5 bg-slate-50 dark:bg-secondary/30 rounded-xl border border-border/50 flex flex-col md:flex-row justify-between gap-6 hover:border-green-500/30 transition-colors">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-card flex items-center justify-center font-bold text-lg text-foreground shadow-sm border border-border/50 shrink-0">
                    {promo.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{promo.full_name || 'Unknown'}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs font-semibold text-muted-foreground line-through decoration-rose-500">{promo.old_role}</span>
                      <ArrowUpRight className="w-3 h-3 text-green-600" />
                      <span className="text-xs font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-md border border-green-100 dark:border-green-800">{promo.new_role}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs shrink-0 self-start md:self-center">
                  <div className="text-right hidden sm:block mr-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Salary Adjustment</p>
                    <p className="font-bold text-foreground">{formatCurrency(promo.old_salary, currency)} → <span className="text-green-600">{formatCurrency(promo.new_salary, currency)}</span></p>
                  </div>

                  <span className={cn("px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border shadow-sm", 
                    promo.status === "pending" ? "bg-amber-100 text-amber-700 border-amber-200" :
                    promo.status === "approved" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                    "bg-red-100 text-red-700 border-red-200"
                  )}>
                    {promo.status}
                  </span>

                  {isAdmin && promo.status === "pending" && (
                    <div className="flex gap-2 bg-white dark:bg-card p-1 rounded-lg border border-border/50 shadow-sm ml-2">
                      <Button size="sm" onClick={() => updateStatus(promo.id, 'approved')} className="h-7 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">Approve</Button>
                      <Button size="sm" onClick={() => updateStatus(promo.id, 'rejected')} className="h-7 text-[10px] font-bold uppercase tracking-wider bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/40 dark:text-red-400">Reject</Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}