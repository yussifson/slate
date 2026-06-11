const fs = require('fs');
const path = require('path');

const components = [
  { id: 'agentcommission', name: 'AgentCommission', table: 'univ_agentcommissions', icon: 'Percent', title: 'Agent Commissions',
    fields: [
      { name: 'agent_name', label: 'Agent Name', type: 'text' },
      { name: 'deal_id', label: 'Deal ID', type: 'text' },
      { name: 'commission_amount', label: 'Commission Amount', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Paid'] }
    ]
  },
  { id: 'hoa', name: 'Hoa', table: 'univ_hoas', icon: 'Home', title: 'HOA Management',
    fields: [
      { name: 'community_name', label: 'Community Name', type: 'text' },
      { name: 'resident_name', label: 'Resident Name', type: 'text' },
      { name: 'unit_number', label: 'Unit Number', type: 'text' },
      { name: 'fee_amount', label: 'Fee Amount', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
    ]
  },
  { id: 'utilitybill', name: 'UtilityBill', table: 'univ_utilitybills', icon: 'Zap', title: 'Utility Bills',
    fields: [
      { name: 'provider_name', label: 'Provider Name', type: 'text' },
      { name: 'account_number', label: 'Account Number', type: 'text' },
      { name: 'billing_period', label: 'Billing Period', type: 'text' },
      { name: 'amount_due', label: 'Amount Due', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['Unpaid', 'Paid'] }
    ]
  },
  { id: 'productcatalog', name: 'ProductCatalog', table: 'univ_productcatalogs', icon: 'Package', title: 'Product Catalog',
    fields: [
      { name: 'product_name', label: 'Product Name', type: 'text' },
      { name: 'sku', label: 'SKU', type: 'text' },
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'price', label: 'Price', type: 'number' },
      { name: 'stock_quantity', label: 'Stock Quantity', type: 'number' }
    ]
  },
  { id: 'orderregistry', name: 'OrderRegistry', table: 'univ_orderregistrys', icon: 'ShoppingCart', title: 'Order Registry',
    fields: [
      { name: 'order_number', label: 'Order Number', type: 'text' },
      { name: 'customer_name', label: 'Customer Name', type: 'text' },
      { name: 'total_amount', label: 'Total Amount', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Shipped', 'Delivered'] }
    ]
  },
  { id: 'discount', name: 'Discount', table: 'univ_discounts', icon: 'Tag', title: 'Discounts',
    fields: [
      { name: 'discount_code', label: 'Discount Code', type: 'text' },
      { name: 'description', label: 'Description', type: 'text' },
      { name: 'discount_percent', label: 'Discount Percent', type: 'number' },
      { name: 'valid_until', label: 'Valid Until', type: 'date' }
    ]
  },
  { id: 'customerreview', name: 'CustomerReview', table: 'univ_customerreviews', icon: 'Star', title: 'Customer Reviews',
    fields: [
      { name: 'customer_name', label: 'Customer Name', type: 'text' },
      { name: 'product_id', label: 'Product ID', type: 'text' },
      { name: 'rating', label: 'Rating (1-5)', type: 'number' },
      { name: 'review_text', label: 'Review Text', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Approved'] }
    ]
  },
  { id: 'supplierdirectory', name: 'SupplierDirectory', table: 'univ_supplierdirectorys', icon: 'Truck', title: 'Supplier Directory',
    fields: [
      { name: 'supplier_name', label: 'Supplier Name', type: 'text' },
      { name: 'contact_person', label: 'Contact Person', type: 'text' },
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
    ]
  },
  { id: 'returnrefund', name: 'ReturnRefund', table: 'univ_returnrefunds', icon: 'RefreshCw', title: 'Returns & Refunds',
    fields: [
      { name: 'order_number', label: 'Order Number', type: 'text' },
      { name: 'customer_name', label: 'Customer Name', type: 'text' },
      { name: 'reason', label: 'Reason', type: 'text' },
      { name: 'refund_amount', label: 'Refund Amount', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Processed'] }
    ]
  },
  { id: 'giftcard', name: 'GiftCard', table: 'univ_giftcards', icon: 'Gift', title: 'Gift Cards',
    fields: [
      { name: 'card_code', label: 'Card Code', type: 'text' },
      { name: 'purchaser_name', label: 'Purchaser Name', type: 'text' },
      { name: 'initial_balance', label: 'Initial Balance', type: 'number' },
      { name: 'current_balance', label: 'Current Balance', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Redeemed'] }
    ]
  },
  { id: 'wishlist', name: 'Wishlist', table: 'univ_wishlists', icon: 'Heart', title: 'Wishlists',
    fields: [
      { name: 'customer_name', label: 'Customer Name', type: 'text' },
      { name: 'product_name', label: 'Product Name', type: 'text' },
      { name: 'added_date', label: 'Added Date', type: 'date' },
      { name: 'notes', label: 'Notes', type: 'text' }
    ]
  },
  { id: 'loyaltypoint', name: 'LoyaltyPoint', table: 'univ_loyaltypoints', icon: 'Award', title: 'Loyalty Points',
    fields: [
      { name: 'customer_name', label: 'Customer Name', type: 'text' },
      { name: 'points_balance', label: 'Points Balance', type: 'number' },
      { name: 'tier_level', label: 'Tier Level', type: 'text' },
      { name: 'last_activity_date', label: 'Last Activity Date', type: 'date' }
    ]
  },
  { id: 'generalledger', name: 'GeneralLedger', table: 'univ_generalledgers', icon: 'BookOpen', title: 'General Ledger',
    fields: [
      { name: 'account_name', label: 'Account Name', type: 'text' },
      { name: 'account_type', label: 'Account Type', type: 'text' },
      { name: 'debit_amount', label: 'Debit Amount', type: 'number' },
      { name: 'credit_amount', label: 'Credit Amount', type: 'number' },
      { name: 'entry_date', label: 'Entry Date', type: 'date' }
    ]
  },
  { id: 'expensereport', name: 'ExpenseReport', table: 'univ_expensereports', icon: 'Receipt', title: 'Expense Reports',
    fields: [
      { name: 'employee_name', label: 'Employee Name', type: 'text' },
      { name: 'expense_category', label: 'Expense Category', type: 'text' },
      { name: 'amount', label: 'Amount', type: 'number' },
      { name: 'receipt_url', label: 'Receipt URL', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Submitted', 'Approved'] }
    ]
  },
  { id: 'taxfiling', name: 'TaxFiling', table: 'univ_taxfilings', icon: 'FileText', title: 'Tax Filings',
    fields: [
      { name: 'tax_year', label: 'Tax Year', type: 'text' },
      { name: 'jurisdiction', label: 'Jurisdiction', type: 'text' },
      { name: 'tax_type', label: 'Tax Type', type: 'text' },
      { name: 'amount_paid', label: 'Amount Paid', type: 'number' },
      { name: 'filing_date', label: 'Filing Date', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Filed'] }
    ]
  },
  { id: 'audittrail', name: 'AuditTrail', table: 'univ_audittrails', icon: 'ShieldCheck', title: 'Audit Trail',
    fields: [
      { name: 'user_name', label: 'User Name', type: 'text' },
      { name: 'action_type', label: 'Action Type', type: 'text' },
      { name: 'resource_name', label: 'Resource Name', type: 'text' },
      { name: 'ip_address', label: 'IP Address', type: 'text' },
      { name: 'timestamp', label: 'Timestamp', type: 'date' }
    ]
  }
];

const template = (comp) => {
  const emptyForm = {};
  comp.fields.forEach(f => {
    emptyForm[f.name] = f.type === 'number' ? 0 : f.type === 'select' ? f.options[0] : '';
  });

  const imports = `import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { ${comp.icon}, Plus, Search, Trash2, Edit2, Loader2, XCircle, LayoutGrid, List } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';`;

  const fieldsConfig = JSON.stringify(comp.fields);

  return \`${imports}

const EMPTY_FORM = \${JSON.stringify(emptyForm)};

export default function Univ\${comp.name}() {
  const companyId = useCompanyId();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fields = \${fieldsConfig};

  useEffect(() => {
    if (companyId) {
      fetchRecords();
      const channel = supabase.channel('table_changes_\${comp.table}')
        .on('postgres_changes', { event: '*', schema: 'public', table: '\${comp.table}', filter: \\\`company_id=eq.\${companyId}\\\` }, fetchRecords)
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('\${comp.table}').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setRecords(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, company_id: companyId };
      // Ensure numbers are cast correctly
      fields.forEach(f => {
        if (f.type === 'number') payload[f.name] = Number(payload[f.name]) || 0;
      });

      if (editingId) {
        const { error } = await supabase.from('\${comp.table}').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Record updated!');
      } else {
        const { error } = await supabase.from('\${comp.table}').insert(payload);
        if (error) throw error;
        toast.success('Record created!');
      }
      closeModal();
      fetchRecords();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save');
    }
  };

  const remove = async (id) => {
    try {
      const { error } = await supabase.from('\${comp.table}').delete().eq('id', id);
      if (error) throw error;
      toast.success('Deleted');
      fetchRecords();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to delete');
    }
  };

  const openModal = (r = null) => { setForm(r ? { ...r } : EMPTY_FORM); setEditingId(r?.id || null); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };

  const filtered = records.filter(r => {
    const val = Object.values(r).join(' ').toLowerCase();
    return val.includes(search.toLowerCase());
  });

  return (
    <div className="h-full flex flex-col gap-6 w-full bg-background p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2"><${comp.icon} className="w-7 h-7 text-primary" /> \${comp.title}</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Manage and track \${comp.title.toLowerCase()}.</p>
        </div>
        <button onClick={() => openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"><Plus className="w-4 h-4" /> New Record</button>
      </div>

      <div className="flex gap-3 shrink-0">
        <div className="relative flex-1"><Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records..." className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm shadow-sm" /></div>
        <div className="flex bg-card border border-border rounded-xl p-1 shadow-sm gap-1">
          <button onClick={() => setViewMode('list')} className={\\\`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 \${viewMode === 'list' ? 'bg-primary text-white' : 'text-muted-foreground'}\\\`}><List className="w-4 h-4" />List</button>
          <button onClick={() => setViewMode('grid')} className={\\\`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 \${viewMode === 'grid' ? 'bg-primary text-white' : 'text-muted-foreground'}\\\`}><LayoutGrid className="w-4 h-4" />Grid</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto min-h-0 custom-scrollbar">
        {loading ? <div className="flex h-40 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
            {filtered.map(r => (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={r.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-base text-foreground truncate pr-2">{r[fields[0].name] || 'Unnamed'}</h3>
                </div>
                <div className="flex flex-col gap-1.5 mt-2">
                  {fields.slice(1, 4).map(f => (
                    <div key={f.name} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{f.label}:</span>
                      <span className="font-medium text-foreground truncate max-w-[120px]">{r[f.name]}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-1 mt-auto pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(r)} className="p-1.5 bg-muted rounded-md text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(r.id)} className="p-1.5 bg-red-50 rounded-md text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed border-border rounded-2xl"><${comp.icon} className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" /><p className="font-medium">No records found.</p></div>}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  {fields.slice(0,5).map(f => <th key={f.name} className="p-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{f.label}</th>)}
                  <th className="p-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors group">
                    {fields.slice(0,5).map(f => (
                      <td key={f.name} className="p-4 font-medium text-foreground truncate max-w-[150px]">
                        {f.type === 'select' ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase border rounded-md bg-muted text-muted-foreground">{r[f.name]}</span>
                        ) : (
                          r[f.name]
                        )}
                      </td>
                    ))}
                    <td className="p-4 text-right">
                      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(r)} className="p-1.5 bg-muted rounded-md text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => remove(r.id)} className="p-1.5 bg-red-50 rounded-md text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={fields.length + 1} className="p-12 text-center text-muted-foreground">No records found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black flex items-center gap-2"><${comp.icon} className="w-5 h-5 text-primary"/> {editingId ? 'Edit Record' : 'New Record'}</h2>
              <button onClick={closeModal} className="p-2 bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"><XCircle className="w-5 h-5" /></button>
            </div>
            <form onSubmit={save} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map(f => (
                  <div key={f.name} className={f.type === 'textarea' ? 'col-span-full' : ''}>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">{f.label}</label>
                    {f.type === 'select' ? (
                      <select required value={form[f.name]} onChange={e => setForm({...form, [f.name]: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">
                        {f.options.map(o => <option key={o}>{o}</option>)}
                      </select>
                    ) : f.type === 'textarea' ? (
                      <textarea required rows="3" value={form[f.name]} onChange={e => setForm({...form, [f.name]: e.target.value})} className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm resize-none" />
                    ) : (
                      <input required type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} step={f.type === 'number' ? 'any' : undefined} value={form[f.name]} onChange={e => setForm({...form, [f.name]: f.type === 'number' ? e.target.value : e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-border">
                <button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors">Cancel</button>
                <button type="submit" className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors">{editingId ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
\`;
};

const main = () => {
  const targetDir = 'c:\\\\Users\\\\USER\\\\OneDrive\\\\Documents\\\\airflake\\\\src\\\\components\\\\universal';
  components.forEach(comp => {
    const filePath = path.join(targetDir, \`Univ\${comp.name}.jsx\`);
    fs.writeFileSync(filePath, template(comp));
    console.log(\`Generated \${filePath}\`);
  });
};

main();
