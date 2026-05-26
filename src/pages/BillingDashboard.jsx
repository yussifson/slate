import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useCompanyId } from "@/hooks/useCompanyId";
import { isSuperAdmin } from "@/lib/constants";
import { CreditCard, TrendingUp, AlertCircle, CheckCircle, Clock, Send, RefreshCw, DollarSign, MoreVertical, Pencil, Plus, Search, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/shared/PageHeader";
import InvoiceForm from "@/components/invoices/InvoiceForm";
import ExpenseForm from "@/components/billing/ExpenseForm";
import { INVOICE_STATUS_COLORS, formatCurrency } from "@/lib/constants";
import { format } from "date-fns";
import { useImpersonation } from "@/lib/ImpersonationContext";

// ─── shared helpers ────────────────────────────────────────────────────────────

const SUB_STATUS_COLORS = {
  pending: "bg-slate-100 text-slate-600",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const SUB_STATUS_ICONS = { pending: Clock, sent: Send, paid: CheckCircle, overdue: AlertCircle, cancelled: AlertCircle };

function MetricCard({ icon: IconComp, label, value, color }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <IconComp className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ─── Company billing view ──────────────────────────────────────────────────────

const EXPENSE_CATEGORY_LABELS = {
  travel: "Travel", filing_fees: "Filing Fees", court_costs: "Court Costs",
  postage: "Postage", printing: "Printing", accommodation: "Accommodation",
  expert_fees: "Expert Fees", translation: "Translation", other: "Other",
};

function CompanyBilling({ companyId }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterType, setFilterType] = useState("all"); // "case" | "client" | "all"
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", companyId],
    queryFn: () => base44.entities.Invoice.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", companyId],
    queryFn: () => base44.entities.Client.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ["cases-billing", companyId],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["expenses", companyId],
    queryFn: () => base44.entities.Expense.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create({ ...data, company_id: companyId, currency: currency }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["expenses", companyId] }); setShowExpenseForm(false); setEditingExpense(null); toast({ title: "Expense logged" }); },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Expense.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["expenses", companyId] }); setEditingExpense(null); toast({ title: "Expense updated" }); },
  });

  const addExpenseToInvoice = (expense) => {
    setShowForm(true);
    // pre-seed an invoice with this expense as a line item
    setEditingInvoice({
      invoice_number: `INV-${Date.now().toString().slice(-6)}`,
      client_id: expense.client_id || "",
      client_name: expense.client_name || "",
      case_id: expense.case_id || "",
      case_title: expense.case_title || "",
      status: "draft",
      due_date: "",
      notes: "",
      items: [{ description: `${EXPENSE_CATEGORY_LABELS[expense.category] || expense.category}: ${expense.description}`, quantity: 1, unit_price: expense.amount, total: expense.amount }],
    });
  };

  const { data: company } = useQuery({
    queryKey: ["company", companyId],
    queryFn: async () => {
      const list = await base44.entities.Company.list();
      return list.find(c => c.id === companyId) || null;
    },
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.create({ ...data, company_id: companyId, currency: company?.currency || "GHS" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invoices"] }); setShowForm(false); toast({ title: "Invoice created" }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invoices"] }); setEditingInvoice(null); toast({ title: "Invoice updated" }); },
  });

  const currency = company?.currency || "GHS";

  const filtered = invoices.filter(inv => {
    const matchSearch = !search ||
      inv.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.case_title?.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    const matchType = filterType === "all" ||
      (filterType === "case" && !!inv.case_id) ||
      (filterType === "client" && !inv.case_id);
    return matchSearch && matchStatus && matchType;
  });

  const totalCollected = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.total_amount || 0), 0);
  const totalPending = invoices.filter(i => ["sent", "draft"].includes(i.status)).reduce((s, i) => s + (i.total_amount || 0), 0);
  const overdueCount = invoices.filter(i => i.status === "overdue").length;

  // Group by case or client for display
  const grouped = {};
  filtered.forEach(inv => {
    const key = inv.case_id ? `case:${inv.case_id}` : `client:${inv.client_id}`;
    const label = inv.case_id ? `Case: ${inv.case_title || "—"}` : `Client: ${inv.client_name || "—"}`;
    if (!grouped[key]) grouped[key] = { label, invoices: [] };
    grouped[key].invoices.push(inv);
  });

  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const unbilledExpenses = expenses.filter(e => e.billable && !e.billed);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        subtitle="Invoices and expenses"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={DollarSign} label="Collected" value={formatCurrency(totalCollected, currency)} color="bg-green-50 text-green-600" />
        <MetricCard icon={Clock} label="Pending" value={formatCurrency(totalPending, currency)} color="bg-blue-50 text-blue-600" />
        <MetricCard icon={AlertCircle} label="Overdue" value={overdueCount} color="bg-red-50 text-red-600" />
        <MetricCard icon={Receipt} label="Unbilled Expenses" value={unbilledExpenses.length} color="bg-amber-50 text-amber-600" />
      </div>

      <Tabs defaultValue="invoices">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setEditingExpense(null); setShowExpenseForm(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Log Expense
            </Button>
            <Button size="sm" onClick={() => { setEditingInvoice(null); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-1" /> New Invoice
            </Button>
          </div>
        </div>

        {/* ── Invoices Tab ── */}
        <TabsContent value="invoices" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by client, case or invoice #..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="case">By Case</SelectItem>
                <SelectItem value="client">By Client</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-sm text-muted-foreground">Loading...</div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center text-sm text-muted-foreground">
              No invoices found. Create your first invoice to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([key, group]) => {
                const groupTotal = group.invoices.reduce((s, i) => s + (i.total_amount || 0), 0);
                return (
                  <div key={key} className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
                      <p className="text-sm font-semibold">{group.label}</p>
                      <span className="text-xs font-medium text-muted-foreground">{formatCurrency(groupTotal, currency)} total</span>
                    </div>
                    <div className="divide-y divide-border">
                      {group.invoices.map(inv => (
                        <div key={inv.id} className="px-4 py-3 flex items-center gap-4 hover:bg-muted/20 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">{inv.invoice_number || "No #"}</span>
                              <Badge className={`text-[10px] ${INVOICE_STATUS_COLORS[inv.status]}`}>{inv.status}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {inv.client_name} {inv.due_date ? `· Due ${format(new Date(inv.due_date), "MMM d, yyyy")}` : ""}
                            </p>
                          </div>
                          <p className="text-sm font-bold shrink-0">{formatCurrency(inv.total_amount, inv.currency)}</p>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setEditingInvoice(inv)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {inv.status !== "paid" && (
                                <DropdownMenuItem onClick={() => updateMutation.mutate({ id: inv.id, data: { status: "paid", paid_date: new Date().toISOString().split("T")[0] } })}>
                                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" /> Mark as Paid
                                </DropdownMenuItem>
                              )}
                              {inv.status === "draft" && (
                                <DropdownMenuItem onClick={() => updateMutation.mutate({ id: inv.id, data: { status: "sent" } })}>
                                  <Send className="w-4 h-4 mr-2" /> Mark as Sent
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-destructive" onClick={() => updateMutation.mutate({ id: inv.id, data: { status: "cancelled" } })}>
                                Cancel Invoice
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Expenses Tab ── */}
        <TabsContent value="expenses" className="mt-4">
          {expensesLoading ? (
            <div className="text-center py-12 text-sm text-muted-foreground">Loading...</div>
          ) : expenses.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center text-sm text-muted-foreground">
              No expenses logged yet. Click "Log Expense" to add one.
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="divide-y divide-border">
                {expenses.map(exp => (
                  <div key={exp.id} className="px-4 py-3 flex items-center gap-4 hover:bg-muted/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{exp.description}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">{EXPENSE_CATEGORY_LABELS[exp.category] || exp.category}</Badge>
                        {exp.billable && !exp.billed && <Badge className="text-[10px] bg-amber-100 text-amber-700">Unbilled</Badge>}
                        {exp.billed && <Badge className="text-[10px] bg-green-100 text-green-700">Billed</Badge>}
                        {!exp.billable && <Badge className="text-[10px] bg-gray-100 text-gray-600">Internal</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {exp.case_title || exp.client_name || "—"}
                        {exp.expense_date ? ` · ${format(new Date(exp.expense_date), "MMM d, yyyy")}` : ""}
                      </p>
                    </div>
                    <p className="text-sm font-bold shrink-0">{formatCurrency(exp.amount, exp.currency || currency)}</p>
                    {exp.billable && !exp.billed && (
                      <Button size="sm" variant="outline" className="shrink-0 text-xs h-7 gap-1" onClick={() => addExpenseToInvoice(exp)}>
                        <Plus className="w-3 h-3" /> Invoice
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { setEditingExpense(exp); setShowExpenseForm(true); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {(showForm || editingInvoice) && (
        <InvoiceForm
          open={showForm || !!editingInvoice}
          onClose={() => { setShowForm(false); setEditingInvoice(null); }}
          onSubmit={(data) => editingInvoice?.id ? updateMutation.mutate({ id: editingInvoice.id, data }) : createMutation.mutate(data)}
          initialData={editingInvoice?.id ? editingInvoice : null}
          clients={clients}
          currency={currency}
        />
      )}

      {showExpenseForm && (
        <ExpenseForm
          open={showExpenseForm}
          onClose={() => { setShowExpenseForm(false); setEditingExpense(null); }}
          onSubmit={(data) => editingExpense?.id ? updateExpenseMutation.mutate({ id: editingExpense.id, data }) : createExpenseMutation.mutate(data)}
          initialData={editingExpense}
          cases={cases}
          clients={clients}
          currency={currency}
        />
      )}
    </div>
  );
}

// ─── Super-admin billing view ──────────────────────────────────────────────────

function SuperAdminBilling() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [running, setRunning] = useState(false);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["subscription-invoices"],
    queryFn: () => base44.entities.SubscriptionInvoice.list("-created_date"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SubscriptionInvoice.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscription-invoices"] }),
  });

  const runBilling = async () => {
    setRunning(true);
    await base44.functions.invoke("billingEngine", {});
    await queryClient.invalidateQueries({ queryKey: ["subscription-invoices"] });
    toast({ title: "Billing cycle run", description: "Monthly invoices generated for active firms." });
    setRunning(false);
  };

  const runReminders = async () => {
    setRunning(true);
    await base44.functions.invoke("subscriptionReminders", {});
    toast({ title: "Reminders sent", description: "Late payment reminders dispatched." });
    setRunning(false);
  };

  const sendReminder = async (inv) => {
    await base44.integrations.Core.SendEmail({
      to: inv.admin_email,
      subject: `[Optalflow] Payment Reminder — ${inv.plan_name} Plan`,
      body: `Dear ${inv.company_name},\n\nThis is a reminder that your Optalflow subscription of $${inv.amount_usd} USD for ${inv.billing_period} is ${inv.status === "overdue" ? "OVERDUE" : "pending payment"}.\n\nDue Date: ${inv.due_date}\n\nPlease arrange payment at your earliest convenience.\n\n— Optalflow Billing`,
    });
    updateMutation.mutate({ id: inv.id, data: { reminder_count: (inv.reminder_count || 0) + 1, last_reminder_at: new Date().toISOString() } });
    toast({ title: "Reminder sent", description: `Email sent to ${inv.admin_email}` });
  };

  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.amount_usd || 0), 0);
  const totalPending = invoices.filter(i => ["sent", "pending"].includes(i.status)).reduce((s, i) => s + (i.amount_usd || 0), 0);
  const overdueCount = invoices.filter(i => i.status === "overdue").length;
  const filtered = statusFilter === "all" ? invoices : invoices.filter(i => i.status === statusFilter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Billing"
        subtitle="Manage firm subscription invoices and payment tracking"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={runReminders} disabled={running} className="gap-1.5">
              <Send className="w-3.5 h-3.5" /> Send Reminders
            </Button>
            <Button size="sm" onClick={runBilling} disabled={running} className="gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${running ? "animate-spin" : ""}`} /> Run Billing Cycle
            </Button>
          </div>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={DollarSign} label="Total Collected" value={`$${totalRevenue.toLocaleString()}`} color="bg-green-50 text-green-600" />
        <MetricCard icon={Clock} label="Pending" value={`$${totalPending.toLocaleString()}`} color="bg-blue-50 text-blue-600" />
        <MetricCard icon={AlertCircle} label="Overdue Invoices" value={overdueCount} color="bg-red-50 text-red-600" />
        <MetricCard icon={CreditCard} label="Total Invoices" value={invoices.length} color="bg-purple-50 text-purple-600" />
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-semibold">Subscription Invoices</h2>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Loading invoices...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No invoices found. Run a billing cycle to generate invoices.</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(inv => {
              const StatusIcon = SUB_STATUS_ICONS[inv.status] || Clock;
              return (
                <div key={inv.id} className="px-4 py-3 flex items-center gap-4 hover:bg-muted/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{inv.company_name}</p>
                      <Badge className={`text-[10px] ${SUB_STATUS_COLORS[inv.status]}`}>
                        <StatusIcon className="w-2.5 h-2.5 mr-1" />{inv.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span>{inv.plan_name} Plan</span>
                      <span>Period: {inv.billing_period}</span>
                      <span>Due: {inv.due_date ? format(new Date(inv.due_date), "MMM d, yyyy") : "—"}</span>
                      {inv.reminder_count > 0 && <span className="text-amber-600">{inv.reminder_count} reminder{inv.reminder_count > 1 ? "s" : ""} sent</span>}
                    </div>
                  </div>
                  <p className="text-base font-bold shrink-0">${(inv.amount_usd || 0).toLocaleString()}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {inv.status !== "paid" && (
                        <DropdownMenuItem onClick={() => updateMutation.mutate({ id: inv.id, data: { status: "paid", paid_date: new Date().toISOString().split("T")[0] } })}>
                          <CheckCircle className="w-4 h-4 mr-2 text-green-600" /> Mark as Paid
                        </DropdownMenuItem>
                      )}
                      {inv.status !== "paid" && (
                        <DropdownMenuItem onClick={() => sendReminder(inv)}>
                          <Send className="w-4 h-4 mr-2" /> Send Reminder Email
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => updateMutation.mutate({ id: inv.id, data: { status: "cancelled" } })} className="text-destructive">
                        Cancel Invoice
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────

export default function BillingDashboard() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const { impersonatedCompany } = useImpersonation();

  const showSuperAdmin = isSuperAdmin(user) && !impersonatedCompany;

  return showSuperAdmin ? <SuperAdminBilling /> : <CompanyBilling companyId={companyId} />;
}