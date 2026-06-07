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
          // If the error is a network error, rethrow it so PowerSync can retry the transaction later
          if (opEx.message && (opEx.message.includes('Failed to fetch') || opEx.message.includes('timeout') || opEx.message.includes('Offline'))) {
            throw opEx;
          }
          // Otherwise, it's a hard Supabase error (like RLS violation or missing table).
          // We log it and swallow it so the rest of the local operations can still upload.
          console.error(`[PowerSync] Hard error uploading operation ${op.op} on ${op.table}:`, opEx);
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
