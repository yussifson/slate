import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CreditCard, TrendingUp, Users, Building2, Pencil } from "lucide-react";
import StatCard from "@/components/shared/StatCard";
import PageHeader from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { SUBSCRIPTION_PLANS, formatCurrency } from "@/lib/constants";

const STATUS_COLORS = {
  active: "bg-slate-100 text-primary/90",
  trial: "bg-orange-100 text-orange-700",
  inactive: "bg-slate-100 text-slate-600",
  expired: "bg-red-100 text-red-700",
};

export default function Subscriptions() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editingCompany, setEditingCompany] = useState(null);

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Company.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["companies"] }); setEditingCompany(null); },
  });

  const planCounts = companies.reduce((acc, c) => {
    acc[c.subscription_plan] = (acc[c.subscription_plan] || 0) + 1;
    return acc;
  }, {});

  const monthlyRevenue = companies.reduce((sum, c) => {
    if (c.subscription_status === "active") return sum + (SUBSCRIPTION_PLANS[c.subscription_plan]?.price || 0);
    return sum;
  }, 0);

  const activeCount = companies.filter(c => c.subscription_status === "active").length;
  const trialCount = companies.filter(c => c.subscription_status === "trial").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Subscriptions" subtitle="Manage subscription plans and revenue" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Monthly Revenue" value={formatCurrency(monthlyRevenue, "USD")} icon={TrendingUp} />
        <StatCard title="Annual Projection" value={formatCurrency(monthlyRevenue * 12, "USD")} icon={CreditCard} />
        <StatCard title="Active Subscriptions" value={activeCount} icon={Building2} />
        <StatCard title="Trials" value={trialCount} icon={Users} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
          return (
            <div key={key} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <Badge variant="secondary" className="text-xs">{planCounts[key] || 0} {t("firms", "firms")}</Badge>
              </div>
              <p className="text-3xl font-bold text-primary">
                ${plan.price}<span className="text-sm font-normal text-muted-foreground">{t("mo", "/mo")}</span>
              </p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("max_users", "Max Users")}</span><span className="font-medium text-foreground">{plan.maxUsers}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("max_cases", "Max Cases")}</span><span className="font-medium text-foreground">{plan.maxCases}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("storage", "Storage")}</span><span className="font-medium text-foreground">{plan.maxStorageGB} {t("gb", "GB")}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("max_clients", "Max Clients")}</span><span className="font-medium text-foreground">{plan.maxClients}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${companies.length > 0 ? ((planCounts[key] || 0) / companies.length * 100) : 0}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {companies.length > 0 ? Math.round((planCounts[key] || 0) / companies.length * 100) : 0}{t("of_firms", "% of firms")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {/* Company subscription list */}
      <div>
        <h2 className="text-base font-semibold mb-3">{t("all_firm_subscriptions", "All Firm Subscriptions")}</h2>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Firm", "Plan", "Status", "Max Users", "Max Cases", ""].map(h => {
                  return (<th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>);
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {companies.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">{t("no_companies_found", "No companies found")}</td></tr>
              ) : companies.map(company => {
                return (
                  <tr key={company.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{company.name}</p>
                      <p className="text-xs text-muted-foreground">{company.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="capitalize text-xs">{company.subscription_plan}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[10px] capitalize ${STATUS_COLORS[company.subscription_status] || ""}`}>{company.subscription_status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{company.max_users}</td>
                    <td className="px-4 py-3 text-muted-foreground">{company.max_cases}</td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost" onClick={() => setEditingCompany(company)}>
                        <Pencil className="w-3.5 h-3.5 mr-1" /> {t("edit", "Edit")}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {editingCompany && (
        <EditSubscriptionDialog
          company={editingCompany}
          onClose={() => setEditingCompany(null)}
          onSave={(data) => updateMutation.mutate({ id: editingCompany.id, data })}
          saving={updateMutation.isPending}
        />
      )}
    </div>
  );
}

function EditSubscriptionDialog({ company, onClose, onSave, saving }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    subscription_plan: company.subscription_plan || "free",
    subscription_status: company.subscription_status || "trial",
    max_users: company.max_users ?? 2,
    max_cases: company.max_cases ?? 10,
    max_storage_gb: company.max_storage_gb ?? 1,
  });

  useEffect(() => {
    setForm({
      subscription_plan: company.subscription_plan || "free",
      subscription_status: company.subscription_status || "trial",
      max_users: company.max_users ?? 2,
      max_cases: company.max_cases ?? 10,
      max_storage_gb: company.max_storage_gb ?? 1,
    });
  }, [company]);

  const handlePlanChange = (plan) => {
    const planData = SUBSCRIPTION_PLANS[plan];
    setForm(prev => ({
      ...prev,
      subscription_plan: plan,
      max_users: planData?.maxUsers ?? prev.max_users,
      max_cases: planData?.maxCases ?? prev.max_cases,
      max_storage_gb: planData?.maxStorageGB ?? prev.max_storage_gb,
    }));
  };

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("edit_subscription", "Edit Subscription —")} {company.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>{t("plan", "Plan")}</Label>
            <Select value={form.subscription_plan} onValueChange={handlePlanChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
                  return (<SelectItem key={key} value={key}>{plan.name}— ${plan.price}{t("mo", "/mo")}</SelectItem>);
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("status", "Status")}</Label>
            <Select value={form.subscription_status} onValueChange={(v) => set("subscription_status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t("active", "Active")}</SelectItem>
                <SelectItem value="trial">{t("trial", "Trial")}</SelectItem>
                <SelectItem value="inactive">{t("inactive", "Inactive")}</SelectItem>
                <SelectItem value="expired">{t("expired", "Expired")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>{t("max_users", "Max Users")}</Label>
              <Input type="number" min={1} value={form.max_users} onChange={(e) => set("max_users", Number(e.target.value))} />
            </div>
            <div>
              <Label>{t("max_cases", "Max Cases")}</Label>
              <Input type="number" min={1} value={form.max_cases} onChange={(e) => set("max_cases", Number(e.target.value))} />
            </div>
            <div>
              <Label>{t("storage_gb", "Storage (GB)")}</Label>
              <Input type="number" min={1} value={form.max_storage_gb} onChange={(e) => set("max_storage_gb", Number(e.target.value))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>{t("cancel", "Cancel")}</Button>
            <Button onClick={() => onSave(form)} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}