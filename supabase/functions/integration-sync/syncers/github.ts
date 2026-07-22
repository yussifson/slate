import { upsertKnowledge } from '../utils.ts';

export async function syncGitHub(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token || integration.metadata?.api_key || integration.metadata?.personal_access_token;
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  if (!token) throw new Error("GitHub token missing. Please reconnect or provide a Personal Access Token.");

  const sinceParam = lastSynced ? `&since=${lastSynced.toISOString()}` : '';

  const repoRes = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'CliPad-Integration' }
  });
  if (!repoRes.ok) {
    const errBody = await repoRes.json().catch(() => ({}));
    if (repoRes.status === 401) {
      throw new Error(`GitHub API error: 401 — Authentication token is invalid or expired. Please reconnect GitHub in the Integrations Hub to issue a fresh access token.`);
    }
    throw new Error(`GitHub API error: ${repoRes.status} — ${errBody?.message || 'Failed to fetch repositories'}`);
  }
  const repos = await repoRes.json();

  for (const repo of repos) {
    if (imported >= limit) break;
    let page = 1;
    let hasMore = true;

    while (hasMore && imported < limit) {
      const issuesRes = await fetch(`https://api.github.com/repos/${repo.full_name}/issues?per_page=100&page=${page}&state=all${sinceParam}`, {
        headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'CliPad-Integration' }
      });
      if (!issuesRes.ok) break;
      const issues = await issuesRes.json();
      
      if (issues.length === 0) {
        hasMore = false;
        break;
      }

      for (const issue of issues) {
        if (imported >= limit) break;
        const isPR = !!issue.pull_request;
        const ok = await upsertKnowledge(supabase, {
          provider: 'github',
          external_id: String(issue.id),
          content_type: isPR ? 'pull_request' : 'issue',
          title: `[${repo.name}] ${issue.title}`,
          content: issue.body?.substring(0, 3000) || '',
          url: issue.html_url,
          author: issue.user?.login || null,
          tags: [...(issue.labels?.map((l: any) => l.name) || []), issue.state],
          metadata: { repository: repo.full_name, state: issue.state, comments: issue.comments },
        }, integration);
        if (ok) imported++;
      }
      page++;
    }
  }

  return imported;
}
