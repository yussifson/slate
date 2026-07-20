import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Network, RefreshCw, Loader2, Filter, AlertCircle, ZoomIn, ZoomOut,
  Layers, GitBranch, Search, X, Info, ExternalLink, ArrowLeft
} from 'lucide-react';
import { INTEGRATIONS } from '@/config/integrationsList';

// ─── Provider color palette ───────────────────────────────────────────────────
const PROVIDER_COLORS = {
  slack: '#4A154B',
  github: '#24292E',
  notion: '#000000',
  jira: '#0052CC',
  google_drive: '#34A853',
  google_meet: '#00897B',
  zoom: '#2D8CFF',
  confluence: '#172B4D',
  linear: '#5E6AD2',
  asana: '#F06A6A',
  clickup: '#7B68EE',
  trello: '#0079BF',
  figma: '#F24E1E',
  miro: '#FFDD33',
  hubspot: '#FF7A59',
  salesforce: '#00A1E0',
  microsoft_teams: '#6264A7',
  outlook: '#0078D4',
  gmail: '#EA4335',
  gitlab: '#FC6D26',
  bitbucket: '#0052CC',
  default: '#6366F1',
};

const getProviderColor = (provider) =>
  PROVIDER_COLORS[provider?.toLowerCase()] || PROVIDER_COLORS.default;

const RELATIONSHIP_COLORS = {
  mentions: '#F59E0B',
  continues: '#10B981',
  implements: '#6366F1',
  blocks: '#EF4444',
  references: '#3B82F6',
  related: '#8B5CF6',
};

// ─── Custom Node Component ─────────────────────────────────────────────────────
function KnowledgeNode({ data, selected }) {
  const intg = INTEGRATIONS.find(i => i.id === data.provider || i.provider === data.provider);
  const color = getProviderColor(data.provider);

  return (
    <div
      className={`relative rounded-2xl border-2 transition-all cursor-pointer`}
      style={{
        background: `${color}18`,
        borderColor: selected ? color : `${color}60`,
        boxShadow: selected ? `0 0 0 3px ${color}40, 0 4px 24px ${color}30` : `0 2px 8px ${color}20`,
        minWidth: 160,
        maxWidth: 200,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: color, border: 'none', width: 8, height: 8 }} />
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
            style={{ background: `${color}25` }}
          >
            {intg?.icon || '📄'}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>
              {data.provider?.replace('_', ' ')}
            </div>
          </div>
        </div>
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 leading-tight">
          {data.title || 'Untitled'}
        </p>
        {data.content_type && (
          <span
            className="inline-block mt-1.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md"
            style={{ background: `${color}20`, color }}
          >
            {data.content_type}
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: color, border: 'none', width: 8, height: 8 }} />
    </div>
  );
}

const nodeTypes = { knowledge: KnowledgeNode };

// ─── Layout: simple force-style grid placement ────────────────────────────────
function layoutNodes(nodes) {
  const COLS = Math.ceil(Math.sqrt(nodes.length)) || 1;
  const W = 240, H = 160;
  return nodes.map((node, i) => ({
    ...node,
    position: {
      x: (i % COLS) * W + (Math.floor(i / COLS) % 2 === 0 ? 0 : W / 2),
      y: Math.floor(i / COLS) * H,
    },
  }));
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function KnowledgeGraph() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [stats, setStats] = useState({ nodes: 0, edges: 0, providers: 0 });
  const [filterProvider, setFilterProvider] = useState('all');
  const [filterRelation, setFilterRelation] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [providers, setProviders] = useState([]);

  const loadGraph = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      // Load knowledge items (nodes)
      const { data: items } = await supabase
        .from('clipad_imported_knowledge')
        .select('id, provider, content_type, title, url, ai_summary, imported_at')
        .eq('company_id', companyId)
        .not('ai_summary', 'is', null)
        .order('imported_at', { ascending: false })
        .limit(80);

      // Load relationships (edges)
      const { data: relationships } = await supabase
        .from('clipad_knowledge_relationships')
        .select('*')
        .eq('company_id', companyId)
        .gte('confidence_score', 0.6)
        .limit(300);

      const itemSet = new Set((items || []).map(i => i.id));
      const uniqueProviders = [...new Set((items || []).map(i => i.provider).filter(Boolean))];
      setProviders(uniqueProviders);

      // Build nodes
      const rawNodes = (items || []).map(item => ({
        id: item.id,
        type: 'knowledge',
        data: { ...item },
        position: { x: 0, y: 0 },
      }));
      const positionedNodes = layoutNodes(rawNodes);

      // Build edges — only for items we have as nodes
      const rawEdges = (relationships || [])
        .filter(r => itemSet.has(r.source_id) && itemSet.has(r.target_id))
        .map(r => ({
          id: r.id,
          source: r.source_id,
          target: r.target_id,
          label: r.relationship_type,
          type: 'smoothstep',
          animated: r.relationship_type === 'implements' || r.relationship_type === 'continues',
          style: {
            stroke: RELATIONSHIP_COLORS[r.relationship_type] || '#6366F1',
            strokeWidth: Math.max(1, r.confidence_score * 3),
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: RELATIONSHIP_COLORS[r.relationship_type] || '#6366F1',
          },
          data: { confidence: r.confidence_score, type: r.relationship_type },
        }));

      setNodes(positionedNodes);
      setEdges(rawEdges);
      setStats({ nodes: positionedNodes.length, edges: rawEdges.length, providers: uniqueProviders.length });
    } catch (err) {
      console.error('Knowledge graph load error:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId, setNodes, setEdges]);

  useEffect(() => { loadGraph(); }, [loadGraph]);

  // Apply filters to displayed nodes/edges
  const filteredNodes = nodes.filter(n => {
    const providerMatch = filterProvider === 'all' || n.data.provider === filterProvider;
    const searchMatch = !searchQuery ||
      (n.data.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.data.provider || '').toLowerCase().includes(searchQuery.toLowerCase());
    return providerMatch && searchMatch;
  });

  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = edges.filter(e => {
    const relMatch = filterRelation === 'all' || e.data?.type === filterRelation;
    const nodesMatch = filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target);
    return relMatch && nodesMatch;
  });

  return (
    <div className="flex flex-col h-full min-h-screen bg-background text-foreground font-sans page-enter">
      {/* Header */}
      <div className="relative border-b border-border bg-gradient-to-r from-violet-500/5 via-background to-indigo-500/5 px-6 py-6 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/integrations')} className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors shrink-0">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center">
              <Network className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Knowledge Graph</h1>
              <p className="text-xs text-muted-foreground">AI-detected relationships across all your connected systems</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            {[
              { label: 'Nodes', value: stats.nodes, color: 'text-violet-500' },
              { label: 'Relationships', value: stats.edges, color: 'text-indigo-500' },
              { label: 'Sources', value: stats.providers, color: 'text-blue-500' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
            <button
              onClick={loadGraph}
              className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-7xl mx-auto mt-4 flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search nodes..."
              className="pl-8 pr-3 py-1.5 text-xs bg-card border border-border rounded-xl focus:outline-none focus:border-violet-500 w-48"
            />
          </div>

          <select
            value={filterProvider}
            onChange={e => setFilterProvider(e.target.value)}
            className="px-3 py-1.5 text-xs bg-card border border-border rounded-xl focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Sources</option>
            {providers.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select
            value={filterRelation}
            onChange={e => setFilterRelation(e.target.value)}
            className="px-3 py-1.5 text-xs bg-card border border-border rounded-xl focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Relationships</option>
            {Object.keys(RELATIONSHIP_COLORS).map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {/* Legend */}
          <div className="flex items-center gap-3 ml-auto">
            {Object.entries(RELATIONSHIP_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div className="w-3 h-0.5 rounded-full" style={{ background: color }} />
                <span className="text-[10px] text-muted-foreground capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Graph Canvas */}
      <div className="flex-1 relative" style={{ minHeight: 600 }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
              <p className="text-sm text-muted-foreground">Building knowledge graph…</p>
            </div>
          </div>
        ) : filteredNodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-md p-10 border border-dashed border-border rounded-2xl bg-card mx-4">
              <Network className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <h3 className="font-bold text-foreground mb-2">No graph data yet</h3>
              <p className="text-sm text-muted-foreground">
                Connect integrations and sync data. Once the AI processes your knowledge items, relationships will appear here automatically.
              </p>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={filteredNodes}
            edges={filteredEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={(_, node) => setSelectedNode(node.data)}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.1}
            maxZoom={2}
            className="bg-background"
          >
            <Background color="#6366F120" gap={24} size={1} />
            <Controls className="bg-card border-border rounded-xl shadow-sm" />
            <MiniMap
              nodeColor={n => getProviderColor(n.data?.provider)}
              className="bg-card border-border rounded-xl shadow-sm"
            />
          </ReactFlow>
        )}

        {/* Node detail panel */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-72 bg-card border border-border rounded-2xl shadow-xl p-5 z-10 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: `${getProviderColor(selectedNode.provider)}25` }}
                >
                  {INTEGRATIONS.find(i => i.id === selectedNode.provider)?.icon || '📄'}
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {selectedNode.provider?.replace('_', ' ')}
                  </div>
                  <div className="text-xs font-semibold text-foreground capitalize">{selectedNode.content_type}</div>
                </div>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="font-bold text-sm text-foreground mb-2 leading-tight">
              {selectedNode.title || 'Untitled'}
            </h3>

            {selectedNode.ai_summary && (
              <p className="text-xs text-muted-foreground leading-relaxed mb-3 bg-secondary/30 rounded-xl p-3">
                {selectedNode.ai_summary.substring(0, 200)}…
              </p>
            )}

            <div className="text-[10px] text-muted-foreground mb-3">
              Indexed {new Date(selectedNode.imported_at).toLocaleDateString()}
            </div>

            {selectedNode.url && (
              <a
                href={selectedNode.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold text-violet-500 hover:text-violet-600 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View Original Source
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
