import { OrbitLoader } from "@/components/ui/orbit-loader";
import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, FileText, User, Users, Calendar, X,
  ShieldAlert, ArrowRight, Building2, CheckSquare, Layers, Receipt, ShieldCheck, ChevronRight
} from "lucide-react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

const QUICK_FILTERS = [
  { icon: Building2, label: "Properties & Land", query: "land" },
  { icon: User,        label: "Active Clients",     query: "client" },
  { icon: CheckSquare, label: "Pending Tasks",      query: "task" },
  { icon: Receipt,     label: "Invoices & Deals",   query: "deal" },
  { icon: Users,       label: "Team & Staff",       query: "staff" },
];

export default function SpotlightSearch() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({
    properties: [],
    clients: [],
    leads: [],
    deals: [],
    tasks: [],
    staff: [],
    invoices: []
  });
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
      setResults({
        properties: [],
        clients: [],
        leads: [],
        deals: [],
        tasks: [],
        staff: [],
        invoices: []
      });
    }
  }, [isOpen]);

  // Debounced Universal Search across active real estate entities
  useEffect(() => {
    if (!query.trim()) {
      setResults({
        properties: [],
        clients: [],
        leads: [],
        deals: [],
        tasks: [],
        staff: [],
        invoices: []
      });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const q = query.toLowerCase().trim();

        const [
          propsRes,
          clientsRes,
          leadsRes,
          dealsRes,
          tasksRes,
          staffRes
        ] = await Promise.all([
          // 1. Properties & Land
          Promise.resolve(
            supabase
              .from('univ_re_properties')
              .select('id, title, property_type, address, price, status')
              .or(`title.ilike.%${q}%,address.ilike.%${q}%`)
              .limit(4)
          ).catch(() => ({ data: [] })),

          // 2. Clients
          Promise.resolve(
            supabase
              .from('univ_re_clients')
              .select('id, full_name, email, phone, status')
              .or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
              .limit(4)
          ).catch(() => ({ data: [] })),

          // 3. Leads
          Promise.resolve(
            supabase
              .from('univ_re_leads')
              .select('id, first_name, last_name, email, phone, status')
              .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%`)
              .limit(4)
          ).catch(() => ({ data: [] })),

          // 4. Pipelines / Deals
          Promise.resolve(
            supabase
              .from('case_pipeline_states')
              .select('id, title, stage, amount, client_name')
              .or(`title.ilike.%${q}%,client_name.ilike.%${q}%`)
              .limit(4)
          ).catch(() => ({ data: [] })),

          // 5. Tasks
          Promise.resolve(
            supabase
              .from('tasks')
              .select('id, title, status, due_date')
              .ilike('title', `%${q}%`)
              .limit(4)
          ).catch(() => ({ data: [] })),

          // 6. Staff / Team
          Promise.resolve(
            supabase
              .from('staff_records')
              .select('id, full_name, user_email, department')
              .or(`full_name.ilike.%${q}%,user_email.ilike.%${q}%`)
              .limit(4)
          ).catch(() => ({ data: [] })),
        ]);

        setResults({
          properties: propsRes?.data || [],
          clients:    clientsRes?.data || [],
          leads:      leadsRes?.data || [],
          deals:      dealsRes?.data || [],
          tasks:      tasksRes?.data || [],
          staff:      staffRes?.data || [],
          invoices:   []
        });
      } catch (err) {
        console.error("Universal search failed", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, companyId]);

  const flatResults = [
    ...results.properties.map(item => ({
      ...item,
      category: "Properties",
      name: item.title,
      subtitle: item.address || item.property_type || item.status,
      route: `/real-estate/properties`,
      icon: Building2,
    })),
    ...results.deals.map(item => ({
      ...item,
      category: "Deals & Pipelines",
      name: item.title || "Deal Record",
      subtitle: `${item.client_name ? item.client_name + ' · ' : ''}${item.stage || 'Pipeline'}`,
      route: `/pipeline`,
      icon: Layers,
    })),
    ...results.clients.map(item => ({
      ...item,
      category: "Clients",
      name: item.full_name || item.name,
      subtitle: item.email || item.phone || item.status || "Client",
      route: `/real-estate/clients`,
      icon: User,
    })),
    ...results.leads.map(item => ({
      ...item,
      category: "CRM Leads",
      name: `${item.first_name || ''} ${item.last_name || ''}`.trim() || "Lead",
      subtitle: item.email || item.phone || item.status || "Lead",
      route: `/real-estate/crm-leads`,
      icon: Users,
    })),
    ...results.tasks.map(item => ({
      ...item,
      category: "Tasks",
      name: item.title,
      subtitle: `Status: ${item.status || 'Pending'} · Due: ${item.due_date || 'No date'}`,
      route: `/tasks`,
      icon: CheckSquare,
    })),
    ...results.staff.map(item => ({
      ...item,
      category: "Team & Staff",
      name: item.full_name,
      subtitle: item.department || item.user_email || "Staff Member",
      route: `/hr`,
      icon: ShieldCheck,
    })),
  ];

  const handleKeyNavigation = (e) => {
    if (!flatResults.length) return;
    if (e.key === "ArrowDown")  { e.preventDefault(); setSelectedIndex(p => (p + 1) % flatResults.length); }
    if (e.key === "ArrowUp")    { e.preventDefault(); setSelectedIndex(p => (p - 1 + flatResults.length) % flatResults.length); }
    if (e.key === "Enter")      {
      e.preventDefault();
      const s = flatResults[selectedIndex];
      if (s) {
        navigate(s.route);
        setIsOpen(false);
      }
    }
  };

  if (!isOpen) return null;

  const hasResults = flatResults.length > 0;

  const ResultsContent = () => (
    <>
      {loading ? (
        <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
          <OrbitLoader size="md" />
          <span className="text-xs font-semibold">Searching vault records...</span>
        </div>
      ) : !hasResults ? (
        <div className="py-6 flex flex-col items-center gap-1 text-center px-4">
          {query ? (
            <>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-2">
                <ShieldAlert className="w-6 h-6 text-amber-500" />
              </div>
              <p className="font-bold text-foreground text-[15px]">No records found</p>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed mt-1">
                No properties, clients, leads, deals or tasks matching <span className="font-semibold text-foreground">"{query}"</span>.
              </p>
            </>
          ) : (
            /* Fast Category Jump Pills */
            <div className="w-full pt-1 pb-2">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3 text-left px-1">
                Quick vault categories
              </p>
              <div className="space-y-1">
                {QUICK_FILTERS.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(f.query)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors text-left group active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <f.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-[13.5px] font-semibold text-foreground group-hover:text-primary transition-colors flex-1 text-left">
                      {f.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 p-1">
          {["Properties", "Deals & Pipelines", "Clients", "CRM Leads", "Tasks", "Team & Staff"].map(cat => {
            const catItems = flatResults.filter(item => item.category === cat);
            if (!catItems.length) return null;
            return (
              <div key={cat}>
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] px-2 pb-1.5 select-none">{cat}</h4>
                <div className="space-y-1">
                  {catItems.map((item) => {
                    const gIdx = flatResults.findIndex(f => f.id === item.id && f.category === item.category);
                    const isSel = gIdx === selectedIndex;
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id + item.category}
                        onMouseEnter={() => setHoveredId(item.id + item.category)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => { navigate(item.route); setIsOpen(false); }}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all select-none group active:scale-[0.98] ${
                          isSel ? "bg-[#005A9C]/10 border border-[#005A9C]/30 text-foreground" : "hover:bg-muted/50 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSel ? "bg-[#005A9C] text-white shadow-sm" : "bg-muted text-muted-foreground"}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13.5px] font-bold text-foreground truncate">{item.name}</p>
                            <p className="text-[11.5px] text-muted-foreground truncate mt-0.5">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className={`w-4 h-4 transition-colors shrink-0 ml-2 ${isSel ? "text-[#005A9C]" : "text-muted-foreground/30 group-hover:text-foreground"}`} />
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
     MOBILE: Native bottom-sheet search
  ───────────────────────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div
        className="fixed inset-0 z-[200] flex flex-col justify-end"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
        onClick={e => { if (e.target === e.currentTarget) setIsOpen(false); }}
      >
        <div
          style={{
            borderRadius: "24px 24px 0 0",
            maxHeight: "90dvh",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
          className="bg-card border-t border-border w-full flex flex-col shadow-2xl animate-in slide-in-from-bottom-5 duration-200"
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Search input */}
          <div className="flex items-center gap-2.5 px-4 pt-2 pb-3 border-b border-border/80 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#005A9C] flex items-center justify-center shrink-0 shadow-sm text-white">
              <Search className="w-4.5 h-4.5" />
            </div>
            <input
              ref={inputRef}
              type="text"
              inputMode="search"
              placeholder="Search properties, clients, leads, tasks..."
              className="flex-1 bg-transparent border-0 focus:ring-0 focus:border-0 !border-none !outline-none !ring-0 !shadow-none text-foreground placeholder:text-muted-foreground text-[16px] font-medium min-w-0"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query ? (
              <button onClick={() => setQuery("")} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 active:scale-90 transition-transform">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            ) : (
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center shrink-0 text-muted-foreground text-sm font-semibold active:scale-90 transition-transform">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-3 py-3" style={{ WebkitOverflowScrolling: "touch" }}>
            <ResultsContent />
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 flex items-center justify-between shrink-0 border-t border-border/80 text-[11px] text-muted-foreground">
            <span>Power Vault Search</span>
            <span className="font-semibold text-[#005A9C]">JCL Office</span>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────
     DESKTOP: Floating search modal
  ───────────────────────────────────────────────────────────────── */
  return (
    <div
      className="fixed inset-0 z-[200] flex justify-center pt-[10vh] px-4 pb-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) setIsOpen(false); }}
    >
      <div
        className="w-full max-w-[620px] flex flex-col max-h-[72vh] overflow-hidden bg-card border border-border/80 rounded-2xl shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150"
        onKeyDown={handleKeyNavigation}
      >
        {/* Input bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/80 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-[#005A9C] flex items-center justify-center shrink-0 shadow-xs text-white">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search properties, clients, leads, pipelines, tasks..."
            className="flex-1 bg-transparent border-0 focus:ring-0 focus:border-0 !border-none !outline-none !ring-0 !shadow-none text-foreground placeholder:text-muted-foreground font-medium text-sm min-w-0"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-2 shrink-0">
            {query && (
              <button onClick={() => setQuery("")} className="p-1 hover:bg-muted rounded-lg transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <kbd className="text-[10px] bg-muted text-muted-foreground border border-border rounded-md px-1.5 py-0.5 font-bold leading-none select-none">ESC</kbd>
          </div>
        </div>

        {/* Scrollable results */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <ResultsContent />
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 flex items-center justify-between select-none shrink-0 border-t border-border/80 bg-muted/30 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd className="bg-background border border-border px-1 py-0.5 rounded text-[9px] font-mono">↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="bg-background border border-border px-1 py-0.5 rounded text-[9px] font-mono">↵</kbd> select</span>
          </div>
          <span className="font-semibold text-foreground">Power Vault Search</span>
        </div>
      </div>
    </div>
  );
}
