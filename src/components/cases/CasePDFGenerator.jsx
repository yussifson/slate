import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download, Loader2, Eye, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import jsPDF from "jspdf";

function buildBillingHearingPDF(caseData, client, invoices, timeEntries, hearings) {
  const doc = new jsPDF();
  const today = format(new Date(), "MMMM d, yyyy");
  const margin = 20;
  let y = margin;
  const lineHeight = 7;
  const currencySymbol = caseData.currency === "NGN" ? "₦" : caseData.currency === "USD" ? "$" : "GH₵";

  const addLine = (text, options = {}) => {
    const { bold = false, size = 10, color = [40, 40, 40], indent = 0 } = options;
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, 170 - indent);
    lines.forEach(line => {
      if (y > 275) { doc.addPage(); y = margin; }
      doc.text(line, margin + indent, y);
      y += lineHeight;
    });
  };
  const addSpacer = (n = 1) => { y += lineHeight * n; };
  const addDivider = () => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, 190, y);
    y += 5;
  };

  // Header bar
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, 210, 18, "F");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("LEXAFRICA — LAW MANAGEMENT", margin, 12);
  y = 28;

  addLine("CLIENT BILLING & HEARING HISTORY REPORT", { bold: true, size: 15, color: [30, 64, 175] });
  addSpacer(0.5);
  addLine(`Report Date: ${today}`, { size: 9, color: [100, 100, 100] });
  addSpacer();

  // Case summary
  addLine("CASE INFORMATION", { bold: true, size: 11 });
  addDivider();
  addLine(`Case Title: ${caseData.title || "—"}`, { indent: 4 });
  addLine(`Case Number: ${caseData.case_number || "—"}`, { indent: 4 });
  addLine(`Client: ${client?.name || caseData.client_name || "—"}`, { indent: 4 });
  addLine(`Assigned Lawyer: ${caseData.assigned_lawyer_name || "—"}`, { indent: 4 });
  addLine(`Status: ${caseData.status?.replace(/_/g, " ").toUpperCase() || "—"}`, { indent: 4 });
  addLine(`Court: ${caseData.court_name || "—"}`, { indent: 4 });
  addSpacer();

  // Billing summary
  const totalBilled = invoices.reduce((s, i) => s + (i.total_amount || 0), 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.total_amount || 0), 0);
  const outstanding = totalBilled - totalPaid;
  const totalHours = timeEntries.reduce((s, t) => s + (item.hours || 0), 0);

  addLine("BILLING SUMMARY", { bold: true, size: 11 });
  addDivider();
  addLine(`Total Invoiced: ${currencySymbol}${totalBilled.toLocaleString()}`, { indent: 4 });
  addLine(`Total Paid: ${currencySymbol}${totalPaid.toLocaleString()}`, { indent: 4 });
  addLine(`Outstanding Balance: ${currencySymbol}${outstanding.toLocaleString()}`, { indent: 4, bold: outstanding > 0 });
  addLine(`Total Billable Hours Logged: ${totalHours.toFixed(2)} hrs`, { indent: 4 });
  addSpacer();

  // Invoice list
  if (invoices.length > 0) {
    addLine("INVOICE HISTORY", { bold: true, size: 11 });
    addDivider();
    invoices.forEach(inv => {
      const sym = inv.currency === "NGN" ? "₦" : inv.currency === "USD" ? "$" : "GH₵";
      addLine(
        `${inv.invoice_number || "Invoice"} — ${sym}${(inv.total_amount || 0).toLocaleString()} — ${inv.status?.toUpperCase()} — Due: ${inv.due_date ? format(new Date(inv.due_date), "MMM d, yyyy") : "—"}`,
        { indent: 4, size: 9 }
      );
    });
    addSpacer();
  }

  // Time entries summary
  if (timeEntries.length > 0) {
    addLine("BILLABLE HOURS LOG", { bold: true, size: 11 });
    addDivider();
    timeEntries.slice(0, 20).forEach(item => {
      addLine(
        `${item.date ? format(new Date(item.date), "MMM d, yyyy") : "—"} — ${item.hours || 0}h — ${item.description || "Work performed"} (${item.billed ? "Billed" : "Unbilled"})`,
        { indent: 4, size: 9 }
      );
    });
    if (timeEntries.length > 20) addLine(`... and ${timeEntries.length - 20} more entries`, { indent: 4, size: 9, color: [120, 120, 120] });
    addSpacer();
  }

  // Hearing history
  if (hearings.length > 0) {
    addLine("HEARING HISTORY", { bold: true, size: 11 });
    addDivider();
    hearings.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(h => {
      addLine(
        `${h.date ? format(new Date(h.date), "MMM d, yyyy") : "—"} — ${h.title} — ${h.court_name || "—"} — ${h.status?.toUpperCase()}${h.outcome ? " — " + h.outcome : ""}`,
        { indent: 4, size: 9 }
      );
    });
    addSpacer();
  }

  // Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text(`Slate Law Management | Generated: ${today} | Page ${i} of ${totalPages}`, margin, 290);
  }

  return doc;
}

const TEMPLATES = [
  {
    id: "legal_notice",
    label: "Legal Notice",
    description: "Formal legal notice to opposing party",
  },
  {
    id: "court_filing",
    label: "Court Filing Cover Sheet",
    description: "Standard cover sheet for court submissions",
  },
  {
    id: "client_summary",
    label: "Client Case Summary",
    description: "Summary report for client communication",
  },
  {
    id: "engagement_letter",
    label: "Engagement Letter",
    description: "Initial engagement and retainer agreement letter",
  },
];

function buildPDF(template, caseData, client, additionalNotes) {
  const doc = new jsPDF();
  const today = format(new Date(), "MMMM d, yyyy");
  const margin = 20;
  let y = margin;

  const parsedNotes = additionalNotes ? additionalNotes
    .replace(/{client_name}/g, client?.name || caseData.client_name || "[Client Name]")
    .replace(/{case_number}/g, caseData.case_number || "[Case Number]")
    .replace(/{case_title}/g, caseData.title || "[Case Title]")
    .replace(/{lawyer_name}/g, caseData.assigned_lawyer_name || "[Lawyer Name]")
    .replace(/{opposing_party}/g, caseData.opposing_party || "[Opposing Party]")
    .replace(/{court_name}/g, caseData.court_name || "[Court Name]")
    .replace(/{today}/g, today) : "";

  const lineHeight = 7;

  const addLine = (text, options = {}) => {
    const { bold = false, size = 10, color = [40, 40, 40], indent = 0 } = options;
    doc.setFontSize(size);
    doc.setTextColor(...color);
    if (bold) doc.setFont("helvetica", "bold");
    else doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, 170 - indent);
    lines.forEach(line => {
      if (y > 275) { doc.addPage(); y = margin; }
      doc.text(line, margin + indent, y);
      y += lineHeight;
    });
  };

  const addSpacer = (n = 1) => { y += lineHeight * n; };
  const addDivider = () => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, 190, y);
    y += 5;
  };

  // Header bar
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, 210, 18, "F");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("LEXAFRICA — LAW MANAGEMENT", margin, 12);
  y = 28;

  if (template === "legal_notice") {
    addLine("LEGAL NOTICE", { bold: true, size: 16, color: [30, 64, 175] });
    addSpacer(0.5);
    addLine(`Date: ${today}`, { size: 9, color: [100, 100, 100] });
    addLine(`Reference: ${caseData.case_number || "N/A"}`, { size: 9, color: [100, 100, 100] });
    addSpacer();
    addDivider();
    addLine("TO WHOM IT MAY CONCERN", { bold: true, size: 11 });
    addSpacer(0.5);
    addLine(`Re: ${caseData.title}`, { bold: true, size: 11 });
    addSpacer();
    addLine(`This Legal Notice is issued on behalf of our client, ${client?.name || caseData.client_name || "Our Client"}, in connection with the matter referenced above.`, { size: 10 });
    addSpacer();
    addLine("CASE DETAILS", { bold: true, size: 11 });
    addDivider();
    addLine(`Case Title: ${caseData.title || "—"}`, { indent: 4 });
    addLine(`Case Number: ${caseData.case_number || "—"}`, { indent: 4 });
    addLine(`Case Type: ${caseData.case_type?.replace("_", " ").toUpperCase() || "—"}`, { indent: 4 });
    addLine(`Client: ${client?.name || caseData.client_name || "—"}`, { indent: 4 });
    addLine(`Opposing Party: ${caseData.opposing_party || "—"}`, { indent: 4 });
    addLine(`Court: ${caseData.court_name || "—"}`, { indent: 4 });
    addLine(`Assigned Lawyer: ${caseData.assigned_lawyer_name || "—"}`, { indent: 4 });
    addSpacer();
    if (parsedNotes) {
      addLine("NOTICE CONTENT", { bold: true, size: 11 });
      addDivider();
      addLine(parsedNotes, { size: 10, indent: 4 });
      addSpacer();
    }
    addLine("You are hereby formally notified and required to take appropriate action within the legally prescribed timeframe.", { size: 10 });
    addSpacer(2);
    addLine("Yours faithfully,", { size: 10 });
    addSpacer();
    addLine(caseData.assigned_lawyer_name || "Legal Counsel", { bold: true, size: 10 });
    addLine("Slate Law Management", { size: 10 });

  } else if (template === "court_filing") {
    addLine("COURT FILING — COVER SHEET", { bold: true, size: 16, color: [30, 64, 175] });
    addSpacer(0.5);
    addLine(`Date Filed: ${today}`, { size: 9, color: [100, 100, 100] });
    addSpacer();
    addDivider();
    addLine("FILING INFORMATION", { bold: true, size: 11 });
    addSpacer(0.5);
    addLine(`Case Title: ${caseData.title || "—"}`, { indent: 4 });
    addLine(`Case Number: ${caseData.case_number || "—"}`, { indent: 4 });
    addLine(`Court Name: ${caseData.court_name || "—"}`, { indent: 4 });
    addLine(`Presiding Judge: ${caseData.judge_name || "—"}`, { indent: 4 });
    addLine(`Filing Date: ${caseData.filing_date ? format(new Date(caseData.filing_date), "MMMM d, yyyy") : today}`, { indent: 4 });
    addSpacer();
    addLine("PARTY INFORMATION", { bold: true, size: 11 });
    addDivider();
    addLine(`Plaintiff / Client: ${client?.name || caseData.client_name || "—"}`, { indent: 4 });
    if (client?.address) addLine(`Address: ${client.address}${client.city ? ", " + client.city : ""}`, { indent: 4 });
    if (client?.phone) addLine(`Phone: ${client.phone}`, { indent: 4 });
    addLine(`Opposing Party: ${caseData.opposing_party || "—"}`, { indent: 4 });
    addLine(`Opposing Counsel: ${caseData.opposing_counsel || "—"}`, { indent: 4 });
    addSpacer();
    addLine("COUNSEL ON RECORD", { bold: true, size: 11 });
    addDivider();
    addLine(`Attorney: ${caseData.assigned_lawyer_name || "—"}`, { indent: 4 });
    addSpacer();
    if (parsedNotes) {
      addLine("NOTES / DESCRIPTION", { bold: true, size: 11 });
      addDivider();
      addLine(parsedNotes, { size: 10, indent: 4 });
    }

  } else if (template === "client_summary") {
    addLine("CLIENT CASE SUMMARY REPORT", { bold: true, size: 16, color: [30, 64, 175] });
    addSpacer(0.5);
    addLine(`Report Date: ${today}`, { size: 9, color: [100, 100, 100] });
    addSpacer();
    addDivider();
    addLine(`Dear ${client?.name || caseData.client_name || "Client"},`, { size: 10 });
    addSpacer(0.5);
    addLine("Please find below a summary of your current case status with our firm.", { size: 10 });
    addSpacer();
    addLine("YOUR CASE AT A GLANCE", { bold: true, size: 11 });
    addDivider();
    addLine(`Case Title: ${caseData.title || "—"}`, { indent: 4 });
    addLine(`Reference Number: ${caseData.case_number || "—"}`, { indent: 4 });
    addLine(`Case Type: ${caseData.case_type?.replace("_", " ") || "—"}`, { indent: 4 });
    addLine(`Current Status: ${caseData.status?.replace("_", " ").toUpperCase() || "—"}`, { indent: 4 });
    addLine(`Priority: ${caseData.priority?.toUpperCase() || "—"}`, { indent: 4 });
    addLine(`Filing Date: ${caseData.filing_date ? format(new Date(caseData.filing_date), "MMMM d, yyyy") : "—"}`, { indent: 4 });
    addLine(`Next Hearing: ${caseData.next_hearing_date ? format(new Date(caseData.next_hearing_date), "MMMM d, yyyy") : "Not scheduled"}`, { indent: 4 });
    addSpacer();
    addLine("COURT INFORMATION", { bold: true, size: 11 });
    addDivider();
    addLine(`Court: ${caseData.court_name || "—"}`, { indent: 4 });
    addLine(`Judge: ${caseData.judge_name || "—"}`, { indent: 4 });
    addLine(`Opposing Party: ${caseData.opposing_party || "—"}`, { indent: 4 });
    addSpacer();
    if (caseData.notes) {
      addLine("CASE NOTES", { bold: true, size: 11 });
      addDivider();
      addLine(caseData.notes, { size: 10, indent: 4 });
      addSpacer();
    }
    if (parsedNotes) {
      addLine("ADDITIONAL UPDATES", { bold: true, size: 11 });
      addDivider();
      addLine(parsedNotes, { size: 10, indent: 4 });
      addSpacer();
    }
    addLine(`Your assigned attorney is ${caseData.assigned_lawyer_name || "our team"}, who remains committed to vigorously representing your interests.`, { size: 10 });

  } else if (template === "engagement_letter") {
    addLine("ENGAGEMENT LETTER", { bold: true, size: 16, color: [30, 64, 175] });
    addSpacer(0.5);
    addLine(`Date: ${today}`, { size: 9, color: [100, 100, 100] });
    addSpacer();
    addDivider();
    addLine(`${client?.name || caseData.client_name || "Client"}`, { bold: true, size: 11 });
    if (client?.address) addLine(client.address + (client.city ? ", " + client.city : ""), { size: 10 });
    addSpacer();
    addLine(`Dear ${client?.name || caseData.client_name || "Client"},`, { size: 10 });
    addSpacer(0.5);
    addLine(`Re: Engagement for Legal Services — ${caseData.title}`, { bold: true, size: 10 });
    addSpacer();
    addLine("We are pleased to confirm our engagement to represent you in the above-referenced matter. This letter sets out the terms of our engagement.", { size: 10 });
    addSpacer();
    addLine("SCOPE OF SERVICES", { bold: true, size: 11 });
    addDivider();
    addLine(`Case: ${caseData.title || "—"}`, { indent: 4 });
    addLine(`Case Reference: ${caseData.case_number || "—"}`, { indent: 4 });
    addLine(`Case Type: ${caseData.case_type?.replace("_", " ") || "—"}`, { indent: 4 });
    addLine(`Lead Attorney: ${caseData.assigned_lawyer_name || "—"}`, { indent: 4 });
    addSpacer();
    if (parsedNotes) {
      addLine("SPECIFIC TERMS", { bold: true, size: 11 });
      addDivider();
      addLine(parsedNotes, { size: 10, indent: 4 });
      addSpacer();
    }
    addLine("AGREEMENT", { bold: true, size: 11 });
    addDivider();
    addLine("By retaining our firm, you agree to the terms outlined in this engagement letter. Please sign and return a copy to confirm.", { size: 10 });
    addSpacer(3);
    addLine("Client Signature: ____________________________", { size: 10 });
    addSpacer();
    addLine("Date: ____________________________", { size: 10 });
    addSpacer(2);
    addLine(`${caseData.assigned_lawyer_name || "Attorney"}`, { bold: true, size: 10 });
    addLine("Slate Law Management", { size: 10 });
  }

  // Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text(`Slate Law Management | Generated: ${today} | Page ${i} of ${totalPages}`, margin, 290);
  }

  return doc;
}

export default function CasePDFGenerator({ caseData, user }) {
  const { t } = useTranslation();
  const [templateId, setTemplateId] = useState("legal_notice");
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", caseData.company_id],
    queryFn: () => base44.entities.Client.filter({ company_id: caseData.company_id }),
    enabled: !!caseData.company_id,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["case-invoices-pdf", caseData.id],
    queryFn: () => base44.entities.Invoice.filter({ case_id: caseData.id }),
    enabled: !!caseData.id,
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ["case-time-pdf", caseData.id],
    queryFn: () => base44.entities.TimeEntry.filter({ case_id: caseData.id }),
    enabled: !!caseData.id,
  });

  const { data: hearings = [] } = useQuery({
    queryKey: ["case-hearings-pdf", caseData.id],
    queryFn: () => base44.entities.Hearing.filter({ case_id: caseData.id }),
    enabled: !!caseData.id,
  });

  const client = clients.find(c => c.id === caseData.client_id);
  const selectedTemplate = TEMPLATES.find(item => item.id === templateId);

  const [generatingReport, setGeneratingReport] = useState(false);

  const handleDownloadClientReport = async () => {
    setGeneratingReport(true);
    await new Promise(r => setTimeout(r, 400));
    const doc = buildBillingHearingPDF(caseData, client, invoices, timeEntries, hearings);
    doc.save(`Client_Report_${caseData.case_number || caseData.id}.pdf`);
    setGeneratingReport(false);
  };

  const handleGenerate = async (download = true) => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 400));
    const doc = buildPDF(templateId, caseData, client, notes);
    const filename = `${selectedTemplate?.label?.replace(/ /g, "_")}_${caseData.case_number || caseData.id}.pdf`;
    if (download) {
      doc.save(filename);
    } else {
      const blob = doc.output("blob");
      window.open(URL.createObjectURL(blob), "_blank");
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-5">
      {/* Client Report Quick Download */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <BarChart2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary/70">{t("client_billing_hearing_report", "Client Billing & Hearing Report")}</p>
            <p className="text-xs text-primary/90 mt-0.5">{t(
              "download_a_full_summary_of_inv",
              "Download a full summary of invoices, billable hours, and hearing history for this client."
            )}</p>
          </div>
        </div>
        <Button
          onClick={handleDownloadClientReport}
          disabled={generatingReport}
          className="gap-2 bg-primary hover:bg-primary/90 text-white shrink-0"
        >
          {generatingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {generatingReport ? "Generating..." : "Download Report"}
        </Button>
      </div>
      {/* Template picker */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {TEMPLATES.map(item => {
          return (
            <button
              key={item.id}
              onClick={() => setTemplateId(item.id)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${templateId === item.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 bg-card"}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${templateId === item.id ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                <FileText className="w-4 h-4" />
              </div>
              <p className={`text-sm font-semibold ${templateId === item.id ? "text-primary" : "text-foreground"}`}>{item.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{item.description}</p>
            </button>
          );
        })}
      </div>
      {/* Case data preview */}
      <div className="bg-card rounded-xl border border-border p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("case", "Case")}</p><p className="text-sm font-medium">{caseData.title}</p></div>
        <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("client", "Client")}</p><p className="text-sm font-medium">{client?.name || caseData.client_name || "—"}</p></div>
        <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("case", "Case #")}</p><p className="text-sm font-medium">{caseData.case_number || "—"}</p></div>
        <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("court", "Court")}</p><p className="text-sm font-medium">{caseData.court_name || "—"}</p></div>
        <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("lawyer", "Lawyer")}</p><p className="text-sm font-medium">{caseData.assigned_lawyer_name || "—"}</p></div>
        <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("status", "Status")}</p><p className="text-sm font-medium capitalize">{caseData.status?.replace("_", " ")}</p></div>
      </div>
      {/* Additional notes */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs">{t(
            "additional_notes_custom_conten",
            "Additional Notes / Custom Content (optional)"
          )}</Label>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {["{client_name}", "{case_number}", "{case_title}", "{lawyer_name}", "{today}"].map(tag => {
              return (
                <Badge key={tag} variant="outline" className="text-[10px] cursor-pointer hover:bg-muted" onClick={() => setNotes(prev => prev + " " + tag)}>
                  {tag}
                </Badge>
              );
            })}
          </div>
        </div>
        <Textarea
          placeholder="Add specific content. You can use dynamic variables above which will be auto-replaced..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="h-24 text-sm"
        />
      </div>
      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => handleGenerate(false)}
          variant="outline"
          disabled={generating}
          className="gap-2"
        >
          <Eye className="w-4 h-4" />
          {t("preview", "Preview")}
        </Button>
        <Button
          onClick={() => handleGenerate(true)}
          disabled={generating}
          className="gap-2"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {generating ? "Generating..." : `Download ${selectedTemplate?.label}`}
        </Button>
      </div>
    </div>
  );
}