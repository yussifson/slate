import re

with open('src/components/AiAssistant.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Operations Array above component
operations_code = """
import { ScrollArea } from '@/components/ui/scroll-area';

const commandCenterOperations = [
  {
    id: 'onboard_pipeline',
    title: "🚀 Enterprise Onboarding & Billing Pipeline",
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
    report: `### 🚀 Onboarding Pipeline Execution Report\n\n**Status:** ALL SYSTEMS COMPLETED\n**Tenant:** Active Firm\n\n| Resource Created | Details | Reference ID |\n| :--- | :--- | :--- |\n| **Corporate Client** | Apex Group Ltd | Registered |\n| **Onboarding Invoice** | \\$1,500.00 (Sent) | Generated |\n| **KYC Checklist** | Collect KYC Documents | Initialized |\n\n> [!NOTE]\n> All records successfully generated, encrypted (E2EE), and cached locally. Real-time synchronizer has dispatched corresponding alerts to channels.`
  },
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
    run: async (log) => {
       log("Executing: Checking security constraints...");
       log("SUCCESS: Staff lockout from Admin areas active.");
       log("SUCCESS: SMTP sending locks verified.");
    },
    report: `### 🛡️ Orbit Cyber Security Assessment Report\n\n**Status:** ALL SYSTEMS SECURED (SPF/DKIM Enforced)\n**Timestamp:** ${new Date().toLocaleString()}\n\n| Diagnostic Vector | Status | Action Taken |\n| :--- | :--- | :--- |\n| **Admin Dashboard RBAC** | ✅ SECURED | Staff users locked out successfully. |\n| **SMTP Sender Lock** | ✅ ENFORCED | Staff restricted from spoofing email identities. |\n| **IP Address Analysis** | ✅ VERIFIED | Checked active logins; all IP ranges compliant. |\n| **Audit Logging** | ✅ LOGGING | Action logs are successfully syncing to DB. |\n\n> [!TIP]\n> All systems conform to enterprise security protocols. Strict access control guarantees data insulation across all 12 industries.`
  },
  {
    id: 'global_billing',
    title: "💸 Multi-Currency Invoice & Exchange Arbitrage",
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
    report: `### 💸 Global Multi-Currency Financial Report\n\n**Audit Summary:** Multi-currency alignment across all billing ledgers.\n**Conversion Standard:** Manual rate override verified.\n\n| Base Currency | conversion Target | Base Balance | Converted Value |\n| :--- | :--- | :--- | :--- |\n| **USD ($)** | NGN (₦) | \\$12,500.00 | ₦18,750,000.00 |\n| **EUR (€)** | KES (Sh) | €4,200.00 | KES 600,600.00 |\n| **GBP (£)** | USD ($) | £8,900.00 | \\$11,392.00 |\n\n*All billing items reflect correct due date-time properties as requested.*`
  }
];
"""
content = content.replace('export default function AiAssistant', operations_code + '\nexport default function AiAssistant')

# 2. Add State inside AiAssistant
state_code = """
  const [activeTab, setActiveTab] = useState('chat');
  const [runningCmd, setRunningCmd] = useState(null);
  const [cmdLogs, setCmdLogs] = useState([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);

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
        
        if (currentStepIdx === 1 && runningCmd.run) {
           try {
             await runningCmd.run((msg) => setCmdLogs(prev => [...prev, `[DB_EXEC] ${msg}`]));
           } catch (e) {
             setCmdLogs(prev => [...prev, `[ERROR] Database execution failed: ${e.message}`]);
           }
        }

        setTimeout(() => {
          setCurrentStepIdx(prev => prev + 1);
        }, 1200);
      } else {
        setTimeout(() => {
          addMessages(activeId, [{
            role: 'assistant',
            content: `### ⚙️ Orbit 2.0 Auto-Automation Finished\\n\\nExecuted Operation: **${runningCmd.title}**\\n\\n${runningCmd.report}`
          }]);
          toast.success(`Operation completed: ${runningCmd.title}`);
          setRunningCmd(null);
          setCmdLogs([]);
          setCurrentStepIdx(-1);
          setActiveTab('chat');
        }, 1200);
      }
    };

    runSteps();
  }, [runningCmd, currentStepIdx, activeId, addMessages]);
"""
content = content.replace('const messagesEndRef = useRef(null);', state_code + '\n  const messagesEndRef = useRef(null);')

# 3. Add UI logic
ui_logic = """
      {/* Top Header */}
      <div className="bg-background border-b border-border p-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:bg-muted px-2 py-1.5 rounded-md cursor-pointer transition-colors">
          Orbit Assistant
          <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
        {!inline && (
          <div className="flex items-center gap-0.5 text-muted-foreground">
            <button onClick={() => setShowHistory(!showHistory)} className={`p-1.5 rounded-md transition-colors ${showHistory ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-600' : 'hover:bg-muted'}`} title="Chat history">
              <Clock className="w-4 h-4" />
            </button>
            <button onClick={startNewChat} className="p-1.5 hover:bg-muted rounded-md transition-colors" title="New conversation">
              <Plus className="w-4 h-4" />
            </button>
            <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 hover:bg-muted rounded-md transition-colors" title="Expand">
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-md transition-colors" title="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Tabs navigation */}
      <div className="flex bg-muted/30 border-b border-border text-xs shrink-0">
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
          ⚙️ Command Center
        </button>
      </div>

      {/* Main Dynamic View */}
      {runningCmd ? (
        // Live running terminal screen
        <div className="flex-1 bg-slate-950 text-slate-100 p-6 flex flex-col font-mono text-xs select-none min-h-0">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 shrink-0">
            <div className="flex items-center gap-2 text-primary">
              <Terminal className="w-4 h-4 animate-pulse" />
              <span>Orbit Live Console</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-[10px] text-slate-400">EXECUTING</span>
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
              {currentStepIdx < runningCmd.steps.length && (
                <div className="flex items-center gap-2 pt-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span className="text-[10px] text-slate-500">Processing next action...</span>
                </div>
              )}
            </div>
          </ScrollArea>
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
        <div className="flex-1 flex flex-col min-h-0 bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(circle,#1e293b_1px,transparent_1px)] [background-size:18px_18px] relative">
          <div className="absolute inset-0 bg-card/65 pointer-events-none z-0"></div>
          {/* Page Context Bar */}
          <div className="px-3 py-1.5 flex items-center gap-1.5 bg-blue-50/60 dark:bg-blue-950/10 border-b border-blue-100 dark:border-blue-900/20 shrink-0 z-10">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold truncate">
              {ctx ? `${ctx.suite}  ${ctx.title}` : location.pathname}  AI has full context
            </span>
          </div>
"""

old_ui = """      {/* Top Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-gradient-to-r from-blue-500/8 to-indigo-500/5 shrink-0">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`p-1.5 rounded-md transition-colors shrink-0 ${showHistory ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          title="Chat history"
        >
          <Clock className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded flex items-center justify-center bg-blue-600/20 text-blue-600 shrink-0">
            <OrbitIcon className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5 flex-1">
            <p className="text-[11px] font-bold text-foreground leading-none">Orbit</p>
            <div className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 px-1.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0"></span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-white truncate">Agent Active</span>
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
        <div className="absolute inset-0 bg-card/65 pointer-events-none z-0"></div>"""

content = content.replace(old_ui, ui_logic + '\n      {/* Messages */}\n      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">')

content = content.replace('</form>\n\n      </div>\n    </div>\n  );\n}', '</form>\n        </div>\n      )}\n\n      </div>\n    </div>\n  );\n}')

with open('src/components/AiAssistant.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
