import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  try {
    // Only allow POST or internal triggers (like pg_net/pg_cron)
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase credentials")
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Find all scheduled meetings starting in exactly 15 minutes (or between 10-15 mins from now)
    // We assume the cron runs every 5 minutes.
    const now = new Date()
    const fifteenMinsFromNow = new Date(now.getTime() + 15 * 60000)
    const tenMinsFromNow = new Date(now.getTime() + 10 * 60000)

    const { data: meetings, error } = await supabase
      .from('video_rooms')
      .select('*')
      .eq('meeting_type', 'scheduled')
      .gte('scheduled_start_time', tenMinsFromNow.toISOString())
      .lte('scheduled_start_time', fifteenMinsFromNow.toISOString())
      // We might need an `is_reminder_sent` column or just rely on the 5-min window being checked once.

    if (error) throw error

    if (!meetings || meetings.length === 0) {
      return new Response(JSON.stringify({ message: "No upcoming meetings found to remind" }), { status: 200 })
    }

    let sentCount = 0;
    
    for (const meeting of meetings) {
      const participants = typeof meeting.participants === 'string' ? JSON.parse(meeting.participants) : (meeting.participants || [])
      
      for (const p of participants) {
        if (!p.email) continue;
        
        // Insert into notifications to trigger Novu webhook
        await supabase.from('notifications').insert({
          company_id: meeting.company_id,
          recipient_email: p.email,
          title: `Meeting Reminder: ${meeting.title}`,
          message: `Your video meeting starts in 15 minutes. Join here: ${meeting.meeting_link}`,
          type: 'video_meeting',
          related_id: meeting.meeting_link,
          created_by: 'system',
          is_read: 'false',
          email_sent: 'false'
        })
        sentCount++;
      }
    }

    return new Response(JSON.stringify({ success: true, meetings_processed: meetings.length, emails_sent: sentCount }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
