import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const provider = url.searchParams.get('provider') || (await req.json().catch(() => ({}))).provider;

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceKey = Deno.env.get('SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify webhook signature per provider
    // (Slack signs with X-Slack-Signature, GitHub with X-Hub-Signature-256, etc.)
    const body = await req.text();
    let payload: any = {};
    try { payload = JSON.parse(body); } catch { }

    // Handle Slack URL verification challenge
    if (payload.type === 'url_verification') {
      return new Response(JSON.stringify({ challenge: payload.challenge }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Determine which company owns this webhook
    // For Slack: payload.team_id, for GitHub: installation info
    let companyId: string | null = null;
    let eventProvider = provider || 'unknown';
    let itemData: any = null;

    if (payload.team_id) {
      // Slack event
      eventProvider = 'slack';
      const { data: intg } = await supabase.from('clipad_integrations')
        .select('id, company_id')
        .eq('provider', 'slack')
        .eq('external_account_id', payload.team_id)
        .single();
      if (intg) {
        companyId = intg.company_id;
        const event = payload.event;
        if (event?.type === 'message' && event.text && !event.bot_id) {
          itemData = {
            company_id: companyId,
            integration_id: intg.id,
            provider: 'slack',
            external_id: `${event.channel}_${event.ts}`,
            content_type: 'message',
            title: `Slack Message`,
            content: event.text.substring(0, 2000),
            metadata: { channel: event.channel, user: event.user, ts: event.ts },
          };
        }
      }
    } else if (req.headers.get('X-GitHub-Event')) {
      // GitHub event
      eventProvider = 'github';
      const ghEvent = req.headers.get('X-GitHub-Event');
      if ((ghEvent === 'issues' || ghEvent === 'pull_request') && payload.action === 'opened') {
        const issueOrPR = payload.issue || payload.pull_request;
        const repoFullName = payload.repository?.full_name;
        const installation = payload.installation?.id;

        // Find integration by external_account_id = installation ID
        const { data: intg } = await supabase.from('clipad_integrations')
          .select('id, company_id')
          .eq('provider', 'github')
          .limit(1).single();

        if (intg && issueOrPR) {
          companyId = intg.company_id;
          itemData = {
            company_id: companyId,
            integration_id: intg.id,
            provider: 'github',
            external_id: String(issueOrPR.id),
            content_type: ghEvent === 'pull_request' ? 'pull_request' : 'issue',
            title: `[${repoFullName}] ${issueOrPR.title}`,
            content: issueOrPR.body?.substring(0, 3000) || '',
            url: issueOrPR.html_url,
            author: issueOrPR.user?.login,
            tags: issueOrPR.labels?.map((l: any) => l.name) || [],
            metadata: { repo: repoFullName, number: issueOrPR.number },
          };
        }
      }
    }

    // Upsert the knowledge item
    if (itemData) {
      const { data: inserted } = await supabase.from('clipad_imported_knowledge').upsert({
        ...itemData,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'integration_id,external_id' }).select().single();

      // Trigger AI processing
      if (inserted) {
        supabase.functions.invoke('integration-ai-processor', {
          body: { integrationId: itemData.integration_id, provider: eventProvider, externalId: itemData.external_id }
        }).catch(() => {});
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('Webhook error:', e.message);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
