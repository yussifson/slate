import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Clock } from 'lucide-react';
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

export default function Prescriptions() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [prescriptions, setPrescriptions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

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
      await PharmacyAPI.createPrescription(companyId, formData, user.id);
      toast.success('Prescription created');
      setShowForm(false);
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
          <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Prescription
          </Button>
        </div>

        <Card className="p-6 mb-6 border border-border bg-card">
          <Input
            placeholder="Search prescriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Card>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : filteredPrescriptions.length === 0 ? (
          <Card className="p-12 text-center border border-border bg-card">
            <p className="text-muted-foreground">No prescriptions found</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredPrescriptions.map(p => (
              <Card key={p.id} className="p-4 border border-border bg-card hover:shadow-md transition-shadow">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Prescription #</p>
                    <p className="font-bold text-foreground">{p.prescription_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Drug</p>
                    <p className="font-semibold text-foreground">{p.drug_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Dosage</p>
                    <p className="text-sm text-foreground">{p.dosage} - {p.frequency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm text-foreground">{p.duration_days} days</p>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      p.prescription_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {p.prescription_status}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Sheet open={showForm} onOpenChange={setShowForm}>
          <SheetContent className="w-full max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>New Prescription</SheetTitle>
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
                <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700">Create</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
