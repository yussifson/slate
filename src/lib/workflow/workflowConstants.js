/**
 * Slate V2 Workflow Engine - Standard Action & Trigger Registry
 * 
 * Provides verified action handlers, validation schemas, and trigger contracts.
 */

export const ACTION_HANDLERS = {
  NOTIFICATION_SEND: 'notification_send',
  TASK_CREATE: 'task_create',
  PARTY_UPDATE: 'party_update',
  WEBHOOK_POST: 'webhook_post',
  AUDIT_LOG_RECORD: 'audit_log_record'
};

export const TRIGGER_TYPES = {
  EVENT: 'event',
  SCHEDULE: 'schedule',
  MANUAL: 'manual',
  WEBHOOK: 'webhook'
};

export const WORKFLOW_STATUSES = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  DEAD_LETTER: 'dead_letter'
};
