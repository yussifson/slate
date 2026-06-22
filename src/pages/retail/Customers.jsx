import { useTranslation} from "react-i18next";
import { useState, useEffect} from 'react';
import { Users, Search, Plus, Star, Trash2, MoreVertical, Eye, Edit, ShoppingCart, Bot } from 'lucide-react';
import { ViewModeToggle, RetailStatCard, CustomerGridCard} from '@/components/retail/RetailViewKit';
import { Button} from '@/components/ui/button';
import { Link, useNavigate} from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription} from '@/components/ui/sheet';

import { Input} from '@/components/ui/input';
import { toast} from 'react-hot-toast';
import { generateText } from '@/lib/cloudflareAI';
import ConfirmationModal from '@/components/ConfirmationModal';
import CSVImportModal from '@/components/shared/CSVImportModal';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { UploadCloud} from 'lucide-react';

const segmentColors = {
 VIP: 'bg-primary/15 text-primary border-primary/25',
 Regular: 'bg-slate-100 text-primary border-primary/20',
 New: 'bg-muted text-[#71717a] dark:text-gray-400 border-primary/40'};

export default function Customers() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const isProOrAbove = true; // Temporary bypass
  const { t} = useTranslation();
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [dbRecords, setDbRecords] = useState([]);
  const [isDbLoading, setIsDbLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchRecords = async () => {
      setIsDbLoading(true);
      try {
        const res = await powerSync.execute('SELECT * FROM univ_retail_customers WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
        if(active) setDbRecords(res.rows._array || Array.from(res.rows));
      } catch(e){}
      setIsDbLoading(false);
    };
    if (companyId) fetchRecords();
    return () => { active = false; };
  }, [companyId]);

 const customers = dbRecords.map(r => {
 const data = r;
 const totalSpent = parseFloat(data.total_spent) || 0;
 let segment = 'New';
 if (totalSpent > 1000) segment = 'VIP';
 else if (totalSpent > 200) segment = 'Regular';

 return {
 id: r.id,
 custId: data.cust_id || `CUST-${r.id?.slice(0, 4)}`,
 name: data.name || 'Unnamed',
 email: data.email || '',
 phone: data.phone || '',
 totalSpent,
 orders: parseInt(data.orders) || 0,
 segment,
 createdBy: 'System',
 createdAt: r.created_at || new Date().toISOString()
};
});

 const [search, setSearch] = useState('');
 const [showModal, setShowModal] = useState(false);
 const [showImportModal, setShowImportModal] = useState(false);
 const [deleteTargetId, setDeleteTargetId] = useState(null);
 const [selectedRecord, setSelectedRecord] = useState(null);
 const [isSheetOpen, setIsSheetOpen] = useState(false);
 const [editingId, setEditingId] = useState(null);
 const [viewMode, setViewMode] = useState('list');

 const [formData, setFormData] = useState({
 name: '',
 email: '',
 phone: '',
 totalSpent: '',
 orders: ''
});

 const openDetails = (cust) => {
 setSelectedRecord(cust);
 setIsSheetOpen(true);
};

 const openEdit = (cust) => {
 setEditingId(cust.id);
 setFormData({
 name: cust.name,
 email: cust.email,
 phone: cust.phone,
 totalSpent: cust.totalSpent,
 orders: cust.orders
});
 setShowModal(true);
};

 
  const handleAIInsight = async (cust) => {
    if (!isProOrAbove) {
      toast.error('AI Insights are available on Pro or Enterprise plans.');
      return;
    }
    setIsGenerating(true);
    setAiInsight('');
    try {
      const prompt = `You are a Retail Marketing AI. Provide a 2-sentence marketing insight for this customer:
Name: ${cust.name}
Total Spent: $${cust.totalSpent}
Orders: ${cust.orders}
Segment: ${cust.segment}
Suggest a targeted email or promotion idea.`;
      const response = await generateText(prompt);
      setAiInsight(response);
    } catch (e) {
      toast.error('AI Insight failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveCustomer = async () => {
  if (!formData.name.trim() || !formData.email.trim()) {
    return toast.error("Please enter a name and email");
  }

  const custId = editingId ? (customers.find(c => c.id === editingId)?.custId || `CUST-${Math.floor(100 + Math.random() * 900)}`) : `CUST-${Math.floor(100 + Math.random() * 900)}`;
  const totalSpent = parseFloat(formData.totalSpent) || 0;
  let segment = 'New';
  if (totalSpent > 1000) segment = 'VIP';
  else if (totalSpent > 200) segment = 'Regular';

  try {
    if (editingId) {
      await powerSync.execute(`UPDATE univ_retail_customers SET name=?, email=?, phone=?, total_spent=?, orders=?, segment=?, status=? WHERE id=?`, 
        [formData.name, formData.email, formData.phone, totalSpent, parseInt(formData.orders) || 0, segment, 'Active', editingId]
      );
      toast.success('Customer updated successfully!');
    } else {
      await powerSync.execute(`INSERT INTO univ_retail_customers (id, created_at, company_id, cust_id, name, email, phone, total_spent, orders, segment, status) VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`, 
        [crypto.randomUUID(), companyId, custId, formData.name, formData.email, formData.phone, totalSpent, parseInt(formData.orders) || 0, segment]
      );
      toast.success('Customer registered successfully!');
    }
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '', totalSpent: '', orders: '' });
    
    const res = await powerSync.execute('SELECT * FROM univ_retail_customers WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
    setDbRecords(res.rows._array || Array.from(res.rows));
  } catch (err) {
    toast.error('Failed to save customer: ' + err.message);
  }
};

  const handleDeleteCustomer = async () => {
  if (!deleteTargetId) return;
  try {
    await powerSync.execute(`DELETE FROM univ_retail_customers WHERE id=?`, [deleteTargetId]);
    toast.success('Customer removed successfully!');
    setDeleteTargetId(null);
    setDbRecords(dbRecords.filter(c => c.id !== deleteTargetId));
  } catch (err) {
    toast.error('Failed to delete customer: ' + err.message);
  }
};

 const stats = {
 totalCount: customers.length,
 vipCount: customers.filter(c => c.segment === 'VIP').length
};

 const filtered = customers.filter(c => 
 c.name?.toLowerCase().includes((search || '').toLowerCase()) || 
 c.email?.toLowerCase().includes((search || '').toLowerCase())
 );

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("customers", "Customers")}</h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t("manage_customer_profiles_and_l", "Manage customer profiles and loyalty tiers")}</p>
 </div>
 <div className="flex gap-2">
 <Button onClick={() => setShowImportModal(true)} variant="outline" className="gap-2 text-primary border-primary hover:bg-slate-50">
 <UploadCloud className="w-4 h-4" /> {t("import_csv", "Import CSV")}
 </Button>
 <Button onClick={() => { setEditingId(null); setFormData({ name: '', email: '', phone: '', totalSpent: '', orders: ''}); setShowModal(true);}} className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
 <Plus className="w-4 h-4" /> {t("add_customer", "Add Customer")}
 </Button>
 </div>
 </div>

 <div className="flex items-center justify-end">
 <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <RetailStatCard label={t("total_customers", "Total Customers")} value={stats.totalCount} icon={Users} />
 <RetailStatCard label={t("vip_members", "VIP Members")} value={stats.vipCount} icon={Star} />
 </div>

 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/40 bg-muted/50">
 <div className="relative max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <Input placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />
 </div>
 </div>
 <div className="overflow-x-auto">
 {isDbLoading ? (
 <div className="py-12 text-center text-[#71717a] dark:text-gray-400">{t("loading_customers", "Loading customers...")}</div>
 ) : filtered.length === 0 ? (
 <div className="py-12 text-center text-[#71717a] dark:text-gray-400">
 <Users className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse" />
 <p className="font-semibold">{t("no_customers_registered", "No customers registered.")}</p>
 <p className="text-xs mt-1 tracking-[0.04em]">{t("add_your_first_retail_customer", "Add your first retail customer using the \"Add Customer\" button.")}</p>
 </div>
 ) : viewMode === 'grid' ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 p-6">
 {filtered.map(cust => (
 <CustomerGridCard
 key={cust.id}
 customer={cust}
 segmentColors={segmentColors}
 onView={() => openDetails(cust)}
 onEdit={() => openEdit(cust)}
 onDelete={() => setDeleteTargetId(cust.id)}
 />
 ))}
 </div>
 ) : (
 <table className="w-full text-sm">
 <thead className="bg-card border-b border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <tr>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("customer_name", "Customer Name")}</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("contact_info", "Contact Info")}</th>
 <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("total_orders", "Total Orders")}</th>
 <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("lifetime_value", "Lifetime Value")}</th>
 <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("segment", "Segment")}</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Added By</th>
 <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("actions", "Actions")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map(cust => {
 return (
 <tr key={cust.id} className="hover:bg-muted/50 transition-colors">
 <td className="px-6 py-4">
 <p className="font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{cust.name}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 mt-0.5 tracking-[0.04em]">{cust.custId}</p>
 </td>
 <td className="px-6 py-4 text-[#71717a] dark:text-gray-400 space-y-1">
 <p>{cust.email}</p>
 <p className="text-xs tracking-[0.04em]">{cust.phone}</p>
 </td>
 <td className="px-6 py-4 text-center">
 <Link to="/sales" className="text-primary hover:underline">{cust.orders}</Link>
 </td>
 <td className="px-6 py-4 text-right font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">${cust.totalSpent.toFixed(2)}</td>
 <td className="px-6 py-4 text-center">
 <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border ${segmentColors[cust.segment] || 'bg-muted'}`}>
 {cust.segment}
 </span>
 </td>
 <td className="px-6 py-4">
 <p className="text-sm font-medium text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{cust.createdBy}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{new Date(cust.createdAt).toLocaleDateString()}</p>
 </td>
 <td className="px-6 py-4 text-right">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" className="h-8 w-8 p-0">
 <span className="sr-only">{t("open_menu", "Open menu")}</span>
 <MoreVertical className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => openDetails(cust)}>
 <Eye className="mr-2 h-4 w-4" /> {t("view_details", "View Details")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => openEdit(cust)}>
 <Edit className="mr-2 h-4 w-4" /> {t("edit", "Edit")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setDeleteTargetId(cust.id)} className="text-red-600">
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
 <SheetContent className="overflow-y-auto">
 <SheetHeader>
 <SheetTitle>{t("customer_details", "Customer Details")}</SheetTitle>
 <SheetDescription>{t("view_detailed_information_for_", "View detailed information for this customer.")}</SheetDescription>
 </SheetHeader>
 {selectedRecord && (
 <div className="mt-6 space-y-4 text-sm">
 <div className="grid grid-cols-3 gap-4 border-b pb-4">
 <div className="col-span-1 font-semibold text-[#71717a] dark:text-gray-400">{t("id", "ID")}</div>
 <div className="col-span-2">{selectedRecord.custId}</div>
 </div>
 <div className="grid grid-cols-3 gap-4 border-b pb-4">
 <div className="col-span-1 font-semibold text-[#71717a] dark:text-gray-400">{t("name", "Name")}</div>
 <div className="col-span-2 font-medium">{selectedRecord.name}</div>
 </div>
 <div className="grid grid-cols-3 gap-4 border-b pb-4">
 <div className="col-span-1 font-semibold text-[#71717a] dark:text-gray-400">{t("email", "Email")}</div>
 <div className="col-span-2">{selectedRecord.email}</div>
 </div>
 <div className="grid grid-cols-3 gap-4 border-b pb-4">
 <div className="col-span-1 font-semibold text-[#71717a] dark:text-gray-400">{t("phone", "Phone")}</div>
 <div className="col-span-2">{selectedRecord.phone}</div>
 </div>
 <div className="grid grid-cols-3 gap-4 border-b pb-4">
 <div className="col-span-1 font-semibold text-[#71717a] dark:text-gray-400">{t("total_orders", "Total Orders")}</div>
 <div className="col-span-2"><Link to="/sales" className="text-primary hover:underline">{selectedRecord.orders}</Link></div>
 </div>
 <div className="grid grid-cols-3 gap-4 border-b pb-4">
 <div className="col-span-1 font-semibold text-[#71717a] dark:text-gray-400">{t("lifetime_spend", "Lifetime Spend")}</div>
 <div className="col-span-2">${selectedRecord.totalSpent.toFixed(2)}</div>
 </div>
 <div className="grid grid-cols-3 gap-4 border-b pb-4">
 <div className="col-span-1 font-semibold text-[#71717a] dark:text-gray-400">{t("segment", "Segment")}</div>
 <div className="col-span-2">
 <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border ${segmentColors[selectedRecord.segment] || 'bg-muted'}`}>
 {selectedRecord.segment}
 </span>
 </div>
 </div>
 <div className="grid grid-cols-3 gap-4">
 <div className="col-span-1 font-semibold text-[#71717a] dark:text-gray-400">Added By</div>
 <div className="col-span-2">{selectedRecord.createdBy} on {new Date(selectedRecord.createdAt).toLocaleDateString()}</div>
 </div>
 
          {aiInsight && (
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 mt-4">
              <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2"><Bot className="w-4 h-4"/> AI Customer Insight</h3>
              <p className="text-sm text-foreground font-medium">{aiInsight}</p>
            </div>
          )}
          <div className="flex gap-3 pt-6 mt-4 border-t border-primary/20">
    <Button 
      onClick={() => { setIsSheetOpen(false); openEdit(selectedRecord); }} 
      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
    >
      <Edit className="w-4 h-4 mr-2" /> {t("edit", "Edit")}
    </Button>
    <Button 
      variant="outline"
      onClick={() => navigate('/pos', { state: { customerId: selectedRecord.id } })} 
      className="flex-1 rounded-xl border-orange-500 text-orange-500 hover:bg-orange-50 font-semibold"
    >
      <ShoppingCart className="w-4 h-4 mr-2" /> {t("put_order", "Put Order")}
    </Button>
  </div>
 </div>
 )}
 </SheetContent>
 </Sheet>
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"><Plus className="w-5 h-5 text-orange-600"/> {editingId ? 'Edit Customer' : 'Add Customer'}</h2>
 <div className="space-y-3">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("customer_name", "Customer Name")}</label>
 <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value})} className="mt-1" placeholder="e.g. Jane Doe" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("email_address", "Email Address")}</label>
 <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value})} className="mt-1" placeholder="e.g. jane@example.com" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("phone_number", "Phone Number")}</label>
 <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value})} className="mt-1" placeholder="e.g. +1 555-0188" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("initial_lifetime_spend", "Initial Lifetime Spend ($)")}</label>
 <Input type="number" value={formData.totalSpent} onChange={e => setFormData({ ...formData, totalSpent: e.target.value})} className="mt-1" placeholder="e.g. 150.00" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("initial_orders_count", "Initial Orders Count")}</label>
 <Input type="number" value={formData.orders} onChange={e => setFormData({ ...formData, orders: e.target.value})} className="mt-1" placeholder="e.g. 2" />
 </div>
 </div>
 <div className="flex gap-3 pt-4">
 <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditingId(null);}}>{t("cancel", "Cancel")}</Button>
 <Button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white" onClick={handleSaveCustomer}>{editingId ? 'Save Changes' : 'Add Customer'}</Button>
 </div>
 </div>
 </div>
 )}
 <ConfirmationModal
 isOpen={deleteTargetId !== null}
 onClose={() => setDeleteTargetId(null)}
 onConfirm={handleDeleteCustomer}
 title="Delete Customer Profile"
 message="Are you sure you want to delete this customer profile? This will remove all loyalty and spend metrics permanently."
 />
 <CSVImportModal 
 isOpen={showImportModal} 
 onClose={() => setShowImportModal(false)} 
 recordType="customer" 
 />
 </div>
 );
}


