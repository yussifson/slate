import { get, set } from 'idb-keyval';

class SyncQueue {
  constructor() {
    this.queueKey = 'slate_sync_queue';
    this.isSyncing = false;
  }

  async getQueue() {
    const queue = await get(this.queueKey);
    return queue || [];
  }

  async saveQueue(queue) {
    await set(this.queueKey, queue);
  }

  async enqueue(action) {
    const queue = await this.getQueue();
    queue.push({
      ...action,
      timestamp: Date.now(),
      id: crypto.randomUUID()
    });
    await this.saveQueue(queue);
    
    // Attempt immediate sync if online
    if (navigator.onLine) {
      this.sync();
    }
  }

  async sync() {
    if (this.isSyncing || !navigator.onLine) return;
    this.isSyncing = true;
    
    try {
      let queue = await this.getQueue();
      if (queue.length === 0) return;

      const newQueue = [];
      for (const item of queue) {
        try {
          // Process the sync item using the real API client
          await this.processItem(item);
        } catch (err) {
          console.error('Failed to sync item, leaving in queue:', item, err);
          newQueue.push(item);
        }
      }
      
      await this.saveQueue(newQueue);
    } finally {
      this.isSyncing = false;
    }
  }

  async processItem(item) {
    const { supabase } = await import('@/api/supabaseClient');
    const { action, payload, endpoint } = item;
    
    if (action === 'POST' || action === 'PUT') {
      let cleanData = action === 'POST' ? payload : payload.data;
      if (cleanData) {
        // Strip out SQLite artifacts (e.g. 'id:1')
        cleanData = Object.fromEntries(Object.entries(cleanData).filter(([k]) => !k.includes(':')));
      }
      const { error } = await supabase.from(endpoint).upsert(cleanData);
      if (error) throw error;
    } else if (action === 'DELETE') {
      await powerSync.execute(`DELETE FROM ${endpoint.replace(/['"`]/g, '')} WHERE id = ?`, [payload.id]);
      const error = null;
      if (error) throw error;
    }
  }
}

export const syncQueue = new SyncQueue();

// Listen to network status
window.addEventListener('online', () => {
  syncQueue.sync();
});
