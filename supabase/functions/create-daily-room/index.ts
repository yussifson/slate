import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { roomName, privacy } = await req.json()

    if (!DAILY_API_KEY) {
      throw new Error('DAILY_API_KEY is missing')
    }

    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
        privacy: privacy || 'public',
        properties: {
          exp: Math.round(Date.now() / 1000) + 86400, // Expires in 24 hours
          enable_chat: true,
          enable_screenshare: true,
          start_video_off: false,
          start_audio_off: false,
          signaling_impl: 'ws'
        },
      }),
    })

    const room = await response.json()

    if (room.error) {
      throw new Error(room.info || 'Failed to create Daily room')
    }

    return new Response(JSON.stringify({ url: room.url, name: room.name }), {
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
