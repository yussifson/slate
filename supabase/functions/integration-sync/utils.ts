/**
 * Upserts a knowledge item and returns true on success.
 */
export async function upsertKnowledge(
  supabase: any,
  item: Record<string, any>,
  integration: any
): Promise<boolean> {
  const { error } = await supabase.from('clipad_imported_knowledge').upsert({
    company_id: integration.company_id,
    integration_id: integration.id,
    updated_at: new Date().toISOString(),
    ...item,
  }, { onConflict: 'integration_id,external_id' });

  return !error;
}

/**
 * Saves a pagination cursor mid-sync so the next cron run can resume.
 * Only called when the sync is interrupted (timeout), not on full completion.
 */
export async function saveSyncCursor(
  supabase: any,
  integrationId: string,
  cursor: Record<string, any>
): Promise<void> {
  await supabase
    .from('clipad_integrations')
    .update({ sync_cursor: cursor })
    .eq('id', integrationId);
}

/**
 * Marks a sync as fully complete:
 * - Sets last_synced_at = now
 * - Clears sync_cursor (no more resume needed)
 * - Promotes sync_phase to 'incremental' (future syncs are delta-only)
 */
export async function markSyncComplete(
  supabase: any,
  integrationId: string,
  syncError: string | null
): Promise<void> {
  await supabase.from('clipad_integrations').update({
    last_synced_at: new Date().toISOString(),
    sync_cursor: null,
    sync_phase: 'incremental',
    sync_error: syncError,
    status: syncError ? 'error' : 'active',
  }).eq('id', integrationId);
}

/**
 * Returns a function that checks whether the edge function is approaching
 * its 60-second wall-clock limit. At 45s we stop and save the cursor.
 */
export function createTimeoutGuard(limitMs = 45_000): () => boolean {
  const start = Date.now();
  return () => Date.now() - start >= limitMs;
}
