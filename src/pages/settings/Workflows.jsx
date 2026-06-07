import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Plus, Zap, ArrowRight, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Workflows() {
  const { t } = useTranslation();
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
          <h1 className="text-2xl font-bold text-card-foreground">{t("automated_workflows", "Automated Workflows")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t(
            "build_zapier_style_triggers_an",
            "Build Zapier-style triggers and actions for your app."
          )}</p>
        </div>
        <Button className="gap-2 bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4" /> {t("new_workflow", "New Workflow")}
        </Button>
      </div>
      <div className="space-y-4">
        {rules.map(rule => {
          return (
            <div key={rule.id} className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4">
              {/* Header */}
              <div className="flex justify-between items-center border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-foreground">{t("rule", "Rule #")}{rule.id}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">{t("active", "Active")}</span>
                  <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4"/></Button>
                </div>
              </div>
              {/* Trigger Setup */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 p-4 bg-muted/30 rounded-lg border border-border">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3">{t("1_when_this_happens", "1. When this happens...")}</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <label className="text-xs text-muted-foreground">{t("table", "Table")}</label>
                      <Select defaultValue={rule.table_name}>
                        <SelectTrigger className="mt-1 bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="industry_records">{t("industry_records", "Industry Records")}</SelectItem>
                          <SelectItem value="clients">{t("clients", "Clients")}</SelectItem>
                          <SelectItem value="cases">{t("cases", "Cases")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">{t("event", "Event")}</label>
                      <Select defaultValue={rule.trigger_event}>
                        <SelectTrigger className="mt-1 bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INSERT">{t("record_created", "Record Created")}</SelectItem>
                          <SelectItem value="UPDATE">{t("record_updated", "Record Updated")}</SelectItem>
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
                  <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3">{t("2_if_conditions_match", "2. If conditions match...")}</h4>
                  {rule.conditions.map((cond, i) => {
                    return (
                      <div key={i} className="space-y-2 text-sm">
                        <Input defaultValue={cond.field} placeholder="Field (e.g. status)" className="bg-background" />
                        <Select defaultValue={cond.operator}>
                          <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">{t("equals", "Equals")}</SelectItem>
                            <SelectItem value="changed_to">{t("changed_to", "Changed To")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input defaultValue={cond.value} placeholder="Value" className="bg-background" />
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Action Setup */}
              <div className="p-4 bg-primary/5 dark:bg-primary/20 rounded-lg border border-primary/10 dark:border-primary/30">
                <h4 className="text-xs font-bold uppercase text-primary dark:text-primary/70 mb-3">{t("3_then_do_this", "3. Then do this...")}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-xs text-muted-foreground">{t("action_type", "Action Type")}</label>
                    <Select defaultValue={rule.action_type}>
                      <SelectTrigger className="mt-1 bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="send_email">{t("send_email", "Send Email")}</SelectItem>
                        <SelectItem value="create_task">{t("create_task", "Create Task")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">{t("action_details", "Action Details")}</label>
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
                <Button size="sm" className="gap-2"><Save className="w-4 h-4"/> {t("save_rule", "Save Rule")}</Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
