import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit2, CheckCircle2, AlertOctagon, Loader2, Search, UserCheck } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useImpersonation } from '@/lib/ImpersonationContext';
import PageHeader from '@/components/shared/PageHeader';

export default function AdminFirms() {
  const { toast } = useToast();
  const { startImpersonation } = useImpersonation();
  
  const [companies, setCompanies] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [maxUsers, setMaxUsers] = useState(0);
  const [maxCases, setMaxCases] = useState(0);
  const [subPlan, setSubPlan] = useState('starter');
  const [subStatus, setSubStatus] = useState('trial');
  const [updatingQuota, setUpdatingQuota] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: compData } = await supabase.from('companies').select('*');
      if (compData) setCompanies(compData);

      const { data: profData } = await supabase.from('profiles').select('company_id');
      if (profData) setProfiles(profData);

      const { data: caseData } = await supabase.from('legal_cases').select('company_id');
      if (caseData) setCases(caseData);
    } catch (err) {
      console.error("Failed to load platform stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (company) => {
    const nextStatus = company.status === 'active' ? 'suspended' : 'active';
    try {
      const { error } = await supabase
        .from('companies')
        .update({ status: nextStatus })
        .eq('id', company.id);

      if (error) throw error;
      toast({ title: `Firm status updated`, description: `${company.name} is now ${nextStatus}.` });
      fetchData();
    } catch (err) {
      toast({ title: "Operation failed", description: err.message, variant: "destructive" });
    }
  };

  const handleOpenEditDialog = (company) => {
    setSelectedCompany(company);
    setMaxUsers(company.max_users || 3);
    setMaxCases(company.max_cases || 10);
    setSubPlan(company.subscription_plan || 'starter');
    setSubStatus(company.subscription_status || 'trial');
    setEditDialogOpen(true);
  };

  const handleSaveQuotas = async () => {
    if (!selectedCompany) return;
    setUpdatingQuota(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          max_users: maxUsers,
          max_cases: maxCases,
          subscription_plan: subPlan,
          subscription_status: subStatus
        })
        .eq('id', selectedCompany.id);

      if (error) throw error;
      toast({ title: "Limits updated successfully" });
      setEditDialogOpen(false);
      fetchData();
    } catch (err) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingQuota(false);
    }
  };

  const handleImpersonate = (company) => {
    startImpersonation(company);
    toast({ title: "Impersonation Active", description: `You are now viewing the system as ${company.name}. Navigate to the dashboard to see their data.` });
    window.location.href = '/';
  };

  const filteredCompanies = companies.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subdomain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader 
        title="Registered Firms" 
        subtitle="Manage limits, impersonate users, and suspend access." 
        action={
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input 
              type="text" 
              placeholder="Search subdomain or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-lg border-slate-200"
            />
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          {filteredCompanies.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm font-semibold">
              No firms found matching query.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse bg-white font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-slate-600 font-semibold uppercase tracking-wider text-xs">
                    <th className="px-5 py-4">Firm / Domain</th>
                    <th className="px-5 py-4">Plan & Status</th>
                    <th className="px-5 py-4">State</th>
                    <th className="px-5 py-4">Created</th>
                    <th className="px-5 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCompanies.map((c, idx) => {
                    const activeUsers = profiles.filter(p => p.company_id === c.id).length;
                    const activeCases = cases.filter(cs => cs.company_id === c.id).length;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-bold text-slate-900">{c.name}</p>
                            <p className="font-mono text-[11px] text-primary mt-0.5">{c.subdomain}.optalflow.com</p>
                            <p className="text-[11px] text-slate-500 mt-1">{c.email} &middot; {activeUsers} users &middot; {activeCases} cases</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div>
                            <Badge className="text-[10px] font-bold uppercase py-0.5 px-2 bg-slate-100 text-slate-700 capitalize border-none">{c.subscription_plan}</Badge>
                            <p className="text-[10px] font-semibold text-slate-400 mt-1 capitalize">({c.subscription_status})</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex py-1 px-2.5 rounded-full text-[10px] font-bold uppercase ${
                            c.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-red-50 text-red-700 border border-red-100'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-500 font-medium text-xs">
                          {new Date(c.created_date || c.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-center gap-2 flex-wrap">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleImpersonate(c)}
                              className="h-8 text-xs gap-1.5 px-3 rounded-lg border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-800"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Impersonate
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleOpenEditDialog(c)}
                              className="h-8 text-xs gap-1.5 px-3 rounded-lg border-slate-200"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-500" /> Quota
                            </Button>
                            <Button 
                              variant={c.status === 'active' ? 'destructive' : 'default'}
                              size="sm" 
                              onClick={() => handleToggleStatus(c)}
                              className="h-8 text-xs px-3 rounded-lg"
                            >
                              {c.status === 'active' ? (
                                <>
                                  <AlertOctagon className="w-3.5 h-3.5 mr-1.5" /> Suspend
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Activate
                                </>
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit Quota & Plans Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl border border-slate-100 shadow-xl bg-white p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-extrabold text-base flex items-center gap-1.5">
              <Edit2 className="w-4 h-4 text-primary" />
              Manage Limits: {selectedCompany?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 text-sm text-slate-700">
            <div className="space-y-1.5">
              <label className="font-bold uppercase tracking-wide text-[10px] text-slate-500 block">Subscription Tier</label>
              <select 
                value={subPlan} 
                onChange={(e) => setSubPlan(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-primary focus:outline-none bg-slate-50 text-sm"
              >
                <option value="starter">Starter Plan ($29/mo)</option>
                <option value="professional">Professional Plan ($79/mo)</option>
                <option value="enterprise">Enterprise Plan ($199/mo)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold uppercase tracking-wide text-[10px] text-slate-500 block">Subscription Status</label>
              <select 
                value={subStatus} 
                onChange={(e) => setSubStatus(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-primary focus:outline-none bg-slate-50 text-sm"
              >
                <option value="trial">Trialing</option>
                <option value="active">Active (Paid)</option>
                <option value="expired">Expired (Trial End)</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wide text-[10px] text-slate-500 block">Max Active Users</label>
                <Input 
                  type="number"
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(parseInt(e.target.value) || 0)}
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wide text-[10px] text-slate-500 block">Max Active Cases</label>
                <Input 
                  type="number"
                  value={maxCases}
                  onChange={(e) => setMaxCases(parseInt(e.target.value) || 0)}
                  className="rounded-xl border-slate-200"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-2">
            <Button 
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="flex-1 rounded-xl text-slate-700 border-slate-200 h-11"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveQuotas}
              disabled={updatingQuota}
              className="flex-1 bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl h-11"
            >
              {updatingQuota ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Limits"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
