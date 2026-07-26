import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// Scheduled cron function: auto-syncs all active integrations that are due,
// AND resumes any integrations that have an interrupted sync cursor (partial backfill).
serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceKey = Deno.env.get('SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, serviceKey);

  // Fetch all active integrations:
  //   - Those with auto-sync enabled (non-Manual), OR
  //   - Those with a pending sync_cursor (interrupted sync that must resume)
  const { data: integrations, error } = await supabase
    .from('clipad_integrations')
    .select('id, provider, company_id, sync_frequency, last_synced_at, sync_cursor, sync_phase')
    .eq('status', 'active')
    .or('sync_cursor.not.is.null,sync_frequency.neq.Manual')
    .not('sync_frequency', 'is', null);

  if (error) {
    console.error('Failed to fetch integrations:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const now = new Date();
  let triggered = 0;

  for (const integration of (integrations || [])) {
    // Always resume interrupted syncs (non-null cursor), regardless of schedule
    const hasPendingCursor = integration.sync_cursor !== null;

    let isDue = hasPendingCursor;

    if (!isDue) {
      const freq = (integration.sync_frequency || '').toLowerCase().trim();
      if (freq === 'manual') continue; // skip manual-only integrations

      const lastSynced = integration.last_synced_at ? new Date(integration.last_synced_at) : null;

      if (!lastSynced) {
        isDue = true; // Never synced before — always trigger
      } else {
        const minutesSinceSync = (now.getTime() - lastSynced.getTime()) / (1000 * 60);

        if (freq === '15 minutes' && minutesSinceSync >= 15)  isDue = true;
        if (freq === 'hourly'     && minutesSinceSync >= 60)  isDue = true;
        if (freq === 'daily'      && minutesSinceSync >= 1440) isDue = true;
        if (freq === 'weekly'     && minutesSinceSync >= 10080) isDue = true;

        // Custom frequency: stored as "Custom:Xh" (e.g. "Custom:4h" = every 4 hours)
        if (freq.startsWith('custom:')) {
          const rawVal = freq.replace('custom:', '').trim();
          const hoursMatch = rawVal.match(/^([\d.]+)h$/);
          const minutesMatch = rawVal.match(/^([\d.]+)m$/);
          let customMinutes = 0;
          if (hoursMatch) customMinutes = parseFloat(hoursMatch[1]) * 60;
          else if (minutesMatch) customMinutes = parseFloat(minutesMatch[1]);
          if (customMinutes > 0 && minutesSinceSync >= customMinutes) isDue = true;
        }

        // Legacy support
        if (freq === '6h'  && minutesSinceSync >= 360)  isDue = true;
        if (freq === '12h' && minutesSinceSync >= 720)  isDue = true;
        if (freq === '24h' && minutesSinceSync >= 1440) isDue = true;

      }
    }

    if (!isDue) continue;

    // Fire-and-forget — the function handles its own timeout guard
    supabase.functions.invoke('integration-sync', {
      body: {
        integrationId: integration.id,
        provider: integration.provider,
        // Pass isResume=true so the function knows to load the cursor
        isResume: hasPendingCursor,
      }
    }).catch((err: any) =>
      console.error(`Failed to trigger sync for ${integration.provider}:`, err.message)
    );

    triggered++;
    console.log(
      `Triggered sync for ${integration.provider}` +
      ` (company: ${integration.company_id}` +
      `, freq: ${integration.sync_frequency}` +
      `, resume: ${hasPendingCursor})`
    );
  }

  return new Response(
    JSON.stringify({ success: true, triggered, total: integrations?.length || 0 }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
