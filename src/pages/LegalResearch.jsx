import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/shared/PageHeader";
import { Sparkles, BookOpen, Scale, Loader2, AlertTriangle, ChevronDown, ChevronUp, Search, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { generateText } from "@/lib/cloudflareAI";

const JURISDICTIONS = ["Ghana", "Nigeria", "Sierra Leone", "West Africa (General)", "International"];
const CASE_TYPES = ["civil", "criminal", "corporate", "family", "property", "labor", "tax", "other"];
const CONFIDENCE_COLORS = { high: "bg-green-100 text-green-700", medium: "bg-yellow-100 text-yellow-700", low: "bg-red-100 text-red-700" };

function Section({ icon: Icon, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">{title}</span></div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export default function LegalResearch() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [jurisdiction, setJurisdiction] = useState("Ghana");
  const [caseType, setCaseType] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const handleResearch = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const prompt = `You are an expert legal researcher for West African jurisdictions.
Task: Perform legal research on the following question regarding ${jurisdiction} law (Case Type: ${caseType || 'Any'}).
Question: ${question}

Return ONLY a valid JSON object with this exact structure. 
CRITICAL: You MUST escape all newlines in string values as \\n. Do not use raw newlines inside strings.
{
  "answer": "Detailed answer in markdown",
  "confidence": "high|medium|low",
  "legislation": [{"name": "Act Name", "section": "Section X", "relevance": "Why"}],
  "case_law": [{"case_name": "Case Name", "year": "YYYY", "principle": "Principle"}],
  "next_steps": ["Step 1", "Step 2"],
  "practical_notes": "Markdown notes",
  "caveats": "Warning text"
}`;
      const responseText = await generateText([{ role: 'user', content: prompt }]);
      
      let cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      // Remove any remaining raw control characters (like literal newlines) that break JSON.parse
      cleanJson = cleanJson.replace(/[\u0000-\u001F]+/g, (match) => {
        // preserve actual newlines if they are outside strings (roughly)
        // this is a naive fix, relying mostly on the prompt instruction above
        return "";
      });

      const data = JSON.parse(cleanJson);
      
      setResult(data);
      setHistory(prev => [{ question, jurisdiction, caseType, result: data, timestamp: new Date() }, ...prev].slice(0, 10));
    } catch (err) {
      setError("AI Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Legal Research Assistant"
        subtitle="AI-powered research on West African law — case law, statutes, and practical guidance"
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Query Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">{t("ask_a_legal_question", "Ask a Legal Question")}</h2>
            </div>
            <div>
              <Label className="text-xs mb-1">{t("your_question", "Your Question *")}</Label>
              <Textarea
                placeholder="e.g. What are the requirements for filing a caveat against probate in Ghana?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="min-h-[120px] resize-none text-sm"
              />
            </div>
            <div>
              <Label className="text-xs mb-1">{t("jurisdiction", "Jurisdiction")}</Label>
              <Select value={jurisdiction} onValueChange={setJurisdiction}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{JURISDICTIONS.map(j => {
                  return <SelectItem key={j} value={j}>{j}</SelectItem>;
                })}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1">{t("case_type_optional", "Case Type (optional)")}</Label>
              <Select value={caseType} onValueChange={setCaseType}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>{t("any", "Any")}</SelectItem>
                  {CASE_TYPES.map(item => {
                    return <SelectItem key={item} value={item} className="capitalize">{item}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full gap-2" onClick={handleResearch} disabled={loading || !question.trim()}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />{t("researching", "Researching...")}</> : <><Search className="w-4 h-4" />{t("research", "Research")}</>}
            </Button>
            {loading && <p className="text-xs text-muted-foreground text-center">{t(
              "searching_case_law_and_statute",
              "Searching case law and statutes... (~30s)"
            )}</p>}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-primary" /><h3 className="text-sm font-semibold">{t("recent_queries", "Recent Queries")}</h3></div>
              {history.map((h, i) => {
                return (
                  <button key={i} onClick={() => { setQuestion(h.question); setResult(h.result); }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-muted/40 border border-border transition-colors">
                    <p className="text-xs font-medium truncate">{h.question}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{h.jurisdiction} · {format(h.timestamp, "h:mm a")}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {!result && !loading && !error && (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"><BookOpen className="w-7 h-7 text-primary" /></div>
              <h3 className="text-sm font-semibold mb-1">{t("ask_your_first_question", "Ask your first question")}</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">{t(
                "get_instant_research_on_statut",
                "Get instant research on statutes, case law, and legal procedures across Ghana, Nigeria, and Sierra Leone."
              )}</p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {["Requirements for bail in Nigeria", "Tenancy termination notice periods Ghana", "Corporate registration requirements Sierra Leone"].map(s => {
                  return (<button key={s} onClick={() => setQuestion(s)} className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/5 transition-colors">{s}</button>);
                })}
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">{t("research_results", "Research Results")}</span></div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{jurisdiction}</Badge>
                  {result.confidence && <Badge className={cn("text-[10px]", CONFIDENCE_COLORS[result.confidence])}>{t("confidence", "Confidence:")} {result.confidence}</Badge>}
                </div>
              </div>

              {/* Main Answer */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2"><Scale className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">{t("answer", "Answer")}</span></div>
                <div className="text-sm text-foreground leading-relaxed prose prose-sm max-w-none">
                  <ReactMarkdown>{result.answer}</ReactMarkdown>
                </div>
              </div>

              {/* Legislation */}
              {result.legislation?.length > 0 && (
                <Section icon={BookOpen} title={`Relevant Legislation (${result.legislation.length})`}>
                  <div className="space-y-2 pt-1">
                    {result.legislation.map((l, i) => {
                      return (
                        <div key={i} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm font-medium text-blue-800">{l.name}{l.section && ` — ${l.section}`}</p>
                          {l.relevance && <p className="text-xs text-blue-700 mt-0.5">{l.relevance}</p>}
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}

              {/* Case Law */}
              {result.case_law?.length > 0 && (
                <Section icon={Scale} title={`Case Law Precedents (${result.case_law.length})`}>
                  <div className="space-y-2 pt-1">
                    {result.case_law.map((c, i) => {
                      return (
                        <div key={i} className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <p className="text-sm font-medium text-purple-800">{c.case_name}{c.year && ` (${c.year})`}</p>
                          {c.principle && <p className="text-xs text-purple-700 mt-0.5">{c.principle}</p>}
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}

              {/* Next Steps */}
              {result.next_steps?.length > 0 && (
                <Section icon={BookOpen} title="Recommended Next Steps" defaultOpen={false}>
                  <div className="space-y-1.5 pt-1">
                    {result.next_steps.map((s, i) => {
                      return (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                          <span>{s}</span>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}

              {/* Practical Notes & Caveats */}
              {(result.practical_notes || result.caveats) && (
                <Section icon={AlertTriangle} title="Practical Notes & Caveats" defaultOpen={false}>
                  <div className="space-y-2 pt-1">
                    {result.practical_notes && <div className="text-sm text-foreground"><ReactMarkdown>{result.practical_notes}</ReactMarkdown></div>}
                    {result.caveats && <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800"><AlertTriangle className="w-3.5 h-3.5 inline mr-1.5" />{result.caveats}</div>}
                  </div>
                </Section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}