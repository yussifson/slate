import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import { Shield, Search, AlertTriangle, CheckCircle, User, Briefcase, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ConflictChecker() {
  const { user } = useAuth();
  const companyId = user?.company_id;
  const [query, setQuery] = useState("");
  const [checked, setChecked] = useState(false);

  const { data: clients = [] } = useQuery({ queryKey: ["clients", companyId], queryFn: () => base44.entities.Client.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: cases = [] } = useQuery({ queryKey: ["cases", companyId], queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId }), enabled: !!companyId });

  const normalize = (s) => (s || "").toLowerCase().trim();
  const contains = (text, q) => normalize(text).includes(normalize(q));

  const check = () => { if (query.trim().length >= 2) setChecked(true); };

  const matchingClients = clients.filter(c => contains(c.name, query) || contains(c.email, query) || contains(c.id_number, query));
  const matchingCases = cases.filter(c =>
    contains(c.opposing_party, query) ||
    contains(c.opposing_counsel, query) ||
    contains(c.client_name, query) ||
    contains(c.title, query) ||
    contains(c.description, query) ||
    contains(c.judge_name, query) ||
    contains(c.notes, query)
  );

  const hasConflict = checked && (matchingClients.length > 0 || matchingCases.length > 0);
  const isClear = checked && !hasConflict;

  return (
    <div className="space-y-6">
      <PageHeader title="Conflict of Interest Checker" subtitle="Search clients, parties, and cases before accepting new matters" />

      {/* Search */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-semibold">Enter Name or ID to Check</h2>
        </div>
        <p className="text-xs text-muted-foreground">Search by person's name, company name, email, or ID number. The system will check against all existing clients, cases, and opposing parties.</p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="e.g. John Mensah, Acme Ltd, GHA-12345..."
              className="pl-9 h-10"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setChecked(false); }}
              onKeyDown={(e) => e.key === "Enter" && check()}
            />
          </div>
          <Button className="gap-2 h-10" onClick={check} disabled={query.trim().length < 2}>
            <Search className="w-4 h-4" /> Check
          </Button>
        </div>
      </div>

      {/* Result Banner */}
      {checked && (
        <div className={cn("rounded-xl p-5 flex items-start gap-4 border", hasConflict ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200")}>
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", hasConflict ? "bg-red-100" : "bg-green-100")}>
            {hasConflict ? <AlertTriangle className="w-5 h-5 text-red-600" /> : <CheckCircle className="w-5 h-5 text-green-600" />}
          </div>
          <div>
            <h3 className={cn("font-bold text-base", hasConflict ? "text-red-700" : "text-green-700")}>
              {hasConflict ? "⚠️ Potential Conflict Detected" : "✓ No Conflicts Found"}
            </h3>
            <p className={cn("text-sm mt-0.5", hasConflict ? "text-red-600" : "text-green-600")}>
              {hasConflict
                ? `Found ${matchingClients.length + matchingCases.length} matching record(s) for "${query}". Review carefully before accepting this matter.`
                : `No existing clients, cases, or opposing parties match "${query}". You may proceed with this matter.`}
            </p>
          </div>
        </div>
      )}

      {/* Matching Results */}
      {checked && matchingClients.length > 0 && (
        <div className="bg-card border border-red-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-red-50 border-b border-red-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-red-600" />
            <span className="text-sm font-semibold text-red-700">Matching Clients ({matchingClients.length})</span>
          </div>
          <div className="divide-y divide-border">
            {matchingClients.map(c => (
              <div key={c.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.email}{c.id_number ? ` · ID: ${c.id_number}` : ""}{c.city ? ` · ${c.city}` : ""}</p>
                </div>
                <Badge className={cn("text-[10px] capitalize", c.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600")}>{c.status} client</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {checked && matchingCases.length > 0 && (
        <div className="bg-card border border-red-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-red-50 border-b border-red-200 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-red-600" />
            <span className="text-sm font-semibold text-red-700">Matching Cases ({matchingCases.length})</span>
          </div>
          <div className="divide-y divide-border">
            {matchingCases.map(c => (
              <div key={c.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground">Client: {c.client_name} · Opposing: {c.opposing_party || "—"} · Counsel: {c.opposing_counsel || "—"}</p>
                  <p className="text-xs text-muted-foreground">Lawyer: {c.assigned_lawyer_name || "—"}</p>
                </div>
                <Badge className={cn("text-[10px] capitalize shrink-0", c.status === "open" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600")}>{c.status?.replace("_", " ")}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guide */}
      <div className="bg-muted/30 border border-border rounded-xl p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">What we check</h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• <strong>Existing clients</strong> — name, email, and ID number</li>
          <li>• <strong>Case parties</strong> — client names, opposing parties, opposing counsel, and judges</li>
          <li>• <strong>Case content</strong> — keywords in case titles, descriptions, and notes</li>
        </ul>
      </div>
    </div>
  );
}