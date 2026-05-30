import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { DollarSign, Search, TrendingUp, Calendar, ArrowUpRight, Download, MoreVertical, Eye, Edit2, Trash2, Edit, FileText, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

import { Input } from '@/components/ui/input';
import { usePayment } from '@/hooks/integrations/usePayment';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function Sales() {
  const { t } = useTranslation();
  // Supabase Real-time Sync Hooks
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('retail_sale');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();
  const companyId = useCompanyId();
  const { processPayment } = usePayment();

  // Map database records
  const sales = dbRecords.map(r => {
    const data = r.data || {};
    return {
      id: r.id,
      saleId: data.saleId || `SAL-${r.id?.slice(0, 4)}`,
      date: data.timestamp ? new Date(data.timestamp).toLocaleString() : 'Just now',
      items: data.items || [],
      total: parseFloat(data.total) || 0,
      subtotal: parseFloat(data.subtotal) || 0,
      tax: parseFloat(data.tax) || 0,
      method: data.paymentMethod || 'Cash',
      cashier: 'POS Cashier',
      status: r.status || 'Completed'
    };
  });

  const [search, setSearch] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ status: 'Completed' });

  const stats = {
    totalSales: sales.reduce((sum, s) => sum + s.total, 0),
    transactions: sales.length,
    avgValue: sales.length > 0 ? sales.reduce((sum, s) => sum + s.total, 0) / sales.length : 0
  };

  const filtered = sales.filter(s => 
    s.saleId?.toLowerCase().includes(search.toLowerCase()) || 
    s.method?.toLowerCase().includes(search.toLowerCase())
  );

  const openDetails = (sale) => {
    setSelectedRecord(sale);
    setIsSheetOpen(true);
  };

  const openEdit = (sale) => {
    setEditingId(sale.id);
    setFormData({ status: sale.status });
    setShowModal(true);
  };

  const handleUpdateStatus = () => {
    if (!editingId) return;
    const sale = dbRecords.find(r => r.id === editingId);
    if (!sale) return;

    mutateRecord.mutate({
      id: editingId,
      recordType: 'retail_sale',
      payload: sale.data,
      status: formData.status,
      searchText: sale.search_text
    }, {
      onSuccess: () => {
        toast.success('Sale status updated successfully!');
        setShowModal(false);
        setEditingId(null);
      },
      onError: (err) => {
        toast.error('Failed to update sale: ' + err.message);
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'retail_sale' }, {
      onSuccess: () => {
        toast.success('Sale record deleted.');
        setDeleteTargetId(null);
      },
      onError: (err) => {
        toast.error('Failed to delete sale: ' + err.message);
        setDeleteTargetId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">{t("sales_history", "Sales History")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t(
            "view_real_time_transactions_re",
            "View real-time transactions, refunds, and daily reports"
          )}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm col-span-1 md:col-span-2 bg-gradient-to-br from-blue-600 to-blue-800 text-white relative overflow-hidden">
           <div className="relative z-10">
               <p className="text-sm font-bold text-blue-200 uppercase tracking-wider mb-2">{t("today_s_sales", "Today's Sales")}</p>
               <h2 className="text-4xl font-black mb-1">${stats.totalSales.toFixed(2)}</h2>
               <p className="text-sm text-blue-100 flex items-center gap-1"><ArrowUpRight className="w-4 h-4 text-green-300"/> {t("real_time_production_transacti", "Real-time production transactions")}</p>
           </div>
           <TrendingUp className="absolute right-[-20px] bottom-[-20px] w-48 h-48 opacity-10 text-white" />
        </div>
        
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
           <p className="text-sm font-bold text-muted-foreground uppercase mb-2">{t("transactions", "Transactions")}</p>
           <h3 className="text-3xl font-black text-card-foreground">{stats.transactions}</h3>
           <p className="text-xs text-muted-foreground mt-2 font-medium">{t("total_receipts_registered", "Total receipts registered")}</p>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
           <p className="text-sm font-bold text-muted-foreground uppercase mb-2">{t("avg_order_value", "Avg. Order Value")}</p>
           <h3 className="text-3xl font-black text-card-foreground">${stats.avgValue.toFixed(2)}</h3>
           <p className="text-xs text-muted-foreground mt-2 font-medium">{t("per_transaction", "Per transaction")}</p>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search receipt ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
        </div>
        <div className="overflow-x-auto">
          {isDbLoading ? (
            <div className="py-12 text-center text-muted-foreground">{t("loading_sales_history", "Loading sales history...")}</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
               <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse" />
               <p className="font-semibold">{t("no_sales_transactions_logged", "No sales transactions logged.")}</p>
               <p className="text-xs mt-1">{t(
                 "execute_purchases_in_the_pos_p",
                 "Execute purchases in the POS page to record them here."
               )}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-card border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("receipt_no", "Receipt No.")}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("date_time", "Date & Time")}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("cashier", "Cashier")}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("payment_method", "Payment Method")}</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">{t("status", "Status")}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">{t("total_amount", "Total Amount")}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">{t("actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(sale => {
                  return (
                    <tr key={sale.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-blue-600">{sale.saleId}</td>
                      <td className="px-6 py-4 text-muted-foreground">{sale.date}</td>
                      <td className="px-6 py-4 font-medium text-card-foreground">{sale.cashier}</td>
                      <td className="px-6 py-4 text-muted-foreground">{sale.method}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${sale.status === 'Refunded' ? 'bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-400' : 'bg-green-100 dark:bg-green-950/20 text-green-700 dark:text-green-400'}`}>
                          {sale.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-card-foreground">${sale.total.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">{t("open_menu", "Open menu")}</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetails(sale)}>
                              <Eye className="mr-2 h-4 w-4" /> {t("view_details", "View Details")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              const customerEmail = prompt("Enter customer email for payment receipt:");
                              if (customerEmail) {
                                processPayment({ companyId, provider: 'stripe', amount: sale.total, currency: 'USD', customerEmail, invoiceId: sale.saleId });
                              }
                            }}>
                              <CreditCard className="mr-2 h-4 w-4" /> {t("process_payment", "Process Payment")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(sale)}>
                              <Edit2 className="mr-2 h-4 w-4" /> {t("edit_status", "Edit Status")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteTargetId(sale.id)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" /> {t("delete", "Delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="overflow-y-auto w-[400px]">
          <SheetHeader>
            <SheetTitle>{t("sale_receipt_details", "Sale Receipt Details")}</SheetTitle>
            <SheetDescription>{t("view_details_for_receipt", "View details for receipt")} {selectedRecord?.saleId}</SheetDescription>
          </SheetHeader>
          {selectedRecord && (
            <div className="mt-6 space-y-6 text-sm">
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div className="font-semibold text-muted-foreground">{t("date", "Date")}</div>
                <div className="text-right">{selectedRecord.date}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div className="font-semibold text-muted-foreground">{t("cashier", "Cashier")}</div>
                <div className="text-right">{selectedRecord.cashier}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div className="font-semibold text-muted-foreground">{t("payment_method", "Payment Method")}</div>
                <div className="text-right">{selectedRecord.method}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div className="font-semibold text-muted-foreground">{t("status", "Status")}</div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${selectedRecord.status === 'Refunded' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {selectedRecord.status}
                  </span>
                </div>
              </div>
              
              <div>
                <div className="font-bold mb-3 uppercase text-xs text-muted-foreground tracking-wider">{t("items_purchased", "Items Purchased")}</div>
                <div className="space-y-3">
                  {selectedRecord.items.map((item, idx) => {
                    return (
                      <div key={idx} className="flex justify-between items-center bg-muted/30 p-2 rounded">
                        <div>
                          <div className="font-semibold">{item.name}</div>
                          <div className="text-xs text-muted-foreground font-mono"><Link to="/retail/inventory" className="text-primary hover:underline">{item.sku}</Link></div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">${item.price.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">{t("qty", "Qty:")} {item.qty}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("subtotal", "Subtotal")}</span>
                  <span>${selectedRecord.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("tax", "Tax")}</span>
                  <span>${selectedRecord.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-lg text-card-foreground pt-2">
                  <span>{t("total", "Total")}</span>
                  <span>${selectedRecord.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-card-foreground">{t("update_sale_status", "Update Sale Status")}</h2>
            <div className="space-y-3">
               <div>
                 <label className="text-xs font-bold text-muted-foreground uppercase">{t("status", "Status")}</label>
                 <select value={formData.status} onChange={e => setFormData({ status: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                   <option value="Completed">{t("completed", "Completed")}</option>
                   <option value="Refunded">{t("refunded", "Refunded")}</option>
                 </select>
               </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleUpdateStatus}>{t("save_changes", "Save Changes")}</Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Delete Sale Record"
        message="Are you sure you want to delete this sale record? This action cannot be undone."
      />
    </div>
  );
}
