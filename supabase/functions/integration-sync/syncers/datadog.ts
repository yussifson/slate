// Datadog Syncer Module
import { upsertKnowledge } from '../utils.ts';

export async function syncDatadog(integration: any, supabase: any, lastSynced: Date | null) {
  let imported = 0;
  const token = integration.access_token || integration.metadata?.api_key;
  const appKey = integration.metadata?.app_key; // Datadog often requires APP key too
  
  if (!token) {
    throw new Error("Datadog API key missing.");
  }

  // Fetch Monitors (Alerts)
  const headers: any = { 'DD-API-KEY': token };
  if (appKey) headers['DD-APPLICATION-KEY'] = appKey;

  const res = await fetch('https://api.datadoghq.com/api/v1/monitor', { headers });

  if (!res.ok) {
    throw new Error(`Datadog API error: ${res.status}`);
  }

  const data = await res.json();
  
  for (const monitor of (data || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'datadog',
      external_id: monitor.id.toString(),
      content_type: 'record',
      title: `Monitor: ${monitor.name}`,
      content: `Type: ${monitor.type}\nQuery: ${monitor.query}\nMessage: ${monitor.message}`,
      url: `https://app.datadoghq.com/monitors/${monitor.id}`,
      author: monitor.creator?.name || null,
    }, integration);
    
    if (ok) imported++;
  }

  
  
  return imported;
}
