import { useTranslation } from "react-i18next";
import { useState, useEffect } from 'react';
import { Search, Plus, CheckCircle2, XCircle, Trash2, Receipt, DollarSign, ExternalLink, CalendarDays, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useCompanyId } from "@/hooks/useCompanyId";
import { usePowerSync } from '@powersync/react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

const STATUS_STYLES = {
  'Approved': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  'Rejected': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  'Pending': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
};

export default function Expenses() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [expenses, setExpenses] = useState([]);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    category: 'Travel',
    receipt_url: '',
    description: ''
  });

  useEffect(() => {
    let active = true;
    const fetchExpenses = async () => {
      setIsDbLoading(true);
      try {
        const res = await powerSync.execute('SELECT * FROM univ_erp_expenses WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
        if(active) setExpenses(res.rows._array || Array.from(res.rows));
      } catch(e) {
        console.error(e);
      }
      setIsDbLoading(false);
    };
    if (companyId) fetchExpenses();
    return () => { active = false; };
  }, [companyId, powerSync]);

  const handleCreateExpense = async () => {
    if (!formData.amount || !formData.category) return toast.error("Please enter amount and category");
    
    try {
      const newId = crypto.randomUUID();
      await powerSync.execute(`INSERT INTO univ_erp_expenses (id, created_at, company_id, employee_id, amount, currency, category, receipt_url, description, status) VALUES (?, NOW(), ?, 'current_user', ?, ?, ?, ?, ?, 'Pending')`, 
        [newId, companyId, parseFloat(formData.amount), formData.currency, formData.category, formData.receipt_url, formData.description]
      );
      toast.success('Expense submitted successfully!');
      setShowModal(false);
      setFormData({ amount: '', currency: 'USD', category: 'Travel', receipt_url: '', description: ''});
      
      const res = await powerSync.execute('SELECT * FROM univ_erp_expenses WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
      setExpenses(res.rows._array || Array.from(res.rows));
    } catch (err) {
      toast.error('Failed: ' + err.message);
    }
  };

  const openAdd = () => {
    setFormData({ amount: '', currency: 'USD', category: 'Travel', receipt_url: '', description: ''});
    setShowModal(true);
  };

  const handleUpdateStatus = async (expense, newStatus) => {
    try {
      await powerSync.execute(`UPDATE univ_erp_expenses SET status=? WHERE id=?`, [newStatus, expense.id]);
      toast.success(`Expense ${newStatus.toLowerCase()}`);
      setExpenses(expenses.map(e => e.id === expense.id ? { ...e, status: newStatus } : e));
    } catch (err) {
      toast.error('Failed to update status: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await powerSync.execute(`DELETE FROM univ_erp_expenses WHERE id=?`, [deleteTargetId]);
      toast.success('Expense removed!');
      setExpenses(expenses.filter(e => e.id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (err) {
      toast.error('Failed to remove: ' + err.message);
    }
  };

  const filtered = expenses.filter(e => 
    e.description?.toLowerCase().includes(search.toLowerCase()) || 
    e.category?.toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = expenses.filter(e => e.status === 'Approved').reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
  const pendingCount = expenses.filter(e => e.status === 'Pending').length;

  return (
    <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-card/50 h-full p-4 lg:p-8 font-dmsans">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{t("expenses", "Expenses")}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t("manage_expense_reports", "Review and approve employee expense reports.")}</p>
          </div>
          <Button onClick={openAdd} className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm">
            <Plus className="w-4 h-4" /> {t("new_expense", "New Expense")}
          </Button>
        </div>

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Approved', value: `$${totalAmount.toLocaleString()}`, icon: DollarSign, gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Pending Review', value: pendingCount, icon: Clock, gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { label: 'Receipts Submitted', value: expenses.filter(e => e.receipt_url).length, icon: Receipt, gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          ].map(({ label, value, icon: Icon, gradient, bg }) => (
            <div key={label} className={`${bg} rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 p-5 flex items-center gap-4 hover:shadow-md transition-all duration-200`}>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Search ── */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white dark:bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8" />
        </div>

        {/* ── Expenses Grid ── */}
        {isDbLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading expenses...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground bg-white dark:bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8">
            <Receipt className="w-14 h-14 mx-auto mb-3 opacity-20 text-primary" />
            <p className="font-semibold text-lg text-foreground">{t("no_expenses", "No expenses found")}</p>
            <p className="text-sm mt-1">{t("add_expense_prompt", "Submit a new expense report to get started.")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(expense => {
              const statusStyle = STATUS_STYLES[expense.status] || STATUS_STYLES['Pending'];
              
              return (
                <div key={expense.id} className="group bg-white dark:bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
                  
                  {/* Card Header */}
                  <div className="p-5 border-b border-border/50">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {expense.category}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem className="text-red-600" onClick={() => setDeleteTargetId(expense.id)}>
                            Delete Expense
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <h3 className="font-bold text-foreground text-lg mb-1 leading-tight line-clamp-2" title={expense.description}>{expense.description || 'No description provided'}</h3>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {new Date(expense.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Body & Actions */}
                  <div className="p-5 flex-1 flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="flex justify-between items-center bg-white dark:bg-card p-3 rounded-xl border border-border/50 shadow-sm">
                      <span className="text-sm font-semibold text-muted-foreground">Amount</span>
                      <span className="text-lg font-bold text-foreground">{expense.currency} {parseFloat(expense.amount).toLocaleString()}</span>
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Status</p>
                      <select
                        value={expense.status}
                        onChange={e => handleUpdateStatus(expense, e.target.value)}
                        className={`w-full appearance-none px-3 py-2 rounded-xl text-xs font-bold cursor-pointer border-none outline-none focus:ring-2 focus:ring-primary/20 ${statusStyle}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    {expense.receipt_url && (
                      <a href={expense.receipt_url} target="_blank" rel="noreferrer" 
                        className="mt-auto flex items-center justify-center gap-2 w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 rounded-xl text-xs font-semibold transition-colors">
                        <Receipt className="w-3.5 h-3.5" /> View Receipt <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-card rounded-2xl w-full max-w-md shadow-2xl border-[0.5px] border-black/9 dark:border-white/8">
            <div className="p-6 border-b border-border/50">
              <h2 className="text-lg font-bold text-foreground">New Expense Report</h2>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</label>
                  <Input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="mt-1" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Currency</label>
                  <select className="mt-1 w-full rounded-xl border-[0.5px] border-black/9 dark:border-white/8 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</label>
                <select className="mt-1 w-full rounded-xl border-[0.5px] border-black/9 dark:border-white/8 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="Travel">Travel</option>
                  <option value="Meals">Meals</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Software">Software</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
                <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1" placeholder="What was this for?" />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Receipt URL (Optional)</label>
                <Input type="url" value={formData.receipt_url} onChange={e => setFormData({...formData, receipt_url: e.target.value})} className="mt-1" placeholder="https://..." />
              </div>
            </div>
            
            <div className="flex gap-3 p-6 border-t border-border/50">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl" onClick={handleCreateExpense}>Submit</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message="Are you sure you want to completely remove this expense record?"
      />
    </div>
  );
}
