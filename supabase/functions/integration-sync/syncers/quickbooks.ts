// QuickBooks Syncer Module
import { upsertKnowledge } from '../index.ts';

export async function syncQuickbooks(integration: any, supabase: any, lastSynced: Date | null) {
  let imported = 0;
  const token = integration.access_token;
  const realmId = integration.metadata?.realm_id;
  const isSandbox = integration.metadata?.is_sandbox;
  
  if (!token || !realmId) throw new Error("QuickBooks API token or Realm ID missing.");

  const baseUrl = isSandbox ? 'https://sandbox-quickbooks.api.intuit.com' : 'https://quickbooks.api.intuit.com';

  // Fetch Customers
  const query = "SELECT * FROM Customer STARTPOSITION 1 MAXRESULTS 50";
  const res = await fetch(`${baseUrl}/v3/company/${realmId}/query?query=${encodeURIComponent(query)}&minorversion=65`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
  });

  if (!res.ok) throw new Error(`QuickBooks API error: ${res.status}`);

  const data = await res.json();
  const customers = data.QueryResponse?.Customer || [];
  
  for (const cus of customers) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'quickbooks',
      external_id: cus.Id,
      content_type: 'record',
      title: `QB Customer: ${cus.DisplayName || cus.CompanyName}`,
      content: `Balance: ${cus.Balance}\nEmail: ${cus.PrimaryEmailAddr?.Address}`,
      url: `${baseUrl}/app/customerdetail?nameId=${cus.Id}`,
      author: null,
    }, integration);
    
    if (ok) imported++;
  }

  if (imported === 0) {
    await upsertKnowledge(supabase, {
      provider: 'quickbooks',
      external_id: `qb-${integration.id}-status`,
      content_type: 'record',
      title: 'QuickBooks Connected',
      content: 'QuickBooks integration active. No customers found.',
      url: '',
      author: null,
    }, integration);
    imported++;
  }
  
  return imported;
}
