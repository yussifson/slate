import React, { useState, useRef, useEffect } from 'react';
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
import DynamicTable from "@/components/ui/DynamicTable";
import DynamicGrid from "@/components/ui/DynamicGrid";
import SecureSandbox from "@/components/orbitbolt/SecureSandbox";

// Lazy-loaded view components for new module types
const DynamicDashboard = React.lazy(() => import("@/components/ui/DynamicDashboard"));
const DynamicKanbanView = React.lazy(() => import("@/components/ui/DynamicKanbanView"));
const DynamicCalendarView = React.lazy(() => import("@/components/ui/DynamicCalendarView"));
const DynamicTimelineView = React.lazy(() => import("@/components/ui/DynamicTimelineView"));
const DynamicDirectoryView = React.lazy(() => import("@/components/ui/DynamicDirectoryView"));
const DynamicGalleryView = React.lazy(() => import("@/components/ui/DynamicGalleryView"));
const DynamicSpreadsheetView = React.lazy(() => import("@/components/ui/DynamicSpreadsheetView"));
const DynamicReportView = React.lazy(() => import("@/components/ui/DynamicReportView"));
const DynamicPipelineView = React.lazy(() => import("@/components/ui/DynamicPipelineView"));
const DynamicApprovalView = React.lazy(() => import("@/components/ui/DynamicApprovalView"));
const DynamicFormWizard = React.lazy(() => import("@/components/ui/DynamicFormWizard"));
const DynamicInventoryView = React.lazy(() => import("@/components/ui/DynamicInventoryView"));

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

const SYSTEM_PROMPT = `You are OrbitBolt, an AI System Architect for Optalflow. 
You can converse naturally with the user, answer questions, and help them refine their ideas.

CRITICAL: If the user is just saying "Hi", asking a question, or chatting normally WITHOUT asking you to build, create, or update a module/app, you MUST NOT output a <SCHEMA> tag. Just reply conversationally.

When the user asks you to build, create, or update a module/app, you MUST output a valid JSON schema wrapped EXACTLY in <SCHEMA>...</SCHEMA> tags.
CRITICAL RULE: DO NOT mention the JSON schema, the <SCHEMA> tags, or your underlying architecture in your conversational response to the user. This is an invisible background system. Just say "I have generated the module" and put the tags at the very end.

The JSON inside <SCHEMA> must follow this exact structure:
{
  "module": {
    "name": "Module Name",
    "description": "Brief description",
    "icon": "Layers",
    "layout": "table" | "grid",
    "theme": "primary" | "blue" | "emerald" | "amber" | "rose" | "purple",
    "module_type": "data_module" | "dashboard" | "kanban" | "document_manager" | "calendar_view" | "form_builder" | "directory" | "timeline" | "gallery" | "spreadsheet" | "report" | "inventory" | "crm_pipeline" | "approval_workflow"
  },
  "fields": [
    { "name": "Field Name", "field_type": "text" | "number" | "date" | "select" | "checkbox" | "file", "is_required": true|false, "options": "comma, separated, options" }
  ]
}

If the user asks to refine an existing module (like changing a name or adding a field), modify the previous JSON schema and output the NEW updated schema inside the <SCHEMA> tags.`;

// The IDE-like Workspace for building modules - Vercel v0 Dark Aesthetic
export default function OrbitBoltWorkspace({ onClose, onApplySchema }) {
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
    if (title === 'New Workspace') title = text.slice(0, 30) + '...';
    
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

  return (
    <div className="fixed inset-0 bg-background z-[1000] flex flex-col font-sans text-foreground">
      {/* Sleek Minimal Header */}
      <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0 shadow-sm z-[1001]">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h7"/></svg>
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/20 text-primary">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h1 className="font-semibold text-sm tracking-tight text-foreground">OrbitBolt <span className="text-muted-foreground font-normal">Workspace</span></h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {previewSchema && (
            <Button size="sm" onClick={handleApprove} className="h-8 px-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium text-xs transition-all shadow-sm">
              Save Workspace
            </Button>
          )}
          <div className="w-px h-5 bg-border mx-1" />
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md gap-1">
            <X className="w-4 h-4" /> Back to Optalflow
          </Button>
        </div>
      </div>

      <PanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        
        {/* Left Sidebar: History (v0 style) */}
        {isSidebarOpen && (
          <>
            <Panel defaultSize={18} minSize={15} maxSize={25} className="flex flex-col bg-muted/30 border-r border-border z-20">
              <div className="p-3">
                <Button onClick={startNewSession} className="w-full justify-start h-9 bg-background hover:bg-muted text-foreground border border-border text-xs">
                  <span className="text-lg mr-2 font-light">+</span> New Chat
                </Button>
              </div>
              <div className="px-3 pb-2 border-b border-border/50">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" placeholder="Search" className="w-full h-8 bg-background border border-border rounded-md pl-8 pr-3 text-xs focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground" />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto py-2">
                <div className="px-3 mb-1">
                  <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Chats</h3>
                </div>
                <div className="space-y-0.5 px-2">
                  {sessions.map(s => (
                    <button 
                      key={s.id}
                      onClick={() => switchSession(s)}
                      className={clsx(
                        "w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-3 transition-colors",
                        activeSession?.id === s.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      <span className="truncate">{s.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Panel>
            <PanelResizeHandle className="w-1 bg-transparent hover:bg-primary/50 transition-colors cursor-col-resize active:bg-primary/80" />
          </>
        )}

        {/* Center Panel: Chat Interface */}
        <Panel defaultSize={35} minSize={25} maxSize={50} className="flex flex-col bg-background/50 backdrop-blur-sm relative border-r border-border shadow-xl z-10">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-muted">
            {activeSession?.messages.map((m, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={i} 
                className={clsx("flex gap-3", m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
              >
                {/* Avatar */}
                {m.role === 'assistant' && (
                  <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-500 flex items-center justify-center border border-blue-500/20 shadow-sm">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
                
                {/* Message bubble */}
                <div className={clsx(
                  "max-w-[85%] text-[14px] leading-relaxed", 
                  m.role === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 shadow-md' 
                    : 'text-foreground prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-xl'
                )}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
              </motion.div>
            ))}
            
            {isGenerating && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center border border-primary/20">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="text-[14px] flex items-center gap-3 text-muted-foreground py-1">
                  <RefreshCw className="w-4 h-4 animate-spin text-primary" /> 
                  Generating architecture...
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>

          {/* V0 Style Input Area */}
          <div className="p-4 bg-background/50 backdrop-blur-sm shrink-0 border-t border-border/30">
            <form onSubmit={handleSend} className="relative max-w-3xl mx-auto group">
              <div className="relative bg-card/80 backdrop-blur-md border border-border/60 rounded-2xl overflow-hidden flex flex-col focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/50 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder="Ask OrbitBolt to build..."
                  className="w-full bg-transparent border-none resize-none px-5 py-4 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[120px] max-h-[250px] scrollbar-thin scrollbar-thumb-muted"
                  disabled={isGenerating}
                />
                <div className="flex items-center justify-between px-4 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold flex items-center gap-1.5 border border-primary/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block animate-pulse" /> OrbitBolt Mini
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={!input.trim() || isGenerating}
                    className="h-9 w-9 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full disabled:opacity-50 transition-transform active:scale-95 shadow-md shadow-primary/20"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-transparent hover:bg-primary/50 transition-colors cursor-col-resize active:bg-primary/80" />

        {/* Right Panel: Live Preview ONLY (No Schema view) */}
        <Panel defaultSize={47} className="flex flex-col bg-muted/20 relative p-4 md:p-6">
          <div className="flex-1 rounded-xl border border-border overflow-hidden bg-card flex flex-col shadow-lg shadow-black/5 relative">
            {previewSchema ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col h-full"
              >
                {/* Minimal Browser Header */}
                <div className="h-10 bg-muted/40 border-b border-border flex items-center px-4 shrink-0">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-border/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-border/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-border/80" />
                  </div>
                  <div className="mx-auto flex items-center gap-2 text-[11px] text-muted-foreground font-medium uppercase tracking-widest">
                    Preview
                  </div>
                  <div className="w-10"></div>
                </div>
                
                {/* Real Live Preview Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-card">
                  <div className="max-w-6xl mx-auto h-full">
                    
                    <React.Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse">Loading preview...</div>}>
                      {(() => {
                        const fields = previewSchema.fields || [];
                        const dummyData = generateDummyData(fields);
                        const fieldDefs = fields.map((f, i) => ({ ...f, name: f.name.trim().replace(/ /g, '_').toLowerCase(), order_index: i }));
                        const moduleType = previewSchema.module?.module_type || 'data_module';
                        const theme = previewSchema.module?.theme || 'primary';
                        const layout = previewSchema.module?.layout || 'table';
                        
                        return (
                           <div className="animate-in fade-in zoom-in-95 duration-300">
                             <div className="mb-6 flex items-center gap-3 border-b border-border/60 pb-5">
                               <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm">
                                 <Layers className="w-6 h-6 text-primary" />
                               </div>
                               <div>
                                 <h2 className="text-2xl font-semibold text-foreground tracking-tight">{previewSchema.module?.name || previewSchema.title || "Module"}</h2>
                                 <p className="text-muted-foreground text-sm mt-1">{previewSchema.module?.description || "Dynamic module preview"}</p>
                               </div>
                             </div>
                             
                             <div className="min-h-[500px]">
                                {(() => {
                                  switch (moduleType) {
                                    case 'dashboard':
                                      return <DynamicDashboard data={dummyData} fieldDefinitions={fieldDefs} />;
                                    case 'kanban':
                                      return <DynamicKanbanView data={dummyData} fieldDefinitions={fieldDefs} />;
                                    case 'calendar_view':
                                      return <DynamicCalendarView data={dummyData} fieldDefinitions={fieldDefs} />;
                                    case 'document_manager':
                                      return <DynamicGrid data={dummyData} fieldDefinitions={fieldDefs} theme={theme} isDocumentManager={true} />;
                                    case 'directory':
                                      return <DynamicDirectoryView data={dummyData} fieldDefinitions={fieldDefs} />;
                                    case 'timeline':
                                      return <DynamicTimelineView data={dummyData} fieldDefinitions={fieldDefs} />;
                                    case 'gallery':
                                      return <DynamicGalleryView data={dummyData} fieldDefinitions={fieldDefs} />;
                                    case 'spreadsheet':
                                      return <DynamicSpreadsheetView data={dummyData} fieldDefinitions={fieldDefs} />;
                                    case 'report':
                                      return <DynamicReportView data={dummyData} fieldDefinitions={fieldDefs} />;
                                    case 'inventory':
                                      return <DynamicInventoryView data={dummyData} fieldDefinitions={fieldDefs} />;
                                    case 'crm_pipeline':
                                      return <DynamicPipelineView data={dummyData} fieldDefinitions={fieldDefs} />;
                                    case 'approval_workflow':
                                      return <DynamicApprovalView data={dummyData} fieldDefinitions={fieldDefs} />;
                                    case 'form_builder':
                                      return <DynamicFormWizard data={dummyData} fieldDefinitions={fieldDefs} />;
                                    case 'custom_sandbox':
                                      return <SecureSandbox code={previewSchema.config?.custom_code || ""} initialData={{ records: dummyData, fieldDefs }} />;
                                    case 'data_module':
                                    default:
                                      return layout === 'table' ? (
                                        <DynamicTable data={dummyData} fieldDefinitions={fieldDefs} />
                                      ) : (
                                        <DynamicGrid data={dummyData} fieldDefinitions={fieldDefs} theme={theme} />
                                      );
                                  }
                                })()}
                             </div>
                           </div>
                        );
                      })()}
                    </React.Suspense>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground max-w-sm mx-auto text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mb-6 shadow-sm">
                  <Sparkles className="w-8 h-8 opacity-40 text-foreground" />
                </div>
                <div className="text-2xl font-bold text-foreground mb-3 tracking-tight">What do you want to create?</div>
                <p className="text-[15px] leading-relaxed">Describe the module or workflow in the chat panel to generate the UI instantly.</p>
              </div>
            )}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
