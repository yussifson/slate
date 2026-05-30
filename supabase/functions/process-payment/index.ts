import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { getValidAccessToken } from '../_shared/token-manager.ts'

console.log("Process Payment Function Started!")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { companyId, provider, amount, currency, customerEmail, returnUrl } = await req.json()

    if (!companyId || !provider || !amount) {
      throw new Error("Missing required fields: companyId, provider, amount")
    }

    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000'
    const successUrl = returnUrl || `${appUrl}/payment/success`
    const cancelUrl = `${appUrl}/payment/cancel`

    // Initialize Supabase Admin Client to fetch tenant keys
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY') || ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch this company's active custom configurations
    const { data: connectedApp } = await supabaseAdmin
      .from('connected_apps')
      .select('access_token')
      .eq('company_id', companyId)
      .eq('provider', provider)
      .eq('status', 'active')
      .maybeSingle()

    let customSecretKey = ''
    if (connectedApp?.access_token) {
      try {
        const credentials = JSON.parse(connectedApp.access_token)
        customSecretKey = credentials.secret_key || ''
      } catch (e) {
        if (connectedApp.access_token && !connectedApp.access_token.startsWith('mock_')) {
          customSecretKey = connectedApp.access_token
        }
      }
    }

    // =====================================
    // STRIPE CHECKOUT
    // =====================================
    if (provider === 'stripe') {
      const stripeSecretKey = customSecretKey || Deno.env.get('STRIPE_SECRET_KEY')
      if (!stripeSecretKey) throw new Error("Missing STRIPE_SECRET_KEY in environment")
      
      // Stripe API expects amount in cents
      const amountInCents = Math.round(amount * 100)

      const body = new URLSearchParams()
      body.append('success_url', successUrl)
      body.append('cancel_url', cancelUrl)
      body.append('mode', 'payment')
      if (customerEmail) body.append('customer_email', customerEmail)
      
      body.append('line_items[0][price_data][currency]', currency || 'usd')
      body.append('line_items[0][price_data][product_data][name]', 'Optalflow Invoice Payment')
      body.append('line_items[0][price_data][unit_amount]', amountInCents.toString())
      body.append('line_items[0][quantity]', '1')

      const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      })

      const data = await stripeResponse.json()
      if (data.error) throw new Error(`Stripe API Error: ${data.error.message}`)

      return new Response(JSON.stringify({ success: true, paymentUrl: data.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } 
    
    // =====================================
    // PAYSTACK CHECKOUT
    // =====================================
    else if (provider === 'paystack') {
      const paystackSecretKey = customSecretKey || Deno.env.get('PAYSTACK_SECRET_KEY')
      if (!paystackSecretKey) throw new Error("Missing PAYSTACK_SECRET_KEY in environment")

      // Paystack expects amount in lowest denomination (e.g. kobo for NGN, pesewas for GHS)
      const amountInKobo = Math.round(amount * 100)
      
      if (!customerEmail) throw new Error("Paystack requires a customer email address")

      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: customerEmail,
          amount: amountInKobo,
          currency: currency || 'NGN',
          callback_url: successUrl
        })
      })

      const data = await paystackResponse.json()
      if (!data.status) throw new Error(`Paystack API Error: ${data.message}`)

      return new Response(JSON.stringify({ success: true, paymentUrl: data.data.authorization_url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } 
    
    else {
      throw new Error(`Unsupported payment provider: ${provider}`)
    }

  } catch (error) {
    console.error("Process Payment Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
