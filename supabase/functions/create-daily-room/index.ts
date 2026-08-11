import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Daily room names: 1-40 chars, alphanumeric + hyphens, no leading/trailing hyphens
function isValidDailyRoomName(name: string): boolean {
  if (!name || name.length < 1 || name.length > 40) return false;
  return /^[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9]$/.test(name) || /^[a-zA-Z0-9]$/.test(name);
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { roomName, privacy, companyId, dbId, max_participants } = await req.json()

    if (!DAILY_API_KEY) {
      throw new Error('DAILY_API_KEY is missing')
    }

    // Rooms expire in 7 days so scheduled meetings always work
    const expirySeconds = Math.round(Date.now() / 1000) + 86400 * 7

    // Only include `name` if it passes Daily's naming rules
    const roomBody: Record<string, unknown> = {
      privacy: privacy === 'public' ? 'public' : 'private',
      properties: {
        enable_knocking: privacy === 'public' ? true : false,
        max_participants: max_participants || undefined,
        exp: expirySeconds,
        enable_chat: true,
        enable_screenshare: true,
        start_video_off: false,
        start_audio_off: false,
        sfu_switchover: 2,
        enable_noise_cancellation_ui: true,
        enable_adaptive_layers: true,
        video_send_bitrate_target: 900,
        video_receive_bitrate_limit: 1200,
      },
    }

    if (roomName && isValidDailyRoomName(roomName)) {
      roomBody.name = roomName;
    }
    // If roomName is invalid (e.g. a short ID like "4-bzy-lsj"), let Daily auto-generate

    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify(roomBody),
    })

    const room = await response.json()

    if (room.error) {
      console.error('Daily API error:', room.error, room.info)
      throw new Error(room.info || room.error || 'Failed to create Daily room')
    }

    // Bypass offline mode and insert directly into Supabase using Service Role Key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dbId || '');
      const finalId = isUUID ? dbId : crypto.randomUUID()

      const insertPayload = {
        id: finalId,
        company_id: companyId || null,
        title: 'Meeting Room',
        daily_room_url: room.url,
        daily_room_name: room.name,
        status: 'active',
        privacy_type: privacy || 'public'
      }

      const { error: dbError } = await supabase
        .from('video_rooms')
        .upsert(insertPayload)

      if (dbError) {
        console.error('Failed to insert into video_rooms:', dbError)
        // Don't block — room was created on Daily, return success even if DB failed
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

