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
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { meetingId } = await req.json();

    if (!meetingId) {
      return new Response(JSON.stringify({ error: "meetingId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Fetch the meeting record
    const { data: meeting, error: meetingErr } = await supabase
      .from("clipad_meeting_records")
      .select("*")
      .eq("id", meetingId)
      .single();

    if (meetingErr || !meeting) {
      throw new Error("Meeting not found");
    }

    // 2. Fetch action items for this meeting
    const { data: actionItems } = await supabase
      .from("clipad_action_items")
      .select("*, assignedUser:assigned_to(full_name, email)")
      .eq("meeting_id", meetingId);

    // 3. Fetch host profile for email
    const { data: hostProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", meeting.host_id)
      .single();

    // 4. Collect all attendee emails from action items
    const emailSet = new Set<string>();
    if (hostProfile?.email) emailSet.add(hostProfile.email);
    (actionItems || []).forEach((item: any) => {
      if (item.assignedUser?.email) emailSet.add(item.assignedUser.email);
    });

    const attendeeEmails = Array.from(emailSet);

    if (attendeeEmails.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No attendee emails found to send to.", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Build email content
    const meetingTitle = meeting.meeting_title || meeting.title || "Meeting";
    const meetingDate = new Date(meeting.created_at).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
    const summary = meeting.ai_summary || "No summary available.";

    const actionItemsHtml = (actionItems || []).length > 0
      ? `<h3 style="color:#6366f1;margin-top:24px;">Action Items</h3><ul style="padding-left:20px;">${
          (actionItems || []).map((item: any) =>
            `<li style="margin-bottom:8px;"><strong>${item.title}</strong>${item.assignedUser?.full_name ? ` — Assigned to: ${item.assignedUser.full_name}` : ""}</li>`
          ).join("")
        }</ul>`
      : "";

    const htmlBody = `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;color:white;">
          <h1 style="margin:0;font-size:22px;">📋 Meeting Follow-Up</h1>
          <p style="margin:8px 0 0;opacity:0.85;">${meetingTitle} · ${meetingDate}</p>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#1e293b;font-size:18px;margin-top:0;">Summary</h2>
          <p style="color:#475569;line-height:1.6;">${summary}</p>
          ${actionItemsHtml}
          <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:13px;">
            <p>This follow-up was sent automatically by <strong>Slate CliPad</strong>.</p>
          </div>
        </div>
      </div>
    `;

    // 6. Send via Resend
    let sent = 0;
    for (const email of attendeeEmails) {
      try {
        if (resendApiKey) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "Slate CliPad <notifications@slate.optavel.com>",
              to: email,
              subject: `Follow-Up: ${meetingTitle}`,
              html: htmlBody,
            }),
          });
        }
        sent++;
      } catch (e) {
        console.error(`Failed to send to ${email}:`, e);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: `Follow-up emails sent to ${sent} attendee(s).`, sent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
