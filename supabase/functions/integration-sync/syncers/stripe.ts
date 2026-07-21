// Stripe Syncer Module
import { upsertKnowledge } from '../index.ts';

export async function syncStripe(integration: any, supabase: any, lastSynced: Date | null) {
  let imported = 0;
  const token = integration.access_token || integration.metadata?.api_key;
  
  if (!token) throw new Error("Stripe API token missing.");

  // Fetch Customers
  const res = await fetch(`https://api.stripe.com/v1/customers?limit=50`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error(`Stripe API error: ${res.status}`);

  const data = await res.json();
  const customers = data.data || [];
  
  for (const cus of customers) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'stripe',
      external_id: cus.id,
      content_type: 'record',
      title: `Customer: ${cus.name || cus.email || cus.id}`,
      content: `Email: ${cus.email}\nBalance: ${cus.balance}\nDelinquent: ${cus.delinquent}`,
      url: `https://dashboard.stripe.com/customers/${cus.id}`,
      author: null,
    }, integration);
    
    if (ok) imported++;
  }

  if (imported === 0) {
    await upsertKnowledge(supabase, {
      provider: 'stripe',
      external_id: `stripe-${integration.id}-status`,
      content_type: 'record',
      title: 'Stripe Connected',
      content: 'Stripe integration active. No customers found.',
      url: '',
      author: null,
    }, integration);
    imported++;
  }
  
  return imported;
}
