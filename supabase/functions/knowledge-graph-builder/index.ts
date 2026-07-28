import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { company_id = null, limit = 50 } = await req.json();
    if (company_id === undefined) {
      return new Response(JSON.stringify({ error: 'Missing company_id parameter' }), { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceKey = Deno.env.get('SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, serviceKey);

    const cloudflareAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    const cloudflareApiToken = Deno.env.get('CLOUDFLARE_API_TOKEN');

    // Fetch recent knowledge items that haven't been relationship-mapped
    const { data: items } = await supabase
      .from('clipad_imported_knowledge')
      .select('id, provider, content_type, title, content, ai_summary, ai_entities, external_id')
      .eq('company_id', company_id)
      .not('ai_summary', 'is', null)
      .order('imported_at', { ascending: false })
      .limit(limit);

    if (!items || items.length < 2) {
      return new Response(JSON.stringify({ success: true, relationships: 0, message: 'Not enough items to map relationships' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let relationshipsCreated = 0;

    if (cloudflareAccountId && cloudflareApiToken) {
      // Build a compact catalog for the AI to work with
      const catalog = items.map(item => ({
        id: item.id,
        provider: item.provider,
        type: item.content_type,
        title: item.title,
        summary: item.ai_summary?.substring(0, 200),
        entities: item.ai_entities,
        external_id: item.external_id
      }));

      // Process in batches of 10 to find relationships
      for (let i = 0; i < Math.min(items.length, 20); i++) {
        const sourceItem = items[i];
        const otherItems = catalog.filter((_, idx) => idx !== i).slice(0, 15);

        const prompt = `You are a knowledge graph AI. Analyze the SOURCE item and the CANDIDATE items. 
Find meaningful relationships between the source and candidates.
Return ONLY a valid JSON array. Each element has:
- "target_id": the UUID of the related candidate
- "relationship_type": one of "mentions", "continues", "implements", "blocks", "references", "related"
- "confidence_score": float 0.0-1.0

Only return relationships with confidence >= 0.6. Return [] if no strong relationships.

SOURCE:
${JSON.stringify({ id: sourceItem.id, provider: sourceItem.provider, type: sourceItem.content_type, title: sourceItem.title, summary: sourceItem.ai_summary?.substring(0, 300), entities: sourceItem.ai_entities })}

CANDIDATES:
${JSON.stringify(otherItems)}`;

        try {
          const cfRes = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/ai/run/@cf/moonshotai/kimi-k2.5`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${cloudflareApiToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                messages: [
                  { role: 'system', content: 'You are a knowledge graph builder. Respond with ONLY valid JSON array.' },
                  { role: 'user', content: prompt }
                ],
                max_tokens: 400
              })
            }
          );

          if (!cfRes.ok) continue;
          const cfData = await cfRes.json();
          const rawText = cfData?.result?.response || '';
          const cleaned = rawText.replace(/```json|```/g, '').trim();

          let relationships: any[] = [];
          try {
            relationships = JSON.parse(cleaned);
            if (!Array.isArray(relationships)) relationships = [];
          } catch { continue; }

          for (const rel of relationships) {
            if (!rel.target_id || !rel.relationship_type || rel.confidence_score < 0.6) continue;

            // Check if relationship already exists
            const { data: existing } = await supabase
              .from('clipad_knowledge_relationships')
              .select('id')
              .eq('source_id', sourceItem.id)
              .eq('target_id', rel.target_id)
              .limit(1);

            if (existing && existing.length > 0) continue;

            const { error: relErr } = await supabase.from('clipad_knowledge_relationships').insert({
              company_id,
              source_id: sourceItem.id,
              target_id: rel.target_id,
              relationship_type: rel.relationship_type,
              confidence_score: rel.confidence_score,
              ai_detected: true,
            });

            if (!relErr) relationshipsCreated++;
          }
        } catch (err) {
          console.error(`Relationship mapping error for item ${i}:`, err.message);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, relationships: relationshipsCreated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
