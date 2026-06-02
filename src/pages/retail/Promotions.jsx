import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { Plus, Search, Trash2, Edit2, Tag, Percent } from 'lucide-react';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Promotions() {
  const { t } = useTranslation();
  const { data: promotions = [], isLoading } = useIndustryRecords('promotion');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [editId, setEditId] = useState(null);
  const [promoCode, setPromoCode] = useState("");
  const [discountType, setDiscountType] = useState("percentage"); // percentage or fixed
  const [discountValue, setDiscountValue] = useState("");
  const [isActive, setIsActive] = useState(true);

  const filteredPromos = promotions.filter(p => 
    (p.data?.code || '').toLowerCase().includes(searchTerm.toLowerCase())
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
    setPromoCode(p.data?.code || "");
    setDiscountType(p.data?.discountType || "percentage");
    setDiscountValue(p.data?.discountValue || "");
    setIsActive(p.data?.isActive ?? true);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!promoCode || !discountValue) {
      toast.error(t("fill_required_fields", "Please fill out the code and discount value."));
      return;
    }

    const payload = {
      code: promoCode.toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      isActive
    };

    try {
      await mutateRecord.mutateAsync({
        id: editId,
        recordType: 'promotion',
        payload,
        status: isActive ? 'active' : 'inactive',
        searchText: `${payload.code} ${payload.discountType}`.toLowerCase()
      });
      toast.success(t("promo_saved", "Promotion saved successfully"));
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(t("promo_error", "Error saving promotion"));
    }
  };

  const handleDelete = async (id) => {
    if(confirm(t("confirm_delete", "Are you sure you want to delete this promotion?"))) {
      try {
        await deleteRecord.mutateAsync({ id, recordType: 'promotion' });
        toast.success(t("deleted", "Deleted successfully"));
      } catch (err) {
        toast.error("Error deleting promotion");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t("promotions", "Promotions & Discounts")}</h1>
            <p className="text-sm text-slate-500 mt-1">{t("promo_desc", "Manage discount codes for point-of-sale.")}</p>
          </div>
          <Button onClick={openNewDialog} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> {t("new_promo", "New Promo")}
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder={t("search_promo", "Search promo codes...")} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-slate-200 shadow-sm"
            />
          </div>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPromos.map((promo) => (
            <div key={promo.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditDialog(promo)} className="p-1.5 text-slate-400 hover:text-blue-600 bg-white rounded-md shadow-sm border border-slate-200">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(promo.id)} className="p-1.5 text-slate-400 hover:text-red-600 bg-white rounded-md shadow-sm border border-slate-200">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${promo.data?.isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                  {promo.data?.discountType === 'percentage' ? <Percent className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 tracking-tight">{promo.data?.code}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xl font-bold text-emerald-600">
                      {promo.data?.discountType === 'percentage' ? `${promo.data?.discountValue}%` : `$${promo.data?.discountValue}`}
                    </span>
                    <span className="text-sm font-medium text-slate-500 uppercase tracking-wider text-[10px]">OFF</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${promo.data?.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className="text-xs font-medium text-slate-600">
                    {promo.data?.isActive ? t("active", "Active") : t("inactive", "Inactive")}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {promo.createdAt ? format(new Date(promo.createdAt), 'MMM d, yyyy') : ''}
                </span>
              </div>
            </div>
          ))}

          {filteredPromos.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Tag className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">{t("no_promos", "No promotions found.")}</p>
            </div>
          )}
        </div>

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
                className="uppercase"
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
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">{t("save", "Save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
