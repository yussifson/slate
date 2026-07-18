import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { Banknote, Calendar, Award, FileText, TrendingUp, User, ChevronRight, Clock, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

function PortalCard({ icon: Icon, label, value, color = 'bg-primary/10 text-primary' }) {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function EmployeePortal() {
  const { user } = useAuth();

  const { data: employee } = useQuery({
    queryKey: ['portal-employee', user?.id],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT * FROM univ_hr_employees WHERE user_id = ? AND company_id = ? LIMIT 1`,
        [user?.id, user?.company_id]
      );
      return rows?.[0] || null;
    },
    enabled: !!user?.id,
  });

  const { data: payslips = [] } = useQuery({
    queryKey: ['portal-payslips', employee?.id],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT * FROM payroll_records WHERE employee_id = ? ORDER BY created_at DESC LIMIT 6`,
        [employee?.id]
      );
      return rows || [];
    },
    enabled: !!employee?.id,
  });

  const { data: leaveRequests = [] } = useQuery({
    queryKey: ['portal-leave', employee?.id],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT * FROM leave_requests WHERE employee_id = ? ORDER BY created_at DESC LIMIT 5`,
        [employee?.id]
      );
      return rows || [];
    },
    enabled: !!employee?.id,
  });

  const statusColor = (s) => ({
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  }[s] || 'bg-slate-100 text-slate-600 dark:bg-secondary dark:text-muted-foreground');

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-2xl font-bold">
          {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.full_name?.split(' ')[0] || 'Employee'}</h1>
          <p className="text-muted-foreground text-sm">{employee?.department || 'Employee'} · {employee?.job_title || ''}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <PortalCard icon={Banknote} label="Payslips Available" value={payslips.length} color="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" />
        <PortalCard icon={Calendar} label="Leave Requests" value={leaveRequests.length} color="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" />
        <PortalCard icon={Award} label="Leave Balance" value={`${employee?.leave_balance ?? 0} days`} color="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400" />
        <PortalCard icon={TrendingUp} label="Performance" value={employee?.performance_rating || '—'} color="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400" />
      </div>

      {/* Payslips */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><Banknote className="w-4 h-4 text-primary" /> Payslips</h2>
        </div>
        {payslips.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No payslips available yet.</div>
        ) : (
          <div className="divide-y divide-border/50">
            {payslips.map(p => (
              <div key={p.id} className="px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div>
                  <p className="font-medium text-sm">{p.period || format(new Date(p.created_at), 'MMMM yyyy')}</p>
                  <p className="text-xs text-muted-foreground">{p.status || 'Processed'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm">{p.net_pay ? `GHS ${Number(p.net_pay).toLocaleString()}` : '—'}</span>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs"><FileText className="w-3 h-3" /> View</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leave Requests */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> My Leave Requests</h2>
          <Button size="sm" variant="outline" className="text-xs">New Request</Button>
        </div>
        {leaveRequests.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No leave requests found.</div>
        ) : (
          <div className="divide-y divide-border/50">
            {leaveRequests.map(l => (
              <div key={l.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{l.leave_type || 'Leave'}</p>
                  <p className="text-xs text-muted-foreground">
                    {l.start_date ? format(new Date(l.start_date), 'dd MMM yyyy') : '—'} — {l.end_date ? format(new Date(l.end_date), 'dd MMM yyyy') : '—'}
                  </p>
                </div>
                <Badge className={`text-xs ${statusColor(l.status)}`}>{l.status || 'pending'}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
