import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { generateStandupSummary } from '@/lib/clipadIntelligence';
import { writeOrgEvent } from '@/lib/clipadIntelligence';
import { isAdmin } from '@/lib/constants';
import {
  Sun, CheckCircle, AlertTriangle, Smile, Frown, Meh, Zap, TrendingUp,
  Plus, Sparkles, Loader2, User, Clock, Send, ChevronDown, ChevronUp, RefreshCw,
  Download, FileText, File
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

const MOOD_OPTIONS = [
  { value: 'great',      label: 'Great',      emoji: '🚀', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' },
  { value: 'good',       label: 'Good',       emoji: '😊', color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20' },
  { value: 'neutral',    label: 'Neutral',    emoji: '😐', color: 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
  { value: 'struggling', label: 'Struggling', emoji: '😓', color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' },
  { value: 'blocked',    label: 'Blocked',    emoji: '🔴', color: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20' },
];

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Low',    color: 'text-slate-500' },
  { value: 'normal', label: 'Normal', color: 'text-blue-500' },
  { value: 'high',   label: 'High',   color: 'text-amber-500' },
  { value: 'urgent', label: 'Urgent', color: 'text-rose-500' },
];

function StandupCard({ update, isCurrentUser }) {
  const mood = MOOD_OPTIONS.find(m => m.value === update.mood) || MOOD_OPTIONS[2];
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-2xl border p-4 transition-all ${isCurrentUser ? 'border-primary/30 bg-primary/5' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {update.profiles?.full_name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{update.profiles?.full_name || 'Team Member'}</p>
            <p className="text-[11px] text-muted-foreground">{new Date(update.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${mood.color}`}>
            <span>{mood.emoji}</span> {mood.label}
          </span>
          <button onClick={() => setExpanded(!expanded)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className={`mt-3 space-y-2 overflow-hidden transition-all ${expanded ? 'block' : 'hidden'}`}>
        {update.today && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Today</p>
            <p className="text-sm text-foreground">{update.today}</p>
          </div>
        )}
        {update.yesterday && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">Yesterday</p>
            <p className="text-sm text-foreground">{update.yesterday}</p>
          </div>
        )}
        {update.blockers && (
          <div className="bg-rose-50 dark:bg-rose-500/10 rounded-xl p-3 border border-rose-100 dark:border-rose-500/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Blockers
            </p>
            <p className="text-sm text-foreground">{update.blockers}</p>
          </div>
        )}
      </div>

      {/* Preview when collapsed */}
      {!expanded && (
        <p className="text-sm text-muted-foreground mt-2 line-clamp-1">{update.today}</p>
      )}
    </div>
  );
}

export default function StandupPanel({ spaceId }) {
  const { user } = useAuth();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [todayUpdate, setTodayUpdate] = useState(null);
  const [filterMode, setFilterMode] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [form, setForm] = useState({
    today: '',
    yesterday: '',
    blockers: '',
    mood: 'good',
    priority: 'normal',
  });

  useEffect(() => {
    if (spaceId) {
      const sub = supabase
        .channel(`standups:${spaceId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clipad_standups', filter: `space_id=eq.${spaceId}` }, fetchUpdates)
        .subscribe();
      return () => supabase.removeChannel(sub);
    }
  }, [spaceId]);

  useEffect(() => {
    if (spaceId) {
      fetchUpdates();
    }
  }, [spaceId, filterMode]);

  const fetchUpdates = async () => {
    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let start = today;
    let end = null;

    if (filterMode === 'yesterday') {
      start = new Date(today);
      start.setDate(start.getDate() - 1);
      end = new Date(today);
    } else if (filterMode === 'last7days') {
      start = new Date(today);
      start.setDate(start.getDate() - 7);
    } else if (filterMode === 'advanced') {
      if (customStartDate) start = new Date(customStartDate);
      if (customEndDate) {
        end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
      } else {
        end = null;
      }
    }

    let query = supabase
      .from('clipad_standups')
      .select('*, profiles(full_name, avatar_url)')
      .eq('space_id', spaceId)
      .gte('created_at', start.toISOString());

    if (end) {
      query = query.lt('created_at', end.toISOString());
    }

    const { data } = await query.order('created_at', { ascending: false });

    setUpdates(data || []);
    setTodayUpdate((data || []).find(u => u.user_id === user?.id) || null);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.today.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('clipad_standups').insert({
        space_id: spaceId,
        user_id: user.id,
        workspace_id: user.company_id,
        user_name: user.full_name,
        today: form.today,
        yesterday: form.yesterday || null,
        blockers: form.blockers || null,
        mood: form.mood,
        priority: form.priority,
      });
      if (!error) {
        await writeOrgEvent({
          space_id: spaceId,
          workspace_id: user.company_id,
          event_type: 'standup_posted',
          title: `${user.full_name || 'Team member'} posted a standup`,
          description: form.today,
          actor_id: user.id,
          source_table: 'clipad_standups',
          importance: 2,
        });
        setForm({ today: '', yesterday: '', blockers: '', mood: 'good', priority: 'normal' });
        setShowForm(false);
        fetchUpdates();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const generateSummary = async () => {
    if (!updates.length) return;
    setIsSummarizing(true);
    try {
      const formatted = updates.map(u => ({
        user_name: u.user_name || u.profiles?.full_name,
        today: u.today,
        yesterday: u.yesterday,
        blockers: u.blockers,
        mood: u.mood,
      }));
      let contextStr = filterMode;
      if (filterMode === 'advanced') {
        contextStr = `${customStartDate || 'Start'} to ${customEndDate || 'Now'}`;
      }
      const summary = await generateStandupSummary(formatted, contextStr);
      setAiSummary(summary);
    } finally {
      setIsSummarizing(false);
    }
  };

  const getExportHTML = () => {
    let contextStr = filterMode;
    if (filterMode === 'advanced') {
      contextStr = `${customStartDate || 'Start'} to ${customEndDate || 'Now'}`;
    }
    const paragraphs = aiSummary.split('\n').filter(p => p.trim() !== '').map(p => `<p style="margin-bottom: 12px; line-height: 1.6; color: #333;">${p}</p>`).join('');
    return `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
        <h1 style="color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px;">Daily Standup Summary</h1>
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;"><strong>Date/Period:</strong> ${contextStr}</p>
        <div style="font-size: 14px;">
          ${paragraphs}
        </div>
      </div>
    `;
  };

  const exportAsPDF = () => {
    if (!aiSummary) return;
    const element = document.createElement('div');
    element.innerHTML = getExportHTML();
    const opt = {
      margin: 10,
      filename: `Standup_Summary_${filterMode}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const exportAsWord = () => {
    if (!aiSummary) return;
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Standup Summary</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + getExportHTML() + footer;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `Standup_Summary_${filterMode}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-4 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-500" /> Daily Standup
          </h2>
          <div className="flex items-center gap-3 mt-1.5">
            <p className="text-sm text-muted-foreground">{todayLabel}</p>
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 shadow-inner">
              <button onClick={() => setFilterMode('today')} className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md font-bold transition-all ${filterMode === 'today' ? 'bg-white dark:bg-slate-700 shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Today</button>
              <button onClick={() => setFilterMode('yesterday')} className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md font-bold transition-all ${filterMode === 'yesterday' ? 'bg-white dark:bg-slate-700 shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Yesterday</button>
              <button onClick={() => setFilterMode('last7days')} className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md font-bold transition-all ${filterMode === 'last7days' ? 'bg-white dark:bg-slate-700 shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Last 7 Days</button>
              <button onClick={() => setFilterMode('advanced')} className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md font-bold transition-all ${filterMode === 'advanced' ? 'bg-white dark:bg-slate-700 shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Advanced</button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUpdates}
            className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {!todayUpdate && filterMode === 'today' && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Post Update
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filter Range */}
      {filterMode === 'advanced' && (
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-border mt-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-muted-foreground">From:</label>
            <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-muted-foreground">To:</label>
            <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary" />
          </div>
          <button onClick={fetchUpdates} className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90">Apply</button>
        </div>
      )}

      {/* Post Form */}
      {showForm && !todayUpdate && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-4">
          <h3 className="font-bold text-foreground text-sm">Your Standup Update</h3>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
              ✅ What are you working on today? *
            </label>
            <textarea
              value={form.today}
              onChange={e => setForm(f => ({ ...f, today: e.target.value }))}
              placeholder="What's your focus for today?"
              rows={2}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
              📅 What did you complete yesterday?
            </label>
            <textarea
              value={form.yesterday}
              onChange={e => setForm(f => ({ ...f, yesterday: e.target.value }))}
              placeholder="What did you accomplish yesterday?"
              rows={2}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1.5 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Any blockers?
            </label>
            <textarea
              value={form.blockers}
              onChange={e => setForm(f => ({ ...f, blockers: e.target.value }))}
              placeholder="Anything blocking your progress? (leave blank if none)"
              rows={1}
              className="w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-500/30 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-rose-400 transition-colors resize-none"
            />
          </div>

          {/* Mood */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Your Mood</label>
            <div className="flex flex-wrap gap-2">
              {MOOD_OPTIONS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, mood: m.value }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${form.mood === m.value ? m.color : 'border-slate-200 dark:border-slate-700 text-muted-foreground hover:border-primary/40'}`}
                >
                  <span>{m.emoji}</span> {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSubmit}
              disabled={!form.today.trim() || submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Post Standup
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Already posted */}
      {todayUpdate && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
          <CheckCircle className="w-4 h-4" /> You've already posted your standup today.
        </div>
      )}

      {/* AI Summary and Team Updates Container */}
      <div id="standup-report-container" className="space-y-4">
        {/* AI Summary */}
        {isAdmin(user) && updates.length >= 2 && (
          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> AI Team Summary
              </h3>
              <div className="flex items-center gap-2">
                {aiSummary && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={exportAsPDF} className="gap-2 text-xs font-semibold cursor-pointer">
                        <FileText className="w-4 h-4 text-rose-500" /> Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={exportAsWord} className="gap-2 text-xs font-semibold cursor-pointer">
                        <File className="w-4 h-4 text-blue-500" /> Export as Word
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <button
                  onClick={generateSummary}
                  disabled={isSummarizing}
                  className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {isSummarizing ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'Generate'}
                </button>
              </div>
            </div>
            {aiSummary ? (
              <div className="text-sm text-indigo-800 dark:text-indigo-300 leading-relaxed">
                {aiSummary.split('\n').filter(p => p.trim() !== '').map((paragraph, idx) => (
                  <p key={idx} className="mb-2">{paragraph}</p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-indigo-600 dark:text-indigo-400 opacity-70">
                {isSummarizing ? 'Analyzing team updates...' : 'Click Generate to create an AI-powered team summary.'}
              </p>
            )}
          </div>
        )}

        {/* Team Updates */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : updates.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Sun className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium text-sm">No standup updates found.</p>
              {filterMode === 'today' && <p className="text-xs opacity-70 mt-1">Be the first to post your update!</p>}
            </div>
          ) : (
            updates.map(u => (
              <StandupCard key={u.id} update={u} isCurrentUser={u.user_id === user?.id} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
