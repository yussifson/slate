// Jenkins Syncer Module
import { upsertKnowledge } from '../index.ts';

export async function syncJenkins(integration: any, supabase: any, lastSynced: Date | null) {
  let imported = 0;
  // Jenkins requires URL and credentials
  const token = integration.access_token || integration.metadata?.api_key;
  const jenkinsUrl = integration.metadata?.url;
  
  if (!token || !jenkinsUrl) {
    throw new Error("Jenkins API token or URL missing.");
  }

  // Fetch Jobs
  const res = await fetch(`${jenkinsUrl.replace(/\/$/, '')}/api/json?tree=jobs[name,url,color]`, {
    headers: { 
      Authorization: `Basic ${btoa(token)}`
    }
  });

  if (!res.ok) {
    throw new Error(`Jenkins API error: ${res.status}`);
  }

  const data = await res.json();
  
  for (const job of (data.jobs || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'jenkins',
      external_id: job.name,
      content_type: 'record',
      title: `Jenkins Job: ${job.name}`,
      content: `Status (Color): ${job.color}\nURL: ${job.url}`,
      url: job.url,
      author: null,
    }, integration);
    
    if (ok) imported++;
  }

  
  
  return imported;
}
