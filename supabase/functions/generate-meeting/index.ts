import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getValidAccessToken } from '../_shared/token-manager.ts'

console.log("Generate Meeting Function Started!")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { companyId, provider, topic, duration, startTime } = await req.json()

    if (!companyId || !provider || !topic) {
      throw new Error("Missing required fields: companyId, provider, topic")
    }

    if (provider !== 'zoom') {
      throw new Error("Currently, only Zoom is supported for generate-meeting")
    }

    // Use our secure Token Manager to get a fresh valid token
    const accessToken = await getValidAccessToken(companyId, provider)
    
    if (!accessToken) {
      throw new Error(`Integration not connected or token expired for ${provider}. Please reconnect.`)
    }

    if (accessToken.startsWith('mock_')) {
      return new Response(JSON.stringify({ 
        success: true, 
        data: {
          join_url: "https://zoom.us/j/mock123456789?pwd=mock",
          start_url: "https://zoom.us/s/mock123456789?pwd=mock",
          password: "mockpassword",
          meeting_id: "mock123456789"
        } 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Call Zoom API to create a meeting
    const zoomResponse = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: topic || 'Optalflow Automated Meeting',
        type: 2, // Scheduled meeting
        start_time: startTime || new Date().toISOString(),
        duration: duration || 60, // minutes
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          mute_upon_entry: true,
          waiting_room: false
        }
      })
    })

    if (!zoomResponse.ok) {
      const errorText = await zoomResponse.text()
      // If the user used a real token but forgot to add scopes in Zoom Marketplace
      if (errorText.includes('does not contain scopes')) {
        throw new Error("Your Zoom App is missing required scopes. Please go to your Zoom App Marketplace dashboard and add the 'meeting:write:meeting' scope to your app.")
      }
      throw new Error(`Zoom API Error: ${errorText}`)
    }

    const meetingData = await zoomResponse.json()

    return new Response(JSON.stringify({ 
      success: true, 
      data: {
        join_url: meetingData.join_url,
        start_url: meetingData.start_url,
        password: meetingData.password,
        meeting_id: meetingData.id
      } 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Generate Meeting Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
