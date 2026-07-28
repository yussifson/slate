import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RENDER_URL = 'https://slate-2fli.onrender.com/health'

// Fix #9 — Keep the Render free-tier server alive by pinging it every 14 minutes.
// Render free instances sleep after 15 minutes of inactivity; this cron prevents that.
// Deploy: supabase functions deploy keep-render-alive --no-verify-jwt
// Then add a cron in Supabase Dashboard ? Edge Functions ? Cron: */14 * * * *
serve(async (_req) => {
  try {
    const res = await fetch(RENDER_URL, {
      method: 'GET',
      headers: { 'User-Agent': 'Supabase-KeepAlive-Cron/1.0' },
      signal: AbortSignal.timeout(10000),
    })
    const ok = res.ok
    console.log(`[keep-render-alive] Ping ${ok ? 'OK' : 'FAILED'} — status ${res.status}`)
    return new Response(JSON.stringify({ ok, status: res.status }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    console.error('[keep-render-alive] Ping error:', err.message)
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
