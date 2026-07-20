import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { query, company_id, match_count = 20, threshold = 0.5 } = await req.json();
    if (!query || !company_id) {
      return new Response(JSON.stringify({ error: 'Missing query or company_id' }), { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceKey = Deno.env.get('SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, serviceKey);

    const cloudflareAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    const cloudflareApiToken = Deno.env.get('CLOUDFLARE_API_TOKEN');

    let results: any[] = [];

    // ── Step 1: Try vector semantic search ──────────────────────────────────
    if (cloudflareAccountId && cloudflareApiToken) {
      try {
        // Generate query embedding
        const embRes = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/ai/run/@cf/baai/bge-base-en-v1.5`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${cloudflareApiToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: [query] })
          }
        );

        if (embRes.ok) {
          const embData = await embRes.json();
          const queryEmbedding = embData?.result?.data?.[0];

          if (queryEmbedding) {
            // Run vector similarity search using pgvector RPC
            const { data: vectorResults, error: vecErr } = await supabase.rpc('match_knowledge', {
              query_embedding: queryEmbedding,
              match_company_id: company_id,
              match_threshold: threshold,
              match_count
            });

            if (!vecErr && vectorResults?.length > 0) {
              results = vectorResults;
              console.log(`Vector search found ${results.length} results`);
            }
          }
        }
      } catch (err) {
        console.error('Vector search error:', err);
      }
    }

    // ── Step 2: Fallback to text/keyword search if vector search empty ──────
    if (results.length === 0) {
      const { data: textResults } = await supabase
        .from('clipad_imported_knowledge')
        .select('id, provider, content_type, title, content, ai_summary, url, author, ai_entities, imported_at')
        .eq('company_id', company_id)
        .or(`title.ilike.%${query}%,ai_summary.ilike.%${query}%,content.ilike.%${query}%`)
        .order('imported_at', { ascending: false })
        .limit(match_count);

      results = (textResults || []).map(r => ({ ...r, similarity: 0.5 }));
      console.log(`Text search found ${results.length} results`);
    }

    return new Response(JSON.stringify({ results, source: results.length > 0 ? 'vector' : 'none' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
