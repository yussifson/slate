import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  AlertCircle, ArrowUpRight, ClipboardList, Edit3, Plus, RefreshCw, 
  Search, Truck, Trash2, CheckCircle2, Package, Check, ShoppingCart
} from 'lucide-react';
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
import { toast } from 'react-hot-toast';

const statusLabels = { 
  draft: 'Draft', 
  submitted: 'Submitted', 
  under_review: 'Under review', 
  approved: 'Approved', 
  rejected: 'Rejected', 
  pending_approval: 'Pending approval', 
  issued: 'Issued', 
  acknowledged: 'Acknowledged', 
  partially_delivered: 'Partially delivered', 
  fully_delivered: 'Fully delivered',
  received: 'Received'
};

const blankRequisitionForm = { 
  project_id: '', 
  department: 'Construction', 
  priority: 'normal', 
  required_date: '', 
  description: '', 
  justification: '',
  status: 'draft'
};

const blankOrderForm = {
  project_id: '',
  supplier_name: '',
  total_amount: '',
  expected_delivery_date: '',
  delivery_address: 'Main Construction Site',
  payment_terms: 'Net 30',
  status: 'draft'
};

const blankMaterialForm = {
  name: '',
  category: 'Civil Materials',
  unit: 'bags',
  unit_cost: ''
};

function Metric({ label, value, tone, icon: Icon }) {
  return (
    <Card className="border border-border/80 shadow-xs bg-card">
      <CardContent className="flex items-start justify-between p-4 sm:p-5">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{value}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${tone}`}>
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function JCLProcurement({ defaultTab = 'requisitions' }) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const companyId = useCompanyId();
  const activeTab = ['requisitions', 'orders', 'inventory'].includes(searchParams.get('tab')) ? searchParams.get('tab') : defaultTab;
  
  const [data, setData] = useState({ requisitions: [], purchaseOrders: [], receipts: [], balances: [], materials: [], stats: {} });
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Requisition Modal
  const [reqModalOpen, setReqModalOpen] = useState(false);
  const [editingReq, setEditingReq] = useState(null);
  const [reqForm, setReqForm] = useState(blankRequisitionForm);

  // Purchase Order Modal
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [editingPo, setEditingPo] = useState(null);
  const [poForm, setPoForm] = useState(blankOrderForm);

  // Material Modal
  const [matModalOpen, setMatModalOpen] = useState(false);
  const [matForm, setMatForm] = useState(blankMaterialForm);

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
      console.error('Procurement load error:', error);
      toast.error(error.message || 'Unable to load procurement data');
    } finally { 
      setLoading(false); 
    }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  // Requisition Handlers
  const openCreateReq = () => { 
    setEditingReq(null); 
    setReqForm({ ...blankRequisitionForm, project_id: projects[0]?.id || '' }); 
    setReqModalOpen(true); 
  };

  const openEditReq = (row) => {
    setEditingReq(row);
    setReqForm({ 
      project_id: row.project_id || '', 
      department: row.department || 'Construction', 
      priority: row.priority || 'normal', 
      required_date: row.required_date || '', 
      description: row.description || '', 
      justification: row.justification || '',
      status: row.status || 'draft'
    });
    setReqModalOpen(true);
  };

  const saveRequisition = async (e) => {
    e.preventDefault();
    if (!reqForm.project_id || !reqForm.description.trim()) { 
      toast.error('Select a project and enter requirement details.'); 
      return; 
    }
    try {
      if (editingReq) {
        await JCLProcurementService.updateRequisition(companyId, editingReq.id, reqForm);
        toast.success('Requisition updated successfully');
      } else {
        await JCLProcurementService.createRequisition(companyId, user?.id, reqForm);
        toast.success('New requisition created');
      }
      setReqModalOpen(false);
      await load();
    } catch (err) { 
      toast.error(err.message || 'Failed to save requisition'); 
    }
  };

  const deleteRequisition = async (id, ref) => {
    if (!window.confirm(`Are you sure you want to delete requisition ${ref}?`)) return;
    try {
      await JCLProcurementService.deleteRequisition(companyId, id);
      toast.success('Requisition deleted');
      await load();
    } catch (err) {
      toast.error(err.message || 'Failed to delete requisition');
    }
  };

  // Purchase Order Handlers
  const openCreatePo = () => {
    setEditingPo(null);
    setPoForm({ ...blankOrderForm, project_id: projects[0]?.id || '' });
    setPoModalOpen(true);
  };

  const openEditPo = (row) => {
    setEditingPo(row);
    setPoForm({
      project_id: row.project_id || '',
      supplier_name: row.supplier_name || '',
      total_amount: row.total_amount || '',
      expected_delivery_date: row.expected_delivery_date || '',
      delivery_address: row.delivery_address || 'Main Site',
      payment_terms: row.payment_terms || 'Net 30',
      status: row.status || 'draft'
    });
    setPoModalOpen(true);
  };

  const savePurchaseOrder = async (e) => {
    e.preventDefault();
    if (!poForm.project_id || !poForm.supplier_name.trim()) {
      toast.error('Project and supplier name are required');
      return;
    }
    try {
      if (editingPo) {
        await JCLProcurementService.updatePurchaseOrder(companyId, editingPo.id, poForm);
        toast.success('Purchase order updated');
      } else {
        await JCLProcurementService.createPurchaseOrder(companyId, user?.id, poForm);
        toast.success('Purchase order issued');
      }
      setPoModalOpen(false);
      await load();
    } catch (err) {
      toast.error(err.message || 'Failed to save purchase order');
    }
  };

  const deletePurchaseOrder = async (id, ref) => {
    if (!window.confirm(`Are you sure you want to delete order ${ref}?`)) return;
    try {
      await JCLProcurementService.deletePurchaseOrder(companyId, id);
      toast.success('Purchase order deleted');
      await load();
    } catch (err) {
      toast.error(err.message || 'Failed to delete order');
    }
  };

  // Material Handlers
  const saveMaterial = async (e) => {
    e.preventDefault();
    if (!matForm.name.trim()) {
      toast.error('Material name is required');
      return;
    }
    try {
      await JCLProcurementService.createMaterial(companyId, matForm);
      toast.success('Material added to catalogue');
      setMatModalOpen(false);
      setMatForm(blankMaterialForm);
      await load();
    } catch (err) {
      toast.error(err.message || 'Failed to add material');
    }
  };

  const deleteMaterial = async (id, name) => {
    if (!window.confirm(`Remove material ${name} from catalogue?`)) return;
    try {
      await JCLProcurementService.deleteMaterial(companyId, id);
      toast.success('Material removed');
      await load();
    } catch (err) {
      toast.error(err.message || 'Failed to remove material');
    }
  };

  // Filtered lists
  const filteredRequisitions = useMemo(() => 
    data.requisitions.filter(row => 
      `${row.reference} ${row.description || ''} ${row.ops_projects?.name || ''}`.toLowerCase().includes(query.toLowerCase())
    ), [data.requisitions, query]
  );

  const filteredOrders = useMemo(() => 
    data.purchaseOrders.filter(row => 
      `${row.reference || row.po_number || ''} ${row.supplier_name || ''} ${row.ops_projects?.name || ''}`.toLowerCase().includes(query.toLowerCase())
    ), [data.purchaseOrders, query]
  );

  const filteredBalances = useMemo(() => 
    data.balances.filter(row => 
      `${row.jcl_materials?.reference || ''} ${row.jcl_materials?.name || ''} ${row.jcl_storage_locations?.name || ''}`.toLowerCase().includes(query.toLowerCase())
    ), [data.balances, query]
  );

  const stat = data.stats;

  return (
    <main className="min-h-full bg-background p-4 sm:p-6 lg:p-8 font-sans">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Native Mobile Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-[#005A9C] flex items-center justify-center text-white shadow-md shadow-[#005A9C]/20 shrink-0">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">Procurement</h1>
              <p className="text-xs text-muted-foreground font-medium">Requisitions, purchase orders & inventory supply</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'requisitions' && (
              <Button onClick={openCreateReq} size="sm" className="bg-[#005A9C] hover:bg-[#00477D] text-white text-xs font-bold rounded-xl h-10 px-4 gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Requisition</span><span className="sm:hidden">Request</span>
              </Button>
            )}
            {activeTab === 'orders' && (
              <Button onClick={openCreatePo} size="sm" className="bg-[#005A9C] hover:bg-[#00477D] text-white text-xs font-bold rounded-xl h-10 px-4 gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Issue Purchase Order</span><span className="sm:hidden">Order</span>
              </Button>
            )}
            {activeTab === 'inventory' && (
              <Button onClick={() => setMatModalOpen(true)} size="sm" className="bg-[#005A9C] hover:bg-[#00477D] text-white text-xs font-bold rounded-xl h-10 px-4 gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add Material Item</span><span className="sm:hidden">Add</span>
              </Button>
            )}
          </div>
        </div>

        {/* 2x2 Native Mobile Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-[20px] p-3.5 sm:p-4 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Requisitions</span>
            <span className="text-xl sm:text-2xl font-black text-foreground">{stat.requisitions || 0}</span>
          </div>
          <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-[20px] p-3.5 sm:p-4 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Pending Review</span>
            <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">{stat.pendingRequisitions || 0}</span>
          </div>
          <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-[20px] p-3.5 sm:p-4 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Approved Orders</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{stat.approvedOrders || 0}</span>
          </div>
          <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-[20px] p-3.5 sm:p-4 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Deliveries Due</span>
            <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">{stat.pendingDeliveries || 0}</span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-card/90 backdrop-blur-xl p-2.5 sm:p-3 rounded-[20px] border border-border/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              className="pl-9 text-xs h-9.5 rounded-xl bg-background border-border/80 w-full" 
              placeholder="Search references, projects, suppliers..." 
              value={query} 
              onChange={e => setQuery(e.target.value)} 
            />
          </div>
          <Badge variant="outline" className="text-xs font-bold px-3 py-1 rounded-xl self-end sm:self-auto">
            {activeTab === 'requisitions' ? `${filteredRequisitions.length} Requisitions` : 
             activeTab === 'orders' ? `${filteredOrders.length} Orders` : 
             `${filteredBalances.length} Balances`}
          </Badge>
        </div>

        {/* Tabs Content */}
        <Tabs value={activeTab} onValueChange={v => setSearchParams({ tab: v })} className="w-full space-y-4">
          <TabsList className="bg-muted/60 p-1 border border-border">
            <TabsTrigger value="requisitions" className="text-xs font-semibold">Requisitions ({data.requisitions.length})</TabsTrigger>
            <TabsTrigger value="orders" className="text-xs font-semibold">Purchase Orders ({data.purchaseOrders.length})</TabsTrigger>
            <TabsTrigger value="inventory" className="text-xs font-semibold">Materials & Inventory ({data.balances.length + data.materials.length})</TabsTrigger>
          </TabsList>

          {/* TAB 1: REQUISITIONS */}
          <TabsContent value="requisitions" className="m-0">
            <div className="space-y-3">
              {/* Mobile Native Card View (< md) */}
              <div className="md:hidden space-y-2.5">
                {filteredRequisitions.length ? filteredRequisitions.map(row => (
                  <div key={row.id} className="bg-card rounded-2xl p-3.5 border border-border shadow-xs active:scale-[0.99] transition-all space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="font-extrabold text-xs font-mono text-[#005A9C] dark:text-blue-400">{row.reference}</span>
                        <h4 className="font-bold text-sm text-foreground truncate mt-0.5">{row.description || 'No description provided'}</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{row.ops_projects?.name || 'Unassigned Project'}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg border shrink-0">
                        {statusLabels[row.status] || row.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                      <span className="text-[11px] text-muted-foreground">Required: {row.required_date || 'ASAP'}</span>
                      <span className={cn("text-[10px] font-bold uppercase", row.priority === 'urgent' ? 'text-rose-600' : row.priority === 'high' ? 'text-amber-600' : 'text-muted-foreground')}>
                        {row.priority} priority
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/40">
                      <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs font-bold text-muted-foreground hover:text-foreground rounded-lg" onClick={() => openEditReq(row)}>
                        <Edit3 className="size-3.5 mr-1" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs font-bold text-rose-500 hover:text-rose-700 rounded-lg" onClick={() => deleteRequisition(row.id, row.reference)}>
                        <Trash2 className="size-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl">
                    No requisitions recorded.
                  </div>
                )}
              </div>

              {/* Desktop High-Density Table (>= md) */}
              <Card className="hidden md:block border border-border/80 shadow-xs bg-card rounded-[22px] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="p-3">Reference</th>
                      <th className="p-3">Project</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Required Date</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredRequisitions.length ? filteredRequisitions.map(row => (
                      <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-semibold text-foreground">{row.reference}</td>
                        <td className="p-3 font-medium text-foreground">{row.ops_projects?.name || 'Unassigned Project'}</td>
                        <td className="p-3 max-w-xs truncate text-muted-foreground">{row.description}</td>
                        <td className="p-3 text-muted-foreground">{row.required_date || '—'}</td>
                        <td className="p-3 capitalize">
                          <span className={row.priority === 'urgent' ? 'text-rose-600 font-bold' : row.priority === 'high' ? 'text-amber-600 font-medium' : 'text-foreground'}>
                            {row.priority}
                          </span>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                            {statusLabels[row.status] || row.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEditReq(row)}>
                              <Edit3 className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20" onClick={() => deleteRequisition(row.id, row.reference)}>
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-muted-foreground">
                          No requisitions found. Click &quot;New Requisition&quot; above to create one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
          </TabsContent>

          {/* TAB 2: PURCHASE ORDERS */}
          <TabsContent value="orders" className="m-0">
            <div className="space-y-3">
              {/* Mobile Native Card View (< md) */}
              <div className="md:hidden space-y-2.5">
                {filteredOrders.length ? filteredOrders.map(row => (
                  <div key={row.id} className="bg-card rounded-2xl p-3.5 border border-border shadow-xs active:scale-[0.99] transition-all space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="font-extrabold text-xs font-mono text-[#005A9C] dark:text-blue-400">{row.reference || row.po_number}</span>
                        <h4 className="font-bold text-sm text-foreground truncate mt-0.5">{row.supplier_name || 'Vendor Not Specified'}</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{row.ops_projects?.name || 'Unassigned Project'}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg border shrink-0">
                        {statusLabels[row.status] || row.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                      <span className="font-mono font-black text-sm text-foreground">
                        ${Number(row.total_amount || 0).toLocaleString()}
                      </span>
                      <span className="text-[11px] text-muted-foreground">Due: {row.expected_delivery_date || 'TBD'}</span>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/40">
                      <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs font-bold text-muted-foreground hover:text-foreground rounded-lg" onClick={() => openEditPo(row)}>
                        <Edit3 className="size-3.5 mr-1" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs font-bold text-rose-500 hover:text-rose-700 rounded-lg" onClick={() => deletePurchaseOrder(row.id, row.reference || row.po_number)}>
                        <Trash2 className="size-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl">
                    No purchase orders found.
                  </div>
                )}
              </div>

              {/* Desktop High-Density Table (>= md) */}
              <Card className="hidden md:block border border-border/80 shadow-xs bg-card rounded-[22px] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="p-3">PO Reference</th>
                      <th className="p-3">Supplier</th>
                      <th className="p-3">Project</th>
                      <th className="p-3">Order Value</th>
                      <th className="p-3">Expected Delivery</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredOrders.length ? filteredOrders.map(row => (
                      <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-semibold text-foreground">{row.reference || row.po_number}</td>
                        <td className="p-3 font-medium text-foreground">{row.supplier_name || 'Vendor Not Specified'}</td>
                        <td className="p-3 text-foreground">{row.ops_projects?.name || 'Unassigned'}</td>
                        <td className="p-3 font-mono font-semibold text-foreground">${Number(row.total_amount || 0).toLocaleString()}</td>
                        <td className="p-3 text-muted-foreground">{row.expected_delivery_date || '—'}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                            {statusLabels[row.status] || row.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEditPo(row)}>
                              <Edit3 className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20" onClick={() => deletePurchaseOrder(row.id, row.reference || row.po_number)}>
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-muted-foreground">
                          No purchase orders found. Click &quot;Issue Purchase Order&quot; to create one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
          </TabsContent>

          {/* TAB 3: MATERIALS & INVENTORY */}
          <TabsContent value="inventory" className="m-0 space-y-4">
            <div className="space-y-3">
              {/* Mobile Native Card View (< md) */}
              <div className="md:hidden space-y-2.5">
                {filteredBalances.length ? filteredBalances.map(row => (
                  <div key={row.id} className="bg-card rounded-2xl p-3.5 border border-border shadow-xs active:scale-[0.99] transition-all space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-[#005A9C] flex items-center justify-center shrink-0">
                        <Package className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-foreground truncate">{row.jcl_materials?.name || 'Material Item'}</h4>
                        <p className="text-[11px] text-muted-foreground truncate">{row.jcl_storage_locations?.name || 'Central Depot'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-border/60">
                      <div className="bg-muted/30 p-2 rounded-xl">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Available</span>
                        <span className="font-mono font-bold text-xs text-emerald-600">{row.available_quantity}</span>
                      </div>
                      <div className="bg-muted/30 p-2 rounded-xl">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Allocated</span>
                        <span className="font-mono font-bold text-xs text-amber-600">{row.allocated_quantity}</span>
                      </div>
                      <div className="bg-muted/30 p-2 rounded-xl">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Consumed</span>
                        <span className="font-mono font-bold text-xs text-muted-foreground">{row.consumed_quantity}</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl">
                    No inventory recorded.
                  </div>
                )}
              </div>

              {/* Desktop High-Density Table (>= md) */}
              <Card className="hidden md:block border border-border/80 shadow-xs bg-card rounded-[22px] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="p-3">Item / Material</th>
                      <th className="p-3">Warehouse / Site Location</th>
                      <th className="p-3">Available Qty</th>
                      <th className="p-3">Allocated Qty</th>
                      <th className="p-3">Consumed Qty</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredBalances.length ? filteredBalances.map(row => (
                      <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-semibold text-foreground flex items-center gap-2">
                          <Package className="h-4 w-4 text-[#005A9C]" />
                          {row.jcl_materials?.name || 'Material Item'}
                        </td>
                        <td className="p-3 text-muted-foreground">{row.jcl_storage_locations?.name || 'Main Central Depot'}</td>
                        <td className="p-3 font-mono font-bold text-emerald-600">{row.available_quantity}</td>
                        <td className="p-3 font-mono text-amber-600">{row.allocated_quantity}</td>
                        <td className="p-3 font-mono text-muted-foreground">{row.consumed_quantity}</td>
                        <td className="p-3 text-right text-muted-foreground">Managed in Ledger</td>
                      </tr>
                    )) : data.materials.length ? data.materials.map(mat => (
                      <tr key={mat.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-semibold text-foreground flex items-center gap-2">
                          <Package className="h-4 w-4 text-[#005A9C]" />
                          {mat.name} ({mat.reference})
                        </td>
                        <td className="p-3 text-muted-foreground">{mat.category || 'Central Depot'}</td>
                        <td className="p-3 font-mono text-foreground">Tracked in {mat.unit}</td>
                        <td className="p-3 font-mono text-muted-foreground">—</td>
                        <td className="p-3 font-mono text-muted-foreground">—</td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500 hover:text-rose-700" onClick={() => deleteMaterial(mat.id, mat.name)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-muted-foreground">
                          No inventory balances or materials recorded. Click &quot;Add Material Item&quot; to register items.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
          </TabsContent>
        </Tabs>

        {/* DIALOG 1: REQUISITION CREATE / EDIT */}
        <Dialog open={reqModalOpen} onOpenChange={setReqModalOpen}>
          <DialogContent className="max-w-lg bg-card border border-border">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                {editingReq ? 'Edit Purchase Requisition' : 'Create Purchase Requisition'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Link required site items directly to an active construction project.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={saveRequisition} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Select Project *</Label>
                  <Select value={reqForm.project_id} onValueChange={v => setReqForm({ ...reqForm, project_id: v })}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Priority</Label>
                  <Select value={reqForm.priority} onValueChange={v => setReqForm({ ...reqForm, priority: v })}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Department</Label>
                  <Input 
                    value={reqForm.department} 
                    onChange={e => setReqForm({ ...reqForm, department: e.target.value })} 
                    className="text-xs" 
                    placeholder="e.g. Civil Engineering"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Required By Date</Label>
                  <Input 
                    type="date" 
                    value={reqForm.required_date} 
                    onChange={e => setReqForm({ ...reqForm, required_date: e.target.value })} 
                    className="text-xs" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Requirement Description *</Label>
                <Textarea 
                  required
                  rows={3} 
                  placeholder="e.g. 100 bags 42.5R Cement, 10 bundles 16mm High-Tensile Steel rods" 
                  value={reqForm.description} 
                  onChange={e => setReqForm({ ...reqForm, description: e.target.value })} 
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Justification / Notes</Label>
                <Input 
                  placeholder="e.g. For Phase 1 Foundation Pouring" 
                  value={reqForm.justification} 
                  onChange={e => setReqForm({ ...reqForm, justification: e.target.value })} 
                  className="text-xs" 
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setReqModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-[#005A9C] hover:bg-[#00477D] text-white">
                  {editingReq ? 'Update Requisition' : 'Save Requisition'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG 2: PURCHASE ORDER CREATE / EDIT */}
        <Dialog open={poModalOpen} onOpenChange={setPoModalOpen}>
          <DialogContent className="max-w-lg bg-card border border-border">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                {editingPo ? 'Edit Purchase Order' : 'Issue Purchase Order'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Commit materials and contract value with an authorized supplier.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={savePurchaseOrder} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Project *</Label>
                  <Select value={poForm.project_id} onValueChange={v => setPoForm({ ...poForm, project_id: v })}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Supplier / Vendor Name *</Label>
                  <Input 
                    required
                    placeholder="e.g. Dangote Cement Wholesale" 
                    value={poForm.supplier_name} 
                    onChange={e => setPoForm({ ...poForm, supplier_name: e.target.value })} 
                    className="text-xs" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Order Total Amount ($) *</Label>
                  <Input 
                    required
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    value={poForm.total_amount} 
                    onChange={e => setPoForm({ ...poForm, total_amount: e.target.value })} 
                    className="text-xs" 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Expected Delivery Date</Label>
                  <Input 
                    type="date" 
                    value={poForm.expected_delivery_date} 
                    onChange={e => setPoForm({ ...poForm, expected_delivery_date: e.target.value })} 
                    className="text-xs" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Delivery Address</Label>
                  <Input 
                    value={poForm.delivery_address} 
                    onChange={e => setPoForm({ ...poForm, delivery_address: e.target.value })} 
                    className="text-xs" 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Status</Label>
                  <Select value={poForm.status} onValueChange={v => setPoForm({ ...poForm, status: v })}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending_approval">Pending Approval</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="issued">Issued</SelectItem>
                      <SelectItem value="acknowledged">Acknowledged</SelectItem>
                      <SelectItem value="fully_delivered">Fully Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setPoModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-[#005A9C] hover:bg-[#00477D] text-white">
                  {editingPo ? 'Update Order' : 'Save Purchase Order'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG 3: ADD MATERIAL ITEM */}
        <Dialog open={matModalOpen} onOpenChange={setMatModalOpen}>
          <DialogContent className="max-w-md bg-card border border-border">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                Add Material to Catalogue
              </DialogTitle>
              <DialogDescription className="text-xs">
                Register building components, steel, aggregates, or fixtures.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={saveMaterial} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Material Name *</Label>
                <Input 
                  required
                  placeholder="e.g. 16mm High-Tensile Steel Rod" 
                  value={matForm.name} 
                  onChange={e => setMatForm({ ...matForm, name: e.target.value })} 
                  className="text-xs" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Category</Label>
                  <Input 
                    placeholder="e.g. Structural Steel" 
                    value={matForm.category} 
                    onChange={e => setMatForm({ ...matForm, category: e.target.value })} 
                    className="text-xs" 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Unit of Measure</Label>
                  <Input 
                    placeholder="e.g. bundles, bags, tons" 
                    value={matForm.unit} 
                    onChange={e => setMatForm({ ...matForm, unit: e.target.value })} 
                    className="text-xs" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Estimated Unit Cost ($)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  value={matForm.unit_cost} 
                  onChange={e => setMatForm({ ...matForm, unit_cost: e.target.value })} 
                  className="text-xs" 
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setMatModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-[#005A9C] hover:bg-[#00477D] text-white">
                  Add Material
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
