import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, X, Send, Maximize2, Minimize2, Loader2, Zap, RotateCcw, User, Mic, Paperclip, MicOff, Image, FileText, CheckCircle2, Circle, AlertCircle, ArrowRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useImpersonation } from '@/lib/ImpersonationContext';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-hot-toast';
import { useCompanyId } from '@/hooks/useCompanyId';

// ─── Intent keywords for client-side pre-classification ───
const BUILD_KEYWORDS = ['create', 'build', 'design', 'make', 'generate', 'set up', 'setup', 'develop'];
const EDIT_KEYWORDS = ['edit', 'change', 'modify', 'update', 'add field', 'remove field', 'rename', 'adjust', 'fix', 'switch', 'convert', 'transform'];
const SYSTEM_KEYWORDS = ['complete system', 'operating system', 'management system', 'full system', 'entire system', 'all modules', 'comprehensive', 'enterprise system', 'business system', 'operational system'];
const POPULATE_KEYWORDS = ['add this', 'insert this', 'populate', 'log this', 'record this', 'enter this data', 'add patient', 'add record', 'add entry', 'fill in', 'upload data', 'save this data'];

function detectIntentLocal(text, hasCurrentSchema = false) {
  const lower = text.toLowerCase();
  const hasPopulateKeyword = POPULATE_KEYWORDS.some(k => lower.includes(k));
  const hasSystemKeyword = SYSTEM_KEYWORDS.some(k => lower.includes(k));
  const hasBuildKeyword = BUILD_KEYWORDS.some(k => lower.includes(k));
  const hasEditKeyword = EDIT_KEYWORDS.some(k => lower.includes(k));
  
  // Count entities mentioned (more entities = more likely a system)
  const entityPatterns = /\b(patients?|doctors?|nurses?|appointments?|billing|inventory|staff|employees?|departments?|modules?|projects?|donors?|volunteers?|beneficiar|grants?|prescriptions?|pharmacy|laboratory|rooms?|wards?|claims?|invoices?)\b/gi;
  const entityCount = (lower.match(entityPatterns) || []).length;
  
  // If we're in context of an existing module, bias toward edit/populate
  if (hasCurrentSchema) {
    if (hasPopulateKeyword) return 'populate_data';
    if (!hasBuildKeyword) return 'edit'; // default to edit when schema exists
  }
  
  if (hasPopulateKeyword) return 'populate_data';
  if ((hasSystemKeyword || entityCount >= 5) && hasBuildKeyword) return 'build_system';
  if (hasEditKeyword && !hasBuildKeyword) return 'edit';
  if (hasBuildKeyword) return 'build';
  return 'chat';
}

function FormatMessage({ content }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mt-1 [&>ul]:mb-2 [&>ol]:mt-1 [&>ol]:mb-2 [&>ul]:pl-4 [&>ol]:pl-4">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

const STARTER_PROMPTS = [
  "Build a complete Healthcare Management System with patients, appointments, pharmacy, and billing",
  "Create an NGO Program & Donation Management system with donors, projects, and impact tracking",
  "Design a complete School Management System with students, classes, grades, and fee tracking",
  "Build a Property Management system with listings, tenants, leases, and maintenance",
  "Create an HR & Payroll system with employees, attendance, leave, and salary management",
  "Design a complete Logistics & Fleet Management system with shipments, drivers, and tracking",
];

export default function OrbitBoltPanel({ isOpen, onClose, onApplySchema, currentSchema }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const { impersonatedCompany } = useImpersonation();
  const activeIndustry = sessionStorage.getItem('optalflow_industry_override') || impersonatedCompany?.industry_type || user?.company_industry || 'law';

  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Hello! I'm **OrbitBolt** ⚡ — your AI system architect.\n\nI can build **complete business operating systems** with multiple modules, workflows, and dashboards from a single prompt.\n\nTry: *\"Build a complete Healthcare Management System\"* or describe any complex business need.\n\nI'll design all the modules, fields, views, and relationships for you."
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSchema, setLastSchema] = useState(null);
  
  // System build state
  const [systemPlan, setSystemPlan] = useState(null);
  const [generatedModules, setGeneratedModules] = useState([]);
  const [buildProgress, setBuildProgress] = useState({ current: 0, total: 0, status: 'idle', label: '' });
  const [isSavingSystem, setIsSavingSystem] = useState(false);
  const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0, active: false });
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const manualStopRef = useRef(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, buildProgress]);

  const callEdgeFunction = async (body) => {
    const response = await supabase.functions.invoke('generate-dynamic-module', { body });
    if (response.error && !response.data) throw new Error(response.error.message || 'Edge function error');
    if (response.data?.error) throw new Error(response.data.error);
    return response.data;
  };

  // ─── HANDLE SEND (Main orchestrator) ───
  const handleSend = useCallback(async (overrideText) => {
    const text = (overrideText !== undefined ? overrideText : input).trim();
    if (!text || isLoading) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Step 1: Detect intent (client-side fast classification)
      const intent = detectIntentLocal(text, !!currentSchema);

      if (intent === 'chat') {
        // ─── CHAT MODE ───
        const data = await callEdgeFunction({
          prompt: text,
          mode: 'chat',
          company_id: user?.company_id,
          chatHistory: [
            { role: 'system', content: 'You are OrbitBolt — an AI module architect assistant. Answer questions about module design, business processes, or data architecture helpfully. Be concise and professional. Do NOT generate JSON schemas unless the user explicitly asks you to build or create something.' },
            ...messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: text }
          ]
        });

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message || "I'm here to help! Could you rephrase your question?"
        }]);

      } else if (intent === 'populate_data') {
        // ─── POPULATE DATA MODE ───
        const schemaForPopulate = currentSchema || lastSchema;
        if (!schemaForPopulate) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: "I don't have an active module to add data to. Please navigate to a module first, then open OrbitBolt and share the data you'd like to add."
          }]);
          setIsLoading(false);
          return;
        }

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `📥 **Extracting data...** I'm mapping your input to the **${schemaForPopulate.module?.name || 'module'}** fields.`
        }]);

        const data = await callEdgeFunction({
          prompt: text,
          mode: 'populate_data',
          currentSchema: schemaForPopulate,
          company_id: user?.company_id,
        });

        if (data.recordData) {
          // Insert the record into dynamic_records
          const moduleId = currentSchema?.module?.id || schemaForPopulate?.module?.id;
          if (moduleId) {
            const { error: insertError } = await supabase.from('dynamic_records').insert({
              id: crypto.randomUUID(),
              module_id: moduleId,
              company_id: user?.company_id,
              data: data.recordData,
              created_at: new Date().toISOString()
            });
            if (insertError) throw new Error(`Failed to save record: ${insertError.message}`);
          }

          const fieldSummary = Object.entries(data.recordData)
            .filter(([, v]) => v !== null && v !== undefined)
            .map(([k, v]) => `• **${k.replace(/_/g,' ')}**: ${v}`)
            .join('\n');

          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: 'assistant',
              content: `✅ **Record Added Successfully!**\n\n${fieldSummary}\n\nThe record has been saved to your module. Refresh the page to see it.`
            };
            return updated;
          });
        } else {
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: 'assistant',
              content: data.message || "I couldn't extract the data. Please try providing the information in a clearer format."
            };
            return updated;
          });
        }

      } else if (intent === 'edit') {
        // ─── EDIT MODE (smart, non-destructive) ───
        const schemaToEdit = currentSchema || lastSchema;
        if (!schemaToEdit) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: "I don't have an existing module to edit. Would you like me to **create a new module** instead? Just describe what you need!"
          }]);
          setIsLoading(false);
          return;
        }

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `🔧 **Editing ${schemaToEdit.module?.name || 'your module'}...** I'll only change what you asked for and keep everything else intact.`
        }]);

        const data = await callEdgeFunction({
          prompt: text,
          mode: 'edit',
          currentSchema: schemaToEdit,
          company_id: user?.company_id,
        });

        if (data.schema) {
          setLastSchema(data.schema);
          const oldFieldCount = schemaToEdit.fields?.length || 0;
          const newFieldCount = data.schema.fields?.length || 0;
          const fieldDiff = newFieldCount - oldFieldCount;
          const diffText = fieldDiff > 0 ? `Added ${fieldDiff} new field(s).` : fieldDiff < 0 ? `Removed ${Math.abs(fieldDiff)} field(s).` : 'Fields updated.';

          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: 'assistant',
              content: `✅ **Module Updated!** — ${data.schema.module?.name}\n\n${diffText} Total fields: **${newFieldCount}**.\n\nClick **"Apply to Builder"** to update your module.`,
              schema: data.schema
            };
            return updated;
          });
        } else {
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: 'assistant',
              content: data.message || "I couldn't process that edit. Please try rephrasing."
            };
            return updated;
          });
        }

      } else if (intent === 'build_system') {
        // ─── BUILD SYSTEM MODE (multi-module) ───
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "🏗️ **Analyzing your requirements...** I'm designing a complete system architecture for you. This will generate multiple interconnected modules."
        }]);

        // Step 1: Get the system plan
        const planData = await callEdgeFunction({
          prompt: text,
          mode: 'plan_system',
          company_id: user?.company_id,
        });

        if (!planData.plan || !Array.isArray(planData.plan)) {
          throw new Error('Could not generate system plan');
        }

        const plan = planData.plan.slice(0, 20); // Cap at 20 modules
        setSystemPlan(plan);
        setBuildProgress({ current: 0, total: plan.length, status: 'planning' });

        // Show the plan
        const planMessage = `📋 **System Architecture Plan** — ${plan.length} modules designed:\n\n${plan.map((m, i) => `${i + 1}. **${m.name}** — ${m.description} _(${m.module_type})_`).join('\n')}\n\n⚡ Click **"Build All Modules"** to generate the complete system, or modify the plan by telling me what to change.`;

        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: planMessage,
            systemPlan: plan
          };
          return updated;
        });

      } else {
        // ─── BUILD MODE (single module) ───
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "⚡ **Designing your module...** Generating fields, layout, and configuration."
        }]);

        const data = await callEdgeFunction({
          prompt: text,
          mode: 'generate_module',
          moduleName: '',
          moduleDescription: '',
          company_id: user?.company_id,
        });

        if (data.schema) {
          setLastSchema(data.schema);
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: 'assistant',
              content: `✅ **${data.schema.module?.name}** designed!\n\n${data.schema.module?.description}\n\n**${data.schema.fields?.length || 0} fields** • Layout: ${data.schema.module?.layout} • Type: ${data.schema.module?.module_type}\n\nClick **"Apply to Builder"** to load it.`,
              schema: data.schema
            };
            return updated;
          });
        } else {
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: 'assistant',
              content: data.message || "Generated! Check the builder."
            };
            return updated;
          });
        }
      }

    } catch (err) {
      let errorMessage = err.message;
      if (errorMessage.includes('Cloudflare AI Error (429)') || errorMessage.includes('10,000 neurons')) {
        errorMessage = user?.role === 'super_admin' 
          ? err.message 
          : "Our AI servers are experiencing heavy traffic. Please try again in a few moments.";
      }
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Error: ${errorMessage}. Please try again.`
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, isLoading, user?.company_id, currentSchema, lastSchema]);

  // ─── BUILD ALL MODULES (batch generation) ───
  const handleBuildAllModules = async (plan) => {
    if (!plan || plan.length === 0) return;
    
    setIsLoading(true);
    setBuildProgress({ current: 0, total: plan.length, status: 'building' });
    const modules = [];

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `🚀 **Building ${plan.length} modules...** This may take a minute.`
    }]);

    for (let i = 0; i < plan.length; i++) {
      const item = plan[i];
      setBuildProgress({ current: i + 1, total: plan.length, status: 'building' });

      try {
        const data = await callEdgeFunction({
          prompt: `Part of a larger system. Context: building a complete business system.`,
          mode: 'generate_module',
          moduleName: item.name,
          moduleDescription: item.description,
          targetModuleType: item.module_type || 'data_module',
          company_id: user?.company_id,
        });

        if (data.schema) {
          // Ensure name matches plan
          data.schema.module.name = item.name;
          data.schema.module.icon = item.icon || data.schema.module.icon;
          modules.push(data.schema);
        }
      } catch (err) {
        console.error(`Failed to generate module ${item.name}:`, err);
        // Continue with remaining modules
      }
    }

    setGeneratedModules(modules);
    setBuildProgress({ current: plan.length, total: plan.length, status: 'complete' });

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `✅ **System Build Complete!** Successfully generated **${modules.length}/${plan.length}** modules.\n\n${modules.map((m, i) => `${i + 1}. ✅ **${m.module?.name}** — ${m.fields?.length || 0} fields`).join('\n')}\n\nClick **"Save All to Workspace"** to install all modules at once.`,
      generatedModules: modules
    }]);

    setIsLoading(false);
  };

  // ─── SAVE ALL MODULES TO DATABASE ───
  const handleSaveAllModules = async (modules) => {
    if (!modules || modules.length === 0 || !companyId) return;
    
    setIsSavingSystem(true);
    setSaveProgress({ current: 0, total: modules.length, active: true });
    let saved = 0;

    try {
      for (let idx = 0; idx < modules.length; idx++) {
        const schema = modules[idx];
        setSaveProgress({ current: idx + 1, total: modules.length, active: true });
        setBuildProgress({ current: idx + 1, total: modules.length, status: 'saving', label: schema.module?.name || '' });

        const moduleId = crypto.randomUUID();

        // Check if module with same name already exists
        const { data: existing } = await supabase
          .from('module_definitions')
          .select('id')
          .eq('company_id', companyId)
          .eq('name', schema.module.name)
          .eq('is_active', 'true');

        if (existing && existing.length > 0) {
          continue; // Skip duplicate
        }

        // Insert module definition
        const { error: modError } = await supabase.from('module_definitions').insert({
          id: moduleId,
          company_id: companyId,
          name: schema.module.name,
          description: schema.module.description,
          icon: schema.module.icon,
          status: 'published',
          is_active: 'true',
          industry_type: activeIndustry,
          config: {
            layout: schema.module.layout || 'table',
            theme: schema.module.theme || 'primary',
            page_type: schema.module.module_type || 'data_module'
          },
          created_at: new Date().toISOString()
        });

        if (modError) {
          console.error(`Failed to save module ${schema.module.name}:`, modError);
          continue;
        }

        // Insert field definitions
        const validFields = (schema.fields || []).filter(f => f.name);
        if (validFields.length > 0) {
          const fieldsToInsert = validFields.map((f, i) => ({
            id: crypto.randomUUID(),
            company_id: companyId,
            module_id: moduleId,
            name: f.name.trim().replace(/ /g, '_').toLowerCase(),
            field_type: f.field_type || 'text',
            is_required: !!f.is_required,
            options: Array.isArray(f.options) ? f.options : [],
            order_index: i,
            created_at: new Date().toISOString()
          }));
          await supabase.from('field_definitions').insert(fieldsToInsert);
        }

        saved++;
      }

      setBuildProgress({ current: modules.length, total: modules.length, status: 'complete', label: '' });
      toast.success(`🎉 ${saved} modules saved to your workspace!`);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `🎉 **${saved} modules installed!** They're now available in your sidebar. Navigate to any module to start adding records.\n\nWant me to build more modules or make any changes?`
      }]);

      setSystemPlan(null);
      setGeneratedModules([]);
      setTimeout(() => {
        setBuildProgress({ current: 0, total: 0, status: 'idle', label: '' });
        setSaveProgress({ current: 0, total: 0, active: false });
      }, 2500);

    } catch (err) {
      toast.error(`Error saving modules: ${err.message}`);
    } finally {
      setIsSavingSystem(false);
    }
  };

  const handleApplySchema = (schema) => {
    if (onApplySchema) {
      onApplySchema(schema);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "🎨 Schema applied to your builder! Review, customize, and publish. Need adjustments? Just ask!"
      }]);
    }
  };

  const handleReset = () => {
    setMessages([{
      role: 'assistant',
      content: "Hello! I'm **OrbitBolt** ⚡ — your AI system architect.\n\nWhat would you like to build?"
    }]);
    setLastSchema(null);
    setSystemPlan(null);
    setGeneratedModules([]);
    setBuildProgress({ current: 0, total: 0, status: 'idle' });
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
    toast('Listening continuously...', { icon: '🎙️', duration: 2000 });
  };

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

  if (!isOpen) return null;

  return (
    <div className={`flex h-full shrink-0 border-l-[3px] border-l-blue-500 bg-card shadow-[-8px_0_30px_rgba(0,0,0,0.07)] z-40 transition-all duration-300 ${isOpen ? (isExpanded ? 'w-[680px] opacity-100' : 'w-[400px] opacity-100') : 'w-0 opacity-0 overflow-hidden border-none pointer-events-none'}`}>
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-gradient-to-r from-blue-500/8 to-indigo-500/5 shrink-0 justify-between">
          <div className="flex items-center gap-2 mb-0">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-blue-600/20 text-blue-600 shrink-0">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5 flex-1">
              <p className="text-[11px] font-bold text-foreground leading-none">OrbitBolt</p>
              <div className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 px-1.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0"></span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-white truncate">System Architect</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={handleReset} className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors" title="Start fresh">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors">
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button onClick={onClose} className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Build / Save Progress Bar */}
        {buildProgress.status !== 'idle' && (
          <div className={`px-3 py-2 border-b border-border shrink-0 ${
            buildProgress.status === 'saving' || buildProgress.status === 'complete'
              ? 'bg-emerald-50/60 dark:bg-emerald-950/10'
              : 'bg-blue-50/60 dark:bg-blue-950/10'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                buildProgress.status === 'saving' || buildProgress.status === 'complete'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-blue-700 dark:text-blue-400'
              }`}>
                {buildProgress.status === 'planning' && '📋 Planning system...'}
                {buildProgress.status === 'building' && `⚡ Building module ${buildProgress.current}/${buildProgress.total}${buildProgress.label ? `: ${buildProgress.label}` : ''}`}
                {buildProgress.status === 'saving' && `💾 Saving module ${buildProgress.current}/${buildProgress.total}${buildProgress.label ? `: ${buildProgress.label}` : ''}`}
                {buildProgress.status === 'complete' && `✅ All ${buildProgress.total} modules installed!`}
              </span>
              <span className={`text-[10px] font-mono ${
                buildProgress.status === 'saving' || buildProgress.status === 'complete'
                  ? 'text-emerald-600'
                  : 'text-blue-600'
              }`}>
                {Math.round((buildProgress.current / Math.max(buildProgress.total, 1)) * 100)}%
              </span>
            </div>
            <div className={`w-full h-1.5 rounded-full overflow-hidden ${
              buildProgress.status === 'saving' || buildProgress.status === 'complete'
                ? 'bg-emerald-100 dark:bg-emerald-900/40'
                : 'bg-blue-100 dark:bg-blue-900/40'
            }`}>
              <div 
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  buildProgress.status === 'saving' || buildProgress.status === 'complete'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                }`}
                style={{ width: `${(buildProgress.current / Math.max(buildProgress.total, 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(circle,#1e293b_1px,transparent_1px)] [background-size:18px_18px]">
          <div className="absolute inset-0 bg-card/65 pointer-events-none z-0"></div>
          <div className="relative z-10 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                }`}>
                  {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                </div>
                <div className={`flex flex-col gap-2 max-w-[88%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-card border border-border rounded-tl-sm text-foreground'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <FormatMessage content={msg.content} />
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>

                  {/* Single module: Apply to Builder */}
                  {msg.schema && !msg.systemPlan && !msg.generatedModules && (
                    <button
                      onClick={() => handleApplySchema(msg.schema)}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-sm hover:from-blue-700 hover:to-indigo-700 hover:scale-[1.02] transition-all duration-200"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Apply to Builder
                    </button>
                  )}

                  {/* System plan: Build All button */}
                  {msg.systemPlan && (
                    <button
                      onClick={() => handleBuildAllModules(msg.systemPlan)}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Package className="w-4 h-4" /> Build All {msg.systemPlan.length} Modules
                    </button>
                  )}

                  {/* Generated modules: Save All button */}
                  {msg.generatedModules && msg.generatedModules.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveAllModules(msg.generatedModules)}
                        disabled={isSavingSystem}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50"
                      >
                        {isSavingSystem ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                        ) : (
                          <><CheckCircle2 className="w-4 h-4" /> Save All to Workspace</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Zap className="w-3.5 h-3.5 text-white animate-spin" />
                </div>
                <div className="px-4 py-3 bg-card border border-border rounded-2xl rounded-tl-sm shadow-sm">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5 italic">
                    {buildProgress.status === 'building' 
                      ? `Building module ${buildProgress.current} of ${buildProgress.total}...` 
                      : 'OrbitBolt is thinking...'}
                  </p>
                </div>
              </div>
            )}

            {/* Starter Prompts */}
            {messages.length <= 1 && (
              <div className="pt-2 flex flex-wrap gap-1.5 shrink-0">
                {STARTER_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="text-[10px] font-medium px-2.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors max-w-[220px] text-left leading-snug"
                  >
                    ⚡ {prompt}
                  </button>
                ))}
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

        {/* Input Area */}
        <div className="p-3 border-t border-border bg-card/80 backdrop-blur-sm shrink-0">
          <div className="border border-border focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/15 rounded-xl bg-background transition-all overflow-hidden shadow-sm">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? ' Listening speak now' : 'Describe your system or module...'}
              rows={2}
              className={`w-full bg-transparent border-none focus:ring-0 resize-none px-3 pt-3 pb-1 text-sm text-foreground outline-none leading-relaxed ${
                isRecording ? 'placeholder:text-red-400 placeholder:animate-pulse' : 'placeholder:text-muted-foreground/50'
              }`}
              disabled={isLoading}
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
                <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider hidden sm:block">Send ↵ Shift+ Newline</span>
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
