import React, { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Standard Searchable Select component for fast keyboard searching across large dropdown lists
 * (Customers, Products, Staff, Suppliers).
 * 
 * Props:
 * - options: Array of { value, label, sublabel, badge } OR strings
 * - value: current selected value
 * - onValueChange: (val) => void
 * - placeholder: default placeholder text
 * - searchPlaceholder: input placeholder inside dropdown
 * - emptyMessage: message when no results match
 * - disabled: boolean
 * - className: custom button trigger class
 */
export default function SearchableSelect({
  options = [],
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Type to search...",
  emptyMessage = "No matching items found.",
  disabled = false,
  className = "",
  clearable = false
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const formattedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt };
      }
      return {
        value: opt.value ?? opt.id,
        label: opt.label ?? opt.name ?? opt.full_name ?? String(opt.value),
        sublabel: opt.sublabel ?? opt.phone ?? opt.location ?? opt.email ?? opt.category,
        badge: opt.badge
      };
    });
  }, [options]);

  const selectedOption = useMemo(() => {
    return formattedOptions.find((opt) => String(opt.value) === String(value));
  }, [formattedOptions, value]);

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return formattedOptions;
    const q = query.toLowerCase().trim();
    return formattedOptions.filter((opt) => {
      const matchLabel = opt.label && String(opt.label).toLowerCase().includes(q);
      const matchSub = opt.sublabel && String(opt.sublabel).toLowerCase().includes(q);
      const matchVal = opt.value && String(opt.value).toLowerCase().includes(q);
      return matchLabel || matchSub || matchVal;
    });
  }, [formattedOptions, query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between h-9 px-3 rounded-lg text-xs font-normal bg-card border-border hover:bg-muted/30 focus-visible:ring-1 focus-visible:ring-primary text-left",
            !selectedOption && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate mr-2 font-medium text-foreground">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className="flex items-center gap-1 shrink-0 ml-auto">
            {clearable && selectedOption && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onValueChange("");
                }}
                className="hover:text-destructive p-0.5"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </span>
            )}
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[240px] p-2 rounded-xl bg-card border border-border shadow-lg" align="start">
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 h-8 text-xs rounded-lg bg-muted/30 border-border focus-visible:ring-primary"
            autoFocus
          />
        </div>
        <div className="max-h-56 overflow-y-auto space-y-0.5 text-xs">
          {filteredOptions.length === 0 ? (
            <div className="p-3 text-center text-xs text-muted-foreground font-medium">
              {emptyMessage}
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onValueChange(opt.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors hover:bg-primary/10 hover:text-primary",
                    isSelected ? "bg-primary/15 font-bold text-primary" : "text-foreground"
                  )}
                >
                  <div className="truncate pr-2">
                    <div className="truncate font-semibold text-xs">{opt.label}</div>
                    {opt.sublabel && (
                      <div className="text-[10px] text-muted-foreground truncate font-normal">
                        {opt.sublabel}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {opt.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
