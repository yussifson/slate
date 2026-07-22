import { upsertKnowledge } from '../utils.ts';

export async function syncLinear(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = Number(integration.settings?.sync_limit || integration.settings?.import_limit || 100000);

  const updatedAtFilter = lastSynced
    ? `, filter: { updatedAt: { gte: "${lastSynced.toISOString()}" } }`
    : '';

  let hasNextPage = true;
  let endCursor = '';

  while (hasNextPage && imported < limit) {
    const afterArg = endCursor ? `, after: "${endCursor}"` : '';
    const query = `{
      issues(first: 100, orderBy: updatedAt${updatedAtFilter}${afterArg}) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id title description state { name } assignee { name } team { name } url priority updatedAt
        }
      }
    }`;

    const res = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    if (!res.ok) throw new Error(`Linear API error: ${res.status}`);
    const data = await res.json();
    
    const issuesData = data.data?.issues;
    if (!issuesData) break;

    for (const issue of (issuesData.nodes || [])) {
      if (imported >= limit) break;
      const ok = await upsertKnowledge(supabase, {
        provider: 'linear',
        external_id: issue.id,
        content_type: 'issue',
        title: `[${issue.team?.name}] ${issue.title}`,
        content: issue.description?.substring(0, 3000) || '',
        url: issue.url,
        author: issue.assignee?.name || null,
        tags: [issue.state?.name].filter(Boolean),
        metadata: { state: issue.state?.name, team: issue.team?.name, priority: issue.priority },
      }, integration);
      if (ok) imported++;
    }
    
    hasNextPage = issuesData.pageInfo?.hasNextPage;
    endCursor = issuesData.pageInfo?.endCursor;
  }
  return imported;
}
