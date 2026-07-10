import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileSignature, Plus, Send, CheckCircle2, Clock, AlertCircle, Search, Download, Eye, Trash2 } from 'lucide-react';
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

export default function ESignatures() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [signatures, setSignatures] = useState([]);
  const [filteredSignatures, setFilteredSignatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [view, setView] = useViewPreference('re_esignatures', 'grid');
const [formData, setFormData] = useState({
    documentId: '',
    signerName: '',
    signerEmail: '',
    documentName: '',
    signingOrder: 1,
    expirationDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    requireInitials: false,
    requireTimestamp: true,
  });

  // Fetch signatures
  useEffect(() => {
    const fetchSignatures = async () => {
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_re_e_signatures WHERE company_id = ? ORDER BY created_at DESC',
          [companyId]
        );
        const data = res.rows._array || Array.from(res.rows);
        setSignatures(data);
      } catch (e) {
        console.error('[ESignatures] Fetch failed:', e);
        toast.error('Failed to load e-signatures');
      }
      setIsLoading(false);
    };

    if (companyId) fetchSignatures();
  }, [companyId]);

  // Filter signatures
  useEffect(() => {
    let filtered = signatures;
    if (search) {
      filtered = filtered.filter(s =>
        s.signer_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.document_id?.toLowerCase().includes(search.toLowerCase()) ||
        s.document_name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.signature_status === statusFilter);
    }
    setFilteredSignatures(filtered);
  }, [signatures, search, statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await RealEstateAPI.updateESignature(companyId, editingId, formData, user.id);
        toast.success('E-signature updated successfully');
      } else {
        await RealEstateAPI.createESignature(companyId, formData, user.id);
        toast.success('Signature request sent successfully');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        documentId: '',
        signerName: '',
        signerEmail: '',
        documentName: '',
        signingOrder: 1,
        expirationDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        requireInitials: false,
        requireTimestamp: true,
      });

      const res = await powerSync.execute(
        'SELECT * FROM univ_re_e_signatures WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setSignatures(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('[ESignatures] Submit failed:', e);
      toast.error('Failed to save e-signature');
    }
  };

  const handleEdit = (sig) => {
    setFormData({
      documentId: sig.document_id || '',
      signerName: sig.signer_name || '',
      signerEmail: sig.signer_email || '',
      documentName: sig.document_name || '',
      signingOrder: sig.signing_order || 1,
      expirationDate: new Date(sig.expiration_date).toISOString().split('T')[0],
      requireInitials: sig.require_initials !== false,
      requireTimestamp: sig.require_timestamp !== false,
    });
    setEditingId(sig.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this signature request?')) return;
    try {
      await RealEstateAPI.deleteESignature(companyId, id, user.id);
      toast.success('Signature request deleted successfully');
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_e_signatures WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setSignatures(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('[ESignatures] Delete failed:', e);
      toast.error('Failed to delete signature request');
    }
  };

  // KPI calculations
  const totalSignatures = signatures.length;
  const completedSignatures = signatures.filter(s => s.signature_status === 'completed').length;
  const pendingSignatures = signatures.filter(s => s.signature_status === 'pending').length;
  const expiredSignatures = signatures.filter(s => s.signature_status === 'expired').length;

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'expired': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <FileSignature className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">E-Signatures</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage digital signatures on documents</p>
        </div>
          <div className="flex items-center gap-4">
            <ViewToggle view={view} onViewChange={setView} allowedViews={['grid', 'list']} />
            <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({
          documentId: '',
          signerName: '',
          signerEmail: '',
          documentName: '',
          signingOrder: 1,
          expirationDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
          requireInitials: false,
          requireTimestamp: true,
        }); }} className="gap-2">
          <Plus className="w-4 h-4" /> Request Signature
        </Button>
          </div>
        </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-50/60 dark:from-emerald-950/30 dark:to-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl shadow-sm hover:shadow-lg hover:border-emerald-400/60 dark:hover:border-emerald-600/60 transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1">
          <CardHeader className="relative p-4 border-b border-emerald-200/50 dark:border-emerald-800/40 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <FileSignature className="w-4 h-4" />
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{totalSignatures}</div>
            <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70 mt-1 font-medium">All signatures</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-50/60 dark:from-emerald-950/30 dark:to-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl shadow-sm hover:shadow-lg hover:border-emerald-400/60 dark:hover:border-emerald-600/60 transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1">
          <CardHeader className="relative p-4 border-b border-emerald-200/50 dark:border-emerald-800/40 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{completedSignatures}</div>
            <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70 mt-1 font-medium">Signed documents</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-50/60 dark:from-amber-950/30 dark:to-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-xl shadow-sm hover:shadow-lg hover:border-amber-400/60 dark:hover:border-amber-600/60 transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1">
          <CardHeader className="relative p-4 border-b border-amber-200/50 dark:border-amber-800/40 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">{pendingSignatures}</div>
            <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mt-1 font-medium">Awaiting signature</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-50/60 dark:from-red-950/30 dark:to-red-950/20 border border-red-200/60 dark:border-red-800/40 rounded-xl shadow-sm hover:shadow-lg hover:border-red-400/60 dark:hover:border-red-600/60 transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1">
          <CardHeader className="relative p-4 border-b border-red-200/50 dark:border-red-800/40 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Expired
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-3xl font-bold text-red-900 dark:text-red-100">{expiredSignatures}</div>
            <p className="text-xs text-red-700/70 dark:text-red-400/70 mt-1 font-medium">Signature requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by signer name, document..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Signatures Table */}
      <Card className="bg-white dark:bg-background border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="text-left py-3 px-4 font-medium">Document</th>
                <th className="text-left py-3 px-4 font-medium">Signer</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Expires</th>
                <th className="text-left py-3 px-4 font-medium">Signed On</th>
                <th className="text-center py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSignatures.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-muted-foreground">
                    No e-signatures found. Create your first signature request!
                  </td>
                </tr>
              ) : (
                filteredSignatures.map(sig => {
                  const isExpired = new Date(sig.expiration_date) < new Date();
                  const statusDisplay = isExpired ? 'expired' : sig.signature_status;
                  return (
                    <tr key={sig.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{sig.document_name}</p>
                          <p className="text-xs text-muted-foreground">{sig.document_id?.substring(0, 12)}...</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{sig.signer_name}</p>
                          <p className="text-xs text-muted-foreground">{sig.signer_email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={
                          statusDisplay === 'completed' ? 'bg-green-100 text-green-800' :
                          statusDisplay === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {statusDisplay}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">{new Date(sig.expiration_date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {sig.signature_date ? new Date(sig.signature_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(sig)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(sig.id)} className="text-destructive">
                            <Trash2 className="w-4 h-4" />
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
      </Card>

      {/* Signature Request Form Modal */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Signature Request' : 'Request E-Signature'}</SheetTitle>
            <SheetDescription>Send a digital signature request to a signer</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-medium">Document Name</label>
              <Input
                value={formData.documentName}
                onChange={(e) => setFormData({ ...formData, documentName: e.target.value })}
                placeholder="e.g., Purchase Agreement"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Signer Name</label>
              <Input
                value={formData.signerName}
                onChange={(e) => setFormData({ ...formData, signerName: e.target.value })}
                placeholder="Full name"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Signer Email</label>
              <Input
                type="email"
                value={formData.signerEmail}
                onChange={(e) => setFormData({ ...formData, signerEmail: e.target.value })}
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Signing Order</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.signingOrder}
                  onChange={(e) => setFormData({ ...formData, signingOrder: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Expires</label>
                <Input
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2 p-3 bg-primary/5 rounded">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requireInitials"
                  checked={formData.requireInitials}
                  onChange={(e) => setFormData({ ...formData, requireInitials: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="requireInitials" className="text-sm font-medium cursor-pointer">
                  Require initials
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requireTimestamp"
                  checked={formData.requireTimestamp}
                  onChange={(e) => setFormData({ ...formData, requireTimestamp: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="requireTimestamp" className="text-sm font-medium cursor-pointer">
                  Require timestamp
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingId ? 'Update' : 'Send'} Request
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
