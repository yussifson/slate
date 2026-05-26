import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const invoices = await base44.asServiceRole.entities.Invoice.list();

  // Find invoices that are "sent" and past due date — mark overdue and alert
  const pastDue = invoices.filter(inv => {
    if (inv.status !== "sent" || !inv.due_date) return false;
    const due = new Date(inv.due_date);
    due.setHours(0, 0, 0, 0);
    return due < today;
  });

  let updated = 0;

  for (const inv of pastDue) {
    // Update status to overdue
    await base44.asServiceRole.entities.Invoice.update(inv.id, { status: "overdue" });

    const title = `Invoice Overdue: ${inv.invoice_number || inv.id}`;
    const message = `Invoice for ${inv.client_name} is now overdue.\n\nAmount: ${inv.currency || "GHS"} ${(inv.total_amount || 0).toLocaleString()}\nDue Date: ${inv.due_date}\nCase: ${inv.case_title || "N/A"}`;

    // Look up company admin to notify
    const staffRecords = await base44.asServiceRole.entities.StaffRecord.filter({
      company_id: inv.company_id,
      role: "company_admin",
    });

    const recipients = staffRecords.length > 0 ? staffRecords : await base44.asServiceRole.entities.StaffRecord.filter({
      company_id: inv.company_id,
      role: "finance",
    });

    for (const staff of recipients.slice(0, 2)) {
      await base44.asServiceRole.entities.Notification.create({
        company_id: inv.company_id,
        recipient_email: staff.user_email,
        recipient_name: staff.full_name,
        type: "invoice_overdue",
        title,
        message,
        related_id: inv.id,
        is_read: false,
        email_sent: false,
      });

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: staff.user_email,
        subject: `[LexAfrica] ${title}`,
        body: `Dear ${staff.full_name},\n\n${message}\n\nPlease follow up with the client.\n\n— LexAfrica Team`,
      });
    }

    updated++;
  }

  return Response.json({ success: true, updated });
});