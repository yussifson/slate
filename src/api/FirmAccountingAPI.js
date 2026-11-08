/**
 * FirmAccountingAPI.js
 * 
 * Production-grade Corporate & Firm Accounting API.
 * Manages Chart of Accounts (CoA), Double-Entry Journal Vouchers (JV),
 * Invoicing (AR), Bills Payable (AP), Fixed Assets & Depreciation, and Bank Reconciliation.
 * 
 * High-Reliability Dual Storage Architecture:
 * - Writes locally to PowerSync SQLite database (for offline instant responsive UI).
 * - Direct-bridges and reads through Supabase `industry_records` (for cross-device instant sync
 *   between mobile and web apps without schema cache / missing remote table blocks).
 */

import { powerSync } from '@/api/PowerSyncConnector';
import { supabase } from '@/api/supabaseClient';

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getNowISO() {
  return new Date().toISOString();
}

// Universal Remote Cloud Sync Helper via `industry_records`
async function syncRemoteRecord(companyId, recordType, id, data, searchText = '') {
  if (!companyId || !id) return;
  try {
    const payload = {
      id,
      company_id: companyId,
      industry: 'corporate_finance',
      record_type: `firm_${recordType}`,
      search_text: searchText || recordType,
      data: { ...data, id, company_id: companyId, updated_at: getNowISO() }
    };
    await supabase.from('industry_records').upsert(payload, { onConflict: 'id' });
  } catch (err) {
    console.warn(`[FirmAccountingAPI] syncRemoteRecord (${recordType}) warning:`, err);
  }
}

async function fetchRemoteRecords(companyId, recordType) {
  if (!companyId) return [];
  try {
    const { data, error } = await supabase
      .from('industry_records')
      .select('id, data, created_at')
      .eq('company_id', companyId)
      .eq('record_type', `firm_${recordType}`);
    if (error || !Array.isArray(data)) return [];
    return data.map(row => {
      const parsed = typeof row.data === 'string' ? JSON.parse(row.data || '{}') : (row.data || {});
      return { id: row.id, ...parsed };
    });
  } catch (err) {
    console.warn(`[FirmAccountingAPI] fetchRemoteRecords (${recordType}) warning:`, err);
    return [];
  }
}

async function deleteRemoteRecord(id) {
  if (!id) return;
  try {
    await supabase.from('industry_records').delete().eq('id', id);
  } catch (err) {
    console.warn('[FirmAccountingAPI] deleteRemoteRecord warning:', err);
  }
}

function mergeRecords(localList, remoteList, sortField = 'created_at', ascending = false) {
  const map = new Map();
  (remoteList || []).forEach(item => {
    if (item && item.id) map.set(item.id, item);
  });
  (localList || []).forEach(item => {
    if (item && item.id) map.set(item.id, { ...(map.get(item.id) || {}), ...item });
  });
  const merged = Array.from(map.values());
  merged.sort((a, b) => {
    const valA = a[sortField] || '';
    const valB = b[sortField] || '';
    return ascending ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
  });
  return merged;
}

export const FirmAccountingAPI = {
  // ────────────────────────────────────────────────────────
  // 1. CHART OF ACCOUNTS (CoA)
  // ────────────────────────────────────────────────────────

  async getAccounts(companyId) {
    try {
      let localAccounts = [];
      try {
        const res = await powerSync.execute(
          'SELECT * FROM gl_accounts WHERE company_id = ? ORDER BY code ASC',
          [companyId]
        );
        localAccounts = res.rows._array || Array.from(res.rows || []);
      } catch (_) {}

      // Fetch cloud records from industry_records
      const remoteAccounts = await fetchRemoteRecords(companyId, 'gl_accounts');
      const allAccounts = mergeRecords(localAccounts, remoteAccounts, 'code', true);

      if (allAccounts.length === 0) {
        await this.initializeDefaultCoA(companyId);
        return await this.getAccounts(companyId);
      }
      return allAccounts;
    } catch (e) {
      console.error('[FirmAccountingAPI] getAccounts failed:', e);
      return [];
    }
  },

  async createAccount(companyId, data) {
    try {
      const id = generateUUID();
      const now = getNowISO();
      const accountData = {
        id,
        company_id: companyId,
        code: data.code,
        name: data.name,
        type: data.type,
        parent_id: data.parent_id || null,
        is_active: 1,
        description: data.description || '',
        created_at: now,
        updated_at: now
      };

      try {
        await powerSync.execute(
          `INSERT INTO gl_accounts (id, company_id, code, name, type, parent_id, is_active, description, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, companyId, data.code, data.name, data.type, data.parent_id || null, 1, data.description || '', now, now]
        );
      } catch (localErr) {
        console.warn('[FirmAccountingAPI] Local CoA insert caught:', localErr);
      }

      await syncRemoteRecord(companyId, 'gl_accounts', id, accountData, `${data.code} ${data.name}`);
      return id;
    } catch (e) {
      console.error('[FirmAccountingAPI] createAccount failed:', e);
      throw e;
    }
  },

  async initializeDefaultCoA(companyId) {
    const defaultAccounts = [
      { code: '1000', name: 'Cash & Bank Operating Account', type: 'Asset' },
      { code: '1100', name: 'Accounts Receivable (AR)', type: 'Asset' },
      { code: '1200', name: 'Prepaid Expenses', type: 'Asset' },
      { code: '1500', name: 'Fixed Assets - Equipment & Tech', type: 'Asset' },
      { code: '2000', name: 'Accounts Payable (AP)', type: 'Liability' },
      { code: '2100', name: 'Accrued Expenses & Salaries', type: 'Liability' },
      { code: '2200', name: 'Tax Payable (VAT / PAYE)', type: 'Liability' },
      { code: '3000', name: 'Owner / Common Stock Equity', type: 'Equity' },
      { code: '3100', name: 'Retained Earnings', type: 'Equity' },
      { code: '4000', name: 'Professional Services Revenue', type: 'Revenue' },
      { code: '4100', name: 'Product & Retainer Revenue', type: 'Revenue' },
      { code: '5000', name: 'Salaries & Payroll Expense', type: 'Expense' },
      { code: '5100', name: 'Rent & Facility Expense', type: 'Expense' },
      { code: '5200', name: 'Utilities & Telecom Expense', type: 'Expense' },
      { code: '5300', name: 'Depreciation Expense', type: 'Expense' }
    ];

    for (const acc of defaultAccounts) {
      await this.createAccount(companyId, acc);
    }
  },

  // ────────────────────────────────────────────────────────
  // 2. DOUBLE-ENTRY JOURNAL VOUCHERS (JV)
  // ────────────────────────────────────────────────────────

  async postJournalEntry(companyId, { description, reference, entryDate, lineItems }, userId) {
    const totalDebit = lineItems.reduce((sum, item) => sum + (Number(item.debit) || 0), 0);
    const totalCredit = lineItems.reduce((sum, item) => sum + (Number(item.credit) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Unbalanced Journal Entry! Total Debits (GH₵${totalDebit.toFixed(2)}) must equal Total Credits (GH₵${totalCredit.toFixed(2)})`);
    }

    try {
      const entryId = generateUUID();
      const now = getNowISO();
      const entryNumber = `JV-${Date.now().toString().slice(-6)}`;

      const jvRecord = {
        id: entryId,
        company_id: companyId,
        entry_number: entryNumber,
        entry_date: entryDate || now,
        description,
        reference: reference || '',
        posted_by: userId || 'system',
        status: 'posted',
        lineItems: (lineItems || []).map(item => ({
          id: generateUUID(),
          company_id: companyId,
          journal_entry_id: entryId,
          account_id: item.accountId,
          debit: Number(item.debit) || 0,
          credit: Number(item.credit) || 0,
          description: item.description || description,
          created_at: now
        })),
        created_at: now,
        updated_at: now
      };

      try {
        await powerSync.execute(
          `INSERT INTO gl_journal_entries (id, company_id, entry_number, entry_date, description, reference, posted_by, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [entryId, companyId, entryNumber, entryDate || now, description, reference || '', userId || 'system', 'posted', now, now]
        );

        for (const item of jvRecord.lineItems) {
          await powerSync.execute(
            `INSERT INTO gl_journal_line_items (id, company_id, journal_entry_id, account_id, debit, credit, description, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [item.id, companyId, entryId, item.account_id, item.debit, item.credit, item.description, now]
          );
        }
      } catch (localErr) {
        console.warn('[FirmAccountingAPI] Local JV insert caught:', localErr);
      }

      await syncRemoteRecord(companyId, 'gl_journal_entries', entryId, jvRecord, `${entryNumber} ${description}`);
      return entryId;
    } catch (e) {
      console.error('[FirmAccountingAPI] postJournalEntry failed:', e);
      throw e;
    }
  },

  async getJournalEntries(companyId) {
    try {
      let localEntries = [];
      let localItems = [];
      try {
        const entriesRes = await powerSync.execute(
          'SELECT * FROM gl_journal_entries WHERE company_id = ? ORDER BY entry_date DESC',
          [companyId]
        );
        const itemsRes = await powerSync.execute(
          'SELECT * FROM gl_journal_line_items WHERE company_id = ?',
          [companyId]
        );
        localEntries = entriesRes.rows._array || Array.from(entriesRes.rows || []);
        localItems = itemsRes.rows._array || Array.from(itemsRes.rows || []);
      } catch (_) {}

      const localMapped = localEntries.map(entry => ({
        ...entry,
        lineItems: localItems.filter(i => i.journal_entry_id === entry.id)
      }));

      const remoteEntries = await fetchRemoteRecords(companyId, 'gl_journal_entries');
      return mergeRecords(localMapped, remoteEntries, 'entry_date', false);
    } catch (e) {
      console.error('[FirmAccountingAPI] getJournalEntries failed:', e);
      return [];
    }
  },

  // ────────────────────────────────────────────────────────
  // 3. INVOICING & ACCOUNTS RECEIVABLE (AR)
  // ────────────────────────────────────────────────────────

  async getInvoices(companyId) {
    try {
      let localInvoices = [];
      let localItems = [];
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_firm_invoices WHERE company_id = ? ORDER BY created_at DESC',
          [companyId]
        );
        const itemsRes = await powerSync.execute(
          'SELECT * FROM univ_firm_invoice_items WHERE company_id = ?',
          [companyId]
        );
        localInvoices = res.rows._array || Array.from(res.rows || []);
        localItems = itemsRes.rows._array || Array.from(itemsRes.rows || []);
      } catch (_) {}

      const localMapped = localInvoices.map(inv => ({
        ...inv,
        items: localItems.filter(i => i.invoice_id === inv.id)
      }));

      const remoteInvoices = await fetchRemoteRecords(companyId, 'univ_firm_invoices');
      return mergeRecords(localMapped, remoteInvoices, 'created_at', false);
    } catch (e) {
      console.error('[FirmAccountingAPI] getInvoices failed:', e);
      return [];
    }
  },

  async createInvoice(companyId, data, userId) {
    try {
      const id = generateUUID();
      const now = getNowISO();
      const invNum = `INV-${Date.now().toString().slice(-6)}`;

      let subtotal = 0;
      let taxAmount = 0;

      const itemsWithTotals = (data.items || []).map(item => {
        const lineTotal = (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0);
        const lineTax = lineTotal * ((Number(item.taxRate) || 0) / 100);
        subtotal += lineTotal;
        taxAmount += lineTax;
        return {
          id: generateUUID(),
          invoice_id: id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          tax_rate: item.taxRate || 0,
          total: lineTotal
        };
      });

      const totalAmount = subtotal + taxAmount - (Number(data.discountAmount) || 0);

      const invoiceRecord = {
        id,
        company_id: companyId,
        invoice_number: invNum,
        customer_name: data.customerName,
        customer_email: data.customerEmail || '',
        issue_date: data.issueDate || now,
        due_date: data.dueDate,
        status: 'sent',
        subtotal,
        tax_amount: taxAmount,
        discount_amount: Number(data.discountAmount) || 0,
        total_amount: totalAmount,
        amount_paid: 0,
        currency: data.currency || 'GHS',
        notes: data.notes || '',
        items: itemsWithTotals,
        created_at: now,
        updated_at: now
      };

      try {
        await powerSync.execute(
          `INSERT INTO univ_firm_invoices (id, company_id, invoice_number, customer_name, customer_email, issue_date, due_date, status, subtotal, tax_amount, discount_amount, total_amount, amount_paid, currency, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, companyId, invNum, data.customerName, data.customerEmail || '', data.issueDate || now, data.dueDate, 'sent', subtotal, taxAmount, Number(data.discountAmount) || 0, totalAmount, 0, data.currency || 'GHS', data.notes || '', now, now]
        );

        for (const item of itemsWithTotals) {
          await powerSync.execute(
            `INSERT INTO univ_firm_invoice_items (id, company_id, invoice_id, description, quantity, unit_price, tax_rate, total)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [item.id, companyId, id, item.description, item.quantity, item.unit_price, item.tax_rate, item.total]
          );
        }
      } catch (localErr) {
        console.warn('[FirmAccountingAPI] Local invoice insert caught:', localErr);
      }

      await syncRemoteRecord(companyId, 'univ_firm_invoices', id, invoiceRecord, `${invNum} ${data.customerName}`);

      // Auto-post GL Journal Voucher
      try {
        const accounts = await this.getAccounts(companyId);
        const arAcc = accounts.find(a => a.code === '1100') || accounts[0];
        const revAcc = accounts.find(a => a.code === '4000') || accounts[0];

        if (arAcc && revAcc) {
          await this.postJournalEntry(companyId, {
            description: `Invoice ${invNum} for ${data.customerName}`,
            reference: invNum,
            entryDate: data.issueDate || now,
            lineItems: [
              { accountId: arAcc.id, debit: totalAmount, credit: 0, description: `Invoice ${invNum}` },
              { accountId: revAcc.id, debit: 0, credit: totalAmount, description: `Revenue from Invoice ${invNum}` }
            ]
          }, userId);
        }
      } catch (jvErr) {
        console.warn('[FirmAccountingAPI] Auto-post JV caught:', jvErr);
      }

      return id;
    } catch (e) {
      console.error('[FirmAccountingAPI] createInvoice failed:', e);
      throw e;
    }
  },

  // ────────────────────────────────────────────────────────
  // 4. VENDOR BILLS & ACCOUNTS PAYABLE (AP)
  // ────────────────────────────────────────────────────────

  async getBills(companyId) {
    try {
      let localBills = [];
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_firm_bills WHERE company_id = ? ORDER BY created_at DESC',
          [companyId]
        );
        localBills = res.rows._array || Array.from(res.rows || []);
      } catch (_) {}

      const remoteBills = await fetchRemoteRecords(companyId, 'univ_firm_bills');
      return mergeRecords(localBills, remoteBills, 'created_at', false);
    } catch (e) {
      console.error('[FirmAccountingAPI] getBills failed:', e);
      return [];
    }
  },

  async createBill(companyId, data, userId) {
    try {
      const id = generateUUID();
      const now = getNowISO();
      const billNum = `BILL-${Date.now().toString().slice(-6)}`;

      let subtotal = 0;
      (data.items || []).forEach(item => {
        subtotal += (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0);
      });

      const totalAmount = subtotal + (Number(data.taxAmount) || 0);

      const billRecord = {
        id,
        company_id: companyId,
        bill_number: billNum,
        vendor_name: data.vendorName,
        vendor_email: data.vendorEmail || '',
        issue_date: data.issueDate || now,
        due_date: data.dueDate,
        status: 'approved',
        subtotal,
        tax_amount: Number(data.taxAmount) || 0,
        total_amount: totalAmount,
        amount_paid: 0,
        currency: data.currency || 'GHS',
        notes: data.notes || '',
        created_at: now,
        updated_at: now
      };

      try {
        await powerSync.execute(
          `INSERT INTO univ_firm_bills (id, company_id, bill_number, vendor_name, vendor_email, issue_date, due_date, status, subtotal, tax_amount, total_amount, amount_paid, currency, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, companyId, billNum, data.vendorName, data.vendorEmail || '', data.issueDate || now, data.dueDate, 'approved', subtotal, Number(data.taxAmount) || 0, totalAmount, 0, data.currency || 'GHS', data.notes || '', now, now]
        );
      } catch (localErr) {
        console.warn('[FirmAccountingAPI] Local bill insert caught:', localErr);
      }

      await syncRemoteRecord(companyId, 'univ_firm_bills', id, billRecord, `${billNum} ${data.vendorName}`);

      // Auto-post GL Journal Voucher
      try {
        const accounts = await this.getAccounts(companyId);
        const expAcc = accounts.find(a => a.code === '5100') || accounts[0];
        const apAcc = accounts.find(a => a.code === '2000') || accounts[0];

        if (expAcc && apAcc) {
          await this.postJournalEntry(companyId, {
            description: `Vendor Bill ${billNum} from ${data.vendorName}`,
            reference: billNum,
            entryDate: data.issueDate || now,
            lineItems: [
              { accountId: expAcc.id, debit: totalAmount, credit: 0, description: `Expense for Bill ${billNum}` },
              { accountId: apAcc.id, debit: 0, credit: totalAmount, description: `AP Payable for Bill ${billNum}` }
            ]
          }, userId);
        }
      } catch (jvErr) {
        console.warn('[FirmAccountingAPI] Auto-post bill JV caught:', jvErr);
      }

      return id;
    } catch (e) {
      console.error('[FirmAccountingAPI] createBill failed:', e);
      throw e;
    }
  },

  // ────────────────────────────────────────────────────────
  // 5. FIXED ASSETS & DEPRECIATION
  // ────────────────────────────────────────────────────────

  async getFixedAssets(companyId) {
    try {
      let localAssets = [];
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_firm_fixed_assets WHERE company_id = ? ORDER BY created_at DESC',
          [companyId]
        );
        localAssets = res.rows._array || Array.from(res.rows || []);
      } catch (_) {}

      const remoteAssets = await fetchRemoteRecords(companyId, 'univ_firm_fixed_assets');
      return mergeRecords(localAssets, remoteAssets, 'created_at', false);
    } catch (e) {
      console.error('[FirmAccountingAPI] getFixedAssets failed:', e);
      return [];
    }
  },

  async createFixedAsset(companyId, data) {
    try {
      const id = generateUUID();
      const now = getNowISO();
      const code = `AST-${Date.now().toString().slice(-4)}`;
      const cost = Number(data.purchaseCost) || 0;
      const salvage = Number(data.salvageValue) || 0;

      const assetRecord = {
        id,
        company_id: companyId,
        asset_name: data.assetName,
        asset_code: code,
        category: data.category || 'Equipment',
        purchase_date: data.purchaseDate || now,
        purchase_cost: cost,
        salvage_value: salvage,
        useful_life_years: Number(data.usefulLifeYears) || 5,
        depreciation_method: data.depreciationMethod || 'straight_line',
        accumulated_depreciation: 0,
        net_book_value: cost,
        status: 'active',
        created_at: now
      };

      try {
        await powerSync.execute(
          `INSERT INTO univ_firm_fixed_assets (id, company_id, asset_name, asset_code, category, purchase_date, purchase_cost, salvage_value, useful_life_years, depreciation_method, accumulated_depreciation, net_book_value, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, companyId, data.assetName, code, data.category || 'Equipment', data.purchaseDate || now, cost, salvage, Number(data.usefulLifeYears) || 5, data.depreciationMethod || 'straight_line', 0, cost, 'active', now]
        );
      } catch (localErr) {
        console.warn('[FirmAccountingAPI] Local asset insert caught:', localErr);
      }

      await syncRemoteRecord(companyId, 'univ_firm_fixed_assets', id, assetRecord, `${code} ${data.assetName}`);
      return id;
    } catch (e) {
      console.error('[FirmAccountingAPI] createFixedAsset failed:', e);
      throw e;
    }
  },

  async postAssetDepreciation(companyId, assetId, userId) {
    try {
      const assets = await this.getFixedAssets(companyId);
      const asset = assets.find(a => a.id === assetId);
      if (!asset) throw new Error('Asset not found');

      const cost = Number(asset.purchase_cost);
      const salvage = Number(asset.salvage_value);
      const years = Number(asset.useful_life_years) || 5;

      const annualDep = (cost - salvage) / years;
      const monthlyDep = annualDep / 12;

      const newAccum = (Number(asset.accumulated_depreciation) || 0) + monthlyDep;
      const newBookValue = cost - newAccum;
      const newStatus = newBookValue <= salvage ? 'fully_depreciated' : 'active';
      const now = getNowISO();

      try {
        await powerSync.execute(
          `UPDATE univ_firm_fixed_assets SET accumulated_depreciation = ?, net_book_value = ?, status = ? WHERE id = ?`,
          [newAccum, newBookValue, newStatus, assetId]
        );
      } catch (_) {}

      await syncRemoteRecord(companyId, 'univ_firm_fixed_assets', assetId, {
        ...asset,
        accumulated_depreciation: newAccum,
        net_book_value: newBookValue,
        status: newStatus
      }, `${asset.asset_code} ${asset.asset_name}`);

      const accounts = await this.getAccounts(companyId);
      const depExpAcc = accounts.find(a => a.code === '5300') || accounts[0];
      const assetAcc = accounts.find(a => a.code === '1500') || accounts[0];

      if (depExpAcc && assetAcc) {
        await this.postJournalEntry(companyId, {
          description: `Monthly Depreciation for ${asset.asset_name}`,
          reference: asset.asset_code,
          entryDate: now,
          lineItems: [
            { accountId: depExpAcc.id, debit: monthlyDep, credit: 0, description: `Depreciation ${asset.asset_name}` },
            { accountId: assetAcc.id, debit: 0, credit: monthlyDep, description: `Accum. Depreciation ${asset.asset_name}` }
          ]
        }, userId);
      }

      return monthlyDep;
    } catch (e) {
      console.error('[FirmAccountingAPI] postAssetDepreciation failed:', e);
      throw e;
    }
  },

  // ────────────────────────────────────────────────────────
  // 6. BANK RECONCILIATION & STATEMENTS
  // ────────────────────────────────────────────────────────

  async getBankReconciliations(companyId) {
    try {
      let localRecs = [];
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_firm_bank_reconciliations WHERE company_id = ? ORDER BY statement_date DESC',
          [companyId]
        );
        localRecs = res.rows._array || Array.from(res.rows || []);
      } catch (_) {}

      const remoteRecs = await fetchRemoteRecords(companyId, 'univ_firm_bank_reconciliations');
      return mergeRecords(localRecs, remoteRecs, 'statement_date', false);
    } catch (e) {
      console.error('[FirmAccountingAPI] getBankReconciliations failed:', e);
      return [];
    }
  },

  async createBankReconciliation(companyId, data, userId) {
    try {
      const id = generateUUID();
      const now = getNowISO();
      const stmtBal = Number(data.statementBalance) || 0;
      const glBal = Number(data.glBalance) || 0;
      const diff = stmtBal - glBal;
      const status = Math.abs(diff) < 0.01 ? 'reconciled' : 'in_progress';

      const recRecord = {
        id,
        company_id: companyId,
        account_id: data.accountId,
        statement_date: data.statementDate || now,
        statement_balance: stmtBal,
        gl_balance: glBal,
        difference: diff,
        status,
        reconciled_by: userId || 'system',
        reconciled_at: now
      };

      try {
        await powerSync.execute(
          `INSERT INTO univ_firm_bank_reconciliations (id, company_id, account_id, statement_date, statement_balance, gl_balance, difference, status, reconciled_by, reconciled_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, companyId, data.accountId, data.statementDate || now, stmtBal, glBal, diff, status, userId || 'system', now]
        );
      } catch (localErr) {
        console.warn('[FirmAccountingAPI] Local bankrec insert caught:', localErr);
      }

      await syncRemoteRecord(companyId, 'univ_firm_bank_reconciliations', id, recRecord, `Bank Rec ${data.statementDate}`);
      return id;
    } catch (e) {
      console.error('[FirmAccountingAPI] createBankReconciliation failed:', e);
      throw e;
    }
  },

  // ────────────────────────────────────────────────────────
  // 7. EDIT, UPDATE STATUS & DELETE HELPERS
  // ────────────────────────────────────────────────────────

  async updateRecordStatus(tableName, id, status, companyId) {
    try {
      const now = getNowISO();
      try {
        await powerSync.execute(
          `UPDATE ${tableName} SET status = ?, updated_at = ? WHERE id = ?`,
          [status, now, id]
        );
      } catch (_) {}

      // Update in industry_records if available
      try {
        const { data: existing } = await supabase
          .from('industry_records')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (existing) {
          const parsed = typeof existing.data === 'string' ? JSON.parse(existing.data || '{}') : (existing.data || {});
          await supabase.from('industry_records').update({
            data: { ...parsed, status, updated_at: now }
          }).eq('id', id);
        }
      } catch (_) {}

      return true;
    } catch (e) {
      console.error(`[FirmAccountingAPI] updateRecordStatus for ${tableName} failed:`, e);
      throw e;
    }
  },

  async deleteRecord(tableName, id) {
    try {
      try {
        await powerSync.execute(
          `DELETE FROM ${tableName} WHERE id = ?`,
          [id]
        );
      } catch (_) {}

      await deleteRemoteRecord(id);
      return true;
    } catch (e) {
      console.error(`[FirmAccountingAPI] deleteRecord for ${tableName} failed:`, e);
      throw e;
    }
  },

  async updateInvoice(id, data, companyId) {
    try {
      const now = getNowISO();
      let subtotal = 0;
      let taxAmount = 0;
      (data.items || []).forEach(item => {
        const lineTotal = (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0);
        subtotal += lineTotal;
        taxAmount += lineTotal * ((Number(item.taxRate) || 0) / 100);
      });
      const totalAmount = subtotal + taxAmount;

      try {
        await powerSync.execute(
          `UPDATE univ_firm_invoices SET customer_name = ?, customer_email = ?, due_date = ?, status = ?, subtotal = ?, tax_amount = ?, total_amount = ?, updated_at = ? WHERE id = ?`,
          [data.customerName, data.customerEmail || '', data.dueDate, data.status || 'draft', subtotal, taxAmount, totalAmount, now, id]
        );
      } catch (_) {}

      if (companyId) {
        await syncRemoteRecord(companyId, 'univ_firm_invoices', id, {
          ...data,
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          updated_at: now
        });
      }
      return true;
    } catch (e) {
      console.error('[FirmAccountingAPI] updateInvoice failed:', e);
      throw e;
    }
  },

  async updateBill(id, data, companyId) {
    try {
      const now = getNowISO();
      let subtotal = 0;
      (data.items || []).forEach(item => {
        subtotal += (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0);
      });
      const totalAmount = subtotal;

      try {
        await powerSync.execute(
          `UPDATE univ_firm_bills SET vendor_name = ?, vendor_email = ?, due_date = ?, status = ?, subtotal = ?, total_amount = ?, updated_at = ? WHERE id = ?`,
          [data.vendorName, data.vendorEmail || '', data.dueDate, data.status || 'approved', subtotal, totalAmount, now, id]
        );
      } catch (_) {}

      if (companyId) {
        await syncRemoteRecord(companyId, 'univ_firm_bills', id, {
          ...data,
          subtotal,
          total_amount: totalAmount,
          updated_at: now
        });
      }
      return true;
    } catch (e) {
      console.error('[FirmAccountingAPI] updateBill failed:', e);
      throw e;
    }
  },

  // ────────────────────────────────────────────────────────
  // 8. OFFICE OPERATIONS & PAYROLL EXTENSION HELPERS
  // ────────────────────────────────────────────────────────

  async syncOfficeRecord(companyId, table, record) {
    if (!companyId || !record?.id) return;
    await syncRemoteRecord(companyId, table, record.id, record, record.description || record.name || record.source || table);
  },

  async getOfficeRecords(companyId, table) {
    return await fetchRemoteRecords(companyId, table);
  }
};
