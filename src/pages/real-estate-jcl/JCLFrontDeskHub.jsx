import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, UserCheck, LogIn, LogOut, Clock, Search, Plus, Filter,
  CheckCircle2, AlertCircle, RefreshCw, Phone, Mail, Building,
  Shield, Key, Package, FileText, ArrowRightLeft, Calendar as CalendarIcon,
  Tag, AlertTriangle, ChevronRight, Download, Check
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function JCLFrontDeskHub() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [activeTab, setActiveTab] = useState('visitors'); // 'visitors' | 'staff_logs' | 'custody_items'
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  // Data states
  const [visitors, setVisitors] = useState([]);
  const [staffLogs, setStaffLogs] = useState([]);
  const [custodyItems, setCustodyItems] = useState([]);
  const [staffList, setStaffList] = useState([]);

  // Modals & Sheets
  const [visitorModalOpen, setVisitorModalOpen] = useState(false);
  const [staffLogModalOpen, setStaffLogModalOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [returnItemModal, setReturnItemModal] = useState(null);

  // Forms
  const [visitorForm, setVisitorForm] = useState({
    visitor_name: '',
    phone: '',
    email: '',
    organization: '',
    host_staff_name: '',
    purpose: '',
    id_type: 'National ID',
    id_number: '',
    badge_number: '',
    notes: ''
  });

  const [staffLogForm, setStaffLogForm] = useState({
    staff_name: '',
    staff_email: '',
    department: 'Sales & Field',
    movement_type: 'client_meeting',
    destination: '',
    purpose: '',
    remarks: ''
  });

  const [itemForm, setItemForm] = useState({
    item_name: '',
    category: 'Keys',
    item_code: '',
    taken_by_name: '',
    taken_by_email: '',
    department: 'Operations',
    expected_return_date: format(new Date(), 'yyyy-MM-dd'),
    purpose: '',
    condition_out: 'Good',
    notes: ''
  });

  // Fetch all front desk data
  const loadData = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [visRes, staffLogRes, itemRes, empRes] = await Promise.all([
        powerSync.execute(
          'SELECT * FROM univ_frontdesk_visitors WHERE company_id = ? ORDER BY check_in_time DESC',
          [companyId]
        ).catch(() => ({ rows: [] })),
        powerSync.execute(
          'SELECT * FROM univ_frontdesk_staff_logs WHERE company_id = ? ORDER BY time_out DESC',
          [companyId]
        ).catch(() => ({ rows: [] })),
        powerSync.execute(
          'SELECT * FROM univ_office_custody_items WHERE company_id = ? ORDER BY date_taken DESC',
          [companyId]
        ).catch(() => ({ rows: [] })),
        powerSync.execute(
          'SELECT * FROM univ_hr_employees WHERE company_id = ? ORDER BY name ASC',
          [companyId]
        ).catch(() => ({ rows: [] }))
      ]);

      const getArr = (res) => (res.rows?._array ? res.rows._array : Array.from(res.rows || []));
      setVisitors(getArr(visRes));
      setStaffLogs(getArr(staffLogRes));
      setCustodyItems(getArr(itemRes));
      setStaffList(getArr(empRes));
    } catch (e) {
      console.error('FrontDeskHub load error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId]);

  // VISITOR ACTIONS
  const handleCheckInVisitor = async (e) => {
    e.preventDefault();
    if (!visitorForm.visitor_name.trim()) {
      toast.error('Visitor name is required');
      return;
    }
    const id = generateUUID();
    const now = new Date().toISOString();
    try {
      await powerSync.execute(
        `INSERT INTO univ_frontdesk_visitors (
          id, created_at, updated_at, company_id, visitor_name, phone, email,
          organization, host_staff_name, purpose, id_type, id_number,
          check_in_time, status, badge_number, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_office', ?, ?)`,
        [
          id, now, now, companyId, visitorForm.visitor_name, visitorForm.phone || null,
          visitorForm.email || null, visitorForm.organization || null, visitorForm.host_staff_name || null,
          visitorForm.purpose, visitorForm.id_type || 'National ID', visitorForm.id_number || null,
          now, visitorForm.badge_number || null, visitorForm.notes || null
        ]
      );
      toast.success(`${visitorForm.visitor_name} checked in successfully!`);
      setVisitorModalOpen(false);
      setVisitorForm({
        visitor_name: '', phone: '', email: '', organization: '',
        host_staff_name: '', purpose: '', id_type: 'National ID', id_number: '', badge_number: '', notes: ''
      });
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to log visitor: ' + err.message);
    }
  };

  const handleCheckOutVisitor = async (id, name) => {
    const now = new Date().toISOString();
    try {
      await powerSync.execute(
        `UPDATE univ_frontdesk_visitors SET status = 'checked_out', check_out_time = ?, updated_at = ? WHERE id = ? AND company_id = ?`,
        [now, now, id, companyId]
      );
      toast.success(`${name} checked out`);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to check out visitor');
    }
  };

  // STAFF LOG ACTIONS
  const handleLogStaffMovement = async (e) => {
    e.preventDefault();
    if (!staffLogForm.staff_name.trim()) {
      toast.error('Staff name is required');
      return;
    }
    const id = generateUUID();
    const now = new Date().toISOString();
    try {
      await powerSync.execute(
        `INSERT INTO univ_frontdesk_staff_logs (
          id, created_at, updated_at, company_id, staff_name, staff_email,
          department, movement_type, destination, purpose, time_out, status, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'out', ?)`,
        [
          id, now, now, companyId, staffLogForm.staff_name, staffLogForm.staff_email || null,
          staffLogForm.department || 'General', staffLogForm.movement_type, staffLogForm.destination || null,
          staffLogForm.purpose || null, now, staffLogForm.remarks || null
        ]
      );
      toast.success(`Movement logged for ${staffLogForm.staff_name}`);
      setStaffLogModalOpen(false);
      setStaffLogForm({
        staff_name: '', staff_email: '', department: 'Sales & Field',
        movement_type: 'client_meeting', destination: '', purpose: '', remarks: ''
      });
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to log staff movement');
    }
  };

  const handleStaffReturn = async (id, name) => {
    const now = new Date().toISOString();
    try {
      await powerSync.execute(
        `UPDATE univ_frontdesk_staff_logs SET status = 'returned', time_in = ?, updated_at = ? WHERE id = ? AND company_id = ?`,
        [now, now, id, companyId]
      );
      toast.success(`${name} marked as returned to office`);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark staff return');
    }
  };

  // CUSTODY ITEMS ACTIONS
  const handleCheckoutItem = async (e) => {
    e.preventDefault();
    if (!itemForm.item_name.trim() || !itemForm.taken_by_name.trim()) {
      toast.error('Item name and staff name are required');
      return;
    }
    const id = generateUUID();
    const now = new Date().toISOString();
    try {
      await powerSync.execute(
        `INSERT INTO univ_office_custody_items (
          id, created_at, updated_at, company_id, item_name, category, item_code,
          taken_by_name, taken_by_email, department, date_taken, expected_return_date,
          status, condition_out, purpose, received_by_secretary, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'checked_out', ?, ?, ?, ?)`,
        [
          id, now, now, companyId, itemForm.item_name, itemForm.category, itemForm.item_code || null,
          itemForm.taken_by_name, itemForm.taken_by_email || null, itemForm.department || null,
          now, itemForm.expected_return_date ? new Date(itemForm.expected_return_date).toISOString() : null,
          itemForm.condition_out || 'Good', itemForm.purpose || null, user?.full_name || 'Front Desk', itemForm.notes || null
        ]
      );
      toast.success(`Item "${itemForm.item_name}" checked out to ${itemForm.taken_by_name}`);
      setItemModalOpen(false);
      setItemForm({
        item_name: '', category: 'Keys', item_code: '', taken_by_name: '',
        taken_by_email: '', department: 'Operations', expected_return_date: format(new Date(), 'yyyy-MM-dd'),
        purpose: '', condition_out: 'Good', notes: ''
      });
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to record custody item');
    }
  };

  const handleReturnItem = async (id, conditionIn, returnNotes) => {
    const now = new Date().toISOString();
    try {
      await powerSync.execute(
        `UPDATE univ_office_custody_items SET status = 'returned', returned_date = ?, condition_in = ?, notes = coalesce(notes || ' | Return: ', '') || ?, updated_at = ? WHERE id = ? AND company_id = ?`,
        [now, conditionIn || 'Good', returnNotes || 'Item returned safely', now, id, companyId]
      );
      toast.success('Item recorded as safely returned');
      setReturnItemModal(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to process item return');
    }
  };

  // Metrics
  const activeVisitorsCount = visitors.filter(v => v.status === 'in_office').length;
  const staffOutCount = staffLogs.filter(s => s.status === 'out').length;
  const itemsCheckedOutCount = custodyItems.filter(i => i.status === 'checked_out').length;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ── 1. Executive Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#005A9C] via-[#00477D] to-[#0A2540] p-6 text-white shadow-lg shadow-[#005A9C]/15 border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FF6B00] text-white">
                Secretary & Reception
              </span>
              <span className="text-xs text-white/70">JCL Royal Group Front Office</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Shield className="h-6 w-6 text-[#FF6B00]" />
              Front Desk Operations & Custody Hub
            </h1>
            <p className="text-xs text-white/80 max-w-xl mt-1">
              Secretary command center for logging visitors in & out, tracking staff field departures, and monitoring custody of office tools, keys, folders, and company assets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setVisitorModalOpen(true)}
              className="bg-[#FF6B00] hover:bg-[#E05E00] text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
            >
              <LogIn className="h-3.5 w-3.5" />
              Log Visitor In
            </Button>
            <Button
              onClick={() => setStaffLogModalOpen(true)}
              variant="secondary"
              className="bg-white/15 hover:bg-white/25 text-white border-0 text-xs font-semibold backdrop-blur-sm flex items-center gap-1.5"
            >
              <Users className="h-3.5 w-3.5" />
              Log Staff Movement
            </Button>
            <Button
              onClick={() => setItemModalOpen(true)}
              variant="secondary"
              className="bg-white/15 hover:bg-white/25 text-white border-0 text-xs font-semibold backdrop-blur-sm flex items-center gap-1.5"
            >
              <Key className="h-3.5 w-3.5" />
              Check Out Item
            </Button>
          </div>
        </div>
      </div>

      {/* ── 2. KPI Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border/80 shadow-xs bg-card hover:border-[#005A9C]/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Visitors In Office
              </p>
              <h3 className="text-2xl font-black text-foreground mt-0.5">
                {activeVisitorsCount}
              </h3>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                Currently on premises
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#005A9C]/10 text-[#005A9C] flex items-center justify-center">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card hover:border-[#FF6B00]/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Staff On Field / Errand
              </p>
              <h3 className="text-2xl font-black text-foreground mt-0.5">
                {staffOutCount}
              </h3>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                Awaiting return to office
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card hover:border-emerald-500/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Items Checked Out
              </p>
              <h3 className="text-2xl font-black text-foreground mt-0.5">
                {itemsCheckedOutCount}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Keys, files, tech & gear in custody
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Tabs Navigation & Search ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger value="visitors" className="text-xs font-semibold flex items-center gap-1.5">
              <LogIn className="h-3.5 w-3.5" />
              Visitor Log ({visitors.length})
            </TabsTrigger>
            <TabsTrigger value="staff_logs" className="text-xs font-semibold flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Staff Field Log ({staffLogs.length})
            </TabsTrigger>
            <TabsTrigger value="custody_items" className="text-xs font-semibold flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5" />
              Items & Custody Tracker ({custodyItems.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 text-xs h-8 w-44 sm:w-60"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={loadData}
              title="Refresh logs"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* ── TAB 1: VISITOR LOG ── */}
        <TabsContent value="visitors" className="space-y-4 m-0">
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-3">Visitor Info</th>
                    <th className="p-3">Organization</th>
                    <th className="p-3">Host Staff / Purpose</th>
                    <th className="p-3">Check-in Time</th>
                    <th className="p-3">Check-out Time</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visitors
                    .filter(v => !search || v.visitor_name?.toLowerCase().includes(search.toLowerCase()) || v.host_staff_name?.toLowerCase().includes(search.toLowerCase()))
                    .map(v => {
                      const isInOffice = v.status === 'in_office';
                      return (
                        <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <div className="font-semibold text-foreground">{v.visitor_name}</div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              {v.phone && <span>{v.phone}</span>}
                              {v.badge_number && (
                                <Badge variant="outline" className="text-[9px] py-0 px-1">
                                  Badge #{v.badge_number}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {v.organization || 'Individual / Private'}
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-foreground">
                              {v.host_staff_name ? `Meeting: ${v.host_staff_name}` : 'General Inquiry'}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate max-w-xs">
                              {v.purpose}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="font-mono text-muted-foreground">
                              {v.check_in_time ? format(new Date(v.check_in_time), 'MMM dd, h:mm a') : '—'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-mono text-muted-foreground">
                              {v.check_out_time ? format(new Date(v.check_out_time), 'MMM dd, h:mm a') : '—'}
                            </span>
                          </td>
                          <td className="p-3">
                            {isInOffice ? (
                              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px]">
                                In Office
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground text-[10px]">
                                Checked Out
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {isInOffice ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCheckOutVisitor(v.id, v.visitor_name)}
                                className="h-7 text-xs border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 flex items-center gap-1 ml-auto"
                              >
                                <LogOut className="h-3 w-3" />
                                Check Out
                              </Button>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">Completed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  {visitors.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-muted-foreground">
                        No visitor records found. Click &quot;Log Visitor In&quot; above to log the first visitor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB 2: STAFF MOVEMENT LOG ── */}
        <TabsContent value="staff_logs" className="space-y-4 m-0">
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-3">Staff Name & Dept</th>
                    <th className="p-3">Movement Type</th>
                    <th className="p-3">Destination / Purpose</th>
                    <th className="p-3">Time Out</th>
                    <th className="p-3">Time Returned</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {staffLogs
                    .filter(s => !search || s.staff_name?.toLowerCase().includes(search.toLowerCase()) || s.destination?.toLowerCase().includes(search.toLowerCase()))
                    .map(s => {
                      const isOut = s.status === 'out';
                      return (
                        <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <div className="font-semibold text-foreground">{s.staff_name}</div>
                            <div className="text-[11px] text-muted-foreground">{s.department || 'Operations'}</div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="capitalize text-[10px]">
                              {s.movement_type.replace(/_/g, ' ')}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-foreground">{s.destination || 'Not Specified'}</div>
                            <div className="text-[11px] text-muted-foreground truncate max-w-xs">{s.purpose}</div>
                          </td>
                          <td className="p-3 font-mono text-muted-foreground">
                            {s.time_out ? format(new Date(s.time_out), 'MMM dd, h:mm a') : '—'}
                          </td>
                          <td className="p-3 font-mono text-muted-foreground">
                            {s.time_in ? format(new Date(s.time_in), 'MMM dd, h:mm a') : '—'}
                          </td>
                          <td className="p-3">
                            {isOut ? (
                              <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px]">
                                Out on Field
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px]">
                                Returned
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {isOut ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStaffReturn(s.id, s.staff_name)}
                                className="h-7 text-xs border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-1 ml-auto"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Mark Returned
                              </Button>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">Logged</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  {staffLogs.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-muted-foreground">
                        No staff movements logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB 3: ITEMS & CUSTODY TRACKER ── */}
        <TabsContent value="custody_items" className="space-y-4 m-0">
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-3">Item Name & Category</th>
                    <th className="p-3">Custody (Taken By)</th>
                    <th className="p-3">Date Taken</th>
                    <th className="p-3">Expected Return</th>
                    <th className="p-3">Status & Condition</th>
                    <th className="p-3">Purpose</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {custodyItems
                    .filter(i => !search || i.item_name?.toLowerCase().includes(search.toLowerCase()) || i.taken_by_name?.toLowerCase().includes(search.toLowerCase()))
                    .map(i => {
                      const isCheckedOut = i.status === 'checked_out';
                      return (
                        <tr key={i.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <Key className="h-3.5 w-3.5 text-[#005A9C]" />
                              {i.item_name}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              Category: <span className="font-medium">{i.category}</span> {i.item_code && `(${i.item_code})`}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-foreground">{i.taken_by_name}</div>
                            <div className="text-[11px] text-muted-foreground">{i.department || 'Operations'}</div>
                          </td>
                          <td className="p-3 font-mono text-muted-foreground">
                            {i.date_taken ? format(new Date(i.date_taken), 'MMM dd, h:mm a') : '—'}
                          </td>
                          <td className="p-3 font-mono text-muted-foreground">
                            {i.expected_return_date ? format(new Date(i.expected_return_date), 'MMM dd, yyyy') : 'Indefinite'}
                          </td>
                          <td className="p-3">
                            {isCheckedOut ? (
                              <div className="space-y-1">
                                <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px]">
                                  Checked Out
                                </Badge>
                                <div className="text-[10px] text-muted-foreground">Cond: {i.condition_out || 'Good'}</div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px]">
                                  Returned Safely
                                </Badge>
                                <div className="text-[10px] text-muted-foreground">Cond: {i.condition_in || 'Good'}</div>
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground max-w-xs truncate">
                            {i.purpose || 'Official Use'}
                          </td>
                          <td className="p-3 text-right">
                            {isCheckedOut ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setReturnItemModal(i)}
                                className="h-7 text-xs border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-1 ml-auto"
                              >
                                <Check className="h-3 w-3" />
                                Return Item
                              </Button>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">
                                {i.returned_date ? format(new Date(i.returned_date), 'MMM dd') : 'Returned'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  {custodyItems.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-muted-foreground">
                        No custody items recorded yet. Use &quot;Check Out Item&quot; to log car keys, files, tablets or tools.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── MODAL 1: CHECK IN VISITOR ── */}
      <Dialog open={visitorModalOpen} onOpenChange={setVisitorModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-[#FF6B00]" />
              Visitor Check-In Log
            </DialogTitle>
            <DialogDescription>
              Record guest or client arrival at JCL Royal Group front desk.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCheckInVisitor} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Visitor Full Name *</Label>
              <Input
                required
                placeholder="e.g. Samuel Mensah"
                value={visitorForm.visitor_name}
                onChange={e => setVisitorForm({ ...visitorForm, visitor_name: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Phone Number</Label>
                <Input
                  placeholder="+233..."
                  value={visitorForm.phone}
                  onChange={e => setVisitorForm({ ...visitorForm, phone: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Organization / Company</Label>
                <Input
                  placeholder="e.g. Apex Lands"
                  value={visitorForm.organization}
                  onChange={e => setVisitorForm({ ...visitorForm, organization: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Staff Host to See</Label>
                <Input
                  placeholder="e.g. Mr. John (Sales Director)"
                  value={visitorForm.host_staff_name}
                  onChange={e => setVisitorForm({ ...visitorForm, host_staff_name: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Visitor Badge #</Label>
                <Input
                  placeholder="e.g. 04"
                  value={visitorForm.badge_number}
                  onChange={e => setVisitorForm({ ...visitorForm, badge_number: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Purpose of Visit</Label>
              <Input
                placeholder="e.g. Land acquisition consultation, invoice submission"
                value={visitorForm.purpose}
                onChange={e => setVisitorForm({ ...visitorForm, purpose: e.target.value })}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setVisitorModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-[#005A9C] hover:bg-[#00477D] text-white">
                Check In Visitor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 2: LOG STAFF MOVEMENT ── */}
      <Dialog open={staffLogModalOpen} onOpenChange={setStaffLogModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-[#005A9C]" />
              Log Staff Departure / Field Errand
            </DialogTitle>
            <DialogDescription>
              Record staff stepping out for site inspections, client visits, or errands.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLogStaffMovement} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Staff Member *</Label>
              <Input
                required
                placeholder="e.g. Kwame Boateng"
                value={staffLogForm.staff_name}
                onChange={e => setStaffLogForm({ ...staffLogForm, staff_name: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Department</Label>
                <Select
                  value={staffLogForm.department}
                  onValueChange={v => setStaffLogForm({ ...staffLogForm, department: v })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sales & Field">Sales & Field</SelectItem>
                    <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                    <SelectItem value="Land Survey">Land Survey</SelectItem>
                    <SelectItem value="Legal & Conveyancing">Legal & Conveyancing</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Movement Type</Label>
                <Select
                  value={staffLogForm.movement_type}
                  onValueChange={v => setStaffLogForm({ ...staffLogForm, movement_type: v })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="site_inspection">Site Inspection</SelectItem>
                    <SelectItem value="client_meeting">Client Meeting</SelectItem>
                    <SelectItem value="out_on_field">Out on Field</SelectItem>
                    <SelectItem value="official_errand">Official Errand</SelectItem>
                    <SelectItem value="lunch_break">Lunch Break</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Destination Location</Label>
              <Input
                placeholder="e.g. Cantonments Luxury Villa Site, Lands Commission"
                value={staffLogForm.destination}
                onChange={e => setStaffLogForm({ ...staffLogForm, destination: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Purpose & Expected Details</Label>
              <Input
                placeholder="e.g. Plot boundary verification with surveyor"
                value={staffLogForm.purpose}
                onChange={e => setStaffLogForm({ ...staffLogForm, purpose: e.target.value })}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setStaffLogModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-[#005A9C] hover:bg-[#00477D] text-white">
                Log Departure
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 3: CHECK OUT CUSTODY ITEM ── */}
      <Dialog open={itemModalOpen} onOpenChange={setItemModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-emerald-600" />
              Office Item & Custody Log
            </DialogTitle>
            <DialogDescription>
              Record equipment, keys, title folders, or tools taken from the front desk.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCheckoutItem} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Item Name *</Label>
                <Input
                  required
                  placeholder="e.g. Master Key Plot 44"
                  value={itemForm.item_name}
                  onChange={e => setItemForm({ ...itemForm, item_name: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Category</Label>
                <Select
                  value={itemForm.category}
                  onValueChange={v => setItemForm({ ...itemForm, category: v })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Keys">Site / Room Keys</SelectItem>
                    <SelectItem value="Vehicle Keys">Vehicle Keys</SelectItem>
                    <SelectItem value="Site Equipment">Site Equipment</SelectItem>
                    <SelectItem value="Office Tech">Office Tech / Laptop</SelectItem>
                    <SelectItem value="Document File">Document File / Folder</SelectItem>
                    <SelectItem value="Tools">Survey / Work Tools</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Staff Taking Item *</Label>
                <Input
                  required
                  placeholder="e.g. Peter Owusu"
                  value={itemForm.taken_by_name}
                  onChange={e => setItemForm({ ...itemForm, taken_by_name: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Expected Return Date</Label>
                <Input
                  type="date"
                  value={itemForm.expected_return_date}
                  onChange={e => setItemForm({ ...itemForm, expected_return_date: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Purpose & Item Condition Out</Label>
              <Input
                placeholder="e.g. Client tour at East Legon. Condition: Clean with tags"
                value={itemForm.purpose}
                onChange={e => setItemForm({ ...itemForm, purpose: e.target.value })}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setItemModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Record Custody Checkout
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 4: RETURN ITEM CONFIRMATION ── */}
      <Dialog open={!!returnItemModal} onOpenChange={open => !open && setReturnItemModal(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Confirm Item Return
            </DialogTitle>
            <DialogDescription>
              Record receipt of &quot;{returnItemModal?.item_name}&quot; back into office custody.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="text-xs text-muted-foreground">
              Taken by: <strong className="text-foreground">{returnItemModal?.taken_by_name}</strong>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Condition Upon Return</Label>
              <Select defaultValue="Good" id="return-condition">
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Good">Good / Working Order</SelectItem>
                  <SelectItem value="Damaged">Damaged / Needs Attention</SelectItem>
                  <SelectItem value="Fair">Fair / Normal Wear</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setReturnItemModal(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => handleReturnItem(returnItemModal.id, 'Good', 'Returned on time')}
            >
              Confirm Received
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
