import React, { useState } from 'react';
import { 
  ChevronDown, ChevronUp, ArrowUpDown, 
  Search, Filter, MoreHorizontal 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SlateDataGrid({
  columns = [],
  data = [],
  keyField = 'id',
  onRowClick,
  isLoading = false,
  emptyMessage = "No records found in this view."
}) {
  const [sortField, setSortField] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredData = data.filter(row => {
    if (!searchFilter) return true;
    return Object.values(row).some(val => 
      String(val || '').toLowerCase().includes(searchFilter.toLowerCase())
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0;
    const valA = a[sortField];
    const valB = b[sortField];
    if (valA === valB) return 0;
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;
    return sortAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
  });

  return (
    <div className="w-full rounded-xl bg-[var(--slate-v2-surface-1)] border border-[var(--slate-v2-border-subtle)] overflow-hidden shadow-lg shadow-black/20">
      {/* Table Toolbar */}
      <div className="p-3.5 border-b border-[var(--slate-v2-border-subtle)] flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--slate-v2-text-tertiary)]" />
          <input
            type="text"
            placeholder="Filter current records..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--slate-v2-surface-2)] border border-[var(--slate-v2-border-subtle)] text-xs text-white placeholder-[var(--slate-v2-text-tertiary)] focus:outline-none focus:border-[var(--slate-v2-border-focus)] transition-colors"
          />
        </div>
        <div className="text-xs text-[var(--slate-v2-text-secondary)] font-mono">
          {sortedData.length} {sortedData.length === 1 ? 'record' : 'records'}
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--slate-v2-border-subtle)] bg-[var(--slate-v2-surface-2)]/50 text-[11px] font-semibold text-[var(--slate-v2-text-secondary)] uppercase tracking-wider select-none">
              {columns.map((col) => (
                <th
                  key={col.field}
                  onClick={() => col.sortable !== false && handleSort(col.field)}
                  className={cn(
                    "px-4 py-3",
                    col.sortable !== false && "cursor-pointer hover:text-white transition-colors"
                  )}
                  style={{ width: col.width }}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable !== false && sortField === col.field ? (
                      sortAsc ? <ChevronUp className="w-3 h-3 text-indigo-400" /> : <ChevronDown className="w-3 h-3 text-indigo-400" />
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 opacity-30" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--slate-v2-border-subtle)] text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-[var(--slate-v2-text-secondary)]">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading data records...</span>
                  </div>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-[var(--slate-v2-text-secondary)]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row) => (
                <tr
                  key={row[keyField]}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(
                    "hover:bg-[var(--slate-v2-surface-2)] transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.field} className="px-4 py-3 text-[var(--slate-v2-text-primary)]">
                      {col.render ? col.render(row[col.field], row) : row[col.field] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
