import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { getPlanLimits, getUserPlan } from '@/lib/clipadPricing';
import { CliPadLogo } from '@/components/ui/CliPadLogo';
import { 
  Plus, Users, Video, Clock, ArrowRight, Settings, 
  Search, Lock, Globe, Layout, Camera, Layers, ArrowLeft, UserCircle
} from 'lucide-react';
import { getSpaceIcon } from '@/utils/spaceIcons';
import ThemeToggle from '@/components/layout/ThemeToggle';
import NotificationCenter from '@/components/clipad/notifications/NotificationCenter';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { isAdmin } from '@/lib/constants';
import PaywallModal from '@/components/clipad/PaywallModal';

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
  const [showPaywall, setShowPaywall] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchSpaces(); }, []);

  const fetchSpaces = async () => {
    setLoading(true);
    if (!user?.id) { setLoading(false); return; }

    try {
      // Fetch membership first so we know which spaces user has access to
      const membershipRes = await supabase
        .from('clipad_space_members')
        .select('space_id')
        .eq('user_id', user.id);
      const memberSpaceIds = new Set(membershipRes.data?.map(m => m.space_id) || []);

      // Fetch ALL company spaces (public AND private) for discovery
      // RLS allows this when the SELECT policy doesn't gate on privacy
      let allSpaces = [];
      if (user.company_id) {
        const { data: companySpaces } = await supabase
          .from('clipad_spaces')
          .select('*')
          .eq('company_id', user.company_id)
          .order('created_at', { ascending: false });
        allSpaces = companySpaces || [];
      }

      // Also include spaces the user owns (in case company_id wasn't set on old ones)
      const { data: mySpaces } = await supabase
        .from('clipad_spaces')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });
      
      // Merge, deduplicate
      const seen = new Set(allSpaces.map(s => s.id));
      (mySpaces || []).forEach(s => { if (!seen.has(s.id)) { allSpaces.push(s); seen.add(s.id); } });

      // Tag each space: _isMember = has full access, _isRestricted = private & not a member
      const tagged = allSpaces.map(s => ({
        ...s,
        _isMember: s.created_by === user.id || memberSpaceIds.has(s.id),
        _isRestricted: s.is_private && s.created_by !== user.id && !memberSpaceIds.has(s.id) && !isAdmin(user)
      }));
      tagged.sort((a, b) => {
        // Accessible spaces first, then restricted
        if (a._isRestricted !== b._isRestricted) return a._isRestricted ? 1 : -1;
        return new Date(b.created_at) - new Date(a.created_at);
      });
      setSpaces(tagged);
    } catch (err) {
      console.error('Failed to fetch spaces:', err);
    }
    setLoading(false);
  };


  const createSpace = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !user) return;
    
      // Plan Limit Check
      const planLimits = getPlanLimits(user);
      const maxSpaces = planLimits.maxTeamSpaces;
      if (spaces.length >= maxSpaces) {
        setShowCreate(false);
        setShowPaywall(true);
        return;
      }

    setCreating(true);
    try {
      const { data, error } = await supabase.from('clipad_spaces').insert({
        name: newName.trim(),
        description: newDesc.trim(),
        created_by: user.id,
        is_private: isPrivate,
        company_id: user.company_id || null
      }).select().single();
      if (error) throw error;
      setSpaces(prev => [data, ...prev]);
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
      setIsPrivate(false);
      navigate(`/spaces/${data.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const isAdminUser = isAdmin(user);
  // Show all spaces; SpaceDashboard handles the access wall for private ones
  const filtered = spaces.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()));

  const firstName = user?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-slate-50 dark:bg-background text-slate-900 dark:text-slate-100 page-enter overflow-x-hidden pb-24 md:pb-8">
      {/* Sleek top nav */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 h-16 bg-white/80 dark:bg-card/80 backdrop-blur-xl border-b border-slate-200 dark:border-border shrink-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-secondary flex items-center justify-center border border-slate-200 dark:border-border shadow-sm text-primary">
            <CliPadLogo size={22} />
          </div>
          <span className="text-lg font-bold tracking-tight hidden sm:block">CliPad</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-3">
          <button onClick={() => navigate('/spaces')} className="hidden md:block px-3 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg transition-colors">Spaces</button>
          <button onClick={() => navigate('/videos')} className="hidden md:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-white rounded-lg transition-colors">Recordings</button>
          <button onClick={() => navigate('/meetings')} className="hidden md:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-white rounded-lg transition-colors">Meetings</button>
          <button onClick={() => navigate('/chat')} className="hidden md:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-white rounded-lg transition-colors">Chat</button>
          {isAdminUser && (
            user?.clipad_plan === 'enterprise' ? (
              <button onClick={() => navigate(window.location.hostname.includes('clipad') ? '/enterprise' : '/clipad/enterprise')} className="hidden md:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-white rounded-lg transition-colors">Enterprise</button>
            ) : (
              <button onClick={() => navigate(window.location.hostname.includes('clipad') ? '/analytics' : '/clipad/analytics')} className="hidden md:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-white rounded-lg transition-colors">Analytics</button>
            )
          )}
          
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block" />
          
          <ThemeToggle />
          <NotificationCenter />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-9 h-9 rounded-xl bg-primary hover:bg-primary/90 flex items-center justify-center font-bold text-sm text-primary-foreground shadow-sm transition-all hover:scale-105 active:scale-95 ml-1 overflow-hidden border border-primary/20">
                {user?.avatar_url || user?.user_metadata?.avatar_url ? (
                  <img src={user.avatar_url || user.user_metadata.avatar_url} alt={firstName} className="w-full h-full object-cover" />
                ) : (
                  firstName[0]?.toUpperCase()
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-xl border-slate-200 dark:border-border">
              <div className="px-3 py-3 mb-2 bg-slate-50 dark:bg-secondary/50 rounded-xl">
                <p className="font-semibold text-sm truncate">{user?.full_name || user?.user_metadata?.full_name || 'User'}</p>
                <p className="text-xs text-slate-500 dark:text-muted-foreground truncate">{user?.email}</p>
              </div>
              <DropdownMenuItem onClick={() => navigate('/settings')} className="rounded-xl py-2.5 px-3 cursor-pointer">
                <Settings className="w-4 h-4 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-secondary" />
              <DropdownMenuItem onClick={() => window.location.href = 'https://account.optavel.com'} className="rounded-xl py-2.5 px-3 cursor-pointer text-slate-500">
                <UserCircle className="w-4 h-4 mr-2" /> Go to Optavel Account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">Team Spaces</h1>
            <p className="text-slate-500 dark:text-muted-foreground">Persistent rooms for projects, teams, or recurring syncs.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/95 dark:bg-[#202c33]/95 backdrop-blur-md border border-black/5 dark:border-white/5 focus:outline-none focus:border-primary/50 text-sm shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-all"
              />
            </div>
            {isAdminUser && (
              <button 
                onClick={() => navigate('/clipad/billing')}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-500/10 text-amber-600 font-semibold text-sm rounded-lg hover:bg-amber-200 dark:hover:bg-amber-500/20 transition-colors"
              >
                Billing
              </button>
            )}
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
            <h3 className="text-xl font-bold text-slate-500 dark:text-muted-foreground mb-2">No spaces yet</h3>
            <p className="text-slate-400 dark:text-slate-500 mb-6 text-sm">Create a space for your first team or project.</p>
            <button onClick={() => setShowCreate(true)} className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-md transition-all">
              Create your first space
            </button>
          </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(space => {
                const colors = ['from-blue-500 to-blue-700', 'from-indigo-500 to-indigo-700', 'from-purple-500 to-purple-700', 'from-fuchsia-500 to-fuchsia-700', 'from-rose-500 to-rose-700', 'from-orange-500 to-orange-700', 'from-emerald-500 to-emerald-700'];
                const colorIndex = space.id ? space.id.split('-').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length : 0;
                const color = colors[colorIndex];
                const isRestricted = space._isRestricted;
                const SpaceIcon = getSpaceIcon(space.name);

                return (
                  <div
                    key={space.id}
                    onClick={() => navigate(`/spaces/${space.id}`)}
                    className={`group p-5 rounded-2xl bg-white dark:bg-card border hover:border-primary/50 dark:hover:border-primary/50 cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md relative overflow-hidden ${
                      isRestricted
                        ? 'border-slate-200 dark:border-border opacity-80 hover:opacity-95'
                        : 'border-slate-200 dark:border-border'
                    }`}
                  >
                    {/* Locked overlay for restricted private spaces */}
                    {isRestricted && (
                      <div className="absolute inset-0 z-10 bg-gradient-to-br from-slate-50/80 to-slate-100/60 dark:from-slate-950/80 dark:to-slate-900/60 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 rounded-2xl">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-secondary border border-slate-200 dark:border-border flex items-center justify-center shadow-sm">
                          <Lock className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                        </div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-muted-foreground">Private — Request Access</span>
                      </div>
                    )}

                    <div className="flex items-start gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm bg-gradient-to-br ${color} shrink-0`}>
                        <SpaceIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-base truncate">{space.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5 line-clamp-1">{space.description || 'Team space'}</p>
                      </div>
                      {!isRestricted && <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors shrink-0" />}
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        space.is_private
                          ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {space.is_private ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                        {space.is_private ? 'Private' : 'Public'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {[1,2,3].map(i => (
                          <div key={i} className="w-6 h-6 rounded-full bg-slate-100 dark:bg-secondary border-2 border-white dark:border-slate-900 flex items-center justify-center text-slate-500 dark:text-muted-foreground">
                            <Users className="w-3 h-3" />
                          </div>
                        ))}
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-muted-foreground">{new Date(space.created_at || Date.now()).toLocaleDateString()}</span>
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
          <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Create a Space</h2>
            <p className="text-sm text-slate-500 dark:text-muted-foreground mb-6">A persistent room for your team, project, or recurring meetings.</p>
            <form onSubmit={createSpace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-muted-foreground mb-2 uppercase tracking-wider">Space Name *</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Product Team, Q3 Campaign..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-background border border-slate-200 dark:border-border text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:border-primary/50 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-muted-foreground mb-2 uppercase tracking-wider">Description</label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="What is this space for?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-background border border-slate-200 dark:border-border text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:border-primary/50 transition-all resize-none"
                />
              </div>
              
              <div onClick={() => setIsPrivate(!isPrivate)} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-border bg-slate-50/50 dark:bg-card/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className={`w-10 h-6 rounded-full transition-colors relative ${isPrivate ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${isPrivate ? 'left-5' : 'left-1'}`} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Private Space
                  </div>
                  <div className="text-[11px] text-slate-500">Only invited members can access.</div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl bg-white dark:bg-secondary hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-foreground font-semibold text-sm transition-all border border-slate-200 dark:border-border shadow-sm">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-all shadow-md disabled:opacity-60">
                  {creating ? 'Creating...' : 'Create Space'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        featureName="More Spaces"
        limitDescription={`You have reached the limit of ${getPlanLimits(user).maxTeamSpaces} spaces on the ${getUserPlan(user)} plan.`}
      />

          </div>
  );
}
