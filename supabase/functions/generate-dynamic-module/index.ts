import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// System prompt for single module generation
const SINGLE_MODULE_PROMPT = `You are an AI that generates business module configurations for a platform called OptalFlow.
Given a user request, return ONLY a valid JSON object — no explanations, no markdown, no code fences.
Use this exact structure:
{
  "module": {
    "name": "string",
    "description": "string",
    "icon": "string (a valid lucide-react icon name like Briefcase, Users, Package, FileText, Calendar, Truck, Heart, Building, Activity, ShoppingBag, Stethoscope, GraduationCap, Church, Hotel, Shield, Warehouse, BarChart, ClipboardList, Receipt, UserPlus)",
    "layout": "string (one of: table, grid)",
    "theme": "string (one of: primary, blue, emerald, rose, amber, purple)",
    "module_type": "string (one of: data_module, dashboard, kanban, document_manager, calendar_view, form_builder, directory, timeline, gallery, spreadsheet, report, inventory, crm_pipeline, approval_workflow)"
  },
  "fields": [
    {
      "name": "snake_case_field_name",
      "field_type": "text|number|date|select|boolean",
      "is_required": true,
      "options": []
    }
  ]
}
field_type must be one of: text, number, date, select, boolean.
For select fields, add an "options" array of strings.
Generate 5-15 relevant fields covering the full business use case.
Choose the best module_type for the use case.
Return ONLY the JSON object.`

// System prompt for system plan generation
const SYSTEM_PLAN_PROMPT = `You are an AI system architect for OptalFlow enterprise platform.
Given a complex business requirement, analyze what modules are needed and return ONLY a valid JSON array of module plans.
Each plan has: name, description, icon (lucide-react icon name), module_type (one of: data_module, dashboard, kanban, calendar_view, directory, timeline, spreadsheet, report, inventory, crm_pipeline, approval_workflow), field_count (estimated number of fields needed).
Return 5-20 modules depending on complexity.
DO NOT use markdown formatting. DO NOT wrap the output in \`\`\`json. DO NOT add conversational text. Return ONLY the raw JSON array.
Example: [{"name":"Patients","description":"Patient records management","icon":"Stethoscope","module_type":"data_module","field_count":10}]`

// System prompt for intent classification
const INTENT_PROMPT = `Classify the user's message into exactly one intent. Return ONLY the intent word, nothing else.
Intents:
- "build" = user wants to create a new module (mentions: create, build, design, make, generate, set up a module/system/tracker/manager)
- "build_system" = user wants to create a COMPLEX SYSTEM with MULTIPLE modules (mentions: complete system, operating system, management system, or describes multiple departments/entities/workflows)
- "edit" = user wants to modify an existing module (mentions: edit, change, modify, update, add field, remove field, rename, adjust)
- "populate_data" = user wants to add/insert data records into an existing module using natural language (mentions: add patient, insert these records, populate data, log this, record this data)
- "chat" = user is asking a question, having a conversation, or anything else that doesn't involve creating/editing modules

Return ONLY one word: build, build_system, edit, populate_data, or chat`

async function callCloudflareAI(messages: any[], maxTokens = 2048) {
  // Try up to 5 different accounts for failover
  const accounts = [];
  
  // Try the default un-numbered keys first
  const defaultToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
  const defaultAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
  if (defaultToken && defaultAccountId) {
    accounts.push({ token: defaultToken, accountId: defaultAccountId });
  }

  // Look for numbered keys (e.g. CLOUDFLARE_API_TOKEN_2)
  for (let i = 2; i <= 5; i++) {
    const token = Deno.env.get(`CLOUDFLARE_API_TOKEN_${i}`);
    const accountId = Deno.env.get(`CLOUDFLARE_ACCOUNT_ID_${i}`);
    if (token && accountId) {
      accounts.push({ token, accountId });
    }
  }

  if (accounts.length === 0) {
    throw new Error('Cloudflare AI credentials not configured in Supabase secrets.')
  }

  let lastError = null;

  for (const acc of accounts) {
    try {
      const cfResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${acc.accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${acc.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messages, max_tokens: maxTokens }),
        }
      )

      if (!cfResponse.ok) {
        const errText = await cfResponse.text()
        const isRateLimit = cfResponse.status === 429 || errText.includes('10,000 neurons');
        
        if (isRateLimit) {
          lastError = new Error(`Cloudflare AI Error (${cfResponse.status}): ${errText}`);
          console.warn(`Account ${acc.accountId} hit limit. Failing over to next account...`);
          continue; // Try next account
        } else {
          // If it's a different error (e.g. 400 Bad Request), throw immediately
          throw new Error(`Cloudflare AI Error (${cfResponse.status}): ${errText}`);
        }
      }

      const result = await cfResponse.json()
      return result?.result?.response ?? ''
      
    } catch (err) {
      lastError = err;
      // If it's a network error, we can also fail over
      console.warn(`Network/Fetch error for account ${acc.accountId}:`, err);
    }
  }

  // If we get here, all accounts failed
  throw lastError || new Error("All Cloudflare AI accounts have reached their rate limits or failed.");
}

function extractJson(text: string) {
  // Strip markdown code fences if present
  let cleanText = text.replace(/```(?:json)?\s*([\s\S]*?)\s*```/ig, '$1').trim();
  
  // Find the first '[' or '{'
  const firstBracket = cleanText.indexOf('[');
  const firstBrace = cleanText.indexOf('{');
  
  let startIdx = -1;
  let isArray = false;
  
  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    startIdx = firstBracket;
    isArray = true;
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else {
    return null; // No JSON found
  }
  
  let openChar = isArray ? '[' : '{';
  let closeChar = isArray ? ']' : '}';
  let braces = 0;
  let inString = false;
  let escape = false;
  let endIdx = -1;
  
  for (let i = startIdx; i < cleanText.length; i++) {
    let char = cleanText[i];
    
    if (char === '\\' && !escape) {
      escape = true;
      continue;
    }
    if (char === '"' && !escape) {
      inString = !inString;
    }
    
    if (!inString) {
      if (char === openChar) braces++;
      else if (char === closeChar) braces--;
    }
    escape = false;
    
    if (braces === 0 && i > startIdx) {
      endIdx = i;
      break;
    }
  }
  
  if (endIdx !== -1) {
    try {
      return JSON.parse(cleanText.substring(startIdx, endIdx + 1));
    } catch (e) {
      console.error("JSON parse error:", e);
    }
  }
  
  // Fallback to naive greedy if the parser fails
  const greedyMatch = isArray ? cleanText.match(/\[[\s\S]*\]/) : cleanText.match(/\{[\s\S]*\}/);
  if (greedyMatch) {
    try { return JSON.parse(greedyMatch[0]) } catch {}
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { prompt, company_id, currentSchema, moduleType, isBoltChat, chatHistory, mode } = body

    if (!prompt) {
      throw new Error('Prompt is required')
    }

    // ─── MODE: detect_intent ───
    if (mode === 'detect_intent') {
      const raw = await callCloudflareAI([
        { role: 'system', content: INTENT_PROMPT },
        { role: 'user', content: prompt }
      ], 16)
      
      const intent = raw.trim().toLowerCase().replace(/[^a-z_]/g, '')
      const validIntents = ['build', 'build_system', 'edit', 'populate_data', 'chat']
      const detectedIntent = validIntents.includes(intent) ? intent : 'chat'

      return new Response(JSON.stringify({ success: true, intent: detectedIntent }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // ─── MODE: plan_system ───
    if (mode === 'plan_system') {
      const raw = await callCloudflareAI([
        { role: 'system', content: SYSTEM_PLAN_PROMPT },
        { role: 'user', content: `Design a complete system for: ${prompt}` }
      ], 4096)

      const plan = extractJson(raw)
      if (!plan || !Array.isArray(plan)) {
        throw new Error('Could not parse system plan from AI response')
      }

      return new Response(JSON.stringify({ success: true, plan }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // ─── MODE: generate_module (single module from plan item) ───
    if (mode === 'generate_module') {
      const targetType = body.targetModuleType || moduleType || 'data_module'
      const moduleName = body.moduleName || ''
      const moduleDescription = body.moduleDescription || ''

      const raw = await callCloudflareAI([
        { role: 'system', content: SINGLE_MODULE_PROMPT.replace(
          'module_type": "string',
          `module_type": "${targetType}`
        )},
        { role: 'user', content: `Create a detailed module called "${moduleName}" — ${moduleDescription}. Context: ${prompt}. Use module_type: ${targetType}. Generate comprehensive fields (8-15) that fully cover this use case.` }
      ], 2048)

      const schema = extractJson(raw)
      if (!schema || !schema.module || !schema.fields) {
        throw new Error('Could not parse module schema from AI response')
      }

      // Ensure the name matches what was planned
      schema.module.name = moduleName || schema.module.name
      schema.module.module_type = targetType

      return new Response(JSON.stringify({ success: true, schema }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // ─── MODE: edit_module ───
    if (mode === 'edit') {
      if (!currentSchema) throw new Error('currentSchema is required for edit mode')

      const editPrompt = `You are editing an EXISTING module. Here is the current schema:
${JSON.stringify(currentSchema, null, 2)}

The user wants to make this SPECIFIC change: "${prompt}"

IMPORTANT RULES:
- Only modify what the user specifically asked for
- Keep ALL existing fields that weren't mentioned
- Keep ALL existing module settings that weren't mentioned
- If the user asks to add a field, ADD it to the existing fields array — do NOT remove other fields
- If the user asks to remove a field, REMOVE only that specific field
- If the user asks to rename something, RENAME only that specific thing
- Return the COMPLETE updated schema with ALL fields (modified + unchanged)

Return ONLY the updated JSON schema, no explanations.`

      const raw = await callCloudflareAI([
        { role: 'system', content: editPrompt },
        { role: 'user', content: prompt }
      ], 2048)

      const schema = extractJson(raw)
      if (!schema || !schema.module || !schema.fields) {
        throw new Error('Could not parse edited schema from AI response')
      }

      return new Response(JSON.stringify({ success: true, schema }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // ─── MODE: populate_data ───
    if (mode === 'populate_data') {
      if (!currentSchema) throw new Error('currentSchema is required for populate_data mode')

      const populatePrompt = `You are a data entry assistant. Given the following module schema, extract the user's natural language data and return ONLY a valid JSON object representing a new record.
Here is the current schema:
${JSON.stringify(currentSchema, null, 2)}

Match the extracted data to the exact "snake_case_field_name"s in the schema. For fields you cannot find in the user's prompt, omit them or provide null if they are not required.
DO NOT use markdown formatting. Return ONLY the raw JSON object.
Example: {"first_name": "John", "age": 30, "status": "active"}`;

      const raw = await callCloudflareAI([
        { role: 'system', content: populatePrompt },
        { role: 'user', content: prompt }
      ], 2048)

      const recordData = extractJson(raw)
      if (!recordData) {
        throw new Error('Could not parse data record from AI response')
      }

      return new Response(JSON.stringify({ success: true, recordData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // ─── MODE: chat (conversational, no schema) ───
    if (mode === 'chat') {
      const chatSystemPrompt = `You are OrbitBolt — an AI module architect assistant in Optalflow. You are having a conversation with the user about module design, business processes, or data architecture. Answer their questions helpfully. Do NOT generate JSON schemas unless explicitly asked. Be concise, friendly, and professional.`

      const messages = chatHistory || [
        { role: 'system', content: chatSystemPrompt },
        { role: 'user', content: prompt }
      ]

      if (!messages.find((m: any) => m.role === 'system')) {
        messages.unshift({ role: 'system', content: chatSystemPrompt })
      }

      const raw = await callCloudflareAI(messages, 1024)

      return new Response(JSON.stringify({ success: true, message: raw }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // ─── DEFAULT: Legacy single module generation (backward compatible) ───
    const targetType = moduleType || 'data_module'
    let systemPrompt = SINGLE_MODULE_PROMPT

    let userMessage = `Create a module for: ${prompt}`

    if (currentSchema) {
      systemPrompt += `\n\nIMPORTANT: The user is requesting EDITS to an existing module. You must merge their request with the current schema and return the FULL UPDATED SCHEMA. Only change what they specifically asked for.`
      userMessage = `Current Schema: ${JSON.stringify(currentSchema)}\n\nUser Request: ${prompt}`
    }

    // If isBoltChat, use the chat history for context
    let messages: any[]
    if (isBoltChat && chatHistory) {
      messages = chatHistory
    } else {
      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ]
    }

    const rawText = await callCloudflareAI(messages, 2048)

    if (!rawText) {
      throw new Error('Empty response from Cloudflare AI')
    }

    const generatedModule = extractJson(rawText)
    if (!generatedModule || !generatedModule.module || !generatedModule.fields) {
      // It might be a conversational response
      return new Response(JSON.stringify({ success: true, message: rawText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    return new Response(JSON.stringify({ success: true, schema: generatedModule }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('generate-dynamic-module error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Returning 200 so supabase-js correctly returns response.data
    })
  }
})
