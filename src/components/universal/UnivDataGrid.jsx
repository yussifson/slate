import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useMemo, useRef, useCallback, useEffect} from 'react';
import { motion, AnimatePresence} from 'framer-motion';
import {
 Search, Download, Plus, Loader2, Trash2,
 ArrowUp, ArrowDown, ArrowUpDown, ChevronDown, ChevronRight,
 Save, Bookmark, X, CheckSquare, SquareMinus, Layers,
 FileDown, AlertCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient} from '@tanstack/react-query';

import { supabase} from "@/api/supabaseClient";
import { Button} from '@/components/ui/button';
import { Checkbox} from '@/components/ui/checkbox';
import { Badge} from '@/components/ui/badge';
import { useToast} from '@/components/ui/use-toast';
import { cn} from '@/lib/utils';
import { useCompanyId} from '@/hooks/useCompanyId';

/* ─────────────────────────────────────────────
 Helpers
───────────────────────────────────────────── */

const ROWS_PER_PAGE = 20;

const STATUS_CLASSES = {
 active: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
 paid: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
 pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
 review: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
 closed: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800',
 overdue: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800',
 inactive: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800',
};

function getCellFormatClass(value) {
 if (typeof value === 'string') {
 const key = value.toLowerCase().trim();
 if (STATUS_CLASSES[key]) return null; // handled as badge
}
 if (typeof value === 'number') {
 if (value < 0 || value === 0) return 'text-red-400/80';
}
 return null;
}

function StatusBadge({ value}) {
 const key = String(value).toLowerCase().trim();
 const cls = STATUS_CLASSES[key];
 if (!cls) return <span className="text-foreground">{value}</span>;
 return (
 <span className={cn(
 'inline-flex items-center px-2.5 py-0.5 rounded-lg border-[0.5px] border-black/9 dark:border-white/8 text-[11px] uppercase tracking-wider font-semibold',
 cls
 )}>
 {value}
 </span>
 );
}

function CellValue({ colKey, value}) {
 if (value === null || value === undefined || value === '') return <span className="text-[#71717a] dark:text-gray-400/40">—</span>;
 if (typeof value === 'string') {
 const key = value.toLowerCase().trim();
 if (STATUS_CLASSES[key]) return <StatusBadge value={value} />;
}
 const fmtClass = getCellFormatClass(value);
 return (
 <span className={cn(fmtClass && fmtClass)}>
 {typeof value === 'number' ? value.toLocaleString() : String(value)}
 </span>
 );
}

function useDebounce(fn, delay) {
 const timer = useRef(null);
 return useCallback((...args) => {
 clearTimeout(timer.current);
 timer.current = setTimeout(() => fn(...args), delay);
}, [fn, delay]);
}

function exportToCSV(rows, columns, filename = 'export.csv') {
 const keys = columns.map(c => c.key);
 const header = columns.map(c => c.label).join(',');
 const body = rows.map(r =>
 keys.map(k => '"' + String(r[k] ?? '').replace(/"/g, '""') + '"').join(',')
 ).join('\n');
 const blob = new Blob([header + '\n' + body], { type: 'text/csv;charset=utf-8;'});
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url; a.download = filename; a.click();
 URL.revokeObjectURL(url);
}

/* ─────────────────────────────────────────────
 Saved Views (localStorage)
───────────────────────────────────────────── */
const VIEWS_KEY = (tableName, pageName) => `slate_grid_views_${tableName}_${pageName}`;

function loadViews(tableName, pageName) {
 try {
 const raw = localStorage.getItem(VIEWS_KEY(tableName, pageName));
 return raw ? JSON.parse(raw) : [];
} catch { return [];}
}

function saveViews(tableName, pageName, views) {
 try {
 localStorage.setItem(VIEWS_KEY(tableName, pageName), JSON.stringify(views));
} catch {}
}

/* ─────────────────────────────────────────────
 Inline editable cell
───────────────────────────────────────────── */
function EditableCell({ value, onSave, rowId, colKey, tabIndex}) {
 const [editing, setEditing] = useState(false);
 const [draft, setDraft] = useState(String(value ?? ''));
 const inputRef = useRef(null);

 const startEdit = () => {
 setDraft(String(value ?? ''));
 setEditing(true);
};

 useEffect(() => {
 if (editing && inputRef.current) inputRef.current.focus();
}, [editing]);

 const commit = () => {
 setEditing(false);
 if (draft !== String(value ?? '')) {
 onSave(rowId, colKey, draft);
}
};

 const handleKeyDown = (e) => {
 if (e.key === 'Enter') { e.preventDefault(); commit();}
 if (e.key === 'Escape') { setEditing(false); setDraft(String(value ?? ''));}
};

 if (editing) {
 return (
 <input
 ref={inputRef}
 value={draft}
 onChange={e => setDraft(e.target.value)}
 onBlur={commit}
 onKeyDown={handleKeyDown}
 tabIndex={tabIndex}
 className="w-full min-w-[80px] px-2 py-1 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
 />
 );
}

 return (
 <div
 onClick={startEdit}
 tabIndex={tabIndex}
 onFocus={startEdit}
 className="cursor-text min-h-[24px] rounded-md px-1 py-0.5 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
 >
 <CellValue colKey={colKey} value={value} />
 </div>
 );
}

/* ─────────────────────────────────────────────
 Main Component
───────────────────────────────────────────── */
export default function UnivDataGrid({
 title = 'Data Grid',
 searchPlaceholder = 'Search records...',
 companyId,
 pageName,
 tableName
}) {
 const { toast} = useToast();
 const queryClient = useQueryClient();
 // Use hook as fallback if companyId is not passed as prop
 const hookCompanyId = useCompanyId();
 const effectiveCompanyId = companyId || hookCompanyId;
 const effectivePageName = pageName || 'default_grid';
 const targetTable = tableName || 'industry_records';

 // ── State ──────────────────────────────────
 const [searchTerm, setSearchTerm] = useState('');
 const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc'});
 const [selectedIds, setSelectedIds] = useState(new Set());
 const [lastSelectedIdx, setLastSelectedIdx] = useState(null);
 const [groupByCol, setGroupByCol] = useState(null);
 const [collapsedGroups, setCollapsedGroups] = useState(new Set());
 const [currentPage, setCurrentPage] = useState(1);
 const [isAdding, setIsAdding] = useState(false);
 const [newRecordName, setNewRecordName] = useState('');
 const [showSaveView, setShowSaveView] = useState(false);
 const [viewNameInput, setViewNameInput] = useState('');
 const [savedViews, setSavedViews] = useState(() => loadViews(targetTable, pageName));
 const [activeViewIdx, setActiveViewIdx] = useState(-1); // -1 = "All"
 const [editingCell, setEditingCell] = useState(null); // { rowId, colKey}

 // ── Data Fetch ─────────────────────────────
 const { data: records = [], isLoading} = useQuery({
 queryKey: ['orbit_records', effectiveCompanyId, effectivePageName, targetTable],
 queryFn: async () => {
 if (!effectiveCompanyId) return [];
 let dbQueryStr = `SELECT * FROM ${targetTable} WHERE company_id = ?`; let dbQueryParams = [effectiveCompanyId];
 if (targetTable === 'industry_records') {
 query = query.eq('industry', 'orbit_build_data').eq('record_type', effectivePageName);
}
 const { data, error} = await query.order('created_at', { ascending: false});
 if (error && error.code !== '42P01') throw error;
 return data || [];
},
 enabled: !!effectiveCompanyId
});

 // ── Derived display data ───────────────────
 const displayData = useMemo(() =>
 records.map(r => targetTable === 'industry_records' ? { id: r.id, ...r.data} : r),
 [records, targetTable]
 );

 const displayColumns = useMemo(() => {
 if (displayData.length === 0) return [
 { key: 'name', label: 'Name'},
 { key: 'status', label: 'Status'},
 { key: 'date', label: 'Date'}
 ];
 const firstRow = displayData[0];
 const keys = Object.keys(firstRow).filter(k =>
 k !== 'id' && k !== 'company_id' && k !== 'created_at' && k !== 'updated_at' &&
 typeof firstRow[k] !== 'object'
 );
 return keys.slice(0, 8).map(k => ({
 key: k,
 label: k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}));
}, [displayData]);

 const hasStatusCol = useMemo(() =>
 displayColumns.some(c => c.key === 'status' || c.key.includes('status')),
 [displayColumns]
 );

 // ── Sorting ────────────────────────────────
 const handleSort = (key) => {
 setSortConfig(prev => {
 if (prev.key === key) {
 const next = prev.direction === 'asc' ? 'desc' : prev.direction === 'desc' ? null : 'asc';
 return next === null ? { key: null, direction: 'asc'} : { key, direction: next};
}
 return { key, direction: 'asc'};
});
 setCurrentPage(1);
};

 const sortedData = useMemo(() => {
 let items = [...displayData];
 if (sortConfig.key) {
 items.sort((a, b) => {
 const av = a[sortConfig.key], bv = b[sortConfig.key];
 if (av == null) return 1; if (bv == null) return -1;
 if (typeof av === 'number' && typeof bv === 'number')
 return sortConfig.direction === 'asc' ? av - bv : bv - av;
 return sortConfig.direction === 'asc'
 ? String(av).localeCompare(String(bv))
 : String(bv).localeCompare(String(av));
});
}
 return items;
}, [displayData, sortConfig]);

 // ── Filtering + search ─────────────────────
 const filteredData = useMemo(() => {
 let items = sortedData;
 // Apply saved view filter if one is active
 if (activeViewIdx >= 0 && savedViews[activeViewIdx]) {
 const view = savedViews[activeViewIdx];
 if (view.search) {
 items = items.filter(row =>
 Object.values(row).some(v => String(v).toLowerCase().includes(view.search.toLowerCase()))
 );
}
} else if (searchTerm) {
 items = items.filter(row =>
 Object.values(row).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
 );
}
 return items;
}, [sortedData, searchTerm, activeViewIdx, savedViews]);

 const matchCount = filteredData.length;

 // ── Grouping ───────────────────────────────
 const groupedData = useMemo(() => {
 if (!groupByCol) return null;
 const groups = {};
 filteredData.forEach(row => {
 const key = String(row[groupByCol] ?? '(empty)');
 if (!groups[key]) groups[key] = [];
 groups[key].push(row);
});
 return groups;
}, [filteredData, groupByCol]);

 // ── Pagination ─────────────────────────────
 const totalPages = Math.max(1, Math.ceil(filteredData.length / ROWS_PER_PAGE));
 const paginatedData = useMemo(() => {
 if (groupByCol) return filteredData; // grouping shows all; pagination counts pre-group
 const start = (currentPage - 1) * ROWS_PER_PAGE;
 return filteredData.slice(start, start + ROWS_PER_PAGE);
}, [filteredData, currentPage, groupByCol]);

 // ── Selection ──────────────────────────────
 const allVisibleIds = paginatedData.map(r => r.id).filter(Boolean);
 const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedIds.has(id));
 const someSelected = allVisibleIds.some(id => selectedIds.has(id));

 const toggleSelectAll = () => {
 setSelectedIds(prev => {
 const next = new Set(prev);
 if (allSelected) allVisibleIds.forEach(id => next.delete(id));
 else allVisibleIds.forEach(id => next.add(id));
 return next;
});
};

 const toggleRow = (id, idx, shiftKey) => {
 setSelectedIds(prev => {
 const next = new Set(prev);
 if (shiftKey && lastSelectedIdx !== null) {
 const lo = Math.min(idx, lastSelectedIdx), hi = Math.max(idx, lastSelectedIdx);
 for (let i = lo; i <= hi; i++) {
 const rid = paginatedData[i]?.id;
 if (rid) next.add(rid);
}
} else {
 if (next.has(id)) next.delete(id);
 else next.add(id);
}
 return next;
});
 setLastSelectedIdx(idx);
};

 // ── Mutations ──────────────────────────────
 const invalidate = () => {
 queryClient.invalidateQueries(['orbit_records', effectiveCompanyId, effectivePageName, targetTable]);
 queryClient.invalidateQueries(['orbit_dynamic_records', effectiveCompanyId]);
};

 const addMutation = useMutation({
 mutationFn: async (newData) => {
 let payload;
 if (targetTable === 'industry_records') {
 payload = { company_id: effectiveCompanyId, industry: 'orbit_build_data', record_type: effectivePageName, data: newData};
} else {
 payload = { ...newData, company_id: effectiveCompanyId};
}
 const { data, error} = await (async () => {
 const _payload = payload;
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO ${targetTable} (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (error) throw error;
 return data;
},
 onSuccess: () => {
 invalidate();
 setIsAdding(false);
 setNewRecordName('');
 toast({ title: 'Record added'});
},
 onError: err => toast({ title: 'Error', description: err.message, variant: 'destructive'})
});

 const deleteMutation = useMutation({
 mutationFn: async (id) => {
 await powerSync.execute(`DELETE FROM ${targetTable} WHERE id = ?`, [id]);
 const error = null;
 if (error) throw error;
},
 onSuccess: () => { invalidate(); toast({ title: 'Deleted'});}
});

 const bulkDeleteMutation = useMutation({
 mutationFn: async (ids) => {
 await powerSync.execute(`DELETE FROM ${targetTable} WHERE id IN (${ids.map(()=>'?').join(',')})`, ids);
 const error = null;
 if (error) throw error;
},
 onSuccess: () => {
 invalidate();
 setSelectedIds(new Set());
 toast({ title: `${selectedIds.size} records deleted`});
},
 onError: err => toast({ title: 'Bulk delete failed', description: err.message, variant: 'destructive'})
});

 const updateCellFn = useCallback(async (rowId, colKey, value) => {
 // Find the raw record
 const rawRecord = records.find(r => r.id === rowId);
 if (!rawRecord) return;
 let updatePayload;
 if (targetTable === 'industry_records') {
 const newData = { ...(rawRecord.data || {}), [colKey]: value};
 updatePayload = { data: newData};
} else {
 updatePayload = { [colKey]: value};
}
 await (async () => { const _payload = updatePayload; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE ${targetTable} SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, rowId]);})();
 const error = null; const data = [];
 if (error) throw error;
}, [records, targetTable]);

 const updateCellMutation = useMutation({
 mutationFn: ({ rowId, colKey, value}) => updateCellFn(rowId, colKey, value),
 onSuccess: () => { invalidate();},
 onError: err => toast({ title: 'Save failed', description: err.message, variant: 'destructive'})
});

 const debouncedSaveCell = useDebounce((rowId, colKey, value) => {
 updateCellMutation.mutate({ rowId, colKey, value});
}, 600);

 const bulkStatusMutation = useMutation({
 mutationFn: async ({ ids, status}) => {
 for (const id of ids) {
 const rawRecord = records.find(r => r.id === id);
 if (!rawRecord) continue;
 let payload;
 if (targetTable === 'industry_records') {
 const newData = { ...(rawRecord.data || {}), status};
 payload = { data: newData};
} else {
 payload = { status};
}
 await (async () => { const _payload = payload; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE ${targetTable} SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, id]);})();
 const error = null; const data = [];
 if (error) throw error;
}
},
 onSuccess: () => {
 invalidate();
 setSelectedIds(new Set());
 toast({ title: 'Status updated'});
},
 onError: err => toast({ title: 'Status update failed', description: err.message, variant: 'destructive'})
});

 // ── Saved Views ────────────────────────────
 const handleSaveView = () => {
 if (!viewNameInput.trim()) return;
 const newView = { name: viewNameInput.trim(), search: searchTerm};
 const updated = [...savedViews, newView];
 setSavedViews(updated);
 saveViews(targetTable, pageName, updated);
 setShowSaveView(false);
 setViewNameInput('');
 toast({ title: `View "${newView.name}" saved`});
};

 const handleDeleteView = (idx) => {
 const updated = savedViews.filter((_, i) => i !== idx);
 setSavedViews(updated);
 saveViews(targetTable, pageName, updated);
 if (activeViewIdx === idx) setActiveViewIdx(-1);
};

 const handleActivateView = (idx) => {
 setActiveViewIdx(idx);
 if (idx >= 0 && savedViews[idx]?.search) {
 setSearchTerm(savedViews[idx].search);
} else if (idx === -1) {
 // keep current search
}
 setCurrentPage(1);
};

 // ── Group helpers ──────────────────────────
 const toggleGroup = (groupKey) => {
 setCollapsedGroups(prev => {
 const next = new Set(prev);
 if (next.has(groupKey)) next.delete(groupKey);
 else next.add(groupKey);
 return next;
});
};

 // ── Add record ─────────────────────────────
 const handleAdd = (e) => {
 e.preventDefault();
 if (!newRecordName.trim()) return;
 addMutation.mutate({ name: newRecordName, status: 'Active', date: new Date().toISOString().split('T')[0]});
};

 // ── Render helpers ─────────────────────────
 const SortIcon = ({ colKey}) => {
 if (sortConfig.key !== colKey) return <ArrowUpDown className="w-3 h-3 opacity-30 ml-1 shrink-0" />;
 return sortConfig.direction === 'asc'
 ? <ArrowUp className="w-3 h-3 ml-1 text-primary shrink-0" />
 : <ArrowDown className="w-3 h-3 ml-1 text-primary shrink-0" />;
};

 const selectedArray = [...selectedIds];

 const renderRows = (rows) => rows.map((row, idx) => {
 const isSelected = selectedIds.has(row.id);
 return (
 <motion.tr
 key={row.id || idx}
 initial={{ opacity: 0, y: 4}}
 animate={{ opacity: 1, y: 0}}
 transition={{ delay: Math.min(idx * 0.03, 0.3)}}
 className={cn(
 'group transition-colors border-b border-primary/40',
 isSelected ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-muted/30'
 )}
 >
 {/* Checkbox col – sticky */}
 <td className="sticky left-0 z-10 w-10 px-3 py-3 bg-inherit">
 <Checkbox
 checked={isSelected}
 onCheckedChange={() => {}}
 onClick={(e) => toggleRow(row.id, idx, e.shiftKey)}
 aria-label="Select row"
 />
 </td>

 {/* Data cols – first col sticky */}
 {displayColumns.map((col, ci) => (
 <td
 key={col.key}
 className={cn(
 'px-4 py-2 text-sm',
 ci === 0 && 'sticky left-10 z-10 bg-inherit font-medium'
 )}
 >
 <EditableCell
 value={row[col.key]}
 rowId={row.id}
 colKey={col.key}
 tabIndex={idx * displayColumns.length + ci + 1}
 onSave={(rowId, colKey, value) => debouncedSaveCell(rowId, colKey, value)}
 />
 </td>
 ))}

 {/* Actions */}
 <td className="px-4 py-2 text-right">
 <button
 onClick={() => deleteMutation.mutate(row.id)}
 disabled={deleteMutation.isPending}
 className="opacity-0 group-hover:opacity-100 text-[#71717a] dark:text-gray-400 hover:text-red-500 transition-all p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30"
 title="Delete"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </td>
 </motion.tr>
 );
});

 // ── Main render ────────────────────────────
 return (
 <div className="flex flex-col h-full overflow-hidden bg-background">

 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 shrink-0 px-1 gap-4">
 <div>
 <h2 className="text-2xl font-semibold text-foreground tracking-tight tracking-[-0.02em]">{title}</h2>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">Manage and organize your records efficiently.</p>
 </div>
 <div className="flex flex-wrap gap-2">
 <Button
 variant="outline"
 size="sm"
 className="gap-2 rounded-xl"
 onClick={() => exportToCSV(filteredData, displayColumns, `${title.toLowerCase().replace(/\s+/g, '_')}.csv`)}
 >
 <FileDown className="w-4 h-4" /> Export CSV
 </Button>
 <Button
 size="sm"
 className="gap-2 rounded-xl bg-primary text-white hover:bg-primary/90 -primary/20"
 onClick={() => setIsAdding(true)}
 >
 <Plus className="w-4 h-4" /> Add Record
 </Button>
 </div>
 </div>

 {/* Add record form */}
 <AnimatePresence>
 {isAdding && (
 <motion.div
 initial={{ opacity: 0, height: 0}}
 animate={{ opacity: 1, height: 'auto'}}
 exit={{ opacity: 0, height: 0}}
 className="mb-5 overflow-hidden"
 >
 <div className="p-4 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-2xl  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <form onSubmit={handleAdd} className="flex flex-col sm:flex-row sm:items-end gap-3">
 <div className="flex-1">
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-1 tracking-[0.04em]">Record Name</label>
 <input
 
 type="text"
 value={newRecordName}
 onChange={e => setNewRecordName(e.target.value)}
 placeholder="Enter record name..."
 className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"
 />
 </div>
 <Button type="button" variant="outline" onClick={() => setIsAdding(false)} className="h-10 rounded-xl">Cancel</Button>
 <Button type="submit" disabled={addMutation.isPending} className="h-10 bg-primary text-white rounded-xl">
 {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Record'}
 </Button>
 </form>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Main card */}
 <div className="flex-1 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl overflow-hidden flex flex-col min-h-0 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">

 {/* Saved Views tabs */}
 <div className="px-4 pt-3 pb-0 border-b border-primary/40 flex items-center gap-2 flex-wrap">
 <button
 onClick={() => handleActivateView(-1)}
 className={cn(
 'px-3 py-1.5 text-xs font-semibold rounded-t-lg border-b-2 transition-colors',
 activeViewIdx === -1
 ? 'border-primary text-primary bg-primary/5'
 : 'border-transparent text-[#71717a] dark:text-gray-400 hover:text-foreground'
 )}
 >
 All
 </button>
 {savedViews.map((v, i) => (
 <div key={i} className="flex items-center gap-0.5 group/view">
 <button
 onClick={() => handleActivateView(i)}
 className={cn(
 'px-3 py-1.5 text-xs font-semibold rounded-t-lg border-b-2 transition-colors',
 activeViewIdx === i
 ? 'border-primary text-primary bg-primary/5'
 : 'border-transparent text-[#71717a] dark:text-gray-400 hover:text-foreground'
 )}
 >
 {v.name}
 </button>
 <button
 onClick={() => handleDeleteView(i)}
 className="opacity-0 group-hover/view:opacity-100 p-0.5 rounded-md hover:bg-red-100 dark:hover:bg-red-950/30 text-[#71717a] dark:text-gray-400 hover:text-red-500 transition-all"
 title="Remove view"
 >
 <X className="w-3 h-3" />
 </button>
 </div>
 ))}
 {/* Save view button */}
 {showSaveView ? (
 <div className="flex items-center gap-2.5 ml-1">
 <input
 
 value={viewNameInput}
 onChange={e => setViewNameInput(e.target.value)}
 onKeyDown={e => { if (e.key === 'Enter') handleSaveView(); if (e.key === 'Escape') setShowSaveView(false);}}
 placeholder="View name…"
 className="h-6 px-2 text-xs bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40 tracking-[0.04em]"
 />
 <button onClick={handleSaveView} className="text-primary hover:text-primary/80 text-xs font-semibold tracking-[0.04em]">
 <Save className="w-3.5 h-3.5" />
 </button>
 <button onClick={() => setShowSaveView(false)} className="text-[#71717a] dark:text-gray-400 hover:text-foreground">
 <X className="w-3 h-3" />
 </button>
 </div>
 ) : (
 <button
 onClick={() => setShowSaveView(true)}
 className="ml-1 flex items-center gap-2 px-2 py-1 text-xs text-[#71717a] dark:text-gray-400 hover:text-foreground transition-colors rounded-md hover:bg-muted tracking-[0.04em]"
 title="Save current view"
 >
 <Bookmark className="w-3 h-3" /> Save view
 </button>
 )}
 </div>

 {/* Toolbar */}
 <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-muted/10 border-b border-primary/40">
 {/* Search */}
 <div className="relative flex items-center">
 <Search className="w-4 h-4 absolute left-3 text-[#71717a] dark:text-gray-400 pointer-events-none" />
 <input
 type="text"
 placeholder={searchPlaceholder}
 value={searchTerm}
 onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); setActiveViewIdx(-1);}}
 className="h-9 pl-10 pr-4 w-64 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
 />
 {searchTerm && (
 <span className="absolute right-3 text-xs text-[#71717a] dark:text-gray-400 font-medium tracking-[0.04em]">
 {matchCount}
 </span>
 )}
 </div>

 <div className="flex items-center gap-2">
 {/* Group by */}
 <div className="relative flex items-center gap-2">
 <Layers className="w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <select
 value={groupByCol || ''}
 onChange={e => { setGroupByCol(e.target.value || null); setCollapsedGroups(new Set());}}
 className="h-9 pl-2 pr-6 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-xs text-[#71717a] dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer tracking-[0.04em]"
 >
 <option value="">Group by…</option>
 {displayColumns.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
 </select>
 <ChevronDown className="w-3 h-3 text-[#71717a] dark:text-gray-400 absolute right-2 pointer-events-none" />
 </div>
 </div>
 </div>

 {/* Bulk Actions Floating Bar */}
 <AnimatePresence>
 {selectedIds.size > 0 && (
 <motion.div
 initial={{ opacity: 0, y: -8}}
 animate={{ opacity: 1, y: 0}}
 exit={{ opacity: 0, y: -8}}
 className="mx-4 mt-3 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl flex items-center gap-3 flex-wrap -primary/20"
 >
 <span className="text-sm font-semibold">
 {selectedIds.size} selected
 </span>
 <div className="flex-1" />
 {hasStatusCol && (
 <>
 <button
 onClick={() => bulkStatusMutation.mutate({ ids: selectedArray, status: 'Active'})}
 disabled={bulkStatusMutation.isPending}
 className="flex items-center gap-2.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold transition-colors tracking-[0.04em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 >
 <CheckSquare className="w-3.5 h-3.5" /> Set Active
 </button>
 <button
 onClick={() => bulkStatusMutation.mutate({ ids: selectedArray, status: 'Inactive'})}
 disabled={bulkStatusMutation.isPending}
 className="flex items-center gap-2.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold transition-colors tracking-[0.04em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 >
 <SquareMinus className="w-3.5 h-3.5" /> Set Inactive
 </button>
 </>
 )}
 <button
 onClick={() => exportToCSV(
 filteredData.filter(r => selectedIds.has(r.id)),
 displayColumns,
 'selected_export.csv'
 )}
 className="flex items-center gap-2.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold transition-colors tracking-[0.04em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 >
 <Download className="w-3.5 h-3.5" /> Export Selected
 </button>
 <button
 onClick={() => bulkDeleteMutation.mutate(selectedArray)}
 disabled={bulkDeleteMutation.isPending}
 className="flex items-center gap-2.5 px-3 py-1.5 bg-red-500/10/80 hover:bg-red-500/10 rounded-xl text-xs font-semibold transition-colors tracking-[0.04em]"
 >
 <Trash2 className="w-3.5 h-3.5" />
 {bulkDeleteMutation.isPending ? 'Deleting…' : 'Delete'}
 </button>
 <button
 onClick={() => setSelectedIds(new Set())}
 className="p-1 hover:bg-white/20 rounded-xl transition-colors hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 title="Clear selection"
 >
 <X className="w-4 h-4" />
 </button>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Table */}
 <div className="flex-1 overflow-auto relative min-h-0">
 {isLoading && (
 <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-20 backdrop-blur-sm">
 <Loader2 className="w-8 h-8 animate-spin text-primary" />
 </div>
 )}

 <table className="w-full text-sm text-left whitespace-nowrap min-w-max border-collapse">
 <thead className="sticky top-0 z-10 bg-muted/70 backdrop-blur border-b border-primary/40 text-xs text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">
 <tr>
 {/* Checkbox header */}
 <th className="sticky left-0 z-20 bg-muted/70 w-10 px-3 py-3.5">
 <Checkbox
 checked={allSelected}
 onCheckedChange={toggleSelectAll}
 ref={ref => {
 if (ref) ref.dataset.indeterminate = someSelected && !allSelected ? 'true' : 'false';
}}
 aria-label="Select all"
 />
 </th>

 {displayColumns.map((col, ci) => (
 <th
 key={col.key}
 onClick={() => handleSort(col.key)}
 className={cn(
 'px-4 py-3.5 font-semibold cursor-pointer hover:bg-muted/80 transition-colors select-none',
 ci === 0 && 'sticky left-10 z-20 bg-muted/70'
 )}
 >
 <div className="flex items-center gap-2">
 {col.label}
 <SortIcon colKey={col.key} />
 </div>
 </th>
 ))}
 <th className="px-4 py-3.5 text-right font-semibold">Actions</th>
 </tr>
 </thead>

 <tbody>
 {/* Grouped view */}
 {groupByCol && groupedData ? (
 Object.entries(groupedData).map(([groupKey, groupRows]) => {
 const isCollapsed = collapsedGroups.has(groupKey);
 return (
 <React.Fragment key={groupKey}>
 {/* Group header row */}
 <tr className="bg-muted/40 border-y border-primary/40">
 <td colSpan={displayColumns.length + 2} className="px-4 py-2">
 <button
 onClick={() => toggleGroup(groupKey)}
 className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
 >
 {isCollapsed
 ? <ChevronRight className="w-4 h-4 text-[#71717a] dark:text-gray-400" />
 : <ChevronDown className="w-4 h-4 text-[#71717a] dark:text-gray-400" />
}
 <span className="capitalize">{groupKey}</span>
 <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
 {groupRows.length}
 </Badge>
 </button>
 </td>
 </tr>
 {/* Group rows */}
 {!isCollapsed && renderRows(groupRows)}
 </React.Fragment>
 );
})
 ) : (
 /* Flat paginated view */
 renderRows(paginatedData)
 )}

 {/* Empty state */}
 {filteredData.length === 0 && !isLoading && (
 <tr>
 <td colSpan={displayColumns.length + 2} className="py-16 text-center">
 <div className="flex flex-col items-center gap-3 text-[#71717a] dark:text-gray-400">
 <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
 <Search className="w-5 h-5 opacity-50" />
 </div>
 <p className="text-sm">No records found.{' '}
 {searchTerm ? (
 <button onClick={() => setSearchTerm('')} className="text-primary underline underline-offset-2">Clear search</button>
 ) : (
 <button onClick={() => setIsAdding(true)} className="text-primary underline underline-offset-2">Add one now</button>
 )}
 </p>
 </div>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 {/* Pagination Footer */}
 <div className="px-4 py-3 border-t border-primary/40 flex items-center justify-between text-sm text-[#71717a] dark:text-gray-400 bg-muted/10 shrink-0 flex-wrap gap-2">
 <div className="text-xs tracking-[0.04em]">
 {groupByCol ? (
 <span>Showing all {filteredData.length} records (grouped)</span>
 ) : (
 <span>
 Showing {Math.min((currentPage - 1) * ROWS_PER_PAGE + 1, filteredData.length)}–{Math.min(currentPage * ROWS_PER_PAGE, filteredData.length)} of {filteredData.length}
 </span>
 )}
 </div>
 {!groupByCol && (
 <div className="flex items-center gap-2">
 <button
 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
 disabled={currentPage === 1}
 className="px-3 py-1.5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-xs hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors tracking-[0.04em]"
 >
 Previous
 </button>
 {/* Page numbers */}
 {Array.from({ length: Math.min(5, totalPages)}, (_, i) => {
 let page;
 if (totalPages <= 5) page = i + 1;
 else if (currentPage <= 3) page = i + 1;
 else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
 else page = currentPage - 2 + i;
 return (
 <button
 key={page}
 onClick={() => setCurrentPage(page)}
 className={cn(
 'w-8 h-8 rounded-xl text-xs font-medium transition-colors',
 currentPage === page
 ? 'bg-primary text-white border-[0.5px] border-black/9 dark:border-white/8 border-primary'
 : 'border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:bg-muted'
 )}
 >
 {page}
 </button>
 );
})}
 <button
 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
 disabled={currentPage === totalPages}
 className="px-3 py-1.5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-xs hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors tracking-[0.04em]"
 >
 Next
 </button>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
