import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

console.log("OAuth Callback Function Started!")

serve(async (req) => {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000'

    // If there's no code or state, something went wrong or it's a direct hit
    if (!code || !state) {
      return Response.redirect(`${appUrl}/integrations?status=error&message=Missing_Authorization_Code`, 302)
    }

    // Decode the state object
    const stateObj = JSON.parse(atob(state))
    const { company_id, provider, return_url } = stateObj
    const fallbackUrl = return_url || `${appUrl}/integrations`

    if (!company_id || !provider) {
      const errUrl = new URL(fallbackUrl)
      errUrl.searchParams.set('status', 'error')
      errUrl.searchParams.set('message', 'Invalid_State_Token')
      return Response.redirect(errUrl.toString(), 302)
    }

    // Initialize Supabase Admin client to bypass RLS for inserting sensitive tokens
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY') || ''
    
    // Fallback if missing Supabase keys (e.g. running locally without env set)
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase URL or SERVICE_ROLE_KEY")
      const errUrl = new URL(fallbackUrl)
      errUrl.searchParams.set('status', 'error')
      errUrl.searchParams.set('message', 'Missing_SERVICE_ROLE_KEY_In_Secrets')
      return Response.redirect(errUrl.toString(), 302)
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // ==========================================
    // REAL OAUTH TOKEN EXCHANGE LOGIC
    // ==========================================
    
    let accessToken = ''
    let refreshToken = ''
    let expiresIn = 3600
    
    const redirectUri = Deno.env.get('OAUTH_REDIRECT_URI') || 'http://localhost:54321/functions/v1/oauth-callback'

    try {
      if (provider === 'google') {
        const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
        const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
        if (!clientId || !clientSecret) throw new Error("Missing Google Client ID/Secret in Edge Function Env")

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri
          })
        })
        const data = await tokenResponse.json()
        if (data.error) throw new Error(data.error_description || data.error)
        accessToken = data.access_token
        refreshToken = data.refresh_token || ''
        expiresIn = data.expires_in || 3600
        
      } else if (provider === 'microsoft') {
        const clientId = Deno.env.get('MICROSOFT_CLIENT_ID')
        const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET')
        if (!clientId || !clientSecret) throw new Error("Missing Microsoft Client ID/Secret in Edge Function Env")

        const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri
          })
        })
        const data = await tokenResponse.json()
        if (data.error) throw new Error(data.error_description || data.error)
        accessToken = data.access_token
        refreshToken = data.refresh_token || ''
        expiresIn = data.expires_in || 3600

      } else if (provider === 'slack') {
        const clientId = Deno.env.get('SLACK_CLIENT_ID')
        const clientSecret = Deno.env.get('SLACK_CLIENT_SECRET')
        if (!clientId || !clientSecret) throw new Error("Missing Slack Client ID/Secret in Edge Function Env")

        const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: redirectUri
          })
        })
        const data = await tokenResponse.json()
        if (!data.ok) throw new Error(data.error)
        accessToken = data.authed_user?.access_token || data.access_token
        refreshToken = data.authed_user?.refresh_token || data.refresh_token || ''
        expiresIn = data.authed_user?.expires_in || data.expires_in || 3600
      } else {
        throw new Error(`Unsupported provider for real exchange: ${provider}`)
      }
    } catch (err) {
      console.error(`Token Exchange Error for ${provider}:`, err.message)
      const errUrl = new URL(fallbackUrl)
      errUrl.searchParams.set('status', 'error')
      errUrl.searchParams.set('message', 'Token_Exchange_Failed')
      return Response.redirect(errUrl.toString(), 302)
    }

    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn)

    // Securely upsert the connected app credentials into the database
    const { error } = await supabaseAdmin
      .from('connected_apps')
      .upsert({
        company_id: company_id,
        provider: provider,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt.toISOString(),
        status: 'active',
        updated_at: new Date().toISOString()
      }, { onConflict: 'company_id, provider' })

    if (error) {
      console.error("DB Upsert Error:", error)
      const dbErrUrl = new URL(fallbackUrl)
      dbErrUrl.searchParams.set('status', 'error')
      dbErrUrl.searchParams.set('message', 'Database_Insert_Failed')
      return Response.redirect(dbErrUrl.toString(), 302)
    }

    // Redirect back to the exact URL the user came from
    const successUrl = new URL(fallbackUrl)
    successUrl.searchParams.set('status', 'success')
    successUrl.searchParams.set('provider', provider)
    successUrl.searchParams.set('company_id', company_id)
    return Response.redirect(successUrl.toString(), 302)

  } catch (error) {
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000'
    console.error("OAuth Callback Error:", error.message)
    return Response.redirect(`${appUrl}/integrations?status=error&message=Server_Error`, 302)
  }
})
