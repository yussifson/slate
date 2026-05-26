import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // For scheduled automations, skip user auth — use service role
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const hearings = await base44.asServiceRole.entities.Hearing.list();

  const upcoming = hearings.filter(h => {
    if (h.status !== "scheduled" || !h.date || !h.time) return false;
    const [hour, min] = (h.time || "09:00").split(":").map(Number);
    const hearingDate = new Date(h.date);
    hearingDate.setHours(hour, min, 0, 0);
    return hearingDate >= in24h && hearingDate <= in25h;
  });

  let notified = 0;

  for (const hearing of upcoming) {
    if (!hearing.lawyer_email) continue;

    const title = `Hearing Reminder: ${hearing.title}`;
    const message = `You have a court hearing scheduled in 24 hours.\n\nCase: ${hearing.case_title || "N/A"}\nCourt: ${hearing.court_name || "N/A"}\nDate: ${hearing.date} at ${hearing.time}\nJudge: ${hearing.judge_name || "N/A"}`;

    // Create in-app notification
    await base44.asServiceRole.entities.Notification.create({
      company_id: hearing.company_id,
      recipient_email: hearing.lawyer_email,
      recipient_name: hearing.lawyer_name || "",
      type: "hearing_reminder",
      title,
      message,
      related_id: hearing.id,
      is_read: false,
      email_sent: false,
    });

    // Send email notification
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: hearing.lawyer_email,
      subject: `[LexAfrica] ${title}`,
      body: `Dear ${hearing.lawyer_name || "Counsel"},\n\n${message}\n\nPlease log in to LexAfrica for full details.\n\n— LexAfrica Team`,
    });

    await base44.asServiceRole.entities.Notification.create({
      company_id: hearing.company_id,
      recipient_email: hearing.lawyer_email,
      type: "hearing_reminder",
      title,
      message,
      related_id: hearing.id,
      is_read: false,
      email_sent: true,
    });

    notified++;
  }

  return Response.json({ success: true, notified, checked: hearings.length });
});