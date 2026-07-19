import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

console.log("OAuth Init Function Started!")

serve(async (req) => {
  try {
    const url = new URL(req.url)
    const provider = url.searchParams.get('provider')
    const company_id = url.searchParams.get('company_id')
    const integration_id = url.searchParams.get('integration_id') // e.g. 'google_drive', 'slack'
    const return_url = url.searchParams.get('return_url') || `${Deno.env.get('APP_URL') || 'http://localhost:3000'}/clipad/settings`

    if (!provider || !company_id) {
      return new Response(JSON.stringify({ error: 'Missing provider or company_id' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const redirectUri = Deno.env.get('OAUTH_REDIRECT_URI') || 'http://localhost:54321/functions/v1/oauth-callback'
    const state = btoa(JSON.stringify({ company_id, provider, integration_id, return_url }))

    let authUrl = ''

    switch (provider) {
      case 'google': {
        const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')
        if (!googleClientId) throw new Error("Missing GOOGLE_CLIENT_ID")
        // Determine scopes based on integration_id
        let scopes = 'email profile'
        if (integration_id === 'google_drive') scopes += ' https://www.googleapis.com/auth/drive.readonly'
        if (integration_id === 'gmail') scopes += ' https://www.googleapis.com/auth/gmail.readonly'
        if (integration_id === 'google_meet') scopes += ' https://www.googleapis.com/auth/calendar.readonly'
        if (!integration_id) scopes += ' https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/calendar'
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent&state=${state}`
        break;
      }

      case 'microsoft': {
        const msClientId = Deno.env.get('MICROSOFT_CLIENT_ID')
        if (!msClientId) throw new Error("Missing MICROSOFT_CLIENT_ID")
        let scopes = 'offline_access user.read'
        if (integration_id === 'microsoft_onedrive') scopes += ' Files.Read.All'
        if (integration_id === 'ms_teams') scopes += ' Chat.Read ChannelMessage.Read.All'
        if (integration_id === 'outlook') scopes += ' Mail.Read Calendars.ReadWrite'
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
        const hsScopes = 'crm.objects.contacts.read crm.objects.deals.read timeline'
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
