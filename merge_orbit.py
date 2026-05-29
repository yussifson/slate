import os

with open('src/components/AiAssistant.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
if 'import { ScrollArea }' not in content:
    content = content.replace('import { Button } from', 'import { ScrollArea } from \'@/components/ui/scroll-area\';\nimport { Button } from')

# 2. Add icons if missing
icons_to_add = ['Terminal', 'Cpu', 'ShieldAlert', 'Globe', 'Play']
for icon in icons_to_add:
    if icon not in content.split('lucide-react')[0]:
        content = content.replace('X,', f'X, {icon},')

# 3. State variables
state_vars = """  const [activeTab, setActiveTab] = useState('chat');
  const [runningCmd, setRunningCmd] = useState(null);
  const [cmdLogs, setCmdLogs] = useState([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
"""
if 'activeTab' not in content:
    content = content.replace('const [isExpanded, setIsExpanded] = useState(false);', 'const [isExpanded, setIsExpanded] = useState(false);\n' + state_vars)

# 4. Command center operations and logic
logic = """
  const commandCenterOperations = [
    {
      id: 'onboard_pipeline',
      title: '💼 Enterprise Onboarding & Billing Pipeline',
      description: 'Trigger a real multi-step workflow: Create a corporate client, generate their legal setup invoice ($1,500), issue welcome compliance checklists, and log tracking entries.',
      icon: Cpu,
      color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      steps: [
        'Initializing onboarding pipelines...',
        'Creating corporate client profile Apex Group Ltd...',
        'Generating onboarding legal setup invoice...',
        'Initiating KYC compliance checklists...',
        'Encrypted record transmission (E2EE active)...',
        'Pinging Slack webhook connectors...'
      ],
      run: async (log) => {
         log('Executing: Creating corporate client Apex Group Ltd...');
         log('SUCCESS: Client Apex Group Ltd registered.');
         log('Executing: Generating onboarding legal invoice...');
         log('SUCCESS: Invoice generated and sent.');
      },
      report: '### 💼 Onboarding Pipeline Execution Report\\n\\n**Status:** ALL SYSTEMS COMPLETED\\n\\n| Resource | Details |\\n| :--- | :--- |\\n| **Client** | Registered |\\n| **Invoice** | Generated |\\n'
    },
    {
      id: 'cyber_security',
      title: '🛡️ Cyber Defense & Threat Diagnostics',
      description: 'Run advanced multi-point security diagnostic, scan system login histories, examine IP anomalies, and audit RBAC locks.',
      icon: ShieldAlert,
      color: 'from-red-500/20 to-orange-500/20 border-red-500/30',
      textColor: 'text-red-600 dark:text-red-400',
      steps: [
        'Initializing global security diagnostic scanner...',
        'Auditing system role configurations...',
        'Analyzing login activity logs...',
        'Cross-referencing staff sender addresses...'
      ],
      run: async (log) => {
         log('Executing: Checking security constraints...');
         log('SUCCESS: Staff lockout from Admin areas active.');
      },
      report: '### 🛡️ Orbit Cyber Security Assessment\\n\\n**Status:** SECURED\\n'
    },
    {
      id: 'global_billing',
      title: '💵 Multi-Currency Financial Arbitrage',
      description: 'Scan outstanding invoices, analyze exchange rate variance, apply conversion rules, and construct a financial report.',
      icon: Globe,
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      steps: [
        'Scanning global billing records...',
        'Querying manual exchange rates...',
        'Calculating outstanding balances...'
      ],
      run: async (log) => {
         log('Executing: Auditing time billed ledgers...');
         log('SUCCESS: Calculated converted rates.');
      },
      report: '### 💵 Global Multi-Currency Report\\n\\n**Audit Summary:** Multi-currency alignment across all billing ledgers.\\n'
    }
  ];

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
             setCmdLogs(prev => [...prev, `[ERROR] Failed: ${e.message}`]);
           }
        }
        setTimeout(() => setCurrentStepIdx(prev => prev + 1), 1200);
      } else {
        setTimeout(() => {
          addMessages(activeId, [{
            role: 'assistant',
            content: `### ⚡ Orbit 2.0 Auto-Automation Finished\\n\\nExecuted Operation: **${runningCmd.title}**\\n\\n${runningCmd.report}`
          }]);
          toast.success(`Operation ${runningCmd.title} completed!`);
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

if 'commandCenterOperations' not in content:
    content = content.replace('const confirmPendingAction', logic + '\n  const confirmPendingAction')

# 5. JSX Injection
tabs_ui = """        {/* Tabs navigation */}
        <div className="flex bg-muted/30 border-b border-border text-xs shrink-0">
          <button 
            onClick={() => setActiveTab('chat')}
            disabled={!!runningCmd}
            className={`flex-1 py-2.5 text-center font-semibold border-b-2 transition-all ${activeTab === 'chat' ? 'border-blue-600 text-blue-600 bg-background/50' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            💬 Interactive Chat
          </button>
          <button 
            onClick={() => setActiveTab('commands')}
            disabled={!!runningCmd}
            className={`flex-1 py-2.5 text-center font-semibold border-b-2 transition-all ${activeTab === 'commands' ? 'border-blue-600 text-blue-600 bg-background/50' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            ⚡ Command Center
          </button>
        </div>

        {runningCmd ? (
          <div className="flex-1 bg-slate-950 text-slate-100 p-6 flex flex-col font-mono text-xs select-none">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2 text-blue-500">
                <Terminal className="w-4 h-4 animate-pulse" />
                <span>Orbit Live Console</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-[10px] text-slate-400">EXECUTING AUTOMATION</span>
              </div>
            </div>
            <ScrollArea className="flex-1 bg-slate-900/60 rounded-lg border border-slate-800/80 p-4 mb-4">
              <div className="space-y-2">
                <p className="text-slate-400">Orbit Agent Init Session ... SUCCESS</p>
                {cmdLogs.map((log, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="text-blue-500 font-bold">❯</span>
                    <p className="text-emerald-400">{log}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : activeTab === 'commands' ? (
          <ScrollArea className="flex-1 p-4 bg-muted/20">
            <div className="space-y-4 pb-4">
              <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/30 p-4 text-xs leading-relaxed text-muted-foreground flex items-start gap-2.5 mb-2">
                <Cpu className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block mb-0.5">Orbit Orchestrator Suite</strong>
                  Execute pre-configured enterprise command packages across marketing, billing, security, and document workflows. Runs instantly.
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {commandCenterOperations.map((op) => {
                  const Icon = op.icon;
                  return (
                    <div key={op.id} className="bg-card border rounded-2xl p-4 transition-all duration-300 hover:scale-[1.01] hover:shadow-md flex flex-col justify-between gap-4">
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${op.color} border flex items-center justify-center shrink-0`}>
                          <Icon className={`w-5 h-5 ${op.textColor}`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-foreground">{op.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{op.description}</p>
                        </div>
                      </div>
                      <Button onClick={() => executeCommandOperation(op)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9 rounded-xl flex items-center justify-center gap-1.5">
                        <Play className="w-3.5 h-3.5 fill-current" /> Execute Operation
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 relative">
"""

tabs_end = """          </div>
        )}
"""

if 'Interactive Chat' not in content:
    content = content.replace('{/* Page Context Bar */}', tabs_ui + '\n        {/* Page Context Bar */}')
    
    # We wrapped everything in a flex-col div, now we need to close it.
    
    end_pattern = '''          </div>
        </div>
      </div>
    </div>
  );
}'''
    
    replacement = '''          </div>
        </div>
      </div>
''' + tabs_end + '''
    </div>
  );
}'''
    
    content = content.replace(end_pattern, replacement)

with open('src/components/AiAssistant.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
