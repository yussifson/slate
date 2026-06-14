import React, { useState, useEffect} from 'react';
import { useCompanyId} from '@/hooks/useCompanyId';

import { supabase} from "@/api/supabaseClient";
import { motion} from 'framer-motion';
import { BarChart2, TrendingUp, Download, Loader2, RefreshCw, Database, AlertCircle} from 'lucide-react';

// Master map: component_id (from orbit build config) → real Supabase table name
const COMPONENT_TO_TABLE = {
 UnivCRM: { table: 'univ_crm_leads', label: 'CRM Leads'},
 UnivHREmployee: { table: 'univ_hr_employees', label: 'Employees'},
 UnivInvoice: { table: 'univ_invoices', label: 'Invoices'},
 UnivInventory: { table: 'univ_inventory', label: 'Inventory'},
 UnivPayroll: { table: 'univ_payroll', label: 'Payroll Records'},
 UnivRecruitment: { table: 'univ_recruitment', label: 'Recruitment'},
 UnivAttendance: { table: 'univ_attendance', label: 'Attendance'},
 UnivAssetManagement: { table: 'univ_assets', label: 'Assets'},
 UnivProcurement: { table: 'univ_procurement', label: 'Procurement'},
 UnivProject: { table: 'univ_projects', label: 'Projects'},
 UnivKanban: { table: 'univ_tasks', label: 'Tasks'},
 UnivDocument: { table: 'univ_documents', label: 'Documents'},
 UnivBooking: { table: 'univ_bookings', label: 'Bookings'},
 UnivPayment: { table: 'univ_payments', label: 'Payments'},
 UnivLeaveManagement: { table: 'univ_leave_requests', label: 'Leave Requests'},
 UnivAccessControl: { table: 'univ_accesscontrols', label: 'Users'},
 UnivSupportTicket: { table: 'univ_support_tickets', label: 'Support Tickets'},
 UnivFleet: { table: 'univ_fleet', label: 'Fleet Vehicles'},
 UnivDelivery: { table: 'univ_deliveries', label: 'Deliveries'},
 UnivBOM: { table: 'univ_boms', label: 'Bill of Materials'},
 UnivBOQ: { table: 'univ_boqs', label: 'Bill of Quantities'},
 UnivWarehouse: { table: 'univ_warehouses', label: 'Warehouses'},
 UnivContractor: { table: 'univ_contractors', label: 'Contractors'},
 UnivPatient: { table: 'univ_patients', label: 'Patients'},
 UnivEMR: { table: 'univ_emr', label: 'Medical Records'},
 UnivPrescription: { table: 'univ_prescriptions', label: 'Prescriptions'},
 UnivWard: { table: 'univ_wards', label: 'Ward Beds'},
 UnivStudent: { table: 'univ_students', label: 'Students'},
 UnivCourse: { table: 'univ_courses', label: 'Courses'},
 UnivLMS: { table: 'univ_lms', label: 'LMS Enrolments'},
 UnivGradebook: { table: 'univ_gradebook', label: 'Grades'},
 UnivRoom: { table: 'univ_rooms', label: 'Rooms'},
 UnivHousekeeping: { table: 'univ_housekeeping', label: 'Housekeeping Tasks'},
 UnivDining: { table: 'univ_dining', label: 'Dining Orders'},
 UnivPOS: { table: 'univ_pos', label: 'POS Sales'},
 UnivSubscription: { table: 'univ_subscriptions', label: 'Subscriptions'},
};

const COLORS = [
 'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500',
 'bg-rose-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
 'bg-teal-500', 'bg-orange-500', 'bg-fuchsia-500', 'bg-lime-500',
];

export default function UnivAnalytics({
 title = "Analytics & Reports",
 subtitle = "Live insights from your workspace data.",
}) {
 const companyId = useCompanyId();
 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [stats, setStats] = useState([]); // [{ label, count, table, color}]
 const [totalRecords, setTotalRecords] = useState(0);
 const [topModule, setTopModule] = useState(null);

 useEffect(() => {
 if (companyId) fetchAnalytics();
}, [companyId]);

 const fetchAnalytics = async () => {
 setLoading(true);
 try {
 // Step 1: Get the workspace's active features from orbit_build config
 const { data: configData} = await supabase
 .from('industry_records')
 .select('data')
 .eq('company_id', companyId)
 .eq('industry', 'orbit_build')
 .eq('record_type', 'workspace_config')
 .order('created_at', { ascending: false})
 .limit(1)
 .maybeSingle();

 const pages = configData?.data?.pages || [];
 const activeComponentIds = pages.map(p => p.component_id).filter(Boolean);

 // Step 2: Determine which tables to query based on active features
 let tablesToQuery = [];

 if (activeComponentIds.length > 0) {
 // Use workspace-specific features
 for (const compId of activeComponentIds) {
 if (COMPONENT_TO_TABLE[compId]) {
 tablesToQuery.push({ compId, ...COMPONENT_TO_TABLE[compId]});
}
}
}

 // If no orbit config, fall back to querying all known tables
 if (tablesToQuery.length === 0) {
 tablesToQuery = Object.entries(COMPONENT_TO_TABLE).map(([compId, info]) => ({ compId, ...info}));
}

 // Step 3: Query each table in parallel for counts
 const results = await Promise.all(
 tablesToQuery.map(async (item, i) => {
 try {
 const { count, error} = await supabase
 .from(item.table)
 .select('*', { count: 'exact', head: true})
 .eq('company_id', companyId);

 return {
 label: item.label,
 table: item.table,
 count: error ? null : (count ?? 0),
 color: COLORS[i % COLORS.length],
 hasError: !!error,
};
} catch {
 return { label: item.label, table: item.table, count: null, color: COLORS[i % COLORS.length], hasError: true};
}
})
 );

 // Filter to only tables that have data or exist (count !== null)
 const validStats = results.filter(r => r.count !== null && !r.hasError).sort((a, b) => b.count - a.count);
 const total = validStats.reduce((sum, s) => sum + s.count, 0);

 setStats(validStats);
 setTotalRecords(total);
 setTopModule(validStats[0] || null);
} catch (err) {
 console.error('Analytics error:', err);
} finally {
 setLoading(false);
 setRefreshing(false);
}
};

 const handleRefresh = () => {
 setRefreshing(true);
 fetchAnalytics();
};

 const handleExportCSV = () => {
 if (!stats.length) return;
 const csv = ['Module,Record Count', ...stats.map(s => `"${s.label}",${s.count}`)].join('\n');
 const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;'});
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url; a.download = 'workspace_analytics.csv'; a.click();
};
 const maxCount = stats.length > 0 ? Math.max(...stats.map(s => s.count), 1) : 1;

 return (
 <div className="flex flex-col h-full bg-background overflow-y-auto custom-scrollbar pb-8">
 {/* Header */}
 <div className="view-header flex flex-wrap items-center justify-between mb-6 shrink-0 px-1 gap-4">
 <div>
 <h2 className="text-2xl font-bold text-foreground tracking-tight">{title}</h2>
 <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
 </div>
 <div className="flex gap-3">
 <button
 onClick={handleRefresh}
 disabled={refreshing || loading}
 className="flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
 >
 <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
 </button>
 <button
 onClick={handleExportCSV}
 disabled={loading || !stats.length}
 className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 "
 >
 <Download className="w-4 h-4" /> Export CSV
 </button>
 </div>
 </div>

 {loading ? (
 <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
 <Loader2 className="w-8 h-8 animate-spin text-primary" />
 <p className="text-sm font-medium">Scanning your workslate data...</p>
 </div>
 ) : stats.length === 0 ? (
 <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground py-20 border-2 border-dashed border-border rounded-2xl">
 <AlertCircle className="w-10 h-10 opacity-40" />
 <p className="text-base font-bold text-foreground">No data found yet</p>
 <p className="text-sm text-center max-w-sm">Start adding records to your workslate slates and they will appear here automatically.</p>
 </div>
 ) : (
 <div className="space-y-6">

 {/* Summary KPI Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <motion.div initial={{ opacity: 0, y: 8}} animate={{ opacity: 1, y: 0}} className="bg-card border border-border rounded-2xl p-5 ">
 <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Records</p>
 <p className="text-4xl font-black text-foreground">{totalRecords.toLocaleString()}</p>
 <p className="text-xs text-muted-foreground mt-2">Across all active slates</p>
 </motion.div>
 <motion.div initial={{ opacity: 0, y: 8}} animate={{ opacity: 1, y: 0}} transition={{ delay: 0.05}} className="bg-card border border-border rounded-2xl p-5 ">
 <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Active Slates</p>
 <p className="text-4xl font-black text-foreground">{stats.length}</p>
 <p className="text-xs text-muted-foreground mt-2">Slates with data in this workslate</p>
 </motion.div>
 <motion.div initial={{ opacity: 0, y: 8}} animate={{ opacity: 1, y: 0}} transition={{ delay: 0.1}} className="bg-card border border-border rounded-2xl p-5 ">
 <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Top Slate</p>
 <p className="text-2xl font-black text-foreground truncate">{topModule?.label || '—'}</p>
 <p className="text-xs text-muted-foreground mt-2">{topModule ? `${topModule.count.toLocaleString()} records` : 'No data yet'}</p>
 </motion.div>
 </div>

 {/* Bar Chart — all modules */}
 <motion.div initial={{ opacity: 0, y: 8}} animate={{ opacity: 1, y: 0}} transition={{ delay: 0.15}} className="bg-card border border-border rounded-2xl p-6 ">
 <div className="flex items-center gap-2 mb-6">
 <BarChart2 className="w-5 h-5 text-primary" />
 <h3 className="text-lg font-bold text-foreground">Records by Slate</h3>
 </div>
 <div className="space-y-3">
 {stats.map((s, i) => (
 <div key={s.table}>
 <div className="flex justify-between items-center mb-1">
 <span className="text-sm font-semibold text-foreground">{s.label}</span>
 <span className="text-sm font-bold text-muted-foreground tabular-nums">{s.count.toLocaleString()}</span>
 </div>
 <div className="h-2.5 bg-muted rounded-full overflow-hidden">
 <motion.div
 initial={{ width: 0}}
 animate={{ width: `${Math.max((s.count / maxCount) * 100, s.count > 0 ? 2 : 0)}%`}}
 transition={{ delay: 0.2 + i * 0.04, duration: 0.5, ease: 'easeOut'}}
 className={`h-full rounded-full ${s.color}`}
 />
 </div>
 </div>
 ))}
 </div>
 </motion.div>

 {/* Breakdown Table */}
 <motion.div initial={{ opacity: 0, y: 8}} animate={{ opacity: 1, y: 0}} transition={{ delay: 0.25}} className="bg-card border border-border rounded-2xl overflow-hidden ">
 <div className="p-5 border-b border-border flex items-center gap-2 bg-muted/20">
 <TrendingUp className="w-5 h-5 text-muted-foreground" />
 <h3 className="text-lg font-bold text-foreground">Detailed Breakdown</h3>
 </div>
 <table className="w-full text-left text-sm">
 <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
 <tr>
 <th className="p-4 font-semibold">Slate</th>
 <th className="p-4 font-semibold">Table</th>
 <th className="p-4 font-semibold text-right">Records</th>
 <th className="p-4 font-semibold text-right">% of Total</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {stats.map((s, i) => (
 <tr key={s.table} className="hover:bg-muted/30 transition-colors">
 <td className="p-4">
 <div className="flex items-center gap-2">
 <div className={`w-2.5 h-2.5 rounded-full ${s.color} flex-shrink-0`} />
 <span className="font-semibold text-foreground">{s.label}</span>
 </div>
 </td>
 <td className="p-4 font-mono text-xs text-muted-foreground">{s.table}</td>
 <td className="p-4 text-right font-bold tabular-nums">{s.count.toLocaleString()}</td>
 <td className="p-4 text-right">
 <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-primary/10 text-primary">
 {totalRecords > 0 ? ((s.count / totalRecords) * 100).toFixed(1) : '0.0'}%
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </motion.div>

 </div>
 )}
 </div>
 );
}
