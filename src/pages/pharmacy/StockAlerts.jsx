import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { AlertTriangle, TrendingDown, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function StockAlerts() {
  const { t } = useTranslation();
  const [selectedAlert, setSelectedAlert] = useState(null);

  const alerts = [
    { id: 1, medication: 'Paracetamol 500mg', currentStock: 5, reorderLevel: 20, status: 'Critical', date: '2025-06-25' },
    { id: 2, medication: 'Amoxicillin 250mg', currentStock: 12, reorderLevel: 25, status: 'Low', date: '2025-06-25' },
    { id: 3, medication: 'Ibuprofen 400mg', currentStock: 3, reorderLevel: 15, status: 'Critical', date: '2025-06-24' },
    { id: 4, medication: 'Aspirin 100mg', currentStock: 8, reorderLevel: 30, status: 'Low', date: '2025-06-24' },
    { id: 5, medication: 'Vitamin C 1000mg', currentStock: 2, reorderLevel: 10, status: 'Critical', date: '2025-06-23' },
  ];

  const criticalCount = alerts.filter(a => a.status === 'Critical').length;
  const lowCount = alerts.filter(a => a.status === 'Low').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Stock Alerts</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Monitor low and critical stock levels</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Critical Stock</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{criticalCount}</p>
              <p className="text-xs text-red-500 mt-2">Requires immediate action</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500 opacity-30" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Low Stock</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{lowCount}</p>
              <p className="text-xs text-yellow-600 mt-2">Order soon</p>
            </div>
            <TrendingDown className="w-8 h-8 text-yellow-500 opacity-30" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Adequate Stock</p>
              <p className="text-3xl font-bold text-green-600 mt-2">18</p>
              <p className="text-xs text-green-600 mt-2">Well stocked</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500 opacity-30" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Alert Details</h2>
        <div className="space-y-3">
          {alerts.map(alert => (
            <div key={alert.id} className={`p-4 rounded-lg border-l-4 cursor-pointer transition ${alert.status === 'Critical' ? 'border-l-red-500 bg-red-50' : 'border-l-yellow-500 bg-yellow-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-bold text-foreground">{alert.medication}</p>
                  <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Current Stock</p>
                      <p className="font-bold text-foreground">{alert.currentStock} units</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Reorder Level</p>
                      <p className="font-bold text-foreground">{alert.reorderLevel} units</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Date Noted</p>
                      <p className="font-bold text-foreground">{alert.date}</p>
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-4 ${alert.status === 'Critical' ? 'bg-red-200 text-red-700' : 'bg-yellow-200 text-yellow-700'}`}>
                  {alert.status}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="text-xs">Create PO</Button>
                <Button size="sm" variant="outline" className="text-xs">Mark as Resolved</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
