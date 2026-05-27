import { useState } from 'react';
import { Plus, Zap, ArrowRight, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Workflows() {
  const [rules, setRules] = useState([
    {
      id: 1,
      table_name: 'industry_records',
      trigger_event: 'UPDATE',
      conditions: [{ field: 'status', operator: 'changed_to', value: 'Approved' }],
      action_type: 'send_email',
      action_payload: { to: 'client@example.com', subject: 'Your record is approved!' },
      is_active: true
    }
  ]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">Automated Workflows</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Build Zapier-style triggers and actions for your app.</p>
        </div>
        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-4 h-4" /> New Workflow
        </Button>
      </div>

      <div className="space-y-4">
        {rules.map(rule => (
          <div key={rule.id} className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-foreground">Rule #{rule.id}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">Active</span>
                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4"/></Button>
              </div>
            </div>

            {/* Trigger Setup */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 p-4 bg-muted/30 rounded-lg border border-border">
                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3">1. When this happens...</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="text-xs text-muted-foreground">Table</label>
                    <Select defaultValue={rule.table_name}>
                      <SelectTrigger className="mt-1 bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="industry_records">Industry Records</SelectItem>
                        <SelectItem value="clients">Clients</SelectItem>
                        <SelectItem value="cases">Cases</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Event</label>
                    <Select defaultValue={rule.trigger_event}>
                      <SelectTrigger className="mt-1 bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INSERT">Record Created</SelectItem>
                        <SelectItem value="UPDATE">Record Updated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-muted-foreground/50" />
              </div>

              {/* Condition Setup */}
              <div className="md:col-span-1 p-4 bg-muted/30 rounded-lg border border-border">
                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3">2. If conditions match...</h4>
                {rule.conditions.map((cond, i) => (
                  <div key={i} className="space-y-2 text-sm">
                    <Input defaultValue={cond.field} placeholder="Field (e.g. status)" className="bg-background" />
                    <Select defaultValue={cond.operator}>
                      <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="changed_to">Changed To</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input defaultValue={cond.value} placeholder="Value" className="bg-background" />
                  </div>
                ))}
              </div>
            </div>

            {/* Action Setup */}
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
              <h4 className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400 mb-3">3. Then do this...</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-xs text-muted-foreground">Action Type</label>
                  <Select defaultValue={rule.action_type}>
                    <SelectTrigger className="mt-1 bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="send_email">Send Email</SelectItem>
                      <SelectItem value="create_task">Create Task</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Action Details</label>
                  {rule.action_type === 'send_email' && (
                    <div className="space-y-2 mt-1">
                      <Input defaultValue={rule.action_payload.to} placeholder="To Address" className="bg-background" />
                      <Input defaultValue={rule.action_payload.subject} placeholder="Subject" className="bg-background" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <Button size="sm" className="gap-2"><Save className="w-4 h-4"/> Save Rule</Button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
