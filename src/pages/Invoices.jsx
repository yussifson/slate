import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useCompanyId, useCompany } from "@/hooks/useCompanyId";
import { Plus, Receipt, Search, CheckCircle2, Clock, AlertCircle, MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { getTerm } from "@/config/industries";
import ExportButton from "@/components/shared/ExportButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import InvoiceForm from "@/components/invoices/InvoiceForm";
import { INVOICE_STATUS_COLORS, formatCurrency } from "@/lib/constants";
import { format } from "date-fns";

export default function Invoices() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const { data: companyContext } = useCompany();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invoices"] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invoices"] }); setEditingInvoice(null); },
  });

  const handleDeleteOne = async (id) => {
    if (!window.confirm("Delete this invoice? This cannot be undone.")) return;
    try {
      await base44.entities.Invoice.delete(id);
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    } catch (err) {
      console.error(err);
    }
  };

  const currency = company?.currency || "GHS";
  const industry = companyContext?.industry_type || "law";
  const clientTerm = getTerm(industry, "client");

  const filtered = invoices.filter(i => {
    const matchSearch = !search || i.client_name?.toLowerCase().includes(search.toLowerCase()) || i.invoice_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.total_amount || 0), 0);
  const totalPending = invoices.filter(i => ["sent", "draft"].includes(i.status)).reduce((s, i) => s + (i.total_amount || 0), 0);

  const getPaymentStatusIcon = (status) => {
    if (status === "paid") return <span className="flex items-center gap-1 text-green-700 text-xs font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> Paid</span>;
    if (status === "overdue") return <span className="flex items-center gap-1 text-red-600 text-xs font-medium"><AlertCircle className="w-3.5 h-3.5" /> Overdue</span>;
    return <span className="flex items-center gap-1 text-amber-600 text-xs font-medium"><Clock className="w-3.5 h-3.5" /> Pending</span>;
  };

  const columns = [
    { header: "Invoice #", render: (row) => <span className="font-medium text-sm">{row.invoice_number || "—"}</span> },
    { header: clientTerm, render: (row) => <Link to="/clients" className="text-sm text-primary hover:underline">{row.client_name}</Link> },
    { header: "Amount", render: (row) => <span className="font-semibold text-sm">{formatCurrency(row.total_amount, row.currency)}</span> },
    { header: "Payment Status", render: (row) => getPaymentStatusIcon(row.status) },
    { header: "Status", render: (row) => <Badge className={`${INVOICE_STATUS_COLORS[row.status]} text-[10px]`}>{row.status}</Badge> },
    { header: "Due Date", render: (row) => <span className="text-xs text-muted-foreground">{row.due_date ? format(new Date(row.due_date), "MMM d, yyyy") : "—"}</span> },
    { header: "Paid Date", render: (row) => <span className="text-xs text-muted-foreground">{row.paid_date ? format(new Date(row.paid_date), "MMM d, yyyy") : "—"}</span> },
    {
      header: "Actions",
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setViewingInvoice(row); }}>View Details</DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingInvoice(row); }}>Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); handleDeleteOne(row.id); }}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Invoices"
        subtitle={`${formatCurrency(totalRevenue, currency)} collected · ${formatCurrency(totalPending, currency)} pending`}
        actions={
          <div className="flex items-center gap-2">
            <ExportButton data={invoices.map(i => ({ invoice_number: i.invoice_number, client: i.client_name, amount: i.total_amount, currency: i.currency, status: i.status, due_date: i.due_date, paid_date: i.paid_date }))} filename="invoices_export" label="Export" />
            <Button onClick={() => setShowForm(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> New Invoice</Button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search invoices..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        emptyTitle="No invoices yet"
        emptyDescription="Create your first invoice."
        emptyIcon={Receipt}
      />

      {(showForm || editingInvoice) && (
        <InvoiceForm
          open={showForm || !!editingInvoice}
          onClose={() => { setShowForm(false); setEditingInvoice(null); }}
          onSubmit={(data) => editingInvoice ? updateMutation.mutate({ id: editingInvoice.id, data }) : createMutation.mutate(data)}
          initialData={editingInvoice}
          clients={clients}
          currency={currency}
          clientTerm={clientTerm}
        />
      )}

      <Sheet open={!!viewingInvoice} onOpenChange={(open) => !open && setViewingInvoice(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Invoice Details</SheetTitle>
          </SheetHeader>
          {viewingInvoice && (
            <div className="mt-6 space-y-4">
              <div>
                <Label className="text-muted-foreground">Invoice #</Label>
                <p className="font-medium">{viewingInvoice.invoice_number || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">{clientTerm}</Label>
                <p className="font-medium">
                  <Link to="/clients" className="text-primary hover:underline">{viewingInvoice.client_name || "—"}</Link>
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Amount</Label>
                <p className="font-medium">{formatCurrency(viewingInvoice.total_amount, viewingInvoice.currency)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <p className="font-medium capitalize">{viewingInvoice.status || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Due Date</Label>
                <p className="font-medium">{viewingInvoice.due_date ? format(new Date(viewingInvoice.due_date), "MMM d, yyyy") : "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Paid Date</Label>
                <p className="font-medium">{viewingInvoice.paid_date ? format(new Date(viewingInvoice.paid_date), "MMM d, yyyy") : "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Notes</Label>
                <p className="font-medium whitespace-pre-wrap">{viewingInvoice.notes || "—"}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}