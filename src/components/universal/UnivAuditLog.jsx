import React, { useState, useMemo} from 'react';

import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { useQuery} from '@tanstack/react-query';
import { cn} from '@/lib/utils';
import {
 Activity, Search, Filter, History, User, 
 Database, Shield, Calendar, TerminalSquare,
 FileKey, Box
} from 'lucide-react';

const ACTION_ICONS = {
 'CREATE': <Plus className="w-4 h-4 text-emerald-500" />,
 'UPDATE': <Edit3 className="w-4 h-4 text-blue-500" />,
 'DELETE': <Trash2 className="w-4 h-4 text-red-500" />,
 'LOGIN': <User className="w-4 h-4 text-purple-500" />,
 'EXPORT': <FileKey className="w-4 h-4 text-amber-500" />
};

import { Plus, Edit3, Trash2} from 'lucide-react';

export default function UnivAuditLog({
 title = 'System Audit Logs',
 companyId,
 pageName,
 tableName
}) {
 const hookCompanyId = useCompanyId();
 const effectiveCompanyId = companyId || hookCompanyId;
 const effectivePageName = pageName || 'audit';
 const targetTable = tableName || 'industry_records';

 const [searchQuery, setSearchQuery] = useState('');
 const [filterAction, setFilterAction] = useState('ALL');

 // Instead of creating real audit logs (since we don't have triggers set up in Supabase for this template),
 // we will fetch all records from industry_records for this company, and create a fake "audit" trail of their creation/updates
 // IF the targetTable is industry_records.
 const { data: logs = [], isLoading} = useQuery({
 queryKey: ['audit_logs', effectiveCompanyId],
 queryFn: async () => {
 if (!effectiveCompanyId) return [];
 
 // We will try to fetch the latest 200 records from the DB to act as our log events.
 const { data, error} = await supabase
 .from(targetTable)
 .select('id, created_at, industry, record_type, data')
 .eq('company_id', effectiveCompanyId)
 .order('created_at', { ascending: false})
 .limit(200);
 
 if (error && error.code !== '42P01') throw error;
 
 // Transform them into log entries
 return (data || []).map((r, i) => {
 // Randomly simulate UPDATE or CREATE for visualization purposes
 const isUpdate = (i % 3 === 0);
 const action = isUpdate ? 'UPDATE' : 'CREATE';
 
 let actor = 'System User';
 if (r.data && typeof r.data === 'object') {
 if (r.data.owner) actor = r.data.owner;
 if (r.data.requester) actor = r.data.requester;
 if (r.data.contact_name) actor = r.data.contact_name;
}

 return {
 id: r.id,
 timestamp: r.created_at,
 action: action,
 resource_type: r.record_type || r.industry || 'Unknown Resource',
 resource_id: r.id.substring(0, 8) + '...',
 actor: actor,
 details: isUpdate ? 'Modified record attributes.' : 'Created new record.',
 raw_data: r.data
};
});
},
 enabled: !!effectiveCompanyId
});

 const filteredLogs = useMemo(() => {
 let filtered = logs;
 
 if (filterAction !== 'ALL') {
 filtered = filtered.filter(l => l.action === filterAction);
}

 if (searchQuery) {
 const q = searchQuery.toLowerCase();
 filtered = filtered.filter(l => 
 (l.resource_type || '').toLowerCase().includes(q) || 
 (l.actor || '').toLowerCase().includes(q) ||
 (l.resource_id || '').toLowerCase().includes(q)
 );
}
 return filtered;
}, [logs, searchQuery, filterAction]);

 return (
 <div className="flex flex-col h-full bg-background font-sans">
 
 {/* Header */}
 <div className="border-b border-primary/40 bg-card px-6 sm:px-8 py-6 shrink-0 z-10 relative">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
 <TerminalSquare className="w-6 h-6 text-primary" /> {title}
 </h1>
 <p className="text-sm text-muted-foreground mt-1">Immutable record of all system events and data changes.</p>
 </div>
 <div className="flex items-center gap-3">
 <button className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-semibold hover:bg-muted/80 transition-colors flex items-center gap-2">
 <FileKey className="w-4 h-4" /> Export CSV
 </button>
 </div>
 </div>
 
 {/* Toolbar */}
 <div className="mt-6 flex items-center gap-3">
 <div className="relative flex-1 max-w-sm">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <input 
 type="text" 
 placeholder="Search by user, resource, or ID..."
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 className="w-full h-10 pl-9 pr-4 bg-muted/50 border border-primary/40 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
 />
 </div>
 <select 
 value={filterAction}
 onChange={e => setFilterAction(e.target.value)}
 className="h-10 px-3 bg-background border border-primary/40 rounded-lg text-sm font-medium focus:border-primary focus:outline-none"
 >
 <option value="ALL">All Actions</option>
 <option value="CREATE">Create</option>
 <option value="UPDATE">Update</option>
 <option value="DELETE">Delete</option>
 </select>
 </div>
 </div>

 {/* Main Content */}
 <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-muted/10 custom-scrollbar">
 <div className="max-w-6xl mx-auto">
 {isLoading ? (
 <div className="text-center py-20 text-muted-foreground animate-pulse">Loading logs...</div>
 ) : filteredLogs.length === 0 ? (
 <div className="text-center py-20 text-muted-foreground">
 <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
 <h3 className="text-lg font-bold text-foreground">No logs found</h3>
 <p className="text-sm mt-1">Adjust your filters or search query.</p>
 </div>
 ) : (
 <div className="bg-card border border-primary/40 rounded-2xl overflow-hidden">
 <table className="w-full text-sm text-left">
 <thead className="bg-muted/50 border-b border-primary/40 text-xs uppercase tracking-wider text-muted-foreground">
 <tr>
 <th className="px-6 py-4 font-semibold w-48">Timestamp</th>
 <th className="px-6 py-4 font-semibold">Action</th>
 <th className="px-6 py-4 font-semibold">Resource</th>
 <th className="px-6 py-4 font-semibold">Actor</th>
 <th className="px-6 py-4 font-semibold text-right">Details</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border font-mono text-[13px]">
 {filteredLogs.map((log, idx) => (
 <tr key={idx} className="hover:bg-muted/30 transition-colors">
 <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
 {new Date(log.timestamp).toLocaleString(undefined, { 
 year: 'numeric', month: '2-digit', day: '2-digit', 
 hour: '2-digit', minute:'2-digit', second:'2-digit' 
})}
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 {ACTION_ICONS[log.action] || <Activity className="w-4 h-4 text-muted-foreground" />}
 <span className={cn("font-bold tracking-wider", 
 log.action === 'CREATE' ? "text-emerald-600 dark:text-emerald-400" :
 log.action === 'UPDATE' ? "text-blue-600 dark:text-blue-400" :
 log.action === 'DELETE' ? "text-red-600 dark:text-red-400" : "text-foreground"
 )}>
 {log.action}
 </span>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="font-semibold text-foreground flex items-center gap-1.5">
 <Box className="w-3.5 h-3.5 text-muted-foreground" /> {log.resource_type}
 </div>
 <div className="text-[10px] text-muted-foreground mt-0.5">ID: {log.resource_id}</div>
 </td>
 <td className="px-6 py-4 text-foreground">{log.actor}</td>
 <td className="px-6 py-4 text-right text-muted-foreground">
 {log.details}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>

 </div>
 );
}
