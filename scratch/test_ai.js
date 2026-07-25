import dotenv from 'dotenv';
dotenv.config();

const cloudflareToken = process.env.VITE_CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.VITE_CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;

const SYSTEM_PLAN_PROMPT = `You are an AI system architect for OptalFlow enterprise platform.
Given a complex business requirement, analyze what modules are needed and return ONLY a valid JSON array of module plans.
Each plan has: name, description, icon (lucide-react icon name), module_type (one of: data_module, dashboard, kanban, calendar_view, directory, timeline, spreadsheet, report, inventory, crm_pipeline, approval_workflow), field_count (estimated number of fields needed).
Return 5-20 modules depending on complexity.
DO NOT use markdown formatting. DO NOT wrap the output in \`\`\`json. DO NOT add conversational text. Return ONLY the raw JSON array.
Example: [{"name":"Patients","description":"Patient records management","icon":"Stethoscope","module_type":"data_module","field_count":10}]`

async function test() {
  const prompt = "Create an NGO Program & Donation Management system with donors, projects, and impact tracking";
  
  const messages = [
    { role: 'system', content: SYSTEM_PLAN_PROMPT },
    { role: 'user', content: `Design a complete system for: ${prompt}` }
  ];

  const cfResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/moonshotai/kimi-k2.5`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cloudflareToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, max_tokens: 4096 }),
    }
  );

  const result = await cfResponse.json();
  const text = result?.result?.response ?? '';
  
  console.log("RAW RESPONSE:");
  console.log(text);
  
  let cleanText = text.replace(/```(?:json)?\s*([\s\S]*?)\s*```/ig, '$1').trim();
  const arrayMatch = cleanText.match(/\[[\s\S]*\]/);
  console.log("EXTRACTED ARRAY:");
  if (arrayMatch) {
    try {
        console.log(JSON.parse(arrayMatch[0]));
    } catch (e) {
        console.log("JSON parse error:", e);
    }
  } else {
    console.log("No array matched.");
  }
}

test().catch(console.error);
