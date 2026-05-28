import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getValidAccessToken } from '../_shared/token-manager.ts'

console.log("Sync Invoice Function Started!")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { companyId, provider, invoiceDetails } = await req.json()

    if (!companyId || !provider || !invoiceDetails) {
      throw new Error("Missing required fields: companyId, provider, invoiceDetails")
    }

    if (provider !== 'quickbooks') {
      throw new Error("Currently, only QuickBooks Online is supported for sync-invoice")
    }

    // Use our secure Token Manager to get a fresh valid token
    const accessToken = await getValidAccessToken(companyId, provider)
    
    if (!accessToken) {
      throw new Error(`Integration not connected or token expired for ${provider}. Please reconnect.`)
    }

    const realmId = Deno.env.get('QUICKBOOKS_REALM_ID') // Usually retrieved dynamically, mocked here for simplicity
    if (!realmId) throw new Error("Missing QUICKBOOKS_REALM_ID in environment")

    const qbApiUrl = `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/invoice`

    // Call QuickBooks API to create an invoice
    const qbResponse = await fetch(qbApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        "Line": [
          {
            "Amount": invoiceDetails.amount,
            "DetailType": "SalesItemLineDetail",
            "SalesItemLineDetail": {
              "ItemRef": {
                "value": "1", // Mocked item ID
                "name": "Services"
              }
            }
          }
        ],
        "CustomerRef": {
          "value": "1" // Mocked customer ID
        }
      })
    })

    if (!qbResponse.ok) {
      const errorText = await qbResponse.text()
      throw new Error(`QuickBooks API Error: ${errorText}`)
    }

    const data = await qbResponse.json()

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Sync Invoice Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
