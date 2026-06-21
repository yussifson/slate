import { inngest } from "../client.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. Cron Job: Invoice Overdue Penalties
export const checkOverdueInvoices = inngest.createFunction(
  { id: "core-check-overdue-invoices" },
  { cron: "0 0 * * *" }, // Run daily at midnight
  async ({ step }) => {
    await step.run("fetch-and-update-overdue", async () => {
      // Find invoices past due date that are not paid
      const { data: overdueInvoices, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("status", "unpaid")
        .lt("due_date", new Date().toISOString());

      if (error || !overdueInvoices) return { updated: 0 };

      // We can trigger an event for each so automations can pick them up
      for (const invoice of overdueInvoices) {
        await supabase.from("invoices").update({ status: "overdue" }).eq("id", invoice.id);
        await inngest.send({
          name: "slate/invoice.overdue",
          data: { invoice_id: invoice.id, company_id: invoice.company_id }
        });
      }
      return { updated: overdueInvoices.length };
    });
  }
);

// 2. Event Driven Job: Automated Email Routing (Fallback if not using Visual Builder)
export const processIncomingEmail = inngest.createFunction(
  { id: "core-process-incoming-email" },
  { event: "core/email.received" },
  async ({ event, step }) => {
    await step.run("route-email", async () => {
      // Logic to parse email and create a Lead, Case, or Ticket
      return { routed: true, subject: event.data.subject };
    });
  }
);
