// Oracle Syncer Module
import { upsertKnowledge } from '../index.ts';

export async function syncOracle(integration: any, supabase: any, lastSynced: Date | null) {
  let imported = 0;
  const token = integration.access_token || integration.metadata?.api_key;
  const oracleUrl = integration.metadata?.url;
  
  if (!token || !oracleUrl) {
    throw new Error("Oracle API token or URL missing.");
  }

  // Fetch Oracle HCM Employees
  const res = await fetch(`${oracleUrl.replace(/\/$/, '')}/hcmRestApi/resources/11.13.18.05/emps?limit=50`, {
    headers: { Authorization: `Basic ${btoa(token)}` }
  });

  if (!res.ok) {
    throw new Error(`Oracle API error: ${res.status}`);
  }

  const data = await res.json();
  const employees = data.items || [];
  
  for (const emp of employees) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'oracle',
      external_id: emp.PersonId?.toString() || emp.PersonNumber,
      content_type: 'record',
      title: `Oracle HCM: ${emp.DisplayName || emp.PersonNumber}`,
      content: `Number: ${emp.PersonNumber}\nType: ${emp.WorkerType}`,
      url: oracleUrl,
      author: null,
    }, integration);
    
    if (ok) imported++;
  }

  if (imported === 0) {
    await upsertKnowledge(supabase, {
      provider: 'oracle',
      external_id: `oracle-${integration.id}-status`,
      content_type: 'record',
      title: 'Oracle Connected',
      content: 'Oracle integration active. No employee records found.',
      url: '',
      author: null,
    }, integration);
    imported++;
  }
  
  return imported;
}
