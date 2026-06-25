import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Search, Plus, Users, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function Customers() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const customers = [
    { id: 'CUST001', name: 'John Doe', phone: '+1 (555) 123-4567', email: 'john@example.com', totalPurchases: 12, lastPurchase: '2025-06-25', status: 'Active' },
    { id: 'CUST002', name: 'Jane Smith', phone: '+1 (555) 234-5678', email: 'jane@example.com', totalPurchases: 8, lastPurchase: '2025-06-25', status: 'Active' },
    { id: 'CUST003', name: 'Bob Wilson', phone: '+1 (555) 345-6789', email: 'bob@example.com', totalPurchases: 5, lastPurchase: '2025-06-24', status: 'Active' },
    { id: 'CUST004', name: 'Alice Brown', phone: '+1 (555) 456-7890', email: 'alice@example.com', totalPurchases: 1, lastPurchase: '2025-06-23', status: 'Inactive' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage pharmacy customers and their purchase history</p>
        </div>
        <Button className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Customer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Total Customers</p>
          <p className="text-3xl font-bold text-foreground mt-2">{customers.length}</p>
          <p className="text-xs text-green-600 mt-2">+2 this month</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Active Customers</p>
          <p className="text-3xl font-bold text-foreground mt-2">{customers.filter(c => c.status === 'Active').length}</p>
          <p className="text-xs text-muted-foreground mt-2">Regular buyers</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Avg Purchases</p>
          <p className="text-3xl font-bold text-foreground mt-2">{(customers.reduce((sum, c) => sum + c.totalPurchases, 0) / customers.length).toFixed(0)}</p>
          <p className="text-xs text-muted-foreground mt-2">Per customer</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Search className="absolute w-4 h-4 text-muted-foreground mt-3 ml-3" />
            <Input 
              placeholder="Search by name, phone, or email..." 
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
                <th className="px-6 py-3 text-left font-bold text-muted-foreground">Customer</th>
                <th className="px-6 py-3 text-left font-bold text-muted-foreground">Contact</th>
                <th className="px-6 py-3 text-left font-bold text-muted-foreground">Email</th>
                <th className="px-6 py-3 text-left font-bold text-muted-foreground">Purchases</th>
                <th className="px-6 py-3 text-left font-bold text-muted-foreground">Last Purchase</th>
                <th className="px-6 py-3 text-left font-bold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map(customer => (
                <tr key={customer.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4">
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">{customer.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4" />
                      {customer.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4" />
                      {customer.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">{customer.totalPurchases}</td>
                  <td className="px-6 py-4">{customer.lastPurchase}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${customer.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {customer.status}
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
