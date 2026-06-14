import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Wand2, Zap, Save, Trash2, Edit3, 
  Settings, Bot, ArrowRight, Database, Webhook, CheckSquare, X
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { OrbitIcon } from '@/components/ui/OrbitIcon';

export default function Automations() {
  const { companyId } = useAuth();
  const [automations, setAutomations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modes: 'list', 'manual'
  const [mode, setMode] = useState('list');
  
  // Manual Builder State
  const [newRule, setNewRule] = useState({
    table_name: '',
    action_type: 'create_task',
    is_active: true
  });
  
  // Key-Value Payload Builder
  const [payloadFields, setPayloadFields] = useState([{ key: '', value: '' }]);

  useEffect(() => {
    if (companyId) {
      loadAutomations();
    }
  }, [companyId]);

  const loadAutomations = async () => {
    try {
      setIsLoading(true);
      const data = await base44.entities.AutomationRule.list();
      setAutomations(data.filter(r => r.company_id === companyId));
    } catch (e) {
      console.error(e);
      toast.error("Failed to load automations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddField = () => {
    setPayloadFields([...payloadFields, { key: '', value: '' }]);
  };

  const handleRemoveField = (index) => {
    const newFields = [...payloadFields];
    newFields.splice(index, 1);
    setPayloadFields(newFields);
  };

  const handleFieldChange = (index, field, val) => {
    const newFields = [...payloadFields];
    newFields[index][field] = val;
    setPayloadFields(newFields);
  };

  const handleSaveManual = async () => {
    if (!newRule.table_name) {
      toast.error("Please enter a trigger table");
      return;
    }

    try {
      // Fold fields into an object
      const payloadObj = {};
      for (const field of payloadFields) {
        if (field.key.trim()) {
          // Attempt to parse value as JSON (e.g. for nested objects or arrays), fallback to string
          let finalVal = field.value;
          try {
            // Only parse if it looks like json object/array or boolean/number
            if (/^[\[\{\d(true)(false)]/.test(finalVal.trim())) {
               finalVal = JSON.parse(finalVal);
            }
          } catch(e) {
            // keep as string
          }
          payloadObj[field.key.trim()] = finalVal;
        }
      }
      
      const p = {
        company_id: companyId,
        table_name: newRule.table_name,
        action_type: newRule.action_type,
        action_payload: payloadObj,
        is_active: newRule.is_active
      };
      
      await base44.entities.AutomationRule.create(p);
      toast.success("Automation Saved!");
      setMode('list');
      // Reset form
      setNewRule({ table_name: '', action_type: 'create_task', is_active: true });
      setPayloadFields([{ key: '', value: '' }]);
      loadAutomations();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this automation?")) return;
    try {
      await base44.entities.AutomationRule.delete(id);
      toast.success("Automation Deleted");
      loadAutomations();
    } catch(e) {
      toast.error(e.message);
    }
  };

  const handleOpenOrbitFlow = () => {
    // Open the global AI Assistant sidebar with context
    window.dispatchEvent(new CustomEvent("orbit:inject", { 
      detail: "USER IS ON THE AUTOMATIONS HUB. They want to create a new Automation Rule. Ask them what they want to automate, and then construct the JSON schema for an 'automation_rule' using the create_record tool."
    }));
  };

  const getActionIcon = (type) => {
    switch(type) {
      case 'create_task': return <CheckSquare className="w-5 h-5 text-primary" />;
      case 'create_record': return <Database className="w-5 h-5 text-green-600" />;
      case 'update_record': return <Edit3 className="w-5 h-5 text-emerald-600" />;
      case 'delete_record': return <Trash2 className="w-5 h-5 text-red-500" />;
      case 'http_request': return <Webhook className="w-5 h-5 text-purple-600" />;
      default: return <Zap className="w-5 h-5 text-primary" />;
    }
  };

  const getActionLabel = (type) => {
    switch(type) {
      case 'create_task': return "Create Task";
      case 'create_record': return "Create Record";
      case 'update_record': return "Update Record";
      case 'delete_record': return "Delete Record";
      case 'http_request': return "HTTP Request";
      default: return type;
    }
  };

  return (
    <div className="h-full bg-slate-50 dark:bg-background overflow-y-auto p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Automations Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Build manual routines or delegate heavy lifting to OrbitFlow AI.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {mode !== 'list' && (
            <Button variant="outline" onClick={() => setMode('list')}>
              Cancel
            </Button>
          )}
          {mode === 'list' && (
            <Button variant="outline" onClick={() => setMode('manual')} className="gap-2">
              <Settings className="w-4 h-4" />
              Manual Builder
            </Button>
          )}
          <Button onClick={handleOpenOrbitFlow} className="gap-2 bg-[hsl(158,68%,38%)] hover:bg-[hsl(158,68%,32%)] text-white shadow-md shadow-emerald-500/20">
            <OrbitIcon className="w-4 h-4 fill-white" />
            Build with OrbitFlow
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {isLoading ? (
              <div className="col-span-full py-20 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : automations.length === 0 ? (
              <div className="col-span-full py-24 flex flex-col items-center justify-center text-center bg-card border rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">No Automations Active</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Get started by creating a manual workflow or asking OrbitFlow AI to build one instantly.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setMode('manual')}>Manual Builder</Button>
                  <Button onClick={handleOpenOrbitFlow} className="bg-[hsl(158,68%,38%)] hover:bg-[hsl(158,68%,32%)]">Build with AI</Button>
                </div>
              </div>
            ) : (
              automations.map(rule => (
                <motion.div 
                  key={rule.id}
                  whileHover={{ y: -4 }}
                  className="group"
                >
                  <Card className="h-full flex flex-col hover:border-primary/50 hover:shadow-md transition-all duration-300">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            {getActionIcon(rule.action_type)}
                          </div>
                          <div>
                            <CardTitle className="text-base line-clamp-1">{rule.table_name} Event</CardTitle>
                            <CardDescription className="uppercase tracking-wider text-[10px] font-bold text-primary mt-1">
                              {getActionLabel(rule.action_type)}
                            </CardDescription>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all -mt-1 -mr-1"
                          onClick={() => handleDelete(rule.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border border-border">
                        <div className="text-[11px] font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                          <Settings className="w-3 h-3" /> PAYLOAD KEYS
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.keys(rule.action_payload || {}).map(k => (
                            <Badge variant="secondary" key={k} className="text-[10px] font-mono px-1.5 py-0">
                              {k}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 border-t mt-auto px-6 py-4">
                      <div className="flex items-center justify-between w-full">
                        <Badge variant={rule.is_active ? "default" : "secondary"}>
                          {rule.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">ID: {rule.id.split('-')[0]}</span>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {mode === 'manual' && (
          <motion.div
            key="manual"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="shadow-lg border-primary/20">
              <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Settings className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Manual Workflow Builder</CardTitle>
                    <CardDescription>Configure raw automation triggers and actions.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                
                {/* Trigger Section */}
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-border">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                    <Database className="w-4 h-4 text-primary" /> Trigger Configuration
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground ml-1">Database Table Name</label>
                    <Input 
                      value={newRule.table_name}
                      onChange={(e) => setNewRule({...newRule, table_name: e.target.value})}
                      placeholder="e.g. invoices, clients, tasks..."
                      className="bg-background"
                    />
                  </div>
                </div>

                {/* Action Section */}
                <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-border">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                    <Zap className="w-4 h-4 text-primary" /> Action Configuration
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground ml-1">Execution Type</label>
                    <select 
                      value={newRule.action_type}
                      onChange={(e) => setNewRule({...newRule, action_type: e.target.value})}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="create_task">Create Task</option>
                      <option value="create_record">Create Record</option>
                      <option value="update_record">Update Record</option>
                      <option value="delete_record">Delete Record</option>
                      <option value="http_request">HTTP Request (Webhook)</option>
                    </select>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-muted-foreground ml-1">Action Payload Mapping</label>
                      <span className="text-[10px] text-primary/80 font-medium px-2 py-0.5 bg-primary/10 rounded-full">Supports {'{{variable}}'} injection</span>
                    </div>
                    
                    <div className="space-y-3">
                      {payloadFields.map((field, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Input 
                            placeholder="Key (e.g. title, url)"
                            value={field.key}
                            onChange={(e) => handleFieldChange(idx, 'key', e.target.value)}
                            className="flex-1 font-mono text-xs bg-background"
                          />
                          <div className="text-muted-foreground mt-2 font-mono text-xs">:</div>
                          <Input 
                            placeholder="Value (e.g. Welcome {{name}})"
                            value={field.value}
                            onChange={(e) => handleFieldChange(idx, 'value', e.target.value)}
                            className="flex-[2] font-mono text-xs bg-background"
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveField(idx)}
                            disabled={payloadFields.length === 1 && !field.key && !field.value}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-xs border-dashed"
                        onClick={handleAddField}
                      >
                        <Plus className="w-3 h-3 mr-2" /> Add Payload Field
                      </Button>
                    </div>
                  </div>
                </div>

              </CardContent>
              <CardFooter className="bg-slate-50 dark:bg-slate-900/50 border-t p-6">
                <Button onClick={handleSaveManual} className="w-full font-bold shadow-md h-12 text-md">
                  <Save className="w-4 h-4 mr-2" /> Deploy Automation Rule
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
