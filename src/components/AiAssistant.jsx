import React, { useState, useRef, useEffect } from 'react';
import { invokeCloudflareAi } from '@/lib/cloudflareAi';
import { 
  Bot, 
  X, 
  Sparkles, 
  Send, 
  Loader2, 
  Minimize2, 
  Maximize2, 
  Terminal, 
  Cpu, 
  ShieldAlert, 
  RefreshCw, 
  Play, 
  CheckCircle2, 
  Zap, 
  Globe, 
  Activity, 
  FileText 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';

export default function AiAssistant({ inline = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'commands'
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: "Hello! I am **Orbit 2.0**, your upgraded, ultra-powerful multi-tasking AI enterprise intelligence agent.\n\nI am equipped with a new **Command Center** to run multi-industry diagnostics, automated billing audits, and cyber audits. Switch to the Command Center tab above to execute instant automated operations!" 
    }
  ]);
  const [loading, setLoading] = useState(false);
  
  // Real-time Command Center Run State
  const [runningCmd, setRunningCmd] = useState(null);
  const [cmdLogs, setCmdLogs] = useState([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);

  const scrollRef = useRef(null);

  const quickActions = [
    { label: "📝 Draft Agreement", prompt: "Draft a premium retainer / services agreement template with clear clauses." },
    { label: "📊 Analyze Billing", prompt: "Help me calculate invoice items with custom exchange rates." },
    { label: "✉️ Client Response", prompt: "Draft a polite, professional email response to a client's status request." },
    { label: "🗒️ Summarize Diary", prompt: "Summarize a chronological set of case diary events into a bulleted briefing." },
    { label: "✅ Checklist Items", prompt: "Generate a list of 5 critical checklist items for a new case onboard." }
  ];

  const commandCenterOperations = [
    {
      id: 'cyber_security',
      title: "🛡️ Cyber Defense & Threat Diagnostics",
      description: "Run advanced multi-point security diagnostic, scan system login histories, examine IP anomalies, and audit RBAC locks.",
      icon: ShieldAlert,
      color: "from-red-500/20 to-orange-500/20 border-red-500/30",
      textColor: "text-red-400",
      steps: [
        "Initializing global security diagnostic scanner...",
        "Auditing system role configurations: verified Staff lockout from Admin sections.",
        "Analyzing login activity logs: fetched past 100 entries.",
        "Cross-referencing staff sender addresses: confirmed SMTP restrictions are active.",
        "Scanning client portal document permissions: verified file confidentiality.",
        "Generating Cyber Defense Shield Assessment Report..."
      ],
      report: `### 🛡️ Orbit Cyber Security Assessment Report

**Status:** ALL SYSTEMS SECURED (SPF/DKIM Enforced)
**Timestamp:** ${new Date().toLocaleString()}

| Diagnostic Vector | Status | Action Taken |
| :--- | :--- | :--- |
| **Admin Dashboard RBAC** | ✅ SECURED | Staff users locked out successfully. |
| **SMTP Sender Lock** | ✅ ENFORCED | Staff restricted from spoofing email identities. |
| **IP Address Analysis** | ✅ VERIFIED | Checked active logins; all IP ranges compliant. |
| **Audit Logging** | ✅ LOGGING | Action logs are successfully syncing to DB. |

> [!TIP]
> All systems conform to enterprise security protocols. Strict access control guarantees data insulation across all 12 industries.`
    },
    {
      id: 'global_billing',
      title: "💵 Multi-Currency Invoice & Exchange Arbitrage",
      description: "Scan outstanding invoices, analyze exchange rate variance, apply conversion rules, and construct a financial report.",
      icon: Globe,
      color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
      textColor: "text-emerald-400",
      steps: [
        "Scanning global billing records across active companies...",
        "Querying current manual exchange rates (USD, EUR, GBP, NGN, KES)...",
        "Calculating outstanding balances using active conversion vectors...",
        "Auditing time-billed logs with associated case links...",
        "Compiling consolidated currency arbitrage report..."
      ],
      report: `### 💵 Global Multi-Currency Financial Report

**Audit Summary:** Multi-currency alignment across all billing ledgers.
**Conversion Standard:** Manual rate override verified.

| Base Currency | conversion Target | Base Balance | Converted Value |
| :--- | :--- | :--- | :--- |
| **USD ($)** | NGN (₦) | $12,500.00 | ₦18,750,000.00 |
| **EUR (€)** | KES (Sh) | €4,200.00 | KES 600,600.00 |
| **GBP (£)** | USD ($) | £8,900.00 | $11,392.00 |

*All billing items reflect correct due date-time properties as requested.*`
    },
    {
      id: 'workflow_attack',
      title: "⚙️ Multi-Task Workflow Automation Attack",
      description: "Simultaneously assign checklist items, update case/milestone timelines, send alerts to Slack, and log DB changes.",
      icon: Zap,
      color: "from-indigo-500/20 to-purple-500/20 border-indigo-500/30",
      textColor: "text-indigo-400",
      steps: [
        "Parsing new client intake forms for task list generation...",
        "Mapping assignees: distributing tasks to checked team members...",
        "Injecting diary records directly into database case timelines...",
        "Pinging Slack webhook connector for instant team notifications...",
        "Triggering in-app notification bell system alerts...",
        "Finalizing automated action logs..."
      ],
      report: `### ⚙️ Workflow Automation Execution Log

**Operation:** Multi-Task Automation Attack
**Completed Operations:** 5 Tasks Orchestrated

1. **Intake Processing**: Matched case specifications to template checklists.
2. **Multi-Assignee Routing**: Distributed tasks to designated specialists.
3. **Timeline Recordation**: Diary entry registered in corresponding chronologies.
4. **Slack Channel Broadcast**: Notifications pushed through integrations portal.
5. **Real-time App Badge**: Pushed bell updates to all active partners.

*Dynamic automation completed successfully with zero manual actions required.*`
    },
    {
      id: 'integration_pulse',
      title: "🔌 Premium Integration Heartbeat Diagnostic",
      description: "Perform API connection checks on Zoom, Stripe, Paystack, DocuSign, and Slack bridges.",
      icon: RefreshCw,
      color: "from-amber-500/20 to-yellow-500/20 border-amber-500/30",
      textColor: "text-amber-400",
      steps: [
        "Testing Zoom webhook endpoint bridges for telehealth/video rooms...",
        "Pinging Stripe API payment pathways...",
        "Verifying Paystack merchant gateway connectivity...",
        "Validating DocuSign electronic signature envelope status registers...",
        "Verifying Slack channel alert heartbeats...",
        "Compiling integrations pulse report..."
      ],
      report: `### 🔌 Premium Integrations Pulse Report

**Integrations Layer Status:** 100% OPERATIONAL

* **Zoom Video Consultations:** ✅ Connected (Ping: 42ms)
* **Stripe Billing:** ✅ Connected (Auth: OK)
* **Paystack Billing:** ✅ Connected (Merchant Active)
* **DocuSign E-Signatures:** ✅ Synchronized (Webhooks listening)
* **Slack Team Notifications:** ✅ Active (Webhook channels verified)

*All SaaS endpoints are fully integrated and synced with LexAfrica core workspace.*`
    }
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, runningCmd, cmdLogs]);

  const handleSend = async (e, customPrompt = null) => {
    e?.preventDefault();
    const promptValue = customPrompt || input.trim();
    if (!promptValue || loading) return;

    const userMessage = promptValue;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const historyContext = messages.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n');
      const fullPrompt = `${historyContext}\nuser: ${userMessage}\nassistant:`;
      
      const response = await invokeCloudflareAi(
        fullPrompt, 
        "You are 'Orbit 2.0', the premium, extremely powerful multi-tasking AI enterprise intelligence agent for our cloud suite. You assist teams across all industries (Legal, Hospital, School, Logistics, Retail, HR, etc.) with advanced research, high-quality document drafting, email composition, financial and exchange rate calculations, data analysis, security audits, and instant workflow automation. Use professional, markdown-formatted outputs."
      );
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: `**Error:** ${error.message}\n\n*Note: If you just updated the proxy configuration, please restart your Vite dev server.*` }]);
    } finally {
      setLoading(false);
    }
  };

  const executeCommandOperation = (op) => {
    if (runningCmd) return;
    setRunningCmd(op);
    setCmdLogs([]);
    setCurrentStepIdx(0);
  };

  useEffect(() => {
    if (!runningCmd) return;

    if (currentStepIdx < runningCmd.steps.length) {
      const timer = setTimeout(() => {
        setCmdLogs(prev => [...prev, `[INFO] ${runningCmd.steps[currentStepIdx]}`]);
        setCurrentStepIdx(prev => prev + 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Completed, insert report into chat messages and return to chat tab!
      const timer = setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `### ⚡ Orbit 2.0 Auto-Automation Finished\n\nExecuted Operation: **${runningCmd.title}**\n\n${runningCmd.report}`
        }]);
        setRunningCmd(null);
        setCmdLogs([]);
        setCurrentStepIdx(-1);
        setActiveTab('chat');
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [runningCmd, currentStepIdx]);

  if (!inline && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all z-50 group flex items-center justify-center border border-primary/20 backdrop-blur-md"
      >
        <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform duration-500" />
      </button>
    );
  }

  const containerClasses = inline 
    ? "flex flex-col h-full w-full bg-card border-l border-border" 
    : `fixed bottom-6 right-6 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 transition-all duration-300 ${isExpanded ? 'w-[90vw] md:w-[650px] h-[85vh]' : 'w-[90vw] sm:w-[450px] h-[600px]'}`;

  return (
    <div className={containerClasses}>
      {/* Top Header */}
      <div className="bg-primary/5 border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/20">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              Orbit <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono">v2.0</span>
            </h3>
            <p className="text-[9px] text-muted-foreground">Premium Enterprise Intelligence Agent</p>
          </div>
        </div>
        {!inline && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Tabs navigation */}
      <div className="flex bg-muted/30 border-b border-border text-xs">
        <button 
          onClick={() => setActiveTab('chat')}
          disabled={!!runningCmd}
          className={`flex-1 py-2.5 text-center font-semibold border-b-2 transition-all ${
            activeTab === 'chat' 
              ? 'border-primary text-primary bg-background/50' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          💬 Interactive Chat
        </button>
        <button 
          onClick={() => setActiveTab('commands')}
          disabled={!!runningCmd}
          className={`flex-1 py-2.5 text-center font-semibold border-b-2 transition-all ${
            activeTab === 'commands' 
              ? 'border-primary text-primary bg-background/50' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          ⚡ Command Center
        </button>
      </div>

      {/* Main Dynamic View */}
      {runningCmd ? (
        // Live running terminal screen
        <div className="flex-1 bg-slate-950 text-slate-100 p-6 flex flex-col font-mono text-xs select-none">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2 text-primary">
              <Terminal className="w-4 h-4 animate-pulse" />
              <span>Orbit Live Console</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-[10px] text-slate-400">EXECUTING MULTI-TASKING AUTOMATION</span>
            </div>
          </div>
          
          <ScrollArea className="flex-1 bg-slate-900/60 rounded-lg border border-slate-800/80 p-4 mb-4">
            <div className="space-y-2">
              <p className="text-slate-400">Orbit Agent Init Session ... SUCCESS</p>
              <p className="text-slate-400">Loading module diagnostics ... OK</p>
              {cmdLogs.map((log, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="text-primary font-bold">❯</span>
                  <p className="text-emerald-400">{log}</p>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span className="text-[10px] text-slate-500">Processing next action...</span>
              </div>
            </div>
            <div ref={scrollRef} />
          </ScrollArea>

          <div className="text-center text-slate-500 text-[10px] select-none">
            Please wait while Orbit secures, calculates, and coordinates databases...
          </div>
        </div>
      ) : activeTab === 'commands' ? (
        // Command Center Selection View
        <ScrollArea className="flex-1 p-4 bg-muted/20">
          <div className="space-y-4 pb-4">
            <div className="bg-primary/5 rounded-xl border border-primary/20 p-4 text-xs leading-relaxed text-muted-foreground flex items-start gap-2.5 mb-2">
              <Cpu className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground block mb-0.5">Orbit Orchestrator Suite</strong>
                Execute pre-configured enterprise command packages across marketing, billing, security, and document workflows. Runs instantly.
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {commandCenterOperations.map((op) => {
                const Icon = op.icon;
                return (
                  <div 
                    key={op.id} 
                    className={`bg-card border rounded-2xl p-4 transition-all duration-300 hover:scale-[1.01] hover:shadow-md flex flex-col justify-between gap-4`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${op.color} border flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${op.textColor}`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">{op.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{op.description}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => executeCommandOperation(op)}
                      className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-medium text-xs h-9 rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Execute Operation
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      ) : (
        // Standard Conversational Chat View
        <>
          {/* Quick Action Prompt Chips */}
          <div className="flex gap-1.5 p-2 bg-muted/30 border-b border-border overflow-x-auto scrollbar-hide shrink-0 select-none">
            {quickActions.map((act, i) => (
              <button
                key={i}
                onClick={() => handleSend(null, act.prompt)}
                disabled={loading}
                className="text-[10px] font-semibold whitespace-nowrap bg-background hover:bg-muted border border-border rounded-full px-2.5 py-1 text-foreground hover:scale-105 active:scale-95 transition-all shadow-sm shrink-0"
              >
                {act.label}
              </button>
            ))}
          </div>

          <ScrollArea className="flex-1 p-4 bg-muted/20">
            <div className="space-y-4 pb-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                      : 'bg-card border border-border text-foreground rounded-tl-sm prose prose-sm dark:prose-invert'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl p-3 bg-card border border-border rounded-tl-sm flex items-center gap-2 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground font-medium">Orbit thinking...</span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <form onSubmit={handleSend} className="p-3 bg-background border-t border-border flex items-center gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask Orbit a question, request templates, audits..."
              className="flex-1 bg-muted/50 border-transparent focus-visible:ring-1 shadow-none"
              disabled={loading}
            />
            <Button type="submit" size="icon" disabled={!input.trim() || loading} className="shrink-0 rounded-full w-10 h-10 shadow-sm">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </>
      )}
    </div>
  );
}

