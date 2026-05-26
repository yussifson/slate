import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json().catch(() => ({}));

  // Support both automation trigger mode and direct invoke mode
  const { event, data, company_id } = body;

  // --- Automation mode (entity trigger) ---
  if (event?.type === "create" && data?.id) {
    if (data.case_number) return Response.json({ skipped: true, reason: "already_numbered" });
    const companyId = data.company_id;
    if (!companyId) return Response.json({ skipped: true, reason: "no_company" });

    const existing = await base44.asServiceRole.entities.LegalCase.filter({ company_id: companyId });
    const seq = String(existing.length).padStart(4, "0");
    const year = new Date().getFullYear().toString().slice(-2);
    const caseNumber = `CASE-${year}-${seq}`;
    await base44.asServiceRole.entities.LegalCase.update(data.id, { case_number: caseNumber });
    return Response.json({ success: true, case_number: caseNumber });
  }

  // --- Direct invoke mode (frontend calling for preview) ---
  if (company_id) {
    const existing = await base44.asServiceRole.entities.LegalCase.filter({ company_id });
    const seq = String(existing.length + 1).padStart(4, "0");
    const year = new Date().getFullYear().toString().slice(-2);
    const caseNumber = `CASE-${year}-${seq}`;
    return Response.json({ success: true, case_number: caseNumber });
  }

  return Response.json({ skipped: true });
});