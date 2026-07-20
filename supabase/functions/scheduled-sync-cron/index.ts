import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// Scheduled cron function: auto-syncs all active integrations
// Triggered by Supabase cron schedule (configured in config.toml)
serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceKey = Deno.env.get('SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, serviceKey);

  // Fetch all active integrations where auto-sync is enabled (not Manual)
  const { data: integrations, error } = await supabase
    .from('clipad_integrations')
    .select('id, provider, company_id, sync_frequency, last_synced_at')
    .eq('status', 'active')
    .neq('sync_frequency', 'Manual')
    .not('sync_frequency', 'is', null);

  if (error) {
    console.error('Failed to fetch integrations:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const now = new Date();
  let triggered = 0;

  for (const integration of (integrations || [])) {
    const lastSynced = integration.last_synced_at ? new Date(integration.last_synced_at) : null;
    
    // Determine if sync is due based on frequency setting (matches UI dropdown values)
    let isDue = false;
    if (!lastSynced) {
      isDue = true; // Never synced before — always trigger
    } else {
      const minutesSinceSync = (now.getTime() - lastSynced.getTime()) / (1000 * 60);
      const freq = (integration.sync_frequency || '').toLowerCase().trim();

      if (freq === '15 minutes' && minutesSinceSync >= 15) isDue = true;
      if (freq === 'hourly'     && minutesSinceSync >= 60) isDue = true;
      if (freq === 'daily'      && minutesSinceSync >= 60 * 24) isDue = true;
      if (freq === 'weekly'     && minutesSinceSync >= 60 * 24 * 7) isDue = true;

      // Legacy support for old numeric values
      if (freq === '6h'  && minutesSinceSync >= 360) isDue = true;
      if (freq === '12h' && minutesSinceSync >= 720) isDue = true;
      if (freq === '24h' && minutesSinceSync >= 1440) isDue = true;
    }

    if (!isDue) continue;

    // Trigger sync (fire-and-forget)
    supabase.functions.invoke('integration-sync', {
      body: { integrationId: integration.id, provider: integration.provider }
    }).catch((err: any) => console.error(`Failed to trigger sync for ${integration.provider}:`, err.message));

    triggered++;
    console.log(`Triggered sync for ${integration.provider} (company: ${integration.company_id}, freq: ${integration.sync_frequency})`);
  }

  return new Response(JSON.stringify({ success: true, triggered, total: integrations?.length || 0 }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
