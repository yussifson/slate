import { upsertKnowledge } from '../utils.ts';

export async function syncZoom(integration: any, supabase: any, lastSynced: Date | null) {
  let token = integration.access_token;
  const tokenExpiry = integration.token_expires_at ? new Date(integration.token_expires_at) : null;
  const needsRefresh = tokenExpiry && tokenExpiry < new Date(Date.now() + 5 * 60 * 1000);

  if (needsRefresh && integration.refresh_token) {
    try {
      const zoomClientId = Deno.env.get('ZOOM_CLIENT_ID');
      const zoomClientSecret = Deno.env.get('ZOOM_CLIENT_SECRET');
      if (zoomClientId && zoomClientSecret) {
        const basicAuth = btoa(`${zoomClientId}:${zoomClientSecret}`);
        const refreshRes = await fetch('https://zoom.us/oauth/token', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
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
      }
    } catch (refreshErr: any) {
      console.warn('Zoom token refresh failed:', refreshErr?.message);
    }
  }

  let imported = 0;
  const limit = Number(integration.settings?.sync_limit || integration.settings?.import_limit || 100000);

  // Zoom API requires both `from` and `to` to be specified and within a 1-month range.
  // We'll restrict to the last 30 days to avoid 400 Bad Request.
  const toDate = new Date();
  let fromDate = new Date(toDate.getTime() - 29 * 24 * 60 * 60 * 1000); // strictly under 1 month
  
  if (lastSynced && lastSynced > fromDate) {
    fromDate = lastSynced;
  }

  const fromStr = fromDate.toISOString().split('T')[0];
  const toStr = toDate.toISOString().split('T')[0];
  
  let nextPageToken = '';

  do {
    const tokenParam = nextPageToken ? `&next_page_token=${nextPageToken}` : '';
    // Zoom API v2/users/me/recordings requires from and to parameters
    const res = await fetch(`https://api.zoom.us/v2/users/me/recordings?page_size=100&from=${fromStr}&to=${toStr}${tokenParam}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(`Zoom API error: ${res.status} — ${errBody?.message || errBody?.code || 'Ensure recording:read scope is granted. Reconnect Zoom to refresh permissions.'}`);
    }
    
    const data = await res.json();

    for (const meeting of (data.meetings || [])) {
      if (imported >= limit) break;
      const transcript = meeting.recording_files?.find((f: any) => f.file_type === 'TRANSCRIPT');
      const ok = await upsertKnowledge(supabase, {
        provider: 'zoom',
        external_id: meeting.uuid,
        content_type: 'meeting',
        title: meeting.topic || 'Zoom Meeting',
        content: `Meeting recorded on ${meeting.start_time}.\nTranscript ID: ${transcript?.id || 'none'}\nZoom URL: ${meeting.share_url}`,
        url: meeting.share_url,
        metadata: { duration: meeting.duration, meeting_id: meeting.id },
      }, integration);
      if (ok) imported++;
    }
    
    nextPageToken = data.next_page_token || '';
  } while (nextPageToken && imported < limit);

  return imported;
}
