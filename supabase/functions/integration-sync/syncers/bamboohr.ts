// BambooHR Syncer Module
import { upsertKnowledge } from '../index.ts';

export async function syncBambooHR(integration: any, supabase: any, lastSynced: Date | null) {
  let imported = 0;
  const token = integration.access_token || integration.metadata?.api_key;
  const subdomain = integration.metadata?.subdomain || 'unknown';
  
  if (!token) {
    throw new Error("BambooHR API token missing.");
  }

  // Fetch Employee Directory
  const res = await fetch(`https://api.bamboohr.com/api/gateway.php/${subdomain}/v1/employees/directory`, {
    headers: { Authorization: `Basic ${btoa(token + ':x')}`, Accept: 'application/json' }
  });

  if (!res.ok) {
    throw new Error(`BambooHR API error: ${res.status}`);
  }

  const data = await res.json();
  const employees = data.employees || [];
  
  for (const emp of employees) {
    const ok = await upsertKnowledge(supabase, {
      provider: 'bamboohr',
      external_id: emp.id,
      content_type: 'record',
      title: `Employee: ${emp.displayName}`,
      content: `Job Title: ${emp.jobTitle}\nDepartment: ${emp.department}\nLocation: ${emp.location}`,
      url: `https://${subdomain}.bamboohr.com/employees/employee.php?id=${emp.id}`,
      author: null,
    }, integration);
    
    if (ok) imported++;
  }

  if (imported === 0) {
    await upsertKnowledge(supabase, {
      provider: 'bamboohr',
      external_id: `bamboohr-${integration.id}-status`,
      content_type: 'record',
      title: 'BambooHR Connected',
      content: 'BambooHR integration active. No employee directory records found.',
      url: '',
      author: null,
    }, integration);
    imported++;
  }
  
  return imported;
}
