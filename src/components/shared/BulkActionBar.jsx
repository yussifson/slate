import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, X } from "lucide-react";

export default function BulkActionBar({ selectedCount, onClear, statusOptions, onBulkStatus, onBulkDelete, deleting }) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
      <span className="text-sm font-medium text-primary">{selectedCount} selected</span>
      <div className="flex-1" />
      {statusOptions && (
        <Select onValueChange={onBulkStatus}>
          <SelectTrigger className="w-44 h-8 text-xs">
            <SelectValue placeholder="Change status…" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Button
        size="sm"
        variant="destructive"
        className="h-8 gap-1.5 text-xs"
        onClick={onBulkDelete}
        disabled={deleting}
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </Button>
      <button onClick={onClear} className="text-muted-foreground hover:text-foreground">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}