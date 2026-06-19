import { useTranslation } from "react-i18next";
import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, X } from "lucide-react";

export default function BulkActionBar({ selectedCount, onClear, statusOptions, onBulkStatus, onBulkDelete, deleting }) {
  const { t } = useTranslation();
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-md-xl">
      <span className="text-sm font-medium text-primary">{selectedCount} {t("selected", "selected")}</span>
      <div className="flex-1" />
      {statusOptions && (
        <Select onValueChange={onBulkStatus}>
          <SelectTrigger className="w-44 h-8 text-xs tracking-[0.04em]">
            <SelectValue placeholder="Change status…" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(opt => {
              return (<SelectItem key={opt.value} value={opt.value} className="text-xs tracking-[0.04em]">{opt.label}</SelectItem>);
            })}
          </SelectContent>
        </Select>
      )}
      <Button
        size="sm"
        variant="destructive"
        className="h-8 gap-2.5 text-xs tracking-[0.04em]"
        onClick={onBulkDelete}
        disabled={deleting}
      >
        <Trash2 className="w-3.5 h-3.5" />
        {t("delete", "Delete")}
      </Button>
      <button onClick={onClear} className="text-[#71717a] dark:text-gray-400 hover:text-foreground">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}