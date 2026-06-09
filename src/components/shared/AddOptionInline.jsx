import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AddOptionInline({ onAdd, placeholder = "New option..." }) {
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");

  const handleConfirm = () => {
    const trimmed = value.trim();
    if (trimmed) { onAdd(trimmed); }
    setValue("");
    setAdding(false);
  };

  if (!adding) return (
    <button
      type="button"
      onClick={() => setAdding(true)}
      className="flex items-center gap-1 px-2 py-1.5 text-xs text-primary hover:bg-slate-50 rounded w-full"
    >
      <Plus className="w-3 h-3" /> {t("add_option", "Add option")}
    </button>
  );

  return (
    <div className="flex items-center gap-1 px-2 py-1">
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleConfirm(); } if (e.key === "Escape") setAdding(false); }}
        placeholder={placeholder}
        className="h-7 text-xs"
      />
      <Button type="button" size="icon" className="h-7 w-7" onClick={handleConfirm}><Check className="w-3 h-3" /></Button>
      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => setAdding(false)}><X className="w-3 h-3" /></Button>
    </div>
  );
}