// src/lib/clipadIntelligence.js
// Shared AI Intelligence Service for the ClipPad Organizational Intelligence Platform
// All AI extraction and event-writing utilities live here.

import { supabase } from '@/api/supabaseClient';
import { generateText } from '@/lib/cloudflareAI';

// ──────────────────────────────────────────────────────────────────
// AI JSON Extraction Helper
// ──────────────────────────────────────────────────────────────────
async function extractJSON(prompt) {
  const raw = await generateText([
    {
      role: 'system',
      content:
        'You are a data extraction AI. Always respond with ONLY valid JSON — no explanation, no markdown, no code fences. If nothing is detected, return an empty array [].',
    },
    { role: 'user', content: prompt },
  ]);
  try {
    const cleaned = (raw || '').replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

// ──────────────────────────────────────────────────────────────────
// 1. Detect Decisions from transcript/text
// ──────────────────────────────────────────────────────────────────
export async function detectDecisions(text, options = {}) {
  if (!text?.trim()) return [];

  const items = await extractJSON(`Extract every explicit DECISION from the following text.
A decision is when a group or individual commits to a specific course of action.
Return a JSON array where each item has:
- "decision_text": short description of the decision (max 120 chars)
- "rationale": why this was decided (1-2 sentences, or null)
- "participants": array of any names/roles mentioned as deciding parties (can be empty)
- "importance_score": integer 1-10 based on business impact
- "confidence_score": integer 1-10 based on how certain the decision sounds

TEXT:
${text.substring(0, 4000)}`);

  if (!Array.isArray(items)) return [];

  return items
    .filter((item) => item.decision_text)
    .map((item) => ({
      id: crypto.randomUUID(),
      decision_text: item.decision_text,
      rationale: item.rationale || null,
      status: 'active',
      ai_detected: true,
      participants: item.participants || [],
      importance_score: Math.min(10, Math.max(1, Number(item.importance_score) || 5)),
      confidence_score: Math.min(10, Math.max(1, Number(item.confidence_score) || 5)),
      source_text: text.substring(0, 500),
      ...options,
      created_at: new Date().toISOString(),
    }));
}

// ──────────────────────────────────────────────────────────────────
// 2. Detect Commitments / Promises from text
// ──────────────────────────────────────────────────────────────────
export async function detectCommitments(text, options = {}) {
  if (!text?.trim()) return [];

  const items = await extractJSON(`Extract every COMMITMENT or PROMISE from the following text.
A commitment is when someone says they will do something.
Return a JSON array where each item has:
- "commitment_text": the promise made (max 150 chars)
- "owner_name": who made the promise (or null)
- "due_date": inferred due date YYYY-MM-DD (or null)
- "confidence_score": integer 1-10

TEXT:
${text.substring(0, 4000)}`);

  if (!Array.isArray(items)) return [];

  return items
    .filter((item) => item.commitment_text)
    .map((item) => ({
      id: crypto.randomUUID(),
      commitment_text: item.commitment_text,
      owner_name: item.owner_name || null,
      due_date: item.due_date || null,
      status: 'pending',
      ai_detected: true,
      confidence_score: Math.min(10, Math.max(1, Number(item.confidence_score) || 5)),
      source_text: text.substring(0, 500),
      ...options,
      created_at: new Date().toISOString(),
    }));
}

// ──────────────────────────────────────────────────────────────────
// 3. Detect Blockers from text
// ──────────────────────────────────────────────────────────────────
export async function detectBlockers(text, options = {}) {
  if (!text?.trim()) return [];

  const items = await extractJSON(`Extract every BLOCKER or OBSTACLE from the following text.
A blocker is something that prevents progress or causes delays.
Return a JSON array where each item has:
- "description": the blocker (max 150 chars)
- "severity": "low", "medium", or "high"
- "importance_score": integer 1-10

TEXT:
${text.substring(0, 4000)}`);

  if (!Array.isArray(items)) return [];

  return items
    .filter((item) => item.description)
    .map((item) => ({
      id: crypto.randomUUID(),
      description: item.description,
      severity: ['low', 'medium', 'high'].includes(item.severity) ? item.severity : 'medium',
      status: 'open',
      ai_detected: true,
      importance_score: Math.min(10, Math.max(1, Number(item.importance_score) || 5)),
      source_text: text.substring(0, 500),
      detected_at: new Date().toISOString(),
      ...options,
    }));
}

// ──────────────────────────────────────────────────────────────────
// 4. Detect Follow-Ups from text
// ──────────────────────────────────────────────────────────────────
export async function detectFollowUps(text, options = {}) {
  if (!text?.trim()) return [];

  const items = await extractJSON(`Extract every FOLLOW-UP ACTION from the following text.
A follow-up is something that needs to be done as a consequence of the conversation.
Return a JSON array where each item has:
- "commitment_text": what needs to be done (max 150 chars)
- "owner_name": who should do it (or null)
- "due_date": inferred date YYYY-MM-DD (or null)

TEXT:
${text.substring(0, 4000)}`);

  if (!Array.isArray(items)) return [];

  return items
    .filter((item) => item.commitment_text)
    .map((item) => ({
      id: crypto.randomUUID(),
      commitment_text: item.commitment_text,
      detected_from: item.owner_name || null,
      due_date: item.due_date || null,
      status: 'pending',
      ai_detected: true,
      source_type: options.source_type || 'chat',
      ...options,
      created_at: new Date().toISOString(),
    }));
}

// ──────────────────────────────────────────────────────────────────
// 5. Generate AI Standup Summary
// ──────────────────────────────────────────────────────────────────
export async function generateStandupSummary(updates = [], contextDate = 'today') {
  if (!updates.length) return 'No standup updates posted yet.';

  const formatted = updates
    .map(
      (u) =>
        `Name: ${u.user_name || 'Team Member'}\n- Today: ${u.today || 'N/A'}\n- Yesterday: ${u.yesterday || 'N/A'}\n- Blockers: ${u.blockers || 'None'}\n- Mood: ${u.mood || 'neutral'}`
    )
    .join('\n\n');

  return await generateText([
    {
      role: 'system',
      content:
        `You are a team standup summarizer analyzing updates for this period: ${contextDate}. Create a clear, concise summary written in continuous, natural paragraphs. Do NOT use any special characters, markdown formatting, bullet points, or asterisks. Write in a clean prose format. You must strictly use the exact real names of the team members provided in the input data instead of generic terms or made-up names. Summarize key work happening, shared blockers, team mood, and items needing manager attention. Keep it under 200 words.`,
    },
    { role: 'user', content: `Summarize this team standup for the period (${contextDate}):\n\n${formatted}` },
  ]) || 'Unable to generate summary.';
}

// ──────────────────────────────────────────────────────────────────
// 6. Build Organization Context for AI Brain — FULL KNOWLEDGE ENGINE
//    Pulls every table that holds organisational knowledge so that
//    OrbitFlow & Spotlight can answer questions about anything.
// ──────────────────────────────────────────────────────────────────
export async function buildOrgContext(options = {}) {
  const limit     = options.limit     || 20;
  const spaceIds  = options.spaceIds  || [];
  const companyId = options.companyId || null;

  // Helper: build space filter clause
  const inSpaces = (col) => spaceIds.length > 0 ? { in: [col, spaceIds] } : null;

  // Run ALL fetches in parallel for speed
  const [
    meetingsRes,
    decisionsRes,
    blockersRes,
    videosRes,
    tasksRes,
    importedKnowledgeRes,
    commitmentsRes,
    spacesRes,
    standupsRes,
    orgEventsRes,
    membersRes,
    chatRoomsRes,
    followUpsRes,
    actionItemsRes,
  ] = await Promise.all([
    // Meetings
    spaceIds.length > 0
      ? supabase.from('clipad_meeting_records')
          .select('id, title, ai_summary, created_at, ended_at, space_id')
          .in('space_id', spaceIds)
          .order('created_at', { ascending: false })
          .limit(limit)
      : supabase.from('clipad_meeting_records')
          .select('id, title, ai_summary, created_at, ended_at, space_id')
          .order('created_at', { ascending: false })
          .limit(limit),

    // Decisions
    spaceIds.length > 0
      ? supabase.from('clipad_decisions')
          .select('id, decision_text, rationale, status, created_at, team_space_id')
          .eq('status', 'active')
          .in('team_space_id', spaceIds)
          .order('created_at', { ascending: false })
          .limit(15)
      : supabase.from('clipad_decisions')
          .select('id, decision_text, rationale, status, created_at, team_space_id')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(15),

    // Blockers
    spaceIds.length > 0
      ? supabase.from('clipad_blockers')
          .select('id, description, status, severity, detected_at, team_space_id')
          .eq('status', 'open')
          .in('team_space_id', spaceIds)
          .order('detected_at', { ascending: false })
          .limit(10)
      : supabase.from('clipad_blockers')
          .select('id, description, status, severity, detected_at, team_space_id')
          .eq('status', 'open')
          .order('detected_at', { ascending: false })
          .limit(10),

    // Videos
    spaceIds.length > 0
      ? supabase.from('clipad_videos')
          .select('id, title, ai_summary, created_at, duration_seconds, space_id')
          .in('space_id', spaceIds)
          .order('created_at', { ascending: false })
          .limit(limit)
      : supabase.from('clipad_videos')
          .select('id, title, ai_summary, created_at, duration_seconds, space_id')
          .order('created_at', { ascending: false })
          .limit(limit),

    // Tasks / Action items (clipad_action_items)
    spaceIds.length > 0
      ? supabase.from('clipad_action_items')
          .select('id, title, is_complete, due_date, assigned_to, space_id')
          .eq('is_complete', false)
          .in('space_id', spaceIds)
          .order('created_at', { ascending: false })
          .limit(20)
      : supabase.from('clipad_action_items')
          .select('id, title, is_complete, due_date, assigned_to, space_id')
          .eq('is_complete', false)
          .order('created_at', { ascending: false })
          .limit(20),

    // Imported Knowledge (Integrations)
    companyId
      ? supabase.from('clipad_imported_knowledge')
          .select('id, provider, content_type, title, content, ai_summary, ai_action_items, metadata, updated_at')
          .eq('company_id', companyId)
          .order('updated_at', { ascending: false })
          .limit(30)
      : { data: [] },

    // Commitments (global, not space-bound)
    supabase.from('clipad_commitments')
      .select('id, commitment_text, status, due_date, owner_name')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(15),

    // Spaces
    spaceIds.length > 0
      ? supabase.from('clipad_spaces')
          .select('id, name, description, created_at, is_private')
          .in('id', spaceIds)
          .order('created_at', { ascending: false })
          .limit(20)
      : supabase.from('clipad_spaces')
          .select('id, name, description, created_at, is_private')
          .order('created_at', { ascending: false })
          .limit(20),

    // ── NEW: Standups (the data that was previously missing!) ──
    spaceIds.length > 0
      ? supabase.from('clipad_standups')
          .select('id, user_name, today, yesterday, blockers, mood, created_at, space_id')
          .in('space_id', spaceIds)
          .order('created_at', { ascending: false })
          .limit(30)
      : supabase.from('clipad_standups')
          .select('id, user_name, today, yesterday, blockers, mood, created_at, space_id')
          .order('created_at', { ascending: false })
          .limit(30),

    // ── NEW: Org Events timeline ──
    spaceIds.length > 0
      ? supabase.from('clipad_org_events')
          .select('id, event_type, title, description, created_at, space_id, actor_id, importance')
          .in('space_id', spaceIds)
          .order('created_at', { ascending: false })
          .limit(20)
      : supabase.from('clipad_org_events')
          .select('id, event_type, title, description, created_at, space_id, actor_id, importance')
          .order('created_at', { ascending: false })
          .limit(20),

    // ── NEW: Space members (who is in each space) ──
    spaceIds.length > 0
      ? supabase.from('clipad_space_members')
          .select('id, space_id, user_id, role, joined_at, profiles:user_id(full_name, email, role)')
          .in('space_id', spaceIds)
          .limit(50)
      : { data: [] },

    // ── NEW: Chat rooms / channels ──
    spaceIds.length > 0
      ? supabase.from('clipad_chat_rooms')
          .select('id, name, description, space_id, created_at')
          .in('space_id', spaceIds)
          .order('created_at', { ascending: false })
          .limit(20)
      : supabase.from('clipad_chat_rooms')
          .select('id, name, description, space_id, created_at')
          .order('created_at', { ascending: false })
          .limit(20),

    // ── NEW: Follow-ups ──
    supabase.from('clipad_follow_ups')
      .select('id, commitment_text, due_date, status, detected_from')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(15)
      .then(res => res)
      .catch(() => ({ data: [] })),

    // Completed action items (recent, for history) 
    spaceIds.length > 0
      ? supabase.from('clipad_action_items')
          .select('id, title, is_complete, due_date, assigned_to, space_id')
          .eq('is_complete', true)
          .in('space_id', spaceIds)
          .order('created_at', { ascending: false })
          .limit(10)
      : supabase.from('clipad_action_items')
          .select('id, title, is_complete, due_date, assigned_to, space_id')
          .eq('is_complete', true)
          .order('created_at', { ascending: false })
          .limit(10),
  ]);

  const meetings     = meetingsRes?.data     || [];
  const decisions    = decisionsRes?.data    || [];
  const blockers     = blockersRes?.data     || [];
  const videos       = videosRes?.data       || [];
  const tasks        = tasksRes?.data        || [];
  const importedKnowledge = importedKnowledgeRes?.data || [];
  const commitments  = commitmentsRes?.data  || [];
  const spaces       = spacesRes?.data       || [];
  const standups     = standupsRes?.data     || [];
  const orgEvents    = orgEventsRes?.data    || [];
  const members      = membersRes?.data      || [];
  const chatRooms    = chatRoomsRes?.data    || [];
  const followUps    = followUpsRes?.data    || [];
  const completedTasks = actionItemsRes?.data || [];

  // Build source map for citation
  const sourceMap = {};
  meetings.forEach((m) => { sourceMap[m.id] = { type: 'meeting', title: m.title, id: m.id }; });
  decisions.forEach((d) => { sourceMap[d.id] = { type: 'decision', title: d.decision_text?.substring(0, 60), id: d.id }; });
  videos.forEach((v) => { sourceMap[v.id] = { type: 'video', title: v.title, id: v.id }; });
  spaces.forEach((s) => { sourceMap[s.id] = { type: 'space', title: s.name, id: s.id }; });

  // Build context text — comprehensive view of the entire org
  const today = new Date().toISOString().slice(0, 10);

  const standupsByDate = {};
  standups.forEach(s => {
    const date = s.created_at?.slice(0, 10) || 'unknown';
    if (!standupsByDate[date]) standupsByDate[date] = [];
    standupsByDate[date].push(s);
  });

  const contextText = [
    `[TODAY: ${today}]`,
    `\n━━ ACTIVE SPACES (${spaces.length}) ━━`,
    spaces.length > 0
      ? spaces.map(s => `• [SPACE:${s.id}] "${s.name}"${s.is_private ? ' (private)' : ''}: ${s.description?.substring(0, 120) || 'No description'}`).join('\n')
      : '  No spaces found.',

    `\n━━ CONNECTED KNOWLEDGE PLATFORMS (${importedKnowledge.length} items recently imported) ━━`,
    importedKnowledge.length > 0
      ? importedKnowledge.map(ik => `• [${ik.provider?.toUpperCase()} - ${ik.content_type}] "${ik.title}" (updated ${ik.updated_at?.slice(0,10)}): ${ik.ai_summary || ik.content?.substring(0,250)}`).join('\n')
      : '  No external knowledge imported.',

    `\n━━ TEAM MEMBERS (${members.length}) ━━`,
    members.length > 0
      ? members.map(m => {
          const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
          return `• ${profile?.full_name || 'Unknown'} <${profile?.email || 'no email'}> — role: ${m.role || 'member'} in space ${m.space_id}`;
        }).join('\n')
      : '  No member data.',

    `\n━━ DAILY STANDUPS (${standups.length} total) ━━`,
    standups.length > 0
      ? Object.entries(standupsByDate)
          .slice(0, 5) // last 5 days
          .map(([date, dayUpdates]) => {
            return `\n  [${date}] — ${dayUpdates.length} update(s):\n` +
              dayUpdates.map(s =>
                `    👤 ${s.user_name || 'Team member'}:\n` +
                `       Today: ${s.today || 'not specified'}\n` +
                `       Yesterday: ${s.yesterday || 'not specified'}\n` +
                `       Blockers: ${s.blockers || 'none'}\n` +
                `       Mood: ${s.mood || 'neutral'}`
              ).join('\n');
          }).join('\n')
      : '  No standups posted yet.',

    `\n━━ RECENT MEETINGS (${meetings.length}) ━━`,
    meetings.length > 0
      ? meetings.map(m => `• [MEETING:${m.id}] "${m.title}" (${m.created_at?.slice(0, 10)}): ${m.ai_summary?.substring(0, 250) || 'No summary yet'}`).join('\n')
      : '  No meetings recorded.',

    `\n━━ ACTIVE DECISIONS (${decisions.length}) ━━`,
    decisions.length > 0
      ? decisions.map(d => `• [DECISION:${d.id}] ${d.decision_text} — Rationale: ${d.rationale || 'none'}`).join('\n')
      : '  No active decisions.',

    `\n━━ OPEN BLOCKERS (${blockers.length}) ━━`,
    blockers.length > 0
      ? blockers.map(b => `• [${(b.severity || 'medium').toUpperCase()}] ${b.description}`).join('\n')
      : '  No open blockers.',

    `\n━━ OPEN TASKS / ACTION ITEMS (${tasks.length}) ━━`,
    tasks.length > 0
      ? tasks.map(t => `• ${t.title}${t.assigned_to ? ` → @${t.assigned_to}` : ''}${t.due_date ? ` (due ${t.due_date})` : ''}`).join('\n')
      : '  No open tasks.',

    completedTasks.length > 0 ? `\n━━ RECENTLY COMPLETED TASKS (${completedTasks.length}) ━━\n` +
      completedTasks.map(t => `• ✅ ${t.title}${t.assigned_to ? ` — ${t.assigned_to}` : ''}`).join('\n') : '',

    `\n━━ PENDING COMMITMENTS (${commitments.length}) ━━`,
    commitments.length > 0
      ? commitments.map(c => `• ${c.commitment_text}${c.owner_name ? ` (${c.owner_name})` : ''}${c.due_date ? ` by ${c.due_date}` : ''}`).join('\n')
      : '  No pending commitments.',

    followUps.length > 0
      ? `\n━━ PENDING FOLLOW-UPS (${followUps.length}) ━━\n` +
        followUps.map(f => `• ${f.commitment_text}${f.detected_from ? ` (from: ${f.detected_from})` : ''}${f.due_date ? ` by ${f.due_date}` : ''}`).join('\n')
      : '',

    `\n━━ RECENT ASYNC VIDEOS (${videos.length}) ━━`,
    videos.length > 0
      ? videos.map(v => `• [VIDEO:${v.id}] "${v.title}" (${v.created_at?.slice(0, 10)}${v.duration_seconds ? `, ${Math.round(v.duration_seconds / 60)}min` : ''}): ${v.ai_summary?.substring(0, 200) || 'No summary'}`).join('\n')
      : '  No videos recorded.',

    chatRooms.length > 0
      ? `\n━━ CHAT CHANNELS (${chatRooms.length}) ━━\n` +
        chatRooms.map(c => `• #${c.name || 'unnamed'}${c.description ? ` — ${c.description.substring(0, 80)}` : ''}`).join('\n')
      : '',

    orgEvents.length > 0
  ].filter(Boolean).join('\n');

  return {
    contextText,
    sourceMap,
    meetings,
    decisions,
    blockers,
    videos,
    tasks,
    commitments,
    spaces,
    standups,
    orgEvents,
    members,
    chatRooms,
    followUps,
  };
}

// ──────────────────────────────────────────────────────────────────
// 7. Write to Org Timeline (clipad_org_events)
// ──────────────────────────────────────────────────────────────────
export async function writeOrgEvent({ workspace_id, space_id, event_type, title, description, actor_id, source_id, source_table, metadata, importance = 3 }) {
  try {
    await supabase.from('clipad_org_events').insert({
      workspace_id, space_id, event_type, title, description,
      actor_id, source_id, source_table,
      metadata: metadata || {}, importance,
    });
  } catch (err) {
    console.warn('[OrgEvents] Failed to write event:', err.message);
  }
}
