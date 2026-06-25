import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { usePowerSync } from '@powersync/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import PharmacyAPI from '@/api/PharmacyAPI';

export default function Drugs() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [drugs, setDrugs] = useState([]);
  const [filteredDrugs, setFilteredDrugs] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    drugName: '',
    genericName: '',
    strength: '',
    unitOfMeasurement: '',
    drugForm: '',
    manufacturer: '',
    ndcCode: '',
    therapeuticCategory: '',
    unitPrice: 0,
    discountPercentage: 0,
    reorderLevel: 50,
    maximumStock: 500,
    barcode: '',
    isControlled: false,
    requiresPrescription: false
  });

  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchDrugs();
  }, [companyId]);

  useEffect(() => {
    const filtered = drugs.filter(drug =>
      drug.drug_name?.toLowerCase().includes(search.toLowerCase()) ||
      drug.generic_name?.toLowerCase().includes(search.toLowerCase()) ||
      drug.ndc_code?.includes(search)
    );
    setFilteredDrugs(filtered);
  }, [search, drugs]);

  const fetchDrugs = async () => {
    try {
      setLoading(true);
      const result = await PharmacyAPI.getDrugs(companyId);
      setDrugs(result);
    } catch (e) {
      console.error('[Drugs] Fetch error:', e);
      toast.error('Failed to load drugs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await PharmacyAPI.updateDrug(companyId, editingId, formData, user.id);
        toast.success('Drug updated successfully');
      } else {
        await PharmacyAPI.createDrug(companyId, formData, user.id);
        toast.success('Drug created successfully');
      }
      setShowForm(false);
      setFormData({
        drugName: '', genericName: '', strength: '', unitOfMeasurement: '',
        drugForm: '', manufacturer: '', ndcCode: '', therapeuticCategory: '',
        unitPrice: 0, discountPercentage: 0, reorderLevel: 50, maximumStock: 500,
        barcode: '', isControlled: false, requiresPrescription: false
      });
      setEditingId(null);
      fetchDrugs();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const DrugCard = ({ drug }) => (
    <div className="bg-card border border-border rounded-lg p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-foreground">{drug.drug_name}</h3>
          <p className="text-sm text-muted-foreground">{drug.generic_name}</p>
        </div>
        <div className="flex gap-2">
          {drug.is_controlled && <Shield className="w-5 h-5 text-orange-500" title="Controlled substance" />}
          {drug.requires_prescription && <AlertCircle className="w-5 h-5 text-red-500" title="Requires prescription" />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div>
          <p className="text-muted-foreground">Strength</p>
          <p className="font-medium text-foreground">{drug.strength || '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Price</p>
          <p className="font-medium text-foreground">${parseFloat(drug.unit_price || 0).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Manufacturer</p>
          <p className="font-medium text-foreground text-xs">{drug.manufacturer || '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Category</p>
          <p className="font-medium text-foreground text-xs">{drug.therapeutic_category || '-'}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setFormData({...drug, isControlled: !!drug.is_controlled, requiresPrescription: !!drug.requires_prescription});
            setEditingId(drug.id);
            setShowForm(true);
          }}
          className="flex-1"
        >
          <Edit2 className="w-4 h-4 mr-1" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Drug Catalog</h1>
            <p className="text-muted-foreground mt-2">Manage your pharmacy drug inventory and information</p>
          </div>
          <Button
            onClick={() => {
              setEditingId(null);
              setFormData({
                drugName: '', genericName: '', strength: '', unitOfMeasurement: '',
                drugForm: '', manufacturer: '', ndcCode: '', therapeuticCategory: '',
                unitPrice: 0, discountPercentage: 0, reorderLevel: 50, maximumStock: 500,
                barcode: '', isControlled: false, requiresPrescription: false
              });
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Drug
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="p-4 mb-6 border border-border bg-card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by drug name, generic name, or NDC code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Drug Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading drugs...</p>
          </div>
        ) : filteredDrugs.length === 0 ? (
          <Card className="p-12 text-center border border-border bg-card">
            <p className="text-muted-foreground mb-4">No drugs found</p>
            <Button onClick={() => setShowForm(true)}>Add your first drug</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDrugs.map(drug => (
              <DrugCard key={drug.id} drug={drug} />
            ))}
          </div>
        )}
      </div>

      {/* Form Sheet */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Drug' : 'Add New Drug'}</SheetTitle>
            <SheetDescription>
              {editingId ? 'Update drug information' : 'Add a new drug to your catalog'}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-medium text-foreground">Drug Name</label>
              <Input
                value={formData.drugName}
                onChange={(e) => setFormData({...formData, drugName: e.target.value})}
                placeholder="Brand/Trade name"
                required
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Generic Name</label>
              <Input
                value={formData.genericName}
                onChange={(e) => setFormData({...formData, genericName: e.target.value})}
                placeholder="Generic/Chemical name"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Strength</label>
                <Input
                  value={formData.strength}
                  onChange={(e) => setFormData({...formData, strength: e.target.value})}
                  placeholder="e.g., 500mg"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Form</label>
                <Select value={formData.drugForm} onValueChange={(value) => setFormData({...formData, drugForm: value})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tablet">Tablet</SelectItem>
                    <SelectItem value="Capsule">Capsule</SelectItem>
                    <SelectItem value="Syrup">Syrup</SelectItem>
                    <SelectItem value="Injection">Injection</SelectItem>
                    <SelectItem value="Cream">Cream</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Manufacturer</label>
              <Input
                value={formData.manufacturer}
                onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">NDC Code</label>
              <Input
                value={formData.ndcCode}
                onChange={(e) => setFormData({...formData, ndcCode: e.target.value})}
                placeholder="National Drug Code"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Unit Price</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({...formData, unitPrice: parseFloat(e.target.value)})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Reorder Level</label>
                <Input
                  type="number"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({...formData, reorderLevel: parseInt(e.target.value)})}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isControlled}
                  onChange={(e) => setFormData({...formData, isControlled: e.target.checked})}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm font-medium text-foreground">Controlled Substance</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requiresPrescription}
                  onChange={(e) => setFormData({...formData, requiresPrescription: e.target.checked})}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm font-medium text-foreground">Requires Prescription</span>
              </label>
            </div>

            <div className="flex gap-2 pt-6">
              <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700">
                {editingId ? 'Update Drug' : 'Add Drug'}
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
