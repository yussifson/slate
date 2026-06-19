import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { ShoppingBag, Search, Plus, AlertTriangle, Pill, ArrowDownUp, Trash2, MoreVertical, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { generateText } from '@/lib/cloudflareAI';
import { Bot, Sparkles, Lock } from 'lucide-react';

export default function Pharmacy() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['univ_pharmacy', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        'SELECT * FROM univ_pharmacy WHERE company_id = ? ORDER BY drug_name ASC',
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [sortByStock, setSortByStock] = useState(false);
  const [viewDrug, setViewDrug] = useState(null);
  const [editingDrug, setEditingDrug] = useState(null);

  const { user } = useAuth();
  const isProOrAbove = user?.role === 'system_admin' || user?.subscription_plan === 'Pro' || user?.subscription_plan === 'Enterprise';

  const [isPredicting, setIsPredicting] = useState(false);
  const [aiPrediction, setAiPrediction] = useState('');

  const handleAIPredict = async (drugObj) => {
    if (!isProOrAbove) {
      toast.error('AI Advanced Restock Predictions are available on Pro or Enterprise plans.');
      return;
    }
    setIsPredicting(true);
    setAiPrediction('');
    try {
      const prompt = `You are an expert AI Pharmacist. Analyze the following drug inventory and provide a concise prediction on when to restock or if current stock is healthy based on typical hospital usage.
Drug: ${drugObj.drug_name}
Category: ${drugObj.category}
Current Stock: ${drugObj.stock_level}
Reorder Level: ${drugObj.reorder_level}
Return a 1-2 sentence recommendation.`;
      const response = await generateText(prompt);
      setAiPrediction(response);
    } catch (e) {
      toast.error('AI Prediction failed.');
    } finally {
      setIsPredicting(false);
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    category: 'Antibiotics',
    stock: 100,
    reorder: 20,
    price: 10,
    expiry: ''
  });

  const mutateRecord = useMutation({
    mutationFn: async (payload) => {
      if (payload.id) {
        await powerSync.execute(
          `UPDATE univ_pharmacy SET 
             drug_name = ?, category = ?, stock_level = ?, reorder_level = ?, unit_price = ?, expiry_date = ?, status = ?
           WHERE id = ?`,
          [payload.drug_name, payload.category, payload.stock_level, payload.reorder_level, payload.unit_price, payload.expiry_date, payload.status, payload.id]
        );
      } else {
        await powerSync.execute(
          `INSERT INTO univ_pharmacy (id, created_at, company_id, drug_name, category, stock_level, reorder_level, unit_price, expiry_date, status)
           VALUES (uuid(), datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?)`,
          [companyId, payload.drug_name, payload.category, payload.stock_level, payload.reorder_level, payload.unit_price, payload.expiry_date, payload.status]
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_pharmacy']);
      toast.success(editingDrug ? 'Medication updated!' : 'Medication added successfully!');
      setShowModal(false);
      setEditingDrug(null);
      setFormData({ name: '', category: 'Antibiotics', stock: 100, reorder: 20, price: 10, expiry: '' });
    },
    onError: (err) => toast.error('Failed to save medication: ' + err.message)
  });

  const deleteRecord = useMutation({
    mutationFn: async (id) => {
      await powerSync.execute('DELETE FROM univ_pharmacy WHERE id = ?', [id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_pharmacy']);
      toast.success('Medication deleted successfully!');
    },
    onError: (err) => toast.error('Failed to delete record: ' + err.message)
  });

  const handleSaveToDb = () => {
    if (!formData.name.trim()) return toast.error("Please enter medication name");

    const stock = parseInt(formData.stock) || 0;
    const reorder = parseInt(formData.reorder) || 0;

    mutateRecord.mutate({
      id: editingDrug?.id,
      drug_name: formData.name,
      category: formData.category,
      stock_level: stock,
      reorder_level: reorder,
      unit_price: parseFloat(formData.price) || 0,
      expiry_date: formData.expiry || new Date().toISOString().split('T')[0],
      status: stock <= reorder ? 'Low Stock' : 'In Stock'
    });
  };

  const handleDeleteFromDb = (id) => {
    if (window.confirm('Are you sure you want to delete this medication?')) {
      deleteRecord.mutate(id);
    }
  };

  let filtered = inventory.filter(d => 
    d.drug_name?.toLowerCase().includes(search.toLowerCase()) || 
    d.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (sortByStock) {
    filtered = [...filtered].sort((a, b) => a.stock_level - b.stock_level);
  }

  const openEdit = (drug) => {
    setEditingDrug(drug);
    setFormData({
      name: drug.drug_name || '',
      category: drug.category || 'Antibiotics',
      stock: drug.stock_level || 0,
      reorder: drug.reorder_level || 0,
      price: drug.unit_price || 0,
      expiry: drug.expiry_date || ''
    });
    setShowModal(true);
  };

  const lowStockCount = inventory.filter(d => d.stock_level <= d.reorder_level).length;

  if (isLoading) return <div className="flex justify-center p-8">Loading inventory...</div>;

  return (
    <div className="space-y-6" style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.06) 0%, rgba(255,255,255,0) 100%)", minHeight: "100vh" }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">Pharmacy Inventory</h1>
          <p className="text-sm text-[#71717a] mt-0.5">Manage drug stock, pricing, and reorder levels</p>
        </div>
        <Button onClick={() => { setEditingDrug(null); setFormData({ name: '', category: 'Antibiotics', stock: 100, reorder: 20, price: 10, expiry: '' }); setShowModal(true); }} className="gap-2 bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4" /> Add Medication
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border-[0.5px] border-primary/40 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-primary"><Pill className="w-6 h-6" /></div>
          <div><p className="text-3xl font-semibold tracking-[-0.02em]">{inventory.length}</p><p className="text-sm font-medium text-[#71717a]">Total Unique Drugs</p></div>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-primary/40 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600"><AlertTriangle className="w-6 h-6" /></div>
          <div><p className="text-3xl font-semibold text-red-600 tracking-[-0.02em]">{lowStockCount}</p><p className="text-sm font-medium text-[#71717a]">Low Stock Alerts</p></div>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-primary/40 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-primary"><ShoppingBag className="w-6 h-6" /></div>
          <div><p className="text-3xl font-semibold tracking-[-0.02em]">{inventory.filter(d => d.stock_level > d.reorder_level).length}</p><p className="text-sm font-medium text-[#71717a]">Well Stocked Drugs</p></div>
        </div>
      </div>

      <div className="bg-card rounded-xl border-[0.5px] border-primary/40 overflow-hidden">
        <div className="p-4 border-b border-primary/40 bg-muted/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
            <Input placeholder="Search medication or category..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
          <Button onClick={() => setSortByStock(!sortByStock)} variant="outline" className={`gap-2 bg-card text-foreground shrink-0 ${sortByStock ? 'border-primary text-primary' : ''}`}>
            <ArrowDownUp className="w-4 h-4"/> Sort by Stock Level
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card border-b border-primary/40">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase">Medication</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase">Category</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] uppercase">Stock Qty</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] uppercase">Price</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] uppercase">Expiry Date</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(drug => {
                const isLow = drug.stock_level <= drug.reorder_level;
                return (
                  <tr key={drug.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-card-foreground text-base">{drug.drug_name}</p>
                    </td>
                    <td className="px-6 py-4 text-[#71717a]">{drug.category}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-semibold px-3 py-1 rounded-lg ${isLow ? 'bg-red-100 text-red-700 border-[0.5px] border-red-200' : 'text-foreground bg-muted'}`}>
                        {(drug.stock_level || 0).toLocaleString()} units
                      </span>
                      {isLow && <p className="text-[10px] text-red-500 font-semibold uppercase mt-1">Reorder: {drug.reorder_level}</p>}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-foreground">${(drug.unit_price || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-center text-[#71717a]">{drug.expiry_date}</td>
                    <td className="px-6 py-4 text-right flex gap-2 justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewDrug(drug)}>View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(drug)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteFromDb(drug.id)} className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-[#71717a]">No medications found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold text-card-foreground">{editingDrug ? 'Edit Medication' : 'Add Medication to Inventory'}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Medication Name</label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value})} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Category</label>
                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-primary/40 bg-background px-3 py-2 text-sm">
                  <option>Antibiotics</option><option>Painkillers</option><option>Vitamins</option><option>Antimalarial</option><option>Syrup</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Initial Stock</label>
                  <Input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Reorder Level</label>
                  <Input type="number" value={formData.reorder} onChange={e => setFormData({ ...formData, reorder: e.target.value})} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Unit Price ($)</label>
                  <Input type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Expiry Date</label>
                  <Input type="date" value={formData.expiry} onChange={e => setFormData({ ...formData, expiry: e.target.value})} className="mt-1" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleSaveToDb} disabled={mutateRecord.isPending}>
                {mutateRecord.isPending ? 'Saving...' : 'Save Medication'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      <Sheet open={!!viewDrug} onOpenChange={(open) => {
        if (!open) {
          setViewDrug(null);
          setAiPrediction('');
        }
      }}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle>Medication Details</SheetTitle>
                <SheetDescription>Inventory tracking info</SheetDescription>
              </div>
              <Button size="sm" variant="outline" className="gap-2 bg-primary/5 text-primary border-primary/20 hover:bg-primary/10" onClick={() => handleAIPredict(viewDrug)} disabled={isPredicting}>
                {isPredicting ? <Sparkles className="w-4 h-4 animate-spin" /> : (!isProOrAbove ? <Lock className="w-4 h-4" /> : <Bot className="w-4 h-4" />)}
                {isPredicting ? 'Predicting...' : 'AI Forecast'}
              </Button>
            </div>
          </SheetHeader>
          {viewDrug && (
            <>
            <div className="mt-6 space-y-4">
              <div><h3 className="text-sm font-medium text-[#71717a]">Name</h3><p className="text-base font-semibold">{viewDrug.drug_name}</p></div>
              <div><h3 className="text-sm font-medium text-[#71717a]">Category</h3><p className="text-base">{viewDrug.category}</p></div>
              <div><h3 className="text-sm font-medium text-[#71717a]">Current Stock</h3><p className={`text-base font-semibold ${viewDrug.stock_level <= viewDrug.reorder_level ? 'text-red-600' : 'text-primary'}`}>{viewDrug.stock_level} units</p></div>
              <div><h3 className="text-sm font-medium text-[#71717a]">Reorder Level</h3><p className="text-base">{viewDrug.reorder_level} units</p></div>
              <div><h3 className="text-sm font-medium text-[#71717a]">Unit Price</h3><p className="text-base font-semibold">${viewDrug.unit_price}</p></div>
              <div><h3 className="text-sm font-medium text-[#71717a]">Expiry Date</h3><p className="text-base">{viewDrug.expiry_date}</p></div>
              <div><h3 className="text-sm font-medium text-[#71717a]">Status</h3><span className={`text-xs font-semibold px-2 py-1 rounded-md border ${viewDrug.stock_level <= viewDrug.reorder_level ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-primary border-primary/20'}`}>{viewDrug.stock_level <= viewDrug.reorder_level ? 'Low Stock' : 'In Stock'}</span></div>
            </div>
            
            {aiPrediction && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-semibold text-[#71717a] uppercase mb-2 flex items-center gap-2"><Bot className="w-4 h-4 text-primary"/> AI Forecast</h3>
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
                  <div className="text-sm font-medium text-foreground">
                    {aiPrediction}
                  </div>
                </div>
              </div>
            )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
