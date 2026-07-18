// src/lib/cloudflareAI.js
// Routes through Vite's dev proxy (/api/ai) for local development if desired,
// but defaults to secure Supabase Edge Function to prevent exposing API keys.
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
  text: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  vision: "@cf/meta/llama-3.2-11b-vision-instruct"
};

/**
 * Helper to make API requests to Cloudflare AI via local proxy with key rotation
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
 * Generate text using LLaMA 3.3
 * @param {Array|string} input - Array of {role, content} objects or a prompt string
 */
export async function generateText(input, onStream = null) {
  let messages = [];
  if (Array.isArray(input)) {
    messages = input;
  } else if (typeof input === 'string') {
    messages = [{ role: "user", content: input }];
  }
  const result = await runAI(MODELS.text, { messages, max_tokens: 2500 });
  
  let finalText = result.response;
  if (result.choices && result.choices.length > 0) {
    if (result.choices[0].message && result.choices[0].message.content) {
      finalText = result.choices[0].message.content;
    } else if (result.choices[0].text) {
      finalText = result.choices[0].text;
    }
  }

  if (onStream && typeof onStream === 'function' && finalText) {
    const chunks = finalText.match(/.{1,12}/g) || [finalText];
    let accumulated = '';
    for (const chunk of chunks) {
      accumulated += chunk;
      onStream(accumulated);
      await new Promise(r => setTimeout(r, 10)); // fake delay
    }
  }

  return finalText;
}

/**
 * Perform OCR / Data Extraction on an image using LLaMA 3.2 Vision
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
