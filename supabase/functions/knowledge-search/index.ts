import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Reciprocal Rank Fusion (RRF) ─────────────────────────────────────────────
// Industry standard constant: k=60 (Cormack et al. 2009)
// Formula: score(doc) = Σ 1/(k + rank) across all result lists
const RRF_K = 60;

function rrfScore(ranks: number[]): number {
  return ranks.reduce((sum, rank) => sum + 1 / (RRF_K + rank + 1), 0);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Default threshold lowered to 0.35 (from 0.5) to surface more relevant results
    const { query, company_id, match_count = 20, threshold = 0.35 } = await req.json();
    if (!query || !company_id) {
      return new Response(JSON.stringify({ error: 'Missing query or company_id' }), { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceKey = Deno.env.get('SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, serviceKey);

    const cloudflareAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    const cloudflareApiToken = Deno.env.get('CLOUDFLARE_API_TOKEN');

    let vectorResults: any[] = [];
    let fulltextResults: any[] = [];

    // ── TRACK 1: Vector Semantic Search ─────────────────────────────────────
    if (cloudflareAccountId && cloudflareApiToken) {
      try {
        // Generate query embedding via Cloudflare AI
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
            // Run both vector RPCs in parallel for maximum speed
            const [chunkRes, mainRes] = await Promise.all([
              supabase.rpc('match_knowledge_chunks', {
                query_embedding: queryEmbedding,
                match_company_id: company_id,
                match_threshold: threshold,
                match_count: match_count * 2
              }),
              supabase.rpc('match_knowledge', {
                query_embedding: queryEmbedding,
                match_company_id: company_id,
                match_threshold: threshold,
                match_count: match_count
              })
            ]);

            // Group chunk results by document ID, keeping highest similarity per doc
            const grouped = new Map<string, any>();
            if (!chunkRes.error && chunkRes.data?.length > 0) {
              for (const row of chunkRes.data) {
                if (!grouped.has(row.id)) {
                  grouped.set(row.id, { ...row, chunk_contents: [], similarity: row.similarity });
                }
                const doc = grouped.get(row.id);
                doc.chunk_contents.push(row.content);
                // Keep highest chunk similarity as the document score
                if (row.similarity > doc.similarity) doc.similarity = row.similarity;
              }
            }

            // Reconstruct documents from chunks
            let combined = Array.from(grouped.values()).map(doc => ({
              ...doc,
              content: doc.chunk_contents.join('\n\n[...]\n\n')
            }));

            // Append main (full-doc) results not already represented
            if (!mainRes.error && mainRes.data?.length > 0) {
              for (const row of mainRes.data) {
                if (!combined.some(c => c.id === row.id)) {
                  combined.push(row);
                }
              }
            }

            combined.sort((a, b) => b.similarity - a.similarity);
            vectorResults = combined.slice(0, match_count);
          }
        }
      } catch (err) {
        console.error('Vector search error:', err);
      }
    }

    // ── TRACK 2: Full-Text (BM25) Search ────────────────────────────────────
    // First try Postgres ts_search (GIN-indexed, fast). If column doesn't exist,
    // fall back to plain ilike (slower but always works).
    try {
      const ftQuery = query.trim().split(/\s+/).filter(Boolean).join(' ');
      const { data: ftResults, error: ftErr } = await supabase
        .from('clipad_imported_knowledge')
        .select('id, provider, content_type, title, content, ai_summary, url, author, ai_entities, imported_at')
        .eq('company_id', company_id)
        .textSearch('ts_search', ftQuery, { type: 'plain', config: 'english' })
        .order('imported_at', { ascending: false })
        .limit(match_count);

      if (!ftErr && ftResults && ftResults.length > 0) {
        // ts_search column exists and returned results
        fulltextResults = ftResults.map((r, i) => ({ ...r, similarity: 0.5, ft_rank: i }));
        console.log(`Full-text (ts_search) found ${fulltextResults.length} results`);
      } else {
        // ts_search column doesn't exist or returned nothing — use ilike fallback
        const { data: ilikeResults } = await supabase
          .from('clipad_imported_knowledge')
          .select('id, provider, content_type, title, content, ai_summary, url, author, ai_entities, imported_at')
          .eq('company_id', company_id)
          .or(`title.ilike.%${query}%,ai_summary.ilike.%${query}%,content.ilike.%${query}%`)
          .order('imported_at', { ascending: false })
          .limit(match_count);
        fulltextResults = (ilikeResults || []).map((r, i) => ({ ...r, similarity: 0.5, ft_rank: i }));
        console.log(`Full-text (ilike fallback) found ${fulltextResults.length} results`);
      }
    } catch (ftErr) {
      console.error('Full-text search error:', ftErr);
    }

    // ── HYBRID RRF FUSION ────────────────────────────────────────────────────
    let finalResults: any[];

    if (vectorResults.length === 0 && fulltextResults.length === 0) {
      finalResults = [];
    } else if (vectorResults.length === 0) {
      // Only full-text results available
      finalResults = fulltextResults.slice(0, match_count);
    } else if (fulltextResults.length === 0) {
      // Only vector results available
      finalResults = vectorResults.slice(0, match_count);
    } else {
      // Both available — apply Reciprocal Rank Fusion
      const vectorRankMap = new Map(vectorResults.map((r, i) => [r.id, i]));
      const ftRankMap     = new Map(fulltextResults.map((r, i) => [r.id, i]));

      // Collect all unique document IDs across both lists
      const allIds = new Set([
        ...vectorResults.map(r => r.id),
        ...fulltextResults.map(r => r.id)
      ]);

      // Score each document via RRF (rank 9999 = not in that list)
      const scored = Array.from(allIds).map(id => {
        const vectorRank = vectorRankMap.has(id) ? vectorRankMap.get(id)! : 9999;
        const ftRank     = ftRankMap.has(id)     ? ftRankMap.get(id)!     : 9999;
        const rrf        = rrfScore([vectorRank, ftRank]);
        const baseDoc    = vectorResults.find(r => r.id === id) || fulltextResults.find(r => r.id === id);
        return { ...baseDoc, rrf_score: rrf, similarity: rrf }; // expose rrf as similarity for UI consistency
      });

      scored.sort((a, b) => b.rrf_score - a.rrf_score);
      finalResults = scored.slice(0, match_count);
      console.log(`Hybrid RRF fusion: ${vectorResults.length} vector + ${fulltextResults.length} ft → ${finalResults.length} merged`);
    }

    // ── ENRICH: Fetch missing URLs ───────────────────────────────────────────
    const idsWithMissingUrls = finalResults.filter(r => !r.url).map(r => r.id);
    if (idsWithMissingUrls.length > 0) {
      const { data: dbRows } = await supabase
        .from('clipad_imported_knowledge')
        .select('id, url')
        .in('id', idsWithMissingUrls);
      if (dbRows) {
        finalResults = finalResults.map(r => {
          const row = dbRows.find(d => d.id === r.id);
          return row?.url ? { ...r, url: row.url } : r;
        });
      }
    }

    // Report which search strategy was used (useful for debugging)
    const source = vectorResults.length > 0 && fulltextResults.length > 0
      ? 'hybrid'
      : vectorResults.length > 0   ? 'vector'
      : fulltextResults.length > 0 ? 'fulltext'
      : 'none';

    console.log(`knowledge-search: source=${source}, returned ${finalResults.length} results`);

    return new Response(JSON.stringify({ results: finalResults, source }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
