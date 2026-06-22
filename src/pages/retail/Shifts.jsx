import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Clock, Search, Plus, Edit, Trash2, CalendarCheck, Banknote, TrendingDown, TrendingUp, Vault, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { usePowerSync } from '@powersync/react';
import React, { useEffect } from 'react';
import ConfirmationModal from '@/components/ConfirmationModal';
import { toast } from 'react-hot-toast';

const DRAWER_ACTIONS = [
  { value: 'open', label: 'Open Register', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-950/20' },
  { value: 'drop', label: 'Cash Drop (into safe)', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-950/20' },
  { value: 'payout', label: 'Payout / Petty Cash', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-950/20' },
  { value: 'close', label: 'Close Register', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-950/20' },
];

export default function Shifts() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [dbRecords, setDbRecords] = useState([]);
  const [staffRecords, setStaffRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchRecords = async () => {
      setIsLoading(true);
      try {
        const shiftsRes = await powerSync.execute('SELECT * FROM univ_retail_shifts WHERE company_id = ? ORDER BY date DESC, start_time DESC', [companyId]);
        if(active) setDbRecords(shiftsRes.rows._array || Array.from(shiftsRes.rows));

        const staffRes = await powerSync.execute('SELECT * FROM univ_retail_staff WHERE company_id = ?', [companyId]);
        if(active) setStaffRecords(staffRes.rows._array || Array.from(staffRes.rows));
      } catch(e){}
      setIsLoading(false);
    };
    if (companyId) fetchRecords();
    return () => { active = false; };
  }, [companyId]);

  const staffList = staffRecords.map(r => ({
    id: r.id,
    name: r.name || 'Unnamed Staff',
    role: r.role || 'Staff'
  }));

  const shifts = dbRecords.map(r => ({
    id: r.id,
    staffId: r.staff_id || '',
    staffName: r.staff_id ? (staffList.find(s => s.id === r.staff_id)?.name || 'Unknown') : 'Unnamed Staff',
    role: r.role || 'Cashier',
    date: r.date || new Date().toISOString().split('T')[0],
    startTime: r.start_time || '09:00',
    endTime: r.end_time || '17:00',
    status: r.status || 'Scheduled'
  }));

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    staffId: '', role: 'Cashier', date: '', startTime: '', endTime: '', status: 'Scheduled'
  });

  // ─── Cash Drawer State ───────────────────────────────────────────
  const [showDrawerModal, setShowDrawerModal] = useState(false);
  const [selectedShiftForDrawer, setSelectedShiftForDrawer] = useState(null);
  const [drawerLogs, setDrawerLogs] = useState([]);
  const [drawerLogsLoading, setDrawerLogsLoading] = useState(false);
  const [drawerForm, setDrawerForm] = useState({ action: 'open', amount: '', register_name: 'Register 1', notes: '' });

  const openDrawerModal = async (shift) => {
    setSelectedShiftForDrawer(shift);
    setShowDrawerModal(true);
    setDrawerLogsLoading(true);
    try {
      const rows = await powerSync.getAll(
        `SELECT * FROM retail_cash_drawers WHERE shift_id = ? ORDER BY created_at DESC`,
        [shift.id]
      );
      setDrawerLogs(rows);
    } catch (e) {
      console.error('Failed to load drawer logs:', e);
      setDrawerLogs([]);
    } finally {
      setDrawerLogsLoading(false);
    }
  };

  const handleDrawerAction = async () => {
    if (!drawerForm.amount || parseFloat(drawerForm.amount) < 0) {
      return toast.error('Please enter a valid amount.');
    }
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    try {
      await powerSync.execute(
        `INSERT INTO retail_cash_drawers (id, company_id, shift_id, register_name, action, amount, notes, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, companyId, selectedShiftForDrawer.id, drawerForm.register_name, drawerForm.action,
         parseFloat(drawerForm.amount), drawerForm.notes, user?.id, now]
      );
      const label = DRAWER_ACTIONS.find(a => a.value === drawerForm.action)?.label || drawerForm.action;
      toast.success(`${label} recorded: $${parseFloat(drawerForm.amount).toFixed(2)}`);
      setDrawerForm(prev => ({ ...prev, amount: '', notes: '' }));
      // Refresh logs
      const rows = await powerSync.getAll(
        `SELECT * FROM retail_cash_drawers WHERE shift_id = ? ORDER BY created_at DESC`,
        [selectedShiftForDrawer.id]
      );
      setDrawerLogs(rows);
    } catch (e) {
      toast.error('Failed to record drawer action: ' + e.message);
    }
  };

  const getDrawerBalance = (logs) => {
    return logs.reduce((sum, log) => {
      if (log.action === 'open') return sum + parseFloat(log.amount || 0);
      if (log.action === 'drop' || log.action === 'payout') return sum - parseFloat(log.amount || 0);
      if (log.action === 'close') return 0; // closing is just a record
      return sum;
    }, 0);
  };

  const openEdit = (sh) => {
    setEditingId(sh.id);
    setFormData({ staffId: sh.staffId, role: sh.role, date: sh.date, startTime: sh.startTime, endTime: sh.endTime, status: sh.status });
    setShowModal(true);
  };

  const handleSave = async () => {
    const selectedStaff = staffList.find(s => s.id === formData.staffId);
    try {
      if (editingId) {
        await powerSync.execute(`UPDATE univ_retail_shifts SET staff_id=?, role=?, date=?, start_time=?, end_time=?, status=? WHERE id=?`, 
          [formData.staffId, formData.role, formData.date, formData.startTime, formData.endTime, formData.status, editingId]
        );
      } else {
        await powerSync.execute(`INSERT INTO univ_retail_shifts (id, created_at, company_id, staff_id, role, date, start_time, end_time, status) VALUES (gen_random_uuid(), CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?)`, 
          [companyId, formData.staffId, formData.role, formData.date, formData.startTime, formData.endTime, formData.status]
        );
      }
      
      const res = await powerSync.execute('SELECT * FROM univ_retail_shifts WHERE company_id = ? ORDER BY date DESC, start_time DESC', [companyId]);
      setDbRecords(res.rows._array || Array.from(res.rows));

      toast.success(editingId ? 'Shift updated!' : 'Shift scheduled!');
      setShowModal(false);
      setEditingId(null);
    } catch (err) {
      toast.error('Failed to save shift: ' + err.message);
    }
  };

  const filtered = shifts.filter(s => 
    (s.staffName || '').toLowerCase().includes((search || '').toLowerCase()) ||
    (s.role || '').toLowerCase().includes((search || '').toLowerCase())
  );

  return (
    <div className="space-y-6 school-page-enter font-dmsans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">Staff Shifts</h1>
          <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">Manage schedules, rosters and cash drawer for your retail staff.</p>
        </div>
        <Button onClick={() => { setEditingId(null); setFormData({ staffId: '', role: 'Cashier', date: new Date().toISOString().split('T')[0], startTime: '09:00', endTime: '17:00', status: 'Scheduled' }); setShowModal(true); }} className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
          <Plus className="w-4 h-4" /> Schedule Shift
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 flex items-center gap-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/20 flex items-center justify-center text-orange-600"><Clock className="w-5 h-5" /></div>
          <div><p className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">{shifts.length}</p><p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Total Shifts</p></div>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 flex items-center gap-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-primary/20 flex items-center justify-center text-primary"><CalendarCheck className="w-5 h-5" /></div>
          <div><p className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">{shifts.filter(s => s.status === 'Completed').length}</p><p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Completed Shifts</p></div>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 flex items-center gap-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600"><TrendingUp className="w-5 h-5" /></div>
          <div><p className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">{shifts.filter(s => s.status === 'In Progress').length}</p><p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Active Now</p></div>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 flex items-center gap-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/20 flex items-center justify-center text-red-600"><TrendingDown className="w-5 h-5" /></div>
          <div><p className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">{shifts.filter(s => s.status === 'Cancelled').length}</p><p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Cancelled</p></div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <div className="p-4 border-b border-primary/40 bg-muted/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
            <Input placeholder="Search staff name or date..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? <div className="py-12 text-center">Loading...</div> : filtered.length === 0 ? (
            <div className="py-12 text-center text-[#71717a] dark:text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No shifts scheduled.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-card border-b border-primary/40">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Staff Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Date</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Time</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-card-foreground">{s.staffName}</td>
                    <td className="px-6 py-4 text-[#71717a] dark:text-gray-400">{s.role}</td>
                    <td className="px-6 py-4 font-medium">{s.date}</td>
                    <td className="px-6 py-4 text-center">{s.startTime} - {s.endTime}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${s.status === 'Completed' ? 'bg-slate-100 text-primary/90' : s.status === 'Cancelled' ? 'bg-red-100 text-red-700' : s.status === 'In Progress' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>{s.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" title="Cash Drawer" onClick={() => openDrawerModal(s)} className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
                        <Banknote className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-red-600" onClick={() => setDeleteTargetId(s.id)}><Trash2 className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Schedule Shift Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 border border-primary/40 animate-in zoom-in-95 duration-200">
            <h2 className="text-lg font-semibold text-card-foreground">{editingId ? 'Edit Shift' : 'Schedule Shift'}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Staff Member</label>
                <select value={formData.staffId} onChange={e => {
                  const sId = e.target.value;
                  const role = staffList.find(s => s.id === sId)?.role || formData.role;
                  setFormData({ ...formData, staffId: sId, role });
                }} className="flex h-10 w-full rounded-lg border-[0.5px] border-input bg-background px-3 py-2 text-sm mt-1">
                  <option value="">Select Staff...</option>
                  {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Role</label>
                <Input value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="mt-1" placeholder="e.g. Cashier" />
              </div>
              <div><label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Date</label><Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Start Time</label><Input type="time" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} className="mt-1" /></div>
                <div><label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">End Time</label><Input type="time" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} className="mt-1" /></div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Status</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="flex h-10 w-full rounded-lg border-[0.5px] border-input bg-background px-3 py-2 text-sm mt-1">
                  <option>Scheduled</option><option>In Progress</option><option>Completed</option><option>Cancelled</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-orange-600 text-white" onClick={handleSave}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Cash Drawer Modal ─────────────────────────────────────────── */}
      {showDrawerModal && selectedShiftForDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl w-full max-w-xl p-6 space-y-4 border border-primary/40 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" /> Cash Drawer
              </h2>
              <button onClick={() => setShowDrawerModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>

            {/* Shift summary */}
            <div className="bg-muted rounded-xl p-4">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Staff</span><span className="font-semibold">{selectedShiftForDrawer.staffName}</span></div>
              <div className="flex justify-between text-sm mt-1"><span className="text-muted-foreground">Date</span><span className="font-semibold">{selectedShiftForDrawer.date}</span></div>
              <div className="flex justify-between text-sm mt-1"><span className="text-muted-foreground">Time</span><span className="font-semibold">{selectedShiftForDrawer.startTime} – {selectedShiftForDrawer.endTime}</span></div>
            </div>

            {/* Balance summary */}
            {!drawerLogsLoading && drawerLogs.length > 0 && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">Current Drawer Balance</p>
                <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400 tracking-[-0.02em]">
                  ${getDrawerBalance(drawerLogs).toFixed(2)}
                </p>
              </div>
            )}

            {/* Record a drawer action */}
            <div className="border border-primary/20 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2"><Vault className="w-4 h-4 text-orange-600" /> Record Drawer Action</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em] mb-1 block">Action</label>
                  <select value={drawerForm.action} onChange={e => setDrawerForm(p => ({ ...p, action: e.target.value }))}
                    className="w-full rounded-lg border-[0.5px] border-input bg-background px-3 py-2 text-sm h-10">
                    {DRAWER_ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em] mb-1 block">Register</label>
                  <select value={drawerForm.register_name} onChange={e => setDrawerForm(p => ({ ...p, register_name: e.target.value }))}
                    className="w-full rounded-lg border-[0.5px] border-input bg-background px-3 py-2 text-sm h-10">
                    <option>Register 1</option>
                    <option>Register 2</option>
                    <option>Mobile POS</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em] mb-1 block">Amount ($)</label>
                <Input type="number" step="0.01" min="0" placeholder="0.00" value={drawerForm.amount}
                  onChange={e => setDrawerForm(p => ({ ...p, amount: e.target.value }))} className="h-12 text-xl font-bold" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em] mb-1 block">Notes (optional)</label>
                <Input placeholder="e.g. End of lunch shift drop" value={drawerForm.notes}
                  onChange={e => setDrawerForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <Button onClick={handleDrawerAction} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={!drawerForm.amount || parseFloat(drawerForm.amount) < 0}>
                <Banknote className="w-4 h-4 mr-2" /> Record Action
              </Button>
            </div>

            {/* Drawer log */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Drawer Log ({drawerLogs.length} entries)</h3>
              {drawerLogsLoading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Loading log...</p>
              ) : drawerLogs.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <Banknote className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No drawer activity yet. Start by opening the register.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {drawerLogs.map(log => {
                    const actionDef = DRAWER_ACTIONS.find(a => a.value === log.action);
                    return (
                      <div key={log.id} className={`flex items-center justify-between p-3 rounded-xl ${actionDef?.bg || 'bg-muted'}`}>
                        <div>
                          <p className={`text-sm font-semibold ${actionDef?.color || ''}`}>{actionDef?.label || log.action}</p>
                          {log.notes && <p className="text-xs text-muted-foreground">{log.notes}</p>}
                          <p className="text-xs text-muted-foreground">{log.register_name} · {new Date(log.created_at).toLocaleTimeString()}</p>
                        </div>
                        <span className={`text-lg font-black ${actionDef?.color || ''}`}>
                          {log.action === 'open' ? '+' : log.action === 'close' ? '' : '-'}${parseFloat(log.amount || 0).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal isOpen={deleteTargetId !== null} onClose={() => setDeleteTargetId(null)}
        onConfirm={async () => { 
          try {
            await powerSync.execute(`DELETE FROM univ_retail_shifts WHERE id=?`, [deleteTargetId]);
            setDbRecords(dbRecords.filter(r => r.id !== deleteTargetId));
            toast.success("Shift deleted.");
          } catch(err) {
            toast.error("Failed to delete shift: " + err.message);
          }
          setDeleteTargetId(null); 
        }}
        title="Delete Shift" message="Are you sure you want to delete this shift?" />
    </div>
  );
}
