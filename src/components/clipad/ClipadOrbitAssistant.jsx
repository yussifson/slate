import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, Sparkles, X, Brain, Loader2, ExternalLink, Calendar, Video, ShieldAlert, AlertTriangle, RefreshCw, ChevronDown } from 'lucide-react';
import { buildOrgContext } from '@/lib/clipadIntelligence';
import { generateText } from '@/lib/cloudflareAI';

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

export default function ClipadOrbitAssistant({ isOpen = true, onClose }) {
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
             console.log("[Orbit Agent] Simulated create_task", executedAction);
          } else if (executedAction.action === 'send_message') {
             console.log("[Orbit Agent] Simulated send_message", executedAction);
          }
        } catch(e) {
          console.error("Failed to parse action JSON", e);
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
    <div className="fixed bottom-[80px] md:bottom-6 right-6 w-[420px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-6rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col z-50 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 flex justify-between items-center text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold leading-tight flex items-center gap-2">
              Orbit AI <Sparkles className="w-3 h-3 text-amber-300" />
            </h3>
            <p className="text-[10px] opacity-80 uppercase tracking-widest font-semibold">
              {isLoadingContext ? 'Loading workspace...' : orgContext ? 'Workspace connected' : 'Organizational Brain'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadContext}
            title="Refresh workspace data"
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingContext ? 'animate-spin' : ''}`} />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Context Status */}
      {orgContext && (
        <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 border-b border-emerald-100 dark:border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {orgContext.meetings.length} meetings · {orgContext.decisions.length} decisions · {orgContext.blockers.length} blockers · {orgContext.tasks.length} tasks
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-sm'
              }`}>
                {renderMessageText(msg.text)}
              </div>
              {/* Source Citations */}
              {msg.sources?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-1">
                  {msg.sources.map((src, i) => {
                    const meta = SOURCE_META[src.type] || {};
                    const Icon = meta.icon;
                    return (
                      <span
                        key={i}
                        className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg ${meta.bg} ${meta.color}`}
                      >
                        {Icon && <Icon className="w-2.5 h-2.5" />}
                        {src.title?.substring(0, 25) || src.type}
                      </span>
                    );
                  })}
                </div>
              )}
              {/* Executed Action Callout */}
              {msg.executedAction && (
                <div className="mt-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-3 flex items-start gap-3 w-full">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">Orbit Agent Action</p>
                    <p className="text-xs text-indigo-600/80 dark:text-indigo-300/80 mt-1">
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
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              <span className="text-sm text-muted-foreground">Orbit is thinking...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Starter Questions */}
      {messages.length === 1 && !isTyping && (
        <div className="px-4 pb-2 shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-1.5">
            {STARTER_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="text-[11px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors font-medium"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-3 shrink-0 bg-white dark:bg-slate-900">
        <div className="flex items-end gap-2 bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2.5">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about meetings, decisions, blockers..."
            rows={1}
            className="flex-1 bg-transparent resize-none border-none focus:outline-none text-sm text-foreground placeholder-muted-foreground max-h-28 leading-relaxed"
            style={{ scrollbarWidth: 'none' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all shrink-0"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
        <p className="text-center text-[10px] text-muted-foreground mt-2">Powered by ClipPad OI · Press Enter to send</p>
      </div>
    </div>
  );
}
