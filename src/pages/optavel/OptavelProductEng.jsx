import React, { useState } from 'react';
import { Code, GitPullRequest, Bug, Activity, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from '@/lib/AuthContext';
import { v4 as uuidv4 } from 'uuid';

export default function OptavelProductEng() {
  const { user } = useAuth();
  const companyId = user?.profile?.company_id || user?.company_id;
  const queryClient = useQueryClient();

  const [newBugTitle, setNewBugTitle] = useState('');

  const { data: bugs = [] } = useQuery({
    queryKey: ['optavel_bugs', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT * FROM optavel_bugs WHERE company_id = ? ORDER BY created_at DESC`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: sprints = [] } = useQuery({
    queryKey: ['optavel_sprints', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT * FROM optavel_sprints WHERE company_id = ? AND status = 'active'`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const reportBug = useMutation({
    mutationFn: async () => {
      if (!newBugTitle) return;
      const id = uuidv4();
      await powerSync.execute(
        `INSERT INTO optavel_bugs (id, company_id, title, severity, status, reporter_id) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, companyId, newBugTitle, 'high', 'open', user.id]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['optavel_bugs']);
      setNewBugTitle('');
    }
  });

  const resolveBug = async (id) => {
    await powerSync.execute(`UPDATE optavel_bugs SET status = 'resolved' WHERE id = ?`, [id]);
    queryClient.invalidateQueries(['optavel_bugs']);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 p-8 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Code className="w-8 h-8 text-indigo-500" />
          Product & Engineering
        </h1>
        <p className="text-slate-400 mt-1">Roadmap, Sprint Management, Bug Tracker, and Deployments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Sprints', val: sprints.length.toString(), icon: Activity, color: 'text-emerald-400' },
          { label: 'Open Bugs', val: bugs.filter(b => b.status === 'open').length.toString(), icon: Bug, color: 'text-rose-400' },
          { label: 'Open PRs', val: '8', icon: GitPullRequest, color: 'text-blue-400' },
          { label: 'Deployments (7d)', val: '24', icon: Code, color: 'text-indigo-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#111113] border border-white/5 rounded-xl p-5">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-slate-400">{stat.label}</span>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <h3 className="text-3xl font-bold text-white">{stat.val}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111113] border border-white/5 rounded-2xl p-6 min-h-[400px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Bug Tracker</h2>
            <div className="flex gap-2">
              <input 
                type="text" placeholder="Bug summary..." 
                className="bg-black/50 border border-white/10 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-rose-500"
                value={newBugTitle} onChange={e => setNewBugTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && reportBug.mutate()}
              />
              <button onClick={() => reportBug.mutate()} className="p-1.5 bg-rose-500 hover:bg-rose-600 rounded-lg text-white">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {bugs.length === 0 ? <p className="text-slate-500 text-sm">No bugs reported.</p> : bugs.map(bug => (
              <div key={bug.id} className="p-3 bg-white/5 border border-white/5 rounded-lg flex justify-between items-center">
                <div>
                  <h4 className={`font-semibold text-white ${bug.status === 'resolved' ? 'line-through text-slate-500' : ''}`}>{bug.title}</h4>
                  <p className="text-xs text-slate-400">{new Date(bug.created_at).toLocaleString()}</p>
                </div>
                {bug.status === 'open' && (
                  <button onClick={() => resolveBug(bug.id)} className="text-xs px-2 py-1 bg-white/10 hover:bg-emerald-500 hover:text-white rounded">Resolve</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111113] border border-white/5 rounded-2xl p-6 min-h-[400px] flex items-center justify-center">
          <p className="text-slate-500">Advanced Roadmap and Sprint Board loaded here.</p>
        </div>
      </div>
    </div>
  );
}
