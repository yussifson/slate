// ServiceNow Syncer Module
import { upsertKnowledge } from '../index.ts';

export async function syncServiceNow(integration: any, supabase: any, lastSynced: Date | null) {
  let imported = 0;
  const token = integration.access_token || integration.metadata?.api_key;
  const snUrl = integration.metadata?.url;
  
  if (!token || !snUrl) {
    throw new Error("ServiceNow API token or instance URL missing.");
  }

  // Fetch Open Incidents
  const res = await fetch(`${snUrl.replace(/\/$/, '')}/api/now/table/incident?sysparm_query=stateNOT IN6,7,8&sysparm_limit=50`, {
    headers: { 
      Authorization: `Basic ${btoa(token)}`,
      Accept: 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`ServiceNow API error: ${res.status}`);
  }

  const data = await res.json();
  const incidents = data.result || [];
  
  for (const inc of incidents) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'servicenow',
      external_id: inc.sys_id,
      content_type: 'record',
      title: `Incident: ${inc.number} - ${inc.short_description}`,
      content: `State: ${inc.state}\nPriority: ${inc.priority}\nAssigned To: ${inc.assigned_to?.value || 'Unassigned'}\nDescription: ${inc.description || inc.short_description}`,
      url: `${snUrl}/nav_to.do?uri=incident.do?sys_id=${inc.sys_id}`,
      author: inc.caller_id?.value || null,
    }, integration);
    
    if (ok) imported++;
  }

  
  
  return imported;
}
