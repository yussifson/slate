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

    // Build rich text to process — handle all content types
    const contentParts = [];
    if (item.title) contentParts.push(`Title: ${item.title}`);
    if (item.content) contentParts.push(`Content:\n${item.content}`);
    
    // For items without content body, build from metadata
    if (!item.content && item.metadata) {
      const meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata;
      if (meta?.channel_name) contentParts.push(`Channel: #${meta.channel_name}`);
      if (meta?.repo) contentParts.push(`Repository: ${meta.repo}`);
      if (meta?.state) contentParts.push(`State: ${meta.state}`);
      if (meta?.duration) contentParts.push(`Duration: ${meta.duration} minutes`);
      if (meta?.start_time) contentParts.push(`Date: ${meta.start_time}`);
      if (meta?.participants) contentParts.push(`Participants: ${meta.participants}`);
    }
    
    if (item.author) contentParts.push(`Author: ${item.author}`);
    if (item.tags?.length) contentParts.push(`Tags: ${item.tags.join(', ')}`);
    
    const textToProcess = contentParts.join('\n\n').substring(0, 4000);

    // Always generate at least a basic summary — never skip
    let aiSummary: string | null = null;
    let aiActionItems: string[] | null = null;
    let aiEntities: Record<string, any> | null = null;
    let aiKeywords: string[] | null = null;

    if (cloudflareAccountId && cloudflareApiToken && textToProcess.trim().length > 20) {
      try {
        const prompt = `You are an organizational knowledge assistant. Analyze this ${provider} ${item.content_type || 'item'} and return ONLY valid JSON with these exact keys:
- "summary": concise 2-3 sentence summary of what this content is about
- "action_items": array of strings (actionable tasks found, max 5, or empty array)
- "entities": object with "people" (names mentioned), "projects" (project/product names), "dates" (important dates mentioned)  
- "keywords": array of 5-8 key topic words from the content

Content:
${textToProcess}`;

        const cfRes = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${cloudflareApiToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [
                { role: 'system', content: 'You are a data extraction AI. Always respond with ONLY valid JSON, no markdown, no code fences.' },
                { role: 'user', content: prompt }
              ],
              max_tokens: 600
            })
          }
        );

        if (cfRes.ok) {
          const cfData = await cfRes.json();
          let raw = cfData.result?.response || '';
          raw = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          // Handle if wrapped in outer JSON
          if (raw.startsWith('{')) {
            const parsed = JSON.parse(raw);
            aiSummary = parsed.summary || null;
            aiActionItems = Array.isArray(parsed.action_items) ? parsed.action_items : null;
            aiEntities = parsed.entities || null;
            aiKeywords = Array.isArray(parsed.keywords) ? parsed.keywords : null;
          }
        }
      } catch (e) {
        console.warn('AI processing failed:', e.message);
      }
    }

    // Always ensure a summary exists — fallback to content excerpt
    if (!aiSummary) {
      if (item.content && item.content.length > 50) {
        aiSummary = item.content.substring(0, 300) + (item.content.length > 300 ? '...' : '');
      } else if (item.title) {
        aiSummary = `${item.content_type || 'Item'} from ${provider}: "${item.title}"`;
        if (item.author) aiSummary += ` by ${item.author}`;
      }
    }

    // Save AI results
    const updatePayload: Record<string, any> = {
      ai_summary: aiSummary,
      updated_at: new Date().toISOString(),
    };
    if (aiActionItems) updatePayload.ai_action_items = aiActionItems;
    if (aiEntities) updatePayload.ai_entities = aiEntities;
    if (aiKeywords) updatePayload.tags = aiKeywords;

    const { error: updateErr } = await supabase
      .from('clipad_imported_knowledge')
      .update(updatePayload)
      .eq('integration_id', integrationId)
      .eq('external_id', externalId);

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
