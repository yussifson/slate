// src/lib/proactiveNudgeEngine.js
// Proactive Organizational Intelligence & Nudging Engine
// Monitors cross-system decisions, commitments, blockers, and imported knowledge
// to proactively alert teams about conflicts, stale decisions, and unassigned commitments.

import { supabase } from '@/api/supabaseClient';
import { generateText } from '@/lib/cloudflareAI';

export async function runProactiveNudgeScan(companyId) {
  if (!companyId) return { nudges: [], scannedAt: new Date().toISOString() };

  const nudges = [];
  const now = new Date();

  try {
    // 1. Scan for Decision vs Action Item Conflicts or Silos
    const { data: activeDecisions } = await supabase
      .from('clipad_decisions')
      .select('id, decision_text, rationale, created_at, team_space_id')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10);

    for (const dec of (activeDecisions || [])) {
      // Check if decision has no linked tasks
      const { count: linkedTasksCount } = await supabase
        .from('clipad_action_items')
        .select('*', { count: 'exact', head: true })
        .eq('source_id', dec.id);

      if (linkedTasksCount === 0) {
        const daysOld = Math.floor((now.getTime() - new Date(dec.created_at).getTime()) / (1000 * 60 * 60 * 24));
        if (daysOld >= 3) {
          nudges.push({
            id: `nudge-dec-${dec.id}`,
            category: 'unactioned_decision',
            severity: daysOld > 7 ? 'high' : 'medium',
            title: 'Active Decision Lacks Execution Plan',
            message: `The decision "${dec.decision_text.substring(0, 80)}..." made ${daysOld} days ago has no action items assigned.`,
            actionLabel: 'Create Action Items',
            link: '/clipad/decisions',
            created_at: new Date().toISOString(),
          });
        }
      }
    }

    // 2. Scan for Overdue Commitments without Assignees
    const { data: unassignedCommitments } = await supabase
      .from('clipad_commitments')
      .select('id, commitment_text, created_at')
      .is('owner_name', null)
      .eq('status', 'pending')
      .limit(5);

    (unassignedCommitments || []).forEach(c => {
      nudges.push({
        id: `nudge-comm-${c.id}`,
        category: 'unassigned_commitment',
        severity: 'high',
        title: 'Unassigned Promise Detected',
        message: `A commitment was detected: "${c.commitment_text.substring(0, 90)}..." but has no designated owner.`,
        actionLabel: 'Assign Owner',
        link: '/clipad/action-items',
        created_at: new Date().toISOString(),
      });
    });

    // 3. Cross-tool Sync Health Nudge
    const { data: errIntegrations } = await supabase
      .from('clipad_integrations')
      .select('id, provider, sync_error')
      .eq('company_id', companyId)
      .eq('status', 'error');

    (errIntegrations || []).forEach(intg => {
      nudges.push({
        id: `nudge-intg-${intg.id}`,
        category: 'sync_warning',
        severity: 'critical',
        title: `${intg.provider.replace('_', ' ')} Connection Requires Attention`,
        message: `Sync issue reported: ${intg.sync_error || 'Authentication error'}. Reconnect to restore live knowledge flow.`,
        actionLabel: 'Fix Connection',
        link: '/integrations',
        created_at: new Date().toISOString(),
      });
    });

    // 4. Autonomous AI Prompt Analysis (Optional LLM synthesis for complex patterns)
    if (activeDecisions?.length > 3) {
      try {
        const textSample = activeDecisions.map(d => `- ${d.decision_text}`).join('\n');
        const rawAiNudge = await generateText([
          { role: 'system', content: 'You are an executive organizational coach. Identify 1 strategic risk or contradiction in these decisions. Respond in 1 brief sentence or "NONE".' },
          { role: 'user', content: `Decisions:\n${textSample}` }
        ]);

        if (rawAiNudge && !rawAiNudge.includes('NONE') && rawAiNudge.length > 15) {
          nudges.push({
            id: `nudge-ai-synth-${Date.now()}`,
            category: 'ai_strategic_nudge',
            severity: 'medium',
            title: 'AI Strategic Alignment Warning',
            message: rawAiNudge.trim().substring(0, 200),
            actionLabel: 'Review Strategy',
            link: '/clipad/intelligence',
            created_at: new Date().toISOString(),
          });
        }
      } catch { /* ignore AI error fallback */ }
    }

  } catch (err) {
    console.error('runProactiveNudgeScan error:', err);
  }

  return {
    nudges,
    count: nudges.length,
    scannedAt: new Date().toISOString(),
  };
}
