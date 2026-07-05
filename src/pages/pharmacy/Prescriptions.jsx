import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Clock, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { usePowerSync } from '@powersync/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import PharmacyAPI from '@/api/PharmacyAPI';
import ViewToggle from '@/components/shared/ViewToggle';
import { useViewPreference } from '@/hooks/useViewPreference';
import GenericKanban from '@/components/views/GenericKanban';

export default function Prescriptions() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [prescriptions, setPrescriptions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useViewPreference('pharmacy_prescriptions', 'list');

  const [formData, setFormData] = useState({
    customerId: '',
    prescriptionNumber: `RX-${Date.now()}`,
    physicianName: '',
    physicianLicenseNumber: '',
    prescriptionDate: new Date().toISOString().split('T')[0],
    prescribedDrugId: '',
    drugName: '',
    quantityPrescribed: 1,
    dosage: '',
    frequency: '',
    durationDays: 30,
    refillsAllowed: 0
  });

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prescResult, custResult, drugsResult] = await Promise.all([
        PharmacyAPI.getPrescriptions(companyId),
        PharmacyAPI.getCustomers(companyId),
        PharmacyAPI.getDrugs(companyId)
      ]);
      setPrescriptions(prescResult);
      setCustomers(custResult);
      setDrugs(drugsResult);
    } catch (e) {
      console.error('[Prescriptions] Fetch error:', e);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await PharmacyAPI.updatePrescription(companyId, editingId, {
          physicianName: formData.physicianName,
          dosage: formData.dosage,
          frequency: formData.frequency,
          durationDays: formData.durationDays,
          refillsAllowed: formData.refillsAllowed,
          prescriptionStatus: 'Pending'
        }, user.id);
        toast.success('Prescription updated');
      } else {
        await PharmacyAPI.createPrescription(companyId, formData, user.id);
        toast.success('Prescription created');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        customerId: '',
        prescriptionNumber: `RX-${Date.now()}`,
        physicianName: '',
        physicianLicenseNumber: '',
        prescriptionDate: new Date().toISOString().split('T')[0],
        prescribedDrugId: '',
        drugName: '',
        quantityPrescribed: 1,
        dosage: '',
        frequency: '',
        durationDays: 30,
        refillsAllowed: 0
      });
      fetchData();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleEdit = (p) => {
    setFormData({
      customerId: p.customer_id || '',
      prescriptionNumber: p.prescription_number || '',
      physicianName: p.physician_name || '',
      physicianLicenseNumber: p.physician_license_number || '',
      prescriptionDate: p.prescription_date || new Date().toISOString().split('T')[0],
      prescribedDrugId: p.prescribed_drug_id || '',
      drugName: p.drug_name || '',
      quantityPrescribed: p.quantity_prescribed || 1,
      dosage: p.dosage || '',
      frequency: p.frequency || '',
      durationDays: p.duration_days || 30,
      refillsAllowed: p.refills_allowed || 0
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this prescription?')) {
      try {
        await PharmacyAPI.deletePrescription(companyId, id, user.id);
        toast.success('Prescription deleted');
        fetchData();
      } catch (e) {
        toast.error('Failed to delete prescription');
      }
    }
  };

  const filteredPrescriptions = prescriptions.filter(p =>
    p.prescription_number?.includes(search) ||
    p.drug_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Prescriptions</h1>
            <p className="text-muted-foreground mt-2">Manage patient prescriptions</p>
          </div>
          <div className="flex items-center gap-4">
            <ViewToggle view={view} onViewChange={setView} allowedViews={['grid', 'list', 'kanban']} />
            <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md border-0">
              <Plus className="w-4 h-4 mr-2" />
              New Prescription
            </Button>
          </div>
        </div>

        <Card className="p-2 px-4 mb-6 border border-border/50 bg-card/50 backdrop-blur-md flex items-center rounded-2xl shadow-sm">
          <Search className="w-5 h-5 text-muted-foreground mr-2" />
          <Input
            placeholder="Search prescriptions by number or drug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 px-0 shadow-none text-base"
          />
        </Card>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed rounded-2xl border-border">No prescriptions found.</div>
        ) : view === 'list' ? (
          <Card className="border border-border/50 bg-card/60 backdrop-blur-sm rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="p-4 font-semibold text-foreground">Prescription #</th>
                    <th className="p-4 font-semibold text-foreground">Drug</th>
                    <th className="p-4 font-semibold text-foreground">Dosage / Freq</th>
                    <th className="p-4 font-semibold text-foreground">Duration</th>
                    <th className="p-4 font-semibold text-foreground">Status</th>
                    <th className="p-4 font-semibold text-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredPrescriptions.map(p => (
                    <tr key={p.id} className="group hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-500" />
                          {p.prescription_number}
                        </div>
                      </td>
                      <td className="p-4 font-medium">{p.drug_name}</td>
                      <td className="p-4 text-muted-foreground">{p.dosage} - {p.frequency}</td>
                      <td className="p-4 text-muted-foreground">{p.duration_days} days</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            p.prescription_status === 'Pending' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' 
                            : p.prescription_status === 'Filled' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {p.prescription_status || 'New'}
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} className="h-7 w-7 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="h-7 w-7 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrescriptions.map(p => (
              <Card key={p.id} className="p-6 border border-border/40 bg-card/60 backdrop-blur-sm hover:shadow-xl hover:border-emerald-500/30 transition-all rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 flex justify-end w-full">
                  <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold shadow-sm ${
                    p.prescription_status === 'Pending' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' 
                    : p.prescription_status === 'Filled' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {p.prescription_status || 'New'}
                  </span>
                </div>

                {/* Hover actions */}
                <div className="absolute bottom-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} className="h-7 w-7 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="h-7 w-7 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground group-hover:text-emerald-600 transition-colors line-clamp-1 pr-16">{p.drug_name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{p.prescription_number}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mt-4 p-3 bg-muted/30 rounded-xl">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Dosage</p>
                    <p className="font-medium text-foreground line-clamp-1">{p.dosage}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Frequency</p>
                    <p className="font-medium text-foreground line-clamp-1">{p.frequency}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  Duration: {p.duration_days} days
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <GenericKanban
            data={filteredPrescriptions.map(p => ({
              ...p,
              computed_status: p.prescription_status || 'Pending'
            }))}
            statusKey="computed_status"
            titleKey="drug_name"
            boardKey="pharmacy_prescriptions"
            defaultStages={['Pending', 'Filled', 'Cancelled']}
            onStatusChange={async (itemId, newStatus) => {
              try {
                await PharmacyAPI.updatePrescriptionStatus(companyId, itemId, newStatus, user.id);
                toast.success(`Moved to ${newStatus}`);
                fetchData();
              } catch (e) {
                toast.error('Failed to update status');
              }
            }}
          />
        )}

        <Sheet open={showForm} onOpenChange={setShowForm}>
          <SheetContent aria-describedby={undefined} className="w-full max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editingId ? 'Edit Prescription' : 'New Prescription'}</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div>
                <label className="text-sm font-medium text-foreground">Customer</label>
                <Select value={formData.customerId} onValueChange={(v) => setFormData({...formData, customerId: v})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.customer_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Physician Name</label>
                <Input value={formData.physicianName} onChange={(e) => setFormData({...formData, physicianName: e.target.value})} required className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Drug</label>
                <Select value={formData.prescribedDrugId} onValueChange={(v) => {
                  const drug = drugs.find(d => d.id === v);
                  setFormData({...formData, prescribedDrugId: v, drugName: drug?.drug_name || ''});
                }}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {drugs.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.drug_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Dosage</label>
                  <Input value={formData.dosage} onChange={(e) => setFormData({...formData, dosage: e.target.value})} placeholder="e.g., 500mg" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Frequency</label>
                  <Input value={formData.frequency} onChange={(e) => setFormData({...formData, frequency: e.target.value})} placeholder="e.g., 3x daily" className="mt-1" />
                </div>
              </div>
              <div className="flex gap-2 pt-6">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700">{editingId ? 'Save Changes' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
