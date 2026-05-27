import { useState } from 'react';
import { Users, Search, Plus, Mail, Star, Heart, Trash2, MoreVertical, Eye, Edit, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import CSVImportModal from '@/components/shared/CSVImportModal';
import { UploadCloud } from 'lucide-react';

const segmentColors = {
  VIP: 'bg-purple-100 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900',
  Regular: 'bg-blue-100 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900',
  New: 'bg-green-100 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900'
};

export default function Customers() {
  // Supabase Real-time Sync Hooks
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('customer');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  // Map database records
  const customers = dbRecords.map(r => {
    const data = r.data || {};
    const totalSpent = parseFloat(data.totalSpent) || 0;
    let segment = 'New';
    if (totalSpent > 1000) segment = 'VIP';
    else if (totalSpent > 200) segment = 'Regular';

    return {
      id: r.id,
      custId: data.custId || `CUST-${r.id?.slice(0, 4)}`,
      name: data.name || 'Unnamed',
      email: data.email || '',
      phone: data.phone || '',
      totalSpent,
      orders: parseInt(data.orders) || 0,
      segment
    };
  });

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    totalSpent: '',
    orders: ''
  });

  const openDetails = (cust) => {
    setSelectedRecord(cust);
    setIsSheetOpen(true);
  };

  const openEdit = (cust) => {
    setEditingId(cust.id);
    setFormData({
      name: cust.name,
      email: cust.email,
      phone: cust.phone,
      totalSpent: cust.totalSpent,
      orders: cust.orders
    });
    setShowModal(true);
  };

  const handleSaveCustomer = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      return toast.error("Please enter a name and email");
    }

    const custId = editingId ? (customers.find(c => c.id === editingId)?.custId || `CUST-${Math.floor(100 + Math.random() * 900)}`) : `CUST-${Math.floor(100 + Math.random() * 900)}`;

    const payload = {
      custId,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      totalSpent: parseFloat(formData.totalSpent) || 0,
      orders: parseInt(formData.orders) || 0
    };

    mutateRecord.mutate({
      ...(editingId ? { id: editingId } : {}),
      recordType: 'customer',
      payload,
      status: 'Active',
      searchText: `${custId} ${formData.name} ${formData.email}`
    }, {
      onSuccess: () => {
        toast.success(editingId ? 'Customer updated successfully!' : 'Customer registered successfully!');
        setShowModal(false);
        setEditingId(null);
        setFormData({
          name: '',
          email: '',
          phone: '',
          totalSpent: '',
          orders: ''
        });
      },
      onError: (err) => {
        toast.error('Failed to save customer: ' + err.message);
      }
    });
  };

  const handleDeleteCustomer = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'customer' }, {
      onSuccess: () => {
        toast.success('Customer removed successfully!');
        setDeleteTargetId(null);
      },
      onError: (err) => {
        toast.error('Failed to delete customer: ' + err.message);
        setDeleteTargetId(null);
      }
    });
  };

  const stats = {
    totalCount: customers.length,
    vipCount: customers.filter(c => c.segment === 'VIP').length
  };

  const filtered = customers.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage customer profiles and loyalty tiers</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowImportModal(true)} variant="outline" className="gap-2 text-primary border-primary hover:bg-primary/5">
            <UploadCloud className="w-4 h-4" /> Import CSV
          </Button>
          <Button onClick={() => { setEditingId(null); setFormData({ name: '', email: '', phone: '', totalSpent: '', orders: '' }); setShowModal(true); }} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4" /> Add Customer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card-premium bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/20 flex items-center justify-center text-blue-600"><Users className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-card-foreground">{stats.totalCount}</p><p className="text-xs text-muted-foreground">Total Customers</p></div>
        </div>
        <div className="stat-card-premium bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/20 flex items-center justify-center text-purple-600"><Star className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-card-foreground">{stats.vipCount}</p><p className="text-xs text-muted-foreground">VIP Members</p></div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
        </div>
        <div className="overflow-x-auto">
          {isDbLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading customers...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
               <Users className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse" />
               <p className="font-semibold">No customers registered.</p>
               <p className="text-xs mt-1">Add your first retail customer using the "Add Customer" button.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-card border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Customer Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Contact Info</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Total Orders</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Lifetime Value</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Segment</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(cust => (
                  <tr key={cust.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-card-foreground">{cust.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{cust.custId}</p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground space-y-1">
                       <p>{cust.email}</p>
                       <p className="text-xs">{cust.phone}</p>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-card-foreground">
                      <Link to="/retail/sales" className="text-primary hover:underline">{cust.orders}</Link>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-card-foreground">${cust.totalSpent.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${segmentColors[cust.segment] || 'bg-muted'}`}>
                         {cust.segment}
                      </span>
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
                          <DropdownMenuItem onClick={() => openDetails(cust)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(cust)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTargetId(cust.id)} className="text-red-600">
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

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Customer Details</SheetTitle>
            <SheetDescription>View detailed information for this customer.</SheetDescription>
          </SheetHeader>
          {selectedRecord && (
            <div className="mt-6 space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="col-span-1 font-semibold text-muted-foreground">ID</div>
                <div className="col-span-2">{selectedRecord.custId}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="col-span-1 font-semibold text-muted-foreground">Name</div>
                <div className="col-span-2 font-medium">{selectedRecord.name}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="col-span-1 font-semibold text-muted-foreground">Email</div>
                <div className="col-span-2">{selectedRecord.email}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="col-span-1 font-semibold text-muted-foreground">Phone</div>
                <div className="col-span-2">{selectedRecord.phone}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="col-span-1 font-semibold text-muted-foreground">Total Orders</div>
                <div className="col-span-2"><Link to="/retail/sales" className="text-primary hover:underline">{selectedRecord.orders}</Link></div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="col-span-1 font-semibold text-muted-foreground">Lifetime Spend</div>
                <div className="col-span-2">${selectedRecord.totalSpent.toFixed(2)}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 font-semibold text-muted-foreground">Segment</div>
                <div className="col-span-2">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${segmentColors[selectedRecord.segment] || 'bg-muted'}`}>
                    {selectedRecord.segment}
                  </span>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2"><Plus className="w-5 h-5 text-blue-600"/> {editingId ? 'Edit Customer' : 'Add Customer'}</h2>
            <div className="space-y-3">
               <div>
                 <label className="text-xs font-bold text-muted-foreground uppercase">Customer Name</label>
                 <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1" placeholder="e.g. Jane Doe" />
               </div>
               <div>
                 <label className="text-xs font-bold text-muted-foreground uppercase">Email Address</label>
                 <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="mt-1" placeholder="e.g. jane@example.com" />
               </div>
               <div>
                 <label className="text-xs font-bold text-muted-foreground uppercase">Phone Number</label>
                 <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="mt-1" placeholder="e.g. +1 555-0188" />
               </div>
               <div>
                 <label className="text-xs font-bold text-muted-foreground uppercase">Initial Lifetime Spend ($)</label>
                 <Input type="number" value={formData.totalSpent} onChange={e => setFormData({ ...formData, totalSpent: e.target.value })} className="mt-1" placeholder="e.g. 150.00" />
               </div>
               <div>
                 <label className="text-xs font-bold text-muted-foreground uppercase">Initial Orders Count</label>
                 <Input type="number" value={formData.orders} onChange={e => setFormData({ ...formData, orders: e.target.value })} className="mt-1" placeholder="e.g. 2" />
               </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditingId(null); }}>Cancel</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveCustomer}>{editingId ? 'Save Changes' : 'Add Customer'}</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteCustomer}
        title="Delete Customer Profile"
        message="Are you sure you want to delete this customer profile? This will remove all loyalty and spend metrics permanently."
      />

      <CSVImportModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
        recordType="customer" 
      />

      

      
    </div>
  );
}
