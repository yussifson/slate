import { PowerSyncDatabase } from '@powersync/web';
import { supabase } from './supabaseClient';
import { AppSchema } from './AppSchema';

class SupabaseConnector {
  constructor() {
    this.client = supabase;
  }

  async fetchCredentials() {
    const { data: { session }, error } = await this.client.auth.getSession();
    if (error || !session) {
      throw new Error('Could not fetch Supabase credentials');
    }

    return {
      endpoint: import.meta.env.VITE_POWERSYNC_URL || 'https://6a1a95798d064eb85eea17a5.powersync.journeyapps.com',
      token: session.access_token
    };
  }

  async uploadData(database) {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) return;

    let lastOp = null;
    try {
      for (const op of transaction.crud) {
        lastOp = op;
        const table = this.client.from(op.table);

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
      }
      await transaction.complete();
    } catch (ex) {
      console.error(`Error uploading data for operation ${lastOp?.op} on ${lastOp?.table}:`, ex);
      // Optional: await transaction.complete() if you want to skip failing ops, 
      // but usually we throw to retry later when online.
      throw ex;
    }
  }
}

export const powerSync = new PowerSyncDatabase({
  database: { dbFilename: 'optalflow.db' },
  schema: AppSchema
});

export const initPowerSync = async () => {
  const connector = new SupabaseConnector();
  await powerSync.init();
  await powerSync.connect(connector);
};
