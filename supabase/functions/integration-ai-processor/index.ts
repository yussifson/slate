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

    // Build rich text to process
    const contentParts = [];
    if (item.title) contentParts.push(`Title: ${item.title}`);
    if (item.content) contentParts.push(`Content:\n${item.content}`);
    if (!item.content && item.metadata) {
      const meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata;
      if (meta?.channel_name) contentParts.push(`Channel: #${meta.channel_name}`);
      if (meta?.repo) contentParts.push(`Repository: ${meta.repo}`);
      if (meta?.state) contentParts.push(`State: ${meta.state}`);
      if (meta?.duration) contentParts.push(`Duration: ${meta.duration} minutes`);
      if (meta?.start_time) contentParts.push(`Date: ${meta.start_time}`);
      if (meta?.participants) contentParts.push(`Participants: ${meta.participants}`);
      if (meta?.board) contentParts.push(`Board: ${meta.board}`);
      if (meta?.project) contentParts.push(`Project: ${meta.project}`);
    }
    if (item.author) contentParts.push(`Author: ${item.author}`);
    if (item.tags?.length) contentParts.push(`Tags: ${item.tags.join(', ')}`);

    const textToProcess = contentParts.join('\n\n').substring(0, 4000);

    let aiSummary: string | null = null;
    let aiActionItems: string[] | null = null;
    let aiEntities: Record<string, any> | null = null;
    let aiKeywords: string[] | null = null;
    let embedding: number[] | null = null;

    if (cloudflareAccountId && cloudflareApiToken && textToProcess.trim().length > 20) {
      // ── Step 1: Generate AI summary, entities, actions, keywords ────────
      try {
        const prompt = `You are an organizational knowledge assistant. Analyze this ${provider} ${item.content_type || 'item'} and return ONLY valid JSON with these exact keys:
- "summary": concise 2-3 sentence summary of what this content is about
- "action_items": array of strings (actionable tasks found, max 5, or empty array)
- "entities": object with "people" (names mentioned), "projects" (project/product names), "dates" (important dates mentioned), "decisions" (key decisions made)
- "keywords": array of 5-8 key topic words from the content
- "risks": array of potential risks or blockers identified (max 3, or empty array)

Content:
${textToProcess}`;

        const cfRes = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${cloudflareApiToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [
                { role: 'system', content: 'You are a data extraction AI. Always respond with ONLY valid JSON.' },
                { role: 'user', content: prompt }
              ],
              max_tokens: 600
            })
          }
        );

        if (cfRes.ok) {
          const cfData = await cfRes.json();
          const rawText = cfData?.result?.response || '';
          const cleaned = rawText.replace(/```json|```/g, '').trim();
          try {
            const parsed = JSON.parse(cleaned);
            aiSummary = parsed.summary || null;
            aiActionItems = Array.isArray(parsed.action_items) ? parsed.action_items : null;
            aiEntities = parsed.entities || null;
            aiKeywords = Array.isArray(parsed.keywords) ? parsed.keywords : null;
          } catch {
            // Extract summary from plain text if JSON parse fails
            aiSummary = rawText.length > 50 ? rawText.substring(0, 300) : null;
          }
        }
      } catch (err) {
        console.error('AI summarization error:', err);
      }

      // ── Step 2: Generate vector embedding for semantic search ────────────
      try {
        const embeddingText = [item.title, aiSummary, item.content?.substring(0, 1000)].filter(Boolean).join('\n').substring(0, 2000);

        const embRes = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/ai/run/@cf/baai/bge-base-en-v1.5`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${cloudflareApiToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: [embeddingText] })
          }
        );

        if (embRes.ok) {
          const embData = await embRes.json();
          embedding = embData?.result?.data?.[0] || null;
        }
      } catch (err) {
        console.error('Embedding generation error:', err);
      }
    }

    // Fallback summary if AI is unavailable
    if (!aiSummary) {
      aiSummary = `${item.content_type || 'Item'} from ${provider}: ${item.title || 'Untitled'}`;
    }

    // ── Update the knowledge item with AI results ────────────────────────
    const updatePayload: Record<string, any> = {
      ai_summary: aiSummary,
      ai_action_items: aiActionItems,
      ai_entities: aiEntities,
      ai_keywords: aiKeywords,
    };

    if (embedding) {
      updatePayload.embedding = JSON.stringify(embedding);
    }

    const { error: updateErr } = await supabase
      .from('clipad_imported_knowledge')
      .update(updatePayload)
      .eq('integration_id', integrationId)
      .eq('external_id', externalId);

    if (updateErr) {
      console.error('Update error:', updateErr.message);
    }

    // ── Step 3: Store detected risks as org events ───────────────────────
    if (aiEntities?.decisions?.length > 0 || (aiActionItems && aiActionItems.length > 0)) {
      try {
        // Write org event for significant content
        await supabase.from('clipad_org_events').insert({
          workspace_id: item.company_id,
          event_type: 'knowledge_indexed',
          title: `Knowledge indexed: ${item.title?.substring(0, 60) || 'Untitled'}`,
          description: `AI processed ${provider} ${item.content_type || 'item'}${aiActionItems?.length ? ` — ${aiActionItems.length} action items found` : ''}`,
          source_id: item.id,
          source_table: 'clipad_imported_knowledge',
          importance: aiActionItems?.length > 0 ? 5 : 3,
        }).catch(() => {});
      } catch { /* ignore */ }
    }

    return new Response(JSON.stringify({ success: true, hasSummary: !!aiSummary, hasEmbedding: !!embedding }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
