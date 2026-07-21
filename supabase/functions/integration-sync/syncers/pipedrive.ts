// Pipedrive Syncer Module
import { upsertKnowledge } from '../index.ts';

export async function syncPipedrive(integration: any, supabase: any, lastSynced: Date | null) {
  let imported = 0;
  const token = integration.access_token;
  
  if (!token) {
    throw new Error("Pipedrive API token missing.");
  }

  // Fetch Deals
  const res = await fetch(`https://api.pipedrive.com/v1/deals?status=open&start=0&limit=50&api_token=${token}`, {
    headers: { Accept: 'application/json' }
  });

  if (!res.ok) {
    throw new Error(`Pipedrive API error: ${res.status}`);
  }

  const data = await res.json();
  const deals = data.data || [];
  
  for (const deal of deals) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'pipedrive',
      external_id: deal.id.toString(),
      content_type: 'record',
      title: `Deal: ${deal.title}`,
      content: `Value: ${deal.value} ${deal.currency}\nStatus: ${deal.status}\nStage ID: ${deal.stage_id}`,
      url: `https://app.pipedrive.com/deal/${deal.id}`,
      author: deal.creator_user_id?.name || null,
    }, integration);
    
    if (ok) imported++;
  }

  if (imported === 0) {
    await upsertKnowledge(supabase, {
      provider: 'pipedrive',
      external_id: `pipedrive-${integration.id}-status`,
      content_type: 'record',
      title: 'Pipedrive Connected',
      content: 'Pipedrive integration active. No open deals found.',
      url: '',
      author: null,
    }, integration);
    imported++;
  }
  
  return imported;
}
