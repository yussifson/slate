// DocuSign Syncer Module
import { upsertKnowledge } from '../index.ts';

export async function syncDocuSign(integration: any, supabase: any, lastSynced: Date | null) {
  let imported = 0;
  const token = integration.access_token;
  const accountId = integration.metadata?.account_id;
  const basePath = integration.metadata?.base_path || 'https://demo.docusign.net/restapi';
  
  if (!token) {
    throw new Error("DocuSign API token missing.");
  }

  // Fetch Envelopes (Sent in last 30 days or based on lastSynced)
  const fromDate = lastSynced ? lastSynced.toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  // Use generic account if accountId missing
  let fetchUrl = '';
  if (accountId) {
    fetchUrl = `${basePath}/v2.1/accounts/${accountId}/envelopes?from_date=${fromDate}`;
  } else {
    fetchUrl = `https://account.docusign.com/oauth/userinfo`; // Fallback to get account info
  }

  let res = await fetch(fetchUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error(`DocuSign API error: ${res.status}`);
  }

  let data = await res.json();
  let envelopes = [];

  // If we just fetched userinfo, we don't have envelopes yet but we validated the connection
  if (data.envelopes) {
    envelopes = data.envelopes;
  }
  
  for (const env of envelopes) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'docusign',
      external_id: env.envelopeId,
      content_type: 'record',
      title: `Envelope: ${env.emailSubject || env.envelopeId}`,
      content: `Status: ${env.status}\nCreated: ${env.createdDateTime}`,
      url: `https://app.docusign.com/documents/details/${env.envelopeId}`,
      author: env.sender?.userName || null,
    }, integration);
    
    if (ok) imported++;
  }

  
  
  return imported;
}
