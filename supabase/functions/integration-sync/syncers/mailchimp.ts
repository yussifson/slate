// Mailchimp Syncer Module
import { upsertKnowledge } from '../index.ts';

export async function syncMailchimp(integration: any, supabase: any, lastSynced: Date | null) {
  let imported = 0;
  const token = integration.access_token || integration.metadata?.api_key;
  const dc = integration.metadata?.dc || 'us1'; // Data center (e.g. us1)
  
  if (!token) throw new Error("Mailchimp API token missing.");

  // Fetch Audiences (Lists)
  const res = await fetch(`https://${dc}.api.mailchimp.com/3.0/lists`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error(`Mailchimp API error: ${res.status}`);

  const data = await res.json();
  const lists = data.lists || [];
  
  for (const list of lists) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'mailchimp',
      external_id: list.id,
      content_type: 'record',
      title: `Audience List: ${list.name}`,
      content: `Total Subscribers: ${list.stats?.member_count}\nCampaigns: ${list.stats?.campaign_count}`,
      url: `https://${dc}.admin.mailchimp.com/lists/members?id=${list.id}`,
      author: null,
    }, integration);
    
    if (ok) imported++;
  }

  if (imported === 0) {
    await upsertKnowledge(supabase, {
      provider: 'mailchimp',
      external_id: `mailchimp-${integration.id}-status`,
      content_type: 'record',
      title: 'Mailchimp Connected',
      content: 'Mailchimp integration active. No audiences found.',
      url: '',
      author: null,
    }, integration);
    imported++;
  }
  
  return imported;
}
