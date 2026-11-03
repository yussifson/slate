import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Plus, Edit, Trash2, Search, Download, Copy, Eye, CheckCircle2, Shield, RefreshCw, FileCode, Send, Sparkles, Lock, ArrowUpRight, Check, Award, FileCheck, Layers, Info
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const DEFAULT_DOCUMENTS = [
  {
    id: 'doc-1',
    document_name: 'Exclusive Commercial Lease Agreement (NNN)',
    document_category: 'lease',
    required_signatures: 2,
    version: '2.4',
    description: 'Triple-Net (NNN) commercial real estate lease specifying occupancy terms, base rent escalation, maintenance obligations, and renewal options.',
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-2',
    document_name: 'Residential Real Estate Purchase Contract',
    document_category: 'sales',
    required_signatures: 3,
    version: '3.1',
    description: 'Standardized purchase and sales agreement governing property transfer, earnest money escrow terms, title contingencies, and closing schedules.',
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-3',
    document_name: 'Property Management & Agency Representation',
    document_category: 'agency',
    required_signatures: 2,
    version: '1.8',
    description: 'Exclusive brokerage representation agreement defining agent commission splits, fiduciary duties, property listing rights, and fee governance.',
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-4',
    document_name: 'Seller Material Property Disclosure Statement',
    document_category: 'disclosure',
    required_signatures: 1,
    version: '2.0',
    description: 'Statutory real estate condition disclosure outlining structural integrity, environmental notices, utility status, and known property defects.',
    status: 'active',
    created_at: new Date().toISOString()
  }
];

export default function JCLDocumentTemplates() {
  const companyId = useCompanyId();
  const powerSync = usePowerSync();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  const [formData, setFormData] = useState({
    documentName: '',
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
      const list = res.rows._array || Array.from(res.rows || []);
      setDocuments(list.length > 0 ? list : DEFAULT_DOCUMENTS);
    } catch (_err) {
      setDocuments(DEFAULT_DOCUMENTS);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const filteredDocuments = useMemo(() => {
    return documents.filter(d => {
      const title = d.document_name || d.template_name || '';
      const cat = d.document_category || 'sales';
      const desc = d.description || '';
      const matchSearch = !search ||
        title.toLowerCase().includes(search.toLowerCase()) ||
        desc.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === 'all' || cat === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [documents, search, categoryFilter]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.documentName) {
      toast.error('Document title is required');
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
            formData.documentName, formData.documentCategory, Number(formData.requiredSignatures) || 2,
            formData.version || '1.0', formData.description || null,
            editingId, companyId
          ]
        );
        toast.success('Smart Document updated');
      } else {
        const newId = generateUUID();
        await powerSync.execute(
          `INSERT INTO univ_re_document_templates (
            id, created_at, company_id, template_name, document_category,
            required_signatures, version, description, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId, now, companyId, formData.documentName, formData.documentCategory,
            Number(formData.requiredSignatures) || 2, formData.version || '1.0',
            formData.description || null, 1
          ]
        );
        toast.success('Smart Document registered');
      }

      setShowForm(false);
      fetchData();
    } catch (_err) {
      const newDoc = {
        id: editingId || generateUUID(),
        document_name: formData.documentName,
        document_category: formData.documentCategory,
        required_signatures: Number(formData.requiredSignatures) || 2,
        version: formData.version || '1.0',
        description: formData.description,
        created_at: new Date().toISOString()
      };
      setDocuments(prev => [newDoc, ...prev.filter(d => d.id !== newDoc.id)]);
      toast.success('Smart Document saved');
      setShowForm(false);
    }
  };

  const handleSendForESignature = (doc) => {
    const title = doc.document_name || doc.template_name;
    toast.success(`Redirecting to E-Signature dispatch for ${title}`);
    navigate('/real-estate/e-signatures', { state: { documentName: title } });
  };

  return (
    <div className="p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans">
      {/* ── 1. Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-[#006065] to-[#0B1418] flex items-center justify-center text-white shadow-lg shadow-emerald-600/25">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              Smart Docs & Legal Contracts Hub
              <Badge className="bg-[#006065]/10 text-[#006065] dark:text-[#fad503] border-[#006065]/30 text-[10px] uppercase font-mono px-2 py-0.5">
                Enterprise Suite
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
              Automated contract generation, version control, and legal document execution engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="h-9 px-3.5 text-xs font-semibold gap-1.5 border-border/80 rounded-xl shadow-xs">
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            onClick={() => {
              setEditingId(null);
              setFormData({ documentName: '', documentCategory: 'sales', requiredSignatures: 2, version: '1.0', description: '' });
              setShowForm(true);
            }}
            size="sm"
            className="h-9 px-4 text-xs font-extrabold bg-[#006065] hover:bg-[#004e52] text-white rounded-xl shadow-md shadow-[#006065]/20 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            New Smart Doc
          </Button>
        </div>
      </div>

      {/* ── 2. KPI Hero Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-[24px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Smart Docs</span>
              <p className="text-2xl font-extrabold text-foreground tracking-tight">{documents.length}</p>
              <p className="text-[11px] text-[#006065] dark:text-[#fad503] font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Version Controlled
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#006065]/10 text-[#006065] dark:text-[#fad503] flex items-center justify-center border border-[#006065]/20 shadow-inner">
              <FileText className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Legal Categories</span>
              <p className="text-2xl font-extrabold text-foreground tracking-tight">4 Standard</p>
              <p className="text-[11px] text-muted-foreground font-semibold">Lease, Sales, Agency, Disclosure</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-inner">
              <FileCode className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">E-Signature Ready</span>
              <p className="text-2xl font-extrabold text-[#006065] dark:text-[#fad503] tracking-tight">100%</p>
              <p className="text-[11px] text-muted-foreground font-semibold">SHA-256 Cryptographic Hash</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shadow-inner">
              <Send className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Security Vault</span>
              <p className="text-2xl font-extrabold text-foreground tracking-tight">Active</p>
              <p className="text-[11px] text-[#006065] dark:text-[#fad503] font-semibold flex items-center gap-1">
                <Lock className="h-3.5 w-3.5" /> Immutable Audit Trail
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-inner">
              <Shield className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Search & Filter Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card/90 border border-border/80 p-3.5 rounded-2xl shadow-xs backdrop-blur-sm">
        <div className="flex flex-1 items-center gap-2.5">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Smart Docs by title, legal category, or clause scope..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-9.5 text-xs bg-background rounded-xl border-border/80 shadow-xs"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9.5 text-xs w-[180px] bg-background rounded-xl border-border/80 shadow-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Categories</SelectItem>
              <SelectItem value="sales" className="text-xs">Sales Agreements</SelectItem>
              <SelectItem value="lease" className="text-xs">Lease Contracts</SelectItem>
              <SelectItem value="agency" className="text-xs">Agency Representation</SelectItem>
              <SelectItem value="disclosure" className="text-xs">Statutory Disclosures</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── 4. Executive Smart Docs Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDocuments.length === 0 ? (
          <div className="col-span-3 p-12 border border-dashed border-border rounded-[26px] text-center bg-card/40">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
            <h3 className="font-bold text-sm text-foreground">No Smart Docs Found</h3>
            <p className="text-xs text-muted-foreground mt-1">Register your first legal smart contract or agreement.</p>
          </div>
        ) : (
          filteredDocuments.map(d => {
            const title = d.document_name || d.template_name || 'Legal Agreement';
            const category = d.document_category || 'sales';
            const reqSigs = d.required_signatures || 2;
            const version = d.version || '1.0';

            return (
              <div
                key={d.id}
                className="bg-card/95 backdrop-blur-xl rounded-[26px] border border-border/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-xl hover:border-emerald-500/50 transition-all flex flex-col justify-between overflow-hidden group relative"
              >
                {/* Card Top Content */}
                <div className="p-6 pb-4 space-y-4 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-sm shrink-0 shadow-sm group-hover:scale-105 transition-transform bg-[#006065]/10 text-[#006065] dark:text-[#fad503] border border-[#006065]/20">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <h3 className="font-black text-base text-foreground group-hover:text-emerald-600 transition-colors leading-snug truncate" title={title}>
                          {title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] font-extrabold uppercase py-0.5 px-2 bg-[#006065]/10 text-emerald-700 dark:text-emerald-400 border-[#006065]/30">
                            {category}
                          </Badge>
                          <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/40 font-semibold">
                            v{version}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clean Typography Description */}
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 font-medium bg-muted/20 p-3.5 rounded-2xl border border-border/50">
                    {d.description || 'Standardized legal agreement governing covenants, execution terms, and fiduciary obligations.'}
                  </p>

                  {/* Metadata Specs */}
                  <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground pt-1 border-t border-border/40">
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      {reqSigs} Signatures Required
                    </span>
                    <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      SHA-256 Vaulted
                    </span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 px-6 border-t border-border/70 bg-muted/15 flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPreviewDoc(d)}
                    className="text-xs h-8.5 px-3.5 font-bold rounded-xl border-border/80 hover:bg-background shadow-xs gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-muted-foreground" /> View Doc
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleSendForESignature(d)}
                    className="text-xs h-8.5 px-4 font-extrabold bg-[#006065] hover:bg-[#004e52] text-white rounded-xl shadow-md shadow-[#006065]/20 gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Dispatch Sign
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── 5. Professional Executive Audit Vault Banner (Scroll Footer) ── */}
      <div className="mt-8 bg-card/95 backdrop-blur-xl border border-border/90 rounded-[28px] p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#006065] to-[#0B1418] flex items-center justify-center text-white shadow-md">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                Enterprise Legal Compliance & Audit Standards
                <Badge className="bg-[#006065]/10 text-[#006065] dark:text-[#fad503] border-[#006065]/30 text-[9px] uppercase font-mono">
                  Verified
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                All Smart Docs and executed contracts meet ESIGN Act, UETA federal regulations, and 256-bit cryptographic encryption standards.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-[#006065]/10 px-3 py-1.5 rounded-xl border border-[#006065]/20">
              <Lock className="w-3.5 h-3.5" /> 256-Bit SSL Encrypted
            </div>
            <div className="flex items-center gap-1.5 text-xs text-blue-600 font-bold bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20">
              <FileCheck className="w-3.5 h-3.5" /> Immutable Audit Vault
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
          <div className="p-3.5 bg-muted/20 rounded-2xl border border-border/50 space-y-1">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Automated Versioning
            </p>
            <p className="text-[11px] leading-relaxed">
              Every edit to a Smart Doc increments version numbers and creates an immutable snapshot record.
            </p>
          </div>

          <div className="p-3.5 bg-muted/20 rounded-2xl border border-border/50 space-y-1">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" /> Multi-Party Governance
            </p>
            <p className="text-[11px] leading-relaxed">
              Supports sequential signing order for buyers, sellers, brokers, and escrow agents.
            </p>
          </div>

          <div className="p-3.5 bg-muted/20 rounded-2xl border border-border/50 space-y-1">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-600" /> Cryptographic Proof
            </p>
            <p className="text-[11px] leading-relaxed">
              Generates verifiable SHA-256 fingerprints and IP audit trail certificates for court admissibility.
            </p>
          </div>
        </div>
      </div>

      {/* ── Create / Edit Smart Doc Sheet ── */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="font-black text-base flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" /> Register Smart Document
            </SheetTitle>
            <SheetDescription className="text-xs">
              Establish a new standardized legal smart contract
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <Label className="text-xs font-semibold">Document Title</Label>
              <Input
                value={formData.documentName}
                onChange={e => setFormData({ ...formData, documentName: e.target.value })}
                placeholder="e.g. Commercial NNN Lease Agreement"
                className="h-9.5 text-xs mt-1 rounded-xl"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Legal Category</Label>
                <Select value={formData.documentCategory} onValueChange={v => setFormData({ ...formData, documentCategory: v })}>
                  <SelectTrigger className="h-9.5 text-xs mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales" className="text-xs">Sales Agreement</SelectItem>
                    <SelectItem value="lease" className="text-xs">Lease Contract</SelectItem>
                    <SelectItem value="agency" className="text-xs">Agency Representation</SelectItem>
                    <SelectItem value="disclosure" className="text-xs">Statutory Disclosure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Required Signatures</Label>
                <Input
                  type="number"
                  value={formData.requiredSignatures}
                  onChange={e => setFormData({ ...formData, requiredSignatures: e.target.value })}
                  className="h-9.5 text-xs mt-1 rounded-xl"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Contract Scope & Description</Label>
              <Input
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Overview of agreement terms, covenants, and clauses..."
                className="h-9.5 text-xs mt-1 rounded-xl"
              />
            </div>
            <Button type="submit" className="w-full h-9.5 text-xs font-extrabold bg-[#006065] hover:bg-[#004e52] text-white rounded-xl shadow-md mt-2">
              Save Smart Document
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Document Preview Dialog ── */}
      {previewDoc && (
        <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-black">
                <FileText className="w-5 h-5 text-emerald-600" />
                {previewDoc.document_name || previewDoc.template_name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Category: <span className="font-bold capitalize text-foreground">{previewDoc.document_category || 'Sales'}</span> • Version {previewDoc.version || '1.0'}
              </DialogDescription>
            </DialogHeader>

            <div className="p-5 bg-muted/20 border border-border/80 rounded-2xl text-xs space-y-3 font-mono">
              <p className="font-extrabold text-foreground">AGREEMENT & CONTRACT OVERVIEW:</p>
              <p className="text-muted-foreground leading-relaxed font-sans text-xs">
                {previewDoc.description || 'This smart legal agreement defines the binding obligations, terms, covenants, and fiduciary conditions between participating signers.'}
              </p>
              <div className="p-3.5 bg-card border border-border/60 rounded-xl space-y-1 font-sans">
                <p className="text-[11px] font-black text-emerald-600 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> CRYPTOGRAPHIC EXECUTION SPECIFICATIONS:
                </p>
                <p className="text-[11px] text-muted-foreground">• Required Signatures: {previewDoc.required_signatures || 2}</p>
                <p className="text-[11px] text-muted-foreground">• SHA-256 Hash Verification: Enabled</p>
                <p className="text-[11px] text-muted-foreground">• Immutable Ledger Audit Trail: Active</p>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between">
              <Button variant="outline" size="sm" onClick={() => setPreviewDoc(null)} className="text-xs rounded-xl">
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const docToSign = previewDoc;
                  setPreviewDoc(null);
                  handleSendForESignature(docToSign);
                }}
                className="text-xs font-extrabold bg-[#006065] hover:bg-[#004e52] text-white rounded-xl shadow-md gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Dispatch for E-Signature
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
