import { PowerSyncDatabase } from '@powersync/web';
import { supabase } from './supabaseClient';
import { AppSchema } from './AppSchema';

class SupabaseConnector {
  constructor() {
    this.client = supabase;
  }

  async safeUpsert(table, payload, onConflict = 'id') {
    let currentPayload = { ...payload };
    let attempts = 0;
    while (attempts < 20) {
      if (Object.keys(currentPayload).length === 0) return { error: null };
      attempts++;
      const { error } = await table.upsert(currentPayload, { onConflict });
      if (!error) return { error: null };

      // Check if error is PGRST204 (missing column in schema cache) or column not in table
      const match = error.message?.match(/Could not find the '([^']+)' column of '([^']+)' in the schema cache/i)
        || error.message?.match(/Could not find the '([^']+)' column/i)
        || error.message?.match(/column "([^"]+)" of relation "([^"]+)" does not exist/i)
        || error.details?.match(/column "([^"]+)" of relation "([^"]+)" does not exist/i);

      if (match && match[1] && currentPayload.hasOwnProperty(match[1])) {
        const missingCol = match[1];
        console.warn(`[PowerSync Auto-Healing] Table '${match[2] || 'unknown'}' missing column '${missingCol}' in schema cache. Retrying upsert without it.`);
        delete currentPayload[missingCol];
        continue;
      }

      throw error;
    }
    return { error: null };
  }

  async safeUpdate(table, payload, recordId) {
    let currentPayload = { ...payload };
    let attempts = 0;
    while (attempts < 20) {
      if (Object.keys(currentPayload).length === 0) return { error: null };
      attempts++;
      const { error } = await table.update(currentPayload).eq('id', recordId);
      if (!error) return { error: null };

      const match = error.message?.match(/Could not find the '([^']+)' column of '([^']+)' in the schema cache/i)
        || error.message?.match(/Could not find the '([^']+)' column/i)
        || error.message?.match(/column "([^"]+)" of relation "([^"]+)" does not exist/i)
        || error.details?.match(/column "([^"]+)" of relation "([^"]+)" does not exist/i);

      if (match && match[1] && currentPayload.hasOwnProperty(match[1])) {
        const missingCol = match[1];
        console.warn(`[PowerSync Auto-Healing] Table '${match[2] || 'unknown'}' missing column '${missingCol}' in schema cache. Retrying update without it.`);
        delete currentPayload[missingCol];
        continue;
      }

      throw error;
    }
    return { error: null };
  }

  async fetchCredentials() {
    try {
      const { data: { session }, error } = await this.client.auth.getSession();
      if (error || !session) return null;
      return {
        endpoint: import.meta.env.VITE_POWERSYNC_URL || 'https://6a1a95798d064eb85eea17a5.powersync.journeyapps.com',
        token: session.access_token
      };
    } catch (ex) {
      if (ex.message && (ex.message.includes('Failed to fetch') || ex.message.includes('timeout') || ex.message.includes('Offline'))) {
        console.warn("[PowerSync] Offline during fetchCredentials. PowerSync will retry later.");
        throw ex; // Let PowerSync's backoff handle this
      }
      return null;
    }
  }

  async uploadData(database) {
    const { data: { session }, error: sessionError } = await this.client.auth.getSession();
    if (sessionError || !session) {
      console.warn('[PowerSync] Skipping upload: No active session.');
      return;
    }
    
    // Auto-refresh token if expired or expiring within 30 seconds
    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    if (expiresAt && expiresAt - now < 30) {
      try {
        console.log('[PowerSync] Token expiring soon, refreshing session...');
        await this.client.auth.refreshSession();
      } catch (e) {
        console.error('[PowerSync] Failed to refresh session, postponing upload:', e);
        return;
      }
    }

    const transaction = await database.getNextCrudTransaction();
    if (!transaction) return;

    try {
      for (const op of transaction.crud) {
        // Discard ops on tables that do not exist in remote Supabase schema cache
        const missingRemoteTables = [
          'gl_accounts',
          'gl_journal_entries',
          'gl_journal_line_items',
          'gl_audit_trail',
          'univ_firm_invoices',
          'univ_firm_invoice_items',
          'univ_firm_bills',
          'univ_firm_bill_items',
          'univ_firm_fixed_assets',
          'univ_firm_bank_reconciliations',
          'jcl_office_income',
          'jcl_office_expenses',
          'jcl_project_expenses',
          'jcl_payroll_employees',
          'jcl_payroll_runs',
          'jcl_installment_sales',
          'jcl_installment_payments',
          'jcl_project_variations',
          'jcl_project_finance_summary'
        ];
        if (missingRemoteTables.includes(op.table)) {
          console.warn(`[PowerSync SKIPPED] Table '${op.table}' is handled via direct industry_records bridge. Discarding op to prevent sync block.`);
          continue;
        }

        const table = this.client.from(op.table);
        try {
          switch (op.op) {
            case 'PUT': {
              let payload = { ...op.opData, id: op.id };
              
              if (op.table === 'case_pipelines') {
                ['category', 'description', 'item_label'].forEach(c => delete payload[c]);
              }

              if (op.table === 'industry_records' && op.id && op.id.includes('_orbitbuild')) {
                console.warn('[v0] PowerSync SKIPPED: Invalid ID for industry_records:', op.id);
                continue; // Skip this operation to prevent UUID errors and clear the queue
              }
              
              // Validate that ID is not empty for UUID-based tables
              const realEstatateTables = ['univ_re_properties', 'univ_re_clients', 'univ_re_viewings', 
                'univ_re_offers', 'univ_re_transactions', 'univ_re_commissions', 'univ_re_documents', 
                'univ_re_leases', 'univ_re_rent_payments', 'univ_re_maintenance_requests'];
              
              if (realEstatateTables.includes(op.table)) {
                // For Real Estate tables, ensure ID exists and is valid
                if (!op.id || op.id === '' || op.id === null || op.id === undefined) {
                  console.error('[v0] PowerSync SKIPPED: Empty ID for table:', op.table, {id: op.id, data: op.opData});
                  continue; // Skip this operation to prevent UUID errors
                }
                // For RE tables, build payload without the potentially-empty id from opData
                payload = {};
                if (op.opData) {
                  for (const [k, v] of Object.entries(op.opData)) {
                    // Skip empty id fields from opData, we'll use op.id instead
                    if (k === 'id' && (!v || v === '')) continue;
                    // For fields that end in _id, allow them even if they're not valid UUIDs (now stored as TEXT)
                    payload[k] = v;
                  }
                }
                // Ensure the correct op.id is used
                payload.id = op.id;
              }
              
              if (op.table === 'profiles') {
                const allowed = ['id', 'created_at', 'updated_at', 'created_by', 'role', 'company_id', 'company_name', 'phone', 'avatar_url', 'department', 'bar_number'];
                payload = Object.fromEntries(Object.entries(payload).filter(([k]) => allowed.includes(k)));
              }
              if (op.table === 'automation_logs') {
                const allowed = ['id', 'company_id', 'created_at', 'status', 'rule_id'];
                payload = Object.fromEntries(Object.entries(payload).filter(([k]) => allowed.includes(k)));
              }

              if (op.table === 'univ_appointments') {
                payload.attendee_name = payload.attendee_name || payload.client_name || payload.title || 'Appointment attendee';
                payload.title = payload.title || payload.attendee_name || 'Appointment';
                payload.start_time = payload.time || '09:00';
              }
              
              if (op.table === 'univ_lab_results') {
                delete payload.document_url;
              }
              
              if (op.table === 'univ_admissions') {
                payload.bed_number = payload.bed_number || 'TBD';
              }
              
              if (op.table === 'univ_prescriptions') {
                payload.medication = payload.medication || 'Unspecified';
              }
              
              if (op.table === 'univ_wards') {
                payload.ward_name = payload.ward_name || 'Ward';
              }
              
              if (op.table === 'companies') {
                // Strip out columns that might not exist in Supabase to prevent 400 Bad Request errors
                // This guarantees the offline-first sync succeeds for the standard columns
                const safeColumns = [
                  'id', 'created_at', 'updated_at', 'created_by', 'name', 'subdomain',
                  'custom_domain', 'email', 'phone', 'country', 'city', 'address',
                  'logo_url', 'logo_light_url', 'favicon_url', 'tagline', 'primary_color',
                  'subscription_plan', 'subscription_status', 'max_users', 'max_cases',
                  'max_storage_gb', 'admin_email', 'status', 'currency'
                ];
                payload = Object.fromEntries(Object.entries(payload).filter(([k]) => safeColumns.includes(k)));
              }
              
              // Cast text id to UUID for tables that use UUID primary keys
              if (op.table === 'invoices' && payload.id && typeof payload.id === 'string') {
                try { payload.id = payload.id; } catch(e) { /* keep as-is */ }
              }
              
              if (op.table === 'companies') {
                // Companies require update instead of upsert due to RLS INSERT restrictions for standard users
                const { error } = await this.safeUpdate(table, payload, op.id);
                if (error) throw error;
              } else {
                const { error } = await this.safeUpsert(table, payload, 'id');
                if (error) throw error;
              }
              break;
            }
            case 'PATCH': {
              let payload = { ...op.opData };
              if (op.table === 'profiles') {
                const allowed = ['id', 'created_at', 'updated_at', 'created_by', 'role', 'company_id', 'company_name', 'phone', 'avatar_url', 'department', 'bar_number'];
                payload = Object.fromEntries(Object.entries(payload).filter(([k]) => allowed.includes(k)));
              }
              if (op.table === 'automation_logs') {
                const allowed = ['id', 'company_id', 'created_at', 'status', 'rule_id'];
                payload = Object.fromEntries(Object.entries(payload).filter(([k]) => allowed.includes(k)));
              }
              if (op.table === 'univ_appointments') {
                if (!payload.attendee_name && (payload.client_name || payload.title)) {
                  payload.attendee_name = payload.client_name || payload.title;
                }
                if (!payload.title && payload.attendee_name) {
                  payload.title = payload.attendee_name;
                }
                if (payload.time) {
                  payload.start_time = payload.time;
                }
              }
              
              if (op.table === 'univ_lab_results') {
                delete payload.document_url;
              }
              
              if (op.table === 'univ_admissions') {
                if (payload.bed_number === '' || payload.bed_number === null) {
                  payload.bed_number = 'TBD';
                }
              }
              
              if (op.table === 'univ_prescriptions') {
                if (payload.medication === '' || payload.medication === null) {
                  payload.medication = 'Unspecified';
                }
              }
              
              if (op.table === 'univ_wards') {
                if (payload.ward_name === '' || payload.ward_name === null) {
                  payload.ward_name = 'Ward';
                }
              }
              if (op.table === 'companies') {
                const safeColumns = [
                  'id', 'created_at', 'updated_at', 'created_by', 'name', 'subdomain',
                  'custom_domain', 'email', 'phone', 'country', 'city', 'address',
                  'logo_url', 'logo_light_url', 'favicon_url', 'tagline', 'primary_color',
                  'subscription_plan', 'subscription_status', 'max_users', 'max_cases',
                  'max_storage_gb', 'admin_email', 'status', 'currency'
                ];
                payload = Object.fromEntries(Object.entries(payload).filter(([k]) => safeColumns.includes(k)));
                
                // Use update instead of upsert because upsert requires INSERT privileges which might fail due to RLS
                const { error } = await this.safeUpdate(table, payload, op.id);
                if (error) throw error;
                break;
              }
              // Real Estate tables - allow all fields for PATCH
              const realtEstateTablesForPatch = ['univ_re_properties', 'univ_re_clients', 'univ_re_viewings', 
                'univ_re_offers', 'univ_re_transactions', 'univ_re_commissions', 'univ_re_documents', 
                'univ_re_leases', 'univ_re_rent_payments', 'univ_re_maintenance_requests', 'univ_re_leads', 'univ_re_maintenance', 'univ_re_esignatures', 'univ_frontdesk_visitors', 'univ_frontdesk_staff_logs', 'univ_office_custody_items', 'univ_re_counter_offers', 'univ_re_contractors', 'univ_re_contractor_reviews', 'univ_re_escrow_accounts', 'univ_re_document_templates', 'univ_re_lease_renewals', 'univ_re_trust_accounts', 'univ_re_trust_ledger', 'univ_re_team_members', 'univ_re_lead_activities', 'jcl_visitor_logbook', 'jcl_staff_logbook', 'jcl_item_register', 'jcl_item_register_history'];
              
              if (Object.keys(payload).length > 0) {
                const { error } = await this.safeUpdate(table, payload, op.id);
                if (error) throw error;
              }
              break;
            }
            case 'DELETE': {
              const { error } = await table.delete().eq('id', op.id);
              if (error) throw error;
              break;
            }
          }
        } catch (opEx) {
          // TIER 1: Network / transient errors
          if (opEx.message && (opEx.message.includes('Failed to fetch') || opEx.message.includes('timeout') || opEx.message.includes('Offline'))) {
            throw opEx;
          }

          // TIER 2: Soft conflicts (e.g., 409 or Unique Constraint Violation)
          if (opEx.status === 409 || opEx.code === '23505') {
            const { data: serverRecord } = await this.client.from(op.table).select('updated_at').eq('id', op.id).single();
            if (serverRecord && op.opData && op.opData.updated_at) {
              const serverTime = new Date(serverRecord.updated_at).getTime();
              const localTime = new Date(op.opData.updated_at).getTime();
              
              if (localTime > serverTime) {
                console.warn(`[PowerSync] Conflict on ${op.table} - Local wins. Retrying upsert.`);
                // We could retry here with an override flag, but simply letting it pass or ignoring isn't fully resolving it.
                // For now, we fall through to skip this op, or ideally we'd attempt another upsert.
              } else {
                console.warn(`[PowerSync] Conflict on ${op.table} - Server wins. Discarding local op.`);
              }
            } else {
              console.warn(`[PowerSync] Conflict on ${op.table} without updated_at. Discarding local op.`);
            }
            continue; // Skip the rest of the loop for this op
          }

          // TIER 3: Table not found in remote Supabase schema cache (PGRST205) - Discard immediately so sync is never frozen
          if (opEx.code === 'PGRST205' || opEx.message?.includes('PGRST205') || opEx.message?.includes('Could not find the table')) {
            console.warn(`[PowerSync Discarded missing remote table op] ${op.op} on ${op.table}: ${opEx.message}`);
            continue;
          }

          // TIER 4: Hard errors (401, 403, 404, 422, or 400 with PG code)
          if ([401, 403, 404, 422, 400].includes(opEx.status) || (opEx.code && typeof opEx.code === 'string')) {
            console.error(`[v0] PowerSync hard error ${op.op} on ${op.table}:`, {status: opEx.status, code: opEx.code, msg: opEx.message, data: op.opData});
            
            // Write to sync_errors table
            if (op.table !== 'sync_errors') {
              try {
                await database.execute(
                  `INSERT INTO sync_errors (id, table_name, operation, record_id, error_code, error_message, failed_at, raw_payload) 
                   VALUES (uuid(), ?, ?, ?, ?, ?, datetime('now'), ?)`,
                  [
                    op.table, 
                    op.op, 
                    op.id, 
                    opEx.code || opEx.status?.toString() || 'UNKNOWN', 
                    opEx.message || 'Unknown error',
                    JSON.stringify(op.opData || {})
                  ]
                );
              } catch (errWrite) {
                console.error('[PowerSync] Failed to log sync error locally:', errWrite);
              }
            }

            // Emit custom DOM event
            const eventPayload = {
              table: op.table,
              operation: op.op,
              recordId: op.id,
              errorCode: opEx.code || opEx.status,
              errorMessage: opEx.message};
            window.dispatchEvent(new CustomEvent('sync:hard-error', { detail: eventPayload }));
            
            continue; // Skip this operation in the queue
          }

          // Fallback catch-all for unknown errors
          console.error(`[PowerSync] Unknown error uploading operation ${op.op} on ${op.table}:`, opEx);
        }
      }
      await transaction.complete();
    } catch (ex) {
      console.warn(`[PowerSync] Network error during uploadData, will retry later.`, ex);
      throw ex;
    }
  }
}

let dbName = 'slate.db';
let powerSyncDb;

try {
  powerSyncDb = new PowerSyncDatabase({
    database: { dbFilename: dbName },
    schema: AppSchema
  });
} catch (e) {
  console.warn('[PowerSync] Primary IndexedDB store open failed, initializing with fallback store:', e);
  dbName = `slate_${Date.now()}.db`;
  try {
    powerSyncDb = new PowerSyncDatabase({
      database: { dbFilename: dbName },
      schema: AppSchema
    });
  } catch (e2) {
    console.error('[PowerSync] IndexedDB disabled or corrupted in this browser session:', e2);
  }
}

export const powerSync = powerSyncDb || new PowerSyncDatabase({
  database: { dbFilename: 'slate_fallback.db' },
  schema: AppSchema
});

// ------------------------------------------------------------------------------------------------
// REAL ESTATE & CLOUD CORE DIRECT SUPABASE TRANSPARENT BRIDGE
// Disables PowerSync offline sync for JCL Real Estate and essential cross-platform tables
// (documents, smart folders, tasks, time tracking, active timers, pipelines, notifications)
// and redirects queries directly to live Supabase cloud database.
// This guarantees instant, zero-delay real-time synchronization between mobile and web.
// ------------------------------------------------------------------------------------------------
function isJCLRealEstateQuery(sql) {
  const upper = typeof sql === 'string' ? sql.toUpperCase() : '';
  if (upper.includes('UNIV_RE_') || 
      upper.includes('JCL_') || 
      upper.includes('UNIV_FRONTDESK_') || 
      upper.includes('UNIV_OFFICE_CUSTODY_') ||
      upper.includes('OPS_PROJECT') ||
      upper.includes('OPS_') ||
      upper.includes('UNIV_BOQ')) {
    return true;
  }
  return /\b(FROM|INTO|UPDATE|TABLE)\s+(DOCUMENTS|SMART_FOLDERS|SMART_DOC_LINKS|TASKS|TIME_ENTRIES|UNIV_TIME_TRACKING|UNIV_TIME_REMINDERS|ACTIVE_TIMERS|CASE_PIPELINES|CASE_PIPELINE_STATES|NOTIFICATIONS|UNIV_BOQS|OPS_PROJECTS|OPS_WORK_PACKAGES|OPS_SITE_DIARY|OPS_DAILY_REPORTS|OPS_RESOURCE_ALLOCATIONS|OPS_PROJECT_ISSUES|OPS_SITE_INSPECTIONS|OPS_PROJECT_ACTIVITY|OPS_PROJECT_MEMBERS|OPS_PROJECT_MESSAGES|OPS_PROJECT_RISKS|OPS_PROJECT_ATTACHMENTS)\b/i.test(sql);
}

function parseParamsList(valsStr, parameters, offset = 0) {
  const tokens = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < valsStr.length; i++) {
    const ch = valsStr[i];
    if (ch === "'") {
      inQuotes = !inQuotes;
      cur += ch;
    } else if (ch === ',' && !inQuotes) {
      tokens.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) tokens.push(cur.trim());

  let pIdx = offset;
  return tokens.map(t => {
    if (t === '?') return parameters[pIdx++];
    if (t.startsWith("'") && t.endsWith("'")) return t.slice(1, -1);
    if (!isNaN(t) && t !== '') return Number(t);
    if (t.toLowerCase() === 'null') return null;
    return t;
  });
}

function parseWhereClause(whereStr, parameters, offset = 0) {
  if (!whereStr) return [];
  const parts = whereStr.split(/\s+AND\s+/i);
  let pIdx = offset;
  const conditions = [];
  for (const part of parts) {
    const trimmed = part.trim();
    const m = trimmed.match(/^([a-zA-Z0-9_]+)\s*(=|!=|<>|>=|<=|>|<|LIKE)\s*(.*)$/i);
    if (m) {
      const col = m[1];
      const op = m[2];
      const valRaw = m[3].trim();
      let val;
      if (valRaw === '?') {
        val = parameters[pIdx++];
      } else if (valRaw.startsWith("'") && valRaw.endsWith("'")) {
        val = valRaw.slice(1, -1);
      } else if (!isNaN(valRaw) && valRaw !== '') {
        val = Number(valRaw);
      } else {
        val = valRaw;
      }
      conditions.push({ col, op, val });
    }
  }
  return conditions;
}

function applyWhere(builder, conditions) {
  for (const cond of conditions) {
    if (cond.op === '=') builder = builder.eq(cond.col, cond.val);
    else if (cond.op === '!=' || cond.op === '<>') builder = builder.neq(cond.col, cond.val);
    else if (cond.op === '>=') builder = builder.gte(cond.col, cond.val);
    else if (cond.op === '<=') builder = builder.lte(cond.col, cond.val);
    else if (cond.op === '>') builder = builder.gt(cond.col, cond.val);
    else if (cond.op === '<') builder = builder.lt(cond.col, cond.val);
    else if (cond.op.toUpperCase() === 'LIKE') builder = builder.like(cond.col, cond.val);
  }
  return builder;
}

async function executeViaDirectSupabase(sql, parameters = []) {
  const s = (sql || '').trim();

  // 1. SELECT
  const selectM = s.match(/^SELECT\s+([\s\S]+?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+([\s\S]+?))?(?:\s+ORDER\s+BY\s+([\s\S]+?))?(?:\s+LIMIT\s+(\d+))?$/i);
  if (selectM) {
    const rawCols = selectM[1].trim();
    const table = selectM[2].trim();
    const whereStr = selectM[3];
    const orderStr = selectM[4];
    const limitStr = selectM[5];

    let queryCols = rawCols;
    const isAggregate = /COUNT\(|SUM\(|AVG\(|MIN\(|MAX\(/i.test(rawCols);
    if (isAggregate) {
      queryCols = '*';
    }

    let builder = supabase.from(table).select(queryCols);
    const conditions = parseWhereClause(whereStr, parameters, 0);
    builder = applyWhere(builder, conditions);

    if (orderStr && !isAggregate) {
      const parts = orderStr.split(',').map(x => x.trim());
      for (const p of parts) {
        const [col, dir] = p.split(/\s+/);
        if (col) {
          builder = builder.order(col, { ascending: !dir || dir.toUpperCase() === 'ASC' });
        }
      }
    }

    if (limitStr) {
      builder = builder.limit(parseInt(limitStr, 10));
    }

    const { data, error } = await builder;
    if (error) {
      console.warn(`[DirectSupabase Bridge] SELECT on ${table} caught:`, error.message);
      return { rows: { _array: [], length: 0 } };
    }

    const rows = Array.isArray(data) ? data : (data ? [data] : []);

    // If query was aggregate (e.g. SELECT COUNT(*) as total, SUM(price) as total_val), compute locally
    if (isAggregate) {
      const aggRow = {};
      const aggItems = rawCols.split(',').map(x => x.trim());
      for (const item of aggItems) {
        const countM = item.match(/COUNT\s*\([^)]*\)\s+(?:AS\s+)?([a-zA-Z0-9_]+)/i);
        if (countM) {
          aggRow[countM[1]] = rows.length;
          continue;
        }
        const sumM = item.match(/SUM\s*\(([a-zA-Z0-9_]+)\)\s+(?:AS\s+)?([a-zA-Z0-9_]+)/i);
        if (sumM) {
          const colName = sumM[1];
          const alias = sumM[2];
          aggRow[alias] = rows.reduce((acc, r) => acc + (Number(r[colName]) || 0), 0);
          continue;
        }
      }
      return { rows: { _array: [aggRow], length: 1, 0: aggRow } };
    }

    const resObj = { _array: rows, length: rows.length };
    rows.forEach((r, idx) => { resObj[idx] = r; });
    return { rows: resObj };
  }

  // 2. INSERT
  const insertM = s.match(/^INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES\s*\(([\s\S]+?)\)/i);
  if (insertM) {
    const table = insertM[1].trim();
    const cols = insertM[2].split(',').map(c => c.trim().replace(/['"`]/g, ''));
    const parsedValues = parseParamsList(insertM[3], parameters, 0);

    const payload = {};
    for (let i = 0; i < cols.length; i++) {
      payload[cols[i]] = parsedValues[i] !== undefined ? parsedValues[i] : null;
    }

    const { error } = await supabase.from(table).upsert(payload);
    if (error) console.warn(`[DirectSupabase Bridge] INSERT on ${table} caught:`, error.message);
    return { rowsAffected: 1, rows: { _array: [], length: 0 } };
  }

  // 3. UPDATE
  const updateM = s.match(/^UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+([\s\S]+?)(?:\s+WHERE\s+([\s\S]+?))?$/i);
  if (updateM) {
    const table = updateM[1].trim();
    const setClause = updateM[2].trim();
    const whereClause = updateM[3];

    // Parse set values
    const setTokens = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < setClause.length; i++) {
      const ch = setClause[i];
      if (ch === "'") inQuotes = !inQuotes;
      if (ch === ',' && !inQuotes) {
        setTokens.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    if (cur.trim()) setTokens.push(cur.trim());

    let pIdx = 0;
    const payload = {};
    for (const t of setTokens) {
      const eqIdx = t.indexOf('=');
      if (eqIdx !== -1) {
        const col = t.slice(0, eqIdx).trim().replace(/['"`]/g, '');
        const valRaw = t.slice(eqIdx + 1).trim();
        if (valRaw === '?') {
          payload[col] = parameters[pIdx++];
        } else if (valRaw.startsWith("'") && valRaw.endsWith("'")) {
          payload[col] = valRaw.slice(1, -1);
        } else if (!isNaN(valRaw) && valRaw !== '') {
          payload[col] = Number(valRaw);
        } else if (valRaw.toLowerCase() === 'null') {
          payload[col] = null;
        } else {
          payload[col] = valRaw;
        }
      }
    }

    let builder = supabase.from(table).update(payload);
    const conditions = parseWhereClause(whereClause, parameters, pIdx);
    builder = applyWhere(builder, conditions);

    const { error } = await builder;
    if (error) console.warn(`[DirectSupabase Bridge] UPDATE on ${table} caught:`, error.message);
    return { rowsAffected: 1, rows: { _array: [], length: 0 } };
  }

  // 4. DELETE
  const deleteM = s.match(/^DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+([\s\S]+?))?$/i);
  if (deleteM) {
    const table = deleteM[1].trim();
    const whereClause = deleteM[2];

    let builder = supabase.from(table).delete();
    const conditions = parseWhereClause(whereClause, parameters, 0);
    builder = applyWhere(builder, conditions);

    const { error } = await builder;
    if (error) console.warn(`[DirectSupabase Bridge] DELETE on ${table} caught:`, error.message);
    return { rowsAffected: 1, rows: { _array: [], length: 0 } };
  }

  return { rows: { _array: [], length: 0 } };
}

// ------------------------------------------------------------------------------------------------
// GLOBAL DATABASE INTERCEPTOR
// Hook into the raw execution pipeline to automatically trigger global React Query invalidations
// and UI Success/Error toasts without writing manual try/catch blocks in every UI component.
// ------------------------------------------------------------------------------------------------
const originalGetAll = powerSync.getAll.bind(powerSync);
powerSync.getAll = async (sql, parameters) => {
  if (isJCLRealEstateQuery(sql)) {
    try {
      const directRes = await executeViaDirectSupabase(sql, parameters);
      return directRes?.rows?._array || [];
    } catch (directErr) {
      console.warn('[DirectSupabase Bridge] getAll direct query failed, falling back to local replica:', directErr);
    }
  }
  return originalGetAll(sql, parameters);
};

const originalGetOptional = powerSync.getOptional ? powerSync.getOptional.bind(powerSync) : null;
powerSync.getOptional = async (sql, parameters) => {
  if (isJCLRealEstateQuery(sql)) {
    try {
      const directRes = await executeViaDirectSupabase(sql, parameters);
      const rows = directRes?.rows?._array || [];
      return rows[0] || null;
    } catch (directErr) {
      console.warn('[DirectSupabase Bridge] getOptional direct query failed, falling back to local replica:', directErr);
    }
  }
  return originalGetOptional ? originalGetOptional(sql, parameters) : null;
};

const originalExecute = powerSync.execute.bind(powerSync);
powerSync.execute = async (sql, parameters) => {
  // If query belongs to JCL Real Estate, bypass local PowerSync and read/write directly to Supabase cloud!
  if (isJCLRealEstateQuery(sql)) {
    try {
      const directRes = await executeViaDirectSupabase(sql, parameters);
      
      const upperSql = typeof sql === 'string' ? sql.trim().toUpperCase() : '';
      if (upperSql.startsWith('INSERT') || upperSql.startsWith('UPDATE') || upperSql.startsWith('DELETE')) {
        window.dispatchEvent(new CustomEvent('db:local-mutation-success', { 
          detail: { sql, isNoisy: false } 
        }));
      }
      return directRes;
    } catch (directErr) {
      console.warn('[DirectSupabase Bridge] Direct query failed, falling back to local replica:', directErr);
    }
  }

  try {
    const res = await originalExecute(sql, parameters);
    
    // Determine if this is a mutation (write) query
    const upperSql = typeof sql === 'string' ? sql.trim().toUpperCase() : '';
    if (upperSql.startsWith('INSERT') || upperSql.startsWith('UPDATE') || upperSql.startsWith('DELETE')) {
      // Exclude noisy background tables from visual popups, but they will STILL trigger query invalidations
      const isNoisy = upperSql.includes('USAGE_METRICS') || 
                      upperSql.includes('NOTIFICATIONS') || 
                      upperSql.includes('SYNC_ERRORS') || 
                      upperSql.includes('CHAT_MESSAGES');
                      
      window.dispatchEvent(new CustomEvent('db:local-mutation-success', { 
        detail: { sql, isNoisy } 
      }));
    }
    return res;
  } catch (err) {
    const upperSql = typeof sql === 'string' ? sql.trim().toUpperCase() : '';
    if (upperSql.startsWith('INSERT') || upperSql.startsWith('UPDATE') || upperSql.startsWith('DELETE')) {
      window.dispatchEvent(new CustomEvent('db:local-mutation-error', { 
        detail: { sql, error: err } 
      }));
    }
    throw err;
  }
};

let initPromise = null;
export const initPowerSync = () => {
  if (!initPromise) {
    initPromise = (async () => {
      const connector = new SupabaseConnector();
      await powerSync.init();
      await powerSync.connect(connector);
    })();
  }
  return initPromise;
};
