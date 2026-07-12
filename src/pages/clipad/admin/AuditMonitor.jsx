import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { ShieldAlert, Globe, Activity, Clock } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrbitLoader } from '@/components/ui/orbit-loader';
import { format } from 'date-fns';

export default function AuditMonitor() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    // Fetch last 100 audit logs
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, companies(name)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error) setLogs(data || []);
    setLoading(false);
  }

  if (loading) return <div className="flex h-full items-center justify-center"><OrbitLoader /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Monitor</h1>
        <p className="text-muted-foreground mt-2">Real-time system behavior monitoring, IP tracking, and login analytics.</p>
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><Clock className="w-4 h-4 inline mr-1" /> Timestamp</TableHead>
              <TableHead>User / Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead><Activity className="w-4 h-4 inline mr-1" /> Action</TableHead>
              <TableHead><Globe className="w-4 h-4 inline mr-1" /> IP & Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm whitespace-nowrap">
                  {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                </TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{log.user_name || 'Unknown User'}</div>
                  <div className="text-xs text-muted-foreground">{log.user_email || log.user_id}</div>
                </TableCell>
                <TableCell className="text-sm">{log.companies?.name || 'N/A'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-md text-xs font-medium uppercase ${
                    log.action === 'login' ? 'bg-blue-500/10 text-blue-500' :
                    log.action === 'impersonate' ? 'bg-purple-500/10 text-purple-500' :
                    'bg-slate-500/10 text-slate-500'
                  }`}>
                    {log.action}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-mono">{log.ip_address || 'Unknown IP'}</div>
                  {log.details && log.details.includes('Country:') && (
                    <div className="text-xs text-muted-foreground">{log.details.split('Country:')[1]}</div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No audit logs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
