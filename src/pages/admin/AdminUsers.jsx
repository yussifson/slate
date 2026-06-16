import { supabase } from '@/api/supabaseClient';
import { useTranslation } from "react-i18next";
import { useState, useMemo } from 'react';
import { powerSync } from "@/api/PowerSyncConnector";
import { useQuery as usePSQuery } from "@powersync/react";
import { useQuery } from "@tanstack/react-query";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Trash2, Search, Loader2, KeyRound, RefreshCcw, Building2, Calendar, Clock, ChevronDown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/shared/PageHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

export default function AdminUsers() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: rawProfiles = [], isLoading: loadingProfiles } = usePSQuery("SELECT id, full_name, email, role, created_date, company_id FROM profiles ORDER BY created_date DESC LIMIT 100");
  const { data: rawCompanies = [], isLoading: loadingCompanies } = usePSQuery("SELECT id, name FROM companies");

  // Live last-login data from Supabase auth (bypasses PowerSync intentionally)
  const { data: authUsers = [] } = useQuery({
    queryKey: ['admin_auth_users_meta'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_active_sessions');
      if (error) return [];
      return data || [];
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [roleDialog, setRoleDialog] = useState(null); // { user, newRole }
  const [updatingRole, setUpdatingRole] = useState(false);
  const [suspendingId, setSuspendingId] = useState(null);
  const loading = loadingProfiles || loadingCompanies;

  const profiles = useMemo(() => {
    return rawProfiles.map(p => {
      const liveUser = authUsers.find(u => u.email === p.email);
      return {
        ...p,
        last_sign_in_at: liveUser?.last_sign_in_at || null,
        companies: { name: rawCompanies.find(c => c.id === p.company_id)?.name || null }
      };
    });
  }, [rawProfiles, rawCompanies, authUsers]);

  const handleResetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast({ title: "Password Reset Sent", description: `A recovery email has been sent to ${email}.` });
    } catch (err) {
      toast({ title: "Reset failed", description: err.message, variant: "destructive" });
    }
  };

  const handleChangeRole = async () => {
    if (!roleDialog) return;
    setUpdatingRole(true);
    try {
      const { user, newRole } = roleDialog;
      const setClause = 'role = ?';
      await powerSync.execute(`UPDATE profiles SET ${setClause} WHERE id = ?`, [newRole, user.id]);

      // Log the role change in audit_logs
      await supabase.from('audit_logs').insert({
        action_type: 'ROLE_CHANGED',
        entity_type: 'USER',
        entity_id: user.id,
        actor_email: 'Super Admin',
        old_data: { role: user.role },
        new_data: { role: newRole }
      });

      toast({ title: "Role Updated", description: `${user.full_name || user.email}'s role changed to ${newRole}.` });
      setRoleDialog(null);
    } catch (err) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleSuspendUser = async (user) => {
    setSuspendingId(user.id);
    try {
      await powerSync.execute(`UPDATE profiles SET role = ? WHERE id = ?`, ['suspended', user.id]);
      await supabase.from('audit_logs').insert({
        action_type: 'USER_SUSPENDED',
        entity_type: 'USER',
        entity_id: user.id,
        actor_email: 'Super Admin',
        old_data: { role: user.role },
        new_data: { role: 'suspended' }
      });
      toast({ title: "User Suspended", description: `${user.full_name || user.email} has been suspended.` });
    } catch (err) {
      toast({ title: "Suspend failed", description: err.message, variant: "destructive" });
    } finally {
      setSuspendingId(null);
    }
  };

  const handleForceOnboarding = async (userObj) => {
    try {
      const keys = Object.keys({ company_id: null, onboarding_completed: false });
      const values = Object.values({ company_id: null, onboarding_completed: false }).map(v => typeof v === 'object' ? JSON.stringify(v) : v);
      const setClause = keys.map(k => `${k} = ?`).join(', ');
      await powerSync.execute(`UPDATE profiles SET ${setClause} WHERE id = ?`, [...values, userObj.id]);
      
      if (userObj.company_id) {
        const _payload = {email: null};
        const _keys = Object.keys(_payload);
        const _vals = Object.values(_payload).map(v => typeof v === 'object' ? JSON.stringify(v) : v);
        await powerSync.execute(`UPDATE companies SET ${_keys.map(k => k+' = ?').join(', ')} WHERE id = ?`, [..._vals, userObj.company_id]);
      }
      
      toast({ title: "Success", description: "User forced to onboard on next login" });
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const filteredProfiles = profiles.filter(p => {
    const search = (searchQuery || '').toLowerCase();
    const name = (p.full_name || '').toLowerCase();
    const email = (p.email || '').toLowerCase();
    const company = (p.companies?.name || '').toLowerCase();
    return name.includes(search) || email.includes(search) || company.includes(search);
  });

  const roleColors = {
    super_admin: 'bg-violet-50 text-violet-700',
    admin: 'bg-blue-50 text-blue-700',
    member: 'bg-slate-100 text-slate-700',
    suspended: 'bg-red-50 text-red-700',
  };

  const ROLES = ['member', 'admin', 'super_admin'];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader 
        title="Global User Management" 
        subtitle="Monitor and control all authenticated identities across the Slate ecosystem." 
        action={
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input 
              type="text" 
              placeholder="Search by name, email or firm..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-lg border-primary/40"
            />
          </div>
        }
      />
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProfiles.length === 0 ? (
            <div className="bg-card rounded-2xl border border-primary/20 text-center py-12 text-slate-400 text-sm font-semibold shadow-sm">
              No users found matching query.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProfiles.map(user => (
                <div key={user.id} className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 rounded-2xl border border-primary/20 shadow-sm hover:shadow-md transition-all duration-300 p-5 flex flex-col justify-between gap-4 relative overflow-hidden">
                  
                  {/* Role Badge top-right */}
                  <div className="absolute top-4 right-4">
                    <Badge className={`text-[10px] font-bold uppercase py-0.5 px-2 border-none ${roleColors[user.role] || roleColors.member}`}>
                      {user.role?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center font-black text-primary text-lg shrink-0">
                      {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base truncate pr-20">{user.full_name || 'Anonymous'}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                      <Building2 className="w-4 h-4 mr-2 opacity-50 shrink-0" />
                      <span className="font-medium truncate">{user.companies?.name || <span className="text-slate-400 italic text-[10px]">{t("orphaned", "Orphaned")}</span>}</span>
                    </div>
                    <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                      <Calendar className="w-4 h-4 mr-2 opacity-50 shrink-0" />
                      <span>Joined {user.created_date ? new Date(user.created_date).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                    <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                      <Clock className="w-4 h-4 mr-2 opacity-50 shrink-0" />
                      <span className={user.last_sign_in_at ? 'text-emerald-600 font-semibold' : 'italic text-slate-400'}>
                        {user.last_sign_in_at 
                          ? `Active ${new Date(user.last_sign_in_at).toLocaleString()}`
                          : 'Not seen recently'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleForceOnboarding(user)}
                      className="flex-1 h-8 px-2 rounded-lg border-primary/20 text-slate-600 hover:text-slate-900 bg-slate-50 text-[10px]"
                    >
                      <RefreshCcw className="w-3.5 h-3.5 mr-1" /> Onboard
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleResetPassword(user.email)}
                      className="flex-1 h-8 px-2 rounded-lg border-primary/20 text-slate-600 hover:text-slate-900 bg-slate-50 text-[10px]"
                    >
                      <KeyRound className="w-3.5 h-3.5 mr-1" /> Reset PW
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setRoleDialog({ user, newRole: user.role })}
                      className="flex-1 h-8 px-2 rounded-lg border-primary/20 text-violet-700 bg-violet-50 hover:bg-violet-100 text-[10px]"
                    >
                      <ChevronDown className="w-3.5 h-3.5 mr-1" /> Role
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleSuspendUser(user)}
                      disabled={suspendingId === user.id || user.role === 'suspended'}
                      className="flex-1 h-8 px-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-none text-[10px]"
                    >
                      {suspendingId === user.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5 mr-1" />}
                      {user.role === 'suspended' ? 'Suspended' : 'Suspend'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Role Change Dialog */}
      <Dialog open={!!roleDialog} onOpenChange={(o) => !o && setRoleDialog(null)}>
        <DialogContent className="max-w-sm rounded-2xl border border-primary/40 bg-white dark:bg-slate-900/40 p-6 font-sans">
          <DialogDescription className="sr-only">Change user role</DialogDescription>
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100 font-extrabold text-base">
              Change Role for {roleDialog?.user?.full_name || roleDialog?.user?.email}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            {ROLES.map(r => (
              <button
                key={r}
                onClick={() => setRoleDialog(d => ({ ...d, newRole: r }))}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors border-2 ${roleDialog?.newRole === r ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
              >
                {r.replace(/_/g, ' ').toUpperCase()}
              </button>
            ))}
          </div>
          <DialogFooter className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setRoleDialog(null)} className="flex-1 rounded-xl border-primary/40 h-11">Cancel</Button>
            <Button onClick={handleChangeRole} disabled={updatingRole} className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl h-11">
              {updatingRole ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
