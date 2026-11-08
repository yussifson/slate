import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon, Clock, User, Eye, ChevronLeft, ChevronRight,
  Plus, Search, Edit, Trash2, CheckCircle2,
  RefreshCw, Building2
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { toast } from 'react-hot-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled Tour', badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30' },
  completed: { label: 'Tour Completed', badge: 'bg-[#005A9C]/10 text-emerald-700 dark:text-emerald-400 border-[#005A9C]/30' },
  cancelled: { label: 'Cancelled', badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30' },
  rescheduled: { label: 'Rescheduled', badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30' }
};

export default function JCLViewings() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [viewings, setViewings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Sheets & Modals
  const [showFormSheet, setShowFormSheet] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [inspectorViewing, setInspectorViewing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    propertyId: '',
    propertyAddress: '',
    clientId: '',
    clientName: '',
    agentName: user?.user_metadata?.full_name || 'Assigned Broker',
    viewingDate: format(new Date(), 'yyyy-MM-dd'),
    viewingTime: '10:00 AM',
    durationMinutes: 45,
    status: 'scheduled',
    feedback: '',
    notes: ''
  });

  const fetchViewingsData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const [viewRes, propRes, clientRes] = await Promise.all([
        powerSync.execute('SELECT * FROM univ_re_viewings WHERE company_id = ? ORDER BY viewing_date DESC', [companyId]),
        powerSync.execute('SELECT * FROM univ_re_properties WHERE company_id = ? ORDER BY address ASC', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM univ_re_clients WHERE company_id = ? ORDER BY name ASC', [companyId]).catch(() => ({ rows: [] }))
      ]);

      const viewList = viewRes.rows._array || Array.from(viewRes.rows || []);
      const propList = propRes.rows._array || Array.from(propRes.rows || []);
      const clientList = clientRes.rows._array || Array.from(clientRes.rows || []);

      setViewings(viewList);
      setProperties(propList);
      setClients(clientList);
    } catch (_err) {
      toast.error('Failed to load viewings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchViewingsData();
  }, [companyId]);
  // Statistics
  const stats = useMemo(() => {
    const list = filteredViewings;
    const total = list.length;
    const scheduled = list.filter(v => v.status === 'scheduled').length;
    const completed = list.filter(v => v.status === 'completed').length;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayCount = list.filter(v => v.viewing_date === todayStr).length;

    return { total, scheduled, completed, todayCount };
  }, [filteredViewings]);

  const isAdmin = ['company_admin', 'super_admin', 'admin', 'managing_partner', 'owner'].includes((user?.role || '').toLowerCase());

  // Filtered viewings (Enforce Department Isolation: Non-admin staff only see their own assigned viewings)
  const filteredViewings = useMemo(() => {
    return viewings.filter(v => {
      // Access isolation: if not admin, view must belong to user
      if (!isAdmin && user?.id) {
        const isOwner = v.agent_id === user.id || 
                        v.agent_name?.toLowerCase() === (user.email || '').toLowerCase() ||
                        v.agent_name?.toLowerCase() === (user.user_metadata?.full_name || '').toLowerCase();
        if (!isOwner) return false;
      }
      const matchSearch = !search ||
        v.property_address?.toLowerCase().includes(search.toLowerCase()) ||
        v.client_name?.toLowerCase().includes(search.toLowerCase()) ||
        v.agent_name?.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'all' || v.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [viewings, search, statusFilter]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      propertyId: properties[0]?.id || '',
      propertyAddress: properties[0]?.address || '',
      clientId: clients[0]?.id || '',
      clientName: clients[0]?.name || '',
      agentName: user?.user_metadata?.full_name || 'Assigned Broker',
      viewingDate: format(new Date(), 'yyyy-MM-dd'),
      viewingTime: '10:00 AM',
      durationMinutes: 45,
      status: 'scheduled',
      feedback: '',
      notes: ''
    });
    setShowFormSheet(true);
  };

  const handleOpenEdit = (v) => {
    setEditingId(v.id);
    setFormData({
      propertyId: v.property_id || '',
      propertyAddress: v.property_address || '',
      clientId: v.client_id || '',
      clientName: v.client_name || '',
      agentName: v.agent_name || '',
      viewingDate: v.viewing_date || '',
      viewingTime: v.viewing_time || '',
      durationMinutes: v.duration_minutes || 45,
      status: v.status || 'scheduled',
      feedback: v.feedback || '',
      notes: v.notes || ''
    });
    setShowFormSheet(true);
  };

  const handleSaveViewing = async (e) => {
    e.preventDefault();
    if (!formData.propertyAddress || !formData.clientName) {
      toast.error('Property address and client name are required');
      return;
    }

    try {
      const now = new Date().toISOString();

      if (editingId) {
        await powerSync.execute(
          `UPDATE univ_re_viewings SET
            property_id = ?, property_address = ?, client_id = ?, client_name = ?,
            agent_name = ?, viewing_date = ?, viewing_time = ?, duration_minutes = ?,
            status = ?, feedback = ?, notes = ?
          WHERE id = ? AND company_id = ?`,
          [
            formData.propertyId || null, formData.propertyAddress,
            formData.clientId || null, formData.clientName,
            formData.agentName || null, formData.viewingDate,
            formData.viewingTime || null, Number(formData.durationMinutes) || 45,
            formData.status, formData.feedback || null, formData.notes || null,
            editingId, companyId
          ]
        );
        toast.success('Viewing updated');
      } else {
        const newId = generateUUID();
        await powerSync.execute(
          `INSERT INTO univ_re_viewings (
            id, created_at, company_id, property_id, property_address,
            client_id, client_name, agent_id, agent_name, viewing_date,
            viewing_time, status, duration_minutes, feedback, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId, now, companyId,
            formData.propertyId || null, formData.propertyAddress,
            formData.clientId || null, formData.clientName,
            user?.id || null, formData.agentName || null,
            formData.viewingDate, formData.viewingTime || null,
            formData.status, Number(formData.durationMinutes) || 45,
            formData.feedback || null, formData.notes || null
          ]
        );
        toast.success('Viewing scheduled');
      }

      setShowFormSheet(false);
      fetchViewingsData();
      if (inspectorViewing && inspectorViewing.id === editingId) {
        setInspectorViewing(prev => ({ ...prev, ...formData }));
      }
    } catch (_err) {
      toast.error('Failed to save viewing');
    }
  };

  const handleDeleteViewing = async () => {
    if (!deleteTarget) return;
    try {
      await powerSync.execute(
        `DELETE FROM univ_re_viewings WHERE id = ? AND company_id = ?`,
        [deleteTarget.id, companyId]
      );
      toast.success('Viewing deleted');
      setDeleteTarget(null);
      if (inspectorViewing?.id === deleteTarget.id) setInspectorViewing(null);
      fetchViewingsData();
    } catch (_err) {
      toast.error('Failed to delete viewing');
    }
  };

  // Calendar Day Generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="p-2 sm:p-4 md:p-6 pb-24 w-full max-w-full space-y-4 sm:space-y-6 font-sans">
      {/* ── 1. Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#005A9C] to-[#00477D] flex items-center justify-center text-white shadow-md shadow-[#005A9C]/20">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Viewings & Site Inspections
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Client inspection itineraries, tour agendas, broker schedules, and visitor feedback
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchViewingsData}
            className="h-9 px-3 text-xs gap-1.5 border-border"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="h-9 px-4 text-xs font-semibold bg-[#005A9C] hover:bg-[#00477D] text-white shadow-md shadow-[#005A9C]/20 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Schedule Viewing
          </Button>
        </div>
      </div>

      {/* ── 2. KPI Hero Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Scheduled Tours</p>
              <p className="text-2xl font-bold text-foreground">{stats.scheduled}</p>
              <p className="text-[11px] text-muted-foreground">Upcoming property viewings</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Today's Viewings</p>
              <p className="text-2xl font-bold text-[#005A9C] dark:text-[#FF6B00]">{stats.todayCount}</p>
              <p className="text-[11px] text-emerald-600/80">Scheduled for today</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-[#005A9C]/10 text-[#005A9C] dark:text-[#FF6B00] flex items-center justify-center">
              <CalendarIcon className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Completed Tours</p>
              <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
              <p className="text-[11px] text-muted-foreground">Feedback logged</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Tours Logged</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-[11px] text-muted-foreground">Historical viewing sessions</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Filters & Mode Switcher ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card border border-border/80 p-3 rounded-xl shadow-xs">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by property, client, broker..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-background"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs w-[170px] bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
              <SelectItem value="scheduled" className="text-xs">Scheduled</SelectItem>
              <SelectItem value="completed" className="text-xs">Completed</SelectItem>
              <SelectItem value="rescheduled" className="text-xs">Rescheduled</SelectItem>
              <SelectItem value="cancelled" className="text-xs">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50 self-end md:self-auto">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
              viewMode === 'list' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
            title="List View"
          >
            <Clock className="h-3.5 w-3.5" />
            <span className="text-[11px] hidden sm:inline">List</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={cn(
              "p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
              viewMode === 'calendar' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
            title="Month Calendar"
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            <span className="text-[11px] hidden sm:inline">Calendar</span>
          </button>
        </div>
      </div>

      {/* ── 4. Main Body: List or Calendar ── */}
      {viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredViewings.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card/40">
              <CalendarIcon className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <h3 className="text-sm font-semibold text-foreground">No viewings scheduled</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                No property inspections match your filter criteria.
              </p>
              <Button onClick={handleOpenCreate} size="sm" className="mt-4 text-xs bg-[#005A9C] hover:bg-[#00477D] text-white">
                <Plus className="h-3.5 w-3.5 mr-1" /> Schedule Viewing
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredViewings.map(v => {
                const st = STATUS_CONFIG[v.status] || STATUS_CONFIG.scheduled;
                const bannerColor = 'from-emerald-800 via-emerald-700 to-emerald-600';

                const clientInitials = (v.client_name || 'C').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

                return (
                  <div
                    key={v.id}
                    onClick={() => setInspectorViewing(v)}
                    className="group relative flex flex-col rounded-2xl border border-border/60 hover:border-emerald-500/50 bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                  >
                    {/* Gradient Banner */}
                    <div className={cn("relative h-28 flex flex-col justify-between p-4 overflow-hidden bg-gradient-to-br", bannerColor)}>
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                      <div className="flex items-start justify-between relative z-10">
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/20 text-white backdrop-blur-sm">
                          Tour Inspection
                        </span>
                        <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/20 text-white backdrop-blur-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                          {st.label}
                        </span>
                      </div>

                      <div className="flex items-end justify-between relative z-10">
                        <div>
                          <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest mb-0.5">Viewing Date</p>
                          <p className="text-lg font-extrabold text-white tracking-tight">
                            {v.viewing_date ? format(new Date(v.viewing_date), 'MMM dd, yyyy') : 'TBD'}
                          </p>
                        </div>
                        {v.viewing_time && (
                          <span className="text-[11px] font-bold text-white bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                            {v.viewing_time}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                      <div>
                        <h3 className="font-bold text-foreground text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                          {v.property_address}
                        </h3>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                          <Building2 className="h-3 w-3 text-emerald-500 shrink-0" />
                          <span className="truncate">Prime Inspection Site</span>
                        </div>
                      </div>

                      {/* 3-Spec Blueprint Strip */}
                      <div className="grid grid-cols-2 divide-x divide-border/60 rounded-xl border border-border/60 bg-muted/30 overflow-hidden text-center">
                        <div className="flex flex-col items-center py-2 gap-0.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-bold text-foreground truncate max-w-[110px]">{v.client_name}</span>
                          <span className="text-[8px] uppercase font-semibold text-muted-foreground tracking-wider">Client</span>
                        </div>
                        <div className="flex flex-col items-center py-2 gap-0.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-bold text-foreground">{v.duration_minutes || 45}m</span>
                          <span className="text-[8px] uppercase font-semibold text-muted-foreground tracking-wider">Duration</span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="pt-2 border-t border-border/50 flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white text-[9px] font-extrabold shrink-0">
                            {clientInitials}
                          </div>
                          <span className="truncate font-medium">{v.agent_name || 'Assigned Broker'}</span>
                        </div>

                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-emerald-600" onClick={() => setInspectorViewing(v)} title="Inspect">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleOpenEdit(v)} title="Edit">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500/70 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30" onClick={() => setDeleteTarget(v)} title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Calendar View */
        <div className="border border-border rounded-xl bg-card p-4 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-foreground">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setCurrentMonth(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border border-border">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="bg-muted/40 p-2 text-center text-xs font-semibold text-muted-foreground">
                {d}
              </div>
            ))}
            {daysInMonth.map(day => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const dayViewings = filteredViewings.filter(v => v.viewing_date === dayStr);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[90px] p-2 bg-card transition-colors flex flex-col justify-between",
                    !isSameMonth(day, currentMonth) && "opacity-40 bg-muted/10",
                    isToday && "bg-emerald-500/5 ring-1 ring-emerald-500/30"
                  )}
                >
                  <span className={cn(
                    "text-xs font-bold self-end h-5 w-5 rounded-full flex items-center justify-center",
                    isToday ? "bg-[#005A9C] text-white" : "text-muted-foreground"
                  )}>
                    {format(day, 'd')}
                  </span>

                  <div className="space-y-1 mt-1">
                    {dayViewings.slice(0, 2).map(v => (
                      <div
                        key={v.id}
                        onClick={() => setInspectorViewing(v)}
                        className="text-[10px] p-1 rounded bg-[#005A9C]/10 text-emerald-700 dark:text-emerald-400 truncate cursor-pointer hover:bg-[#005A9C]/20"
                      >
                        {v.viewing_time ? `${v.viewing_time} ` : ''}{v.property_address}
                      </div>
                    ))}
                    {dayViewings.length > 2 && (
                      <span className="text-[9px] text-muted-foreground font-semibold">
                        +{dayViewings.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 5. Slide-Over Inspector ── */}
      <Sheet open={!!inspectorViewing} onOpenChange={open => !open && setInspectorViewing(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto p-0 flex flex-col font-sans">
          {inspectorViewing && (
            <>
              <SheetHeader className="p-6 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-xs uppercase font-mono tracking-wider">
                    Viewing Record
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-medium border",
                      (STATUS_CONFIG[inspectorViewing.status] || STATUS_CONFIG.scheduled).badge
                    )}
                  >
                    {(STATUS_CONFIG[inspectorViewing.status] || STATUS_CONFIG.scheduled).label}
                  </Badge>
                </div>
                <SheetTitle className="text-xl font-bold text-foreground mt-2">
                  {inspectorViewing.property_address}
                </SheetTitle>
                <SheetDescription className="text-xs flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {inspectorViewing.viewing_date} at {inspectorViewing.viewing_time || 'Scheduled Time'}
                </SheetDescription>
              </SheetHeader>

              <div className="p-6 space-y-6 flex-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-border/80 bg-muted/20">
                    <p className="text-[10px] uppercase text-muted-foreground">Prospect / Client</p>
                    <p className="text-xs font-bold text-foreground mt-0.5">{inspectorViewing.client_name}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border/80 bg-muted/20">
                    <p className="text-[10px] uppercase text-muted-foreground">Assigned Broker</p>
                    <p className="text-xs font-bold text-foreground mt-0.5">{inspectorViewing.agent_name || 'Assigned'}</p>
                  </div>
                </div>

                {/* Feedback */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Visitor Feedback</h4>
                  <p className="text-xs text-foreground/90 bg-muted/30 p-3.5 rounded-lg border border-border leading-relaxed">
                    {inspectorViewing.feedback || 'No inspection feedback logged yet.'}
                  </p>
                </div>

                {/* Notes */}
                {inspectorViewing.notes && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Internal Notes</h4>
                    <p className="text-xs text-foreground/90 bg-muted/30 p-3.5 rounded-lg border border-border leading-relaxed">
                      {inspectorViewing.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(inspectorViewing)}
                  className="text-xs gap-1.5"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit Viewing
                </Button>

                <Button
                  size="sm"
                  onClick={() => setInspectorViewing(null)}
                  className="text-xs bg-[#005A9C] hover:bg-[#00477D] text-white"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── 6. Create / Edit Viewing Modal ── */}
      <Sheet open={showFormSheet} onOpenChange={setShowFormSheet}>
        <SheetContent className="sm:max-w-xl overflow-y-auto p-0 flex flex-col font-sans">
          <SheetHeader className="p-6 border-b border-border bg-muted/20">
            <SheetTitle className="text-lg font-bold text-foreground">
              {editingId ? 'Edit Inspection Viewing' : 'Schedule Property Viewing'}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Book a client viewing tour, set time, and assign property specialist
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSaveViewing} className="p-6 space-y-4 flex-1">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Property Address *</Label>
              <select required className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs" value={formData.propertyId} onChange={e => { const property = properties.find(p => p.id === e.target.value); setFormData({ ...formData, propertyId: property?.id || '', propertyAddress: property?.address || '' }); }}><option value="">Select existing property</option>{properties.map(property => <option key={property.id} value={property.id}>{property.address}</option>)}</select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Client Name *</Label>
                <select required className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs" value={formData.clientId} onChange={e => { const client = clients.find(c => c.id === e.target.value); setFormData({ ...formData, clientId: client?.id || '', clientName: client?.name || '', propertyAddress: client?.address || formData.propertyAddress }); }}><option value="">Select existing client</option>{clients.map(client => <option key={client.id} value={client.id}>{client.name}{client.address ? ` · ${client.address}` : ''}</option>)}</select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Assigned Agent</Label>
                <Input
                  placeholder="e.g. Marcus Vance"
                  value={formData.agentName}
                  onChange={e => setFormData({ ...formData, agentName: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Viewing Date *</Label>
                <Input
                  type="date"
                  required
                  value={formData.viewingDate}
                  onChange={e => setFormData({ ...formData, viewingDate: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Viewing Time</Label>
                <Input
                  placeholder="e.g. 10:30 AM"
                  value={formData.viewingTime}
                  onChange={e => setFormData({ ...formData, viewingTime: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Duration (Minutes)</Label>
                <Input
                  type="number"
                  min="15"
                  step="15"
                  value={formData.durationMinutes}
                  onChange={e => setFormData({ ...formData, durationMinutes: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={val => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled" className="text-xs">Scheduled</SelectItem>
                    <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                    <SelectItem value="rescheduled" className="text-xs">Rescheduled</SelectItem>
                    <SelectItem value="cancelled" className="text-xs">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Feedback / Client Reactions</Label>
              <textarea
                rows={2}
                placeholder="Client likes natural light, asked about HOA fees..."
                value={formData.feedback}
                onChange={e => setFormData({ ...formData, feedback: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-none"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Notes</Label>
              <textarea
                rows={2}
                placeholder="Lockbox code, gate instructions..."
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-none"
              />
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowFormSheet(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs bg-[#005A9C] hover:bg-[#00477D] text-white font-semibold shadow-md shadow-[#005A9C]/20"
              >
                {editingId ? 'Save Changes' : 'Schedule Viewing'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── 7. Delete Confirmation ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="font-sans">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Delete Viewing Schedule?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to delete the viewing for <strong className="text-foreground">{deleteTarget?.property_address}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteViewing}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
