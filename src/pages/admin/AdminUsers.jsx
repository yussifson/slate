import { supabase } from '@/api/supabaseClient';
import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from 'react';
import { powerSync } from "@/api/PowerSyncConnector";
import { useQuery } from "@powersync/react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Trash2, Search, Loader2, KeyRound, RefreshCcw, Building2, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/shared/PageHeader';

export default function AdminUsers() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: rawProfiles = [], isLoading: loadingProfiles } = useQuery("SELECT id, full_name, email, role, created_date, company_id FROM profiles ORDER BY created_date DESC LIMIT 100");
  const { data: rawCompanies = [], isLoading: loadingCompanies } = useQuery("SELECT id, name FROM companies");

  const [searchQuery, setSearchQuery] = useState('');
  const loading = loadingProfiles || loadingCompanies;

  const profiles = useMemo(() => {
    return rawProfiles.map(p => ({
      ...p,
      companies: { name: rawCompanies.find(c => c.id === p.company_id)?.name || null }
    }));
  }, [rawProfiles, rawCompanies]);

  const handleResetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast({ title: "Password Reset Sent", description: `A recovery email has been sent to ${email}.` });
    } catch (err) {
      toast({ title: "Reset failed", description: err.message, variant: "destructive" });
    }
  };

  const handleForceOnboarding = async (userObj) => {
    try {
      const keys = Object.keys({ company_id: null, onboarding_completed: false });
      const values = Object.values({ company_id: null, onboarding_completed: false }).map(v => typeof v === 'object' ? JSON.stringify(v) : v);
      const setClause = keys.map(k => `${k} = ?`).join(', ');
      await powerSync.execute(`UPDATE ${'profiles'.replace(/['"`]/g, '')} SET ${setClause} WHERE id = ?`, [...values, userObj.id]);
      
      if (userObj.company_id) {
        await (async () => { const _payload = {email: null}; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE companies SET ${_keys.map(k => k+' = ?').join(', ')} WHERE id = ?`, [..._vals, userObj.company_id]);})();
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
                <div key={user.id} className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 rounded-2xl border border-primary/20 shadow-sm hover:shadow-md transition-all duration-300 p-5 flex flex-col justify-between group gap-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge className="text-[10px] font-bold uppercase py-0.5 px-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-none">
                      {user.role?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-lg shrink-0">
                      {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{user.full_name || 'Anonymous'}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mt-2">
                    <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                      <Building2 className="w-4 h-4 mr-2 opacity-50" />
                      <span className="font-medium">{user.companies?.name || <span className="text-slate-400 italic text-[10px]">{t("orphaned", "Orphaned")}</span>}</span>
                    </div>
                    <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                      <Calendar className="w-4 h-4 mr-2 opacity-50" />
                      <span>Joined {user.created_date ? new Date(user.created_date).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/50 mt-auto">
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
                      <KeyRound className="w-3.5 h-3.5 mr-1" /> Reset
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="flex-1 h-8 px-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-none text-[10px]"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Suspend
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
