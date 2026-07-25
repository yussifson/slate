import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers": "content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { model, payload, stream = false } = await req.json();

    if (!model || !payload) {
      throw new Error("model and payload are required");
    }

    const cfToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
    const cfAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');

    if (!cfToken || !cfAccountId) {
      throw new Error("Cloudflare credentials not configured");
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${model}`;

    // When streaming is requested, inject stream:true into the CF payload
    const cfPayload = stream ? { ...payload, stream: true } : payload;

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${cfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cfPayload),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Cloudflare AI Error (${resp.status}): ${errText}`);
    }

    // ── Streaming mode: pipe the Cloudflare SSE response directly to the client ──
    // Cloudflare AI returns text/event-stream with lines like:
    //   data: {"response":"Hello"}\n\n
    //   data: [DONE]\n\n
    if (stream && resp.body) {
      return new Response(resp.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // ── Non-streaming mode: return full JSON response (unchanged behaviour) ──
    const data = await resp.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
