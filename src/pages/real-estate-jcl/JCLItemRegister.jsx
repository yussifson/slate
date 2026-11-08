import React, { useEffect, useMemo, useState } from 'react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardCheck, History, Plus, RotateCcw, Search, X, Package, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createNotificationEvent } from '@/utils/notificationDispatcher';
import { cn } from '@/lib/utils';

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
    let itemRows = [];
    let historyRows = [];

    const [itemResult, peopleResult, historyResult] = await Promise.all([
      safe('SELECT * FROM jcl_item_register WHERE company_id = ? ORDER BY issued_at DESC', [companyId]),
      safe('SELECT id, name, first_name, last_name, email, status FROM univ_hr_employees WHERE company_id = ? ORDER BY name ASC, first_name ASC, last_name ASC', [companyId]),
      safe('SELECT * FROM jcl_item_register_history WHERE company_id = ? ORDER BY changed_at DESC', [companyId])
    ]);

    itemRows = rowsOf(itemResult);
    historyRows = rowsOf(historyResult);

    // If local tables are empty, try Supabase fallback
    if (itemRows.length === 0) {
      try {
        const { data: supaItems } = await supabase
          .from('jcl_item_register')
          .select('*')
          .eq('company_id', companyId)
          .order('issued_at', { ascending: false });
        if (supaItems && supaItems.length > 0) itemRows = supaItems;
      } catch (_) {}
    }

    setItems(itemRows);
    setPeople(rowsOf(peopleResult).map(person => ({
      ...person,
      name: person.name || [person.first_name, person.last_name].filter(Boolean).join(' ') || person.email || 'Unnamed employee'
    })).filter(person => !person.status || String(person.status).toLowerCase() === 'active'));
    setHistory(historyRows);
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

  const counts = items.reduce((acc, item) => {
    acc.total += 1;
    acc[statusFor(item)] += 1;
    return acc;
  }, { total: 0, issued: 0, returned: 0, overdue: 0 });

  const saveItem = async event => {
    event.preventDefault();
    if (!form.personId || !form.itemName.trim() || !form.issuedAt) return toast.error('Select an employee and enter item details.');
    const now = new Date().toISOString();
    const itemId = uuid();
    const payload = {
      id: itemId,
      company_id: companyId,
      person_id: form.personId,
      person_name: form.personName,
      item_name: form.itemName.trim(),
      description: form.description.trim() || null,
      issued_at: new Date(form.issuedAt).toISOString(),
      expected_return_at: form.expectedReturn ? new Date(form.expectedReturn).toISOString() : null,
      status: 'issued',
      issued_by_id: user?.id || null,
      issued_by_name: user?.user_metadata?.full_name || user?.email || 'Authorized user',
      notes: form.notes.trim() || null,
      created_at: now,
      updated_at: now
    };

    try {
      try {
        await powerSync.execute(
          `INSERT INTO jcl_item_register (id, company_id, person_id, person_name, item_name, description, issued_at, expected_return_at, status, issued_by_id, issued_by_name, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'issued', ?, ?, ?, ?, ?)`,
          [payload.id, companyId, payload.person_id, payload.person_name, payload.item_name, payload.description, payload.issued_at, payload.expected_return_at, payload.issued_by_id, payload.issued_by_name, payload.notes, now, now]
        );
      } catch (_) {}

      try {
        await supabase.from('jcl_item_register').insert(payload);
      } catch (_) {}

      toast.success('Item issuance recorded');
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (error) {
      console.error('[v0] Item register save failed:', error);
      toast.error('Unable to save the item record.');
    }
  };

  const markReturned = async event => {
    event.preventDefault();
    if (!returning) return;
    const now = new Date().toISOString();
    const receiver = returning.receivedBy.trim() || user?.user_metadata?.full_name || user?.email || 'Authorized user';
    const condition = returning.condition.trim() || null;
    const notes = returning.notes.trim() || null;

    try {
      try {
        await powerSync.execute(
          `UPDATE jcl_item_register SET status = 'returned', actual_return_at = ?, returned_to_name = ?, return_condition = ?, return_notes = ?, updated_at = ? WHERE id = ? AND company_id = ?`,
          [now, receiver, condition, notes, now, returning.item.id, companyId]
        );
        await powerSync.execute(
          `INSERT INTO jcl_item_register_history (id, company_id, item_id, status, changed_at, changed_by_id, changed_by_name, notes) VALUES (?, ?, ?, 'returned', ?, ?, ?, ?)`,
          [uuid(), companyId, returning.item.id, now, user?.id || null, receiver, notes]
        );
      } catch (_) {}

      try {
        await supabase
          .from('jcl_item_register')
          .update({
            status: 'returned',
            actual_return_at: now,
            returned_to_name: receiver,
            return_condition: condition,
            return_notes: notes,
            updated_at: now
          })
          .eq('id', returning.item.id)
          .eq('company_id', companyId);
      } catch (_) {}

      toast.success('Item marked as returned');
      setReturning(null);
      load();
    } catch (error) {
      console.error('[v0] Item return failed:', error);
      toast.error('Unable to update the item.');
    }
  };

  return (
    <main className="w-full max-w-full space-y-4 sm:space-y-6 p-3 sm:p-6 lg:p-8 pb-24 overflow-x-hidden">
      {/* ── 1. Clean Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Item Register
          </h1>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto h-9 px-4 gap-1.5 text-xs font-bold bg-[#005A9C] hover:bg-[#00477D] text-white shadow-xs rounded-xl justify-center shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Issue Item Record
        </Button>
      </div>

      {/* ── 2. Mobile 2x2 Dedicated Stats Grid (< md) ── */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:hidden">
        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Package className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider truncate">Total Items</span>
          </div>
          <p className="text-lg font-black text-foreground truncate">{counts.total}</p>
          <span className="text-[9px] text-muted-foreground font-semibold">Registered items</span>
        </div>

        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <ClipboardCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider truncate">Outstanding</span>
          </div>
          <p className="text-lg font-black text-amber-600 truncate">{counts.issued}</p>
          <span className="text-[9px] text-muted-foreground font-semibold">Currently held</span>
        </div>

        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <RotateCcw className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider truncate">Returned</span>
          </div>
          <p className="text-lg font-black text-emerald-600 truncate">{counts.returned}</p>
          <span className="text-[9px] text-muted-foreground font-semibold">Restocked safe</span>
        </div>

        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider truncate">Overdue</span>
          </div>
          <p className="text-lg font-black text-rose-600 truncate">{counts.overdue}</p>
          <span className="text-[9px] text-muted-foreground font-semibold">Pending return</span>
        </div>
      </div>

      {/* ── Desktop Executive KPI Cards (>= md) ── */}
      <section className="hidden md:grid md:grid-cols-4 gap-4">
        <Metric label="Total Issued" value={counts.total} icon={Package} tone="blue" />
        <Metric label="Currently Outstanding" value={counts.issued} icon={ClipboardCheck} tone="amber" />
        <Metric label="Returned" value={counts.returned} icon={RotateCcw} tone="emerald" />
        <Metric label="Overdue Items" value={counts.overdue} icon={ShieldCheck} tone="rose" />
      </section>

      {/* ── 3. Issuance Register ── */}
      <section className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Issuance Records</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                className="pl-9 h-9 text-xs rounded-xl"
                placeholder="Search item or person..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="h-9 rounded-xl border border-input bg-background px-3 text-xs font-semibold"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="issued">Issued</option>
              <option value="overdue">Overdue</option>
              <option value="returned">Returned</option>
            </select>
          </div>
        </div>

        {/* Mobile Native Card View (< md) */}
        <div className="md:hidden space-y-2.5">
          {visibleItems.map(item => {
            const status = statusFor(item);
            return (
              <div key={item.id} className="p-3.5 bg-muted/20 border border-border/60 rounded-xl space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm text-foreground">{item.item_name}</p>
                    <p className="text-xs text-muted-foreground">{item.description || 'No description'}</p>
                  </div>
                  <Badge variant={status === 'returned' ? 'secondary' : 'default'} className={cn("text-[10px] font-bold capitalize", status === 'overdue' ? 'bg-rose-500 text-white' : status === 'issued' ? 'bg-[#005A9C] text-white' : '')}>
                    {status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground pt-1 border-t border-border/40 space-y-1">
                  <div>Issued to: <strong className="text-foreground">{item.person_name}</strong></div>
                  <div className="text-[11px] font-mono">Issued: {new Date(item.issued_at).toLocaleDateString()} {item.expected_return_at ? `· Expected: ${new Date(item.expected_return_at).toLocaleDateString()}` : ''}</div>
                </div>
                <div className="flex gap-2 pt-1 border-t border-border/40">
                  <Button size="sm" variant="ghost" onClick={() => setHistoryItem(item)} className="h-8 text-xs font-bold flex-1 rounded-xl">
                    <History className="mr-1 h-3.5 w-3.5" /> History
                  </Button>
                  {status !== 'returned' && (
                    <Button size="sm" variant="outline" onClick={() => setReturning({ item, receivedBy: '', condition: '', notes: '' })} className="h-8 text-xs font-bold flex-1 rounded-xl">
                      <RotateCcw className="mr-1 h-3.5 w-3.5" /> Return
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {!loading && visibleItems.length === 0 && (
            <div className="py-12 text-center text-xs text-muted-foreground">No item records match the current filters.</div>
          )}
        </div>

        {/* Desktop Table View (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                <th className="p-3">Item</th>
                <th className="p-3">Collected By</th>
                <th className="p-3">Issued Date</th>
                <th className="p-3">Expected Return</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleItems.map(item => {
                const status = statusFor(item);
                return (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-foreground">{item.item_name}</div>
                      <div className="text-xs text-muted-foreground">{item.description || 'No description'}</div>
                    </td>
                    <td className="p-3 font-semibold text-foreground">{item.person_name}</td>
                    <td className="p-3 text-muted-foreground font-mono">{new Date(item.issued_at).toLocaleString()}</td>
                    <td className="p-3 text-muted-foreground font-mono">{item.expected_return_at ? new Date(item.expected_return_at).toLocaleDateString() : '—'}</td>
                    <td className="p-3">
                      <Badge variant={status === 'returned' ? 'secondary' : 'default'} className={status === 'overdue' ? 'bg-rose-500 text-white' : status === 'issued' ? 'bg-[#005A9C] text-white' : ''}>
                        {status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="ghost" onClick={() => setHistoryItem(item)} className="h-8 text-xs font-semibold rounded-xl">
                          <History className="mr-1 h-3.5 w-3.5" /> History
                        </Button>
                        {status !== 'returned' && (
                          <Button size="sm" variant="outline" onClick={() => setReturning({ item, receivedBy: '', condition: '', notes: '' })} className="h-8 text-xs font-bold rounded-xl">
                            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Return
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && visibleItems.length === 0 && (
            <div className="py-12 text-center text-xs text-muted-foreground">No item records match the current filters.</div>
          )}
        </div>
      </section>

      {/* Modal: Add Item */}
      {showForm && (
        <Modal title="Issue Item Record" onClose={() => setShowForm(false)}>
          <form onSubmit={saveItem} className="space-y-3.5">
            <Field label="Employee">
              <Input placeholder="Search employee..." value={personSearch} onChange={e => setPersonSearch(e.target.value)} className="h-9 text-xs mb-1.5" />
              <select
                className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs"
                value={form.personId}
                onChange={e => {
                  const person = people.find(p => p.id === e.target.value);
                  setForm({ ...form, personId: person?.id || '', personName: person?.name || '' });
                }}
                required
              >
                <option value="">Select an employee</option>
                {visiblePeople.map(person => (
                  <option key={person.id} value={person.id}>{person.name}{person.email ? ` · ${person.email}` : ''}</option>
                ))}
              </select>
            </Field>
            <Field label="Item Name">
              <Input value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })} required className="h-9 text-xs" />
            </Field>
            <Field label="Description / Serial #">
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="text-xs" />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Date & Time Issued">
                <Input type="datetime-local" value={form.issuedAt} onChange={e => setForm({ ...form, issuedAt: e.target.value })} required className="h-9 text-xs" />
              </Field>
              <Field label="Expected Return">
                <Input type="datetime-local" value={form.expectedReturn} onChange={e => setForm({ ...form, expectedReturn: e.target.value })} className="h-9 text-xs" />
              </Field>
            </div>
            <Field label="Notes">
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="text-xs" />
            </Field>
            <Button type="submit" className="w-full h-9 text-xs font-bold bg-[#005A9C] text-white rounded-xl">
              Save Issuance Record
            </Button>
          </form>
        </Modal>
      )}

      {/* Modal: Return Item */}
      {returning && (
        <Modal title={`Return ${returning.item.item_name}`} onClose={() => setReturning(null)}>
          <form onSubmit={markReturned} className="space-y-3.5">
            <Field label="Received By">
              <Input value={returning.receivedBy} onChange={e => setReturning({ ...returning, receivedBy: e.target.value })} placeholder="Receiver name" className="h-9 text-xs" />
            </Field>
            <Field label="Return Condition">
              <Input value={returning.condition} onChange={e => setReturning({ ...returning, condition: e.target.value })} placeholder="Good, damaged, missing parts..." className="h-9 text-xs" />
            </Field>
            <Field label="Notes">
              <Textarea value={returning.notes} onChange={e => setReturning({ ...returning, notes: e.target.value })} className="text-xs" />
            </Field>
            <Button type="submit" className="w-full h-9 text-xs font-bold bg-[#005A9C] text-white rounded-xl">
              Confirm Return
            </Button>
          </form>
        </Modal>
      )}

      {/* Modal: History */}
      {historyItem && (
        <Modal title={`${historyItem.item_name} History`} onClose={() => setHistoryItem(null)}>
          <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
            {history.filter(event => event.item_id === historyItem.id).map(event => (
              <div key={event.id} className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <Badge className="text-[10px] capitalize">{event.status}</Badge>
                  <span className="text-[11px] font-mono text-muted-foreground">{new Date(event.changed_at).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-xs font-bold text-foreground">{event.changed_by_name || 'Authorized user'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{event.notes || 'No additional notes.'}</p>
              </div>
            ))}
            {!history.some(event => event.item_id === historyItem.id) && (
              <p className="text-xs text-muted-foreground py-6 text-center">No history events recorded yet.</p>
            )}
          </div>
        </Modal>
      )}
    </main>
  );
}

function Metric({ label, value, icon: Icon, tone = 'blue' }) {
  const tones = {
    blue: 'bg-[#005A9C]/10 text-[#005A9C]',
    amber: 'bg-amber-500/10 text-amber-600',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    rose: 'bg-rose-500/10 text-rose-600'
  };

  return (
    <Card className="rounded-2xl border border-border/80 shadow-xs">
      <CardContent className="flex items-center gap-3.5 p-4">
        <div className={cn("rounded-xl p-2.5 shrink-0", tones[tone])}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">{label}</p>
          <p className="text-xl font-black text-foreground mt-0.5">{value}</p>
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

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-0 sm:p-4" role="dialog" aria-modal="true" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full sm:max-w-xl bg-card border-t sm:border border-border/80 rounded-t-[28px] sm:rounded-2xl max-h-[92dvh] sm:max-h-[85vh] overflow-y-auto overscroll-contain shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 pb-[calc(1.5rem+env(safe-area-inset-bottom,20px))] sm:pb-0 flex flex-col">
        <div className="sm:hidden w-12 h-1.5 rounded-full bg-black/20 dark:bg-white/20 mx-auto mt-3 mb-1 shrink-0" aria-hidden="true" />
        <CardHeader className="flex-row items-center justify-between border-b border-border/60 pb-3 px-5 sm:px-6 pt-4 shrink-0">
          <CardTitle className="text-base font-bold text-foreground">{title}</CardTitle>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all">
            <X className="w-4 h-4" />
          </button>
        </CardHeader>
        <CardContent className="pt-4 px-5 sm:px-6 pb-6">{children}</CardContent>
      </div>
    </div>
  );
}
