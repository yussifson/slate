import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { Home, UserCheck, Settings, AlertTriangle, Plus, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function UniHostel() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState([
    { id: "MNT-2041", room: "Block A, Room 302", issue: "Faulty AC Unit", priority: "High", status: "Assigned" },
    { id: "MNT-2045", room: "Block B, Room 104", issue: "Broken shower head", priority: "Medium", status: "Pending" }
  ]);

  return (
    <div className="space-y-6">
      <ModuleBanner 
        title={t("uni_hostel", "Hostel & Housing Management")} 
        subtitle="Manage residential accommodations, allocate student rooms, and track campus maintenance requests." 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Bed Capacity</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">2,400</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Home className="w-6 h-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">Occupied Beds</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">2,150 (89.5%)</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Work Orders</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{tickets.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Settings className="w-6 h-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Urgent Faults</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">1</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Hostel Maintenance Tickets</CardTitle>
              <CardDescription>Active repairs and service reports submitted by residents.</CardDescription>
            </div>
            <Button size="sm" className="bg-primary hover:bg-primary/95 text-white gap-1">
              <Plus className="w-4 h-4" /> Log Ticket
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {tickets.map((t, idx) => (
              <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800 border rounded-xl flex justify-between items-center text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{t.room}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{t.id}</span>
                  </div>
                  <p className="text-slate-500 mt-1">{t.issue} · Priority: <strong className={t.priority === 'High' ? 'text-red-650' : 'text-amber-600'}>{t.priority}</strong></p>
                </div>
                <span className={`px-2.5 py-1 rounded font-bold text-[10px] ${t.status === 'Assigned' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'}`}>
                  {t.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle>Hostel Allocation Hub</CardTitle>
            <CardDescription>Allocate students to hostel blocks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-xs font-semibold text-slate-700">
              <div className="flex justify-between items-center pb-2 border-b">
                <span>Block A (Male Undergraduate)</span>
                <span>95% Full</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span>Block B (Female Undergraduate)</span>
                <span>88% Full</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Block C (Postgraduate/Masters)</span>
                <span>72% Full</span>
              </div>
            </div>
            <Button size="sm" className="w-full bg-primary hover:bg-primary/95 text-white gap-1 mt-2">
              <ClipboardList className="w-4 h-4" /> Run Room Allocations
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
