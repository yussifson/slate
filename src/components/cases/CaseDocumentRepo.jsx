import { useTranslation } from "react-i18next";
import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Upload, Download, Trash2, FolderOpen, Lock, Share2,
  FileText, FileImage, File, Gavel, Eye, X, Search, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "court_filing", label: "Court Filing", color: "bg-red-100 text-red-700" },
  { value: "pleading", label: "Pleading", color: "bg-orange-100 text-orange-700" },
  { value: "court_order", label: "Court Order", color: "bg-amber-100 text-amber-700" },
  { value: "evidence", label: "Evidence", color: "bg-orange-100 text-orange-700" },
  { value: "contract", label: "Contract", color: "bg-slate-100 text-primary/90" },
  { value: "correspondence", label: "Correspondence", color: "bg-slate-100 text-slate-600" },
  { value: "scanned_document", label: "Scanned Document", color: "bg-slate-100 text-primary/90" },
  { value: "id_document", label: "ID Document", color: "bg-slate-100 text-primary/90" },
  { value: "invoice", label: "Invoice", color: "bg-slate-100 text-primary/90" },
  { value: "other", label: "Other", color: "bg-gray-100 text-gray-600" },
];

function getCategoryMeta(value) {
  return CATEGORIES.find(c => c.value === value) || CATEGORIES[CATEGORIES.length - 1];
}

function getFileIcon(fileType, name) {
  if (!fileType && !name) return <File className="w-4 h-4 text-muted-foreground" />;
  const type = fileType?.toLowerCase() || "";
  const ext = name?.split(".").pop()?.toLowerCase() || "";
  if (type.includes("image") || ["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
    return <FileImage className="w-4 h-4 text-primary" />;
  if (type.includes("pdf") || ext === "pdf")
    return <FileText className="w-4 h-4 text-red-500" />;
  if (["doc", "docx"].includes(ext))
    return <FileText className="w-4 h-4 text-primary" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
}

function fileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CaseDocumentRepo({ caseData, user }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [previewDoc, setPreviewDoc] = useState(null);

  const canManage = ["super_admin", "company_admin"].includes(user?.role) || user?.email === caseData.assigned_lawyer;

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["case-documents", caseData.id],
    queryFn: () => base44.entities.Document.filter({ case_id: caseData.id }),
    enabled: !!caseData.id,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-documents", caseData.id] });
      toast({ title: "Document deleted" });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Document.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-documents", caseData.id] });
      toast({ title: "Document uploaded successfully" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Document.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["case-documents", caseData.id] }),
  });

  const filtered = documents.filter(doc => {
    const matchCat = categoryFilter === "all" || doc.category === categoryFilter;
    const matchSearch = !search || doc.name?.toLowerCase().includes(search.toLowerCase()) || doc.notes?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Group by category
  const courtFilings = filtered.filter(d => ["court_filing", "court_order", "pleading"].includes(d.category));
  const otherDocs = filtered.filter(d => !["court_filing", "court_order", "pleading"].includes(d.category));

  const handleUploadSubmit = (docData) => {
    createMutation.mutate({
      ...docData,
      company_id: user?.company_id,
      case_id: caseData.id,
      case_title: caseData.title,
      client_id: caseData.client_id,
      client_name: caseData.client_name,
      uploaded_by: user?.email,
    });
    setShowUpload(false);
  };

  const isImageUrl = (url) => url && /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url);
  const isPdfUrl = (url) => url && /\.pdf(\?|$)/i.test(url);

  return (
    <div className="space-y-4">
      {/* Access notice */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
        <Lock className="w-3.5 h-3.5 shrink-0" />
        <span>{t(
          "documents_are_restricted_to_au",
          "Documents are restricted to authorized case personnel only."
        )}</span>
        <span className="ml-auto font-medium">{documents.length} {t("file", "file")}{documents.length !== 1 ? "s" : ""}</span>
      </div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Search documents..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-44 h-9"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all_categories", "All Categories")}</SelectItem>
              {CATEGORIES.map(c => {
                return <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>
        {canManage && (
          <Button onClick={() => setShowUpload(true)} size="sm" className="gap-2 shrink-0">
            <Upload className="w-4 h-4" /> {t("upload_filing_document", "Upload Filing / Document")}
          </Button>
        )}
      </div>
      {isLoading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">{t("loading_documents", "Loading documents...")}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border p-12 text-center">
          <FolderOpen className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium">{t("no_documents_yet", "No documents yet")}</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">{t(
            "upload_court_filings_scanned_d",
            "Upload court filings, scanned documents, and case files to keep everything in one place."
          )}</p>
          {canManage && <Button size="sm" onClick={() => setShowUpload(true)}><Upload className="w-3.5 h-3.5 mr-1.5" />{t("upload_first_document", "Upload First Document")}</Button>}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Court Filings section */}
          {courtFilings.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Gavel className="w-4 h-4 text-red-600" />
                <h3 className="text-sm font-semibold text-red-700">{t("court_filings_orders", "Court Filings & Orders")}</h3>
                <span className="text-xs text-muted-foreground">({courtFilings.length})</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {courtFilings.map(doc => {
                  return (
                    <DocRow
                      key={doc.id}
                      doc={doc}
                      canManage={canManage}
                      onDelete={() => deleteMutation.mutate(doc.id)}
                      onToggleShare={() => updateMutation.mutate({ id: doc.id, data: { shared_with_client: !doc.shared_with_client } })}
                      onPreview={() => setPreviewDoc(doc)}
                      highlighted
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Other documents */}
          {otherDocs.length > 0 && (
            <div>
              {courtFilings.length > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <FolderOpen className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-muted-foreground">{t("other_documents", "Other Documents")}</h3>
                  <span className="text-xs text-muted-foreground">({otherDocs.length})</span>
                </div>
              )}
              <div className="grid grid-cols-1 gap-2">
                {otherDocs.map(doc => {
                  return (
                    <DocRow
                      key={doc.id}
                      doc={doc}
                      canManage={canManage}
                      onDelete={() => deleteMutation.mutate(doc.id)}
                      onToggleShare={() => updateMutation.mutate({ id: doc.id, data: { shared_with_client: !doc.shared_with_client } })}
                      onPreview={() => setPreviewDoc(doc)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      {/* Upload dialog */}
      {showUpload && (
        <UploadDocumentDialog
          onClose={() => setShowUpload(false)}
          onSubmit={handleUploadSubmit}
          isUploading={createMutation.isPending}
          companyId={user?.company_id}
          caseId={caseData?.id}
        />
      )}
      {/* Preview modal */}
      {previewDoc && (
        <Dialog open onOpenChange={() => setPreviewDoc(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getFileIcon(previewDoc.file_type, previewDoc.name)}
                {previewDoc.name}
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-auto max-h-[60vh] flex items-center justify-center bg-muted/30 rounded-lg p-4">
              {isImageUrl(previewDoc.file_url) ? (
                <img src={previewDoc.file_url} alt={previewDoc.name} className="max-w-full rounded" />
              ) : isPdfUrl(previewDoc.file_url) ? (
                <iframe src={previewDoc.file_url} title={previewDoc.name} className="w-full h-[55vh] rounded border" />
              ) : (
                <div className="text-center py-10">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">{t(
                    "preview_not_available_for_this",
                    "Preview not available for this file type."
                  )}</p>
                  <a href={previewDoc.file_url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm"><Download className="w-3.5 h-3.5 mr-1.5" />{t("download_to_view", "Download to View")}</Button>
                  </a>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function DocRow({ doc, canManage, onDelete, onToggleShare, onPreview, highlighted }) {
  const { t } = useTranslation();
  const cat = getCategoryMeta(doc.category);
  return (
    <div className={cn(
      "bg-card rounded-xl border px-4 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors",
      highlighted ? "border-red-200" : "border-border"
    )}>
      <div className={cn(
        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
        highlighted ? "bg-red-50" : "bg-slate-100"
      )}>
        {getFileIcon(doc.file_type, doc.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{doc.name}</p>
        <div className="flex flex-wrap gap-1.5 mt-0.5 items-center">
          <Badge className={`text-[10px] ${cat.color}`}>{cat.label}</Badge>
          {doc.file_size && <span className="text-[10px] text-muted-foreground">{fileSize(doc.file_size)}</span>}
          {doc.uploaded_by && <span className="text-[10px] text-muted-foreground">{t("by", "by")} {doc.uploaded_by.split("@")[0]}</span>}
          <span className="text-[10px] text-muted-foreground">{format(new Date(doc.created_date), "MMM d, yyyy")}</span>
          {doc.shared_with_client && <Badge className="text-[10px] bg-orange-100 text-orange-700 gap-1"><Share2 className="w-2.5 h-2.5" />{t("shared", "Shared")}</Badge>}
        </div>
        {doc.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{doc.notes}</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7" title="Preview" onClick={onPreview}>
          <Eye className="w-3.5 h-3.5" />
        </Button>
        {doc.file_url && (
          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Download">
              <Download className="w-3.5 h-3.5" />
            </Button>
          </a>
        )}
        {canManage && (
          <>
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              title={doc.shared_with_client ? "Unshare with client" : "Share with client"}
              onClick={onToggleShare}
            >
              <Share2 className={`w-3.5 h-3.5 ${doc.shared_with_client ? "text-primary" : "text-muted-foreground"}`} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete} title="Delete">
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function UploadDocumentDialog({ onClose, onSubmit, isUploading: saving, companyId, caseId }) {
  const [form, setForm] = useState({ name: "", category: "court_filing", notes: "", shared_with_client: false, filing_date: "" });
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]); // [{ file, url, size, type, name }]
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const processFiles = async (selectedFiles) => {
    setUploading(true);
    const results = [];
    for (const file of selectedFiles) {
      try {
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const path = `${companyId || 'unassigned'}/${caseId || 'general'}/${Date.now()}_${safeName}`;
        await base44.storage.upload('documents', path, file);
        const file_url = base44.storage.getPublicUrl('documents', path);
        results.push({ file, url: file_url, size: file.size, type: file.type, name: file.name });
      } catch (err) {
        console.warn("Supabase upload failed, falling back to local object URL for preview:", err);
        const localUrl = URL.createObjectURL(file);
        results.push({ file, url: localUrl, size: file.size, type: file.type, name: file.name });
        toast({
          title: "Using Local Storage Fallback",
          description: `Supabase upload failed for ${file.name}. Created a local preview link successfully.`,
          variant: "default",
        });
      }
    }
    setFiles(prev => [...prev, ...results]);
    if (!form.name && results.length === 1) setForm(prev => ({ ...prev, name: results[0].name }));
    setUploading(false);
  };

  const handleFileInput = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length) processFiles(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files || []);
    if (dropped.length) processFiles(dropped);
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!files.length) return;
    files.forEach((f, idx) => {
      onSubmit({
        ...form,
        name: files.length === 1 ? (form.name || f.name) : f.name,
        file_url: f.url,
        file_size: f.size,
        file_type: f.type,
      });
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Upload className="w-4 h-4" />{t("upload_filing_document", "Upload Filing / Document")}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drop zone */}
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer",
              dragOver ? "border-primary bg-slate-50" : "border-border hover:border-primary/40"
            )}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" multiple className="hidden" onChange={handleFileInput} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.txt,.xls,.xlsx" />
            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">{uploading ? "Uploading..." : "Drag & drop files here, or click to browse"}</p>
            <p className="text-xs text-muted-foreground mt-1">{t(
              "pdf_word_images_spreadsheets_m",
              "PDF, Word, images, spreadsheets — multiple files supported"
            )}</p>
          </div>

          {/* Uploaded files list */}
          {files.length > 0 && (
            <div className="space-y-1.5">
              {files.map((f, idx) => {
                return (
                  <div key={idx} className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2 text-sm">
                    {getFileIcon(f.type, f.name)}
                    <span className="flex-1 truncate text-xs">{f.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{fileSize(f.size)}</span>
                    <button type="button" onClick={() => removeFile(idx)} className="text-muted-foreground hover:text-destructive">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>{t("document_name", "Document Name")} {files.length > 1 && <span className="text-muted-foreground text-xs">{t("applied_to_first_file_only", "(applied to first file only)")}</span>}</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Writ of Summons" className="mt-1" />
            </div>
            <div>
              <Label>{t("category", "Category")}</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => {
                    return <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("filing_date", "Filing Date")} <span className="text-muted-foreground text-xs">{t("optional", "(optional)")}</span></Label>
              <Input type="date" value={form.filing_date} onChange={e => setForm({ ...form, filing_date: e.target.value })} className="mt-1" />
            </div>
          </div>

          <div>
            <Label>{t("notes", "Notes")} <span className="text-muted-foreground text-xs">{t("optional", "(optional)")}</span></Label>
            <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Brief description..." className="mt-1" />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">{t("share_with_client_portal", "Share with client portal")}</p>
              <p className="text-xs text-muted-foreground">{t("client_can_view_this_in_their_", "Client can view this in their portal")}</p>
            </div>
            <Switch checked={form.shared_with_client} onCheckedChange={v => setForm({ ...form, shared_with_client: v })} />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>{t("cancel", "Cancel")}</Button>
            <Button type="submit" disabled={uploading || !files.length || saving}>
              {saving ? "Saving..." : `Upload ${files.length > 1 ? `${files.length} Files` : "File"}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}