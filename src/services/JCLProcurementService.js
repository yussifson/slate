import { supabase } from '@/api/supabaseClient';

const selectError = (error, context) => {
  if (error) throw new Error(`${context}: ${error.message}`);
};

export const JCLProcurementService = {
  async dashboard(companyId, filters = {}) {
    if (!companyId) return { requisitions: [], purchaseOrders: [], receipts: [], balances: [], stats: {} };
    const projectFilter = filters.projectId && filters.projectId !== 'all' ? filters.projectId : null;
    const [{ data: requisitions, error: reqError }, { data: purchaseOrders, error: poError }, { data: receipts, error: receiptError }, { data: balances, error: balanceError }] = await Promise.all([
      supabase.from('jcl_purchase_requisitions').select('id, reference, status, priority, required_date, project_id, description, created_at, ops_projects(id,name,project_code)').eq('company_id', companyId).order('created_at', { ascending: false }),
      supabase.from('jcl_purchase_orders').select('id, reference, status, total_amount, expected_delivery_date, supplier_name, project_id, created_at, ops_projects(id,name,project_code)').eq('company_id', companyId).order('created_at', { ascending: false }),
      supabase.from('jcl_goods_receipts').select('id, reference, status, received_at, purchase_order_id, project_id').eq('company_id', companyId).order('received_at', { ascending: false }),
      supabase.from('jcl_inventory_balances').select('id, material_id, location_id, available_quantity, allocated_quantity, consumed_quantity, jcl_materials(reference,name,unit), jcl_storage_locations(name)').eq('company_id', companyId).order('updated_at', { ascending: false })
    ]);
    selectError(reqError, 'Unable to load requisitions');
    selectError(poError, 'Unable to load purchase orders');
    selectError(receiptError, 'Unable to load goods receipts');
    selectError(balanceError, 'Unable to load inventory');
    const scopedRequisitions = projectFilter ? (requisitions || []).filter((row) => row.project_id === projectFilter) : (requisitions || []);
    const scopedOrders = projectFilter ? (purchaseOrders || []).filter((row) => row.project_id === projectFilter) : (purchaseOrders || []);
    const stats = {
      requisitions: scopedRequisitions.length,
      pendingRequisitions: scopedRequisitions.filter((row) => ['submitted', 'under_review'].includes(row.status)).length,
      openRfqs: 0,
      quotations: 0,
      pendingOrders: scopedOrders.filter((row) => row.status === 'pending_approval').length,
      approvedOrders: scopedOrders.filter((row) => ['approved', 'issued', 'acknowledged'].includes(row.status)).length,
      pendingDeliveries: scopedOrders.filter((row) => ['issued', 'acknowledged', 'partially_delivered'].includes(row.status)).length,
      expenditure: scopedOrders.filter((row) => !['draft', 'cancelled'].includes(row.status)).reduce((sum, row) => sum + Number(row.total_amount || 0), 0)
    };
    return { requisitions: scopedRequisitions, purchaseOrders: scopedOrders, receipts: receipts || [], balances: balances || [], stats };
  },

  async createRequisition(companyId, actorId, payload) {
    const { data, error } = await supabase.from('jcl_purchase_requisitions').insert({
      company_id: companyId,
      project_id: payload.project_id,
      reference: payload.reference || `REQ-${Date.now().toString().slice(-8)}`,
      department: payload.department,
      requested_by: actorId,
      required_date: payload.required_date || null,
      priority: payload.priority || 'normal',
      description: payload.description,
      justification: payload.justification,
      status: 'draft'
    }).select().single();
    selectError(error, 'Unable to create requisition');
    return data;
  },

  async updateRequisition(companyId, requisitionId, payload) {
    const { data, error } = await supabase.from('jcl_purchase_requisitions').update({
      project_id: payload.project_id,
      department: payload.department,
      required_date: payload.required_date || null,
      priority: payload.priority || 'normal',
      description: payload.description,
      justification: payload.justification
    }).eq('id', requisitionId).eq('company_id', companyId).select().single();
    selectError(error, 'Unable to update requisition');
    return data;
  },

  async createMaterial(companyId, payload) {
    const { data, error } = await supabase.from('jcl_materials').insert({ company_id: companyId, ...payload }).select().single();
    selectError(error, 'Unable to create material');
    return data;
  }
};
