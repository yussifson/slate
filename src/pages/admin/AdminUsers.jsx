import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Trash2, Search, Loader2, KeyRound } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/shared/PageHeader';

export default function AdminUsers() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, 
          email, 
          full_name, 
          role, 
          created_at,
          companies:company_id(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setProfiles(data || []);
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

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.companies?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader 
        title="Global User Management" 
        subtitle="Monitor and control all authenticated identities across the Optalflow ecosystem." 
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
            <table className="w-full text-sm text-left border-collapse bg-white font-sans">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-4">Identity</th>
                  <th className="px-6 py-4">Organization</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProfiles.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                          {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{user.full_name || 'Anonymous'}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      {user.companies?.name || <span className="text-slate-400 italic">Orphaned</span>}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className="text-[10px] font-bold uppercase py-0.5 px-2 bg-indigo-50 text-indigo-700 border-none">
                        {user.role?.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleResetPassword(user.email)}
                          className="h-8 px-3 rounded-lg border-slate-200 text-slate-600 hover:text-slate-900"
                        >
                          <KeyRound className="w-3.5 h-3.5 mr-1.5" /> Reset
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          className="h-8 px-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-none"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 mr-1.5" /> Suspend
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
