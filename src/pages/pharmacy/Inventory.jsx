import { useState, useEffect } from 'react';
import { Plus, AlertCircle, TrendingDown, Package, Calendar } from 'lucide-react';
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

export default function Inventory() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [inventory, setInventory] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    drugId: '',
    batchNumber: '',
    expiryDate: '',
    quantityInStock: 0,
    costPerUnit: 0,
    storageLocation: '',
    warehouseSection: '',
    shelfNumber: '',
    receivedDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const invResult = await PharmacyAPI.getInventory(companyId);
      setInventory(invResult);
      const drugsResult = await PharmacyAPI.getDrugs(companyId);
      setDrugs(drugsResult);
    } catch (e) {
      console.error('[Inventory] Fetch error:', e);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await PharmacyAPI.addInventory(companyId, formData, user.id);
      toast.success('Inventory added successfully');
      setShowForm(false);
      setFormData({
        drugId: '', batchNumber: '', expiryDate: '', quantityInStock: 0,
        costPerUnit: 0, storageLocation: '', warehouseSection: '', shelfNumber: '',
        receivedDate: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const getDrugName = (drugId) => {
    const drug = drugs.find(d => d.id === drugId);
    return drug?.drug_name || 'Unknown';
  };

  const columns = [
    { header: 'Drug Name', accessorKey: 'drug_id', cell: (info) => getDrugName(info.getValue()) },
    { header: 'Batch', accessorKey: 'batch_number' },
    { header: 'Quantity', accessorKey: 'quantity_in_stock' },
    { header: 'Available', accessorKey: 'quantity_available' },
    { header: 'Expiry', accessorKey: 'expiry_date', cell: (info) => {
      const date = info.getValue();
      const isExpired = new Date(date) < new Date();
      return <span className={isExpired ? 'text-red-600 font-bold' : ''}>{date}</span>;
    }},
    { header: 'Location', accessorKey: 'storage_location' }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Inventory Management</h1>
            <p className="text-muted-foreground mt-2">Track stock levels and manage drug inventory</p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Stock
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 border border-border bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-3xl font-bold text-foreground mt-2">{inventory.length}</p>
              </div>
              <Package className="w-10 h-10 text-purple-500" />
            </div>
          </Card>
          <Card className="p-6 border border-border bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-3xl font-bold text-foreground mt-2">{inventory.filter(i => i.quantity_available <= 50).length}</p>
              </div>
              <TrendingDown className="w-10 h-10 text-orange-500" />
            </div>
          </Card>
          <Card className="p-6 border border-border bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-3xl font-bold text-foreground mt-2">{inventory.filter(i => {
                  const expiry = new Date(i.expiry_date);
                  const days = (expiry - new Date()) / (1000 * 60 * 60 * 24);
                  return days < 30 && days > 0;
                }).length}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
          </Card>
        </div>

        <Card className="border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">Loading inventory...</p>
            </div>
          ) : inventory.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No inventory items yet</p>
              <Button onClick={() => setShowForm(true)}>Add first item</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="text-left p-4 font-medium text-foreground">Drug Name</th>
                    <th className="text-left p-4 font-medium text-foreground">Batch</th>
                    <th className="text-left p-4 font-medium text-foreground">Quantity</th>
                    <th className="text-left p-4 font-medium text-foreground">Available</th>
                    <th className="text-left p-4 font-medium text-foreground">Expiry</th>
                    <th className="text-left p-4 font-medium text-foreground">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {inventory.map((item) => {
                    const expiry = new Date(item.expiry_date);
                    const isExpired = expiry < new Date();
                    return (
                      <tr key={item.id} className={isExpired ? 'bg-red-50 dark:bg-red-950' : 'hover:bg-muted/50'}>
                        <td className="p-4">{getDrugName(item.drug_id)}</td>
                        <td className="p-4">{item.batch_number}</td>
                        <td className="p-4">{item.quantity_in_stock}</td>
                        <td className="p-4">{item.quantity_available}</td>
                        <td className={`p-4 ${isExpired ? 'text-red-600 font-bold' : ''}`}>
                          {item.expiry_date}
                        </td>
                        <td className="p-4">{item.storage_location || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add Stock</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-medium text-foreground">Drug</label>
              <Select value={formData.drugId} onValueChange={(value) => setFormData({...formData, drugId: value})}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {drugs.map(drug => (
                    <SelectItem key={drug.id} value={drug.id}>{drug.drug_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Batch Number</label>
                <Input
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Expiry Date</label>
                <Input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                  required
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Quantity</label>
                <Input
                  type="number"
                  value={formData.quantityInStock}
                  onChange={(e) => setFormData({...formData, quantityInStock: parseInt(e.target.value)})}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Cost/Unit</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.costPerUnit}
                  onChange={(e) => setFormData({...formData, costPerUnit: parseFloat(e.target.value)})}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-6">
              <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700">
                Add Stock
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
