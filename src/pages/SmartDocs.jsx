import React, { useState, useEffect, useCallback, useRef } from "react";
import { powerSync } from "@/api/PowerSyncConnector";
import { supabase } from "@/api/supabaseClient";
import SmartDocumentViewer from "@/components/SmartDocumentViewer";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  FolderOpen, FileText, Search, Plus, Link2, Brain, Tag,
  Calendar, AlertTriangle, CheckCircle2, Eye, Download,
  Folder, File, Layers, Network, Clock, Shield, Zap, Upload, X
} from "lucide-react";

const DOC_CATEGORIES = ["Contract", "Invoice", "Receipt", "Employee File", "Passport/ID", "Certification", "Policy", "Medical Report", "Purchase Order", "Other"];
const ENTITY_TYPES = [
  { value: "staff", label: "Employee" },
  { value: "client", label: "Client" },
  { value: "cases", label: "Case" },
  { value: "invoices", label: "Invoice" },
  { value: "properties", label: "Property" },
];

const CAT_COLORS = {
  "Contract": "bg-blue-100 text-blue-700",
  "Invoice": "bg-green-100 text-green-700",
  "Receipt": "bg-teal-100 text-teal-700",
  "Employee File": "bg-violet-100 text-violet-700",
  "Passport/ID": "bg-orange-100 text-orange-700",
  "Certification": "bg-amber-100 text-amber-700",
  "Policy": "bg-slate-100 text-slate-600",
  "Medical Report": "bg-red-100 text-red-700",
  "Purchase Order": "bg-indigo-100 text-indigo-700",
};

function DocIcon({ type }) {
  const icons = { pdf: "📄", docx: "📝", doc: "📝", xlsx: "📊", xls: "📊", png: "🖼️", jpg: "🖼️", jpeg: "🖼️" };
  const ext = (type || "").toLowerCase().replace(".", "");
  return <span className="text-xl">{icons[ext] || "📁"}</span>;
}

function ExpiryIndicator({ expiryDate }) {
  if (!expiryDate) return null;
  const daysLeft = Math.ceil((new Date(expiryDate) - new Date()) / 86400000);
  if (daysLeft < 0) return <span className="flex items-center gap-1 text-xs text-red-600 font-semibold"><AlertTriangle className="w-3 h-3" />Expired</span>;
  if (daysLeft <= 30) return <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold"><Clock className="w-3 h-3" />Expires in {daysLeft}d</span>;
  return <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="w-3 h-3" />Valid</span>;
}

function DocumentCard({ doc, onClick, isSelected }) {
  return (
    <div
      onClick={() => onClick(doc)}
      className={`group cursor-pointer rounded-2xl border p-4 hover:shadow-lg transition-all duration-200 ${isSelected ? "border-violet-400 bg-violet-50/60 dark:bg-violet-900/20 shadow-lg scale-[1.01]" : "border-border bg-card hover:-translate-y-0.5"}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
          <DocIcon type={doc.file_type} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{doc.name}</p>
          <p className="text-xs text-muted-foreground">{doc.uploaded_by || "Unknown"} · {doc.filing_date?.split("T")[0] || "—"}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {doc.category && <Badge className={`text-[10px] px-1.5 py-0 h-4 ${CAT_COLORS[doc.category] || "bg-slate-100 text-slate-600"}`}>{doc.category}</Badge>}
            {doc.tags?.split(",").filter(Boolean).slice(0, 2).map(tag => (
              <Badge key={tag} className="text-[10px] px-1.5 py-0 h-4 bg-muted text-muted-foreground">{tag.trim()}</Badge>
            ))}
          </div>
          <div className="mt-2">
            <ExpiryIndicator expiryDate={doc.expiry_date} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AISummaryPanel({ doc, links, onView }) {
  const [generating, setGenerating] = useState(false);
  const [localSummary, setLocalSummary] = useState(doc.ai_summary || "");

  const mockGenerate = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1500));
    const summary = `This document (${doc.name}) is a ${doc.category || "file"} uploaded on ${doc.filing_date?.split("T")[0] || "unknown date"}.${doc.expiry_date ? ` It expires on ${doc.expiry_date}.` : ""} Review this document for full details.`;
    setLocalSummary(summary);
    await powerSync.execute("UPDATE documents SET ai_summary = ? WHERE id = ?", [summary, doc.id]);
    setGenerating(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-foreground text-sm">AI Intelligence Panel</h3>
          <p className="text-xs text-muted-foreground">Smart insights for this document</p>
        </div>
      </div>

      {/* AI Summary */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Zap className="w-3 h-3 text-violet-500" />Summary</p>
          <Button size="sm" variant="ghost" className="h-6 text-xs text-violet-600 px-2" onClick={mockGenerate} disabled={generating}>
            {generating ? "Generating..." : localSummary ? "Refresh" : "Generate"}
          </Button>
        </div>
        {localSummary ? (
          <p className="text-sm text-foreground leading-relaxed">{localSummary}</p>
        ) : (
          <p className="text-xs text-muted-foreground italic">Click Generate to create an AI summary</p>
        )}
      </div>

      {/* Expiry */}
      {doc.expiry_date && (
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-2"><Calendar className="w-3 h-3 text-amber-500" />Expiry Date</p>
          <ExpiryIndicator expiryDate={doc.expiry_date} />
          <p className="text-sm text-foreground mt-1">{doc.expiry_date}</p>
        </div>
      )}

      {/* Signature */}
      {doc.signature_status && (
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-2"><Shield className="w-3 h-3 text-blue-500" />Signature Status</p>
          <Badge className={doc.signature_status === "signed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>{doc.signature_status}</Badge>
        </div>
      )}

      {/* Knowledge Graph Links */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-3"><Network className="w-3 h-3 text-teal-500" />Connected To</p>
        {links.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No connections yet</p>
        ) : (
          <div className="space-y-2">
            {links.map(link => (
              <div key={link.id} className="flex items-center gap-2 text-xs bg-background rounded-lg px-3 py-2 border border-border">
                <Link2 className="w-3 h-3 text-teal-500 flex-shrink-0" />
                <span className="font-medium text-foreground capitalize">{link.entity_type}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground truncate">{link.relationship || link.entity_id}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tags */}
      {doc.tags && (
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-2"><Tag className="w-3 h-3" />Tags</p>
          <div className="flex flex-wrap gap-1">
            {doc.tags.split(",").filter(Boolean).map(tag => (
              <Badge key={tag} className="text-xs bg-violet-100 text-violet-700">{tag.trim()}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {doc.file_url && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 gap-2 text-violet-600 border-violet-200 hover:bg-violet-50" onClick={() => onView ? onView(doc) : window.open(doc.file_url, '_blank')}>
            <Eye className="w-4 h-4" />View
          </Button>
          <Button size="sm" variant="outline" className="flex-1 gap-2" onClick={() => window.open(doc.file_url, "_blank")}>
            <Download className="w-4 h-4" />Download
          </Button>
        </div>
      )}
    </div>
  );
}

export default function SmartDocs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const companyId = user?.company_id;

  const [docs, setDocs] = useState([]);
  const [folders, setFolders] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedLinks, setSelectedLinks] = useState([]);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterFolder, setFilterFolder] = useState("all");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [showFolderForm, setShowFolderForm] = useState(false);

  const [uploadForm, setUploadForm] = useState({ name: "", category: "Contract", folder_id: "none", tags: "", expiry_date: "", file_url: "", signature_status: "unsigned", notes: "" });
  const [uploadMode, setUploadMode] = useState("url"); // "url" | "file"
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [linkForm, setLinkForm] = useState({ entity_type: "staff", entity_id: "", relationship: "" });
  const [folderForm, setFolderForm] = useState({ name: "", color: "#6366f1" });

  const loadDocs = useCallback(async () => {
    if (!companyId) return;
    const res = await powerSync.execute("SELECT * FROM documents WHERE company_id = ? ORDER BY created_at DESC", [companyId]);
    const parsed = (res.rows?._array || []).map(d => {
      let extra = {};
      try { extra = JSON.parse(d.notes || "{}"); } catch(e) {}
      if (extra.is_json_wrapper) {
        return { ...d, ...extra, notes: extra.notes };
      }
      return d;
    });
    setDocs(parsed);
  }, [companyId]);

  const loadFolders = useCallback(async () => {
    if (!companyId) return;
    const res = await powerSync.execute("SELECT * FROM smart_folders WHERE company_id = ? ORDER BY name ASC", [companyId]);
    setFolders(res.rows?._array || []);
  }, [companyId]);

  const loadLinks = useCallback(async () => {
    if (!companyId) return;
    const res = await powerSync.execute("SELECT * FROM smart_doc_links WHERE company_id = ?", [companyId]);
    setLinks(res.rows?._array || []);
  }, [companyId]);

  useEffect(() => { loadDocs(); loadFolders(); loadLinks(); }, [loadDocs, loadFolders, loadLinks]);

  const selectDoc = (doc) => {
    setSelectedDoc(doc);
    setSelectedLinks(links.filter(l => l.document_id === doc.id));
  };

  const saveDoc = async () => {
    if (!uploadForm.name) return toast({ title: "Document name is required", variant: "destructive" });
    
    let fileUrl = uploadForm.file_url;
    let fileType = '';

    // Handle file upload if user chose file mode
    if (uploadMode === "file" && uploadFile) {
      setIsUploading(true);
      try {
        const ext = uploadFile.name.split('.').pop().toLowerCase();
        fileType = ext;
        const filePath = `${companyId}/${crypto.randomUUID()}.${ext}`;
        const { data: storageData, error: storageErr } = await supabase.storage
          .from('documents')
          .upload(filePath, uploadFile, { upsert: false });
        if (storageErr) throw storageErr;
        const { data: publicUrlData } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);
        fileUrl = publicUrlData?.publicUrl || '';
        if (!uploadForm.name) {
          setUploadForm(f => ({ ...f, name: uploadFile.name.replace(`.${ext}`, '') }));
        }
      } catch (err) {
        toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const extra = {
      is_json_wrapper: true,
      notes: uploadForm.notes,
      category: uploadForm.category,
      tags: uploadForm.tags,
      expiry_date: uploadForm.expiry_date || null,
      signature_status: uploadForm.signature_status,
      folder_id: uploadForm.folder_id === "none" ? null : uploadForm.folder_id
    };

    await powerSync.execute(
      "INSERT INTO documents (id, created_at, company_id, name, category, file_url, file_type, notes, uploaded_by, filing_date) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [crypto.randomUUID(), new Date().toISOString(), companyId, uploadForm.name, null, fileUrl, fileType || uploadForm.file_type, JSON.stringify(extra), user?.full_name || user?.email, new Date().toISOString()]
    );
    await loadDocs();
    setShowUploadForm(false);
    setUploadForm({ name: "", category: "Contract", folder_id: "none", tags: "", expiry_date: "", file_url: "", signature_status: "unsigned", notes: "" });
    setUploadFile(null);
    setUploadMode("url");
    toast({ title: "Document added to Smart Docs" });
  };

  const saveLink = async () => {
    if (!selectedDoc || !linkForm.entity_id) return toast({ title: "Entity ID is required", variant: "destructive" });
    await powerSync.execute(
      "INSERT INTO smart_doc_links (id, created_at, company_id, document_id, entity_type, entity_id, relationship) VALUES (?,?,?,?,?,?,?)",
      [crypto.randomUUID(), new Date().toISOString(), companyId, selectedDoc.id, linkForm.entity_type, linkForm.entity_id, linkForm.relationship]
    );
    await loadLinks();
    setSelectedLinks(prev => [...prev, { ...linkForm, id: "new", document_id: selectedDoc.id }]);
    setShowLinkForm(false);
    toast({ title: "Connection added to Knowledge Graph" });
  };

  const saveFolder = async () => {
    if (!folderForm.name) return toast({ title: "Folder name required", variant: "destructive" });
    await powerSync.execute("INSERT INTO smart_folders (id, created_at, company_id, name, color) VALUES (?,?,?,?,?)",
      [crypto.randomUUID(), new Date().toISOString(), companyId, folderForm.name, folderForm.color]);
    await loadFolders();
    setShowFolderForm(false);
    toast({ title: "Folder created" });
  };

  const expiringSoon = docs.filter(d => {
    if (!d.expiry_date) return false;
    const days = Math.ceil((new Date(d.expiry_date) - new Date()) / 86400000);
    return days >= 0 && days <= 30;
  });

  const filteredDocs = docs.filter(d => {
    const matchSearch = !search || d.name?.toLowerCase().includes(search.toLowerCase()) || d.tags?.toLowerCase().includes(search.toLowerCase()) || d.category?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "all" || d.category === filterCategory;
    const matchFolder = filterFolder === "all" || d.folder_id === filterFolder;
    return matchSearch && matchCat && matchFolder;
  });

  return (
    <div className="space-y-6 p-6 pt-0">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 p-6 md:p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/10 rounded-full" />
        <div className="absolute -bottom-12 -right-20 w-64 h-64 bg-white/5 rounded-full" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Smart Docs</h1>
                <p className="text-emerald-200 text-sm">Business Knowledge Graph · AI-powered document intelligence</p>
              </div>
            </div>
            <div className="flex gap-6 mt-3 text-sm">
              <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-emerald-300" /><strong>{docs.length}</strong> Documents</span>
              <span className="flex items-center gap-1.5"><Folder className="w-4 h-4 text-emerald-300" /><strong>{folders.length}</strong> Folders</span>
              <span className="flex items-center gap-1.5"><Network className="w-4 h-4 text-emerald-300" /><strong>{links.length}</strong> Connections</span>
              {expiringSoon.length > 0 && <span className="flex items-center gap-1.5 text-amber-300"><AlertTriangle className="w-4 h-4" /><strong>{expiringSoon.length}</strong> Expiring soon</span>}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30 gap-2" onClick={() => setShowFolderForm(true)}>
              <Folder className="w-4 h-4" />New Folder
            </Button>
            <Button size="sm" className="bg-white text-emerald-700 hover:bg-white/90 gap-2" onClick={() => setShowUploadForm(true)}>
              <Plus className="w-4 h-4" />Add Document
            </Button>
          </div>
        </div>
      </div>

      {/* Expiry Alerts */}
      {expiringSoon.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-800 mb-2"><AlertTriangle className="w-4 h-4" />{expiringSoon.length} document(s) expiring within 30 days</p>
          <div className="flex flex-wrap gap-2">
            {expiringSoon.map(d => (
              <button key={d.id} onClick={() => selectDoc(d)} className="text-xs bg-white dark:bg-amber-900/40 border border-amber-200 px-3 py-1.5 rounded-lg font-medium text-amber-800 hover:bg-amber-100 transition-colors">
                {d.name} · {d.expiry_date}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* LEFT: Folder Tree + Doc Grid */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search documents, tags, categories..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {DOC_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterFolder} onValueChange={setFilterFolder}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Folder" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Folders</SelectItem>
                {folders.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Folder Quick Access */}
          {folders.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setFilterFolder("all")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${filterFolder === "all" ? "bg-violet-100 text-violet-700 border-violet-200" : "bg-muted text-muted-foreground border-transparent hover:border-border"}`}>
                <Layers className="w-3.5 h-3.5" />All
              </button>
              {folders.map(f => (
                <button key={f.id} onClick={() => setFilterFolder(f.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${filterFolder === f.id ? "bg-violet-100 text-violet-700 border-violet-200" : "bg-muted text-muted-foreground border-transparent hover:border-border"}`}>
                  <Folder className="w-3.5 h-3.5" style={{ color: f.color }} />{f.name}
                  <span className="ml-1 text-[10px] bg-white/60 px-1.5 rounded-full">{docs.filter(d => d.folder_id === f.id).length}</span>
                </button>
              ))}
            </div>
          )}

          {/* Doc Grid */}
          {filteredDocs.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Brain className="w-14 h-14 mx-auto mb-4 opacity-20" />
              <p className="font-medium">No documents found</p>
              <p className="text-sm mt-1">Add your first document to build the knowledge graph</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredDocs.map(doc => (
                <DocumentCard key={doc.id} doc={doc} onClick={selectDoc} isSelected={selectedDoc?.id === doc.id} />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: AI Intelligence Panel */}
        {selectedDoc && (
          <div className="w-80 flex-shrink-0 bg-card border border-border rounded-2xl p-5 h-fit sticky top-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-foreground truncate text-sm">{selectedDoc.name}</p>
              <button onClick={() => setSelectedDoc(null)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
            </div>

            <Button size="sm" variant="outline" className="w-full gap-2 text-violet-600 border-violet-200 hover:bg-violet-50" onClick={() => setShowLinkForm(true)}>
              <Link2 className="w-4 h-4" /> Link to Entity
            </Button>

            <AISummaryPanel doc={selectedDoc} links={selectedLinks} onView={setViewingDoc} />
          </div>
        )}
      </div>

      {/* Add Document Dialog */}
      <Dialog open={showUploadForm} onOpenChange={setShowUploadForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Document to Smart Docs</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Document Name *</Label><Input placeholder="e.g. John Mensah Employment Contract" value={uploadForm.name} onChange={e => setUploadForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div>
                <Label>Category</Label>
                <Select value={uploadForm.category} onValueChange={v => setUploadForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DOC_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Folder</Label>
                <Select value={uploadForm.folder_id} onValueChange={v => setUploadForm(f => ({ ...f, folder_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="No Folder" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Folder</SelectItem>
                    {folders.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* File Source Toggle */}
              <div className="col-span-2">
                <Label className="mb-1 block">Document Source</Label>
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={() => setUploadMode("url")}
                    className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      uploadMode === "url" ? "bg-violet-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5" /> Paste URL / Link
                  </button>
                  <button
                    onClick={() => setUploadMode("file")}
                    className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      uploadMode === "file" ? "bg-violet-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload from Device
                  </button>
                </div>
              </div>

              {/* URL Input */}
              {uploadMode === "url" && (
                <div className="col-span-2">
                  <Label>File URL</Label>
                  <Input placeholder="https://..." value={uploadForm.file_url} onChange={e => setUploadForm(f => ({ ...f, file_url: e.target.value }))} />
                </div>
              )}

              {/* File Upload */}
              {uploadMode === "file" && (
                <div className="col-span-2">
                  <Label>Select File</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.ppt,.pptx"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadFile(file);
                        if (!uploadForm.name) {
                          const baseName = file.name.split('.').slice(0, -1).join('.');
                          setUploadForm(f => ({ ...f, name: baseName }));
                        }
                      }
                    }}
                  />
                  {uploadFile ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-violet-200 bg-violet-50 dark:bg-violet-900/20">
                      <FileText className="w-8 h-8 text-violet-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{uploadFile.name}</p>
                        <p className="text-xs text-muted-foreground">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button onClick={() => { setUploadFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-muted-foreground hover:text-destructive">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-colors cursor-pointer group"
                    >
                      <Upload className="w-10 h-10 mx-auto mb-2 text-muted-foreground group-hover:text-violet-500 transition-colors" />
                      <p className="text-sm font-medium text-muted-foreground group-hover:text-violet-600">Click to browse files</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, Images, PowerPoint</p>
                    </button>
                  )}
                </div>
              )}

              <div><Label>Expiry Date</Label><Input type="date" value={uploadForm.expiry_date} onChange={e => setUploadForm(f => ({ ...f, expiry_date: e.target.value }))} /></div>
              <div className="col-span-2"><Label>Tags (comma separated)</Label><Input placeholder="contract, hr, 2026" value={uploadForm.tags} onChange={e => setUploadForm(f => ({ ...f, tags: e.target.value }))} /></div>
              <div className="col-span-2"><Label>Notes</Label><Textarea placeholder="Notes about this document..." rows={2} value={uploadForm.notes} onChange={e => setUploadForm(f => ({ ...f, notes: e.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowUploadForm(false)}>Cancel</Button>
              <Button onClick={saveDoc} disabled={isUploading} className="gap-2">
                {isUploading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading...</>
                ) : (
                  <><Upload className="w-4 h-4" />Add Document</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link to Entity Dialog */}
      <Dialog open={showLinkForm} onOpenChange={setShowLinkForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Network className="w-5 h-5 text-teal-500" />Link to Entity (Knowledge Graph)</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Connect "<strong>{selectedDoc?.name}</strong>" to another entity in the system.</p>
            <div>
              <Label>Entity Type</Label>
              <Select value={linkForm.entity_type} onValueChange={v => setLinkForm(f => ({ ...f, entity_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ENTITY_TYPES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Entity ID (e.g. staff ID or client ID)</Label><Input placeholder="Paste the ID here" value={linkForm.entity_id} onChange={e => setLinkForm(f => ({ ...f, entity_id: e.target.value }))} /></div>
            <div><Label>Relationship Label</Label><Input placeholder="e.g. employment_contract, receipt" value={linkForm.relationship} onChange={e => setLinkForm(f => ({ ...f, relationship: e.target.value }))} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowLinkForm(false)}>Cancel</Button>
              <Button onClick={saveLink} className="gap-2"><Link2 className="w-4 h-4" />Create Link</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={showFolderForm} onOpenChange={setShowFolderForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Create Folder</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Folder Name</Label><Input placeholder="e.g. HR Documents" value={folderForm.name} onChange={e => setFolderForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Color</Label><input type="color" value={folderForm.color} onChange={e => setFolderForm(f => ({ ...f, color: e.target.value }))} className="w-full h-10 rounded-lg cursor-pointer border border-border" /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowFolderForm(false)}>Cancel</Button>
              <Button onClick={saveFolder}>Create Folder</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Smart Document Viewer Overlay */}
      {viewingDoc && (
        <SmartDocumentViewer
          doc={viewingDoc}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </div>
  );
}
