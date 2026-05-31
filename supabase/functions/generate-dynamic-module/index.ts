import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.3.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, company_id } = await req.json()
    
    // Create Supabase Client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Verify User Auth
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const cloudflareToken = Deno.env.get('CLOUDFLARE_API_TOKEN')
    const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')

    if (!cloudflareToken || !accountId) {
      throw new Error('Cloudflare AI credentials not configured in Supabase secrets.')
    }

    const systemPrompt = `You are an AI architect for OptalFlow, a dynamic business operating system. 
    Your goal is to take a natural language request to create a business module and return a JSON configuration.
    The response must strictly follow this JSON schema:
    {
      "module": {
        "name": "string",
        "description": "string",
        "icon": "string (lucide-react icon name like 'Briefcase')"
      },
      "fields": [
        {
          "name": "string (lowercase_snake_case)",
          "field_type": "text | number | date | select | boolean",
          "options": ["array of strings, only for select type"],
          "is_required": boolean
        }
      ]
    }
    IMPORTANT: Return ONLY valid JSON. No markdown formatting, no code blocks, no explanations.`

    const cfResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cloudflareToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      })
    })

    if (!cfResponse.ok) {
      const errText = await cfResponse.text()
      throw new Error(`Cloudflare API Error: ${errText}`)
    }

    const result = await cfResponse.json()
    const resultText = result.result?.response || '{}'
    
    // Extract JSON block using regex to ignore conversational text
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    let cleanText = '{}';
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    } else {
      // Fallback if match fails
      cleanText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    const generatedModule = JSON.parse(cleanText)

    return new Response(JSON.stringify({ success: true, schema: generatedModule }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
