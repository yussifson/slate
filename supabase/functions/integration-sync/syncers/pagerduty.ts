// PagerDuty Syncer Module
import { upsertKnowledge } from '../utils.ts';

export async function syncPagerDuty(integration: any, supabase: any, lastSynced: Date | null) {
  let imported = 0;
  const token = integration.access_token || integration.metadata?.api_key;
  
  if (!token) {
    throw new Error("PagerDuty API token missing.");
  }

  // Fetch Incidents
  const res = await fetch('https://api.pagerduty.com/incidents?statuses[]=triggered&statuses[]=acknowledged', {
    headers: { 
      Authorization: `Token token=${token}`,
      Accept: 'application/vnd.pagerduty+json;version=2'
    }
  });

  if (!res.ok) {
    throw new Error(`PagerDuty API error: ${res.status}`);
  }

  const data = await res.json();
  
  for (const incident of (data.incidents || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'pagerduty',
      external_id: incident.id,
      content_type: 'record',
      title: `Incident: ${incident.title}`,
      content: `Status: ${incident.status}\nUrgency: ${incident.urgency}\nSummary: ${incident.summary}`,
      url: incident.html_url,
      author: incident.assignments?.[0]?.assignee?.summary || null,
    }, integration);
    
    if (ok) imported++;
  }

  
  
  return imported;
}
