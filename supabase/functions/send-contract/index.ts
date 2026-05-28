import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getValidAccessToken } from '../_shared/token-manager.ts'

console.log("Send Contract Function Started!")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { companyId, provider, documentName, signerEmail, signerName } = await req.json()

    if (!companyId || !provider || !signerEmail) {
      throw new Error("Missing required fields: companyId, provider, signerEmail")
    }

    if (provider !== 'docusign') {
      throw new Error("Currently, only DocuSign is supported for send-contract")
    }

    // Use our secure Token Manager to get a fresh valid token
    const accessToken = await getValidAccessToken(companyId, provider)
    
    if (!accessToken) {
      throw new Error(`Integration not connected or token expired for ${provider}. Please reconnect.`)
    }

    const docusignAccountId = Deno.env.get('DOCUSIGN_ACCOUNT_ID')
    const docusignBaseUrl = Deno.env.get('DOCUSIGN_BASE_URL') || 'https://demo.docusign.net/restapi'
    if (!docusignAccountId) throw new Error("Missing DOCUSIGN_ACCOUNT_ID in environment")

    // Call DocuSign API to create and send an envelope
    const docusignResponse = await fetch(`${docusignBaseUrl}/v2.1/accounts/${docusignAccountId}/envelopes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        emailSubject: `Please sign ${documentName || 'Document'} from Optalflow`,
        status: "sent",
        templateId: "1", // Mocked template ID
        templateRoles: [
          {
            email: signerEmail,
            name: signerName || "Client",
            roleName: "signer"
          }
        ]
      })
    })

    if (!docusignResponse.ok) {
      const errorText = await docusignResponse.text()
      throw new Error(`DocuSign API Error: ${errorText}`)
    }

    const data = await docusignResponse.json()

    return new Response(JSON.stringify({ success: true, envelopeId: data.envelopeId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Send Contract Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
