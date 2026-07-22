import { upsertKnowledge } from '../utils.ts';

export async function syncMSTeams(integration: any, supabase: any, lastSynced: Date | null) {
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
        console.warn('MS Teams token refresh failed', err.message);
      }
    }
  }

  let imported = 0;
  const limit = Number(integration.settings?.sync_limit || integration.settings?.import_limit || 100000);

  const teamsRes = await fetch('https://graph.microsoft.com/v1.0/me/joinedTeams', {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!teamsRes.ok) {
    const teamsErrBody = await teamsRes.json().catch(() => ({}));
    const teamsErrMsg = teamsErrBody?.error?.message || teamsErrBody?.error?.code || '';
    if (teamsRes.status === 403 || teamsRes.status === 401) {
      throw new Error(`Teams API error: ${teamsRes.status} — The Microsoft Teams integration requires specific scopes. Ensure Admin Consent is granted for Team.ReadBasic.All and ChannelMessage.Read.All. ${teamsErrMsg}`);
    }
    throw new Error(`Teams API error: ${teamsRes.status} — ${teamsErrMsg}`);
  }
  
  const teamsData = await teamsRes.json();

  const filterParam = lastSynced
    ? `?$filter=lastModifiedDateTime gt ${lastSynced.toISOString()}`
    : '';

  for (const team of (teamsData.value || [])) {
    if (imported >= limit) break;
    const chRes = await fetch(`https://graph.microsoft.com/v1.0/teams/${team.id}/channels`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!chRes.ok) continue;
    const chData = await chRes.json();

    for (const channel of (chData.value || [])) {
      if (imported >= limit) break;
      let nextLink = `https://graph.microsoft.com/v1.0/teams/${team.id}/channels/${channel.id}/messages${filterParam || '?$top=100'}`;
      
      while (nextLink && imported < limit) {
        const msgsRes = await fetch(nextLink, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!msgsRes.ok) break;
        const msgsData = await msgsRes.json();

        for (const msg of (msgsData.value || [])) {
          if (imported >= limit) break;
          if (msg.messageType !== 'message' || !msg.body?.content) continue;
          
          const textContent = msg.body.content.replace(/<[^>]+>/g, '').trim();
          if (!textContent) continue;

          const ok = await upsertKnowledge(supabase, {
            provider: 'ms_teams',
            external_id: msg.id,
            content_type: 'message',
            title: `Message in ${team.displayName} > ${channel.displayName}`,
            content: textContent.substring(0, 2000),
            url: msg.webUrl,
            author: msg.from?.user?.displayName || null,
            metadata: { team: team.displayName, channel: channel.displayName },
          }, integration);
          if (ok) imported++;
        }
        nextLink = msgsData['@odata.nextLink'] || '';
      }
    }
  }
  return imported;
}
