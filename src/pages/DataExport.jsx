import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Download, Briefcase, Users, Receipt, Clock, FileText, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import { formatCurrency } from "@/lib/constants";
import { format } from "date-fns";

function toCSV(rows, columns) {
  const header = columns.map(c => `"${c.label}"`).join(",");
  const body = rows.map(row =>
    columns.map(c => {
      const val = c.value(row);
      return `"${String(val ?? "").replace(/"/g, '""')}"`;
    }).join(",")
  ).join("\n");
  return `${header}\n${body}`;
}

function downloadCSV(filename, csvContent) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const EXPORT_CONFIGS = [
  {
    key: "cases",
    label: "Case List",
    icon: Briefcase,
    color: "bg-blue-100 text-blue-600",
    description: "All cases with status, client, assigned lawyer, and dates",
    columns: [
      { label: "Case Number", value: r => r.case_number || "" },
      { label: "Title", value: r => r.title },
      { label: "Type", value: r => r.case_type || "" },
      { label: "Status", value: r => r.status },
      { label: "Priority", value: r => r.priority || "" },
      { label: "Client", value: r => r.client_name || "" },
      { label: "Assigned Lawyer", value: r => r.assigned_lawyer_name || "" },
      { label: "Court", value: r => r.court_name || "" },
      { label: "Filing Date", value: r => r.filing_date || "" },
      { label: "Next Hearing", value: r => r.next_hearing_date || "" },
      { label: "Created", value: r => r.created_date ? format(new Date(r.created_date), "yyyy-MM-dd") : "" },
    ]
  },
  {
    key: "clients",
    label: "Client Data",
    icon: Users,
    color: "bg-purple-100 text-purple-600",
    description: "Client names, contact details, type, and status",
    columns: [
      { label: "Name", value: r => r.name },
      { label: "Email", value: r => r.email || "" },
      { label: "Phone", value: r => r.phone || "" },
      { label: "Type", value: r => r.type || "" },
      { label: "Status", value: r => r.status || "" },
      { label: "City", value: r => r.city || "" },
      { label: "Country", value: r => r.country || "" },
      { label: "Total Cases", value: r => r.total_cases ?? "" },
      { label: "Total Billed", value: r => r.total_billed ?? "" },
      { label: "Added", value: r => r.created_date ? format(new Date(r.created_date), "yyyy-MM-dd") : "" },
    ]
  },
  {
    key: "invoices",
    label: "Billing Report",
    icon: Receipt,
    color: "bg-green-100 text-green-600",
    description: "All invoices with amounts, status, and payment info",
    columns: [
      { label: "Invoice #", value: r => r.invoice_number || "" },
      { label: "Client", value: r => r.client_name || "" },
      { label: "Case", value: r => r.case_title || "" },
      { label: "Status", value: r => r.status },
      { label: "Currency", value: r => r.currency || "GHS" },
      { label: "Subtotal", value: r => r.subtotal ?? "" },
      { label: "Tax", value: r => r.tax_amount ?? "" },
      { label: "Total", value: r => r.total_amount ?? "" },
      { label: "Due Date", value: r => r.due_date || "" },
      { label: "Paid Date", value: r => r.paid_date || "" },
      { label: "Payment Method", value: r => r.payment_method || "" },
      { label: "Created", value: r => r.created_date ? format(new Date(r.created_date), "yyyy-MM-dd") : "" },
    ]
  },
  {
    key: "time",
    label: "Billable Hours",
    icon: Clock,
    color: "bg-amber-100 text-amber-600",
    description: "Time entries with lawyer, case, hours, and billing rate",
    columns: [
      { label: "Date", value: r => r.date || "" },
      { label: "Lawyer", value: r => r.lawyer_name || r.lawyer_email || "" },
      { label: "Case", value: r => r.case_title || "" },
      { label: "Description", value: r => r.description || "" },
      { label: "Hours", value: r => r.hours ?? "" },
      { label: "Rate", value: r => r.hourly_rate ?? "" },
      { label: "Amount", value: r => r.amount ?? "" },
      { label: "Billable", value: r => r.billable ? "Yes" : "No" },
      { label: "Billed", value: r => r.billed ? "Yes" : "No" },
    ]
  },
  {
    key: "tasks",
    label: "Task List",
    icon: CheckSquare,
    color: "bg-cyan-100 text-cyan-600",
    description: "All tasks with assignee, case, priority, and status",
    columns: [
      { label: "Title", value: r => r.title },
      { label: "Case", value: r => r.case_title || "" },
      { label: "Assigned To", value: r => r.assigned_to_name || r.assigned_to || "" },
      { label: "Priority", value: r => r.priority || "" },
      { label: "Status", value: r => r.status },
      { label: "Category", value: r => r.category || "" },
      { label: "Due Date", value: r => r.due_date || "" },
      { label: "Completed", value: r => r.completed_date || "" },
    ]
  },
  {
    key: "staff",
    label: "Staff Records",
    icon: FileText,
    color: "bg-rose-100 text-rose-600",
    description: "Staff details, roles, departments, and leave balances",
    columns: [
      { label: "Full Name", value: r => r.full_name },
      { label: "Email", value: r => r.user_email || "" },
      { label: "Role", value: r => r.role || "" },
      { label: "Department", value: r => r.department || "" },
      { label: "Phone", value: r => r.phone || "" },
      { label: "Status", value: r => r.status || "" },
      { label: "Hire Date", value: r => r.hire_date || "" },
      { label: "Leave Balance", value: r => r.leave_balance ?? "" },
      { label: "Bar Number", value: r => r.bar_number || "" },
    ]
  }
];

export default function DataExport() {
  const { user } = useAuth();
  const companyId = user?.company_id;
  const [exporting, setExporting] = useState(null);

  const { data: cases = [] } = useQuery({ queryKey: ["cases", companyId], queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: clients = [] } = useQuery({ queryKey: ["clients", companyId], queryFn: () => base44.entities.Client.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices", companyId], queryFn: () => base44.entities.Invoice.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: timeEntries = [] } = useQuery({ queryKey: ["time-entries", companyId], queryFn: () => base44.entities.TimeEntry.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks", companyId], queryFn: () => base44.entities.Task.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: staff = [] } = useQuery({ queryKey: ["staff", companyId], queryFn: () => base44.entities.StaffRecord.filter({ company_id: companyId }), enabled: !!companyId });

  const dataMap = { cases, clients, invoices, time: timeEntries, tasks, staff };

  const handleExport = (config) => {
    setExporting(config.key);
    const rows = dataMap[config.key] || [];
    const csv = toCSV(rows, config.columns);
    const filename = `airzyle_${config.key}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    downloadCSV(filename, csv);
    setTimeout(() => setExporting(null), 800);
  };

  const counts = {
    cases: cases.length, clients: clients.length, invoices: invoices.length,
    time: timeEntries.length, tasks: tasks.length, staff: staff.length,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Data Export"
        subtitle="Export cases, client data, and billing reports to CSV"
      />

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 flex items-start gap-2">
        <Download className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Exports include all records for your firm. Files are downloaded as <strong>CSV</strong> which can be opened in Excel, Google Sheets, or any spreadsheet application.</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {EXPORT_CONFIGS.map(config => {
          const Icon = config.icon;
          const count = counts[config.key];
          const isExporting = exporting === config.key;
          return (
            <div key={config.key} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{config.label}</h3>
                    <Badge variant="outline" className="text-[10px]">{count} records</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Columns: </span>
                {config.columns.map(c => c.label).join(", ")}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 self-start"
                onClick={() => handleExport(config)}
                disabled={isExporting || count === 0}
              >
                <Download className={`w-3.5 h-3.5 ${isExporting ? "animate-bounce" : ""}`} />
                {isExporting ? "Downloading..." : `Export CSV`}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}