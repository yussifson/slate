import { useTranslation } from "react-i18next";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, MessageSquare, X, Send, Bot, User, Maximize2, Minimize2, Plus, Clock, Mic, MicOff, Paperclip, Trash2, FileText, Image, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateText, analyzeImage } from '@/lib/cloudflareAI';
import { toast } from 'react-hot-toast';
import { useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { OrbitIcon } from '@/components/ui/OrbitIcon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/lib/AuthContext';

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
  '/members': { title: 'Members', suite: 'Religion', desc: 'religion member directory' },
  '/donations': { title: 'Donations', suite: 'Religion', desc: 'donation and offering records' },
  '/employees': { title: 'Employees', suite: 'HR', desc: 'HR employee management' },
  '/payroll': { title: 'Payroll', suite: 'HR', desc: 'payroll processing' },
  '/recruitment': { title: 'Recruitment', suite: 'HR', desc: 'job applications and hiring' },
  '/shipments': { title: 'Shipments', suite: 'Logistics', desc: 'shipment tracking' },
  '/fleet': { title: 'Fleet', suite: 'Logistics', desc: 'vehicle fleet management' },
  '/inventory': { title: 'Inventory', suite: 'Retail', desc: 'product inventory' },
  '/orders': { title: 'Sales Orders', suite: 'Retail', desc: 'sales orders' },
  '/pos': { title: 'Point of Sale', suite: 'Retail', desc: 'retail POS system' },
};

// Contextual smart suggestions per page/suite
const PAGE_SUGGESTIONS = {
  '/patients':    ['List all patients admitted today', 'Create a new patient record', 'Show patients with pending lab results'],
  '/appointments':['Schedule an appointment for tomorrow', 'List today\'s appointments', 'Find upcoming appointments this week'],
  '/wards':       ['Show all occupied beds', 'Assign patient to a bed in Ward A', 'List available beds'],
  '/cases':       ['Show all open cases', 'Create a new case', 'Find cases assigned to me'],
  '/tasks':       ['Show my pending tasks', 'Create an urgent task', 'Mark overdue tasks'],
  '/employees':   ['List all active employees', 'Add a new employee', 'Show employees on leave'],
  '/payroll':     ['Generate payroll for this month', 'Show pending payslips', 'Calculate overtime'],
  '/students':    ['Show students with missing fees', 'Add a new student', 'Find students by class'],
  '/inventory':   ['Show low stock items', 'Add a new product', 'Find products below reorder level'],
  '/claims':      ['List pending claims', 'Create a new claim', 'Show high-value claims this month'],
  '/':            ['Give me a summary of today\'s activity', 'Show key metrics', 'What needs my attention today?'],
};

//  Session Storage (Fallback/Types)
function newSession() {
  return {
    id: crypto.randomUUID(),
    title: 'New Chat',
    createdAt: new Date().toISOString(),
    messages: [{
      role: 'assistant',
      content: "Hello! I'm **Orbit** ≡ƒæï\n\nI can help you:\n  Navigate the app\n  Create, edit & manage records\n  Analyze data on any page\n  Answer any question\n\nYou can also use your **≡ƒÄÖ∩╕Å voice** or **≡ƒôÄ upload files** (images, PDFs, CSV, etc.)\n\nWhat would you like to do?"
    }]
  };
}

//  Parse Agent Actions 
function parseAgentActions(text) {
  const actions = [];
  let cleanText = text;
  const startRegex = /\{\s*"tool"\s*:/gi;
  
  let match;
  while ((match = startRegex.exec(cleanText)) !== null) {
    let start = match.index;
    let braces = 0;
    let end = -1;
    let inString = false;
    let escape = false;

    for (let j = start; j < cleanText.length; j++) {
      let char = cleanText[j];
      if (char === '\\' && !escape) {
        escape = true;
        continue;
      }
      if (char === '"' && !escape) {
        inString = !inString;
      }
      if (!inString) {
        if (char === '{') braces++;
        if (char === '}') braces--;
      }
      escape = false;

      if (braces === 0 && j > start) {
        end = j;
        break;
      }
    }

    if (end !== -1) {
      let jsonStr = cleanText.substring(start, end + 1);
      try {
        let obj = JSON.parse(jsonStr);
        if (obj && obj.tool) {
          actions.push(obj);
          cleanText = cleanText.substring(0, start) + cleanText.substring(end + 1);
          startRegex.lastIndex = start; 
        }
      } catch (e) {}
    }
  }

  cleanText = cleanText.replace(/<\/?[a-zA-Z0-9_]+ACTION>/gi, '').trim();
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
export default function GlobalAIAssistant({ isOpen = false, onClose, injectedContext = null, onContextConsumed }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [pendingHiddenContext, setPendingHiddenContext] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const manualStopRef = useRef(false);

  useEffect(() => {
    if (!companyId || !user?.email || isInitialized) return;
    const loadSessions = async () => {
      const { data } = await supabase
        .from('industry_records')
        .select('*')
        .eq('company_id', companyId)
        .eq('record_type', 'ai_session')
        .eq('search_text', user.email)
        .order('created_at', { ascending: false });
      
      if (data && data.length > 0) {
        setSessions(data.map(d => d.data));
        setActiveId(data[0].data.id);
      } else {
        const s = newSession();
        setSessions([s]);
        setActiveId(s.id);
        supabase.from('industry_records').upsert({
          id: s.id, company_id: companyId, industry: 'core', record_type: 'ai_session', search_text: user.email, data: s
        }).then();
      }
      setIsInitialized(true);
    };
    loadSessions();
  }, [companyId, user?.email, isInitialized]);

  const activeSession = sessions.find(s => s.id === activeId) || sessions[0];
  const messages = activeSession?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);



  const addMessages = useCallback((sid, newMsgs) => {
    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id !== sid) return s;
        const upMsgs = [...s.messages, ...newMsgs];
        const firstUser = upMsgs.find(m => m.role === 'user');
        const title = firstUser
          ? firstUser.content.replace(/\[Attached:.*?\]/g, '').trim().slice(0, 42)
          : s.title;
        const newS = { ...s, messages: upMsgs, title: title || 'New Chat' };
        
        if (companyId && user?.email) {
          supabase.from('industry_records').upsert({
            id: newS.id, company_id: companyId, industry: 'core', record_type: 'ai_session', search_text: user.email, data: newS
          }).then();
        }
        return newS;
      });
      return updated;
    });
  }, [companyId, user?.email]);

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
            const q = (action.query || '').toLowerCase();
            if (entityName) {
              const records = await base44.entities[entityName].list();
              const found = records.filter(r => JSON.stringify(r).toLowerCase().includes(q)).slice(0, 5);
              const simplified = found.map(r => ({ id: r.id, title: r.title, name: r.name, email: r.email, case_number: r.case_number }));
              results.push(`Search results for ${rt} matching "${q}":\n` + JSON.stringify(simplified));
            } else {
              const { data: records } = await supabase
                .from('industry_records')
                .select('id, data, status')
                .eq('company_id', companyId)
                .eq('record_type', rt);
              const found = (records || []).filter(r => JSON.stringify(r).toLowerCase().includes(q)).slice(0, 5);
              results.push(`Search results for ${rt} matching "${q}":\n` + JSON.stringify(found));
            }
            break;
          }
          case 'remember': {
            if (action.fact) {
              await mutateRecord.mutateAsync({
                id: crypto.randomUUID(),
                recordType: 'ai_memory',
                payload: { fact: action.fact, user: user?.email },
                status: 'active',
                searchText: `${user?.email} ${action.fact}`
              });
              results.push(`Fact successfully committed to long-term memory.`);
            }
            break;
          }
          case 'search_memory': {
            const { data: mems } = await supabase
              .from('industry_records')
              .select('*')
              .eq('company_id', companyId)
              .eq('record_type', 'ai_memory')
              .ilike('search_text', `%${user?.email}%`);
            
            if (mems && mems.length > 0) {
              const matched = mems
                .filter(m => m.data.fact.toLowerCase().includes((action.query || '').toLowerCase()))
                .map(m => m.data.fact);
              results.push(matched.length ? `Memory results:\n${matched.join('\n')}` : `No memories found matching "${action.query}".`);
            } else {
              results.push(`Memory is empty.`);
            }
            break;
          }
          case 'navigate_to':
            if (action.route) {
              const dangerousRoutes = ['/logout', '/login', '/register', '/auth'];
              if (dangerousRoutes.some(r => action.route.includes(r))) {
                results.push(`Security Block: Navigation to ${action.route} is prohibited for AI agents.`);
                toast.error(`Blocked AI from navigating to ${action.route}`);
              } else {
                setTimeout(() => navigate(action.route), 200);
                results.push(`Navigated to ${action.route}`);
              }
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

                queryClient.invalidateQueries({ queryKey: [rt + 's'] });
                queryClient.invalidateQueries({ queryKey: ['cases'] });
                results.push(`Success: ${action.tool} for ${rt}. Record ID is ${res.id}`);
              } else {
                const res = await mutateRecord.mutateAsync({
                  id: action.id,
                  recordType: rt,
                  payload: action.payload,
                  status: action.payload.status || 'active',
                  searchText: JSON.stringify(action.payload).toLowerCase()
                });
                results.push(`Success: ${action.tool} for ${rt}. Record ID is ${res.id}`);
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
                queryClient.invalidateQueries({ queryKey: [rt + 's'] });
                queryClient.invalidateQueries({ queryKey: ['cases'] });
                results.push(`Success: deleted ${rt} with ID ${action.id}`);
              } else {
                await deleteRecord.mutateAsync({ id: action.id, recordType: rt });
                results.push(`Success: deleted ${rt} with ID ${action.id}`);
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

  const handleSend = useCallback(async (overrideText, targetSid = null, hiddenContext = null) => {
    const text = (overrideText !== undefined ? overrideText : input).trim();
    if (!text && !uploadedFile) return;

    const actualHiddenContext = hiddenContext || pendingHiddenContext;
    setPendingHiddenContext(null);

    const sid = targetSid || activeId;
    const currentSessions = sessions;

    let userContent = text;
    if (uploadedFile) {
      userContent = text
        ? `${text}\n\n[Attached: ${uploadedFile.name}]`
        : `[Attached: ${uploadedFile.name}]`;
    }

    addMessages(sid, [{ role: 'user', content: userContent, hiddenContext: actualHiddenContext }]);
    setInput('');
    const fileSnap = uploadedFile;
    setUploadedFile(null);
    setIsLoading(true);

    try {
      let responseText;

      if (fileSnap?.type === 'image') {
        const promptText = `You are an AI agent embedded in Slate enterprise SaaS. ${getPageContext()}\n\nUser says: ${text || 'Please analyze this image.'}\n\nDescribe the image and provide relevant business insights.`;
        responseText = await analyzeImage(fileSnap.bytes, promptText);
      } else {
        const ctx = PAGE_CONTEXT[location.pathname] || { title: 'Unknown', suite: 'Unknown' };
        const systemPrompt = `You are OrbitFlow ΓÇö an intelligent, proactive enterprise assistant embedded in Slate SaaS.
Your current context is the ${ctx.suite} suite, specifically the '${ctx.title}' page.

CRITICAL INSTRUCTIONS:
- You have Long-Term Memory. You can remember facts about the user across sessions. Always check your memory or save important details when asked.
- The user is currently on page: ${location.pathname}

EXACT VERIFIED ROUTE MAP ΓÇö ALWAYS USE THESE EXACT PATHS FOR navigate_to. NEVER GUESS OR INVENT PATHS:
# Core / Legal Suite
/ ΓåÆ Dashboard
/cases ΓåÆ Cases
/clients ΓåÆ Clients
/calendar ΓåÆ Calendar
/invoices ΓåÆ Invoices
/tasks ΓåÆ Tasks
/documents ΓåÆ Documents
/team ΓåÆ Team
/settings ΓåÆ Settings
/client-portal ΓåÆ Client Portal
/leads ΓåÆ Leads
/billing ΓåÆ Billing
/pipeline ΓåÆ Case Pipeline
/research ΓåÆ Legal Research
/audit ΓåÆ Audit Log
/leave ΓåÆ Leave Management
/performance ΓåÆ Performance Dashboard
/outcomes ΓåÆ Case Outcomes
/conflict-check ΓåÆ Conflict Checker
/email-inbox ΓåÆ Email Inbox
/reports ΓåÆ Reports
/export ΓåÆ Data Export
/whatsapp ΓåÆ WhatsApp Messenger
/hr ΓåÆ HR Dashboard
/my-dashboard ΓåÆ My Dashboard

# School Suite
/students ΓåÆ Students
/classes ΓåÆ Classes
/timetable ΓåÆ Timetable
/attendance ΓåÆ Attendance
/grades ΓåÆ Grades
/exams ΓåÆ Exams
/fees ΓåÆ Fee Management
/library ΓåÆ Library
/parent-portal ΓåÆ Parent Portal

# Hospital Suite
/patients ΓåÆ Patients
/appointments ΓåÆ Appointments
/wards ΓåÆ Wards
/prescriptions ΓåÆ Prescriptions
/lab-results ΓåÆ Lab Results
/pharmacy ΓåÆ Pharmacy

# Hotel Suite
/front-desk ΓåÆ Front Desk
/reservations ΓåÆ Reservations
/rooms ΓåÆ Rooms
/housekeeping ΓåÆ Housekeeping
/restaurant ΓåÆ Restaurant
/guest-requests ΓåÆ Guest Requests

# Religion Suite
/members ΓåÆ Members
/groups ΓåÆ Groups
/events ΓåÆ Events
/donations ΓåÆ Donations
/volunteers ΓåÆ Volunteers
/sermons ΓåÆ Sermons
/small-groups ΓåÆ Small Groups
/prayers ΓåÆ Prayers

# Insurance Suite
/policies ΓåÆ Policies
/claims ΓåÆ Claims
/premiums ΓåÆ Premiums
/underwriting ΓåÆ Underwriting
/agent-performance ΓåÆ Agent Performance

# Retail Suite
/retail-dashboard → Retail Overview
/pos → Point of Sale
/inventory → Inventory
/purchase-orders → Purchase Orders
/promotions → Promotions
/orders → Orders/Sales
/suppliers → Suppliers
/retail-customers → Customers

# Logistics Suite
/shipments ΓåÆ Shipments
/fleet ΓåÆ Fleet
/drivers ΓåÆ Drivers
/warehouse ΓåÆ Warehouses

# HR Suite
/employees ΓåÆ Employees
/recruitment ΓåÆ Recruitment
/payroll ΓåÆ Payroll
/hr-leave ΓåÆ HR Leave

AGENT POWERS (return EXACTLY this JSON format inline to act):
- Search: <AGENT_ACTION>{"tool":"search_records","recordType":"patient|case|client|student|staff","query":"John"}</AGENT_ACTION>
- Navigate: <AGENT_ACTION>{"tool":"navigate_to","route":"/patients"}</AGENT_ACTION>
- Create: <AGENT_ACTION>{"tool":"create_record","recordType":"patient","payload":{"name":"John Doe","age":30,"status":"active"}}</AGENT_ACTION>
- Update: <AGENT_ACTION>{"tool":"update_record","recordType":"patient","id":"uuid","payload":{"status":"discharged"}}</AGENT_ACTION>
- Delete: <AGENT_ACTION>{"tool":"delete_record","recordType":"patient","id":"uuid"}</AGENT_ACTION>
- Toast: <AGENT_ACTION>{"tool":"show_toast","message":"Done!"}</AGENT_ACTION>
- Remember: <AGENT_ACTION>{"tool":"remember","fact":"User prefers dark mode"}</AGENT_ACTION>
- Search Memory: <AGENT_ACTION>{"tool":"search_memory","query":"preferences"}</AGENT_ACTION>
- Request Confirmation: <AGENT_ACTION>{"tool":"ask_confirmation","actionToConfirm":{"tool":"navigate_to","route":"/classes"},"message":"Did you mean the Classes page?"}</AGENT_ACTION>

RULES FOR MULTI-STEP REASONING:
1. NEVER explain how the user can do something. YOU MUST do it for them.
2. When asked to CREATE something, create the record first, THEN navigate to the correct page to show it.
3. ALWAYS use the exact routes from the ROUTE MAP above. NEVER invent paths like /hospital/patients.
4. You can chain actions: create a record, then navigate to show it.
5. DO NOT wrap <AGENT_ACTION> in markdown code blocks. Output it raw inline.
6. Once all tasks are complete, summarize what you did in plain language and STOP outputting <AGENT_ACTION> blocks.
7. For 'case' records, use 'title' instead of 'name'.
8. If the user's input has a typo, is ambiguous, or if you are unsure which page they mean, ALWAYS use the 'ask_confirmation' tool first and wait for approval.
9. DO NOT generate JSON schemas or build complex modules/systems. If the user asks you to build, create, or design a module or system, politely tell them to use the "OrbitBolt System Architect" tool (the lightning bolt icon) instead.`;

        const sessionMessages = currentSessions.find(s => s.id === sid)?.messages || [];
        const allMessages = [...sessionMessages, { role: 'user', content: userContent }];
        let apiMessages = [
          { role: 'system', content: systemPrompt },
          ...allMessages.slice(-20).map(m => ({ 
            role: m.role, 
            content: m.hiddenContext ? `${m.content}\n\nSystem Context:\n\`\`\`json\n${m.hiddenContext}\n\`\`\`` : m.content 
          }))
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

          let confirmationAction = actions.find(a => a.tool === 'ask_confirmation');
          if (confirmationAction) {
             addMessages(sid, [{ 
               role: 'assistant', 
               content: finalCleanText || confirmationAction.message,
               isConfirmation: true,
               pendingAction: confirmationAction.actionToConfirm 
             }]);
             finalCleanText = ""; // Handled via the confirmation message
             break; // Pause loop
          }

          const actionResults = await executeActionsAsync(actions);
          
          apiMessages.push({ role: 'assistant', content: responseText });
          apiMessages.push({ role: 'system', content: `Action Results:\n${actionResults.join('\n')}` });
        }

        if (finalCleanText) {
          addMessages(sid, [{ role: 'assistant', content: finalCleanText }]);
        }
      }
    } catch (err) {
      addMessages(sid, [{ role: 'assistant', content: "Error: " + err.message + ". Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, uploadedFile, activeId, sessions, addMessages, getPageContext, companyId, queryClient, navigate, location.pathname, executeActionsAsync]);

  // When Spotlight injects a record context, auto-start a new chat about it
  useEffect(() => {
    if (!injectedContext || !isInitialized || sessions.length === 0) return;

    // Start a fresh session for this context
    const s = newSession();
    const label = injectedContext.label || 'this record';
    const entityType = injectedContext.entityType || 'Record';
    const query = injectedContext.query || '';
    const recordJson = JSON.stringify(injectedContext.record, null, 2);

    const displayMessage = query
      ? `I searched for "${query}" and found this ${entityType}: **${label}**. Please help me with this record.`
      : `I want to ask about this ${entityType}: **${label}**. What can you tell me about this record?`;

    setSessions(prev => [s, ...prev]);
    setActiveId(s.id);
    
    // Instead of auto-sending, populate the text box so user can refine it
    setInput(displayMessage);
    setPendingHiddenContext(recordJson);

    if (onContextConsumed) onContextConsumed();
  }, [injectedContext, isInitialized, onContextConsumed]);


  //  Action Confirmation Handlers
  const confirmPendingAction = async (action, msgIndex) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== activeId) return s;
      const msgs = [...s.messages];
      msgs[msgIndex] = { ...msgs[msgIndex], isConfirmation: false };
      return { ...s, messages: msgs };
    }));
    
    setIsLoading(true);
    try {
      const actionResults = await executeActionsAsync([action]);
      addMessages(activeId, [{ role: 'system', content: `Action Confirmed & Executed. Results:\n${actionResults.join('\n')}` }]);
      toast.success("Action confirmed");
    } finally {
      setIsLoading(false);
    }
  };

  const cancelPendingAction = (msgIndex) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== activeId) return s;
      const msgs = [...s.messages];
      msgs[msgIndex] = { ...msgs[msgIndex], isConfirmation: false };
      return { ...s, messages: msgs };
    }));
    addMessages(activeId, [{ role: 'user', content: "I cancelled that action." }]);
  };

  //  Voice 
  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error('Voice not supported. Please use Chrome or Edge.'); return; }
    
    if (isRecording) { 
      manualStopRef.current = true;
      recognitionRef.current?.stop(); 
      setIsRecording(false); 
      return; 
    }
    
    manualStopRef.current = false;
    const r = new SR();
    r.continuous = true;
    r.interimResults = false;
    r.lang = 'en-US';
    
    r.onresult = e => {
      let t = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          t += e.results[i][0].transcript;
        }
      }
      if (t) {
        setInput(prev => prev ? `${prev} ${t}` : t);
      }
    };
    
    r.onerror = (e) => { 
      if (e.error !== 'no-speech') {
        manualStopRef.current = true;
        setIsRecording(false); 
        toast.error('Voice error: ' + e.error); 
      }
    };
    
    r.onend = () => {
      if (!manualStopRef.current) {
        try { r.start(); } catch (err) { setIsRecording(false); }
      } else {
        setIsRecording(false);
      }
    };
    
    recognitionRef.current = r;
    r.start();
    setIsRecording(true);
    toast('Listening continuously...', { icon: '≡ƒÄñ', duration: 2000 });
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
    if (companyId && user?.email) {
      supabase.from('industry_records').upsert({
        id: s.id, company_id: companyId, industry: 'core', record_type: 'ai_session', search_text: user.email, data: s
      }).then();
    }
    setSessions(prev => [s, ...prev]);
    setActiveId(s.id);
    setShowHistory(false);
  };

  const deleteSession = async (sid, e) => {
    e.stopPropagation();
    if (companyId) {
      await supabase.from('industry_records').delete().eq('id', sid).eq('company_id', companyId);
    }
    setSessions(prev => {
      const rest = prev.filter(s => s.id !== sid);
      if (rest.length === 0) {
        const fresh = newSession();
        if (companyId && user?.email) {
          supabase.from('industry_records').upsert({
            id: fresh.id, company_id: companyId, industry: 'core', record_type: 'ai_session', search_text: user.email, data: fresh
          }).then();
        }
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
    <div className={`flex h-full shrink-0 border-l-[3px] border-l-primary bg-card z-40 transition-all duration-300 ${isOpen ? (isExpanded ? 'w-[680px] opacity-100' : 'w-[400px] opacity-100') : 'w-0 opacity-0 overflow-hidden border-none pointer-events-none'}`}>
      {/*  History Sidebar  */}
      {showHistory && (
        <div className="w-52 shrink-0 border-r border-border bg-muted/20 flex flex-col">
          <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t("chat_history", "Chat History")}</span>
            <div className="flex items-center gap-1">
              <button onClick={startNewChat} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary transition-colors" title="New chat">
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-muted rounded text-muted-foreground transition-colors" title="Close history">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.map(s => {
              return (
                <div
                  key={s.id}
                  onClick={() => { setActiveId(s.id); setShowHistory(false); }}
                  className={`group relative flex items-start gap-2 p-2 rounded-lg cursor-pointer text-left transition-colors ${
                    s.id === activeId
                      ? 'bg-slate-50 dark:bg-primary/30 border border-primary/20 dark:border-slate-200'
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
              );
            })}
          </div>
        </div>
      )}
      {/*  Main Panel  */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-gradient-to-r from-primary/8 to-primary/5 shrink-0">
          <button
            onClick={() => setShowHistory(prev => !prev)}
            className={`p-1.5 rounded-md transition-colors shrink-0 ${showHistory ? 'bg-slate-100 dark:bg-primary/40 text-primary dark:text-primary/70' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            title="Chat history"
          >
            <Clock className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-primary/20 text-primary shrink-0">
              <OrbitIcon className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5 flex-1">
              <p className="text-[11px] font-bold text-foreground leading-none">{t("orbit", "OrbitFlow")}</p>
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
        <div className="px-3 py-1.5 flex items-center gap-1.5 bg-primary/60 dark:bg-slate-100 border-b border-slate-200 dark:border-primary/20 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></div>
          <span className="text-[10px] text-primary dark:text-primary/70 font-semibold truncate">
            {ctx ? `${ctx.suite}  ${ctx.title}` : location.pathname}  {t("ai_has_full_context", "AI has full context")}
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(circle,#1e293b_1px,transparent_1px)] [background-size:18px_18px]">
          <div className="absolute inset-0 bg-card/65 pointer-events-none z-0"></div>
          <div className="relative z-10 space-y-4">
            {messages.filter(m => m.role !== 'system').map((msg, i) => {
              return (
                <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      : 'bg-gradient-to-br from-primary to-primary text-white'
                  }`}>
                    {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                  </div>
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm max-w-[88%] ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-sm'
                      : 'bg-card border border-border rounded-tl-sm text-foreground'
                  }`}>
                    <FormatMessage content={msg.content} />
                    
                    {msg.isConfirmation && msg.pendingAction && (
                      <div className="mt-3 flex gap-2 pt-3 border-t border-border">
                        <button 
                          onClick={() => confirmPendingAction(msg.pendingAction, i)}
                          className="bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3 h-3" /> {t("continue_action", "Continue Action")}
                        </button>
                        <button 
                          onClick={() => cancelPendingAction(i)}
                          className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-border shadow-sm"
                        >
                          {t("cancel", "Cancel")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-white animate-spin" />
                </div>
                <div className="px-4 py-3 bg-card border border-border rounded-2xl rounded-tl-sm shadow-sm">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5 italic">{t("orbit_is_thinking", "OrbitFlow is thinking...")}</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Contextual Suggestions */}
        {!isLoading && messages.length <= 1 && (
          <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
            {(PAGE_SUGGESTIONS[location.pathname] || PAGE_SUGGESTIONS['/']).map((s, i) => {
              return (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-slate-50 dark:bg-primary/30 text-primary/90 dark:text-primary/70 border border-slate-200 dark:border-primary/40 hover:bg-slate-100 dark:hover:bg-primary/40 transition-colors truncate max-w-[180px]"
                >
                  {s}
                </button>
              );
            })}
          </div>
        )}

        {/* Attached File Preview */}
        {uploadedFile && (
          <div className="mx-3 mb-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-primary/20 border border-primary/20 dark:border-primary/40 flex items-center gap-2 shrink-0">
            {uploadedFile.type === 'image'
              ? <Image className="w-4 h-4 text-primary shrink-0" />
              : <FileText className="w-4 h-4 text-primary shrink-0" />}
            <span className="text-xs font-medium text-primary/90 dark:text-primary/70 flex-1 truncate">{uploadedFile.name}</span>
            <button onClick={() => setUploadedFile(null)} className="text-muted-foreground hover:text-red-500 transition-colors shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-border bg-card/80 backdrop-blur-sm shrink-0">
          <div className="border border-border focus-within:border-primary/70 focus-within:ring-2 focus-within:ring-primary/15 rounded-xl bg-background transition-all overflow-hidden shadow-sm">
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
                  className="p-1.5 text-muted-foreground hover:text-primary hover:bg-slate-50 dark:hover:bg-primary/30 rounded-md transition-colors"
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
                      : 'text-muted-foreground hover:text-primary hover:bg-slate-50 dark:hover:bg-primary/30'
                  }`}
                  title={isRecording ? 'Stop recording' : 'Voice input'}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider hidden sm:block"> {t("send_shift_newline", "Send  Shift+ Newline")}</span>
                <button
                  type="button"
                  disabled={(!input.trim() && !uploadedFile) || isLoading}
                  onClick={() => handleSend()}
                  className="h-8 w-8 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-colors shadow-sm"
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
