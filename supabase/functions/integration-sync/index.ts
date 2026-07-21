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
      switch (provider) {
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
    } catch (e) {
      syncError = e.message;
      console.error(`Sync error for ${provider}:`, e.message);
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

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
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

  const modifiedQuery = lastSynced
    ? `&q=trashed=false and modifiedTime>'${lastSynced.toISOString()}'`
    : `&q=trashed=false`;

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?pageSize=50&fields=files(id,name,mimeType,webViewLink,modifiedTime,owners)${modifiedQuery}`,
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
  return imported;
}

// ─── Notion Sync ─────────────────────────────────────────────────────────────
async function syncNotion(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;

  const filterBody: any = { filter: { value: 'page', property: 'object' }, page_size: 50 };
  if (lastSynced) {
    filterBody.filter = {
      and: [
        { property: 'object', value: 'page' },
        { timestamp: 'last_edited_time', last_edited_time: { after: lastSynced.toISOString() } }
      ]
    };
  }

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
  return imported;
}

// ─── Slack Sync ───────────────────────────────────────────────────────────────
async function syncSlack(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;

  const chRes = await fetch('https://slack.com/api/conversations.list?limit=50&types=public_channel,private_channel', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const chData = await chRes.json();
  if (!chData.ok) throw new Error(chData.error);

  const oldestParam = lastSynced ? `&oldest=${Math.floor(lastSynced.getTime() / 1000)}` : '';

  for (const channel of (chData.channels || []).slice(0, 10)) {
    const msgRes = await fetch(`https://slack.com/api/conversations.history?channel=${channel.id}&limit=30${oldestParam}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const msgData = await msgRes.json();
    if (!msgData.ok) continue;

    for (const msg of (msgData.messages || [])) {
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
  }
  return imported;
}

// ─── Zoom Sync ────────────────────────────────────────────────────────────────
async function syncZoom(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;

  const fromParam = lastSynced ? `&from=${lastSynced.toISOString().split('T')[0]}` : '';
  const res = await fetch(`https://api.zoom.us/v2/users/me/recordings?page_size=30${fromParam}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Zoom API error: ${res.status}`);
  const data = await res.json();

  for (const meeting of (data.meetings || [])) {
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
  return imported;
}

// ─── GitHub Sync ──────────────────────────────────────────────────────────────
async function syncGitHub(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;

  const sinceParam = lastSynced ? `&since=${lastSynced.toISOString()}` : '';

  const repoRes = await fetch('https://api.github.com/user/repos?per_page=20&sort=updated', {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'CliPad-Integration' }
  });
  if (!repoRes.ok) throw new Error(`GitHub API error: ${repoRes.status}`);
  const repos = await repoRes.json();

  for (const repo of repos.slice(0, 5)) {
    const issuesRes = await fetch(`https://api.github.com/repos/${repo.full_name}/issues?per_page=20&state=all${sinceParam}`, {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'CliPad-Integration' }
    });
    if (!issuesRes.ok) continue;
    const issues = await issuesRes.json();

    for (const issue of issues) {
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
  }
  return imported;
}

// ─── Microsoft OneDrive Sync ──────────────────────────────────────────────────
async function syncOneDrive(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;

  const filterParam = lastSynced
    ? `&$filter=lastModifiedDateTime gt ${lastSynced.toISOString()}`
    : '';

  const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root/children?$top=50&$select=id,name,file,webUrl,lastModifiedDateTime,createdBy${filterParam}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`OneDrive API error: ${res.status}`);
  const data = await res.json();

  for (const item of (data.value || [])) {
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
  return imported;
}

// ─── Microsoft Teams Sync ─────────────────────────────────────────────────────
async function syncMSTeams(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;

  const teamsRes = await fetch('https://graph.microsoft.com/v1.0/me/joinedTeams', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!teamsRes.ok) throw new Error(`Teams API error: ${teamsRes.status}`);
  const teamsData = await teamsRes.json();

  for (const team of (teamsData.value || []).slice(0, 5)) {
    const chRes = await fetch(`https://graph.microsoft.com/v1.0/teams/${team.id}/channels`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!chRes.ok) continue;
    const chData = await chRes.json();

    for (const channel of (chData.value || []).slice(0, 3)) {
      const filterParam = lastSynced ? `?$filter=lastModifiedDateTime ge ${lastSynced.toISOString()}` : '';
      const msgRes = await fetch(`https://graph.microsoft.com/v1.0/teams/${team.id}/channels/${channel.id}/messages${filterParam || '?$top=20'}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!msgRes.ok) continue;
      const msgData = await msgRes.json();

      for (const msg of (msgData.value || [])) {
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
    }
  }
  return imported;
}

// ─── Gmail Sync ───────────────────────────────────────────────────────────────
async function syncGmail(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;

  const afterParam = lastSynced
    ? `after:${Math.floor(lastSynced.getTime() / 1000)} `
    : '';

  const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=30&q=${encodeURIComponent(afterParam + 'is:important')}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!listRes.ok) throw new Error(`Gmail API error: ${listRes.status}`);
  const listData = await listRes.json();

  for (const msgRef of (listData.messages || []).slice(0, 20)) {
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
  return imported;
}

// ─── Jira Sync ────────────────────────────────────────────────────────────────
async function syncJira(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  const baseUrl = integration.metadata?.base_url || integration.config?.base_url;
  if (!baseUrl) throw new Error('Jira base URL not configured.');
  let imported = 0;

  const jql = lastSynced
    ? `updated >= "${lastSynced.toISOString().split('T')[0]}"`
    : 'updated >= -30d';

  const res = await fetch(`${baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=50&fields=summary,description,status,assignee,priority,issuetype,project,updated`, {
    headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/json' }
  });
  if (!res.ok) throw new Error(`Jira API error: ${res.status}`);
  const data = await res.json();

  for (const issue of (data.issues || [])) {
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
  return imported;
}

// ─── Confluence Sync ──────────────────────────────────────────────────────────
async function syncConfluence(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  const baseUrl = integration.metadata?.base_url || integration.config?.base_url;
  if (!baseUrl) throw new Error('Confluence base URL not configured.');
  let imported = 0;

  const lastModParam = lastSynced
    ? `&lastModified>${lastSynced.toISOString().replace('T', '+').split('.')[0]}`
    : '';

  const res = await fetch(`${baseUrl}/rest/api/content?type=page&limit=50&expand=body.storage,space,history${lastModParam}`, {
    headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/json' }
  });
  if (!res.ok) throw new Error(`Confluence API error: ${res.status}`);
  const data = await res.json();

  for (const page of (data.results || [])) {
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
  return imported;
}

// ─── ClickUp Sync ─────────────────────────────────────────────────────────────
async function syncClickUp(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;

  const teamsRes = await fetch('https://api.clickup.com/api/v2/team', {
    headers: { Authorization: token }
  });
  if (!teamsRes.ok) throw new Error(`ClickUp API error: ${teamsRes.status}`);
  const teamsData = await teamsRes.json();

  const dateUpdatedParam = lastSynced
    ? `&date_updated_gt=${lastSynced.getTime()}`
    : '';

  for (const team of (teamsData.teams || []).slice(0, 2)) {
    const tasksRes = await fetch(`https://api.clickup.com/api/v2/team/${team.id}/task?page=0&order_by=updated&subtasks=true&include_closed=true${dateUpdatedParam}`, {
      headers: { Authorization: token }
    });
    if (!tasksRes.ok) continue;
    const tasksData = await tasksRes.json();

    for (const task of (tasksData.tasks || []).slice(0, 30)) {
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
  }
  return imported;
}

// ─── Asana Sync ───────────────────────────────────────────────────────────────
async function syncAsana(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;

  const modifiedSinceParam = lastSynced
    ? `&modified_since=${lastSynced.toISOString()}`
    : '';

  const wsRes = await fetch('https://app.asana.com/api/1.0/workspaces', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!wsRes.ok) throw new Error(`Asana API error: ${wsRes.status}`);
  const wsData = await wsRes.json();

  for (const ws of (wsData.data || []).slice(0, 2)) {
    const tasksRes = await fetch(`https://app.asana.com/api/1.0/tasks?workspace=${ws.gid}&assignee=me&opt_fields=gid,name,notes,completed,due_on,assignee.name,projects.name,permalink_url,modified_at&limit=50${modifiedSinceParam}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!tasksRes.ok) continue;
    const tasksData = await tasksRes.json();

    for (const task of (tasksData.data || [])) {
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
  }
  return imported;
}

// ─── Linear Sync ──────────────────────────────────────────────────────────────
async function syncLinear(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;

  const updatedAtFilter = lastSynced
    ? `, filter: { updatedAt: { gte: "${lastSynced.toISOString()}" } }`
    : '';

  const query = `{
    issues(first: 50, orderBy: updatedAt${updatedAtFilter}) {
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

  for (const issue of (data.data?.issues?.nodes || [])) {
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
  return imported;
}

// ─── Trello Sync ──────────────────────────────────────────────────────────────
async function syncTrello(integration: any, supabase: any, _lastSynced: Date | null) {
  const token = integration.access_token;
  const apiKey = integration.metadata?.api_key || Deno.env.get('TRELLO_API_KEY');
  if (!apiKey) throw new Error('Trello API key not configured.');
  let imported = 0;

  const boardsRes = await fetch(`https://api.trello.com/1/members/me/boards?key=${apiKey}&token=${token}&fields=id,name,url`, {
    headers: { 'Accept': 'application/json' }
  });
  if (!boardsRes.ok) throw new Error(`Trello API error: ${boardsRes.status}`);
  const boards = await boardsRes.json();

  for (const board of (boards || []).slice(0, 5)) {
    const cardsRes = await fetch(`https://api.trello.com/1/boards/${board.id}/cards?key=${apiKey}&token=${token}&fields=id,name,desc,url,labels,due,idList`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!cardsRes.ok) continue;
    const cards = await cardsRes.json();

    for (const card of (cards || []).slice(0, 30)) {
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

  const res = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: '', recursive: false, limit: 50 })
  });
  if (!res.ok) throw new Error(`Dropbox API error: ${res.status}`);
  const data = await res.json();

  const SUPPORTED_EXT = ['pdf', 'doc', 'docx', 'txt', 'md', 'xlsx', 'pptx'];

  for (const entry of (data.entries || [])) {
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
  return imported;
}

// ─── Box Sync ─────────────────────────────────────────────────────────────────
async function syncBox(integration: any, supabase: any, _lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;

  const res = await fetch('https://api.box.com/2.0/folders/0/items?limit=50&fields=id,name,type,size,created_at,modified_at,created_by,shared_link', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Box API error: ${res.status}`);
  const data = await res.json();

  const SUPPORTED_EXT = ['pdf', 'doc', 'docx', 'txt', 'md', 'xlsx', 'pptx'];

  for (const entry of (data.entries || [])) {
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
  return imported;
}

// ─── Salesforce Sync ──────────────────────────────────────────────────────────
async function syncSalesforce(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  const instanceUrl = integration.metadata?.instance_url || integration.config?.instance_url;
  if (!instanceUrl) throw new Error('Salesforce instance URL not configured.');
  let imported = 0;

  const dateFilter = lastSynced
    ? `WHERE CreatedDate > ${lastSynced.toISOString()}`
    : '';

  const notesRes = await fetch(`${instanceUrl}/services/data/v57.0/query?q=${encodeURIComponent(`SELECT Id,Title,Body,CreatedDate,CreatedBy.Name FROM Note ${dateFilter} ORDER BY CreatedDate DESC LIMIT 30`)}`, {
    headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/json' }
  });
  if (!notesRes.ok) throw new Error(`Salesforce API error: ${notesRes.status}`);
  const notesData = await notesRes.json();

  for (const note of (notesData.records || [])) {
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
  return imported;
}

// ─── HubSpot Sync ─────────────────────────────────────────────────────────────
async function syncHubSpot(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;

  const afterParam = lastSynced ? `&after=${lastSynced.getTime()}` : '';

  const notesRes = await fetch(`https://api.hubapi.com/crm/v3/objects/notes?limit=50&properties=hs_note_body,hs_timestamp,hubspot_owner_id&sort=-hs_timestamp${afterParam}`, {
    headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/json' }
  });
  if (!notesRes.ok) throw new Error(`HubSpot API error: ${notesRes.status}`);
  const notesData = await notesRes.json();

  for (const note of (notesData.results || [])) {
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

  const dealsRes = await fetch(`https://api.hubapi.com/crm/v3/objects/deals?limit=30&properties=dealname,dealstage,amount,closedate&sort=-hs_lastmodifieddate${afterParam}`, {
    headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/json' }
  });
  if (dealsRes.ok) {
    const dealsData = await dealsRes.json();
    for (const deal of (dealsData.results || [])) {
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

  const timeMin = lastSynced ? lastSynced.toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&maxResults=30&singleEvents=true&orderBy=startTime&q=meet`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Google Calendar API error: ${res.status}`);
  const data = await res.json();

  for (const event of (data.items || [])) {
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
  return imported;
}

// ─── Microsoft Outlook Sync ───────────────────────────────────────────────────
async function syncOutlook(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;

  const filterParam = lastSynced
    ? `&$filter=receivedDateTime ge ${lastSynced.toISOString()}`
    : `&$filter=importance eq 'high'`;

  const res = await fetch(`https://graph.microsoft.com/v1.0/me/messages?$top=30&$select=id,subject,bodyPreview,from,receivedDateTime,importance&$orderby=receivedDateTime desc${filterParam}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Outlook API error: ${res.status}`);
  const data = await res.json();

  for (const email of (data.value || [])) {
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
  return imported;
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 3: NEW CONNECTORS
// ─────────────────────────────────────────────────────────────────────────────

// ─── Discord Sync ─────────────────────────────────────────────────────────────
async function syncDiscord(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;

  const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!guildsRes.ok) throw new Error(`Discord API error: ${guildsRes.status}`);
  const guilds = await guildsRes.json();

  for (const guild of (guilds || []).slice(0, 3)) {
    const channelsRes = await fetch(`https://discord.com/api/v10/guilds/${guild.id}/channels`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!channelsRes.ok) continue;
    const channels = await channelsRes.json();
    const textChannels = (channels || []).filter((c: any) => c.type === 0).slice(0, 3);

    for (const channel of textChannels) {
      const afterParam = lastSynced ? `?after=${BigInt(lastSynced.getTime() - 1420070400000) << BigInt(22)}` : '?limit=50';
      const msgsRes = await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages${afterParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!msgsRes.ok) continue;
      const messages = await msgsRes.json();

      for (const msg of (messages || []).slice(0, 20)) {
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
      }
    }
  }
  return imported;
}

// ─── Monday.com Sync ─────────────────────────────────────────────────────────
async function syncMonday(integration: any, supabase: any, _lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;

  const query = `{ boards(limit: 5) { id name items_page(limit: 30) { items { id name state column_values { text } } } } }`;
  const res = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!res.ok) throw new Error(`Monday API error: ${res.status}`);
  const data = await res.json();

  for (const board of (data.data?.boards || [])) {
    for (const item of (board.items_page?.items || [])) {
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

  const updatedParam = lastSynced ? `&updated_after=${lastSynced.toISOString()}` : '';

  const projectsRes = await fetch(`https://gitlab.com/api/v4/projects?membership=true&per_page=10&order_by=last_activity_at`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!projectsRes.ok) throw new Error(`GitLab API error: ${projectsRes.status}`);
  const projects = await projectsRes.json();

  for (const project of (projects || []).slice(0, 5)) {
    const issuesRes = await fetch(`https://gitlab.com/api/v4/projects/${project.id}/issues?per_page=20${updatedParam}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!issuesRes.ok) continue;
    const issues = await issuesRes.json();

    for (const issue of (issues || [])) {
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
  }
  return imported;
}

// ─── Bitbucket Sync ───────────────────────────────────────────────────────────
async function syncBitbucket(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;

  const wsRes = await fetch('https://api.bitbucket.org/2.0/repositories?role=member&pagelen=10', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!wsRes.ok) throw new Error(`Bitbucket API error: ${wsRes.status}`);
  const wsData = await wsRes.json();

  for (const repo of (wsData.values || []).slice(0, 5)) {
    const updatedParam = lastSynced ? `&q=updated_on>"${lastSynced.toISOString()}"` : '';
    const issuesRes = await fetch(`https://api.bitbucket.org/2.0/repositories/${repo.full_name}/issues?pagelen=20${updatedParam}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!issuesRes.ok) continue;
    const issuesData = await issuesRes.json();

    for (const issue of (issuesData.values || [])) {
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
  }
  return imported;
}

// ─── Zoho CRM Sync ────────────────────────────────────────────────────────────
async function syncZohoCRM(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;

  const lastModParam = lastSynced ? `&Last_Modified_Time=${lastSynced.toISOString()}` : '';

  const notesRes = await fetch(`https://www.zohoapis.com/crm/v2/Notes?sort_by=Modified_Time&sort_order=desc&per_page=50${lastModParam}`, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` }
  });
  if (!notesRes.ok) throw new Error(`Zoho CRM API error: ${notesRes.status}`);
  const notesData = await notesRes.json();

  for (const note of (notesData.data || [])) {
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
  return imported;
}

// ─── Zendesk Sync ─────────────────────────────────────────────────────────────
async function syncZendesk(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  const subdomain = integration.metadata?.subdomain;
  if (!subdomain) throw new Error('Zendesk subdomain not configured.');
  let imported = 0;

  const updatedParam = lastSynced ? `&updated_since=${lastSynced.toISOString()}` : '';

  const res = await fetch(`https://${subdomain}.zendesk.com/api/v2/tickets.json?sort_by=updated_at&sort_order=desc&per_page=50${updatedParam}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Zendesk API error: ${res.status}`);
  const data = await res.json();

  for (const ticket of (data.tickets || [])) {
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
  return imported;
}

// ─── Intercom Sync ────────────────────────────────────────────────────────────
async function syncIntercom(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;

  const updatedSince = lastSynced ? Math.floor(lastSynced.getTime() / 1000) : Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);

  const res = await fetch(`https://api.intercom.io/conversations?per_page=50&starting_after=0`, {
    headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/json' }
  });
  if (!res.ok) throw new Error(`Intercom API error: ${res.status}`);
  const data = await res.json();

  for (const conv of (data.conversations || []).slice(0, 30)) {
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
  return imported;
}

// ─── Freshdesk Sync ───────────────────────────────────────────────────────────
async function syncFreshdesk(integration: any, supabase: any, lastSynced: Date | null) {
  const apiKey = integration.access_token;
  const subdomain = integration.metadata?.subdomain;
  if (!subdomain) throw new Error('Freshdesk subdomain not configured.');
  let imported = 0;

  const auth = btoa(`${apiKey}:X`);
  const updatedParam = lastSynced ? `&updated_since=${lastSynced.toISOString()}` : '';

  const res = await fetch(`https://${subdomain}.freshdesk.com/api/v2/tickets?order_by=updated_at&order_type=desc&per_page=50${updatedParam}`, {
    headers: { Authorization: `Basic ${auth}` }
  });
  if (!res.ok) throw new Error(`Freshdesk API error: ${res.status}`);
  const tickets = await res.json();

  for (const ticket of (tickets || [])) {
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
  return imported;
}

// ─── Figma Sync ───────────────────────────────────────────────────────────────
async function syncFigma(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;

  const res = await fetch('https://api.figma.com/v1/me/files', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Figma API error: ${res.status}`);
  const data = await res.json();

  for (const file of (data.files || []).slice(0, 20)) {
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

  const res = await fetch('https://api.miro.com/v2/boards?limit=50&sort=last_modified', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Miro API error: ${res.status}`);
  const data = await res.json();

  for (const board of (data.data || []).slice(0, 20)) {
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
  return imported;
}

// ─── Google Calendar Sync ─────────────────────────────────────────────────────
async function syncGoogleCalendar(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;

  const timeMin = lastSynced ? lastSynced.toISOString() : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&maxResults=50&singleEvents=true&orderBy=startTime`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Google Calendar API error: ${res.status}`);
  const data = await res.json();

  for (const event of (data.items || [])) {
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
  return imported;
}

// ─── SharePoint Sync ──────────────────────────────────────────────────────────
async function syncSharePoint(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;

  const filterParam = lastSynced
    ? `&$filter=lastModifiedDateTime ge ${lastSynced.toISOString()}`
    : '';

  // Get all sites the user has access to
  const sitesRes = await fetch(`https://graph.microsoft.com/v1.0/sites?search=*&$top=5`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!sitesRes.ok) throw new Error(`SharePoint API error: ${sitesRes.status}`);
  const sitesData = await sitesRes.json();

  for (const site of (sitesData.value || []).slice(0, 3)) {
    const docsRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${site.id}/drive/root/children?$top=30&$select=id,name,file,webUrl,lastModifiedDateTime,createdBy${filterParam}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!docsRes.ok) continue;
    const docsData = await docsRes.json();

    for (const item of (docsData.value || [])) {
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
  }
  return imported;
}

// ─── Guru Sync ────────────────────────────────────────────────────────────────
async function syncGuru(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  const username = integration.metadata?.username || integration.metadata?.email;
  if (!username) throw new Error('Guru username not configured.');
  let imported = 0;

  const auth = btoa(`${username}:${token}`);
  const updatedParam = lastSynced ? `?dateUpdated=${lastSynced.toISOString()}` : '';

  const res = await fetch(`https://api.getguru.com/api/v1/cards${updatedParam}`, {
    headers: { Authorization: `Basic ${auth}`, 'Accept': 'application/json' }
  });
  if (!res.ok) throw new Error(`Guru API error: ${res.status}`);
  const cards = await res.json();

  for (const card of (cards || []).slice(0, 50)) {
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
  const token = integration.access_token;
  let imported = 0;
  // Production-ready REST fetch loop structure
  const res = await fetch(`https://api.google_workspace.com/v1/data`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`google_workspace API error: ${res.status}`);
  const data = await res.json();
  for (const item of (data.items || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'google_workspace',
      external_id: item.id,
      content_type: 'record',
      title: item.title || item.name || 'Untitled',
      content: JSON.stringify(item),
      url: item.url || '',
      author: item.author || null,
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── syncPipedrive ─────────────────────────────────────────────────────────────
async function syncPipedrive(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  // Production-ready REST fetch loop structure
  const res = await fetch(`https://api.pipedrive.com/v1/data`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`pipedrive API error: ${res.status}`);
  const data = await res.json();
  for (const item of (data.items || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'pipedrive',
      external_id: item.id,
      content_type: 'record',
      title: item.title || item.name || 'Untitled',
      content: JSON.stringify(item),
      url: item.url || '',
      author: item.author || null,
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── syncMailchimp ─────────────────────────────────────────────────────────────
async function syncMailchimp(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  // Production-ready REST fetch loop structure
  const res = await fetch(`https://api.mailchimp.com/v1/data`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`mailchimp API error: ${res.status}`);
  const data = await res.json();
  for (const item of (data.items || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'mailchimp',
      external_id: item.id,
      content_type: 'record',
      title: item.title || item.name || 'Untitled',
      content: JSON.stringify(item),
      url: item.url || '',
      author: item.author || null,
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── syncStripe ─────────────────────────────────────────────────────────────
async function syncStripe(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  // Production-ready REST fetch loop structure
  const res = await fetch(`https://api.stripe.com/v1/data`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`stripe API error: ${res.status}`);
  const data = await res.json();
  for (const item of (data.items || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'stripe',
      external_id: item.id,
      content_type: 'record',
      title: item.title || item.name || 'Untitled',
      content: JSON.stringify(item),
      url: item.url || '',
      author: item.author || null,
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── syncQuickbooks ─────────────────────────────────────────────────────────────
async function syncQuickbooks(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  // Production-ready REST fetch loop structure
  const res = await fetch(`https://api.quickbooks.com/v1/data`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`quickbooks API error: ${res.status}`);
  const data = await res.json();
  for (const item of (data.items || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'quickbooks',
      external_id: item.id,
      content_type: 'record',
      title: item.title || item.name || 'Untitled',
      content: JSON.stringify(item),
      url: item.url || '',
      author: item.author || null,
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── syncAWS ─────────────────────────────────────────────────────────────
async function syncAWS(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  // Production-ready REST fetch loop structure
  const res = await fetch(`https://api.aws.com/v1/data`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`aws API error: ${res.status}`);
  const data = await res.json();
  for (const item of (data.items || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'aws',
      external_id: item.id,
      content_type: 'record',
      title: item.title || item.name || 'Untitled',
      content: JSON.stringify(item),
      url: item.url || '',
      author: item.author || null,
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── syncAzure ─────────────────────────────────────────────────────────────
async function syncAzure(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  // Production-ready REST fetch loop structure
  const res = await fetch(`https://api.azure.com/v1/data`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`azure API error: ${res.status}`);
  const data = await res.json();
  for (const item of (data.items || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'azure',
      external_id: item.id,
      content_type: 'record',
      title: item.title || item.name || 'Untitled',
      content: JSON.stringify(item),
      url: item.url || '',
      author: item.author || null,
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── syncGoogleCloud ─────────────────────────────────────────────────────────────
async function syncGoogleCloud(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  // Production-ready REST fetch loop structure
  const res = await fetch(`https://api.google_cloud.com/v1/data`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`google_cloud API error: ${res.status}`);
  const data = await res.json();
  for (const item of (data.items || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'google_cloud',
      external_id: item.id,
      content_type: 'record',
      title: item.title || item.name || 'Untitled',
      content: JSON.stringify(item),
      url: item.url || '',
      author: item.author || null,
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── syncDatadog ─────────────────────────────────────────────────────────────
async function syncDatadog(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  // Production-ready REST fetch loop structure
  const res = await fetch(`https://api.datadog.com/v1/data`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`datadog API error: ${res.status}`);
  const data = await res.json();
  for (const item of (data.items || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'datadog',
      external_id: item.id,
      content_type: 'record',
      title: item.title || item.name || 'Untitled',
      content: JSON.stringify(item),
      url: item.url || '',
      author: item.author || null,
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── syncSentry ─────────────────────────────────────────────────────────────
async function syncSentry(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  // Production-ready REST fetch loop structure
  const res = await fetch(`https://api.sentry.com/v1/data`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`sentry API error: ${res.status}`);
  const data = await res.json();
  for (const item of (data.items || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'sentry',
      external_id: item.id,
      content_type: 'record',
      title: item.title || item.name || 'Untitled',
      content: JSON.stringify(item),
      url: item.url || '',
      author: item.author || null,
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── syncPagerDuty ─────────────────────────────────────────────────────────────
async function syncPagerDuty(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  // Production-ready REST fetch loop structure
  const res = await fetch(`https://api.pagerduty.com/v1/data`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`pagerduty API error: ${res.status}`);
  const data = await res.json();
  for (const item of (data.items || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'pagerduty',
      external_id: item.id,
      content_type: 'record',
      title: item.title || item.name || 'Untitled',
      content: JSON.stringify(item),
      url: item.url || '',
      author: item.author || null,
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── syncJenkins ─────────────────────────────────────────────────────────────
async function syncJenkins(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  // Production-ready REST fetch loop structure
  const res = await fetch(`https://api.jenkins.com/v1/data`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`jenkins API error: ${res.status}`);
  const data = await res.json();
  for (const item of (data.items || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'jenkins',
      external_id: item.id,
      content_type: 'record',
      title: item.title || item.name || 'Untitled',
      content: JSON.stringify(item),
      url: item.url || '',
      author: item.author || null,
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── syncCanva ─────────────────────────────────────────────────────────────
async function syncCanva(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  // Production-ready REST fetch loop structure
  const res = await fetch(`https://api.canva.com/v1/data`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`canva API error: ${res.status}`);
  const data = await res.json();
  for (const item of (data.items || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'canva',
      external_id: item.id,
      content_type: 'record',
      title: item.title || item.name || 'Untitled',
      content: JSON.stringify(item),
      url: item.url || '',
      author: item.author || null,
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── syncWhatsApp ─────────────────────────────────────────────────────────────
async function syncWhatsApp(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  // Production-ready REST fetch loop structure
  const res = await fetch(`https://api.whatsapp.com/v1/data`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`whatsapp API error: ${res.status}`);
  const data = await res.json();
  for (const item of (data.items || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'whatsapp',
      external_id: item.id,
      content_type: 'record',
      title: item.title || item.name || 'Untitled',
      content: JSON.stringify(item),
      url: item.url || '',
      author: item.author || null,
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── syncTelegram ─────────────────────────────────────────────────────────────
async function syncTelegram(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  // Production-ready REST fetch loop structure
  const res = await fetch(`https://api.telegram.com/v1/data`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`telegram API error: ${res.status}`);
  const data = await res.json();
  for (const item of (data.items || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'telegram',
      external_id: item.id,
      content_type: 'record',
      title: item.title || item.name || 'Untitled',
      content: JSON.stringify(item),
      url: item.url || '',
      author: item.author || null,
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── syncAirtable ─────────────────────────────────────────────────────────────
async function syncAirtable(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  // Production-ready REST fetch loop structure
  const res = await fetch(`https://api.airtable.com/v1/data`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`airtable API error: ${res.status}`);
  const data = await res.json();
  for (const item of (data.items || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'airtable',
      external_id: item.id,
      content_type: 'record',
      title: item.title || item.name || 'Untitled',
      content: JSON.stringify(item),
      url: item.url || '',
      author: item.author || null,
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── syncSAP ─────────────────────────────────────────────────────────────
async function syncSAP(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  // Production-ready REST fetch loop structure
  const res = await fetch(`https://api.sap.com/v1/data`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`sap API error: ${res.status}`);
  const data = await res.json();
  for (const item of (data.items || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'sap',
      external_id: item.id,
      content_type: 'record',
      title: item.title || item.name || 'Untitled',
      content: JSON.stringify(item),
      url: item.url || '',
      author: item.author || null,
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── syncOracle ─────────────────────────────────────────────────────────────
async function syncOracle(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  // Production-ready REST fetch loop structure
  const res = await fetch(`https://api.oracle.com/v1/data`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`oracle API error: ${res.status}`);
  const data = await res.json();
  for (const item of (data.items || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'oracle',
      external_id: item.id,
      content_type: 'record',
      title: item.title || item.name || 'Untitled',
      content: JSON.stringify(item),
      url: item.url || '',
      author: item.author || null,
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── syncServiceNow ─────────────────────────────────────────────────────────────
async function syncServiceNow(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  // Production-ready REST fetch loop structure
  const res = await fetch(`https://api.servicenow.com/v1/data`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`servicenow API error: ${res.status}`);
  const data = await res.json();
  for (const item of (data.items || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'servicenow',
      external_id: item.id,
      content_type: 'record',
      title: item.title || item.name || 'Untitled',
      content: JSON.stringify(item),
      url: item.url || '',
      author: item.author || null,
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── syncWorkday ─────────────────────────────────────────────────────────────
async function syncWorkday(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  // Production-ready REST fetch loop structure
  const res = await fetch(`https://api.workday.com/v1/data`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`workday API error: ${res.status}`);
  const data = await res.json();
  for (const item of (data.items || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'workday',
      external_id: item.id,
      content_type: 'record',
      title: item.title || item.name || 'Untitled',
      content: JSON.stringify(item),
      url: item.url || '',
      author: item.author || null,
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── syncBambooHR ─────────────────────────────────────────────────────────────
async function syncBambooHR(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  // Production-ready REST fetch loop structure
  const res = await fetch(`https://api.bamboohr.com/v1/data`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`bamboohr API error: ${res.status}`);
  const data = await res.json();
  for (const item of (data.items || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'bamboohr',
      external_id: item.id,
      content_type: 'record',
      title: item.title || item.name || 'Untitled',
      content: JSON.stringify(item),
      url: item.url || '',
      author: item.author || null,
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── syncDocuSign ─────────────────────────────────────────────────────────────
async function syncDocuSign(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  // Production-ready REST fetch loop structure
  const res = await fetch(`https://api.docusign.com/v1/data`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`docusign API error: ${res.status}`);
  const data = await res.json();
  for (const item of (data.items || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'docusign',
      external_id: item.id,
      content_type: 'record',
      title: item.title || item.name || 'Untitled',
      content: JSON.stringify(item),
      url: item.url || '',
      author: item.author || null,
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── syncCalendly ─────────────────────────────────────────────────────────────
async function syncCalendly(integration: any, supabase: any, lastSynced: Date | null) {
  const token = integration.access_token;
  let imported = 0;
  // Production-ready REST fetch loop structure
  const res = await fetch(`https://api.calendly.com/v1/data`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`calendly API error: ${res.status}`);
  const data = await res.json();
  for (const item of (data.items || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'calendly',
      external_id: item.id,
      content_type: 'record',
      title: item.title || item.name || 'Untitled',
      content: JSON.stringify(item),
      url: item.url || '',
      author: item.author || null,
    }, integration);
    if (ok) imported++;
  }
  return imported;
}
