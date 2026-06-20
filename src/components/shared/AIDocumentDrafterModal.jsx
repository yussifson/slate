import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Sparkles, FileText, CheckCircle, Copy, Download } from "lucide-react";
import { generateText } from "@/lib/cloudflareAI";
import { toast } from "react-hot-toast";
import { base44 } from "@/api/base44Client";

export default function AIDocumentDrafterModal({ isOpen, onClose, companyId, user, cases, onSaved }) {
  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftResult, setDraftResult] = useState(null);

  const [formData, setFormData] = useState({
    docType: "Motion to Dismiss",
    caseId: "",
    instructions: ""
  });

  const handleDraft = async () => {
    if (!formData.docType || !formData.instructions) {
      return toast.error("Please provide document type and instructions.");
    }
    
    setIsGenerating(true);
    const tId = toast.loading('AI is drafting the legal document...');
    
    try {
      const selectedCase = cases.find(c => c.id === formData.caseId);
      let caseContext = selectedCase 
        ? `Case context: Title: ${selectedCase.title}. Parties: ${selectedCase.client_name} vs ${selectedCase.opposing_party}.` 
        : "No specific case linked.";

      const prompt = `You are an expert Legal Document Drafter.
Task: Draft a formal legal document based on these instructions.
Document Type: ${formData.docType}
${caseContext}
Specific Instructions: ${formData.instructions}

Draft the entire document in professional markdown formatting. Use placeholders like [Insert Name] where information is missing.
Output ONLY the markdown content, no extra conversational text.`;

      const rawResponse = await generateText([{ role: 'user', content: prompt }]);
      const cleanMd = rawResponse.replace(/```markdown/gi, '').replace(/```/g, '').trim();
      
      setDraftResult(cleanMd);
      toast.success('Document drafted successfully!', { id: tId });
    } catch (err) {
      toast.error('Failed to draft document: ' + err.message, { id: tId });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToDocuments = async () => {
    if (!draftResult) return;
    const tId = toast.loading('Saving drafted document...');
    try {
      const selectedCase = cases.find(c => c.id === formData.caseId);
      await base44.entities.Document.create({
        company_id: companyId,
        uploaded_by: user?.email,
        name: `AI Drafted - ${formData.docType}`,
        category: "Contracts / Legal",
        case_id: formData.caseId || null,
        case_title: selectedCase ? selectedCase.title : null,
        content: draftResult,
        file_url: "ai-drafted"
      });
      toast.success('Saved to documents vault!', { id: tId });
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      toast.error('Failed to save document: ' + err.message, { id: tId });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(draftResult);
    toast.success("Copied to clipboard!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-primary/20 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5"/> {t("ai_document_drafter", "AI Legal Document Drafter")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/20">
          {!draftResult ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("document_type", "Document Type")}</Label>
                  <Select value={formData.docType} onValueChange={(val) => setFormData({ ...formData, docType: val })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Motion to Dismiss">Motion to Dismiss</SelectItem>
                      <SelectItem value="Cease and Desist Letter">Cease and Desist Letter</SelectItem>
                      <SelectItem value="Settlement Agreement">Settlement Agreement</SelectItem>
                      <SelectItem value="Non-Disclosure Agreement">Non-Disclosure Agreement</SelectItem>
                      <SelectItem value="Demand Letter">Demand Letter</SelectItem>
                      <SelectItem value="Affidavit">Affidavit</SelectItem>
                      <SelectItem value="Custom">Custom...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("link_to_case", "Link to Case (Optional)")}</Label>
                  <Select value={formData.caseId} onValueChange={(val) => setFormData({ ...formData, caseId: val === "none" ? "" : val })}>
                    <SelectTrigger><SelectValue placeholder="Select case..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No case linked</SelectItem>
                      {cases.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("instructions_facts", "Specific Instructions & Facts")}</Label>
                <Textarea 
                  className="h-32 resize-none" 
                  placeholder="E.g., Draft a cease and desist for intellectual property theft regarding our client's patented software..."
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                />
              </div>

              <Button onClick={handleDraft} disabled={isGenerating} className="w-full gap-2 bg-primary hover:bg-primary/90 text-white">
                <Sparkles className="w-4 h-4"/> {isGenerating ? 'Drafting...' : 'Generate Legal Document'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex justify-between items-center shrink-0">
                <h3 className="font-semibold text-primary flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Draft Ready</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDraftResult(null)}>New Draft</Button>
                  <Button variant="outline" size="sm" onClick={copyToClipboard}><Copy className="w-4 h-4 mr-2"/> Copy</Button>
                  <Button size="sm" onClick={handleSaveToDocuments} className="bg-primary hover:bg-primary/90 text-white"><Download className="w-4 h-4 mr-2"/> Save to Documents Vault</Button>
                </div>
              </div>
              <div className="flex-1 bg-white dark:bg-slate-950 border-[0.5px] border-black/9 dark:border-white/8 rounded-xl p-6 overflow-y-auto font-mono text-sm shadow-sm">
                <pre className="whitespace-pre-wrap">{draftResult}</pre>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
