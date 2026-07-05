import { useState, useEffect } from 'react';
import { Plus, Search, AlertCircle, CheckCircle, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { usePowerSync } from '@powersync/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'react-hot-toast';
import ViewToggle from '@/components/shared/ViewToggle';
import { useViewPreference } from '@/hooks/useViewPreference';
import PharmacyAPI from '@/api/PharmacyAPI';
import GenericKanban from '@/components/views/GenericKanban';

export default function Claims() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [claims, setClaims] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useViewPreference('pharmacy_claims', 'list');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    claimNumber: '',
    insuranceProvider: '',
    policyNumber: '',
    claimAmount: 0,
    approvalAmount: 0,
    claimStatus: 'Submitted',
    claimDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchClaims();
  }, [companyId]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const result = await powerSync.execute(
        'SELECT * FROM univ_pharmacy_insurance_claims WHERE company_id = ? ORDER BY claim_date DESC',
        [companyId]
      );
      setClaims(result.rows._array || []);
    } catch (e) {
      console.error('[Claims] Fetch error:', e);
      toast.error('Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  const filteredClaims = claims.filter(c =>
    c.claim_number?.includes(search) ||
    c.insurance_provider?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      'Submitted': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'Approved': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      'Denied': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'Pending': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  const resetForm = () => {
    setFormData({
      claimNumber: '',
      insuranceProvider: '',
      policyNumber: '',
      claimAmount: 0,
      approvalAmount: 0,
      claimStatus: 'Submitted',
      claimDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setEditingId(null);
  };

  const handleOpenForm = (claim = null) => {
    if (claim) {
      setFormData({
        claimNumber: claim.claim_number || '',
        insuranceProvider: claim.insurance_provider || '',
        policyNumber: claim.policy_number || '',
        claimAmount: parseFloat(claim.claim_amount || 0),
        approvalAmount: parseFloat(claim.approval_amount || 0),
        claimStatus: claim.claim_status || 'Submitted',
        claimDate: claim.claim_date ? new Date(claim.claim_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        notes: claim.notes || ''
      });
      setEditingId(claim.id);
    } else {
      resetForm();
    }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await PharmacyAPI.updateClaim(companyId, editingId, formData, user.id);
        toast.success('Claim updated successfully');
      } else {
        await PharmacyAPI.createClaim(companyId, formData, user.id);
        toast.success('Claim created successfully');
      }
      setShowForm(false);
      fetchClaims();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this claim?')) {
      try {
        await PharmacyAPI.deleteClaim(companyId, id, user.id);
        toast.success('Claim deleted');
        fetchClaims();
      } catch (e) {
        toast.error('Failed to delete claim');
      }
    }
  };

  const handleStatusChange = async (claimId, newStatus) => {
    try {
      await PharmacyAPI.updateClaimStatus(companyId, claimId, newStatus, user.id);
      fetchClaims(); // Refresh
      toast.success(`Moved to ${newStatus}`);
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Insurance Claims</h1>
            <p className="text-muted-foreground mt-2">Track and manage insurance reimbursement claims</p>
          </div>
          <div className="flex items-center gap-4">
            <ViewToggle view={view} onViewChange={setView} allowedViews={['grid', 'list', 'kanban']} />
            <Button
              onClick={() => handleOpenForm()}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Claim
            </Button>
          </div>
        </div>

        <Card className="p-2 px-4 mb-6 border border-border/50 bg-card/50 backdrop-blur-md flex items-center rounded-2xl shadow-sm">
          <Search className="w-5 h-5 text-muted-foreground mr-2" />
          <Input 
            placeholder="Search claims by number or provider..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="border-0 bg-transparent focus-visible:ring-0 px-0 shadow-none text-base flex-1"
          />
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 border border-border bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Claims</p>
                <p className="text-3xl font-bold text-foreground mt-2">{claims.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 border border-border bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{claims.filter(c => c.claim_status === 'Submitted' || c.claim_status === 'Pending').length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 border border-border bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved Amount</p>
                <p className="text-3xl font-bold text-green-600 mt-2">${claims.filter(c => c.claim_status === 'Approved').reduce((s, c) => s + (c.approval_amount || 0), 0).toFixed(2)}</p>
              </div>
            </div>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading claims...</div>
        ) : filteredClaims.length === 0 && search ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed rounded-2xl border-border">No claims found matching search.</div>
        ) : view === 'list' ? (
          <Card className="border border-border/50 bg-card/60 backdrop-blur-sm rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="p-4 font-semibold text-foreground">Claim #</th>
                    <th className="p-4 font-semibold text-foreground">Insurance</th>
                    <th className="p-4 font-semibold text-foreground">Amount</th>
                    <th className="p-4 font-semibold text-foreground">Approved</th>
                    <th className="p-4 font-semibold text-foreground">Status</th>
                    <th className="p-4 font-semibold text-foreground">Date</th>
                    <th className="p-4 font-semibold text-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredClaims.map(c => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-bold text-foreground">{c.claim_number}</td>
                      <td className="p-4 text-muted-foreground">{c.insurance_provider}</td>
                      <td className="p-4 font-medium">${parseFloat(c.claim_amount || 0).toFixed(2)}</td>
                      <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">${parseFloat(c.approval_amount || 0).toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(c.claim_status)}`}>
                          {c.claim_status}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">{new Date(c.claim_date).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenForm(c)} className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredClaims.map(c => (
              <Card key={c.id} className="p-6 border border-border/40 bg-card/60 backdrop-blur-sm hover:shadow-xl transition-all rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 flex gap-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${getStatusColor(c.claim_status)}`}>
                    {c.claim_status}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 mb-4 mt-2">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="pr-12">
                    <h3 className="font-bold text-foreground line-clamp-1">{c.insurance_provider}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{c.claim_number}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mt-4 p-3 bg-muted/30 rounded-2xl">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Claimed</p>
                    <p className="font-medium text-foreground">${parseFloat(c.claim_amount || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Approved</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">${parseFloat(c.approval_amount || 0).toFixed(2)}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">
                    {new Date(c.claim_date).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenForm(c)} className="h-7 w-7 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="h-7 w-7 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <GenericKanban 
            data={filteredClaims} 
            statusKey="claim_status" 
            titleKey="insurance_provider"
            boardKey="pharmacy_claims"
            defaultStages={['Submitted', 'Pending', 'Approved', 'Denied']}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>

      {/* Form Sheet */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent aria-describedby={undefined} className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Claim' : 'Create Claim'}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-medium text-foreground">Claim Number</label>
              <Input
                value={formData.claimNumber}
                onChange={(e) => setFormData({...formData, claimNumber: e.target.value})}
                required
                className="mt-1"
                placeholder="CLM-0001"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Insurance Provider</label>
              <Input
                value={formData.insuranceProvider}
                onChange={(e) => setFormData({...formData, insuranceProvider: e.target.value})}
                required
                className="mt-1"
                placeholder="e.g. BlueCross"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Policy Number</label>
              <Input
                value={formData.policyNumber}
                onChange={(e) => setFormData({...formData, policyNumber: e.target.value})}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Claim Amount ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.claimAmount}
                  onChange={(e) => setFormData({...formData, claimAmount: parseFloat(e.target.value) || 0})}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Approved Amount ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.approvalAmount}
                  onChange={(e) => setFormData({...formData, approvalAmount: parseFloat(e.target.value) || 0})}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Date</label>
              <Input
                type="date"
                value={formData.claimDate}
                onChange={(e) => setFormData({...formData, claimDate: e.target.value})}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 pt-6">
              <Button type="submit" className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                {editingId ? 'Save Changes' : 'Create Claim'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
