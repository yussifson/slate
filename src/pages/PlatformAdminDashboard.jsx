import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Scale, Users, Building2, DollarSign, ShieldAlert, Edit2, CheckCircle2, AlertOctagon, Bell, Loader2, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function PlatformAdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [companies, setCompanies] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Quota Edit State
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [maxUsers, setMaxUsers] = useState(0);
  const [maxCases, setMaxCases] = useState(0);
  const [subPlan, setSubPlan] = useState('starter');
  const [subStatus, setSubStatus] = useState('trial');
  const [updatingQuota, setUpdatingQuota] = useState(false);

  // Broadcast Notification State
  const [announcementText, setAnnouncementText] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all companies
      const { data: compData } = await supabase.from('companies').select('*');
      if (compData) setCompanies(compData);

      // 2. Fetch all profiles
      const { data: profData } = await supabase.from('profiles').select('*');
      if (profData) setProfiles(profData);

      // 3. Fetch all legal cases
      const { data: caseData } = await supabase.from('legal_cases').select('*');
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

  const handleBroadcast = async () => {
    if (!announcementText) return;
    setBroadcasting(true);
    try {
      // Broadcast an admin alert by creating a notification for all firms
      const notificationInserts = companies.map(c => ({
        company_id: c.id,
        title: "Platform Broadcast Notice",
        message: announcementText,
        type: "system",
        status: "unread"
      }));
      
      const { error } = await supabase.from('notifications').insert(notificationInserts);
      if (error) throw error;

      toast({ title: "System Broadcast Sent", description: "Successfully pushed notification alert to all law firms." });
      setAnnouncementText('');
    } catch (err) {
      toast({ title: "Broadcast failed", description: err.message, variant: "destructive" });
    } finally {
      setBroadcasting(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-slate-500 max-w-sm">This dashboard is strictly reserved for regional system administrators.</p>
      </div>
    );
  }

  // Calculate SaaS business metrics
  const activeFirmsCount = companies.filter(c => c.status === 'active').length;
  const totalUsersCount = profiles.length;
  const totalCasesCount = cases.length;
  
  // Calculate total MRR
  const mrr = companies
    .filter(c => c.subscription_status === 'active' && c.status === 'active')
    .reduce((sum, c) => {
      const planPrice = c.subscription_plan === 'starter' ? 29 : c.subscription_plan === 'professional' ? 79 : c.subscription_plan === 'enterprise' ? 199 : 0;
      return sum + planPrice;
    }, 0);

  const filteredCompanies = companies.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subdomain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" />
          SaaS Admin Command Center
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Oversee platform metrics, manage tenant limits, suspend firms, and broadcast releases.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Total MRR</p>
                <p className="text-2xl font-black text-slate-900">${mrr}</p>
                <p className="text-[10px] text-green-600 mt-1 font-semibold">Active Subscriptions</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Law Firms</p>
                <p className="text-2xl font-black text-slate-900">{companies.length}</p>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">{activeFirmsCount} Active / {companies.filter(c => c.subscription_status === 'trial').length} Trials</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Total Staff</p>
                <p className="text-2xl font-black text-slate-900">{totalUsersCount}</p>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">Across all practices</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Active Cases</p>
                <p className="text-2xl font-black text-slate-900">{totalCasesCount}</p>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">In active litigation</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Broadcaster & Search Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left/Middle: Firms Table Database */}
            <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="font-bold text-sm text-slate-900">Registered Advocates & Chambers</h3>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input 
                    type="text" 
                    placeholder="Search subdomain or email..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 text-xs rounded-lg py-4 border-slate-200"
                  />
                </div>
              </div>

              {filteredCompanies.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-semibold bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  No firms found matching query.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-150">
                  <table className="w-full text-xs text-left border-collapse bg-white font-sans">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-slate-600 font-semibold uppercase tracking-wider">
                        <th className="px-4 py-3">Firm / Domain</th>
                        <th className="px-4 py-3">Plan</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Created</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCompanies.map((c, idx) => {
                        const activeUsers = profiles.filter(p => p.company_id === c.id).length;
                        const activeCases = cases.filter(cs => cs.company_id === c.id).length;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3.5">
                              <div>
                                <p className="font-bold text-slate-900 text-xs">{c.name}</p>
                                <p className="font-mono text-[10px] text-primary">{c.subdomain}.optalflow.oatstack.com</p>
                                <p className="text-[10px] text-slate-400">{c.email} · {activeUsers} users · {activeCases} cases</p>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div>
                                <Badge className="text-[9px] font-bold uppercase py-0.5 px-2 bg-slate-100 text-slate-700 capitalize border-none">{c.subscription_plan}</Badge>
                                <p className="text-[9px] font-semibold text-slate-400 mt-1 capitalize">({c.subscription_status})</p>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex py-0.5 px-2 rounded-full text-[9px] font-bold uppercase ${
                                c.status === 'active' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                  : 'bg-red-50 text-red-700 border border-red-100'
                              }`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-slate-500 font-medium">
                              {new Date(c.created_date || c.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex justify-center gap-1.5">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleOpenEditDialog(c)}
                                  className="h-7 text-[10px] gap-1 px-2.5 rounded-lg border-slate-200"
                                >
                                  <Edit2 className="w-3 h-3 text-slate-500" /> Quota
                                </Button>
                                <Button 
                                  variant={c.status === 'active' ? 'destructive' : 'default'}
                                  size="sm" 
                                  onClick={() => handleToggleStatus(c)}
                                  className="h-7 text-[10px] px-2.5 rounded-lg"
                                >
                                  {c.status === 'active' ? (
                                    <>
                                      <AlertOctagon className="w-3 h-3 mr-1" /> Suspend
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-3 h-3 mr-1" /> Activate
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

            {/* Right Side: Announcements and broadcast Panel */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-primary" />
                Push Broadcast Notification
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Broadcast an administrative notice, software release notes, or alerts to all active law firm dashboards across Africa.
              </p>
              
              <div className="space-y-3">
                <textarea
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="Enter notification message text..."
                  rows={4}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50/50 focus:bg-white"
                />
                <Button 
                  onClick={handleBroadcast}
                  disabled={broadcasting || !announcementText}
                  className="w-full bg-slate-950 hover:bg-slate-900 text-white font-semibold py-4 text-xs rounded-xl flex items-center justify-center gap-1.5"
                >
                  {broadcasting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Broadcasting...
                    </>
                  ) : (
                    <>
                      <Bell className="w-3.5 h-3.5" />
                      Send System Broadcast
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </>
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

          <div className="space-y-4 py-4 text-xs text-slate-700">
            <div className="space-y-1.5">
              <label className="font-bold uppercase tracking-wide text-slate-600 block">Subscription Tier</label>
              <select 
                value={subPlan} 
                onChange={(e) => setSubPlan(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-primary focus:outline-none bg-slate-50"
              >
                <option value="starter">Starter Plan ($29/mo)</option>
                <option value="professional">Professional Plan ($79/mo)</option>
                <option value="enterprise">Enterprise Plan ($199/mo)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold uppercase tracking-wide text-slate-600 block">Subscription Status</label>
              <select 
                value={subStatus} 
                onChange={(e) => setSubStatus(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-primary focus:outline-none bg-slate-50"
              >
                <option value="trial">Trialing</option>
                <option value="active">Active (Paid)</option>
                <option value="expired">Expired (Trial End)</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wide text-slate-600 block">Max Active Users</label>
                <Input 
                  type="number"
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(parseInt(e.target.value) || 0)}
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wide text-slate-600 block">Max Active Cases</label>
                <Input 
                  type="number"
                  value={maxCases}
                  onChange={(e) => setMaxCases(parseInt(e.target.value) || 0)}
                  className="rounded-xl border-slate-200"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="flex-1 rounded-xl text-slate-700 border-slate-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveQuotas}
              disabled={updatingQuota}
              className="flex-1 bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl"
            >
              {updatingQuota ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
