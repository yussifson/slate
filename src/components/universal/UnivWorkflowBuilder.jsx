import { powerSync} from '@/api/PowerSyncConnector';
import React, {
 useState,
 useRef,
 useCallback,
 useEffect,
 useMemo,
} from 'react';
import { motion, AnimatePresence} from 'framer-motion';
import {
 Workflow,
 Zap,
 GitBranch,
 Play,
 Square,
 Trash2,
 Save,
 FolderOpen,
 Plus,
 X,
 ChevronRight,
 CheckCircle2,
 AlertCircle,
 Mail,
 Bell,
 UserPlus,
 FilePlus,
 RefreshCw,
 Circle,
 MousePointer2,
 Link2,
 Unlink2,
 RotateCcw,
} from 'lucide-react';

import { supabase} from "@/api/supabaseClient";
import { cn} from '@/lib/utils';
import { toast} from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────

const NODE_WIDTH = 220;
const NODE_HEIGHT = 100;

const NODE_TYPES = {
 trigger: {
 label: 'Trigger',
 description: 'When this happens...',
 color: 'emerald',
 borderClass: 'border-l-emerald-500',
 bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
 badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
 icon: Zap,
 options: [
 { value: 'record_created', label: 'Record Created'},
 { value: 'record_updated', label: 'Record Updated'},
 { value: 'status_changed', label: 'Status Changed'},
 { value: 'date_arrives', label: 'Date Arrives'},
 ],
},
 condition: {
 label: 'Condition',
 description: 'If this is true...',
 color: 'amber',
 borderClass: 'border-l-amber-500',
 bgClass: 'bg-amber-50 dark:bg-amber-950/30',
 badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
 icon: GitBranch,
 options: [
 { value: 'field_equals', label: 'Field equals value'},
 { value: 'field_empty', label: 'Field is empty'},
 { value: 'status_is', label: 'Status is'},
 ],
},
 action: {
 label: 'Action',
 description: 'Then do this...',
 color: 'blue',
 borderClass: 'border-l-blue-500',
 bgClass: 'bg-blue-50 dark:bg-blue-950/30',
 badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
 icon: Play,
 options: [
 { value: 'send_notification', label: 'Send Notification'},
 { value: 'change_status', label: 'Change Status'},
 { value: 'assign_to', label: 'Assign To'},
 { value: 'create_record', label: 'Create Record'},
 { value: 'send_email', label: 'Send Email'},
 ],
},
 end: {
 label: 'End',
 description: 'Workflow complete',
 color: 'gray',
 borderClass: 'border-l-slate-400',
 bgClass: 'bg-slate-50 dark:bg-slate-800/30',
 badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
 icon: Square,
 options: [],
},
};

const PALETTE_ITEMS = [
 { type: 'trigger', label: 'Trigger', icon: Zap},
 { type: 'condition', label: 'Condition', icon: GitBranch},
 { type: 'action', label: 'Action', icon: Play},
 { type: 'end', label: 'End', icon: Square},
];

const ACTION_ICONS = {
 send_notification: Bell,
 change_status: RefreshCw,
 assign_to: UserPlus,
 create_record: FilePlus,
 send_email: Mail,
};

function genId() {
 return `node_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
}

// ─── SVG Bezier Edge ──────────────────────────────────────────────────────────

function BezierEdge({ from, to, selected, onClick}) {
 const dx = Math.abs(to.x - from.x);
 const cpOffset = Math.max(60, dx * 0.5);
 const cp1x = from.x + cpOffset;
 const cp1y = from.y;
 const cp2x = to.x - cpOffset;
 const cp2y = to.y;
 const d = `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;

 return (
 <g onClick={onClick} className="cursor-pointer group">
 {/* Invisible wider hit area */}
 <path d={d} fill="none" stroke="transparent" strokeWidth={16} />
 {/* Actual visible path */}
 <path
 d={d}
 fill="none"
 stroke={selected ? '#6366f1' : '#94a3b8'}
 strokeWidth={selected ? 2.5 : 2}
 strokeDasharray={selected ? '0' : '0'}
 className="transition-all duration-150 group-hover:stroke-indigo-400"
 markerEnd="url(#arrowhead)"
 />
 </g>
 );
}

// ─── Node Card ────────────────────────────────────────────────────────────────

function WorkflowNode({
 node,
 selected,
 connecting,
 onMouseDown,
 onPortClick,
 onDelete,
 onSelect,
}) {
 const def = NODE_TYPES[node.type] || NODE_TYPES.trigger;
 const IconComp = def.icon;
 const optionLabel =
 node.config?.option
 ? (def.options.find((o) => o.value === node.config.option)?.label || node.config.option)
 : def.description;

 return (
 <div
 style={{
 left: node.x,
 top: node.y,
 width: NODE_WIDTH,
 position: 'absolute',
 userSelect: 'none',
}}
 className={cn(
 'rounded-xl border border-border border-l-4 bg-card transition- duration-150',
 def.borderClass,
 selected && ' ring-2 ring-primary ring-offset-1',
 'group'
 )}
 onMouseDown={(e) => {
 e.stopPropagation();
 onMouseDown(e, node.id);
 onSelect(node.id);
}}
 >
 {/* Header */}
 <div className={cn('flex items-center gap-2 px-3 pt-3 pb-2 rounded-t-xl', def.bgClass)}>
 <span className={cn('flex items-center justify-center w-6 h-6 rounded-md', def.badgeClass)}>
 <IconComp className="w-3.5 h-3.5" />
 </span>
 <span className={cn('text-[11px] font-bold uppercase tracking-wider', def.badgeClass.split(' ').filter(c => c.startsWith('text-')).join(' '))}>
 {def.label}
 </span>
 <button
 onMouseDown={(e) => e.stopPropagation()}
 onClick={(e) => { e.stopPropagation(); onDelete(node.id);}}
 className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-500 hover:bg-red-200"
 title="Delete node"
 >
 <X className="w-3 h-3" />
 </button>
 </div>

 {/* Body */}
 <div className="px-3 pb-3 pt-1">
 <p className="text-xs text-foreground font-semibold leading-snug truncate">
 {node.config?.label || node.config?.option
 ? optionLabel
 : def.description}
 </p>
 {node.config?.value && (
 <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
 {node.config.value}
 </p>
 )}
 </div>

 {/* Input port (left) */}
 {node.type !== 'trigger' && (
 <button
 onMouseDown={(e) => e.stopPropagation()}
 onClick={(e) => { e.stopPropagation(); onPortClick(node.id, 'input');}}
 title="Input port"
 className={cn(
 'absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2',
 'w-3.5 h-3.5 rounded-full border-2 border-border bg-background',
 'hover:border-primary hover:bg-primary/20 transition-colors cursor-crosshair',
 connecting?.targetId === node.id && 'border-primary bg-primary/30'
 )}
 />
 )}

 {/* Output port (right) */}
 {node.type !== 'end' && (
 <button
 onMouseDown={(e) => e.stopPropagation()}
 onClick={(e) => { e.stopPropagation(); onPortClick(node.id, 'output');}}
 title="Output port — click to start connection"
 className={cn(
 'absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2',
 'w-3.5 h-3.5 rounded-full border-2 border-primary bg-background',
 'hover:bg-primary/20 transition-colors cursor-crosshair',
 connecting?.sourceId === node.id && 'bg-primary/40 scale-125'
 )}
 />
 )}
 </div>
 );
}

// ─── Config Panel ─────────────────────────────────────────────────────────────

function ConfigPanel({ node, onUpdate, onClose}) {
 const def = NODE_TYPES[node.type] || NODE_TYPES.trigger;
 const [cfg, setCfg] = useState({ label: '', option: '', value: '', ...node.config});

 const commit = (patch) => {
 const next = { ...cfg, ...patch};
 setCfg(next);
 onUpdate(node.id, next);
};

 return (
 <motion.div
 initial={{ x: 40, opacity: 0}}
 animate={{ x: 0, opacity: 1}}
 exit={{ x: 40, opacity: 0}}
 transition={{ duration: 0.18}}
 className="w-72 shrink-0 border-l border-border bg-card flex flex-col overflow-hidden"
 >
 {/* Panel header */}
 <div className={cn('flex items-center gap-2 px-4 py-3 border-b border-border', def.bgClass)}>
 <def.icon className="w-4 h-4" />
 <span className="text-sm font-bold flex-1">{def.label} Config</span>
 <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5 text-muted-foreground">
 <X className="w-4 h-4" />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto p-4 space-y-4">
 {/* Node label */}
 <div>
 <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
 Node Label
 </label>
 <input
 type="text"
 value={cfg.label || ''}
 onChange={(e) => commit({ label: e.target.value})}
 placeholder={def.description}
 className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none"
 />
 </div>

 {/* Option select */}
 {def.options.length > 0 && (
 <div>
 <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
 {node.type === 'trigger' ? 'Trigger Event' : node.type === 'condition' ? 'Condition Type' : 'Action Type'}
 </label>
 <select
 value={cfg.option || ''}
 onChange={(e) => commit({ option: e.target.value})}
 className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none"
 >
 <option value="">— Select —</option>
 {def.options.map((o) => (
 <option key={o.value} value={o.value}>{o.label}</option>
 ))}
 </select>
 </div>
 )}

 {/* Value field (for condition/trigger where a value is relevant) */}
 {(node.type === 'condition' || node.type === 'trigger') && (
 <div>
 <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
 {node.type === 'condition' ? 'Compare Value' : 'Filter Value (optional)'}
 </label>
 <input
 type="text"
 value={cfg.value || ''}
 onChange={(e) => commit({ value: e.target.value})}
 placeholder="Enter value..."
 className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none"
 />
 </div>
 )}

 {/* Assignee field for action */}
 {node.type === 'action' && cfg.option === 'assign_to' && (
 <div>
 <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
 Assign To (name or email)
 </label>
 <input
 type="text"
 value={cfg.assignee || ''}
 onChange={(e) => commit({ assignee: e.target.value})}
 placeholder="john@example.com"
 className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none"
 />
 </div>
 )}

 {/* Email body for send_email action */}
 {node.type === 'action' && cfg.option === 'send_email' && (
 <div>
 <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
 Email Subject
 </label>
 <input
 type="text"
 value={cfg.emailSubject || ''}
 onChange={(e) => commit({ emailSubject: e.target.value})}
 placeholder="Subject..."
 className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none mb-2"
 />
 <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
 Email Body
 </label>
 <textarea
 rows={3}
 value={cfg.emailBody || ''}
 onChange={(e) => commit({ emailBody: e.target.value})}
 placeholder="Email content..."
 className="w-full p-3 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none resize-none"
 />
 </div>
 )}

 {/* Notes */}
 <div>
 <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
 Notes (optional)
 </label>
 <textarea
 rows={2}
 value={cfg.notes || ''}
 onChange={(e) => commit({ notes: e.target.value})}
 placeholder="Add a note..."
 className="w-full p-3 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none resize-none"
 />
 </div>
 </div>
 </motion.div>
 );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UnivWorkflowBuilder({ companyId, workflowId, onSave}) {
 const [workflowName, setWorkflowName] = useState('My Workflow');
 const [nodes, setNodes] = useState([]);
 const [edges, setEdges] = useState([]);
 const [selectedNodeId, setSelectedNodeId] = useState(null);
 const [selectedEdgeId, setSelectedEdgeId] = useState(null);
 const [connecting, setConnecting] = useState(null); // { sourceId}
 const [isSaving, setIsSaving] = useState(false);
 const [isLoading, setIsLoading] = useState(false);
 const [editingName, setEditingName] = useState(false);

 const canvasRef = useRef(null);
 const dragRef = useRef(null); // { nodeId, startX, startY, origX, origY}

 // ── Persist key ──────────────────────────────────────────────────────────────
 const storageKey = `wf_${companyId || 'local'}_${workflowId || 'default'}`;

 // ── Load on mount ────────────────────────────────────────────────────────────
 useEffect(() => {
 const loadWorkflow = async () => {
 setIsLoading(true);
 try {
 // Try Supabase first
 if (companyId && workflowId) {
 const { data, error} = await supabase
 .from('univ_workflows')
 .select('*')
 .eq('id', workflowId)
 .eq('company_id', companyId)
 .maybeSingle();
 if (!error && data) {
 setWorkflowName(data.name || 'My Workflow');
 setNodes(data.nodes || []);
 setEdges(data.edges || []);
 setIsLoading(false);
 return;
}
}
 // Fallback to localStorage
 const raw = localStorage.getItem(storageKey);
 if (raw) {
 const parsed = JSON.parse(raw);
 setWorkflowName(parsed.name || 'My Workflow');
 setNodes(parsed.nodes || []);
 setEdges(parsed.edges || []);
}
} catch (e) {
 console.warn('Failed to load workflow:', e);
} finally {
 setIsLoading(false);
}
};
 loadWorkflow();
}, [companyId, workflowId, storageKey]);

 // ── Save workflow ────────────────────────────────────────────────────────────
 const handleSave = useCallback(async () => {
 setIsSaving(true);
 const payload = { name: workflowName, nodes, edges};
 try {
 // Always persist to localStorage
 localStorage.setItem(storageKey, JSON.stringify(payload));

 // Also persist to Supabase if we have companyId
 if (companyId) {
 const record = { ...payload, company_id: companyId};
 if (workflowId) {
 await supabase
 .from('univ_workflows')
 .upsert({ id: workflowId, ...record}, { onConflict: 'id'});
} else {
 await (async () => {
 const _p = record;
 const _k = Object.keys(_p);
 const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _pl = _k.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_workflows (${_k.join(', ')}) VALUES (${_pl})`, _v); return { error: null};})();
}
}
 toast.success('Workflow saved!');
 onSave?.(payload);
} catch (e) {
 console.error('Save error:', e);
 toast.success('Saved locally!'); // localStorage always works
} finally {
 setIsSaving(false);
}
}, [workflowName, nodes, edges, companyId, workflowId, storageKey, onSave]);

 // ── Clear canvas ─────────────────────────────────────────────────────────────
 const handleClear = () => {
 if (!window.confirm('Clear the canvas? This cannot be undone.')) return;
 setNodes([]);
 setEdges([]);
 setSelectedNodeId(null);
 setSelectedEdgeId(null);
 setConnecting(null);
 toast.success('Canvas cleared');
};

 // ── Add node from palette ────────────────────────────────────────────────────
 const addNodeFromPalette = (type) => {
 const canvas = canvasRef.current;
 const rect = canvas?.getBoundingClientRect() || { width: 800, height: 600};
 const newNode = {
 id: genId(),
 type,
 x: Math.round(80 + Math.random() * (rect.width - NODE_WIDTH - 160)),
 y: Math.round(80 + Math.random() * (rect.height - NODE_HEIGHT - 120)),
 config: {},
};
 setNodes((prev) => [...prev, newNode]);
 setSelectedNodeId(newNode.id);
};

 // ── Node drag ────────────────────────────────────────────────────────────────
 const handleNodeMouseDown = useCallback((e, nodeId) => {
 if (e.button !== 0) return;
 const node = nodes.find((n) => n.id === nodeId);
 if (!node) return;
 dragRef.current = {
 nodeId,
 startX: e.clientX,
 startY: e.clientY,
 origX: node.x,
 origY: node.y,
};
}, [nodes]);

 const handleCanvasMouseMove = useCallback((e) => {
 if (!dragRef.current) return;
 const { nodeId, startX, startY, origX, origY} = dragRef.current;
 const dx = e.clientX - startX;
 const dy = e.clientY - startY;
 setNodes((prev) =>
 prev.map((n) =>
 n.id === nodeId ? { ...n, x: Math.max(0, origX + dx), y: Math.max(0, origY + dy)} : n
 )
 );
}, []);

 const handleCanvasMouseUp = useCallback(() => {
 dragRef.current = null;
}, []);

 // ── Port click — connect nodes ────────────────────────────────────────────────
 const handlePortClick = useCallback((nodeId, portType) => {
 if (portType === 'output') {
 // Start a connection
 setConnecting({ sourceId: nodeId});
} else if (portType === 'input') {
 if (connecting && connecting.sourceId && connecting.sourceId !== nodeId) {
 // Create edge
 const edgeId = `edge_${connecting.sourceId}_${nodeId}`;
 const duplicate = edges.find(
 (e) => e.source === connecting.sourceId && e.target === nodeId
 );
 if (!duplicate) {
 setEdges((prev) => [
 ...prev,
 { id: edgeId, source: connecting.sourceId, target: nodeId},
 ]);
 toast.success('Nodes connected!', { duration: 1200});
}
 setConnecting(null);
} else {
 setConnecting(null);
}
}
}, [connecting, edges]);

 // ── Delete node ───────────────────────────────────────────────────────────────
 const handleDeleteNode = useCallback((nodeId) => {
 setNodes((prev) => prev.filter((n) => n.id !== nodeId));
 setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
 if (selectedNodeId === nodeId) setSelectedNodeId(null);
}, [selectedNodeId]);

 // ── Delete edge ───────────────────────────────────────────────────────────────
 const handleDeleteEdge = useCallback((edgeId) => {
 setEdges((prev) => prev.filter((e) => e.id !== edgeId));
 setSelectedEdgeId(null);
}, []);

 // ── Update node config ────────────────────────────────────────────────────────
 const handleNodeUpdate = useCallback((nodeId, config) => {
 setNodes((prev) =>
 prev.map((n) => (n.id === nodeId ? { ...n, config} : n))
 );
}, []);

 // ── Click canvas background to deselect ───────────────────────────────────────
 const handleCanvasClick = useCallback((e) => {
 if (e.target === canvasRef.current || e.target.tagName === 'svg') {
 setSelectedNodeId(null);
 setSelectedEdgeId(null);
 setConnecting(null);
}
}, []);

 // ── Compute port positions for edges ──────────────────────────────────────────
 const getPortPos = useCallback((nodeId, port) => {
 const node = nodes.find((n) => n.id === nodeId);
 if (!node) return null;
 const x = port === 'output' ? node.x + NODE_WIDTH : node.x;
 const y = node.y + NODE_HEIGHT / 2;
 return { x, y};
}, [nodes]);

 const selectedNode = useMemo(
 () => nodes.find((n) => n.id === selectedNodeId) || null,
 [nodes, selectedNodeId]
 );

 return (
 <div className="h-full flex flex-col bg-background overflow-hidden">
 {/* ── Toolbar ── */}
 <div className="shrink-0 h-14 border-b border-border bg-card flex items-center gap-3 px-4">
 <div className="flex items-center gap-2">
 <Workflow className="w-5 h-5 text-primary" />
 {editingName ? (
 <input
 autoFocus
 type="text"
 value={workflowName}
 onChange={(e) => setWorkflowName(e.target.value)}
 onBlur={() => setEditingName(false)}
 onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
 className="h-8 px-2 bg-background border border-primary rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 w-48"
 />
 ) : (
 <button
 onClick={() => setEditingName(true)}
 className="text-sm font-bold text-foreground hover:text-primary transition-colors"
 title="Click to rename"
 >
 {workflowName}
 </button>
 )}
 </div>

 {/* Node count badge */}
 <span className="text-[11px] font-bold px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
 {nodes.length} node{nodes.length !== 1 ? 's' : ''}
 </span>
 <span className="text-[11px] font-bold px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
 {edges.length} edge{edges.length !== 1 ? 's' : ''}
 </span>

 {connecting && (
 <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 bg-primary/10 text-primary rounded-full animate-pulse">
 <Link2 className="w-3 h-3" />
 Click an input port to connect
 </span>
 )}

 <div className="ml-auto flex items-center gap-2">
 {selectedEdgeId && (
 <button
 onClick={() => handleDeleteEdge(selectedEdgeId)}
 className="h-8 px-3 flex items-center gap-1.5 text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
 >
 <Unlink2 className="w-3.5 h-3.5" />
 Delete Edge
 </button>
 )}
 <button
 onClick={handleClear}
 className="h-8 px-3 flex items-center gap-1.5 text-xs font-bold bg-muted text-muted-foreground hover:bg-muted/70 rounded-lg transition-colors"
 >
 <RotateCcw className="w-3.5 h-3.5" />
 Clear
 </button>
 <button
 onClick={handleSave}
 disabled={isSaving}
 className="h-8 px-4 flex items-center gap-1.5 text-xs font-bold bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-60"
 >
 <Save className="w-3.5 h-3.5" />
 {isSaving ? 'Saving...' : 'Save'}
 </button>
 </div>
 </div>

 {/* ── Main area ── */}
 <div className="flex-1 flex min-h-0 overflow-hidden">
 {/* ── Left Palette ── */}
 <div className="shrink-0 w-52 border-r border-border bg-card flex flex-col">
 <div className="px-3 pt-4 pb-2">
 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
 Node Types
 </p>
 </div>
 <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1.5">
 {PALETTE_ITEMS.map(({ type, label, icon: Icon}) => {
 const def = NODE_TYPES[type];
 return (
 <button
 key={type}
 onClick={() => addNodeFromPalette(type)}
 className={cn(
 'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border text-left',
 'hover:border-primary/40 transition-all duration-150',
 'bg-background group'
 )}
 title={`Add ${label} node`}
 >
 <span className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', def.badgeClass)}>
 <Icon className="w-4 h-4" />
 </span>
 <div>
 <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{label}</p>
 <p className="text-[10px] text-muted-foreground leading-tight">{def.description}</p>
 </div>
 <Plus className="ml-auto w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
 </button>
 );
})}
 </div>

 {/* Legend */}
 <div className="border-t border-border px-3 py-3">
 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
 How to connect
 </p>
 <div className="space-y-1.5 text-[10px] text-muted-foreground">
 <div className="flex items-center gap-2">
 <Circle className="w-2.5 h-2.5 text-primary fill-primary shrink-0" />
 <span>Click right port to start</span>
 </div>
 <div className="flex items-center gap-2">
 <Circle className="w-2.5 h-2.5 border border-border shrink-0" />
 <span>Click left port to connect</span>
 </div>
 <div className="flex items-center gap-2">
 <MousePointer2 className="w-2.5 h-2.5 shrink-0" />
 <span>Click edge to select</span>
 </div>
 </div>
 </div>
 </div>

 {/* ── Canvas ── */}
 <div
 ref={canvasRef}
 className="flex-1 relative overflow-hidden cursor-default"
 style={{
 backgroundImage:
 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
 backgroundSize: '24px 24px',
 backgroundColor: 'hsl(var(--muted) / 0.18)',
}}
 onMouseMove={handleCanvasMouseMove}
 onMouseUp={handleCanvasMouseUp}
 onClick={handleCanvasClick}
 >
 {isLoading && (
 <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-20">
 <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-6 py-4 ">
 <RefreshCw className="w-5 h-5 text-primary animate-spin" />
 <span className="text-sm font-bold">Loading workflow…</span>
 </div>
 </div>
 )}

 {/* Empty state */}
 {!isLoading && nodes.length === 0 && (
 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
 <div className="text-center space-y-3 opacity-50">
 <Workflow className="w-12 h-12 text-muted-foreground mx-auto" />
 <p className="text-sm font-bold text-muted-foreground">
 Click a node type in the panel to add it
 </p>
 <p className="text-xs text-muted-foreground">
 Drag nodes to position them, then connect ports
 </p>
 </div>
 </div>
 )}

 {/* SVG overlay for edges */}
 <svg
 className="absolute inset-0 w-full h-full pointer-events-none"
 style={{ overflow: 'visible'}}
 >
 <defs>
 <marker
 id="arrowhead"
 markerWidth="8"
 markerHeight="6"
 refX="7"
 refY="3"
 orient="auto"
 >
 <polygon
 points="0 0, 8 3, 0 6"
 fill="#94a3b8"
 />
 </marker>
 </defs>
 {edges.map((edge) => {
 const from = getPortPos(edge.source, 'output');
 const to = getPortPos(edge.target, 'input');
 if (!from || !to) return null;
 return (
 <BezierEdge
 key={edge.id}
 from={from}
 to={to}
 selected={selectedEdgeId === edge.id}
 onClick={(e) => {
 e.stopPropagation();
 setSelectedEdgeId(edge.id);
 setSelectedNodeId(null);
}}
 />
 );
})}
 </svg>

 {/* Nodes */}
 <AnimatePresence>
 {nodes.map((node) => (
 <motion.div
 key={node.id}
 initial={{ scale: 0.8, opacity: 0}}
 animate={{ scale: 1, opacity: 1}}
 exit={{ scale: 0.8, opacity: 0}}
 transition={{ duration: 0.15}}
 style={{ position: 'absolute', left: node.x, top: node.y}}
 >
 <WorkflowNode
 node={node}
 selected={selectedNodeId === node.id}
 connecting={connecting}
 onMouseDown={handleNodeMouseDown}
 onPortClick={handlePortClick}
 onDelete={handleDeleteNode}
 onSelect={setSelectedNodeId}
 />
 </motion.div>
 ))}
 </AnimatePresence>
 </div>

 {/* ── Right Config Panel ── */}
 <AnimatePresence>
 {selectedNode && (
 <ConfigPanel
 key={selectedNode.id}
 node={selectedNode}
 onUpdate={handleNodeUpdate}
 onClose={() => setSelectedNodeId(null)}
 />
 )}
 </AnimatePresence>
 </div>
 </div>
 );
}
