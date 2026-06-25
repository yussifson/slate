import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Search, Plus, Building2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function Suppliers() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const suppliers = [
    { id: 'SUP001', name: 'Pharma Distributors Inc', contact: '+1 (555) 111-2222', email: 'sales@pharmadist.com', products: 45, lastOrder: '2025-06-20', status: 'Active' },
    { id: 'SUP002', name: 'Global Medical Supply', contact: '+1 (555) 222-3333', email: 'orders@globalmedical.com', products: 32, lastOrder: '2025-06-18', status: 'Active' },
    { id: 'SUP003', name: 'HealthCare Wholesale', contact: '+1 (555) 333-4444', email: 'wholesale@hcw.com', products: 28, lastOrder: '2025-06-15', status: 'Inactive' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Suppliers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage medication suppliers and orders</p>
        </div>
        <Button className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Supplier
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Total Suppliers</p>
          <p className="text-3xl font-bold text-foreground mt-2">{suppliers.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Active Suppliers</p>
          <p className="text-3xl font-bold text-foreground mt-2">{suppliers.filter(s => s.status === 'Active').length}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Search className="absolute w-4 h-4 text-muted-foreground mt-3 ml-3" />
            <Input 
              placeholder="Search by supplier name or contact..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left font-bold text-muted-foreground">Supplier</th>
                <th className="px-6 py-3 text-left font-bold text-muted-foreground">Contact</th>
                <th className="px-6 py-3 text-left font-bold text-muted-foreground">Email</th>
                <th className="px-6 py-3 text-left font-bold text-muted-foreground">Products</th>
                <th className="px-6 py-3 text-left font-bold text-muted-foreground">Last Order</th>
                <th className="px-6 py-3 text-left font-bold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {suppliers.map(supplier => (
                <tr key={supplier.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4">
                    <p className="font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      {supplier.name}
                    </p>
                  </td>
                  <td className="px-6 py-4">{supplier.contact}</td>
                  <td className="px-6 py-4 text-sm text-primary">{supplier.email}</td>
                  <td className="px-6 py-4">{supplier.products}</td>
                  <td className="px-6 py-4">{supplier.lastOrder}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${supplier.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {supplier.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
