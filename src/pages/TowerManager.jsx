import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, ArrowRight, Activity, 
  Users, DollarSign, LayoutGrid, Check, Loader2, ChevronDown
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { TowerMutations } from '@/api/TowerMutations';
import { powerSync } from '@/api/PowerSyncConnector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
      window.location.reload();
    } else {
      toast({ title: 'Creation Failed', description: error?.message || 'Unknown error occurred', variant: 'destructive' });
      setIsCreating(false);
    }
  };

  const handleSwitchBranch = async (targetCompanyId, targetCompanyName) => {
    if (!targetCompanyId || targetCompanyId === user?.company_id) return;
    try {
      toast({ title: "Switching Branch...", description: targetCompanyName });
      
      const keys = Object.keys({ company_id: targetCompanyId });
      const values = Object.values({ company_id: targetCompanyId });
      const setClause = keys.map(k => `${k} = ?`).join(', ');
      
      await powerSync.execute(`UPDATE profiles SET ${setClause} WHERE id = ?`, [...values, user.id]);
      
      // Redirect to home which triggers AuthContext bucket refresh
      window.location.href = '/';
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to switch branch.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-900 dark:text-slate-100 p-6 md:p-10 font-sans">
      {/* Enterprise Header */}
      <div className="mb-12 relative flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-emerald-100 dark:border-emerald-900/30 pb-8">
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-60 dark:opacity-20 pointer-events-none"></div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary text-xs font-bold uppercase tracking-widest rounded-md">Enterprise Hub</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-4 mb-4">
            Branch Manager
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">Govern and monitor all your <span className="font-bold text-primary dark:text-primary capitalize">{industry}</span> branches from a unified command center.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 z-10 relative mt-4 md:mt-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-12 px-6 rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 font-semibold gap-2 w-full sm:w-auto hover:bg-slate-50 dark:hover:bg-slate-800">
                <Building2 className="w-4 h-4 text-primary" /> 
                Switch Branch
                <ChevronDown className="w-4 h-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[240px] rounded-xl shadow-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A101D]">
              {towers.length === 0 ? (
                <div className="p-3 text-sm text-slate-500 text-center">No branches available</div>
              ) : (
                towers.map(comp => (
                  <DropdownMenuItem 
                    key={comp.id} 
                    onClick={() => handleSwitchBranch(comp.id, comp.name)}
                    className={`cursor-pointer px-3 py-2.5 m-1 rounded-lg flex items-center justify-between ${user.company_id === comp.id ? 'bg-primary/5 dark:bg-primary/10 text-primary dark:text-primary font-bold' : ''}`}
                  >
                    <span className="truncate">{comp.name}</span>
                    {user.company_id === comp.id && <Check className="w-4 h-4" />}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 px-6 rounded-lg bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 font-semibold gap-2 transition-all w-full sm:w-auto border-0">
                <Plus className="w-5 h-5" /> Deploy New Branch
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
              <DialogHeader className="pt-4">
                <DialogTitle className="text-2xl font-bold dark:text-white">New {industry.charAt(0).toUpperCase() + industry.slice(1)} Branch</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTower} className="space-y-6 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Branch Name</label>
                  <Input 
                    value={newTowerName}
                    onChange={(e) => setNewTowerName(e.target.value)}
                    placeholder="e.g. Downtown Store, North Campus..."
                    className="h-12 bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 rounded-lg focus-visible:ring-emerald-500"
                    autoFocus
                  />
                </div>
                <Button type="submit" disabled={isCreating || !newTowerName.trim()} className="w-full h-12 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold shadow-md shadow-primary/20">
                  {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Deploy Branch"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Enterprise Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 relative z-10">
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Active Branches</p>
            <div className="p-2 bg-primary/5 dark:bg-primary/10 rounded-lg">
              <Building2 className="w-5 h-5 text-primary dark:text-primary" />
            </div>
          </div>
          <h3 className="text-4xl font-black text-slate-900 dark:text-white">{loading ? '-' : towers.length}</h3>
        </div>
        
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Global Revenue</p>
            <div className="p-2 bg-primary/5 dark:bg-primary/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-primary dark:text-primary" />
            </div>
          </div>
          <h3 className="text-4xl font-black text-slate-900 dark:text-white">{aggregates ? `$${aggregates.totalRevenue.toLocaleString()}` : '-'}</h3>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Network Users</p>
            <div className="p-2 bg-primary/5 dark:bg-primary/10 rounded-lg">
              <Users className="w-5 h-5 text-primary dark:text-primary" />
            </div>
          </div>
          <h3 className="text-4xl font-black text-slate-900 dark:text-white">{aggregates ? aggregates.activeUsers.toLocaleString() : '-'}</h3>
        </div>
      </div>

      {/* Branch List */}
      <div className="relative z-10 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
          Your Branch Network
        </h2>
        
        {loading ? (
          <div className="flex items-center justify-center p-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : towers.length === 0 ? (
          <div className="text-center p-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No Branches Found</h3>
            <p className="text-slate-500">Deploy your first vertical to establish your multi-tenant network.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {towers.map(tower => (
              <div 
                key={tower.id} 
                onClick={() => handleSwitchBranch(tower.id, tower.name)}
                className={`group relative rounded-xl p-6 border transition-all flex flex-col justify-between cursor-pointer ${
                  user.company_id === tower.id 
                    ? 'bg-primary/5 dark:bg-primary/5 border-primary shadow-md shadow-primary/10' 
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-12 h-12 rounded-lg bg-primary text-white flex items-center justify-center font-black text-xl shadow-sm">
                      {tower.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="px-2.5 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/20 text-[10px] font-black uppercase tracking-widest rounded-full">
                      Operational
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{tower.name}</h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{tower.industry_type}</p>
                </div>
                
                <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary dark:text-primary">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Online
                  </div>
                  {user.company_id === tower.id ? (
                    <div className="flex items-center gap-1.5 text-xs font-black text-primary dark:text-primary bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded">
                      <Check className="w-3.5 h-3.5" /> CURRENT
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-500 group-hover:text-primary transition-colors">
                      Switch to Branch <ArrowRight className="w-3.5 h-3.5" />
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
