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
// 6. Build Organization Context for AI Brain
// ──────────────────────────────────────────────────────────────────
export async function buildOrgContext(options = {}) {
  const limit = options.limit || 15;

  const [meetingsRes, decisionsRes, blockersRes, videosRes, tasksRes, commitmentsRes, spacesRes] =
    await Promise.all([
      supabase.from('clipad_meeting_records').select('id, title, ai_summary, created_at').order('created_at', { ascending: false }).limit(limit),
      supabase.from('clipad_decisions').select('id, decision_text, rationale, status, created_at').eq('status', 'active').order('created_at', { ascending: false }).limit(10),
      supabase.from('clipad_blockers').select('id, description, status, severity, detected_at').eq('status', 'open').order('detected_at', { ascending: false }).limit(10),
      supabase.from('clipad_videos').select('id, title, ai_summary, created_at').order('created_at', { ascending: false }).limit(10),
      supabase.from('clipad_action_items').select('id, title, is_complete, due_date').eq('is_complete', false).order('created_at', { ascending: false }).limit(15),
      supabase.from('clipad_commitments').select('id, commitment_text, status, due_date').eq('status', 'pending').order('created_at', { ascending: false }).limit(10),
      supabase.from('clipad_spaces').select('id, name, description, created_at').order('created_at', { ascending: false }).limit(10),
    ]);

  const meetings = meetingsRes.data || [];
  const decisions = decisionsRes.data || [];
  const blockers = blockersRes.data || [];
  const videos = videosRes.data || [];
  const tasks = tasksRes.data || [];
  const commitments = commitmentsRes.data || [];
  const spaces = spacesRes.data || [];

  const sourceMap = {};
  meetings.forEach((m) => { sourceMap[m.id] = { type: 'meeting', title: m.title, id: m.id }; });
  decisions.forEach((d) => { sourceMap[d.id] = { type: 'decision', title: d.decision_text?.substring(0, 60), id: d.id }; });
  videos.forEach((v) => { sourceMap[v.id] = { type: 'video', title: v.title, id: v.id }; });
  spaces.forEach((s) => { sourceMap[s.id] = { type: 'space', title: s.name, id: s.id }; });

  const contextText = [
    `RECENT MEETINGS (${meetings.length}):`,
    meetings.map((m) => `• [MEETING:${m.id}] "${m.title}" (${m.created_at?.slice(0, 10)}): ${m.ai_summary?.substring(0, 200) || 'No summary'}`).join('\n'),
    `\nACTIVE DECISIONS (${decisions.length}):`,
    decisions.map((d) => `• [DECISION:${d.id}] ${d.decision_text} — ${d.rationale || 'No rationale'}`).join('\n'),
    `\nOPEN BLOCKERS (${blockers.length}):`,
    blockers.map((b) => `• [BLOCKER:${b.id}] [${(b.severity || 'medium').toUpperCase()}] ${b.description}`).join('\n'),
    `\nRECENT VIDEOS (${videos.length}):`,
    videos.map((v) => `• [VIDEO:${v.id}] "${v.title}": ${v.ai_summary?.substring(0, 150) || 'No summary'}`).join('\n'),
    `\nOPEN TASKS (${tasks.length}):`,
    tasks.map((t) => `• ${t.title}${t.due_date ? ` (due ${t.due_date})` : ''}`).join('\n'),
    `\nPENDING COMMITMENTS (${commitments.length}):`,
    commitments.map((c) => `• ${c.commitment_text}${c.due_date ? ` (by ${c.due_date})` : ''}`).join('\n'),
    `\nACTIVE SPACES (${spaces.length}):`,
    spaces.map((s) => `• [SPACE:${s.id}] "${s.name}": ${s.description?.substring(0, 150) || 'No description'}`).join('\n'),
  ].join('\n');

  return { contextText, sourceMap, meetings, decisions, blockers, videos, tasks, commitments, spaces };
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
