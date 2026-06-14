import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Wand2, Zap, Save, Trash2, Edit3, 
  Settings, Play, Bot, AlertTriangle, ArrowRight,
  Database, Network, Webhook, CheckSquare
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { generateText } from '@/lib/cloudflareAI';
import { toast } from 'react-hot-toast';

export default function Automations() {
  const { companyId } = useAuth();
  const [automations, setAutomations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modes: 'list', 'manual', 'orbitflow'
  const [mode, setMode] = useState('list');
  
  // Manual Builder State
  const [newRule, setNewRule] = useState({
    table_name: '',
    action_type: 'create_task',
    action_payload: '{}',
    is_active: true
  });

  // OrbitFlow Builder State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);

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

  const handleSaveManual = async () => {
    try {
      let payloadObj = {};
      try {
        payloadObj = JSON.parse(newRule.action_payload);
      } catch(e) {
        toast.error("Invalid JSON in Action Payload");
        return;
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

  const handleGenerateOrbitFlow = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setAiPreview(null);
    try {
      const sysPrompt = `You are OrbitFlow, a master automation architect. 
Given a user request, output ONLY a raw JSON object representing an automation rule schema. No markdown, no intro.
Schema format:
{
  "table_name": "string (e.g. products, clients, industry_records, tasks)",
  "action_type": "string (MUST BE one of: create_task, create_record, update_record, delete_record, http_request)",
  "action_payload": { ... json object for the action ... }
}
For update_record/delete_record, make sure "id" exists in action_payload (often "{{id}}").
For http_request, include url, method, body, headers.
User prompt: ${aiPrompt}`;

      const res = await generateText([{ role: 'user', content: sysPrompt }]);
      
      // Cleanup json if wrapped in markdown
      let cleanJson = res.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      setAiPreview(parsed);
      toast.success("Automation Preview Generated!");
    } catch(e) {
      console.error(e);
      toast.error("Failed to generate automation. Try being more specific.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAiPreview = async () => {
    if (!aiPreview) return;
    try {
      const p = {
        company_id: companyId,
        table_name: aiPreview.table_name,
        action_type: aiPreview.action_type,
        action_payload: aiPreview.action_payload,
        is_active: true
      };
      await base44.entities.AutomationRule.create(p);
      toast.success("OrbitFlow Automation Saved!");
      setMode('list');
      loadAutomations();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const getActionIcon = (type) => {
    switch(type) {
      case 'create_task': return <CheckSquare className="w-5 h-5 text-blue-500" />;
      case 'create_record': return <Database className="w-5 h-5 text-green-500" />;
      case 'update_record': return <Edit3 className="w-5 h-5 text-yellow-500" />;
      case 'delete_record': return <Trash2 className="w-5 h-5 text-red-500" />;
      case 'http_request': return <Webhook className="w-5 h-5 text-purple-500" />;
      default: return <Zap className="w-5 h-5 text-orange-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 p-6 md:p-10 font-inter">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Automations Hub
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Supercharge your workflow. Build manual routines or delegate to OrbitFlow AI.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setMode('manual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
              mode === 'manual' 
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white' 
                : 'bg-white dark:bg-[#18181b] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Settings className="w-4 h-4" />
            Manual Builder
          </button>
          <button 
            onClick={() => { setMode('orbitflow'); setAiPreview(null); setAiPrompt(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
              mode === 'orbitflow' 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30' 
                : 'bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white shadow-md'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            Build with OrbitFlow
          </button>
          {mode !== 'list' && (
            <button 
              onClick={() => setMode('list')}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl font-semibold transition-all"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {isLoading ? (
              <div className="col-span-full py-20 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            ) : automations.length === 0 ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white dark:bg-[#18181b] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">No Automations Yet</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Get started by creating a manual workflow or asking OrbitFlow AI to build one for you.
                </p>
              </div>
            ) : (
              automations.map(rule => (
                <motion.div 
                  key={rule.id}
                  whileHover={{ y: -4 }}
                  className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        {getActionIcon(rule.action_type)}
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Trigger</div>
                        <div className="font-bold">{rule.table_name} Update</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(rule.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800/50">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Action Type</div>
                    <div className="font-mono text-sm text-indigo-600 dark:text-indigo-400 break-all mb-3">
                      {rule.action_type}
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Payload Keys</div>
                    <div className="text-sm font-medium flex flex-wrap gap-2">
                      {Object.keys(rule.action_payload || {}).map(k => (
                        <span key={k} className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
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
            className="max-w-3xl mx-auto bg-white dark:bg-[#18181b] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Manual Builder</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Configure raw automation parameters.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Trigger Table</label>
                <input 
                  type="text"
                  value={newRule.table_name}
                  onChange={(e) => setNewRule({...newRule, table_name: e.target.value})}
                  placeholder="e.g. industry_records, clients, invoices"
                  className="w-full bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Action Type</label>
                <select 
                  value={newRule.action_type}
                  onChange={(e) => setNewRule({...newRule, action_type: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                >
                  <option value="create_task">Create Task</option>
                  <option value="create_record">Create Record</option>
                  <option value="update_record">Update Record</option>
                  <option value="delete_record">Delete Record</option>
                  <option value="http_request">HTTP Request (Webhook)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex justify-between">
                  <span>Action Payload (JSON)</span>
                  <span className="text-xs text-indigo-500 font-normal">Supports {'{{variables}}'}</span>
                </label>
                <textarea 
                  value={newRule.action_payload}
                  onChange={(e) => setNewRule({...newRule, action_payload: e.target.value})}
                  rows={6}
                  className="w-full bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder='{"title": "Welcome {{name}}!"}'
                />
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={handleSaveManual}
                  className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-all shadow-md flex justify-center items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Save Automation
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {mode === 'orbitflow' && (
          <motion.div
            key="orbitflow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto"
          >
            {/* The Prompt Box */}
            <div className="bg-white dark:bg-[#18181b] border-2 border-indigo-500/30 rounded-3xl p-2 shadow-2xl shadow-indigo-500/10 flex relative mb-10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 pointer-events-none"></div>
              
              <div className="p-4 flex items-center justify-center">
                <Bot className="w-8 h-8 text-indigo-500" />
              </div>
              <input 
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateOrbitFlow()}
                placeholder="What should I automate for you? (e.g., 'When an invoice is created, hit my webhook URL...')"
                className="flex-1 bg-transparent border-none outline-none text-lg px-2 font-medium relative z-10 w-full text-slate-900 dark:text-white"
              />
              <button 
                onClick={handleGenerateOrbitFlow}
                disabled={isGenerating || !aiPrompt.trim()}
                className="my-2 mr-2 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-2xl font-bold flex items-center gap-2 transition-all relative z-10 shrink-0"
              >
                {isGenerating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Generate <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Preview Card */}
            <AnimatePresence>
              {aiPreview && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                  
                  <div className="flex items-center gap-3 mb-8 relative z-10">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center">
                      <Wand2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">OrbitFlow Preview</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Review the generated schema before saving.</p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-10 relative z-10">
                    {/* Trigger Node */}
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full md:w-64 text-center shadow-sm">
                      <div className="w-12 h-12 mx-auto bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center mb-3">
                        <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Trigger Event</div>
                      <div className="font-bold text-lg">{aiPreview.table_name}</div>
                    </div>

                    <ArrowRight className="w-8 h-8 text-slate-300 dark:text-slate-700 hidden md:block" />
                    <ArrowRight className="w-8 h-8 text-slate-300 dark:text-slate-700 block md:hidden rotate-90" />

                    {/* Action Node */}
                    <div className="bg-slate-50 dark:bg-slate-900 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-6 w-full md:w-64 text-center shadow-sm ring-1 ring-indigo-500/10">
                      <div className="w-12 h-12 mx-auto bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center mb-3">
                        {getActionIcon(aiPreview.action_type)}
                      </div>
                      <div className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">Action execution</div>
                      <div className="font-bold text-lg">{aiPreview.action_type}</div>
                    </div>
                  </div>

                  <div className="bg-[#09090b] rounded-2xl p-6 relative z-10 shadow-inner overflow-x-auto border border-slate-800">
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                      <Bot className="w-4 h-4" /> Raw Payload Data
                    </div>
                    <pre className="text-sm font-mono text-green-400">
                      {JSON.stringify(aiPreview.action_payload, null, 2)}
                    </pre>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4 relative z-10">
                    <button 
                      onClick={() => setAiPreview(null)}
                      className="px-6 py-3 font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    >
                      Discard
                    </button>
                    <button 
                      onClick={handleSaveAiPreview}
                      className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      Save Automation
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
