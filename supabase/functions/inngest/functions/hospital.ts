import { inngest } from "../client.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Shift Reminder Cron for Staff
export const shiftReminderCron = inngest.createFunction(
  { id: "hospital-shift-reminder" },
  { cron: "0 * * * *" }, // Run every hour
  async ({ step }) => {
    await step.run("send-shift-reminders", async () => {
      // Find shifts starting in exactly 2 hours
      const now = new Date();
      const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      
      const { data: shifts, error } = await supabase
        .from("hospital_staff_shifts")
        .select("*")
        .gte("start_time", now.toISOString())
        .lte("start_time", inTwoHours.toISOString());

      if (error || !shifts) return { reminded: 0 };

      for (const shift of shifts) {
        // Trigger event so that hospital automations can send SMS or email
        await inngest.send({
          name: "slate/hospital.shift_reminder",
          data: { shift_id: shift.id, staff_id: shift.staff_id, company_id: shift.company_id }
        });
      }
      return { reminded: shifts.length };
    });
  }
);
