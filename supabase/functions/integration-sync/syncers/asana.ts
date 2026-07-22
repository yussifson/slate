import { upsertKnowledge } from '../utils.ts';

export async function syncAsana(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = Number(integration.settings?.sync_limit || integration.settings?.import_limit || 100000);

  const modifiedSinceParam = lastSynced
    ? `&modified_since=${lastSynced.toISOString()}`
    : '';

  const wsRes = await fetch('https://app.asana.com/api/1.0/workspaces', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!wsRes.ok) throw new Error(`Asana API error: ${wsRes.status}`);
  const wsData = await wsRes.json();

  for (const ws of (wsData.data || [])) {
    if (imported >= limit) break;
    
    let nextUrl = `https://app.asana.com/api/1.0/tasks?workspace=${ws.gid}&assignee=me&opt_fields=gid,name,notes,completed,due_on,assignee.name,projects.name,permalink_url,modified_at&limit=100${modifiedSinceParam}`;

    while (nextUrl && imported < limit) {
      const tasksRes = await fetch(nextUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!tasksRes.ok) break;
      const tasksData = await tasksRes.json();

      for (const task of (tasksData.data || [])) {
        if (imported >= limit) break;
        const ok = await upsertKnowledge(supabase, {
          provider: 'asana',
          external_id: task.gid,
          content_type: 'task',
          title: task.name,
          content: task.notes?.substring(0, 2000) || '',
          url: task.permalink_url,
          author: task.assignee?.name || null,
          tags: [task.completed ? 'completed' : 'open'].concat((task.projects || []).map((p: any) => p.name)),
          metadata: { completed: task.completed, due_on: task.due_on, workspace: ws.name },
        }, integration);
        if (ok) imported++;
      }

      nextUrl = tasksData.next_page?.uri || '';
    }
  }
  return imported;
}
