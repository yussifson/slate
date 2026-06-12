import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCompanyId } from "@/hooks/useCompanyId";
import { base44 } from "@/api/base44Client";
import { powerSync } from "@/api/PowerSyncConnector";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import { format } from "date-fns";
import { Search, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AuditLog() {
  const companyId = useCompanyId();
  const [search, setSearch] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-logs", companyId],
    queryFn: async () => {
      // In a real implementation this would fetch from 'system_activity_logs'
      // We will mock this or use the actual table if it exists
      try {
        const { data, error } = await supabase
          .from("system_activity_logs")
          .select("*")
          .eq("company_id", companyId)
          .order("created_date", { ascending: false });
        if (error) throw error;
        return data;
      } catch (err) {
        console.error("Failed to fetch logs:", err);
        return [];
      }
    },
    enabled: !!companyId,
  });

  const filteredLogs = logs.filter(
    (l) =>
      !search ||
      l.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.module?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: "Date/Time",
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(row.created_date), "MMM d, yyyy h:mm:ss a")}
        </span>
      ),
    },
    {
      header: "User",
      render: (row) => (
        <div>
          <p className="text-sm font-medium">{row.user_name || "System"}</p>
          <p className="text-xs text-muted-foreground">{row.user_email || "N/A"}</p>
        </div>
      ),
    },
    {
      header: "Action",
      render: (row) => <span className="text-sm font-medium">{row.action}</span>,
    },
    {
      header: "Slate",
      render: (row) => <span className="text-xs uppercase bg-muted px-2 py-0.5 rounded-full">{row.slate}</span>,
    },
    {
      header: "IP Address",
      render: (row) => <span className="text-xs font-mono text-muted-foreground">{row.ip_address || "Unknown"}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Activity & Audit Log"
        subtitle="Monitor system actions, logins, and IP addresses."
      />

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by user, action, or slate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredLogs}
          isLoading={isLoading}
          emptyTitle="No activity logs found"
          emptyDescription="System activity will appear here."
          emptyIcon={Activity}
        />
      </div>
    </div>
  );
}