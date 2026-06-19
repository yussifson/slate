import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Search, Plus, Shield, ShieldAlert, ArrowRightLeft, FileSignature, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function Reinsurance() {
  const { t } = useTranslation();
  const { data: dbRecords = [], isLoading } = useIndustryRecords('reinsurance_contract');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const contracts = dbRecords.map(r => ({
    id: r.id,
    status: r.status || 'Active',
    ...r.data
  }));

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTargetId, setEditTargetId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const [formData, setFormData] = useState({
    treatyName: '',
    reinsurer: '',
    cededPremium: '',
    coverageLimit: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 31536000000).toISOString().split('T')[0]
  });

  const handleSave = () => {
    if (!formData.treatyName.trim()) return toast.error("Treaty name is required");
    
    mutateRecord.mutate({
      id: editTargetId,
      recordType: 'reinsurance_contract',
      payload: { ...formData },
      status: formData.status || 'Active',
      searchText: `${formData.treatyName} ${formData.reinsurer}`
    }, {
      onSuccess: () => {
        toast.success(editTargetId ? 'Contract updated successfully!' : 'Contract added successfully!');
        setShowModal(false);
        setEditTargetId(null);
      },
      onError: (err) => toast.error('Failed to save contract: ' + err.message)
    });
  };

  const handleEdit = (contract) => {
    setFormData({
      treatyName: contract.treatyName || '',
      reinsurer: contract.reinsurer || '',
      cededPremium: contract.cededPremium || '',
      coverageLimit: contract.coverageLimit || '',
      effectiveDate: contract.effectiveDate || new Date().toISOString().split('T')[0],
      expiryDate: contract.expiryDate || new Date(Date.now() + 31536000000).toISOString().split('T')[0],
      status: contract.status
    });
    setEditTargetId(contract.id);
    setShowModal(true);
  };

  const openNewModal = () => {
    setFormData({ treatyName: '', reinsurer: '', cededPremium: '', coverageLimit: '', effectiveDate: new Date().toISOString().split('T')[0], expiryDate: new Date(Date.now() + 31536000000).toISOString().split('T')[0] });
    setEditTargetId(null);
    setShowModal(true);
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'reinsurance_contract' }, {
      onSuccess: () => {
        toast.success('Contract removed!');
        setDeleteTargetId(null);
      }
    });
  };

  const filtered = contracts.filter(c => 
    c.treatyName?.toLowerCase().includes(search.toLowerCase()) || 
    c.reinsurer?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCeded = contracts.reduce((sum, c) => sum + (Number(c.cededPremium) || 0), 0);
  const totalCoverage = contracts.reduce((sum, c) => sum + (Number(c.coverageLimit) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">{t("reinsurance", "Reinsurance Management")}</h1>
          <p className="text-sm text-[#71717a] mt-0.5">{t("manage_ceded_premiums", "Manage ceded premiums and reinsurance treaties")}</p>
        </div>
        <Button onClick={openNewModal} className="gap-2 bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4" /> {t("new_contract", "New Contract")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border-[0.5px] border-primary/40 p-5 border-l-4 border-l-primary">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-foreground">{t("active_treaties", "Active Treaties")}</h3>
            <FileSignature className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-semibold mt-2">{contracts.filter(c => c.status === 'Active').length}</p>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-primary/40 p-5 border-l-4 border-l-amber-500">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-foreground">{t("ceded_premium", "Total Ceded Premium")}</h3>
            <ArrowRightLeft className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-semibold mt-2">${totalCeded.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-primary/40 p-5 border-l-4 border-l-green-500">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-foreground">{t("reinsurance_coverage", "Reinsurance Coverage limit")}</h3>
            <ShieldAlert className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-semibold mt-2">${totalCoverage.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border-[0.5px] border-primary/40 overflow-hidden">
        <div className="p-4 border-b border-primary/40 bg-muted/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
            <Input placeholder="Search treaty or reinsurer..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card border-b border-primary/40">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase">Treaty Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase">Reinsurer</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] uppercase">Ceded Premium</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] uppercase">Coverage Limit</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(contract => (
                <tr key={contract.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-card-foreground">{contract.treatyName}</p>
                    <p className="text-[10px] text-[#71717a] uppercase tracking-wide">{contract.effectiveDate} to {contract.expiryDate}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-primary">
                    <div className="flex items-center gap-2"><Shield className="w-4 h-4"/> {contract.reinsurer}</div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-card-foreground">
                    ${Number(contract.cededPremium || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-card-foreground">
                    ${Number(contract.coverageLimit || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      contract.status === 'Active' ? 'bg-green-100 text-green-700' :
                      contract.status === 'Expired' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {contract.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(contract)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteTargetId(contract.id)} className="text-red-600">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !isLoading && (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-[#71717a]">No treaties found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold">{editTargetId ? 'Edit Contract' : 'New Contract'}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Treaty Name</label>
                <Input value={formData.treatyName} onChange={e => setFormData({...formData, treatyName: e.target.value})} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Reinsurer</label>
                <Input value={formData.reinsurer} onChange={e => setFormData({...formData, reinsurer: e.target.value})} className="mt-1" placeholder="e.g. Munich Re" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Ceded Premium ($)</label>
                  <Input type="number" value={formData.cededPremium} onChange={e => setFormData({...formData, cededPremium: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Coverage Limit ($)</label>
                  <Input type="number" value={formData.coverageLimit} onChange={e => setFormData({...formData, coverageLimit: e.target.value})} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Effective Date</label>
                  <Input type="date" value={formData.effectiveDate} onChange={e => setFormData({...formData, effectiveDate: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Expiry Date</label>
                  <Input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="mt-1" />
                </div>
              </div>
              {editTargetId && (
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-primary/40 bg-background px-3 py-2 text-sm">
                    <option>Active</option><option>Pending</option><option>Expired</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleSave}>Save</Button>
            </div>
          </div>
        </div>
      )}
      
      <ConfirmationModal isOpen={deleteTargetId !== null} onClose={() => setDeleteTargetId(null)} onConfirm={handleDelete} title="Delete Contract" message="Are you sure you want to remove this reinsurance treaty? This cannot be undone." />
    </div>
  );
}
