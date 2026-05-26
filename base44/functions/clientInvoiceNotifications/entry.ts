import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const invoices = await base44.asServiceRole.entities.Invoice.list();
  const results = { upcoming_reminders: 0, overdue_alerts: 0, errors: [] };

  for (const inv of invoices) {
    if (!inv.due_date || ["paid", "cancelled", "draft"].includes(inv.status)) continue;

    const dueDate = new Date(inv.due_date);
    dueDate.setHours(0, 0, 0, 0);
    const daysUntilDue = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));

    // Find client email
    let clientEmail = null;
    let clientName = inv.client_name || "Client";

    if (inv.client_id) {
      const clients = await base44.asServiceRole.entities.Client.filter({ id: inv.client_id });
      if (clients[0]?.email) {
        clientEmail = clients[0].email;
        clientName = clients[0].name;
      }
    }

    if (!clientEmail) continue;

    const currency = inv.currency || "GHS";
    const symbols = { GHS: "GH₵", NGN: "₦", SLL: "Le", USD: "$" };
    const symbol = symbols[currency] || "GH₵";
    const amount = `${symbol}${(inv.total_amount || 0).toLocaleString("en", { minimumFractionDigits: 2 })}`;
    const dueDateStr = dueDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const invoiceRef = inv.invoice_number || `INV-${inv.id.slice(-6).toUpperCase()}`;
    const payLink = `${Deno.env.get("BASE44_APP_URL") || "https://app.base44.com"}/invoices?id=${inv.id}`;

    // 7-day upcoming reminder
    if (daysUntilDue === 7 && inv.status === "sent") {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: clientEmail,
        from_name: "LexAfrica Billing",
        subject: `Payment Reminder: Invoice ${invoiceRef} due in 7 days`,
        body: `Dear ${clientName},

This is a friendly reminder that invoice ${invoiceRef} for legal services is due in 7 days.

Invoice Details:
• Invoice Number: ${invoiceRef}
• Amount Due: ${amount}
• Due Date: ${dueDateStr}
${inv.case_title ? `• Case: ${inv.case_title}` : ""}

To view and pay your invoice, please click the link below:
${payLink}

If you have already arranged payment, please disregard this notice.

Thank you for your continued trust in our firm.

Best regards,
LexAfrica Law Management
`,
      });
      results.upcoming_reminders++;
    }

    // 1-day upcoming reminder
    if (daysUntilDue === 1 && inv.status === "sent") {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: clientEmail,
        from_name: "LexAfrica Billing",
        subject: `URGENT: Invoice ${invoiceRef} due TOMORROW`,
        body: `Dear ${clientName},

Your invoice ${invoiceRef} is due TOMORROW.

Invoice Details:
• Invoice Number: ${invoiceRef}
• Amount Due: ${amount}
• Due Date: ${dueDateStr}
${inv.case_title ? `• Case: ${inv.case_title}` : ""}

Please pay immediately to avoid late payment proceedings:
${payLink}

Best regards,
LexAfrica Law Management
`,
      });
      results.upcoming_reminders++;
    }

    // Overdue handling
    if (daysUntilDue < 0 && inv.status !== "overdue") {
      await base44.asServiceRole.entities.Invoice.update(inv.id, { status: "overdue" });

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: clientEmail,
        from_name: "LexAfrica Billing",
        subject: `OVERDUE NOTICE: Invoice ${invoiceRef} — Immediate Action Required`,
        body: `Dear ${clientName},

Your invoice ${invoiceRef} is now OVERDUE by ${Math.abs(daysUntilDue)} day(s).

Invoice Details:
• Invoice Number: ${invoiceRef}
• Amount Due: ${amount}
• Original Due Date: ${dueDateStr}
${inv.case_title ? `• Case: ${inv.case_title}` : ""}

This account is now overdue. Please settle your balance immediately to avoid further action:
${payLink}

If you are experiencing difficulties, please contact our billing team immediately.

Best regards,
LexAfrica Law Management
`,
      });

      // Also notify internal staff
      const staffRecords = await base44.asServiceRole.entities.StaffRecord.filter({
        company_id: inv.company_id,
        role: "company_admin",
      });
      for (const staff of staffRecords.slice(0, 2)) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: staff.user_email,
          from_name: "LexAfrica System",
          subject: `[INTERNAL] Invoice ${invoiceRef} is overdue — ${clientName}`,
          body: `Hi ${staff.full_name},\n\nInvoice ${invoiceRef} for client ${clientName} is now overdue.\n\nAmount: ${amount}\nDue: ${dueDateStr}\n\nLog in to follow up: https://app.base44.com/invoices`,
        });
      }

      results.overdue_alerts++;
    }
  }

  return Response.json({ success: true, ...results });
});