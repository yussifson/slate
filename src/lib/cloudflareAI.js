// src/lib/cloudflareAI.js
// Routes through Vite's dev proxy (/api/ai) to avoid CORS.
// In production, route through a Cloudflare Worker or backend function.

const API_TOKEN = import.meta.env.VITE_CLOUDFLARE_AI_TOKEN || "cfut_DjZLCGykcMI0D0wtJIHxOME8NpAIwe68bLYMsyWOd091300e";

const MODELS = {
  text: "@cf/meta/llama-3.1-8b-instruct",
  vision: "@cf/meta/llama-3.2-11b-vision-instruct"
};

/**
 * Helper to make API requests to Cloudflare AI via local proxy
 */
async function runAI(model, payload) {
  // /api/ai is proxied by Vite to https://api.cloudflare.com/.../ai/run
  // Model name must NOT be encoded — slashes must stay as path separators
  const url = `/api/ai/${model}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Cloudflare AI Error:", response.status, errText);
    throw new Error(`AI request failed (${response.status}): ${errText}`);
  }

  const data = await response.json();

  if (!data.success) {
    const errMsg = data.errors?.map(e => e.message).join(', ') || 'Unknown error';
    throw new Error(`Cloudflare AI error: ${errMsg}`);
  }

  return data.result;
}

/**
 * Generate text using LLaMA 3.1
 * @param {Array} messages - Array of {role, content} objects
 */
export async function generateText(messages) {
  const result = await runAI(MODELS.text, { messages });
  return result.response;
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
