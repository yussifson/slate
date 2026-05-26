import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    const entityId = event?.entity_id;
    const entityType = event?.entity_name;

    if (!entityId || !entityType) {
      return Response.json({ skipped: true, reason: 'Missing entity info' });
    }

    let clientEmail = null;
    let clientName = null;
    let subject = '';
    let bodyLines = [];

    if (entityType === 'LegalCase') {
      const caseData = data || await base44.asServiceRole.entities.LegalCase.get(entityId);
      if (!caseData?.client_id) return Response.json({ skipped: true, reason: 'No client_id on case' });

      const clients = await base44.asServiceRole.entities.Client.filter({ id: caseData.client_id });
      const client = clients[0];
      if (!client?.email) return Response.json({ skipped: true, reason: 'No client email' });

      const oldStatus = old_data?.status;
      const newStatus = caseData.status;
      if (oldStatus === newStatus) return Response.json({ skipped: true, reason: 'Status unchanged' });

      clientEmail = client.email;
      clientName = client.name;
      subject = `Case Update: ${caseData.title}`;
      bodyLines = [
        `Dear ${client.name},`,
        '',
        `There has been a significant update to your case: <strong>${caseData.title}</strong>`,
        '',
        `<strong>Status changed:</strong> ${(oldStatus || 'unknown').replace(/_/g, ' ')} → ${newStatus.replace(/_/g, ' ')}`,
        '',
        caseData.next_hearing_date ? `<strong>Next Hearing:</strong> ${caseData.next_hearing_date}` : '',
        caseData.assigned_lawyer_name ? `<strong>Assigned Lawyer:</strong> ${caseData.assigned_lawyer_name}` : '',
        '',
        'Please log in to your client portal to view the full details.',
        '',
        'Regards,',
        'Your Legal Team',
      ];

    } else if (entityType === 'Document') {
      const docData = data || await base44.asServiceRole.entities.Document.get(entityId);
      if (!docData?.client_id || !docData?.shared_with_client) {
        return Response.json({ skipped: true, reason: 'Not shared with client or no client_id' });
      }

      const clients = await base44.asServiceRole.entities.Client.filter({ id: docData.client_id });
      const client = clients[0];
      if (!client?.email) return Response.json({ skipped: true, reason: 'No client email' });

      clientEmail = client.email;
      clientName = client.name;
      subject = `New Document Available: ${docData.name}`;
      bodyLines = [
        `Dear ${client.name},`,
        '',
        `A new document has been shared with you:`,
        '',
        `<strong>Document:</strong> ${docData.name}`,
        docData.case_title ? `<strong>Case:</strong> ${docData.case_title}` : '',
        docData.category ? `<strong>Category:</strong> ${docData.category.replace(/_/g, ' ')}` : '',
        '',
        'Please log in to your client portal to view and download the document.',
        '',
        'Regards,',
        'Your Legal Team',
      ];
    }

    if (!clientEmail) return Response.json({ skipped: true, reason: 'No recipient determined' });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: clientEmail,
      subject,
      body: bodyLines.filter(l => l !== null && l !== undefined).join('<br>'),
    });

    // Create in-app notification
    if (entityType === 'LegalCase' && data?.company_id) {
      await base44.asServiceRole.entities.Notification.create({
        company_id: data.company_id,
        recipient_email: clientEmail,
        type: 'case_update',
        title: subject,
        message: `Your case status has been updated to: ${data.status?.replace(/_/g, ' ')}`,
        entity_type: 'LegalCase',
        entity_id: entityId,
      });
    } else if (entityType === 'Document' && data?.company_id) {
      await base44.asServiceRole.entities.Notification.create({
        company_id: data.company_id,
        recipient_email: clientEmail,
        type: 'document_available',
        title: subject,
        message: `A new document has been shared with you: ${data.name}`,
        entity_type: 'Document',
        entity_id: entityId,
      });
    }

    return Response.json({ success: true, notified: clientEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});