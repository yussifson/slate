import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Plus, Edit, Trash2, Search, Download, Copy, Eye, CheckCircle2, Shield, RefreshCw, FileCode
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function JCLDocumentTemplates() {
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const [formData, setFormData] = useState({
    templateName: '',
    documentCategory: 'sales',
    requiredSignatures: 2,
    version: '1.0',
    description: '',
  });

  const fetchData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_document_templates WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setTemplates(res.rows._array || Array.from(res.rows || []));
    } catch (_err) {
      toast.error('Failed to load document templates');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchSearch = !search ||
        t.template_name?.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === 'all' || t.document_category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [templates, search, categoryFilter]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.templateName) {
      toast.error('Template name is required');
      return;
    }

    try {
      const now = new Date().toISOString();
      if (editingId) {
        await powerSync.execute(
          `UPDATE univ_re_document_templates SET
            template_name = ?, document_category = ?, required_signatures = ?,
            version = ?, description = ?
          WHERE id = ? AND company_id = ?`,
          [
            formData.templateName, formData.documentCategory, Number(formData.requiredSignatures) || 2,
            formData.version || '1.0', formData.description || null,
            editingId, companyId
          ]
        );
        toast.success('Template updated');
      } else {
        const newId = generateUUID();
        await powerSync.execute(
          `INSERT INTO univ_re_document_templates (
            id, created_at, company_id, template_name, document_category,
            required_signatures, version, description, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId, now, companyId, formData.templateName, formData.documentCategory,
            Number(formData.requiredSignatures) || 2, formData.version || '1.0',
            formData.description || null, 1
          ]
        );
        toast.success('Document template registered');
      }

      setShowForm(false);
      fetchData();
    } catch (_err) {
      toast.error('Failed to save template');
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Document Templates & Contract Library
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Standardized real estate purchase agreements, lease templates, and disclosures
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="h-9 px-3 text-xs gap-1.5 border-border">
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            onClick={() => {
              setEditingId(null);
              setFormData({ templateName: '', documentCategory: 'sales', requiredSignatures: 2, version: '1.0', description: '' });
              setShowForm(true);
            }}
            size="sm"
            className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card border border-border/80 p-3 rounded-xl shadow-xs">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by template name or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-background"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 text-xs w-[170px] bg-background">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Categories</SelectItem>
              <SelectItem value="sales" className="text-xs">Sales Agreements</SelectItem>
              <SelectItem value="lease" className="text-xs">Lease Contracts</SelectItem>
              <SelectItem value="disclosure" className="text-xs">Disclosures</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-3 p-8 border border-dashed border-border rounded-2xl text-center bg-card">
            <p className="text-xs text-muted-foreground">No document templates found.</p>
          </div>
        ) : (
          filteredTemplates.map(t => (
            <div key={t.id} className="p-5 rounded-2xl border border-border/80 bg-card hover:border-emerald-500/50 transition-all shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="outline" className="text-[9px] uppercase font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                    {t.document_category || 'Sales'}
                  </Badge>
                  <span className="text-[10px] font-mono text-muted-foreground">v{t.version || '1.0'}</span>
                </div>
                <h3 className="font-bold text-foreground text-sm line-clamp-1">{t.template_name}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description || 'Standardized legal real estate document.'}</p>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground text-[11px] font-mono">{t.required_signatures || 2} Signatures Required</span>
                <Button variant="ghost" size="sm" onClick={() => setPreviewTemplate(t)} className="h-7 text-xs px-2">
                  Preview
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Register Template</SheetTitle>
            <SheetDescription>Configure standardized real estate legal document template</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <Label className="text-xs">Template Title</Label>
              <Input
                value={formData.templateName}
                onChange={e => setFormData({ ...formData, templateName: e.target.value })}
                placeholder="e.g. Exclusive Right to Sell Agreement"
                className="h-9 text-xs mt-1"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={formData.documentCategory} onValueChange={v => setFormData({ ...formData, documentCategory: v })}>
                  <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales" className="text-xs">Sales</SelectItem>
                    <SelectItem value="lease" className="text-xs">Lease</SelectItem>
                    <SelectItem value="disclosure" className="text-xs">Disclosure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Required Signatures</Label>
                <Input
                  type="number"
                  value={formData.requiredSignatures}
                  onChange={e => setFormData({ ...formData, requiredSignatures: e.target.value })}
                  className="h-9 text-xs mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Input
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Overview of template scope..."
                className="h-9 text-xs mt-1"
              />
            </div>
            <Button type="submit" className="w-full h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white mt-2">
              Save Template
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
