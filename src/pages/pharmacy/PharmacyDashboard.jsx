import { useTranslation } from "react-i18next";
import { BarChart3, TrendingUp, Users, ShoppingCart, Pill, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function PharmacyDashboard() {
  const { t } = useTranslation();

  const stats = [
    { label: 'Total Inventory Value', value: '$24,500', icon: ShoppingCart, trend: '+12%' },
    { label: 'Active Medications', value: '156', icon: Pill, trend: '+5' },
    { label: 'Low Stock Alerts', value: '8', icon: AlertTriangle, trend: '-2' },
    { label: 'Total Sales (Today)', value: '$1,240', icon: TrendingUp, trend: '+8%' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pharmacy Dashboard</h1>
        <p className="text-muted-foreground mt-2">Real-time overview of pharmacy operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="p-6 border-l-4 border-l-primary">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                  <p className="text-xs text-green-600 mt-2">{stat.trend} vs last period</p>
                </div>
                <Icon className="w-8 h-8 text-primary opacity-30" />
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 rounded-lg border border-primary/20 hover:bg-primary/5 transition">Add Medication</button>
          <button className="p-4 rounded-lg border border-primary/20 hover:bg-primary/5 transition">Create Sale</button>
          <button className="p-4 rounded-lg border border-primary/20 hover:bg-primary/5 transition">View Reports</button>
          <button className="p-4 rounded-lg border border-primary/20 hover:bg-primary/5 transition">Settings</button>
        </div>
      </Card>
    </div>
  );
}
