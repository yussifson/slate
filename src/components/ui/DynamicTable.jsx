import React, { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { ArrowUpDown, Search, ChevronLeft, ChevronRight, MoreHorizontal, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import DynamicWorkflow from '@/components/ui/DynamicWorkflow';

export default function DynamicTable({ data = [], fieldDefinitions = [], moduleDef }) {
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Dynamically generate columns from field_definitions
  const columns = React.useMemo(() => {
    return fieldDefinitions.map((field) => ({
      accessorFn: (row) => row.data?.[field.name],
      id: field.name,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 hover:bg-slate-100/50"
          >
            {field.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const val = row.original.data?.[field.name];
        if (field.field_type === 'boolean') {
          return val ? (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Yes</span>
          ) : (
            <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">No</span>
          );
        }
        return <div className="text-sm">{val || '-'}</div>;
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
    state: {
      sorting,
      globalFilter,
    },
  });

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
      </div>

      <div className="rounded-md border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200 uppercase">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 font-medium">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
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
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelectedRecord(row.original)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + 1} className="h-24 text-center text-slate-500">
                    No results found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Record Details</DialogTitle>
            <DialogDescription>
              View and manage the workflow for this record.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="mt-4 space-y-4">
              <DynamicWorkflow 
                record={selectedRecord} 
                moduleDef={moduleDef} 
                onStatusChange={(id, status) => {
                  setSelectedRecord({...selectedRecord, status});
                  // Optionally trigger a re-fetch of table data here if required
                }} 
              />
              
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-4 space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Data Payload</h4>
                {fieldDefinitions.map(f => (
                  <div key={f.name} className="flex justify-between border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                    <span className="text-xs text-slate-500">{f.name.replace(/_/g, ' ').toUpperCase()}</span>
                    <span className="text-sm font-medium text-slate-900">{String(selectedRecord.data[f.name] || '-')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
