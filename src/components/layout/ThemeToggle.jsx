import React from "react";
import { Sun, Moon, Laptop, ChevronDown} from "lucide-react";
import { useTheme} from "@/lib/ThemeContext";
import { cn} from "@/lib/utils";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export default function ThemeToggle() {
 const { theme, changeTheme} = useTheme();
 return (
 <DropdownMenu>
 <DropdownMenuTrigger className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card hover:bg-muted/50 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-primary/40 data-[state=open]:bg-muted data-[state=open]:border-primary/30 data-[state=open]:ring-1 data-[state=open]:ring-primary/40">
 <ActiveIcon className={cn("w-4 h-4", activeOption.color)} />
 <span className="hidden sm:inline text-xs font-medium text-foreground select-none uppercase tracking-wider tracking-[0.04em]">
 {activeOption.label}
 </span>
 <ChevronDown className="w-3 h-3 text-[#71717a] dark:text-gray-400" />
 </DropdownMenuTrigger>

 <DropdownMenuContent align="end" className="w-36 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card/85 backdrop-blur-md p-1.5 animate-in fade-in zoom-in-95 duration-150 shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="space-y-1">
 {themeOptions.map((option) => {
 const isSelected = option.value === theme;
 const OptIcon = option.icon;

 return (
 <DropdownMenuItem
 key={option.value}
 onClick={() => changeTheme(option.value)}
 className={cn(
 "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-left text-xs font-medium transition-all duration-150 cursor-pointer select-none",
 isSelected
 ? "bg-primary text-white focus:bg-primary focus:text-white"
 : "text-foreground/80 hover:text-foreground focus:bg-muted focus:text-foreground"
 )}
 >
 <OptIcon className={cn("w-3.5 h-3.5 shrink-0", isSelected ? "text-white" : option.color)} />
 <span className="flex-1">{option.label}</span>
 {isSelected && (
 <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_2px_8px_rgba(0,0,0,0.07)]" />
 )}
 </DropdownMenuItem>
 );
 })}
 </div>
 </DropdownMenuContent>
 </DropdownMenu>
 );
}
