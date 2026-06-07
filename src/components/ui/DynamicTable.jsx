import React, { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { ArrowUpDown, Search, ChevronLeft, ChevronRight, Eye, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/api/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

export default function DynamicTable({ data = [], fieldDefinitions = [], moduleDef, onRefresh }) {
  const { toast } = useToast();
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [editData, setEditData] = useState({});
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const columns = React.useMemo(() => {
    return fieldDefinitions.map((field) => ({
      accessorFn: (row) => row.data?.[field.name],
      id: field.name,
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4 hover:bg-slate-100/50"
        >
          {field.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const val = row.original.data?.[field.name];
        if (field.field_type === 'boolean') {
          return val ? (
            <span className="px-2 py-1 bg-primary/10 text-primary/90 text-xs rounded-full">Yes</span>
          ) : (
            <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">No</span>
          );
        }
        return <div className="text-sm max-w-[200px] truncate" title={val}>{val || '-'}</div>;
      },
    }));
  }, [fieldDefinitions]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, globalFilter },
  });

  const openEdit = (record) => {
    setEditRecord(record);
    setEditData({ ...record.data });
  };

  const handleSaveEdit = async () => {
    if (!editRecord) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('dynamic_records')
        .update({ data: editData })
        .eq('id', editRecord.id);
      if (error) throw error;
      toast({ title: 'Record updated', description: 'Changes saved successfully.' });
      setEditRecord(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to save.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteRecord) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('dynamic_records')
        .delete()
        .eq('id', deleteRecord.id);
      if (error) throw error;
      toast({ title: 'Record deleted', description: 'The record has been removed.' });
      setDeleteRecord(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to delete.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderEditField = (field) => {
    const label = field.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const val = editData[field.name] ?? '';

    if (field.field_type === 'boolean') {
      return (
        <div key={field.name} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
          <label className="text-sm font-medium text-slate-700">{label}</label>
          <input
            type="checkbox"
            checked={!!val}
            onChange={e => setEditData({ ...editData, [field.name]: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300"
          />
        </div>
      );
    }
    if (field.field_type === 'select') {
      let options = [];
      try { options = typeof field.options === 'string' ? JSON.parse(field.options) : (field.options || []); } catch { options = []; }
      return (
        <div key={field.name} className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
          <select
            value={val}
            onChange={e => setEditData({ ...editData, [field.name]: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select...</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      );
    }
    if (field.field_type === 'date') {
      return (
        <div key={field.name} className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
          <Input
            type="date"
            value={val}
            onChange={e => setEditData({ ...editData, [field.name]: e.target.value })}
          />
        </div>
      );
    }
    if (field.field_type === 'number') {
      return (
        <div key={field.name} className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
          <Input
            type="number"
            value={val}
            onChange={e => setEditData({ ...editData, [field.name]: e.target.value })}
          />
        </div>
      );
    }
    return (
      <div key={field.name} className="space-y-1">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
        <Input
          type="text"
          value={val}
          onChange={e => setEditData({ ...editData, [field.name]: e.target.value })}
        />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search all columns..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <span className="text-xs text-muted-foreground">{data.length} record{data.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="rounded-md border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200 uppercase">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 font-medium">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 align-middle text-slate-700">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-primary" title="View" onClick={() => setSelectedRecord(row.original)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-amber-600" title="Edit" onClick={() => openEdit(row.original)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-red-600" title="Delete" onClick={() => setDeleteRecord(row.original)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + 1} className="h-24 text-center text-slate-500">
                    No records found. Add your first record using the button above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        <span className="text-xs text-muted-foreground px-2">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
        </span>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* View Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Record Details</DialogTitle>
            <DialogDescription>Full data for this record.</DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="mt-2 space-y-2">
              {fieldDefinitions.map(f => (
                <div key={f.name} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{f.name.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-medium text-slate-900 max-w-[60%] text-right break-words">{String(selectedRecord.data[f.name] ?? '-')}</span>
                </div>
              ))}
              <p className="text-[11px] text-slate-400 pt-2">Created: {new Date(selectedRecord.created_at).toLocaleString()}</p>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setSelectedRecord(null)}>Close</Button>
            <Button onClick={() => { openEdit(selectedRecord); setSelectedRecord(null); }} className="gap-2">
              <Pencil className="h-4 w-4" /> Edit Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editRecord} onOpenChange={(open) => !open && setEditRecord(null)}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Record</DialogTitle>
            <DialogDescription>Update the values below and save your changes.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {fieldDefinitions.map(f => renderEditField(f))}
          </div>
          <DialogFooter className="mt-6 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setEditRecord(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-white">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteRecord} onOpenChange={(open) => !open && setDeleteRecord(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteRecord(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
