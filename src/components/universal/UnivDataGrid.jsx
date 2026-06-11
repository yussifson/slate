import React, { useState, useMemo } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronDown, MoreHorizontal, Download, ArrowUpDown, Plus, Loader2, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function UnivDataGrid({ 
  title = "Data Grid",
  searchPlaceholder = "Search records...",
  companyId,
  pageName,
  tableName
}) {
  const [view, setView] = useState('Default');

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [isAdding, setIsAdding] = useState(false);
  const [newRecordName, setNewRecordName] = useState('');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const targetTable = tableName || 'industry_records';

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['orbit_records', companyId, pageName, targetTable],
    queryFn: async () => {
      if (!companyId) return [];
      let query = supabase.from(targetTable).select('*').eq('company_id', companyId);
      if (targetTable === 'industry_records') {
        query = query.eq('industry', 'orbit_build_data').eq('record_type', pageName);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
        
      if (error && error.code !== '42P01') throw error;
      return data || [];
    },
    enabled: !!companyId
  });

  const addMutation = useMutation({
    mutationFn: async (newData) => {
      let payload;
      if (targetTable === 'industry_records') {
        payload = { company_id: companyId, industry: 'orbit_build_data', record_type: pageName, data: newData, search_text: Object.values(newData).join(' ') };
      } else {
        payload = { ...newData, company_id: companyId };
      }
      const { data, error } = await supabase.from(targetTable).insert([payload]);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orbit_records', companyId, pageName]);
      queryClient.invalidateQueries(['orbit_dynamic_records', companyId]);
      setIsAdding(false);
      setNewRecordName('');
      toast({ title: 'Success', description: 'Record added successfully.' });
    },
    onError: (err) => {
      console.error(err);
      toast({ title: 'Error', description: err.message || 'Failed to save', variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from(targetTable).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orbit_records', companyId, pageName]);
      queryClient.invalidateQueries(['orbit_dynamic_records', companyId]);
      toast({ title: 'Deleted', description: 'Record removed.' });
    }
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newRecordName.trim()) return;
    addMutation.mutate({
      name: newRecordName,
      status: 'Active',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const displayData = React.useMemo(() => {
    return records.map(r => targetTable === 'industry_records' ? { id: r.id, ...r.data } : r);
  }, [records, targetTable]);

  const displayColumns = React.useMemo(() => {
    if (displayData.length === 0) return [{ key: 'name', label: 'Name' }, { key: 'status', label: 'Status' }, { key: 'date', label: 'Date' }];
    const firstRow = displayData[0];
    const keys = Object.keys(firstRow).filter(k => k !== 'id' && k !== 'company_id' && k !== 'created_at' && k !== 'updated_at' && typeof firstRow[k] !== 'object');
    return keys.slice(0, 5).map(k => ({ key: k, label: k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }));
  }, [displayData]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    let sortableItems = [...displayData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [displayData, sortConfig]);

  const filteredData = sortedData.filter(item => 
    Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  
  const handleExport = () => {
    const exportData = (typeof records !== 'undefined' ? records : (typeof data !== 'undefined' ? data : []));
    if (!exportData || exportData.length === 0) return alert('No data to export');
    const keys = Object.keys(exportData[0]).filter(k => k !== 'company_id' && k !== 'id');
    const csv = [keys.join(','), ...exportData.map(r => keys.map(k => '"' + (r[k]||'').toString().replace(/"/g, '""') + '"').join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'export.csv'; a.click();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background relative ${view !== 'Default' ? 'hide-default' : ''}">
      <div className="view-header flex flex-col sm:flex-row sm:items-center justify-between mb-6 shrink-0 px-1 gap-4">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">{title}</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage and organize your records efficiently.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <div className="flex items-center gap-2">

        
        
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>

        <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Record
          </button>
      </div>
        </div>
      </div>

      {isAdding && (
        <div className="mb-6 p-4 bg-card border border-primary/20 rounded-2xl shadow-sm">
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Record Name</label>
              <input 
                autoFocus
                type="text" 
                value={newRecordName} 
                onChange={e => setNewRecordName(e.target.value)} 
                placeholder="Enter record name..." 
                className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" 
              />
            </div>
            <Button type="button" variant="outline" onClick={() => setIsAdding(false)} className="h-10 rounded-xl">Cancel</Button>
            <Button type="submit" disabled={addMutation.isPending} className="h-10 bg-primary text-white rounded-xl">
              {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Record'}
            </Button>
          </form>
        </div>
      )}

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted">
            <Filter className="w-4 h-4" /> Filters <ChevronDown className="w-3 h-3 ml-1" />
          </button>
        </div>

        <div className="flex-1 overflow-auto border border-border rounded-2xl shadow-sm bg-card relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : null}
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap min-w-max">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border sticky top-0 z-10">
                <tr>
                  {displayColumns.map(col => (
                    <th 
                      key={col.key} 
                      className="px-6 py-4 font-semibold cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => handleSort(col.key)}
                    >
                      <div className="flex items-center gap-2">
                        {col.label}
                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredData.map((row, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                    key={row.id || idx} 
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    {displayColumns.map(col => (
                      <td key={col.key} className="p-4 text-foreground">
                        {col.key === 'status' ? (
                          <span className="px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200">
                            {row[col.key] || 'Active'}
                          </span>
                        ) : (
                          row[col.key]
                        )}
                      </td>
                    ))}
                    <td className="p-4 text-right">
                      <button onClick={() => deleteMutation.mutate(row.id)} className="text-muted-foreground hover:text-red-500 transition-colors p-2" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-muted-foreground">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                        <Search className="w-5 h-5 opacity-50" />
                      </div>
                      <p>No records found. Click "Add Record" to start.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="p-4 border-t border-border flex justify-between items-center text-sm text-muted-foreground bg-muted/20">
          <div>Showing 1 to {filteredData.length} of {filteredData.length} entries</div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-border rounded-md hover:bg-muted disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 border border-border rounded-md hover:bg-muted bg-primary text-white border-primary">1</button>
            <button className="px-3 py-1 border border-border rounded-md hover:bg-muted disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

