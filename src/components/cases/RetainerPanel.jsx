import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wallet, AlertTriangle, Plus, Minus, Settings, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/constants";
import { format } from "date-fns";

const RETAINER_STATUS_COLORS = {
  active: "bg-slate-100 text-primary/90",
  depleted: "bg-red-100 text-red-700",
  closed: "bg-gray-100 text-gray-500",
};

export default function RetainerPanel({ caseData, user }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const companyId = user?.company_id;

  const [showSetup, setShowSetup] = useState(false);
  const [showDeduct, setShowDeduct] = useState(false);
  const [setupForm, setSetupForm] = useState({ initial_deposit: "", alert_threshold: "", notes: "" });
  const [deductForm, setDeductForm] = useState({ amount: "", reason: "" });

  const { data: companies = [] } = useQuery({
    queryKey: ["company", companyId],
    queryFn: () => base44.entities.Company.filter({ id: companyId }),
    enabled: !!companyId,
  });
  const currency = companies[0]?.currency || "GHS";

  const { data: retainers = [], isLoading } = useQuery({
    queryKey: ["retainer", caseData.id],
    queryFn: () => base44.entities.Retainer.filter({ case_id: caseData.id }),
    enabled: !!caseData.id,
  });

  const retainer = retainers[0];

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Retainer.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["retainer", caseData.id] });
      setShowSetup(false);
      toast({ title: "Retainer created successfully" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Retainer.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["retainer", caseData.id] }),
  });

  const handleSetup = (e) => {
    e.preventDefault();
    const deposit = parseFloat(setupForm.initial_deposit);
    const threshold = parseFloat(setupForm.alert_threshold) || 0;
    createMutation.mutate({
      company_id: companyId,
      case_id: caseData.id,
      case_title: caseData.title,
      client_id: caseData.client_id,
      client_name: caseData.client_name,
      initial_deposit: deposit,
      current_balance: deposit,
      total_deducted: 0,
      currency,
      alert_threshold: threshold,
      alert_triggered: false,
      status: "active",
      notes: setupForm.notes,
    });
  };

  const handleDeduct = (e) => {
    e.preventDefault();
    const amount = parseFloat(deductForm.amount);
    if (!retainer || amount <= 0) return;

    const newBalance = parseFloat((retainer.current_balance - amount).toFixed(2));
    const newDeducted = parseFloat(((retainer.total_deducted || 0) + amount).toFixed(2));
    const belowThreshold = retainer.alert_threshold > 0 && newBalance < retainer.alert_threshold;
    const depleted = newBalance <= 0;

    updateMutation.mutate({
      id: retainer.id,
      data: {
        current_balance: Math.max(newBalance, 0),
        total_deducted: newDeducted,
        status: depleted ? "depleted" : "active",
        alert_triggered: belowThreshold,
      },
    });

    if (belowThreshold && !retainer.alert_triggered) {
      toast({
        title: "⚠️ Retainer Balance Low",
        description: `Balance (${formatCurrency(newBalance, currency)}) has fallen below the alert threshold of ${formatCurrency(retainer.alert_threshold, currency)}.`,
        variant: "destructive",
      });
    } else if (depleted) {
      toast({ title: "Retainer Depleted", description: "The retainer balance has reached zero.", variant: "destructive" });
    } else {
      toast({ title: `Deducted ${formatCurrency(amount, currency)}`, description: `Remaining balance: ${formatCurrency(newBalance, currency)}` });
    }

    setDeductForm({ amount: "", reason: "" });
    setShowDeduct(false);
  };

  const handleUpdateThreshold = (newThreshold) => {
    if (!retainer) return;
    const threshold = parseFloat(newThreshold);
    updateMutation.mutate({ id: retainer.id, data: { alert_threshold: threshold } });
    toast({ title: "Alert threshold updated" });
  };

  const percentUsed = retainer ? Math.min(100, ((retainer.total_deducted || 0) / retainer.initial_deposit) * 100) : 0;
  const percentRemaining = 100 - percentUsed;

  if (isLoading) return <div className="p-8 text-center text-sm text-muted-foreground">{t("loading_retainer", "Loading retainer...")}</div>;

  return (
    <div className="space-y-4">
      {/* Low balance / depleted alert banner */}
      {retainer?.alert_triggered && retainer?.status !== "depleted" && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{t("retainer_balance_low", "Retainer Balance Low")}</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {t("current_balance_of", "Current balance of")} {formatCurrency(retainer.current_balance, currency)} {t("is_below_the_alert_threshold_o", "is below the alert threshold of")} {formatCurrency(retainer.alert_threshold, currency)}{t("request_a_top_up_from_the_clie", ". Request a top-up from the client.")}
            </p>
          </div>
        </div>
      )}
      {retainer?.status === "depleted" && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">{t("retainer_depleted", "Retainer Depleted")}</p>
            <p className="text-xs text-red-700 mt-0.5">{t(
              "the_retainer_balance_has_been_",
              "The retainer balance has been fully used. Client needs to replenish."
            )}</p>
          </div>
        </div>
      )}
      {!retainer ? (
        /* No retainer yet */
        (<div className="bg-card rounded-xl border border-border p-10 text-center">
          <Wallet className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium">{t("no_retainer_set_up", "No Retainer Set Up")}</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">{t(
            "set_an_initial_deposit_and_tra",
            "Set an initial deposit and track balance deductions against this case."
          )}</p>
          <Button onClick={() => setShowSetup(true)} className="gap-2">
            <Plus className="w-4 h-4" /> {t("set_up_retainer", "Set Up Retainer")}
          </Button>
        </div>)
      ) : (
        <>
          {/* Balance card */}
          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("current_balance", "Current Balance")}</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(retainer.current_balance, currency)}</p>
                </div>
              </div>
              <Badge className={`text-[10px] capitalize ${RETAINER_STATUS_COLORS[retainer.status]}`}>{retainer.status}</Badge>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t("used", "Used:")} {formatCurrency(retainer.total_deducted || 0, currency)}</span>
                <span>{t("initial", "Initial:")} {formatCurrency(retainer.initial_deposit, currency)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${percentRemaining < 20 ? "bg-red-500" : percentRemaining < 40 ? "bg-amber-500" : "bg-primary"}`}
                  style={{ width: `${percentRemaining}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-right">{percentRemaining.toFixed(0)}{t("remaining", "% remaining")}</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="bg-muted/40 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">{t("initial_deposit", "Initial Deposit")}</p>
                <p className="text-sm font-semibold">{formatCurrency(retainer.initial_deposit, currency)}</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">{t("total_deducted", "Total Deducted")}</p>
                <p className="text-sm font-semibold">{formatCurrency(retainer.total_deducted || 0, currency)}</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">{t("alert_threshold", "Alert Threshold")}</p>
                <p className="text-sm font-semibold">{retainer.alert_threshold > 0 ? formatCurrency(retainer.alert_threshold, currency) : "—"}</p>
              </div>
            </div>

            {retainer.notes && <p className="text-xs text-muted-foreground border-t border-border pt-3">{retainer.notes}</p>}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button onClick={() => setShowDeduct(true)} disabled={retainer.status === "depleted"} className="gap-2" size="sm">
                <Minus className="w-3.5 h-3.5" /> {t("deduct_bill", "Deduct Bill")}
              </Button>
              <Button variant="outline" onClick={() => setShowSetup(true)} size="sm" className="gap-2">
                <Settings className="w-3.5 h-3.5" /> {t("edit_top_up", "Edit / Top-Up")}
              </Button>
              {retainer.alert_triggered && (
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground"
                  onClick={() => updateMutation.mutate({ id: retainer.id, data: { alert_triggered: false } })}>
                  <CheckCircle className="w-3.5 h-3.5" /> {t("dismiss_alert", "Dismiss Alert")}
                </Button>
              )}
            </div>
          </div>
        </>
      )}
      {/* Setup / Edit dialog */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{retainer ? "Edit Retainer / Top-Up" : "Set Up Retainer"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={retainer ? (e) => {
            e.preventDefault();
            const deposit = parseFloat(setupForm.initial_deposit) || retainer.initial_deposit;
            const threshold = parseFloat(setupForm.alert_threshold) ?? retainer.alert_threshold;
            // Top-up: add to current balance and initial deposit
            const addedAmount = deposit - retainer.initial_deposit;
            updateMutation.mutate({
              id: retainer.id,
              data: {
                initial_deposit: deposit,
                current_balance: parseFloat((retainer.current_balance + Math.max(0, addedAmount)).toFixed(2)),
                alert_threshold: threshold,
                notes: setupForm.notes || retainer.notes,
                status: retainer.current_balance > 0 ? "active" : retainer.status,
                alert_triggered: threshold > 0 && retainer.current_balance < threshold,
              },
            });
            setShowSetup(false);
            toast({ title: "Retainer updated" });
          } : handleSetup} className="space-y-3">
            <div>
              <Label>{t("initial_deposit", "Initial Deposit (")}{currency})</Label>
              <Input
                type="number" min={0} step="0.01"
                placeholder={retainer ? String(retainer.initial_deposit) : "e.g. 5000"}
                value={setupForm.initial_deposit}
                onChange={e => setSetupForm({ ...setupForm, initial_deposit: e.target.value })}
                required={!retainer}
              />
              {retainer && <p className="text-xs text-muted-foreground mt-1">{t(
                "increasing_this_adds_to_the_cu",
                "Increasing this adds to the current balance (top-up)."
              )}</p>}
            </div>
            <div>
              <Label>{t("low_balance_alert_threshold", "Low Balance Alert Threshold (")}{currency})</Label>
              <Input
                type="number" min={0} step="0.01"
                placeholder={retainer ? String(retainer.alert_threshold || 0) : "e.g. 1000"}
                value={setupForm.alert_threshold}
                onChange={e => setSetupForm({ ...setupForm, alert_threshold: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">{t(
                "you_ll_be_alerted_when_balance",
                "You'll be alerted when balance falls below this amount."
              )}</p>
            </div>
            <div>
              <Label>{t("notes_optional", "Notes (optional)")}</Label>
              <Input
                placeholder="e.g. Paid via bank transfer on Jan 5"
                value={setupForm.notes}
                onChange={e => setSetupForm({ ...setupForm, notes: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setShowSetup(false)}>{t("cancel", "Cancel")}</Button>
              <Button type="submit">{retainer ? "Save Changes" : "Create Retainer"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Deduct dialog */}
      <Dialog open={showDeduct} onOpenChange={setShowDeduct}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t("deduct_from_retainer", "Deduct from Retainer")}</DialogTitle></DialogHeader>
          <form onSubmit={handleDeduct} className="space-y-3">
            <div className="bg-muted/40 rounded-lg p-3 text-sm">
              {t("available_balance", "Available balance:")} <span className="font-semibold">{formatCurrency(retainer?.current_balance || 0, currency)}</span>
            </div>
            <div>
              <Label>{t("amount_to_deduct", "Amount to Deduct (")}{currency})</Label>
              <Input
                type="number" min={0.01} step="0.01"
                max={retainer?.current_balance}
                value={deductForm.amount}
                onChange={e => setDeductForm({ ...deductForm, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>{t("reason_invoice_reference", "Reason / Invoice Reference")}</Label>
              <Input
                placeholder="e.g. Invoice INV-001 for court appearance"
                value={deductForm.reason}
                onChange={e => setDeductForm({ ...deductForm, reason: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setShowDeduct(false)}>{t("cancel", "Cancel")}</Button>
              <Button type="submit" variant="destructive">{t("deduct", "Deduct")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}