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

    // Event occurrence identity: use explicit caller key or generate a unique event occurrence identifier.
    // Retries of an already created outbox record MUST reuse the stored record's idempotency_key, not generate a new one.
    const occurrenceId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const key = idempotencyKey || `${companyId}:${aggregateType}:${aggregateId}:${eventType}:${occurrenceId}`;

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
