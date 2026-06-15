import { useTranslation } from "react-i18next";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, CreditCard, ArrowUpRight, Activity, Plus, Search, MoreVertical, Edit, CheckCircle, Loader2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/constants';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';

export default function AdminBilling() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Global Data
  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ['admin_invoices'],
    queryFn: () => base44.entities.Invoice.list()
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['admin_companies'],
    queryFn: () => base44.entities.Company.list()
  });

  // Calculate Metrics
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + (i.total_amount || i.amount || 0), 0);
  const pendingRevenue = invoices.filter(i => i.status === 'pending').reduce((acc, i) => acc + (i.total_amount || i.amount || 0), 0);
  const failedCharges = invoices.filter(i => i.status === 'overdue' || i.status === 'failed').length;

  const getCompanyName = (companyId) => companies.find(c => c.id === companyId)?.name || 'Unknown Firm';

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      return await base44.entities.Invoice.update(id, { status });
    },
    onSuccess: () => {
      toast({ title: 'Invoice Updated', description: 'The billing status has been updated successfully.' });
      queryClient.invalidateQueries({ queryKey: ['admin_invoices'] });
    }
  });

  const handleUpdateStatus = (id, status) => {
    updateStatusMutation.mutate({ id, status });
  };

  const filteredInvoices = invoices.filter(inv => {
    const firmName = getCompanyName(inv.company_id).toLowerCase();
    return firmName.includes(searchTerm.toLowerCase()) || inv.status?.toLowerCase().includes(searchTerm.toLowerCase());
  }).sort((a, b) => new Date(b.created_at || Date.now()) - new Date(a.created_at || Date.now()));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader 
        title="Revenue & Billing Management" 
        subtitle="Global platform financial controls and invoice management." 
        action={
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> {t("create_manual_bill", "Create Manual Bill")}
          </Button>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 border border-primary/20 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-primary/80 uppercase tracking-wider mb-1">{t("total_paid_mrr", "Total Paid MRR")}</p>
                <h3 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">{formatCurrency(totalRevenue, 'USD')}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-slate-500 dark:text-slate-400 font-medium">{t("all_time_collected_revenue", "All-time collected revenue")}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-amber-50/50 dark:from-card dark:to-amber-950/20 border border-amber-200/50 dark:border-amber-900/50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-amber-600/80 uppercase tracking-wider mb-1">{t("pending_revenue", "Pending Revenue")}</p>
                <h3 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">{formatCurrency(pendingRevenue, 'USD')}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-slate-500 dark:text-slate-400 font-medium">{t("awaiting_payment_clearing", "Awaiting payment clearing")}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-rose-50/50 dark:from-card dark:to-rose-950/20 border border-rose-200/50 dark:border-rose-900/50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-rose-500 uppercase tracking-wider mb-1">{t("overdue_failed", "Overdue / Failed")}</p>
                <h3 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">{failedCharges}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-rose-600 dark:text-rose-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-slate-500 dark:text-slate-400 font-medium">{t("action_required_on_accounts", "Action required on accounts")}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 shadow-sm rounded-2xl overflow-hidden bg-transparent border-0 md:border md:bg-card md:border-primary/20">
        <CardHeader className="bg-transparent md:bg-slate-50 dark:md:bg-slate-800/50 border-b-0 md:border-b border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-0 md:px-6">
          <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">{t("global_invoices", "Global Invoices")}</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search firm or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 h-10 w-full border border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-4 md:space-y-0 p-0 md:p-0">
            {loadingInvoices ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400 font-medium bg-card md:bg-transparent rounded-2xl border border-primary/20 md:border-0">
                {t("no_invoices_found", "No invoices found.")}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:block gap-4">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-primary/20">
                      <tr>
                        <th className="px-6 py-4">{t("firm_company", "Firm / Company")}</th>
                        <th className="px-6 py-4">{t("amount", "Amount")}</th>
                        <th className="px-6 py-4">{t("date_created", "Date Created")}</th>
                        <th className="px-6 py-4">{t("status", "Status")}</th>
                        <th className="px-6 py-4 text-right">{t("actions", "Actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {filteredInvoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50/50 dark:bg-transparent transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{getCompanyName(inv.company_id)}</td>
                          <td className="px-6 py-4 font-bold">{formatCurrency(inv.total_amount || inv.amount || 0, 'USD')}</td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{inv.created_at ? format(new Date(inv.created_at), 'MMM dd, yyyy') : 'N/A'}</td>
                          <td className="px-6 py-4">
                            <Badge className={`uppercase text-[10px] font-bold ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : inv.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'} border-none`}>
                              {inv.status || 'unknown'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border border-primary/20 rounded-lg bg-card">
                                  <span className="sr-only">{t("open_menu", "Open menu")}</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 rounded-xl border-primary/20">
                                <DropdownMenuLabel>{t("manage_invoice", "Manage Invoice")}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleUpdateStatus(inv.id, 'paid')} className="text-emerald-600 dark:text-emerald-400 font-medium cursor-pointer">
                                  <CheckCircle className="mr-2 h-4 w-4" /> {t("mark_as_paid", "Mark as Paid")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(inv.id, 'pending')} className="text-amber-600 dark:text-amber-400 font-medium cursor-pointer">
                                  <Activity className="mr-2 h-4 w-4" /> {t("mark_as_pending", "Mark as Pending")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(inv.id, 'overdue')} className="text-rose-600 dark:text-rose-400 font-medium cursor-pointer">
                                  <Activity className="mr-2 h-4 w-4" /> {t("mark_as_overdue", "Mark as Overdue")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {filteredInvoices.map(inv => (
                    <div key={inv.id} className="bg-card rounded-2xl border border-primary/20 p-5 shadow-sm flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{getCompanyName(inv.company_id)}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{inv.created_at ? format(new Date(inv.created_at), 'MMM dd, yyyy') : 'N/A'}</p>
                        </div>
                        <Badge className={`uppercase text-[10px] font-bold ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : inv.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'} border-none`}>
                          {inv.status || 'unknown'}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-end mt-2 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Amount</p>
                          <p className="font-extrabold text-lg text-slate-900 dark:text-slate-100">{formatCurrency(inv.total_amount || inv.amount || 0, 'USD')}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 px-3 rounded-lg border-primary/20 text-xs">
                              Manage <MoreVertical className="h-3.5 w-3.5 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl border-primary/20">
                            <DropdownMenuLabel>{t("manage_invoice", "Manage Invoice")}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleUpdateStatus(inv.id, 'paid')} className="text-emerald-600 dark:text-emerald-400 font-medium cursor-pointer">
                              <CheckCircle className="mr-2 h-4 w-4" /> {t("mark_as_paid", "Mark as Paid")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(inv.id, 'pending')} className="text-amber-600 dark:text-amber-400 font-medium cursor-pointer">
                              <Activity className="mr-2 h-4 w-4" /> {t("mark_as_pending", "Mark as Pending")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(inv.id, 'overdue')} className="text-rose-600 dark:text-rose-400 font-medium cursor-pointer">
                              <Activity className="mr-2 h-4 w-4" /> {t("mark_as_overdue", "Mark as Overdue")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
