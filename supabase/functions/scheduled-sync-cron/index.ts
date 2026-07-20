import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// Scheduled cron function: auto-syncs all active integrations
// Triggered by Supabase cron schedule (configured in config.toml)
serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceKey = Deno.env.get('SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, serviceKey);

  // Fetch all active integrations where auto-sync is enabled
  const { data: integrations, error } = await supabase
    .from('clipad_integrations')
    .select('id, provider, company_id, sync_frequency, last_synced_at')
    .eq('status', 'active')
    .neq('sync_frequency', 'manual');

  if (error) {
    console.error('Failed to fetch integrations:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const now = new Date();
  let triggered = 0;

  for (const integration of (integrations || [])) {
    const lastSynced = integration.last_synced_at ? new Date(integration.last_synced_at) : null;
    
    // Determine if sync is due based on frequency setting
    let isDue = false;
    if (!lastSynced) {
      isDue = true; // Never synced before
    } else {
      const hoursSinceSync = (now.getTime() - lastSynced.getTime()) / (1000 * 60 * 60);
      if (integration.sync_frequency === '6h' && hoursSinceSync >= 6) isDue = true;
      if (integration.sync_frequency === '12h' && hoursSinceSync >= 12) isDue = true;
      if (integration.sync_frequency === '24h' && hoursSinceSync >= 24) isDue = true;
    }

    if (!isDue) continue;

    // Trigger sync (fire-and-forget)
    supabase.functions.invoke('integration-sync', {
      body: { integrationId: integration.id, provider: integration.provider }
    }).catch((err: any) => console.error(`Failed to trigger sync for ${integration.provider}:`, err.message));

    triggered++;
    console.log(`Triggered sync for ${integration.provider} (company: ${integration.company_id})`);
  }

  return new Response(JSON.stringify({ success: true, triggered, total: integrations?.length || 0 }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
