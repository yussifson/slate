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

    const credentials = [];
    
    const defaultToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
    const defaultAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    if (defaultToken && defaultAccountId) {
      credentials.push({ token: defaultToken, accountId: defaultAccountId });
    }

    for (let i = 2; i <= 10; i++) {
      const token = Deno.env.get(`CLOUDFLARE_API_TOKEN_${i}`);
      // Fallback to default account ID if they only supplied a new token but same account
      const accountId = Deno.env.get(`CLOUDFLARE_ACCOUNT_ID_${i}`) || defaultAccountId;
      if (token && accountId) {
        credentials.push({ token, accountId });
      }
    }

    if (credentials.length === 0) {
      throw new Error("Cloudflare credentials not configured");
    }

    const cfPayload = stream ? { ...payload, stream: true } : payload;
    let lastError = "Unknown error";

    for (let i = 0; i < credentials.length; i++) {
      const { token, accountId } = credentials[i];
      const isChatModel = model.includes('kimi') || model.includes('llama');
      const url = isChatModel
        ? `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`
        : `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
      
      const requestPayload = isChatModel ? { ...cfPayload, model } : cfPayload;

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        lastError = `Cloudflare AI Error on Account ${i + 1} (${resp.status}): ${errText}`;
        
        // Do not rotate on 400 (Bad payload) or 404 (Model/Account ID Not Found format)
        if (resp.status === 400 || resp.status === 404) {
          throw new Error(lastError);
        }
        
        // Rotate on 429 (Rate Limit), 403 (Forbidden/Out of credits), 401 (Invalid token), 500+ (Server error)
        continue;
      }

      // ── Streaming mode: pipe the Cloudflare SSE response directly to the client ──
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

      // ── Non-streaming mode: return full JSON response ──
      const data = await resp.json();

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If we exhaust all accounts and none succeeded
    throw new Error(`All accounts failed. Last error: ${lastError}`);

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
