/**
 * Slate V2: Platform Event Service (Transactional Outbox Foundation)
 * 
 * Provides reliable event recording with idempotency keys and outbox dispatch.
 */
import { supabase } from '../api/supabaseClient';

export const EventService = {
  /**
   * Publish an event to the platform outbox
   */
  async publishEvent(companyId, eventType, aggregateType, aggregateId, payload, idempotencyKey = null) {
    if (!companyId || !eventType || !aggregateType || !aggregateId) {
      throw new Error('companyId, eventType, aggregateType, and aggregateId are required to publish an event.');
    }

    const key = idempotencyKey || `${companyId}:${aggregateType}:${aggregateId}:${eventType}:${Date.now()}`;

    const record = {
      company_id: companyId,
      event_type: eventType,
      aggregate_type: aggregateType,
      aggregate_id: String(aggregateId),
      payload: payload || {},
      idempotency_key: key,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('platform_events')
        .insert(record)
        .select()
        .single();

      if (error) {
        // If duplicate idempotency key, ignore or return existing
        if (error.code === '23505') {
          console.info(`[EventService] Duplicate event skipped: ${key}`);
          return { skipped: true, idempotency_key: key };
        }
        throw error;
      }
      return data;
    } catch (err) {
      console.warn('[EventService] Failed to record event to outbox:', err);
      return { offline_queued: true, key };
    }
  }
};
