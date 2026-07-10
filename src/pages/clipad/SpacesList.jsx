import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Layers, Plus, Search, Users, Video, Camera, ArrowRight, Settings, Clock } from 'lucide-react';

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
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-[#050A15] text-white">
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 md:px-10 h-16 bg-[#050A15]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center"><Video className="w-4 h-4 text-white" strokeWidth={2.5} /></div>
          <span className="text-lg font-bold tracking-tight">CliPad</span>
        </div>
        <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-400 hover:text-white transition-colors">← Dashboard</button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white mb-1 flex items-center gap-3"><Layers className="w-7 h-7 text-indigo-400" /> Team Spaces</h1>
            <p className="text-gray-400 text-sm">Persistent rooms for every team, project, and recurring purpose.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all"
          >
            <Plus className="w-4 h-4" /> New Space
          </button>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search spaces..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 rounded-2xl bg-white/[0.03] animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Layers className="w-16 h-16 text-gray-800 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">No spaces yet</h3>
            <p className="text-gray-600 mb-6 text-sm">Create a space for your first team or project.</p>
            <button onClick={() => setShowCreate(true)} className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all">
              Create your first space
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(space => {
              const color = COLORS[space.name?.charCodeAt(0) % COLORS.length] || COLORS[0];
              return (
                <div
                  key={space.id}
                  onClick={() => navigate(`/spaces/${space.id}`)}
                  className="group p-6 rounded-2xl bg-[#111827] border border-white/[0.06] hover:border-white/12 cursor-pointer transition-all hover:-translate-y-1"
                >
                  <div className="flex items-start gap-4 mb-5">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0`}>
                      {space.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-base truncate">{space.name}</h3>
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{space.description || 'A shared space for meetings and video updates.'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{new Date(space.created_at).toLocaleDateString()}</div>
                    <div className="flex items-center gap-1 group-hover:text-indigo-400 transition-colors font-medium">Open <ArrowRight className="w-3.5 h-3.5" /></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Space Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-1">Create a Space</h2>
            <p className="text-sm text-gray-400 mb-6">A persistent room for your team, project, or recurring meetings.</p>
            <form onSubmit={createSpace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Space Name *</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Product Team, Q3 Campaign..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Description</label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="What is this space for?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition-all resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/8 text-gray-300 font-semibold text-sm transition-all border border-white/10">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm transition-all disabled:opacity-60">
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
