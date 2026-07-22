import { upsertKnowledge } from '../utils.ts';

export async function syncMonday(integration: any, supabase: any, _lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = Number(integration.settings?.sync_limit || integration.settings?.import_limit || 100000);

  const query = `{ boards(limit: 50) { id name items_page(limit: 100) { items { id name state column_values { text } } } } }`;
  const res = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!res.ok) throw new Error(`Monday API error: ${res.status}`);
  const data = await res.json();

  for (const board of (data.data?.boards || [])) {
    if (imported >= limit) break;
    for (const item of (board.items_page?.items || [])) {
      if (imported >= limit) break;
      const details = (item.column_values || []).map((c: any) => c.text).filter(Boolean).join(' | ');
      const ok = await upsertKnowledge(supabase, {
        provider: 'monday',
        external_id: item.id,
        content_type: 'task',
        title: `[${board.name}] ${item.name}`,
        content: details.substring(0, 2000),
        tags: [item.state].filter(Boolean),
        metadata: { board: board.name, state: item.state },
      }, integration);
      if (ok) imported++;
    }
  }
  return imported;
}
