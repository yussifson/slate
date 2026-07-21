// Canva Syncer Module
import { upsertKnowledge } from '../index.ts';

export async function syncCanva(integration: any, supabase: any, lastSynced: Date | null) {
  let imported = 0;
  const token = integration.access_token;
  
  if (!token) throw new Error("Canva API token missing.");

  // Fetch designs
  const res = await fetch(`https://api.canva.com/rest/v1/designs`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error(`Canva API error: ${res.status}`);

  const data = await res.json();
  const designs = data.designs || [];
  
  for (const design of designs) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'canva',
      external_id: design.id,
      content_type: 'record',
      title: `Design: ${design.title}`,
      content: `URL: ${design.url}`,
      url: design.url,
      author: null,
    }, integration);
    
    if (ok) imported++;
  }

  if (imported === 0) {
    await upsertKnowledge(supabase, {
      provider: 'canva',
      external_id: `canva-${integration.id}-status`,
      content_type: 'record',
      title: 'Canva Connected',
      content: 'Canva integration active. No designs found.',
      url: '',
      author: null,
    }, integration);
    imported++;
  }
  
  return imported;
}
