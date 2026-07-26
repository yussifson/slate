import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Wand2, Zap, Save, Trash2, Edit3, 
  Settings, Bot, ArrowRight, Database, Webhook, CheckSquare, X, Mail, GitBranch, Clock, ArrowLeft, Play, List
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { OrbitIcon } from '@/components/ui/OrbitIcon';
import { supabase } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { getTerm } from '@/config/industries';
import { SCHEMA_COLUMNS } from '@/api/schemaColumns';

// React Flow Imports
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Handle,
  Position,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { OrbitLoader } from "@/components/ui/orbit-loader";

// --- CUSTOM NODES ---

const TriggerNode = ({ data }) => {
  return (
    <div className="bg-white dark:bg-card border-2 border-indigo-500 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] w-64 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
      <div className="bg-indigo-500/10/10 px-4 py-2 border-b border-indigo-500/20 flex items-center gap-2">
        <Database className="w-4 h-4 text-indigo-500" />
        <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider tracking-[0.04em]">Database Trigger</span>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <span className="text-sm font-semibold text-slate-800 dark:text-foreground">
          {data.label || 'Select an Event'}
        </span>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-indigo-500/10 border-2 border-white" />
    </div>
  );
};

const ActionNode = ({ data }) => {
  const getIcon = () => {
    switch(data.actionType) {
      case 'send_notification': return <Mail className="w-4 h-4 text-emerald-500" />;
      case 'create_task': return <CheckSquare className="w-4 h-4 text-emerald-500" />;
      case 'webhook': return <Webhook className="w-4 h-4 text-emerald-500" />;
      case 'sendgrid': return <Mail className="w-4 h-4 text-emerald-500" />;
      case 'twilio': return <Zap className="w-4 h-4 text-emerald-500" />;
      default: return <Zap className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="bg-white dark:bg-card border-2 border-emerald-500 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] w-64 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-emerald-500/10 border-2 border-white" />
      <div className="bg-emerald-500/10/10 px-4 py-2 border-b border-emerald-500/20 flex items-center gap-2">
        {getIcon()}
        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider tracking-[0.04em]">Action</span>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <span className="text-sm font-semibold text-slate-800 dark:text-foreground">
          {data.label || 'Select an Action'}
        </span>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-emerald-500/10 border-2 border-white" />
    </div>
  );
};


const ConditionNode = ({ data }) => {
  return (
    <div className="bg-white dark:bg-card border-2 border-amber-500 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] w-64 overflow-hidden relative hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-amber-500 border-2 border-white" />
      <div className="bg-amber-500/10 px-4 py-2 border-b border-amber-500/20 flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-amber-500" />
        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider tracking-[0.04em]">Condition</span>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <span className="text-sm font-semibold text-slate-800 dark:text-foreground">
          {data.label || 'If / Else'}
        </span>
      </div>
      <Handle type="source" position={Position.Right} id="true" style={{ top: '30%' }} className="w-3 h-3 bg-emerald-500/10 border-2 border-white" />
      <div className="absolute right-[-24px] top-[22%] text-[10px] font-semibold text-emerald-500">TRUE</div>
      <Handle type="source" position={Position.Right} id="false" style={{ top: '70%' }} className="w-3 h-3 bg-rose-500 border-2 border-white" />
      <div className="absolute right-[-28px] top-[62%] text-[10px] font-semibold text-rose-500">FALSE</div>
    </div>
  );
};

const DelayNode = ({ data }) => {
  return (
    <div className="bg-white dark:bg-card border-2 border-blue-500 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] w-64 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500/10 border-2 border-white" />
      <div className="bg-blue-500/10/10 px-4 py-2 border-b border-blue-500/20 flex items-center gap-2">
        <Clock className="w-4 h-4 text-blue-500" />
        <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider tracking-[0.04em]">Delay</span>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <span className="text-sm font-semibold text-slate-800 dark:text-foreground">
          {data.label || 'Wait'}
        </span>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500/10 border-2 border-white" />
    </div>
  );
};

const nodeTypes = {
  triggerNode: TriggerNode,
  actionNode: ActionNode,
  conditionNode: ConditionNode,
  delayNode: DelayNode};


// --- SIDEBAR DRAG COMPONENT ---
const Sidebar = () => {
  const onDragStart = (event, nodeType, actionType = null) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    if (actionType) event.dataTransfer.setData('actionType', actionType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 border-l border-[0.5px] border-black/9 dark:border-white/8 bg-slate-50/50 dark:bg-card/50 p-4 flex flex-col gap-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#71717a] dark:text-gray-400 mb-3 tracking-[0.04em]">Triggers</h3>
        <div 
          className="bg-white dark:bg-secondary border-[0.5px] border-black/9 dark:border-white/8 border-indigo-200 dark:border-indigo-900/50 p-3 rounded-xl flex items-center gap-3 cursor-grab hover:border-indigo-400 hover:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
          onDragStart={(event) => onDragStart(event, 'triggerNode')}
          draggable
        >
          <Database className="w-5 h-5 text-indigo-500" />
          <span className="text-sm font-medium">Record Created</span>
        </div>
      </div>

      
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#71717a] dark:text-gray-400 mb-3 tracking-[0.04em]">Logic</h3>
        <div className="space-y-2">
          <div 
            className="bg-white dark:bg-secondary border-[0.5px] border-black/9 dark:border-white/8 border-amber-200 dark:border-amber-900/50 p-3 rounded-xl flex items-center gap-3 cursor-grab hover:border-amber-400 hover:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
            onDragStart={(event) => onDragStart(event, 'conditionNode')}
            draggable
          >
            <GitBranch className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-medium">Condition (If/Else)</span>
          </div>
          <div 
            className="bg-white dark:bg-secondary border-[0.5px] border-black/9 dark:border-white/8 border-blue-200 dark:border-blue-900/50 p-3 rounded-xl flex items-center gap-3 cursor-grab hover:border-blue-400 hover:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
            onDragStart={(event) => onDragStart(event, 'delayNode')}
            draggable
          >
            <Clock className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium">Delay</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#71717a] dark:text-gray-400 mb-3 tracking-[0.04em]">Actions</h3>
        <div className="space-y-2">
          <div 
            className="bg-white dark:bg-secondary border-[0.5px] border-black/9 dark:border-white/8 border-emerald-200 dark:border-emerald-900/50 p-3 rounded-xl flex items-center gap-3 cursor-grab hover:border-emerald-400 hover:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
            onDragStart={(event) => onDragStart(event, 'actionNode', 'send_notification')}
            draggable
          >
            <Mail className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium">Send Notification</span>
          </div>
          <div 
            className="bg-white dark:bg-secondary border-[0.5px] border-black/9 dark:border-white/8 border-emerald-200 dark:border-emerald-900/50 p-3 rounded-xl flex items-center gap-3 cursor-grab hover:border-emerald-400 hover:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
            onDragStart={(event) => onDragStart(event, 'actionNode', 'create_task')}
            draggable
          >
            <CheckSquare className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium">Create Task</span>
          </div>
          <div 
            className="bg-white dark:bg-secondary border-[0.5px] border-black/9 dark:border-white/8 border-emerald-200 dark:border-emerald-900/50 p-3 rounded-xl flex items-center gap-3 cursor-grab hover:border-emerald-400 hover:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
            onDragStart={(event) => onDragStart(event, 'actionNode', 'webhook')}
            draggable
          >
            <Webhook className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium">HTTP Webhook</span>
          </div>
          <div 
            className="bg-white dark:bg-secondary border-[0.5px] border-black/9 dark:border-white/8 border-emerald-200 dark:border-emerald-900/50 p-3 rounded-xl flex items-center gap-3 cursor-grab hover:border-emerald-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-all duration-200"
            onDragStart={(event) => onDragStart(event, 'actionNode', 'sendgrid')}
            draggable
          >
            <Mail className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium">SendGrid Email</span>
          </div>
          <div 
            className="bg-white dark:bg-secondary border-[0.5px] border-black/9 dark:border-white/8 border-emerald-200 dark:border-emerald-900/50 p-3 rounded-xl flex items-center gap-3 cursor-grab hover:border-emerald-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-all duration-200"
            onDragStart={(event) => onDragStart(event, 'actionNode', 'twilio')}
            draggable
          >
            <Zap className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium">Twilio SMS</span>
          </div>
        </div>
      </div>
    </div>
  );
};


const ExecutionLogs = ({ companyId, setMode }) => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['automation_logs', companyId],
    queryFn: async () => {
      const { data, error } = await base44.supabase.from('automation_runs').select(`
        *,
        automations (name, trigger_key)
      `).order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!companyId
  });

  if (isLoading) return <div className="py-10 text-center">Loading logs...</div>;

  return (
    <div className="bg-white dark:bg-card rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm border-[0.5px] border-black/9 dark:border-white/8 p-6 relative hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
      <Button 
        variant="outline" 
        size="sm" 
        className="absolute top-4 right-4" 
        onClick={() => setMode('list')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>
      <h3 className="text-lg font-semibold mb-4">Recent Executions</h3>
      <div className="space-y-4">
        {logs.map(log => (
          <div key={log.id} className="border-b border-[0.5px] border-black/9 dark:border-white/8 pb-4 last:border-0 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={log.status === 'success' ? 'default' : log.status === 'delayed' ? 'secondary' : 'destructive'}>
                  {log.status.toUpperCase()}
                </Badge>
                <span className="text-sm font-semibold">{log.automations?.name}</span>
                <span className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{new Date(log.created_at).toLocaleString()}</span>
              </div>
              <div className="text-xs font-mono bg-slate-100 dark:bg-secondary p-2 rounded-md mt-2 tracking-[0.04em]">
                {Array.isArray(log.logs) ? log.logs.join(' -> ') : 'No logs recorded.'}
              </div>
            </div>
          </div>
        ))}
        {logs.length === 0 && <p className="text-[#71717a] dark:text-gray-400">No execution logs found.</p>}
      </div>
    </div>
  );
};

// --- VARIABLE PICKER COMPONENT ---
const VariablePicker = ({ triggerTable, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const columns = triggerTable && SCHEMA_COLUMNS[triggerTable] ? SCHEMA_COLUMNS[triggerTable] : [];

  if (columns.length === 0) return null;

  return (
    <div className="relative inline-block text-left mt-1">
      <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 text-primary" onClick={() => setIsOpen(!isOpen)}>
        {'{ }'} Insert Variable
      </Button>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-48 rounded-lg bg-white dark:bg-secondary shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border-[0.5px] border-black/9 dark:border-white/8 border-[0.5px] border-black/9 dark:border-white/8 max-h-48 overflow-y-auto hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="py-1">
            {columns.map((col) => (
              <button
                key={col}
                className="block w-full text-left px-4 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 tracking-[0.04em]"
                onClick={() => { onSelect(`{{${col}}}`); setIsOpen(false); }}
              >
                {col}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN AUTOMATIONS COMPONENT ---
export default function Automations() {
  const { user } = useAuth();
  const companyId = user?.company_id;
  const [automations, setAutomations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState('list'); // 'list', 'builder', 'logs'
  const [testRunLogs, setTestRunLogs] = useState(null);
  const [editingRuleId, setEditingRuleId] = useState(null);

  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // Configuration Panel State
  const [selectedNode, setSelectedNode] = useState(null);

  const { data: customModels = [] } = useQuery({
    queryKey: ["custom-models", companyId],
    queryFn: async () => {
      const records = await base44.entities.IndustryRecord.filter({ company_id: companyId });
      return [...new Set(records.map(r => r.record_type).filter(Boolean))];
    },
    enabled: !!companyId
  });

  const industry = user?.company_industry || "law";

  const [triggerRegistry, setTriggerRegistry] = useState([]);
  const [actionRegistry, setActionRegistry] = useState([]);

  useEffect(() => {
    async function fetchRegistries() {
      const { data: triggers } = await base44.supabase.from('automation_triggers').select('*').eq('is_active', true);
      const { data: actions } = await base44.supabase.from('automation_actions').select('*').eq('is_active', true);
      if (triggers) setTriggerRegistry(triggers);
      if (actions) setActionRegistry(actions);
    }
    fetchRegistries();
  }, []);

  const CORE_TRIGGERS = triggerRegistry.map(t => ({ label: t.display_name, value: t.trigger_key, schema: t.data_schema }));


  useEffect(() => {
    if (companyId) loadAutomations();
  }, [companyId]);

  useEffect(() => {
    const handleAIPreview = (e) => {
      const { trigger, steps, actions } = e.detail;
      
      const newNodes = [];
      const newEdges = [];

      const triggerId = `node_${Date.now()}_trigger`;
      newNodes.push({
        id: triggerId,
        type: 'triggerNode',
        position: { x: 100, y: 150 },
        data: { 
          label: CORE_TRIGGERS.find(t => t.value === trigger.table)?.label || `New Record in ${trigger.table}`,
          config: { tableName: trigger.table }
        }
      });

      const traverseSteps = (stepsArray, parentId, xOffset, yOffset, edgeSourceHandle) => {
        let currentParent = parentId;
        let currentY = yOffset;
        
        if (!stepsArray) return;

        stepsArray.forEach((step) => {
           const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
           let nodeType = 'actionNode';
           let nodeData = { config: step.config || {} };
           
           if (step.type === 'delay') {
              nodeType = 'delayNode';
              nodeData.label = `Wait ${step.config?.amount} ${step.config?.unit}`;
           } else if (step.type === 'condition') {
              nodeType = 'conditionNode';
              nodeData.label = `If ${step.config?.variable} ${step.config?.operator} ${step.config?.value}`;
           } else {
              nodeType = 'actionNode';
              nodeData.actionType = step.type;
              nodeData.label = step.type?.replace('_', ' ').toUpperCase() || 'ACTION';
              nodeData.config.payload = step.config || {};
           }
           
           newNodes.push({
             id: nodeId,
             type: nodeType,
             position: { x: xOffset, y: currentY },
             data: nodeData
           });
           
           if (currentParent) {
             newEdges.push({
               id: `edge_${currentParent}_${nodeId}`,
               source: currentParent,
               target: nodeId,
               sourceHandle: edgeSourceHandle,
               animated: true,
               style: { stroke: '#10b981', strokeWidth: 2 }
             });
           }
           
           if (step.type === 'condition') {
             if (step.true_steps && step.true_steps.length > 0) {
               traverseSteps(step.true_steps, nodeId, xOffset + 350, currentY - 100, 'true');
             }
             if (step.false_steps && step.false_steps.length > 0) {
               traverseSteps(step.false_steps, nodeId, xOffset + 350, currentY + 150, 'false');
             }
             currentParent = null; // Branched out
           } else {
             currentParent = nodeId;
             xOffset += 350;
             edgeSourceHandle = undefined;
           }
        });
      };

      if (steps) {
        traverseSteps(steps, triggerId, 450, 150);
      } else if (actions) {
        // Fallback for old prompt actions
        let prevId = triggerId;
        actions.forEach((act, idx) => {
          const actionId = `node_${Date.now()}_act_${idx}`;
          newNodes.push({
            id: actionId,
            type: 'actionNode',
            position: { x: 450 + (idx * 300), y: 150 },
            data: {
              label: act.type.replace('_', ' ').toUpperCase(),
              actionType: act.type,
              config: { payload: act.payload, actionTitle: act.type }
            }
          });
          newEdges.push({
            id: `edge_${prevId}_${actionId}`,
            source: prevId,
            target: actionId,
            animated: true,
            style: { stroke: '#10b981', strokeWidth: 2 }
          });
          prevId = actionId;
        });
      }

      setNodes(newNodes);
      setEdges(newEdges);
      setMode('builder');
    };

    window.addEventListener('orbit:preview-automation', handleAIPreview);
    return () => window.removeEventListener('orbit:preview-automation', handleAIPreview);
  }, [setNodes, setEdges]);

  const loadAutomations = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('automation_rules').select('*').eq('company_id', companyId);
      if (error) throw error;
      setAutomations(data || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load automations");
    } finally {
      setIsLoading(false);
    }
  };

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#10b981', strokeWidth: 2 } }, eds)),
    [setEdges],
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const type = event.dataTransfer.getData('application/reactflow');
      const actionType = event.dataTransfer.getData('actionType');

      if (typeof type === 'undefined' || !type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY});

      const newNode = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: { 
          label: type === 'triggerNode' ? 'Select Table...' : 'Configure Action...',
          actionType,
          config: {} 
        }};

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes],
  );

  const onNodeClick = (_, node) => {
    setSelectedNode(node);
  };

  const handleUpdateNodeConfig = (key, value) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNode.id) {
          const newData = { ...n.data, config: { ...n.data.config, [key]: value } };
          // Auto-update label based on config
          if (n.type === 'triggerNode' && key === 'tableName') {
            const foundCore = CORE_TRIGGERS.find(t => t.value === value);
            newData.label = foundCore ? foundCore.label : (value ? `New Record in ${value.replace(/_/g, ' ')}` : 'Select an Event');
          }
          if (n.type === 'actionNode' && key === 'actionTitle') {
             newData.label = value || 'Configure Action...';
          }
          const updatedNode = { ...n, data: newData };
          setSelectedNode(updatedNode); // update local state so panel re-renders
          return updatedNode;
        }
        return n;
      })
    );
  };

  const handleSaveAutomation = async () => {
    // Basic validation: need at least 1 trigger and 1 action connected
    const trigger = nodes.find(n => n.type === 'triggerNode');
    
    if (!trigger || edges.length === 0) {
      toast.error("Please connect a Trigger to at least one Node.");
      return;
    }

    if (!trigger.data.config?.tableName) {
      toast.error("Please configure the Trigger event.");
      return;
    }

    try {
      const payload = {
        company_id: companyId,
        name: trigger.data.config.tableName + " Flow",
        description: "Visual builder flow",
        trigger_key: trigger.data.config.tableName,
        steps: nodes.filter(n => n.type === 'actionNode').map(n => ({ action_key: n.data.actionType, config: n.data.config })),
        is_active: true
      };

      let ruleRes;
      if (editingRuleId) {
        const { data, error } = await supabase.from('automation_rules').update(payload).eq('id', editingRuleId).select().single();
        if (error) throw error;
        ruleRes = data;
      } else {
        const { data, error } = await supabase.from('automation_rules').insert(payload).select().single();
        if (error) throw error;
        ruleRes = data;
      }

      toast.success(editingRuleId ? "Automation Updated!" : "Automation Deployed!");
      setMode('list');
      loadAutomations();
    } catch(e) {
      toast.error("Failed to deploy automation: " + e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this automation?")) return;
    try {
      await supabase.from('automation_rules').delete().eq('id', id);
      toast.success("Automation Deleted");
      loadAutomations();
    } catch(e) {
      toast.error(e.message);
    }
  };

  const startNewFlow = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setEditingRuleId(null);
    setMode('builder');
  };

  const editFlow = (rule) => {
    setNodes((rule.steps ? [] : []) || []);
    setEdges((rule.steps ? [] : []) || []);
    setSelectedNode(null);
    setEditingRuleId(rule.id);
    setMode('builder');
  };

  const triggerNodeForVars = nodes.find(n => n.type === 'triggerNode');
  const triggerTableForVars = triggerNodeForVars?.data?.config?.tableName;

  const handleTestRun = () => {
    if (nodes.length === 0) {
      toast.error("No nodes to test.");
      return;
    }
    const tLogs = [];
    tLogs.push({ time: new Date().toISOString(), msg: "Starting Sandbox Simulation..." });
    let currentNode = nodes.find(n => n.type === 'triggerNode');
    if (!currentNode) {
      tLogs.push({ time: new Date().toISOString(), msg: "ERROR: No Trigger Node found." });
      setTestRunLogs(tLogs);
      return;
    }
    tLogs.push({ time: new Date().toISOString(), msg: `Trigger: ${currentNode.data.label}` });
    
    let currentEdge = edges.find(e => e.source === currentNode.id);
    let stepCount = 0;
    while(currentEdge && stepCount < 20) {
      stepCount++;
      currentNode = nodes.find(n => n.id === currentEdge.target);
      if (!currentNode) break;
      tLogs.push({ time: new Date().toISOString(), msg: `Executing Node: ${currentNode.data.label}` });
      if (currentNode.type === 'conditionNode') {
        tLogs.push({ time: new Date().toISOString(), msg: `Condition Evaluated to TRUE (Simulated)` });
        currentEdge = edges.find(e => e.source === currentNode.id && e.sourceHandle === 'true') || edges.find(e => e.source === currentNode.id);
      } else {
        currentEdge = edges.find(e => e.source === currentNode.id);
      }
    }
    tLogs.push({ time: new Date().toISOString(), msg: "Simulation Completed." });
    setTestRunLogs(tLogs);
  };

  return (
    <div className="h-full bg-slate-50 dark:bg-background overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-none p-6 md:p-8 flex flex-wrap justify-between items-start md:items-center gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-3 tracking-[-0.02em] flex-wrap">
            <Wand2 className="w-8 h-8 text-primary flex-shrink-0" />
            Slate Flow Builder
          </h1>
          <p className="text-[#71717a] dark:text-gray-400 mt-1">
            Visually automate your workflows across any module or custom app.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {mode === 'builder' && (
            <>
              <Button variant="outline" onClick={() => setMode('list')}>Cancel</Button>
                <Button variant="secondary" size="sm" className="h-8 gap-2" onClick={handleTestRun}>
                  <Play className="w-4 h-4 text-emerald-500 fill-emerald-500" /> Test Run
                </Button>
                <Button size="sm" className="h-8 gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={handleSaveAutomation}>
                  <Save className="w-4 h-4" /> Deploy Workflow
                </Button>
            </>
          )}
            {mode === 'list' && (
              <div className="flex flex-wrap gap-2 items-center">
                <Button 
                  onClick={() => setMode('logs')} 
                  variant="outline"
                  className="gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]"
                >
                  View Logs
                </Button>
                <Button 
                  onClick={() => window.dispatchEvent(new CustomEvent("orbit:inject", { detail: { label: "Orbit Automation Builder", query: "Help me build an automation flow." } }))} 
                  variant="secondary"
                  className="gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900"
                >
                  <OrbitIcon className="w-4 h-4 fill-current flex-shrink-0" /> Automate with Orbit
                </Button>
                <Button onClick={startNewFlow} className="gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
                  <Plus className="w-4 h-4 flex-shrink-0" /> Create New Flow
                </Button>
              </div>
            )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-8">
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
                  <OrbitLoader size="md" />
                </div>
              ) : automations.length === 0 ? (
                <div className="col-span-full py-24 flex flex-col items-center justify-center text-center bg-card border-[0.5px] border-black/9 dark:border-white/8 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Zap className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Active Flows</h3>
                  <p className="text-[#71717a] dark:text-gray-400 max-w-md mx-auto mb-6">
                    Create your first visual automation to connect your custom Orbit modules to notifications, tasks, and webhooks!
                  </p>
                  <Button onClick={startNewFlow}>Start Building</Button>
                </div>
              ) : (
                automations.map(rule => (
                  <motion.div 
                    key={rule.id}
                    whileHover={{ y: -4 }}
                    className="group"
                  >
                    <Card className="h-full flex flex-col hover:border-primary/50 hover:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <Zap className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-base line-clamp-1">{rule.trigger_key || rule.name} Flow</CardTitle>
                              <CardDescription className="uppercase tracking-wider text-[10px] font-semibold text-primary mt-1 tracking-[0.04em]">
                                {(rule.trigger_key || '').replace(/_/g, ' ')}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-[#71717a] dark:text-gray-400 opacity-0 group-hover:opacity-100 hover:text-indigo-500 hover:bg-indigo-500/10 transition-all -mt-1"
                              onClick={() => editFlow(rule)}
                            >
                              <Play className="w-4 h-4 fill-current rotate-90" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-[#71717a] dark:text-gray-400 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all -mt-1 -mr-1"
                              onClick={() => handleDelete(rule.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col justify-center gap-3">
                        {rule.trigger_key === 'webhook_inbound' ? (
                          <div className="flex flex-col gap-2 w-full bg-slate-100 dark:bg-secondary p-2 rounded-lg border-[0.5px] border-black/9 dark:border-white/8 text-[10px]">
                            <span className="font-semibold text-[#71717a] dark:text-gray-400">Webhook URL:</span>
                            <div className="flex items-center gap-2 w-full">
                              <code className="flex-1 truncate select-all">https://wmabgiafwamxkcgxyhee.supabase.co/functions/v1/automation-webhook?rule_id={rule.id}</code>
                              <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => {
                                navigator.clipboard.writeText(`https://wmabgiafwamxkcgxyhee.supabase.co/functions/v1/automation-webhook?rule_id=${rule.id}`);
                                toast.success("URL Copied!");
                              }}><CheckSquare className="w-3 h-3"/></Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold tracking-[0.04em]">
                              {rule.trigger_key}
                            </div>
                            <ArrowRight className="w-4 h-4 text-[#71717a] dark:text-gray-400" />
                            <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold tracking-[0.04em]">
                              Action
                            </div>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="pt-0 border-t mt-auto px-6 py-4">
                        <div className="flex items-center justify-between w-full">
                          <Badge variant={rule.is_active ? "default" : "secondary"}>
                            {rule.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <span className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Flow ID: {rule.id.split('-')[0]}</span>
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {mode === 'builder' && (
            <motion.div
              key="builder"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="h-[75vh] bg-white dark:bg-background border-[0.5px] border-black/9 dark:border-white/8 border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm flex overflow-hidden relative hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
            >
              <ReactFlowProvider>
                {/* Visual Canvas */}
                <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onInit={setReactFlowInstance}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onNodeClick={onNodeClick}
                    onPaneClick={() => setSelectedNode(null)}
                    nodeTypes={nodeTypes}
                    fitView
                    className="bg-slate-50/50 dark:bg-background"
                  >
                    <Background color="#94a3b8" gap={24} size={2} />
                    <Controls className="bg-white dark:bg-secondary shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border-[0.5px] border-black/9 dark:border-white/8 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />
                    
                    {/* Floating Info Panel */}
                    <Panel position="top-left" className="bg-white/90 dark:bg-card/90 p-3 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border-[0.5px] border-black/9 dark:border-white/8 backdrop-blur-sm hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <OrbitIcon className="w-4 h-4 fill-primary" /> Flow Builder
                      </h3>
                      <p className="text-xs text-[#71717a] dark:text-gray-400 mt-1 tracking-[0.04em]">Drag nodes from the right sidebar.</p>
                    </Panel>
                  </ReactFlow>

                  {/* Configuration Overlay Panel */}
                  <AnimatePresence>
                    {selectedNode && (
                      <motion.div 
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        className="absolute right-4 top-4 w-80 bg-white dark:bg-card rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-2xl border-[0.5px] border-black/9 dark:border-white/8 border-[0.5px] border-black/9 dark:border-white/8 overflow-hidden z-50 flex flex-col max-h-[90%] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
                      >
                        <div className="p-4 border-b bg-slate-50 dark:bg-secondary flex justify-between items-center">
                          <h3 className="font-semibold">
                            {selectedNode.type === 'triggerNode' ? 'Configure Trigger' : 'Configure Action'}
                          </h3>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedNode(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 space-y-4">
                          
                          {selectedNode.type === 'triggerNode' && (
                            <div className="space-y-2">
                              <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 tracking-[0.04em]">When this happens...</label>
                              <select 
                                className="flex h-10 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                value={selectedNode.data.config?.tableName || ''}
                                onChange={(e) => handleUpdateNodeConfig('tableName', e.target.value)}
                              >
                                <option value="" disabled>Select an Event</option>
                                <optgroup label="Core Events">
                                  {CORE_TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </optgroup>
                                {customModels.length > 0 && (
                                  <optgroup label="Custom Apps">
                                    {customModels.map(m => <option key={m} value={m}>New Record in {m.replace(/_/g, ' ')}</option>)}
                                  </optgroup>
                                )}
                              </select>
                              <p className="text-[10px] text-[#71717a] dark:text-gray-400">
                                {selectedNode.data.config?.tableName === 'webhook_inbound' 
                                  ? "Save this flow to generate a unique Webhook URL."
                                  : "The automation will run automatically when this event occurs."}
                              </p>
                            </div>
                          )}

                          {selectedNode.type === 'actionNode' && (
                            <>
                              <div className="space-y-2">
                                <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Action Title</label>
                                <Input 
                                  placeholder="e.g. Send Welcome Email" 
                                  value={selectedNode.data.config?.actionTitle || ''}
                                  onChange={(e) => handleUpdateNodeConfig('actionTitle', e.target.value)}
                                />
                              </div>
                              
                              <div className="space-y-4 pt-4 border-t mt-4">
                                {selectedNode.data.actionType === 'send_notification' && (
                                  <>
                                    <div className="space-y-1">
                                      <label className="text-xs font-semibold text-foreground flex justify-between items-center tracking-[0.04em]">
                                        Recipient Email
                                        <VariablePicker 
                                          triggerTable={triggerTableForVars} 
                                          onSelect={(v) => handleUpdateNodeConfig('payload', { ...(selectedNode.data.config.payload || {}), recipient: (selectedNode.data.config?.payload?.recipient || '') + v })}
                                        />
                                      </label>
                                      <Input 
                                        placeholder="e.g. {{email}}" 
                                        value={selectedNode.data.config?.payload?.recipient || ''}
                                        onChange={(e) => handleUpdateNodeConfig('payload', { ...(selectedNode.data.config.payload || {}), recipient: e.target.value })}
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-xs font-semibold text-foreground flex justify-between items-center tracking-[0.04em]">
                                        Message
                                        <VariablePicker 
                                          triggerTable={triggerTableForVars} 
                                          onSelect={(v) => handleUpdateNodeConfig('payload', { ...(selectedNode.data.config.payload || {}), message: (selectedNode.data.config?.payload?.message || '') + v })}
                                        />
                                      </label>
                                      <textarea 
                                        className="flex w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm h-24 resize-none"
                                        placeholder="Welcome to our platform!" 
                                        value={selectedNode.data.config?.payload?.message || ''}
                                        onChange={(e) => handleUpdateNodeConfig('payload', { ...(selectedNode.data.config.payload || {}), message: e.target.value })}
                                      />
                                    </div>
                                  </>
                                )}

                                {selectedNode.data.actionType === 'create_task' && (
                                  <>
                                    <div className="space-y-1">
                                      <label className="text-xs font-semibold text-foreground flex justify-between items-center tracking-[0.04em]">
                                        Task Title
                                        <VariablePicker 
                                          triggerTable={triggerTableForVars} 
                                          onSelect={(v) => handleUpdateNodeConfig('payload', { ...(selectedNode.data.config.payload || {}), title: (selectedNode.data.config?.payload?.title || '') + v })}
                                        />
                                      </label>
                                      <Input 
                                        placeholder="e.g. Call new lead {{full_name}}" 
                                        value={selectedNode.data.config?.payload?.title || ''}
                                        onChange={(e) => handleUpdateNodeConfig('payload', { ...(selectedNode.data.config.payload || {}), title: e.target.value })}
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-xs font-semibold text-foreground flex justify-between items-center tracking-[0.04em]">
                                        Task Description
                                        <VariablePicker 
                                          triggerTable={triggerTableForVars} 
                                          onSelect={(v) => handleUpdateNodeConfig('payload', { ...(selectedNode.data.config.payload || {}), description: (selectedNode.data.config?.payload?.description || '') + v })}
                                        />
                                      </label>
                                      <textarea 
                                        className="flex w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm h-24 resize-none"
                                        placeholder="Details about the task..." 
                                        value={selectedNode.data.config?.payload?.description || ''}
                                        onChange={(e) => handleUpdateNodeConfig('payload', { ...(selectedNode.data.config.payload || {}), description: e.target.value })}
                                      />
                                    </div>
                                  </>
                                )}

                                {selectedNode.data.actionType === 'webhook' && (
                                  <>
                                    <div className="space-y-1">
                                      <label className="text-xs font-semibold text-foreground flex justify-between items-center tracking-[0.04em]">
                                        Webhook URL
                                        <VariablePicker 
                                          triggerTable={triggerTableForVars} 
                                          onSelect={(v) => handleUpdateNodeConfig('payload', { ...(selectedNode.data.config.payload || {}), url: (selectedNode.data.config?.payload?.url || '') + v })}
                                        />
                                      </label>
                                      <Input 
                                        placeholder="https://api.example.com/webhook" 
                                        value={selectedNode.data.config?.payload?.url || ''}
                                        onChange={(e) => handleUpdateNodeConfig('payload', { ...(selectedNode.data.config.payload || {}), url: e.target.value })}
                                      />
                                    </div>
                                  </>
                                )}

                                <p className="text-[10px] text-primary font-medium bg-primary/10 p-2 rounded-md">Tip: You can use {'{{column_name}}'} to inject variables from the triggered row.</p>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
</AnimatePresence>
                </div>

                {/* Draggable Sidebar */}
                <Sidebar />
              </ReactFlowProvider>
            </motion.div>
          )}
          {mode === 'logs' && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ExecutionLogs companyId={companyId} setMode={setMode} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sandbox Test Run Modal */}
      {testRunLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-card rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border-[0.5px] border-black/9 dark:border-white/8">
            <div className="p-4 border-b bg-slate-50 dark:bg-secondary flex justify-between items-center">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Play className="w-5 h-5 text-emerald-500 fill-emerald-500" /> Test Run Sandbox
              </h3>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setTestRunLogs(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 font-mono text-sm">
              {testRunLogs.map((log, idx) => (
                <div key={idx} className="flex gap-4 border-b border-slate-100 dark:border-border pb-2">
                  <span className="text-slate-400 shrink-0">{new Date(log.time).toLocaleTimeString()}</span>
                  <span className={log.msg.includes('ERROR') ? 'text-rose-500 font-semibold' : 'text-slate-700 dark:text-foreground'}>{log.msg}</span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-slate-50 dark:bg-secondary flex justify-end">
              <Button onClick={() => setTestRunLogs(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
