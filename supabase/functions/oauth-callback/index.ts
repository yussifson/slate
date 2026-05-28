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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    // Fallback if missing Supabase keys (e.g. running locally without env set)
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase URL or Service Role Key")
      const mockUrl = new URL(fallbackUrl)
      mockUrl.searchParams.set('status', 'mock_success')
      mockUrl.searchParams.set('provider', provider)
      mockUrl.searchParams.set('company_id', company_id)
      return Response.redirect(mockUrl.toString(), 302)
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // ==========================================
    // TOKEN EXCHANGE LOGIC WOULD GO HERE
    // ==========================================
    
    const mockAccessToken = `mock_access_token_${provider}_${crypto.randomUUID()}`
    const mockRefreshToken = `mock_refresh_token_${provider}_${crypto.randomUUID()}`
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // Expires in 1 hour

    // Securely upsert the connected app credentials into the database
    const { error } = await supabaseAdmin
      .from('connected_apps')
      .upsert({
        company_id: company_id,
        provider: provider,
        access_token: mockAccessToken,
        refresh_token: mockRefreshToken,
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
