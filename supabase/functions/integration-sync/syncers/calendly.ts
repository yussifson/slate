// Calendly Syncer Module
import { upsertKnowledge } from '../index.ts';

export async function syncCalendly(integration: any, supabase: any, lastSynced: Date | null) {
  let imported = 0;
  const token = integration.access_token;
  
  if (!token) {
    throw new Error("Calendly API token missing.");
  }

  // 1. Get current user URL
  const userRes = await fetch(`https://api.calendly.com/users/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!userRes.ok) throw new Error(`Calendly API error (User): ${userRes.status}`);
  const userData = await userRes.json();
  const userUrl = userData.resource?.uri;

  if (userUrl) {
    // 2. Fetch scheduled events
    const eventRes = await fetch(`https://api.calendly.com/scheduled_events?user=${encodeURIComponent(userUrl)}&status=active`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (eventRes.ok) {
      const eventData = await eventRes.json();
      const events = eventData.collection || [];
      
      for (const ev of events) {
        const ok = await upsertKnowledge(supabase, {
          provider: 'calendly',
          external_id: ev.uri,
          content_type: 'record',
          title: `Event: ${ev.name}`,
          content: `Start: ${ev.start_time}\nEnd: ${ev.end_time}\nStatus: ${ev.status}`,
          url: ev.location?.join_url || '',
          author: null,
        }, integration);
        
        if (ok) imported++;
      }
    }
  }

  
  
  return imported;
}
