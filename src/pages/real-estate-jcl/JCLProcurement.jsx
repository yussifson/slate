import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowUpRight, ClipboardList, Edit3, Plus, RefreshCw, Search, Truck } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/api/supabaseClient';
import { JCLProcurementService } from '@/services/JCLProcurementService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const statusLabels = { draft: 'Draft', submitted: 'Submitted', under_review: 'Under review', approved: 'Approved', rejected: 'Rejected', pending_approval: 'Pending approval', issued: 'Issued', acknowledged: 'Acknowledged', partially_delivered: 'Partially delivered', fully_delivered: 'Fully delivered' };
const blankForm = { project_id: '', department: 'Construction', priority: 'normal', required_date: '', description: '', justification: '' };

function Metric({ label, value, tone, icon: Icon }) {
  return <Card><CardContent className="flex items-start justify-between p-5"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p></div><div className={`rounded-lg p-2 ${tone}`}><Icon className="size-4" /></div></CardContent></Card>;
}

export default function JCLProcurement({ defaultTab = 'requisitions' }) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const companyId = useCompanyId();
  const activeTab = ['requisitions', 'orders', 'inventory'].includes(searchParams.get('tab')) ? searchParams.get('tab') : defaultTab;
  const [data, setData] = useState({ requisitions: [], purchaseOrders: [], receipts: [], balances: [], stats: {} });
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRequisition, setEditingRequisition] = useState(null);
  const [form, setForm] = useState(blankForm);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [nextData, projectResult] = await Promise.all([
        JCLProcurementService.dashboard(companyId),
        supabase.from('ops_projects').select('id,name,project_code,status').eq('company_id', companyId).order('name')
      ]);
      if (projectResult.error) throw projectResult.error;
      setData(nextData);
      setProjects(projectResult.data || []);
    } catch (error) {
      toast.error(error.message || 'Unable to load procurement data');
    } finally { setLoading(false); }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const filteredRequisitions = useMemo(() => data.requisitions.filter(row => `${row.reference} ${row.description || ''} ${row.ops_projects?.name || ''}`.toLowerCase().includes(query.toLowerCase())), [data.requisitions, query]);
  const filteredBalances = useMemo(() => data.balances.filter(row => `${row.jcl_materials?.reference} ${row.jcl_materials?.name} ${row.jcl_storage_locations?.name}`.toLowerCase().includes(query.toLowerCase())), [data.balances, query]);

  const openCreate = () => { setEditingRequisition(null); setForm({ ...blankForm, project_id: projects[0]?.id || '' }); setDialogOpen(true); };
  const openEdit = row => {
    setEditingRequisition(row);
    setForm({ project_id: row.project_id || '', department: row.department || 'Construction', priority: row.priority || 'normal', required_date: row.required_date || '', description: row.description || '', justification: row.justification || '' });
    setDialogOpen(true);
  };
  const saveRequisition = async event => {
    event.preventDefault();
    if (!form.project_id || !form.description.trim()) { toast.error('Select a project and add a requirement description.'); return; }
    try {
      if (editingRequisition) await JCLProcurementService.updateRequisition(companyId, editingRequisition.id, form);
      else await JCLProcurementService.createRequisition(companyId, user?.id, form);
      toast.success(editingRequisition ? 'Requisition updated' : 'Requisition saved as draft');
      setDialogOpen(false);
      await load();
    } catch (error) { toast.error(error.message || 'Unable to save requisition'); }
  };

  const stat = data.stats;
  return <main className="min-h-full bg-background p-4 sm:p-6 lg:p-8"><div className="mx-auto flex max-w-7xl flex-col gap-6">
    <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-primary">JCL Royal Group / Procurement</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{activeTab === 'requisitions' ? 'Requisitions' : activeTab === 'orders' ? 'Purchase orders' : 'Materials & inventory'}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{activeTab === 'requisitions' ? 'Raise and manage traceable project requirements.' : activeTab === 'orders' ? 'Track supplier commitments, approvals and delivery status.' : 'Review materials, locations and available project stock.'}</p></div><div className="flex gap-2"><Button variant="outline" onClick={load} disabled={loading}><RefreshCw data-icon="inline-start" className={loading ? 'animate-spin' : ''} />Refresh</Button>{activeTab === 'requisitions' && <Button onClick={openCreate}><Plus data-icon="inline-start" />New requisition</Button>}</div></header>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Total requisitions" value={stat.requisitions || 0} tone="bg-primary/10 text-primary" icon={ClipboardList} /><Metric label="Awaiting action" value={stat.pendingRequisitions || 0} tone="bg-amber-500/10 text-amber-600" icon={AlertCircle} /><Metric label="Approved orders" value={stat.approvedOrders || 0} tone="bg-emerald-500/10 text-emerald-600" icon={ArrowUpRight} /><Metric label="Pending deliveries" value={stat.pendingDeliveries || 0} tone="bg-sky-500/10 text-sky-600" icon={Truck} /></section>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">Procurement registers</h2><p className="text-sm text-muted-foreground">Live records from Supabase, scoped to your company.</p></div><div className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search procurement registers" className="pl-9" placeholder="Search records" value={query} onChange={event => setQuery(event.target.value)} /></div></div>
    <Tabs value={activeTab} onValueChange={value => setSearchParams({ tab: value })}><TabsList><TabsTrigger value="requisitions">Requisitions</TabsTrigger><TabsTrigger value="orders">Purchase orders</TabsTrigger><TabsTrigger value="inventory">Materials & inventory</TabsTrigger></TabsList><TabsContent value="requisitions"><RequisitionTable rows={filteredRequisitions} onEdit={openEdit} /></TabsContent><TabsContent value="orders"><OrderTable rows={data.purchaseOrders} /></TabsContent><TabsContent value="inventory"><InventoryTable rows={filteredBalances} /></TabsContent></Tabs>
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{editingRequisition ? 'Edit requisition' : 'Raise purchase requisition'}</DialogTitle><DialogDescription>Link the requirement to a project before saving it as a controlled draft.</DialogDescription></DialogHeader><form className="grid gap-4 md:grid-cols-2" onSubmit={saveRequisition}><div className="grid gap-2"><Label htmlFor="project">Project</Label><Select value={form.project_id} onValueChange={value => setForm({ ...form, project_id: value })}><SelectTrigger id="project"><SelectValue placeholder="Select project" /></SelectTrigger><SelectContent>{projects.map(project => <SelectItem key={project.id} value={project.id}>{project.project_code} · {project.name}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label htmlFor="required-date">Required date</Label><Input id="required-date" type="date" value={form.required_date} onChange={event => setForm({ ...form, required_date: event.target.value })} /></div><div className="grid gap-2"><Label htmlFor="department">Requesting department</Label><Input id="department" value={form.department} onChange={event => setForm({ ...form, department: event.target.value })} /></div><div className="grid gap-2"><Label htmlFor="priority">Priority</Label><Select value={form.priority} onValueChange={value => setForm({ ...form, priority: value })}><SelectTrigger id="priority"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent></Select></div><div className="grid gap-2 md:col-span-2"><Label htmlFor="description">Requirement description</Label><Textarea id="description" placeholder="e.g. 40 bags of 42.5R cement for foundation works" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></div><div className="grid gap-2 md:col-span-2"><Label htmlFor="justification">Justification and notes</Label><Textarea id="justification" value={form.justification} onChange={event => setForm({ ...form, justification: event.target.value })} /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit">{editingRequisition ? 'Save changes' : 'Save requisition'}</Button></DialogFooter></form></DialogContent></Dialog>
  </div></main>;
}

function RequisitionTable({ rows, onEdit }) { return <Card><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-b bg-muted/40 text-left text-muted-foreground"><tr><th className="p-4 font-medium">Reference</th><th className="p-4 font-medium">Project</th><th className="p-4 font-medium">Required</th><th className="p-4 font-medium">Priority</th><th className="p-4 font-medium">Status</th><th className="p-4" /></tr></thead><tbody>{rows.length ? rows.map(row => <tr className="border-b last:border-0" key={row.id}><td className="p-4 font-medium">{row.reference}</td><td className="p-4">{row.ops_projects?.name || 'Unassigned'}</td><td className="p-4 text-muted-foreground">{row.required_date || '—'}</td><td className="p-4 capitalize">{row.priority}</td><td className="p-4"><Badge variant="secondary">{statusLabels[row.status] || row.status}</Badge></td><td className="p-4 text-right"><Button variant="ghost" size="icon" onClick={() => onEdit(row)} aria-label={`Edit ${row.reference}`}><Edit3 className="size-4" /></Button></td></tr>) : <tr><td className="p-8 text-center text-muted-foreground" colSpan="6">No requisitions match this search.</td></tr>}</tbody></table></div></CardContent></Card>; }
function OrderTable({ rows }) { return <Card><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-b bg-muted/40 text-left text-muted-foreground"><tr><th className="p-4 font-medium">PO reference</th><th className="p-4 font-medium">Supplier</th><th className="p-4 font-medium">Project</th><th className="p-4 font-medium">Value</th><th className="p-4 font-medium">Status</th></tr></thead><tbody>{rows.length ? rows.map(row => <tr className="border-b last:border-0" key={row.id}><td className="p-4 font-medium">{row.reference}</td><td className="p-4">{row.supplier_name || '—'}</td><td className="p-4">{row.ops_projects?.name || 'Unassigned'}</td><td className="p-4">{Number(row.total_amount || 0).toLocaleString()}</td><td className="p-4"><Badge variant="secondary">{statusLabels[row.status] || row.status}</Badge></td></tr>) : <tr><td className="p-8 text-center text-muted-foreground" colSpan="5">No purchase orders found.</td></tr>}</tbody></table></div></CardContent></Card>; }
function InventoryTable({ rows }) { return <Card><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-b bg-muted/40 text-left text-muted-foreground"><tr><th className="p-4 font-medium">Material</th><th className="p-4 font-medium">Location</th><th className="p-4 font-medium">Available</th><th className="p-4 font-medium">Allocated</th><th className="p-4 font-medium">Consumed</th></tr></thead><tbody>{rows.length ? rows.map(row => <tr className="border-b last:border-0" key={row.id}><td className="p-4 font-medium">{row.jcl_materials?.name || '—'}</td><td className="p-4">{row.jcl_storage_locations?.name || '—'}</td><td className="p-4">{row.available_quantity}</td><td className="p-4">{row.allocated_quantity}</td><td className="p-4">{row.consumed_quantity}</td></tr>) : <tr><td className="p-8 text-center text-muted-foreground" colSpan="5">No inventory balances found.</td></tr>}</tbody></table></div></CardContent></Card>; }
