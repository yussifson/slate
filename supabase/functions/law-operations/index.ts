import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.14.0';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: { headers: { Authorization: req.headers.get('Authorization')! } }
            }
        );

        // For elevated operations
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { action, payload } = await req.json();
        
        // Ensure user is authenticated
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        if (action === 'conflict_check') {
            const { name, check_type, company_id } = payload;
            if (!name || !company_id) throw new Error('Missing parameters');

            // 1. Fetch potential matches using pg_trgm (in this case we do a basic ILIKE search as a fallback if fuzzy isn't available)
            // A more advanced fuzzy search would use a specific RPC that employs `similarity()` from `pg_trgm`.
            const searchTerm = `%${name}%`;

            const { data: clientMatches, error: cErr } = await supabaseClient
                .from('clients')
                .select('id, first_name, last_name, email')
                .eq('company_id', company_id)
                .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`);

            const { data: caseMatches, error: caErr } = await supabaseClient
                .from('cases')
                .select('id, title, opposing_counsel')
                .eq('company_id', company_id)
                .or(`title.ilike.${searchTerm},opposing_counsel.ilike.${searchTerm}`);

            if (cErr) throw cErr;
            if (caErr) throw caErr;

            const allMatches = [...(clientMatches || []), ...(caseMatches || [])];
            const conflict_detected = allMatches.length > 0;

            const { data: result, error: iErr } = await supabaseClient
                .from('conflict_check_results')
                .insert({
                    company_id,
                    checked_name: name,
                    check_type,
                    matches_found: allMatches,
                    conflict_detected,
                    checked_by: user.id
                })
                .select()
                .single();
            
            if (iErr) throw iErr;

            return new Response(JSON.stringify({ success: true, result }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (action === 'generate_portal_invite') {
            const { client_id, email, company_id } = payload;
            
            // Generate a random token
            const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');

            const { data, error } = await supabaseAdmin
                .from('client_portal_access')
                .upsert({
                    company_id,
                    client_id,
                    email,
                    access_token: token,
                    is_active: true,
                    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
                }, { onConflict: 'company_id,client_id,email' })
                .select()
                .single();

            if (error) throw error;

            // In a real app, we would trigger an email via Resend or SendGrid here
            // e.g. await sendEmail({ to: email, body: `Your link: https://app.com/portal/${token}` })

            return new Response(JSON.stringify({ success: true, link: `https://app.com/portal/${token}` }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        throw new Error('Unknown action');

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
