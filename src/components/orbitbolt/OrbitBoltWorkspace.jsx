import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Sparkles, Send, X, CheckCircle, RefreshCw, Layers, History, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'react-hot-toast';
import { generateText } from '@/lib/cloudflareAI';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// The IDE-like Workspace for building modules
export default function OrbitBoltWorkspace({ onClose }) {
  const { user } = useAuth();
  const companyId = useCompanyId();
  
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewSchema, setPreviewSchema] = useState(null);
  
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

  const startNewSession = () => {
    const s = {
      id: crypto.randomUUID(),
      title: 'New Workspace',
      createdAt: new Date().toISOString(),
      messages: [{ role: 'assistant', content: "Hello! I am OrbitBolt. Describe the module or page you want to build, and I will architect it for you." }],
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
    if (title === 'New Workspace') title = text.slice(0, 40) + '...';
    
    let s = { ...activeSession, title, messages: updatedMsgs };
    setActiveSession(s);
    setSessions(prev => prev.map(p => p.id === s.id ? s : p));

    try {
      // Mock generation for now - in production this uses cloudflareAI to generate JSON
      const systemPrompt = `You are OrbitBolt. Output a valid JSON module schema wrapped in <SCHEMA>...</SCHEMA> and explain your changes. Include components like "text_input", "kanban", "relation", or "custom_sandbox".`;
      
      // Simulating a delay to mimic AI thinking
      setTimeout(() => {
        const mockSchema = {
          title: "Custom Module",
          components: [
            { id: "1", type: "header", text: "Generated " + text },
            { id: "2", type: "kanban", columns: ["Todo", "In Progress", "Done"] }
          ]
        };
        const assistantMsg = { 
          role: 'assistant', 
          content: "I have drafted the module based on your request. Please review the preview on the right. You can hit **Approve & Publish** to save it, or tell me what to **Refine**." 
        };
        
        s = { ...s, messages: [...updatedMsgs, assistantMsg], latest_schema: mockSchema };
        setActiveSession(s);
        setPreviewSchema(mockSchema);
        setSessions(prev => prev.map(p => p.id === s.id ? s : p));
        saveSession(s);
        setIsGenerating(false);
      }, 2000);
      
    } catch (err) {
      toast.error("Failed to generate module: " + err.message);
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!previewSchema) return;
    try {
      // Save the module as a published generic module
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
    <div className="fixed inset-0 bg-background z-[100] flex flex-col">
      {/* Header */}
      <div className="h-14 border-b bg-muted/30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Sparkles className="w-5 h-5" />
          <h1 className="font-bold tracking-tight">OrbitBolt <span className="text-muted-foreground font-normal text-sm ml-2">System Architect</span></h1>
        </div>
        <div className="flex items-center gap-2">
          {previewSchema && (
            <Button size="sm" onClick={handleApprove} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <CheckCircle className="w-4 h-4" /> Approve & Publish
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Main Workspace (Split Pane) */}
      <PanelGroup direction="horizontal" className="flex-1">
        {/* Left Panel: Chat & History */}
        <Panel defaultSize={35} minSize={25} className="flex flex-col border-r bg-card relative">
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeSession?.messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-muted border rounded-bl-sm prose dark:prose-invert max-w-none'}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="flex justify-start">
                <div className="bg-muted border rounded-2xl rounded-bl-sm p-3 text-sm flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Architecting...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t bg-background">
            <form onSubmit={handleSend} className="relative">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="E.g., Add a document upload field to this form..."
                className="w-full bg-muted border-none rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-indigo-500"
                disabled={isGenerating}
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isGenerating}
                className="absolute right-1.5 top-1.5 p-1.5 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </Panel>

        <PanelResizeHandle className="w-1.5 bg-border hover:bg-indigo-500/50 transition-colors cursor-col-resize" />

        {/* Right Panel: Live Preview */}
        <Panel defaultSize={65} className="flex flex-col bg-slate-50 dark:bg-slate-950/50">
          <div className="h-10 border-b flex items-center px-4 bg-card gap-4 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5 text-foreground"><Layers className="w-3.5 h-3.5" /> Live Preview</span>
            <span className="flex items-center gap-1.5"><Code className="w-3.5 h-3.5" /> Schema</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 flex justify-center">
            {previewSchema ? (
              <div className="w-full max-w-3xl bg-card border rounded-xl shadow-sm p-6">
                {/* Minimal preview renderer stub */}
                <h2 className="text-xl font-bold mb-4">{previewSchema.title}</h2>
                <div className="space-y-4">
                  {previewSchema.components?.map(c => (
                    <div key={c.id} className="p-4 border border-dashed rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">{c.type} Component</p>
                      {c.type === 'kanban' && <div className="flex gap-2">{c.columns.map(col => <div key={col} className="flex-1 h-20 bg-background border rounded">{col}</div>)}</div>}
                      {c.type === 'header' && <h3 className="font-semibold">{c.text}</h3>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground max-w-sm text-center">
                <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                <p>Describe what you want to build in the chat, and the live preview will appear here.</p>
              </div>
            )}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
