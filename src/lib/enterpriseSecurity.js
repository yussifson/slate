// src/lib/enterpriseSecurity.js
// Enterprise Compliance, Security & Data Privacy Layer
// Implements client-side PII sanitization, RBAC filtering, and audit logging.

// 1. Common PII Patterns (Emails, Credit Cards, SSN, Phone Numbers)
const PII_PATTERNS = [
  { name: 'EMAIL', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[REDACTED EMAIL]' },
  { name: 'PHONE', regex: /(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/g, replacement: '[REDACTED PHONE]' },
  { name: 'SSN', regex: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[REDACTED SSN]' },
  { name: 'CREDIT_CARD', regex: /\b(?:\d[ -]*?){13,16}\b/g, replacement: '[REDACTED CREDIT CARD]' },
];

/**
 * Sanitizes input text before passing to AI models or external processors
 * Redacts emails, phone numbers, credit cards, and SSNs.
 */
export function sanitizePII(text) {
  if (!text || typeof text !== 'string') return text;
  let sanitized = text;
  PII_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern.regex, pattern.replacement);
  });
  return sanitized;
}

/**
 * Filter knowledge query results by user permissions (Role-Based Access Control)
 * Ensures restricted roles (patients, students, external clients) do not access internal knowledge
 */
export function filterKnowledgeByRole(items, userRole) {
  if (!items || !Array.isArray(items)) return [];
  
  // Super Admins & Admins have full access
  if (['super_admin', 'admin', 'doctor', 'teacher', 'lawyer'].includes(userRole)) {
    return items;
  }

  // Restricted roles only see public/client-facing records
  const RESTRICTED_TYPES = ['internal_document', 'financial_ledger', 'payroll', 'private_chat'];

  return items.filter(item => {
    if (RESTRICTED_TYPES.includes(item.content_type)) return false;
    if (item.metadata?.confidential === true) return false;
    return true;
  });
}

/**
 * Log compliance audit event for SOC2 & HIPAA audits
 */
export async function logSecurityAuditEvent(supabase, { userId, companyId, action, resource, details }) {
  try {
    await supabase.from('clipad_org_events').insert({
      workspace_id: companyId,
      actor_id: userId,
      event_type: 'security_audit',
      title: `Audit: ${action} on ${resource}`,
      description: typeof details === 'string' ? details : JSON.stringify(details || {}),
      importance: 5,
    });
  } catch { /* ignore non-blocking audit failure */ }
}
