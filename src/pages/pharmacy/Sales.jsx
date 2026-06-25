import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Search, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function Sales() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const sales = [
    { id: 'SALE001', date: '2025-06-25', customer: 'John Doe', items: 3, total: '$45.50', status: 'Completed' },
    { id: 'SALE002', date: '2025-06-25', customer: 'Jane Smith', items: 2, total: '$32.00', status: 'Completed' },
    { id: 'SALE003', date: '2025-06-24', customer: 'Bob Wilson', items: 5, total: '$125.75', status: 'Completed' },
    { id: 'SALE004', date: '2025-06-24', customer: 'Alice Brown', items: 1, total: '$15.99', status: 'Pending' },
  ];

  const totalSalesToday = sales.filter(s => s.date === '2025-06-25').reduce((sum, s) => sum + parseFloat(s.total.slice(1)), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track and manage pharmacy sales transactions</p>
        </div>
        <Button className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Sale
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Today's Sales</p>
          <p className="text-3xl font-bold text-foreground mt-2">${totalSalesToday.toFixed(2)}</p>
          <p className="text-xs text-green-600 mt-2">+12% from yesterday</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Transactions</p>
          <p className="text-3xl font-bold text-foreground mt-2">{sales.filter(s => s.date === '2025-06-25').length}</p>
          <p className="text-xs text-muted-foreground mt-2">Completed today</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Avg Transaction</p>
          <p className="text-3xl font-bold text-foreground mt-2">${(totalSalesToday / sales.filter(s => s.date === '2025-06-25').length).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-2">Average value</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Search className="absolute w-4 h-4 text-muted-foreground mt-3 ml-3" />
            <Input 
              placeholder="Search by sale ID or customer..." 
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
                <th className="px-6 py-3 text-left font-bold text-muted-foreground">Sale ID</th>
                <th className="px-6 py-3 text-left font-bold text-muted-foreground">Date</th>
                <th className="px-6 py-3 text-left font-bold text-muted-foreground">Customer</th>
                <th className="px-6 py-3 text-left font-bold text-muted-foreground">Items</th>
                <th className="px-6 py-3 text-left font-bold text-muted-foreground">Total</th>
                <th className="px-6 py-3 text-left font-bold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sales.map(sale => (
                <tr key={sale.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 font-mono text-xs text-primary">{sale.id}</td>
                  <td className="px-6 py-4">{sale.date}</td>
                  <td className="px-6 py-4">{sale.customer}</td>
                  <td className="px-6 py-4">{sale.items}</td>
                  <td className="px-6 py-4 font-bold">{sale.total}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${sale.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {sale.status}
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
