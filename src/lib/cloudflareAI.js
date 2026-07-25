// src/lib/cloudflareAI.js
// Routes through Vite's dev proxy (/api/ai) for local development if desired,
// but defaults to secure Supabase Edge Function to prevent exposing API keys.
// ── STREAMING: When onStream callback is provided, uses real SSE token streaming ──
import { supabase } from '@/api/supabaseClient';

// Find all environment variable keys that match our pattern
const envKeys = Object.keys(import.meta.env);

// We look for VITE_CLOUDFLARE_AI_TOKEN, VITE_CLOUDFLARE_AI_TOKEN_2, etc.
// And their corresponding VITE_CLOUDFLARE_ACCOUNT_ID, VITE_CLOUDFLARE_ACCOUNT_ID_2, etc.
const API_ACCOUNTS = [];

// Handle the primary/default ones first (no number suffix)
const defaultToken = import.meta.env.VITE_CLOUDFLARE_AI_TOKEN;
const defaultAccountId = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID || "bf5126510c1f8f2759cc81c4e7d795ef";

if (defaultToken) {
  API_ACCOUNTS.push({ token: defaultToken, accountId: defaultAccountId });
}

// Handle the numbered ones (e.g. _2, _3, _4)
const tokenPattern = /^VITE_CLOUDFLARE_AI_TOKEN_(\d+)$/;
envKeys.forEach(key => {
  const match = key.match(tokenPattern);
  if (match) {
    const num = match[1];
    const token = import.meta.env[key];
    const accountId = import.meta.env[`VITE_CLOUDFLARE_ACCOUNT_ID_${num}`];

    if (token) {
      API_ACCOUNTS.push({
        token,
        accountId: accountId || defaultAccountId // Fallback to default ID if they forgot to add the ID variable
      });
    }
  }
});

let currentAccountIndex = 0;

const MODELS = {
  text: "@cf/moonshotai/kimi-k2.5",
  vision: "@cf/moonshotai/kimi-k2.5"
};

// ── Environment constants for production streaming ──
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Helper to make NON-STREAMING API requests to Cloudflare AI.
 * Used for background tasks (summaries, embeddings, entity extraction).
 */
async function runAI(model, payload, retryCount = 0) {
  // If we have API_ACCOUNTS configured (e.g. local dev), we can use the local Vite proxy.
  // Otherwise, route through the Supabase Edge Function to keep keys secure.
  const isLocalProxy = API_ACCOUNTS.length > 0 && typeof window !== 'undefined' && window.location.protocol !== 'file:';

  if (isLocalProxy) {
    const accountConfig = API_ACCOUNTS[currentAccountIndex];
    const url = `/api/ai/${accountConfig.accountId}/${model}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accountConfig.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Cloudflare AI Error (Account Index ${currentAccountIndex}):`, response.status, errText);

      if (retryCount < API_ACCOUNTS.length - 1) {
        console.warn("Rotating to next Cloudflare AI API account...");
        currentAccountIndex = (currentAccountIndex + 1) % API_ACCOUNTS.length;
        return runAI(model, payload, retryCount + 1);
      }

      throw new Error(`AI request failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    if (!data.success) {
      const errMsg = data.errors?.map(e => e.message).join(', ') || 'Unknown error';
      throw new Error(`Cloudflare AI error: ${errMsg}`);
    }
    return data.result;
  } else {
    // Route through Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('clipad-ai-proxy', {
      body: { model, payload }
    });

    if (error) {
      console.error("Supabase Edge Function AI Error:", error);
      throw new Error(`Cloudflare AI Edge Function error: ${error.message}`);
    }

    if (!data || data.success === false) {
      throw new Error(`Cloudflare AI error: ${data?.error || 'Unknown error'}`);
    }

    return data.result;
  }
}

/**
 * Parse SSE lines from a ReadableStream reader.
 * Cloudflare AI SSE format per line: "data: {"response":"token"}\n\n"
 * Returns accumulated text token by token, calling onToken for each new token.
 */
async function consumeSSEStream(reader, onToken) {
  const decoder = new TextDecoder();
  let accumulated = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    // Keep the last (possibly incomplete) line in the buffer
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      const raw = trimmed.slice(6);
      if (raw === '[DONE]') return accumulated;
      try {
        const parsed = JSON.parse(raw);
        // Cloudflare AI streams tokens in parsed.response
        const token = parsed?.response ?? '';
        if (token) {
          accumulated += token;
          onToken(accumulated);
        }
      } catch (_) {
        // Partial JSON — safe to skip, will be re-assembled in next chunk
      }
    }
  }
  return accumulated;
}

/**
 * Generate text using Kimi K2.5 (@cf/moonshotai/kimi-k2.5)
 * @param {Array|string} input - Array of {role, content} objects or a prompt string
 * @param {Function|null} onStream - If provided, uses REAL SSE streaming. Called with accumulated text on each token.
 */
export async function generateText(input, onStream = null) {
  let messages = [];
  if (Array.isArray(input)) {
    messages = input;
  } else if (typeof input === 'string') {
    messages = [{ role: "user", content: input }];
  }

  const useStream = typeof onStream === 'function';
  const isLocalProxy = API_ACCOUNTS.length > 0 && typeof window !== 'undefined' && window.location.protocol !== 'file:';

  // ── REAL STREAMING PATH ────────────────────────────────────────────────────
  if (useStream) {
    try {
      let response;

      if (isLocalProxy) {
        // Local dev: call Cloudflare directly via Vite proxy with stream:true
        const accountConfig = API_ACCOUNTS[currentAccountIndex];
        const url = `/api/ai/${accountConfig.accountId}/${MODELS.text}`;
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accountConfig.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages, max_tokens: 2500, stream: true }),
        });
      } else {
        // Production: call Supabase edge function via raw fetch (not supabase.functions.invoke
        // because that buffers the response — we need the raw stream).
        const { data: { session } } = await supabase.auth.getSession();
        const authToken = session?.access_token || SUPABASE_ANON_KEY;

        response = await fetch(`${SUPABASE_URL}/functions/v1/clipad-ai-proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            model: MODELS.text,
            payload: { messages, max_tokens: 2500 },
            stream: true,
          }),
        });
      }

      if (!response.ok || !response.body) {
        console.warn('[OrbitFlow] Streaming not available, falling back to non-stream.');
        return generateText(input, null);
      }

      const reader = response.body.getReader();
      return await consumeSSEStream(reader, onStream);

    } catch (streamErr) {
      // If streaming fails for any reason, fall through to non-streaming
      console.warn('[OrbitFlow] Streaming error, falling back:', streamErr.message);
      return generateText(input, null);
    }
  }

  // ── NON-STREAMING PATH (used for background AI tasks: summaries, extraction) ──
  const result = await runAI(MODELS.text, { messages, max_tokens: 2500 });

  let finalText = result.response;
  if (result.choices && result.choices.length > 0) {
    if (result.choices[0].message && result.choices[0].message.content) {
      finalText = result.choices[0].message.content;
    } else if (result.choices[0].text) {
      finalText = result.choices[0].text;
    }
  }

  return finalText;
}

/**
 * Perform OCR / Data Extraction on an image using Kimi K2.5 (@cf/moonshotai/kimi-k2.5)
 */
export async function analyzeImage(imageBytes, prompt) {
  const result = await runAI(MODELS.vision, {
    prompt,
    image: Array.from(imageBytes)
  });
  return result.response;
}

export async function invokeCloudflareAi(prompt, systemPrompt = "") {
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });
  return await generateText(messages);
}
