import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useFirmSettings } from "@/hooks/useFirmSettings";
import { Plus, FolderOpen, Search, Download, Trash2, Upload, MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import AddOptionInline from "@/components/shared/AddOptionInline";
import { format } from "date-fns";

import { useToast } from "@/components/ui/use-toast";

export default function Documents() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { docCategories, addDocCategory } = useFirmSettings();
  const [showForm, setShowForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents", companyId],
    queryFn: () => base44.entities.Document.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ["cases", companyId],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Document.create({ ...data, company_id: companyId, uploaded_by: user?.email }),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["documents"] }); 
      setShowForm(false);
      toast({ title: "Document uploaded successfully" });
    },
    onError: (err) => toast({ title: "Failed to upload document", description: err.message, variant: "destructive" })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Document.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setEditingDocument(null);
      toast({ title: "Document updated successfully" });
    },
    onError: (err) => toast({ title: "Failed to update document", description: err.message, variant: "destructive" })
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
      render: (row) => (
        <div>
          <p className="font-medium text-sm">{row.name}</p>
          {row.case_id ? (
            <Link to={`/cases/${row.case_id}`} className="text-xs text-primary hover:underline">{row.case_title}</Link>
          ) : (
            <p className="text-xs text-muted-foreground">{row.case_title || "General"}</p>
          )}
        </div>
      )
    },
    { header: "Category", render: (row) => <Badge variant="outline" className="text-[10px] capitalize">{row.category?.replace(/_/g, " ")}</Badge> },
    { header: "Uploaded By", render: (row) => <span className="text-sm">{row.uploaded_by || "—"}</span> },
    { header: "Date", render: (row) => <span className="text-xs text-muted-foreground">{format(new Date(row.created_date), "MMM d, yyyy")}</span> },
    {
      header: "Actions",
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setViewingDocument(row)}>View Details</DropdownMenuItem>
            {row.file_url && (
              <DropdownMenuItem onClick={() => window.open(row.file_url, "_blank")}>Download</DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setEditingDocument(row)}>Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={() => {
              if (window.confirm("Delete this document?")) deleteMutation.mutate(row.id);
            }}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Documents"
        subtitle={`${documents.length} documents`}
        actions={<Button onClick={() => setShowForm(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> Upload Document</Button>}
      />
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search documents..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {docCategories.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={filtered} isLoading={isLoading} emptyTitle="No documents yet" emptyIcon={FolderOpen} />

      <DocumentUploadDialog
        open={showForm || !!editingDocument}
        onClose={() => { setShowForm(false); setEditingDocument(null); }}
        onSubmit={(data) => editingDocument ? updateMutation.mutate({ id: editingDocument.id, data }) : createMutation.mutate(data)}
        initialData={editingDocument}
        cases={cases}
        docCategories={docCategories}
        addDocCategory={addDocCategory}
      />

      <Sheet open={!!viewingDocument} onOpenChange={(open) => !open && setViewingDocument(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Document Details</SheetTitle>
          </SheetHeader>
          {viewingDocument && (
            <div className="mt-6 space-y-4">
              <div>
                <Label className="text-muted-foreground">Document Name</Label>
                <p className="font-medium">{viewingDocument.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Category</Label>
                <p className="font-medium capitalize">{viewingDocument.category?.replace(/_/g, " ") || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Case</Label>
                <p className="font-medium">
                  {viewingDocument.case_id ? (
                    <Link to={`/cases/${viewingDocument.case_id}`} className="text-primary hover:underline">
                      {viewingDocument.case_title}
                    </Link>
                  ) : viewingDocument.case_title || "General"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Uploaded By</Label>
                <p className="font-medium">{viewingDocument.uploaded_by || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Date</Label>
                <p className="font-medium">{format(new Date(viewingDocument.created_date), "MMM d, yyyy")}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Notes</Label>
                <p className="font-medium whitespace-pre-wrap">{viewingDocument.notes || "—"}</p>
              </div>
              {viewingDocument.file_url && (
                <div className="pt-4">
                  <a href={viewingDocument.file_url} target="_blank" rel="noopener noreferrer">
                    <Button><Download className="w-4 h-4 mr-2" /> Download File</Button>
                  </a>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DocumentUploadDialog({ open, onClose, onSubmit, cases, docCategories, addDocCategory, initialData }) {
  const [form, setForm] = React.useState({ name: "", category: "other", case_id: "", case_title: "", notes: "" });
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState("");

  React.useEffect(() => {
    if (initialData) {
      setForm(initialData);
      setFileUrl(initialData.file_url || "");
    } else {
      setForm({ name: "", category: "other", case_id: "", case_title: "", notes: "" });
      setFileUrl("");
    }
  }, [initialData, open]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `${Date.now()}_${file.name}`;
      await base44.storage.upload('documents', path, file);
      const file_url = base44.storage.getPublicUrl('documents', path);
      setFileUrl(file_url);
      if (!form.name) setForm(prev => ({ ...prev, name: file.name }));
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed. Make sure the 'documents' bucket exists in your Supabase Storage and has public access enabled.");
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
        <DialogHeader><DialogTitle>{initialData ? "Edit Document" : "Upload Document"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>File</Label>
            <div className="mt-1 border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <input type="file" className="hidden" id="doc-upload" onChange={handleFileUpload} />
              <label htmlFor="doc-upload" className="text-sm text-primary cursor-pointer hover:underline">
                {uploading ? "Uploading..." : fileUrl ? "File uploaded ✓" : "Choose file to upload"}
              </label>
            </div>
          </div>
          <div><Label>Document Name</Label><Input value={form.name} onChange={(e) => handleChange("name", e.target.value)} required /></div>
          <div>
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => handleChange("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {docCategories.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace(/_/g, " ")}</SelectItem>)}
                <AddOptionInline onAdd={(v) => { addDocCategory(v); handleChange("category", v); }} placeholder="New category..." />
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Case</Label>
            <Select value={form.case_id} onValueChange={(v) => { const c = cases?.find(cs => cs.id === v); handleChange("case_id", v); handleChange("case_title", c?.title || ""); }}>
              <SelectTrigger><SelectValue placeholder="Link to case (optional)" /></SelectTrigger>
              <SelectContent>{cases?.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={uploading}>{initialData ? "Save Changes" : "Upload"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}