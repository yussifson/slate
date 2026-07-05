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
import ViewToggle from '@/components/shared/ViewToggle';
import { useViewPreference } from '@/hooks/useViewPreference';

export default function Drugs() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [drugs, setDrugs] = useState([]);
  const [filteredDrugs, setFilteredDrugs] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useViewPreference('pharmacy_drugs', 'grid');

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
    <div className="group bg-card/60 backdrop-blur-sm border border-border/40 rounded-3xl p-6 hover:shadow-xl hover:border-emerald-500/30 transition-all relative overflow-hidden flex flex-col h-full">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-bl-full -mr-10 -mt-10 pointer-events-none opacity-90" />
      
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-foreground group-hover:text-emerald-600 transition-colors pr-2">{drug.drug_name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{drug.generic_name}</p>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          {drug.is_controlled && (
            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600" title="Controlled Substance">
              <Shield className="w-4 h-4" />
            </div>
          )}
          {drug.requires_prescription && (
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600" title="Requires Prescription">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 text-sm flex-1 bg-muted/20 p-4 rounded-2xl border border-border/30">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Strength</p>
          <p className="font-medium text-foreground">{drug.strength || '-'}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Price</p>
          <p className="font-bold text-emerald-600 dark:text-emerald-400">${parseFloat(drug.unit_price || 0).toFixed(2)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Manufacturer</p>
          <p className="font-medium text-foreground text-xs line-clamp-1">{drug.manufacturer || '-'}</p>
        </div>
      </div>

      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button
          size="icon"
          variant="secondary"
          onClick={() => {
            setFormData({...drug, isControlled: !!drug.is_controlled, requiresPrescription: !!drug.requires_prescription});
            setEditingId(drug.id);
            setShowForm(true);
          }}
          className="h-8 w-8 bg-white/80 dark:bg-black/80 backdrop-blur-sm hover:bg-emerald-500 hover:text-white text-emerald-600 transition-colors border-0 shadow-sm"
          title="Edit Drug"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="destructive"
          onClick={async () => {
            if(window.confirm('Are you sure you want to delete this drug?')) {
              try {
                await PharmacyAPI.deleteDrug(companyId, drug.id, user.id);
                fetchDrugs();
                toast.success('Drug deleted');
              } catch (e) {
                toast.error(e.message);
              }
            }
          }}
          className="h-8 w-8 bg-red-100/80 dark:bg-red-900/80 backdrop-blur-sm hover:bg-red-500 text-red-600 hover:text-white transition-colors border-0 shadow-sm"
          title="Delete Drug"
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
          <div className="flex items-center gap-4">
            <ViewToggle view={view} onViewChange={setView} allowedViews={['grid', 'list']} />
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
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Drug
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="p-2 px-4 mb-6 border border-border/50 bg-card/50 backdrop-blur-md flex items-center rounded-2xl shadow-sm">
          <div className="relative flex-1 flex items-center">
            <Search className="w-5 h-5 text-muted-foreground mr-2" />
            <Input
              placeholder="Search by drug name, generic name, or NDC code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 px-0 shadow-none text-base flex-1"
            />
          </div>
        </Card>

        {/* Drug Grid/List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading drugs...</div>
        ) : filteredDrugs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed rounded-2xl border-border">No drugs found.</div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDrugs.map(drug => (
              <DrugCard key={drug.id} drug={drug} />
            ))}
          </div>
        ) : (
          <Card className="border border-border/50 bg-card/60 backdrop-blur-sm rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="p-4 font-semibold text-foreground">Drug Name</th>
                    <th className="p-4 font-semibold text-foreground">Strength & Form</th>
                    <th className="p-4 font-semibold text-foreground">Manufacturer</th>
                    <th className="p-4 font-semibold text-foreground">Price</th>
                    <th className="p-4 font-semibold text-foreground">Flags</th>
                    <th className="p-4 font-semibold text-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredDrugs.map(drug => (
                    <tr key={drug.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-foreground">{drug.drug_name}</p>
                        <p className="text-xs text-muted-foreground">{drug.generic_name}</p>
                      </td>
                      <td className="p-4 text-muted-foreground">{drug.strength} {drug.drug_form}</td>
                      <td className="p-4 text-muted-foreground">{drug.manufacturer}</td>
                      <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">${parseFloat(drug.unit_price || 0).toFixed(2)}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {drug.is_controlled && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">Controlled</span>}
                          {drug.requires_prescription && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Rx</span>}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-emerald-50 text-emerald-600 dark:hover:bg-emerald-900/30" onClick={() => { setFormData({...drug, isControlled: !!drug.is_controlled, requiresPrescription: !!drug.requires_prescription}); setEditingId(drug.id); setShowForm(true); }}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-red-50 text-red-600 dark:hover:bg-red-900/30" onClick={async () => {
                            if(window.confirm('Are you sure you want to delete this drug?')) {
                              try {
                                await PharmacyAPI.deleteDrug(companyId, drug.id, user.id);
                                fetchDrugs();
                                toast.success('Drug deleted');
                              } catch (e) {
                                toast.error(e.message);
                              }
                            }
                          }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
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
