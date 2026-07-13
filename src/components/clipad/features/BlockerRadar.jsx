import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { ShieldAlert, AlertTriangle, CheckCircle, Network } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function BlockerRadar({ workspaceId, spaceId, isWorkspaceView = false, hasFullIntelligence }) {
  const { user } = useAuth();
  const [blockers, setBlockers] = useState([]);
  const [loading, setLoading] = useState(true);

  // RBAC checks
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'company_admin';
  const isCompanyAdmin = user?.role === 'super_admin' || user?.role === 'company_admin';

  useEffect(() => {
    if (!workspaceId || !hasFullIntelligence) return;
    
    // In Workspace View, we only load if Company Admin (Enterprise feature handled via tier check)
    if (isWorkspaceView && !isCompanyAdmin) return;

    const fetchBlockers = async () => {
      setLoading(true);
      
      let query = supabase
        .from('clipad_blockers')
        .select(`
          *,
          blocked_person:blocked_person_id(id, full_name, avatar_url),
          blocking_person:blocking_person_id(id, full_name, avatar_url)
        `)
        .eq('workspace_id', workspaceId)
        .order('detected_at', { ascending: false });
        
      if (!isWorkspaceView && spaceId) {
        query = query.eq('team_space_id', spaceId);
      }
      
      const { data, error } = await query;
      
      if (!error && data) {
        setBlockers(data);
      }
      setLoading(false);
    };

    fetchBlockers();
  }, [workspaceId, spaceId, isWorkspaceView, isCompanyAdmin, hasFullIntelligence]);

  const handleResolve = async (blockerId) => {
    // Only blocked person or Admin can resolve
    const { error } = await supabase
      .from('clipad_blockers')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', blockerId)
      .eq('workspace_id', workspaceId); // Tenant isolation

    if (!error) {
      setBlockers(blockers.map(b => b.id === blockerId ? { ...b, status: 'resolved', resolved_at: new Date().toISOString() } : b));
    }
  };

  if (!hasFullIntelligence) {
    if (isWorkspaceView) return null; // Don't show in dashboard if they don't have it
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-slate-700/50 rounded-xl bg-slate-800/20">
        <ShieldAlert className="w-12 h-12 text-indigo-400 mb-4" />
        <h3 className="text-xl font-medium text-slate-200 mb-2">Blocker Radar Locked</h3>
        <p className="text-slate-400 max-w-md">
          Upgrade to Pro or Enterprise to access Blocker Radar and instantly identify team bottlenecks.
        </p>
      </div>
    );
  }

  if (isWorkspaceView && !isCompanyAdmin) {
    return null; // Safety check
  }

  const openBlockers = blockers.filter(b => b.status === 'open');

  return (
    <div className="space-y-6">
      {!isWorkspaceView && (
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Network className="w-6 h-6 text-indigo-400" /> Blocker Radar
            </h2>
            <p className="text-sm text-slate-400 mt-1">Live graph of who is blocked on whom.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : blockers.length === 0 ? (
        <div className="p-8 text-center text-slate-400 border border-slate-700/50 rounded-xl bg-slate-800/30">
          No blockers detected.
        </div>
      ) : (
        <div className="space-y-4">
          {isWorkspaceView && (
             <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2 mb-4">
               <AlertTriangle className={`w-5 h-5 ${openBlockers.length > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
               Workspace Blocker Radar
             </h3>
          )}
          
          {blockers.map(blocker => {
            const isBlockedMe = blocker.blocked_person_id === user?.id;
            const canResolve = isBlockedMe || isAdmin;
            
            return (
              <div key={blocker.id} className={`p-4 rounded-xl border transition-colors ${blocker.status === 'open' ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-700/50 bg-slate-800/20 opacity-70'}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Blocked Person */}
                    <div className="flex flex-col items-center">
                      <img src={blocker.blocked_person?.avatar_url || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-full border-2 border-rose-500" />
                      <span className="text-xs text-slate-400 mt-1 truncate w-16 text-center">{blocker.blocked_person?.full_name?.split(' ')[0]}</span>
                    </div>
                    
                    {/* Connection */}
                    <div className="flex-1 flex flex-col items-center justify-center px-2">
                      <div className="w-full h-px bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-500 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 px-2 text-xs font-medium text-amber-400 border border-amber-500/30 rounded-full">
                          is blocked by
                        </div>
                      </div>
                      <span className="text-sm text-slate-300 mt-3 text-center w-full truncate px-4">{blocker.description}</span>
                    </div>

                    {/* Blocking Person/Team */}
                    <div className="flex flex-col items-center">
                      {blocker.blocking_person ? (
                        <>
                          <img src={blocker.blocking_person.avatar_url || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-full border-2 border-indigo-500" />
                          <span className="text-xs text-slate-400 mt-1 truncate w-16 text-center">{blocker.blocking_person.full_name?.split(' ')[0]}</span>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full border-2 border-indigo-500 bg-slate-800 flex items-center justify-center text-slate-400">?</div>
                          <span className="text-xs text-slate-400 mt-1">Unknown</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {blocker.status === 'open' && canResolve && (
                    <button 
                      onClick={() => handleResolve(blocker.id)}
                      className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" /> Resolve
                    </button>
                  )}
                  {blocker.status === 'resolved' && (
                    <span className="text-xs text-slate-500">Resolved</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
