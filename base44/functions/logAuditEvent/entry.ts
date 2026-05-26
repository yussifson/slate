import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, entity_type, entity_id, entity_label, details, severity } = await req.json();

    await base44.asServiceRole.entities.AuditLog.create({
      company_id: user.company_id,
      user_email: user.email,
      user_name: user.full_name,
      action,
      entity_type,
      entity_id,
      entity_label,
      details,
      severity: severity || 'info',
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});