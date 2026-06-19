import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFirmSettings } from "@/hooks/useFirmSettings";
import AddOptionInline from "@/components/shared/AddOptionInline";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useQuery } from "@tanstack/react-query";

const PRIORITIES = ["low", "medium", "high", "urgent"];

export default function CaseForm({ open, onClose, onSubmit, initialData, clients, staff }) {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { caseTypes, caseStatuses, addCaseType, addCaseStatus } = useFirmSettings();

  const [form, setForm] = useState(initialData || {
    title: "", description: "", case_type: "civil", status: "open", priority: "medium",
    case_number: "", client_id: undefined, client_name: "", assigned_lawyer: undefined,
    assigned_lawyer_name: "", court_name: "", judge_name: "",
    opposing_party: "", opposing_counsel: "", filing_date: "", notes: ""
  });

  // Auto-generate case number for new cases
  useEffect(() => {
    if (!initialData && open) {
      base44.functions.invoke("autoNumberCase", { company_id: companyId })
        .then(res => {
          const num = res?.data?.case_number;
          if (num) setForm(prev => ({ ...prev, case_number: num }));
        })
        .catch(() => {});
    }
    if (initialData) setForm(initialData);
  }, [open, initialData]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleClientChange = (clientId) => {
    const client = clients?.find(c => c.id === clientId);
    setForm(prev => ({ ...prev, client_id: clientId || undefined, client_name: client?.name || "" }));
  };

  const handleLawyerChange = (email) => {
    const lawyer = staff?.find(s => s.user_email === email);
    setForm(prev => ({ ...prev, assigned_lawyer: email || undefined, assigned_lawyer_name: lawyer?.full_name || "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title?.trim()) return;
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Case" : "New Case"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>{t("case_title", "Case Title *")}</Label>
              <Input value={form.title} onChange={(e) => handleChange("title", e.target.value)} required />
            </div>
            <div>
              <Label>{t("case_number", "Case Number")}</Label>
              <Input value={form.case_number} onChange={(e) => handleChange("case_number", e.target.value)} placeholder="Auto-generated" />
            </div>
            <div>
              <Label>{t("case_type", "Case Type")}</Label>
              <Select value={form.case_type} onValueChange={(v) => handleChange("case_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {caseTypes.map(item => {
                    return <SelectItem key={item} value={item} className="capitalize">{item.replace(/_/g, " ")}</SelectItem>;
                  })}
                  <AddOptionInline onAdd={(v) => { addCaseType(v); handleChange("case_type", v); }} placeholder="New case type..." />
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("status", "Status")}</Label>
              <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {caseStatuses.map(s => {
                    return <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>;
                  })}
                  <AddOptionInline onAdd={(v) => { addCaseStatus(v); handleChange("status", v); }} placeholder="New status..." />
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("priority", "Priority")}</Label>
              <Select value={form.priority} onValueChange={(v) => handleChange("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => {
                    return <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("client", "Client")} <span className="text-[#71717a] dark:text-gray-400 text-xs tracking-[0.04em]">{t("optional", "(optional)")}</span></Label>
              <Select value={form.client_id || undefined} onValueChange={handleClientChange}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients?.map(c => {
                    return <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("assigned_lawyer", "Assigned Lawyer")} <span className="text-[#71717a] dark:text-gray-400 text-xs tracking-[0.04em]">{t("optional", "(optional)")}</span></Label>
              <Select value={form.assigned_lawyer || undefined} onValueChange={handleLawyerChange}>
                <SelectTrigger><SelectValue placeholder="Select lawyer" /></SelectTrigger>
                <SelectContent>
                  {staff?.filter(s => ["lawyer", "company_admin"].includes(s.role)).map(s => {
                    return (<SelectItem key={s.user_email} value={s.user_email}>{s.full_name}</SelectItem>);
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("court_name", "Court Name")} <span className="text-[#71717a] dark:text-gray-400 text-xs tracking-[0.04em]">{t("optional", "(optional)")}</span></Label>
              <Input value={form.court_name} onChange={(e) => handleChange("court_name", e.target.value)} />
            </div>
            <div>
              <Label>{t("judge_name", "Judge Name")} <span className="text-[#71717a] dark:text-gray-400 text-xs tracking-[0.04em]">{t("optional", "(optional)")}</span></Label>
              <Input value={form.judge_name} onChange={(e) => handleChange("judge_name", e.target.value)} />
            </div>
            <div>
              <Label>{t("opposing_party", "Opposing Party")} <span className="text-[#71717a] dark:text-gray-400 text-xs tracking-[0.04em]">{t("optional", "(optional)")}</span></Label>
              <Input value={form.opposing_party} onChange={(e) => handleChange("opposing_party", e.target.value)} />
            </div>
            <div>
              <Label>{t("filing_date", "Filing Date")} <span className="text-[#71717a] dark:text-gray-400 text-xs tracking-[0.04em]">{t("optional", "(optional)")}</span></Label>
              <Input type="date" value={form.filing_date} onChange={(e) => handleChange("filing_date", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>{t("description", "Description")}</Label>
              <Textarea value={form.description} onChange={(e) => handleChange("description", e.target.value)} rows={3} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>{t("cancel", "Cancel")}</Button>
            <Button type="submit">{initialData ? "Update" : "Create"} {t("case", "Case")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}