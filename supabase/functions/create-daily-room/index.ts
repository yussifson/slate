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

    // Bypass offline mode and insert directly into Supabase using Service Role Key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (supabaseUrl && supabaseServiceKey) {
      // Import createClient dynamically if possible, or just use a raw fetch request
      const insertPayload = {
        id: roomName,
        title: 'Meeting Room',
        daily_room_url: room.url,
        daily_room_name: room.name,
        status: 'active'
      };

      const dbResponse = await fetch(`${supabaseUrl}/rest/v1/video_rooms`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(insertPayload)
      });

      if (!dbResponse.ok) {
        console.error('Failed to insert into video_rooms:', await dbResponse.text());
      }
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
