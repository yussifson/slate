import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Sparkles, Send, X, CheckCircle, RefreshCw, Layers, Terminal, MessageSquarePlus, Search, Home, FolderDot, LayoutTemplate, Star, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'react-hot-toast';
import { generateText } from '@/lib/cloudflareAI';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import PageRenderer from '@/components/pages/PageRenderer';

const generateDummyData = (fields) => {
  if (!fields) return [];
  const records = [];
  for (let i = 0; i < 5; i++) {
    const data = {};
    fields.forEach(f => {
      const name = f.name.trim().replace(/ /g, '_').toLowerCase();
      if (!name) return;
      if (f.field_type === 'text') data[name] = `Sample ${f.name} ${i + 1}`;
      else if (f.field_type === 'number') data[name] = Math.floor(Math.random() * 1000);
      else if (f.field_type === 'date') data[name] = new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0];
      else if (f.field_type === 'boolean' || f.field_type === 'checkbox') data[name] = Math.random() > 0.5;
      else if (f.field_type === 'select') {
        const opts = f.options ? f.options.split(',').map(o => o.trim()).filter(Boolean) : [];
        data[name] = opts.length > 0 ? opts[Math.floor(Math.random() * opts.length)] : 'Option 1';
      } else {
        data[name] = `Data ${i + 1}`;
      }
    });
    records.push({ id: `dummy-${i}`, data, created_at: new Date().toISOString() });
  }
  return records;
};

const SYSTEM_PROMPT = `You are OrbitBolt, an AI System Architect for Slate. 
You can converse naturally with the user, answer questions, and help them refine their ideas.

CRITICAL: If the user is just saying "Hi", asking a question, or chatting normally WITHOUT asking you to build, create, or update a page/dashboard, you MUST NOT output a <SCHEMA> tag. Just reply conversationally.

When the user asks you to build, create, or update a page, dashboard, or layout, you MUST output a valid JSON schema wrapped EXACTLY in <SCHEMA>...</SCHEMA> tags.
CRITICAL RULE: DO NOT mention the JSON schema, the <SCHEMA> tags, or your underlying architecture in your conversational response to the user. This is an invisible background system. Just say "I have generated the page" and put the tags at the very end.

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
      "styleConfig": { "colSpan": 4, "theme": "light", "padding": "p-6" }
    }
  ]
}

Available components:
- MetricCard: Needs table, aggregation (count/sum), label, icon (Users, Activity, DollarSign, Calendar, FileText). Best colSpan is 4.
- DataTable: Needs table, columns array [{field, label}]. Best colSpan is 12.

If the user asks to refine an existing page, modify the previous JSON schema and output the NEW updated schema inside the <SCHEMA> tags.`;

// The IDE-like WorkSlate for building modules - Vercel v0 Dark Aesthetic
export default function OrbitBoltPagesWorkspace({ onClose, onApplySchema }) {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const navigate = useNavigate();
  
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewSchema, setPreviewSchema] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const messagesEndRef = useRef(null);
  const sidebarPanelRef = useRef(null);
  const chatPanelRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('industry_records')
        .select('*')
        .eq('company_id', companyId)
        .eq('record_type', 'orbitbolt_session')
        .order('created_at', { ascending: false });
        
      if (data && data.length > 0) {
        const parsed = data.map(d => d.data);
        setSessions(parsed);
        setActiveSession(parsed[0]);
        if (parsed[0].latest_schema) setPreviewSchema(parsed[0].latest_schema);
      } else {
        startNewSession();
      }
    };
    load();
  }, [companyId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isGenerating]);

  const startNewSession = () => {
    const s = {
      id: crypto.randomUUID(),
      title: 'New WorkSlate',
      createdAt: new Date().toISOString(),
      messages: [{ role: 'assistant', content: "Hi there! I'm OrbitBolt, your AI Page Architect. Tell me what kind of page, dashboard, or layout you want to build, and I'll assemble the React components for you instantly." }],
      latest_schema: null
    };
    setSessions(prev => [s, ...prev]);
    setActiveSession(s);
    setPreviewSchema(null);
    saveSession(s);
  };

  const switchSession = (s) => {
    setActiveSession(s);
    setPreviewSchema(s.latest_schema || null);
  };

  const saveSession = async (s) => {
    if (!companyId) return;
    await supabase.from('industry_records').upsert({
      id: s.id,
      company_id: companyId,
      industry: 'core',
      record_type: 'orbitbolt_session',
      search_text: s.title.toLowerCase(),
      data: s
    });
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || !activeSession) return;
    
    const text = input.trim();
    setInput('');
    setIsGenerating(true);

    const userMsg = { role: 'user', content: text };
    const updatedMsgs = [...activeSession.messages, userMsg];
    
    let title = activeSession.title;
    if (title === 'New WorkSlate') title = text.slice(0, 30) + '...';
    
    let s = { ...activeSession, title, messages: updatedMsgs };
    setActiveSession(s);
    setSessions(prev => prev.map(p => p.id === s.id ? s : p));

    try {
      const aiMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...updatedMsgs.map(m => {
          if (m.role === 'assistant') {
            return { role: 'assistant', content: m.raw_json ? JSON.stringify(m.raw_json) : m.content };
          }
          return { role: 'user', content: m.content };
        })
      ];

      const responseText = await generateText(aiMessages);
      
      let parsedSchema = null;
      let aiResponseMsg = responseText;

      // Extract JSON if it's wrapped in <SCHEMA>...</SCHEMA> (or typo variants like missing slashes)
      const schemaMatch = responseText.match(/<S?CHEMA>([\s\S]*?)(?:<\/S?CHEMA>|<S?CHEMA>|$)/i);
      
      if (schemaMatch && schemaMatch[1]) {
        try {
          parsedSchema = JSON.parse(schemaMatch[1].trim());
          // Remove the schema completely from the user-facing message
          aiResponseMsg = responseText.replace(/<S?CHEMA>[\s\S]*?(?:<\/S?CHEMA>|<S?CHEMA>|$)/ig, '').trim();
          if (!aiResponseMsg) aiResponseMsg = "I've updated the architecture.";
        } catch (e) {
          console.error("Failed to parse schema from AI:", e);
        }
      }

      const assistantMsg = { 
        role: 'assistant', 
        content: aiResponseMsg,
        raw_json: parsedSchema || previewSchema // keep previous if no new schema
      };
      
      s = { ...s, messages: [...updatedMsgs, assistantMsg] };
      if (parsedSchema) {
        s.latest_schema = parsedSchema;
        setPreviewSchema(parsedSchema);
      }
      
      setActiveSession(s);
      setSessions(prev => prev.map(p => p.id === s.id ? s : p));
      saveSession(s);
      
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate module: " + err.message);
      const errorMsg = { role: 'assistant', content: "Sorry, I ran into an error building that. Please try rephrasing." };
      s = { ...s, messages: [...updatedMsgs, errorMsg] };
      setActiveSession(s);
      setSessions(prev => prev.map(p => p.id === s.id ? s : p));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = () => {
    if (!previewSchema) return;
    
    // Pass the schema back to CreateModulePage if it was opened from there
    if (onApplySchema) {
      onApplySchema(previewSchema);
      onClose();
    } else {
      // If opened from somewhere else, store it in sessionStorage and navigate to builder
      sessionStorage.setItem('orbitbolt_pending_schema', JSON.stringify(previewSchema));
      onClose();
      navigate('/create/module');
    }
  };

  const workspaceContent = (
    <div className="fixed inset-0 z-[9999] flex flex-col font-sans text-foreground bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(221,83%,53%,0.12),transparent)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.15] dark:opacity-[0.35] bg-[linear-gradient(to_right,hsl(var(--muted-foreground)/0.2)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted-foreground)/0.2)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative h-12 border-b border-border bg-card/95 backdrop-blur-xl flex items-center justify-between px-4 shrink-0 z-[1001]">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => {
            if (isSidebarOpen) {
              sidebarPanelRef.current?.collapse();
            } else {
              sidebarPanelRef.current?.expand();
            }
          }} className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h7"/></svg>
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 text-primary ring-1 ring-primary/25 shadow-[0_0_20px_hsl(221,83%,53%,0.15)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-semibold text-sm tracking-tight text-foreground leading-none">OrbitBolt</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">System Architect</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {previewSchema && (
            <Button size="sm" onClick={handleApprove} className="h-8 px-4 rounded-lg font-medium text-xs shadow-[0_0_24px_hsl(221,83%,53%,0.25)]">
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Apply to Builder
            </Button>
          )}
          <div className="w-px h-5 bg-border mx-1 hidden sm:block" />
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg gap-1.5 text-xs">
            <X className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Exit</span>
          </Button>
        </div>
      </div>

      <PanelGroup direction="horizontal" className="relative flex-1 overflow-hidden">
        <Panel 
          ref={sidebarPanelRef}
          defaultSize={18} 
          minSize={15} 
          maxSize={25} 
          collapsible={true}
          collapsedSize={0}
          onCollapse={() => setIsSidebarOpen(false)}
          onExpand={() => setIsSidebarOpen(true)}
          className="flex flex-col bg-card border-r border-border z-20"
        >
          <div className="p-3 border-b border-border">
            <Button onClick={startNewSession} className="w-full justify-start h-9 rounded-lg text-xs font-medium gap-2 shadow-sm">
              <MessageSquarePlus className="w-4 h-4 opacity-90" /> New workslate
            </Button>
          </div>
          <div className="px-3 py-3 border-b border-border">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Search workslates…" className="w-full h-8 bg-muted border border-border rounded-lg pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/30 text-foreground placeholder:text-muted-foreground transition-shadow" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
            <div className="px-3 mb-2">
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">WorkSlates</h3>
            </div>
            <div className="space-y-0.5 px-2">
              {sessions.map(s => (
                <button 
                  key={s.id}
                  onClick={() => switchSession(s)}
                  className={clsx(
                    "w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center gap-2.5 transition-all",
                    activeSession?.id === s.id
                      ? "bg-primary/15 text-primary font-medium ring-1 ring-primary/20 shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  <span className="truncate">{s.title}</span>
                </button>
              ))}
            </div>
          </div>
        </Panel>
        <PanelResizeHandle className="w-px bg-border hover:bg-primary/40 transition-colors cursor-col-resize data-[resize-handle-active]:bg-primary/60" />

        <Panel 
          ref={chatPanelRef}
          defaultSize={35} 
          minSize={25} 
          maxSize={50} 
          collapsible={true}
          collapsedSize={0}
          className="flex flex-col bg-background relative border-r border-border z-10"
        >
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-6 space-y-5 scrollbar-thin">
            {activeSession?.messages.map((m, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                key={i} 
                className={clsx("flex gap-3", m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
              >
                {m.role === 'assistant' && (
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-primary/25 to-primary/5 text-primary flex items-center justify-center ring-1 ring-primary/20 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
                <div className={clsx(
                  "max-w-[88%] text-[13.5px] leading-relaxed",
                  m.role === 'user'
                    ? 'rounded-2xl rounded-tr-md px-4 py-3 bg-primary text-primary-foreground shadow-lg shadow-primary/10'
                    : 'rounded-2xl rounded-tl-md px-4 py-3 bg-muted ring-1 ring-border text-foreground prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-pre:bg-card prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-code:text-primary prose-code:before:content-none prose-code:after:content-none'
                )}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
              </motion.div>
            ))}
            {isGenerating && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center ring-1 ring-primary/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl rounded-tl-md bg-muted ring-1 ring-border text-sm text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                  <span>Architecting your slate…</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} className="h-2" />
          </div>

          <div className="p-4 shrink-0 border-t border-border bg-card/80 backdrop-blur-xl">
            <form onSubmit={handleSend} className="relative max-w-2xl mx-auto">
              <div className="relative rounded-2xl overflow-hidden flex flex-col bg-background ring-1 ring-border focus-within:ring-2 focus-within:ring-primary/40 transition-all shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder="Describe the slate, dashboard, or workflow to build…"
                  className="w-full bg-transparent border-none resize-none px-4 pt-4 pb-2 text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[100px] max-h-[220px] scrollbar-thin"
                  disabled={isGenerating}
                />
                <div className="flex items-center justify-between px-3 pb-3 pt-1">
                  <span className="text-[10px] text-muted-foreground font-medium px-1">Enter to send · Shift+Enter for newline</span>
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={!input.trim() || isGenerating}
                    className="h-9 w-9 rounded-xl disabled:opacity-40 transition-transform active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </Panel>

        <PanelResizeHandle className="w-px bg-border hover:bg-primary/40 transition-colors cursor-col-resize data-[resize-handle-active]:bg-primary/60" />

        <Panel defaultSize={47} className="flex flex-col bg-muted/30 relative p-4 md:p-5">
          <div className="flex-1 rounded-xl border border-border overflow-hidden bg-card flex flex-col shadow-2xl shadow-black/10 ring-1 ring-border relative">
            {previewSchema ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col h-full"
              >
                <div className="h-11 bg-muted/50 border-b border-border flex items-center px-4 shrink-0 gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-primary/80" />
                  </div>
                  <div className="flex-1 max-w-md mx-auto h-7 rounded-md bg-background/50 border border-border flex items-center justify-center px-3">
                    <span className="text-[11px] text-muted-foreground truncate font-medium">
                      {previewSchema.pageTitle ? `preview · ${previewSchema.pageTitle}` : 'Live preview'}
                    </span>
                  </div>
                  <LayoutTemplate className="w-4 h-4 text-muted-foreground opacity-50" />
                </div>
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
                  <div className="max-w-6xl mx-auto h-full">
                    
                    <React.Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse">Loading preview...</div>}>
                            <PageRenderer schema={previewSchema} />
                    </React.Suspense>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full w-full relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(221,83%,53%,0.08),transparent_65%)]" />
                <div className="relative z-10 flex flex-col items-center justify-center text-center p-8 max-w-lg w-full">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mb-6 shadow-[0_0_48px_hsl(221,83%,53%,0.2)]">
                    <Layers className="w-9 h-9 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-2 tracking-tight">
                    Live preview appears here
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                    Describe what you want in the chat. OrbitBolt architects schema, fields, and layout—then renders a working preview instantly.
                  </p>
                  <div className="mt-8 flex flex-wrap justify-center gap-2">
                    {['Build a CRM pipeline', 'HR onboarding workflow', 'Inventory dashboard'].map((hint) => (
                      <span key={hint} className="px-3 py-1.5 rounded-lg bg-muted border border-border text-xs text-muted-foreground font-medium">
                        {hint}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );

  return createPortal(workspaceContent, document.body);
}
