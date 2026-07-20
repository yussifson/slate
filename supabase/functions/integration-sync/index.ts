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

    let imported = 0;
    let syncError = null;

    try {
      switch (provider) {
        // ── PHASE 1: Fully implemented ────────────────────────────────────────
        case 'google_drive':
          imported = await syncGoogleDrive(integration, supabase);
          break;
        case 'notion':
          imported = await syncNotion(integration, supabase);
          break;
        case 'slack':
          imported = await syncSlack(integration, supabase);
          break;
        case 'zoom':
          imported = await syncZoom(integration, supabase);
          break;
        case 'github':
          imported = await syncGitHub(integration, supabase);
          break;

        // ── PHASE 2: New implementations ──────────────────────────────────────
        case 'microsoft_onedrive':
          imported = await syncOneDrive(integration, supabase);
          break;
        case 'ms_teams':
          imported = await syncMSTeams(integration, supabase);
          break;
        case 'gmail':
          imported = await syncGmail(integration, supabase);
          break;
        case 'jira':
          imported = await syncJira(integration, supabase);
          break;
        case 'confluence':
          imported = await syncConfluence(integration, supabase);
          break;
        case 'clickup':
          imported = await syncClickUp(integration, supabase);
          break;
        case 'asana':
          imported = await syncAsana(integration, supabase);
          break;
        case 'linear':
          imported = await syncLinear(integration, supabase);
          break;
        case 'trello':
          imported = await syncTrello(integration, supabase);
          break;
        case 'dropbox':
          imported = await syncDropbox(integration, supabase);
          break;
        case 'box':
          imported = await syncBox(integration, supabase);
          break;
        case 'salesforce':
          imported = await syncSalesforce(integration, supabase);
          break;
        case 'hubspot':
          imported = await syncHubSpot(integration, supabase);
          break;
        case 'google_meet':
          imported = await syncGoogleMeet(integration, supabase);
          break;
        case 'outlook':
          imported = await syncOutlook(integration, supabase);
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
async function syncGoogleDrive(integration: any, supabase: any) {
  const token = integration.access_token;
  let imported = 0;

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?pageSize=50&fields=files(id,name,mimeType,webViewLink,modifiedTime,owners)&q=trashed=false`,
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
async function syncNotion(integration: any, supabase: any) {
  const token = integration.access_token;
  let imported = 0;

  const res = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ filter: { value: 'page', property: 'object' }, page_size: 50 })
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
async function syncSlack(integration: any, supabase: any) {
  const token = integration.access_token;
  let imported = 0;

  const chRes = await fetch('https://slack.com/api/conversations.list?limit=50&types=public_channel,private_channel', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const chData = await chRes.json();
  if (!chData.ok) throw new Error(chData.error);

  for (const channel of (chData.channels || []).slice(0, 10)) {
    const msgRes = await fetch(`https://slack.com/api/conversations.history?channel=${channel.id}&limit=30`, {
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
async function syncZoom(integration: any, supabase: any) {
  const token = integration.access_token;
  let imported = 0;

  const res = await fetch('https://api.zoom.us/v2/users/me/recordings?page_size=30', {
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
async function syncGitHub(integration: any, supabase: any) {
  const token = integration.access_token;
  let imported = 0;

  const repoRes = await fetch('https://api.github.com/user/repos?per_page=20&sort=updated', {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'CliPad-Integration' }
  });
  if (!repoRes.ok) throw new Error(`GitHub API error: ${repoRes.status}`);
  const repos = await repoRes.json();

  for (const repo of repos.slice(0, 5)) {
    const issuesRes = await fetch(`https://api.github.com/repos/${repo.full_name}/issues?per_page=20&state=all`, {
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
async function syncOneDrive(integration: any, supabase: any) {
  const token = integration.access_token;
  let imported = 0;

  const res = await fetch('https://graph.microsoft.com/v1.0/me/drive/root/children?$top=50&$select=id,name,file,webUrl,lastModifiedDateTime,createdBy', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`OneDrive API error: ${res.status}`);
  const data = await res.json();

  for (const item of (data.value || [])) {
    if (!item.file) continue; // skip folders

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
async function syncMSTeams(integration: any, supabase: any) {
  const token = integration.access_token;
  let imported = 0;

  // Get joined teams
  const teamsRes = await fetch('https://graph.microsoft.com/v1.0/me/joinedTeams', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!teamsRes.ok) throw new Error(`Teams API error: ${teamsRes.status}`);
  const teamsData = await teamsRes.json();

  for (const team of (teamsData.value || []).slice(0, 5)) {
    // Get channels
    const chRes = await fetch(`https://graph.microsoft.com/v1.0/teams/${team.id}/channels`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!chRes.ok) continue;
    const chData = await chRes.json();

    for (const channel of (chData.value || []).slice(0, 3)) {
      // Get messages
      const msgRes = await fetch(`https://graph.microsoft.com/v1.0/teams/${team.id}/channels/${channel.id}/messages?$top=20`, {
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
async function syncGmail(integration: any, supabase: any) {
  const token = integration.access_token;
  let imported = 0;

  // Get recent emails
  const listRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=30&q=is:important', {
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
    const snippet = msg.snippet || '';

    const ok = await upsertKnowledge(supabase, {
      provider: 'gmail',
      external_id: msg.id,
      content_type: 'email',
      title: subject,
      content: snippet.substring(0, 2000),
      author: from,
      metadata: { date, threadId: msg.threadId, labelIds: msg.labelIds },
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── Jira Sync ────────────────────────────────────────────────────────────────
async function syncJira(integration: any, supabase: any) {
  const token = integration.access_token;
  const baseUrl = integration.metadata?.base_url || integration.config?.base_url;
  if (!baseUrl) throw new Error('Jira base URL not configured. Please reconnect and provide your Jira domain.');
  let imported = 0;

  const res = await fetch(`${baseUrl}/rest/api/3/search?jql=updated>=-30d&maxResults=50&fields=summary,description,status,assignee,priority,issuetype,project,updated`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Accept': 'application/json'
    }
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
      title: `[${fields.project?.key}-${issue.key?.split('-')[1]}] ${fields.summary}`,
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
async function syncConfluence(integration: any, supabase: any) {
  const token = integration.access_token;
  const baseUrl = integration.metadata?.base_url || integration.config?.base_url;
  if (!baseUrl) throw new Error('Confluence base URL not configured.');
  let imported = 0;

  const res = await fetch(`${baseUrl}/rest/api/content?type=page&limit=50&expand=body.storage,space,history`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  if (!res.ok) throw new Error(`Confluence API error: ${res.status}`);
  const data = await res.json();

  for (const page of (data.results || [])) {
    // Strip HTML from body
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
async function syncClickUp(integration: any, supabase: any) {
  const token = integration.access_token;
  let imported = 0;

  // Get teams
  const teamsRes = await fetch('https://api.clickup.com/api/v2/team', {
    headers: { Authorization: token }
  });
  if (!teamsRes.ok) throw new Error(`ClickUp API error: ${teamsRes.status}`);
  const teamsData = await teamsRes.json();

  for (const team of (teamsData.teams || []).slice(0, 2)) {
    const tasksRes = await fetch(`https://api.clickup.com/api/v2/team/${team.id}/task?page=0&order_by=updated&subtasks=true&include_closed=true`, {
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
async function syncAsana(integration: any, supabase: any) {
  const token = integration.access_token;
  let imported = 0;

  // Get user's workspaces
  const wsRes = await fetch('https://app.asana.com/api/1.0/workspaces', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!wsRes.ok) throw new Error(`Asana API error: ${wsRes.status}`);
  const wsData = await wsRes.json();

  for (const ws of (wsData.data || []).slice(0, 2)) {
    const tasksRes = await fetch(`https://app.asana.com/api/1.0/tasks?workspace=${ws.gid}&assignee=me&opt_fields=gid,name,notes,completed,due_on,assignee.name,projects.name,permalink_url&limit=50`, {
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
async function syncLinear(integration: any, supabase: any) {
  const token = integration.access_token;
  let imported = 0;

  const query = `{
    issues(first: 50, orderBy: updatedAt) {
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
async function syncTrello(integration: any, supabase: any) {
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
        metadata: { board: board.name, due: card.due, listId: card.idList },
      }, integration);
      if (ok) imported++;
    }
  }
  return imported;
}

// ─── Dropbox Sync ─────────────────────────────────────────────────────────────
async function syncDropbox(integration: any, supabase: any) {
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
      url: entry.preview_url || null,
      metadata: { size: entry.size, modified: entry.client_modified, path: entry.path_display },
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── Box Sync ─────────────────────────────────────────────────────────────────
async function syncBox(integration: any, supabase: any) {
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
async function syncSalesforce(integration: any, supabase: any) {
  const token = integration.access_token;
  const instanceUrl = integration.metadata?.instance_url || integration.config?.instance_url;
  if (!instanceUrl) throw new Error('Salesforce instance URL not configured.');
  let imported = 0;

  // Query recent Notes and ContentNotes
  const notesRes = await fetch(`${instanceUrl}/services/data/v57.0/query?q=SELECT+Id,Title,Body,CreatedDate,CreatedBy.Name+FROM+Note+ORDER+BY+CreatedDate+DESC+LIMIT+30`, {
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
async function syncHubSpot(integration: any, supabase: any) {
  const token = integration.access_token;
  let imported = 0;

  // Get recent notes
  const notesRes = await fetch('https://api.hubapi.com/crm/v3/objects/notes?limit=50&properties=hs_note_body,hs_timestamp,hubspot_owner_id&sort=-hs_timestamp', {
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
      metadata: { timestamp: note.properties?.hs_timestamp, ownerId: note.properties?.hubspot_owner_id },
    }, integration);
    if (ok) imported++;
  }

  // Also get recent deals
  const dealsRes = await fetch('https://api.hubapi.com/crm/v3/objects/deals?limit=30&properties=dealname,dealstage,amount,closedate&sort=-hs_lastmodifieddate', {
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
        metadata: { stage: deal.properties?.dealstage, amount: deal.properties?.amount, closedate: deal.properties?.closedate },
      }, integration);
      if (ok) imported++;
    }
  }
  return imported;
}

// ─── Google Meet Sync (via Calendar API) ─────────────────────────────────────
async function syncGoogleMeet(integration: any, supabase: any) {
  const token = integration.access_token;
  let imported = 0;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${thirtyDaysAgo}&maxResults=30&singleEvents=true&orderBy=startTime&q=meet`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Google Calendar API error: ${res.status}`);
  const data = await res.json();

  for (const event of (data.items || [])) {
    if (!event.conferenceData) continue; // Only process Meet events
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
      metadata: {
        start: event.start?.dateTime,
        end: event.end?.dateTime,
        attendeeCount: event.attendees?.length || 0,
        status: event.status
      },
    }, integration);
    if (ok) imported++;
  }
  return imported;
}

// ─── Microsoft Outlook Sync ───────────────────────────────────────────────────
async function syncOutlook(integration: any, supabase: any) {
  const token = integration.access_token;
  let imported = 0;

  const res = await fetch("https://graph.microsoft.com/v1.0/me/messages?$top=30&$select=id,subject,bodyPreview,from,receivedDateTime,importance&$filter=importance eq 'high'&$orderby=receivedDateTime desc", {
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
