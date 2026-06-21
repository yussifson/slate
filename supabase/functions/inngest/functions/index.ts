import { inngest } from "../client.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

import { checkOverdueInvoices, processIncomingEmail, sendWelcomeNotification } from "./core.ts";
import { shiftReminderCron } from "./hospital.ts";
import { attendanceReportCron } from "./school.ts";

// Initialize Supabase Client
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Define the Master Automation Trigger Function
export const masterAutomationTrigger = inngest.createFunction(
  { id: "master-automation-trigger" },
  { event: "slate/*" },
  async ({ event, step }) => {
    // 1. Fetch matching active automations for the event
    const { data: automations, error: autoError } = await supabase
      .from("automations")
      .select("*")
      .eq("trigger_key", event.name.replace("slate/", ""))
      .eq("is_active", true);

    if (autoError || !automations || automations.length === 0) {
      return { success: true, message: "No active automations found for this event." };
    }

    // 2. Loop through automations and trigger runs
    for (const automation of automations) {
      // Evaluate filters if needed (stubbed for now)
      let passesFilter = true;
      const filters = automation.trigger_filters || [];
      // Example simple filter evaluation could happen here

      if (passesFilter) {
        // Create an automation run record
        const { data: run, error: runError } = await supabase
          .from("automation_runs")
          .insert({
            automation_id: automation.id,
            company_id: automation.company_id || event.data?.company_id, // ensure company_id is provided
            status: "running",
            trigger_data: event.data,
            steps_total: automation.steps.length,
          })
          .select()
          .single();

        if (run && !runError) {
          // Send an event to process the first step
          await inngest.send({
            name: "automation/process_step",
            data: {
              run_id: run.id,
              automation_id: automation.id,
              step_index: 0,
              steps: automation.steps,
              trigger_data: event.data,
            },
          });
        }
      }
    }

    return { success: true, triggered: automations.length };
  }
);

export const processAutomationStep = inngest.createFunction(
  { id: "process-automation-step" },
  { event: "automation/process_step" },
  async ({ event, step }) => {
    const { run_id, step_index, steps, trigger_data } = event.data;
    
    if (step_index >= steps.length) {
      // Completed all steps
      await supabase.from("automation_runs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", run_id);
      return { status: "completed" };
    }

    const currentStep = steps[step_index];
    
    // Execute action using the handler_function defined in the registry
    // In a full implementation, we would map currentStep.action_key to specific logic.
    // For now, we simulate execution.
    try {
      await step.run("execute-action", async () => {
        // Action logic goes here
        console.log(`Executing ${currentStep.action_key} for run ${run_id}`);
        // Log step success
      });

      // Update progress
      await supabase.from("automation_runs").update({ steps_completed: step_index + 1 }).eq("id", run_id);

      // Trigger next step
      await inngest.send({
        name: "automation/process_step",
        data: {
          ...event.data,
          step_index: step_index + 1,
        },
      });

      return { status: "running", next_step: step_index + 1 };
    } catch (e) {
      // Mark as failed
      await supabase.from("automation_runs").update({ 
        status: "failed", 
        error_message: e.message,
        error_step: step_index
      }).eq("id", run_id);
      throw e;
    }
  }
);

export const functions = [
  sendWelcomeNotification,
  masterAutomationTrigger, 
  processAutomationStep,
  checkOverdueInvoices,
  processIncomingEmail,
  shiftReminderCron,
  attendanceReportCron
];

