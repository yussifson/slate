import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json();

  const { event, data } = body;
  if (event?.type !== "create" || !data?.id) {
    return Response.json({ skipped: true });
  }

  const companyId = data.company_id;
  if (!companyId) return Response.json({ skipped: true, reason: "no_company" });

  const existing = await base44.asServiceRole.entities.Document.filter({ company_id: companyId });
  const seq = String(existing.length).padStart(5, "0");
  const year = new Date().getFullYear().toString().slice(-2);

  // E.g. DOC-26-00001
  const docNumber = `DOC-${year}-${seq}`;

  // Append doc number to the document name prefix if not there
  const newName = data.name?.startsWith("DOC-") ? data.name : `[${docNumber}] ${data.name || "Document"}`;

  await base44.asServiceRole.entities.Document.update(data.id, { name: newName });

  return Response.json({ success: true, doc_number: docNumber });
});