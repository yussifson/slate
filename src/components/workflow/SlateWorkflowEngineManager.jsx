import React, { useState, useEffect } from 'react';
import {
  Workflow,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  RefreshCw,
  Eye,
  Sliders,
  Layers,
  Activity,
  History
} from 'lucide-react';
import { supabase } from '../../api/supabaseClient';

export default function SlateWorkflowEngineManager() {
  const [activeTab, setActiveTab] = useState('workflows'); // 'workflows', 'runs', 'dead_letters'
  const [workflows, setWorkflows] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [deadLetters, setDeadLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!supabase || typeof supabase.from !== 'function') {
        setLoading(false);
        return;
      }

      if (activeTab === 'workflows') {
        const { data, error } = await supabase
          .from('workflow_definitions')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) setWorkflows(data);
      } else if (activeTab === 'runs') {
        const { data, error } = await supabase
          .from('workflow_executions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (!error && data) setExecutions(data);
      } else if (activeTab === 'dead_letters') {
        const { data, error } = await supabase
          .from('workflow_dead_letters')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (!error && data) setDeadLetters(data);
      }
    } catch (e) {
      console.error('Error fetching workflow management data:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkflowStatus = async (wf) => {
    try {
      const nextStatus = !wf.is_active;
      await supabase
        .from('workflow_definitions')
        .update({ is_active: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', wf.id);
      setWorkflows(workflows.map(w => w.id === wf.id ? { ...w, is_active: nextStatus } : w));
    } catch (err) {
      console.error('Failed to toggle workflow status:', err);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#090D16] text-[#E2E8F0] p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Workflow className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Slate V2 Workflow Engine
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Durable event orchestration, transactional outbox routing, and execution telemetry.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-[#0F172A] p-1 rounded-lg border border-[#1E293B]">
          <button
            onClick={() => setActiveTab('workflows')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'workflows'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Workflows
          </button>
          <button
            onClick={() => setActiveTab('runs')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'runs'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" /> Execution History
          </button>
          <button
            onClick={() => setActiveTab('dead_letters')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'dead_letters'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Dead-Letter Queue
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading telemetry...
        </div>
      ) : activeTab === 'workflows' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 bg-[#0F172A]/50 border border-[#1E293B] rounded-xl">
              No workflow definitions registered for this organization.
            </div>
          ) : (
            workflows.map(wf => (
              <div
                key={wf.id}
                className="p-4 rounded-xl bg-[#0F172A] border border-[#1E293B] hover:border-indigo-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 text-[10px] uppercase font-semibold tracking-wider rounded bg-[#1E293B] text-slate-300">
                      {wf.trigger_type}
                    </span>
                    <button
                      onClick={() => toggleWorkflowStatus(wf)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        wf.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-700/40 text-slate-400 border border-slate-600/30'
                      }`}
                    >
                      {wf.is_active ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
                      {wf.is_active ? 'Active' : 'Paused'}
                    </button>
                  </div>
                  <h3 className="font-semibold text-white text-sm">{wf.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {wf.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center justify-between text-xs text-slate-400">
                  <span>{(wf.steps || []).length} steps</span>
                  <span>v{wf.version || 1}</span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'runs' ? (
        <div className="overflow-x-auto rounded-xl border border-[#1E293B] bg-[#0F172A]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1E293B]/60 text-slate-300 border-b border-[#1E293B]">
              <tr>
                <th className="p-3">Execution ID</th>
                <th className="p-3">Status</th>
                <th className="p-3">Trigger Type</th>
                <th className="p-3">Progress</th>
                <th className="p-3">Started At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/40">
              {executions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    No execution history recorded.
                  </td>
                </tr>
              ) : (
                executions.map(run => (
                  <tr key={run.id} className="hover:bg-[#1E293B]/20 transition-colors">
                    <td className="p-3 font-mono text-slate-300">{run.id.slice(0, 8)}...</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        run.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : run.status === 'failed'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{run.trigger_type}</td>
                    <td className="p-3 text-slate-300">{run.steps_completed} / {run.steps_total}</td>
                    <td className="p-3 text-slate-400">{new Date(run.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#1E293B] bg-[#0F172A]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1E293B]/60 text-slate-300 border-b border-[#1E293B]">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Source Type</th>
                <th className="p-3">Error Message</th>
                <th className="p-3">Retries</th>
                <th className="p-3">Logged At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/40">
              {deadLetters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-emerald-400/80">
                    Dead-letter queue clean. No unhandled failures.
                  </td>
                </tr>
              ) : (
                deadLetters.map(dl => (
                  <tr key={dl.id} className="hover:bg-rose-950/10 transition-colors">
                    <td className="p-3 font-mono text-slate-300">{dl.id.slice(0, 8)}...</td>
                    <td className="p-3 text-slate-400">{dl.source_type}</td>
                    <td className="p-3 text-rose-300 max-w-xs truncate">{dl.error_message}</td>
                    <td className="p-3 text-slate-300">{dl.retry_count}</td>
                    <td className="p-3 text-slate-400">{new Date(dl.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
