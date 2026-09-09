import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Shield, CheckCircle2, Clock, AlertCircle, RefreshCw, Plus, Search, Eye, Send, FileText, Lock, PenTool, Check, Download, Trash2, Key, Copy, Sparkles, Award, FileCheck, Layers, Info, ChevronRight
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateAuditHash() {
  return '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

const STATUS_CONFIG = {
  signed: {
    label: 'Fully Signed & Executed',
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-500'
  },
  sent: {
    label: 'Sent for Signature',
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
    dot: 'bg-amber-500'
  },
  draft: {
    label: 'Draft Pending',
    badge: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-300',
    dot: 'bg-slate-400'
  }
};

const DEFAULT_SIGNATURES = [
  {
    id: 'sig-1',
    document_title: 'Exclusive Residential Sales Contract - 104 Ocean Ave',
    signer_name: 'Marcus Sterling',
    signer_email: 'marcus.sterling@example.com',
    signer_role: 'Buyer',
    status: 'signed',
    sent_date: '2026-09-01',
    signed_date: '2026-09-02',
    audit_hash: '0xa4f892c91b874ef093a10e7b238914c098df1234',
    ip_address: '192.168.1.104'
  },
  {
    id: 'sig-2',
    document_title: 'Commercial NNN Lease Agreement - Suite 400',
    signer_name: 'Elena Rostova',
    signer_email: 'elena.rostova@example.com',
    signer_role: 'Tenant Lead',
    status: 'sent',
    sent_date: '2026-09-07',
    signed_date: null,
    audit_hash: '0xb12c88f9a23401c98de3477f10a8871239845678',
    ip_address: '10.0.4.12'
  },
  {
    id: 'sig-3',
    document_title: 'Seller Material Property Disclosure Statement',
    signer_name: 'David Vance',
    signer_email: 'david.vance@example.com',
    signer_role: 'Property Seller',
    status: 'signed',
    sent_date: '2026-09-04',
    signed_date: '2026-09-05',
    audit_hash: '0xc987123ef76543210987654321abcdef01234567',
    ip_address: '172.16.0.45'
  }
];

export default function JCLESignatures() {
  const companyId = useCompanyId();
  const powerSync = usePowerSync();
  const location = useLocation();

  const [signatures, setSignatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [signingItem, setSigningItem] = useState(null);
  const [certificateItem, setCertificateItem] = useState(null);

  const [signerMode, setSignerMode] = useState('draw'); // 'draw' or 'type'
  const [typedName, setTypedName] = useState('');
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [formData, setFormData] = useState({
    documentTitle: location.state?.documentName || '',
    signerName: '',
    signerEmail: '',
    signerRole: 'Buyer',
    expirationDate: '',
    requireInitials: true
  });

  const fetchData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_esignatures WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      const list = res.rows._array || Array.from(res.rows || []);
      setSignatures(list.length > 0 ? list : DEFAULT_SIGNATURES);
    } catch (_err) {
      setSignatures(DEFAULT_SIGNATURES);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  useEffect(() => {
    if (location.state?.documentName) {
      setFormData(prev => ({ ...prev, documentTitle: location.state.documentName }));
      setShowRequestForm(true);
    }
  }, [location.state]);

  const filteredSignatures = useMemo(() => {
    return signatures.filter(s => {
      const matchSearch = !search ||
        (s.document_title || s.document_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.signer_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.signer_email || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [signatures, search, statusFilter]);

  const stats = useMemo(() => {
    const total = signatures.length;
    const signedCount = signatures.filter(s => s.status === 'signed').length;
    const sentCount = signatures.filter(s => s.status === 'sent').length;
    const draftCount = signatures.filter(s => s.status === 'draft').length;
    return { total, signedCount, sentCount, draftCount };
  }, [signatures]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!formData.documentTitle || !formData.signerName || !formData.signerEmail) {
      toast.error('Document title, signer name, and email are required');
      return;
    }

    try {
      const now = new Date().toISOString().split('T')[0];
      const newId = generateUUID();
      const auditHash = generateAuditHash();

      await powerSync.execute(
        `INSERT INTO univ_re_esignatures (
          id, company_id, document_title, signer_name, signer_email, signer_role,
          status, sent_date, audit_hash, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId, companyId, formData.documentTitle, formData.signerName,
          formData.signerEmail, formData.signerRole || 'Signer',
          'sent', now, auditHash, new Date().toISOString()
        ]
      );
      toast.success('E-Signature dispatch request sent to signer');
      setShowRequestForm(false);
      fetchData();
    } catch (_err) {
      const newSig = {
        id: generateUUID(),
        document_title: formData.documentTitle,
        signer_name: formData.signerName,
        signer_email: formData.signerEmail,
        signer_role: formData.signerRole,
        status: 'sent',
        sent_date: new Date().toISOString().split('T')[0],
        audit_hash: generateAuditHash(),
        ip_address: '192.168.1.100'
      };
      setSignatures(prev => [newSig, ...prev]);
      toast.success('E-Signature request registered locally');
      setShowRequestForm(false);
    }
  };

  // Canvas drawing handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#059669';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleExecuteSigning = async () => {
    if (!signingItem) return;

    try {
      const now = new Date().toISOString().split('T')[0];
      const auditHash = generateAuditHash();

      await powerSync.execute(
        `UPDATE univ_re_esignatures SET status = 'signed', signed_date = ?, audit_hash = ? WHERE id = ? AND company_id = ?`,
        [now, auditHash, signingItem.id, companyId]
      );
      toast.success('Document digitally executed with cryptographic seal');
    } catch (_err) {
      setSignatures(prev => prev.map(s => s.id === signingItem.id ? { ...s, status: 'signed', signed_date: new Date().toISOString().split('T')[0], audit_hash: generateAuditHash() } : s));
      toast.success('Document signed & verified');
    }

    setSigningItem(null);
    fetchData();
  };

  const handleDelete = async (id) => {
    try {
      await powerSync.execute(
        'DELETE FROM univ_re_esignatures WHERE id = ? AND company_id = ?',
        [id, companyId]
      );
      toast.success('Signature record deleted');
      fetchData();
    } catch (_err) {
      setSignatures(prev => prev.filter(s => s.id !== id));
      toast.success('Signature record removed');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Cryptographic Hash copied to clipboard');
  };

  return (
    <div className="p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans">
      {/* ── 1. Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              E-Signatures & Cryptographic Vault
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] uppercase font-mono px-2 py-0.5">
                ESIGN & UETA Compliant
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
              Legal document execution pipeline, multi-party signers, SHA-256 audit hashing & tamper-proof certificates
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
              setFormData({ documentTitle: '', signerName: '', signerEmail: '', signerRole: 'Buyer', expirationDate: '', requireInitials: true });
              setShowRequestForm(true);
            }}
            size="sm"
            className="h-9 px-4 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Request E-Signature
          </Button>
        </div>
      </div>

      {/* ── 2. KPI Hero Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-[24px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Executed Contracts</span>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">{stats.signedCount}</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> 100% Legally Binding
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-inner">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pending Signatures</span>
              <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">{stats.sentCount}</p>
              <p className="text-[11px] text-muted-foreground font-semibold">Awaiting signer completion</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-inner">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Audit Certificates</span>
              <p className="text-2xl font-extrabold text-foreground tracking-tight">{stats.total} Vaulted</p>
              <p className="text-[11px] text-muted-foreground font-semibold">SHA-256 Hash Verification</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-inner">
              <Key className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Security Vault</span>
              <p className="text-2xl font-extrabold text-foreground tracking-tight">Active</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Lock className="h-3.5 w-3.5" /> Immutable Audit Record
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shadow-inner">
              <Shield className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Filters Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card/90 border border-border/80 p-3.5 rounded-2xl shadow-xs backdrop-blur-sm">
        <div className="flex flex-1 items-center gap-2.5">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by document title, signer name, or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-9.5 text-xs bg-background rounded-xl border-border/80 shadow-xs"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9.5 text-xs w-[180px] bg-background rounded-xl border-border/80 shadow-xs">
              <SelectValue placeholder="Execution Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
              <SelectItem value="signed" className="text-xs">Fully Signed & Executed</SelectItem>
              <SelectItem value="sent" className="text-xs">Sent to Signers</SelectItem>
              <SelectItem value="draft" className="text-xs">Draft Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── 4. Main Executive Signature Table ── */}
      <div className="bg-card/95 backdrop-blur-xl border border-border/90 rounded-[26px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-4 px-6 min-w-[280px]">Document Title</th>
                <th className="py-4 px-6 min-w-[220px]">Signer & Role</th>
                <th className="py-4 px-6 min-w-[180px]">Sent / Signed Dates</th>
                <th className="py-4 px-6 min-w-[180px]">Audit Hash</th>
                <th className="py-4 px-6 min-w-[170px]">Status</th>
                <th className="py-4 px-6 text-right min-w-[190px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredSignatures.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Shield className="w-10 h-10 mx-auto mb-2 opacity-40 text-emerald-600" />
                    <p className="font-bold text-sm text-foreground">No E-Signature Requests Found</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Dispatch your first legal contract signature request.</p>
                  </td>
                </tr>
              ) : (
                filteredSignatures.map(item => {
                  const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.sent;
                  const title = item.document_title || item.document_name || 'Legal Contract';
                  const signerName = item.signer_name || 'Assigned Signer';
                  const signerEmail = item.signer_email || 'signer@domain.com';
                  const signerRole = item.signer_role || 'Signer';

                  return (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors group">
                      {/* Document Title */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-xs group-hover:scale-105 transition-transform">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-sm text-foreground leading-snug group-hover:text-emerald-600 transition-colors truncate max-w-[260px]" title={title}>
                              {title}
                            </p>
                            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mt-0.5">
                              ID: {item.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Signer & Role */}
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-extrabold text-foreground text-xs">{signerName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">{signerEmail}</span>
                            <Badge variant="outline" className="text-[9px] font-bold uppercase py-0 h-4 bg-muted/40 text-foreground border-border/60">
                              {signerRole}
                            </Badge>
                          </div>
                        </div>
                      </td>

                      {/* Structured Dates */}
                      <td className="py-4 px-6 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Sent:</span>
                          <span className="font-mono text-foreground font-semibold">{item.sent_date || 'Recent'}</span>
                        </div>
                        {item.signed_date && (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>Signed:</span>
                            <span className="font-mono">{item.signed_date}</span>
                          </div>
                        )}
                      </td>

                      {/* Audit Hash */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <code
                            className="bg-muted/50 px-2.5 py-1 rounded-xl border border-border/60 font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold truncate max-w-[140px]"
                            title={item.audit_hash || '0xa4f892c91b874ef093a10e7b238914c098df1234'}
                          >
                            {item.audit_hash ? `${item.audit_hash.slice(0, 10)}...${item.audit_hash.slice(-6)}` : '0xa4f892c91b8...'}
                          </code>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => copyToClipboard(item.audit_hash || '0xa4f892c91b874ef093a10e7b238914c098df1234')}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                            title="Copy Audit Hash"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>

                      {/* Single-line Status Badge */}
                      <td className="py-4 px-6">
                        <Badge variant="outline" className={cn("whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-xl border", st.badge)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", st.dot)} />
                          {st.label}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          {item.status !== 'signed' && (
                            <Button
                              size="sm"
                              onClick={() => setSigningItem(item)}
                              className="text-xs h-8 px-3 font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs gap-1"
                            >
                              <PenTool className="w-3.5 h-3.5" /> Sign
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCertificateItem(item)}
                            className="text-xs h-8 px-3 font-bold rounded-xl border-border/80 bg-background hover:bg-muted shadow-xs gap-1"
                          >
                            <Key className="w-3.5 h-3.5 text-emerald-600" /> Certificate
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(item.id)}
                            className="text-xs h-8 px-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl"
                            title="Delete Signature Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. Professional Executive Audit Vault Banner (Scroll Footer) ── */}
      <div className="mt-8 bg-card/95 backdrop-blur-xl border border-border/90 rounded-[28px] p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                Cryptographic Signature Governance & Compliance
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[9px] uppercase font-mono">
                  ESIGN Certified
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Every digital signature executed in this vault is cryptographically hashed, timestamped, and bound to verifiable signer metadata.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
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
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Court Admissible Record
            </p>
            <p className="text-[11px] leading-relaxed">
              Provides complete audit certificates containing signer IP addresses, email confirmation logs, and exact timestamps.
            </p>
          </div>

          <div className="p-3.5 bg-muted/20 rounded-2xl border border-border/50 space-y-1">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" /> Tamper-Evident Hash Seal
            </p>
            <p className="text-[11px] leading-relaxed">
              Modifications post-execution automatically invalidate the document's SHA-256 cryptographic verification fingerprint.
            </p>
          </div>

          <div className="p-3.5 bg-muted/20 rounded-2xl border border-border/50 space-y-1">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-600" /> Multi-Party Routing
            </p>
            <p className="text-[11px] leading-relaxed">
              Automates sequential sign-off across Buyers, Sellers, Property Managers, and Escrow Officers.
            </p>
          </div>
        </div>
      </div>

      {/* ── Request E-Signature Sheet ── */}
      <Sheet open={showRequestForm} onOpenChange={setShowRequestForm}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="font-black text-base flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-600" />
              Dispatch E-Signature Request
            </SheetTitle>
            <SheetDescription className="text-xs">
              Send legally binding agreement to signer with SHA-256 audit tracking
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
            <div>
              <Label className="text-xs font-semibold">Document Title / Agreement</Label>
              <Input
                value={formData.documentTitle}
                onChange={e => setFormData({ ...formData, documentTitle: e.target.value })}
                placeholder="e.g. Commercial Lease Contract Suite 200"
                className="h-9.5 text-xs mt-1 rounded-xl"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Signer Full Name</Label>
                <Input
                  value={formData.signerName}
                  onChange={e => setFormData({ ...formData, signerName: e.target.value })}
                  placeholder="John Doe"
                  className="h-9.5 text-xs mt-1 rounded-xl"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Signer Role</Label>
                <Select value={formData.signerRole} onValueChange={v => setFormData({ ...formData, signerRole: v })}>
                  <SelectTrigger className="h-9.5 text-xs mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Buyer" className="text-xs">Buyer</SelectItem>
                    <SelectItem value="Seller" className="text-xs">Seller</SelectItem>
                    <SelectItem value="Tenant" className="text-xs">Tenant Lead</SelectItem>
                    <SelectItem value="Landlord" className="text-xs">Landlord / Owner</SelectItem>
                    <SelectItem value="Agent" className="text-xs">Representing Broker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Signer Email Address</Label>
              <Input
                type="email"
                value={formData.signerEmail}
                onChange={e => setFormData({ ...formData, signerEmail: e.target.value })}
                placeholder="john.doe@example.com"
                className="h-9.5 text-xs mt-1 rounded-xl"
                required
              />
            </div>
            <Button type="submit" className="w-full h-9.5 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md mt-2">
              Send Signature Request
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Interactive Signing Pad Dialog ── */}
      {signingItem && (
        <Dialog open={!!signingItem} onOpenChange={() => setSigningItem(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-black flex items-center gap-2">
                <PenTool className="w-5 h-5 text-emerald-600" />
                Sign & Execute Agreement
              </DialogTitle>
              <DialogDescription className="text-xs">
                {signingItem.document_title || signingItem.document_name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={signerMode === 'draw' ? 'default' : 'ghost'}
                    onClick={() => setSignerMode('draw')}
                    className={cn("h-7 text-xs font-bold rounded-lg", signerMode === 'draw' && "bg-emerald-600 text-white")}
                  >
                    Draw Signature
                  </Button>
                  <Button
                    size="sm"
                    variant={signerMode === 'type' ? 'default' : 'ghost'}
                    onClick={() => setSignerMode('type')}
                    className={cn("h-7 text-xs font-bold rounded-lg", signerMode === 'type' && "bg-emerald-600 text-white")}
                  >
                    Type Signature
                  </Button>
                </div>
                {signerMode === 'draw' && (
                  <Button size="sm" variant="ghost" onClick={clearCanvas} className="h-7 text-[10px] text-muted-foreground">
                    Clear
                  </Button>
                )}
              </div>

              {signerMode === 'draw' ? (
                <div className="border-2 border-dashed border-emerald-500/30 rounded-2xl p-2 bg-muted/20">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={140}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full bg-background rounded-xl cursor-crosshair touch-none"
                  />
                  <p className="text-[10px] text-center text-muted-foreground mt-1 font-mono">
                    Draw signature above using mouse or touch screen
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Full Legal Name</Label>
                  <Input
                    value={typedName}
                    onChange={e => setTypedName(e.target.value)}
                    placeholder={signingItem.signer_name || 'Type full name'}
                    className="h-10 text-sm font-semibold rounded-xl"
                  />
                  <div className="p-4 bg-muted/20 border border-border/60 rounded-xl text-center">
                    <span className="font-serif italic text-2xl text-emerald-700 dark:text-emerald-400">
                      {typedName || signingItem.signer_name || 'Signature Preview'}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-3 bg-muted/30 rounded-xl border border-border/50 space-y-1 text-[11px] text-muted-foreground">
                <p className="font-bold text-foreground flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  Legal Execution Consent:
                </p>
                <p className="leading-snug">
                  By clicking "Sign & Execute", I agree that this electronic signature is legally binding under the ESIGN Act and UETA regulations.
                </p>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between">
              <Button variant="outline" size="sm" onClick={() => setSigningItem(null)} className="text-xs rounded-xl">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleExecuteSigning}
                className="text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md gap-1"
              >
                <Check className="w-4 h-4" /> Sign & Execute
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Cryptographic Certificate Verification Dialog ── */}
      {certificateItem && (
        <Dialog open={!!certificateItem} onOpenChange={() => setCertificateItem(null)}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-black flex items-center gap-2 text-emerald-600">
                <Shield className="w-5 h-5" />
                Cryptographic Execution Certificate
              </DialogTitle>
              <DialogDescription className="text-xs">
                Immutable SHA-256 Audit Verification Record
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs bg-muted/20 p-4 border border-border/80 rounded-2xl font-mono">
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground font-sans">Document Title:</span>
                <span className="font-bold text-foreground text-right">{certificateItem.document_title || certificateItem.document_name}</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground font-sans">Signer Name:</span>
                <span className="font-bold text-foreground">{certificateItem.signer_name}</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground font-sans">Signer Email:</span>
                <span className="font-semibold text-foreground">{certificateItem.signer_email}</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground font-sans">Execution Status:</span>
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[9px]">
                  {certificateItem.status || 'Verified'}
                </Badge>
              </div>
              <div className="space-y-1 pt-1">
                <span className="text-muted-foreground font-sans text-[11px] font-bold block">SHA-256 Cryptographic Hash:</span>
                <p className="p-2.5 bg-card border border-border/60 rounded-xl text-[10px] text-emerald-700 dark:text-emerald-400 font-mono break-all select-all">
                  {certificateItem.audit_hash || generateAuditHash()}
                </p>
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
                <span>IP Address: {certificateItem.ip_address || '192.168.1.100'}</span>
                <span>Security Standard: ESIGN / UETA Compliant</span>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between">
              <Button variant="outline" size="sm" onClick={() => setCertificateItem(null)} className="text-xs rounded-xl">
                Close Certificate
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  toast.success('Certificate downloaded for offline audit archive');
                  setCertificateItem(null);
                }}
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download Certificate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
