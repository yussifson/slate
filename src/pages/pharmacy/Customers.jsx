import { useState, useEffect } from 'react';
import { Plus, Search, Users, Mail, Phone } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { usePowerSync } from '@powersync/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'react-hot-toast';
import PharmacyAPI from '@/api/PharmacyAPI';

export default function Customers() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    insuranceProvider: '',
    insuranceId: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, [companyId]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const result = await PharmacyAPI.getCustomers(companyId);
      setCustomers(result);
    } catch (e) {
      console.error('[Customers] Fetch error:', e);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await PharmacyAPI.createCustomer(companyId, formData, user.id);
      toast.success('Customer created');
      setShowForm(false);
      setFormData({customerName: '', phone: '', email: '', address: '', city: '', insuranceProvider: '', insuranceId: ''});
      fetchCustomers();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Customers</h1>
            <p className="text-muted-foreground mt-2">Manage patient information</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>

        <Card className="p-4 mb-6 border border-border bg-card">
          <Input placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </Card>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map(c => (
              <Card key={c.id} className="p-5 border border-border bg-card hover:shadow-lg transition-shadow">
                <h3 className="font-bold text-lg text-foreground mb-3">{c.customer_name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{c.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{c.email || '-'}</span>
                  </div>
                  {c.insurance_provider && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">Insurance</p>
                      <p className="font-medium text-foreground">{c.insurance_provider}</p>
                    </div>
                  )}
                  <div className="pt-2 text-xs text-muted-foreground">
                    Total Spent: <span className="font-bold text-primary">${(c.total_spent || 0).toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Sheet open={showForm} onOpenChange={setShowForm}>
          <SheetContent className="w-full max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Add Customer</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div>
                <label className="text-sm font-medium text-foreground">Name</label>
                <Input value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} required className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Phone</label>
                <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Insurance Provider</label>
                <Input value={formData.insuranceProvider} onChange={(e) => setFormData({...formData, insuranceProvider: e.target.value})} className="mt-1" />
              </div>
              <div className="flex gap-2 pt-6">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700">Add</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
