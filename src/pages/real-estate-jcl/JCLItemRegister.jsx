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
import { ClipboardCheck, History, Plus, RotateCcw, Search, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const emptyForm = { personId: '', personName: '', itemName: '', description: '', issuedAt: new Date().toISOString().slice(0, 16), expectedReturn: '', notes: '' };
const rowsOf = result => result?.rows?._array || Array.from(result?.rows || []);
const uuid = () => crypto.randomUUID();

function statusFor(item) {
  if (item.status === 'returned') return 'returned';
  if (item.expected_return_at && new Date(item.expected_return_at) < new Date()) return 'overdue';
  return 'issued';
}

export default function JCLItemRegister() {
  const powerSync = usePowerSync();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [people, setPeople] = useState([]);
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [personSearch, setPersonSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [returning, setReturning] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [historyItem, setHistoryItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!companyId) return;
    setLoading(true);
    const safe = (sql, params = []) => powerSync.execute(sql, params).catch(() => ({ rows: [] }));
    const [itemResult, peopleResult, historyResult] = await Promise.all([
      safe('SELECT * FROM jcl_item_register WHERE company_id = ? ORDER BY issued_at DESC', [companyId]),
      safe('SELECT id, name, first_name, last_name, email, status FROM univ_hr_employees WHERE company_id = ? ORDER BY name ASC, first_name ASC, last_name ASC', [companyId]),
      safe('SELECT * FROM jcl_item_register_history WHERE company_id = ? ORDER BY changed_at DESC', [companyId])
    ]);
    setItems(rowsOf(itemResult));
    setPeople(rowsOf(peopleResult).map(person => ({
      ...person,
      name: person.name || [person.first_name, person.last_name].filter(Boolean).join(' ') || person.email || 'Unnamed employee'
    })).filter(person => !person.status || String(person.status).toLowerCase() === 'active'));
    setHistory(rowsOf(historyResult));
    setLoading(false);
  };

  useEffect(() => { load(); }, [companyId]);

  const visiblePeople = people.filter(person => `${person.name} ${person.email || ''}`.toLowerCase().includes(personSearch.toLowerCase()));
  const visibleItems = useMemo(() => items.filter(item => {
    const status = statusFor(item);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    const haystack = `${item.item_name} ${item.person_name} ${item.description || ''}`.toLowerCase();
    return matchesStatus && haystack.includes(search.toLowerCase());
  }), [items, search, statusFilter]);
  const counts = items.reduce((acc, item) => { acc.total += 1; acc[statusFor(item)] += 1; return acc; }, { total: 0, issued: 0, returned: 0, overdue: 0 });

  const saveItem = async event => {
    event.preventDefault();
    if (!form.personId || !form.itemName.trim() || !form.issuedAt) return toast.error('Select a person and enter the item and issue time.');
    const now = new Date().toISOString();
    try {
      await powerSync.execute(`INSERT INTO jcl_item_register (id, company_id, person_id, person_name, item_name, description, issued_at, expected_return_at, status, issued_by_id, issued_by_name, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'issued', ?, ?, ?, ?, ?)`, [uuid(), companyId, form.personId, form.personName, form.itemName.trim(), form.description.trim() || null, new Date(form.issuedAt).toISOString(), form.expectedReturn ? new Date(form.expectedReturn).toISOString() : null, user?.id || null, user?.user_metadata?.full_name || user?.email || 'Authorized user', form.notes.trim() || null, now, now]);
      toast.success('Item issuance recorded'); setForm(emptyForm); setShowForm(false); load();
    } catch (error) { console.error('[v0] Item register save failed:', error); toast.error('Unable to save the item record.'); }
  };

  const markReturned = async event => {
    event.preventDefault();
    if (!returning) return;
    const now = new Date().toISOString();
    try {
      await powerSync.execute('UPDATE jcl_item_register SET status = \'returned\', actual_return_at = ?, returned_to_name = ?, return_condition = ?, return_notes = ?, updated_at = ? WHERE id = ? AND company_id = ?', [now, returning.receivedBy.trim() || user?.user_metadata?.full_name || user?.email, returning.condition.trim() || null, returning.notes.trim() || null, now, returning.item.id, companyId]);
      await powerSync.execute('INSERT INTO jcl_item_register_history (id, company_id, item_id, status, changed_at, changed_by_id, changed_by_name, notes) VALUES (?, ?, ?, \'returned\', ?, ?, ?, ?)', [uuid(), companyId, returning.item.id, now, user?.id || null, user?.user_metadata?.full_name || user?.email || 'Authorized user', returning.notes.trim() || null]);
      toast.success('Item marked as returned'); setReturning(null); load();
    } catch (error) { console.error('[v0] Item return failed:', error); toast.error('Unable to update the item.'); }
  };

  return <main className="space-y-6 p-4 pb-24 md:p-8">
    <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Secretary · Operations</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Item Register</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Track equipment and documents issued to employees, including return accountability and history.</p></div><Button onClick={() => setShowForm(true)} className="gap-2"><Plus data-icon="inline-start" /> Add Item Record</Button></header>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Total issued" value={counts.total} /><Metric label="Currently outstanding" value={counts.issued} tone="amber" /><Metric label="Returned" value={counts.returned} tone="emerald" /><Metric label="Overdue" value={counts.overdue} tone="rose" /></section>
    <Card><CardHeader className="gap-4 md:flex-row md:items-center md:justify-between"><div><CardTitle>Issuance records</CardTitle><p className="mt-1 text-sm text-muted-foreground">Search active and historical item movements.</p></div><div className="flex flex-col gap-2 sm:flex-row"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search item or person" value={search} onChange={e => setSearch(e.target.value)} /></div><select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">All statuses</option><option value="issued">Issued</option><option value="overdue">Overdue</option><option value="returned">Returned</option></select></div></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full min-w-[920px] text-sm"><thead><tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground"><th className="p-3">Item</th><th className="p-3">Collected by</th><th className="p-3">Issued</th><th className="p-3">Expected return</th><th className="p-3">Actual return</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead><tbody>{visibleItems.map(item => { const status = statusFor(item); return <tr key={item.id} className="border-b last:border-0"><td className="p-3"><div className="font-semibold">{item.item_name}</div><div className="text-xs text-muted-foreground">{item.description || 'No description'}</div></td><td className="p-3">{item.person_name}</td><td className="p-3 text-muted-foreground">{new Date(item.issued_at).toLocaleString()}</td><td className="p-3 text-muted-foreground">{item.expected_return_at ? new Date(item.expected_return_at).toLocaleDateString() : '—'}</td><td className="p-3 text-muted-foreground">{item.actual_return_at ? new Date(item.actual_return_at).toLocaleString() : '—'}</td><td className="p-3"><Badge variant={status === 'returned' ? 'secondary' : 'default'} className={status === 'overdue' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200' : ''}>{status}</Badge></td><td className="p-3"><div className="flex justify-end gap-2"><Button size="sm" variant="ghost" onClick={() => setHistoryItem(item)}><History className="mr-1 h-4 w-4" /> History</Button>{status !== 'returned' && <Button size="sm" variant="outline" onClick={() => setReturning({ item, receivedBy: '', condition: '', notes: '' })}><RotateCcw className="mr-1 h-4 w-4" /> Return</Button>}</div></td></tr>; })}{!loading && visibleItems.length === 0 && <tr><td colSpan="7" className="p-10 text-center text-muted-foreground">No item records match the current filters.</td></tr>}</tbody></table></div></CardContent></Card>
    {showForm && <Modal title="Add item record" onClose={() => setShowForm(false)}><form onSubmit={saveItem} className="space-y-4"><Field label="Person / employee"><Input placeholder="Search employees" value={personSearch} onChange={e => setPersonSearch(e.target.value)} /><select className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.personId} onChange={e => { const person = people.find(p => p.id === e.target.value); setForm({ ...form, personId: person?.id || '', personName: person?.name || '' }); }} required><option value="">Select an employee</option>{visiblePeople.map(person => <option key={person.id} value={person.id}>{person.name}{person.email ? ` · ${person.email}` : ''}</option>)}</select></Field><Field label="Item name"><Input value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })} required /></Field><Field label="Description"><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Date and time issued"><Input type="datetime-local" value={form.issuedAt} onChange={e => setForm({ ...form, issuedAt: e.target.value })} required /></Field><Field label="Expected return"><Input type="datetime-local" value={form.expectedReturn} onChange={e => setForm({ ...form, expectedReturn: e.target.value })} /></Field></div><Field label="Notes"><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field><Button type="submit" className="w-full">Save item record</Button></form></Modal>}
    {returning && <Modal title={`Return ${returning.item.item_name}`} onClose={() => setReturning(null)}><form onSubmit={markReturned} className="space-y-4"><Field label="Received by"><Input value={returning.receivedBy} onChange={e => setReturning({ ...returning, receivedBy: e.target.value })} placeholder="Person receiving the item" /></Field><Field label="Return condition"><Input value={returning.condition} onChange={e => setReturning({ ...returning, condition: e.target.value })} placeholder="Good, damaged, missing parts..." /></Field><Field label="Additional notes"><Textarea value={returning.notes} onChange={e => setReturning({ ...returning, notes: e.target.value })} /></Field><Button type="submit" className="w-full">Confirm return</Button></form></Modal>}
    {historyItem && <Modal title={`${historyItem.item_name} history`} onClose={() => setHistoryItem(null)}><div className="space-y-3">{history.filter(event => event.item_id === historyItem.id).map(event => <div key={event.id} className="rounded-lg border p-3"><div className="flex items-center justify-between"><Badge>{event.status}</Badge><span className="text-xs text-muted-foreground">{new Date(event.changed_at).toLocaleString()}</span></div><p className="mt-2 text-sm">{event.changed_by_name || 'Authorized user'}</p><p className="text-xs text-muted-foreground">{event.notes || 'No additional notes.'}</p></div>)}{!history.some(event => event.item_id === historyItem.id) && <p className="text-sm text-muted-foreground">No history events recorded yet.</p>}</div></Modal>}
  </main>;
}
function Metric({ label, value, tone = 'blue' }) { const tones = { blue: 'bg-primary/10 text-primary', amber: 'bg-amber-500/10 text-amber-600', emerald: 'bg-emerald-500/10 text-emerald-600', rose: 'bg-rose-500/10 text-rose-600' }; return <Card><CardContent className="flex items-center gap-3 p-4"><div className={`rounded-xl p-2.5 ${tones[tone]}`}><ClipboardCheck className="h-5 w-5" /></div><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-semibold">{value}</p></div></CardContent></Card>; }
function Field({ label, children }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function Modal({ title, onClose, children }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><Card className="max-h-[90vh] w-full max-w-xl overflow-y-auto shadow-2xl"><CardHeader className="flex-row items-center justify-between"><CardTitle>{title}</CardTitle><Button variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X /></Button></CardHeader><CardContent>{children}</CardContent></Card></div>; }
