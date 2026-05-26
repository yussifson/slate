import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json();

  const { event, data } = body;
  if (event?.type !== "create" || !data?.id) {
    return Response.json({ skipped: true });
  }

  if (data.id_number) {
    return Response.json({ skipped: true, reason: "already_numbered" });
  }

  const companyId = data.company_id;
  if (!companyId) return Response.json({ skipped: true, reason: "no_company" });

  const existing = await base44.asServiceRole.entities.Client.filter({ company_id: companyId });
  const seq = String(existing.length).padStart(4, "0");
  const year = new Date().getFullYear().toString().slice(-2);

  // E.g. CLT-26-0001
  const clientNumber = `CLT-${year}-${seq}`;

  await base44.asServiceRole.entities.Client.update(data.id, { id_number: clientNumber });

  return Response.json({ success: true, client_number: clientNumber });
});