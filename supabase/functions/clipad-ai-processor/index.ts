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

Transcript:
${transcript}`;

    // Call Cloudflare AI using Llama 3
    const cfToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
    const cfAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');

    let aiResponse;
    if (cfToken && cfAccountId) {
      const resp = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cfToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1024
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
