import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, company_id, currentSchema, moduleType } = await req.json()

    if (!prompt) {
      throw new Error('Prompt is required')
    }

    const cloudflareToken = Deno.env.get('CLOUDFLARE_API_TOKEN')
    const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')

    if (!cloudflareToken || !accountId) {
      throw new Error('Cloudflare AI credentials not configured in Supabase secrets.')
    }

    const targetType = moduleType || 'data_module'
    let systemPrompt = `You are an AI that generates business module configurations for a platform called OptalFlow.
The target module type is: ${targetType}.
Given a user request, return ONLY a valid JSON object — no explanations, no markdown, no code fences.
Use this exact structure:
{
  "module": {
    "name": "string",
    "description": "string",
    "icon": "string (a valid lucide-react icon name like Briefcase, Users, Package, FileText, Calendar, Truck, Heart, Building)",
    "layout": "string (either 'table' or 'grid')",
    "theme": "string (choose one: primary, blue, emerald, rose, amber, purple)",
    "module_type": "${targetType}"
  },
  "fields": [
    {
      "name": "snake_case_field_name",
      "field_type": "text",
      "is_required": true
    }
  ]
}
field_type must be one of: text, number, date, select, boolean
For select fields, add an "options" array of strings.
Generate 5-10 relevant fields. Return ONLY the JSON object.`

    let userMessage = `Create a module for: ${prompt}`

    if (currentSchema) {
      systemPrompt += `\n\nIMPORTANT: The user is requesting EDITS to an existing module. You must merge their request with the current schema and return the FULL UPDATED SCHEMA.`
      userMessage = `Current Schema: ${JSON.stringify(currentSchema)}\n\nUser Request: ${prompt}`
    }

    const cfResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cloudflareToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          max_tokens: 1024,
        }),
      }
    )

    if (!cfResponse.ok) {
      const errText = await cfResponse.text()
      throw new Error(`Cloudflare AI Error (${cfResponse.status}): ${errText}`)
    }

    const result = await cfResponse.json()
    const rawText = result?.result?.response ?? ''

    if (!rawText) {
      throw new Error('Empty response from Cloudflare AI')
    }

    // Robustly extract JSON — ignore any conversational text before/after
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error(`Could not find JSON in AI response: ${rawText.substring(0, 200)}`)
    }

    const generatedModule = JSON.parse(jsonMatch[0])

    // Validate the structure
    if (!generatedModule.module || !generatedModule.fields) {
      throw new Error('AI returned invalid schema structure')
    }

    return new Response(JSON.stringify({ success: true, schema: generatedModule }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('generate-dynamic-module error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
