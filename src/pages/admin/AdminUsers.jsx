import { useTranslation } from "react-i18next";
import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Trash2, Search, Loader2, KeyRound, RefreshCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/shared/PageHeader';

export default function AdminUsers() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data: profData, error: profErr } = await supabase
        .from('profiles')
        .select('id, email, role, created_date, company_id')
        .order('created_date', { ascending: false })
        .limit(100);

      if (profErr) throw profErr;

      const { data: compData, error: compErr } = await supabase
        .from('companies')
        .select('id, name');

      if (compErr) throw compErr;

      // Join data manually since Supabase FK might not be exposed
      const joinedData = (profData || []).map(profile => ({
        ...profile,
        companies: {
          name: compData?.find(c => c.id === profile.company_id)?.name || null
        }
      }));

      setProfiles(joinedData);
    } catch (err) {
      toast({ title: "Failed to load users", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleResetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast({ title: "Password Reset Sent", description: `A recovery email has been sent to ${email}.` });
    } catch (err) {
      toast({ title: "Reset failed", description: err.message, variant: "destructive" });
    }
  };

  const handleForceOnboarding = async (userId) => {
    try {
      const { error } = await supabase.from('profiles').update({ onboarding_completed: false }).eq('id', userId);
      if (error) throw error;
      toast({ title: "Success", description: "User will be redirected to onboarding on next login." });
      fetchProfiles();
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
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse bg-white dark:bg-slate-900/40 font-sans">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-4">{t("identity", "Identity")}</th>
                  <th className="px-6 py-4">{t("organization", "Organization")}</th>
                  <th className="px-6 py-4">{t("role", "Role")}</th>
                  <th className="px-6 py-4">{t("joined", "Joined")}</th>
                  <th className="px-6 py-4 text-right">{t("administrative_actions", "Administrative Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredProfiles.map(user => {
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/50 dark:bg-transparent transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                              {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-slate-100">{user.full_name || 'Anonymous'}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {user.companies?.name || <span className="text-slate-400 italic">{t("orphaned", "Orphaned")}</span>}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className="text-[10px] font-bold uppercase py-0.5 px-2 bg-slate-50 dark:bg-slate-800/50 text-primary/90 border-none">
                            {user.role?.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {user.created_date ? new Date(user.created_date).toLocaleDateString() : 'Unknown'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleForceOnboarding(user.id)}
                              className="h-8 px-3 rounded-lg border-slate-200 text-slate-600 hover:text-slate-900 dark:text-slate-100"
                            >
                              <RefreshCcw className="w-3.5 h-3.5 mr-1.5" /> {t("force_onboarding", "Force Onboard")}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleResetPassword(user.email)}
                              className="h-8 px-3 rounded-lg border-slate-200 text-slate-600 hover:text-slate-900 dark:text-slate-100"
                            >
                              <KeyRound className="w-3.5 h-3.5 mr-1.5" /> {t("reset", "Reset")}
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              className="h-8 px-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-none"
                            >
                              <ShieldAlert className="w-3.5 h-3.5 mr-1.5" /> {t("suspend", "Suspend")}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
