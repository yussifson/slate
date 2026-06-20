import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import { Shield, Search, AlertTriangle, CheckCircle, User, Briefcase, Users, BrainCircuit, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateText } from "@/lib/cloudflareAI";
import { toast } from "react-hot-toast";

export default function ConflictChecker() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = user?.company_id;
  const [query, setQuery] = useState("");
  const [checked, setChecked] = useState(false);

  const { data: clients = [] } = useQuery({ queryKey: ["clients", companyId], queryFn: () => base44.entities.Client.filter({ company_id: companyId }), enabled: !!companyId });
  const { data: cases = [] } = useQuery({ queryKey: ["cases", companyId], queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId }), enabled: !!companyId });

  const normalize = (s) => (s || "").toLowerCase().trim();
  const contains = (text, q) => normalize(text).includes(normalize(q));

  const [aiReport, setAiReport] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const check = async () => { 
    if (query.trim().length >= 2) {
      setChecked(true);
      setAiReport(null);
    }
  };

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

  const analyzeConflict = async () => {
    setIsAnalyzing(true);
    const tId = toast.loading("AI assessing conflict risk...");
    try {
      const matchData = JSON.stringify({
        query,
        clientsFound: matchingClients.map(c => ({ name: c.name, type: c.client_type, status: c.status })),
        casesFound: matchingCases.map(c => ({ title: c.title, opposing: c.opposing_party, status: c.status }))
      });
      
      const prompt = `You are a Legal Ethics & Conflict Resolution AI.
Analyze these search matches for a potential conflict of interest regarding the search term: "${query}".
Matches found: ${matchData}

Return ONLY a valid JSON object:
{
  "riskLevel": "Low", "Medium", or "High",
  "explanation": "A 2-3 sentence ethical explanation of why this is or isn't a conflict and what the lawyer should do next."
}`;

      const rawResponse = await generateText([{ role: 'user', content: prompt }]);
      const cleanJsonStr = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim().replace(/[\u0000-\u001F]+/g, "");
      setAiReport(JSON.parse(cleanJsonStr));
      toast.success("Conflict analysis complete", { id: tId });
    } catch (e) {
      toast.error("Failed to analyze conflict: " + e.message, { id: tId });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Conflict of Interest Checker" subtitle="Search clients, parties, and cases before accepting new matters" />
      {/* Search */}
      <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-6 space-y-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-semibold">{t("enter_name_or_id_to_check", "Enter Name or ID to Check")}</h2>
        </div>
        <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t(
          "search_by_person_s_name_compan",
          "Search by person's name, company name, email, or ID number. The system will check against all existing clients, cases, and opposing parties."
        )}</p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
            <Input
              placeholder="e.g. John Mensah, Acme Ltd, GHA-12345..."
              className="pl-9 h-10"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setChecked(false); }}
              onKeyDown={(e) => e.key === "Enter" && check()}
            />
          </div>
          <Button className="gap-2 h-10" onClick={check} disabled={query.trim().length < 2}>
            <Search className="w-4 h-4" /> {t("check", "Check")}
          </Button>
        </div>
      </div>
      {/* Result Banner */}
      {checked && (
        <div className={cn("rounded-xl p-5 flex items-start gap-4 border", hasConflict ? "bg-red-50 border-red-200" : "bg-slate-50 dark:bg-slate-800/50 border-primary/20")}>
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", hasConflict ? "bg-red-100" : "bg-slate-100")}>
            {hasConflict ? <AlertTriangle className="w-5 h-5 text-red-600" /> : <CheckCircle className="w-5 h-5 text-primary" />}
          </div>
          <div>
            <h3 className={cn("font-semibold text-base", hasConflict ? "text-red-700" : "text-primary/90")}>
              {hasConflict ? "⚠️ Potential Conflict Detected" : "✓ No Conflicts Found"}
            </h3>
            <p className={cn("text-sm mt-0.5", hasConflict ? "text-red-600" : "text-primary")}>
              {hasConflict
                ? `Found ${matchingClients.length + matchingCases.length} matching record(s) for "${query}". Review carefully before accepting this matter.`
                : `No existing clients, cases, or opposing parties match "${query}". You may proceed with this matter.`}
            </p>
            {hasConflict && !aiReport && (
              <Button onClick={analyzeConflict} disabled={isAnalyzing} size="sm" className="mt-3 gap-2 bg-red-100 hover:bg-red-200 text-red-800 border border-red-300">
                <BrainCircuit className="w-4 h-4" /> {isAnalyzing ? "Analyzing Risk..." : "Run AI Deep Conflict Assessment"}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* AI Report */}
      {aiReport && (
        <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Sparkles className="w-32 h-32"/></div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-primary"><BrainCircuit className="w-5 h-5"/> AI Ethical Risk Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div className="md:col-span-1">
              <p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-2">Risk Level</p>
              <span className={cn(
                "inline-block px-4 py-2 rounded-lg text-sm font-bold border",
                aiReport.riskLevel === "High" ? "bg-red-100 text-red-800 border-red-200" :
                aiReport.riskLevel === "Medium" ? "bg-orange-100 text-orange-800 border-orange-200" :
                "bg-green-100 text-green-800 border-green-200"
              )}>
                {aiReport.riskLevel} Risk
              </span>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-2">Ethical Explanation & Next Steps</p>
              <div className="text-sm text-foreground bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-primary/10">
                {aiReport.explanation}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Matching Results */}
      {checked && matchingClients.length > 0 && (
        <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-red-200 rounded-xl overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="px-4 py-3 bg-red-50 border-b border-red-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-red-600" />
            <span className="text-sm font-semibold text-red-700">{t("matching_clients", "Matching Clients (")}{matchingClients.length})</span>
          </div>
          <div className="divide-y divide-border">
            {matchingClients.map(c => {
              return (
                <div key={c.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{c.email}{c.id_number ? ` · ID: ${c.id_number}` : ""}{c.city ? ` · ${c.city}` : ""}</p>
                  </div>
                  <Badge className={cn("text-[10px] capitalize", c.status === "active" ? "bg-slate-100 text-primary/90" : "bg-gray-100 text-gray-600")}>{c.status} {t("client", "client")}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {checked && matchingCases.length > 0 && (
        <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-red-200 rounded-xl overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="px-4 py-3 bg-red-50 border-b border-red-200 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-red-600" />
            <span className="text-sm font-semibold text-red-700">{t("matching_cases", "Matching Cases (")}{matchingCases.length})</span>
          </div>
          <div className="divide-y divide-border">
            {matchingCases.map(c => {
              return (
                <div key={c.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{c.title}</p>
                    <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("client", "Client:")} {c.client_name} {t("opposing", "· Opposing:")} {c.opposing_party || "—"} {t("counsel", "· Counsel:")} {c.opposing_counsel || "—"}</p>
                    <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("lawyer", "Lawyer:")} {c.assigned_lawyer_name || "—"}</p>
                  </div>
                  <Badge className={cn("text-[10px] capitalize shrink-0", c.status === "open" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600")}>{c.status?.replace("_", " ")}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Guide */}
      <div className="bg-muted/30 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wide mb-2 tracking-[0.04em]">{t("what_we_check", "What we check")}</h3>
        <ul className="text-xs text-[#71717a] dark:text-gray-400 space-y-1 tracking-[0.04em]">
          <li>• <strong>{t("existing_clients", "Existing clients")}</strong> {t("name_email_and_id_number", "— name, email, and ID number")}</li>
          <li>• <strong>{t("case_parties", "Case parties")}</strong> {t(
              "client_names_opposing_parties_",
              "— client names, opposing parties, opposing counsel, and judges"
            )}</li>
          <li>• <strong>{t("case_content", "Case content")}</strong> {t(
              "keywords_in_case_titles_descri",
              "— keywords in case titles, descriptions, and notes"
            )}</li>
        </ul>
      </div>
    </div>
  );
}