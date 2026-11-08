import React, { useEffect, useMemo, useState } from 'react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, Clock3, LogIn, LogOut, Plus, Search, ShieldCheck, UserRound, UsersRound, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

const emptyVisitor = { entryType: 'visitor', visitorName: '', visitorCompany: '', hostName: '', purpose: '', phone: '', notes: '', staffName: '', staffEmail: '' };

function rowsOf(result) { return result?.rows?._array || Array.from(result?.rows || []); }
function newId() { return crypto.randomUUID(); }

export default function JCLFrontDesk() {
  const powerSync = usePowerSync();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const [tab, setTab] = useState('visitors');
  const [visitors, setVisitors] = useState([]);
  const [staff, setStaff] = useState([]);
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [showVisitorForm, setShowVisitorForm] = useState(false);
  const [visitorForm, setVisitorForm] = useState(emptyVisitor);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!companyId) return;
    setLoading(true);
    const safe = (sql, params = []) => powerSync.execute(sql, params).catch(() => ({ rows: [] }));
    const [visitorResult, staffResult, eventResult] = await Promise.all([
      safe('SELECT * FROM jcl_visitor_logbook WHERE company_id = ? ORDER BY checked_in_at DESC', [companyId]),
      safe('SELECT * FROM jcl_staff_logbook WHERE company_id = ? ORDER BY logged_in_at DESC', [companyId]),
      safe('SELECT * FROM tasks WHERE company_id = ? ORDER BY created_at ASC', [companyId])
    ]);
    setVisitors(rowsOf(visitorResult));
    setStaff(rowsOf(staffResult));
    setEvents(rowsOf(eventResult));
    setLoading(false);
  };

  useEffect(() => { load(); }, [companyId]);

  const today = new Date().toISOString().slice(0, 10);
  const activeVisitors = visitors.filter(v => v.status === 'checked_in');
  const activeStaff = staff.filter(s => s.status === 'checked_in');
  const todayEvents = events.filter(event => String(event.due_date || event.created_at || '').slice(0, 10) === today);
  const visibleVisitors = useMemo(() => visitors.filter(v => `${v.visitor_name} ${v.visitor_company || ''} ${v.host_name || ''}`.toLowerCase().includes(search.toLowerCase())), [visitors, search]);

  const checkInVisitor = async (event) => {
    event.preventDefault();
    if (visitorForm.entryType === 'staff' && !visitorForm.staffName.trim()) return toast.error('Staff name is required');
    if (visitorForm.entryType === 'visitor' && (!visitorForm.visitorName.trim() || !visitorForm.hostName.trim() || !visitorForm.purpose.trim())) return toast.error('Visitor name, host, and purpose are required');
    try {
      if (visitorForm.entryType === 'staff') {
        await powerSync.execute(`INSERT INTO jcl_staff_logbook (id, company_id, staff_user_id, staff_name, staff_email, status, logged_in_at) VALUES (?, ?, ?, ?, ?, 'checked_in', ?)`, [newId(), companyId, user?.id || null, visitorForm.staffName.trim(), visitorForm.staffEmail.trim() || user?.email || null, new Date().toISOString()]);
        toast.success('Staff member checked in');
      } else {
        await powerSync.execute(`INSERT INTO jcl_visitor_logbook (id, company_id, visitor_name, visitor_company, host_name, purpose, phone, notes, status, checked_in_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'checked_in', ?, ?)`, [newId(), companyId, visitorForm.visitorName.trim(), visitorForm.visitorCompany.trim() || null, visitorForm.hostName.trim(), visitorForm.purpose.trim(), visitorForm.phone.trim() || null, visitorForm.notes.trim() || null, new Date().toISOString(), user?.id || null]);
        toast.success('Visitor checked in');
      }
      setVisitorForm(emptyVisitor);
      setShowVisitorForm(false);
      load();
    } catch (error) {
      console.error('[v0] Visitor check-in failed:', error);
      toast.error('Visitor logbook error. Please try again.');
    }
  };

  const checkOutVisitor = async (id) => {
    await powerSync.execute(`UPDATE jcl_visitor_logbook SET status = 'checked_out', checked_out_at = ? WHERE id = ? AND company_id = ?`, [new Date().toISOString(), id, companyId]);
    toast.success('Visitor checked out');
    load();
  };

  const toggleStaff = async (record) => {
    if (record.status === 'checked_in') {
      await powerSync.execute(`UPDATE jcl_staff_logbook SET status = 'checked_out', logged_out_at = ? WHERE id = ? AND company_id = ?`, [new Date().toISOString(), record.id, companyId]);
      toast.success('Staff member logged out');
    } else {
      await powerSync.execute(`INSERT INTO jcl_staff_logbook (id, company_id, staff_user_id, staff_name, staff_email, status, logged_in_at) VALUES (?, ?, ?, ?, ?, 'checked_in', ?)`, [newId(), companyId, user?.id || null, record.staff_name || user?.full_name || user?.email || 'Staff member', record.staff_email || user?.email || null, new Date().toISOString()]);
      toast.success('Staff member logged in');
    }
    load();
  };

  return (
    <main className="w-full max-w-full space-y-4 sm:space-y-6 p-3 sm:p-6 lg:p-8 pb-24 overflow-x-hidden">
      {/* ── 1. Clean Header (No redundant subtext) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Front Desk Logbook
          </h1>
        </div>
        <Button
          onClick={() => setShowVisitorForm(true)}
          className="w-full sm:w-auto h-9 px-4 gap-1.5 text-xs font-bold bg-[#005A9C] hover:bg-[#00477D] text-white shadow-xs rounded-xl justify-center shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Check in Visitor / Staff
        </Button>
      </div>

      {/* ── 2. Mobile 2x2 Dedicated Stats Grid (< md) ── */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:hidden">
        <div className="bg-card/95 border border-border/80 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <UsersRound className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider truncate">In Office</span>
          </div>
          <p className="text-xl font-black text-foreground truncate">{activeVisitors.length}</p>
          <span className="text-[10px] text-muted-foreground font-semibold">Live visitors</span>
        </div>

        <div className="bg-card/95 border border-border/80 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <UserRound className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider truncate">Staff Present</span>
          </div>
          <p className="text-xl font-black text-emerald-600 truncate">{activeStaff.length}</p>
          <span className="text-[10px] text-muted-foreground font-semibold">Checked in today</span>
        </div>

        <div className="bg-card/95 border border-border/80 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <CalendarDays className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider truncate">Daily Events</span>
          </div>
          <p className="text-xl font-black text-foreground truncate">{todayEvents.length}</p>
          <span className="text-[10px] text-muted-foreground font-semibold">Scheduled today</span>
        </div>

        <div className="bg-card/95 border border-border/80 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Clock3 className="w-3.5 h-3.5 text-[#005A9C] shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider truncate">All Logged</span>
          </div>
          <p className="text-xl font-black text-[#005A9C] truncate">{visitors.length}</p>
          <span className="text-[10px] text-muted-foreground font-semibold">Total records</span>
        </div>
      </div>

      {/* ── Desktop Executive KPI Cards (>= md) ── */}
      <section className="hidden md:grid md:grid-cols-3 gap-4">
        <Metric icon={UsersRound} label="Visitors in Office" value={activeVisitors.length} detail="Live visitor register" />
        <Metric icon={UserRound} label="Staff Signed In" value={activeStaff.length} detail="Current working day" />
        <Metric icon={CalendarDays} label="Today’s Scheduled Events" value={todayEvents.length} detail="Company activities" />
      </section>

      {/* ── 3. Tabs Selection ── */}
      <div className="w-full">
        <div className="grid grid-cols-2 gap-2 bg-muted/50 p-1.5 rounded-2xl border border-border/80">
          <button
            onClick={() => setTab('visitors')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all',
              tab === 'visitors' ? 'bg-[#005A9C] text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <UsersRound className="w-4 h-4 shrink-0" />
            <span>Visitor Logbook</span>
          </button>
          <button
            onClick={() => setTab('staff')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all',
              tab === 'staff' ? 'bg-[#005A9C] text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <UserRound className="w-4 h-4 shrink-0" />
            <span>Staff Attendance</span>
          </button>
        </div>
      </div>

      {/* ── 4. Content Area ── */}
      {tab === 'visitors' && (
        <section className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Visitor Records</h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                className="pl-9 h-9 text-xs rounded-xl"
                placeholder="Search visitor or host..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Mobile Native Card View (< md) */}
          <div className="md:hidden space-y-2.5">
            {visibleVisitors.map(v => (
              <div key={v.id} className="p-3.5 bg-muted/20 border border-border/60 rounded-xl space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm text-foreground">{v.visitor_name}</p>
                    <p className="text-xs text-muted-foreground">{v.visitor_company || 'Independent visitor'}</p>
                  </div>
                  <Badge variant={v.status === 'checked_in' ? 'default' : 'secondary'} className={cn("text-[10px] font-bold", v.status === 'checked_in' ? 'bg-emerald-500 text-white' : '')}>
                    {v.status === 'checked_in' ? 'In Office' : 'Checked Out'}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground pt-1 border-t border-border/40 space-y-1">
                  <div>Host: <strong className="text-foreground">{v.host_name}</strong> · Purpose: {v.purpose}</div>
                  <div className="text-[11px] font-mono">{v.checked_in_at ? new Date(v.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                </div>
                {v.status === 'checked_in' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => checkOutVisitor(v.id)}
                    className="w-full h-8 text-xs font-bold gap-1 rounded-xl text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Check Out
                  </Button>
                )}
              </div>
            ))}
            {!loading && visibleVisitors.length === 0 && (
              <div className="py-12 text-center text-xs text-muted-foreground">No visitor records found.</div>
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                  <th className="p-3">Visitor</th>
                  <th className="p-3">Host / Purpose</th>
                  <th className="p-3">Arrival</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleVisitors.map(v => (
                  <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-foreground">{v.visitor_name}</div>
                      <div className="text-xs text-muted-foreground">{v.visitor_company || 'Independent visitor'}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-foreground">{v.host_name}</div>
                      <div className="text-xs text-muted-foreground">{v.purpose}</div>
                    </td>
                    <td className="p-3 text-muted-foreground font-mono">{v.checked_in_at ? new Date(v.checked_in_at).toLocaleString() : '—'}</td>
                    <td className="p-3">
                      <Badge variant={v.status === 'checked_in' ? 'default' : 'secondary'} className={v.status === 'checked_in' ? 'bg-emerald-500 text-white' : ''}>
                        {v.status === 'checked_in' ? 'In office' : 'Checked out'}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      {v.status === 'checked_in' && (
                        <Button size="sm" variant="outline" onClick={() => checkOutVisitor(v.id)} className="h-8 text-xs font-bold gap-1 rounded-xl">
                          <LogOut className="w-3.5 h-3.5" /> Check out
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && visibleVisitors.length === 0 && (
              <div className="py-12 text-center text-xs text-muted-foreground">No visitor records found.</div>
            )}
          </div>
        </section>
      )}

      {tab === 'staff' && (
        <section className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Staff Attendance Register</h2>
            <Badge variant="outline" className="text-xs font-bold">{staff.length} Logged Entries</Badge>
          </div>

          <div className="space-y-2.5">
            {staff.map(record => (
              <div key={record.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 sm:p-4">
                <div>
                  <p className="font-bold text-sm text-foreground">{record.staff_name || record.name || 'Staff Member'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{record.staff_email || record.email || 'No email recorded'}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-border/40">
                  <Badge variant={record.status === 'checked_in' ? 'default' : 'secondary'} className={record.status === 'checked_in' ? 'bg-emerald-500 text-white' : ''}>
                    {record.status === 'checked_in' ? `In since ${new Date(record.logged_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Logged out'}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => toggleStaff(record)} className="h-8 text-xs font-bold gap-1.5 rounded-xl">
                    {record.status === 'checked_in' ? <><LogOut className="w-3.5 h-3.5" /> Log Out</> : <><LogIn className="w-3.5 h-3.5" /> Log In</>}
                  </Button>
                </div>
              </div>
            ))}
            {staff.length === 0 && (
              <div className="py-12 text-center text-xs text-muted-foreground">No staff logbook records yet today.</div>
            )}
          </div>
        </section>
      )}

      {/* Modal Dialog */}
      {showVisitorForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onMouseDown={event => { if (event.target === event.currentTarget) setShowVisitorForm(false); }}>
          <Card className="max-h-[90vh] w-full max-w-xl overflow-y-auto border-border shadow-2xl rounded-2xl">
            <CardHeader className="border-b border-border/60 pb-3">
              <CardTitle className="text-base font-bold">Front Desk Check-in</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={checkInVisitor} className="grid gap-3.5 md:grid-cols-2">
                <Field label="Record Type">
                  <select className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs" value={visitorForm.entryType} onChange={e => setVisitorForm({ ...emptyVisitor, entryType: e.target.value })}>
                    <option value="visitor">Visitor</option>
                    <option value="staff">Staff Member</option>
                  </select>
                </Field>
                {visitorForm.entryType === 'staff' ? (
                  <>
                    <Field label="Staff Name">
                      <Input value={visitorForm.staffName} onChange={e => setVisitorForm({ ...visitorForm, staffName: e.target.value })} required className="h-9 text-xs" />
                    </Field>
                    <Field label="Staff Email">
                      <Input type="email" value={visitorForm.staffEmail} onChange={e => setVisitorForm({ ...visitorForm, staffEmail: e.target.value })} className="h-9 text-xs" />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label="Visitor Name">
                      <Input value={visitorForm.visitorName} onChange={e => setVisitorForm({ ...visitorForm, visitorName: e.target.value })} required className="h-9 text-xs" />
                    </Field>
                    <Field label="Company / Entity">
                      <Input value={visitorForm.visitorCompany} onChange={e => setVisitorForm({ ...visitorForm, visitorCompany: e.target.value })} className="h-9 text-xs" />
                    </Field>
                    <Field label="Host / Employee">
                      <Input value={visitorForm.hostName} onChange={e => setVisitorForm({ ...visitorForm, hostName: e.target.value })} required className="h-9 text-xs" />
                    </Field>
                    <Field label="Phone">
                      <Input value={visitorForm.phone} onChange={e => setVisitorForm({ ...visitorForm, phone: e.target.value })} className="h-9 text-xs" />
                    </Field>
                    <Field label="Purpose of Visit">
                      <Input value={visitorForm.purpose} onChange={e => setVisitorForm({ ...visitorForm, purpose: e.target.value })} required className="h-9 text-xs" />
                    </Field>
                    <Field label="Notes">
                      <Textarea value={visitorForm.notes} onChange={e => setVisitorForm({ ...visitorForm, notes: e.target.value })} className="text-xs" />
                    </Field>
                  </>
                )}
                <div className="flex justify-end gap-2 md:col-span-2 pt-2 border-t border-border/40">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowVisitorForm(false)} className="h-8 text-xs rounded-xl">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="h-8 text-xs font-bold bg-[#005A9C] text-white rounded-xl gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Save Arrival
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}

function Metric({ icon: Icon, label, value, detail }) {
  return (
    <Card className="rounded-2xl border border-border/80 shadow-xs">
      <CardContent className="flex items-center gap-3.5 p-4">
        <div className="rounded-xl bg-[#005A9C]/10 text-[#005A9C] p-2.5 shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">{label}</p>
          <p className="text-xl font-black text-foreground mt-0.5">{value}</p>
          <p className="text-[11px] text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-bold text-foreground">{label}</Label>
      {children}
    </div>
  );
}
