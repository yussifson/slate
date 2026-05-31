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

    // Initialize OpenAI
    const configuration = new Configuration({ apiKey: Deno.env.get('OPENAI_API_KEY') })
    const openai = new OpenAIApi(configuration)

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
    }`

    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
    })

    const resultText = response.data.choices[0].message?.content || '{}'
    const generatedModule = JSON.parse(resultText)

    // Optional: Save to Database (we can do this directly from frontend, or do it here)
    // If the requirement is to do it here:
    const { data: moduleData, error: moduleError } = await supabaseClient
      .from('module_definitions')
      .insert({
        company_id,
        name: generatedModule.module.name,
        description: generatedModule.module.description,
        icon: generatedModule.module.icon,
        created_by: user.id
      })
      .select()
      .single()

    if (moduleError) throw moduleError;

    const fieldsToInsert = generatedModule.fields.map((f: any, idx: number) => ({
      company_id,
      module_id: moduleData.id,
      name: f.name,
      field_type: f.field_type,
      options: f.options || [],
      is_required: f.is_required || false,
      order_index: idx
    }))

    const { error: fieldsError } = await supabaseClient
      .from('field_definitions')
      .insert(fieldsToInsert)

    if (fieldsError) throw fieldsError;

    return new Response(JSON.stringify({ success: true, module: moduleData, fields: generatedModule.fields }), {
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
