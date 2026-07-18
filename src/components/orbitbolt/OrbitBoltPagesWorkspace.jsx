import { OrbitLoader } from '@/components/ui/orbit-loader';
import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useRef, useEffect} from 'react';
import { createPortal} from 'react-dom';
import { motion, AnimatePresence} from 'framer-motion';
import { Sparkles, Send, X, CheckCircle, RefreshCw, Layers, MessageSquarePlus, Search, MessageSquare, Clock, Trash2, Zap, LayoutGrid} from 'lucide-react';
import { Button} from '@/components/ui/button';
import { useAuth} from '@/lib/AuthContext';
import { useCompanyId} from '@/hooks/useCompanyId';
import { supabase} from '@/api/supabaseClient';
import { toast} from 'react-hot-toast';
import { generateText} from '@/lib/cloudflareAI';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import clsx from 'clsx';
import { useNavigate} from 'react-router-dom';
import { UNIVERSAL_COMPONENTS} from '@/config/universal_components';

const SYSTEM_PROMPT = `You are Orbit Build, an AI System Architect for Workslate.
You can converse naturally with the user, answer questions, and help them refine their ideas.

CRITICAL: If the user is just saying "Hi", asking a question, or chatting normally WITHOUT asking you to build, create, or update a page/dashboard, you MUST NOT output special tags. Just reply conversationally.

When the user asks you to build, create, or update a page, dashboard, or layout, you MUST determine if their request perfectly matches one of our predefined Universal Components, or if they need a custom Dynamic Layout.

OPTION 1: UNIVERSAL COMPONENT MATCH
If the user's request perfectly maps to one of the following Universal Components, output EXACTLY this tag format at the very end of your response:
<UNIVERSAL>{"component_id": "UnivAppointments", "name": "Appointments"}</UNIVERSAL>

AVAILABLE UNIVERSAL COMPONENTS:
${UNIVERSAL_COMPONENTS.map(c => `- ${c.id} : ${c.label}`).join('\n')}

OPTION 2: CUSTOM DYNAMIC LAYOUT (JSON SCHEMA)
If their request is unique or they explicitly ask for a custom layout, output a valid JSON schema wrapped EXACTLY in <SCHEMA>...</SCHEMA> tags.

The JSON inside <SCHEMA> must follow this exact structure to power the dynamic PageRenderer engine:
{
 "pageTitle": "Dashboard Name",
 "route": "unique-url-slug",
 "layout": [
 {
 "id": "unique_block_id",
 "component": "MetricCard" | "DataTable" | "FormBlock" | "ChartBlock" | "KanbanBlock",
 "dataConfig": { 
 "table": "table_name_here", 
 "filter": {}, 
 "aggregation": "count", 
 "label": "Metric Label", 
 "icon": "Users",
 "columns": [{"field": "name", "label": "Name"}] 
},
 "styleConfig": { "colSpan": 4, "theme": "light", "padding": "p-6"}
}
 ]
}

Available components:
- MetricCard: Needs table, aggregation (count/sum), label, icon (Users, Activity, DollarSign, Calendar, FileText). Best colSpan is 4.
- DataTable: Needs table, columns array [{field, label}]. Best colSpan is 12.

CRITICAL RULE: DO NOT mention the JSON schema, the <SCHEMA> tags, the <UNIVERSAL> tags, or your underlying architecture in your conversational response to the user. This is an invisible background system. Just say "I have generated the page" and put the tags at the very end.`;

// OrbitBolt AI Panel - Works exactly like OrbitFlow right panel
export default function OrbitBoltPagesWorkspace({ onClose, onApplySchema}) {
 const { user} = useAuth();
 const companyId = useCompanyId();
 const navigate = useNavigate();
 
 const [sessions, setSessions] = useState([]);
 const [activeSession, setActiveSession] = useState(null);
 const [input, setInput] = useState('');
 const [isGenerating, setIsGenerating] = useState(false);
 const [showHistory, setShowHistory] = useState(false);
 
 const messagesEndRef = useRef(null);
 const inputRef = useRef(null);
 
 useEffect(() => {
   if (!isGenerating && inputRef.current) {
     inputRef.current.focus();
   }
 }, [isGenerating]);

 useEffect(() => {
 const load = async () => {
 const __res = await powerSync.execute(`SELECT * FROM industry_records WHERE company_id = ? AND record_type = 'orbitbolt_session' ORDER BY created_at DESC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 
 if (data && data.length > 0) {
 const parsed = data.map(d => d.data);
 setSessions(parsed);
 setActiveSession(parsed[0]);
} else {
 startNewSession();
}
};
 load();
}, [companyId]);

 useEffect(() => {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth'});
}, [activeSession?.messages, isGenerating]);

 const startNewSession = () => {
 const s = {
 id: crypto.randomUUID(),
 title: 'New WorkSlate',
 createdAt: new Date().toISOString(),
 messages: [{ role: 'assistant', content: "Hi there! I'm Orbit Build, your AI Page Architect. Tell me what kind of page, dashboard, or layout you want to build, and I'll assemble the React components for you instantly."}],
 latest_schema: null
};
 setSessions(prev => [s, ...prev]);
 setActiveSession(s);
 saveSession(s);
 setShowHistory(false);
};

 const switchSession = (s) => {
 setActiveSession(s);
 setShowHistory(false);
};

 const deleteSession = async (sid, e) => {
 e.stopPropagation();
 if (companyId) {
 await powerSync.execute(`DELETE FROM industry_records WHERE id = ? AND company_id = ?`, [sid, companyId]);
}
 setSessions(prev => {
 const rest = prev.filter(s => s.id !== sid);
 if (rest.length === 0) {
 startNewSession();
 return prev;
}
 if (activeSession?.id === sid) setActiveSession(rest[0]);
 return rest;
});
};

 const saveSession = async (s) => {
 if (!companyId) return;
 await (async () => {
 const _payload = {
 id: s.id,
 company_id: companyId,
 industry: 'core',
 record_type: 'orbitbolt_session',
 search_text: s.title.toLowerCase(),
 data: s
};
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const existing = await powerSync.getOptional('SELECT id FROM industry_records WHERE id = ?', [_payload.id]);
        if (existing) {
          await powerSync.execute(`UPDATE industry_records SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, _payload.id]);
        } else {
          await powerSync.execute(`INSERT INTO industry_records (${_keys.join(', ')}) VALUES (${_keys.map(()=>'?').join(', ')})`, _vals);
        }
})();
};

 const handleSend = async (e) => {
 e?.preventDefault();
 if (!input.trim() || !activeSession) return;
 
 const text = input.trim();
 setInput('');
 setIsGenerating(true);

 const userMsg = { role: 'user', content: text};
 const updatedMsgs = [...activeSession.messages, userMsg];
 
 let title = activeSession.title;
 if (title === 'New WorkSlate') title = text.slice(0, 30) + '...';
 
 let s = { ...activeSession, title, messages: updatedMsgs};
 setActiveSession(s);
 setSessions(prev => prev.map(p => p.id === s.id ? s : p));

 try {
 const aiMessages = [
 { role: 'system', content: SYSTEM_PROMPT},
 ...updatedMsgs.map(m => {
 if (m.role === 'assistant') {
 return { role: 'assistant', content: m.raw_json ? JSON.stringify(m.raw_json) : m.content};
}
 return { role: 'user', content: m.content};
})
 ];

 const responseText = await generateText(aiMessages);
 
 let parsedSchema = null;
 let aiResponseMsg = responseText;
 let appliedSuccessfully = false;

 // Extract UNIVERSAL tag
 const universalMatch = responseText.match(/<UNIVERSAL>([\s\S]*?)<\/UNIVERSAL>/i);
 if (universalMatch && universalMatch[1]) {
 try {
 const univData = JSON.parse(universalMatch[1].trim());
 aiResponseMsg = responseText.replace(/<UNIVERSAL>[\s\S]*?<\/UNIVERSAL>/ig, '').trim();
 if (!aiResponseMsg) aiResponseMsg = "I have selected a Universal Component for your architecture.";
 
 if (onApplySchema) {
 onApplySchema({ isUniversal: true, ...univData});
 appliedSuccessfully = true;
}
} catch(e) {
 console.error("Failed to parse universal:", e);
}
} else {
 // Extract SCHEMA tag
 const schemaMatch = responseText.match(/<S?CHEMA>([\s\S]*?)(?:<\/S?CHEMA>|<S?CHEMA>|$)/i);
 if (schemaMatch && schemaMatch[1]) {
 try {
 parsedSchema = JSON.parse(schemaMatch[1].trim());
 aiResponseMsg = responseText.replace(/<S?CHEMA>[\s\S]*?(?:<\/S?CHEMA>|<S?CHEMA>|$)/ig, '').trim();
 if (!aiResponseMsg) aiResponseMsg = "I've generated the layout architecture.";
 
 if (onApplySchema) {
 onApplySchema(parsedSchema);
 appliedSuccessfully = true;
} else {
 sessionStorage.setItem('orbitbolt_pending_schema', JSON.stringify(parsedSchema));
 navigate('/create/module');
}
} catch (e) {
 console.error("Failed to parse schema from AI:", e);
}
}
}

 if (appliedSuccessfully && aiResponseMsg === "I've generated the layout architecture.") {
 aiResponseMsg += " I have applied it instantly.";
}

 const assistantMsg = { 
 role: 'assistant', 
 content: aiResponseMsg,
 raw_json: parsedSchema || null
};
 
 s = { ...s, messages: [...updatedMsgs, assistantMsg]};
 
 setActiveSession(s);
 setSessions(prev => prev.map(p => p.id === s.id ? s : p));
 saveSession(s);
 
} catch (err) {
 console.error(err);
 toast.error("Failed to generate page: " + err.message);
 const errorMsg = { role: 'assistant', content: "Sorry, I ran into an error building that. Please try rephrasing."};
 s = { ...s, messages: [...updatedMsgs, errorMsg]};
 setActiveSession(s);
 setSessions(prev => prev.map(p => p.id === s.id ? s : p));
} finally {
 setIsGenerating(false);
}
};

 const workspaceContent = (
 <div className="max-md:fixed z-[9999] bg-card transition-all duration-300 overflow-hidden flex max-md:inset-x-0 max-md:bottom-0 max-md:h-[85vh] max-md:rounded-md-t-[32px] max-md:flex-col max-md:pb-[env(safe-area-inset-bottom)] md:relative md:h-full md:shrink-0 md:border-l-2 md:border-l-primary/30 md:w-[400px] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 
 {/* History Sidebar */}
 <AnimatePresence>
 {showHistory && (
  <motion.div 
  initial={{ width: 0, opacity: 0}}
  animate={{ width: 220, opacity: 1}}
  exit={{ width: 0, opacity: 0}}
  className="shrink-0 border-r border-slate-200/60 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#0A0F1C]/50 flex flex-col overflow-hidden backdrop-blur-xl"
  >
  <div className="px-4 py-3 border-b border-slate-200/60 dark:border-white/[0.08] flex items-center justify-between whitespace-nowrap bg-white/40 dark:bg-[#131A2B]/40">
  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-muted-foreground">Workslates</span>
  <div className="flex items-center gap-1.5">
  <button onClick={startNewSession} className="p-1.5 hover:bg-white dark:hover:bg-white/10 rounded-md text-slate-500 dark:text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-all shadow-sm" title="New slate">
  <MessageSquarePlus className="w-3.5 h-3.5" />
  </button>
  <button onClick={() => setShowHistory(false)} className="p-1.5 hover:bg-white dark:hover:bg-white/10 rounded-md text-slate-500 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-white transition-all shadow-sm" title="Close history">
  <X className="w-3.5 h-3.5" />
  </button>
  </div>
  </div>
 <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-primary">
 {sessions.map(s => (
  <div
  key={s.id}
  onClick={() => switchSession(s)}
  className={clsx(
  "group relative flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer text-left transition-all whitespace-nowrap border border-transparent",
  s.id === activeSession?.id
  ? 'bg-white dark:bg-[#1A233A] border-amber-500/20 dark:border-amber-500/30 text-slate-900 dark:text-white shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:shadow-none'
  : 'hover:bg-white/60 dark:hover:bg-[#131A2B]/80 text-slate-500 dark:text-muted-foreground hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-200/60 dark:hover:border-white/5'
  )}
  >
  <MessageSquare className={clsx("w-3.5 h-3.5 mt-0.5 shrink-0 transition-colors", s.id === activeSession?.id ? "text-amber-500" : "text-slate-400 group-hover:text-slate-500")} />
  <div className="flex-1 min-w-0 overflow-hidden">
  <p className={clsx("text-[11.5px] truncate leading-tight", s.id === activeSession?.id ? "font-semibold" : "font-medium")}>{s.title}</p>
  <p className="text-[9.5px] opacity-60 mt-1 font-medium tracking-wide">
  {new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
  </p>
  </div>
  <button
  onClick={e => deleteSession(s.id, e)}
  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md text-slate-400 hover:text-red-500 transition-all shrink-0"
  >
  <Trash2 className="w-3.5 h-3.5" />
  </button>
  </div>
 ))}
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Main Panel */}
 <div className="flex-1 flex flex-col min-w-0 w-[400px]">
 {/* Header */}
  <div className="flex items-center justify-between px-5 py-3.5 shrink-0 bg-white/80 dark:bg-[#0A0F1C]/80 backdrop-blur-2xl border-b border-slate-200/80 dark:border-white/[0.08] relative z-20 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.4)]">
  <div className="flex items-center gap-3.5">
  <button
  onClick={() => setShowHistory(prev => !prev)}
  className={clsx(
    "p-2 rounded-xl transition-all duration-200 shrink-0", 
    showHistory 
      ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-600 ring-1 ring-amber-500/20' 
      : 'bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
  )}
  title="Workslates History"
  >
  <Clock className="w-4 h-4" />
  </button>
  <div className="flex items-center gap-3">
  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 dark:from-amber-500 dark:to-amber-700 text-white shrink-0 shadow-md shadow-amber-500/20 ring-1 ring-white/20 relative overflow-hidden">
  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer" />
  <Zap className="w-4.5 h-4.5 fill-current relative z-10" />
  </div>
  <div className="flex flex-col">
   <div className="flex items-center gap-2.5">
    <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-none">Orbit Build</p>
   </div>
   <p className="text-[11px] text-slate-500 dark:text-muted-foreground mt-1 font-medium tracking-wide">Page Designer</p>
  </div>
  </div>
  </div>
  <button onClick={onClose} className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all shrink-0">
  <X className="w-4 h-4" />
  </button>
  </div>

 {/* Chat Area */}
  <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 scrollbar-primary bg-slate-50/30 dark:bg-transparent relative z-10">
  {activeSession?.messages?.map((m, i) => (
  <motion.div 
  initial={{ opacity: 0, y: 8}}
  animate={{ opacity: 1, y: 0}}
  transition={{ duration: 0.2}}
  key={i} 
  className={clsx("flex gap-3.5 max-w-full group", m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
  >
  {m.role === 'assistant' && (
  <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md shadow-amber-500/20 flex items-center justify-center ring-2 ring-white dark:ring-[#0A0F1C] mt-0.5">
  <Zap className="w-4 h-4 fill-current" />
  </div>
  )}
  <div className={clsx(
  "max-w-[85%] text-[13px] leading-relaxed shadow-sm transition-all duration-200 relative",
  m.role === 'user'
  ? 'rounded-2xl rounded-tr-sm px-4 py-3 bg-primary text-primary-foreground shadow-md shadow-primary/20'
  : 'rounded-2xl rounded-tl-sm px-4.5 py-3.5 bg-white dark:bg-[#131A2B] border border-slate-200/60 dark:border-white/5 text-slate-700 dark:text-foreground prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-pre:bg-slate-50 dark:prose-pre:bg-[#0A0F1C] prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-white/5 prose-pre:rounded-xl prose-code:text-amber-600 dark:prose-code:text-amber-400 prose-code:before:content-none prose-code:after:content-none prose-headings:font-semibold hover:shadow-md'
  )}>
  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
  </div>
  </motion.div>
 ))}
 {isGenerating && (
 <motion.div initial={{ opacity: 0}} animate={{ opacity: 1}} className="flex gap-3">
 <div className="shrink-0 w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center ring-1 ring-amber-500/20 mt-0.5">
 <Zap className="w-3.5 h-3.5 fill-current" />
 </div>
 <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl rounded-tl-sm bg-muted ring-1 ring-border/50 text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">
 <OrbitLoader size="sm" />
 <span>Architecting...</span>
 </div>
 </motion.div>
 )}
 <div ref={messagesEndRef} className="h-2" />
 </div>

 {/* Input Area */}
  <div className="p-4 bg-white/95 dark:bg-[#0A0F1C]/95 backdrop-blur-2xl border-t border-slate-200/60 dark:border-white/[0.08] shrink-0 relative z-20 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.3)]">
  <form onSubmit={handleSend}>
  <div className="relative rounded-2xl bg-white dark:bg-[#131A2B] border border-slate-200 dark:border-white/10 shadow-sm focus-within:shadow-md focus-within:border-amber-500/40 focus-within:ring-4 focus-within:ring-amber-500/10 transition-all duration-300 flex flex-col group overflow-hidden">
  {/* Inner shadow overlay for premium depth */}
  <div className="absolute inset-0 rounded-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] pointer-events-none" />
  <textarea
  ref={inputRef}
  value={input}
  onChange={e => setInput(e.target.value)}
  onKeyDown={e => {
  if (e.key === 'Enter' && !e.shiftKey) {
  e.preventDefault();
  handleSend(e);
 }
}}
  placeholder="Describe the layout or page..."
  className="w-full bg-transparent border-none focus:ring-0 resize-none px-4 pt-4 pb-2 text-[13px] text-slate-800 dark:text-slate-100 outline-none leading-relaxed min-h-[56px] max-h-[200px] overflow-y-auto placeholder:text-slate-400 dark:placeholder:text-slate-500 scrollbar-thin relative z-10"
  disabled={isGenerating}
  />
  <div className="flex items-center justify-between px-3 pb-3 relative z-10">
  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium px-1 uppercase tracking-widest">Enter to send</span>
  <Button 
  type="submit" 
  size="icon"
  disabled={!input.trim() || isGenerating}
  className="h-8 w-8 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:shadow-none transition-all duration-300"
  >
  <Send className="w-3.5 h-3.5 ml-0.5" />
  </Button>
  </div>
  </div>
  </form>
  </div>

  </div>
  </div>
  );

 return createPortal(workspaceContent, document.getElementById('right-docked-panel-portal') || document.body);
}

