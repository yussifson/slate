import { useTranslation} from "react-i18next";
import React, { useState, useEffect, useRef} from "react";
import { useNavigate} from "react-router-dom";
import { Search, FileText, User, Users, Calendar, X, ShieldAlert, ArrowRight, Sparkles, Bot} from "lucide-react";
import { base44} from "@/api/base44Client";

export default function SpotlightSearch() {
 const { t} = useTranslation();
 const [isOpen, setIsOpen] = useState(false);
 const [query, setQuery] = useState("");
 const [results, setResults] = useState({ cases: [], clients: [], staff: [], other: []});
 const [loading, setLoading] = useState(false);
 const [selectedIndex, setSelectedIndex] = useState(0);
 const [hoveredId, setHoveredId] = useState(null);
 const navigate = useNavigate();
 const inputRef = useRef(null);

 // Keyboard shortcut: CMD+K / CTRL+K
 useEffect(() => {
 const handleKeyDown = (e) => {
 if ((e.metaKey || e.ctrlKey) && e.key === "k") {
 e.preventDefault();
 setIsOpen((prev) => !prev);
} else if (e.key === "Escape") {
 setIsOpen(false);
}
};
 window.addEventListener("keydown", handleKeyDown);
 return () => window.removeEventListener("keydown", handleKeyDown);
}, []);

 // Autofocus & reset on open/close
 useEffect(() => {
 if (isOpen) {
 setTimeout(() => inputRef.current?.focus(), 100);
 setSelectedIndex(0);
 setHoveredId(null);
} else {
 setQuery("");
 setResults({ cases: [], clients: [], staff: [], other: []});
}
}, [isOpen]);

 // Debounced search across entities
 useEffect(() => {
 if (!query.trim()) {
 setResults({ cases: [], clients: [], staff: [], other: []});
 return;
}

 const delayDebounce = setTimeout(async () => {
 setLoading(true);
 try {
 const q = query.toLowerCase();

 const [allCases, allClients, allStaff, allTasks] = await Promise.all([
 base44.entities.LegalCase.list().catch(() => []),
 base44.entities.Client.list().catch(() => []),
 base44.entities.StaffRecord.list().catch(() => []),
 base44.entities.Task.list().catch(() => []),
 ]);

 setResults({
 cases: allCases.filter(c =>
 c.title?.toLowerCase().includes(q) || c.case_number?.toLowerCase().includes(q)
 ).slice(0, 4),
 clients: allClients.filter(c =>
 c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
 ).slice(0, 4),
 staff: allStaff.filter(s =>
 s.full_name?.toLowerCase().includes(q) || s.user_email?.toLowerCase().includes(q)
 ).slice(0, 4),
 other: allTasks.filter(item =>
 item.title?.toLowerCase().includes(q)
 ).slice(0, 4),
});
} catch (err) {
 console.error("Spotlight search failed", err);
} finally {
 setLoading(false);
}
}, 200);

 return () => clearTimeout(delayDebounce);
}, [query]);

 // Flat list for keyboard navigation
 const flatResults = [
 ...results.cases.map(item => ({ ...item, category: "Cases", route: `/cases/${item.id}`, icon: FileText, entityType: "Case"})),
 ...results.clients.map(item => ({ ...item, category: "Contacts", route: `/clients`, icon: User, entityType: "Client"})),
 ...results.staff.map(item => ({ ...item, category: "Team", route: `/team`, icon: Users, entityType: "Staff Member"})),
 ...results.other.map(item => ({ ...item, category: "Tasks", route: `/tasks`, icon: Calendar, entityType: "Task"})),
 ];

 // Ask AI: dispatch event to AppLayout, which opens Orbit with context
 const handleAskAI = (item) => {
 const context = {
 query,
 entityType: item.entityType,
 record: item,
 label: item.title || item.name || item.full_name,
};
 window.dispatchEvent(new CustomEvent("orbit:inject", { detail: context}));
 setIsOpen(false);
};

 // Keyboard navigation
 const handleKeyNavigation = (e) => {
 if (flatResults.length === 0) return;
 if (e.key === "ArrowDown") {
 e.preventDefault();
 setSelectedIndex((prev) => (prev + 1) % flatResults.length);
} else if (e.key === "ArrowUp") {
 e.preventDefault();
 setSelectedIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
} else if (e.key === "Enter") {
 e.preventDefault();
 const selected = flatResults[selectedIndex];
 if (selected) { navigate(selected.route); setIsOpen(false);}
}
};

 if (!isOpen) return null;

 return (
 <div
 className="fixed inset-0 z-[100] bg-primary/20 backdrop-blur-sm flex justify-center pt-[8vh] p-4 font-sans"
 onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false);}}
 >
 <div
 className="w-full max-w-2xl bg-background border border-primary/40 rounded-2xl -[0_32px_64px_rgba(0,0,0,0.15)] flex flex-col max-h-[65vh] overflow-hidden animate-in slide-in-from-top-4 duration-200"
 onKeyDown={handleKeyNavigation}
 >
 {/* Search Input Bar */}
 <div className="flex items-center gap-3 px-5 py-4 border-b border-primary/40">
 <Search className="w-5 h-5 text-primary shrink-0" />
 <input
 ref={inputRef}
 type="text"
 placeholder="Search cases, clients, tasks, or team members..."
 className="flex-1 bg-transparent border-0 text-foreground placeholder:text-muted-foreground/60 outline-none text-[15px] focus:ring-0 focus:outline-none"
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 />
 <div className="flex items-center gap-2 shrink-0 select-none">
 <kbd className="text-[10px] bg-muted text-muted-foreground border border-primary/40 rounded-md px-1.5 py-0.5 font-semibold">{t("esc", "ESC")}</kbd>
 <button
 onClick={() => setIsOpen(false)}
 className="p-1.5 hover:bg-muted rounded-lg transition-colors"
 >
 <X className="w-4 h-4 text-muted-foreground" />
 </button>
 </div>
 </div>

 {/* Results Body */}
 <div className="flex-1 overflow-y-auto p-3 space-y-3">
 {loading ? (
 <div className="py-14 text-center text-sm text-muted-foreground flex flex-col items-center gap-3">
 <span className="w-7 h-7 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
 <span>{t("scanning_records", "Scanning records...")}</span>
 </div>
 ) : flatResults.length === 0 ? (
 <div className="py-10 text-center flex flex-col items-center gap-2.5">
 {query ? (
 <>
 <ShieldAlert className="w-9 h-9 text-amber-500/70" />
 <p className="font-semibold text-foreground text-sm">{t("no_matches_found", "No matches found")}</p>
 <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
 {t("no_records_matching", "No records matching \"")}{query}{t(
 "were_found_across_cases_client",
 "\" were found across cases, clients, tasks, or team."
 )}
 </p>
 </>
 ) : (
 <div className="max-w-sm space-y-2 mt-4 px-4">
 <div className="flex items-center justify-center gap-2 mb-3">
 <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
 <Search className="w-4 h-4 text-primary" />
 </div>
 </div>
 <p className="font-bold text-foreground text-base">{t("ecosystem_spotlight", "Ecosystem Spotlight")}</p>
 <p className="text-xs text-muted-foreground/80 leading-relaxed">
 {t(
 "search_across_all_records_inst",
 "Search across all records instantly. Type a name, case number, or task title to begin. Results can be opened or sent directly to Orbit AI."
 )}
 </p>
 </div>
 )}
 </div>
 ) : (
 <div className="space-y-4">
 {["Cases", "Contacts", "Team", "Tasks"].map(cat => {
 const catItems = flatResults.filter(item => item.category === cat);
 if (catItems.length === 0) return null;
 return (
 <div key={cat} className="space-y-0.5">
 <h4 className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest px-3 pb-1 select-none">
 {cat}
 </h4>
 <div className="space-y-0.5">
 {catItems.map((item) => {
 const globalIndex = flatResults.findIndex(f => f.id === item.id && f.category === item.category);
 const isSelected = globalIndex === selectedIndex;
 const isHovered = hoveredId === item.id + item.category;
 const IconComp = item.icon;

 return (
 <div
 key={item.id + item.category}
 onMouseEnter={() => setHoveredId(item.id + item.category)}
 onMouseLeave={() => setHoveredId(null)}
 className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-100 select-none group ${
 isSelected
 ? "bg-primary text-primary-foreground "
 : "hover:bg-muted/70 text-foreground"
}`}
 >
 {/* Left: icon + info */}
 <div
 className="flex items-center gap-3 min-w-0 flex-1"
 onClick={() => { navigate(item.route); setIsOpen(false);}}
 >
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
 isSelected ? "bg-white/20" : "bg-muted"
}`}>
 <IconComp className={`w-4 h-4 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`} />
 </div>
 <div className="min-w-0">
 <p className="text-sm font-semibold truncate leading-tight">
 {item.title || item.name || item.full_name}
 </p>
 <p className={`text-xs truncate leading-tight mt-0.5 ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
 {item.case_number || item.email || item.user_email || item.description || item.status || "View details"}
 </p>
 </div>
 </div>
 {/* Right: Ask AI button + arrow */}
 <div className="flex items-center gap-1.5 shrink-0 ml-2">
 {(isHovered || isSelected) && (
 <button
 onClick={(e) => { e.stopPropagation(); handleAskAI(item);}}
 className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-150 ${
 isSelected
 ? "bg-white/20 text-primary-foreground hover:bg-white/30"
 : "bg-slate-100 text-primary hover:bg-primary/20"
}`}
 title="Ask Orbit AI about this record"
 >
 <Bot className="w-3 h-3" />
 {t("ask_ai", "Ask AI")}
 </button>
 )}
 {isSelected && <ArrowRight className="w-4 h-4 text-primary-foreground/80" />}
 </div>
 </div>
 );
})}
 </div>
 </div>
 );
})}
 </div>
 )}
 </div>

 {/* Footer */}
 <div className="px-5 py-2.5 bg-muted/30 border-t border-primary/40 text-[10px] text-muted-foreground flex items-center justify-between select-none">
 <div className="flex items-center gap-3">
 <span className="flex items-center gap-1">↑↓ <span className="text-foreground/60">{t("navigate", "navigate")}</span></span>
 <span>·</span>
 <span className="flex items-center gap-1">↵ <span className="text-foreground/60">{t("open", "open")}</span></span>
 <span>·</span>
 <span className="flex items-center gap-1">
 <Bot className="w-3 h-3 text-primary" />
 <span className="text-foreground/60">{t("ask_ai_on_hover", "Ask AI on hover")}</span>
 </span>
 </div>
 <div className="flex items-center gap-1">
 <Sparkles className="w-3 h-3 text-primary/60" />
 <span>{t("spotlight_console", "Spotlight Console")}</span>
 </div>
 </div>
 </div>
 </div>
 );
}
