import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, User, Users, Calendar, X, ShieldAlert, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function SpotlightSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ cases: [], clients: [], staff: [], other: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Keyboard shortcut listener to toggle Spotlight modal (CMD + K or CTRL + K)
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

  // Autofocus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSelectedIndex(0);
    } else {
      setQuery("");
      setResults({ cases: [], clients: [], staff: [], other: [] });
    }
  }, [isOpen]);

  // Handle dynamic multi-entity query search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ cases: [], clients: [], staff: [], other: [] });
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const queryLower = query.toLowerCase();

        // 1. Legal Cases
        const allCases = await base44.entities.LegalCase.list().catch(() => []);
        const filteredCases = allCases.filter(c => 
          c.title?.toLowerCase().includes(queryLower) || 
          c.case_number?.toLowerCase().includes(queryLower)
        ).slice(0, 4);

        // 2. Clients (Legal/General)
        const allClients = await base44.entities.Client.list().catch(() => []);
        const filteredClients = allClients.filter(c => 
          c.name?.toLowerCase().includes(queryLower) || 
          c.email?.toLowerCase().includes(queryLower)
        ).slice(0, 4);

        // 3. Staff/Team
        const allStaff = await base44.entities.StaffRecord.list().catch(() => []);
        const filteredStaff = allStaff.filter(s => 
          s.full_name?.toLowerCase().includes(queryLower) || 
          s.user_email?.toLowerCase().includes(queryLower)
        ).slice(0, 4);

        // 4. Fallback search on other tables if needed (e.g. Invoices, Tasks)
        const allTasks = await base44.entities.Task.list().catch(() => []);
        const filteredTasks = allTasks.filter(t => 
          t.title?.toLowerCase().includes(queryLower)
        ).slice(0, 4);

        setResults({
          cases: filteredCases,
          clients: filteredClients,
          staff: filteredStaff,
          other: filteredTasks
        });
      } catch (err) {
        console.error("Spotlight search failed", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Flattened list for keyboard arrow navigation
  const flatResults = [
    ...results.cases.map(item => ({ ...item, category: "Cases", route: `/cases/${item.id}`, icon: FileText })),
    ...results.clients.map(item => ({ ...item, category: "Contacts", route: `/clients`, icon: User })),
    ...results.staff.map(item => ({ ...item, category: "Team", route: `/team`, icon: Users })),
    ...results.other.map(item => ({ ...item, category: "Tasks", route: `/tasks`, icon: Calendar }))
  ];

  // Key navigation controller
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
      if (selected) {
        navigate(selected.route);
        setIsOpen(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-center pt-[10vh] p-4 font-sans animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-card/85 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl flex flex-col max-h-[60vh] overflow-hidden"
        onKeyDown={handleKeyNavigation}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border/80">
          <Search className="w-5 h-5 text-muted-foreground shrink-0 animate-pulse" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search cases, clients, tasks, or staff members globally..."
            className="flex-1 bg-transparent border-0 text-foreground placeholder:text-muted-foreground outline-none text-base focus:ring-0 focus:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-1.5 shrink-0 select-none">
            <span className="text-[10px] bg-muted text-muted-foreground border border-border/60 rounded px-1.5 py-0.5 font-bold uppercase">ESC</span>
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-1 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-3">
              <span className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <span>Scanning databases...</span>
            </div>
          ) : flatResults.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              {query ? (
                <>
                  <ShieldAlert className="w-8 h-8 text-amber-500/80 animate-bounce" />
                  <p className="font-semibold text-foreground">No matches found</p>
                  <p className="text-xs text-muted-foreground/80 max-w-xs leading-relaxed">No matching legal cases, clients, or tasks exist for "{query}".</p>
                </>
              ) : (
                <div className="max-w-md space-y-1 mt-4">
                  <p className="font-bold text-foreground text-md">Ecosystem Spotlight Search</p>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed">Search dynamically across different industries instantly. Try typing a name, case, or task title to begin search scan.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Grouped results view */}
              {["Cases", "Contacts", "Team", "Tasks"].map(cat => {
                const catItems = flatResults.filter(item => item.category === cat);
                if (catItems.length === 0) return null;
                return (
                  <div key={cat} className="space-y-1.5">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 select-none">{cat}</h4>
                    <div className="space-y-1">
                      {catItems.map((item, idx) => {
                        const globalIndex = flatResults.findIndex(f => f.id === item.id);
                        const isSelected = globalIndex === selectedIndex;
                        const IconComp = item.icon;

                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              navigate(item.route);
                              setIsOpen(false);
                            }}
                            className={`flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all duration-150 select-none ${
                              isSelected 
                                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-[1.01]" 
                                : "hover:bg-muted text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <IconComp className={`w-4 h-4 shrink-0 ${isSelected ? "text-primary-foreground animate-pulse" : "text-muted-foreground"}`} />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">{item.title || item.name || item.full_name}</p>
                                <p className={`text-xs truncate ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground/80"}`}>
                                  {item.case_number || item.email || item.user_email || item.description || "Active Profile"}
                                </p>
                              </div>
                            </div>
                            {isSelected && <ArrowRight className="w-4 h-4 shrink-0 text-primary-foreground mr-1 animate-pulse" />}
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

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2.5 bg-muted/40 border-t border-border/80 text-[10px] text-muted-foreground flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <span>↑↓ to navigate</span>
            <span>·</span>
            <span>↵ to select</span>
          </div>
          <div>
            <span>Spotlight Console</span>
          </div>
        </div>
      </div>
    </div>
  );
}
