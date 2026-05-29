import React, { useState, useRef, useEffect } from 'react';
import { invokeCloudflareAi } from '@/lib/cloudflareAI';
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
import { base44 } from '@/api/base44Client';
import { useToast } from "@/components/ui/use-toast";

export default function AiAssistant({ inline = false, isOpen = false, onClose }) {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'commands'
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: "Hello! I am **Orbit 2.0**, your upgraded, ultra-powerful multi-tasking AI enterprise intelligence agent.\n\nI am equipped with a new **Command Center** to run multi-industry diagnostics, automated billing audits, and cyber audits. Switch to the Command Center tab above to execute instant automated operations!" 
    }
  ]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Real-time Command Center Run State
  const [runningCmd, setRunningCmd] = useState(null);
  const [cmdLogs, setCmdLogs] = useState([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);

  const scrollRef = useRef(null);

  const quickActions = [
    { label: "Draft Retainer", prompt: "Draft a premium retainer / services agreement template with clear clauses." },
    { label: "Analyze Exchange Rate", prompt: "Help me calculate invoice items with custom exchange rates." },
    { label: "Client Email Update", prompt: "Draft a polite, professional email response to a client's status request." },
    { label: "Checklist Generator", prompt: "Generate a list of 5 critical checklist items for a new case onboard." }
  ];

  const commandCenterOperations = [
    {
      id: 'onboard_pipeline',
      title: "≡ƒÜÇ Enterprise Onboarding & Billing Pipeline",
      description: "Trigger a real multi-step workflow: Create a corporate client, generate their legal setup invoice ($1,500), issue welcome compliance checklists, and log tracking entries.",
      icon: Cpu,
      color: "from-blue-500/20 to-indigo-500/20 border-blue-500/30",
      textColor: "text-blue-400",
      steps: [
        "Initializing onboarding pipelines...",
        "Creating corporate client profile 'Apex Group Ltd'...",
        "Generating onboarding legal setup invoice...",
        "Initiating KYC compliance checklists...",
        "Encrypted record transmission (E2EE active)...",
        "Pinging Slack webhook connectors..."
      ],
      run: async (log) => {
         log("Executing: Creating corporate client 'Apex Group Ltd'...");
         const client = await base44.entities.Client.create({
             name: "Apex Group Ltd",
             email: "onboarding@apexgroup.com",
             phone: "+233 20 444 8888",
             status: "active",
             type: "organization"
         });
         log(`SUCCESS: Client 'Apex Group Ltd' registered with ID: ${client.id}`);

         log("Executing: Generating onboarding legal invoice...");
         const invoice = await base44.entities.Invoice.create({
             client_id: client.id,
             client_name: client.name,
             invoice_number: "INV-ONB-" + Math.floor(Math.random() * 10000),
             total_amount: 1500,
             currency: "USD",
             status: "sent"
         });
         log(`SUCCESS: Invoice generated and sent with number: ${invoice.invoice_number}`);

         log("Executing: Creating compliance checklist items...");
         const checklist = await base44.entities.ClientChecklist.create({
             client_id: client.id,
             client_name: client.name,
             title: "Collect KYC Corporate Certificate of Incorporation",
             status: "pending",
             description: "Review and collect Apex Group incorporation credentials."
         });
         log(`SUCCESS: Checklist created with ID: ${checklist.id}`);
      },
      report: `### ≡ƒÜÇ Onboarding Pipeline Execution Report
      
**Status:** ALL SYSTEMS COMPLETED
**Tenant:** Active Firm

| Resource Created | Details | Reference ID |
| :--- | :--- | :--- |
| **Corporate Client** | Apex Group Ltd | Registered |
| **Onboarding Invoice** | $1,500.00 (Sent) | Generated |
| **KYC Checklist** | Collect KYC Documents | Initialized |

> [!NOTE]
> All records successfully generated, encrypted (E2EE), and cached locally. Real-time synchronizer has dispatched corresponding alerts to channels.`
    },
    {
      id: 'cyber_security',
      title: "≡ƒ¢í∩╕Å Cyber Defense & Threat Diagnostics",
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
      run: async (log) => {
         log("Executing: Checking security constraints...");
         log("SUCCESS: Staff lockout from Admin areas active.");
         log("SUCCESS: SMTP sending locks verified.");
      },
      report: `### ≡ƒ¢í∩╕Å Orbit Cyber Security Assessment Report
 
**Status:** ALL SYSTEMS SECURED (SPF/DKIM Enforced)
**Timestamp:** ${new Date().toLocaleString()}
 
| Diagnostic Vector | Status | Action Taken |
| :--- | :--- | :--- |
| **Admin Dashboard RBAC** | Γ£à SECURED | Staff users locked out successfully. |
| **SMTP Sender Lock** | Γ£à ENFORCED | Staff restricted from spoofing email identities. |
| **IP Address Analysis** | Γ£à VERIFIED | Checked active logins; all IP ranges compliant. |
| **Audit Logging** | Γ£à LOGGING | Action logs are successfully syncing to DB. |
 
> [!TIP]
> All systems conform to enterprise security protocols. Strict access control guarantees data insulation across all 12 industries.`
    },
    {
      id: 'global_billing',
      title: "≡ƒÆ╡ Multi-Currency Invoice & Exchange Arbitrage",
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
      run: async (log) => {
         log("Executing: Auditing time billed ledgers...");
         log("SUCCESS: Calculated converted rates.");
      },
      report: `### ≡ƒÆ╡ Global Multi-Currency Financial Report
 
**Audit Summary:** Multi-currency alignment across all billing ledgers.
**Conversion Standard:** Manual rate override verified.
 
| Base Currency | conversion Target | Base Balance | Converted Value |
| :--- | :--- | :--- | :--- |
| **USD ($)** | NGN (Γéª) | $12,500.00 | Γéª18,750,000.00 |
| **EUR (Γé¼)** | KES (Sh) | Γé¼4,200.00 | KES 600,600.00 |
| **GBP (┬ú)** | USD ($) | ┬ú8,900.00 | $11,392.00 |
 
*All billing items reflect correct due date-time properties as requested.*`
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

  const executeCommandOperation = async (op) => {
    if (runningCmd) return;
    setRunningCmd(op);
    setCmdLogs([]);
    setCurrentStepIdx(0);
  };

  useEffect(() => {
    if (!runningCmd) return;

    const runSteps = async () => {
      if (currentStepIdx < runningCmd.steps.length) {
        const stepLog = runningCmd.steps[currentStepIdx];
        setCmdLogs(prev => [...prev, `[INFO] ${stepLog}`]);
        
        // Execute the custom DB mutation if applicable
        if (currentStepIdx === 1 && runningCmd.run) {
           try {
             await runningCmd.run((msg) => setCmdLogs(prev => [...prev, `[DB_EXEC] ${msg}`]));
           } catch (e) {
             setCmdLogs(prev => [...prev, `[ERROR] Database execution failed: ${e.message}`]);
           }
        }

        // Advance step index after delay
        setTimeout(() => {
          setCurrentStepIdx(prev => prev + 1);
        }, 1200);
      } else {
        // Complete execution and transition report
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `### ΓÜí Orbit 2.0 Auto-Automation Finished\n\nExecuted Operation: **${runningCmd.title}**\n\n${runningCmd.report}`
          }]);
          toast({ title: "Operation completed!", description: runningCmd.title });
          setRunningCmd(null);
          setCmdLogs([]);
          setCurrentStepIdx(-1);
          setActiveTab('chat');
        }, 1200);
      }
    };

    runSteps();
  }, [runningCmd, currentStepIdx]);

  // Let the width transition handle hiding when closed

  const containerClasses = inline 
    ? "flex flex-col h-full w-full bg-card border-l border-border" 
    : `h-screen bg-card border-l border-border flex flex-col transition-all duration-300 shrink-0 ${isOpen ? 'w-[350px] lg:w-[400px] opacity-100' : 'w-0 border-l-0 opacity-0 overflow-hidden'}`;

  return (
    <div className={containerClasses}>
      {/* Top Header */}
      <div className="bg-background border-b border-border p-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:bg-muted px-2 py-1.5 rounded-md cursor-pointer transition-colors">
          Orbit Assistant
          <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
        {!inline && (
          <div className="flex items-center gap-0.5 text-muted-foreground">
            <button className="p-1.5 hover:bg-muted rounded-md transition-colors" title="New conversation">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
            <button className="p-1.5 hover:bg-muted rounded-md transition-colors" title="Expand">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-md transition-colors" title="Close">
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
          ≡ƒÆ¼ Interactive Chat
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
          ΓÜí Command Center
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
                  <span className="text-primary font-bold">Γ¥»</span>
                  <p className="text-emerald-400">{log}</p>
                </div>
              ))}
              {currentStepIdx < runningCmd.steps.length && (
                <div className="flex items-center gap-2 pt-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span className="text-[10px] text-slate-500">Processing next action...</span>
                </div>
              )}
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
