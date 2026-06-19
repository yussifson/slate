import React, { useState, useRef, useEffect} from "react";
import { Sun, Moon, Laptop, ChevronDown} from "lucide-react";
import { useTheme} from "@/lib/ThemeContext";
import { cn} from "@/lib/utils";

export default function ThemeToggle() {
 const { theme, changeTheme} = useTheme();
 const [isOpen, setIsOpen] = useState(false);
 const dropdownRef = useRef(null);

 // Close dropdown on click outside
 useEffect(() => {
 function handleClickOutside(event) {
 if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
 setIsOpen(false);
}
}
 document.addEventListener("mousedown", handleClickOutside);
 return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

 const themeOptions = [
 { value: "light", label: "Light", icon: Sun, color: "text-amber-500"},
 { value: "dark", label: "Dark", icon: Moon, color: "text-primary/70"},
 { value: "system", label: "System", icon: Laptop, color: "text-slate-400"},
 ];

 const activeOption = themeOptions.find((opt) => opt.value === theme) || themeOptions[2];
 const ActiveIcon = activeOption.icon;

 return (
 <div className="relative" ref={dropdownRef}>
 {/* Premium Toggle Button */}
 <button
 onClick={() => setIsOpen(!isOpen)}
 className={cn(
 "flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card hover:bg-muted/50 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-primary/40",
 isOpen && "bg-muted border-primary/30 ring-1 ring-primary/40"
 )}
 title="Switch theme"
 >
 <span className={cn("transition-transform duration-300", isOpen && "rotate-12")}>
 <ActiveIcon className={cn("w-4 h-4", activeOption.color)} />
 </span>
 <span className="hidden sm:inline text-xs font-medium text-foreground select-none uppercase tracking-wider tracking-[0.04em]">
 {activeOption.label}
 </span>
 <ChevronDown className={cn("w-3 h-3 text-[#71717a] dark:text-gray-400 transition-transform duration-200", isOpen && "rotate-180")} />
 </button>

 {/* Floating Glassmorphism Dropdown */}
 {isOpen && (
 <div className="absolute right-0 mt-2 w-36 rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card/85 backdrop-blur-md p-1.5 animate-in fade-in zoom-in-95 duration-150 z-50 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="space-y-1">
 {themeOptions.map((option) => {
 const isSelected = option.value === theme;
 const OptIcon = option.icon;

 return (
 <button
 key={option.value}
 onClick={() => {
 changeTheme(option.value);
 setIsOpen(false);
}}
 className={cn(
 "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-left text-xs font-medium transition-all duration-150 cursor-pointer select-none",
 isSelected
 ? "bg-primary text-white "
 : "text-foreground/80 hover:text-foreground hover:bg-muted"
 )}
 >
 <OptIcon className={cn("w-3.5 h-3.5 shrink-0", isSelected ? "text-white" : option.color)} />
 <span className="flex-1">{option.label}</span>
 {isSelected && (
 <span className="w-1.5 h-1.5 rounded-md-full bg-white animate-pulse hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />
 )}
 </button>
 );
})}
 </div>
 </div>
 )}
 </div>
 );
}
