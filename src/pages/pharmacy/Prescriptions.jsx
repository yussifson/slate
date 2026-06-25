import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Search, Plus, FileText, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function Prescriptions() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const prescriptions = [
    { id: 'RX001', patient: 'John Doe', doctor: 'Dr. Smith', date: '2025-06-25', status: 'Active', medication: 'Paracetamol 500mg', quantity: 30 },
    { id: 'RX002', patient: 'Jane Doe', doctor: 'Dr. Johnson', date: '2025-06-24', status: 'Active', medication: 'Amoxicillin 250mg', quantity: 10 },
    { id: 'RX003', patient: 'Bob Wilson', doctor: 'Dr. Smith', date: '2025-06-23', status: 'Completed', medication: 'Ibuprofen 400mg', quantity: 20 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prescriptions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and track all prescriptions</p>
        </div>
        <Button className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Prescription
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Search className="absolute w-4 h-4 text-muted-foreground mt-3 ml-3" />
            <Input 
              placeholder="Search by patient, doctor, or RX number..." 
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
                <th className="px-6 py-3 text-left font-bold text-muted-foreground">RX ID</th>
                <th className="px-6 py-3 text-left font-bold text-muted-foreground">Patient</th>
                <th className="px-6 py-3 text-left font-bold text-muted-foreground">Doctor</th>
                <th className="px-6 py-3 text-left font-bold text-muted-foreground">Medication</th>
                <th className="px-6 py-3 text-left font-bold text-muted-foreground">Qty</th>
                <th className="px-6 py-3 text-left font-bold text-muted-foreground">Date</th>
                <th className="px-6 py-3 text-left font-bold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {prescriptions.map(rx => (
                <tr key={rx.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 font-mono text-xs text-primary">{rx.id}</td>
                  <td className="px-6 py-4">{rx.patient}</td>
                  <td className="px-6 py-4">{rx.doctor}</td>
                  <td className="px-6 py-4">{rx.medication}</td>
                  <td className="px-6 py-4">{rx.quantity}</td>
                  <td className="px-6 py-4">{rx.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${rx.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {rx.status}
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
