import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers": "content-type",
};

// ── Groq provider (free, fast, generous limits) ──────────────────────────────
// Sign up at console.groq.com → create API key → add as GROQ_API_KEY secret
// Using DeepSeek-R1-Distill-Llama-70B — Groq's most powerful free reasoning model
// Comparable to o1-mini, far superior to plain Llama for analysis & complex tasks
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "deepseek-r1-distill-llama-70b";

// ── Cloudflare fallback models (free tier, ~10k neurons/day per account) ──────
// Ordered by power: most capable first
const CF_FREE_MODELS = [
  "@cf/qwen/qwq-32b",                            // Most powerful — 32B reasoning model (like o1-mini)
  "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",// DeepSeek R1 reasoning distilled
  "@cf/zai-org/glm-4.7-flash",                   // 131k context, fast and capable
  "@cf/qwen/qwen2.5-coder-32b-instruct",         // Great for coding/task execution
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",    // Last resort: Llama 3.3 70B
];

// ── Try Groq ─────────────────────────────────────────────────────────────────
async function tryGroq(
  groqApiKey: string,
  messages: unknown[],
  stream: boolean,
): Promise<Response | null> {
  console.log("[AI Proxy] Trying Groq provider...");
  try {
    const resp = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        max_tokens: 2500,
        stream,
      }),
    });

    if (resp.ok) {
      console.log("[AI Proxy] ✅ Groq succeeded");
      return resp;
    }

    const errText = await resp.text();
    console.warn(`[AI Proxy] Groq failed: ${resp.status} - ${errText.substring(0, 200)}`);
    return null;
  } catch (e) {
    console.warn("[AI Proxy] Groq error:", (e as Error).message);
    return null;
  }
}

// ── Try Cloudflare accounts with a given model ────────────────────────────────
async function tryCloudflare(
  credentials: { token: string; accountId: string }[],
  model: string,
  payload: Record<string, unknown>,
  stream: boolean,
): Promise<Response | null> {
  for (let i = 0; i < credentials.length; i++) {
    const { token, accountId } = credentials[i];

    // Chat models use OpenAI-compatible endpoint
    const isChatModel = model.includes("kimi") || model.includes("llama") || model.includes("mistral");
    const url = isChatModel
      ? `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`
      : `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

    const requestPayload = isChatModel ? { ...payload, model } : payload;

    console.log(`[AI Proxy] CF model=${model} account ${i + 1}/${credentials.length}`);

    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      if (resp.ok) {
        console.log(`[AI Proxy] ✅ CF account ${i + 1} succeeded with model=${model}`);
        return resp;
      }

      const errText = await resp.text();
      console.warn(`[AI Proxy] CF account ${i + 1} failed: ${resp.status}`);

      // Always rotate on these — they are account/plan/quota issues
      if ([401, 402, 403, 404, 429].includes(resp.status) || resp.status >= 500) {
        continue;
      }

      // For 400, check if it's a plan restriction vs bad payload
      if (resp.status === 400) {
        let errBody: Record<string, unknown> = {};
        try { errBody = JSON.parse(errText); } catch (_) { /* ignore */ }
        const msg: string = ((errBody?.errors as Array<{message: string}>)?.[0]?.message || errText).toLowerCase();
        const isPlanRestriction = msg.includes("insufficient") || msg.includes("balance") ||
          msg.includes("upgrade") || msg.includes("byok") || msg.includes("gateway") ||
          msg.includes("access") || msg.includes("quota") || msg.includes("limit");
        if (isPlanRestriction) { continue; }
        // Genuine bad payload — stop
        return null;
      }

      continue;
    } catch (e) {
      console.warn(`[AI Proxy] CF account ${i + 1} fetch error:`, (e as Error).message);
      continue;
    }
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { model, payload, stream = false } = await req.json();

    if (!model || !payload) {
      return new Response(
        JSON.stringify({ success: false, error: "model and payload are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const messages = payload.messages || [];

    // ── Build Cloudflare credentials ──
    const credentials: { token: string; accountId: string }[] = [];
    const defaultToken = Deno.env.get("CLOUDFLARE_API_TOKEN");
    const defaultAccountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    if (defaultToken && defaultAccountId) {
      credentials.push({ token: defaultToken, accountId: defaultAccountId });
    }
    for (let i = 2; i <= 10; i++) {
      const token = Deno.env.get(`CLOUDFLARE_API_TOKEN_${i}`);
      const accountId = Deno.env.get(`CLOUDFLARE_ACCOUNT_ID_${i}`) || defaultAccountId;
      if (token && accountId) credentials.push({ token, accountId });
    }

    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    const cfPayload = stream ? { ...payload, stream: true } : payload;

    console.log(`[AI Proxy] Request model=${model}, stream=${stream}, cf_accounts=${credentials.length}, groq=${!!groqApiKey}`);

    let successResp: Response | null = null;

    // ── Strategy 1: Try Groq first (free, fast, reliable) ──
    if (groqApiKey) {
      successResp = await tryGroq(groqApiKey, messages, stream);
    }

    // ── Strategy 2: Try Cloudflare with the requested model ──
    if (!successResp && credentials.length > 0) {
      successResp = await tryCloudflare(credentials, model, cfPayload, stream);
    }

    // ── Strategy 3: Try Cloudflare free fallback models ──
    if (!successResp && credentials.length > 0) {
      for (const fallbackModel of CF_FREE_MODELS) {
        console.warn(`[AI Proxy] Trying CF free fallback: ${fallbackModel}`);
        successResp = await tryCloudflare(credentials, fallbackModel, cfPayload, stream);
        if (successResp) break;
      }
    }

    if (!successResp) {
      const hint = !groqApiKey
        ? " TIP: Add GROQ_API_KEY secret for reliable free AI — see console.groq.com"
        : "";
      return new Response(
        JSON.stringify({ success: false, error: `All AI providers exhausted.${hint}` }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Streaming response ──
    if (stream && successResp.body) {
      return new Response(successResp.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // ── Non-streaming response ──
    const data = await successResp.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[AI Proxy] Unhandled error:", err);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
