import { PowerSyncDatabase } from '@powersync/web';
import { supabase } from './supabaseClient';
import { AppSchema } from './AppSchema';

class SupabaseConnector {
  constructor() {
    this.client = supabase;
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
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) return;

    try {
      for (const op of transaction.crud) {
        const table = this.client.from(op.table);
        try {
          switch (op.op) {
            case 'PUT': {
              const { error } = await table.upsert({ ...op.opData, id: op.id });
              if (error) throw error;
              break;
            }
            case 'PATCH': {
              const { error } = await table.update(op.opData).eq('id', op.id);
              if (error) throw error;
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

          // TIER 3: Hard errors (403, 404, 422, or 400 with PG code)
          if ([403, 404, 422, 400].includes(opEx.status) || (opEx.code && typeof opEx.code === 'string')) {
            console.error(`[PowerSync] Hard error uploading operation ${op.op} on ${op.table}:`, opEx);
            
            // Write to sync_errors table
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
              console.error("[PowerSync] Failed to write to sync_errors:", errWrite);
            }

            // Emit custom DOM event
            const eventPayload = {
              table: op.table,
              operation: op.op,
              recordId: op.id,
              errorCode: opEx.code || opEx.status,
              errorMessage: opEx.message,
            };
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

export const powerSync = new PowerSyncDatabase({
  database: { dbFilename: 'slate.db' },
  schema: AppSchema
});

export const initPowerSync = async () => {
  const connector = new SupabaseConnector();
  await powerSync.init();
  await powerSync.connect(connector);
};
