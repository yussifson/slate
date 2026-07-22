import { upsertKnowledge } from '../utils.ts';

export async function syncGitHub(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token || integration.metadata?.api_key || integration.metadata?.personal_access_token;
  let imported = 0;
  const limit = Number(integration.settings?.sync_limit || integration.settings?.import_limit || 100000);

  if (!token) throw new Error("GitHub token missing. Please reconnect or provide a Personal Access Token.");

  const repoRes = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated&type=all', {
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

  // 1. Sync all Repositories as Knowledge Items first
  for (const repo of repos) {
    if (imported >= limit) break;
    const okRepo = await upsertKnowledge(supabase, {
      provider: 'github',
      external_id: `repo_${repo.id}`,
      content_type: 'repository',
      title: repo.full_name,
      content: [repo.description, repo.language ? `Language: ${repo.language}` : '', `Stars: ${repo.stargazers_count}`, `Forks: ${repo.forks_count}`].filter(Boolean).join('\n'),
      url: repo.html_url,
      author: repo.owner?.login || null,
      tags: [repo.language, repo.visibility, 'repository'].filter(Boolean),
      metadata: { full_name: repo.full_name, stars: repo.stargazers_count, default_branch: repo.default_branch },
    }, integration);
    if (okRepo) imported++;
  }

  // 2. Sync Issues and Pull Requests per Repository
  const sinceParam = lastSynced ? `&since=${lastSynced.toISOString()}` : '';

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
          content: issue.body?.substring(0, 5000) || '',
          url: issue.html_url,
          author: issue.user?.login || null,
          tags: [...(issue.labels?.map((l: any) => l.name) || []), issue.state, isPR ? 'pull_request' : 'issue'],
          metadata: { repository: repo.full_name, state: issue.state, comments: issue.comments },
        }, integration);
        if (ok) imported++;
      }
      page++;
      if (issues.length < 100) hasMore = false;
    }
  }

  return imported;
}
