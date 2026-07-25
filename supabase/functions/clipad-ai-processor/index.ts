import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, transcript, roomId, spaceId, videoId } = await req.json();

    if (!transcript) {
      throw new Error("Transcript is required for AI processing");
    }

    // Connect to external LLM via _shared or direct API call
    // using OpenAI / Anthropic placeholders
    const prompt = `You are an AI meeting/video assistant. Summarize the following transcript.
Output ONLY a JSON object (no markdown formatting, no backticks, no text outside the JSON) with these exact keys:
- summary: A string (paragraph)
- decisions: An array of strings
- actionItems: An array of objects, each with 'assignee', 'task', and 'deadline' string properties
- openQuestions: An array of strings
- sentiment: A string
- extracted_signals: An array of objects, each representing a "Signal" detected in the transcript. A Signal has:
  - type: 'decision' or 'blocking' or 'commitment'
  - raw_excerpt: The exact quote that triggered the signal
  - entities: Array of people/teams mentioned
  - detail: If 'decision', provide the reasoning. If 'blocking', explain who is blocking whom.

Transcript:
${transcript}`;

    // Call Cloudflare AI using Kimi K2.5
    const cfToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
    const cfAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');

    let aiResponse;
    if (cfToken && cfAccountId) {
      const resp = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/moonshotai/kimi-k2.5`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cfToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1500
          })
        }
      );
      if (!resp.ok) {
        throw new Error(`Cloudflare AI Error: ${await resp.text()}`);
      }
      const data = await resp.json();
      const rawText = data.result?.response || '{}';
      
      try {
        aiResponse = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());
      } catch (e) {
        console.error("Failed to parse JSON from AI", rawText);
        aiResponse = { summary: "Failed to parse AI response." };
      }
    } else {
      // Fallback
      aiResponse = {
        summary: "Cloudflare AI credentials missing.",
      };
    }

    if (type === "meeting" && roomId) {
      // 1. Get meeting to get workspace_id and space_id
      const { data: meeting } = await supabase
        .from('clipad_meeting_records')
        .select('id, space_id, company_id')
        .eq('room_id', roomId)
        .single();

      // 2. Insert signals if we have meeting details
      if (meeting && aiResponse.extracted_signals && Array.isArray(aiResponse.extracted_signals)) {
        for (const signal of aiResponse.extracted_signals) {
          // Insert Signal Event
          const { data: sigEvent } = await supabase.from('clipad_signal_events').insert({
            workspace_id: meeting.company_id,
            team_space_id: meeting.space_id,
            type: signal.type,
            source: 'meeting',
            source_id: meeting.id,
            raw_excerpt: signal.raw_excerpt,
            extracted_entities: signal.entities
          }).select().single();

          if (sigEvent) {
            // Insert specific table entry
            if (signal.type === 'decision') {
              await supabase.from('clipad_decisions').insert({
                workspace_id: meeting.company_id,
                team_space_id: meeting.space_id,
                decision_text: signal.detail || 'Decision made in meeting',
                reasoning_text: signal.raw_excerpt,
                source_meeting_id: meeting.id,
                source_signal_event_id: sigEvent.id
              });
            } else if (signal.type === 'blocking') {
              await supabase.from('clipad_blockers').insert({
                workspace_id: meeting.company_id,
                team_space_id: meeting.space_id,
                description: signal.detail || signal.raw_excerpt,
                source_signal_event_id: sigEvent.id
              });
            }
          }
        }
      }

      const { error } = await supabase
        .from('clipad_meeting_records')
        .update({
          transcript,
          ai_summary: JSON.stringify(aiResponse),
          action_items: aiResponse.actionItems || [],
          open_questions: aiResponse.openQuestions || [],
          sentiment: aiResponse.sentiment || 'Neutral'
        })
        .eq('room_id', roomId);
      
      if (error) throw error;
    } else if (type === "video" && videoId) {
      const { error } = await supabase
        .from('clipad_videos')
        .update({
          transcript,
          ai_summary: JSON.stringify(aiResponse)
        })
        .eq('id', videoId);
        
      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ success: true, data: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
