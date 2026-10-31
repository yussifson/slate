/**
 * Slate V2: Accounts Payable & Supplier Bills Service (Phase 3)
 * 
 * Manages supplier bills, bill payments, and automated A/P ledger posting.
 */
import { supabase } from '../api/supabaseClient';
import { GeneralLedgerService, ACCOUNT_TYPES } from './GeneralLedgerService';
import { EventService } from './EventService';

export const AccountsPayableService = {
  /**
   * List supplier bills for a tenant
   */
  async getBills(companyId, status = null) {
    if (!companyId) return [];

    let query = supabase
      .from('fin_supplier_bills')
      .select(`
        *,
        core_parties (id, primary_name, email, phone)
      `)
      .eq('company_id', companyId)
      .order('due_date', { ascending: true });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Create and post a supplier bill with automatic A/P general ledger posting
   */
  async createBill(companyId, billData, expenseAccountId, createdBy = null) {
    if (!companyId || !billData.supplier_party_id || !billData.total_amount) {
      throw new Error('companyId, supplier_party_id, and total_amount are required to create a bill.');
    }

    const totalAmount = Number(billData.total_amount);
    const billNumber = billData.bill_number || `BILL-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();

    // 1. Insert Bill Record
    const { data: bill, error: billError } = await supabase
      .from('fin_supplier_bills')
      .insert({
        company_id: companyId,
        supplier_party_id: billData.supplier_party_id,
        bill_number: billNumber,
        issue_date: billData.issue_date || nowIso.slice(0, 10),
        due_date: billData.due_date || nowIso.slice(0, 10),
        currency: billData.currency || 'USD',
        subtotal: Number(billData.subtotal || totalAmount),
        tax_amount: Number(billData.tax_amount || 0),
        total_amount: totalAmount,
        amount_paid: 0.00,
        status: 'unpaid',
        notes: billData.notes || null
      })
      .select()
      .single();

    if (billError) throw new Error(`Failed to create supplier bill: ${billError.message}`);

    // 2. Fetch Accounts (A/P Liability Account #2000)
    const accounts = await GeneralLedgerService.getAccounts(companyId);
    const apAccount = accounts.find(a => a.account_code === '2000') || accounts.find(a => a.account_type === ACCOUNT_TYPES.LIABILITY);
    const expAccount = accounts.find(a => a.id === expenseAccountId) || accounts.find(a => a.account_code === '5200') || accounts.find(a => a.account_type === ACCOUNT_TYPES.EXPENSE);

    if (apAccount && expAccount) {
      // Post Double-Entry: Debit Expense, Credit Accounts Payable (A/P)
      await GeneralLedgerService.postJournalEntry(
        companyId,
        {
          memo: `Supplier Bill #${billNumber}`,
          source_document_type: 'bill',
          source_document_id: bill.id
        },
        [
          { account_id: expAccount.id, line_type: 'debit', amount: totalAmount, party_id: billData.supplier_party_id },
          { account_id: apAccount.id, line_type: 'credit', amount: totalAmount, party_id: billData.supplier_party_id }
        ],
        createdBy
      );
    }

    // 3. Publish Event
    await EventService.publishEvent(
      companyId,
      'finance.bill.created',
      'supplier_bill',
      bill.id,
      { bill_number: billNumber, total_amount: totalAmount, supplier_party_id: billData.supplier_party_id }
    );

    return bill;
  },

  /**
   * Record a payment against an outstanding supplier bill
   */
  async recordBillPayment(companyId, billId, paymentData, createdBy = null) {
    if (!companyId || !billId || !paymentData.amount) {
      throw new Error('companyId, billId, and amount are required.');
    }

    const { data: bill, error: billFetchErr } = await supabase
      .from('fin_supplier_bills')
      .select('*')
      .eq('id', billId)
      .eq('company_id', companyId)
      .single();

    if (billFetchErr || !bill) throw new Error(`Bill '${billId}' not found.`);

    const paymentAmount = Number(paymentData.amount);
    const newPaidAmount = Number(bill.amount_paid) + paymentAmount;
    const newStatus = newPaidAmount >= Number(bill.total_amount) ? 'paid' : 'partially_paid';

    // 1. Insert Outbound Payment Record
    const paymentNumber = paymentData.payment_number || `PMT-OUT-${Date.now().toString().slice(-6)}`;
    const { data: payment, error: pmtErr } = await supabase
      .from('fin_payments')
      .insert({
        company_id: companyId,
        payment_number: paymentNumber,
        party_id: bill.supplier_party_id,
        payment_type: 'outbound',
        payment_method: paymentData.payment_method || 'bank_transfer',
        amount: paymentAmount,
        payment_date: paymentData.payment_date || new Date().toISOString().slice(0, 10),
        reference: `Payment for Bill #${bill.bill_number}`,
        provider_transaction_id: paymentData.provider_transaction_id || null,
        status: 'settled',
        created_by: createdBy
      })
      .select()
      .single();

    if (pmtErr) throw new Error(`Failed to record payment: ${pmtErr.message}`);

    // 2. Update Bill Balance and Status
    await supabase
      .from('fin_supplier_bills')
      .update({
        amount_paid: newPaidAmount,
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', billId)
      .eq('company_id', companyId);

    // 3. Post Journal: Debit Accounts Payable (A/P #2000), Credit Cash (#1000)
    const accounts = await GeneralLedgerService.getAccounts(companyId);
    const apAccount = accounts.find(a => a.account_code === '2000');
    const cashAccount = accounts.find(a => a.account_code === '1000');

    if (apAccount && cashAccount) {
      await GeneralLedgerService.postJournalEntry(
        companyId,
        {
          memo: `Payment #${paymentNumber} for Bill #${bill.bill_number}`,
          source_document_type: 'payment',
          source_document_id: payment.id
        },
        [
          { account_id: apAccount.id, line_type: 'debit', amount: paymentAmount, party_id: bill.supplier_party_id },
          { account_id: cashAccount.id, line_type: 'credit', amount: paymentAmount, party_id: bill.supplier_party_id }
        ],
        createdBy
      );
    }

    return payment;
  }
};
