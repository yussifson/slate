import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from "@/api/PowerSyncConnector";
import { Activity, Search, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";

export default function AuditLog() {
  const companyId = useCompanyId();
  const [search, setSearch] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit_logs", companyId],
    queryFn: async () => {
      // Fetch from local SQLite activity_logs or a unified view
      // For now we use the local sync if available, or fetch from supabase directly
      try {
        const { rows } = await powerSync.execute(
          'SELECT * FROM activity_logs WHERE company_id = ? ORDER BY created_at DESC LIMIT 500', 
          [companyId]
        );
        return rows._array || [];
      } catch (e) {
        console.warn("activity_logs table not synced locally, falling back to empty", e);
        return [];
      }
    },
    enabled: !!companyId
  });

  const filteredLogs = logs.filter(log => 
    !search || 
    log.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    log.action?.toLowerCase().includes(search.toLowerCase()) ||
    log.module?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: "Timestamp",
      render: row => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {format(new Date(row.created_at || new Date()), "MMM d, yyyy HH:mm:ss")}
        </span>
      )
    },
    {
      header: "User",
      render: row => (
        <div>
          <p className="font-medium text-sm">{row.user_name || "Unknown User"}</p>
          <p className="text-xs text-muted-foreground">{row.user_email}</p>
        </div>
      )
    },
    {
      header: "Action",
      render: row => (
        <span className="text-sm font-medium">{row.action}</span>
      )
    },
    {
      header: "Module",
      render: row => (
        <span className="text-xs uppercase tracking-wider px-2 py-1 bg-muted rounded-md font-semibold">
          {row.module?.replace(/_/g, " ")}
        </span>
      )
    },
    {
      header: "Platform",
      render: row => (
        <span className="text-xs text-muted-foreground">{row.slate || "Web App"}</span>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <PageHeader 
        title="Audit Logs" 
        subtitle="Immutable record of all administrative and data access actions."
        actions={
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        }
      />
      
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by user, action, or module..." 
              className="pl-9 bg-background" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" title="Filter Logs">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
        
        <DataTable 
          columns={columns} 
          data={filteredLogs} 
          isLoading={isLoading} 
          emptyTitle="No audit logs found" 
          emptyIcon={Activity} 
        />
      </div>
    </div>
  );
}
