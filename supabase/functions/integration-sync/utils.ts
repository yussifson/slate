export async function upsertKnowledge(supabase: any, item: Record<string, any>, integration: any) {
  const { error } = await supabase.from('clipad_imported_knowledge').upsert({
    company_id: integration.company_id,
    integration_id: integration.id,
    updated_at: new Date().toISOString(),
    ...item,
  }, { onConflict: 'integration_id,external_id' });

  if (!error) {
    supabase.functions.invoke('integration-ai-processor', {
      body: { integrationId: integration.id, provider: item.provider, externalId: item.external_id }
    }).catch(() => {});
    return true;
  }
  return false;
}
