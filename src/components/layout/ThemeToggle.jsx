import React from "react";
import { Sun, Moon, Laptop, ChevronDown, Check } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun, color: "text-amber-500" },
  { value: "dark", label: "Dark", icon: Moon, color: "text-sky-400" },
  { value: "system", label: "System", icon: Laptop, color: "text-slate-400" },
];

export default function ThemeToggle({ iconOnly = false, className = "" }) {
  const { theme, changeTheme } = useTheme();
  const activeOption = themeOptions.find(o => o.value === theme) || themeOptions[0];
  const ActiveIcon = activeOption.icon;

  if (iconOnly) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button 
            type="button"
            className={cn(
              "w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-foreground flex items-center justify-center focus:outline-none transition-all cursor-pointer border border-black/5 dark:border-white/10 active:scale-95 shadow-sm",
              className
            )}
            title={`Theme: ${activeOption.label}`}
          >
            <ActiveIcon className={cn("w-4 h-4", activeOption.color)} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-[100] w-40 rounded-2xl border border-border bg-card text-foreground p-1.5 animate-in fade-in zoom-in-95 duration-150 shadow-2xl backdrop-blur-xl">
          <div className="space-y-1">
            {themeOptions.map((option) => {
              const isSelected = option.value === theme;
              const OptIcon = option.icon;
              return (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => changeTheme(option.value)}
                  className={cn(
                    "flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all duration-150 cursor-pointer select-none",
                    isSelected
                      ? "bg-[#005A9C]/10 text-[#005A9C] dark:bg-[#FF6B00]/15 dark:text-[#FF6B00]"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <OptIcon className={cn("w-4 h-4 shrink-0", isSelected ? "text-[#005A9C] dark:text-[#FF6B00]" : option.color)} />
                  <span className="flex-1">{option.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#005A9C] dark:text-[#FF6B00]" />}
                </DropdownMenuItem>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          type="button"
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/60 hover:bg-muted text-foreground transition-all duration-200 focus:outline-none cursor-pointer active:scale-95 shadow-sm h-9",
            className
          )}
        >
          <ActiveIcon className={cn("w-3.5 h-3.5", activeOption.color)} />
          <span className="hidden sm:inline text-xs font-semibold select-none text-foreground">
            {activeOption.label}
          </span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="z-[100] w-40 rounded-2xl border border-border bg-card text-foreground p-1.5 animate-in fade-in zoom-in-95 duration-150 shadow-2xl backdrop-blur-xl">
        <div className="space-y-1">
          {themeOptions.map((option) => {
            const isSelected = option.value === theme;
            const OptIcon = option.icon;

            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => changeTheme(option.value)}
                className={cn(
                  "flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all duration-150 cursor-pointer select-none",
                  isSelected
                    ? "bg-[#005A9C]/10 text-[#005A9C] dark:bg-[#FF6B00]/15 dark:text-[#FF6B00]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <OptIcon className={cn("w-4 h-4 shrink-0", isSelected ? "text-[#005A9C] dark:text-[#FF6B00]" : option.color)} />
                <span className="flex-1">{option.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#005A9C] dark:text-[#FF6B00]" />}
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
