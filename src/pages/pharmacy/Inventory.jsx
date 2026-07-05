import { useState, useEffect } from 'react';
import { Plus, AlertCircle, TrendingDown, Package, Calendar, Pencil, Trash2 } from 'lucide-react';
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

export default function Inventory() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [inventory, setInventory] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useViewPreference('pharmacy_inventory', 'list');

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
      if (editingId) {
        await PharmacyAPI.updateInventoryQuantity(companyId, editingId, 0, 'Edit', user.id);
        toast.success('Inventory updated');
      } else {
        await PharmacyAPI.addInventory(companyId, formData, user.id);
        toast.success('Inventory added successfully');
      }
      setShowForm(false);
      setEditingId(null);
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

  const handleDelete = async (id) => {
    if (confirm('Delete this inventory item?')) {
      try {
        await PharmacyAPI.deleteInventory(companyId, id, user.id);
        toast.success('Item deleted');
        fetchData();
      } catch (e) {
        toast.error('Failed to delete item');
      }
    }
  };

  const handleEdit = (item) => {
    setFormData({
      drugId: item.drug_id || '',
      batchNumber: item.batch_number || '',
      expiryDate: item.expiry_date || '',
      quantityInStock: item.quantity_in_stock || 0,
      costPerUnit: item.cost_per_unit || 0,
      storageLocation: item.storage_location || '',
      warehouseSection: item.warehouse_section || '',
      shelfNumber: item.shelf_number || '',
      receivedDate: item.received_date || new Date().toISOString().split('T')[0]
    });
    setEditingId(item.id);
    setShowForm(true);
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
          <div className="flex items-center gap-4">
            <ViewToggle view={view} onViewChange={setView} allowedViews={['grid', 'list', 'kanban']} />
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Stock
            </Button>
          </div>
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

        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading inventory...</div>
        ) : inventory.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-2xl border-border">
            <p className="text-muted-foreground mb-4">No inventory items yet</p>
            <Button onClick={() => setShowForm(true)}>Add first item</Button>
          </div>
        ) : view === 'list' ? (
          <Card className="border border-border/50 bg-card/60 backdrop-blur-sm rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left p-4 font-semibold text-foreground">Drug Name</th>
                    <th className="text-left p-4 font-semibold text-foreground">Batch</th>
                    <th className="text-left p-4 font-semibold text-foreground">Quantity</th>
                    <th className="text-left p-4 font-semibold text-foreground">Available</th>
                    <th className="text-left p-4 font-semibold text-foreground">Expiry</th>
                    <th className="text-left p-4 font-semibold text-foreground">Location</th>
                    <th className="text-right p-4 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {inventory.map((item) => {
                    const expiry = new Date(item.expiry_date);
                    const isExpired = expiry < new Date();
                    return (
                      <tr key={item.id} className={`group ${isExpired ? 'bg-red-50 dark:bg-red-900/10' : 'hover:bg-muted/30 transition-colors'}`}>
                        <td className="p-4 font-bold">{getDrugName(item.drug_id)}</td>
                        <td className="p-4 text-muted-foreground font-mono text-xs">{item.batch_number}</td>
                        <td className="p-4 font-medium">{item.quantity_in_stock}</td>
                        <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">{item.quantity_available}</td>
                        <td className={`p-4 ${isExpired ? 'text-red-600 font-bold' : 'text-muted-foreground'}`}>
                          {item.expiry_date}
                        </td>
                        <td className="p-4 text-muted-foreground">{item.storage_location || '-'}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-7 w-7 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-7 w-7 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {inventory.map((item) => {
              const expiry = new Date(item.expiry_date);
              const isExpired = expiry < new Date();
              const daysToExpiry = (expiry - new Date()) / (1000 * 60 * 60 * 24);
              const isExpiringSoon = daysToExpiry < 30 && daysToExpiry > 0;
              const isLowStock = item.quantity_available <= 50;
              
              return (
                <Card key={item.id} className={`p-5 rounded-3xl border shadow-sm transition-all relative overflow-hidden group ${isExpired ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900' : 'bg-card/60 backdrop-blur-sm border-border/40 hover:shadow-lg hover:border-emerald-500/30'}`}>
                  <div className="absolute top-0 right-0 p-4">
                    {isExpired ? <span className="px-2 py-1 bg-red-100 text-red-800 text-[10px] rounded-full font-bold uppercase tracking-wider">Expired</span>
                    : isExpiringSoon ? <span className="px-2 py-1 bg-orange-100 text-orange-800 text-[10px] rounded-full font-bold uppercase tracking-wider">Expiring</span>
                    : isLowStock ? <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-[10px] rounded-full font-bold uppercase tracking-wider">Low Stock</span>
                    : <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold uppercase tracking-wider">Healthy</span>}
                  </div>
                  {/* Hover actions */}
                  <div className="absolute bottom-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-7 w-7 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-7 w-7 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <h3 className="font-bold text-lg pr-16 mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">{getDrugName(item.drug_id)}</h3>
                  <p className="text-xs text-muted-foreground font-mono mb-4">Batch: {item.batch_number}</p>
                  
                  <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-2xl">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Available</p>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">{item.quantity_available}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">In Stock</p>
                      <p className="font-medium text-foreground">{item.quantity_in_stock}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {item.expiry_date}</span>
                    <span className="truncate max-w-[80px]">{item.storage_location || 'No Location'}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <GenericKanban
            data={inventory.map(item => {
              const expiry = new Date(item.expiry_date);
              const isExpired = expiry < new Date();
              const daysToExpiry = (expiry - new Date()) / (1000 * 60 * 60 * 24);
              const isLow = item.quantity_available <= 50;
              
              let defaultStatus = 'Healthy';
              if (isExpired || (daysToExpiry < 30 && daysToExpiry > 0)) {
                defaultStatus = 'Critical/Expired';
              } else if (isLow) {
                defaultStatus = 'Low Stock';
              }
              
              return {
                ...item,
                computed_status: item.status || defaultStatus,
                drugName: getDrugName(item.drug_id)
              };
            })}
            statusKey="computed_status"
            titleKey="drugName"
            boardKey="pharmacy_inventory"
            defaultStages={['Healthy', 'Low Stock', 'Critical/Expired']}
            onStatusChange={async (itemId, newStatus) => {
              try {
                await PharmacyAPI.updateInventoryStatus(companyId, itemId, newStatus, user.id);
                toast.success(`Moved to ${newStatus}`);
                fetchData();
              } catch (e) {
                toast.error('Failed to update status');
              }
            }}
          />
        )}
      </div>

      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Inventory Item' : 'Add Stock'}</SheetTitle>
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
