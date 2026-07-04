import { useTranslation } from "react-i18next";
import React, { useState, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useFirmSettings } from "@/hooks/useFirmSettings";
import { getTerm } from "@/config/industries";
import { powerSync } from "@/api/PowerSyncConnector";
import { generateText } from "@/lib/cloudflareAI";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, FolderOpen, Search, Download, Trash2, Upload, Sparkles,
  FileSignature, FileText, FileLock2, Clock, User, Star, Share2,
  Eye, Edit3, AlertTriangle, CheckCircle2, XCircle, Loader2,
  Tag, Filter, ChevronDown, MoreHorizontal, Brain, Shield,
  FileImage, FileVideo, Archive, Paperclip, ScanLine,
  ArrowUpRight, Activity, RefreshCw, Link2, Bell, Send
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { forceDownload } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AddOptionInline from "@/components/shared/AddOptionInline";
import DocumentPreviewModal from "@/components/shared/DocumentPreviewModal";
import AIDocumentDrafterModal from "@/components/shared/AIDocumentDrafterModal";
import SignatureCanvas from "@/components/documents/SignatureCanvas";
import DocumentGenerator from "@/components/documents/DocumentGenerator";
import { format, formatDistanceToNow } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { useContracts } from "@/hooks/integrations/useContracts";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// ── Helpers ──────────────────────────────────────────────────────────────────

const FILE_ICONS = {
  pdf: <FileText className="w-5 h-5 text-red-500" />,
  doc: <FileText className="w-5 h-5 text-blue-500" />,
  docx: <FileText className="w-5 h-5 text-blue-500" />,
  xls: <FileText className="w-5 h-5 text-green-600" />,
  xlsx: <FileText className="w-5 h-5 text-green-600" />,
  jpg: <FileImage className="w-5 h-5 text-yellow-500" />,
  jpeg: <FileImage className="w-5 h-5 text-yellow-500" />,
  png: <FileImage className="w-5 h-5 text-yellow-500" />,
  mp4: <FileVideo className="w-5 h-5 text-purple-500" />,
  zip: <Archive className="w-5 h-5 text-gray-500" />,
};

const getFileIcon = (name) => {
  const ext = (name || "").split(".").pop()?.toLowerCase();
  return FILE_ICONS[ext] || <Paperclip className="w-5 h-5 text-muted-foreground" />;
};

const SIG_STATUS_BADGE = {
  None:    { label: "—",              cls: "bg-muted text-muted-foreground" },
  Pending: { label: "Signature Requested", cls: "bg-amber-100 text-amber-700" },
  Signed:  { label: "Signed",         cls: "bg-green-100 text-green-700" },
  Declined:{ label: "Declined",       cls: "bg-red-100 text-red-700" },
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SmartDocs() {
  const { t } = useTranslation();
  const { sendContract } = useContracts();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { docCategories, addDocCategory } = useFirmSettings();

  const [showForm, setShowForm]           = useState(false);
  const [search, setSearch]               = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [previewDoc, setPreviewDoc]       = useState(null);
  const [showDrafter, setShowDrafter]     = useState(false);
  const [aiDoc, setAiDoc]                 = useState(null);
  const [aiLoading, setAiLoading]         = useState(false);
  const [activeTab, setActiveTab]         = useState("all");
  const [detailDoc, setDetailDoc]         = useState(null);

  const isAdmin = ["super_admin", "company_admin", "managing_partner"].includes(user?.role);
  const industry = sessionStorage.getItem("slate_industry_override") || user?.company_industry || "law";
  const caseTerm = getTerm(industry, "case");

  // ── Queries ─────────────────────────────────────────────────────────────────

  const { data: documents = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["documents", companyId, user?.email, isAdmin],
    queryFn: async () => {
      const list = await base44.entities.Document.filter({ company_id: companyId });
      if (isAdmin) return list;
      return list.filter(d => d.uploaded_by === user?.email || d.created_by === user?.id || d.assigned_to === user?.id || d.assigned_email === user?.email);
    },
    enabled: !!companyId,
    retry: 2,
    staleTime: 30_000,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ["cases", companyId],
    queryFn: async () => base44.entities.LegalCase.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team_members", companyId],
    queryFn: async () => {
      const res = await powerSync.execute(
        "SELECT id, full_name, email, role FROM profiles WHERE company_id = ? ORDER BY full_name ASC",
        [companyId]
      );
      return res.rows._array || [];
    },
    enabled: !!companyId,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients_list", companyId],
    queryFn: async () => {
      const res = await powerSync.execute(
        "SELECT id, name, email FROM clients WHERE company_id = ? ORDER BY name ASC",
        [companyId]
      );
      return res.rows._array || [];
    },
    enabled: !!companyId,
  });

  // ── Mutations ────────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.Document.create({
        ...data,
        company_id: companyId,
        uploaded_by: user?.email,
        signature_status: data.signature_status || "None",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setShowForm(false);
      toast({ title: "✅ Document uploaded to SmartDocs" });
    },
    onError: (err) => toast({ title: "Upload failed", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Document.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Document updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Document deleted" });
    },
    onError: (err) => toast({ title: "Delete failed", description: err.message, variant: "destructive" }),
  });

  // ── AI Text Extraction ───────────────────────────────────────────────────────

  const handleAiExtract = async (doc) => {
    setAiLoading(true);
    setAiDoc(null);
    try {
      const prompt = `You are an intelligent document assistant. The user has a document named "${doc.name}" in category "${doc.category || "unknown"}". ${doc.notes ? `Notes: ${doc.notes}.` : ""} Please provide: 1) A concise summary (2-3 sentences). 2) 3-5 key points or clauses. 3) Any action items or risks detected. Format clearly.`;
      const result = await generateText(prompt);
      setAiDoc({ name: doc.name, content: result });
    } catch {
      toast({ title: "AI extraction failed", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const handleShareLink = (doc) => {
    if (doc.file_url) {
      navigator.clipboard.writeText(doc.file_url);
      toast({ title: "Share link copied!", description: doc.name });
    } else {
      toast({ title: "No file URL available", variant: "destructive" });
    }
  };

  const handleRequestSignature = (doc) => {
    updateMutation.mutate({ id: doc.id, data: { signature_status: "Pending" } });
    toast({ title: "Signature requested", description: `A request has been sent for "${doc.name}"` });
  };

  // ── Filtering ───────────────────────────────────────────────────────────────

  const filtered = documents.filter(d => {
    const matchSearch = !search || d.name?.toLowerCase().includes(search.toLowerCase()) || d.notes?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || d.category === categoryFilter;
    const matchStatus = statusFilter === "all" || d.signature_status === statusFilter;
    const matchTab =
      activeTab === "all" ? true :
      activeTab === "mine" ? (d.uploaded_by === user?.email) :
      activeTab === "assigned" ? (d.assigned_email === user?.email) :
      activeTab === "signatures" ? (d.signature_status === "Pending" || d.signature_status === "Signed") :
      true;
    return matchSearch && matchCategory && matchStatus && matchTab;
  });

  // ── Stats ───────────────────────────────────────────────────────────────────

  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.signature_status === "Pending").length,
    signed: documents.filter(d => d.signature_status === "Signed").length,
    assignedToMe: documents.filter(d => d.assigned_email === user?.email).length,
  };

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileSignature className="w-6 h-6 text-primary" />
            SmartDocs
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">AI-powered document management, e-signatures, and assignment workflows</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => refetch()} variant="ghost" size="icon" className="h-9 w-9" title="Refresh"><RefreshCw className="w-4 h-4" /></Button>
          <Button onClick={() => setShowDrafter(true)} variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10 h-9">
            <Brain className="w-4 h-4" /> AI Draft
          </Button>
          <Button onClick={() => setShowForm(true)} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground h-9">
            <Upload className="w-4 h-4" /> Upload
          </Button>
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Documents", value: stats.total, icon: <FileText className="w-4 h-4" />, color: "text-blue-500" },
          { label: "Awaiting Signature", value: stats.pending, icon: <Clock className="w-4 h-4" />, color: "text-amber-500" },
          { label: "Signed", value: stats.signed, icon: <CheckCircle2 className="w-4 h-4" />, color: "text-green-500" },
          { label: "Assigned to Me", value: stats.assignedToMe, icon: <User className="w-4 h-4" />, color: "text-purple-500" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-9 h-9 rounded-xl bg-muted flex items-center justify-center ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
          <TabsList className="bg-muted border border-border h-10">
            <TabsTrigger value="all" className="data-[state=active]:bg-background text-xs">All</TabsTrigger>
            <TabsTrigger value="mine" className="data-[state=active]:bg-background text-xs">Uploaded by Me</TabsTrigger>
            <TabsTrigger value="assigned" className="data-[state=active]:bg-background text-xs">Assigned to Me</TabsTrigger>
            <TabsTrigger value="signatures" className="data-[state=active]:bg-background text-xs">E-Signatures</TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-background text-xs">Templates</TabsTrigger>
            <TabsTrigger value="draw" className="data-[state=active]:bg-background text-xs flex items-center gap-1"><FileSignature className="w-3.5 h-3.5" /> Draw Signature</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Document List Tabs ──────────────────────────────────────────── */}
        {["all", "mine", "assigned", "signatures"].map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search documents, notes..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {docCategories.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Signature Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="None">No Signature</SelectItem>
                  <SelectItem value="Pending">Awaiting Signature</SelectItem>
                  <SelectItem value="Signed">Signed</SelectItem>
                  <SelectItem value="Declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isError && <p className="text-sm text-destructive">Could not load documents. Check your connection and refresh.</p>}

            {/* Document Cards Grid */}
            {isLoading && !!companyId ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center bg-card border border-dashed border-border rounded-2xl">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <FolderOpen className="w-8 h-8 text-muted-foreground opacity-50" />
                </div>
                <h3 className="text-lg font-medium">No documents found</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-xs">
                  {companyId ? "Upload your first document or use AI Draft to generate one." : "Sign in to a workspace to view documents."}
                </p>
                {companyId && <Button onClick={() => setShowForm(true)} className="mt-4 gap-2"><Upload className="w-4 h-4" /> Upload Document</Button>}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/40">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Document</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Assigned To</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Signature</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Uploaded</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map(doc => {
                      const sigBadge = SIG_STATUS_BADGE[doc.signature_status] || SIG_STATUS_BADGE["None"];
                      return (
                        <motion.tr
                          key={doc.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="group hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => setDetailDoc(doc)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="shrink-0">{getFileIcon(doc.name)}</div>
                              <div className="min-w-0">
                                <p className="font-semibold truncate max-w-[180px] text-foreground">{doc.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{doc.case_title || "General"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <Badge variant="outline" className="text-[10px] capitalize">{(doc.category || "—").replace(/_/g, " ")}</Badge>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            {doc.assigned_name ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">{doc.assigned_name[0]?.toUpperCase()}</div>
                                <span className="text-xs text-muted-foreground truncate max-w-[100px]">{doc.assigned_name}</span>
                              </div>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${sigBadge.cls}`}>{sigBadge.label}</span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <div className="text-xs text-muted-foreground">
                              <p>{doc.uploaded_by || "—"}</p>
                              <p>{doc.created_date ? formatDistanceToNow(new Date(doc.created_date), { addSuffix: true }) : "—"}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {doc.file_url && (
                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Download"><Download className="w-3.5 h-3.5" /></Button>
                                </a>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" title="AI Extract" onClick={() => handleAiExtract(doc)}>
                                <Brain className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Copy Share Link" onClick={() => handleShareLink(doc)}>
                                <Link2 className="w-3.5 h-3.5" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-3.5 h-3.5" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => setDetailDoc(doc)}><Eye className="w-4 h-4 mr-2" /> View Details</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAiExtract(doc)}><Brain className="w-4 h-4 mr-2" /> AI Extract</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleShareLink(doc)}><Share2 className="w-4 h-4 mr-2" /> Copy Link</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleRequestSignature(doc)}><FileSignature className="w-4 h-4 mr-2" /> Request Signature</DropdownMenuItem>
                                  {doc.signature_status === "Pending" && (
                                    <DropdownMenuItem onClick={() => updateMutation.mutate({ id: doc.id, data: { signature_status: "Signed" } })}><CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> Mark as Signed</DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { if (window.confirm("Delete this document?")) deleteMutation.mutate(doc.id); }}>
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        ))}

        {/* ── Templates Tab ──────────────────────────────────────────────── */}
        <TabsContent value="templates">
          <div className="animate-in fade-in mt-2">
            <DocumentGenerator onGenerate={() => setActiveTab("all")} />
          </div>
        </TabsContent>

        {/* ── Draw Signature Tab ─────────────────────────────────────────── */}
        <TabsContent value="draw">
          <div className="animate-in fade-in mt-2 bg-card p-6 rounded-2xl border border-border shadow-sm max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileSignature className="w-5 h-5 text-primary" /> Draw Your Signature</h3>
            <SignatureCanvas
              onSave={() => { toast({ title: "Signature saved!" }); setActiveTab("all"); }}
              onCancel={() => setActiveTab("all")}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Upload Dialog ───────────────────────────────────────────────────── */}
      <DocumentUploadDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        cases={cases}
        docCategories={docCategories}
        addDocCategory={addDocCategory}
        companyId={companyId}
        caseTerm={caseTerm}
        teamMembers={teamMembers}
        clients={clients}
      />

      {/* ── Detail / Audit Panel ────────────────────────────────────────────── */}
      <DocumentDetailPanel
        doc={detailDoc}
        onClose={() => setDetailDoc(null)}
        onPreview={(doc) => { setDetailDoc(null); setPreviewDoc(doc); }}
        onRequestSignature={handleRequestSignature}
        onAiExtract={handleAiExtract}
        onShareLink={handleShareLink}
        updateMutation={updateMutation}
        deleteMutation={deleteMutation}
      />

      {/* ── Preview Modal ───────────────────────────────────────────────────── */}
      {previewDoc && (
        <DocumentPreviewModal
          fileUrl={previewDoc.file_url}
          fileName={previewDoc.name}
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* ── AI Draft Modal ──────────────────────────────────────────────────── */}
      <AIDocumentDrafterModal
        isOpen={showDrafter}
        onClose={() => setShowDrafter(false)}
        companyId={companyId}
        user={user}
        cases={cases}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["documents"] })}
      />

      {/* ── AI Extract Result Modal ─────────────────────────────────────────── */}
      <Dialog open={!!aiDoc || aiLoading} onOpenChange={() => { setAiDoc(null); setAiLoading(false); }}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-2xl border-border bg-card">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-muted/30">
            <DialogTitle className="flex items-center gap-2 text-foreground"><Brain className="w-5 h-5 text-primary" /> AI Document Intelligence</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            {aiLoading ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">Analyzing document with AI...</p>
              </div>
            ) : aiDoc ? (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground font-mono">📄 {aiDoc.name}</p>
                <div className="bg-muted/30 rounded-xl p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed border border-border max-h-96 overflow-y-auto">
                  {aiDoc.content}
                </div>
              </div>
            ) : null}
          </div>
          <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20">
            <Button variant="ghost" onClick={() => { setAiDoc(null); setAiLoading(false); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Document Upload Dialog ────────────────────────────────────────────────────

const SHARE_TYPE_OPTS = [
  { value: "none",      label: "Don't Share",           icon: "🔒", desc: "Only visible to you and admins" },
  { value: "employees", label: "Share with Employees",   icon: "👥", desc: "Pick specific staff members" },
  { value: "clients",   label: "Share with Clients",     icon: "🤝", desc: "Pick from your client list" },
];

function DocumentUploadDialog({ open, onClose, onSubmit, cases, docCategories, addDocCategory, companyId, caseTerm, teamMembers, clients }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "", category: "other", case_id: "", case_title: "", notes: "",
    assigned_to: "", assigned_name: "", assigned_email: "",
    signature_status: "None", is_confidential: false,
  });
  const [shareType, setShareType] = useState("none");
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState("");

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleShareTypeChange = (type) => {
    setShareType(type);
    // Reset assignment when type changes
    handleChange("assigned_to", "");
    handleChange("assigned_name", "");
    handleChange("assigned_email", "");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const path = `${companyId || 'unassigned'}/${form.case_id || 'general'}/${Date.now()}_${safeName}`;
      await base44.storage.upload('documents', path, file);
      const url = base44.storage.getPublicUrl('documents', path);
      setFileUrl(url);
      if (!form.name) handleChange("name", file.name);
      toast({ title: "File uploaded ✓" });
    } catch (err) {
      const localUrl = URL.createObjectURL(file);
      setFileUrl(localUrl);
      if (!form.name) handleChange("name", file.name);
      toast({ title: "Using local fallback", description: "Supabase upload failed, local preview available.", variant: "default" });
    } finally {
      setUploading(false);
    }
  };

  const handleAssignee = (id) => {
    if (shareType === "employees") {
      const m = teamMembers.find(m => m.id === id);
      if (m) { handleChange("assigned_to", m.id); handleChange("assigned_name", m.full_name || m.email); handleChange("assigned_email", m.email); }
    } else if (shareType === "clients") {
      const c = clients.find(c => c.id === id);
      if (c) { handleChange("assigned_to", c.id); handleChange("assigned_name", c.name); handleChange("assigned_email", c.email || ""); }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, file_url: fileUrl, share_type: shareType });
    setForm({ name: "", category: "other", case_id: "", case_title: "", notes: "", assigned_to: "", assigned_name: "", assigned_email: "", signature_status: "None", is_confidential: false });
    setShareType("none");
    setFileUrl("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden rounded-2xl border-border shadow-xl bg-card flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-muted/30 shrink-0">
          <DialogTitle className="text-xl flex items-center gap-2 text-foreground">
            <Upload className="w-5 h-5 text-primary" /> Upload to SmartDocs
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 flex-1 overflow-y-auto">

            {/* File Drop */}
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">File</Label>
              <div className="mt-1.5 border-2 border-dashed border-primary/40 rounded-xl p-6 text-center hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => document.getElementById("doc-upload").click()}>
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <input type="file" className="hidden" id="doc-upload" onChange={handleFileUpload} />
                <p className="text-sm text-primary font-medium">{uploading ? "Uploading..." : fileUrl ? "File ready ✓ — click to replace" : "Click to choose a file"}</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, XLSX, JPG, PNG, MP4, ZIP</p>
              </div>
            </div>

            {/* Document Name */}
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Document Name</Label>
              <Input className="mt-1.5" value={form.name} onChange={e => handleChange("name", e.target.value)} placeholder="e.g. NDA Agreement 2025" required />
            </div>

            {/* Category & Case */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Category</Label>
                <Select value={form.category} onValueChange={v => handleChange("category", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {docCategories.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace(/_/g, " ")}</SelectItem>)}
                    <AddOptionInline onAdd={(v) => { addDocCategory(v); handleChange("category", v); }} placeholder="New category..." />
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">{caseTerm} (optional)</Label>
                <Select value={form.case_id} onValueChange={v => { const c = cases?.find(cs => cs.id === v); handleChange("case_id", v); handleChange("case_title", c?.title || ""); }}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder={`Link to ${caseTerm.toLowerCase()}`} /></SelectTrigger>
                  <SelectContent>{cases?.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Sharing Section ─────────────────────────────────────────────── */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Sharing &amp; Assignment</Label>
              <div className="grid grid-cols-3 gap-2">
                {SHARE_TYPE_OPTS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleShareTypeChange(opt.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${
                      shareType === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40 hover:bg-muted/40"
                    }`}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <span className="text-xs font-semibold leading-tight">{opt.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {SHARE_TYPE_OPTS.find(o => o.value === shareType)?.desc}
              </p>

              {/* Employee Picker */}
              {shareType === "employees" && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Select Employee</Label>
                  <Select value={form.assigned_to} onValueChange={handleAssignee}>
                    <SelectTrigger><SelectValue placeholder="Choose an employee..." /></SelectTrigger>
                    <SelectContent>
                      {teamMembers.length === 0 && <SelectItem value="none" disabled>No employees found</SelectItem>}
                      {teamMembers.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                              {(m.full_name || m.email || "?")[0].toUpperCase()}
                            </div>
                            <span>{m.full_name || m.email}</span>
                            <span className="text-xs text-muted-foreground capitalize">· {m.role}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Client Picker */}
              {shareType === "clients" && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Select Client</Label>
                  <Select value={form.assigned_to} onValueChange={handleAssignee}>
                    <SelectTrigger><SelectValue placeholder="Choose a client..." /></SelectTrigger>
                    <SelectContent>
                      {clients.length === 0 && <SelectItem value="none" disabled>No clients found</SelectItem>}
                      {clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-[9px] font-bold text-amber-700">
                              {(c.name || "?")[0].toUpperCase()}
                            </div>
                            <span>{c.name}</span>
                            {c.email && <span className="text-xs text-muted-foreground">· {c.email}</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Signature Status */}
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">E-Signature Status</Label>
              <Select value={form.signature_status} onValueChange={v => handleChange("signature_status", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">No Signature Needed</SelectItem>
                  <SelectItem value="Pending">Request Signature</SelectItem>
                  <SelectItem value="Signed">Already Signed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes & Confidential */}
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Notes</Label>
              <Input className="mt-1.5" value={form.notes} onChange={e => handleChange("notes", e.target.value)} placeholder="Optional notes or description..." />
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border">
              <Switch checked={form.is_confidential} onCheckedChange={c => handleChange("is_confidential", c)} id="confidential" />
              <div>
                <Label htmlFor="confidential" className="font-medium text-sm flex items-center gap-1.5 cursor-pointer"><FileLock2 className="w-4 h-4 text-muted-foreground" /> Mark as Confidential</Label>
                <p className="text-xs text-muted-foreground">Restricted visibility to admins only</p>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 shrink-0">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={uploading} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : "Upload Document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Document Detail Panel ─────────────────────────────────────────────────────

function DocumentDetailPanel({ doc, onClose, onPreview, onRequestSignature, onAiExtract, onShareLink, updateMutation, deleteMutation }) {
  if (!doc) return null;

  const sigBadge = SIG_STATUS_BADGE[doc.signature_status] || SIG_STATUS_BADGE["None"];

  const auditTrail = [
    { action: "Uploaded", by: doc.uploaded_by || "Unknown", at: doc.created_date },
    doc.assigned_name && { action: `Assigned to ${doc.assigned_name}`, by: doc.uploaded_by || "System", at: doc.created_date },
    doc.signature_status === "Pending" && { action: "Signature Requested", by: doc.uploaded_by || "System", at: doc.created_date },
    doc.signature_status === "Signed" && { action: "Document Signed", by: doc.assigned_name || "Unknown", at: doc.created_date },
  ].filter(Boolean);

  return (
    <Dialog open={!!doc} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden rounded-2xl border-border shadow-xl bg-card">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-muted/30">
          <DialogTitle className="text-xl flex items-center gap-2 text-foreground">
            {getFileIcon(doc.name)}
            <span className="truncate">{doc.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[65vh]">
          {/* Meta Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Category</p>
              <Badge variant="outline" className="capitalize">{(doc.category || "—").replace(/_/g, " ")}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Signature Status</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${sigBadge.cls}`}>{sigBadge.label}</span>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Uploaded By</p>
              <p className="font-medium text-foreground">{doc.uploaded_by || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Assigned To</p>
              <p className="font-medium text-foreground">{doc.assigned_name || "—"}</p>
            </div>
            {doc.case_title && (
              <div className="col-span-2 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Linked Case</p>
                <p className="font-medium text-foreground">{doc.case_title}</p>
              </div>
            )}
            {doc.notes && (
              <div className="col-span-2 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Notes</p>
                <p className="text-sm text-foreground bg-muted/30 rounded-lg p-3 border border-border">{doc.notes}</p>
              </div>
            )}
          </div>

          {/* Audit Trail */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Audit Trail</p>
            <div className="space-y-2">
              {auditTrail.map((event, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{event.action}</p>
                    <p className="text-xs text-muted-foreground">by {event.by} · {event.at ? formatDistanceToNow(new Date(event.at), { addSuffix: true }) : "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              {doc.file_url && (
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full gap-2 text-sm h-9"><Eye className="w-4 h-4" /> Preview</Button>
                </a>
              )}
              {doc.file_url && (
                <Button variant="outline" className="w-full gap-2 text-sm h-9" onClick={() => forceDownload(doc.file_url, doc.name)}>
                  <Download className="w-4 h-4" /> Download
                </Button>
              )}
              <Button variant="outline" className="gap-2 text-sm h-9" onClick={() => { onClose(); onAiExtract(doc); }}>
                <Brain className="w-4 h-4 text-primary" /> AI Extract
              </Button>
              <Button variant="outline" className="gap-2 text-sm h-9" onClick={() => onShareLink(doc)}>
                <Link2 className="w-4 h-4" /> Copy Link
              </Button>
              {doc.signature_status === "None" && (
                <Button variant="outline" className="gap-2 text-sm h-9 col-span-2" onClick={() => { onRequestSignature(doc); onClose(); }}>
                  <FileSignature className="w-4 h-4 text-amber-500" /> Request Signature
                </Button>
              )}
              {doc.signature_status === "Pending" && (
                <Button variant="outline" className="gap-2 text-sm h-9 col-span-2 border-green-200 text-green-600 hover:bg-green-50" onClick={() => { updateMutation.mutate({ id: doc.id, data: { signature_status: "Signed" } }); onClose(); }}>
                  <CheckCircle2 className="w-4 h-4" /> Mark as Signed
                </Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant="destructive" className="gap-2" onClick={() => { if (window.confirm("Delete this document?")) { deleteMutation.mutate(doc.id); onClose(); } }}>
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}