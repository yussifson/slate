import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useFirmSettings } from "@/hooks/useFirmSettings";
import { getTerm } from "@/config/industries";
import { Plus, FolderOpen, Search, Download, Trash2, Upload, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import AddOptionInline from "@/components/shared/AddOptionInline";
import DocumentPreviewModal from "@/components/shared/DocumentPreviewModal";
import AIDocumentDrafterModal from "@/components/shared/AIDocumentDrafterModal";
import { format } from "date-fns";

import { useToast } from "@/components/ui/use-toast";
import { useContracts } from "@/hooks/integrations/useContracts";
import { FileSignature } from "lucide-react";

export default function Documents() {
  const { t } = useTranslation();
  const { sendContract } = useContracts();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { docCategories, addDocCategory } = useFirmSettings();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [previewDoc, setPreviewDoc] = useState(null);
  const [showDrafter, setShowDrafter] = useState(false);
  const [activeTab, setActiveTab] = useState("documents");

  const isAdmin = ["super_admin", "company_admin", "managing_partner"].includes(user?.role);
  const industry = sessionStorage.getItem("slate_industry_override") || user?.company_industry || "law";
  const caseTerm = getTerm(industry, "case");

  const { data: documents = [], isLoading, isError } = useQuery({
    queryKey: ["documents", companyId, user?.email, isAdmin],
    queryFn: async () => {
      const list = await base44.entities.Document.filter({ company_id: companyId });
      if (isAdmin) return list;
      return list.filter(d => d.uploaded_by === user?.email || d.created_by === user?.id);
    },
    enabled: !!companyId,
    retry: 2,
    staleTime: 30_000});

  const { data: cases = [] } = useQuery({
    queryKey: ["cases", companyId, user?.email, isAdmin],
    queryFn: async () => {
      const list = await base44.entities.LegalCase.filter({ company_id: companyId });
      if (isAdmin) return list;
      return list.filter(c => c.assigned_lawyer === user?.email || c.created_by === user?.id);
    },
    enabled: !!companyId});

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Document.create({ ...data, company_id: companyId, uploaded_by: user?.email }),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["documents"] }); 
      setShowForm(false);
      toast({ title: "Document uploaded successfully" });
    },
    onError: (err) => toast({ title: "Failed to upload document", description: err.message, variant: "destructive" })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Document deleted" });
    },
    onError: (err) => toast({ title: "Failed to delete document", description: err.message, variant: "destructive" })
  });

  const filtered = documents.filter(d => {
    const matchSearch = !search || d.name?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || d.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const columns = [
    {
      header: "Document",
      render: row => {
        return (
          <div>
            <p className="font-medium text-sm">{row.name}</p>
            <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{row.case_title || "General"}</p>
          </div>
        );
      }
    },
    { header: "Category", render: row => {
      return <Badge variant="outline" className="text-[10px] capitalize">{row.category?.replace(/_/g, " ")}</Badge>;
    } },
    { header: "Uploaded By", render: row => {
      return <span className="text-sm">{row.uploaded_by || "—"}</span>;
    } },
    { header: "Date", render: row => {
      return <span className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{format(new Date(row.created_date), "MMM d, yyyy")}</span>;
    } },
    {
      header: "Actions",
      render: row => {
        return (
          <div className="flex gap-2">
            {row.file_url && (
              <a href={row.file_url} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="w-3.5 h-3.5" /></Button>
              </a>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(row.id); }}>
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </Button>
          </div>
        );
      }
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Documents"
        subtitle={t("secure_repository_for_files", "Secure repository for files, case documents, and firm policies")}
        actions={
          <div className="flex gap-2">
            <Button onClick={() => setShowDrafter(true)} variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
              <Sparkles className="w-4 h-4" /> {t("ai_draft", "AI Draft")}
            </Button>
            <Button onClick={() => setShowForm(true)} className="gap-2 bg-primary hover:bg-primary/90 text-white">
              <Upload className="w-4 h-4" /> {t("upload", "Upload")}
            </Button>
          </div>
        }
      />
      
      <div className="flex space-x-1 bg-muted/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("documents")}
          className={activeTab === "documents" ? "bg-background text-foreground shadow-sm px-4 py-2 rounded-lg text-sm font-medium transition-all" : "px-4 py-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-all"}
        >
          {t("my_documents", "My Documents")}
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={activeTab === "templates" ? "bg-background text-foreground shadow-sm px-4 py-2 rounded-lg text-sm font-medium transition-all" : "px-4 py-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-all"}
        >
          {t("templates", "Templates")}
        </button>
        <button
          onClick={() => setActiveTab("signatures")}
          className={activeTab === "signatures" ? "bg-background text-foreground shadow-sm px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2" : "px-4 py-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-all flex items-center gap-2"}
        >
          <FileSignature className="w-4 h-4" />
          {t("e_signatures", "E-Signatures")}
        </button>
      </div>

      {activeTab === "documents" && (
        <div className="space-y-4 animate-in fade-in">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
          <Input placeholder="Search documents..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all_categories", "All Categories")}</SelectItem>
            {docCategories.map(c => {
              return <SelectItem key={c} value={c} className="capitalize">{c.replace(/_/g, " ")}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </div>
      {isError && (
        <p className="text-sm text-destructive">Could not load documents. Check your connection and refresh.</p>
      )}
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading && !!companyId}
        onRowClick={(row) => setPreviewDoc(row)}
        emptyTitle={companyId ? "No documents yet" : "Sign in to a workspace to view documents"}
        emptyIcon={FolderOpen}
      />
      </div>
      )}

      {activeTab === "templates" && (
        <div className="p-12 text-center text-muted-foreground bg-card rounded-xl border border-dashed animate-in fade-in mt-4">
          <FileSignature className="w-12 h-12 mx-auto mb-4 opacity-20 text-primary" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Smart Templates</h3>
          <p className="max-w-md mx-auto mb-6">Upload word documents with {'{{merge_tags}}'} to automatically generate filled contracts from client and case data.</p>
          <Button variant="outline" className="gap-2"><Plus className="w-4 h-4" /> Create Template</Button>
        </div>
      )}

      {activeTab === "signatures" && (
        <div className="p-12 text-center text-muted-foreground bg-card rounded-xl border border-dashed animate-in fade-in mt-4">
          <FileSignature className="w-12 h-12 mx-auto mb-4 opacity-20 text-primary" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Native E-Signatures</h3>
          <p className="max-w-md mx-auto mb-6">Send documents for secure digital signing. Track signatures, IP addresses, and generate legally binding audit certificates.</p>
          <Button variant="outline" className="gap-2"><Plus className="w-4 h-4" /> Request Signature</Button>
        </div>
      )}
      <DocumentUploadDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        cases={cases}
        docCategories={docCategories}
        addDocCategory={addDocCategory}
        companyId={companyId}
        caseTerm={caseTerm}
      />
      {previewDoc && (
        <DocumentPreviewModal
          fileUrl={previewDoc.file_url}
          fileName={previewDoc.name}
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      <AIDocumentDrafterModal
        isOpen={showDrafter}
        onClose={() => setShowDrafter(false)}
        companyId={companyId}
        user={user}
        cases={cases}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["documents"] })}
      />
    </div>
  );
}

function DocumentUploadDialog({ open, onClose, onSubmit, cases, docCategories, addDocCategory, companyId, caseTerm }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: "", category: "other", case_id: "", case_title: "", notes: "" });
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState("");

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const path = `${companyId || 'unassigned'}/${form.case_id || 'general'}/${Date.now()}_${safeName}`;
      await base44.storage.upload('documents', path, file);
      const file_url = base44.storage.getPublicUrl('documents', path);
      setFileUrl(file_url);
      if (!form.name) setForm(prev => ({ ...prev, name: file.name }));
    } catch (err) {
      console.warn("Supabase upload failed, falling back to local object URL for preview:", err);
      const localUrl = URL.createObjectURL(file);
      setFileUrl(localUrl);
      if (!form.name) setForm(prev => ({ ...prev, name: file.name }));
      toast({
        title: "Using Local Storage Fallback",
        description: "Supabase storage upload failed. Created a local preview link successfully.",
        variant: "default"});
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, file_url: fileUrl });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t("upload_document", "Upload Document")}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t("file", "File")}</Label>
            <div className="mt-1 border-2 border-dashed border-primary/40 rounded-xl p-6 text-center">
              <Upload className="w-8 h-8 mx-auto text-[#71717a] dark:text-gray-400 mb-2" />
              <input type="file" className="hidden" id="doc-upload" onChange={handleFileUpload} />
              <label htmlFor="doc-upload" className="text-sm text-primary cursor-pointer hover:underline">
                {uploading ? "Uploading..." : fileUrl ? "File uploaded ✓" : "Choose file to upload"}
              </label>
            </div>
          </div>
          <div><Label>{t("document_name", "Document Name")}</Label><Input value={form.name} onChange={(e) => handleChange("name", e.target.value)} required /></div>
          <div>
            <Label>{t("category", "Category")}</Label>
            <Select value={form.category} onValueChange={(v) => handleChange("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {docCategories.map(c => {
                  return <SelectItem key={c} value={c} className="capitalize">{c.replace(/_/g, " ")}</SelectItem>;
                })}
                <AddOptionInline onAdd={(v) => { addDocCategory(v); handleChange("category", v); }} placeholder="New category..." />
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{caseTerm}</Label>
            <Select value={form.case_id} onValueChange={(v) => { const c = cases?.find(cs => cs.id === v); handleChange("case_id", v); handleChange("case_title", c?.title || ""); }}>
              <SelectTrigger><SelectValue placeholder={`Link to ${caseTerm.toLowerCase()} (optional)`} /></SelectTrigger>
              <SelectContent>{cases?.map(c => {
                return <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>;
              })}</SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>{t("cancel", "Cancel")}</Button>
            <Button type="submit" disabled={uploading}>{t("upload", "Upload")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}