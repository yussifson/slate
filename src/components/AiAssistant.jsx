import { supabase} from '@/api/supabaseClient';
import { useTranslation} from "react-i18next";
import React, { useState, useRef, useEffect, useCallback} from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate} from 'react-router-dom';
import { Sparkles, MessageSquare, X, Send, Bot, User, Maximize2, Minimize2, Plus, Clock, Mic, MicOff, Paperclip, Trash2, FileText, Image, Square, Menu, MoreHorizontal } from 'lucide-react';
import { Button} from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { generateText, analyzeImage} from '@/lib/cloudflareAI';
import { toast} from 'react-hot-toast';
import { useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { useCompanyId} from '@/hooks/useCompanyId';
import { useQueryClient} from '@tanstack/react-query';
import { base44} from '@/api/base44Client';
import { powerSync} from "@/api/PowerSyncConnector";
import { OrbitIcon} from '@/components/ui/OrbitIcon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useAuth} from '@/lib/AuthContext';


const PAGE_SUGGESTIONS = {
   '/patients': ['List all patients admitted today', 'Create a new patient record', 'Show patients with pending lab results'],
   '/appointments':['Schedule an appointment for tomorrow', 'List today\'s appointments', 'Find upcoming appointments this week'],
   '/wards': ['Show all occupied beds', 'Assign patient to a bed in Ward A', 'List available beds'],
   '/cases': ['Show all open cases', 'Create a new case', 'Find cases assigned to me'],
   '/tasks': ['Show my pending tasks', 'Create an urgent task', 'Mark overdue tasks'],
   '/employees': ['List all active employees', 'Add a new employee', 'Show employees on leave'],
   '/payroll': ['Generate payroll for this month', 'Show pending payslips', 'Calculate overtime'],
   '/students': ['Show students with missing fees', 'Add a new student', 'Find students by class'],
   '/inventory': ['Show low stock items', 'Add a new product', 'Find products below reorder level'],
   '/claims': ['List pending claims', 'Create a new claim', 'Show high-value claims this month'],
   '/': ['Give me a summary of today\'s activity', 'Show key metrics', 'What needs my attention today?']
};

// Page Context Map 
const PAGE_CONTEXT = {
  '/': { title: 'Dashboard', suite: 'Core', desc: 'main dashboard with KPIs and quick actions'},
  '/cases': { title: 'Cases', suite: 'Legal', desc: 'legal case management list'},
  '/clients': { title: 'Clients', suite: 'Core', desc: 'client management'},
  '/calendar': { title: 'Calendar', suite: 'Core', desc: 'appointments and events calendar'},
  '/invoices': { title: 'Invoices', suite: 'Billing', desc: 'invoice management'},
  '/tasks': { title: 'Tasks', suite: 'Core', desc: 'task management'},
  '/documents': { title: 'Documents', suite: 'Core', desc: 'document library'},
  '/leads': { title: 'Leads', suite: 'CRM', desc: 'sales lead pipeline'},
  '/billing': { title: 'Billing', suite: 'Billing', desc: 'billing dashboard'},
  
  // Hospital
  '/patients': { title: 'Patients', suite: 'Hospital', desc: 'patient records'},
  '/appointments': { title: 'Appointments', suite: 'Hospital', desc: 'appointment scheduling'},
  '/wards': { title: 'Wards', suite: 'Hospital', desc: 'hospital ward management'},
  '/prescriptions': { title: 'Prescriptions', suite: 'Hospital', desc: 'prescription management'},
  '/lab-results': { title: 'Lab Results', suite: 'Hospital', desc: 'lab results and diagnostics'},
  '/pharmacy': { title: 'Pharmacy', suite: 'Hospital', desc: 'pharmacy inventory and dispensing'},
  '/telemedicine': { title: 'Telemedicine', suite: 'Hospital', desc: 'virtual consultations'},
  '/operation-theater': { title: 'Operation Theater', suite: 'Hospital', desc: 'surgery scheduling'},
  '/radiology': { title: 'Radiology', suite: 'Hospital', desc: 'imaging and scans'},
  '/ambulance-dispatch': { title: 'Ambulance Dispatch', suite: 'Hospital', desc: 'emergency fleet'},
  
  // School
  '/students': { title: 'Students', suite: 'School', desc: 'student management'},
  '/classes': { title: 'Classes', suite: 'School', desc: 'class management'},
  '/timetable': { title: 'Timetable', suite: 'School', desc: 'academic scheduling'},
  '/grades': { title: 'Grades', suite: 'School', desc: 'student grades'},
  '/attendance': { title: 'Attendance', suite: 'School', desc: 'attendance tracking'},
  '/exams': { title: 'Exams', suite: 'School', desc: 'examination management'},
  '/fees': { title: 'Fees', suite: 'School', desc: 'student fee collection'},
  '/library': { title: 'Library', suite: 'School', desc: 'book inventory and loans'},
  '/gamification': { title: 'Gamification', suite: 'School', desc: 'student rewards'},
  
  // Religion
  '/members': { title: 'Members', suite: 'Religion', desc: 'religion member directory'},
  '/donations': { title: 'Donations', suite: 'Religion', desc: 'donation and offering records'},
  '/groups': { title: 'Groups', suite: 'Religion', desc: 'ministry groups'},
  '/events': { title: 'Events', suite: 'Religion', desc: 'church events'},
  '/volunteers': { title: 'Volunteers', suite: 'Religion', desc: 'volunteer scheduling'},
  '/sermons': { title: 'Sermons', suite: 'Religion', desc: 'sermon audio/video library'},
  '/prayers': { title: 'Prayers', suite: 'Religion', desc: 'prayer requests'},
  '/milestones': { title: 'Milestones', suite: 'Religion', desc: 'baptisms, weddings, etc'},
  
  // HR
  '/employees': { title: 'Employees', suite: 'HR', desc: 'HR employee management'},
  '/payroll': { title: 'Payroll', suite: 'HR', desc: 'payroll processing'},
  '/recruitment': { title: 'Recruitment', suite: 'HR', desc: 'job applications and hiring'},
  '/hr-leave': { title: 'Leave', suite: 'HR', desc: 'leave requests'},
  
  // Logistics
  '/shipments': { title: 'Shipments', suite: 'Logistics', desc: 'shipment tracking'},
  '/fleet': { title: 'Fleet', suite: 'Logistics', desc: 'vehicle fleet management'},
  '/drivers': { title: 'Drivers', suite: 'Logistics', desc: 'driver management'},
  '/warehouse': { title: 'Warehouse', suite: 'Logistics', desc: 'inventory storage'},
  '/route-optimization': { title: 'Route Optimization', suite: 'Logistics', desc: 'AI route planning'},
  
  // Retail
  '/inventory': { title: 'Inventory', suite: 'Retail', desc: 'product inventory'},
  '/orders': { title: 'Sales Orders', suite: 'Retail', desc: 'sales orders'},
  '/pos': { title: 'Point of Sale', suite: 'Retail', desc: 'retail POS system'},
  '/purchase-orders': { title: 'Purchase Orders', suite: 'Retail', desc: 'supplier orders'},
  '/promotions': { title: 'Promotions', suite: 'Retail', desc: 'discounts and campaigns'},
  
  // Hotel
  '/front-desk': { title: 'Front Desk', suite: 'Hotel', desc: 'guest check-in/out'},
  '/reservations': { title: 'Reservations', suite: 'Hotel', desc: 'booking management'},
  '/rooms': { title: 'Rooms', suite: 'Hotel', desc: 'room status and inventory'},
  '/housekeeping': { title: 'Housekeeping', suite: 'Hotel', desc: 'cleaning schedules'},
  '/restaurant': { title: 'Restaurant', suite: 'Hotel', desc: 'dining POS'},
  
  // Insurance
  '/policies': { title: 'Policies', suite: 'Insurance', desc: 'insurance policies'},
  '/claims': { title: 'Claims Processing', suite: 'Insurance', desc: 'insurance claims list'},
  '/premiums': { title: 'Premiums', suite: 'Insurance', desc: 'premium payment tracking'},
  '/underwriting': { title: 'Underwriting', suite: 'Insurance', desc: 'underwriting applications'},
  '/agent-performance': { title: 'Agent Performance', suite: 'Insurance', desc: 'insurance agent metrics'}
};

// Parse Agent Actions 
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
 return { cleanText, actions};
}

// Format message with simple markdown 
function FormatMessage({ content}) {
 return (
 <div className="prose prose-sm dark:prose-invert max-w-none break-words [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mt-1 [&>ul]:mb-2 [&>ol]:mt-1 [&>ol]:mb-2 [&>ul]:pl-4 [&>ol]:pl-4">
 <ReactMarkdown remarkPlugins={[remarkGfm]}>
 {content}
 </ReactMarkdown>
 </div>
 );
}
// Session Storage (Fallback/Types)
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

function newSession() {
 return {
 id: generateId(),
 title: 'New Chat',
 createdAt: new Date().toISOString(),
 messages: [{
 role: 'assistant',
 content: "Hello! I'm **Orbit** 👋\n\nI can help you:\n Navigate the app\n Create, edit & manage records\n Analyze data on any page\n Answer any question\n\nYou can also use your **🎙️ voice** or **📎 upload files** (images, PDFs, CSV, etc.)\n\nWhat would you like to do?"
 }]
 };
}

// Main Component 
export default function GlobalAIAssistant({ isOpen = false, onClose, injectedContext = null, onContextConsumed}) {
 const { t} = useTranslation();
 const { user} = useAuth();
 const PORTAL_ROLES = ['client', 'patient', 'guest', 'parent', 'student', 'learner', 'trainee', 'customer', 'policyholder', 'member', 'tenant', 'landlord', 'employee'];
 const isPortalUser = PORTAL_ROLES.includes(user?.role?.toLowerCase());
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
 const [isExpanded, setIsExpanded] = useState(false);
 const [uploadedFile, setUploadedFile] = useState(null);
 const [pendingHiddenContext, setPendingHiddenContext] = useState(null);
 const [chatMode, setChatMode] = useState('chat');
 const [automationRegistries, setAutomationRegistries] = useState({ triggers: [], actions: [] });

 const [originalInputBeforeVoice, setOriginalInputBeforeVoice] = useState('');
 const messagesEndRef = useRef(null);
 const fileInputRef = useRef(null);
 const inputRef = useRef(null);
 
 useEffect(() => {
   if (!isLoading && inputRef.current) {
     inputRef.current.focus();
   }
 }, [isLoading]);

 const { isListening: isRecording, hasSupport, toggleListening, stopListening } = useSpeechRecognition({
   onTranscript: (transcript) => {
     setInput(originalInputBeforeVoice + ' ' + transcript);
   }
 });

 const handleMicToggle = () => {
   if (!isRecording) {
     setOriginalInputBeforeVoice(input.trim());
   }
   toggleListening();
 };

 useEffect(() => {
 if (!companyId || !user?.email || isInitialized) return;
 const loadSessions = async () => {
 const { data} = await supabase
 .from('industry_records')
 .select('*')
 .eq('company_id', companyId)
 .eq('record_type', 'ai_session')
 .eq('search_text', user.email)
 .order('created_at', { ascending: false});
 
 if (data && data.length > 0) {
  const loadedSessions = data.map(d => ({ ...(d.data || {}), id: d.id }));
  setSessions(loadedSessions);
  setActiveId(loadedSessions[0].id);
} else {
 const s = newSession();
 setSessions([s]);
 setActiveId(s.id);
 (async () => {
 const _payload = { id: s.id, company_id: companyId, industry: 'core', record_type: 'ai_session', search_text: user.email, data: s};
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const existing = await powerSync.getOptional('SELECT id FROM industry_records WHERE id = ?', [_payload.id]);
        if (existing) {
          await powerSync.execute(`UPDATE industry_records SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, _payload.id]);
        } else {
          await powerSync.execute(`INSERT INTO industry_records (${_keys.join(', ')}) VALUES (${_keys.map(()=>'?').join(', ')})`, _vals);
        }
})();
}

 // Pre-load automation registries
 const { data: triggers } = await supabase.from('automation_triggers').select('trigger_key, display_name, data_schema').eq('is_active', true);
 const { data: actions } = await supabase.from('automation_actions').select('action_key, display_name, input_schema').eq('is_active', true);
 if (triggers && actions) setAutomationRegistries({ triggers, actions });

 setIsInitialized(true);
};
 loadSessions();
}, [companyId, user?.email, isInitialized]);

 const activeSession = sessions.find(s => s.id === activeId) || sessions[0];
 const messages = activeSession?.messages || [];

 useEffect(() => {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth'});
}, [messages]);



 const addMessages = useCallback((sid, newMsgs) => {
 setSessions(prev => {
 const updated = prev.map(s => {
 if (s.id !== sid) return s;
 const upMsgs = [...(s.messages || []), ...newMsgs];
 const firstUser = upMsgs.find(m => m.role === 'user');
 const title = firstUser
 ? firstUser.content.replace(/\[Attached:.*?\]/g, '').trim().slice(0, 42)
 : s.title;
 const newS = { ...s, messages: upMsgs, title: title || 'New Chat'};
 
 if (companyId && user?.email) {
 (async () => {
 const _payload = {
 id: newS.id, company_id: companyId, industry: 'core', record_type: 'ai_session', search_text: user.email, data: newS
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
  const entityMap = { 'case': 'LegalCase', 'client': 'Client', 'lead': 'Lead', 'staff': 'StaffRecord', 'invoice': 'Invoice', 'task': 'Task', 'automation_rule': 'AutomationRule'};
  const entityName = entityMap[rt];
  const q = (action.query || '').toLowerCase();
  if (entityName) {
  const records = await base44.entities[entityName].list();
  const found = records.filter(r => JSON.stringify(r).toLowerCase().includes(q)).slice(0, 10);
  const simplified = found.map(r => ({ "**ID_REQUIRED_FOR_UPDATES**": r.id, ...r}));
  results.push(`Search results for ${rt} matching "${q}":\n` + JSON.stringify(simplified));
 } else {
  const records = await powerSync.getAll(`SELECT * FROM industry_records WHERE company_id = ? AND record_type = ?`, [companyId, rt]);
  const parsedRecords = records.map(r => ({ id: r.id, status: r.status, ...JSON.parse(r.data || '{}') }));
  const found = parsedRecords.filter(r => JSON.stringify(r).toLowerCase().includes(q)).slice(0, 10);
  const simplified = found.map(r => ({ "**ID_REQUIRED_FOR_UPDATES**": r.id, ...r}));
  results.push(`Search results for ${rt} matching "${q}":\n` + JSON.stringify(simplified));
 }
  break;
 }
 case 'remember': {
 if (action.fact) {
 await mutateRecord.mutateAsync({
 id: generateId(),
 recordType: 'ai_memory',
 payload: { fact: action.fact, user: user?.email},
 status: 'active',
 searchText: `${user?.email} ${action.fact}`
});
 results.push(`Fact successfully committed to long-term memory.`);
}
 break;
}
 case 'search_memory': {
 const { data: mems} = await supabase
 .from('industry_records')
 .select('*')
 .eq('company_id', companyId)
 .eq('record_type', 'ai_memory')
 .ilike('search_text', `%${user?.email}%`);
 
 if (mems && mems.length > 0) {
  const matched = mems
  .filter(m => (m.data?.fact || '').toLowerCase().includes((action.query || '').toLowerCase()))
  .map(m => m.data?.fact);
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
 toast(action.message || 'Done!', { icon: ''});
 results.push(`Toast shown`);
 break;
 case 'create_record':
 case 'update_record': {
  if (action.tool === 'update_record' && !action.id) {
    results.push(`Error: update_record requires an 'id'. You MUST use 'search_records' first to find the ID of the record you want to update.`);
    break;
  }
  if (action.recordType && action.payload) {
  const rt = action.recordType?.toLowerCase() || '';
  const isCore = ['case', 'client', 'lead', 'staff', 'invoice', 'task', 'automation_rule'].includes(rt);
  if (isCore) {
  const entityMap = { 'case': 'LegalCase', 'client': 'Client', 'lead': 'Lead', 'staff': 'StaffRecord', 'invoice': 'Invoice', 'task': 'Task', 'automation_rule': 'AutomationRule'};
  const entityName = entityMap[rt];
  const p = { ...action.payload, company_id: companyId};
  if (action.tool === 'create_record' && !p.status) p.status = 'open';

  const res = action.tool === 'update_record'
  ? await base44.entities[entityName].update(action.id, p)
  : await base44.entities[entityName].create(p);

 queryClient.invalidateQueries({ queryKey: [rt + 's']});
 queryClient.invalidateQueries({ queryKey: ['cases']});
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
  if (!action.id) {
    results.push(`Error: delete_record requires an 'id'. You MUST use 'search_records' first to find the ID of the record you want to delete.`);
    break;
  }
  if (action.id && action.recordType) {
  const rt = action.recordType?.toLowerCase() || '';
  const isCore = ['case', 'client', 'lead', 'staff', 'invoice', 'task', 'automation_rule'].includes(rt);
 if (isCore) {
 const entityMap = { 'case': 'LegalCase', 'client': 'Client', 'lead': 'Lead', 'staff': 'StaffRecord', 'invoice': 'Invoice', 'task': 'Task'};
 const entityName = entityMap[rt];
 await base44.entities[entityName].delete(action.id);
 queryClient.invalidateQueries({ queryKey: [rt + 's']});
 queryClient.invalidateQueries({ queryKey: ['cases']});
 results.push(`Success: deleted ${rt} with ID ${action.id}`);
} else {
 await deleteRecord.mutateAsync({ id: action.id, recordType: rt});
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

 addMessages(sid, [{ role: 'user', content: userContent, hiddenContext: actualHiddenContext}]);
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
 const ctx = PAGE_CONTEXT[location.pathname] || { title: 'Unknown', suite: 'Unknown'};
  let modeContext = '';
  if (chatMode === 'flow') {
    modeContext = '\nCRITICAL MODE ACTIVE: You are in FLOW BUILDER mode. Focus strictly on designing workflows, suggesting step-by-step logic, and helping the user orchestrate system architectures. Ignore casual chat unless it pertains to flow building.';
  } else if (chatMode === 'automation') {
    modeContext = `\nCRITICAL MODE ACTIVE: You are in AUTOMATION mode. You MUST use ONLY the verified triggers and actions from the registry below. Do NOT hallucinate triggers or actions!
    
VERIFIED TRIGGERS:
${JSON.stringify(automationRegistries.triggers)}

VERIFIED ACTIONS:
${JSON.stringify(automationRegistries.actions)}

To create an automation, use the \`create_record\` tool with recordType "automation". The payload MUST match the new registry:
- name: String
- description: String
- trigger_key: MUST be exactly one of the verified trigger_keys
- steps: Array of objects [{ "action_key": "VERIFIED_ACTION_KEY", "config": { ...inputs matching input_schema... } }]
- trigger_filters: Array of objects [{ "field": "...", "operator": "equals", "value": "..." }]
- is_active: true
`;
  }

  let verticalPersona = "";
  switch(ctx.suite) {
    case 'Hospital': verticalPersona = "You are assisting in a Healthcare environment. Be highly precise, prioritize patient safety, use professional medical terminology, and strictly adhere to HIPAA privacy standards."; break;
    case 'School': verticalPersona = "You are assisting in an Educational environment. Be encouraging, focus on student success, understand academic calendars, and be helpful to teachers and administrators."; break;
    case 'Legal': verticalPersona = "You are assisting in a Legal environment. Be highly formal, prioritize strict confidentiality, use precise legal terminology, and track deadlines relentlessly."; break;
    case 'Logistics': verticalPersona = "You are assisting in a Logistics environment. Focus on efficiency, track timelines, manage supply chain terminology, and prioritize delivery success."; break;
    case 'Retail': verticalPersona = "You are assisting in a Retail environment. Focus on sales metrics, customer satisfaction, inventory turnover, and point-of-sale efficiency."; break;
    case 'Hotel': verticalPersona = "You are assisting in a Hospitality environment. Be extremely polite, focus on guest satisfaction, manage bookings efficiently, and prioritize service quality."; break;
    case 'Religion': verticalPersona = "You are assisting in a Religious/Community environment. Be deeply empathetic, respectful, focus on community engagement, and manage pastoral care delicately."; break;
    case 'HR': verticalPersona = "You are assisting in a Human Resources environment. Maintain strict confidentiality regarding employee data, be highly professional, and focus on compliance and employee well-being."; break;
    case 'Insurance': verticalPersona = "You are assisting in an Insurance environment. Be analytical, focus on risk assessment, use precise actuarial terminology, and handle claims with accuracy."; break;
    default: verticalPersona = "You are assisting in a professional business environment. Be efficient, analytical, and highly capable.";
  }

  const systemPrompt = `You are OrbitFlow — a highly enthusiastic, intelligent, and entertaining AI workflow engineer embedded in Slate SaaS.
Your personality is that of a powerful but friendly AI companion—think of a hyper-intelligent digital lion/owl hybrid! Be cheerful, slightly playful, use emojis naturally, but remain highly capable and laser-focused on orchestrating the user's workflows flawlessly.
Your current context is the ${ctx.suite} suite, specifically the '${ctx.title}' page.

${verticalPersona}
${modeContext}

CRITICAL INSTRUCTIONS:
- You are a Workflow Engineer. You can orchestrate complex chains of tasks and build powerful AUTOMATIONS across the system.
- You have Long-Term Memory. You can remember facts about the user across sessions. Always check your memory or save important details when asked.
- The user is currently on page: ${location.pathname}

EXACT VERIFIED ROUTE MAP — ALWAYS USE THESE EXACT PATHS FOR navigate_to. NEVER GUESS OR INVENT PATHS:
# Core / Legal
/ → Dashboard
/cases → Cases
/clients → Clients
/calendar → Calendar
/invoices → Invoices
/tasks → Tasks
/documents → Documents
/team → Team
/settings → Settings
/client-portal → Client Portal
/leads → Leads
/billing → Billing

# School
/students → Students
/classes → Classes
/timetable → Timetable
/attendance → Attendance
/grades → Grades
/exams → Exams
/fees → Fee Management
/library → Library
/gamification → Gamification
/parent-portal → Parent Portal

# Hospital
/patients → Patients
/appointments → Appointments
/wards → Wards
/prescriptions → Prescriptions
/lab-results → Lab Results
/pharmacy → Pharmacy
/telemedicine → Telemedicine
/operation-theater → Operation Theater
/radiology → Radiology
/ambulance-dispatch → Ambulance Dispatch

# Hotel
/front-desk → Front Desk
/reservations → Reservations
/rooms → Rooms
/housekeeping → Housekeeping
/restaurant → Restaurant
/guest-requests → Guest Requests

# Religion
/members → Members
/groups → Groups
/events → Events
/donations → Donations
/volunteers → Volunteers
/sermons → Sermons
/small-groups → Small Groups
/prayers → Prayers
/milestones → Milestones

# Insurance
/policies → Policies
/claims → Claims
/premiums → Premiums
/underwriting → Underwriting
/agent-performance → Agent Performance
/reinsurance → Reinsurance

# Retail
/inventory → Inventory
/purchase-orders → Purchase Orders
/promotions → Promotions
/orders → Orders
/suppliers → Suppliers
/pos → Point of Sale
/retail-customers → Customers

# Logistics
/shipments → Shipments
/fleet → Fleet
/drivers → Drivers
/warehouse → Warehouse
/route-optimization → Route Optimization
/load-board → Load Board
/geofence-alerts → Geofence Alerts
/smart-docs → Smart Docs

# HR
/employees → Employees
/recruitment → Recruitment
/payroll → Payroll
/hr-leave → HR Leave

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

RULES FOR MULTI-STEP REASONING & AUTOMATIONS:
1. NEVER explain how the user can do something. YOU MUST do it for them.
2. THE UPDATE PROTOCOL: If you are asked to edit/update a record (like a product price), you MUST first output a search_records tool call. Read the search results, extract the "**ID_REQUIRED_FOR_UPDATES**", and then output the update_record tool call using that exact ID. NEVER call update_record without searching first!
3. When asked to CREATE a record, create the record and STOP. DO NOT use navigate_to to show the record.
4. If asked to create an ENTIRE NEW MODULE, custom feature, or a page that does NOT exist in the ROUTE MAP, you MUST use navigate_to to route the user to "/slate/BOLT" AND use show_toast to tell them: "I can help you build this! Just click 'Generate with AI' on this page."
5. ONLY use navigate_to for routes that EXACTLY appear in the ROUTE MAP above, plus "/slate/BOLT".
6. To create an AUTOMATION, use the \`create_record\` tool with recordType "automation". (See AUTOMATION mode context if active). If creating legacy automations, adapt to the new "automation" table schema instead of "automation_rule".
7. For 'case' records, use 'title' instead of 'name'.
8. If the user's input has a typo, is ambiguous, or if you are unsure which page they mean, ALWAYS use the 'ask_confirmation' tool first.
9. If the user asks for multiple distinct actions (e.g. "create a task and a lead"), ensure you output an <AGENT_ACTION> block for EACH request before summarizing.
10. Sound friendly and entertaining in your text response!`;


 const sessionMessages = currentSessions.find(s => s.id === sid)?.messages || [];
 const allMessages = [...sessionMessages, { role: 'user', content: userContent}];
 let apiMessages = [
 { role: 'system', content: systemPrompt},
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
 
 apiMessages.push({ role: 'assistant', content: responseText});
 apiMessages.push({ role: 'system', content: `Action Results:\n${actionResults.join('\n')}`});
}

 if (finalCleanText) {
  addMessages(sid, [{ role: 'assistant', content: finalCleanText}]);
 } else if (stepCount > 1) {
  addMessages(sid, [{ role: 'assistant', content: "I've completed those actions for you!"}]);
 } else {
  addMessages(sid, [{ role: 'assistant', content: "I'm sorry, I encountered an issue processing that. Could you try again?"}]);
 }
 }
} catch (err) {
 addMessages(sid, [{ role: 'assistant', content: "Error: " + err.message + ". Please try again."}]);
} finally {
 setIsLoading(false);
}
}, [input, uploadedFile, activeId, sessions, addMessages, getPageContext, companyId, queryClient, navigate, location.pathname, executeActionsAsync, chatMode]);

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


 // Action Confirmation Handlers
 const confirmPendingAction = async (action, msgIndex) => {
 setSessions(prev => prev.map(s => {
 if (s.id !== activeId) return s;
 const msgs = [...(s.messages || [])];
 msgs[msgIndex] = { ...msgs[msgIndex], isConfirmation: false};
 return { ...s, messages: msgs};
}));
 
 setIsLoading(true);
 try {
 const actionResults = await executeActionsAsync([action]);
 addMessages(activeId, [{ role: 'system', content: `Action Confirmed & Executed. Results:\n${actionResults.join('\n')}`}]);
 toast.success("Action confirmed");
} finally {
 setIsLoading(false);
}
};

 const cancelPendingAction = (msgIndex) => {
 setSessions(prev => prev.map(s => {
 if (s.id !== activeId) return s;
 const msgs = [...(s.messages || [])];
 msgs[msgIndex] = { ...msgs[msgIndex], isConfirmation: false};
 return { ...s, messages: msgs};
}));
 addMessages(activeId, [{ role: 'user', content: "I cancelled that action."}]);
};

 // File Upload 
 const handleFileUpload = async e => {
 const file = e.target.files?.[0];
 if (!file) return;
 e.target.value = '';
 if (file.size > 10 * 1024 * 1024) { toast.error('File too large (max 10MB)'); return;}

 if (file.type.startsWith('image/')) {
 const bytes = new Uint8Array(await file.arrayBuffer());
 setUploadedFile({ name: file.name, type: 'image', bytes});
 toast.success(`Image ready: ${file.name}`);
} else {
 const text = await file.text();
 setUploadedFile({ name: file.name, type: 'text', content: text});
 toast.success(`File ready: ${file.name}`);
}
};

 // Session Management 
 const startNewChat = () => {
 const s = newSession();
 if (companyId && user?.email) {
 (async () => {
 const _payload = { id: s.id, company_id: companyId, industry: 'core', record_type: 'ai_session', search_text: user.email, data: s};
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const existing = await powerSync.getOptional('SELECT id FROM industry_records WHERE id = ?', [_payload.id]);
        if (existing) {
          await powerSync.execute(`UPDATE industry_records SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, _payload.id]);
        } else {
          await powerSync.execute(`INSERT INTO industry_records (${_keys.join(', ')}) VALUES (${_keys.map(()=>'?').join(', ')})`, _vals);
        }
})();
}
 setSessions(prev => [s, ...prev]);
 setActiveId(s.id);
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
 const fresh = newSession();
 if (companyId && user?.email) {
 (async () => {
 const _payload = { id: fresh.id, company_id: companyId, industry: 'core', record_type: 'ai_session', search_text: user.email, data: fresh};
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const existing = await powerSync.getOptional('SELECT id FROM industry_records WHERE id = ?', [_payload.id]);
        if (existing) {
          await powerSync.execute(`UPDATE industry_records SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, _payload.id]);
        } else {
          await powerSync.execute(`INSERT INTO industry_records (${_keys.join(', ')}) VALUES (${_keys.map(()=>'?').join(', ')})`, _vals);
        }
})();
}
 setActiveId(fresh.id);
 return [fresh];
}
 if (activeId === sid) setActiveId(rest[0].id);
 return rest;
});
};

 const ctx = PAGE_CONTEXT[location.pathname];

 // Render 
 const content = (
 <>
 {/* Mobile Backdrop */}
 {isOpen && (
 <div className="md:hidden fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-[2px] transition-opacity" onClick={onClose} />
 )}
 
 <div 
 className={`flex bg-white dark:bg-[#0A0F1C] z-[70] transition-all duration-300 overflow-hidden ${
 // Mobile: Bottom Sheet
 isOpen ? "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:h-[85vh] max-md:rounded-t-[32px] max-md:flex-col max-md:pb-[env(safe-area-inset-bottom)] max-md:translate-y-0 max-md:opacity-100 max-md:shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:max-md:shadow-[0_-10px_40px_rgba(0,0,0,0.5)]" : "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:h-0 max-md:translate-y-full max-md:opacity-0 max-md:pointer-events-none"
 } ${
 // Desktop: Side Panel
 isOpen ? (isExpanded ? "md:relative md:h-full md:shrink-0 md:w-[680px] md:opacity-100 md:border-l-2 md:border-l-primary/30 shadow-[-12px_0_40px_rgba(0,0,0,0.04)] dark:shadow-[-12px_0_40px_rgba(0,0,0,0.3)]" : "md:relative md:h-full md:shrink-0 md:w-[420px] md:opacity-100 md:border-l-2 md:border-l-primary/30 shadow-[-12px_0_40px_rgba(0,0,0,0.04)] dark:shadow-[-12px_0_40px_rgba(0,0,0,0.3)]") : "md:h-full md:w-0 md:opacity-0 md:border-none md:pointer-events-none"
 }`}
 >
 {/* Mobile Drag Handle */}
 <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0">
 <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-secondary" />
 </div>
 
 {/* Main Content Wrapper (Needs flex row on desktop, flex col on mobile if history is open) */}
 <div className="flex h-full w-full">
 {/* History Sidebar */}
 {showHistory && (
 <div className="w-52 max-md:w-full max-md:absolute max-md:inset-0 max-md:z-50 shrink-0 border-r border-primary/40 bg-muted/20 max-md:bg-white dark:max-md:bg-[#0A0F1C] flex flex-col">
 <div className="px-3 py-2.5 border-b border-primary/40 flex items-center justify-between">
 <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("chat_history", "Chat History")}</span>
 <div className="flex items-center gap-2">
 <button onClick={startNewChat} className="p-1 hover:bg-muted rounded-md text-[#71717a] dark:text-gray-400 hover:text-primary transition-colors" title="New chat">
 <Plus className="w-3.5 h-3.5" />
 </button>
 <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-muted rounded-md text-[#71717a] dark:text-gray-400 transition-colors" title="Close history">
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-primary">
 {sessions.map(s => {
 return (
 <div
 key={s.id}
 onClick={() => { setActiveId(s.id); setShowHistory(false);}}
 className={`group relative flex items-start gap-2 p-2 rounded-xl cursor-pointer text-left transition-colors ${
 s.id === activeId
 ? 'bg-slate-50 dark:bg-primary/30 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 dark:border-primary/40'
 : 'hover:bg-muted/70'
}`}
 >
 <Clock className="w-3 h-3 mt-0.5 text-[#71717a] dark:text-gray-400 shrink-0" />
 <div className="flex-1 min-w-0">
 <p className="text-[11px] font-medium text-foreground truncate leading-tight">{s.title}</p>
 <p className="text-[10px] text-[#71717a] dark:text-gray-400 mt-0.5">
 {new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
<Trash2 className="w-3 h-3" />
 </button>
 </div>
 );
})}
 </div>
 </div>
 )}
 {/* Main Panel */}
 <div className="flex-1 flex flex-col min-w-0 relative">

 {/* Header — Floating Top-Right Controls Dropdown (Removes bulky top card) */}
 <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className="w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 backdrop-blur-md"
          title="OrbitFlow Options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 z-[100] shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1117] p-1.5">
        <DropdownMenuItem onClick={() => setShowHistory(prev => !prev)} className="cursor-pointer font-semibold text-xs py-2.5 rounded-lg">
          <Clock className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" /> 
          {showHistory ? t("hide_history", "Hide History") : t("chat_history", "Chat History")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={startNewChat} className="cursor-pointer font-semibold text-xs py-2.5 rounded-lg">
          <Plus className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" /> 
          {t("new_chat", "New Chat")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setIsExpanded(!isExpanded)} className="cursor-pointer font-semibold text-xs py-2.5 rounded-lg hidden md:flex">
          {isExpanded ? (
            <><Minimize2 className="w-4 h-4 mr-2 text-slate-500" /> {t("collapse", "Collapse Panel")}</>
          ) : (
            <><Maximize2 className="w-4 h-4 mr-2 text-slate-500" /> {t("expand", "Expand Panel")}</>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onClose} className="cursor-pointer font-semibold text-xs py-2.5 rounded-lg text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30">
          <X className="w-4 h-4 mr-2" /> 
          {t("close_orbitflow", "Close OrbitFlow")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <button
      onClick={onClose}
      className="w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 text-slate-400 border border-slate-200/80 dark:border-slate-700/80 shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 backdrop-blur-md"
      title="Close chat"
    >
      <X className="w-4 h-4" />
    </button>
  </div>

 {/* Messages */}
 <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 relative bg-slate-50/50 dark:bg-transparent scrollbar-primary">
 <div className="relative z-10 space-y-6">
 {messages.filter(m => m.role !== 'system').map((msg, i) => {
 return (
 <div key={i} className={`flex gap-3 max-w-full ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
 <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
 msg.role === 'user'
 ? 'bg-primary/10 text-primary border border-primary/20'
 : 'bg-emerald-600 text-white shadow-emerald-500/20'
 }`}>
 {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
 </div>
 <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed max-w-[85%] shadow-sm ${
 msg.role === 'user'
 ? 'bg-primary text-primary-foreground rounded-tr-sm'
 : 'bg-white dark:bg-[#131A2B] border border-slate-100 dark:border-white/5 rounded-tl-sm text-slate-700 dark:text-foreground'
 }`}>
 <FormatMessage content={msg.content} />
 
 {msg.isConfirmation && msg.pendingAction && (
 <div className="mt-3 flex gap-2 pt-3 border-t border-primary/40">
 <button 
 onClick={() => confirmPendingAction(msg.pendingAction, i)}
 className="bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2.5 tracking-[0.04em]"
 >
 <Sparkles className="w-3 h-3" /> {t("continue_action", "Continue Action")}
 </button>
 <button 
 onClick={() => cancelPendingAction(i)}
 className="bg-slate-100 dark:bg-secondary hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-foreground px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border-[0.5px] border-black/9 dark:border-white/8 border-primary/40  tracking-[0.04em]"
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
 <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary flex items-center justify-center shrink-0 ">
 <Sparkles className="w-3.5 h-3.5 text-white animate-spin" />
 </div>
 <div className="px-4 py-3 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl rounded-tl-sm  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex gap-2.5 items-center">
 <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms'}} />
 <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms'}} />
 <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms'}} />
 </div>
 <p className="text-[10px] text-[#71717a] dark:text-gray-400 mt-1.5 italic">{t("orbit_is_thinking", "OrbitFlow is thinking...")}</p>
 </div>
 </div>
 )}
 <div ref={messagesEndRef} />
 </div>
 </div>

 {/* Contextual Suggestions */}
 {!isLoading && messages.length <= 1 && (
 <div className="px-3 pb-2 flex flex-wrap gap-2.5 shrink-0">
 {(PAGE_SUGGESTIONS[location.pathname] || PAGE_SUGGESTIONS['/']).map((s, i) => {
 return (
 <button
 key={i}
 onClick={() => handleSend(s)}
 className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-slate-50 dark:bg-primary/30 text-primary/90 dark:text-primary/70 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 hover:bg-slate-100 dark:hover:bg-primary/40 transition-colors truncate max-w-[180px]"
 >
 {s}
 </button>
 );
})}
 </div>
 )}

 {/* Attached File Preview */}
 {uploadedFile && (
 <div className="mx-3 mb-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-primary/20 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 dark:border-primary/40 flex items-center gap-2 shrink-0">
 {uploadedFile.type === 'image'
 ? <Image className="w-4 h-4 text-primary shrink-0" />
 : <FileText className="w-4 h-4 text-primary shrink-0" />}
 <span className="text-xs font-medium text-primary/90 dark:text-primary/70 flex-1 truncate tracking-[0.04em]">{uploadedFile.name}</span>
 <button onClick={() => setUploadedFile(null)} className="text-[#71717a] dark:text-gray-400 hover:text-red-500 transition-colors shrink-0">
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 )}

 {/* Input */}
 <div className="p-4 bg-white/90 dark:bg-[#0A0F1C]/90 backdrop-blur-xl border-t border-slate-100 dark:border-white/5 shrink-0 relative z-10">
 <div className="relative rounded-2xl bg-slate-50 dark:bg-[#131A2B] border border-slate-200 dark:border-white/10 shadow-sm focus-within:shadow-md focus-within:border-emerald-500/50 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all duration-300 flex flex-col">
 <textarea
 ref={inputRef}
 value={input}
 onChange={e => setInput(e.target.value)}
 placeholder={isRecording ? 'Listening... speak now' : (chatMode === 'flow' ? 'Design a workflow...' : chatMode === 'automation' ? 'Build an automation...' : 'Ask anything or give a command...')}
 rows={1}
 className={`w-full bg-transparent border-none focus:ring-0 resize-none px-4 pt-4 pb-2 text-[13px] text-slate-800 dark:text-foreground outline-none leading-relaxed min-h-[56px] max-h-[200px] overflow-y-auto ${
 isRecording ? 'placeholder:text-red-400 placeholder:animate-pulse' : 'placeholder:text-slate-400 dark:placeholder:text-slate-500'
 }`}
 disabled={isLoading}
 onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend();}}}
 />
 <div className="flex items-center justify-between px-3 pb-3">
 <div className="flex items-center gap-0.5">
 {!isPortalUser && (
   <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="p-1.5 text-[#71717a] hover:bg-slate-50 hover:text-primary rounded-lg transition-colors" title="Change Mode">
          <Plus className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-48 z-[100]">
        <DropdownMenuItem onClick={() => setChatMode('chat')} className="cursor-pointer font-medium"><MessageSquare className="w-4 h-4 mr-2 text-[#71717a]"/> Chat Mode</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setChatMode('flow')} className="cursor-pointer font-medium"><OrbitIcon className="w-4 h-4 mr-2 text-[#71717a]"/> Flow Builder Mode</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setChatMode('automation')} className="cursor-pointer font-medium"><Bot className="w-4 h-4 mr-2 text-[#71717a]"/> Automation Mode</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
   )}
 <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf,.txt,.csv,.docx,.xlsx,.json,.md" onChange={handleFileUpload} />
 <button
 type="button"
 onClick={() => fileInputRef.current?.click()}
 className="p-1.5 text-[#71717a] dark:text-gray-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-primary/30 rounded-lg transition-colors"
 title="Attach file or image"
 >
 <Paperclip className="w-4 h-4" />
 </button>
 <button
 type="button"
 onClick={handleMicToggle}
 className={`p-1.5 rounded-lg transition-colors ${
 isRecording
 ? 'text-red-500 bg-red-50 dark:bg-red-950/30 animate-pulse'
 : 'text-[#71717a] dark:text-gray-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-primary/30'
}`}
 title={isRecording ? 'Stop recording' : 'Voice input'}
 >
 {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
 </button>
 </div>
 <div className="flex items-center gap-2">
 <span className="text-[9px] text-[#71717a] dark:text-gray-400/40 uppercase tracking-wider hidden sm:block tracking-[0.04em]"> {t("send_shift_newline", "Send Shift+ Newline")}</span>
 <button
 type="button"
 disabled={(!input.trim() && !uploadedFile) || isLoading}
 onClick={() => handleSend()}
 className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-all shadow-sm hover:shadow-md hover:shadow-emerald-500/20"
 >
 <Send className="w-4 h-4 ml-0.5" />
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </>
 );

 const portalTarget = document.getElementById('right-docked-panel-portal');
 return portalTarget ? createPortal(content, portalTarget) : content;
}
