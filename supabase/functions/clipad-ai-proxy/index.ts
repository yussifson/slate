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

    console.log(`[AI Proxy] Starting request with model=${model}, accounts available=${credentials.length}`);

    const cfPayload = stream ? { ...payload, stream: true } : payload;
    let lastError = "Unknown error";
    const errors: string[] = [];

    for (let i = 0; i < credentials.length; i++) {
      const { token, accountId } = credentials[i];
      // kimi and llama models use the OpenAI-compatible chat completions endpoint
      const isChatModel = model.includes('kimi') || model.includes('llama') || model.includes('mistral');
      const url = isChatModel
        ? `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`
        : `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
      
      const requestPayload = isChatModel ? { ...cfPayload, model } : cfPayload;

      console.log(`[AI Proxy] Trying account ${i + 1}/${credentials.length}, accountId=${accountId.substring(0, 8)}...`);

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
        lastError = `Account ${i + 1} (${resp.status}): ${errText}`;
        errors.push(lastError);
        console.warn(`[AI Proxy] Account ${i + 1} failed: ${resp.status}`);
        
        // 402 = Insufficient balance / not on paid plan — rotate to next account
        // 429 = Rate limit exceeded — rotate to next account
        // 403 = Forbidden / out of credits — rotate to next account
        // 401 = Invalid token — rotate to next account
        // 5xx = Server error — rotate to next account
        if (resp.status === 402 || resp.status === 429 || resp.status === 403 ||
            resp.status === 401 || resp.status >= 500) {
          continue;
        }

        // 400 can mean: bad payload (stop) OR account-level model restriction (rotate).
        // We detect account-restriction by checking the error body.
        if (resp.status === 400) {
          let errBody: any = {};
          try { errBody = JSON.parse(errText); } catch (_) {}
          const errMsg: string = (errBody?.errors?.[0]?.message || errText).toLowerCase();
          // If it's clearly a model/account restriction, rotate. Otherwise stop.
          const isAccountRestriction = errMsg.includes('insufficient') || 
            errMsg.includes('balance') || errMsg.includes('upgrade') ||
            errMsg.includes('gateway') || errMsg.includes('byok') ||
            errMsg.includes('not authorized') || errMsg.includes('unauthorized') ||
            errMsg.includes('model') || errMsg.includes('access') ||
            errMsg.includes('quota') || errMsg.includes('limit');
          if (isAccountRestriction) {
            console.warn(`[AI Proxy] Account ${i + 1} has model/plan restriction, rotating...`);
            continue;
          }
          // True bad payload — don't rotate, throw immediately
          throw new Error(lastError);
        }

        // 404 = Model not found on this account — rotate
        if (resp.status === 404) {
          continue;
        }

        // For any other unexpected status, rotate
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
    console.error(`[AI Proxy] All ${credentials.length} accounts failed. Errors:`, errors);
    const errorObj = new Error(`All ${credentials.length} accounts failed. Last error: ${lastError}`);
    (errorObj as any).status = 503; // Service Unavailable
    throw errorObj;

  } catch (err) {
    const statusCode = err.status || 500;
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: statusCode,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
