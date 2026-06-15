import re

with open('src/pages/Automations.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

logs_component = """
const ExecutionLogs = ({ companyId }) => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['automation_logs', companyId],
    queryFn: async () => {
      const { data, error } = await base44.supabase.from('automation_logs').select(`
        *,
        automation_rules (table_name, action_type)
      `).order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!companyId
  });

  if (isLoading) return <div className="py-10 text-center">Loading logs...</div>;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-bold mb-4">Recent Executions</h3>
      <div className="space-y-4">
        {logs.map(log => (
          <div key={log.id} className="border-b border-border pb-4 last:border-0 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={log.status === 'success' ? 'default' : log.status === 'delayed' ? 'secondary' : 'destructive'}>
                  {log.status.toUpperCase()}
                </Badge>
                <span className="text-sm font-semibold">{log.automation_rules?.table_name}</span>
                <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
              </div>
              <div className="text-xs font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded mt-2">
                {Array.isArray(log.logs) ? log.logs.join(' -> ') : 'No logs recorded.'}
              </div>
            </div>
          </div>
        ))}
        {logs.length === 0 && <p className="text-muted-foreground">No execution logs found.</p>}
      </div>
    </div>
  );
};
"""

content = content.replace("// --- MAIN AUTOMATIONS COMPONENT ---", logs_component + "\n// --- MAIN AUTOMATIONS COMPONENT ---")

# Add View Logs button
content = content.replace("""{mode === 'list' && (
              <Button onClick={startNewFlow} className="gap-2 shadow-md">
                <Plus className="w-4 h-4" /> Create New Flow
              </Button>
            )}""", """{mode === 'list' && (
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setMode('logs')} className="gap-2 shadow-sm">
                  <Clock className="w-4 h-4" /> View Logs
                </Button>
                <Button onClick={startNewFlow} className="gap-2 shadow-md">
                  <Plus className="w-4 h-4" /> Create New Flow
                </Button>
              </div>
            )}
            {mode === 'logs' && (
              <Button variant="outline" onClick={() => setMode('list')} className="gap-2 shadow-sm">
                <ArrowRight className="w-4 h-4 rotate-180" /> Back to List
              </Button>
            )}""")

# Add logs view to AnimatePresence
content = content.replace("""</AnimatePresence>""", """  {mode === 'logs' && (
              <motion.div
                key="logs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ExecutionLogs companyId={companyId} />
              </motion.div>
            )}
          </AnimatePresence>""")

with open('src/pages/Automations.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
