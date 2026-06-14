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

const SYSTEM_PROMPT = `You are OrbitBuild, an elite AI System Architect for Workslate.
You converse naturally with the user to help them build any feature, app, or system they need.

CRITICAL: If the user is just saying "Hi" or chatting normally WITHOUT asking to build/create a system, you MUST NOT output special tags. Just reply conversationally.

When asked to build or create, you are a UNIFIED agent that can choose the best architectural approach based on the user's prompt priority:

PRIORITY 1: ASSEMBLE UNIVERSAL PRIMITIVES (Best for standard data management)
If the user's request maps to standard business management (e.g. Employee Tracker, Inventory System), output EXACTLY this tag format at the very end of your response to assemble a standard module:
<UNIVERSAL>{"component_id": "UnivDataGrid", "name": "Employee List"}</UNIVERSAL>

AVAILABLE PRIMITIVES & UNIVERSAL COMPONENTS:
${UNIVERSAL_COMPONENTS.map(c => `- ${c.id} : ${c.label}`).join('\n')}

PRIORITY 2: GENERATE ADVANCED CUSTOM UI (SERVER-DRIVEN UI)
If their request is a highly bespoke visual dashboard, a unique app layout, or a custom view that doesn't fit standard primitives, you MUST generate an Advanced JSON Blueprint wrapped in <SCHEMA>...</SCHEMA> tags.

The JSON inside <SCHEMA> powers our DynamicRenderer and MUST follow this strict hierarchical Server-Driven UI structure:
{
 "type": "Page",
 "layout": "Dashboard", // or "Grid", "FlexCol"
 "children": [
   {
     "type": "StatCard",
     "props": { "title": "Total Revenue", "value": "$50,000", "icon": "DollarSign", "color": "emerald" }
   },
   {
     "type": "Chart",
     "props": { "title": "Sales", "chartType": "Line", "data": [{"name": "Jan", "value": 400}, {"name": "Feb", "value": 300}] }
   },
   {
     "type": "Table",
     "props": { "title": "Recent Orders", "columns": ["ID", "Customer", "Amount"], "data": [{"ID": "1", "Customer": "John", "Amount": "$50"}] }
   }
 ]
}

Available Component Types for Schema: Page, Container, StatCard, Chart, Form, Input, Table.

CONTEXT AWARENESS:
If the user provides a "CURRENT_SCHEMA" context block, it means they are actively editing an existing Slate or Page. You must analyze the CURRENT_SCHEMA and output a NEW modified <SCHEMA>...</SCHEMA> that reflects the user's requested edits (like changing colors, moving elements, adding new fields).

CRITICAL RULE: DO NOT mention the JSON schema, the <SCHEMA> tags, the <UNIVERSAL> tags, or your underlying architecture in your conversational response to the user. This is an invisible background system. Just say "I have generated the system" and put the tags at the very end.
`;

// OrbitBuild AI Panel
export default function OrbitBoltWorkspace({ onClose, onApplySchema, currentSchema }) {
 const { user} = useAuth();
 const companyId = useCompanyId();
 const navigate = useNavigate();
 
 const [sessions, setSessions] = useState([]);
 const [activeSession, setActiveSession] = useState(null);
 const [input, setInput] = useState('');
 const [isGenerating, setIsGenerating] = useState(false);
 const [showHistory, setShowHistory] = useState(false);
 
 const messagesEndRef = useRef(null);

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
 messages: [{ role: 'assistant', content: "Hi there! I'm OrbitBolt, your AI System Architect. Tell me what kind of module, app, or dashboard you want to build, and I'll generate the architecture for you instantly."}],
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
 const _p = {
 id: s.id,
 company_id: companyId,
 industry: 'core',
 record_type: 'orbitbolt_session',
 search_text: s.title.toLowerCase(),
 data: s
};
 const _k = Object.keys(_p);
 const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 await powerSync.execute(`INSERT INTO industry_records (${_k.join(', ')}) VALUES (${_k.map(()=>'?').join(', ')}) ON CONFLICT(id) DO UPDATE SET ${_k.map(k=>k+' = excluded.'+k).join(', ')}`, _v);
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
 
 <div className={`fixed z-[9999] bg-card transition-all duration-300 overflow-hidden flex max-md:inset-x-0 max-md:bottom-0 max-md:h-[85vh] max-md:rounded-t-[32px] max-md: max-md:flex-col max-md:pb-[env(safe-area-inset-bottom)] md:top-0 md:right-0 md:bottom-0 md:h-full md:shrink-0 md:border-l-[3px] md:border-l-primary md:w-[400px]`}>
 
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
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Workslates</span>
 <div className="flex items-center gap-1">
 <button onClick={startNewSession} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary transition-colors" title="New slate">
 <MessageSquarePlus className="w-3.5 h-3.5" />
 </button>
 <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-muted rounded text-muted-foreground transition-colors" title="Close history">
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
 {sessions.map(s => (
 <div
 key={s.id}
 onClick={() => switchSession(s)}
 className={clsx(
 "group relative flex items-start gap-2 p-2 rounded-lg cursor-pointer text-left transition-colors whitespace-nowrap",
 s.id === activeSession?.id
 ? 'bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 text-foreground'
 : 'hover:bg-muted/70 text-muted-foreground'
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
 <div className="flex-1 flex flex-col min-w-0 w-[400px]">
 {/* Header */}
 <div className="flex items-center gap-2 px-3 py-2.5 border-b border-primary/40 bg-gradient-to-r from-primary/10 to-primary/5 shrink-0">
 <button
 onClick={() => setShowHistory(prev => !prev)}
 className={clsx(
 "p-1.5 rounded-md transition-colors shrink-0",
 showHistory ? 'bg-primary/20 dark:bg-primary/30 text-primary/90 dark:text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
 )}
 title="Workslates History"
 >
 <Clock className="w-4 h-4" />
 </button>
 
 <div className="flex-1 flex items-center gap-2 justify-center">
 <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary/80 to-primary/90 flex items-center justify-center text-white ring-1 ring-primary/20">
 <Zap className="w-3.5 h-3.5 fill-white" />
 </div>
 <span className="font-semibold text-sm tracking-tight text-foreground">OrbitBolt</span>
 </div>

 <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0">
 <X className="w-4 h-4" />
 </button>
 </div>

 {/* Chat Area */}
 <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin bg-card/50">
 {activeSession?.messages?.map((m, i) => (
 <motion.div 
 initial={{ opacity: 0, y: 8}}
 animate={{ opacity: 1, y: 0}}
 transition={{ duration: 0.2}}
 key={i} 
 className={clsx("flex gap-3", m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
 >
 {m.role === 'assistant' && (
 <div className="shrink-0 w-7 h-7 rounded-md bg-gradient-to-br from-primary/20 to-primary/5 text-primary/90 dark:text-primary/80 flex items-center justify-center ring-1 ring-primary/20 mt-0.5">
 <Zap className="w-3.5 h-3.5 fill-current" />
 </div>
 )}
 <div className={clsx(
 "max-w-[88%] text-[13px] leading-relaxed",
 m.role === 'user'
 ? 'rounded-2xl rounded-tr-sm px-4 py-2.5 bg-primary text-white '
 : 'rounded-2xl rounded-tl-sm px-4 py-3 bg-muted ring-1 ring-border/50 text-foreground prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-pre:bg-card prose-pre:border prose-pre:border-primary/40 prose-pre:rounded-lg prose-code:text-primary/90 dark:prose-code:text-primary/80 prose-code:before:content-none prose-code:after:content-none'
 )}>
 <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
 </div>
 </motion.div>
 ))}
 {isGenerating && (
 <motion.div initial={{ opacity: 0}} animate={{ opacity: 1}} className="flex gap-3">
 <div className="shrink-0 w-7 h-7 rounded-md bg-primary/10 text-primary/90 flex items-center justify-center ring-1 ring-primary/20 mt-0.5">
 <Zap className="w-3.5 h-3.5 fill-current" />
 </div>
 <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl rounded-tl-sm bg-muted ring-1 ring-border/50 text-xs text-muted-foreground">
 <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
 <span>Architecting...</span>
 </div>
 </motion.div>
 )}
 <div ref={messagesEndRef} className="h-2" />
 </div>

 {/* Input Area */}
 <div className="p-3 shrink-0 border-t border-primary/40 bg-card">
 <form onSubmit={handleSend}>
 <div className="relative rounded-xl overflow-hidden flex flex-col bg-background ring-1 ring-border focus-within:ring-2 focus-within:ring-primary/50 transition-all ">
 <textarea
 value={input}
 onChange={e => setInput(e.target.value)}
 onKeyDown={e => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault();
 handleSend(e);
}
}}
 placeholder="Describe the slate or app..."
 className="w-full bg-transparent border-none resize-none px-3 pt-3 pb-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[80px] max-h-[150px] scrollbar-thin"
 disabled={isGenerating}
 />
 <div className="flex items-center justify-between px-2 pb-2 pt-1">
 <span className="text-[10px] text-muted-foreground font-medium px-1">Enter to send</span>
 <Button 
 type="submit" 
 size="icon"
 disabled={!input.trim() || isGenerating}
 className="h-8 w-8 rounded-lg bg-primary hover:bg-primary/90 text-white disabled:opacity-40 transition-transform active:scale-95"
 >
 <Send className="w-3.5 h-3.5" />
 </Button>
 </div>
 </div>
 </form>
 </div>

 </div>
 </div>
 </div>
 </>
 );

 return createPortal(workspaceContent, document.body);
}
