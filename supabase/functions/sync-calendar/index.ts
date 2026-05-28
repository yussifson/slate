import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getValidAccessToken } from '../_shared/token-manager.ts'

console.log("Sync Calendar Function Started!")

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
    const { companyId, provider, eventDetails } = await req.json()

    if (!companyId || !provider || !eventDetails) {
      throw new Error("Missing required fields: companyId, provider, eventDetails")
    }

    // Use our secure Token Manager to get a fresh valid token
    const accessToken = await getValidAccessToken(companyId, provider)
    
    if (!accessToken) {
      throw new Error(`Integration not connected or token expired for ${provider}. Please reconnect.`)
    }

    let responseData = {}

    // =====================================
    // GOOGLE CALENDAR SYNC
    // =====================================
    if (provider === 'google') {
      const gEvent = {
        summary: eventDetails.title,
        description: eventDetails.description || 'Auto-synced from Optalflow',
        start: { dateTime: new Date(eventDetails.start).toISOString(), timeZone: 'UTC' },
        end: { dateTime: new Date(eventDetails.end).toISOString(), timeZone: 'UTC' },
        attendees: eventDetails.attendees ? eventDetails.attendees.map(email => ({ email })) : [],
      }

      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gEvent)
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Google API Error: ${errorText}`)
      }
      responseData = await res.json()
    } 
    
    // =====================================
    // MICROSOFT OUTLOOK CALENDAR SYNC
    // =====================================
    else if (provider === 'microsoft') {
      const msEvent = {
        subject: eventDetails.title,
        body: { contentType: "HTML", content: eventDetails.description || "Auto-synced from Optalflow" },
        start: { dateTime: new Date(eventDetails.start).toISOString(), timeZone: "UTC" },
        end: { dateTime: new Date(eventDetails.end).toISOString(), timeZone: "UTC" },
        attendees: eventDetails.attendees ? eventDetails.attendees.map(email => ({
          emailAddress: { address: email, name: email }, type: "required"
        })) : []
      }

      const res = await fetch('https://graph.microsoft.com/v1.0/me/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(msEvent)
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Microsoft Graph API Error: ${errorText}`)
      }
      responseData = await res.json()
    } else {
      throw new Error(`Unsupported calendar provider: ${provider}`)
    }

    return new Response(JSON.stringify({ success: true, data: responseData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Sync Calendar Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
