import { useState } from 'react';
import { Shield, Search, Plus, Trash2, FileText, CheckCircle, MoreVertical, Eye, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function Policies() {
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('policy');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const policies = dbRecords.map(r => ({
    id: r.id,
    status: r.status || 'Active',
    ...r.data
  }));

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [viewDetailsId, setViewDetailsId] = useState(null);

  const [formData, setFormData] = useState({
    holderName: '',
    policyType: 'Life',
    premium: '',
    sumInsured: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 31536000000).toISOString().split('T')[0] // 1 year
  });
  const [viewRecord, setViewRecord] = useState(null);

  const handleCreatePolicy = () => {
    if (!formData.holderName.trim()) return toast.error("Please enter a policy holder name");
    
    if (editTargetId) {
      mutateRecord.mutate({
        id: editTargetId,
        recordType: 'policy',
        payload: { ...formData },
        status: formData.status || 'Active',
        searchText: `${formData.holderName} ${formData.policyType}`
      }, {
        onSuccess: () => {
          toast.success('Policy updated successfully!');
          setShowModal(false);
          setFormData({
            holderName: '', policyType: 'Life', premium: '', sumInsured: '', 
            startDate: new Date().toISOString().split('T')[0], 
            endDate: new Date(Date.now() + 31536000000).toISOString().split('T')[0]
          });
        },
        onError: (err) => toast.error('Failed to update policy: ' + err.message)
      });
    } else {
      const policyNumber = `POL-${Math.floor(10000 + Math.random() * 90000)}`;

      mutateRecord.mutate({
        recordType: 'policy',
        payload: { ...formData, policyNumber },
        status: 'Active',
        searchText: `${formData.holderName} ${formData.policyType} ${policyNumber}`
      }, {
        onSuccess: () => {
          toast.success('Policy created successfully!');
          setShowModal(false);
          setFormData({
            holderName: '', policyType: 'Life', premium: '', sumInsured: '', 
            startDate: new Date().toISOString().split('T')[0], 
            endDate: new Date(Date.now() + 31536000000).toISOString().split('T')[0]
          });
        },
        onError: (err) => toast.error('Failed to create policy: ' + err.message)
      });
    }
  };

  const handleEdit = (policy) => {
    setFormData({
      holderName: policy.holderName || '',
      policyType: policy.policyType || 'Life',
      premium: policy.premium || '',
      sumInsured: policy.sumInsured || '',
      startDate: policy.startDate || new Date().toISOString().split('T')[0],
      endDate: policy.endDate || new Date(Date.now() + 31536000000).toISOString().split('T')[0],
      status: policy.status
    });
    setShowModal(true);
  };

  const openNewModal = () => {
    setFormData({
      holderName: '', policyType: 'Life', premium: '', sumInsured: '', 
      startDate: new Date().toISOString().split('T')[0], 
      endDate: new Date(Date.now() + 31536000000).toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleUpdateStatus = (policy, newStatus) => {
    const payload = { ...policy };
    delete payload.id;
    delete payload.status;
    
    mutateRecord.mutate({
      id: policy.id,
      recordType: 'policy',
      payload,
      status: newStatus,
      searchText: `${policy.holderName} ${policy.policyNumber}`
    }, {
      onSuccess: () => toast.success(`Status updated to ${newStatus}`)
    });
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'policy' }, {
      onSuccess: () => {
        toast.success('Policy removed!');
        setDeleteTargetId(null);
      },
      onError: (err) => {
        toast.error('Failed to remove: ' + err.message);
        setDeleteTargetId(null);
      }
    });
  };

  const filtered = policies.filter(p => 
    p.holderName?.toLowerCase().includes(search.toLowerCase()) || 
    p.policyNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPremium = policies.reduce((sum, p) => sum + (Number(p.premium) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">Policies</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage insurance policies and coverage</p>
        </div>
        <Button onClick={openNewModal} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-4 h-4" /> New Policy
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card-premium bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground">{policies.length}</p>
            <p className="text-xs text-muted-foreground">Total Policies</p>
          </div>
        </div>
        <div className="stat-card-premium bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground">{policies.filter(p => p.status === 'Active').length}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
        </div>
        <div className="stat-card-premium bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground">{policies.filter(p => p.status === 'Lapsed').length}</p>
            <p className="text-xs text-muted-foreground">Lapsed</p>
          </div>
        </div>
        <div className="stat-card-premium bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <span className="font-bold text-lg">$</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground">${totalPremium.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Premium Value</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search policy number or holder..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
        </div>
        <div className="overflow-x-auto">
          {isDbLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading policies...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-600" />
              <p className="font-semibold text-lg text-card-foreground">No policies found</p>
              <p className="text-xs mt-1">Create a new policy to get started.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-card border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Policy No.</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Holder & Type</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Coverage Dates</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Premium</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(policy => (
                  <tr key={policy.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600">{policy.policyNumber}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-card-foreground">{policy.holderName}</p>
                      <p className="text-xs text-muted-foreground">{policy.policyType} Insurance</p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-medium">
                      {policy.startDate} to {policy.endDate}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-bold text-card-foreground">${Number(policy.premium).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Sum: ${Number(policy.sumInsured).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <select
                        value={policy.status}
                        onChange={e => handleUpdateStatus(policy, e.target.value)}
                        className={`rounded-md border border-input px-2 py-1 text-xs font-bold ${
                          policy.status === 'Active' ? 'bg-green-100 text-green-700' : 
                          policy.status === 'Lapsed' ? 'bg-red-100 text-red-700' : 
                          policy.status === 'Cancelled' ? 'bg-muted text-muted-foreground' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Lapsed">Lapsed</option>
                        <option value="Cancelled">Cancelled</option>
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
                          <DropdownMenuItem onClick={() => setViewRecord(policy)}>View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(policy)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTargetId(policy.id)} className="text-red-600">Delete</DropdownMenuItem>
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
            <h2 className="text-lg font-bold text-card-foreground">{editTargetId ? 'Edit Policy' : 'New Policy'}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Holder Name</label>
                <Input value={formData.holderName} onChange={e => setFormData({...formData, holderName: e.target.value})} placeholder="Jane Doe" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Policy Type</label>
                <select value={formData.policyType} onChange={e => setFormData({...formData, policyType: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                  <option>Life</option>
                  <option>Health</option>
                  <option>Auto</option>
                  <option>Property</option>
                  <option>Business</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Premium ($)</label>
                  <Input type="number" value={formData.premium} onChange={e => setFormData({...formData, premium: e.target.value})} placeholder="500" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Sum Insured ($)</label>
                  <Input type="number" value={formData.sumInsured} onChange={e => setFormData({...formData, sumInsured: e.target.value})} placeholder="50000" className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Start Date</label>
                  <Input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">End Date</label>
                  <Input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="mt-1" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditTargetId(null); }}>Cancel</Button>
              <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleCreatePolicy}>{editTargetId ? 'Save Changes' : 'Create Policy'}</Button>
            </div>
          </div>
        </div>
      )}

      
      <Sheet open={viewDetailsId !== null} onOpenChange={(open) => !open && setViewDetailsId(null)}>
        <SheetContent className="bg-card text-card-foreground">
          <SheetHeader>
            <SheetTitle>Record Details</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {viewDetailsId && (() => {
              const record = policies.find(r => r.id === viewDetailsId);
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
        title="Delete Policy"
        message="Are you sure you want to completely remove this policy? This cannot be undone."
      />

      <Sheet open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Policy Details</SheetTitle>
            <SheetDescription>View complete information for this policy.</SheetDescription>
          </SheetHeader>
          {viewRecord && (
            <div className="mt-6 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Policy Number</h4>
                <p className="text-base font-semibold">{viewRecord.policyNumber}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Holder Name</h4>
                <p className="text-base font-semibold">{viewRecord.holderName}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Policy Type</h4>
                <p className="text-base">{viewRecord.policyType}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                <p className="text-base">{viewRecord.status}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Premium</h4>
                <p className="text-base">${Number(viewRecord.premium).toLocaleString()}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Sum Insured</h4>
                <p className="text-base">${Number(viewRecord.sumInsured).toLocaleString()}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Coverage Period</h4>
                <p className="text-base">{viewRecord.startDate} to {viewRecord.endDate}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
