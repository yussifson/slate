// src/lib/intelligence/engines/legal.js
// Legal Intelligence Engine — vertical='legal'
// Covers: case deadlines, billing gaps, outcome patterns, conflict detection

import { generateInsight, groupByDay } from '@/lib/intelligence/engine';
import { powerSync } from '@/api/PowerSyncConnector';

// ────────────────────────────────────────────────────────
// 1. Case Deadline Risk
//    Find open cases with no recent audit_logs activity.
//    Stale cases risk missed deadlines.
// ────────────────────────────────────────────────────────
async function detectCaseDeadlineRisk(companyId) {
  // Get all open cases
  const casesRes = await powerSync.execute(
    `SELECT id, title, case_number, status, created_at
     FROM univ_cases
     WHERE company_id = ?
       AND status IN ('open', 'active', 'pending')
     ORDER BY created_at ASC`,
    [companyId]
  );

  const cases = casesRes.rows._array;
  if (cases.length === 0) return [];

  const insights = [];
  const staleCases = [];

  for (const c of cases) {
    // Find the most recent audit_log entry referencing this case
    const activityRes = await powerSync.execute(
      `SELECT created_at
       FROM audit_logs
       WHERE company_id = ?
         AND (entity_id = ? OR action LIKE ?)
       ORDER BY created_at DESC
       LIMIT 1`,
      [companyId, c.id, `%${c.id}%`]
    );

    const lastActivity = activityRes.rows._array[0];
    const lastActivityDate = lastActivity ? new Date(lastActivity.created_at) : new Date(c.created_at);
    const daysSinceActivity = Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceActivity >= 14) {
      staleCases.push({
        case_id: c.id,
        case_number: c.case_number,
        title: c.title,
        days_inactive: daysSinceActivity,
        last_activity: lastActivityDate.toISOString().split('T')[0],
      });
    }
  }

  if (staleCases.length === 0) return [];

  // Sort by most inactive first
  staleCases.sort((a, b) => b.days_inactive - a.days_inactive);

  const criticalCount = staleCases.filter(c => c.days_inactive >= 30).length;
  const severity = criticalCount > 0 ? 'critical' : 'warning';

  const body = await generateInsight(
    `${staleCases.length} open case(s) have had no activity for 14+ days. ${criticalCount} have been inactive for 30+ days. The most inactive is "${staleCases[0].title}" (${staleCases[0].case_number}) with ${staleCases[0].days_inactive} days of inactivity. These cases may have approaching deadlines at risk. Summarize the risk and recommend prioritization.`,
    { staleCases: staleCases.slice(0, 10), totalOpen: cases.length }
  );

  insights.push({
    vertical: 'legal',
    insight_type: 'risk',
    insight_key: 'case_deadline_risk',
    entity_type: 'case',
    title: `${staleCases.length} case${staleCases.length !== 1 ? 's' : ''} with no recent activity`,
    body,
    severity,
    confidence: 0.85,
    data_snapshot: {
      stale_cases: staleCases.slice(0, 20),
      total_open_cases: cases.length,
      critical_count: criticalCount,
    },
    action_label: 'Review Cases',
    action_url: '/cases?filter=stale',
  });

  // Also emit per-case insights for the worst offenders (30+ days)
  for (const sc of staleCases.filter(c => c.days_inactive >= 30).slice(0, 5)) {
    insights.push({
      vertical: 'legal',
      insight_type: 'risk',
      insight_key: 'case_stale_critical',
      entity_type: 'case',
      entity_id: sc.case_id,
      title: `"${sc.title}" has been inactive for ${sc.days_inactive} days`,
      body: `Case ${sc.case_number} last had activity on ${sc.last_activity}. With ${sc.days_inactive} days of inactivity, any deadlines associated with this case may be at risk. Review immediately.`,
      severity: 'critical',
      confidence: 0.95,
      data_snapshot: sc,
      action_label: 'Open Case',
      action_url: `/cases/${sc.case_id}`,
    });
  }

  return insights;
}

// ────────────────────────────────────────────────────────
// 2. Billing Gap Detection
//    Find cases that have no associated invoices.
//    Indicates potential unbilled work.
// ────────────────────────────────────────────────────────
async function detectBillingGaps(companyId) {
  const res = await powerSync.execute(
    `SELECT c.id, c.title, c.case_number, c.status, c.created_at
     FROM univ_cases c
     LEFT JOIN univ_invoices i ON i.company_id = c.company_id
       AND (i.entity_id = c.id OR i.case_id = c.id)
     WHERE c.company_id = ?
       AND c.status IN ('open', 'active', 'closed', 'resolved')
       AND i.id IS NULL
     ORDER BY c.created_at ASC`,
    [companyId]
  );

  const unbilledCases = res.rows._array;
  if (unbilledCases.length === 0) return [];

  // Filter to cases older than 7 days (new cases may not need billing yet)
  const now = Date.now();
  const significantCases = unbilledCases.filter(c => {
    const created = new Date(c.created_at).getTime();
    return (now - created) > 7 * 24 * 60 * 60 * 1000;
  });

  if (significantCases.length === 0) return [];

  const oldestCase = significantCases[0];
  const daysSinceCreated = Math.floor((now - new Date(oldestCase.created_at).getTime()) / (1000 * 60 * 60 * 24));

  const severity = significantCases.length >= 5 ? 'warning' : 'info';

  const body = await generateInsight(
    `${significantCases.length} case(s) have no associated invoices. The oldest unbilled case is "${oldestCase.title}" (${oldestCase.case_number}), created ${daysSinceCreated} days ago. This may represent unbilled work or missing invoice linkage. What should the firm review?`,
    { unbilledCount: significantCases.length, cases: significantCases.slice(0, 10).map(c => ({ title: c.title, case_number: c.case_number, status: c.status })) }
  );

  return [{
    vertical: 'legal',
    insight_type: 'recommendation',
    insight_key: 'billing_gap_detection',
    title: `${significantCases.length} case${significantCases.length !== 1 ? 's' : ''} with no invoices — potential unbilled work`,
    body,
    severity,
    confidence: 0.75,
    data_snapshot: {
      unbilled_count: significantCases.length,
      cases: significantCases.slice(0, 20).map(c => ({
        case_id: c.id,
        title: c.title,
        case_number: c.case_number,
        status: c.status,
      })),
    },
    action_label: 'Review Unbilled Cases',
    action_url: '/cases?filter=unbilled',
  }];
}

// ────────────────────────────────────────────────────────
// 3. Case Outcome Patterns
//    Query univ_caseoutcomes. Calculate win rate
//    and identify trends.
// ────────────────────────────────────────────────────────
async function analyzeCaseOutcomes(companyId) {
  const res = await powerSync.execute(
    `SELECT case_id, outcome_type, date_recorded, notes
     FROM univ_caseoutcomes
     WHERE company_id = ?
     ORDER BY date_recorded DESC`,
    [companyId]
  );

  const outcomes = res.rows._array;
  if (outcomes.length < 3) {
    if (outcomes.length === 0) return [];
    return [{
      vertical: 'legal',
      insight_type: 'summary',
      insight_key: 'case_outcome_patterns',
      title: 'Building case outcome intelligence',
      body: `Only ${outcomes.length} case outcome(s) recorded so far. More data is needed to identify meaningful patterns. Continue logging outcomes to unlock win rate analysis and trend detection.`,
      severity: 'info',
      confidence: 0.5,
      data_snapshot: { total_outcomes: outcomes.length },
    }];
  }

  // Tally outcome types
  const typeCounts = {};
  outcomes.forEach(o => {
    const type = (o.outcome_type || 'unknown').toLowerCase();
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  const total = outcomes.length;
  const wins = (typeCounts['won'] || 0) + (typeCounts['favorable'] || 0) + (typeCounts['settled_favorable'] || 0);
  const losses = (typeCounts['lost'] || 0) + (typeCounts['unfavorable'] || 0);
  const settled = (typeCounts['settled'] || 0) + (typeCounts['settled_favorable'] || 0) + (typeCounts['settled_unfavorable'] || 0);
  const dismissed = typeCounts['dismissed'] || 0;

  const winRate = total > 0 ? ((wins / total) * 100) : 0;

  // Recent trend (last 10 vs. prior)
  let recentTrend = null;
  if (outcomes.length >= 10) {
    const recent10 = outcomes.slice(0, 10);
    const recentWins = recent10.filter(o => ['won', 'favorable', 'settled_favorable'].includes((o.outcome_type || '').toLowerCase())).length;
    const recentWinRate = (recentWins / 10) * 100;
    recentTrend = { recent_win_rate: recentWinRate, sample_size: 10 };
  }

  const severity = winRate >= 60 ? 'positive' : winRate <= 35 ? 'warning' : 'info';

  const body = await generateInsight(
    `Case outcome analysis: ${total} total outcomes recorded. Win/favorable rate: ${winRate.toFixed(1)}% (${wins} wins). Losses: ${losses}. Settled: ${settled}. Dismissed: ${dismissed}. Breakdown by type: ${JSON.stringify(typeCounts)}.${recentTrend ? ` Recent trend (last 10): ${recentTrend.recent_win_rate}% win rate.` : ''} Analyze these patterns and recommend areas for improvement.`,
    { typeCounts, winRate, total, recentTrend }
  );

  return [{
    vertical: 'legal',
    insight_type: 'pattern',
    insight_key: 'case_outcome_patterns',
    title: `Case win rate: ${winRate.toFixed(0)}% across ${total} outcomes`,
    body,
    severity,
    confidence: Math.min(0.9, 0.5 + (total * 0.02)),
    data_snapshot: {
      total_outcomes: total,
      win_rate: winRate,
      type_breakdown: typeCounts,
      recent_trend: recentTrend,
    },
    action_label: 'View Outcomes',
    action_url: '/case-outcomes',
  }];
}

// ────────────────────────────────────────────────────────
// 4. Conflict Checker Intelligence
//    Look for matching client names across opposing
//    parties in different cases.
// ────────────────────────────────────────────────────────
async function detectConflicts(companyId) {
  // Get all cases with their party info
  const res = await powerSync.execute(
    `SELECT id, title, case_number, status,
            client_name, opposing_party
     FROM univ_cases
     WHERE company_id = ?
       AND status IN ('open', 'active', 'pending')`,
    [companyId]
  );

  const cases = res.rows._array;
  if (cases.length < 2) return [];

  const conflicts = [];

  // Build maps of client names and opposing parties
  const clientCases = {}; // name -> [case]
  const opposingCases = {}; // name -> [case]

  cases.forEach(c => {
    const clientName = (c.client_name || '').trim().toLowerCase();
    const opposingParty = (c.opposing_party || '').trim().toLowerCase();

    if (clientName) {
      if (!clientCases[clientName]) clientCases[clientName] = [];
      clientCases[clientName].push(c);
    }
    if (opposingParty) {
      if (!opposingCases[opposingParty]) opposingCases[opposingParty] = [];
      opposingCases[opposingParty].push(c);
    }
  });

  // Conflict: someone is a client in one case and opposing party in another
  for (const [name, asClient] of Object.entries(clientCases)) {
    if (opposingCases[name]) {
      const asOpposing = opposingCases[name];
      conflicts.push({
        party_name: name,
        as_client_in: asClient.map(c => ({ case_id: c.id, title: c.title, case_number: c.case_number })),
        as_opposing_in: asOpposing.map(c => ({ case_id: c.id, title: c.title, case_number: c.case_number })),
      });
    }
  }

  // Also check: same party opposing in multiple cases (less critical but notable)
  const duplicateOpposing = Object.entries(opposingCases)
    .filter(([, arr]) => arr.length > 1)
    .map(([name, arr]) => ({
      party_name: name,
      cases: arr.map(c => ({ case_id: c.id, title: c.title, case_number: c.case_number })),
    }));

  if (conflicts.length === 0 && duplicateOpposing.length === 0) return [];

  const insights = [];

  if (conflicts.length > 0) {
    const body = await generateInsight(
      `CONFLICT DETECTED: ${conflicts.length} potential conflict(s) of interest found. A party appears as a client in one case and as an opposing party in another. Details: ${JSON.stringify(conflicts.slice(0, 5))}. Explain the ethical and legal risk and what steps the firm should take.`,
      { conflicts: conflicts.slice(0, 5) }
    );

    insights.push({
      vertical: 'legal',
      insight_type: 'risk',
      insight_key: 'conflict_of_interest',
      title: `⚠️ ${conflicts.length} potential conflict${conflicts.length !== 1 ? 's' : ''} of interest detected`,
      body,
      severity: 'critical',
      confidence: 0.9,
      data_snapshot: { conflicts: conflicts.slice(0, 10) },
      action_label: 'Review Conflicts',
      action_url: '/cases?filter=conflicts',
    });
  }

  if (duplicateOpposing.length > 0 && conflicts.length === 0) {
    insights.push({
      vertical: 'legal',
      insight_type: 'pattern',
      insight_key: 'repeat_opposing_parties',
      title: `${duplicateOpposing.length} repeat opposing part${duplicateOpposing.length !== 1 ? 'ies' : 'y'} across cases`,
      body: `${duplicateOpposing.length} opposing party name(s) appear in multiple active cases. While not necessarily a conflict, this pattern is worth monitoring for potential ethical considerations.`,
      severity: 'info',
      confidence: 0.7,
      data_snapshot: { repeat_parties: duplicateOpposing.slice(0, 10) },
      action_label: 'View Cases',
      action_url: '/cases',
    });
  }

  return insights;
}

// ────────────────────────────────────────────────────────
// Main Export — runs all legal checks
// ────────────────────────────────────────────────────────
export default async function legalEngine(companyId) {
  const results = await Promise.allSettled([
    detectCaseDeadlineRisk(companyId),
    detectBillingGaps(companyId),
    analyzeCaseOutcomes(companyId),
    detectConflicts(companyId),
  ]);

  return results.flatMap(r => (r.status === 'fulfilled' ? r.value : []));
}
