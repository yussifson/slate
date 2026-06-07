import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Upload, Sparkles, FileText, Calendar, AlertTriangle,
  Clock, Users, ChevronDown, ChevronUp, Loader2, X, CheckCircle
} from "lucide-react";
import { format, parseISO, isValid, isBefore } from "date-fns";
import { generateText, analyzeImage } from "@/lib/cloudflareAI";

const URGENCY_COLORS = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-primary/10 text-primary/90 border-primary/20",
};

const IMPORTANCE_COLORS = {
  high: "bg-red-50 border-red-200 text-red-800",
  medium: "bg-primary/5 border-primary/20 text-primary/80",
  low: "bg-gray-50 border-gray-200 text-gray-700",
};

const DATE_TYPE_COLORS = {
  Hearing: "bg-primary/10 text-primary/90",
  Signing: "bg-orange-100 text-orange-700",
  Effective: "bg-primary/10 text-primary/90",
  Expiry: "bg-red-100 text-red-700",
  Filing: "bg-orange-100 text-orange-700",
  Payment: "bg-yellow-100 text-yellow-700",
};

function SectionCard({ icon: Icon, title, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">{title}</span>
          {count !== undefined && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{count}</Badge>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-2">{children}</div>}
    </div>
  );
}

function CalendarView({ dates, deadlines }) {
  const { t } = useTranslation();
  const today = new Date();
  const allEvents = [
    ...(dates || []).map(d => ({ ...d, label: d.label, category: "date", colorKey: d.type || "Filing" })),
    ...(deadlines || []).map(d => ({ ...d, label: d.description, category: "deadline", colorKey: "deadline" })),
  ]
    .filter(e => e.date && isValid(parseISO(e.date)))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (allEvents.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">{t("no_dates_extracted", "No dates extracted")}</p>;

  return (
    <div className="space-y-2">
      {allEvents.map((event, i) => {
        const d = parseISO(event.date);
        const isPast = isBefore(d, today);
        return (
          <div key={i} className={cn("flex items-center gap-3 p-3 rounded-lg border", isPast ? "opacity-60 bg-muted/30 border-border" : "bg-card border-border")}>
            <div className={cn("w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 text-white", isPast ? "bg-muted-foreground" : "bg-primary")}>
              <span className="text-[9px] font-bold leading-none">{format(d, "MMM").toUpperCase()}</span>
              <span className="text-lg font-bold leading-none">{format(d, "d")}</span>
              <span className="text-[9px] leading-none">{format(d, "yyyy")}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{event.label}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {event.category === "deadline" ? (
                  <Badge className={cn("text-[9px] h-4 px-1.5", URGENCY_COLORS[event.urgency] || URGENCY_COLORS.medium)}>
                    {event.urgency} {t("deadline", "deadline")}
                  </Badge>
                ) : (
                  <Badge className={cn("text-[9px] h-4 px-1.5", DATE_TYPE_COLORS[event.colorKey] || "bg-gray-100 text-gray-700")}>
                    {event.type || "Date"}
                  </Badge>
                )}
                {isPast && <span className="text-[10px] text-muted-foreground">{t("past", "Past")}</span>}
              </div>
              {event.party_responsible && <p className="text-xs text-muted-foreground mt-0.5">{t("responsible", "Responsible:")} {event.party_responsible}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AIDocumentReview({ caseData }) {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [docName, setDocName] = useState("");

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setDocName(f.name);
      setAnalysis(null);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setFile(f);
      setDocName(f.name);
      setAnalysis(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setError(null);
    setAnalyzing(true);
    
    try {
      const prompt = `Analyze this legal document (${docName}).
Return ONLY a valid JSON object with this exact structure.
CRITICAL: You MUST escape all newlines in string values as \\n. Do not use raw newlines inside strings.
{
  "summary": "Executive summary of the document",
  "risk_flags": [{"flag": "Risk description", "severity": "critical|high|medium|low"}],
  "key_legal_points": [{"point": "Key point", "importance": "high|medium|low", "category": "Obligation|Right|Condition"}],
  "deadlines": [{"description": "What is due", "date": "YYYY-MM-DD", "urgency": "high|medium|low", "party_responsible": "Who"}],
  "important_dates": [{"label": "Hearing date etc", "date": "YYYY-MM-DD", "type": "Hearing|Signing|Effective"}],
  "parties": [{"name": "Name", "role": "Role"}]
}`;

      let responseText = "";
      
      if (file.type.startsWith("image/")) {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        responseText = await analyzeImage(bytes, prompt);
      } else if (file.type === "text/plain") {
        const textContent = await file.text();
        const fullPrompt = `${prompt}\n\nDocument Content:\n${textContent}`;
        responseText = await generateText([{ role: 'user', content: fullPrompt }]);
      } else {
        throw new Error("Currently, the browser-based Cloudflare AI only supports .txt files and Images. For PDFs, a backend PDF parser must be deployed.");
      }

      let cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      cleanJson = cleanJson.replace(/[\u0000-\u001F]+/g, "");
      const data = JSON.parse(cleanJson);
      
      setAnalysis(data);
    } catch (err) {
      setError(err.message || "Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveDates = async () => {
    if (!analysis) return;
    const allDates = [
      ...(analysis.important_dates || []),
      ...(analysis.deadlines || []).map(d => ({ label: d.description, date: d.date, type: "Deadline" })),
    ].filter(d => d.date && isValid(parseISO(d.date)));

    await Promise.all(allDates.map(d =>
      base44.entities.Hearing.create({
        company_id: caseData.company_id,
        case_id: caseData.id,
        case_title: caseData.title,
        case_number: caseData.case_number,
        title: d.label,
        date: d.date,
        status: "scheduled",
        notes: `Extracted by AI Document Review from: ${docName}`,
      })
    ));
    alert(`${allDates.length} date(s) saved to the case calendar!`);
  };

  const isLoading = uploading || analyzing;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
          file ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
        )}
      >
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle className="w-8 h-8 text-primary" />
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} {t("kb", "KB")}</p>
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => { setFile(null); setAnalysis(null); }}>
              <X className="w-3 h-3" /> {t("remove", "Remove")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{t(
                "drop_a_document_here_or_click_",
                "Drop a document here or click to upload"
              )}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("pdf_docx_txt_images_supported", "PDF, DOCX, TXT, images supported")}</p>
            </div>
            <label className="cursor-pointer">
              <Button size="sm" variant="outline" asChild>
                <span><Upload className="w-3.5 h-3.5 mr-1.5" />{t("browse_files", "Browse Files")}</span>
              </Button>
              <input type="file" className="hidden" accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg" onChange={handleFileChange} />
            </label>
          </div>
        )}
      </div>
      {/* Analyze Button */}
      {file && !analysis && (
        <Button onClick={handleAnalyze} disabled={isLoading} className="w-full gap-2" size="lg">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {uploading ? "Uploading document..." : "AI is analyzing... (this may take 30–60s)"}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {t("analyze_with_ai", "Analyze with AI")}
            </>
          )}
        </Button>
      )}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">{t("ai_analysis_complete", "AI Analysis Complete")}</span>
              <Badge variant="secondary" className="text-[10px]">{docName}</Badge>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={handleSaveDates}>
              <Calendar className="w-3.5 h-3.5" />
              {t("save_all_dates_to_calendar", "Save All Dates to Calendar")}
            </Button>
          </div>

          {/* Summary */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">{t("executive_summary", "Executive Summary")}</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{analysis.summary}</p>
          </div>

          {/* Risk Flags */}
          {analysis.risk_flags?.length > 0 && (
            <SectionCard icon={AlertTriangle} title="Risk Flags" count={analysis.risk_flags.length}>
              {analysis.risk_flags.map((r, i) => {
                return (
                  <div key={i} className={cn("flex items-start gap-2 p-2.5 rounded-lg border text-sm", URGENCY_COLORS[r.severity] || URGENCY_COLORS.medium)}>
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <span>{r.flag}</span>
                      <Badge className={cn("ml-2 text-[9px] h-4 px-1.5", URGENCY_COLORS[r.severity])}>{r.severity}</Badge>
                    </div>
                  </div>
                );
              })}
            </SectionCard>
          )}

          {/* Key Legal Points */}
          {analysis.key_legal_points?.length > 0 && (
            <SectionCard icon={FileText} title="Key Legal Points" count={analysis.key_legal_points.length}>
              {analysis.key_legal_points.map((p, i) => {
                return (
                  <div key={i} className={cn("p-2.5 rounded-lg border text-sm", IMPORTANCE_COLORS[p.importance] || IMPORTANCE_COLORS.low)}>
                    <div className="flex items-start gap-2">
                      <span className="flex-1">{p.point}</span>
                    </div>
                    <div className="flex gap-1.5 mt-1">
                      {p.category && <Badge variant="outline" className="text-[9px] h-4 px-1.5">{p.category}</Badge>}
                      <Badge className={cn("text-[9px] h-4 px-1.5", IMPORTANCE_COLORS[p.importance])}>{p.importance}</Badge>
                    </div>
                  </div>
                );
              })}
            </SectionCard>
          )}

          {/* Deadlines */}
          {analysis.deadlines?.length > 0 && (
            <SectionCard icon={Clock} title="Deadlines" count={analysis.deadlines.length}>
              {analysis.deadlines.map((d, i) => {
                return (
                  <div key={i} className={cn("p-2.5 rounded-lg border text-sm", URGENCY_COLORS[d.urgency] || URGENCY_COLORS.medium)}>
                    <p className="font-medium">{d.description}</p>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs">
                      {d.date && isValid(parseISO(d.date)) && (
                        <span className="font-semibold">{format(parseISO(d.date), "MMMM d, yyyy")}</span>
                      )}
                      {d.party_responsible && <span>→ {d.party_responsible}</span>}
                      <Badge className={cn("text-[9px] h-4 px-1.5", URGENCY_COLORS[d.urgency])}>{d.urgency}</Badge>
                    </div>
                  </div>
                );
              })}
            </SectionCard>
          )}

          {/* Calendar View */}
          <SectionCard icon={Calendar} title="All Dates — Calendar View" count={(analysis.important_dates?.length || 0) + (analysis.deadlines?.length || 0)}>
            <CalendarView dates={analysis.important_dates} deadlines={analysis.deadlines} />
          </SectionCard>

          {/* Parties */}
          {analysis.parties?.length > 0 && (
            <SectionCard icon={Users} title="Parties Involved" count={analysis.parties.length} defaultOpen={false}>
              <div className="grid grid-cols-2 gap-2">
                {analysis.parties.map((p, i) => {
                  return (
                    <div key={i} className="bg-muted/40 rounded-lg p-2.5 text-sm">
                      <p className="font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.role}</p>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* Re-analyze */}
          <Button variant="outline" className="w-full gap-2" onClick={() => { setAnalysis(null); setFile(null); }}>
            <Upload className="w-4 h-4" /> {t("analyze_another_document", "Analyze Another Document")}
          </Button>
        </div>
      )}
    </div>
  );
}