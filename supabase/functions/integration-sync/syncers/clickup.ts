import { upsertKnowledge } from '../utils.ts';

export async function syncClickUp(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = Number(integration.settings?.sync_limit || integration.settings?.import_limit || 100000);

  // ClickUp uses raw token for Authorization (no Bearer)
  const teamsRes = await fetch('https://api.clickup.com/api/v2/team', {
    headers: { Authorization: token }
  });
  if (!teamsRes.ok) {
    const errBody = await teamsRes.json().catch(() => ({}));
    throw new Error(`ClickUp API error: ${teamsRes.status} — ${errBody?.err || errBody?.ECODE || 'Invalid token or scopes'}`);
  }
  const teamsData = await teamsRes.json();

  const dateUpdatedParam = lastSynced
    ? `&date_updated_gt=${lastSynced.getTime()}`
    : '';

  for (const team of (teamsData.teams || [])) {
    if (imported >= limit) break;
    let page = 0;
    let hasMoreTasks = true;

    while (hasMoreTasks && imported < limit) {
      const tasksRes = await fetch(`https://api.clickup.com/api/v2/team/${team.id}/task?page=${page}&order_by=updated&subtasks=true&include_closed=true${dateUpdatedParam}`, {
        headers: { Authorization: token }
      });
      if (!tasksRes.ok) {
        console.warn(`Failed to fetch tasks for team ${team.id}: ${tasksRes.status}`);
        break;
      }
      const tasksData = await tasksRes.json();
      
      const tasks = tasksData.tasks || [];
      if (tasks.length === 0) {
        hasMoreTasks = false;
        break;
      }

      for (const task of tasks) {
        if (imported >= limit) break;
        const ok = await upsertKnowledge(supabase, {
          provider: 'clickup',
          external_id: task.id,
          content_type: 'task',
          title: task.name,
          content: task.description?.substring(0, 2000) || '',
          url: task.url,
          author: task.creator?.username || null,
          tags: [task.status?.status].filter(Boolean),
          metadata: { status: task.status?.status, priority: task.priority?.priority, teamName: team.name },
        }, integration);
        if (ok) imported++;
      }
      
      if (tasks.length < 100) hasMoreTasks = false;
      page++;
    }
  }
  return imported;
}
