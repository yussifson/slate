import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Search, FileText, ExternalLink, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { OrbitLoader } from "@/components/ui/orbit-loader";

export default function Documents() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: rawDocuments = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => base44.entities.Document.filter(),
    enabled: !!user,
  });

  const documents = (rawDocuments || []).map(d => {
    let cleanNotes = d.notes;
    let cleanCategory = d.category;
    let cleanExpiry = d.expiry_date;
    if (d.notes && typeof d.notes === 'string' && d.notes.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(d.notes);
        cleanNotes = parsed.notes || '';
        if (parsed.category) cleanCategory = parsed.category;
        if (parsed.expiry_date) cleanExpiry = parsed.expiry_date;
      } catch (e) {}
    }
    return {
      ...d,
      notes: cleanNotes,
      category: cleanCategory || d.category || 'other',
      expiry_date: cleanExpiry || d.expiry_date
    };
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["documents"]);
      toast({ title: "Document deleted" });
    }
  });

  const displayDocs = documents.filter(d => {
    if (search && !d.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeCategory !== "all" && d.category !== activeCategory) return false;
    return true;
  });

  const categories = ["grn", "delivery_note", "receipt_photo", "production_record", "packaging_record", "invoice", "waybill", "other"];

  return (
    <div className="space-y-6 max-w-[1700px] w-full mx-auto pb-32 md:pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-xl font-bold tracking-tight text-foreground tracking-tight">Operations Documents</h1>
          <p className="hidden sm:block text-sm font-medium text-muted-foreground mt-1">Manage GRNs, delivery notes, and production records.</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="gap-2 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all hover:opacity-95 text-white rounded-lg shadow-sm font-bold h-10 px-4"
        >
          <Plus className="w-4 h-4 stroke-[2]" /> Upload Document
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden p-4 sm:p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex flex-wrap gap-2 bg-muted/30 border-b border-border/50 p-1 rounded-lg">
            <button 
              onClick={() => setActiveCategory("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${activeCategory === "all" ? 'bg-[#F0709B] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >All</button>
            {categories.map(c => (
              <button 
                key={c} onClick={() => setActiveCategory(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${activeCategory === c ? 'bg-[#F0709B] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >{c.replace('_', ' ')}</button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search documents..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-10 h-10 bg-card border-border rounded-lg text-xs font-medium focus-visible:ring-2 focus-visible:ring-[#F0709B]/30" 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/30 border-b border-border/50 border-b border-border/50">
              <tr>
                <th className="px-4 py-3 font-semibold tracking-wide text-xs uppercase tracking-wider text-muted-foreground">Document Name</th>
                <th className="px-4 py-3 font-semibold tracking-wide text-xs uppercase tracking-wider text-muted-foreground">Category</th>
                <th className="px-4 py-3 font-semibold tracking-wide text-xs uppercase tracking-wider text-muted-foreground">Related Entity</th>
                <th className="px-4 py-3 font-semibold tracking-wide text-xs uppercase tracking-wider text-muted-foreground">Uploaded By</th>
                <th className="px-4 py-3 font-semibold tracking-wide text-xs uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="px-4 py-3 font-semibold tracking-wide text-xs uppercase tracking-wider text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <OrbitLoader size="md" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Loading documents...</span>
                    </div>
                  </td>
                </tr>
              ) : displayDocs.length === 0 ? (
                <tr><td colSpan="6" className="py-12 text-center text-xs font-medium text-muted-foreground">No documents found.</td></tr>
              ) : (
                displayDocs.map(d => (
                  <tr key={d.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#F0709B]/10 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{d.name}</p>
                          <p className="text-xs text-muted-foreground font-medium">{d.notes}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-secondary dark:bg-[#151D2E] text-primary border border-[#F0709B]/20 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase tracking-wide">
                        {d.category?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-muted-foreground">
                      {d.related_entity_type} {d.related_entity_id ? `(#${d.related_entity_id})` : ''}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-foreground">{d.uploaded_by || 'System'}</td>
                    <td className="px-4 py-3 text-xs font-medium text-muted-foreground">
                      {d.created_at ? format(new Date(d.created_at), "MMM d, yyyy") : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {d.file_url && (
                          <Button variant="ghost" size="sm" className="rounded-xl h-8 w-8 p-0" onClick={() => window.open(d.file_url, '_blank')}>
                            <ExternalLink className="w-4 h-4 text-primary" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="rounded-xl h-8 w-8 p-0 hover:bg-rose-500/10 text-rose-500" onClick={() => deleteMutation.mutate(d.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && <UploadDocumentDialog open={showForm} onClose={() => setShowForm(false)} categories={categories} />}
    </div>
  );
}

function UploadDocumentDialog({ open, onClose, categories }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [form, setForm] = useState({ name: "", category: "other", related_entity_type: "", related_entity_id: "", notes: "" });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!form.name || !file) {
      toast({ title: "Name and file are required", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('documents').upload(`operations/${fileName}`, file);
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(`operations/${fileName}`);
      
      await base44.entities.Document.create({
        ...form,
        file_url: urlData.publicUrl,
        uploaded_by: user?.email
      });
      
      queryClient.invalidateQueries(["documents"]);
      toast({ title: "Document uploaded successfully" });
      onClose();
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-xl bg-card border-border/50 dark:border-white/10 p-4 sm:p-5 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight tracking-tight">Upload Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Document Name</Label>
            <Input value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="mt-1.5 h-10 rounded-lg bg-secondary/30" />
          </div>
          
          <div>
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">File</Label>
            <Input type="file" onChange={e => setFile(e.target.files[0])} className="mt-1.5 h-10 rounded-lg bg-secondary/30 file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#F0709B]/10 file:text-primary hover:file:bg-[#F0709B]/20 cursor-pointer" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</Label>
              <Select value={form.category} onValueChange={v=>setForm({...form, category: v})}>
                <SelectTrigger className="mt-1.5 h-10 rounded-lg bg-secondary/30"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-lg">
                  {categories.map(c => <SelectItem key={c} value={c} className="rounded-xl capitalize font-medium">{c.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Related Entity Type</Label>
              <Input value={form.related_entity_type} onChange={e=>setForm({...form, related_entity_type: e.target.value})} className="mt-1.5 h-10 rounded-lg bg-secondary/30 text-xs" placeholder="e.g. ProductionBatch" />
            </div>
          </div>
          
          <div>
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Related Entity ID</Label>
            <Input value={form.related_entity_id} onChange={e=>setForm({...form, related_entity_id: e.target.value})} className="mt-1.5 h-10 rounded-lg bg-secondary/30 text-xs" placeholder="e.g. 123" />
          </div>

          <div>
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notes</Label>
            <Textarea value={form.notes} onChange={e=>setForm({...form, notes: e.target.value})} className="mt-1.5 rounded-lg bg-secondary/30 text-xs resize-none" rows={3} />
          </div>
        </div>
        <DialogFooter className="mt-6 flex gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-lg font-bold">Cancel</Button>
          <Button onClick={handleUpload} disabled={uploading} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all hover:opacity-95 text-white font-bold rounded-lg">
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
