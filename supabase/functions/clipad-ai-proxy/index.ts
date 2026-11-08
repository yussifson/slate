import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers": "content-type",
};

// ══════════════════════════════════════════════════════════════════════════════
//  MODEL CASCADE — ordered by quality, descending
//  For each model, ALL registered Cloudflare accounts are tried before
//  moving on to the next model. This means:
//    • Kimi K3  → tried on Account 1, 2, 3 … N
//    • Kimi K2.5 → tried on Account 1, 2, 3 … N   (if all K3 attempts failed)
//    • QwQ-32B  → tried on Account 1, 2, 3 … N   (if all K2.5 attempts failed)
//    • …and so on until one succeeds.
// ══════════════════════════════════════════════════════════════════════════════
const MODEL_CASCADE = [
  // ── OpenAI Thinking / Reasoning tier (120B & 20B parameters) ───────────────
  { id: "@cf/openai/gpt-oss-120b",                      endpoint: "chat",  label: "OpenAI GPT-OSS-120B (Thinking)" },
  { id: "@cf/openai/gpt-oss-20b",                       endpoint: "chat",  label: "OpenAI GPT-OSS-20B"             },
  // ── Premium / Secondary tier ───────────────────────────────────────────────
  { id: "moonshotai/kimi-k3",                           endpoint: "chat",  label: "Kimi K3"                        },
  { id: "moonshotai/kimi-k2.5",                         endpoint: "chat",  label: "Kimi K2.5"                      },
  // ── High-capability Reasoning & Free tier ──────────────────────────────────
  { id: "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b", endpoint: "chat",  label: "DeepSeek-R1-32B (Reasoning)"    },
  { id: "@cf/qwen/qwq-32b",                             endpoint: "chat",  label: "QwQ-32B"                        },
  { id: "@cf/zai-org/glm-4.7-flash",                    endpoint: "chat",  label: "GLM-4.7-Flash"                  },
  { id: "@cf/qwen/qwen2.5-coder-32b-instruct",          endpoint: "chat",  label: "Qwen2.5-Coder-32B"              },
  { id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",     endpoint: "chat",  label: "Llama-3.3-70B"                  },
];

// ── Determine whether this model uses the OpenAI-compatible chat endpoint ──
function isChatModel(modelId: string): boolean {
  return (
    modelId.includes("openai") ||
    modelId.includes("kimi") ||
    modelId.includes("llama") ||
    modelId.includes("mistral") ||
    modelId.includes("qwen") ||
    modelId.includes("deepseek") ||
    modelId.includes("glm") ||
    modelId.includes("moonshot")
  );
}

// ── Error codes that indicate an account/plan/quota problem → rotate ──────
const ROTATE_ON_STATUS = new Set([401, 402, 403, 404, 429]);
const PLAN_RESTRICTION_PHRASES = [
  "insufficient", "balance", "upgrade", "byok", "gateway",
  "access", "quota", "limit", "subscription", "tier",
  "paid plan", "worker paid", "workers paid",
];

/**
 * Try a single model across ALL registered accounts.
 * Returns a successful Response, or null if every account failed for this model.
 */
async function tryModelOnAllAccounts(
  credentials: { token: string; accountId: string }[],
  modelId: string,
  payload: Record<string, unknown>,
  stream: boolean,
  modelLabel: string,
): Promise<Response | null> {
  for (let i = 0; i < credentials.length; i++) {
    const { token, accountId } = credentials[i];

    const useChat = isChatModel(modelId);
    const url = useChat
      ? `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`
      : `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${modelId}`;

    const requestPayload = useChat ? { ...payload, model: modelId } : payload;

    console.log(`[AI Proxy] Trying ${modelLabel} on account ${i + 1}/${credentials.length}`);

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
        console.log(`[AI Proxy] ✅ ${modelLabel} succeeded on account ${i + 1}`);
        return resp;
      }

      const errText = await resp.text();
      const status = resp.status;

      console.warn(`[AI Proxy] ${modelLabel} / account ${i + 1}: HTTP ${status}`);

      // Account/plan/quota issue → try next account
      if (ROTATE_ON_STATUS.has(status) || status >= 500) {
        continue;
      }

      // 400 can be a plan restriction OR a genuine bad request
      if (status === 400) {
        let errBody: Record<string, unknown> = {};
        try { errBody = JSON.parse(errText); } catch (_) { /* ignore */ }
        const msg = (
          (errBody?.errors as Array<{ message: string }>)?.[0]?.message || errText
        ).toLowerCase();
        const isPlanRestriction = PLAN_RESTRICTION_PHRASES.some((p) => msg.includes(p));
        if (isPlanRestriction) {
          continue; // try next account
        }
        // Genuine bad payload — don't bother trying other accounts for this model
        console.warn(`[AI Proxy] Bad payload for ${modelLabel}, skipping model.`);
        return null;
      }

      // Other 4xx — skip account
      continue;

    } catch (fetchErr) {
      console.warn(`[AI Proxy] Fetch error for ${modelLabel} / account ${i + 1}:`, (fetchErr as Error).message);
      continue;
    }
  }

  // All accounts exhausted for this model
  console.warn(`[AI Proxy] All accounts exhausted for ${modelLabel}.`);
  return null;
}

// ════════════════════════════════════════════════════════════════════════════
//  Main handler
// ════════════════════════════════════════════════════════════════════════════
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

    // ── Build Cloudflare credentials list ─────────────────────────────────────
    const credentials: { token: string; accountId: string }[] = [];
    const defaultToken = Deno.env.get("CLOUDFLARE_API_TOKEN");
    const defaultAccountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    if (defaultToken && defaultAccountId) {
      credentials.push({ token: defaultToken, accountId: defaultAccountId });
    }
    // Support a single JSON string CLOUDFLARE_ROTATING_ACCOUNTS to bypass Supabase's 100-secret limit
    // Format: [{"token":"...","accountId":"..."}, ...]
    const rotatingAccountsJson = Deno.env.get("CLOUDFLARE_ROTATING_ACCOUNTS");
    if (rotatingAccountsJson) {
      try {
        const parsed = JSON.parse(rotatingAccountsJson);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item.token && item.accountId) {
              credentials.push({ token: item.token, accountId: item.accountId });
            }
          }
        }
      } catch (err) {
        console.error("[AI Proxy] Failed to parse CLOUDFLARE_ROTATING_ACCOUNTS JSON:", (err as Error).message);
      }
    }

    // Keep backwards compatibility with individual env vars
    for (let i = 2; i <= 100; i++) {
      const token = Deno.env.get(`CLOUDFLARE_API_TOKEN_${i}`);
      const accountId = Deno.env.get(`CLOUDFLARE_ACCOUNT_ID_${i}`) || defaultAccountId;
      if (token && accountId) credentials.push({ token, accountId });
    }

    if (credentials.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No Cloudflare credentials configured." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const cfPayload = stream ? { ...payload, stream: true } : payload;

    console.log(`[AI Proxy] Request: preferred_model=${model}, stream=${stream}, accounts=${credentials.length}`);

    // ── Build effective cascade ───────────────────────────────────────────────
    // Start from the preferred model (or the closest match in the cascade),
    // then try every model below it in order.
    const preferredIdx = MODEL_CASCADE.findIndex(
      (m) => m.id === model || model.includes(m.id) || m.id.includes(model),
    );
    // If the preferred model isn't in our cascade, prepend it so we still try it
    const effectiveCascade = preferredIdx >= 0
      ? MODEL_CASCADE.slice(preferredIdx)
      : [
          { id: model, endpoint: "chat", label: model },
          ...MODEL_CASCADE,
        ];

    let successResp: Response | null = null;

    for (const entry of effectiveCascade) {
      successResp = await tryModelOnAllAccounts(
        credentials,
        entry.id,
        cfPayload,
        stream,
        entry.label,
      );
      if (successResp) break;
    }

    if (!successResp) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "All Cloudflare AI models and accounts are exhausted. " +
            "Your free daily quota (10,000 neurons/account) may have been reached. " +
            "Try again after midnight UTC, or upgrade an account to the Workers Paid plan ($5/month) to unlock premium models.",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Streaming response ────────────────────────────────────────────────────
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

    // ── Non-streaming response ────────────────────────────────────────────────
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
