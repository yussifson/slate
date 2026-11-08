import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { nativeMobile } from '@/services/NativeMobileService';

/**
 * Validated JCL Real Estate Notification Event Dispatcher
 * Provides schema-aligned persistence, idempotency, edge function orchestration,
 * and immediate native chime/haptics/heads-up mobile alerts.
 * 
 * @param {Object} params
 * @param {string} [params.company_id] - JCL Tenant/Company ID
 * @param {string} [params.user_id] - Recipient user profile ID
 * @param {string} [params.recipient_email] - Recipient email (Required for user delivery)
 * @param {string} [params.recipient_name] - Recipient display name
 * @param {string} params.title - Notification headline (Required)
 * @param {string} params.message - Notification body text (Required)
 * @param {string} [params.type='general'] - Category: 'offer', 'viewing', 'lead', 'requisition', 'finance', 'lease', 'maintenance', 'custody', etc.
 * @param {string} [params.related_id] - Target URL or entity ID for deep linking
 * @param {string} [params.idempotency_key] - Deterministic key preventing duplicate spam
 * @param {Object} [params.metadata={}] - Structured context attributes
 * @param {boolean} [params.trigger_native=true] - Trigger instant native device chime & banner
 * @returns {Promise<Object>} Created or retrieved existing notification record
 */
export async function createNotificationEvent({
  company_id,
  user_id,
  recipient_email,
  recipient_name,
  title,
  message,
  type = 'general',
  related_id = null,
  idempotency_key = null,
  metadata = {},
  trigger_native = true
}) {
  // 1. Mandatory Input Validation
  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new Error("createNotificationEvent: 'title' is required and must be a non-empty string.");
  }
  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new Error("createNotificationEvent: 'message' is required and must be a non-empty string.");
  }

  // 2. Client-Side Idempotency Check
  if (idempotency_key) {
    try {
      const existing = await base44.entities.Notification.filter({ idempotency_key });
      if (existing && existing.length > 0) {
        return existing[0];
      }
    } catch {
      // Column may not be present in remote schema; continue gracefully
    }
  }

  // 3. Assemble Schema-Compliant Payload (Aligned with notifications table in AppSchema)
  const payload = {
    title: title.trim(),
    message: message.trim(),
    type: String(type || 'general').trim(),
    is_read: 'false'
  };

  if (company_id) payload.company_id = String(company_id).trim();
  if (recipient_email) payload.recipient_email = String(recipient_email).toLowerCase().trim();
  if (recipient_name) payload.recipient_name = String(recipient_name).trim();
  if (related_id) payload.related_id = String(related_id).trim();
  if (idempotency_key) payload.idempotency_key = String(idempotency_key).trim();

  // 4. Dispatch through base44 entity adapter (syncs to Supabase & PowerSync SQLite)
  let created = null;
  try {
    created = await base44.entities.Notification.create(payload);
  } catch (dbErr) {
    console.warn('[notificationDispatcher] DB insert notice:', dbErr.message);
    // If standard table insert hit constraint, try direct fallback
    try {
      const { data } = await supabase.from('notifications').insert([payload]).select().single();
      created = data;
    } catch (fallbackErr) {
      console.error('[notificationDispatcher] Fallback insert failed:', fallbackErr);
    }
  }

  // 5. Fire Instant Native Alert (Chime sound + Haptic + Heads-up notification on mobile)
  if (trigger_native) {
    try {
      nativeMobile.notify({
        title: payload.title,
        body: payload.message,
        extra: {
          type: payload.type,
          related_id: payload.related_id,
          company_id: payload.company_id
        }
      });
    } catch (soundErr) {
      console.debug('[notificationDispatcher] Native notification notice:', soundErr);
    }
  }

  // 6. Asynchronously trigger Edge Function / Novu workflow orchestration (non-blocking)
  if (payload.recipient_email) {
    supabase.functions.invoke('notification-trigger', {
      body: {
        type: 'INSERT',
        table: 'notifications',
        record: {
          id: created?.id || null,
          title: payload.title,
          message: payload.message,
          type: payload.type,
          related_id: payload.related_id,
          recipient_email: payload.recipient_email,
          recipient_name: payload.recipient_name,
          company_id: payload.company_id,
          metadata
        }
      }
    }).catch(edgeErr => {
      // Non-blocking log: notification is already committed locally and played to user
      console.debug('[notificationDispatcher] Edge function workflow notification notice:', edgeErr.message || edgeErr);
    });
  }

  return created;
}
