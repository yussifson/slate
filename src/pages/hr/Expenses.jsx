import { useTranslation } from "react-i18next";
import { useState, useEffect } from 'react';
import { Search, Plus, CheckCircle2, XCircle, Trash2, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useCompanyId } from "@/hooks/useCompanyId";
import { usePowerSync } from '@powersync/react';

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
      await powerSync.execute(`INSERT INTO univ_erp_expenses (id, created_at, company_id, employee_id, amount, currency, category, receipt_url, description, status) VALUES (gen_random_uuid(), NOW(), ?, 'current_user', ?, ?, ?, ?, ?, 'Pending')`, 
        [companyId, parseFloat(formData.amount), formData.currency, formData.category, formData.receipt_url, formData.description]
      );
      toast.success('Expense submitted successfully!');
      setShowModal(false);
      setFormData({ amount: '', currency: 'USD', category: 'Travel', receipt_url: '', description: ''});
      
      // Refresh list
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
      setDeleteTargetId(null);
      setExpenses(expenses.filter(e => e.id !== deleteTargetId));
    } catch (err) {
      toast.error('Failed to remove: ' + err.message);
    }
  };

  const filtered = expenses.filter(e => 
    e.description?.toLowerCase().includes(search.toLowerCase()) || 
    e.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 school-page-enter font-dmsans max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground tracking-tight">{t("expenses", "Expenses")}</h1>
          <p className="text-sm text-slate-500 mt-1">{t("manage_expense_reports", "Review and approve employee expense reports.")}</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-white gap-2">
          <Plus className="w-4 h-4" /> {t("new_expense", "New Expense")}
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        
        <div className="p-4 overflow-y-auto space-y-3">
          {isDbLoading ? (
            <div className="py-12 text-center text-slate-500">{t("loading_expenses", "Loading expenses...")}</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
              <p className="font-semibold text-lg text-slate-700 dark:text-slate-300">{t("no_expenses", "No expenses found")}</p>
              <p className="text-xs mt-1">{t("add_expense_prompt", "Submit a new expense report to get started.")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(expense => (
                <div key={expense.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md uppercase tracking-wider">{expense.category}</span>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mt-2 truncate max-w-[200px]" title={expense.description}>{expense.description || 'No description'}</h3>
                      <p className="text-xs text-slate-500 mt-1">{new Date(expense.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-slate-900 dark:text-slate-100">{expense.currency} {expense.amount}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mt-1 inline-block ${
                        expense.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        expense.status === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {expense.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/50 mt-auto">
                    {expense.receipt_url ? (
                      <a href={expense.receipt_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                        <Receipt className="w-3 h-3" /> View Receipt
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No receipt</span>
                    )}

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {expense.status === 'Pending' && (
                        <>
                          <Button onClick={() => handleUpdateStatus(expense, 'Approved')} size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full" title="Approve">
                            <CheckCircle2 className="w-4 h-4"/>
                          </Button>
                          <Button onClick={() => handleUpdateStatus(expense, 'Rejected')} size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full" title="Reject">
                            <XCircle className="w-4 h-4"/>
                          </Button>
                        </>
                      )}
                      <Button onClick={() => setDeleteTargetId(expense.id)} size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full ml-1" title="Delete">
                        <Trash2 className="w-4 h-4"/>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("submit_expense", "Submit Expense")}</h2>
            
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">{t("amount", "Amount")}</label>
                  <Input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">{t("currency", "Currency")}</label>
                  <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">{t("category", "Category")}</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="Travel">Travel</option>
                  <option value="Meals">Meals</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Training">Training</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">{t("description", "Description")}</label>
                <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Dinner with client..." className="mt-1" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">{t("receipt_url", "Receipt URL (Optional)")}</label>
                <Input value={formData.receipt_url} onChange={e => setFormData({...formData, receipt_url: e.target.value})} placeholder="https://..." className="mt-1" />
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-primary text-white" onClick={handleCreateExpense}>{t("submit", "Submit")}</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message="Are you sure you want to permanently delete this expense report?"
      />
    </div>
  );
}

