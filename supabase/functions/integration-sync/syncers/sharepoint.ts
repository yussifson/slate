import { upsertKnowledge } from '../utils.ts';

export async function syncSharePoint(integration: any, supabase: any, lastSynced: Date | null) {
  let token = integration.access_token;
  
  // Auto refresh oauth token
  const tokenExpiry = integration.token_expires_at ? new Date(integration.token_expires_at) : null;
  const needsRefresh = tokenExpiry && tokenExpiry < new Date(Date.now() + 5 * 60 * 1000);

  if (needsRefresh && integration.refresh_token) {
    const msClientId = Deno.env.get('MS_CLIENT_ID');
    const msClientSecret = Deno.env.get('MS_CLIENT_SECRET');
    if (msClientId && msClientSecret) {
      try {
        const refreshRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: msClientId,
            client_secret: msClientSecret,
            grant_type: 'refresh_token',
            refresh_token: integration.refresh_token
          })
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.access_token) {
            token = refreshData.access_token;
            await supabase.from('clipad_integrations').update({
              access_token: token,
              refresh_token: refreshData.refresh_token || integration.refresh_token,
              token_expires_at: new Date(Date.now() + (refreshData.expires_in || 3600) * 1000).toISOString()
            }).eq('id', integration.id);
          }
        }
      } catch (err: any) {
        console.warn('SharePoint token refresh failed', err.message);
      }
    }
  }

  let imported = 0;
  const limit = Number(integration.settings?.sync_limit || integration.settings?.import_limit || 100000);

  // Search all sites
  const sitesRes = await fetch('https://graph.microsoft.com/v1.0/sites?search=', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!sitesRes.ok) {
    const errorBody = await sitesRes.json().catch(() => ({}));
    const errMsg = errorBody?.error?.message || '';
    if (errMsg.includes('MSA accounts') || errMsg.includes('No authorization information present')) {
      throw new Error(`SharePoint API error: ${sitesRes.status} — The SharePoint integration requires a Microsoft 365 Business or Enterprise account. Personal Microsoft accounts (like @outlook.com) are not supported.`);
    }
    throw new Error(`SharePoint API error: ${sitesRes.status} — ${errMsg || 'Ensure Sites.Read.All and Files.Read.All scopes are granted.'}`);
  }
  
  const sitesData = await sitesRes.json();

  const filterParam = lastSynced
    ? `?$filter=lastModifiedDateTime gt ${lastSynced.toISOString()}`
    : '';

  for (const site of (sitesData.value || [])) {
    if (imported >= limit) break;
    const drivesRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${site.id}/drives`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!drivesRes.ok) continue;
    const drivesData = await drivesRes.json();

    for (const drive of (drivesData.value || [])) {
      if (imported >= limit) break;
      let nextLink = `https://graph.microsoft.com/v1.0/sites/${site.id}/drives/${drive.id}/root/children${filterParam || '?$top=100'}`;

      while (nextLink && imported < limit) {
        const filesRes = await fetch(nextLink, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!filesRes.ok) break;
        const filesData = await filesRes.json();

        for (const item of (filesData.value || [])) {
          if (imported >= limit) break;
          if (item.folder) continue; 
          
          const ok = await upsertKnowledge(supabase, {
            provider: 'sharepoint',
            external_id: item.id,
            content_type: 'file',
            title: item.name,
            content: `SharePoint File: ${item.name}\nSite: ${site.displayName}\nURL: ${item.webUrl}`,
            url: item.webUrl,
            author: item.createdBy?.user?.displayName || null,
            metadata: { site: site.displayName, mimeType: item.file?.mimeType },
          }, integration);
          if (ok) imported++;
        }
        nextLink = filesData['@odata.nextLink'] || '';
      }
    }
  }
  return imported;
}
