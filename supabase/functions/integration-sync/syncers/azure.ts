// Azure Syncer Module
import { upsertKnowledge } from '../index.ts';

export async function syncAzure(integration: any, supabase: any, lastSynced: Date | null) {
  let imported = 0;
  const token = integration.access_token;
  
  if (!token) {
    throw new Error("Azure token missing. Please authenticate.");
  }

  // Fetch Subscriptions (Basic validation of Azure ARM API)
  const res = await fetch('https://management.azure.com/subscriptions?api-version=2020-01-01', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error(`Azure API error: ${res.status}`);
  }

  const data = await res.json();
  
  for (const sub of (data.value || [])) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'azure',
      external_id: sub.subscriptionId,
      content_type: 'record',
      title: `Azure Subscription: ${sub.displayName}`,
      content: `Subscription ID: ${sub.subscriptionId}, State: ${sub.state}`,
      url: `https://portal.azure.com/#@/resource/subscriptions/${sub.subscriptionId}`,
      author: null,
    }, integration);
    
    if (ok) imported++;
  }

  
  
  return imported;
}
