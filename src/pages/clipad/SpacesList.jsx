import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { CliPadLogo } from '@/components/ui/CliPadLogo';
import { Layers, Plus, Search, Users, Video, Camera, ArrowRight, Settings, Clock, ArrowLeft } from 'lucide-react';

const COLORS = [
  'from-indigo-500 to-violet-500',
  'from-cyan-500 to-blue-500',
  'from-pink-500 to-rose-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-violet-500 to-purple-500',
];

export default function SpacesList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchSpaces(); }, []);

  const fetchSpaces = async () => {
    setLoading(true);
    const { data } = await supabase.from('clipad_spaces').select('*').order('created_at', { ascending: false });
    if (data) setSpaces(data);
    setLoading(false);
  };

  const createSpace = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !user) return;
    setCreating(true);
    try {
      const { data, error } = await supabase.from('clipad_spaces').insert({
        name: newName.trim(),
        description: newDesc.trim(),
        created_by: user.id,
      }).select().single();
      if (error) throw error;
      setSpaces(prev => [data, ...prev]);
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
      navigate(`/spaces/${data.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const filtered = spaces.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 page-enter">
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 md:px-10 h-16 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-primary">
            <CliPadLogo size={20} />
          </div>
          <span className="text-lg font-bold tracking-tight">Spaces</span>
        </div>
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md text-sm font-semibold text-slate-700 dark:text-slate-300 transition-all hover:-translate-y-0.5"><ArrowLeft className="w-4 h-4 text-slate-500" /> Dashboard</button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">Team Spaces</h1>
            <p className="text-slate-500 dark:text-slate-400">Persistent rooms for projects, teams, or recurring syncs.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Find a space..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-primary/50 text-sm shadow-sm transition-all"
              />
            </div>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-md shadow-primary/20 transition-all shrink-0">
              <Plus className="w-4 h-4" /> New Space
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 rounded-2xl bg-white/[0.03] animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Layers className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-500 dark:text-slate-400 mb-2">No spaces yet</h3>
            <p className="text-slate-400 dark:text-slate-500 mb-6 text-sm">Create a space for your first team or project.</p>
            <button onClick={() => setShowCreate(true)} className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-md transition-all">
              Create your first space
            </button>
          </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(space => {
                const color = COLORS[space.name?.charCodeAt(0) % COLORS.length] || COLORS[0];
                return (
                  <div
                    key={space.id}
                    onClick={() => navigate(`/spaces/${space.id}`)}
                    className="group relative overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:border-primary/50 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0`}>
                          {space.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg truncate group-hover:text-primary transition-colors">{space.name}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{space.description || 'A shared space for meetings and video updates.'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {new Date(space.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-primary group-hover:text-white text-slate-400 transition-all">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
        )}
      </div>

      {/* Create Space Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Create a Space</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">A persistent room for your team, project, or recurring meetings.</p>
            <form onSubmit={createSpace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Space Name *</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Product Team, Q3 Campaign..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:border-primary/50 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Description</label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="What is this space for?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:border-primary/50 transition-all resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all border border-slate-200 dark:border-slate-700 shadow-sm">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-all shadow-md disabled:opacity-60">
                  {creating ? 'Creating...' : 'Create Space'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
