import { upsertKnowledge } from '../utils.ts';

export async function syncTrello(integration: any, supabase: any, _lastSynced: Date | null) {
  const token = integration.access_token;
  const apiKey = integration.metadata?.api_key || Deno.env.get('TRELLO_API_KEY');
  if (!apiKey) throw new Error('Trello API key not configured.');
  let imported = 0;
  const limit = Number(integration.settings?.sync_limit || integration.settings?.import_limit || 100000);

  const boardsRes = await fetch(`https://api.trello.com/1/members/me/boards?key=${apiKey}&token=${token}&fields=id,name,url`, {
    headers: { 'Accept': 'application/json' }
  });
  if (!boardsRes.ok) throw new Error(`Trello API error: ${boardsRes.status}`);
  const boards = await boardsRes.json();

  for (const board of (boards || [])) {
    if (imported >= limit) break;
    const cardsRes = await fetch(`https://api.trello.com/1/boards/${board.id}/cards?key=${apiKey}&token=${token}&fields=id,name,desc,url,labels,due,idList`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!cardsRes.ok) continue;
    const cards = await cardsRes.json();

    for (const card of (cards || [])) {
      if (imported >= limit) break;
      const ok = await upsertKnowledge(supabase, {
        provider: 'trello',
        external_id: card.id,
        content_type: 'card',
        title: `[${board.name}] ${card.name}`,
        content: card.desc?.substring(0, 2000) || '',
        url: card.url,
        tags: (card.labels || []).map((l: any) => l.name).filter(Boolean),
        metadata: { board: board.name, due: card.due },
      }, integration);
      if (ok) imported++;
    }
  }
  return imported;
}
