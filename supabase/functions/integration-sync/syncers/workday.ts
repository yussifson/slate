// Workday Syncer Module
import { upsertKnowledge } from '../index.ts';

export async function syncWorkday(integration: any, supabase: any, lastSynced: Date | null) {
  let imported = 0;
  const token = integration.access_token || integration.metadata?.api_key;
  const tenant = integration.metadata?.tenant || 'impl';
  
  if (!token) {
    throw new Error("Workday API token missing.");
  }

  // Workday typically uses SOAP or REST APIs.
  // Using the newer Workday REST API for Workers.
  const res = await fetch(`https://wd2-impl-services1.workday.com/ccx/api/v1/${tenant}/workers`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
  });

  if (!res.ok) {
    throw new Error(`Workday API error: ${res.status}`);
  }

  const data = await res.json();
  const workers = data.data || [];
  
  for (const worker of workers) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'workday',
      external_id: worker.id,
      content_type: 'record',
      title: `Worker: ${worker.descriptor || worker.id}`,
      content: `ID: ${worker.id}\nStatus: ${worker.workerStatus?.descriptor || 'Unknown'}`,
      url: `https://wd2-impl-services1.workday.com/${tenant}/d/inst/1$${worker.id}.htm`,
      author: null,
    }, integration);
    
    if (ok) imported++;
  }

  if (imported === 0) {
    await upsertKnowledge(supabase, {
      provider: 'workday',
      external_id: `workday-${integration.id}-status`,
      content_type: 'record',
      title: 'Workday Connected',
      content: 'Workday integration active. No worker records found.',
      url: '',
      author: null,
    }, integration);
    imported++;
  }
  
  return imported;
}
