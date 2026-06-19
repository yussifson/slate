import React, { useState, useEffect, useMemo} from 'react';
import { useCompanyId} from '@/hooks/useCompanyId';

import { supabase} from "@/api/supabaseClient";
import { motion} from 'framer-motion';
import {
 Plus, Edit3, Check, Trash2, LayoutGrid, XCircle, X,
 Database, TrendingUp, TrendingDown, Users, Activity,
 Clock, Zap, BarChart2, AlertTriangle, RefreshCw,
} from 'lucide-react';
import {
 AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth} from 'date-fns';
import { OrbitLoader } from "@/components/ui/orbit-loader";

// ─── Data Sources ──────────────────────────────────────────────────────────────
const AVAILABLE_SOURCES = [
 { label: 'Employees', table: 'univ_hr_employees', icon: Users},
 { label: 'CRM Leads', table: 'univ_crm_leads', icon: TrendingUp},
 { label: 'Projects', table: 'univ_projects', icon: Activity},
 { label: 'Support Tickets', table: 'univ_support_tickets', icon: Database},
 { label: 'Inventory Items', table: 'univ_inventory', icon: Database},
 { label: 'Assets', table: 'univ_assets', icon: Database},
 { label: 'Invoices', table: 'univ_invoices', icon: Database},
 { label: 'Procurement POs', table: 'univ_procurement', icon: Database},
 { label: 'Payroll Records', table: 'univ_payroll', icon: Database},
 { label: 'Bookings', table: 'univ_bookings', icon: Database},
 { label: 'Recruitment', table: 'univ_recruitment', icon: Users},
 { label: 'Attendance', table: 'univ_attendance', icon: Activity},
];

const DEFAULT_LAYOUT = [
 { id: '1', title: 'Total Employees', table: 'univ_hr_employees', type: 'metric'},
 { id: '2', title: 'Active CRM Leads', table: 'univ_crm_leads', type: 'metric'},
 { id: '3', title: 'Support Tickets', table: 'univ_support_tickets', type: 'metric'},
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function monthRange(monthsAgo) {
 const d = subMonths(new Date(), monthsAgo);
 return { start: startOfMonth(d), end: endOfMonth(d), label: format(d, 'MMM')};
}

function trendPercent(current, previous) {
 if (!previous || previous === 0) return current > 0 ? 100 : 0;
 return Math.round(((current - previous) / previous) * 100);
}

// ─── Custom Tooltip for AreaChart ──────────────────────────────────────────────
function CustomTooltip({ active, payload, label}) {
 if (!active || !payload?.length) return null;
 return (
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl px-3 py-2 text-xs tracking-[0.04em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <p className="font-semibold text-foreground mb-1">{label}</p>
 {payload.map((p) => (
 <p key={p.dataKey} className="text-[#71717a] dark:text-gray-400">
 <span className="font-semibold text-primary">{p.value}</span> records
 </p>
 ))}
 </div>
 );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function UnivDashboard({
 title = 'Dashboard',
 subtitle = 'Dynamic overview of your workspace.',
}) {
 const companyId = useCompanyId();

 const [isEditing, setIsEditing] = useState(false);
 const [layout, setLayout] = useState([]);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [widgetData, setWidgetData] = useState({}); // { [id]: { current, previous, recentRecords, monthlyActivity}}
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [newWidget, setNewWidget] = useState({ title: '', table: 'univ_hr_employees', type: 'metric'});
 const [saveStatus, setSaveStatus] = useState('');
 const [lastSynced, setLastSynced] = useState(null);

 const [dismissedInsights, setDismissedInsights] = useState(() => {
 try {
 const stored = localStorage.getItem(`dismissed_insights_${companyId}`);
 return stored ? JSON.parse(stored) : {};
} catch { return {};}
});

 const LOCAL_KEY = `dashboard_layout_${companyId}`;

 // ─── Fetch Layout ────────────────────────────────────────────────────────────
 useEffect(() => {
 if (companyId) fetchLayout();
}, [companyId]);

 const fetchLayout = async () => {
 setLoading(true);
 try {
 const local = localStorage.getItem(LOCAL_KEY);
 if (local) {
 const parsed = JSON.parse(local);
 setLayout(parsed);
 fetchAllWidgetData(parsed);
}

 try {
 const { data, error} = await supabase
 .from('univ_dashboard_configs')
 .select('layout')
 .eq('company_id', companyId)
 .maybeSingle();

 if (!error && data?.layout?.length > 0) {
 localStorage.setItem(LOCAL_KEY, JSON.stringify(data.layout));
 setLayout(data.layout);
 fetchAllWidgetData(data.layout);
} else if (!local) {
 setLayout(DEFAULT_LAYOUT);
 fetchAllWidgetData(DEFAULT_LAYOUT);
}
} catch {
 if (!local) {
 setLayout(DEFAULT_LAYOUT);
 fetchAllWidgetData(DEFAULT_LAYOUT);
}
}
} catch (err) {
 console.error('Dashboard load error:', err);
 const local = localStorage.getItem(LOCAL_KEY);
 const fallback = local ? JSON.parse(local) : DEFAULT_LAYOUT;
 setLayout(fallback);
 fetchAllWidgetData(fallback);
} finally {
 setLoading(false);
}
};

 // ─── Fetch Rich Widget Data ──────────────────────────────────────────────────
 const fetchAllWidgetData = async (currentLayout) => {
 if (!companyId) return;
 const now = new Date();
 const thisMonthStart = startOfMonth(now);
 const thisMonthEnd = endOfMonth(now);
 const lastMonthStart = startOfMonth(subMonths(now, 1));
 const lastMonthEnd = endOfMonth(subMonths(now, 1));

 // Build 6-month ranges
 const sixMonthRanges = Array.from({ length: 6}, (_, i) => monthRange(5 - i));

 const newData = {};
 for (const w of currentLayout) {
 if (w.type !== 'metric') continue;
 try {
 // Current total count
 const { count: current} = await supabase
 .from(w.table)
 .select('*', { count: 'exact', head: true})
 .eq('company_id', companyId);

 // This month count
 const { count: thisMonth} = await supabase
 .from(w.table)
 .select('*', { count: 'exact', head: true})
 .eq('company_id', companyId)
 .gte('created_at', thisMonthStart.toISOString())
 .lte('created_at', thisMonthEnd.toISOString());

 // Last month count
 const { count: lastMonth} = await supabase
 .from(w.table)
 .select('*', { count: 'exact', head: true})
 .eq('company_id', companyId)
 .gte('created_at', lastMonthStart.toISOString())
 .lte('created_at', lastMonthEnd.toISOString());

 // 5 most recent records
 const { data: recent} = await supabase
 .from(w.table)
 .select('id, name, title, created_at')
 .eq('company_id', companyId)
 .order('created_at', { ascending: false})
 .limit(5);

 // Monthly activity for chart (last 6 months)
 const monthlyActivity = [];
 for (const range of sixMonthRanges) {
 const { count: cnt} = await supabase
 .from(w.table)
 .select('*', { count: 'exact', head: true})
 .eq('company_id', companyId)
 .gte('created_at', range.start.toISOString())
 .lte('created_at', range.end.toISOString());
 monthlyActivity.push({ month: range.label, records: cnt ?? 0});
}

 newData[w.id] = {
 current: current ?? 0,
 thisMonth: thisMonth ?? 0,
 lastMonth: lastMonth ?? 0,
 trend: trendPercent(thisMonth ?? 0, lastMonth ?? 0),
 recentRecords: recent ?? [],
 monthlyActivity,
};
} catch {
 newData[w.id] = {
 current: 'N/A', thisMonth: 0, lastMonth: 0, trend: 0,
 recentRecords: [], monthlyActivity: [],
};
}
}

 setWidgetData((prev) => ({ ...prev, ...newData}));
 setLastSynced(new Date());
};

 // ─── Save Layout ─────────────────────────────────────────────────────────────
 const saveLayout = async (newLayout) => {
 setSaving(true);
 setSaveStatus('saving');
 localStorage.setItem(LOCAL_KEY, JSON.stringify(newLayout));
 setLayout(newLayout);

 try {
 const { error} = await supabase
 .from('univ_dashboard_configs')
 .upsert({ company_id: companyId, layout: newLayout}, { onConflict: 'company_id'});
 if (error) throw error;
 setSaveStatus('saved');
} catch (e) {
 console.warn('Supabase dashboard save failed:', e.message);
 setSaveStatus('local');
} finally {
 setSaving(false);
 setTimeout(() => setSaveStatus(''), 2500);
}
};

 const addWidget = () => {
 if (!newWidget.title) return;
 const w = { id: Date.now().toString(), ...newWidget};
 const updated = [...layout, w];
 saveLayout(updated);
 fetchAllWidgetData([w]);
 setIsModalOpen(false);
 setNewWidget({ title: '', table: 'univ_hr_employees', type: 'metric'});
};

 const removeWidget = (id) => {
 saveLayout(layout.filter((w) => w.id !== id));
};

 // ─── Derived values ──────────────────────────────────────────────────────────
 const statusLabel =
 saveStatus === 'saving' ? 'Saving...' :
 saveStatus === 'saved' ? '✓ Saved to cloud' :
 saveStatus === 'local' ? '✓ Saved locally' : '';

 const totalRecordsThisMonth = useMemo(
 () => layout.reduce((sum, w) => sum + (widgetData[w.id]?.thisMonth ?? 0), 0),
 [layout, widgetData],
 );

 const handleDismissInsight = (widgetId) => {
 const updated = { ...dismissedInsights, [widgetId]: Date.now()};
 setDismissedInsights(updated);
 try {
 localStorage.setItem(`dismissed_insights_${companyId}`, JSON.stringify(updated));
} catch {}
};

 const zeroWidgets = layout.filter((w) => {
 if (widgetData[w.id] === undefined || widgetData[w.id].current !== 0) return false;
 const dismissedAt = dismissedInsights[w.id];
 if (dismissedAt && Date.now() - dismissedAt < 24 * 60 * 60 * 1000) return false;
 return true;
});

 // Primary widget for Recent Records panel (first widget)
 const primaryWidget = layout[0];
 const primaryData = primaryWidget ? widgetData[primaryWidget.id] : null;

 // Chart: aggregate activity across all widgets
 const combinedChartData = useMemo(() => {
 if (!layout.length) return [];
 const months = ['', '', '', '', '', ''];
 const counts = [0, 0, 0, 0, 0, 0];
 layout.forEach((w) => {
 const ma = widgetData[w.id]?.monthlyActivity ?? [];
 ma.forEach((m, i) => {
 months[i] = m.month;
 counts[i] += m.records;
});
});
 return months.map((month, i) => ({ month, records: counts[i]}));
}, [layout, widgetData]);

 // ─── Render ──────────────────────────────────────────────────────────────────
 return (
 <div className="flex flex-col h-full bg-background overflow-y-auto custom-scrollbar pb-8">

 {/* ── Header ─────────────────────────────────────────────────────────── */}
 <div className="view-header flex items-center justify-between mb-6 shrink-0 px-1 pt-2 gap-4 flex-wrap">
 <div>
 <h2 className="text-2xl font-semibold text-foreground tracking-tight tracking-[-0.02em]">{title}</h2>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">{subtitle}</p>
 </div>
 <div className="flex items-center gap-3">
 {saveStatus && (
 <span
 className={`text-xs font-semibold px-3 py-1.5 rounded-xl ${
 saveStatus === 'saving'
 ? 'bg-muted text-[#71717a] dark:text-gray-400 animate-pulse'
 : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
}`}
 >
 {statusLabel}
 </span>
 )}
 {isEditing ? (
 <>
 <button
 onClick={() => setIsModalOpen(true)}
 className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-xl text-sm font-semibold hover:bg-secondary/80 transition-colors"
 >
 <Plus className="w-4 h-4" /> Add Widget
 </button>
 <button
 onClick={() => setIsEditing(false)}
 className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
 >
 <Check className="w-4 h-4" /> Done
 </button>
 </>
 ) : (
 <>
 <button
 onClick={() => fetchAllWidgetData(layout)}
 title="Refresh data"
 className="flex items-center gap-2.5 px-3 py-2 bg-muted text-[#71717a] dark:text-gray-400 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors"
 >
 <RefreshCw className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={() => setIsEditing(true)}
 className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm font-semibold hover:bg-muted/80 transition-colors"
 >
 <Edit3 className="w-4 h-4" /> Edit Dashboard
 </button>
 </>
 )}
 </div>
 </div>

 {loading ? (
 <div className="flex-1 flex items-center justify-center">
 <OrbitLoader size="md" />
 ) : (
 <>
 {/* ── AI Insight Banner ─────────────────────────────────────────────── */}
 {zeroWidgets.length > 0 && (
 <motion.div
 initial={{ opacity: 0, y: -8}}
 animate={{ opacity: 1, y: 0}}
 className="mb-5 flex flex-col gap-2"
 >
 {zeroWidgets.map((w) => (
 <div
 key={w.id}
 className="flex items-start justify-between gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-[0.5px] border-black/9 dark:border-white/8 border-amber-200 dark:border-amber-800/40 rounded-xl text-amber-800 dark:text-amber-300 text-sm"
 >
 <div className="flex items-start gap-3">
 <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
 <p>
 <span className="font-semibold">{w.title}</span> has no records yet.
 Start adding data to see trends here.
 </p>
 </div>
 <button onClick={() => handleDismissInsight(w.id)} className="text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors p-0.5 rounded-lg hover:bg-amber-200/50 dark:hover:bg-amber-900/50 shrink-0" title="Dismiss for 24h">
 <X className="w-4 h-4" />
 </button>
 </div>
 ))}
 </motion.div>
 )}

 {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
 {layout.map((w, idx) => {
 const source = AVAILABLE_SOURCES.find((s) => s.table === w.table);
 const Icon = source?.icon || Database;
 const data = widgetData[w.id];
 const count = data?.current;
 const trend = data?.trend ?? 0;
 const isUp = trend >= 0;
 const TIcon = isUp ? TrendingUp : TrendingDown;

 return (
 <motion.div
 initial={{ opacity: 0, y: 12}}
 animate={{ opacity: 1, y: 0}}
 transition={{ delay: idx * 0.06}}
 key={w.id}
 className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-5 transition- relative group hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 >
 {isEditing && (
 <button
 onClick={() => removeWidget(w.id)}
 className="absolute -top-2 -right-2 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full p-1.5 hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors z-10"
 >
 <XCircle className="w-4 h-4" />
 </button>
 )}

 {/* Top row */}
 <div className="flex justify-between items-start mb-3">
 <p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider leading-tight pr-2 tracking-[0.04em]">
 {w.title}
 </p>
 <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
 <Icon className="w-5 h-5" />
 </div>
 </div>

 {/* Count */}
 <h3 className="text-3xl font-black text-foreground tabular-nums tracking-[-0.02em]">
 {count !== undefined ? (
 count === 'N/A' ? (
 <span className="text-base font-medium text-[#71717a] dark:text-gray-400">N/A</span>
 ) : (
 count.toLocaleString()
 )
 ) : (
 <span className="text-[#71717a] dark:text-gray-400 text-base font-medium animate-pulse">
 Loading…
 </span>
 )}
 </h3>

 {/* Trend row */}
 {data && count !== 'N/A' && (
 <div className="mt-3 pt-3 border-t border-primary/40 flex items-center justify-between">
 <span className="text-xs text-[#71717a] dark:text-gray-400 flex items-center gap-2 tracking-[0.04em]">
 <LayoutGrid className="w-3 h-3" />
 {source?.label || w.table}
 </span>
 <span
 className={`flex items-center gap-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
 isUp
 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
 : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
}`}
 >
 <TIcon className="w-3 h-3" />
 {Math.abs(trend)}% vs last mo.
 </span>
 </div>
 )}

 {/* Fallback footer when data not yet loaded */}
 {!data && (
 <div className="mt-3 pt-3 border-t border-primary/40 flex items-center text-xs font-medium text-[#71717a] dark:text-gray-400 tracking-[0.04em]">
 <LayoutGrid className="w-3.5 h-3.5 mr-1" />
 {source?.label || w.table}
 </div>
 )}
 </motion.div>
 );
})}

 {layout.length === 0 && !isEditing && (
 <div className="col-span-full py-20 text-center border-2 border-dashed border-primary/40 rounded-2xl">
 <h3 className="text-lg font-semibold text-foreground">Your Dashboard is empty</h3>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1 mb-4">
 Click "Edit Dashboard" to add your first widget.
 </p>
 <button
 onClick={() => setIsEditing(true)}
 className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
 >
 <Edit3 className="w-4 h-4" /> Edit Dashboard
 </button>
 </div>
 )}
 </div>

 {/* ── Charts + Recent Records (2-col) ──────────────────────────────── */}
 {layout.length > 0 && (
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

 {/* Activity AreaChart — spans 2/3 */}
 <motion.div
 initial={{ opacity: 0, y: 12}}
 animate={{ opacity: 1, y: 0}}
 transition={{ delay: 0.15}}
 className="lg:col-span-2 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-5  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 >
 <div className="flex items-center justify-between mb-4">
 <div>
 <p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">
 Record Activity
 </p>
 <h3 className="text-sm font-semibold text-foreground mt-0.5">
 Creation trend over 6 months
 </h3>
 </div>
 <BarChart2 className="w-5 h-5 text-primary/60" />
 </div>
 <ResponsiveContainer width="100%" height={200}>
 <AreaChart
 data={combinedChartData}
 margin={{ top: 5, right: 10, left: -20, bottom: 0}}
 >
 <defs>
 <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
 <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid
 strokeDasharray="3 3"
 stroke="hsl(var(--border))"
 vertical={false}
 />
 <XAxis
 dataKey="month"
 tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))'}}
 axisLine={false}
 tickLine={false}
 />
 <YAxis
 tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))'}}
 axisLine={false}
 tickLine={false}
 allowDecimals={false}
 />
 <Tooltip content={<CustomTooltip />} />
 <Area
 type="monotone"
 dataKey="records"
 stroke="hsl(var(--primary))"
 strokeWidth={2.5}
 fill="url(#areaGrad)"
 dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 0}}
 activeDot={{ r: 6}}
 />
 </AreaChart>
 </ResponsiveContainer>
 </motion.div>

 {/* Recent Records Panel — 1/3 */}
 <motion.div
 initial={{ opacity: 0, y: 12}}
 animate={{ opacity: 1, y: 0}}
 transition={{ delay: 0.2}}
 className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-5 flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 >
 <div className="flex items-center justify-between mb-4">
 <div>
 <p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">
 Recent Records
 </p>
 <h3 className="text-sm font-semibold text-foreground mt-0.5">
 {primaryWidget?.title || 'Primary Widget'}
 </h3>
 </div>
 <Clock className="w-4 h-4 text-primary/60" />
 </div>

 <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
 {primaryData?.recentRecords?.length > 0 ? (
 primaryData.recentRecords.map((rec, i) => {
 const label = rec.name || rec.title || `Record #${rec.id ?? i + 1}`;
 const date = rec.created_at
 ? format(new Date(rec.created_at), 'MMM d, yyyy')
 : '—';
 return (
 <div
 key={rec.id ?? i}
 className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/40 rounded-xl hover:bg-muted/70 transition-colors"
 >
 <p className="text-xs font-semibold text-foreground truncate tracking-[0.04em]">{label}</p>
 <span className="text-[10px] text-[#71717a] dark:text-gray-400 whitespace-nowrap">
 {date}
 </span>
 </div>
 );
})
 ) : (
 <p className="text-xs text-[#71717a] dark:text-gray-400 text-center py-6 tracking-[0.04em]">
 No records found.
 </p>
 )}
 </div>
 </motion.div>
 </div>
 )}

 {/* ── System Health Row ─────────────────────────────────────────────── */}
 {layout.length > 0 && (
 <motion.div
 initial={{ opacity: 0, y: 8}}
 animate={{ opacity: 1, y: 0}}
 transition={{ delay: 0.25}}
 className="grid grid-cols-1 sm:grid-cols-3 gap-3"
 >
 {/* Total Workslates */}
 <div className="flex items-center gap-3 px-4 py-3 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-2 bg-primary/10 text-primary rounded-xl">
 <LayoutGrid className="w-4 h-4" />
 </div>
 <div>
 <p className="text-[10px] font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">
 Workslates Active
 </p>
 <p className="text-sm font-black text-foreground">{layout.length}</p>
 </div>
 </div>

 {/* Last Synced */}
 <div className="flex items-center gap-3 px-4 py-3 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
 <Activity className="w-4 h-4" />
 </div>
 <div>
 <p className="text-[10px] font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">
 Last Synced
 </p>
 <p className="text-sm font-black text-foreground">
 {lastSynced ? format(lastSynced, 'h:mm a') : '—'}
 </p>
 </div>
 </div>

 {/* Growth this month */}
 <div className="flex items-center gap-3 px-4 py-3 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-2 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl">
 <Zap className="w-4 h-4" />
 </div>
 <div>
 <p className="text-[10px] font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">
 New Records (This Month)
 </p>
 <p className="text-sm font-black text-foreground">
 +{totalRecordsThisMonth.toLocaleString()}
 </p>
 </div>
 </div>
 </motion.div>
 )}
 </>
 )}

 {/* ── Add Widget Modal ──────────────────────────────────────────────────── */}
 {isModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm animate-in fade-in">
 <div className="bg-card w-full max-w-md rounded-2xl flex flex-col overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-5 border-b border-primary/40 flex justify-between items-center bg-muted/20">
 <h2 className="text-xl font-black text-foreground flex items-center gap-2">
 <LayoutGrid className="w-5 h-5 text-primary" /> Add Widget
 </h2>
 <button
 onClick={() => setIsModalOpen(false)}
 className="p-2 hover:bg-muted rounded-full text-[#71717a] dark:text-gray-400 transition-colors"
 >
 <XCircle className="w-5 h-5" />
 </button>
 </div>
 <div className="p-5 flex flex-col gap-4">
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">
 Widget Title
 </label>
 <input
 type="text"
 value={newWidget.title}
 onChange={(e) => setNewWidget({ ...newWidget, title: e.target.value})}
 placeholder="e.g. Total Active Leads"
 className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">
 Data Source
 </label>
 <select
 value={newWidget.table}
 onChange={(e) => setNewWidget({ ...newWidget, table: e.target.value})}
 className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"
 >
 {AVAILABLE_SOURCES.map((s) => (
 <option key={s.table} value={s.table}>{s.label}</option>
 ))}
 </select>
 </div>
 <div className="flex justify-end gap-3 mt-2 pt-5 border-t border-primary/40">
 <button
 onClick={() => setIsModalOpen(false)}
 className="h-10 px-5 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={addWidget}
 disabled={!newWidget.title}
 className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
 >
 Add Widget
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
