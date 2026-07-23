import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

console.log("OAuth Init Function Started!")

serve(async (req) => {
  try {
    const url = new URL(req.url)
    const provider = url.searchParams.get('provider')
    const company_id = url.searchParams.get('company_id')
    const integration_id = url.searchParams.get('integration_id')
    const return_url = url.searchParams.get('return_url') || `${Deno.env.get('APP_URL') || 'http://localhost:3000'}/clipad/settings`

    if (!provider || !company_id) {
      return new Response(JSON.stringify({ error: 'Missing provider or company_id' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || url.origin
    const redirectUri = Deno.env.get('OAUTH_REDIRECT_URI') || `${supabaseUrl}/functions/v1/oauth-callback`
    const state = btoa(JSON.stringify({ company_id, provider, integration_id, return_url }))

    let authUrl = ''

    switch (provider) {
      // ── Existing providers ────────────────────────────────────────────────
      case 'google': {
        const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')
        if (!googleClientId) throw new Error("Missing GOOGLE_CLIENT_ID")
        let scopes = 'email profile'
        if (integration_id === 'google_drive') scopes += ' https://www.googleapis.com/auth/drive.readonly'
        if (integration_id === 'gmail') scopes += ' https://www.googleapis.com/auth/gmail.readonly'
        if (integration_id === 'google_meet') scopes += ' https://www.googleapis.com/auth/calendar.readonly'
        if (integration_id === 'google_calendar') scopes += ' https://www.googleapis.com/auth/calendar.readonly'
        if (integration_id === 'google_cloud') scopes += ' https://www.googleapis.com/auth/cloud-platform.read-only'
        if (!integration_id) scopes += ' https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/calendar'
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent&state=${state}`
        break;
      }

      case 'microsoft': {
        const msClientId = Deno.env.get('MICROSOFT_CLIENT_ID')
        if (!msClientId) throw new Error("Missing MICROSOFT_CLIENT_ID")
        let scopes = 'offline_access user.read'
        if (integration_id === 'microsoft_onedrive') scopes += ' Files.Read.All'
        if (integration_id === 'ms_teams') scopes += ' Team.ReadBasic.All Chat.Read ChannelMessage.Read.All'
        if (integration_id === 'outlook') scopes += ' Mail.Read Calendars.ReadWrite'
        if (integration_id === 'sharepoint') scopes += ' Sites.Read.All Files.Read.All'
        authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${msClientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&scope=${encodeURIComponent(scopes)}&state=${state}`
        break;
      }

      case 'slack': {
        const slackClientId = Deno.env.get('SLACK_CLIENT_ID')
        if (!slackClientId) throw new Error("Missing SLACK_CLIENT_ID")
        const slackScopes = 'channels:history,channels:read,files:read,users:read,groups:history,groups:read'
        const slackUserScopes = 'channels:history,files:read,search:read'
        authUrl = `https://slack.com/oauth/v2/authorize?client_id=${slackClientId}&scope=${slackScopes}&user_scope=${slackUserScopes}&redirect_uri=${redirectUri}&state=${state}`
        break;
      }

      case 'zoom': {
        const zoomClientId = Deno.env.get('ZOOM_CLIENT_ID')
        if (!zoomClientId) throw new Error("Missing ZOOM_CLIENT_ID")
        // Note: Zoom scopes are strictly defined in the Marketplace App configuration. Do not pass scope in URL to avoid "invalid scope" mismatch errors.
        authUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${zoomClientId}&redirect_uri=${redirectUri}&state=${state}`
        break;
      }

      case 'github': {
        const ghClientId = Deno.env.get('GITHUB_CLIENT_ID')
        if (!ghClientId) throw new Error("Missing GITHUB_CLIENT_ID")
        authUrl = `https://github.com/login/oauth/authorize?client_id=${ghClientId}&redirect_uri=${redirectUri}&scope=repo+read:org&state=${state}`
        break;
      }

      case 'notion': {
        const notionClientId = Deno.env.get('NOTION_CLIENT_ID')
        if (!notionClientId) throw new Error("Missing NOTION_CLIENT_ID")
        authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${notionClientId}&response_type=code&owner=user&redirect_uri=${redirectUri}&state=${state}`
        break;
      }

      case 'hubspot': {
        const hsClientId = Deno.env.get('HUBSPOT_CLIENT_ID')
        if (!hsClientId) throw new Error("Missing HUBSPOT_CLIENT_ID")
        const hsScopes = 'crm.objects.contacts.read crm.objects.deals.read crm.objects.notes.read timeline'
        authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${hsClientId}&scope=${encodeURIComponent(hsScopes)}&redirect_uri=${redirectUri}&state=${state}`
        break;
      }

      case 'jira': {
        const jiraClientId = Deno.env.get('JIRA_CLIENT_ID')
        if (!jiraClientId) throw new Error("Missing JIRA_CLIENT_ID")
        const jiraScopes = 'read:jira-user read:jira-work'
        authUrl = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${jiraClientId}&scope=${encodeURIComponent(jiraScopes)}&redirect_uri=${redirectUri}&state=${state}&response_type=code&prompt=consent`
        break;
      }

      case 'dropbox': {
        const dbxClientId = Deno.env.get('DROPBOX_CLIENT_ID')
        if (!dbxClientId) throw new Error("Missing DROPBOX_CLIENT_ID")
        authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${dbxClientId}&response_type=code&redirect_uri=${redirectUri}&state=${state}&token_access_type=offline`
        break;
      }

      case 'quickbooks': {
        const qbClientId = Deno.env.get('QUICKBOOKS_CLIENT_ID')
        if (!qbClientId) throw new Error("Missing QUICKBOOKS_CLIENT_ID")
        authUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${qbClientId}&response_type=code&scope=com.intuit.quickbooks.accounting&redirect_uri=${redirectUri}&state=${state}`
        break;
      }

      // ── New Phase 3 providers ─────────────────────────────────────────────
      case 'discord': {
        const discordClientId = Deno.env.get('DISCORD_CLIENT_ID')
        if (!discordClientId) throw new Error("Missing DISCORD_CLIENT_ID")
        const discordScopes = 'identify guilds guilds.members.read messages.read'
        authUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${redirectUri}&response_type=code&scope=${encodeURIComponent(discordScopes)}&state=${state}`
        break;
      }

      case 'monday': {
        const returnWithInfo = new URL(return_url)
        returnWithInfo.searchParams.set('status', 'needs_api_key')
        returnWithInfo.searchParams.set('provider', 'monday')
        return Response.redirect(returnWithInfo.toString(), 302)
      }

      case 'gitlab': {
        const gitlabClientId = Deno.env.get('GITLAB_CLIENT_ID')
        if (!gitlabClientId) throw new Error("Missing GITLAB_CLIENT_ID")
        authUrl = `https://gitlab.com/oauth/authorize?client_id=${gitlabClientId}&redirect_uri=${redirectUri}&response_type=code&scope=read_api+read_repository&state=${state}`
        break;
      }

      case 'bitbucket': {
        const bbClientId = Deno.env.get('BITBUCKET_CLIENT_ID')
        if (!bbClientId) throw new Error("Missing BITBUCKET_CLIENT_ID")
        authUrl = `https://bitbucket.org/site/oauth2/authorize?client_id=${bbClientId}&response_type=code&redirect_uri=${redirectUri}&state=${state}&scope=account+repositories+issues`
        break;
      }

      case 'zoho_crm': {
        const zohoClientId = Deno.env.get('ZOHO_CLIENT_ID')
        if (!zohoClientId) throw new Error("Missing ZOHO_CLIENT_ID")
        const zohoScopes = 'ZohoCRM.modules.notes.read ZohoCRM.modules.activities.read'
        authUrl = `https://accounts.zoho.com/oauth/v2/auth?scope=${encodeURIComponent(zohoScopes)}&client_id=${zohoClientId}&response_type=code&access_type=offline&redirect_uri=${redirectUri}&state=${state}`
        break;
      }

      case 'zendesk': {
        const zdClientId = Deno.env.get('ZENDESK_CLIENT_ID')
        const zdSubdomain = Deno.env.get('ZENDESK_SUBDOMAIN')
        if (!zdClientId || !zdSubdomain) throw new Error("Missing ZENDESK_CLIENT_ID or ZENDESK_SUBDOMAIN")
        authUrl = `https://${zdSubdomain}.zendesk.com/oauth/authorizations/new?response_type=code&client_id=${zdClientId}&redirect_uri=${redirectUri}&scope=read&state=${state}`
        break;
      }

      case 'intercom': {
        const icClientId = Deno.env.get('INTERCOM_CLIENT_ID')
        if (!icClientId) throw new Error("Missing INTERCOM_CLIENT_ID")
        authUrl = `https://app.intercom.com/oauth?client_id=${icClientId}&redirect_uri=${redirectUri}&state=${state}`
        break;
      }

      case 'freshdesk': {
        // Freshdesk uses API key auth — redirect to a config page
        const returnWithInfo = new URL(return_url)
        returnWithInfo.searchParams.set('status', 'needs_api_key')
        returnWithInfo.searchParams.set('provider', 'freshdesk')
        return Response.redirect(returnWithInfo.toString(), 302)
      }

      case 'figma': {
        const figmaClientId = Deno.env.get('FIGMA_CLIENT_ID')
        if (!figmaClientId) throw new Error("Missing FIGMA_CLIENT_ID")
        authUrl = `https://www.figma.com/oauth?client_id=${figmaClientId}&redirect_uri=${redirectUri}&scope=file_read&response_type=code&state=${state}`
        break;
      }

      case 'miro': {
        const miroClientId = Deno.env.get('MIRO_CLIENT_ID')
        if (!miroClientId) throw new Error("Missing MIRO_CLIENT_ID")
        authUrl = `https://miro.com/oauth/authorize?response_type=code&client_id=${miroClientId}&redirect_uri=${redirectUri}&state=${state}`
        break;
      }

      case 'asana': {
        const asanaClientId = Deno.env.get('ASANA_CLIENT_ID')
        if (!asanaClientId) throw new Error("Missing ASANA_CLIENT_ID")
        authUrl = `https://app.asana.com/-/oauth_authorize?response_type=code&client_id=${asanaClientId}&redirect_uri=${redirectUri}&scope=workspaces:read%20projects:read%20tasks:read%20users:read&state=${state}`
        break;
      }

      case 'linear': {
        const linearClientId = Deno.env.get('LINEAR_CLIENT_ID')
        if (!linearClientId) throw new Error("Missing LINEAR_CLIENT_ID")
        authUrl = `https://linear.app/oauth/authorize?client_id=${linearClientId}&redirect_uri=${redirectUri}&response_type=code&scope=read&state=${state}`
        break;
      }

      case 'clickup': {
        const cuClientId = Deno.env.get('CLICKUP_CLIENT_ID')
        if (!cuClientId) throw new Error("Missing CLICKUP_CLIENT_ID")
        authUrl = `https://app.clickup.com/api?client_id=${cuClientId}&redirect_uri=${redirectUri}&state=${state}`
        break;
      }

      case 'salesforce': {
        const sfClientId = Deno.env.get('SALESFORCE_CLIENT_ID')
        if (!sfClientId) throw new Error("Missing SALESFORCE_CLIENT_ID")
        authUrl = `https://login.salesforce.com/services/oauth2/authorize?response_type=code&client_id=${sfClientId}&redirect_uri=${redirectUri}&scope=api+refresh_token&state=${state}`
        break;
      }

      case 'confluence': {
        // Confluence uses Atlassian OAuth (same as Jira)
        const atlClientId = Deno.env.get('JIRA_CLIENT_ID')
        if (!atlClientId) throw new Error("Missing JIRA_CLIENT_ID (shared Atlassian OAuth)")
        const atlScopes = 'read:confluence-content.all read:confluence-user read:confluence-space.summary'
        authUrl = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${atlClientId}&scope=${encodeURIComponent(atlScopes)}&redirect_uri=${redirectUri}&state=${state}&response_type=code&prompt=consent`
        break;
      }

      case 'guru': {
        // Guru uses API key + username — redirect to config page
        const returnWithInfo = new URL(return_url)
        returnWithInfo.searchParams.set('status', 'needs_api_key')
        returnWithInfo.searchParams.set('provider', 'guru')
        return Response.redirect(returnWithInfo.toString(), 302)
      }

      case 'trello': {
        // Trello OAuth 1.0a — redirect to API key acquisition page for PAT
        const returnWithInfo = new URL(return_url)
        returnWithInfo.searchParams.set('status', 'needs_api_key')
        returnWithInfo.searchParams.set('provider', 'trello')
        return Response.redirect(returnWithInfo.toString(), 302)
      }

      case 'box': {
        const boxClientId = Deno.env.get('BOX_CLIENT_ID')
        if (!boxClientId) throw new Error("Missing BOX_CLIENT_ID")
        authUrl = `https://account.box.com/api/oauth2/authorize?response_type=code&client_id=${boxClientId}&redirect_uri=${redirectUri}&state=${state}`
        break;
      }

      case 'stripe': {
        // Stripe uses API keys, not OAuth — redirect to config page
        const returnWithInfo = new URL(return_url)
        returnWithInfo.searchParams.set('status', 'needs_api_key')
        returnWithInfo.searchParams.set('provider', 'stripe')
        return Response.redirect(returnWithInfo.toString(), 302)
      }

      case 'mailchimp': {
        const mcClientId = Deno.env.get('MAILCHIMP_CLIENT_ID')
        if (!mcClientId) throw new Error("Missing MAILCHIMP_CLIENT_ID")
        authUrl = `https://login.mailchimp.com/oauth2/authorize?response_type=code&client_id=${mcClientId}&redirect_uri=${redirectUri}&state=${state}`
        break;
      }

      case 'pipedrive': {
        const pdClientId = Deno.env.get('PIPEDRIVE_CLIENT_ID')
        if (!pdClientId) throw new Error("Missing PIPEDRIVE_CLIENT_ID")
        authUrl = `https://oauth.pipedrive.com/oauth/authorize?client_id=${pdClientId}&redirect_uri=${redirectUri}&state=${state}`
        break;
      }

      case 'calendly': {
        const calClientId = Deno.env.get('CALENDLY_CLIENT_ID')
        if (!calClientId) throw new Error("Missing CALENDLY_CLIENT_ID")
        authUrl = `https://auth.calendly.com/oauth/authorize?client_id=${calClientId}&response_type=code&redirect_uri=${redirectUri}&state=${state}`
        break;
      }

      case 'airtable': {
        const atClientId = Deno.env.get('AIRTABLE_CLIENT_ID')
        if (!atClientId) throw new Error("Missing AIRTABLE_CLIENT_ID")
        const atScopes = 'data.records:read schema.bases:read'
        authUrl = `https://airtable.com/oauth2/v1/authorize?response_type=code&client_id=${atClientId}&redirect_uri=${redirectUri}&scope=${encodeURIComponent(atScopes)}&state=${state}&code_challenge_method=S256&code_challenge=${state.substring(0, 43)}`
        break;
      }

      case 'datadog': {
        // Datadog uses API keys
        const returnWithInfo = new URL(return_url)
        returnWithInfo.searchParams.set('status', 'needs_api_key')
        returnWithInfo.searchParams.set('provider', 'datadog')
        return Response.redirect(returnWithInfo.toString(), 302)
      }

      case 'sentry': {
        const snClientId = Deno.env.get('SENTRY_CLIENT_ID')
        if (!snClientId) throw new Error("Missing SENTRY_CLIENT_ID")
        authUrl = `https://sentry.io/oauth/authorize/?client_id=${snClientId}&response_type=code&redirect_uri=${redirectUri}&state=${state}`
        break;
      }

      case 'pagerduty': {
        const pdClientId = Deno.env.get('PAGERDUTY_CLIENT_ID')
        if (!pdClientId) throw new Error("Missing PAGERDUTY_CLIENT_ID")
        authUrl = `https://app.pagerduty.com/oauth/authorize?client_id=${pdClientId}&response_type=code&redirect_uri=${redirectUri}&state=${state}`
        break;
      }

      case 'jenkins': {
        // Jenkins uses API token auth
        const returnWithInfo = new URL(return_url)
        returnWithInfo.searchParams.set('status', 'needs_api_key')
        returnWithInfo.searchParams.set('provider', 'jenkins')
        return Response.redirect(returnWithInfo.toString(), 302)
      }

      case 'canva': {
        const cvClientId = Deno.env.get('CANVA_CLIENT_ID')
        if (!cvClientId) throw new Error("Missing CANVA_CLIENT_ID")
        authUrl = `https://www.canva.com/api/oauth/code?response_type=code&client_id=${cvClientId}&redirect_uri=${redirectUri}&scope=asset:read+design:meta:read&state=${state}`
        break;
      }

      case 'whatsapp': {
        // WhatsApp Business API uses permanent access tokens
        const returnWithInfo = new URL(return_url)
        returnWithInfo.searchParams.set('status', 'needs_api_key')
        returnWithInfo.searchParams.set('provider', 'whatsapp')
        return Response.redirect(returnWithInfo.toString(), 302)
      }

      case 'telegram': {
        // Telegram uses bot tokens
        const returnWithInfo = new URL(return_url)
        returnWithInfo.searchParams.set('status', 'needs_api_key')
        returnWithInfo.searchParams.set('provider', 'telegram')
        return Response.redirect(returnWithInfo.toString(), 302)
      }

      case 'aws': {
        // AWS uses access key + secret
        const returnWithInfo = new URL(return_url)
        returnWithInfo.searchParams.set('status', 'needs_api_key')
        returnWithInfo.searchParams.set('provider', 'aws')
        return Response.redirect(returnWithInfo.toString(), 302)
      }



      case 'azure': {
        const azClientId = Deno.env.get('AZURE_CLIENT_ID')
        if (!azClientId) throw new Error("Missing AZURE_CLIENT_ID")
        authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${azClientId}&response_type=code&redirect_uri=${redirectUri}&scope=${encodeURIComponent('https://management.azure.com/user_impersonation offline_access')}&state=${state}`
        break;
      }

      case 'google_cloud': {
        const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')
        if (googleClientId) {
          // Cloud Resource Manager API v3 requires the broad cloud-platform scope.
          const scopes = 'email profile https://www.googleapis.com/auth/cloud-platform'
          authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent&state=${state}`
        } else {
          // Fallback to API Key modal for service account JSON
          const returnWithInfo = new URL(return_url)
          returnWithInfo.searchParams.set('status', 'needs_api_key')
          returnWithInfo.searchParams.set('provider', 'google_cloud')
          return Response.redirect(returnWithInfo.toString(), 302)
        }
        break;
      }

      case 'sap': {
        const returnWithInfo = new URL(return_url)
        returnWithInfo.searchParams.set('status', 'needs_api_key')
        returnWithInfo.searchParams.set('provider', 'sap')
        return Response.redirect(returnWithInfo.toString(), 302)
      }

      case 'oracle': {
        const returnWithInfo = new URL(return_url)
        returnWithInfo.searchParams.set('status', 'needs_api_key')
        returnWithInfo.searchParams.set('provider', 'oracle')
        return Response.redirect(returnWithInfo.toString(), 302)
      }

      case 'servicenow': {
        const returnWithInfo = new URL(return_url)
        returnWithInfo.searchParams.set('status', 'needs_api_key')
        returnWithInfo.searchParams.set('provider', 'servicenow')
        return Response.redirect(returnWithInfo.toString(), 302)
      }

      case 'workday': {
        const returnWithInfo = new URL(return_url)
        returnWithInfo.searchParams.set('status', 'needs_api_key')
        returnWithInfo.searchParams.set('provider', 'workday')
        return Response.redirect(returnWithInfo.toString(), 302)
      }

      case 'bamboohr': {
        const returnWithInfo = new URL(return_url)
        returnWithInfo.searchParams.set('status', 'needs_api_key')
        returnWithInfo.searchParams.set('provider', 'bamboohr')
        return Response.redirect(returnWithInfo.toString(), 302)
      }

      case 'docusign': {
        const dsClientId = Deno.env.get('DOCUSIGN_CLIENT_ID')
        if (!dsClientId) throw new Error("Missing DOCUSIGN_CLIENT_ID")
        authUrl = `https://account.docusign.com/oauth/auth?response_type=code&scope=signature&client_id=${dsClientId}&redirect_uri=${redirectUri}&state=${state}`
        break;
      }

      default: {
        const errUrl = new URL(return_url)
        errUrl.searchParams.set('status', 'error')
        errUrl.searchParams.set('message', `Unsupported_Provider_${provider}`)
        return Response.redirect(errUrl.toString(), 302)
      }
    }

    return Response.redirect(authUrl, 302)
  } catch (error) {
    const url = new URL(req.url)
    const return_url = url.searchParams.get('return_url') || `${Deno.env.get('APP_URL') || 'http://localhost:3000'}/clipad/settings`
    console.error("OAuth Init Error:", error.message)
    const errUrl = new URL(return_url)
    errUrl.searchParams.set('status', 'error')
    errUrl.searchParams.set('message', error.message.replace(/\s+/g, '_'))
    return Response.redirect(errUrl.toString(), 302)
  }
})
