import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { ShieldAlert, Globe, Activity, Clock, Filter, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrbitLoader } from '@/components/ui/orbit-loader';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export default function AuditMonitor() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('7d');
  
  useEffect(() => {
    fetchLogs();
  }, [actionFilter, dateFilter]);

  async function fetchLogs() {
    setLoading(true);
    let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200);

    if (actionFilter !== 'all') {
      query = query.eq('action', actionFilter);
    }
    
    if (dateFilter !== 'all') {
      const date = new Date();
      if (dateFilter === '24h') date.setDate(date.getDate() - 1);
      if (dateFilter === '7d') date.setDate(date.getDate() - 7);
      if (dateFilter === '30d') date.setDate(date.getDate() - 30);
      if (dateFilter === '1y') date.setFullYear(date.getFullYear() - 1);
      query = query.gte('created_at', date.toISOString());
    }

    const { data, error } = await query;
    if (!error) setLogs(data || []);
    setLoading(false);
  }

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (log.user_name && log.user_name.toLowerCase().includes(term)) ||
      (log.user_email && log.user_email.toLowerCase().includes(term)) ||
      (log.action && log.action.toLowerCase().includes(term)) ||
      (log.ip_address && log.ip_address.includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Monitor</h1>
        <p className="text-muted-foreground mt-2">Real-time system behavior monitoring, IP tracking, and deep historical analytics.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end bg-card p-4 rounded-xl border border-border">
        <div className="flex-1 space-y-1 w-full">
          <label className="text-xs font-semibold text-muted-foreground ml-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search email, name, IP..." 
              className="pl-9"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-1 w-full md:w-48">
          <label className="text-xs font-semibold text-muted-foreground ml-1">Action Type</label>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger><SelectValue placeholder="All Actions" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="login">Logins</SelectItem>
              <SelectItem value="impersonate">Impersonations</SelectItem>
              <SelectItem value="error">Errors</SelectItem>
              <SelectItem value="update">Updates</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 w-full md:w-48">
          <label className="text-xs font-semibold text-muted-foreground ml-1">Time Range</label>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger><SelectValue placeholder="Past 7 Days" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Past 24 Hours</SelectItem>
              <SelectItem value="7d">Past 7 Days</SelectItem>
              <SelectItem value="30d">Past 30 Days</SelectItem>
              <SelectItem value="1y">Past Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={fetchLogs} className="gap-2 shrink-0 h-10 w-full md:w-auto">
          <Filter className="w-4 h-4" /> Refresh
        </Button>
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><Clock className="w-4 h-4 inline mr-1" /> Timestamp</TableHead>
              <TableHead>User / Email</TableHead>
              <TableHead>Company ID</TableHead>
              <TableHead><Activity className="w-4 h-4 inline mr-1" /> Action</TableHead>
              <TableHead><Globe className="w-4 h-4 inline mr-1" /> IP & Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex justify-center"><OrbitLoader /></div>
                </TableCell>
              </TableRow>
            ) : filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm whitespace-nowrap">
                    {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{log.user_name || 'Unknown User'}</div>
                    <div className="text-xs text-muted-foreground">{log.user_email || log.user_id}</div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500 font-mono">
                    {log.company_id ? log.company_id.substring(0, 8) + '...' : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-md text-xs font-medium uppercase ${
                      log.action === 'login' ? 'bg-blue-500/10 text-blue-500' :
                      log.action === 'impersonate' ? 'bg-purple-500/10 text-purple-500' :
                      log.action === 'error' ? 'bg-red-500/10 text-red-500' :
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No audit logs found matching the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
