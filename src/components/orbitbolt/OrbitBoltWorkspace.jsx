import { OrbitLoader } from '@/components/ui/orbit-loader';
import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useRef, useEffect} from 'react';
import { createPortal} from 'react-dom';
import { motion, AnimatePresence} from 'framer-motion';
import { Sparkles, Send, X, CheckCircle, RefreshCw, Layers, MessageSquarePlus, Search, MessageSquare, Clock, Trash2, Zap, LayoutGrid, Mic, MicOff} from 'lucide-react';
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
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

const SYSTEM_PROMPT = `You are OrbitBuild, an elite AI System Architect for Workslate.
You converse naturally with the user to help them build any feature, app, or system they need.

CRITICAL: If the user is just saying "Hi" or chatting normally WITHOUT asking to build/create a system, you MUST NOT output special tags. Just reply conversationally.

When asked to build or create, you are a UNIFIED agent that can choose the best architectural approach based on the user's prompt priority:

PRIORITY 1: ASSEMBLE UNIVERSAL PRIMITIVES (Best for standard data management)
If the user's request maps to standard business management (e.g. Employee Tracker, Inventory System), output EXACTLY this tag format at the very end of your response to assemble a standard module:
<UNIVERSAL>{"component_id": "UnivDataGrid", "name": "Employee List"}</UNIVERSAL>

AVAILABLE PRIMITIVES & UNIVERSAL COMPONENTS:
${UNIVERSAL_COMPONENTS.map(c => `- ${c.id} : ${c.label}`).join('\n')}

PRIORITY 2: GENERATE ADVANCED DATA MODULE (SLATE)
If their request is to build a new feature, app, tracker, or dashboard that requires data fields and a module layout, you MUST generate a Slate JSON Blueprint wrapped in <SCHEMA>...</SCHEMA> tags.

The JSON inside <SCHEMA> powers our Slate Builder and MUST follow this strict structure:
{
  "module": {
    "name": "Employee Directory",
    "description": "Manage all company employees, roles, and contact info.",
    "icon": "Users", // Use a valid lucide-react icon name
    "layout": "table", // "table", "grid", "kanban", or "calendar"
    "theme": "primary", // "primary", "emerald", "rose", "amber", "indigo", "violet"
    "module_type": "data_module"
  },
  "fields": [
    {
      "name": "Full Name",
      "field_type": "text", // "text", "number", "email", "date", "boolean", "select", "currency", "richtext", "url"
      "is_required": true
    },
    {
      "name": "Role",
      "field_type": "select",
      "options": ["Admin", "Manager", "Employee"], // Only provided if field_type is "select"
      "is_required": true
    }
  ]
}

PRIORITY 3: GENERATE ADVANCED CUSTOM PAGE (SERVER DRIVEN UI)
If the user's request is for a highly custom visual dashboard, landing page, or complex layout that doesn't fit standard primitives or data tables, you MUST generate a Server-Driven UI Custom Page wrapped in <SCHEMA>...</SCHEMA> tags.

The JSON inside <SCHEMA> for custom pages MUST follow this structure:
{
  "type": "Page",
  "props": {
    "title": "Analytics Dashboard",
    "description": "Custom analytics layout",
    "icon": "Layout",
    "theme": "primary"
  },
  "children": [
    {
      "type": "Row",
      "children": [
        { "type": "StatCard", "props": { "title": "Total Users", "value": "12,450" } }
      ]
    }
  ]
}

CONTEXT AWARENESS:
If the user provides a "CURRENT_SCHEMA" context block, it means they are actively editing an existing Slate. You must analyze the CURRENT_SCHEMA and output a NEW modified <SCHEMA>...</SCHEMA> that reflects the user's requested edits (like adding new fields, changing layout, or updating the name).

CRITICAL RULE: DO NOT mention the JSON schema, the <SCHEMA> tags, the <UNIVERSAL> tags, or your underlying architecture in your conversational response to the user. This is an invisible background system. Just say "I have generated the system" and put the tags at the very end.
`;

// OrbitBuild AI Panel
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function OrbitBoltWorkspace({ onClose, onApplySchema, currentSchema }) {
 const { user} = useAuth();
 const companyId = useCompanyId();
 const navigate = useNavigate();
 
 const [sessions, setSessions] = useState([]);
 const [activeSession, setActiveSession] = useState(null);
 const [input, setInput] = useState('');
 const [isGenerating, setIsGenerating] = useState(false);
 const [showHistory, setShowHistory] = useState(false);
 const [originalInputBeforeVoice, setOriginalInputBeforeVoice] = useState('');

 const { isListening, hasSupport, toggleListening, stopListening } = useSpeechRecognition({
   onTranscript: (transcript) => {
     setInput(originalInputBeforeVoice + ' ' + transcript);
   }
 });

 const handleMicToggle = () => {
   if (!isListening) {
     setOriginalInputBeforeVoice(input.trim());
   }
   toggleListening();
 };
 
 const messagesEndRef = useRef(null);
 const inputRef = useRef(null);
 
 useEffect(() => {
   if (!isLoading && inputRef.current) {
     inputRef.current.focus();
   }
 }, [isLoading]);

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
 id: generateId(),
 title: 'New WorkSlate',
 createdAt: new Date().toISOString(),
 messages: [{ role: 'assistant', content: "Hi there! I'm Orbit Build, your AI System Architect. Tell me what kind of module, app, or dashboard you want to build, and I'll generate the architecture for you instantly."}],
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
 const updatedMsgs = [...(activeSession.messages || []), userMsg];
 
 let title = activeSession.title;
 if (title === 'New WorkSlate') title = text.slice(0, 30) + '...';
 
 let s = { ...activeSession, title, messages: updatedMsgs};
 setActiveSession(s);
 setSessions(prev => prev.map(p => p.id === s.id ? s : p));

 try {
 const aiMessages = [
 { role: 'system', content: SYSTEM_PROMPT},
 ...(currentSchema ? [{ role: 'system', content: `CURRENT_SCHEMA Context:\n${JSON.stringify(currentSchema, null, 2)}\n\nAnalyze this schema to understand the current layout. If the user asks for edits (e.g. changing colors, moving elements), output a NEW <SCHEMA>...</SCHEMA> based on this layout but with their requested modifications.` }] : []),
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
 if (!aiResponseMsg) aiResponseMsg = "I've generated the architecture.";
 
 if (onApplySchema) {
 onApplySchema(parsedSchema);
 appliedSuccessfully = true;
} else {
 // Store it in session storage if we need to navigate
 sessionStorage.setItem('orbitbolt_pending_schema', JSON.stringify(parsedSchema));
 navigate('/create/module');
}
} catch (e) {
 console.error("Failed to parse schema from AI:", e);
}
}
}

 if (appliedSuccessfully && aiResponseMsg === "I've generated the architecture.") {
 aiResponseMsg += " I have applied it to your builder instantly.";
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
 toast.error("Failed to generate module: " + err.message);
 const errorMsg = { role: 'assistant', content: "Sorry, I ran into an error building that. Please try rephrasing."};
 s = { ...s, messages: [...updatedMsgs, errorMsg]};
 setActiveSession(s);
 setSessions(prev => prev.map(p => p.id === s.id ? s : p));
} finally {
 setIsGenerating(false);
}
};

 const workspaceContent = (
 <>
 {/* Mobile Backdrop */}
 <div className="md:hidden fixed inset-0 z-[9998] bg-slate-900/50 backdrop-blur-[2px] transition-opacity" onClick={onClose} />
 
  <div className={`max-md:fixed z-[9999] bg-white dark:bg-[#0A0F1C] transition-all duration-300 overflow-hidden flex max-md:inset-x-0 max-md:bottom-0 max-md:h-[85vh] max-md:rounded-t-[32px] max-md:flex-col max-md:pb-[env(safe-area-inset-bottom)] md:relative md:h-full md:shrink-0 md:w-[420px] max-md:shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:max-md:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:border-l-2 md:border-l-primary/30 shadow-[-12px_0_40px_rgba(0,0,0,0.04)] dark:shadow-[-12px_0_40px_rgba(0,0,0,0.3)]`}>
 
 {/* Mobile Drag Handle */}
 <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0">
 <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
 </div>
 
 <div className="flex h-full w-full">
 {/* History Sidebar */}
 <AnimatePresence>
 {showHistory && (
 <motion.div 
 initial={{ width: 0, opacity: 0}}
 animate={{ width: 208, opacity: 1}}
 exit={{ width: 0, opacity: 0}}
 className="shrink-0 border-r border-primary/40 bg-muted/20 flex flex-col overflow-hidden"
 >
 <div className="px-3 py-2.5 border-b border-primary/40 flex items-center justify-between whitespace-nowrap">
 <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Workslates</span>
 <div className="flex items-center gap-2">
 <button onClick={startNewSession} className="p-1 hover:bg-muted rounded-md text-[#71717a] dark:text-gray-400 hover:text-primary transition-colors" title="New slate">
 <MessageSquarePlus className="w-3.5 h-3.5" />
 </button>
 <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-muted rounded-md text-[#71717a] dark:text-gray-400 transition-colors" title="Close history">
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
 "group relative flex items-start gap-2 p-2 rounded-xl cursor-pointer text-left transition-colors whitespace-nowrap",
 s.id === activeSession?.id
 ? 'bg-primary/10 dark:bg-primary/20 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 dark:border-primary/30 text-foreground'
 : 'hover:bg-muted/70 text-[#71717a] dark:text-gray-400'
 )}
 >
 <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
 <div className="flex-1 min-w-0 overflow-hidden">
 <p className="text-[11px] font-medium truncate leading-tight">{s.title}</p>
 <p className="text-[10px] opacity-70 mt-0.5">
 {new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
 </p>
 </div>
 <button
 onClick={e => deleteSession(s.id, e)}
 className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-500 transition-all shrink-0"
 >
 <Trash2 className="w-3 h-3" />
 </button>
 </div>
 ))}
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Main Panel */}
 <div className="flex-1 flex flex-col min-w-0 md:w-[420px]">
 {/* Header */}
 <div className="flex items-center justify-between px-5 py-4 shrink-0 bg-gradient-to-b from-slate-50/90 to-white/90 dark:from-[#111827]/90 dark:to-[#0A0F1C]/90 backdrop-blur-2xl border-b border-black/[0.06] dark:border-white/[0.06] relative z-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 shadow-sm border border-emerald-100 dark:border-emerald-500/20">
 <Zap className="w-4 h-4 fill-current" />
 </div>
 <div className="flex flex-col">
  <div className="flex items-center gap-2">
   <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 leading-none">Orbit Build</p>
   <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 font-bold uppercase tracking-wider">Builder</span>
  </div>
  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Your AI System Architect</p>
 </div>
 </div>
 <div className="flex items-center gap-1 shrink-0">
 <button
 onClick={() => setShowHistory(prev => !prev)}
 className={`p-2 rounded-full transition-all ${showHistory ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-600 dark:hover:text-slate-300'}`}
 title="Workslates History"
 >
 <Clock className="w-4 h-4" />
 </button>
 <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0">
 <X className="w-4 h-4" />
 </button>
 </div>
 </div>

 {/* Chat Area */}
 <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-primary bg-slate-50/50 dark:bg-transparent relative z-10">
 {activeSession?.messages?.map((m, i) => (
 <motion.div 
 initial={{ opacity: 0, y: 8}}
 animate={{ opacity: 1, y: 0}}
 transition={{ duration: 0.2}}
 key={i} 
 className={clsx("flex gap-3 max-w-full", m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
 >
 {m.role === 'assistant' && (
 <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 flex items-center justify-center">
 <Zap className="w-4 h-4 fill-current" />
 </div>
 )}
 <div className={clsx(
 "max-w-[85%] text-[13px] leading-relaxed shadow-sm",
 m.role === 'user'
 ? 'rounded-2xl rounded-tr-sm px-4 py-3 bg-primary text-primary-foreground'
 : 'rounded-2xl rounded-tl-sm px-4 py-3 bg-white dark:bg-[#131A2B] border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300 prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-pre:bg-slate-50 dark:prose-pre:bg-slate-900/50 prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-white/10 prose-pre:rounded-xl prose-code:text-emerald-600 dark:prose-code:text-emerald-400 prose-code:before:content-none prose-code:after:content-none'
 )}>
 <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
 </div>
 </motion.div>
 ))}
 {isGenerating && (
 <motion.div initial={{ opacity: 0}} animate={{ opacity: 1}} className="flex gap-3">
 <div className="shrink-0 w-7 h-7 rounded-lg bg-primary/10 text-primary/90 flex items-center justify-center ring-1 ring-primary/20 mt-0.5">
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
 <div className="p-4 bg-white/90 dark:bg-[#0A0F1C]/90 backdrop-blur-xl border-t border-slate-100 dark:border-white/5 shrink-0 relative z-10">
 <form onSubmit={handleSend}>
 <div className="relative rounded-2xl bg-slate-50 dark:bg-[#131A2B] border border-slate-200 dark:border-white/10 shadow-sm focus-within:shadow-md focus-within:border-emerald-500/50 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all duration-300 flex flex-col">
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
 placeholder="Describe the slate or app..."
 className="w-full bg-transparent border-none focus:ring-0 resize-none px-4 pt-4 pb-2 text-[13px] text-slate-800 dark:text-slate-200 outline-none leading-relaxed min-h-[56px] max-h-[200px] overflow-y-auto placeholder:text-slate-400 dark:placeholder:text-slate-500 scrollbar-thin"
 disabled={isGenerating}
 />
 <div className="flex items-center justify-between px-3 pb-3">
   <div className="flex items-center gap-0.5"></div>
   <div className="flex items-center gap-2">
     {hasSupport && (
       <Button
         type="button"
         size="icon"
         onClick={handleMicToggle}
         className={clsx(
           "h-8 w-8 rounded-xl transition-transform active:scale-95",
           isListening ? "bg-red-500/10 hover:bg-red-600 text-white animate-pulse" : "bg-muted text-[#71717a] dark:text-gray-400 hover:text-foreground"
         )}
         title="Voice Dictation"
       >
         {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
       </Button>
     )}
     <button
       type="submit"
       disabled={!input.trim() || isGenerating}
       className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-all shadow-sm hover:shadow-md hover:shadow-emerald-500/20"
     >
       <Send className="w-4 h-4 ml-0.5" />
     </button>
   </div>
 </div>
 </div>
 </form>
 </div>

 </div>
 </div>
 </div>
 </>
 );

 return createPortal(workspaceContent, document.getElementById('right-docked-panel-portal') || document.body);
}

