import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { ShoppingBag, Search, Plus, AlertTriangle, Pill, ArrowDownUp, Trash2, MoreVertical, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';

export default function Pharmacy() {
  const { t } = useTranslation();
  // Supabase Real-time Sync Hooks
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('inventory');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  // Map database records
  const inventory = dbRecords.map(r => ({ id: r.id, status: r.status || 'Active', ...r.data }));

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [sortByStock, setSortByStock] = useState(false);
  const [viewDrug, setViewDrug] = useState(null);
  const [editingDrug, setEditingDrug] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Antibiotics',
    stock: 100,
    reorder: 20,
    price: 10,
    expiry: ''
  });

  // Generic Save Handler for real DB persistence
  const handleSaveToDb = () => {
    if (!formData.name.trim()) return toast.error("Please enter medication name");

    const drugId = editingDrug ? editingDrug.drugId : `DRG-${Math.floor(100 + Math.random() * 900)}`;

    const payload = {
      drugId,
      name: formData.name,
      category: formData.category,
      stock: parseInt(formData.stock) || 0,
      reorder: parseInt(formData.reorder) || 0,
      price: parseFloat(formData.price) || 0,
      expiry: formData.expiry || new Date().toISOString().split('T')[0]
    };

    mutateRecord.mutate({
      id: editingDrug?.id,
      recordType: 'inventory',
      payload,
      status: parseInt(formData.stock) <= parseInt(formData.reorder) ? 'Low Stock' : 'In Stock',
      searchText: `${formData.name} ${formData.category} ${drugId}`
    }, {
      onSuccess: () => {
        toast.success(editingDrug ? 'Medication updated!' : 'Medication added to inventory successfully!');
        setShowModal(false);
        setEditingDrug(null);
        setFormData({
          name: '',
          category: 'Antibiotics',
          stock: 100,
          reorder: 20,
          price: 10,
          expiry: ''
        });
      },
      onError: (err) => {
        toast.error('Failed to save medication: ' + err.message);
      }
    });
  };

  // Generic Delete Handler for real DB persistence
  const handleDeleteFromDb = (id) => {
    if (window.confirm('Are you sure you want to delete this medication from inventory?')) {
      deleteRecord.mutate({ id, recordType: 'inventory' }, {
        onSuccess: () => {
          toast.success('Medication deleted successfully!');
        },
        onError: (err) => {
          toast.error('Failed to delete record: ' + err.message);
        }
      });
    }
  };

  let filtered = inventory.filter(d => 
    d.name?.toLowerCase().includes(search.toLowerCase()) || 
    d.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (sortByStock) {
    filtered = [...filtered].sort((a, b) => a.stock - b.stock);
  }

  const openEdit = (drug) => {
    setEditingDrug(drug);
    setFormData({
      name: drug.name || '',
      category: drug.category || 'Antibiotics',
      stock: drug.stock || 0,
      reorder: drug.reorder || 0,
      price: drug.price || 0,
      expiry: drug.expiry || ''
    });
    setShowModal(true);
  };

  const lowStockCount = inventory.filter(d => d.stock <= d.reorder).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">{t("pharmacy_inventory", "Pharmacy Inventory")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t(
            "manage_drug_stock_pricing_and_",
            "Manage drug stock, pricing, and reorder levels"
          )}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" /> {t("add_medication", "Add Medication")}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Pill className="w-6 h-6" /></div>
          <div><p className="text-3xl font-bold text-card-foreground">{inventory.length}</p><p className="text-sm font-medium text-muted-foreground">{t("total_unique_drugs", "Total Unique Drugs")}</p></div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600"><AlertTriangle className="w-6 h-6" /></div>
          <div><p className="text-3xl font-bold text-red-600">{lowStockCount}</p><p className="text-sm font-medium text-muted-foreground">{t("low_stock_alerts", "Low Stock Alerts")}</p></div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600"><ShoppingBag className="w-6 h-6" /></div>
          <div><p className="text-3xl font-bold text-card-foreground">{inventory.filter(d => d.stock > d.reorder).length}</p><p className="text-sm font-medium text-muted-foreground">{t("well_stocked_drugs", "Well Stocked Drugs")}</p></div>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search medication or category..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
          <Button onClick={() => setSortByStock(!sortByStock)} variant="outline" className={`gap-2 bg-card text-foreground shrink-0 ${sortByStock ? 'border-blue-500 text-blue-600' : ''}`}>
            <ArrowDownUp className="w-4 h-4"/> {t("sort_by_stock_level", "Sort by Stock Level")}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("drug_code_name", "Drug Code & Name")}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("category", "Category")}</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">{t("stock_qty", "Stock Qty")}</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">{t("price", "Price")}</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">{t("expiry_date", "Expiry Date")}</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">{t("action", "Action")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(drug => {
                const isLow = drug.stock <= drug.reorder;
                return (
                  <tr key={drug.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-card-foreground text-base">{drug.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{drug.drugId}</p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{drug.category}</td>
                    <td className="px-6 py-4 text-center">
                       <span className={`font-bold px-3 py-1 rounded-md ${isLow ? 'bg-red-100 text-red-700 border border-red-200' : 'text-foreground bg-muted'}`}>
                         {(drug.stock || 0).toLocaleString()} {t("units", "units")}
                       </span>
                       {isLow && <p className="text-[10px] text-red-500 font-bold uppercase mt-1">{t("reorder", "Reorder:")} {drug.reorder}</p>}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-foreground">${(drug.price || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-center text-muted-foreground">{drug.expiry}</td>
                    <td className="px-6 py-4 text-right flex gap-2 justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewDrug(drug)}>
                            {t("view_details", "View Details")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(drug)}>
                            {t("edit", "Edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteFromDb(drug.id)} className="text-red-600">
                            {t("delete", "Delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Pill className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>{t(
                "no_medications_found_click_add",
                "No medications found. Click \"Add Medication\" to populate stock."
              )}</p>
            </div>
          )}
        </div>
      </div>
      {showModal && (
       <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
         <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
           <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2"><Pill className="w-5 h-5 text-blue-600"/> {t("add_new_medication", "Add New Medication")}</h2>
           <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("drug_name_strength", "Drug Name & Strength")}</label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1" placeholder="e.g. Paracetamol 500mg" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("category", "Category")}</label>
                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>{t("antibiotics", "Antibiotics")}</option>
                  <option>{t("analgesics", "Analgesics")}</option>
                  <option>{t("antihypertensives", "Antihypertensives")}</option>
                  <option>{t("antidiabetics", "Antidiabetics")}</option>
                  <option>{t("vitamins_supplements", "Vitamins / Supplements")}</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("initial_stock_qty", "Initial Stock Qty")}</label>
                <Input value={formData.stock} onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} className="mt-1" type="number" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("reorder_alert_level", "Reorder Alert Level")}</label>
                <Input value={formData.reorder} onChange={e => setFormData({ ...formData, reorder: parseInt(e.target.value) || 0 })} className="mt-1" type="number" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("unit_price", "Unit Price ($)")}</label>
                <Input value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} className="mt-1" type="number" step="0.01" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("expiry_date", "Expiry Date")}</label>
                <Input value={formData.expiry} onChange={e => setFormData({ ...formData, expiry: e.target.value })} className="mt-1" type="date" />
              </div>
           </div>
           <div className="flex gap-3 pt-4">
             <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditingDrug(null); }}>{t("cancel", "Cancel")}</Button>
             <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveToDb}>{t("save_medication", "Save Medication")}</Button>
           </div>
         </div>
       </div>
     )}
      <Sheet open={!!viewDrug} onOpenChange={(open) => !open && setViewDrug(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("medication_details", "Medication Details")}</SheetTitle>
            <SheetDescription>{t(
              "view_complete_drug_information",
              "View complete drug information and stock levels"
            )}</SheetDescription>
          </SheetHeader>
          {viewDrug && (
            <div className="mt-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">{t("drug_code", "Drug Code")}</h3>
                <p className="text-base font-semibold">{viewDrug.drugId}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">{t("drug_name", "Drug Name")}</h3>
                <p className="text-base font-semibold">{viewDrug.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">{t("category", "Category")}</h3>
                <p className="text-base">{viewDrug.category}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">{t("current_stock", "Current Stock")}</h3>
                <p className="text-base font-semibold">{viewDrug.stock} {t("units", "units")}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">{t("reorder_level", "Reorder Level")}</h3>
                <p className="text-base text-red-600 font-semibold">{viewDrug.reorder} {t("units", "units")}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">{t("unit_price", "Unit Price")}</h3>
                <p className="text-base font-semibold">${(viewDrug.price || 0).toFixed(2)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">{t("expiry_date", "Expiry Date")}</h3>
                <p className="text-base">{viewDrug.expiry}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
