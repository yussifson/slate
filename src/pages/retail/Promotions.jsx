import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { Plus, Search, Trash2, Tag, Percent } from 'lucide-react';
import { ViewModeToggle, RetailStatCard, PromotionGridCard } from '@/components/retail/RetailViewKit';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
export default function Promotions() {
  const { t } = useTranslation();
  const { data: promotions = [], isLoading } = useIndustryRecords('promotion');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
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
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeCount = filteredPromos.filter((p) => p.data?.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{t("promotions", "Promotions & Discounts")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("promo_desc", "Manage discount codes for point-of-sale.")}</p>
        </div>
        <Button onClick={openNewDialog} className="gap-2">
          <Plus className="w-4 h-4" /> {t("new_promo", "New Promo")}
        </Button>
      </div>

      <div className="flex items-center justify-end">
        <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RetailStatCard label={t("total_promos", "Total Promotions")} value={filteredPromos.length} icon={Tag} />
        <RetailStatCard label={t("active_promos", "Active Promotions")} value={activeCount} icon={Percent} />
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("search_promo", "Search promo codes...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
        </div>

        {filteredPromos.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{t("no_promos", "No promotions found.")}</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 p-6">
            {filteredPromos.map((promo) => (
              <PromotionGridCard
                key={promo.id}
                promo={{ ...promo.data, id: promo.id }}
                onEdit={() => openEditDialog(promo)}
                onDelete={() => handleDelete(promo.id)}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-primary uppercase">{t("promo_code", "Code")}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-primary uppercase">{t("type", "Type")}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-primary uppercase">{t("value", "Value")}</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-primary uppercase">{t("status", "Status")}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-primary uppercase">{t("actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPromos.map((promo) => (
                  <tr key={promo.id} className="hover:bg-muted/40">
                    <td className="px-6 py-4 font-bold text-foreground">{promo.data?.code}</td>
                    <td className="px-6 py-4 capitalize text-muted-foreground">{promo.data?.discountType}</td>
                    <td className="px-6 py-4 text-right font-bold text-primary">
                      {promo.data?.discountType === "percentage" ? `${promo.data?.discountValue}%` : `$${promo.data?.discountValue}`}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${promo.data?.isActive ? "bg-slate-100 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {promo.data?.isActive ? t("active", "Active") : t("inactive", "Inactive")}
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
            <Button onClick={handleSave}>{t("save", "Save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
