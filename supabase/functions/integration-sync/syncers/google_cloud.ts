import { upsertKnowledge } from '../utils.ts';

export async function syncGoogleCloud(integration: any, supabase: any, lastSynced: Date | null) {
  let imported = 0;

  let bearerToken = integration.access_token;
  const rawToken = integration.access_token || '';
  const isServiceAccountJson = rawToken.trim().startsWith('{');

  if (isServiceAccountJson) {
    let saJson: any;
    try {
      saJson = JSON.parse(rawToken);
    } catch {
      throw new Error('Google Cloud API error: 400 — Invalid service account JSON key. Please provide a valid JSON key from Google Cloud Console → IAM & Admin → Service Accounts → Keys.');
    }

    if (!saJson.project_id) {
      throw new Error('Google Cloud API error: 400 — Service account JSON is missing project_id. Please use a complete JSON key file downloaded from Google Cloud Console.');
    }

    const ok = await upsertKnowledge(supabase, {
      provider: 'google_cloud',
      external_id: saJson.project_id,
      content_type: 'record',
      title: `GCP Project: ${saJson.project_id}`,
      content: `Connected via service account: ${saJson.client_email || 'unknown'}. Project: ${saJson.project_id}.`,
      url: `https://console.cloud.google.com/home/dashboard?project=${saJson.project_id}`,
      author: saJson.client_email || null,
      metadata: { project_id: saJson.project_id, client_email: saJson.client_email, auth_type: 'service_account' },
    }, integration);
    if (ok) imported++;

    return imported;
  }

  // Auto refresh oauth token
  const tokenExpiry = integration.token_expires_at ? new Date(integration.token_expires_at) : null;
  const needsRefresh = tokenExpiry && tokenExpiry < new Date(Date.now() + 5 * 60 * 1000);

  if (needsRefresh && integration.refresh_token) {
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    if (googleClientId && googleClientSecret) {
      try {
        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: googleClientId,
            client_secret: googleClientSecret,
            grant_type: 'refresh_token',
            refresh_token: integration.refresh_token
          })
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.access_token) {
            bearerToken = refreshData.access_token;
            await supabase.from('clipad_integrations').update({
              access_token: bearerToken,
              token_expires_at: new Date(Date.now() + (refreshData.expires_in || 3600) * 1000).toISOString()
            }).eq('id', integration.id);
          }
        }
      } catch (err: any) {
        console.warn('Google Cloud token refresh failed', err.message);
      }
    }
  }

  const res = await fetch(`https://cloudresourcemanager.googleapis.com/v3/projects?pageSize=50`, {
    headers: { Authorization: `Bearer ${bearerToken}` }
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const errorMsg = errorBody?.error?.message || '';
    throw new Error(`Google Cloud API error: ${res.status} — ${errorMsg || 'Please ensure you granted project read scopes during connection.'}`);
  }
  
  const data = await res.json();
  const limit = Number(integration.settings?.sync_limit || integration.settings?.import_limit || 10000);

  for (const project of (data.projects || [])) {
    if (imported >= limit) break;
    const ok = await upsertKnowledge(supabase, {
      provider: 'google_cloud',
      external_id: project.projectId,
      content_type: 'record',
      title: project.displayName || project.projectId,
      content: `GCP Project: ${project.projectId}\nState: ${project.state}`,
      url: `https://console.cloud.google.com/home/dashboard?project=${project.projectId}`,
      metadata: { project_id: project.projectId, state: project.state },
    }, integration);
    if (ok) imported++;
  }

  return imported;
}
