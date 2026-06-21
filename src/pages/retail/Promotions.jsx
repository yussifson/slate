import React, { useState} from 'react';
import { useTranslation} from "react-i18next";
import { Plus, Search, Trash2, Tag, Percent} from 'lucide-react';
import { ViewModeToggle, RetailStatCard, PromotionGridCard} from '@/components/retail/RetailViewKit';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Button} from "@/components/ui/button";
import { Input} from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription} from "@/components/ui/dialog";
import { Switch} from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import { toast} from "sonner";
import { OrbitLoader } from "@/components/ui/orbit-loader";
export default function Promotions() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const isProOrAbove = true; // Temporary bypass
  const { t} = useTranslation();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [promotions, setPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    let active = true;
    const fetchRecords = async () => {
      setIsLoading(true);
      try {
        const res = await powerSync.execute('SELECT * FROM univ_retail_promotions WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
        if(active) setPromotions(res.rows._array || Array.from(res.rows));
      } catch(e){}
      setIsLoading(false);
    };
    if (companyId) fetchRecords();
    return () => { active = false; };
  }, [companyId]);

 const [searchTerm, setSearchTerm] = useState("");
 const [viewMode, setViewMode] = useState("grid");
 const [isDialogOpen, setIsDialogOpen] = useState(false);
 
 const [editId, setEditId] = useState(null);
 const [promoCode, setPromoCode] = useState("");
 const [discountType, setDiscountType] = useState("percentage"); // percentage or fixed
 const [discountValue, setDiscountValue] = useState("");
 const [isActive, setIsActive] = useState(true);

  const filteredPromos = promotions.filter(p => 
    (p.promo_code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

 const openNewDialog = () => {
 setEditId(null);
 setPromoCode("");
 setDiscountType("percentage");
 setDiscountValue("");
 setIsActive(true);
 setIsDialogOpen(true);
};

  const openEditDialog = (p) => {
    setEditId(p.id);
    setPromoCode(p.promo_code || "");
    setDiscountType(p.discount_type || "percentage");
    setDiscountValue(p.discount_value || "");
    setIsActive(p.status === 'Active');
    setIsDialogOpen(true);
  };

 
  const handleAIGenerator = async () => {
    if (!isProOrAbove) {
      toast.error('AI Insights are available on Pro or Enterprise plans.');
      return;
    }
    setIsGenerating(true);
    setAiInsight('');
    try {
      const activePromos = promotions.filter(p => p.status === 'Active').map(p => p.promo_code).join(', ');
      const prompt = `You are a Retail Marketing AI. Current active promos: ${activePromos || 'None'}. Provide a 2-sentence creative promotion campaign idea to boost sales this weekend. Give it a catchy code.`;
      const response = await generateText(prompt);
      setAiInsight(response);
    } catch (e) {
      toast.error('AI Generator failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!promoCode || !discountValue) {
      toast.error(t("fill_required_fields", "Please fill out the code and discount value."));
      return;
    }

    try {
      const codeUpper = promoCode.toUpperCase();
      if (editId) {
        await powerSync.execute(`UPDATE univ_retail_promotions SET promo_code=?, discount_type=?, discount_value=?, status=? WHERE id=?`, 
          [codeUpper, discountType, Number(discountValue), isActive ? 'Active' : 'Inactive', editId]
        );
      } else {
        await powerSync.execute(`INSERT INTO univ_retail_promotions (id, created_at, company_id, promo_code, discount_type, discount_value, status) VALUES (gen_random_uuid(), CURRENT_TIMESTAMP, ?, ?, ?, ?, ?)`, 
          [companyId, codeUpper, discountType, Number(discountValue), isActive ? 'Active' : 'Inactive']
        );
      }
      
      const res = await powerSync.execute('SELECT * FROM univ_retail_promotions WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
      setPromotions(res.rows._array || Array.from(res.rows));

      toast.success(t("promo_saved", "Promotion saved successfully"));
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(t("promo_error", "Error saving promotion"));
    }
  };

  const handleDelete = async (id) => {
    if(confirm(t("confirm_delete", "Are you sure you want to delete this promotion?"))) {
      try {
        await powerSync.execute(`DELETE FROM univ_retail_promotions WHERE id=?`, [id]);
        setPromotions(promotions.filter(p => p.id !== id));
        toast.success(t("deleted", "Deleted successfully"));
      } catch (err) {
        toast.error("Error deleting promotion");
      }
    }
  };

 if (isLoading) {
 return (
 <div className="flex-1 p-6 flex items-center justify-center">
 <OrbitLoader size="md" />
 </div>
 );
}

 const activeCount = filteredPromos.filter((p) => p.status === 'Active').length;

 return (
 <div className="space-y-6 school-page-enter font-dmsans">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <h1 className="text-2xl font-semibold text-foreground tracking-tight tracking-[-0.02em]">{t("promotions", "Promotions & Discounts")}</h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">{t("promo_desc", "Manage discount codes for point-of-sale.")}</p>
 </div>
 <Button onClick={openNewDialog} className="gap-2">
 <Plus className="w-4 h-4" /> {t("new_promo", "New Promo")}
 </Button>
 </div>

 <div className="flex items-center justify-end">
 <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
 </div>

 
      {aiInsight && (
        <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
          <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2"><Bot className="w-4 h-4"/> AI Campaign Idea</h3>
          <p className="text-sm text-foreground font-medium">{aiInsight}</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <RetailStatCard label={t("total_promos", "Total Promotions")} value={filteredPromos.length} icon={Tag} />
 <RetailStatCard label={t("active_promos", "Active Promotions")} value={activeCount} icon={Percent} />
 </div>

 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/40 bg-muted/50 flex flex-wrap gap-3 items-center justify-between">
 <div className="relative flex-1 max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <Input
 placeholder={t("search_promo", "Search promo codes...")}
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="pl-9 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 />
 </div>
 </div>

 {filteredPromos.length === 0 ? (
 <div className="py-16 text-center text-[#71717a] dark:text-gray-400">
 <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
 <p>{t("no_promos", "No promotions found.")}</p>
 </div>
 ) : viewMode === "grid" ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 p-6">
 {filteredPromos.map((promo) => (
 <PromotionGridCard
 key={promo.id}
 promo={{
   code: promo.promo_code,
   discountType: promo.discount_type,
   discountValue: promo.discount_value,
   isActive: promo.status === 'Active',
   id: promo.id
 }}
 onEdit={() => openEditDialog(promo)}
 onDelete={() => handleDelete(promo.id)}
 />
 ))}
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-muted/30 border-b border-primary/40">
 <tr>
 <th className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-[0.04em]">{t("promo_code", "Code")}</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-[0.04em]">{t("type", "Type")}</th>
 <th className="px-6 py-4 text-right text-xs font-semibold text-primary uppercase tracking-[0.04em]">{t("value", "Value")}</th>
 <th className="px-6 py-4 text-center text-xs font-semibold text-primary uppercase tracking-[0.04em]">{t("status", "Status")}</th>
 <th className="px-6 py-4 text-right text-xs font-semibold text-primary uppercase tracking-[0.04em]">{t("actions", "Actions")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filteredPromos.map((promo) => (
 <tr key={promo.id} className="hover:bg-muted/40">
 <td className="px-6 py-4 font-semibold text-foreground">{promo.promo_code}</td>
 <td className="px-6 py-4 capitalize text-[#71717a] dark:text-gray-400">{promo.discount_type}</td>
 <td className="px-6 py-4 text-right font-semibold text-primary">
 {promo.discount_type === "percentage" ? `${promo.discount_value}%` : `$${promo.discount_value}`}
 </td>
 <td className="px-6 py-4 text-center">
 <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${promo.status === 'Active' ? "bg-slate-100 text-primary" : "bg-muted text-[#71717a] dark:text-gray-400"}`}>
 {promo.status === 'Active' ? t("active", "Active") : t("inactive", "Inactive")}
 </span>
 </td>
 <td className="px-6 py-4 text-right space-x-1">
 <Button variant="ghost" size="sm" onClick={() => openEditDialog(promo)}>{t("edit", "Edit")}</Button>
 <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(promo.id)}>{t("delete", "Delete")}</Button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>

 <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
 <DialogContent className="sm:max-w-[425px]">
 <DialogHeader>
 <DialogTitle>{editId ? t("edit_promo", "Edit Promotion") : t("new_promo", "New Promotion")}</DialogTitle>
 <DialogDescription>{t("promo_dialog_desc", "Configure discount codes for checkout.")}</DialogDescription>
 </DialogHeader>
 <div className="space-y-4 py-4">
 <div className="space-y-2">
 <label className="text-sm font-medium">{t("promo_code", "Promo Code")}</label>
 <Input 
 value={promoCode} 
 onChange={e => setPromoCode(e.target.value.toUpperCase())}
 placeholder="e.g. SUMMER20"
 className="uppercase tracking-[0.04em]"
 />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-sm font-medium">{t("type", "Discount Type")}</label>
 <Select value={discountType} onValueChange={setDiscountType}>
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="percentage">Percentage (%)</SelectItem>
 <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-2">
 <label className="text-sm font-medium">{t("value", "Value")}</label>
 <Input 
 type="number"
 min="0"
 value={discountValue} 
 onChange={e => setDiscountValue(e.target.value)}
 placeholder={discountType === 'percentage' ? "20" : "15.00"}
 />
 </div>
 </div>
 <div className="flex items-center justify-between pt-4 border-t">
 <label className="text-sm font-medium">{t("is_active", "Active Promotion")}</label>
 <Switch checked={isActive} onCheckedChange={setIsActive} />
 </div>
 </div>
 <DialogFooter>
 <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t("cancel", "Cancel")}</Button>
 <Button onClick={handleSave}>{t("save", "Save")}</Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 );
}


