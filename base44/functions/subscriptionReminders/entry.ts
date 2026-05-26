import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const invoices = await base44.asServiceRole.entities.SubscriptionInvoice.list();

  let reminded = 0;
  let markedOverdue = 0;

  for (const inv of invoices) {
    if (inv.status === "paid" || inv.status === "cancelled") continue;
    if (!inv.due_date) continue;

    const due = new Date(inv.due_date);
    due.setHours(0, 0, 0, 0);
    const daysOverdue = Math.floor((today - due) / (1000 * 60 * 60 * 24));

    // Mark overdue
    if (daysOverdue > 0 && inv.status !== "overdue") {
      await base44.asServiceRole.entities.SubscriptionInvoice.update(inv.id, { status: "overdue" });
      markedOverdue++;
    }

    // Send reminders: 3 days before, on due date, 7 days overdue, 14 days overdue
    const reminderDays = [-3, 0, 7, 14];
    const shouldRemind = reminderDays.includes(daysOverdue);
    const alreadyRemindedToday = inv.last_reminder_at && new Date(inv.last_reminder_at).toDateString() === today.toDateString();

    if (shouldRemind && !alreadyRemindedToday && inv.admin_email) {
      const isOverdue = daysOverdue > 0;
      const subject = isOverdue
        ? `[LexAfrica] OVERDUE: Subscription Payment — ${daysOverdue} days late`
        : daysOverdue === 0
        ? `[LexAfrica] Subscription Payment Due Today`
        : `[LexAfrica] Upcoming Subscription Payment — Due in 3 days`;

      const body = isOverdue
        ? `Dear ${inv.company_name},\n\nYour LexAfrica subscription payment of $${inv.amount_usd} USD for ${inv.billing_period} is now ${daysOverdue} days overdue.\n\nPlan: ${inv.plan_name}\nDue Date: ${inv.due_date}\n\nPlease settle this payment immediately to avoid service interruption.\n\n— LexAfrica Billing`
        : `Dear ${inv.company_name},\n\nThis is a reminder that your LexAfrica subscription payment of $${inv.amount_usd} USD is due ${daysOverdue === 0 ? "today" : "in 3 days"}.\n\nPlan: ${inv.plan_name}\nBilling Period: ${inv.billing_period}\nDue Date: ${inv.due_date}\n\nThank you!\n\n— LexAfrica Billing`;

      await base44.asServiceRole.integrations.Core.SendEmail({ to: inv.admin_email, subject, body });

      await base44.asServiceRole.entities.SubscriptionInvoice.update(inv.id, {
        reminder_count: (inv.reminder_count || 0) + 1,
        last_reminder_at: new Date().toISOString(),
      });

      reminded++;
    }
  }

  return Response.json({ success: true, reminded, markedOverdue });
});