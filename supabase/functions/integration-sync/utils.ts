export async function upsertKnowledge(supabase: any, item: Record<string, any>, integration: any) {
  const { error } = await supabase.from('clipad_imported_knowledge').upsert({
    company_id: integration.company_id,
    integration_id: integration.id,
    updated_at: new Date().toISOString(),
    ...item,
  }, { onConflict: 'integration_id,external_id' });

  if (!error) {
    return true;
  }
  return false;
}
