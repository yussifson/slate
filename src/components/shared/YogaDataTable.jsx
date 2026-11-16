import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "./EmptyState";
import { FileText, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export default function DataTable({
  columns,
  data,
  isLoading,
  onRowClick,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  striped = false,
}) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const handleSort = (col, i) => {
    if (!col.sortable && !col.accessor) return;
    const key = col.accessor || i;
    if (sortCol === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortCol(key);
      setSortDir("asc");
    }
  };

  let displayData = data || [];
  if (sortCol !== null) {
    displayData = [...displayData].sort((a, b) => {
      const av = a[sortCol] ?? "";
      const bv = b[sortCol] ?? "";
      const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }

  const SortIcon = ({ col, i }) => {
    const key = col.accessor || i;
    if (!col.sortable && !col.accessor) return null;
    if (sortCol !== key) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30 inline-block" />;
    return sortDir === "asc"
      ? <ArrowUp className="w-3 h-3 ml-1 text-primary inline-block" />
      : <ArrowDown className="w-3 h-3 ml-1 text-primary inline-block" />;
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border overflow-hidden shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
              {columns.map((col, i) => (
                <TableHead key={i} className="data-table-header h-9 px-3">{col.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5).fill(0).map((_, i) => (
              <TableRow key={i} className="border-b border-border/60">
                {columns.map((_, j) => (
                  <TableCell key={j} className="px-4 py-3"><Skeleton className="h-4 w-24 rounded-lg" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!displayData?.length) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-[var(--shadow-card)]">
        <EmptyState
          icon={emptyIcon || FileText}
          title={emptyTitle || "No data yet"}
          description={emptyDescription || "Data will appear here once created."}
        />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/20 hover:bg-muted/20">
              {columns.map((col, i) => (
                <TableHead
                  key={i}
                  className={cn(
                    "data-table-header h-9 px-3",
                    (col.sortable || col.accessor) && "cursor-pointer hover:text-foreground select-none"
                  )}
                  onClick={() => handleSort(col, i)}
                >
                  {col.header}
                  <SortIcon col={col} i={i} />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.map((row, i) => (
              <TableRow
                key={row.id || i}
                className={cn(
                  "border-b border-border/50 transition-colors duration-100",
                  onRowClick && "cursor-pointer",
                  striped && i % 2 === 1 ? "bg-muted/10" : "",
                  "hover:bg-muted/20"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col, j) => (
                  <TableCell key={j} className="px-4 py-3 text-sm">
                    {col.render ? col.render(row) : row[col.accessor]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
