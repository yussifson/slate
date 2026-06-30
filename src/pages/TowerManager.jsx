import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, ArrowRight, Activity, 
  Users, DollarSign, Target, LayoutGrid, Check, Loader2, Play
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { TowerMutations } from '@/api/TowerMutations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

export default function TowerManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [towers, setTowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aggregates, setAggregates] = useState(null);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTowerName, setNewTowerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // The industry this manager is filtering for (usually the current user session industry)
  const industry = user?.company_industry || 'law';

  useEffect(() => {
    fetchTowers();
  }, [user]);

  const fetchTowers = async () => {
    if (!user?.email) return;
    setLoading(true);
    const { success, towers, error } = await TowerMutations.getAllTowers(user.email, industry);
    if (success) {
      setTowers(towers);
      // Fetch aggregates across these towers
      const cIds = towers.map(t => t.id);
      const aggRes = await TowerMutations.getTowerAggregates(cIds, industry);
      if (aggRes.success) setAggregates(aggRes.aggregates);
    } else {
      toast({ title: 'Error', description: 'Failed to fetch your branches', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleCreateTower = async (e) => {
    e.preventDefault();
    if (!newTowerName.trim() || !user?.email || !user?.id) return;
    
    setIsCreating(true);
    const { success, error } = await TowerMutations.createTower(newTowerName, industry, user.email, user.id);
    
    if (success) {
      toast({ title: 'Branch Created!', description: 'Your new vertical is ready.' });
      setNewTowerName('');
      setIsCreateOpen(false);
      // Trigger a reload so AuthContext picks up the new access control and TopBar updates
      window.location.reload();
    } else {
      toast({ title: 'Creation Failed', description: error?.message || 'Unknown error occurred', variant: 'destructive' });
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020817] text-slate-800 dark:text-slate-100 p-6 md:p-10 font-sans">
      {/* Header */}
      <div className="mb-12 relative flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="absolute -top-10 -left-10 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl opacity-50 dark:opacity-20 pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 flex items-center gap-4 mb-3">
            <div className="p-3 bg-white dark:bg-white/5 rounded-2xl shadow-xl shadow-blue-500/10 border border-slate-100 dark:border-white/10">
              <LayoutGrid className="w-8 h-8 text-blue-500" />
            </div>
            Multi-Tenant Towers
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">Manage all your {industry} branches and verticals from one central command center.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 font-bold gap-2 transition-all relative z-10">
              <Plus className="w-5 h-5" /> Add New Vertical
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md border-0 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            <DialogHeader className="pt-4">
              <DialogTitle className="text-2xl font-bold dark:text-white">New {industry.charAt(0).toUpperCase() + industry.slice(1)} Branch</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTower} className="space-y-6 py-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Branch Name</label>
                <Input 
                  value={newTowerName}
                  onChange={(e) => setNewTowerName(e.target.value)}
                  placeholder="e.g. Downtown Store, North Campus..."
                  className="h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={isCreating || !newTowerName.trim()} className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-blue-500/25">
                {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Deploy Vertical"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cross-Workspace Aggregates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 relative z-10">
        <div className="bg-white dark:bg-[#0F172A] rounded-3xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl"></div>
          <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-2"><Building2 className="w-4 h-4" /> Active Branches</p>
          <h3 className="text-4xl font-black text-slate-800 dark:text-white">{loading ? '-' : towers.length}</h3>
        </div>
        
        <div className="bg-white dark:bg-[#0F172A] rounded-3xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>
          <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-2"><DollarSign className="w-4 h-4" /> Aggregate Revenue</p>
          <h3 className="text-4xl font-black text-slate-800 dark:text-white">{aggregates ? `$${aggregates.totalRevenue.toLocaleString()}` : '-'}</h3>
        </div>

        <div className="bg-white dark:bg-[#0F172A] rounded-3xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl"></div>
          <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-2"><Users className="w-4 h-4" /> Total Users</p>
          <h3 className="text-4xl font-black text-slate-800 dark:text-white">{aggregates ? aggregates.activeUsers.toLocaleString() : '-'}</h3>
        </div>
      </div>

      {/* Tower List */}
      <div className="relative z-10">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-3">
          Your Towers
        </h2>
        
        {loading ? (
          <div className="flex items-center justify-center p-20">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          </div>
        ) : towers.length === 0 ? (
          <div className="text-center p-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
            <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No Branches Found</h3>
            <p className="text-slate-500">Create your first vertical to start building your multi-tenant ecosystem.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {towers.map(tower => (
              <div key={tower.id} className="group bg-white dark:bg-[#0F172A] hover:bg-blue-50/50 dark:hover:bg-[#15203A] rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 dark:border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 font-bold text-lg">
                      {tower.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full">
                      Active
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1 line-clamp-1">{tower.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{tower.industry_type}</p>
                </div>
                
                <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <Activity className="w-4 h-4" /> Online
                  </div>
                  {user.company_id === tower.id ? (
                    <div className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400">
                      <Check className="w-4 h-4" /> Current Active
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-sm font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Use Switcher <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
