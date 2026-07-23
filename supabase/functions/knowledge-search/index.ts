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
            // Run vector similarity search using new chunks RPC
            const { data: chunkResults, error: chunkErr } = await supabase.rpc('match_knowledge_chunks', {
              query_embedding: queryEmbedding,
              match_company_id: company_id,
              match_threshold: threshold,
              match_count: match_count * 2
            });

            // Run vector similarity search using original RPC for backwards compatibility
            const { data: mainResults, error: mainErr } = await supabase.rpc('match_knowledge', {
              query_embedding: queryEmbedding,
              match_company_id: company_id,
              match_threshold: threshold,
              match_count: match_count
            });

            let combined = [];
            
            // Process chunk results first
            if (!chunkErr && chunkResults?.length > 0) {
              const grouped = new Map();
              for (const row of chunkResults) {
                if (!grouped.has(row.id)) {
                  grouped.set(row.id, { ...row, chunk_contents: [] });
                }
                grouped.get(row.id).chunk_contents.push(row.content);
              }
              combined = Array.from(grouped.values()).map(doc => ({
                ...doc,
                content: doc.chunk_contents.join('\n\n[...]\n\n')
              }));
            }

            // Append main results that aren't already in combined
            if (!mainErr && mainResults?.length > 0) {
              for (const row of mainResults) {
                if (!combined.some(c => c.id === row.id)) {
                  combined.push(row);
                }
              }
            }

            // Sort by similarity descending and slice
            if (combined.length > 0) {
              combined.sort((a, b) => b.similarity - a.similarity);
              results = combined.slice(0, match_count);
              
              // Fetch missing URLs since RPC might not return them
              const idsWithMissingUrls = results.filter(r => !r.url).map(r => r.id);
              if (idsWithMissingUrls.length > 0) {
                const { data: dbRows } = await supabase
                  .from('clipad_imported_knowledge')
                  .select('id, url')
                  .in('id', idsWithMissingUrls);
                if (dbRows) {
                  results = results.map(r => {
                    const row = dbRows.find(d => d.id === r.id);
                    return row && row.url ? { ...r, url: row.url } : r;
                  });
                }
              }

              console.log(`Vector search found ${results.length} results (chunks + main)`);
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
