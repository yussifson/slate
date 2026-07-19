import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, Sparkles, X, Brain, Loader2, ExternalLink, Calendar, Video, ShieldAlert, AlertTriangle, RefreshCw, ChevronDown, Plus } from 'lucide-react';
import { buildOrgContext } from '@/lib/clipadIntelligence';
import { generateText } from '@/lib/cloudflareAI';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

const SOURCE_META = {
  meeting:  { icon: Calendar,      color: 'text-blue-500',   bg: 'bg-blue-500/10'   },
  decision: { icon: ShieldAlert,   color: 'text-rose-500',   bg: 'bg-rose-500/10'   },
  video:    { icon: Video,         color: 'text-purple-500', bg: 'bg-purple-500/10' },
  blocker:  { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
};

const STARTER_QUESTIONS = [
  'What decisions were made this week?',
  'What are the open blockers right now?',
  'Summarize recent meeting activity.',
  'What tasks are overdue?',
  'What commitments are still pending?',
];

export default function ClipadOrbitAssistant({ isOpen = true, onClose, spaceId = null }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: "Hello! I'm **Orbit**, your organizational intelligence assistant. I have real-time access to your workspace — meetings, decisions, videos, blockers, tasks, and commitments.\n\nAsk me anything about your organization.",
      sources: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [orgContext, setOrgContext] = useState(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && !orgContext) loadContext();
  }, [isOpen]);

  const loadContext = async () => {
    setIsLoadingContext(true);
    try {
      const ctx = await buildOrgContext({ limit: 15 });
      setOrgContext(ctx);
    } catch (err) {
      console.error('[Orbit] Failed to load org context:', err);
    } finally {
      setIsLoadingContext(false);
    }
  };

  const parseSourcesFromResponse = (raw, sourceMap) => {
    if (!sourceMap) return { text: raw, sources: [] };
    const sourcesMatch = (raw || '').match(/SOURCES:\s*(\[.*?\])/s);
    let sources = [];
    let text = raw || '';
    if (sourcesMatch) {
      try { sources = JSON.parse(sourcesMatch[1]); } catch { /* ignore */ }
      text = text.replace(/SOURCES:.*$/s, '').trim();
    }
    // Resolve full source objects from sourceMap
    const resolved = sources
      .map(s => sourceMap[s.id] || null)
      .filter(Boolean);
    return { text, sources: resolved };
  };

  const handleSend = useCallback(async (overrideText) => {
    const userText = (overrideText || input).trim();
    if (!userText || isTyping) return;

    const userMsg = { id: Date.now(), role: 'user', text: userText, sources: [] };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Build conversation history for multi-turn memory
      const history = messages.slice(-8).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.text,
      }));

      const systemPrompt = `You are Orbit, the organizational intelligence assistant for ClipPad. You have access to real-time workspace data. Answer questions concisely and accurately. Always cite your sources by including at the end: SOURCES:[{"id":"<source_id>","type":"<type>"},...] for the relevant items you used. If you cannot find the answer in the data, say so honestly. Never invent meetings, decisions, or facts.

AGENTIC CAPABILITIES:
You can proactively execute actions on behalf of the user by outputting a JSON block starting with ACTION: followed by a JSON object. 
Available actions:
1. create_task: {"action": "create_task", "title": "...", "assignee": "..."}
2. send_message: {"action": "send_message", "recipient": "...", "message": "..."}

If you decide to take an action, output the ACTION: block at the very end of your response (before SOURCES).

CURRENT WORKSPACE KNOWLEDGE:
${orgContext?.contextText || 'No workspace data loaded yet. Ask the user to refresh.'}`;

      const allMessages = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userText },
      ];

      const raw = await generateText(allMessages);
      const { text, sources } = parseSourcesFromResponse(raw, orgContext?.sourceMap || {});

      // Agentic Parse
      const actionMatch = text.match(/ACTION:\s*({.*})/s);
      let executedAction = null;
      let cleanText = text;

      if (actionMatch) {
        try {
          executedAction = JSON.parse(actionMatch[1]);
          cleanText = text.replace(/ACTION:.*$/s, '').trim();
          
          if (executedAction.action === 'create_task') {
             console.log("[Orbit Agent] Executing create_task", executedAction);
             try {
               const { error } = await supabase.from('clipad_tasks').insert({
                 title: executedAction.title || 'Orbit Automated Task',
                 status: 'todo',
                 space_id: spaceId || null,
                 assignee_id: user?.id || null,
                 is_complete: false
               });
               if (error) throw error;
               executedAction.status = 'success';
             } catch (err) {
               console.error("Failed to insert task:", err);
               executedAction.status = 'error';
               executedAction.error = err.message;
             }
          } else if (executedAction.action === 'send_message') {
             console.log("[Orbit Agent] Executing send_message", executedAction);
             try {
                // If it fails due to RLS, it means the channel_id needs to be correct. We default to general channel if available.
                const { error } = await supabase.from('chat_messages').insert({
                  channel_id: 'general', // We could try to extract from executedAction.recipient if it was an ID
                  user_id: user?.id,
                  content: executedAction.message || '',
                  created_at: new Date().toISOString()
                });
                if (error) throw error;
                executedAction.status = 'success';
             } catch (err) {
               console.error("Failed to send message:", err);
               executedAction.status = 'error';
               executedAction.error = err.message;
             }
          }
        } catch(e) {
          console.error("Failed to parse action JSON", e);
          cleanText = text.replace(/ACTION:.*$/s, '').trim();
          executedAction = { action: 'error', error: 'I attempted to perform an action but encountered an internal formatting error.' };
        }
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: cleanText || 'I was unable to generate a response. Please try again.',
        sources,
        executedAction,
      }]);
    } catch (err) {
      console.error('[Orbit] Error:', err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: 'I encountered an error while processing your request. Please try again.',
        sources: [],
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [input, messages, orgContext, isTyping]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessageText = (text) => {
    // Simple markdown: **bold**, line breaks
    return text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 w-full h-full md:w-[420px] md:h-[650px] md:max-h-[calc(100vh-6rem)] bg-white dark:bg-[#212121] md:border md:border-slate-200 dark:md:border-white/10 md:rounded-3xl flex flex-col z-[100] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-300">
      {/* Header - Native minimalist style */}
      <div className="bg-white/90 dark:bg-[#212121]/90 backdrop-blur-md border-b border-black/5 dark:border-white/5 px-4 py-3.5 flex justify-between items-center text-slate-900 dark:text-white shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {onClose && (
            <button onClick={onClose} className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
              <ChevronDown className="w-6 h-6" />
            </button>
          )}
          <div>
            <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
              Orbit AI <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {isLoadingContext ? 'Syncing workspace...' : orgContext ? 'Connected to workspace' : 'Ready'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={loadContext}
            title="Refresh workspace data"
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <RefreshCw className={`w-4.5 h-4.5 ${isLoadingContext ? 'animate-spin' : ''}`} />
          </button>
          {onClose && (
            <button onClick={onClose} className="hidden md:flex p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Context Status */}
      {orgContext && (
        <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 text-[10px] text-slate-500 dark:text-slate-400 font-medium shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {orgContext.meetings.length} meetings · {orgContext.decisions.length} decisions · {orgContext.blockers.length} blockers · {orgContext.tasks.length} tasks
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center shrink-0 mr-3 mt-0.5 bg-white dark:bg-black shadow-sm">
                <Brain className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </div>
            )}
            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}>
              <div className={`text-[15px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-slate-100 dark:bg-[#2f2f2f] text-slate-900 dark:text-white px-4 py-2.5 rounded-[20px] rounded-br-sm'
                  : 'bg-transparent text-slate-800 dark:text-slate-200 py-1'
              }`}>
                {renderMessageText(msg.text)}
              </div>
              
              {/* Source Citations */}
              {msg.sources?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {msg.sources.map((src, i) => {
                    const meta = SOURCE_META[src.type] || {};
                    const Icon = meta.icon;
                    return (
                      <span
                        key={i}
                        className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-xl border border-black/5 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 shadow-sm`}
                      >
                        {Icon && <Icon className={`w-3 h-3 ${meta.color}`} />}
                        {src.title?.substring(0, 30) || src.type}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Executed Action Callout */}
              {msg.executedAction && (
                <div className="mt-2 bg-slate-50 dark:bg-[#2a2b32] border border-slate-200 dark:border-white/5 rounded-2xl p-3.5 flex items-start gap-3 w-full shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Orbit Agent Action</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {msg.executedAction.action === 'create_task' 
                        ? `Created task: "${msg.executedAction.title}"` + (msg.executedAction.assignee ? ` assigned to ${msg.executedAction.assignee}` : '')
                        : msg.executedAction.action === 'send_message'
                        ? `Sent message to ${msg.executedAction.recipient || 'channel'}: "${msg.executedAction.message}"`
                        : `Executed: ${msg.executedAction.action}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start w-full">
            <div className="w-8 h-8 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center shrink-0 mr-3 mt-0.5 bg-white dark:bg-black shadow-sm">
              <Brain className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            </div>
            <div className="flex items-center gap-1.5 h-9">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Starter Questions */}
      {messages.length === 1 && !isTyping && (
        <div className="px-4 pb-4 shrink-0 flex flex-col items-center">
          <div className="flex flex-wrap justify-center gap-2 max-w-sm">
            {STARTER_QUESTIONS.slice(0, 4).map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="text-[13px] px-4 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#2f2f2f] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors font-medium shadow-sm text-center"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 shrink-0 bg-white dark:bg-[#212121] border-t border-black/5 dark:border-white/5 md:border-none md:bg-transparent pb-safe">
        <div className="relative flex items-end bg-slate-100 dark:bg-[#2f2f2f] rounded-3xl px-4 py-1.5 shadow-sm border border-slate-200/50 dark:border-white/5">
          <button className="p-2 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0">
            <Plus className="w-5 h-5" />
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Orbit..."
            rows={1}
            className="flex-1 bg-transparent resize-none border-none focus:outline-none text-[15px] text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 max-h-32 py-2.5 px-2 leading-relaxed"
            style={{ scrollbarWidth: 'none' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className={`p-2 rounded-full mb-1 ml-1 transition-all shrink-0 ${
              input.trim() && !isTyping
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-white/30'
            }`}
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-3 hidden md:block">
          Orbit can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}
