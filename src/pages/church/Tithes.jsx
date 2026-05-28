import { useState } from 'react';
import { DollarSign, Search, Plus, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { usePayment } from '@/hooks/integrations/usePayment';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';

export default function Tithes() {
  const { processPayment, isProcessing } = usePayment();
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('tithe');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const tithes = dbRecords.map(r => ({
    id: r.id,
    status: r.status || 'Active',
    ...r.data
  }));

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    member: '',
    type: 'Tithe',
    amount: 100,
    method: 'Mobile Money'
  });

  
  const openEdit = (record) => {
    setEditRecord(record);
    setFormData(record);
    setShowModal(true);
  };

  const handleCreateTithe = async () => {
    if (!formData.member.trim() || formData.amount <= 0) {
      return toast.error("Please enter a donor name and positive amount");
    }

    try {
      const paymentResult = await processPayment({
        amount: parseFloat(formData.amount),
        currency: 'USD',
        description: `${formData.type} from ${formData.member}`,
        customerName: formData.member
      });

      if (paymentResult.success) {
        const trxId = `TRX-${Math.floor(1000 + Math.random() * 9000)}`;
        const payload = {
          trxId,
          member: formData.member,
          type: formData.type,
          amount: parseFloat(formData.amount) || 0,
          method: formData.method,
          date: new Date().toISOString().split('T')[0]
        };

        mutateRecord.mutate({
          ...(editRecord ? { id: editRecord.id } : {}),
          recordType: 'tithe',
          payload,
          status: 'Active',
          searchText: `${trxId} ${formData.member} ${formData.type}`
        }, {
          onSuccess: () => {
            toast.success('Giving transaction logged successfully!');
            setShowModal(false);
            setEditRecord(null);
            setFormData({ member: '', type: 'Tithe', amount: 100, method: 'Mobile Money' });
          },
          onError: (err) => {
            toast.error('Failed to log giving: ' + err.message);
          }
        });
      }
    } catch (err) {
      toast.error('Payment processing failed: ' + err.message);
    }
  };

  const handleDeleteTithe = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'tithe' }, {
      onSuccess: () => {
        toast.success('Giving record retracted successfully!');
        setDeleteTargetId(null);
      },
      onError: (err) => {
        toast.error('Failed to retract record: ' + err.message);
        setDeleteTargetId(null);
      }
    });
  };

  const filtered = tithes.filter(t =>
    t.member?.toLowerCase().includes(search.toLowerCase()) ||
    t.trxId?.toLowerCase().includes(search.toLowerCase()) ||
    t.type?.toLowerCase().includes(search.toLowerCase())
  );

  const totalTithes = tithes.filter(t => t.type === 'Tithe').reduce((acc, c) => acc + (c.amount || 0), 0);
  const totalOfferings = tithes.filter(t => t.type === 'Offering').reduce((acc, c) => acc + (c.amount || 0), 0);
  const totalOthers = tithes.filter(t => t.type !== 'Tithe' && t.type !== 'Offering').reduce((acc, c) => acc + (c.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">Tithes & Offerings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage church financial contributions</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowModal(true)} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="w-4 h-4" /> Record Giving
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-foreground text-sm">Total Tithes logged</h3>
          </div>
          <p className="text-3xl font-bold text-card-foreground">${totalTithes.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center text-green-600 dark:text-green-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-foreground text-sm">Total Offerings</h3>
          </div>
          <p className="text-3xl font-bold text-card-foreground">${totalOfferings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-foreground text-sm">Special/Building Funds</h3>
          </div>
          <p className="text-3xl font-bold text-card-foreground">${totalOthers.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search donor name or transaction ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
        </div>
        <div className="overflow-x-auto">
          {isDbLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading financial logs...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground bg-card">
              <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse text-purple-600" />
              <p className="font-semibold text-lg text-card-foreground">No financial ledger entries</p>
              <p className="text-xs mt-1">Record a new tithe, weekly offering, or building pledge using the top right button.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-card border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Trx ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Donor Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Giving Type</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Payment Method</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Date</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Amount</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{t.trxId}</td>
                    <td className="px-6 py-4 font-bold text-card-foreground">
                      <Link to="/church/members" className="text-primary hover:underline">{t.member}</Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 px-2.5 py-1 rounded-full text-xs font-bold">
                        {t.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{t.method}</td>
                    <td className="px-6 py-4 text-muted-foreground">{t.date}</td>
                    <td className="px-6 py-4 text-right font-bold text-card-foreground">
                      ${(t.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewRecord(t)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(t)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTargetId(t.id)} className="text-red-600">
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
            <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-600" /> Record Financial Giving
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Donor/Member Name</label>
                <Input
                  value={formData.member}
                  onChange={e => setFormData({ ...formData, member: e.target.value })}
                  className="mt-1"
                  placeholder="e.g. John Doe or Anonymous"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Giving Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option>Tithe</option>
                    <option>Offering</option>
                    <option>Building Fund</option>
                    <option>Pledge Payment</option>
                    <option>Welfare Fund</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Payment Method</label>
                  <select
                    value={formData.method}
                    onChange={e => setFormData({ ...formData, method: e.target.value })}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option>Mobile Money</option>
                    <option>Cash</option>
                    <option>Bank Transfer</option>
                    <option>Cheque</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Amount Given ($)</label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-1"
                  placeholder="100.00"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditRecord(null); }}>Cancel</Button>
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" onClick={handleCreateTithe}>{editRecord ? 'Update' : 'Submit Ledger'}</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteTithe}
        title="Retract Offering Record"
        message="Are you sure you want to completely delete/retract this logged giving transaction from the church ledgers? This will directly adjust all dynamic monthly calculations."
      />
    
      <Sheet open={!!viewRecord} onOpenChange={(open) => !open && setViewRecord(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Record Details</SheetTitle>
            <SheetDescription>Read-only view of the selected record.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {viewRecord && Object.entries(viewRecord).filter(([k]) => k !== 'id' && k !== 'status').map(([key, value]) => (
              <div key={key} className="border-b border-border pb-2">
                <p className="text-sm font-medium text-muted-foreground uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                <p className="mt-1 text-base text-foreground font-semibold">
                  {key === 'member' ? (
                    <Link to="/church/members" className="text-primary hover:underline">{String(value)}</Link>
                  ) : typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </p>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
