import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Plus, Edit, Trash2, Search, Download, Copy, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RealEstateAPI } from '@/api/RealEstateAPI';
import { toast } from 'react-hot-toast';
import { useViewPreference } from '@/hooks/useViewPreference';
import ViewToggle from '@/components/shared/ViewToggle';

export default function DocumentTemplates() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showPreview, setShowPreview] = useState(null);
  const [view, setView] = useViewPreference('re_documenttemplates', 'grid');
const [formData, setFormData] = useState({
    templateName: '',
    documentType: 'contract',
    documentCategory: 'sales',
    requiredSignatures: 2,
    version: '1.0',
    content: '',
    description: '',
    isActive: true,
  });

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_re_document_templates WHERE company_id = ? ORDER BY created_at DESC',
          [companyId]
        );
        const data = res.rows._array || Array.from(res.rows);
        setTemplates(data);
      } catch (e) {
        console.error('[DocumentTemplates] Fetch failed:', e);
        toast.error('Failed to load document templates');
      }
      setIsLoading(false);
    };

    if (companyId) fetchTemplates();
  }, [companyId]);

  // Filter templates
  useEffect(() => {
    let filtered = templates;
    if (search) {
      filtered = filtered.filter(t =>
        t.template_name?.toLowerCase().includes(search.toLowerCase()) ||
        t.document_type?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.document_category === categoryFilter);
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => (statusFilter === 'active' ? t.is_active : !t.is_active));
    }
    setFilteredTemplates(filtered);
  }, [templates, search, categoryFilter, statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await RealEstateAPI.updateDocumentTemplate(companyId, editingId, formData, user.id);
        toast.success('Document template updated successfully');
      } else {
        await RealEstateAPI.createDocumentTemplate(companyId, formData, user.id);
        toast.success('Document template created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        templateName: '',
        documentType: 'contract',
        documentCategory: 'sales',
        requiredSignatures: 2,
        version: '1.0',
        content: '',
        description: '',
        isActive: true,
      });

      const res = await powerSync.execute(
        'SELECT * FROM univ_re_document_templates WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setTemplates(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('[DocumentTemplates] Submit failed:', e);
      toast.error('Failed to save document template');
    }
  };

  const handleEdit = (template) => {
    setFormData({
      templateName: template.template_name || '',
      documentType: template.document_type || 'contract',
      documentCategory: template.document_category || 'sales',
      requiredSignatures: template.required_signatures || 2,
      version: template.version || '1.0',
      content: template.template_content || template.content || '',
      description: template.description || '',
      isActive: template.is_active !== false,
    });
    setEditingId(template.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document template?')) return;
    try {
      await RealEstateAPI.deleteDocumentTemplate(companyId, id, user.id);
      toast.success('Document template deleted successfully');
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_document_templates WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setTemplates(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('[DocumentTemplates] Delete failed:', e);
      toast.error('Failed to delete document template');
    }
  };

  const handleDuplicate = async (template) => {
    try {
      const newTemplate = {
        ...formData,
        templateName: `${template.template_name} (Copy)`,
        version: `${template.version}-copy`,
        content: template.template_content || template.content,
        documentType: template.document_type,
        documentCategory: template.document_category,
        requiredSignatures: template.required_signatures,
        description: template.description,
      };
      await RealEstateAPI.createDocumentTemplate(companyId, newTemplate, user.id);
      toast.success('Document template duplicated successfully');
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_document_templates WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setTemplates(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('[DocumentTemplates] Duplicate failed:', e);
      toast.error('Failed to duplicate document template');
    }
  };

  // KPI calculations
  const totalTemplates = templates.length;
  const activeTemplates = templates.filter(t => t.is_active).length;
  const categories = [...new Set(templates.map(t => t.document_category))].length;

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Document Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage reusable document templates for transactions</p>
        </div>
          <div className="flex items-center gap-4">
            <ViewToggle view={view} onViewChange={setView} allowedViews={['grid', 'list']} />
            <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({
          templateName: '',
          documentType: 'contract',
          documentCategory: 'sales',
          requiredSignatures: 2,
          version: '1.0',
          content: '',
          description: '',
          isActive: true,
        }); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Template
        </Button>
          </div>
        </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Total Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-sm font-bold">{totalTemplates}</div>
            <p className="text-xs text-muted-foreground mt-1">Available templates</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Active Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-sm font-bold text-green-600 dark:text-green-400">{activeTemplates}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to use</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-sm font-bold">{categories}</div>
            <p className="text-xs text-muted-foreground mt-1">Document types</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by template name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="lease">Lease</SelectItem>
            <SelectItem value="legal">Legal</SelectItem>
            <SelectItem value="financing">Financing</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="relative group bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
                                <div className="absolute top-0 right-0 border-t-[80px] border-r-[80px] border-t-transparent border-r-primary/10 pointer-events-none group-hover:border-r-primary/20 transition-colors duration-500 z-0" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/5 to-transparent rounded-tr-[4rem] pointer-events-none z-0 transition-opacity duration-500 opacity-50 group-hover:opacity-100" />
                <div className="absolute top-0 right-0 border-t-[80px] border-r-[80px] border-t-transparent border-r-primary/10 pointer-events-none group-hover:border-r-primary/20 transition-colors duration-500 z-0" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/5 to-transparent rounded-tr-[4rem] pointer-events-none z-0 transition-opacity duration-500 opacity-50 group-hover:opacity-100" />
<CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {template.template_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 capitalize">{template.document_type}</p>
                </div>
                <Badge variant={template.is_active ? 'default' : 'secondary'}>
                  {template.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
              {template.description && (
                <p className="text-sm text-muted-foreground">{template.description}</p>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium capitalize">{template.document_category}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Version</p>
                  <p className="font-medium">{template.version}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-medium text-muted-foreground">Signatures Required</p>
                <p className="font-bold text-primary">{template.required_signatures}</p>
              </div>

              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(template)} className="h-7 w-7 text-primary hover:bg-primary/10 bg-white/50 dark:bg-black/50 backdrop-blur-sm shadow-sm" title="Edit">
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(template.id)} className="h-7 w-7 text-red-600 hover:bg-red-100 hover:text-red-700 bg-white/50 dark:bg-black/50 backdrop-blur-sm shadow-sm" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">No document templates found. Create your first template!</p>
        </Card>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <Sheet open={!!showPreview} onOpenChange={() => setShowPreview(null)}>
          <SheetContent className="w-full max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{showPreview.template_name}</SheetTitle>
              <SheetDescription>{showPreview.document_type}</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium capitalize">{showPreview.document_category}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Version</p>
                  <p className="font-medium">{showPreview.version}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Signatures</p>
                  <p className="font-medium">{showPreview.required_signatures}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium">{showPreview.is_active ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
              <div className="border rounded p-4 bg-white min-h-96">
                <div className="whitespace-pre-wrap text-sm">{showPreview.content}</div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Template Form Modal */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Document Template' : 'Add New Document Template'}</SheetTitle>
            <SheetDescription>Create a reusable template for your transactions</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-medium">Template Name</label>
              <Input
                value={formData.templateName}
                onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                placeholder="e.g., Standard Purchase Agreement"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Document Type</label>
                <Select value={formData.documentType} onValueChange={(value) => setFormData({ ...formData, documentType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="agreement">Agreement</SelectItem>
                    <SelectItem value="disclosure">Disclosure</SelectItem>
                    <SelectItem value="addendum">Addendum</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={formData.documentCategory} onValueChange={(value) => setFormData({ ...formData, documentCategory: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="lease">Lease</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="financing">Financing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Version</label>
                <Input
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="e.g., 1.0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Signatures Required</label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.requiredSignatures}
                  onChange={(e) => setFormData({ ...formData, requiredSignatures: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this template..."
                className="w-full p-2 border rounded text-sm"
                rows="2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Template Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter the template content here..."
                className="w-full p-2 border rounded text-sm font-mono"
                rows="8"
                required
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
                Template is active
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingId ? 'Update' : 'Create'} Template
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
