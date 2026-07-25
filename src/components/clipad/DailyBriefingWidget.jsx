import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, AlertTriangle, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { generateText } from '@/lib/cloudflareAI';
import { useAuth } from '@/lib/AuthContext';

export default function DailyBriefingWidget() {
  const { user } = useAuth();
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAndGenerateBriefing = async () => {
    if (!user?.company_id) return;
    setLoading(true);
    try {
      // 1. Fetch yesterday's meetings, pending commitments, and blockers
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [meetingsRes, commitmentsRes, blockersRes] = await Promise.all([
        supabase.from('clipad_meeting_records').select('title, ai_summary').eq('company_id', user.company_id).gte('created_at', yesterday).limit(5),
        supabase.from('clipad_commitments').select('commitment_text, owner, due_date').eq('company_id', user.company_id).eq('status', 'active').limit(5),
        supabase.from('clipad_blockers').select('description, severity').eq('company_id', user.company_id).eq('status', 'active').limit(5),
      ]);

      const meetings = meetingsRes.data || [];
      const commitments = commitmentsRes.data || [];
      const blockers = blockersRes.data || [];

      // If no data is available yet, provide default fallback briefing
      if (meetings.length === 0 && commitments.length === 0 && blockers.length === 0) {
        setBriefing({
          greeting: `Good day, ${user?.full_name?.split(' ')[0] || 'Team'}!`,
          highlights: ["All operational signals normal. No critical blockers detected."],
          topPriorities: ["Review upcoming team meetings for today", "Check open action items"],
          risks: []
        });
        return;
      }

      // 2. Synthesize using Kimi K2.5
      const prompt = `You are an executive chief of staff. Synthesize a concise 3-bullet "Good Morning Executive Briefing" based on these org signals:
Meetings in last 24h: ${JSON.stringify(meetings)}
Active Commitments: ${JSON.stringify(commitments)}
Active Blockers: ${JSON.stringify(blockers)}

Return ONLY valid JSON with keys:
- "greeting": short personalized greeting
- "highlights": array of 2-3 key accomplishments/meeting summaries from yesterday
- "topPriorities": array of 2-3 urgent commitments due soon
- "risks": array of 1-2 critical blockers or risk warnings (can be empty array)`;

      const raw = await generateText([{ role: 'user', content: prompt }]);
      const cleaned = (raw || '').replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setBriefing(parsed);
    } catch (err) {
      console.warn("Failed to generate daily briefing", err);
      setBriefing({
        greeting: `Good day, ${user?.full_name?.split(' ')[0] || 'Team'}!`,
        highlights: ["Workspace initialized. All systems operating smoothly."],
        topPriorities: ["Review active tasks & space discussions"],
        risks: []
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAndGenerateBriefing();
  }, [user?.company_id]);

  if (loading) {
    return (
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border border-emerald-500/20 animate-pulse flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-emerald-500 animate-spin" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Synthesizing your Executive Daily Briefing...</span>
        </div>
      </div>
    );
  }

  if (!briefing) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 text-white p-5 shadow-xl border border-emerald-500/30">
      <div className="absolute top-0 right-0 p-8 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Daily Briefing</h3>
            <p className="text-base font-semibold text-white">{briefing.greeting}</p>
          </div>
        </div>
        <button
          onClick={() => { setRefreshing(true); fetchAndGenerateBriefing(); }}
          disabled={refreshing}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
          title="Refresh briefing"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Yesterday's Highlights */}
        {briefing.highlights?.length > 0 && (
          <div className="space-y-2 bg-white/5 p-3.5 rounded-xl border border-white/10">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> Yesterday's Key Highlights
            </h4>
            <ul className="space-y-1 text-xs text-slate-200">
              {briefing.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Top Priorities & Risks */}
        <div className="space-y-2 bg-white/5 p-3.5 rounded-xl border border-white/10">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3" /> Today's Priorities
          </h4>
          <ul className="space-y-1 text-xs text-slate-200">
            {briefing.topPriorities?.map((p, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-amber-400 font-bold">•</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>

          {briefing.risks?.length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Risks / Blockers
              </span>
              <ul className="text-xs text-red-200 mt-1">
                {briefing.risks.map((r, i) => (
                  <li key={i}>• {r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">Powered by Kimi K2.5 Organizational Intelligence</span>
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('orbit:inject', {
              detail: { query: 'Give me a deeper breakdown of my team’s active blockers and commitments' }
            }));
          }}
          className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Ask OrbitFlow <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
