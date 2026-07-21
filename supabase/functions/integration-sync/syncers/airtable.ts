// Airtable Syncer Module
import { upsertKnowledge } from '../index.ts';

export async function syncAirtable(integration: any, supabase: any, lastSynced: Date | null) {
  let imported = 0;
  const token = integration.access_token || integration.metadata?.api_key;
  
  if (!token) throw new Error("Airtable API token missing.");

  // Airtable requires a Base ID to fetch records. We fetch bases list via Meta API.
  const res = await fetch(`https://api.airtable.com/v0/meta/bases`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error(`Airtable API error: ${res.status}`);

  const data = await res.json();
  const bases = data.bases || [];
  
  for (const base of bases) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'airtable',
      external_id: base.id,
      content_type: 'record',
      title: `Airtable Base: ${base.name}`,
      content: `ID: ${base.id}\nPermission: ${base.permissionLevel}`,
      url: `https://airtable.com/${base.id}`,
      author: null,
    }, integration);
    
    if (ok) imported++;
  }

  
  
  return imported;
}
