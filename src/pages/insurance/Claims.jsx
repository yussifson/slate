import { useState } from 'react';
import { Search, Plus, Trash2, FileWarning, CheckCircle, Clock, MoreVertical, Edit, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function Claims() {
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('claim');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const claims = dbRecords.map(r => ({
    id: r.id,
    status: r.status || 'Submitted',
    ...r.data
  }));

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [viewDetailsId, setViewDetailsId] = useState(null);
  const [editTargetId, setEditTargetId] = useState(null);

  const [formData, setFormData] = useState({
    policyNumber: '',
    claimantName: '',
    claimType: 'Auto',
    incidentDate: new Date().toISOString().split('T')[0],
    claimAmount: '',
    description: ''
  });

  const handleCreateClaim = () => {
    if (!formData.claimantName.trim() || !formData.policyNumber.trim()) {
      return toast.error("Please enter claimant and policy details");
    }
    
    const isEdit = !!editTargetId;
    const finalClaimNumber = isEdit ? claims.find(c => c.id === editTargetId)?.claimNumber : `CLM-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalStatus = isEdit ? claims.find(c => c.id === editTargetId)?.status : 'Submitted';

    mutateRecord.mutate({
      id: editTargetId,
      id: editTargetId,
      recordType: 'claim',
      payload: { ...formData, claimNumber: finalClaimNumber },
      status: finalStatus,
      searchText: `${formData.claimantName} ${formData.policyNumber} ${finalClaimNumber}`
    }, {
      onSuccess: () => {
        toast.success(isEdit ? 'Claim updated successfully!' : 'Claim submitted successfully!');
        setShowModal(false);
        setEditTargetId(null);
        setEditTargetId(null);
        setFormData({
          policyNumber: '', claimantName: '', claimType: 'Auto', 
          incidentDate: new Date().toISOString().split('T')[0], claimAmount: '', description: ''
        });
      },
      onError: (err) => toast.error(`Failed to ${isEdit ? 'update' : 'submit'} claim: ` + err.message)
    });
  };

  const openNewModal = () => {
    setEditTargetId(null);
    setFormData({
      policyNumber: '', claimantName: '', claimType: 'Auto', 
      incidentDate: new Date().toISOString().split('T')[0], claimAmount: '', description: ''
    });
    setShowModal(true);
  };

  const handleUpdateStatus = (claim, newStatus) => {
    const payload = { ...claim };
    delete payload.id;
    delete payload.status;
    
    mutateRecord.mutate({
      id: claim.id,
      recordType: 'claim',
      payload,
      status: newStatus,
      searchText: `${claim.claimantName} ${claim.policyNumber} ${claim.claimNumber}`
    }, {
      onSuccess: () => toast.success(`Claim status updated to ${newStatus}`)
    });
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'claim' }, {
      onSuccess: () => {
        toast.success('Claim removed!');
        setDeleteTargetId(null);
      },
      onError: (err) => {
        toast.error('Failed to remove: ' + err.message);
        setDeleteTargetId(null);
      }
    });
  };

  const filtered = claims.filter(c => 
    c.claimantName?.toLowerCase().includes(search.toLowerCase()) || 
    c.claimNumber?.toLowerCase().includes(search.toLowerCase()) ||
    c.policyNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = claims.reduce((sum, c) => sum + (Number(c.claimAmount) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">Claims Processing</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and evaluate policyholder claims</p>
        </div>
        <Button onClick={openNewModal} className="gap-2 bg-red-600 hover:bg-red-700 text-white">
          <Plus className="w-4 h-4" /> File New Claim
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground"><FileWarning className="w-4 h-4"/> Total Claims</div>
          <p className="text-2xl font-bold text-card-foreground">{claims.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-amber-600"><Clock className="w-4 h-4"/> Under Review</div>
          <p className="text-2xl font-bold text-card-foreground">{claims.filter(c => c.status === 'Under Review').length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-green-600"><CheckCircle className="w-4 h-4"/> Approved</div>
          <p className="text-2xl font-bold text-card-foreground">{claims.filter(c => c.status === 'Approved' || c.status === 'Paid').length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-blue-600"><span className="font-bold text-sm">$</span> Total Claimed</div>
          <p className="text-2xl font-bold text-card-foreground">${totalAmount.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search claim number, policy or claimant..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
        </div>
        <div className="overflow-x-auto">
          {isDbLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading claims...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <FileWarning className="w-12 h-12 mx-auto mb-3 opacity-30 text-red-600" />
              <p className="font-semibold text-lg text-card-foreground">No claims found</p>
              <p className="text-xs mt-1">File a new claim to see it here.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-card border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Claim Info</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Claimant</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Description</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Amount</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(claim => (
                  <tr key={claim.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-mono font-bold text-red-600">{claim.claimNumber}</p>
                      <Link to="/insurance/policies" className="text-primary hover:underline text-xs mt-0.5 font-medium block">{claim.policyNumber}</Link>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{claim.incidentDate}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-card-foreground">{claim.claimantName}</p>
                      <p className="text-xs text-muted-foreground">{claim.claimType} Claim</p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-medium max-w-xs truncate">
                      {claim.description}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-bold text-card-foreground">${Number(claim.claimAmount).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <select
                        value={claim.status}
                        onChange={e => handleUpdateStatus(claim, e.target.value)}
                        className={`rounded-md border border-input px-2 py-1 text-xs font-bold ${
                          claim.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                          claim.status === 'Approved' ? 'bg-blue-100 text-blue-700' : 
                          claim.status === 'Rejected' ? 'bg-red-100 text-red-700' : 
                          claim.status === 'Under Review' ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <option value="Submitted">Submitted</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewDetailsId(claim.id)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setFormData({
                              policyNumber: claim.policyNumber || '',
                              claimantName: claim.claimantName || '',
                              claimType: claim.claimType || 'Auto',
                              incidentDate: claim.incidentDate || '',
                              claimAmount: claim.claimAmount || '',
                              description: claim.description || ''
                            });
                            setEditTargetId(claim.id);
                            setShowModal(true);
                          }}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTargetId(claim.id)} className="text-red-600 focus:text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-border">
            <h2 className="text-lg font-bold text-card-foreground">{editTargetId ? 'Edit Record' : '{editTargetId ? 'Edit Claim' : 'File New Claim'}'}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Policy Number</label>
                <Input value={formData.policyNumber} onChange={e => setFormData({...formData, policyNumber: e.target.value})} placeholder="POL-12345" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Claimant Name</label>
                <Input value={formData.claimantName} onChange={e => setFormData({...formData, claimantName: e.target.value})} placeholder="Jane Doe" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Claim Type</label>
                  <select value={formData.claimType} onChange={e => setFormData({...formData, claimType: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                    <option>Auto</option>
                    <option>Health</option>
                    <option>Property</option>
                    <option>Life</option>
                    <option>Business</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Incident Date</label>
                  <Input type="date" value={formData.incidentDate} onChange={e => setFormData({...formData, incidentDate: e.target.value})} className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Claim Amount ($)</label>
                <Input type="number" value={formData.claimAmount} onChange={e => setFormData({...formData, claimAmount: e.target.value})} placeholder="1500" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Description / Details</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Describe the incident..." 
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-20 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditTargetId(null); }}>Cancel</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleCreateClaim}>{editTargetId ? 'Save Changes' : '{editTargetId ? 'Save Changes' : 'Submit Claim'}'}</Button>
            </div>
          </div>
        </div>
      )}

      <Sheet open={viewDetailsId !== null} onOpenChange={(open) => !open && setViewDetailsId(null)}>
        <SheetContent className="bg-card text-card-foreground overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Claim Details</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {viewDetailsId && (() => {
              const record = claims.find(r => r.id === viewDetailsId);
              if (!record) return null;
              return Object.entries(record).map(([key, value]) => {
                if (key === 'id') return null;
                return (
                  <div key={key}>
                    <label className="text-xs font-bold text-muted-foreground uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                    <p className="font-medium">
                      {key === 'policyNumber' ? (
                        <Link to="/insurance/policies" className="text-primary hover:underline">{String(value)}</Link>
                      ) : (
                        String(value)
                      )}
                    </p>
                  </div>
                );
              });
            })()}
          </div>
        </SheetContent>
      </Sheet>

      
      <Sheet open={viewDetailsId !== null} onOpenChange={(open) => !open && setViewDetailsId(null)}>
        <SheetContent className="bg-card text-card-foreground">
          <SheetHeader>
            <SheetTitle>Record Details</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {viewDetailsId && (() => {
              const record = claims.find(r => r.id === viewDetailsId);
              if (!record) return null;
              return Object.entries(record).map(([key, value]) => {
                if (key === 'id') return null;
                return (
                  <div key={key}>
                    <label className="text-xs font-bold text-muted-foreground uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                    <p className="font-medium">{String(value)}</p>
                  </div>
                );
              });
            })()}
          </div>
        </SheetContent>
      </Sheet>
    
      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Delete Claim"
        message="Are you sure you want to completely remove this claim record? This cannot be undone."
      />


    </div>
  );
}
