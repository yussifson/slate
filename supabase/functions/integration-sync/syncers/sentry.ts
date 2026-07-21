// Sentry Syncer Module
import { upsertKnowledge } from '../utils.ts';

export async function syncSentry(integration: any, supabase: any, lastSynced: Date | null) {
  let imported = 0;
  const token = integration.access_token || integration.metadata?.api_key;
  
  if (!token) {
    throw new Error("Sentry Auth token missing.");
  }

  // Fetch Projects to get list of issues
  const res = await fetch('https://sentry.io/api/0/projects/', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error(`Sentry API error: ${res.status}`);
  }

  const projects = await res.json();
  
  for (const project of (projects || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'sentry',
      external_id: project.id.toString(),
      content_type: 'record',
      title: `Sentry Project: ${project.name}`,
      content: `Slug: ${project.slug}\nPlatform: ${project.platform}`,
      url: `https://sentry.io/organizations/${project.organization?.slug}/projects/${project.slug}/`,
      author: null,
    }, integration);
    
    if (ok) imported++;
  }

  
  
  return imported;
}
