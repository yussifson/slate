import re

with open('src/components/AiAssistant.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
in_main_panel = False
for line in lines:
    if '{/* Page Context Bar */}' in line:
        # Before Page Context Bar, insert Tabs and Command Center UI
        tabs_ui = '''      {/* Tabs navigation */}
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
'''
        new_lines.append(tabs_ui)
        new_lines.append(line)
    elif '</div>' in line and '</div>' == line.strip() and len(new_lines) > 0 and new_lines[-1].strip() == '</form>':
        # We just added </form>, now we need to close the wrapped div
        new_lines.append('        </div>\n')
        new_lines.append('      )}\n')
        new_lines.append(line)
    else:
        new_lines.append(line)

with open('src/components/AiAssistant.jsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
