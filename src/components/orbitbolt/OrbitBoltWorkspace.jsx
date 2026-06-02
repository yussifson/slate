import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Sparkles, Send, X, CheckCircle, RefreshCw, Layers, History, Code, Terminal, Maximize2, Zap, MoreHorizontal, MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import clsx from 'clsx';

// The IDE-like Workspace for building modules
export default function OrbitBoltWorkspace({ onClose }) {
  const { user } = useAuth();
  const companyId = useCompanyId();
  
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewSchema, setPreviewSchema] = useState(null);
  const [activeTab, setActiveTab] = useState('preview'); // preview, schema
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Load sessions
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

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isGenerating]);

  const startNewSession = () => {
    const s = {
      id: crypto.randomUUID(),
      title: 'New Workspace',
      createdAt: new Date().toISOString(),
      messages: [{ role: 'assistant', content: "Hi there! I'm OrbitBolt, your AI System Architect. Tell me what kind of module, app, or dashboard you want to build, and I'll generate the architecture for you instantly." }],
      latest_schema: null
    };
    setSessions(prev => [s, ...prev]);
    setActiveSession(s);
    setPreviewSchema(null);
    saveSession(s);
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
    if (title === 'New Workspace') title = text.slice(0, 30) + '...';
    
    let s = { ...activeSession, title, messages: updatedMsgs };
    setActiveSession(s);
    setSessions(prev => prev.map(p => p.id === s.id ? s : p));

    try {
      // Simulating AI thinking delay
      setTimeout(() => {
        const mockSchema = {
          title: "AI Generated " + (text.split(' ')[0] || 'Module'),
          components: [
            { id: "1", type: "header", text: "Interactive " + text },
            { id: "2", type: "kanban", columns: ["Backlog", "In Progress", "Review", "Done"] },
            { id: "3", type: "custom_sandbox", code: "// Secure sandbox code pending" }
          ]
        };
        const assistantMsg = { 
          role: 'assistant', 
          content: "I've drafted the initial architecture for your request. You can see the live preview on the right. \n\nIf you want to add more features like file uploads or charts, just tell me. Otherwise, you can hit **Approve & Publish** to deploy this to your workspace." 
        };
        
        s = { ...s, messages: [...updatedMsgs, assistantMsg], latest_schema: mockSchema };
        setActiveSession(s);
        setPreviewSchema(mockSchema);
        setSessions(prev => prev.map(p => p.id === s.id ? s : p));
        saveSession(s);
        setIsGenerating(false);
      }, 2500);
      
    } catch (err) {
      toast.error("Failed to generate module: " + err.message);
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!previewSchema) return;
    try {
      await supabase.from('industry_records').upsert({
        id: crypto.randomUUID(),
        company_id: companyId,
        industry: 'core',
        record_type: 'custom_module_definition',
        search_text: (previewSchema.title || 'custom module').toLowerCase(),
        data: previewSchema
      });
      toast.success("Module Published Successfully!");
      onClose();
    } catch (err) {
      toast.error("Failed to publish");
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-[100] flex flex-col font-sans">
      {/* Sleek Header */}
      <div className="h-14 border-b border-border/50 bg-background/50 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-foreground leading-tight">OrbitBolt <span className="text-muted-foreground font-medium text-xs ml-1">System Architect</span></h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {previewSchema && (
            <Button size="sm" onClick={handleApprove} className="h-9 px-4 bg-foreground text-background hover:bg-foreground/90 rounded-full font-semibold shadow-sm transition-all gap-2">
              <CheckCircle className="w-4 h-4" /> Deploy to Workspace
            </Button>
          )}
          <div className="w-px h-6 bg-border mx-1" />
          <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted"><X className="w-5 h-5" /></Button>
        </div>
      </div>

      {/* Main Workspace (Split Pane) */}
      <PanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        {/* Left Panel: Chat & History */}
        <Panel defaultSize={30} minSize={25} maxSize={45} className="flex flex-col bg-background relative border-r border-border/50 shadow-[10px_0_30px_-15px_rgba(0,0,0,0.1)] z-10">
          
          {/* Header Actions for Chat */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 shrink-0">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conversation</h2>
            <Button variant="ghost" size="sm" onClick={startNewSession} className="h-7 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50">
              <MessageSquarePlus className="w-3.5 h-3.5 mr-1.5" /> New Chat
            </Button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 scrollbar-thin scrollbar-thumb-muted">
            {activeSession?.messages.map((m, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={i} 
                className={clsx("flex gap-3", m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
              >
                {/* Avatar */}
                <div className={clsx("shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm", m.role === 'user' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white')}>
                  {m.role === 'user' ? <span className="text-xs font-bold">U</span> : <Sparkles className="w-4 h-4" />}
                </div>
                
                {/* Message bubble */}
                <div className={clsx(
                  "max-w-[85%] rounded-2xl p-4 text-[15px] leading-relaxed shadow-sm", 
                  m.role === 'user' 
                    ? 'bg-foreground text-background rounded-tr-sm' 
                    : 'bg-card border border-border/50 text-foreground rounded-tl-sm prose dark:prose-invert prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border'
                )}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
              </motion.div>
            ))}
            
            {isGenerating && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm p-4 text-[15px] flex items-center gap-3 text-muted-foreground shadow-sm">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" /> 
                  <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent font-medium">Architecting module...</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} className="h-2" />
          </div>

          {/* Premium Input Area */}
          <div className="p-4 bg-background border-t border-border/50 shrink-0">
            <form onSubmit={handleSend} className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity duration-300" />
              <div className="relative bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden flex flex-col focus-within:ring-1 focus-within:ring-indigo-500/50 transition-shadow">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder="Describe the module you want to build (e.g. 'Build a CRM with a Kanban board...')"
                  className="w-full bg-transparent border-none resize-none px-4 py-4 text-[15px] placeholder:text-muted-foreground/70 focus:outline-none min-h-[90px] max-h-[200px] scrollbar-thin"
                  disabled={isGenerating}
                />
                <div className="flex items-center justify-between px-3 pb-3">
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground rounded-full hover:bg-muted"><Terminal className="w-4 h-4" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground rounded-full hover:bg-muted"><Layers className="w-4 h-4" /></Button>
                  </div>
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={!input.trim() || isGenerating}
                    className="h-9 w-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-md disabled:opacity-50 transition-transform active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </form>
            <div className="text-center mt-3 text-[11px] text-muted-foreground">
              OrbitBolt AI can make mistakes. Review the preview before deploying.
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-border/40 hover:bg-indigo-500/50 transition-colors cursor-col-resize active:bg-indigo-500" />

        {/* Right Panel: Live Preview & Editor */}
        <Panel defaultSize={70} className="flex flex-col bg-muted/20 dark:bg-[#0a0a0a] relative">
          
          {/* Top Pill Tabs */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex p-1 bg-background/80 backdrop-blur-md border border-border/50 rounded-full shadow-sm">
            <button 
              onClick={() => setActiveTab('preview')}
              className={clsx("px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all", activeTab === 'preview' ? 'bg-foreground text-background shadow-md' : 'text-muted-foreground hover:text-foreground')}
            >
              <Maximize2 className="w-3.5 h-3.5" /> Preview
            </button>
            <button 
              onClick={() => setActiveTab('schema')}
              className={clsx("px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all", activeTab === 'schema' ? 'bg-foreground text-background shadow-md' : 'text-muted-foreground hover:text-foreground')}
            >
              <Code className="w-3.5 h-3.5" /> Schema
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center">
            {previewSchema ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-5xl h-full max-h-[800px] flex flex-col bg-background rounded-xl border border-border/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden"
              >
                {/* Mac-like Browser Header */}
                <div className="h-12 bg-muted/40 border-b border-border/50 flex items-center px-4 shrink-0">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                  </div>
                  <div className="mx-auto bg-background border border-border/50 px-3 py-1 rounded-md text-[11px] font-mono text-muted-foreground flex items-center gap-2 shadow-sm">
                    <Zap className="w-3 h-3 text-indigo-400" /> orbitbolt.local/{previewSchema.title.replace(/\s+/g, '-').toLowerCase()}
                  </div>
                  <div className="w-10 flex justify-end">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                
                {/* Preview Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-900/50">
                  {activeTab === 'preview' ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 border-b border-border/40 pb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex items-center justify-center">
                          <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-foreground">{previewSchema.title}</h2>
                          <p className="text-muted-foreground text-sm">Dynamic module preview generated by OrbitBolt.</p>
                        </div>
                      </div>
                      
                      <div className="grid gap-6">
                        {previewSchema.components?.map(c => (
                          <div key={c.id} className="p-6 border border-border/50 rounded-xl bg-card shadow-sm hover:border-indigo-500/30 transition-colors relative overflow-hidden group">
                            <div className="absolute top-0 right-0 px-3 py-1 bg-muted/50 border-b border-l border-border/50 rounded-bl-lg text-[10px] font-mono text-muted-foreground uppercase tracking-wider group-hover:bg-indigo-500/10 group-hover:text-indigo-600 transition-colors">
                              {c.type}
                            </div>
                            
                            {c.type === 'kanban' && (
                              <div className="flex gap-4 mt-2">
                                {c.columns.map(col => (
                                  <div key={col} className="flex-1 min-h-[120px] bg-muted/30 border border-border/50 rounded-lg p-3">
                                    <div className="text-xs font-semibold text-foreground mb-3">{col}</div>
                                    <div className="h-16 rounded bg-background border border-border/40 mb-2 shadow-sm" />
                                    <div className="h-16 rounded bg-background border border-border/40 shadow-sm opacity-50" />
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {c.type === 'header' && (
                              <h3 className="font-semibold text-lg">{c.text}</h3>
                            )}
                            
                            {c.type === 'custom_sandbox' && (
                              <div className="h-32 border border-dashed border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg flex flex-col items-center justify-center text-indigo-600 dark:text-indigo-400 mt-2">
                                <Terminal className="w-6 h-6 mb-2 opacity-70" />
                                <span className="text-sm font-medium">AI Custom Sandbox Block</span>
                                <span className="text-xs opacity-70 mt-1">Live rendering of React code happens here</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-foreground">Generated JSON Schema</h3>
                        <Button variant="outline" size="sm" className="h-7 text-xs">Copy Schema</Button>
                      </div>
                      <pre className="p-6 rounded-xl bg-slate-950 text-slate-50 text-sm font-mono overflow-auto border border-border h-[calc(100%-40px)] shadow-inner">
                        <code>{JSON.stringify(previewSchema, null, 2)}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground/60 max-w-md text-center">
                <div className="w-20 h-20 rounded-3xl bg-muted/50 border border-border/50 flex items-center justify-center mb-6 shadow-sm">
                  <Layers className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Blank Canvas</h3>
                <p className="text-[15px] leading-relaxed">
                  Describe what you want to build in the chat panel. OrbitBolt will architect the database, UI, and workflows instantly.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-2">
                  <span className="px-3 py-1.5 rounded-full bg-muted border border-border/50 text-xs">Try: "Build a CRM"</span>
                  <span className="px-3 py-1.5 rounded-full bg-muted border border-border/50 text-xs">Try: "Project Management Board"</span>
                </div>
              </div>
            )}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
