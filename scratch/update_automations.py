import re

with open('src/pages/Automations.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add ConditionNode and DelayNode components
nodes_code = """
const ConditionNode = ({ data }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-xl shadow-lg w-64 overflow-hidden relative">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-amber-500 border-2 border-white" />
      <div className="bg-amber-500/10 px-4 py-2 border-b border-amber-500/20 flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-amber-500" />
        <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Condition</span>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {data.label || 'If / Else'}
        </span>
      </div>
      <Handle type="source" position={Position.Right} id="true" style={{ top: '30%' }} className="w-3 h-3 bg-emerald-500 border-2 border-white" />
      <div className="absolute right-[-24px] top-[22%] text-[10px] font-bold text-emerald-500">TRUE</div>
      <Handle type="source" position={Position.Right} id="false" style={{ top: '70%' }} className="w-3 h-3 bg-rose-500 border-2 border-white" />
      <div className="absolute right-[-28px] top-[62%] text-[10px] font-bold text-rose-500">FALSE</div>
    </div>
  );
};

const DelayNode = ({ data }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-blue-500 rounded-xl shadow-lg w-64 overflow-hidden">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500 border-2 border-white" />
      <div className="bg-blue-500/10 px-4 py-2 border-b border-blue-500/20 flex items-center gap-2">
        <Clock className="w-4 h-4 text-blue-500" />
        <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Delay</span>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {data.label || 'Wait'}
        </span>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500 border-2 border-white" />
    </div>
  );
};

const nodeTypes = {
  triggerNode: TriggerNode,
  actionNode: ActionNode,
  conditionNode: ConditionNode,
  delayNode: DelayNode,
};
"""

content = re.sub(r'const nodeTypes = \{.*?\};', nodes_code, content, flags=re.DOTALL)

# 2. Add to Sidebar
sidebar_addition = """
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Logic</h3>
        <div className="space-y-2">
          <div 
            className="bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/50 p-3 rounded-lg flex items-center gap-3 cursor-grab hover:border-amber-400 hover:shadow-md transition-all"
            onDragStart={(event) => onDragStart(event, 'conditionNode')}
            draggable
          >
            <GitBranch className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-medium">Condition (If/Else)</span>
          </div>
          <div 
            className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-900/50 p-3 rounded-lg flex items-center gap-3 cursor-grab hover:border-blue-400 hover:shadow-md transition-all"
            onDragStart={(event) => onDragStart(event, 'delayNode')}
            draggable
          >
            <Clock className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium">Delay</span>
          </div>
        </div>
      </div>
"""
content = content.replace('<div>\n        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Actions</h3>', sidebar_addition + '\n      <div>\n        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Actions</h3>')

# 3. Import icons if needed
if 'GitBranch' not in content:
    content = content.replace('import {', 'import { GitBranch, Clock,', 1)

with open('src/pages/Automations.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
