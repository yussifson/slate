import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wmabgiafwamxkcgxyhee.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtYWJnaWFmd2FteGtjZ3h5aGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NTk0MjIsImV4cCI6MjA5NTMzNTQyMn0.cXS4DjYP_KEMDJ5n1QXOfOu0TGxUOQktf_j88Y9FHpk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  console.log("Fetching all records to find users...");
  const { data: records, error } = await supabase
    .from('industry_records')
    .select('data');

  if (error) {
    console.error("Error fetching records:", error);
    return;
  }

  const emailSet = new Set();
  for (const r of records) {
    if (!r.data) continue;
    const em = r.data.email || r.data.user_email || r.data.contact_email || r.data.parent_email;
    if (em && em.includes('@')) emailSet.add(em);
  }

  const emails = [...emailSet];
  console.log(`Found ${emails.length} unique emails to broadcast to.`);

  if (emails.length === 0) {
    console.log("No users found to send messages to.");
    return;
  }

  for (const email of emails) {
    console.log(`Sending Eid Mubarak message to ${email}...`);
    
    // Save In-App Notification directly to DB
    await supabase.from('industry_records').insert({
      id: crypto.randomUUID(),
      company_id: records[0]?.data?.company_id || 'system',
      industry: 'core',
      record_type: 'Notification',
      search_text: email,
      data: {
        recipient_email: email,
        title: "Eid Mubarak! 🌙",
        message: "Wishing you and your family a joyous Eid filled with peace, happiness, and prosperity. Thank you for being part of the Optalflow family! ✨",
        type: "SYSTEM_BROADCAST",
        is_read: false,
        created_date: new Date().toISOString()
      }
    });

    // Trigger Edge Function for Email
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        recipientEmail: email,
        title: "Eid Mubarak! 🌙",
        message: "Wishing you and your family a joyous Eid filled with peace, happiness, and prosperity. Thank you for being part of the Optalflow family! ✨",
        type: "SYSTEM_BROADCAST",
        senderName: "Optalflow Team"
      })
    });

    if (!response.ok) {
      console.error(`Failed to send email to ${email}: ${response.statusText}`);
      const errTxt = await response.text();
      console.error(errTxt);
    } else {
      console.log(`Successfully broadcasted to ${email}`);
    }
  }
}

run();
