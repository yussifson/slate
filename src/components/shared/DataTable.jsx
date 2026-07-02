import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "./EmptyState";
import { FileText } from "lucide-react";

export default function DataTable({ columns, data, isLoading, onRowClick, emptyTitle, emptyDescription, emptyIcon }) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((col, i) => (
                <TableHead key={i} className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#71717a] dark:text-gray-400">
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5).fill(0).map((_, i) => (
              <TableRow key={i}>
                {columns.map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <EmptyState
          icon={emptyIcon || FileText}
          title={emptyTitle || "No data yet"}
          description={emptyDescription || "Data will appear here once created."}
        />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
      
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((col, i) => (
                <TableHead key={i} className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#71717a] dark:text-gray-400">
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow
                key={row.id || i}
                className={onRowClick ? "cursor-pointer hover:bg-muted/50 transition-colors group h-12" : "h-12"}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col, j) => (
                  <TableCell key={j} className="text-sm">
                    {col.render ? col.render(row) : row[col.accessor]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Stacked Cards */}
      <div className="md:hidden flex flex-col divide-y divide-border">
        {data.map((row, i) => (
          <div 
            key={row.id || i} 
            className={"flex flex-col p-4 gap-2 " + (onRowClick ? "cursor-pointer active:bg-muted/50" : "")}
            onClick={() => onRowClick?.(row)}
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm truncate pr-2">
                {columns[0] ? (columns[0].render ? columns[0].render(row) : row[columns[0].accessor]) : ''}
              </span>
              {columns.length > 1 && (
                <span className="text-xs font-medium text-[#71717a] dark:text-gray-400 whitespace-nowrap">
                  {columns[1].render ? columns[1].render(row) : row[columns[1].accessor]}
                </span>
              )}
            </div>
            
            {columns.length > 2 && (
              <div className="grid grid-cols-2 gap-2 mt-1">
                {columns.slice(2, 6).map((col, j) => (
                  <div key={j} className="flex flex-col">
                    <span className="text-[10px] font-medium uppercase text-[#71717a] dark:text-gray-400 truncate">{col.header}</span>
                    <span className="text-xs truncate">{col.render ? col.render(row) : row[col.accessor]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}