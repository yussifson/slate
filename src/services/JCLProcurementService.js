import { supabase } from '@/api/supabaseClient';

const selectError = (error, context) => {
  if (error) throw new Error(`${context}: ${error.message}`);
};

export const JCLProcurementService = {
  async dashboard(companyId, filters = {}) {
    if (!companyId) return { requisitions: [], purchaseOrders: [], receipts: [], balances: [], materials: [], stats: {} };
    const projectFilter = filters.projectId && filters.projectId !== 'all' ? filters.projectId : null;
    
    const [
      { data: requisitions, error: reqError },
      { data: purchaseOrders, error: poError },
      { data: receipts, error: receiptError },
      { data: balances, error: balanceError },
      { data: materials, error: matError }
    ] = await Promise.all([
      supabase.from('jcl_purchase_requisitions')
        .select('id, reference, status, priority, required_date, project_id, description, justification, department, created_at, ops_projects(id,name,project_code)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false }),
      supabase.from('jcl_purchase_orders')
        .select('id, reference, status, total_amount, expected_delivery_date, supplier_name, delivery_address, payment_terms, project_id, created_at, ops_projects(id,name,project_code)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false }),
      supabase.from('jcl_goods_receipts')
        .select('id, reference, status, received_at, purchase_order_id, project_id, delivery_note_reference')
        .eq('company_id', companyId)
        .order('received_at', { ascending: false }),
      supabase.from('jcl_inventory_balances')
        .select('id, material_id, location_id, available_quantity, allocated_quantity, consumed_quantity, jcl_materials(id,reference,name,unit), jcl_storage_locations(id,name)')
        .eq('company_id', companyId)
        .order('updated_at', { ascending: false }),
      supabase.from('jcl_materials')
        .select('*')
        .eq('company_id', companyId)
        .order('name', { ascending: true })
    ]);

    selectError(reqError, 'Unable to load requisitions');
    selectError(poError, 'Unable to load purchase orders');
    selectError(receiptError, 'Unable to load goods receipts');
    selectError(balanceError, 'Unable to load inventory');

    const scopedRequisitions = projectFilter ? (requisitions || []).filter((row) => row.project_id === projectFilter) : (requisitions || []);
    const scopedOrders = projectFilter ? (purchaseOrders || []).filter((row) => row.project_id === projectFilter) : (purchaseOrders || []);

    const stats = {
      requisitions: scopedRequisitions.length,
      pendingRequisitions: scopedRequisitions.filter((row) => ['draft', 'submitted', 'under_review'].includes(row.status)).length,
      openRfqs: 0,
      quotations: 0,
      pendingOrders: scopedOrders.filter((row) => ['draft', 'pending_approval'].includes(row.status)).length,
      approvedOrders: scopedOrders.filter((row) => ['approved', 'issued', 'acknowledged'].includes(row.status)).length,
      pendingDeliveries: scopedOrders.filter((row) => ['issued', 'acknowledged', 'partially_delivered'].includes(row.status)).length,
      expenditure: scopedOrders.filter((row) => !['draft', 'cancelled'].includes(row.status)).reduce((sum, row) => sum + Number(row.total_amount || 0), 0)
    };

    return { 
      requisitions: scopedRequisitions, 
      purchaseOrders: scopedOrders, 
      receipts: receipts || [], 
      balances: balances || [], 
      materials: materials || [],
      stats 
    };
  },

  // --- REQUISITION CRUD ---
  async createRequisition(companyId, actorId, payload) {
    const { data, error } = await supabase.from('jcl_purchase_requisitions').insert({
      company_id: companyId,
      project_id: payload.project_id,
      reference: payload.reference || `REQ-${Date.now().toString().slice(-6)}`,
      department: payload.department || 'Construction',
      requested_by: actorId,
      required_date: payload.required_date || null,
      priority: payload.priority || 'normal',
      description: payload.description,
      justification: payload.justification || '',
      status: payload.status || 'draft'
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
      justification: payload.justification,
      status: payload.status
    }).eq('id', requisitionId).eq('company_id', companyId).select().single();
    selectError(error, 'Unable to update requisition');
    return data;
  },

  async deleteRequisition(companyId, requisitionId) {
    const { error } = await supabase.from('jcl_purchase_requisitions')
      .delete()
      .eq('id', requisitionId)
      .eq('company_id', companyId);
    selectError(error, 'Unable to delete requisition');
    return true;
  },

  // --- PURCHASE ORDER CRUD ---
  async createPurchaseOrder(companyId, actorId, payload) {
    const ref = payload.reference || payload.po_number || `PO-${Date.now().toString().slice(-6)}`;
    const { data, error } = await supabase.from('jcl_purchase_orders').insert({
      company_id: companyId,
      project_id: payload.project_id,
      reference: ref,
      po_number: ref,
      supplier_name: payload.supplier_name,
      total_amount: Number(payload.total_amount || 0),
      expected_delivery_date: payload.expected_delivery_date || null,
      delivery_address: payload.delivery_address || 'Main Site',
      payment_terms: payload.payment_terms || 'Net 30',
      status: payload.status || 'draft',
      requisition_id: payload.requisition_id || null
    }).select().single();
    selectError(error, 'Unable to create purchase order');
    return data;
  },

  async updatePurchaseOrder(companyId, orderId, payload) {
    const { data, error } = await supabase.from('jcl_purchase_orders').update({
      project_id: payload.project_id,
      supplier_name: payload.supplier_name,
      total_amount: Number(payload.total_amount || 0),
      expected_delivery_date: payload.expected_delivery_date || null,
      delivery_address: payload.delivery_address,
      payment_terms: payload.payment_terms,
      status: payload.status
    }).eq('id', orderId).eq('company_id', companyId).select().single();
    selectError(error, 'Unable to update purchase order');
    return data;
  },

  async deletePurchaseOrder(companyId, orderId) {
    const { error } = await supabase.from('jcl_purchase_orders')
      .delete()
      .eq('id', orderId)
      .eq('company_id', companyId);
    selectError(error, 'Unable to delete purchase order');
    return true;
  },

  // --- GOODS RECEIPTS ---
  async createReceipt(companyId, actorId, payload) {
    const ref = payload.reference || `GRN-${Date.now().toString().slice(-6)}`;
    const { data, error } = await supabase.from('jcl_goods_receipts').insert({
      company_id: companyId,
      purchase_order_id: payload.purchase_order_id,
      project_id: payload.project_id,
      reference: ref,
      receipt_number: ref,
      delivery_note_reference: payload.delivery_note_reference || '',
      status: payload.status || 'received',
      received_at: new Date().toISOString()
    }).select().single();
    selectError(error, 'Unable to record goods receipt');
    return data;
  },

  // --- MATERIALS & INVENTORY CRUD ---
  async createMaterial(companyId, payload) {
    const ref = payload.reference || `MAT-${Date.now().toString().slice(-5)}`;
    const { data, error } = await supabase.from('jcl_materials').insert({ 
      company_id: companyId, 
      reference: ref,
      name: payload.name,
      category: payload.category || 'General',
      unit: payload.unit || 'units',
      unit_cost: Number(payload.unit_cost || 0)
    }).select().single();
    selectError(error, 'Unable to create material');
    return data;
  },

  async deleteMaterial(companyId, materialId) {
    const { error } = await supabase.from('jcl_materials')
      .delete()
      .eq('id', materialId)
      .eq('company_id', companyId);
    selectError(error, 'Unable to delete material');
    return true;
  }
};
