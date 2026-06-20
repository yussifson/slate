import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { Truck, Search, Plus, Phone, Mail, Star, Trash2, MoreVertical, Eye, Edit, FileSignature} from 'lucide-react';
import { ViewModeToggle, RetailStatCard, SupplierGridCard} from '@/components/retail/RetailViewKit';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { toast} from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription} from '@/components/ui/sheet';
import { Link} from 'react-router-dom';
import { useContracts} from '@/hooks/integrations/useContracts';
import { useCompanyId} from '@/hooks/useCompanyId';

export default function Suppliers() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
 const { t} = useTranslation();
 // Supabase Real-time Sync Hooks
 const { data: dbRecords = [], isLoading: isDbLoading} = useIndustryRecords('supplier');
 const mutateRecord = useMutateIndustryRecord();
 const deleteRecord = useDeleteIndustryRecord();
 const companyId = useCompanyId();
 const { sendForSignature, isSending} = useContracts();

 // Map database records
 const suppliers = dbRecords.map(r => ({
 id: r.id,
 status: r.status || 'Active',
 ...r.data
}));

 const [search, setSearch] = useState('');
 const [viewMode, setViewMode] = useState('list');
 const [showModal, setShowModal] = useState(false);
 const [deleteTargetId, setDeleteTargetId] = useState(null);
 const [selectedRecord, setSelectedRecord] = useState(null);
 const [isSheetOpen, setIsSheetOpen] = useState(false);
 const [editingId, setEditingId] = useState(null);

 // Form State
 const [formData, setFormData] = useState({
 name: '',
 category: 'Electronics',
 contact: '',
 phone: '',
 email: '',
 rating: 5
});

 const openDetails = (sup) => {
 setSelectedRecord(sup);
 setIsSheetOpen(true);
};

 const openEdit = (sup) => {
 setEditingId(sup.id);
 setFormData({
 name: sup.name,
 category: sup.category,
 contact: sup.contact,
 phone: sup.phone,
 email: sup.email,
 rating: sup.rating
});
 setShowModal(true);
};

 
  const handleAIRiskAnalyzer = async (sup) => {
    if (!isProOrAbove) {
      toast.error('AI Insights are available on Pro or Enterprise plans.');
      return;
    }
    setIsGenerating(true);
    setAiInsight('');
    try {
      const prompt = `You are a Retail Supply Chain AI. Provide a 2-sentence risk analysis for this supplier:
Name: ${sup.name}
Category: ${sup.category}
Rating: ${sup.rating}/5
Status: ${sup.status}
Suggest any potential risks and mitigation strategies.`;
      const response = await generateText(prompt);
      setAiInsight(response);
    } catch (e) {
      toast.error('AI Risk Analyzer failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateSupplier = () => {
 if (!formData.name.trim() || !formData.contact.trim() || !formData.email.trim()) {
 return toast.error("Please fill in all required fields");
}

 const payload = {
 name: formData.name,
 category: formData.category,
 contact: formData.contact,
 phone: formData.phone,
 email: formData.email,
 rating: parseInt(formData.rating) || 5
};

 mutateRecord.mutate({
 ...(editingId ? { id: editingId} : {}),
 recordType: 'supplier',
 payload,
 status: 'active',
 searchText: `${formData.name} ${formData.category} ${formData.contact}`
}, {
 onSuccess: () => {
 toast.success(editingId ? 'Supplier updated successfully!' : 'Supplier configured successfully!');
 setShowModal(false);
 setEditingId(null);
 setFormData({
 name: '',
 category: 'Electronics',
 contact: '',
 phone: '',
 email: '',
 rating: 5
});
},
 onError: (err) => {
 toast.error('Failed to save supplier: ' + err.message);
}
});
};

 const handleDeleteSupplier = () => {
 if (!deleteTargetId) return;
 deleteRecord.mutate({ id: deleteTargetId, recordType: 'supplier'}, {
 onSuccess: () => {
 toast.success('Supplier removed successfully!');
 setDeleteTargetId(null);
},
 onError: (err) => {
 toast.error('Failed to remove supplier: ' + err.message);
 setDeleteTargetId(null);
}
});
};

 const filtered = suppliers.filter(s => 
 s.name?.toLowerCase().includes(search.toLowerCase()) || 
 s.category?.toLowerCase().includes(search.toLowerCase())
 );

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("suppliers", "Suppliers")}</h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t(
 "manage_vendor_relationships_an",
 "Manage vendor relationships and purchase orders"
 )}</p>
 </div>
 <Button onClick={() => { setEditingId(null); setFormData({ name: '', category: 'Electronics', contact: '', phone: '', email: '', rating: 5}); setShowModal(true);}} className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
 <Plus className="w-4 h-4" /> {t("add_supplier", "Add Supplier")}
 </Button>
 </div>

 <div className="flex items-center justify-end">
 <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <RetailStatCard label={t("total_suppliers", "Total Suppliers")} value={suppliers.length} icon={Truck} />
 <RetailStatCard label={t("active_suppliers", "Active Suppliers")} value={suppliers.filter(s => s.status === 'Active').length} icon={Star} />
 </div>

 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/40 bg-muted/50">
 <div className="relative max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <Input placeholder="Search supplier or category..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />
 </div>
 </div>
 <div className="overflow-x-auto">
 {isDbLoading ? (
 <div className="py-12 text-center text-[#71717a] dark:text-gray-400">{t("loading_suppliers", "Loading suppliers...")}</div>
 ) : filtered.length === 0 ? (
 <div className="py-12 text-center text-[#71717a] dark:text-gray-400">
 <Truck className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse" />
 <p className="font-semibold">{t("no_suppliers_configured", "No suppliers configured.")}</p>
 <p className="text-xs mt-1 tracking-[0.04em]">{t(
 "configure_your_first_retail_ve",
 "Configure your first retail vendor using the \"Add Supplier\" button."
 )}</p>
 </div>
 ) : viewMode === 'grid' ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 p-6">
 {filtered.map(sup => (
 <SupplierGridCard
 key={sup.id}
 supplier={sup}
 onView={() => openDetails(sup)}
 onEdit={() => openEdit(sup)}
 onDelete={() => setDeleteTargetId(sup.id)}
 />
 ))}
 </div>
 ) : (
 <table className="w-full text-sm">
 <thead className="bg-card border-b border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <tr>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("supplier", "Supplier")}</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("contact_person", "Contact Person")}</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("contact_info", "Contact Info")}</th>
 <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("rating", "Rating")}</th>
 <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("status", "Status")}</th>
 <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("action", "Action")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map(sup => {
 return (
 <tr key={sup.id} className="hover:bg-muted/50 transition-colors">
 <td className="px-6 py-4">
 <p className="font-semibold text-card-foreground flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"><Truck className="w-4 h-4 text-[#71717a] dark:text-gray-400"/> {sup.name}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 mt-1 tracking-[0.04em]"><Link to="/retail-inventory" className="text-primary hover:underline">{sup.category}</Link></p>
 </td>
 <td className="px-6 py-4 font-medium text-foreground">{sup.contact}</td>
 <td className="px-6 py-4 text-[#71717a] dark:text-gray-400 space-y-1">
 <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5"/> {sup.phone}</div>
 <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5"/> {sup.email}</div>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center justify-center gap-2 text-yellow-400">
 {[...Array(sup.rating)].map((_, i) => {
 return <Star key={i} className="w-4 h-4 fill-current" />;
})}
 </div>
 </td>
 <td className="px-6 py-4 text-center">
 <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sup.status === 'Active' ? 'bg-slate-100 dark:bg-primary/20 text-primary/90 dark:text-primary/70' : 'bg-muted text-[#71717a] dark:text-gray-400'}`}>
 {sup.status}
 </span>
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
 <DropdownMenuItem onClick={() => openDetails(sup)}>
 <Eye className="mr-2 h-4 w-4" /> {t("view_details", "View Details")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => {
 const signerEmail = prompt("Enter supplier email for vendor agreement signature:", sup.email || "");
 if (signerEmail) {
 sendForSignature({ companyId, provider: 'docusign', documentName: `Vendor_Agreement_${sup.name}`, signerEmail, signerName: sup.contact || sup.name});
}
}}>
 <FileSignature className="mr-2 h-4 w-4" /> {t("send_agreement", "Send Agreement")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => openEdit(sup)}>
 <Edit className="mr-2 h-4 w-4" /> {t("edit", "Edit")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setDeleteTargetId(sup.id)} className="text-red-600">
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
 <SheetTitle>{t("supplier_details", "Supplier Details")}</SheetTitle>
 <SheetDescription>{t(
 "view_detailed_information_for_",
 "View detailed information for this vendor."
 )}</SheetDescription>
 </SheetHeader>
 {selectedRecord && (
 <div className="mt-6 space-y-4 text-sm">
 <div className="grid grid-cols-3 gap-4 border-b pb-4">
 <div className="col-span-1 font-semibold text-[#71717a] dark:text-gray-400">{t("supplier_name", "Supplier Name")}</div>
 <div className="col-span-2 font-medium">{selectedRecord.name}</div>
 </div>
 <div className="grid grid-cols-3 gap-4 border-b pb-4">
 <div className="col-span-1 font-semibold text-[#71717a] dark:text-gray-400">{t("category", "Category")}</div>
 <div className="col-span-2"><Link to="/retail-inventory" className="text-primary hover:underline">{selectedRecord.category}</Link></div>
 </div>
 <div className="grid grid-cols-3 gap-4 border-b pb-4">
 <div className="col-span-1 font-semibold text-[#71717a] dark:text-gray-400">{t("contact_person", "Contact Person")}</div>
 <div className="col-span-2">{selectedRecord.contact}</div>
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
 <div className="col-span-1 font-semibold text-[#71717a] dark:text-gray-400">{t("rating", "Rating")}</div>
 <div className="col-span-2 flex items-center gap-2 text-yellow-400">
 {[...Array(selectedRecord.rating)].map((_, i) => {
 return <Star key={i} className="w-4 h-4 fill-current" />;
})}
 </div>
 </div>
 <div className="grid grid-cols-3 gap-4">
 <div className="col-span-1 font-semibold text-[#71717a] dark:text-gray-400">{t("status", "Status")}</div>
 <div className="col-span-2">
 <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${selectedRecord.status === 'Active' ? 'bg-slate-100 text-primary/90' : 'bg-muted text-[#71717a] dark:text-gray-400'}`}>
 {selectedRecord.status}
 </span>
 </div>
 </div>
 </div>
 )}
 </SheetContent>
 </Sheet>
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"><Plus className="w-5 h-5 text-orange-600"/> {editingId ? 'Edit Supplier' : 'Add Supplier'}</h2>
 <div className="space-y-3">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("supplier_company_name", "Supplier Company Name")}</label>
 <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value})} className="mt-1" placeholder="e.g. Acme Wholesale" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("category", "Category")}</label>
 <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm">
 <option>{t("electronics", "Electronics")}</option>
 <option>{t("apparel", "Apparel")}</option>
 <option>{t("footwear", "Footwear")}</option>
 <option>{t("fitness", "Fitness")}</option>
 <option>{t("groceries", "Groceries")}</option>
 <option>{t("home_living", "Home & Living")}</option>
 <option>{t("beauty", "Beauty")}</option>
 <option>{t("other", "Other")}</option>
 </select>
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("contact_person_name", "Contact Person Name")}</label>
 <Input value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value})} className="mt-1" placeholder="e.g. Robert Smith" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("phone_number", "Phone Number")}</label>
 <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value})} className="mt-1" placeholder="e.g. +1 555-0199" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("email_address", "Email Address")}</label>
 <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value})} className="mt-1" placeholder="e.g. orders@acme.com" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("supplier_rating_1_5", "Supplier Rating (1-5)")}</label>
 <select value={formData.rating} onChange={e => setFormData({ ...formData, rating: parseInt(e.target.value) || 5})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm">
 <option value="5">{t("excellent", "⭐⭐⭐⭐⭐ (Excellent)")}</option>
 <option value="4">{t("very_good", "⭐⭐⭐⭐ (Very Good)")}</option>
 <option value="3">{t("average", "⭐⭐⭐ (Average)")}</option>
 </select>
 </div>
 </div>
 <div className="flex gap-3 pt-4">
 <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditingId(null);}}>{t("cancel", "Cancel")}</Button>
 <Button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white" onClick={handleCreateSupplier}>{editingId ? 'Save Changes' : 'Configure Supplier'}</Button>
 </div>
 </div>
 </div>
 )}
 <ConfirmationModal
 isOpen={deleteTargetId !== null}
 onClose={() => setDeleteTargetId(null)}
 onConfirm={handleDeleteSupplier}
 title="Delete Supplier Relationship"
 message="Are you sure you want to delete this supplier relationship? This vendor will be removed permanently from active supplier catalogs."
 />
 </div>
 );
}

