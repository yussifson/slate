// Test powerful free Cloudflare models
// node scratch/test_cf_models.mjs

const token = "cfut_DjZLCGykcMI0D0wtJIHxOME8NpAIwe68bLYMsyWOd091300e";
const accountId = "bf5126510c1f8f2759cc81c4e7d795ef";

const modelsToTest = [
  // MoE / Reasoning models - most powerful free options
  { id: "@cf/qwen/qwq-32b", label: "QwQ-32B (reasoning, like o1)" },
  { id: "@cf/qwen/qwen3-30b-a3b", label: "Qwen3-30B-A3B (MoE, 30B)" },
  { id: "@cf/zai-org/glm-4.7-flash", label: "GLM-4.7-Flash (131k context)" },
  { id: "@cf/zai-org/glm-5.2", label: "GLM-5.2 (agentic coding)" },
  { id: "@cf/qwen/qwen2.5-coder-32b-instruct", label: "Qwen2.5-Coder-32B" },
  { id: "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b", label: "DeepSeek-R1-Distill-32B (reasoning)" },
  { id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast", label: "Llama 3.3 70B (current)" },
];

const messages = [{ role: "user", content: "What is 2+2? Reply in 5 words max." }];

async function testModel(model) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: model.id, messages, max_tokens: 50 }),
    });
    const text = await res.text();
    let result = "";
    try {
      const json = JSON.parse(text);
      if (json.choices) result = `✅ WORKS — "${json.choices[0]?.message?.content?.trim()}"`;
      else result = `❌ ${json.errors?.[0]?.message || text.substring(0, 120)}`;
    } catch { result = `❌ ${text.substring(0, 120)}`; }
    console.log(`[${res.status}] ${model.label}\n     ${result}\n`);
  } catch (e) {
    console.log(`[ERR] ${model.label}\n     ❌ ${e.message}\n`);
  }
}

(async () => {
  console.log("Testing Cloudflare AI models on Account 1...\n");
  for (const m of modelsToTest) await testModel(m);
})();
