import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY') || ''

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function getValidAccessToken(companyId: string, provider: string): Promise<string | null> {
  // Fetch current tokens
  const { data, error } = await supabaseAdmin
    .from('connected_apps')
    .select('*')
    .eq('company_id', companyId)
    .eq('provider', provider)
    .single()

  if (error || !data) {
    console.error(`Token fetch error for ${provider}:`, error?.message)
    return null
  }

  // Check if expired or about to expire (within 5 minutes)
  const expiresAt = new Date(data.expires_at)
  const now = new Date()
  now.setMinutes(now.getMinutes() + 5)

  if (now > expiresAt && data.refresh_token) {
    console.log(`Token for ${provider} is expired. Refreshing...`)
    return await refreshAccessToken(companyId, provider, data.refresh_token)
  }

  return data.access_token
}

async function refreshAccessToken(companyId: string, provider: string, refreshToken: string): Promise<string | null> {
  try {
    let url = ''
    let body = new URLSearchParams()
    
    if (provider === 'google') {
      url = 'https://oauth2.googleapis.com/token'
      body.append('client_id', Deno.env.get('GOOGLE_CLIENT_ID') || '')
      body.append('client_secret', Deno.env.get('GOOGLE_CLIENT_SECRET') || '')
      body.append('refresh_token', refreshToken)
      body.append('grant_type', 'refresh_token')
    } else if (provider === 'microsoft') {
      url = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
      body.append('client_id', Deno.env.get('MICROSOFT_CLIENT_ID') || '')
      body.append('client_secret', Deno.env.get('MICROSOFT_CLIENT_SECRET') || '')
      body.append('refresh_token', refreshToken)
      body.append('grant_type', 'refresh_token')
    } else if (provider === 'zoom') {
      url = 'https://zoom.us/oauth/token'
      body.append('grant_type', 'refresh_token')
      body.append('refresh_token', refreshToken)
      // Zoom requires Basic Auth
      const clientId = Deno.env.get('ZOOM_CLIENT_ID') || ''
      const clientSecret = Deno.env.get('ZOOM_CLIENT_SECRET') || ''
      const authHeader = `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
      })
      
      return await handleRefreshResponse(response, companyId, provider, refreshToken)
    } else {
      throw new Error(`Unsupported auto-refresh provider: ${provider}`)
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    })

    return await handleRefreshResponse(response, companyId, provider, refreshToken)

  } catch (error) {
    console.error(`Refresh token error for ${provider}:`, error.message)
    // Mark connection as error if refresh fails completely
    await supabaseAdmin
      .from('connected_apps')
      .update({ status: 'error' })
      .eq('company_id', companyId)
      .eq('provider', provider)
    return null
  }
}

async function handleRefreshResponse(response: Response, companyId: string, provider: string, oldRefreshToken: string): Promise<string | null> {
  const data = await response.json()
  
  if (data.error) {
    throw new Error(data.error_description || data.error)
  }

  const newAccessToken = data.access_token
  const newRefreshToken = data.refresh_token || oldRefreshToken // Keep old if provider doesn't send a new one
  const expiresIn = data.expires_in || 3600
  
  const expiresAt = new Date()
  expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn)

  // Save new tokens to DB
  await supabaseAdmin
    .from('connected_apps')
    .update({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active'
    })
    .eq('company_id', companyId)
    .eq('provider', provider)

  return newAccessToken
}
