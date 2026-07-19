import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { integrationId, provider, externalId } = await req.json();
    if (!integrationId || !provider || !externalId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceKey = Deno.env.get('SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, serviceKey);

    const cloudflareAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    const cloudflareApiToken = Deno.env.get('CLOUDFLARE_API_TOKEN');

    // Fetch the knowledge item
    const { data: item, error: itemErr } = await supabase
      .from('clipad_imported_knowledge')
      .select('*')
      .eq('integration_id', integrationId)
      .eq('external_id', externalId)
      .single();

    if (itemErr || !item) {
      return new Response(JSON.stringify({ error: 'Knowledge item not found' }), { status: 404, headers: corsHeaders });
    }

    const textToProcess = [item.title, item.content].filter(Boolean).join('\n\n').substring(0, 4000);
    if (!textToProcess.trim()) {
      return new Response(JSON.stringify({ skipped: true, reason: 'No content to process' }), { headers: corsHeaders });
    }

    let aiSummary = null;
    let aiActionItems = null;
    let aiEntities = null;

    // Use Cloudflare AI if available
    if (cloudflareAccountId && cloudflareApiToken) {
      try {
        const prompt = `You are an organizational knowledge assistant. Analyze the following content from ${provider} and return ONLY valid JSON with these keys:
- "summary": a concise 2-3 sentence summary
- "action_items": array of strings (actionable tasks found, max 5)
- "entities": object with "people" (names mentioned), "projects" (project names), "dates" (dates/deadlines mentioned)

Content:
${textToProcess}`;

        const cfRes = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${cloudflareApiToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], max_tokens: 800 })
          }
        );

        if (cfRes.ok) {
          const cfData = await cfRes.json();
          let raw = cfData.result?.response || '';
          // Strip markdown code blocks if present
          raw = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(raw);
          aiSummary = parsed.summary || null;
          aiActionItems = parsed.action_items || null;
          aiEntities = parsed.entities || null;
        }
      } catch (e) {
        console.warn('AI processing failed:', e.message);
        // Fallback: generate a basic summary from first 200 chars
        aiSummary = textToProcess.substring(0, 200) + '...';
      }
    } else {
      // No AI credentials — create a basic auto-summary from content
      aiSummary = textToProcess.substring(0, 300) + (textToProcess.length > 300 ? '...' : '');
    }

    // Save AI results
    const { error: updateErr } = await supabase.from('clipad_imported_knowledge').update({
      ai_summary: aiSummary,
      ai_action_items: aiActionItems,
      ai_entities: aiEntities,
      updated_at: new Date().toISOString(),
    }).eq('integration_id', integrationId).eq('external_id', externalId);

    if (updateErr) throw updateErr;

    // If action items found, create clipad_action_items entries
    if (aiActionItems && Array.isArray(aiActionItems) && aiActionItems.length > 0) {
      const actionItemRows = aiActionItems.map((title: string) => ({
        space_id: item.space_id || null,
        title: title.substring(0, 255),
        context: `Imported from ${provider}: ${item.title}`,
        is_complete: false,
        source: `integration_${provider}`,
        company_id: item.company_id,
      }));

      await supabase.from('clipad_action_items').insert(actionItemRows).select();
    }

    return new Response(JSON.stringify({ success: true, aiSummary, actionItemsCreated: aiActionItems?.length || 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e) {
    console.error('AI Processor error:', e.message);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
