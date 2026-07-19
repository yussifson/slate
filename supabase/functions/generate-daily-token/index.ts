import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { roomName, userName, userId, isOwner } = await req.json()

    if (!DAILY_API_KEY) {
      throw new Error('DAILY_API_KEY is missing')
    }

    const response = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          user_name: userName || 'Guest',
          user_id: userId || 'guest',
          is_owner: isOwner === true,
        },
      }),
    })

    const tokenData = await response.json()

    if (tokenData.error) {
      throw new Error(tokenData.info || 'Failed to generate Daily token')
    }

    return new Response(JSON.stringify({ token: tokenData.token }), {
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
