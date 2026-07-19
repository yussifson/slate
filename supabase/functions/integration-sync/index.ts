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
        default:
          throw new Error(`Provider '${provider}' sync not yet implemented`);
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

// ─── Google Drive Sync ────────────────────────────────────────────────────────
async function syncGoogleDrive(integration, supabase) {
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
    // Export Google Docs as plain text
    if (file.mimeType === 'application/vnd.google-apps.document') {
      const exportRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (exportRes.ok) textContent = await exportRes.text();
    }

    const { error } = await supabase.from('clipad_imported_knowledge').upsert({
      company_id: integration.company_id,
      integration_id: integration.id,
      provider: 'google_drive',
      external_id: file.id,
      content_type: contentType,
      title: file.name,
      content: textContent.substring(0, 10000),
      url: file.webViewLink,
      author: file.owners?.[0]?.displayName || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'integration_id,external_id' });

    if (!error) {
      imported++;
      // Trigger AI processing async
      supabase.functions.invoke('integration-ai-processor', {
        body: { integrationId: integration.id, provider: 'google_drive', externalId: file.id }
      }).catch(() => {});
    }
  }
  return imported;
}

// ─── Notion Sync ─────────────────────────────────────────────────────────────
async function syncNotion(integration, supabase) {
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
    const url = page.url;

    const { error } = await supabase.from('clipad_imported_knowledge').upsert({
      company_id: integration.company_id,
      integration_id: integration.id,
      provider: 'notion',
      external_id: page.id,
      content_type: 'page',
      title,
      url,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'integration_id,external_id' });

    if (!error) {
      imported++;
      supabase.functions.invoke('integration-ai-processor', {
        body: { integrationId: integration.id, provider: 'notion', externalId: page.id }
      }).catch(() => {});
    }
  }
  return imported;
}

// ─── Slack Sync ───────────────────────────────────────────────────────────────
async function syncSlack(integration, supabase) {
  const token = integration.access_token;
  let imported = 0;

  // List channels
  const chRes = await fetch('https://slack.com/api/conversations.list?limit=50&types=public_channel,private_channel', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const chData = await chRes.json();
  if (!chData.ok) throw new Error(chData.error);

  for (const channel of (chData.channels || []).slice(0, 10)) {
    // Get recent messages
    const msgRes = await fetch(`https://slack.com/api/conversations.history?channel=${channel.id}&limit=30`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const msgData = await msgRes.json();
    if (!msgData.ok) continue;

    for (const msg of (msgData.messages || [])) {
      if (!msg.text || msg.subtype) continue;
      const { error } = await supabase.from('clipad_imported_knowledge').upsert({
        company_id: integration.company_id,
        integration_id: integration.id,
        provider: 'slack',
        external_id: `${channel.id}_${msg.ts}`,
        content_type: 'message',
        title: `#${channel.name}`,
        content: msg.text.substring(0, 2000),
        metadata: { channel_id: channel.id, channel_name: channel.name, ts: msg.ts },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'integration_id,external_id' });
      if (!error) imported++;
    }
  }
  return imported;
}

// ─── Zoom Sync ────────────────────────────────────────────────────────────────
async function syncZoom(integration, supabase) {
  const token = integration.access_token;
  let imported = 0;

  const res = await fetch('https://api.zoom.us/v2/users/me/recordings?page_size=30', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Zoom API error: ${res.status}`);
  const data = await res.json();

  for (const meeting of (data.meetings || [])) {
    const transcript = meeting.recording_files?.find((f: any) => f.file_type === 'TRANSCRIPT');
    const { error } = await supabase.from('clipad_imported_knowledge').upsert({
      company_id: integration.company_id,
      integration_id: integration.id,
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
      updated_at: new Date().toISOString(),
    }, { onConflict: 'integration_id,external_id' });

    if (!error) {
      imported++;
      supabase.functions.invoke('integration-ai-processor', {
        body: { integrationId: integration.id, provider: 'zoom', externalId: meeting.uuid }
      }).catch(() => {});
    }
  }
  return imported;
}

// ─── GitHub Sync ──────────────────────────────────────────────────────────────
async function syncGitHub(integration, supabase) {
  const token = integration.access_token;
  let imported = 0;

  // Get user's repos
  const repoRes = await fetch('https://api.github.com/user/repos?per_page=20&sort=updated', {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'CliPad-Integration' }
  });
  if (!repoRes.ok) throw new Error(`GitHub API error: ${repoRes.status}`);
  const repos = await repoRes.json();

  for (const repo of repos.slice(0, 5)) {
    // Get recent issues
    const issuesRes = await fetch(`https://api.github.com/repos/${repo.full_name}/issues?per_page=20&state=all`, {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'CliPad-Integration' }
    });
    if (!issuesRes.ok) continue;
    const issues = await issuesRes.json();

    for (const issue of issues) {
      const isPR = !!issue.pull_request;
      const { error } = await supabase.from('clipad_imported_knowledge').upsert({
        company_id: integration.company_id,
        integration_id: integration.id,
        provider: 'github',
        external_id: String(issue.id),
        content_type: isPR ? 'pull_request' : 'issue',
        title: `[${repo.name}] ${issue.title}`,
        content: issue.body?.substring(0, 3000) || '',
        url: issue.html_url,
        author: issue.user?.login,
        tags: issue.labels?.map((l: any) => l.name) || [],
        metadata: { repo: repo.full_name, number: issue.number, state: issue.state },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'integration_id,external_id' });
      if (!error) imported++;
    }
  }
  return imported;
}
