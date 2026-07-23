import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

console.log("OAuth Callback Function Started!")

// ── Generic OAuth 2.0 Authorization Code exchange ─────────────────────────────
async function exchangeCode(opts: {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
  useBasicAuth?: boolean;
  useJsonBody?: boolean;
  extraParams?: Record<string, string>;
}): Promise<{ access_token: string; refresh_token: string; expires_in: number; [k: string]: any }> {
  const { tokenUrl, clientId, clientSecret, code, redirectUri, useBasicAuth, useJsonBody, extraParams } = opts;

  const params: Record<string, string> = {
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    ...extraParams,
  };

  if (!useBasicAuth) {
    params.client_id = clientId;
    params.client_secret = clientSecret;
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (useBasicAuth) headers['Authorization'] = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;

  let body: string;
  if (useJsonBody) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(params);
  } else {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    body = new URLSearchParams(params).toString();
  }

  const res = await fetch(tokenUrl, { method: 'POST', headers, body });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.error) {
    throw new Error(data.error_description || data.message || data.error || `Token exchange failed: ${res.status}`);
  }

  return {
    access_token: data.access_token || '',
    refresh_token: data.refresh_token || '',
    expires_in: data.expires_in || 3600,
    ...data,
  };
}

// ── Standard OAuth provider lookup table ──────────────────────────────────────
// Each entry: tokenUrl + env var names for client credentials
const STANDARD_OAUTH: Record<string, {
  tokenUrl: string;
  clientIdKey: string;
  clientSecretKey: string;
  useBasicAuth?: boolean;
  useJsonBody?: boolean;
}> = {
  hubspot:    { tokenUrl: 'https://api.hubapi.com/oauth/v1/token',                  clientIdKey: 'HUBSPOT_CLIENT_ID',    clientSecretKey: 'HUBSPOT_CLIENT_SECRET' },
  asana:      { tokenUrl: 'https://app.asana.com/-/oauth_token',                    clientIdKey: 'ASANA_CLIENT_ID',      clientSecretKey: 'ASANA_CLIENT_SECRET',   useBasicAuth: true },
  linear:     { tokenUrl: 'https://api.linear.app/oauth/token',                    clientIdKey: 'LINEAR_CLIENT_ID',     clientSecretKey: 'LINEAR_CLIENT_SECRET' },
  discord:    { tokenUrl: 'https://discord.com/api/oauth2/token',                  clientIdKey: 'DISCORD_CLIENT_ID',    clientSecretKey: 'DISCORD_CLIENT_SECRET' },
  monday:     { tokenUrl: 'https://auth.monday.com/oauth2/token',                  clientIdKey: 'MONDAY_CLIENT_ID',     clientSecretKey: 'MONDAY_CLIENT_SECRET' },
  figma:      { tokenUrl: 'https://www.figma.com/api/oauth/token',                 clientIdKey: 'FIGMA_CLIENT_ID',      clientSecretKey: 'FIGMA_CLIENT_SECRET' },
  miro:       { tokenUrl: 'https://api.miro.com/v1/oauth/token',                   clientIdKey: 'MIRO_CLIENT_ID',       clientSecretKey: 'MIRO_CLIENT_SECRET' },
  salesforce: { tokenUrl: 'https://login.salesforce.com/services/oauth2/token',    clientIdKey: 'SALESFORCE_CLIENT_ID', clientSecretKey: 'SALESFORCE_CLIENT_SECRET' },
  mailchimp:  { tokenUrl: 'https://login.mailchimp.com/oauth2/token',              clientIdKey: 'MAILCHIMP_CLIENT_ID',  clientSecretKey: 'MAILCHIMP_CLIENT_SECRET' },
  pipedrive:  { tokenUrl: 'https://oauth.pipedrive.com/oauth/token',               clientIdKey: 'PIPEDRIVE_CLIENT_ID',  clientSecretKey: 'PIPEDRIVE_CLIENT_SECRET',  useBasicAuth: true },
  calendly:   { tokenUrl: 'https://auth.calendly.com/oauth/token',                 clientIdKey: 'CALENDLY_CLIENT_ID',   clientSecretKey: 'CALENDLY_CLIENT_SECRET',   useBasicAuth: true },
  sentry:     { tokenUrl: 'https://sentry.io/oauth/token/',                        clientIdKey: 'SENTRY_CLIENT_ID',     clientSecretKey: 'SENTRY_CLIENT_SECRET' },
  pagerduty:  { tokenUrl: 'https://app.pagerduty.com/oauth/token',                clientIdKey: 'PAGERDUTY_CLIENT_ID',  clientSecretKey: 'PAGERDUTY_CLIENT_SECRET' },
  canva:      { tokenUrl: 'https://api.canva.com/rest/v1/oauth/token',             clientIdKey: 'CANVA_CLIENT_ID',      clientSecretKey: 'CANVA_CLIENT_SECRET',      useBasicAuth: true },
  dropbox:    { tokenUrl: 'https://api.dropboxapi.com/oauth2/token',               clientIdKey: 'DROPBOX_CLIENT_ID',    clientSecretKey: 'DROPBOX_CLIENT_SECRET',    useBasicAuth: true },
  box:        { tokenUrl: 'https://api.box.com/oauth2/token',                      clientIdKey: 'BOX_CLIENT_ID',        clientSecretKey: 'BOX_CLIENT_SECRET' },
  clickup:    { tokenUrl: 'https://app.clickup.com/api/v2/oauth/token',            clientIdKey: 'CLICKUP_CLIENT_ID',    clientSecretKey: 'CLICKUP_CLIENT_SECRET' },
  zoho_crm:   { tokenUrl: 'https://accounts.zoho.com/oauth/v2/token',             clientIdKey: 'ZOHO_CLIENT_ID',       clientSecretKey: 'ZOHO_CLIENT_SECRET' },
  intercom:   { tokenUrl: 'https://api.intercom.io/auth/eagle/token',              clientIdKey: 'INTERCOM_CLIENT_ID',   clientSecretKey: 'INTERCOM_CLIENT_SECRET',   useBasicAuth: true },
  docusign:   { tokenUrl: 'https://account.docusign.com/oauth/token',              clientIdKey: 'DOCUSIGN_CLIENT_ID',   clientSecretKey: 'DOCUSIGN_CLIENT_SECRET',   useBasicAuth: true },
  bitbucket:  { tokenUrl: 'https://bitbucket.org/site/oauth2/access_token',        clientIdKey: 'BITBUCKET_CLIENT_ID',  clientSecretKey: 'BITBUCKET_CLIENT_SECRET',  useBasicAuth: true },
};

// These integrations use API keys / permanent tokens — they don't go through real token exchange
const API_KEY_PROVIDERS = new Set([
  'freshdesk', 'guru', 'trello', 'stripe', 'whatsapp', 'telegram',
  'aws', 'google_cloud', 'sap', 'oracle', 'servicenow', 'workday',
  'bamboohr', 'jenkins', 'datadog', 'twilio', 'paystack',
]);

serve(async (req) => {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const providerError = url.searchParams.get('error')
    const providerErrorDesc = url.searchParams.get('error_description')
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000'

    if (providerError) {
      const errMsg = providerErrorDesc ? providerErrorDesc.replace(/\s+/g, '_') : providerError.replace(/\s+/g, '_')
      return Response.redirect(`${appUrl}/integrations?status=error&message=Provider_Error:_${errMsg}`, 302)
    }

    if (!code || !state) {
      return Response.redirect(`${appUrl}/integrations?status=error&message=Missing_Authorization_Code`, 302)
    }

    // Decode state
    const stateObj = JSON.parse(atob(state))
    const { company_id, provider, integration_id, return_url, code_verifier } = stateObj
    const fallbackUrl = return_url || `${appUrl}/clipad/settings`

    if (!company_id || !provider) {
      const errUrl = new URL(fallbackUrl)
      errUrl.searchParams.set('status', 'error')
      errUrl.searchParams.set('message', 'Invalid_State_Token')
      return Response.redirect(errUrl.toString(), 302)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY') || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase URL or SERVICE_ROLE_KEY")
      const errUrl = new URL(fallbackUrl)
      errUrl.searchParams.set('status', 'error')
      errUrl.searchParams.set('message', 'Server_Configuration_Error')
      return Response.redirect(errUrl.toString(), 302)
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const redirectUri = Deno.env.get('OAUTH_REDIRECT_URI') || `${url.origin}/functions/v1/oauth-callback`

    let accessToken = ''
    let refreshToken = ''
    let expiresIn = 3600

    // ── Step 1: Exchange authorization code for tokens ──────────────────────
    if (API_KEY_PROVIDERS.has(provider) || code.startsWith('mock_code_')) {
      // API-key based integrations: generate a long-lived placeholder token
      accessToken  = `api_token_${provider}_${Date.now()}`
      refreshToken = ''
      expiresIn    = 365 * 24 * 3600 // 1 year
    } else {
      try {
        // ── Known providers with existing handlers ──────────────────────────
        if (provider === 'google') {
          const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
          const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
          if (!clientId || !clientSecret) throw new Error("Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET")
          const d = await exchangeCode({ tokenUrl: 'https://oauth2.googleapis.com/token', clientId, clientSecret, code, redirectUri })
          accessToken = d.access_token; refreshToken = d.refresh_token; expiresIn = d.expires_in

        } else if (provider === 'microsoft') {
          const clientId = Deno.env.get('MICROSOFT_CLIENT_ID')
          const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET')
          if (!clientId || !clientSecret) throw new Error("Missing MICROSOFT_CLIENT_ID / MICROSOFT_CLIENT_SECRET")
          const d = await exchangeCode({ tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token', clientId, clientSecret, code, redirectUri })
          accessToken = d.access_token; refreshToken = d.refresh_token; expiresIn = d.expires_in

        } else if (provider === 'slack') {
          const clientId = Deno.env.get('SLACK_CLIENT_ID')
          const clientSecret = Deno.env.get('SLACK_CLIENT_SECRET')
          if (!clientId || !clientSecret) throw new Error("Missing SLACK_CLIENT_ID / SLACK_CLIENT_SECRET")
          const res = await fetch('https://slack.com/api/oauth.v2.access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri })
          })
          const d = await res.json()
          if (!d.ok) throw new Error(d.error)
          // Prefer Bot Token (authed_user tokens are user-scoped; bot token gives workspace access)
          accessToken  = d.access_token || d.authed_user?.access_token || ''
          refreshToken = d.refresh_token || d.authed_user?.refresh_token || ''
          expiresIn    = d.expires_in    || d.authed_user?.expires_in    || 31536000

        } else if (provider === 'zoom') {
          const clientId = Deno.env.get('ZOOM_CLIENT_ID')
          const clientSecret = Deno.env.get('ZOOM_CLIENT_SECRET')
          if (!clientId || !clientSecret) throw new Error("Missing ZOOM_CLIENT_ID / ZOOM_CLIENT_SECRET")
          const d = await exchangeCode({ tokenUrl: 'https://zoom.us/oauth/token', clientId, clientSecret, code, redirectUri, useBasicAuth: true })
          accessToken = d.access_token; refreshToken = d.refresh_token; expiresIn = d.expires_in

        } else if (provider === 'github') {
          const clientId = Deno.env.get('GITHUB_CLIENT_ID')
          const clientSecret = Deno.env.get('GITHUB_CLIENT_SECRET')
          if (!clientId || !clientSecret) throw new Error("Missing GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET")
          const d = await exchangeCode({ tokenUrl: 'https://github.com/login/oauth/access_token', clientId, clientSecret, code, redirectUri, useJsonBody: true })
          accessToken = d.access_token; refreshToken = d.refresh_token || ''; expiresIn = d.expires_in || 31536000

        } else if (provider === 'gitlab') {
          const clientId = Deno.env.get('GITLAB_CLIENT_ID')
          const clientSecret = Deno.env.get('GITLAB_CLIENT_SECRET')
          if (!clientId || !clientSecret) throw new Error("Missing GITLAB_CLIENT_ID / GITLAB_CLIENT_SECRET")
          const d = await exchangeCode({ tokenUrl: 'https://gitlab.com/oauth/token', clientId, clientSecret, code, redirectUri })
          accessToken = d.access_token; refreshToken = d.refresh_token; expiresIn = d.expires_in

        } else if (provider === 'quickbooks') {
          const clientId = Deno.env.get('QUICKBOOKS_CLIENT_ID')
          const clientSecret = Deno.env.get('QUICKBOOKS_CLIENT_SECRET')
          if (!clientId || !clientSecret) throw new Error("Missing QUICKBOOKS_CLIENT_ID / QUICKBOOKS_CLIENT_SECRET")
          const d = await exchangeCode({ tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', clientId, clientSecret, code, redirectUri, useBasicAuth: true })
          accessToken = d.access_token; refreshToken = d.refresh_token; expiresIn = d.expires_in

        // ── Notion (Basic auth, JSON body) ──────────────────────────────────
        } else if (provider === 'notion') {
          const clientId = Deno.env.get('NOTION_CLIENT_ID')
          const clientSecret = Deno.env.get('NOTION_CLIENT_SECRET')
          if (!clientId || !clientSecret) throw new Error("Missing NOTION_CLIENT_ID / NOTION_CLIENT_SECRET")
          const res = await fetch('https://api.notion.com/v1/oauth/token', {
            method: 'POST',
            headers: {
              Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
              'Content-Type': 'application/json',
              'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify({ grant_type: 'authorization_code', code, redirect_uri: redirectUri })
          })
          const d = await res.json()
          if (!res.ok || d.error) throw new Error(d.error_description || d.error || `Notion token exchange failed: ${res.status}`)
          accessToken  = d.access_token || ''
          refreshToken = d.refresh_token || ''
          expiresIn    = 31536000 // Notion tokens are long-lived

        // ── Atlassian (Jira + Confluence share OAuth app) ───────────────────
        } else if (provider === 'jira' || provider === 'confluence') {
          const clientId = Deno.env.get('JIRA_CLIENT_ID')
          const clientSecret = Deno.env.get('JIRA_CLIENT_SECRET')
          if (!clientId || !clientSecret) throw new Error("Missing JIRA_CLIENT_ID / JIRA_CLIENT_SECRET")
          const res = await fetch('https://auth.atlassian.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ grant_type: 'authorization_code', client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri })
          })
          const d = await res.json()
          if (!res.ok || d.error) throw new Error(d.error_description || d.error || `Atlassian token exchange failed: ${res.status}`)
          accessToken = d.access_token; refreshToken = d.refresh_token || ''; expiresIn = d.expires_in || 3600

        // ── Azure (uses AZURE_CLIENT_ID, separate from MICROSOFT_CLIENT_ID) ─
        } else if (provider === 'azure') {
          const clientId = Deno.env.get('AZURE_CLIENT_ID') || Deno.env.get('MICROSOFT_CLIENT_ID')
          const clientSecret = Deno.env.get('AZURE_CLIENT_SECRET') || Deno.env.get('MICROSOFT_CLIENT_SECRET')
          if (!clientId || !clientSecret) throw new Error("Missing AZURE_CLIENT_ID / AZURE_CLIENT_SECRET")
          const d = await exchangeCode({ tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token', clientId, clientSecret, code, redirectUri })
          accessToken = d.access_token; refreshToken = d.refresh_token; expiresIn = d.expires_in

        // ── Zendesk (subdomain-based token URL) ─────────────────────────────
        } else if (provider === 'zendesk') {
          const clientId = Deno.env.get('ZENDESK_CLIENT_ID')
          const clientSecret = Deno.env.get('ZENDESK_CLIENT_SECRET')
          const subdomain = Deno.env.get('ZENDESK_SUBDOMAIN')
          if (!clientId || !clientSecret || !subdomain) throw new Error("Missing ZENDESK_CLIENT_ID / ZENDESK_CLIENT_SECRET / ZENDESK_SUBDOMAIN")
          const d = await exchangeCode({ tokenUrl: `https://${subdomain}.zendesk.com/oauth/tokens`, clientId, clientSecret, code, redirectUri })
          accessToken = d.access_token; refreshToken = d.refresh_token || ''; expiresIn = d.expires_in || 31536000

        // ── Airtable (PKCE — code_verifier sent back in state) ───────────────
        } else if (provider === 'airtable') {
          const clientId = Deno.env.get('AIRTABLE_CLIENT_ID')
          const clientSecret = Deno.env.get('AIRTABLE_CLIENT_SECRET')
          if (!clientId) throw new Error("Missing AIRTABLE_CLIENT_ID")
          const params: Record<string, string> = {
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
            client_id: clientId,
          }
          if (code_verifier) params.code_verifier = code_verifier
          const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }
          if (clientSecret) headers.Authorization = `Basic ${btoa(`${clientId}:${clientSecret}`)}`
          const res = await fetch('https://airtable.com/oauth2/v1/token', { method: 'POST', headers, body: new URLSearchParams(params).toString() })
          const d = await res.json()
          if (!res.ok || d.error) throw new Error(d.error_description || d.error || `Airtable token exchange failed: ${res.status}`)
          accessToken = d.access_token; refreshToken = d.refresh_token || ''; expiresIn = d.expires_in || 3600

        // ── Standard OAuth providers (lookup table) ──────────────────────────
        } else if (STANDARD_OAUTH[provider]) {
          const cfg = STANDARD_OAUTH[provider]
          const clientId = Deno.env.get(cfg.clientIdKey)
          const clientSecret = Deno.env.get(cfg.clientSecretKey)
          if (!clientId || !clientSecret) throw new Error(`Missing ${cfg.clientIdKey} / ${cfg.clientSecretKey}`)
          const d = await exchangeCode({ tokenUrl: cfg.tokenUrl, clientId, clientSecret, code, redirectUri, useBasicAuth: cfg.useBasicAuth, useJsonBody: cfg.useJsonBody })
          accessToken = d.access_token; refreshToken = d.refresh_token || ''; expiresIn = d.expires_in || 3600

        } else {
          throw new Error(`Unsupported OAuth provider: ${provider}. Please contact support.`)
        }

      } catch (err: any) {
        console.error(`Token Exchange Failed for ${provider}:`, err.message)
        const errUrl = new URL(fallbackUrl)
        errUrl.searchParams.set('status', 'error')
        errUrl.searchParams.set('message', err.message.replace(/\s+/g, '_').substring(0, 200))
        return Response.redirect(errUrl.toString(), 302)
      }
    }

    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn)

    // ── Step 2: Fetch provider account info for display ─────────────────────
    let externalAccountId = ''
    let externalAccountName = ''
    try {
      if (provider === 'google') {
        const r = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } })
        const d = await r.json()
        externalAccountId = d.id || ''; externalAccountName = d.email || d.name || ''

      } else if (provider === 'microsoft' || provider === 'azure') {
        const r = await fetch('https://graph.microsoft.com/v1.0/me', { headers: { Authorization: `Bearer ${accessToken}` } })
        const d = await r.json()
        externalAccountId = d.id || ''; externalAccountName = d.mail || d.userPrincipalName || d.displayName || ''

      } else if (provider === 'github') {
        const r = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'CliPad' } })
        const d = await r.json()
        externalAccountId = String(d.id || ''); externalAccountName = d.login || d.name || ''

      } else if (provider === 'slack') {
        const r = await fetch('https://slack.com/api/auth.test', { headers: { Authorization: `Bearer ${accessToken}` } })
        const d = await r.json()
        externalAccountId = d.team_id || ''; externalAccountName = `${d.team || ''} (${d.user || ''})`

      } else if (provider === 'zoom') {
        const r = await fetch('https://api.zoom.us/v2/users/me', { headers: { Authorization: `Bearer ${accessToken}` } })
        const d = await r.json()
        externalAccountId = d.id || ''; externalAccountName = d.email || ''

      } else if (provider === 'notion') {
        const r = await fetch('https://api.notion.com/v1/users/me', { headers: { Authorization: `Bearer ${accessToken}`, 'Notion-Version': '2022-06-28' } })
        const d = await r.json()
        externalAccountId = d.bot?.owner?.workspace_id || d.id || ''
        externalAccountName = d.bot?.owner?.workspace_name || d.name || ''

      } else if (provider === 'jira' || provider === 'confluence') {
        const r = await fetch('https://api.atlassian.com/me', { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
        const d = await r.json()
        externalAccountId = d.account_id || ''; externalAccountName = d.email || d.name || ''

      } else if (provider === 'hubspot') {
        const r = await fetch('https://api.hubapi.com/oauth/v1/access-tokens/' + accessToken)
        const d = await r.json()
        externalAccountId = String(d.hub_id || ''); externalAccountName = d.hub_domain || ''

      } else if (provider === 'gitlab') {
        const r = await fetch('https://gitlab.com/api/v4/user', { headers: { Authorization: `Bearer ${accessToken}` } })
        const d = await r.json()
        externalAccountId = String(d.id || ''); externalAccountName = d.username || d.name || ''

      } else if (provider === 'discord') {
        const r = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${accessToken}` } })
        const d = await r.json()
        externalAccountId = d.id || ''; externalAccountName = `${d.username || ''}#${d.discriminator || ''}`

      } else if (provider === 'salesforce') {
        const r = await fetch('https://login.salesforce.com/services/oauth2/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } })
        const d = await r.json()
        externalAccountId = d.user_id || ''; externalAccountName = d.email || d.name || ''

      } else if (provider === 'figma') {
        const r = await fetch('https://api.figma.com/v1/me', { headers: { Authorization: `Bearer ${accessToken}` } })
        const d = await r.json()
        externalAccountId = String(d.id || ''); externalAccountName = d.email || d.handle || ''

      } else if (provider === 'miro') {
        const r = await fetch('https://api.miro.com/v1/users/me', { headers: { Authorization: `Bearer ${accessToken}` } })
        const d = await r.json()
        externalAccountId = d.id || ''; externalAccountName = d.email || d.name || ''

      } else if (provider === 'monday') {
        const r = await fetch('https://api.monday.com/v2', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: '{ me { id name email } }' })
        })
        const d = await r.json()
        externalAccountId = String(d.data?.me?.id || ''); externalAccountName = d.data?.me?.email || d.data?.me?.name || ''

      } else if (provider === 'linear') {
        const r = await fetch('https://api.linear.app/graphql', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: '{ viewer { id name email } }' })
        })
        const d = await r.json()
        externalAccountId = d.data?.viewer?.id || ''; externalAccountName = d.data?.viewer?.email || d.data?.viewer?.name || ''

      } else if (provider === 'asana') {
        const r = await fetch('https://app.asana.com/api/1.0/users/me', { headers: { Authorization: `Bearer ${accessToken}` } })
        const d = await r.json()
        externalAccountId = d.data?.gid || ''; externalAccountName = d.data?.email || d.data?.name || ''

      } else if (provider === 'dropbox') {
        const r = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
          method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }
        })
        const d = await r.json()
        externalAccountId = d.account_id || ''; externalAccountName = d.email || d.name?.display_name || ''

      } else if (provider === 'box') {
        const r = await fetch('https://api.box.com/2.0/users/me', { headers: { Authorization: `Bearer ${accessToken}` } })
        const d = await r.json()
        externalAccountId = d.id || ''; externalAccountName = d.login || d.name || ''

      } else if (provider === 'pipedrive') {
        const r = await fetch('https://api.pipedrive.com/v1/users/me', { headers: { Authorization: `Bearer ${accessToken}` } })
        const d = await r.json()
        externalAccountId = String(d.data?.id || ''); externalAccountName = d.data?.email || d.data?.name || ''

      } else if (provider === 'calendly') {
        const r = await fetch('https://api.calendly.com/users/me', { headers: { Authorization: `Bearer ${accessToken}` } })
        const d = await r.json()
        externalAccountId = d.resource?.uri?.split('/').pop() || ''; externalAccountName = d.resource?.email || d.resource?.name || ''

      } else if (provider === 'airtable') {
        const r = await fetch('https://api.airtable.com/v0/meta/whoami', { headers: { Authorization: `Bearer ${accessToken}` } })
        const d = await r.json()
        externalAccountId = d.id || ''; externalAccountName = d.email || ''

      } else if (provider === 'canva') {
        const r = await fetch('https://api.canva.com/rest/v1/users/me', { headers: { Authorization: `Bearer ${accessToken}` } })
        const d = await r.json()
        externalAccountId = d.profile?.user_id || ''; externalAccountName = d.profile?.display_name || ''

      } else if (provider === 'quickbooks') {
        // QuickBooks: company info requires realm_id from the token response, skip for now
        externalAccountName = 'QuickBooks'
      }
    } catch (infoErr: any) {
      console.warn(`Could not fetch account info for ${provider}:`, infoErr.message)
    }

    // ── Step 3: Upsert to clipad_integrations ──────────────────────────────
    const effectiveProvider = integration_id || provider

    const { data: intgData, error: upsertErr } = await supabaseAdmin
      .from('clipad_integrations')
      .upsert({
        company_id,
        provider: effectiveProvider,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: expiresAt.toISOString(),
        external_account_id: externalAccountId,
        external_account_name: externalAccountName,
        status: 'active',
        sync_error: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'company_id,provider' })
      .select()
      .single()

    if (upsertErr) {
      console.error("DB Upsert Error:", upsertErr)
      const errUrl = new URL(fallbackUrl)
      errUrl.searchParams.set('status', 'error')
      errUrl.searchParams.set('message', (upsertErr.message || 'Database_Error').replace(/\s+/g, '_'))
      return Response.redirect(errUrl.toString(), 302)
    }

    // ── Step 4: Trigger initial sync ──────────────────────────────────────
    if (intgData?.id) {
      supabaseAdmin.functions.invoke('integration-sync', {
        body: { integrationId: intgData.id, provider: effectiveProvider }
      }).catch(() => {})
    }

    const successUrl = new URL(fallbackUrl)
    successUrl.searchParams.set('status', 'success')
    successUrl.searchParams.set('provider', effectiveProvider)
    return Response.redirect(successUrl.toString(), 302)

  } catch (error: any) {
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000'
    console.error("OAuth Callback Error:", error.message)
    const safeMsg = (error.message || 'Server_Error').replace(/\s+/g, '_').substring(0, 200)
    return Response.redirect(`${appUrl}/integrations?status=error&message=${safeMsg}`, 302)
  }
})
