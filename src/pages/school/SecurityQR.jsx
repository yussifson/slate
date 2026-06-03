import React from 'react';
import { useTranslation } from 'react-i18next';
import { QrCode, ScanLine, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SecurityQR() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Security & Access</h1>
            <p className="text-sm text-muted-foreground">Manage campus entry with dynamic QR codes</p>
          </div>
        </div>
        <Button className="bg-slate-800 hover:bg-slate-900 text-white gap-2">
          <ScanLine className="w-4 h-4" /> Open Scanner
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-bold mb-2">Your Access Pass</h3>
          <p className="text-xs text-muted-foreground mb-6">Scans automatically at campus gates</p>
          
          <div className="bg-white p-4 rounded-xl shadow-inner border border-slate-200 mb-4">
            {/* Mock QR Code */}
            <div className="w-48 h-48 bg-[url('https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg')] bg-contain bg-no-repeat bg-center opacity-80" />
          </div>
          
          <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-bold bg-green-100 px-4 py-2 rounded-full">
            <ShieldCheck className="w-4 h-4" /> Active until 18:00
          </div>
        </div>

        <div className="lg:col-span-2 bg-card rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h3 className="text-lg font-bold">Recent Scans & Activity</h3>
            <Button variant="outline" size="sm">Download Log</Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground uppercase text-xs sticky top-0">
                <tr>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Location</th>
                  <th className="px-6 py-4 font-semibold">Time</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <tr key={i} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">JD</div>
                      John Doe
                    </td>
                    <td className="px-6 py-4">Student</td>
                    <td className="px-6 py-4">Main Gate East</td>
                    <td className="px-6 py-4 flex items-center gap-1 text-muted-foreground"><Clock className="w-3 h-3" /> 08:{15 + i} AM</td>
                    <td className="px-6 py-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Granted</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
