// WhatsApp Syncer Module
import { upsertKnowledge } from '../index.ts';

export async function syncWhatsApp(integration: any, supabase: any, lastSynced: Date | null) {
  let imported = 0;
  const token = integration.access_token || integration.metadata?.api_key;
  
  // WhatsApp Cloud API is webhook-driven, but we can do a basic token validation or fetch business profile
  if (!token) throw new Error("WhatsApp API token missing.");

  const phoneId = integration.metadata?.phone_number_id || 'me';

  const res = await fetch(`https://graph.facebook.com/v17.0/${phoneId}?fields=id,name,profile_picture_url`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error(`WhatsApp API error: ${res.status}`);

  const profile = await res.json();
  
  if (profile.id) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'whatsapp',
      external_id: profile.id,
      content_type: 'record',
      title: `WhatsApp Business: ${profile.name || profile.id}`,
      content: `ID: ${profile.id}`,
      url: profile.profile_picture_url || '',
      author: null,
    }, integration);
    
    if (ok) imported++;
  }

  
  
  return imported;
}
