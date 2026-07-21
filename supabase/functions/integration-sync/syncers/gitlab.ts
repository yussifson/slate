import { upsertKnowledge } from '../index.ts';

export async function syncGitLab(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  const updatedParam = lastSynced ? `&updated_after=${lastSynced.toISOString()}` : '';

  let page = 1;
  let hasMoreProjects = true;

  while (hasMoreProjects && imported < limit) {
    const projectsRes = await fetch(`https://gitlab.com/api/v4/projects?membership=true&per_page=100&page=${page}&order_by=last_activity_at`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!projectsRes.ok) throw new Error(`GitLab API error: ${projectsRes.status}`);
    const projects = await projectsRes.json();
    if (projects.length === 0) break;

    for (const project of projects) {
      if (imported >= limit) break;
      
      let issuesPage = 1;
      let hasMoreIssues = true;
      while (hasMoreIssues && imported < limit) {
        const issuesRes = await fetch(`https://gitlab.com/api/v4/projects/${project.id}/issues?per_page=100&page=${issuesPage}${updatedParam}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!issuesRes.ok) break;
        const issues = await issuesRes.json();
        if (issues.length === 0) {
          hasMoreIssues = false;
          break;
        }

        for (const issue of issues) {
          if (imported >= limit) break;
          const ok = await upsertKnowledge(supabase, {
            provider: 'gitlab',
            external_id: String(issue.id),
            content_type: 'issue',
            title: `[${project.name}] ${issue.title}`,
            content: issue.description?.substring(0, 3000) || '',
            url: issue.web_url,
            author: issue.author?.username || null,
            tags: [...(issue.labels || []), issue.state].filter(Boolean),
            metadata: { project: project.name, state: issue.state, milestone: issue.milestone?.title },
          }, integration);
          if (ok) imported++;
        }
        issuesPage++;
      }
    }
    page++;
  }

  return imported;
}
