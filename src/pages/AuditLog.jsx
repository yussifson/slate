import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import { Shield, Search, Filter, User, FileText, Briefcase, Receipt, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { isSuperAdmin } from "@/lib/constants";

const SEVERITY_COLORS = { info: "bg-blue-100 text-blue-700", warning: "bg-amber-100 text-amber-700", critical: "bg-red-100 text-red-700" };
const ENTITY_ICONS = { LegalCase: Briefcase, Invoice: Receipt, Document: FileText, User: User, StaffRecord: User };

const ACTION_COLORS = {
  created: "bg-green-100 text-green-700",
  updated: "bg-blue-100 text-blue-700",
  deleted: "bg-red-100 text-red-700",
  viewed: "bg-gray-100 text-gray-600",
  signed: "bg-purple-100 text-purple-700",
};

export default function AuditLog() {
  const { user } = useAuth();
  const companyId = user?.company_id;
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-logs", companyId],
    queryFn: () => isSuperAdmin(user)
      ? base44.entities.AuditLog.list("-created_date", 200)
      : base44.entities.AuditLog.filter({ company_id: companyId }, "-created_date", 200),
    enabled: !!companyId || isSuperAdmin(user),
  });

  const filtered = logs.filter(log => {
    const matchSearch = !search || log.user_name?.toLowerCase().includes(search.toLowerCase()) || log.entity_label?.toLowerCase().includes(search.toLowerCase()) || log.action?.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = severityFilter === "all" || log.severity === severityFilter;
    const matchAction = actionFilter === "all" || log.action === actionFilter;
    return matchSearch && matchSeverity && matchAction;
  });

  const actions = [...new Set(logs.map(l => l.action))].filter(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Log" subtitle="Track every action taken across your firm" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Events", value: logs.length, color: "bg-blue-50 text-blue-600" },
          { label: "Warnings", value: logs.filter(l => l.severity === "warning").length, color: "bg-amber-50 text-amber-600" },
          { label: "Critical", value: logs.filter(l => l.severity === "critical").length, color: "bg-red-50 text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", s.color)}><Shield className="w-4 h-4" /></div>
            <div><p className="text-xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search logs..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-36 h-9"><Filter className="w-3.5 h-3.5 mr-1.5" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-36 h-9"><SelectValue placeholder="All Actions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actions.map(a => <SelectItem key={a} value={a} className="capitalize">{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Log Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Loading audit logs...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">No audit events found</p>
            <p className="text-xs text-muted-foreground mt-1">Events are recorded as users perform actions in the system.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(log => {
              const EntityIcon = ENTITY_ICONS[log.entity_type] || FileText;
              return (
                <div key={log.id} className="px-4 py-3 flex items-start gap-3 hover:bg-muted/20 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <EntityIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-medium">{log.user_name || log.user_email}</span>
                      <Badge className={cn("text-[9px] h-4 px-1.5 capitalize", ACTION_COLORS[log.action] || "bg-gray-100 text-gray-600")}>{log.action}</Badge>
                      <span className="text-sm text-muted-foreground">{log.entity_type}</span>
                      {log.entity_label && <span className="text-sm font-medium truncate max-w-48">"{log.entity_label}"</span>}
                    </div>
                    {log.details && <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.details}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={cn("text-[9px] h-4 px-1.5", SEVERITY_COLORS[log.severity] || SEVERITY_COLORS.info)}>{log.severity}</Badge>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {log.created_date ? format(new Date(log.created_date), "MMM d, HH:mm") : "—"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}