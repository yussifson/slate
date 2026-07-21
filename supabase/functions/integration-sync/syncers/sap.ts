// SAP Syncer Module
import { upsertKnowledge } from '../utils.ts';

export async function syncSAP(integration: any, supabase: any, lastSynced: Date | null) {
  let imported = 0;
  const token = integration.access_token || integration.metadata?.api_key;
  const sapUrl = integration.metadata?.url;
  
  if (!token || !sapUrl) {
    throw new Error("SAP API token or ERP URL missing.");
  }

  // Fetch SAP Business Partners (OData API standard)
  const res = await fetch(`${sapUrl.replace(/\/$/, '')}/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner?$top=50&$format=json`, {
    headers: { Authorization: `Basic ${btoa(token)}` }
  });

  if (!res.ok) {
    throw new Error(`SAP API error: ${res.status}`);
  }

  const data = await res.json();
  const partners = data.d?.results || [];
  
  for (const bp of partners) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'sap',
      external_id: bp.BusinessPartner,
      content_type: 'record',
      title: `SAP BP: ${bp.OrganizationBPName1 || bp.BusinessPartnerFullName || bp.BusinessPartner}`,
      content: `ID: ${bp.BusinessPartner}\nType: ${bp.BusinessPartnerCategory}\nGroup: ${bp.BusinessPartnerGrouping}`,
      url: `${sapUrl}/ui#BusinessPartner-displayFactSheet?BusinessPartner=${bp.BusinessPartner}`,
      author: null,
    }, integration);
    
    if (ok) imported++;
  }

  
  
  return imported;
}
