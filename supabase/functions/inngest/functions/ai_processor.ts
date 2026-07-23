import { inngest } from "../client.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

export const processIntegrationKnowledge = inngest.createFunction(
  { id: "ai-process-integration-knowledge", concurrency: 1 }, // Limit concurrency so we don't spam
  { event: "ai/process.batch" },
  async ({ event, step }) => {
    const { integration_id } = event.data;
    if (!integration_id) return { error: "Missing integration_id" };

    let hasMore = true;
    let totalProcessed = 0;

    while (hasMore) {
      // 1. Fetch a batch of 50 unprocessed items
      const unprocessedItems = await step.run("fetch-unprocessed-batch", async () => {
        const { data, error } = await supabase
          .from("clipad_imported_knowledge")
          .select("id, provider, external_id")
          .eq("integration_id", integration_id)
          .is("embedding", null)
          .limit(50);
        
        if (error) throw new Error(error.message);
        return data || [];
      });

      if (unprocessedItems.length === 0) {
        hasMore = false;
        break;
      }

      // 2. Invoke the edge function for each item in the batch
      await step.run("process-batch", async () => {
        const promises = unprocessedItems.map((item) =>
          supabase.functions.invoke("integration-ai-processor", {
            body: { 
              integrationId: integration_id, 
              provider: item.provider, 
              externalId: item.external_id 
            }
          }).catch(err => console.error("Item processing failed:", err))
        );

        await Promise.all(promises);
      });

      totalProcessed += unprocessedItems.length;

      // 3. Small sleep to ensure we stay well below any rate limits
      await step.sleep("rate-limit-sleep", "5s");
    }

    return { processed: totalProcessed };
  }
);
