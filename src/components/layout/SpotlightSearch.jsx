import { OrbitLoader } from "@/components/ui/orbit-loader";
import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, FileText, User, Users, Calendar, X,
  ShieldAlert, ArrowRight, Sparkles, Bot, Zap, ChevronRight
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

const SUGGESTIONS = [
  { icon: Sparkles, label: "What decisions were made last week?" },
  { icon: Calendar,  label: "Show me overdue tasks" },
  { icon: FileText,  label: "Find recent meetings about pricing" },
  { icon: Zap,       label: "Any blockers in engineering?" },
  { icon: Users,     label: "What videos were recorded this month?" },
];

export default function SpotlightSearch() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ cases: [], clients: [], staff: [], other: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredId, setHoveredId] = useState(null);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { user } = useAuth();
  const companyId = user?.company_id;

  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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
    const handleCustomOpen = () => setIsOpen(true);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-spotlight", handleCustomOpen);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-spotlight", handleCustomOpen);
    };
  }, []);

  // Focus & reset on open/close
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 120);
      setSelectedIndex(0);
      setHoveredId(null);
    } else {
      setQuery("");
      setResults({ cases: [], clients: [], staff: [], other: [] });
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ cases: [], clients: [], staff: [], other: [] });
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const q = query.toLowerCase();
        const [allCases, allClients, allStaff, allTasks, externalRes] = await Promise.all([
          base44.entities.LegalCase.list().catch(() => []),
          base44.entities.Client.list().catch(() => []),
          base44.entities.StaffRecord.list().catch(() => []),
          base44.entities.Task.list().catch(() => []),
          supabase.functions.invoke('knowledge-search', {
            body: { query: q, company_id: companyId, match_count: 5 }
          }).catch(() => ({ data: { results: [] } }))
        ]);
        setResults({
          cases: allCases.filter(c =>
            c.company_id === companyId &&
            (c.title?.toLowerCase().includes(q) || c.case_number?.toLowerCase().includes(q))
          ).slice(0, 4),
          clients: allClients.filter(c =>
            c.company_id === companyId &&
            (c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q))
          ).slice(0, 4),
          staff: allStaff.filter(s =>
            s.company_id === companyId &&
            (s.full_name?.toLowerCase().includes(q) || s.user_email?.toLowerCase().includes(q))
          ).slice(0, 4),
          other: allTasks.filter(item =>
            item.company_id === companyId && item.title?.toLowerCase().includes(q)
          ).slice(0, 4),
          external: (externalRes?.data?.results || []).slice(0, 4),
        });
      } catch (err) {
        console.error("Spotlight search failed", err);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query, companyId]);

  const flatResults = [
    ...results.cases.map(item   => ({ ...item, category: "Cases",    route: `/cases/${item.id}`,   icon: FileText, entityType: "Case"         })),
    ...results.clients.map(item => ({ ...item, category: "Contacts", route: `/clients/${item.id}`, icon: User,     entityType: "Client"       })),
    ...results.staff.map(item   => ({ ...item, category: "Team",     route: `/team/${item.id}`,    icon: Users,    entityType: "Staff Member" })),
    ...results.other.map(item   => ({ ...item, category: "Tasks",    route: `/tasks/${item.id}`,   icon: Calendar, entityType: "Task"         })),
    ...(results.external || []).map(item => ({ ...item, category: "External", route: item.url || '#', icon: FileText, entityType: "Document", isExternal: true, name: item.title })),
  ];

  const handleAskAI = (label, record) => {
    window.dispatchEvent(new CustomEvent("orbit:inject", {
      detail: { query: label, entityType: record?.entityType || "query", record, label },
    }));
    setIsOpen(false);
  };

  const handleKeyNavigation = (e) => {
    if (!flatResults.length) return;
    if (e.key === "ArrowDown")  { e.preventDefault(); setSelectedIndex(p => (p + 1) % flatResults.length); }
    if (e.key === "ArrowUp")    { e.preventDefault(); setSelectedIndex(p => (p - 1 + flatResults.length) % flatResults.length); }
    if (e.key === "Enter")      { 
      e.preventDefault(); 
      const s = flatResults[selectedIndex]; 
      if (s) { 
        if (s.isExternal) window.open(s.route, "_blank"); 
        else navigate(s.route); 
        setIsOpen(false); 
      } 
    }
  };

  if (!isOpen) return null;

  const hasResults = flatResults.length > 0;

  /* ─────────────────────────────────────────────────────────────────
     Shared: result list content (used by both mobile + desktop)
  ───────────────────────────────────────────────────────────────── */
  const ResultsContent = () => (
    <>
      {loading ? (
        <div className="py-12 flex flex-col items-center gap-3 text-slate-500">
          <OrbitLoader size="md" />
          <span className="text-sm font-medium">Scanning records...</span>
        </div>
      ) : !hasResults ? (
        <div className="py-6 flex flex-col items-center gap-1 text-center px-4">
          {query ? (
            <>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-2">
                <ShieldAlert className="w-6 h-6 text-amber-500" />
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-100 text-[15px]">No matches found</p>
              <p className="text-sm text-slate-400 max-w-xs leading-relaxed mt-1">
                No records matching <span className="font-semibold text-slate-600 dark:text-slate-300">"{query}"</span> were found.
              </p>
            </>
          ) : (
            /* Suggestion chips */
            <div className="w-full pt-1 pb-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-left px-1">Try asking…</p>
              <div className="space-y-1">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { handleAskAI(s.label, null); }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left group active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
                      <s.icon className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="text-[14px] font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors flex-1 text-left">
                      {s.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-400 transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 p-1">
          {["Cases", "Contacts", "Team", "Tasks", "External"].map(cat => {
            const catItems = flatResults.filter(item => item.category === cat);
            if (!catItems.length) return null;
            return (
              <div key={cat}>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] px-2 pb-2 select-none">{cat}</h4>
                <div className="space-y-0.5">
                  {catItems.map((item) => {
                    const gIdx = flatResults.findIndex(f => f.id === item.id && f.category === item.category);
                    const isSel = gIdx === selectedIndex;
                    const isHov = hoveredId === item.id + item.category;
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id + item.category}
                        onMouseEnter={() => setHoveredId(item.id + item.category)}
                        onMouseLeave={() => setHoveredId(null)}
                        className={`flex items-center justify-between px-2 py-2.5 rounded-xl cursor-pointer transition-all select-none group active:scale-[0.98] ${
                          isSel ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20" : "hover:bg-slate-50 dark:hover:bg-white/5"
                        }`}
                      >
                        <div
                          className="flex items-center gap-3 min-w-0 flex-1"
                          onClick={() => { if (item.isExternal) window.open(item.route, "_blank"); else navigate(item.route); setIsOpen(false); }}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSel ? "bg-emerald-100 dark:bg-emerald-500/20" : "bg-slate-100 dark:bg-white/10"}`}>
                            <Icon className={`w-4 h-4 ${isSel ? "text-emerald-600" : "text-slate-500 dark:text-slate-400"}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[14px] font-semibold text-slate-800 dark:text-white truncate">{item.title || item.name || item.full_name}</p>
                            <p className="text-[12px] text-slate-400 truncate mt-0.5">
                              {item.case_number || item.email || item.user_email || item.description || item.status || "View details"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {(isHov || isSel) && (
                            <button
                              onClick={e => { e.stopPropagation(); handleAskAI(item.title || item.name || item.full_name, item); }}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 dark:border-emerald-500/20 transition-all"
                            >
                              <Bot className="w-3 h-3" /> Ask AI
                            </button>
                          )}
                          <ArrowRight className={`w-4 h-4 transition-colors ${isSel ? "text-emerald-400" : "text-slate-200 dark:text-slate-700 group-hover:text-slate-400"}`} />
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
    </>
  );

  /* ─────────────────────────────────────────────────────────────────
     MOBILE: Native bottom-sheet design
  ───────────────────────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div
        className="fixed inset-0 z-[200] flex flex-col justify-end"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        onClick={e => { if (e.target === e.currentTarget) setIsOpen(false); }}
      >
        <style>{`
          @keyframes sheetUp {
            from { transform: translateY(100%); }
            to   { transform: translateY(0); }
          }
        `}</style>
        <div
          style={{
            background: "rgba(255,255,255,0.98)",
            borderRadius: "24px 24px 0 0",
            animation: "sheetUp 0.28s cubic-bezier(0.22,1,0.36,1)",
            maxHeight: "90dvh",
            display: "flex",
            flexDirection: "column",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
          className="dark:bg-[#0F1420] w-full flex flex-col"
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-white/20" />
          </div>

          {/* Search input */}
          <div className="flex items-center gap-3 px-4 pt-3 pb-4 border-b border-slate-100 dark:border-white/10 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/30">
              <Search className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
            </div>
            <input
              ref={inputRef}
              type="text"
              inputMode="search"
              placeholder="Search or ask anything…"
              className="flex-1 bg-transparent border-0 outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-[16px] font-medium min-w-0"
              style={{ fontSize: 16 /* prevent iOS zoom */ }}
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query ? (
              <button onClick={() => setQuery("")} className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0 active:scale-90 transition-transform">
                <X className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              </button>
            ) : (
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-400 text-sm font-semibold active:scale-90 transition-transform">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-3 py-3" style={{ WebkitOverflowScrolling: "touch" }}>
            <ResultsContent />
          </div>

          {/* Footer pill */}
          <div className="px-4 py-3 flex items-center justify-between shrink-0 border-t border-slate-100 dark:border-white/10">
            <span className="text-[12px] text-slate-400">Search your workspace</span>
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600">
              <div className="w-5 h-5 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-500/30">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              Spotlight
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────
     DESKTOP: Premium floating modal
  ───────────────────────────────────────────────────────────────── */
  return (
    <div
      className="fixed inset-0 z-[200] flex justify-center pt-[8vh] px-4 pb-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) setIsOpen(false); }}
    >
      <style>{`
        @keyframes spotlightIn {
          from { opacity: 0; transform: scale(0.96) translateY(-8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      <div
        className="w-full max-w-[680px] flex flex-col max-h-[72vh] overflow-hidden dark:bg-[#0F1420] dark:border-white/[0.07]"
        style={{
          background: "rgba(255,255,255,0.97)",
          borderRadius: 20,
          boxShadow: "0 32px 80px rgba(0,0,0,0.22), 0 2px 0 rgba(255,255,255,0.8) inset",
          border: "1px solid rgba(0,0,0,0.08)",
          animation: "spotlightIn 0.18s cubic-bezier(0.22,1,0.36,1)",
        }}
        onKeyDown={handleKeyNavigation}
      >
        {/* Input bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.06] dark:border-white/10 shrink-0" style={{ minHeight: 64 }}>
          <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/30">
            <Search className="w-4 h-4 text-white" />
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search cases, clients, tasks, or team members..."
            className="flex-1 bg-transparent border-0 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-0 font-medium min-w-0"
            style={{ fontSize: 16, paddingLeft: 0 }}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-2 shrink-0">
            {query && (
              <button onClick={() => setQuery("")} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
            <kbd className="text-[11px] bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 font-semibold leading-none select-none">ESC</kbd>
          </div>
        </div>

        {/* Scrollable results */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <ResultsContent />
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 flex items-center justify-between select-none shrink-0 border-t border-black/[0.05] dark:border-white/10"
          style={{ background: "rgba(248,250,252,0.8)" }}
        >
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            {[["↑↓","navigate"],["↵","open"],["ESC","close"]].map(([k, l]) => (
              <span key={k} className="flex items-center gap-1.5 font-medium">
                <kbd className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-md px-1.5 py-0.5 text-[10px] shadow-sm">{k}</kbd>
                <span>{l}</span>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600">
            <div className="w-5 h-5 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-500/30">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            Spotlight
          </div>
        </div>
      </div>
    </div>
  );
}
