import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, X, Send, Bot, User, Maximize2, Minimize2, Plus, Clock, Mic, MicOff, Paperclip, Trash2, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateText, analyzeImage } from '@/lib/cloudflareAI';
import { toast } from 'react-hot-toast';
import { useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

//  Page Context Map 
const PAGE_CONTEXT = {
  '/': { title: 'Dashboard', suite: 'Core', desc: 'main dashboard with KPIs and quick actions' },
  '/cases': { title: 'Cases', suite: 'Legal', desc: 'legal case management list' },
  '/clients': { title: 'Clients', suite: 'Core', desc: 'client management' },
  '/calendar': { title: 'Calendar', suite: 'Core', desc: 'appointments and events calendar' },
  '/invoices': { title: 'Invoices', suite: 'Billing', desc: 'invoice management' },
  '/tasks': { title: 'Tasks', suite: 'Core', desc: 'task management' },
  '/documents': { title: 'Documents', suite: 'Core', desc: 'document library' },
  '/leads': { title: 'Leads', suite: 'CRM', desc: 'sales lead pipeline' },
  '/billing': { title: 'Billing', suite: 'Billing', desc: 'billing dashboard' },
  '/claims': { title: 'Claims Processing', suite: 'Insurance', desc: 'insurance claims list' },
  '/policies': { title: 'Policies', suite: 'Insurance', desc: 'insurance policy management' },
  '/premiums': { title: 'Premiums', suite: 'Insurance', desc: 'premium payment tracking' },
  '/underwriting': { title: 'Underwriting', suite: 'Insurance', desc: 'underwriting applications' },
  '/agent-performance': { title: 'Agent Performance', suite: 'Insurance', desc: 'insurance agent metrics' },
  '/patients': { title: 'Patients', suite: 'Hospital', desc: 'patient records' },
  '/appointments': { title: 'Appointments', suite: 'Hospital', desc: 'appointment scheduling' },
  '/wards': { title: 'Wards', suite: 'Hospital', desc: 'hospital ward management' },
  '/prescriptions': { title: 'Prescriptions', suite: 'Hospital', desc: 'prescription management' },
  '/lab-results': { title: 'Lab Results', suite: 'Hospital', desc: 'lab results and diagnostics' },
  '/students': { title: 'Students', suite: 'School', desc: 'student management' },
  '/classes': { title: 'Classes', suite: 'School', desc: 'class management' },
  '/grades': { title: 'Grades', suite: 'School', desc: 'student grades' },
  '/attendance': { title: 'Attendance', suite: 'School', desc: 'attendance tracking' },
  '/members': { title: 'Members', suite: 'Church', desc: 'church member directory' },
  '/tithes': { title: 'Tithes', suite: 'Church', desc: 'tithe and offering records' },
  '/employees': { title: 'Employees', suite: 'HR', desc: 'HR employee management' },
  '/payroll': { title: 'Payroll', suite: 'HR', desc: 'payroll processing' },
  '/recruitment': { title: 'Recruitment', suite: 'HR', desc: 'job applications and hiring' },
  '/shipments': { title: 'Shipments', suite: 'Logistics', desc: 'shipment tracking' },
  '/fleet': { title: 'Fleet', suite: 'Logistics', desc: 'vehicle fleet management' },
  '/inventory': { title: 'Inventory', suite: 'Retail', desc: 'product inventory' },
  '/orders': { title: 'Sales Orders', suite: 'Retail', desc: 'sales orders' },
  '/pos': { title: 'Point of Sale', suite: 'Retail', desc: 'retail POS system' },
};

//  Session Storage 
const STORAGE_KEY = 'optalflow_ai_sessions_v2';

function getSessions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveSessions(sessions) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 50))); }
  catch {}
}

function newSession() {
  return {
    id: crypto.randomUUID(),
    title: 'New Chat',
    createdAt: new Date().toISOString(),
    messages: [{
      role: 'assistant',
      content: "Hello! I'm your **Optalflow AI Agent** 🤖\n\nI can help you:\n• Navigate the app\n• Create, edit & manage records\n• Analyze data on any page\n• Answer any question\n\nYou can also use your **🎤 voice** or **📎 upload files** (images, PDFs, CSV, etc.)\n\nWhat would you like to do?"
    }]
  };
}

//  Parse Agent Actions 
function parseAgentActions(text) {
  const actions = [];
  // Forgiving regex to catch typos like <GENT_ACTION>, <AGENT_ACTION>, </AGENT_ACTION>, etc.
  const regex = /<\/?\w*GENT_ACTION>([\s\S]*?)<\/?\w*GENT_ACTION>/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    try { actions.push(JSON.parse(match[1])); } catch {}
  }
  const cleanText = text.replace(/<\/?\w*GENT_ACTION>[\s\S]*?<\/?\w*GENT_ACTION>/gi, '').trim();
  return { cleanText, actions };
}

//  Format message with simple markdown 
function FormatMessage({ content }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mt-1 [&>ul]:mb-2 [&>ol]:mt-1 [&>ol]:mb-2 [&>ul]:pl-4 [&>ol]:pl-4">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

//  Main Component 
export default function GlobalAIAssistant({ onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  const initSessions = () => {
    const saved = getSessions();
    return saved.length > 0 ? saved : [newSession()];
  };

  const [sessions, setSessions] = useState(initSessions);
  const [activeId, setActiveId] = useState(() => {
    const saved = getSessions();
    return saved.length > 0 ? saved[0].id : initSessions()[0].id;
  });
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  const activeSession = sessions.find(s => s.id === activeId) || sessions[0];
  const messages = activeSession?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  const addMessages = useCallback((sid, newMsgs) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== sid) return s;
      const updated = [...s.messages, ...newMsgs];
      const firstUser = updated.find(m => m.role === 'user');
      const title = firstUser
        ? firstUser.content.replace(/\[Attached:.*?\]/g, '').trim().slice(0, 42) + (firstUser.content.length > 42 ? '' : '')
        : s.title;
      return { ...s, messages: updated, title: title || 'New Chat' };
    }));
  }, []);

  const getPageContext = useCallback(() => {
    const ctx = PAGE_CONTEXT[location.pathname];
    return ctx
      ? `The user is on the "${ctx.title}" page in the ${ctx.suite} suite (${ctx.desc}).`
      : `The user is on the "${location.pathname}" page.`;
  }, [location.pathname]);

  const executeActionsAsync = async (actions) => {
    const results = [];
    for (const action of actions) {
      try {
        switch (action.tool) {
          case 'search_records': {
            const rt = (action.recordType || '').toLowerCase();
            const entityMap = { 'case': 'LegalCase', 'client': 'Client', 'lead': 'Lead', 'staff': 'StaffRecord', 'invoice': 'Invoice', 'task': 'Task' };
            const entityName = entityMap[rt];
            if (entityName) {
              const records = await base44.entities[entityName].list();
              const q = (action.query || '').toLowerCase();
              const found = records.filter(r => JSON.stringify(r).toLowerCase().includes(q)).slice(0, 5);
              const simplified = found.map(r => ({ id: r.id, title: r.title, name: r.name, email: r.email, case_number: r.case_number }));
              results.push(`Search results for ${rt} matching "${q}":\n` + JSON.stringify(simplified));
            } else {
              results.push(`Error: Unknown recordType for search: ${action.recordType}`);
            }
            break;
          }
          case 'navigate_to':
            if (action.route) {
              setTimeout(() => navigate(action.route), 200);
              results.push(`Navigated to ${action.route}`);
            }
            break;
          case 'show_toast':
            toast(action.message || 'Done!', { icon: '' });
            results.push(`Toast shown`);
            break;
          case 'create_record':
          case 'update_record': {
            if (action.recordType && action.payload) {
              const rt = action.recordType.toLowerCase();
              const isCore = ['case', 'client', 'lead', 'staff', 'invoice', 'task'].includes(rt);
              if (isCore) {
                const entityMap = { 'case': 'LegalCase', 'client': 'Client', 'lead': 'Lead', 'staff': 'StaffRecord', 'invoice': 'Invoice', 'task': 'Task' };
                const entityName = entityMap[rt];
                const p = { ...action.payload, company_id: companyId };
                if (action.tool === 'create_record' && !p.status) p.status = 'open';

                const res = action.id || action.tool === 'update_record'
                  ? await base44.entities[entityName].update(action.id, p)
                  : await base44.entities[entityName].create(p);

                queryClient.invalidateQueries([rt + 's']);
                queryClient.invalidateQueries(['cases']);
                results.push(`Success: ${action.tool} for ${rt}. Record ID is ${res.id}`);
              } else {
                results.push(`Error: Generic industry_records fallback not supported in agent loop yet.`);
              }
            }
            break;
          }
          case 'delete_record': {
            if (action.id && action.recordType) {
              const rt = action.recordType.toLowerCase();
              const isCore = ['case', 'client', 'lead', 'staff', 'invoice', 'task'].includes(rt);
              if (isCore) {
                const entityMap = { 'case': 'LegalCase', 'client': 'Client', 'lead': 'Lead', 'staff': 'StaffRecord', 'invoice': 'Invoice', 'task': 'Task' };
                const entityName = entityMap[rt];
                await base44.entities[entityName].delete(action.id);
                queryClient.invalidateQueries([rt + 's']);
                queryClient.invalidateQueries(['cases']);
                results.push(`Success: deleted ${rt} with ID ${action.id}`);
              } else {
                results.push(`Error: delete unsupported for ${rt}`);
              }
            }
            break;
          }
          default:
            results.push(`Error: unknown tool ${action.tool}`);
            break;
        }
      } catch (err) {
        results.push(`Error executing ${action.tool}: ${err.message}`);
      }
    }
    return results;
  };

  const handleSend = useCallback(async (overrideText) => {
    const text = (overrideText !== undefined ? overrideText : input).trim();
    if (!text && !uploadedFile) return;

    const sid = activeId;
    const currentSessions = sessions;

    let userContent = text;
    if (uploadedFile) {
      userContent = text
        ? `${text}\n\n[Attached: ${uploadedFile.name}]`
        : `[Attached: ${uploadedFile.name}]`;
    }

    addMessages(sid, [{ role: 'user', content: userContent }]);
    setInput('');
    const fileSnap = uploadedFile;
    setUploadedFile(null);
    setIsLoading(true);

    try {
      let responseText;

      if (fileSnap?.type === 'image') {
        const promptText = `You are an AI agent embedded in Optalflow enterprise SaaS. ${getPageContext()}\n\nUser says: ${text || 'Please analyze this image.'}\n\nDescribe the image and provide relevant business insights.`;
        responseText = await analyzeImage(fileSnap.bytes, promptText);
      } else {
        const systemPrompt = `You are Optalflow AI Agent  an intelligent, proactive enterprise assistant embedded in Optalflow SaaS.

CURRENT PAGE: ${getPageContext()}
PLATFORM: 8 industry suites  Legal, School, Hospital, Hotel, Church, Insurance, Retail, Logistics, HR.

AGENT POWERS (return EXACTLY this JSON format inline to act):
- Search: <AGENT_ACTION>{"tool":"search_records","recordType":"case|staff|client","query":"Ali"}</AGENT_ACTION>
- Create: <AGENT_ACTION>{"tool":"create_record","recordType":"staff","payload":{"name":"Jamila"}}</AGENT_ACTION>
- Update: <AGENT_ACTION>{"tool":"update_record","recordType":"case","id":"uuid-here","payload":{"assigned_lawyer_id":"uuid"}}</AGENT_ACTION>
- Delete: <AGENT_ACTION>{"tool":"delete_record","id":"uuid-here","recordType":"patient"}</AGENT_ACTION>
- Navigate: <AGENT_ACTION>{"tool":"navigate_to","route":"/route"}</AGENT_ACTION>

RULES FOR MULTI-STEP REASONING:
1. NEVER explain how the user can do something. YOU MUST do it for them.
2. You can chain actions. If you need an ID to update a record, use "search_records" FIRST, wait for the system to reply with the results, and then use "update_record".
3. When you create a record, the system will reply with the new record's ID. You can then use this ID in your next action.
4. DO NOT wrap <AGENT_ACTION> in markdown code blocks. Just output it raw inline.
5. Once you have completed all tasks, respond with a final conversational message summarizing what you did, and STOP outputting <AGENT_ACTION> blocks.
6. For 'case' records, use 'title' instead of 'name'.`;

        const sessionMessages = currentSessions.find(s => s.id === sid)?.messages || [];
        const allMessages = [...sessionMessages, { role: 'user', content: userContent }];
        let apiMessages = [
          { role: 'system', content: systemPrompt },
          ...allMessages.slice(-20).map(m => ({ role: m.role, content: m.content }))
        ];

        let maxSteps = 5;
        let stepCount = 0;
        let finalCleanText = "";

        while (stepCount < maxSteps) {
          stepCount++;
          const responseText = await generateText(apiMessages);
          const { cleanText, actions } = parseAgentActions(responseText);
          
          if (cleanText) finalCleanText += (finalCleanText ? "\n\n" : "") + cleanText;

          if (actions.length === 0) {
            break; // AI is done
          }

          const actionResults = await executeActionsAsync(actions);
          
          apiMessages.push({ role: 'assistant', content: responseText });
          apiMessages.push({ role: 'system', content: `Action Results:\n${actionResults.join('\n')}` });
        }

        const finalContent = finalCleanText || "Action completed.";
        addMessages(sid, [{ role: 'assistant', content: finalContent }]);
      }
    } catch (err) {
      addMessages(sid, [{ role: 'assistant', content: "Error: " + err.message + ". Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, uploadedFile, activeId, sessions, addMessages, getPageContext, companyId, queryClient, navigate]);

  //  Voice 
  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error('Voice not supported. Please use Chrome or Edge.'); return; }
    if (isRecording) { recognitionRef.current?.stop(); setIsRecording(false); return; }
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = 'en-US';
    r.onresult = e => {
      const t = e.results[0][0].transcript;
      setInput(prev => prev ? `${prev} ${t}` : t);
      setIsRecording(false);
    };
    r.onerror = () => { setIsRecording(false); toast.error('Voice error. Try again.'); };
    r.onend = () => setIsRecording(false);
    recognitionRef.current = r;
    r.start();
    setIsRecording(true);
    toast('Listening', { icon: '', duration: 2000 });
  };

  //  File Upload 
  const handleFileUpload = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (file.size > 10 * 1024 * 1024) { toast.error('File too large (max 10MB)'); return; }

    if (file.type.startsWith('image/')) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      setUploadedFile({ name: file.name, type: 'image', bytes });
      toast.success(`Image ready: ${file.name}`);
    } else {
      const text = await file.text();
      setUploadedFile({ name: file.name, type: 'text', content: text });
      toast.success(`File ready: ${file.name}`);
    }
  };

  //  Session Management 
  const startNewChat = () => {
    const s = newSession();
    setSessions(prev => [s, ...prev]);
    setActiveId(s.id);
    setShowHistory(false);
  };

  const deleteSession = (sid, e) => {
    e.stopPropagation();
    setSessions(prev => {
      const rest = prev.filter(s => s.id !== sid);
      if (rest.length === 0) {
        const fresh = newSession();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (activeId === sid) setActiveId(rest[0].id);
      return rest;
    });
  };

  const ctx = PAGE_CONTEXT[location.pathname];

  //  Render 
  return (
    <div className={`flex h-full shrink-0 border-l-[3px] border-l-blue-500 bg-card shadow-[-8px_0_30px_rgba(0,0,0,0.07)] animate-in slide-in-from-right-8 duration-300 z-40 transition-all ${isExpanded ? 'w-[680px]' : 'w-[400px]'}`}>

      {/*  History Sidebar  */}
      {showHistory && (
        <div className="w-52 shrink-0 border-r border-border bg-muted/20 flex flex-col">
          <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Chat History</span>
            <button onClick={startNewChat} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-blue-600 transition-colors" title="New chat">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.map(s => (
              <div
                key={s.id}
                onClick={() => { setActiveId(s.id); setShowHistory(false); }}
                className={`group relative flex items-start gap-2 p-2 rounded-lg cursor-pointer text-left transition-colors ${
                  s.id === activeId
                    ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50'
                    : 'hover:bg-muted/70'
                }`}
              >
                <Clock className="w-3 h-3 mt-0.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground truncate leading-tight">{s.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={e => deleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-red-500 transition-all shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/*  Main Panel  */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-gradient-to-r from-blue-500/8 to-indigo-500/5 shrink-0">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-1.5 rounded-md transition-colors shrink-0 ${showHistory ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            title="Chat history"
          >
            <Clock className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-foreground leading-none">Optalflow AI Agent</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0"></span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground truncate">Agent Active  LLaMA 3.1</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={startNewChat} className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors" title="New chat">
              <Plus className="w-4 h-4" />
            </button>
            <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors">
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button onClick={onClose} className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Page Context Bar */}
        <div className="px-3 py-1.5 flex items-center gap-1.5 bg-blue-50/60 dark:bg-blue-950/10 border-b border-blue-100 dark:border-blue-900/20 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold truncate">
            {ctx ? `${ctx.suite}  ${ctx.title}` : location.pathname}  AI has full context
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(circle,#1e293b_1px,transparent_1px)] [background-size:18px_18px]">
          <div className="absolute inset-0 bg-card/65 pointer-events-none z-0"></div>
          <div className="relative z-10 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                }`}>
                  {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                </div>
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm max-w-[88%] ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-card border border-border rounded-tl-sm text-foreground'
                }`}>
                  <FormatMessage content={msg.content} />
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-white animate-spin" />
                </div>
                <div className="px-4 py-3 bg-card border border-border rounded-2xl rounded-tl-sm shadow-sm flex gap-1.5 items-center">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Attached File Preview */}
        {uploadedFile && (
          <div className="mx-3 mb-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 flex items-center gap-2 shrink-0">
            {uploadedFile.type === 'image'
              ? <Image className="w-4 h-4 text-blue-500 shrink-0" />
              : <FileText className="w-4 h-4 text-blue-500 shrink-0" />}
            <span className="text-xs font-medium text-blue-700 dark:text-blue-400 flex-1 truncate">{uploadedFile.name}</span>
            <button onClick={() => setUploadedFile(null)} className="text-muted-foreground hover:text-red-500 transition-colors shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-border bg-card/80 backdrop-blur-sm shrink-0">
          <div className="border border-border focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/15 rounded-xl bg-background transition-all overflow-hidden shadow-sm">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={isRecording ? ' Listening speak now' : 'Ask anything or give a command'}
              rows={2}
              className={`w-full bg-transparent border-none focus:ring-0 resize-none px-3 pt-3 pb-1 text-sm text-foreground outline-none leading-relaxed ${
                isRecording ? 'placeholder:text-red-400 placeholder:animate-pulse' : 'placeholder:text-muted-foreground/50'
              }`}
              disabled={isLoading}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
            />
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-0.5">
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf,.txt,.csv,.docx,.xlsx,.json,.md" onChange={handleFileUpload} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-md transition-colors"
                  title="Attach file or image"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`p-1.5 rounded-md transition-colors ${
                    isRecording
                      ? 'text-red-500 bg-red-50 dark:bg-red-950/30 animate-pulse'
                      : 'text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                  }`}
                  title={isRecording ? 'Stop recording' : 'Voice input'}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider hidden sm:block"> Send  Shift+ Newline</span>
                <button
                  type="button"
                  disabled={(!input.trim() && !uploadedFile) || isLoading}
                  onClick={() => handleSend()}
                  className="h-8 w-8 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-colors shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
