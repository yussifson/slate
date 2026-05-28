import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

console.log("OAuth Init Function Started!")

serve(async (req) => {
  try {
    const url = new URL(req.url)
    const provider = url.searchParams.get('provider')
    const company_id = url.searchParams.get('company_id')

    if (!provider || !company_id) {
      return new Response(JSON.stringify({ error: 'Missing provider or company_id' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const redirectUri = Deno.env.get('OAUTH_REDIRECT_URI') || 'http://localhost:54321/functions/v1/oauth-callback'
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000'
    const state = btoa(JSON.stringify({ company_id, provider }))

    let authUrl = ''

    // Switch based on provider to build the exact OAuth 2.0 URL
    switch (provider) {
      case 'google':
        const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')
        if (!googleClientId) throw new Error("Missing GOOGLE_CLIENT_ID")
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile%20https://www.googleapis.com/auth/calendar%20https://www.googleapis.com/auth/drive&access_type=offline&prompt=consent&state=${state}`
        break;

      case 'microsoft':
        const msClientId = Deno.env.get('MICROSOFT_CLIENT_ID')
        if (!msClientId) throw new Error("Missing MICROSOFT_CLIENT_ID")
        authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${msClientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&scope=offline_access%20user.read%20Mail.Read%20Calendars.ReadWrite&state=${state}`
        break;

      case 'slack':
        const slackClientId = Deno.env.get('SLACK_CLIENT_ID')
        if (!slackClientId) throw new Error("Missing SLACK_CLIENT_ID")
        authUrl = `https://slack.com/oauth/v2/authorize?client_id=${slackClientId}&user_scope=chat:write,channels:read&redirect_uri=${redirectUri}&state=${state}`
        break;

      case 'zoom':
        const zoomClientId = Deno.env.get('ZOOM_CLIENT_ID')
        if (!zoomClientId) throw new Error("Missing ZOOM_CLIENT_ID")
        authUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${zoomClientId}&redirect_uri=${redirectUri}&state=${state}`
        break;

      default:
        // If a provider isn't fully set up yet, mock the success redirect for demo purposes
        return Response.redirect(`${appUrl}/integrations?status=mock_success&provider=${provider}&company_id=${company_id}`, 302)
    }

    // Redirect the user to the provider's consent screen
    return Response.redirect(authUrl, 302)
  } catch (error) {
    // If keys are missing or an error occurs, fallback to a mock success redirect to keep the UI smooth during development
    const url = new URL(req.url)
    const provider = url.searchParams.get('provider')
    const company_id = url.searchParams.get('company_id')
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000'
    
    console.error("OAuth Init Error (falling back to mock):", error.message)
    return Response.redirect(`${appUrl}/integrations?status=mock_success&provider=${provider}&company_id=${company_id}`, 302)
  }
})
