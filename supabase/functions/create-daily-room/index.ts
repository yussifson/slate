import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { roomName, privacy, companyId } = await req.json()

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
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      const insertPayload = {
        id: roomName,
        company_id: companyId || '00000000-0000-0000-0000-000000000000',
        title: 'Meeting Room',
        daily_room_url: room.url,
        daily_room_name: room.name,
        status: 'active'
      };

      const { error: dbError } = await supabase
        .from('video_rooms')
        .upsert(insertPayload)

      if (dbError) {
        console.error('Failed to insert into video_rooms:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }
    }

    return new Response(JSON.stringify({ url: room.url, name: room.name }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error creating Daily room:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
