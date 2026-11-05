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
import { CalendarDays, Clock3, LogIn, LogOut, Plus, Search, ShieldCheck, UserRound, UsersRound } from 'lucide-react';
import { toast } from 'react-hot-toast';
import JCLItemRegister from './JCLItemRegister';

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
    setVisitors(rowsOf(visitorResult)); setStaff(rowsOf(staffResult)); setEvents(rowsOf(eventResult)); setLoading(false);
  };

  useEffect(() => { load(); }, [companyId]);

  const today = new Date().toISOString().slice(0, 10);
  const activeVisitors = visitors.filter(v => v.status === 'checked_in');
  const activeStaff = staff.filter(s => s.status === 'checked_in');
  const todayEvents = events.filter(event => String(event.due_date || event.created_at || '').slice(0, 10) === today);
  const visibleVisitors = useMemo(() => visitors.filter(v => `${v.visitor_name} ${v.visitor_company} ${v.host_name}`.toLowerCase().includes(search.toLowerCase())), [visitors, search]);

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
      setVisitorForm(emptyVisitor); setShowVisitorForm(false); load();
    } catch (error) {
      console.error('[v0] Visitor check-in failed:', error);
      toast.error('Visitor logbook is not available yet. Apply the latest database migration and reload.');
    }
  };

  const checkOutVisitor = async (id) => { await powerSync.execute(`UPDATE jcl_visitor_logbook SET status = 'checked_out', checked_out_at = ? WHERE id = ? AND company_id = ?`, [new Date().toISOString(), id, companyId]); toast.success('Visitor checked out'); load(); };
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

  return <main className="min-h-full space-y-6 p-4 pb-24 md:p-8">
    <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">JCL Real Estate · Secretary Desk</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Front desk</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">A clear, accountable record of who is in the office, who is expected, and what needs attention today.</p></div>
      <Button onClick={() => setShowVisitorForm(true)} className="gap-2"><Plus data-icon="inline-start" /> Check in visitor</Button>
    </header>
    <section className="grid gap-4 sm:grid-cols-3"><Metric icon={UsersRound} label="Visitors in office" value={activeVisitors.length} detail="Live visitor register" /><Metric icon={UserRound} label="Staff signed in" value={activeStaff.length} detail="Current working day" /><Metric icon={CalendarDays} label="Today’s events" value={todayEvents.length} detail="Shared company calendar" /></section>
    <div className="flex gap-2 border-b border-border"><Button variant={tab === 'visitors' ? 'default' : 'ghost'} onClick={() => setTab('visitors')}>Visitor logbook</Button><Button variant={tab === 'staff' ? 'default' : 'ghost'} onClick={() => setTab('staff')}>Staff logbook</Button><Button variant={tab === 'calendar' ? 'default' : 'ghost'} onClick={() => setTab('calendar')}>Calendar</Button><Button variant={tab === 'items' ? 'default' : 'ghost'} onClick={() => setTab('items')}>Item Register</Button></div>
    {tab === 'visitors' && <Card><CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Visitor logbook</CardTitle><p className="mt-1 text-sm text-muted-foreground">Every arrival is time-stamped and scoped to JCL Real Estate.</p></div><div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search visitor or host" value={search} onChange={e => setSearch(e.target.value)} /></div></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead><tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground"><th className="p-3">Visitor</th><th className="p-3">Host / purpose</th><th className="p-3">Arrival</th><th className="p-3">Status</th><th className="p-3 text-right">Action</th></tr></thead><tbody>{visibleVisitors.map(v => <tr key={v.id} className="border-b last:border-0"><td className="p-3"><div className="font-medium">{v.visitor_name}</div><div className="text-xs text-muted-foreground">{v.visitor_company || 'Independent visitor'}</div></td><td className="p-3"><div>{v.host_name}</div><div className="text-xs text-muted-foreground">{v.purpose}</div></td><td className="p-3 text-muted-foreground">{v.checked_in_at ? new Date(v.checked_in_at).toLocaleString() : '—'}</td><td className="p-3"><Badge variant={v.status === 'checked_in' ? 'default' : 'secondary'}>{v.status === 'checked_in' ? 'In office' : 'Checked out'}</Badge></td><td className="p-3 text-right">{v.status === 'checked_in' && <Button size="sm" variant="outline" onClick={() => checkOutVisitor(v.id)}><LogOut data-icon="inline-start" /> Check out</Button>}</td></tr>)}{!loading && visibleVisitors.length === 0 && <tr><td className="p-8 text-center text-muted-foreground" colSpan="5">No visitor records found.</td></tr>}</tbody></table></div></CardContent></Card>}
    {tab === 'staff' && <Card><CardHeader><CardTitle>Staff logbook</CardTitle><p className="mt-1 text-sm text-muted-foreground">Use the logbook for reliable working-hours and attendance records.</p></CardHeader><CardContent className="space-y-3">{staff.map(record => <div key={record.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{record.staff_name || record.name || 'Staff member'}</p><p className="text-sm text-muted-foreground">{record.staff_email || record.email || 'No email recorded'}</p></div><div className="flex items-center gap-3"><Badge variant={record.status === 'checked_in' ? 'default' : 'secondary'}>{record.status === 'checked_in' ? `In since ${new Date(record.logged_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Logged out'}</Badge><Button size="sm" variant="outline" onClick={() => toggleStaff(record)}>{record.status === 'checked_in' ? <><LogOut data-icon="inline-start" /> Log out</> : <><LogIn data-icon="inline-start" /> Log in</>}</Button></div></div>)}{staff.length === 0 && <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No staff logbook records yet.</div>}</CardContent></Card>}
    {tab === 'items' && <JCLItemRegister />}
    {tab === 'calendar' && <Card><CardHeader><CardTitle>Calendar</CardTitle><p className="mt-1 text-sm text-muted-foreground">Company tasks and scheduled activity appear here alongside visitor operations.</p></CardHeader><CardContent className="space-y-3">{events.map(event => <div key={event.id} className="flex items-start gap-3 rounded-lg border p-4"><Clock3 className="mt-0.5 text-primary" /><div><p className="font-medium">{event.title}</p><p className="text-sm text-muted-foreground">{event.due_date || event.created_at ? new Date(event.due_date || event.created_at).toLocaleString() : 'Date to be confirmed'}</p></div></div>)}{events.length === 0 && <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No calendar events found.</div>}</CardContent></Card>}
    {showVisitorForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="visitor-dialog-title" onMouseDown={event => { if (event.target === event.currentTarget) setShowVisitorForm(false); }}><Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border-primary/30 shadow-2xl"><CardHeader><CardTitle id="visitor-dialog-title">Check in</CardTitle><p className="text-sm text-muted-foreground">Choose the record type before entering details.</p></CardHeader><CardContent><form onSubmit={checkInVisitor} className="grid gap-4 md:grid-cols-2"><Field label="Record type"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={visitorForm.entryType} onChange={e => setVisitorForm({ ...emptyVisitor, entryType: e.target.value })}><option value="visitor">Visitor</option><option value="staff">Staff member</option></select></Field>{visitorForm.entryType === 'staff' ? <><Field label="Staff name"><Input value={visitorForm.staffName} onChange={e => setVisitorForm({ ...visitorForm, staffName: e.target.value })} required /></Field><Field label="Staff email"><Input type="email" value={visitorForm.staffEmail} onChange={e => setVisitorForm({ ...visitorForm, staffEmail: e.target.value })} /></Field></> : <><Field label="Visitor name"><Input value={visitorForm.visitorName} onChange={e => setVisitorForm({ ...visitorForm, visitorName: e.target.value })} required /></Field><Field label="Company"><Input value={visitorForm.visitorCompany} onChange={e => setVisitorForm({ ...visitorForm, visitorCompany: e.target.value })} /></Field><Field label="Host / employee"><Input value={visitorForm.hostName} onChange={e => setVisitorForm({ ...visitorForm, hostName: e.target.value })} required /></Field><Field label="Phone"><Input value={visitorForm.phone} onChange={e => setVisitorForm({ ...visitorForm, phone: e.target.value })} /></Field><Field label="Purpose"><Input value={visitorForm.purpose} onChange={e => setVisitorForm({ ...visitorForm, purpose: e.target.value })} required /></Field><Field label="Notes"><Textarea value={visitorForm.notes} onChange={e => setVisitorForm({ ...visitorForm, notes: e.target.value })} /></Field></> }<div className="flex gap-2 md:col-span-2"><Button type="submit" className="gap-2"><ShieldCheck data-icon="inline-start" /> Save {visitorForm.entryType === 'staff' ? 'staff check-in' : 'visitor arrival'}</Button><Button type="button" variant="outline" onClick={() => setShowVisitorForm(false)}>Cancel</Button></div></form></CardContent></Card></div>}
  </main>;
}
function Metric({ icon: Icon, label, value, detail }) { return <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-primary/10 p-3 text-primary"><Icon /></div><div><p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p><p className="text-2xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{detail}</p></div></CardContent></Card>; }
function Field({ label, children }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
