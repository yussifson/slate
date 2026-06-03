import React from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquareWarning, Search, Filter, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Complaints() {
  const { t } = useTranslation();

  const tickets = [
    { id: 'TKT-001', subject: 'Broken AC in Room 302', author: 'John Doe (Student)', status: 'open', priority: 'high', time: '2 hours ago' },
    { id: 'TKT-002', subject: 'Bus Route Delay Issue', author: 'Sarah Smith (Parent)', status: 'in-progress', priority: 'medium', time: '1 day ago' },
    { id: 'TKT-003', subject: 'Library Account Blocked', author: 'Mike Johnson (Student)', status: 'resolved', priority: 'low', time: '3 days ago' },
    { id: 'TKT-004', subject: 'Dormitory WiFi Down', author: 'Emma Wilson (Student)', status: 'open', priority: 'high', time: '4 hours ago' }
  ];

  return (
    <div className="space-y-6 flex flex-col h-[85vh]">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
            <MessageSquareWarning className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Complaints & Helpdesk</h1>
            <p className="text-sm text-muted-foreground">Manage issues raised by students and parents</p>
          </div>
        </div>
        <Button className="bg-red-600 hover:bg-red-700 text-white">
          Raise Ticket
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search tickets by ID, subject, or author..." className="pl-9 bg-card" />
        </div>
        <Button variant="outline" className="gap-2 bg-card"><Filter className="w-4 h-4" /> Filter</Button>
      </div>

      <div className="flex-1 bg-card rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground uppercase text-xs sticky top-0">
            <tr>
              <th className="px-6 py-4 font-semibold">Ticket ID</th>
              <th className="px-6 py-4 font-semibold">Subject</th>
              <th className="px-6 py-4 font-semibold">Raised By</th>
              <th className="px-6 py-4 font-semibold">Priority</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border overflow-y-auto">
            {tickets.map((tkt, i) => (
              <tr key={i} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 font-mono font-medium text-xs">{tkt.id}</td>
                <td className="px-6 py-4 font-bold">{tkt.subject}</td>
                <td className="px-6 py-4 text-muted-foreground">{tkt.author}</td>
                <td className="px-6 py-4">
                  {tkt.priority === 'high' && <span className="flex items-center gap-1 text-red-600 font-bold text-xs"><AlertCircle className="w-3 h-3"/> High</span>}
                  {tkt.priority === 'medium' && <span className="flex items-center gap-1 text-orange-600 font-bold text-xs"><AlertCircle className="w-3 h-3"/> Med</span>}
                  {tkt.priority === 'low' && <span className="flex items-center gap-1 text-blue-600 font-bold text-xs"><AlertCircle className="w-3 h-3"/> Low</span>}
                </td>
                <td className="px-6 py-4">
                  {tkt.status === 'open' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase">Open</span>}
                  {tkt.status === 'in-progress' && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase">In Progress</span>}
                  {tkt.status === 'resolved' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center w-fit gap-1"><CheckCircle2 className="w-3 h-3"/> Resolved</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="sm">View</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
