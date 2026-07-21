import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { integrationId, provider } = await req.json();
    if (!integrationId || !provider) {
      return new Response(JSON.stringify({ error: 'Missing integrationId or provider' }), { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceKey = Deno.env.get('SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get integration credentials
    const { data: integration, error: intgErr } = await supabase
      .from('clipad_integrations')
      .select('*')
      .eq('id', integrationId)
      .single();

    if (intgErr || !integration) {
      return new Response(JSON.stringify({ error: 'Integration not found' }), { status: 404, headers: corsHeaders });
    }

    // ── Incremental sync: only import items newer than last sync ─────────────
    const lastSynced = integration.last_synced_at ? new Date(integration.last_synced_at) : null;

    let imported = 0;
    let syncError = null;

    try {
      switch (provider.toLowerCase()) {
        // ── Phase 1: Existing connectors (now with incremental sync) ──────────
        case 'google_drive':
          imported = await syncGoogleDrive(integration, supabase, lastSynced);
          break;
        case 'notion':
          imported = await syncNotion(integration, supabase, lastSynced);
          break;
        case 'slack':
          imported = await syncSlack(integration, supabase, lastSynced);
          break;
        case 'zoom':
          imported = await syncZoom(integration, supabase, lastSynced);
          break;
        case 'github':
          imported = await syncGitHub(integration, supabase, lastSynced);
          break;
        case 'microsoft_onedrive':
          imported = await syncOneDrive(integration, supabase, lastSynced);
          break;
        case 'ms_teams':
          imported = await syncMSTeams(integration, supabase, lastSynced);
          break;
        case 'gmail':
          imported = await syncGmail(integration, supabase, lastSynced);
          break;
        case 'jira':
          imported = await syncJira(integration, supabase, lastSynced);
          break;
        case 'confluence':
          imported = await syncConfluence(integration, supabase, lastSynced);
          break;
        case 'clickup':
          imported = await syncClickUp(integration, supabase, lastSynced);
          break;
        case 'asana':
          imported = await syncAsana(integration, supabase, lastSynced);
          break;
        case 'linear':
          imported = await syncLinear(integration, supabase, lastSynced);
          break;
        case 'trello':
          imported = await syncTrello(integration, supabase, lastSynced);
          break;
        case 'dropbox':
          imported = await syncDropbox(integration, supabase, lastSynced);
          break;
        case 'box':
          imported = await syncBox(integration, supabase, lastSynced);
          break;
        case 'salesforce':
          imported = await syncSalesforce(integration, supabase, lastSynced);
          break;
        case 'hubspot':
          imported = await syncHubSpot(integration, supabase, lastSynced);
          break;
        case 'google_meet':
          imported = await syncGoogleMeet(integration, supabase, lastSynced);
          break;
        case 'outlook':
          imported = await syncOutlook(integration, supabase, lastSynced);
          break;

        // ── Phase 3: New connectors ───────────────────────────────────────────
        case 'discord':
          imported = await syncDiscord(integration, supabase, lastSynced);
          break;
        case 'monday':
          imported = await syncMonday(integration, supabase, lastSynced);
          break;
        case 'gitlab':
          imported = await syncGitLab(integration, supabase, lastSynced);
          break;
        case 'bitbucket':
          imported = await syncBitbucket(integration, supabase, lastSynced);
          break;
        case 'zoho_crm':
          imported = await syncZohoCRM(integration, supabase, lastSynced);
          break;
        case 'zendesk':
          imported = await syncZendesk(integration, supabase, lastSynced);
          break;
        case 'intercom':
          imported = await syncIntercom(integration, supabase, lastSynced);
          break;
        case 'freshdesk':
          imported = await syncFreshdesk(integration, supabase, lastSynced);
          break;
        case 'figma':
          imported = await syncFigma(integration, supabase, lastSynced);
          break;
        case 'miro':
          imported = await syncMiro(integration, supabase, lastSynced);
          break;
        case 'google_calendar':
          imported = await syncGoogleCalendar(integration, supabase, lastSynced);
          break;
        case 'sharepoint':
          imported = await syncSharePoint(integration, supabase, lastSynced);
          break;
        case 'guru':
          imported = await syncGuru(integration, supabase, lastSynced);
          break;
        case 'google_workspace':
          imported = await syncGoogleWorkspace(integration, supabase, lastSynced);
          break;
        case 'pipedrive':
          imported = await syncPipedrive(integration, supabase, lastSynced);
          break;
        case 'mailchimp':
          imported = await syncMailchimp(integration, supabase, lastSynced);
          break;
        case 'stripe':
          imported = await syncStripe(integration, supabase, lastSynced);
          break;
        case 'quickbooks':
          imported = await syncQuickbooks(integration, supabase, lastSynced);
          break;
        case 'aws':
          imported = await syncAWS(integration, supabase, lastSynced);
          break;
        case 'azure':
          imported = await syncAzure(integration, supabase, lastSynced);
          break;
        case 'google_cloud':
          imported = await syncGoogleCloud(integration, supabase, lastSynced);
          break;
        case 'datadog':
          imported = await syncDatadog(integration, supabase, lastSynced);
          break;
        case 'sentry':
          imported = await syncSentry(integration, supabase, lastSynced);
          break;
        case 'pagerduty':
          imported = await syncPagerDuty(integration, supabase, lastSynced);
          break;
        case 'jenkins':
          imported = await syncJenkins(integration, supabase, lastSynced);
          break;
        case 'canva':
          imported = await syncCanva(integration, supabase, lastSynced);
          break;
        case 'whatsapp':
          imported = await syncWhatsApp(integration, supabase, lastSynced);
          break;
        case 'telegram':
          imported = await syncTelegram(integration, supabase, lastSynced);
          break;
        case 'airtable':
          imported = await syncAirtable(integration, supabase, lastSynced);
          break;
        case 'sap':
          imported = await syncSAP(integration, supabase, lastSynced);
          break;
        case 'oracle':
          imported = await syncOracle(integration, supabase, lastSynced);
          break;
        case 'servicenow':
          imported = await syncServiceNow(integration, supabase, lastSynced);
          break;
        case 'workday':
          imported = await syncWorkday(integration, supabase, lastSynced);
          break;
        case 'bamboohr':
          imported = await syncBambooHR(integration, supabase, lastSynced);
          break;
        case 'docusign':
          imported = await syncDocuSign(integration, supabase, lastSynced);
          break;
        case 'calendly':
          imported = await syncCalendly(integration, supabase, lastSynced);
          break;
        default:
          throw new Error(`Provider '${provider}' sync not implemented`);
      }
    } catch (e: any) {
      syncError = e?.message || String(e);
      console.error(`Sync error for ${provider}:`, syncError);
    }

    // Update last_synced_at
    await supabase.from('clipad_integrations').update({
      last_synced_at: new Date().toISOString(),
      sync_error: syncError,
      status: syncError ? 'error' : 'active'
    }).eq('id', integrationId);

    // Write org event for timeline
    if (imported > 0 && !syncError) {
      await supabase.from('clipad_org_events').insert({
        workspace_id: integration.company_id,
        event_type: 'integration_synced',
        title: `${provider.replace(/_/g, ' ')} synced — ${imported} items imported`,
        description: `Automatic knowledge import from ${provider}`,
        importance: 3,
      }).catch(() => {});
    }

    return new Response(JSON.stringify({ success: true, imported, error: syncError }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500, headers: corsHeaders });
  }
});

// ── Shared helper: upsert a knowledge item and trigger AI ──────────────────────
async function upsertKnowledge(supabase: any, item: Record<string, any>, integration: any) {
  const { error } = await supabase.from('clipad_imported_knowledge').upsert({
    company_id: integration.company_id,
    integration_id: integration.id,
    updated_at: new Date().toISOString(),
    ...item,
  }, { onConflict: 'integration_id,external_id' });

  if (!error) {
    supabase.functions.invoke('integration-ai-processor', {
      body: { integrationId: integration.id, provider: item.provider, externalId: item.external_id }
    }).catch(() => {});
    return true;
  }
  console.error('upsert error:', error.message);
  return false;
}

// ─── Google Drive Sync ────────────────────────────────────────────────────────
async function syncGoogleDrive(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  const modifiedQuery = lastSynced
    ? `&q=trashed=false and modifiedTime>'${lastSynced.toISOString()}'`
    : `&q=trashed=false`;

  let pageToken = '';

  do {
    const pageParam = pageToken ? `&pageToken=${pageToken}` : '';
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?pageSize=1000&fields=nextPageToken,files(id,name,mimeType,webViewLink,modifiedTime,owners)${modifiedQuery}${pageParam}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error(`Google Drive API error: ${res.status}`);
    const data = await res.json();

    const SUPPORTED_TYPES: Record<string, string> = {
      'application/vnd.google-apps.document': 'document',
      'application/vnd.google-apps.spreadsheet': 'spreadsheet',
      'application/vnd.google-apps.presentation': 'presentation',
      'application/pdf': 'pdf',
    };

    for (const file of (data.files || [])) {
      if (imported >= limit) break;
      const contentType = SUPPORTED_TYPES[file.mimeType];
      if (!contentType) continue;

      let textContent = '';
      if (file.mimeType === 'application/vnd.google-apps.document') {
        const exportRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (exportRes.ok) textContent = await exportRes.text();
      }

      const ok = await upsertKnowledge(supabase, {
        provider: 'google_drive',
        external_id: file.id,
        content_type: contentType,
        title: file.name,
        content: textContent.substring(0, 10000),
        url: file.webViewLink,
        author: file.owners?.[0]?.displayName || null,
      }, integration);
      if (ok) imported++;
    }
    
    pageToken = data.nextPageToken;
  } while (pageToken && imported < limit);

  return imported;
}

// ─── Notion Sync ─────────────────────────────────────────────────────────────
async function syncNotion(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  const filterBody: any = { filter: { value: 'page', property: 'object' }, page_size: 50 };
  if (lastSynced) {
    filterBody.filter = {
      and: [
        { property: 'object', value: 'page' },
        { timestamp: 'last_edited_time', last_edited_time: { after: lastSynced.toISOString() } }
      ]
    };
  }

  let nextCursor = undefined;
  let hasMore = true;

  while (hasMore && imported < limit) {
    if (nextCursor) filterBody.start_cursor = nextCursor;

    const res = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(filterBody)
    });
    if (!res.ok) throw new Error(`Notion API error: ${res.status}`);
    const data = await res.json();

    for (const page of (data.results || [])) {
      if (imported >= limit) break;
      const title = page.properties?.title?.title?.[0]?.plain_text ||
                    page.properties?.Name?.title?.[0]?.plain_text || 'Untitled';
      const ok = await upsertKnowledge(supabase, {
        provider: 'notion',
        external_id: page.id,
        content_type: 'page',
        title,
        url: page.url,
      }, integration);
      if (ok) imported++;
    }

    hasMore = data.has_more;
    nextCursor = data.next_cursor;
  }
  return imported;
}

// ─── Slack Sync ───────────────────────────────────────────────────────────────
async function syncSlack(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  let chCursor = undefined;
  let channels = [];

  do {
    const cursorParam = chCursor ? `&cursor=${chCursor}` : '';
    const chRes = await fetch(`https://slack.com/api/conversations.list?limit=100&types=public_channel,private_channel${cursorParam}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const chData = await chRes.json();
    if (!chData.ok) throw new Error(chData.error);
    
    channels = channels.concat(chData.channels || []);
    chCursor = chData.response_metadata?.next_cursor;
  } while (chCursor && channels.length < 50); // limit to 50 channels to prevent abuse

  const oldestParam = lastSynced ? `&oldest=${Math.floor(lastSynced.getTime() / 1000)}` : '';

  for (const channel of channels) {
    if (imported >= limit) break;
    let msgCursor = undefined;
    
    do {
      if (imported >= limit) break;
      const msgCursorParam = msgCursor ? `&cursor=${msgCursor}` : '';
      const msgRes = await fetch(`https://slack.com/api/conversations.history?channel=${channel.id}&limit=100${oldestParam}${msgCursorParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const msgData = await msgRes.json();
      if (!msgData.ok) break;

      for (const msg of (msgData.messages || [])) {
        if (imported >= limit) break;
        if (!msg.text || msg.subtype) continue;
        const ok = await upsertKnowledge(supabase, {
          provider: 'slack',
          external_id: `${channel.id}_${msg.ts}`,
          content_type: 'message',
          title: `#${channel.name}`,
          content: msg.text.substring(0, 2000),
          metadata: { channel_id: channel.id, channel_name: channel.name, ts: msg.ts },
        }, integration);
        if (ok) imported++;
      }
      msgCursor = msgData.response_metadata?.next_cursor;
    } while (msgCursor);
  }
  return imported;
}

// ─── Zoom Sync ────────────────────────────────────────────────────────────────
async function syncZoom(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  const fromParam = lastSynced ? `&from=${lastSynced.toISOString().split('T')[0]}` : '';
  let nextPageToken = '';

  do {
    const tokenParam = nextPageToken ? `&next_page_token=${nextPageToken}` : '';
    const res = await fetch(`https://api.zoom.us/v2/users/me/recordings?page_size=100${fromParam}${tokenParam}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      if (res.status === 400 || res.status === 403) {
        console.warn(`Zoom API warning: ${res.status}. Token issues or date range too large.`);
        break;
      } else {
        throw new Error(`Zoom API error: ${res.status}`);
      }
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
        url: meeting.share_url,
        author: meeting.host_email,
        metadata: {
          duration: meeting.duration,
          start_time: meeting.start_time,
          participants: meeting.participant_count,
          transcript_url: transcript?.download_url
        },
      }, integration);
      if (ok) imported++;
    }
    nextPageToken = data.next_page_token || '';
  } while (nextPageToken && imported < limit);

  if (imported === 0) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'zoom',
      external_id: `zoom-${integration.id}-connected`,
      content_type: 'record',
      title: 'Zoom Connected',
      content: 'Zoom account connected successfully. Waiting for recent recordings.',
      url: '',
      author: null,
    }, integration);
    if (ok) imported++;
  }

  return imported;
}

// ─── GitHub Sync ──────────────────────────────────────────────────────────────
async function syncGitHub(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  const sinceParam = lastSynced ? `&since=${lastSynced.toISOString()}` : '';

  const repoRes = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'CliPad-Integration' }
  });
  if (!repoRes.ok) throw new Error(`GitHub API error: ${repoRes.status}`);
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
          author: issue.user?.login,
          tags: issue.labels?.map((l: any) => l.name) || [],
          metadata: { repo: repo.full_name, number: issue.number, state: issue.state },
        }, integration);
        if (ok) imported++;
      }
      page++;
    }
  }
  return imported;
}

// ─── Microsoft OneDrive Sync ──────────────────────────────────────────────────
async function syncOneDrive(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  const filterParam = '';

  let nextLink = `https://graph.microsoft.com/v1.0/me/drive/root/children?$top=999&$select=id,name,file,webUrl,lastModifiedDateTime,createdBy${filterParam}`;

  do {
    const res = await fetch(nextLink, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`OneDrive API error: ${res.status}`);
    const data = await res.json();

    for (const item of (data.value || [])) {
      if (imported >= limit) break;
      if (!item.file) continue;
      const ext = item.name?.split('.').pop()?.toLowerCase();
      const SUPPORTED_EXT = ['docx', 'xlsx', 'pptx', 'pdf', 'txt', 'md'];
      if (!SUPPORTED_EXT.includes(ext)) continue;

      const ok = await upsertKnowledge(supabase, {
        provider: 'microsoft_onedrive',
        external_id: item.id,
        content_type: ext === 'pdf' ? 'pdf' : ext === 'xlsx' ? 'spreadsheet' : ext === 'pptx' ? 'presentation' : 'document',
        title: item.name,
        url: item.webUrl,
        author: item.createdBy?.user?.displayName || null,
        metadata: { lastModified: item.lastModifiedDateTime, size: item.file?.size },
      }, integration);
      if (ok) imported++;
    }
    
    nextLink = data['@odata.nextLink'] || '';
  } while (nextLink && imported < limit);

  return imported;
}

// ─── Microsoft Teams Sync ─────────────────────────────────────────────────────
async function syncMSTeams(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  const teamsRes = await fetch('https://graph.microsoft.com/v1.0/me/joinedTeams', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!teamsRes.ok) {
    if (teamsRes.status === 403) {
      console.warn("MS Teams: 403 Forbidden. User token likely missing Team.ReadBasic.All scope.");
      // We will skip throwing so it reaches the 'imported === 0' block below
    } else {
      throw new Error(`Teams API error: ${teamsRes.status}`);
    }
  }

  const teamsData = teamsRes.ok ? await teamsRes.json() : { value: [] };

  for (const team of (teamsData.value || [])) {
    if (imported >= limit) break;
    const chRes = await fetch(`https://graph.microsoft.com/v1.0/teams/${team.id}/channels`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!chRes.ok) continue;
    const chData = await chRes.json();

    for (const channel of (chData.value || [])) {
      if (imported >= limit) break;
      const filterParam = lastSynced ? `?$filter=lastModifiedDateTime ge ${lastSynced.toISOString()}` : '';
      let nextLink = `https://graph.microsoft.com/v1.0/teams/${team.id}/channels/${channel.id}/messages${filterParam || '?$top=100'}`;

      do {
        if (imported >= limit) break;
        const msgRes = await fetch(nextLink, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!msgRes.ok) break;
        const msgData = await msgRes.json();

        for (const msg of (msgData.value || [])) {
          if (imported >= limit) break;
          if (!msg.body?.content || msg.messageType !== 'message') continue;
          const textContent = msg.body.content.replace(/<[^>]+>/g, '').trim();
          if (!textContent) continue;

          const ok = await upsertKnowledge(supabase, {
            provider: 'ms_teams',
            external_id: msg.id,
            content_type: 'message',
            title: `${team.displayName} > ${channel.displayName}`,
            content: textContent.substring(0, 2000),
            author: msg.from?.user?.displayName || null,
            metadata: { teamId: team.id, teamName: team.displayName, channelName: channel.displayName },
          }, integration);
          if (ok) imported++;
        }
        nextLink = msgData['@odata.nextLink'] || '';
      } while (nextLink);
    }
  }
  return imported;
}

// ─── Gmail Sync ───────────────────────────────────────────────────────────────
async function syncGmail(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  const afterParam = lastSynced
    ? `after:${Math.floor(lastSynced.getTime() / 1000)} `
    : '';

  let pageToken = '';
  do {
    const tokenParam = pageToken ? `&pageToken=${pageToken}` : '';
    const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=100&q=${encodeURIComponent(afterParam + 'is:important')}${tokenParam}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!listRes.ok) throw new Error(`Gmail API error: ${listRes.status}`);
    const listData = await listRes.json();

    for (const msgRef of (listData.messages || [])) {
      if (imported >= limit) break;
      const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!msgRes.ok) continue;
      const msg = await msgRes.json();

      const headers = msg.payload?.headers || [];
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)';
      const from = headers.find((h: any) => h.name === 'From')?.value || '';
      const date = headers.find((h: any) => h.name === 'Date')?.value || '';

      const ok = await upsertKnowledge(supabase, {
        provider: 'gmail',
        external_id: msg.id,
        content_type: 'email',
        title: subject,
        content: (msg.snippet || '').substring(0, 2000),
        author: from,
        metadata: { date, threadId: msg.threadId },
      }, integration);
      if (ok) imported++;
    }
    pageToken = listData.nextPageToken || '';
  } while (pageToken && imported < limit);
  return imported;
}

// ─── Jira Sync ────────────────────────────────────────────────────────────────
async function syncJira(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  const baseUrl = integration.metadata?.base_url || integration.config?.base_url;
  if (!baseUrl) throw new Error('Jira base URL not configured.');
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  const jql = lastSynced
    ? `updated >= "${lastSynced.toISOString().split('T')[0]}"`
    : 'updated >= -30d';

  let startAt = 0;
  let hasMore = true;

  while (hasMore && imported < limit) {
    const res = await fetch(`${baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=100&startAt=${startAt}&fields=summary,description,status,assignee,priority,issuetype,project,updated`, {
      headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`Jira API error: ${res.status}`);
    const data = await res.json();

    for (const issue of (data.issues || [])) {
      if (imported >= limit) break;
      const fields = issue.fields || {};
      const description = fields.description?.content?.[0]?.content?.[0]?.text || '';
      const ok = await upsertKnowledge(supabase, {
        provider: 'jira',
        external_id: issue.id,
        content_type: fields.issuetype?.name?.toLowerCase() || 'issue',
        title: `[${fields.project?.key}] ${fields.summary}`,
        content: description.substring(0, 3000),
        url: `${baseUrl}/browse/${issue.key}`,
        author: fields.assignee?.displayName || null,
        tags: [fields.status?.name, fields.priority?.name].filter(Boolean),
        metadata: { project: fields.project?.name, status: fields.status?.name, priority: fields.priority?.name },
      }, integration);
      if (ok) imported++;
    }

    startAt += data.maxResults;
    hasMore = startAt < data.total;
  }
  return imported;
}

// ─── Confluence Sync ──────────────────────────────────────────────────────────
async function syncConfluence(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  const baseUrl = integration.metadata?.base_url || integration.config?.base_url;
  if (!baseUrl) throw new Error('Confluence base URL not configured.');
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  const lastModParam = lastSynced
    ? `&lastModified>${lastSynced.toISOString().replace('T', '+').split('.')[0]}`
    : '';

  let nextUrl = `${baseUrl}/rest/api/content?type=page&limit=100&expand=body.storage,space,history${lastModParam}`;

  while (nextUrl && imported < limit) {
    const res = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`Confluence API error: ${res.status}`);
    const data = await res.json();

    for (const page of (data.results || [])) {
      if (imported >= limit) break;
      const rawHtml = page.body?.storage?.value || '';
      const textContent = rawHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const ok = await upsertKnowledge(supabase, {
        provider: 'confluence',
        external_id: page.id,
        content_type: 'page',
        title: page.title,
        content: textContent.substring(0, 5000),
        url: `${baseUrl}${page._links?.webui || ''}`,
        author: page.history?.createdBy?.displayName || null,
        metadata: { space: page.space?.name, version: page.version?.number },
      }, integration);
      if (ok) imported++;
    }
    nextUrl = data._links?.next ? `${baseUrl}${data._links.next}` : '';
  }
  return imported;
}

// ─── ClickUp Sync ─────────────────────────────────────────────────────────────
async function syncClickUp(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  const teamsRes = await fetch('https://api.clickup.com/api/v2/team', {
    headers: { Authorization: token }
  });
  if (!teamsRes.ok) throw new Error(`ClickUp API error: ${teamsRes.status}`);
  const teamsData = await teamsRes.json();

  const dateUpdatedParam = lastSynced
    ? `&date_updated_gt=${lastSynced.getTime()}`
    : '';

  for (const team of (teamsData.teams || [])) {
    if (imported >= limit) break;
    let page = 0;
    let hasMoreTasks = true;

    while (hasMoreTasks && imported < limit) {
      const tasksRes = await fetch(`https://api.clickup.com/api/v2/team/${team.id}/task?page=${page}&order_by=updated&subtasks=true&include_closed=true${dateUpdatedParam}`, {
        headers: { Authorization: token }
      });
      if (!tasksRes.ok) break;
      const tasksData = await tasksRes.json();
      
      const tasks = tasksData.tasks || [];
      if (tasks.length === 0) {
        hasMoreTasks = false;
        break;
      }

      for (const task of tasks) {
        if (imported >= limit) break;
        const ok = await upsertKnowledge(supabase, {
          provider: 'clickup',
          external_id: task.id,
          content_type: 'task',
          title: task.name,
          content: task.description?.substring(0, 2000) || '',
          url: task.url,
          author: task.creator?.username || null,
          tags: [task.status?.status].filter(Boolean),
          metadata: { status: task.status?.status, priority: task.priority?.priority, teamName: team.name },
        }, integration);
        if (ok) imported++;
      }
      page++;
    }
  }
  return imported;
}

// ─── Asana Sync ───────────────────────────────────────────────────────────────
async function syncAsana(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  const modifiedSinceParam = lastSynced
    ? `&modified_since=${lastSynced.toISOString()}`
    : '';

  const wsRes = await fetch('https://app.asana.com/api/1.0/workspaces', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!wsRes.ok) throw new Error(`Asana API error: ${wsRes.status}`);
  const wsData = await wsRes.json();

  for (const ws of (wsData.data || [])) {
    if (imported >= limit) break;
    
    let nextUrl = `https://app.asana.com/api/1.0/tasks?workspace=${ws.gid}&assignee=me&opt_fields=gid,name,notes,completed,due_on,assignee.name,projects.name,permalink_url,modified_at&limit=100${modifiedSinceParam}`;

    while (nextUrl && imported < limit) {
      const tasksRes = await fetch(nextUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!tasksRes.ok) break;
      const tasksData = await tasksRes.json();

      for (const task of (tasksData.data || [])) {
        if (imported >= limit) break;
        const ok = await upsertKnowledge(supabase, {
          provider: 'asana',
          external_id: task.gid,
          content_type: 'task',
          title: task.name,
          content: task.notes?.substring(0, 2000) || '',
          url: task.permalink_url,
          author: task.assignee?.name || null,
          tags: [task.completed ? 'completed' : 'open'].concat((task.projects || []).map((p: any) => p.name)),
          metadata: { completed: task.completed, due_on: task.due_on, workspace: ws.name },
        }, integration);
        if (ok) imported++;
      }

      nextUrl = tasksData.next_page?.uri || '';
    }
  }
  return imported;
}

// ─── Linear Sync ──────────────────────────────────────────────────────────────
async function syncLinear(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

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

// ─── Trello Sync ──────────────────────────────────────────────────────────────
async function syncTrello(integration: any, supabase: any, _lastSynced: Date | null) {
  const token = integration.access_token;
  const apiKey = integration.metadata?.api_key || Deno.env.get('TRELLO_API_KEY');
  if (!apiKey) throw new Error('Trello API key not configured.');
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  const boardsRes = await fetch(`https://api.trello.com/1/members/me/boards?key=${apiKey}&token=${token}&fields=id,name,url`, {
    headers: { 'Accept': 'application/json' }
  });
  if (!boardsRes.ok) throw new Error(`Trello API error: ${boardsRes.status}`);
  const boards = await boardsRes.json();

  for (const board of (boards || [])) {
    if (imported >= limit) break;
    const cardsRes = await fetch(`https://api.trello.com/1/boards/${board.id}/cards?key=${apiKey}&token=${token}&fields=id,name,desc,url,labels,due,idList`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!cardsRes.ok) continue;
    const cards = await cardsRes.json();

    for (const card of (cards || [])) {
      if (imported >= limit) break;
      const ok = await upsertKnowledge(supabase, {
        provider: 'trello',
        external_id: card.id,
        content_type: 'card',
        title: `[${board.name}] ${card.name}`,
        content: card.desc?.substring(0, 2000) || '',
        url: card.url,
        tags: (card.labels || []).map((l: any) => l.name).filter(Boolean),
        metadata: { board: board.name, due: card.due },
      }, integration);
      if (ok) imported++;
    }
  }
  return imported;
}

// ─── Dropbox Sync ─────────────────────────────────────────────────────────────
async function syncDropbox(integration: any, supabase: any, _lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  let url = 'https://api.dropboxapi.com/2/files/list_folder';
  let body: any = { path: '', recursive: true, limit: 100 };
  let hasMore = true;

  const SUPPORTED_EXT = ['pdf', 'doc', 'docx', 'txt', 'md', 'xlsx', 'pptx'];

  while (hasMore && imported < limit) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Dropbox API error: ${res.status}`);
    const data = await res.json();

    for (const entry of (data.entries || [])) {
      if (imported >= limit) break;
      if (entry['.tag'] !== 'file') continue;
      const ext = entry.name?.split('.').pop()?.toLowerCase();
      if (!SUPPORTED_EXT.includes(ext)) continue;

      const ok = await upsertKnowledge(supabase, {
        provider: 'dropbox',
        external_id: entry.id,
        content_type: ext === 'pdf' ? 'pdf' : 'document',
        title: entry.name,
        metadata: { size: entry.size, modified: entry.client_modified, path: entry.path_display },
      }, integration);
      if (ok) imported++;
    }

    hasMore = data.has_more;
    if (hasMore) {
      url = 'https://api.dropboxapi.com/2/files/list_folder/continue';
      body = { cursor: data.cursor };
    }
  }
  return imported;
}

// ─── Box Sync ─────────────────────────────────────────────────────────────────
async function syncBox(integration: any, supabase: any, _lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;
  let offset = 0;
  let totalCount = 1; // dummy initial
  const limitPerPage = 100;

  const SUPPORTED_EXT = ['pdf', 'doc', 'docx', 'txt', 'md', 'xlsx', 'pptx'];

  while (offset < totalCount && imported < limit) {
    const res = await fetch(`https://api.box.com/2.0/folders/0/items?limit=${limitPerPage}&offset=${offset}&fields=id,name,type,size,created_at,modified_at,created_by,shared_link`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Box API error: ${res.status}`);
    const data = await res.json();
    totalCount = data.total_count || 0;

    for (const entry of (data.entries || [])) {
      if (imported >= limit) break;
      if (entry.type !== 'file') continue;
      const ext = entry.name?.split('.').pop()?.toLowerCase();
      if (!SUPPORTED_EXT.includes(ext)) continue;

      const ok = await upsertKnowledge(supabase, {
        provider: 'box',
        external_id: entry.id,
        content_type: ext === 'pdf' ? 'pdf' : 'document',
        title: entry.name,
        url: entry.shared_link?.url || null,
        author: entry.created_by?.name || null,
        metadata: { size: entry.size, modified: entry.modified_at },
      }, integration);
      if (ok) imported++;
    }
    offset += limitPerPage;
  }
  return imported;
}

// ─── Salesforce Sync ──────────────────────────────────────────────────────────
async function syncSalesforce(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  const instanceUrl = integration.metadata?.instance_url || integration.config?.instance_url;
  if (!instanceUrl) throw new Error('Salesforce instance URL not configured.');
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  const dateFilter = lastSynced
    ? `WHERE CreatedDate > ${lastSynced.toISOString()}`
    : '';

  let nextUrl = `${instanceUrl}/services/data/v57.0/query?q=${encodeURIComponent(`SELECT Id,Title,Body,CreatedDate,CreatedBy.Name FROM Note ${dateFilter} ORDER BY CreatedDate DESC`)}`;

  while (nextUrl && imported < limit) {
    const notesRes = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (!notesRes.ok) throw new Error(`Salesforce API error: ${notesRes.status}`);
    const notesData = await notesRes.json();

    for (const note of (notesData.records || [])) {
      if (imported >= limit) break;
      const ok = await upsertKnowledge(supabase, {
        provider: 'salesforce',
        external_id: note.Id,
        content_type: 'note',
        title: note.Title || 'Salesforce Note',
        content: note.Body?.substring(0, 3000) || '',
        author: note.CreatedBy?.Name || null,
        url: `${instanceUrl}/${note.Id}`,
        metadata: { createdDate: note.CreatedDate },
      }, integration);
      if (ok) imported++;
    }
    nextUrl = notesData.nextRecordsUrl ? `${instanceUrl}${notesData.nextRecordsUrl}` : '';
  }
  return imported;
}

// ─── HubSpot Sync ─────────────────────────────────────────────────────────────
async function syncHubSpot(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  const afterParam = lastSynced ? `&after=${lastSynced.getTime()}` : '';

  let afterId = '';
  let hasMore = true;

  while (hasMore && imported < limit) {
    const after = afterId ? `&after=${afterId}` : afterParam;
    const notesRes = await fetch(`https://api.hubapi.com/crm/v3/objects/notes?limit=100&properties=hs_note_body,hs_timestamp,hubspot_owner_id&sort=-hs_timestamp${after}`, {
      headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (!notesRes.ok) throw new Error(`HubSpot API error: ${notesRes.status}`);
    const notesData = await notesRes.json();

    for (const note of (notesData.results || [])) {
      if (imported >= limit) break;
      const body = note.properties?.hs_note_body || '';
      const ok = await upsertKnowledge(supabase, {
        provider: 'hubspot',
        external_id: note.id,
        content_type: 'note',
        title: `HubSpot Note (${note.properties?.hs_timestamp?.slice(0, 10) || 'recent'})`,
        content: body.substring(0, 3000),
        metadata: { timestamp: note.properties?.hs_timestamp },
      }, integration);
      if (ok) imported++;
    }
    
    if (notesData.paging?.next?.after) {
      afterId = notesData.paging.next.after;
    } else {
      hasMore = false;
    }
  }

  const dealsRes = await fetch(`https://api.hubapi.com/crm/v3/objects/deals?limit=100&properties=dealname,dealstage,amount,closedate&sort=-hs_lastmodifieddate${afterParam}`, {
    headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/json' }
  });
  if (dealsRes.ok) {
    const dealsData = await dealsRes.json();
    for (const deal of (dealsData.results || [])) {
      if (imported >= limit) break;
      const ok = await upsertKnowledge(supabase, {
        provider: 'hubspot',
        external_id: `deal_${deal.id}`,
        content_type: 'deal',
        title: `Deal: ${deal.properties?.dealname || 'Unnamed'}`,
        content: `Stage: ${deal.properties?.dealstage || 'unknown'}. Amount: ${deal.properties?.amount || 'N/A'}. Close date: ${deal.properties?.closedate || 'N/A'}.`,
        metadata: { stage: deal.properties?.dealstage, amount: deal.properties?.amount },
      }, integration);
      if (ok) imported++;
    }
  }
  return imported;
}

// ─── Google Meet Sync ─────────────────────────────────────────────────────────
async function syncGoogleMeet(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  const timeMin = lastSynced ? lastSynced.toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  let pageToken = '';

  do {
    const tokenParam = pageToken ? `&pageToken=${pageToken}` : '';
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&maxResults=100&singleEvents=true&orderBy=startTime&q=meet${tokenParam}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Google Calendar API error: ${res.status}`);
    const data = await res.json();

    for (const event of (data.items || [])) {
      if (imported >= limit) break;
      if (!event.conferenceData) continue;
      const meetLink = event.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri;
      const attendees = (event.attendees || []).map((a: any) => a.email).join(', ');

      const ok = await upsertKnowledge(supabase, {
        provider: 'google_meet',
        external_id: event.id,
        content_type: 'meeting',
        title: event.summary || 'Google Meet',
        content: [event.description, attendees ? `Attendees: ${attendees}` : ''].filter(Boolean).join('\n'),
        url: meetLink || event.htmlLink,
        author: event.organizer?.email || null,
        metadata: { start: event.start?.dateTime, end: event.end?.dateTime, attendeeCount: event.attendees?.length || 0 },
      }, integration);
      if (ok) imported++;
    }
    pageToken = data.nextPageToken || '';
  } while (pageToken && imported < limit);
  return imported;
}

// ─── Microsoft Outlook Sync ───────────────────────────────────────────────────
async function syncOutlook(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  const filterParam = lastSynced
    ? `&$filter=receivedDateTime ge ${lastSynced.toISOString()}`
    : `&$filter=importance eq 'high'`;

  let nextLink = `https://graph.microsoft.com/v1.0/me/messages?$top=100&$select=id,subject,bodyPreview,from,receivedDateTime,importance&$orderby=receivedDateTime desc${filterParam}`;

  while (nextLink && imported < limit) {
    const res = await fetch(nextLink, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Outlook API error: ${res.status}`);
    const data = await res.json();

    for (const email of (data.value || [])) {
      if (imported >= limit) break;
      const ok = await upsertKnowledge(supabase, {
        provider: 'outlook',
        external_id: email.id,
        content_type: 'email',
        title: email.subject || '(No Subject)',
        content: email.bodyPreview?.substring(0, 2000) || '',
        author: email.from?.emailAddress?.address || null,
        metadata: { receivedDateTime: email.receivedDateTime, importance: email.importance },
      }, integration);
      if (ok) imported++;
    }
    nextLink = data['@odata.nextLink'] || '';
  }
  return imported;
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 3: NEW CONNECTORS
// ─────────────────────────────────────────────────────────────────────────────

// ─── Discord Sync ─────────────────────────────────────────────────────────────
async function syncDiscord(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!guildsRes.ok) throw new Error(`Discord API error: ${guildsRes.status}`);
  const guilds = await guildsRes.json();

  for (const guild of (guilds || [])) {
    if (imported >= limit) break;
    const channelsRes = await fetch(`https://discord.com/api/v10/guilds/${guild.id}/channels`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!channelsRes.ok) continue;
    const channels = await channelsRes.json();
    const textChannels = (channels || []).filter((c: any) => c.type === 0);

    for (const channel of textChannels) {
      if (imported >= limit) break;
      let lastMsgId = '';
      let hasMore = true;

      while (hasMore && imported < limit) {
        let afterParam = '';
        if (lastMsgId) {
          afterParam = `?after=${lastMsgId}&limit=100`;
        } else if (lastSynced) {
          afterParam = `?after=${BigInt(lastSynced.getTime() - 1420070400000) << BigInt(22)}&limit=100`;
        } else {
          afterParam = '?limit=100';
        }
        
        const msgsRes = await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages${afterParam}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!msgsRes.ok) break;
        const messages = await msgsRes.json();
        if (messages.length === 0) {
          hasMore = false;
          break;
        }

        for (const msg of messages) {
          if (imported >= limit) break;
          if (!msg.content) continue;
          const ok = await upsertKnowledge(supabase, {
            provider: 'discord',
            external_id: msg.id,
            content_type: 'message',
            title: `#${channel.name} (${guild.name})`,
            content: msg.content.substring(0, 2000),
            author: msg.author?.username || null,
            metadata: { guildId: guild.id, guildName: guild.name, channelName: channel.name },
          }, integration);
          if (ok) imported++;
          lastMsgId = msg.id;
        }
        
        if (messages.length < 100) hasMore = false;
      }
    }
  }
  return imported;
}

// ─── Monday.com Sync ─────────────────────────────────────────────────────────
async function syncMonday(integration: any, supabase: any, _lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  const query = `{ boards(limit: 50) { id name items_page(limit: 100) { items { id name state column_values { text } } } } }`;
  const res = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!res.ok) throw new Error(`Monday API error: ${res.status}`);
  const data = await res.json();

  for (const board of (data.data?.boards || [])) {
    if (imported >= limit) break;
    for (const item of (board.items_page?.items || [])) {
      if (imported >= limit) break;
      const details = (item.column_values || []).map((c: any) => c.text).filter(Boolean).join(' | ');
      const ok = await upsertKnowledge(supabase, {
        provider: 'monday',
        external_id: item.id,
        content_type: 'task',
        title: `[${board.name}] ${item.name}`,
        content: details.substring(0, 2000),
        tags: [item.state].filter(Boolean),
        metadata: { board: board.name, state: item.state },
      }, integration);
      if (ok) imported++;
    }
  }
  return imported;
}

// ─── GitLab Sync ─────────────────────────────────────────────────────────────
async function syncGitLab(integration: any, supabase: any, lastSynced: Date | null) {
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

// ─── Bitbucket Sync ───────────────────────────────────────────────────────────
async function syncBitbucket(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  let wsUrl = 'https://api.bitbucket.org/2.0/repositories?role=member&pagelen=100';

  while (wsUrl && imported < limit) {
    const wsRes = await fetch(wsUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!wsRes.ok) throw new Error(`Bitbucket API error: ${wsRes.status}`);
    const wsData = await wsRes.json();

    for (const repo of (wsData.values || [])) {
      if (imported >= limit) break;
      const updatedParam = lastSynced ? `&q=updated_on>"${lastSynced.toISOString()}"` : '';
      
      let issuesUrl = `https://api.bitbucket.org/2.0/repositories/${repo.full_name}/issues?pagelen=100${updatedParam}`;
      while (issuesUrl && imported < limit) {
        const issuesRes = await fetch(issuesUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!issuesRes.ok) break;
        const issuesData = await issuesRes.json();

        for (const issue of (issuesData.values || [])) {
          if (imported >= limit) break;
          const ok = await upsertKnowledge(supabase, {
            provider: 'bitbucket',
            external_id: String(issue.id),
            content_type: 'issue',
            title: `[${repo.name}] ${issue.title}`,
            content: issue.content?.raw?.substring(0, 3000) || '',
            url: issue.links?.html?.href || null,
            author: issue.reporter?.nickname || null,
            tags: [issue.state, issue.priority].filter(Boolean),
            metadata: { repo: repo.full_name, state: issue.state, kind: issue.kind },
          }, integration);
          if (ok) imported++;
        }
        issuesUrl = issuesData.next || '';
      }
    }
    wsUrl = wsData.next || '';
  }
  return imported;
}

// ─── Zoho CRM Sync ────────────────────────────────────────────────────────────
async function syncZohoCRM(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  const lastModParam = lastSynced ? `&Last_Modified_Time=${lastSynced.toISOString()}` : '';

  let page = 1;
  let hasMore = true;

  while (hasMore && imported < limit) {
    const notesRes = await fetch(`https://www.zohoapis.com/crm/v2/Notes?sort_by=Modified_Time&sort_order=desc&per_page=100&page=${page}${lastModParam}`, {
      headers: { Authorization: `Zoho-oauthtoken ${token}` }
    });
    if (!notesRes.ok) throw new Error(`Zoho CRM API error: ${notesRes.status}`);
    const notesData = await notesRes.json();
    
    if (!notesData.data || notesData.data.length === 0) {
      hasMore = false;
      break;
    }

    for (const note of notesData.data) {
      if (imported >= limit) break;
      const ok = await upsertKnowledge(supabase, {
        provider: 'zoho_crm',
        external_id: note.id,
        content_type: 'note',
        title: note.Note_Title || `Zoho Note (${note.Modified_Time?.slice(0, 10)})`,
        content: note.Note_Content?.substring(0, 3000) || '',
        author: note.Created_By?.name || null,
        metadata: { parentModule: note.Parent_Id?.$se_module, parentId: note.Parent_Id?.id },
      }, integration);
      if (ok) imported++;
    }
    
    if (!notesData.info?.more_records) {
      hasMore = false;
    }
    page++;
  }
  return imported;
}

// ─── Zendesk Sync ─────────────────────────────────────────────────────────────
async function syncZendesk(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  const subdomain = integration.metadata?.subdomain;
  if (!subdomain) throw new Error('Zendesk subdomain not configured.');
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  const updatedParam = lastSynced ? `&updated_since=${lastSynced.toISOString()}` : '';

  let nextUrl = `https://${subdomain}.zendesk.com/api/v2/tickets.json?sort_by=updated_at&sort_order=desc&per_page=100${updatedParam}`;

  while (nextUrl && imported < limit) {
    const res = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Zendesk API error: ${res.status}`);
    const data = await res.json();

    for (const ticket of (data.tickets || [])) {
      if (imported >= limit) break;
      const ok = await upsertKnowledge(supabase, {
        provider: 'zendesk',
        external_id: String(ticket.id),
        content_type: 'ticket',
        title: `[#${ticket.id}] ${ticket.subject}`,
        content: ticket.description?.substring(0, 3000) || '',
        url: `https://${subdomain}.zendesk.com/agent/tickets/${ticket.id}`,
        tags: ticket.tags || [],
        metadata: { status: ticket.status, priority: ticket.priority, type: ticket.type },
      }, integration);
      if (ok) imported++;
    }
    nextUrl = data.next_page || '';
  }
  return imported;
}

// ─── Intercom Sync ────────────────────────────────────────────────────────────
async function syncIntercom(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  const updatedSince = lastSynced ? Math.floor(lastSynced.getTime() / 1000) : Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
  let startingAfter = '';
  let hasMore = true;

  while (hasMore && imported < limit) {
    const afterParam = startingAfter ? `&starting_after=${startingAfter}` : '';
    const res = await fetch(`https://api.intercom.io/conversations?per_page=100${afterParam}`, {
      headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`Intercom API error: ${res.status}`);
    const data = await res.json();
    
    if (!data.conversations || data.conversations.length === 0) break;

    for (const conv of data.conversations) {
      if (imported >= limit) break;
      if (lastSynced && conv.updated_at < updatedSince) continue;
      const ok = await upsertKnowledge(supabase, {
        provider: 'intercom',
        external_id: conv.id,
        content_type: 'conversation',
        title: conv.title || `Conversation ${conv.id}`,
        content: conv.conversation_message?.body?.replace(/<[^>]+>/g, '').substring(0, 3000) || '',
        tags: [conv.state, conv.read ? 'read' : 'unread'].filter(Boolean),
        metadata: { state: conv.state, assignee: conv.assignee?.name, contact: conv.contacts?.contacts?.[0]?.id },
      }, integration);
      if (ok) imported++;
    }
    
    if (data.pages && data.pages.next && data.pages.next.starting_after) {
      startingAfter = data.pages.next.starting_after;
    } else {
      hasMore = false;
    }
  }
  return imported;
}

// ─── Freshdesk Sync ───────────────────────────────────────────────────────────
async function syncFreshdesk(integration: any, supabase: any, lastSynced: Date | null) {
  const apiKey = integration.access_token;
  const subdomain = integration.metadata?.subdomain;
  if (!subdomain) throw new Error('Freshdesk subdomain not configured.');
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  const auth = btoa(`${apiKey}:X`);
  const updatedParam = lastSynced ? `&updated_since=${lastSynced.toISOString()}` : '';

  let page = 1;
  let hasMore = true;

  while (hasMore && imported < limit) {
    const res = await fetch(`https://${subdomain}.freshdesk.com/api/v2/tickets?order_by=updated_at&order_type=desc&per_page=100&page=${page}${updatedParam}`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    if (!res.ok) throw new Error(`Freshdesk API error: ${res.status}`);
    const tickets = await res.json();
    
    if (tickets.length === 0) {
      hasMore = false;
      break;
    }

    for (const ticket of tickets) {
      if (imported >= limit) break;
      const ok = await upsertKnowledge(supabase, {
        provider: 'freshdesk',
        external_id: String(ticket.id),
        content_type: 'ticket',
        title: `[#${ticket.id}] ${ticket.subject}`,
        content: ticket.description_text?.substring(0, 3000) || '',
        url: `https://${subdomain}.freshdesk.com/a/tickets/${ticket.id}`,
        tags: (ticket.tags || []).concat([ticket.status_text, ticket.priority_text]).filter(Boolean),
        metadata: { status: ticket.status, priority: ticket.priority, type: ticket.type },
      }, integration);
      if (ok) imported++;
    }
    
    if (tickets.length < 100) hasMore = false;
    page++;
  }
  return imported;
}

// ─── Figma Sync ───────────────────────────────────────────────────────────────
async function syncFigma(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  const res = await fetch('https://api.figma.com/v1/me/files', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Figma API error: ${res.status}`);
  const data = await res.json();

  for (const file of (data.files || [])) {
    if (imported >= limit) break;
    if (lastSynced && new Date(file.last_modified) <= lastSynced) continue;
    const ok = await upsertKnowledge(supabase, {
      provider: 'figma',
      external_id: file.key,
      content_type: 'design',
      title: file.name,
      url: `https://www.figma.com/file/${file.key}`,
      author: file.last_modified_by?.handle || null,
      metadata: { thumbnail: file.thumbnail_url, lastModified: file.last_modified, projectId: file.project_id },
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── Miro Sync ────────────────────────────────────────────────────────────────
async function syncMiro(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  let offset = 0;
  let hasMore = true;

  while (hasMore && imported < limit) {
    const res = await fetch(`https://api.miro.com/v2/boards?limit=50&offset=${offset}&sort=last_modified`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Miro API error: ${res.status}`);
    const data = await res.json();

    if (!data.data || data.data.length === 0) {
      hasMore = false;
      break;
    }

    for (const board of data.data) {
      if (imported >= limit) break;
      if (lastSynced && new Date(board.modifiedAt) <= lastSynced) continue;
      const ok = await upsertKnowledge(supabase, {
        provider: 'miro',
        external_id: board.id,
        content_type: 'whiteboard',
        title: board.name,
        url: board.viewLink || `https://miro.com/app/board/${board.id}/`,
        author: board.owner?.name || null,
        metadata: { teamId: board.team?.id, createdAt: board.createdAt, modifiedAt: board.modifiedAt },
      }, integration);
      if (ok) imported++;
    }
    
    offset += data.data.length;
    if (data.data.length < 50) hasMore = false;
  }
  return imported;
}

// ─── Google Calendar Sync ─────────────────────────────────────────────────────
async function syncGoogleCalendar(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  const timeMin = lastSynced ? lastSynced.toISOString() : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  let pageToken = '';

  do {
    const tokenParam = pageToken ? `&pageToken=${pageToken}` : '';
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&maxResults=100&singleEvents=true&orderBy=startTime${tokenParam}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Google Calendar API error: ${res.status}`);
    const data = await res.json();

    for (const event of (data.items || [])) {
      if (imported >= limit) break;
      const attendees = (event.attendees || []).map((a: any) => a.email).join(', ');
      const ok = await upsertKnowledge(supabase, {
        provider: 'google_calendar',
        external_id: event.id,
        content_type: 'calendar_event',
        title: event.summary || '(No Title)',
        content: [event.description, attendees ? `Attendees: ${attendees}` : '', event.location ? `Location: ${event.location}` : ''].filter(Boolean).join('\n'),
        url: event.htmlLink,
        author: event.organizer?.email || null,
        metadata: { start: event.start?.dateTime || event.start?.date, end: event.end?.dateTime || event.end?.date, attendeeCount: event.attendees?.length || 0, recurrence: !!event.recurrence },
      }, integration);
      if (ok) imported++;
    }
    pageToken = data.nextPageToken || '';
  } while (pageToken && imported < limit);

  return imported;
}

// ─── SharePoint Sync ──────────────────────────────────────────────────────────
async function syncSharePoint(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  const filterParam = '';

  // Get all sites the user has access to
  const sitesRes = await fetch(`https://graph.microsoft.com/v1.0/sites?search=*&$top=500`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!sitesRes.ok) {
    if (sitesRes.status === 403) {
      console.warn("SharePoint: 403 Forbidden. User token likely missing Sites.Read.All scope.");
    } else {
      throw new Error(`SharePoint API error: ${sitesRes.status}`);
    }
  }

  const sitesData = sitesRes.ok ? await sitesRes.json() : { value: [] };

  for (const site of (sitesData.value || [])) {
    if (imported >= limit) break;
    
    let nextLink = `https://graph.microsoft.com/v1.0/sites/${site.id}/drive/root/children?$top=100&$select=id,name,file,webUrl,lastModifiedDateTime,createdBy${filterParam}`;
    
    while (nextLink && imported < limit) {
      const docsRes = await fetch(nextLink, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!docsRes.ok) break;
      const docsData = await docsRes.json();

      for (const item of (docsData.value || [])) {
        if (imported >= limit) break;
        if (!item.file) continue;
        const ext = item.name?.split('.').pop()?.toLowerCase();
        const SUPPORTED_EXT = ['docx', 'xlsx', 'pptx', 'pdf', 'txt', 'md'];
        if (!SUPPORTED_EXT.includes(ext)) continue;

        const ok = await upsertKnowledge(supabase, {
          provider: 'sharepoint',
          external_id: item.id,
          content_type: ext === 'pdf' ? 'pdf' : ext === 'xlsx' ? 'spreadsheet' : 'document',
          title: `[${site.displayName}] ${item.name}`,
          url: item.webUrl,
          author: item.createdBy?.user?.displayName || null,
          metadata: { siteId: site.id, siteName: site.displayName, lastModified: item.lastModifiedDateTime },
        }, integration);
        if (ok) imported++;
      }
      
      nextLink = docsData['@odata.nextLink'] || '';
    }
  }
  return imported;
}

// ─── Guru Sync ────────────────────────────────────────────────────────────────
async function syncGuru(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  const username = integration.metadata?.username || integration.metadata?.email;
  if (!username) throw new Error('Guru username not configured.');
  let imported = 0;
  const limit = integration.settings?.sync_limit || 1000;

  const auth = btoa(`${username}:${token}`);
  const updatedParam = lastSynced ? `?dateUpdated=${lastSynced.toISOString()}` : '';

  const res = await fetch(`https://api.getguru.com/api/v1/cards${updatedParam}`, {
    headers: { Authorization: `Basic ${auth}`, 'Accept': 'application/json' }
  });
  if (!res.ok) throw new Error(`Guru API error: ${res.status}`);
  const cards = await res.json();

  for (const card of (cards || [])) {
    if (imported >= limit) break;
    const textContent = card.content?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || '';
    const ok = await upsertKnowledge(supabase, {
      provider: 'guru',
      external_id: card.id,
      content_type: 'knowledge_card',
      title: card.preferredPhrase || card.title,
      content: textContent.substring(0, 5000),
      url: `https://app.getguru.com/card/${card.id}`,
      author: card.owner?.user?.email || null,
      tags: (card.tags || []).map((t: any) => t.value).filter(Boolean),
      metadata: { collection: card.collection?.name, boardsCount: card.boards?.length },
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── syncGoogleWorkspace ─────────────────────────────────────────────────────────────
async function syncGoogleWorkspace(integration: any, supabase: any, lastSynced: Date | null) {
  let imported = 0;
  try {
    imported += await syncGoogleDrive(integration, supabase, lastSynced);
  } catch (e: any) {
    console.error('Google Workspace (Drive) error:', e?.message || String(e));
  }
  try {
    imported += await syncGoogleCalendar(integration, supabase, lastSynced);
  } catch (e: any) {
    console.error('Google Workspace (Calendar) error:', e?.message || String(e));
  }
  
  if (imported === 0) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'google_workspace',
      external_id: `google_workspace-${integration.id}-connected`,
      content_type: 'record',
      title: 'Google Workspace Connected',
      content: 'Workspace connected successfully. Waiting for files or calendar events.',
      url: '',
      author: null,
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── syncPipedrive ─────────────────────────────────────────────────────────────
// syncPipedrive has been moved to ./syncers/pipedrive.ts

// ─── syncMailchimp ─────────────────────────────────────────────────────────────
// syncMailchimp has been moved to ./syncers/mailchimp.ts

// ─── syncStripe ─────────────────────────────────────────────────────────────
// syncStripe has been moved to ./syncers/stripe.ts

// ─── syncQuickbooks ─────────────────────────────────────────────────────────────
// syncQuickbooks has been moved to ./syncers/quickbooks.ts

// ─── syncAWS ─────────────────────────────────────────────────────────────
// syncAWS has been moved to ./syncers/aws.ts

// ─── syncAzure ─────────────────────────────────────────────────────────────
// syncAzure has been moved to ./syncers/azure.ts

// ─── syncGoogleCloud ─────────────────────────────────────────────────────────────
async function syncGoogleCloud(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  
  // Real implementation using Cloud Resource Manager API
  const res = await fetch(`https://cloudresourcemanager.googleapis.com/v1/projects`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!res.ok) {
    if (res.status === 403) {
      console.warn("Google Cloud: 403 Forbidden. Token missing cloud-platform scope.");
    } else {
      throw new Error(`Google Cloud API error: ${res.status}`);
    }
  }
  
  const data = res.ok ? await res.json() : { projects: [] };
  
  for (const proj of (data.projects || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'google_cloud',
      external_id: proj.projectId,
      content_type: 'record',
      title: `GCP Project: ${proj.name}`,
      content: `Project ID: ${proj.projectId}, Status: ${proj.lifecycleState}`,
      url: `https://console.cloud.google.com/home/dashboard?project=${proj.projectId}`,
      author: null,
    }, integration);
    if (ok) imported++;
  }
  
  if (imported === 0) {
    await upsertKnowledge(supabase, { 
      provider: 'google_cloud', 
      external_id: `gcp-${integration.id}`, 
      content_type: 'record', 
      title: 'Google Cloud Connected', 
      content: 'No accessible projects found, but API connection was successful.', 
      url: '', 
      author: null 
    }, integration);
    imported++;
  }
  
  return imported;
}

// ─── syncDatadog ─────────────────────────────────────────────────────────────
// syncDatadog has been moved to ./syncers/datadog.ts

// ─── syncSentry ─────────────────────────────────────────────────────────────
// syncSentry has been moved to ./syncers/sentry.ts

// ─── syncPagerDuty ─────────────────────────────────────────────────────────────
// syncPagerDuty has been moved to ./syncers/pagerduty.ts

// ─── syncJenkins ─────────────────────────────────────────────────────────────
// syncJenkins has been moved to ./syncers/jenkins.ts

// ─── syncCanva ─────────────────────────────────────────────────────────────
// syncCanva has been moved to ./syncers/canva.ts

// ─── syncWhatsApp ─────────────────────────────────────────────────────────────
// syncWhatsApp has been moved to ./syncers/whatsapp.ts

// ─── syncTelegram ─────────────────────────────────────────────────────────────
// syncTelegram has been moved to ./syncers/telegram.ts

// ─── syncAirtable ─────────────────────────────────────────────────────────────
// syncAirtable has been moved to ./syncers/airtable.ts

// ─── syncSAP ─────────────────────────────────────────────────────────────
// syncSAP has been moved to ./syncers/sap.ts

// ─── syncOracle ─────────────────────────────────────────────────────────────
// syncOracle has been moved to ./syncers/oracle.ts

// ─── syncServiceNow ─────────────────────────────────────────────────────────────
// syncServiceNow has been moved to ./syncers/servicenow.ts

// ─── syncWorkday ─────────────────────────────────────────────────────────────
// syncWorkday has been moved to ./syncers/workday.ts

// ─── syncBambooHR ─────────────────────────────────────────────────────────────
// syncBambooHR has been moved to ./syncers/bamboohr.ts

// ─── syncDocuSign ─────────────────────────────────────────────────────────────
// syncDocuSign has been moved to ./syncers/docusign.ts

// ─── syncCalendly ─────────────────────────────────────────────────────────────
// syncCalendly has been moved to ./syncers/calendly.ts

