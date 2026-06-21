import { inngest } from "../client.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Weekly Attendance Report Cron
export const attendanceReportCron = inngest.createFunction(
  { id: "school-attendance-report" },
  { cron: "0 18 * * 5" }, // Run every Friday at 6:00 PM
  async ({ step }) => {
    await step.run("generate-weekly-attendance", async () => {
      // Find all school companies
      // For each, trigger a slate/school.attendance_report_generated event
      const { data: companies } = await supabase.from("companies").select("id").eq("vertical", "school");
      if (!companies) return { generated: 0 };

      for (const company of companies) {
        await inngest.send({
          name: "slate/school.attendance_report",
          data: { company_id: company.id, timeframe: "weekly" }
        });
      }
      return { generated: companies.length };
    });
  }
);
