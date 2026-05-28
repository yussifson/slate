import { useState } from 'react';
import { DollarSign, Search, Plus, Trash2, Clock, CheckCircle, AlertCircle, MoreVertical, Eye, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { usePayment } from "@/hooks/integrations/usePayment";
import { useCompanyId } from "@/hooks/useCompanyId";
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function Premiums() {
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('premium_payment');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();
  const companyId = useCompanyId();
  const { processPayment, isPaymentLoading } = usePayment();

  const premiums = dbRecords.map(r => ({
    id: r.id,
    status: r.status || 'Pending',
    ...r.data
  }));

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [viewDetailsId, setViewDetailsId] = useState(null);

  const [formData, setFormData] = useState({
    policyNumber: '',
    policyHolder: '',
    amount: '',
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer'
  });
  const [viewRecord, setViewRecord] = useState(null);

  const handleCreatePremium = async () => {
    if (!formData.policyHolder.trim() || !formData.policyNumber.trim()) {
      return toast.error("Please enter policy holder and number");
    }
    
    if (editTargetId) {
      mutateRecord.mutate({
        id: editTargetId,
        recordType: 'premium_payment',
        payload: { ...formData },
        status: formData.status || 'Pending',
        searchText: `${formData.policyHolder} ${formData.policyNumber}`
      }, {
        onSuccess: () => {
          toast.success('Premium record updated!');
          setShowModal(false);
          setFormData({
            policyNumber: '', policyHolder: '', amount: '', 
            dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], paymentMethod: 'Bank Transfer'
          });
        },
        onError: (err) => toast.error('Failed to update record: ' + err.message)
      });
    } else {
      const receiptNumber = `RCP-${Math.floor(1000 + Math.random() * 9000)}`;

      if (formData.paymentMethod === 'Credit Card') {
        try {
          await processPayment({
            companyId,
            provider: 'stripe',
            amount: parseFloat(formData.amount),
            currency: 'USD',
            reference: receiptNumber,
            customerName: formData.policyHolder
          });
          toast.success("Payment processed successfully via Stripe");
        } catch (err) {
          console.error("Payment failed", err);
          return toast.error("Payment failed: " + err.message);
        }
      }

      mutateRecord.mutate({
        recordType: 'premium_payment',
        payload: { ...formData, receiptNumber, paidDate: '' },
        status: 'Pending',
        searchText: `${formData.policyHolder} ${formData.policyNumber} ${receiptNumber}`
      }, {
        onSuccess: () => {
          toast.success('Premium record created!');
          setShowModal(false);
          setFormData({
            policyNumber: '', policyHolder: '', amount: '', 
            dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], paymentMethod: 'Bank Transfer'
          });
        },
        onError: (err) => toast.error('Failed to create record: ' + err.message)
      });
    }
  };

  const handleEdit = (premium) => {
    setFormData({
      policyNumber: premium.policyNumber || '',
      policyHolder: premium.policyHolder || '',
      amount: premium.amount || '',
      dueDate: premium.dueDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      paymentMethod: premium.paymentMethod || 'Bank Transfer',
      status: premium.status
    });
    setShowModal(true);
  };

  const openNewModal = () => {
    setFormData({
      policyNumber: '', policyHolder: '', amount: '', 
      dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], paymentMethod: 'Bank Transfer'
    });
    setShowModal(true);
  };

  const handleUpdateStatus = (premium, newStatus) => {
    const payload = { ...premium, paidDate: newStatus === 'Paid' ? new Date().toISOString().split('T')[0] : '' };
    delete payload.id;
    delete payload.status;
    
    mutateRecord.mutate({
      id: premium.id,
      recordType: 'premium_payment',
      payload,
      status: newStatus,
      searchText: `${premium.policyHolder} ${premium.policyNumber} ${premium.receiptNumber}`
    }, {
      onSuccess: () => toast.success(`Payment marked as ${newStatus}`)
    });
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'premium_payment' }, {
      onSuccess: () => {
        toast.success('Record removed!');
        setDeleteTargetId(null);
      },
      onError: (err) => {
        toast.error('Failed to remove: ' + err.message);
        setDeleteTargetId(null);
      }
    });
  };

  const filtered = premiums.filter(p => 
    p.policyHolder?.toLowerCase().includes(search.toLowerCase()) || 
    p.policyNumber?.toLowerCase().includes(search.toLowerCase()) ||
    p.receiptNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCollected = premiums.filter(p => p.status === 'Paid').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">Premiums</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage policy premium payments and collections</p>
        </div>
        <Button onClick={openNewModal} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4" /> Record Payment
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-emerald-600"><CheckCircle className="w-4 h-4"/> Collected</div>
          <p className="text-2xl font-bold text-card-foreground">${totalCollected.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground"><DollarSign className="w-4 h-4"/> Total Payments</div>
          <p className="text-2xl font-bold text-card-foreground">{premiums.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-amber-600"><Clock className="w-4 h-4"/> Pending</div>
          <p className="text-2xl font-bold text-card-foreground">{premiums.filter(p => p.status === 'Pending').length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-red-600"><AlertCircle className="w-4 h-4"/> Overdue</div>
          <p className="text-2xl font-bold text-card-foreground">{premiums.filter(p => p.status === 'Overdue').length}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search receipt, policy or holder..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
        </div>
        <div className="overflow-x-auto">
          {isDbLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading premium records...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-600" />
              <p className="font-semibold text-lg text-card-foreground">No premium records found</p>
              <p className="text-xs mt-1">Record a new payment to see it here.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-card border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Receipt Info</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Policy Info</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Due Date</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Amount</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(premium => (
                  <tr key={premium.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-mono font-bold text-emerald-600">{premium.receiptNumber}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{premium.paymentMethod}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-card-foreground">{premium.policyHolder}</p>
                      <Link to="/insurance/policies" className="text-xs text-primary hover:underline font-medium block">{premium.policyNumber}</Link>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-medium">
                      {premium.dueDate}
                      {premium.paidDate && <p className="text-[10px] text-emerald-600 mt-0.5">Paid: {premium.paidDate}</p>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-bold text-card-foreground">${Number(premium.amount).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <select
                        value={premium.status}
                        onChange={e => handleUpdateStatus(premium, e.target.value)}
                        className={`rounded-md border border-input px-2 py-1 text-xs font-bold ${
                          premium.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                          premium.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
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
                          <DropdownMenuItem onClick={() => setViewRecord(premium)}>View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(premium)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTargetId(premium.id)} className="text-red-600">Delete</DropdownMenuItem>
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
            <h2 className="text-lg font-bold text-card-foreground">{editTargetId ? 'Edit Premium Payment' : 'Record Premium Payment'}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Policy Number</label>
                <Input value={formData.policyNumber} onChange={e => setFormData({...formData, policyNumber: e.target.value})} placeholder="POL-12345" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Policy Holder</label>
                <Input value={formData.policyHolder} onChange={e => setFormData({...formData, policyHolder: e.target.value})} placeholder="Jane Doe" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Amount ($)</label>
                  <Input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="500" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Payment Method</label>
                  <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                    <option>Bank Transfer</option>
                    <option>Credit Card</option>
                    <option>Mobile Money</option>
                    <option>Cash</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Due Date</label>
                <Input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="mt-1" />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditTargetId(null); }}>Cancel</Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreatePremium} disabled={isPaymentLoading}>
                {isPaymentLoading ? 'Processing...' : editTargetId ? 'Save Changes' : 'Save Record'}
              </Button>
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
              const record = premiums.find(r => r.id === viewDetailsId);
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
        title="Delete Premium Record"
        message="Are you sure you want to completely remove this premium record? This cannot be undone."
      />

      <Sheet open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Premium Details</SheetTitle>
            <SheetDescription>View complete information for this premium payment.</SheetDescription>
          </SheetHeader>
          {viewRecord && (
            <div className="mt-6 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Receipt Number</h4>
                <p className="text-base font-semibold">{viewRecord.receiptNumber}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Policy Number</h4>
                <Link to="/insurance/policies" className="text-base text-primary hover:underline font-semibold">{viewRecord.policyNumber}</Link>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Policy Holder</h4>
                <p className="text-base">{viewRecord.policyHolder}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Amount</h4>
                <p className="text-base">${Number(viewRecord.amount).toLocaleString()}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                <p className="text-base">{viewRecord.status}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Payment Method</h4>
                <p className="text-base">{viewRecord.paymentMethod}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Due Date</h4>
                <p className="text-base">{viewRecord.dueDate}</p>
              </div>
              {viewRecord.paidDate && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Paid Date</h4>
                  <p className="text-base">{viewRecord.paidDate}</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
