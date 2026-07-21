// Telegram Syncer Module
import { upsertKnowledge } from '../utils.ts';

export async function syncTelegram(integration: any, supabase: any, lastSynced: Date | null) {
  let imported = 0;
  const token = integration.access_token || integration.metadata?.api_key;
  
  if (!token) throw new Error("Telegram Bot token missing.");

  // Get bot info (validate token)
  const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);

  if (!res.ok) throw new Error(`Telegram API error: ${res.status}`);

  const data = await res.json();
  const bot = data.result;
  
  if (bot && bot.id) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'telegram',
      external_id: bot.id.toString(),
      content_type: 'record',
      title: `Telegram Bot: @${bot.username}`,
      content: `Name: ${bot.first_name}\nID: ${bot.id}`,
      url: `https://t.me/${bot.username}`,
      author: null,
    }, integration);
    
    if (ok) imported++;
  }

  
  
  return imported;
}
