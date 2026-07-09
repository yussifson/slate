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
Extract: 
1. Key summary (paragraph)
2. Decisions made (bullet points)
3. Action items (with assignees and deadlines)
4. Open questions
5. Sentiment

Transcript:
${transcript}`;

    // Mock LLM Response for scaffold
    const mockAiResponse = {
      summary: "This was a productive meeting discussing the new CliPad architecture.",
      decisions: ["Use Supabase Storage for async video", "Use Daily.js for live calls"],
      actionItems: [{ assignee: "John", task: "Setup Daily.js token generation", deadline: "Next Friday" }],
      openQuestions: ["What LLM provider should we use?"],
      sentiment: "Positive and forward-looking",
      rawText: "This was a productive meeting..."
    };

    if (type === "meeting" && roomId) {
      const { error } = await supabase
        .from('clipad_meeting_records')
        .insert({
          room_id: roomId,
          space_id: spaceId,
          transcript,
          ai_summary: JSON.stringify(mockAiResponse),
          action_items: mockAiResponse.actionItems,
          open_questions: mockAiResponse.openQuestions,
          sentiment: mockAiResponse.sentiment
        });
      
      if (error) throw error;
    } else if (type === "video" && videoId) {
      const { error } = await supabase
        .from('clipad_videos')
        .update({
          transcript,
          ai_summary: JSON.stringify(mockAiResponse)
        })
        .eq('id', videoId);
        
      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ success: true, data: mockAiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
