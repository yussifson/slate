import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const PLANS = {
  free: { name: "Free", price: 0 },
  starter: { name: "Starter", price: 49 },
  professional: { name: "Professional", price: 149 },
  firm_plus: { name: "Firm Plus", price: 349 },
  enterprise: { name: "Enterprise", price: 799 },
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const today = new Date();
  const billingPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  // Get all active companies
  const companies = await base44.asServiceRole.entities.Company.list();
  const activeCompanies = companies.filter(c => c.subscription_status === "active" && c.subscription_plan !== "free");

  let created = 0;
  let skipped = 0;

  for (const company of activeCompanies) {
    // Check if invoice already exists for this period
    const existing = await base44.asServiceRole.entities.SubscriptionInvoice.filter({
      company_id: company.id,
      billing_period: billingPeriod,
    });

    if (existing.length > 0) { skipped++; continue; }

    const plan = PLANS[company.subscription_plan] || PLANS.free;
    if (plan.price === 0) { skipped++; continue; }

    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 14); // 14 days to pay

    const invoice = await base44.asServiceRole.entities.SubscriptionInvoice.create({
      company_id: company.id,
      company_name: company.name,
      admin_email: company.admin_email || company.email,
      plan: company.subscription_plan,
      plan_name: plan.name,
      amount_usd: plan.price,
      billing_period: billingPeriod,
      due_date: dueDate.toISOString().split("T")[0],
      status: "sent",
      reminder_count: 0,
    });

    // Send invoice email
    if (company.admin_email || company.email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: company.admin_email || company.email,
        subject: `[LexAfrica] Subscription Invoice — ${plan.name} Plan — ${billingPeriod}`,
        body: `Dear ${company.name} Team,\n\nYour monthly subscription invoice for ${billingPeriod} is ready.\n\nPlan: ${plan.name}\nAmount: $${plan.price}.00 USD\nDue Date: ${dueDate.toISOString().split("T")[0]}\n\nPlease arrange payment via your preferred method.\n\nThank you for using LexAfrica!\n\n— LexAfrica Billing Team`,
      });
    }

    created++;
  }

  return Response.json({ success: true, created, skipped, period: billingPeriod });
});