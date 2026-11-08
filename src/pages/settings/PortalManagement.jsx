import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { powerSync } from '@/api/PowerSyncConnector';
import {
  Users, UserPlus, Mail, Copy, CheckCircle, Clock, XCircle,
  Link2, Settings, Shield, Globe, Trash2, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

// ─── Role options per industry ───────────────────────────────────────────────
const PORTAL_ROLES = {
  law: [{ value: 'client', label: 'Client' }],
  hospital: [{ value: 'patient', label: 'Patient' }],
  hotel: [{ value: 'guest', label: 'Guest' }],
  school: [{ value: 'parent', label: 'Parent / Guardian' }, { value: 'student', label: 'Student' }],
  highschool: [{ value: 'parent', label: 'Parent / Guardian' }, { value: 'student', label: 'Student' }],
  university: [{ value: 'student', label: 'Student' }],
  online: [{ value: 'learner', label: 'Learner' }],
  vocational: [{ value: 'trainee', label: 'Trainee' }],
  logistics: [{ value: 'client', label: 'Client' }],
  retail: [{ value: 'client', label: 'Customer' }],
  insurance: [{ value: 'policyholder', label: 'Policyholder' }],
  religion: [{ value: 'member', label: 'Member' }],
  real_estate: [{ value: 'tenant', label: 'Tenant' }, { value: 'landlord', label: 'Landlord / Owner' }],
  real_estate_jcl: [{ value: 'tenant', label: 'Tenant' }, { value: 'landlord', label: 'Landlord / Owner' }],
  pharmacy: [{ value: 'client', label: 'Customer' }],
  hr: [{ value: 'employee', label: 'Employee' }],
};

const statusStyles = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  expired: 'bg-gray-100 text-gray-500',
  revoked: 'bg-red-100 text-red-700',
};

const statusIcon = { active: CheckCircle, pending: Clock, expired: XCircle, revoked: XCircle };

// ─── Invite Dialog ────────────────────────────────────────────────────────────
function InviteDialog({ industry, companyId, onSuccess }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const roles = PORTAL_ROLES[industry] || [{ value: 'client', label: 'Client' }];

  const handleInvite = async () => {
    if (!email || !role || !password) {
      toast({ title: 'Missing fields', description: 'Please fill in the email, role, and default password.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      // Step 1: Create invitation record
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const invitePayload = {
        company_id: companyId,
        email: email.toLowerCase().trim(),
        full_name: name,
        role,
        token,
        status: 'pending',
        expires_at: expiresAt,
        invited_by: (await supabase.auth.getUser()).data.user?.id || '',
        default_password: password
      };
      
      const { error: inviteError } = await supabase
        .from('portal_invitations')
        .insert([invitePayload]);
        
      if (inviteError) {
        throw inviteError;
      }

        const { data: existingProfile } = await supabase.from('profiles').select('id').ilike('email', email.toLowerCase().trim()).maybeSingle();
        let isExistingUser = !!existingProfile?.id;

        if (isExistingUser) {
          await supabase.rpc('portal_accept_invitation', { p_token: token, p_user_id: existingProfile.id });
          toast({
            title: `Added existing user ${email}`,
            description: `They have been added to your client portal and can log in with their existing password.`,
          });
        } else {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
          if (supabaseUrl && anonKey) {
            const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
              method: 'POST',
              headers: {
                'apikey': anonKey,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                email: email.toLowerCase().trim(),
                password,
                data: { role, company_id: companyId, full_name: name, portal_token: token }
              })
            });
            if (!res.ok) {
              const errData = await res.json();
              console.warn('REST signup issue:', errData);
            }
          }
          toast({
            title: 'Client Created',
            description: `${email} has been created as a ${roles.find(r => r.value === role)?.label || role}.`,
          });
        }
        setOpen(false);
      setEmail(''); setName(''); setRole(''); setPassword('');
      onSuccess?.();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="w-4 h-4" /> Invite to Portal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite to Client Portal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="invite-name">Full Name</Label>
            <Input id="invite-name" placeholder="e.g. John Mensah" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email Address <span className="text-red-500">*</span></Label>
            <Input id="invite-email" type="email" placeholder="client@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Portal Role <span className="text-red-500">*</span></Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select access role..." />
              </SelectTrigger>
              <SelectContent>
                {roles.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This controls which portal view the user sees when they log in.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-password">Default Password <span className="text-red-500">*</span></Label>
            <Input id="invite-password" type="text" placeholder="e.g. Welcome123!" value={password} onChange={e => setPassword(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              The client will use this password to log in. You can copy it later to send to them.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleInvite} disabled={loading} className="gap-2">
            <UserPlus className="w-4 h-4" />
            {loading ? 'Creating...' : 'Create Client'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PortalManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const companyId = user?.company_id;
  const industry = user?.company_industry || 'custom';

  const { data: invitations = [], isLoading: loadingInvites, refetch: refetchInvites } = useQuery({
    queryKey: ['portal-invitations', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portal_invitations')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: portalUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['portal-users', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portal_users')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const revokeInvite = useMutation({
    mutationFn: async (inviteId) => {
      const { error } = await supabase
        .from('portal_invitations')
        .update({ status: 'revoked' })
        .eq('id', inviteId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchInvites();
      toast({ title: 'Invitation revoked' });
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const copyDetails = (inv) => {
    const url = `${window.location.origin}/portal?invite=${inv.token}`;
    const details = `Portal Link: ${url}\nEmail: ${inv.email}\nPassword: ${inv.default_password || 'Not set'}`;
    navigator.clipboard.writeText(details);
    toast({ title: 'Details copied!', description: 'The login details have been copied to your clipboard.' });
  };

  const activeUsers = portalUsers.filter(u => u.status === 'active');
  const pendingInvites = invitations.filter(i => i.status === 'pending');

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 pb-24 sm:pb-12 bg-background text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-[#005A9C] flex items-center justify-center text-white shadow-md shadow-[#005A9C]/20 shrink-0">
            <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">Client Portal</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <InviteDialog industry={industry} companyId={companyId} onSuccess={refetchInvites} />
        </div>
      </div>

      {/* 2x2 Mobile Native Stats Grid (< md) & Executive KPI (>= md) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        {[
          { icon: Users, label: 'Active Users', value: activeUsers.length, color: 'text-emerald-600 bg-emerald-500/10' },
          { icon: Clock, label: 'Pending Invites', value: pendingInvites.length, color: 'text-amber-600 bg-amber-500/10' },
          { icon: Mail, label: 'Total Invited', value: invitations.length, color: 'text-blue-600 bg-blue-500/10' },
          { icon: Shield, label: 'Access Type', value: 'Role-Based', color: 'text-[#005A9C] bg-[#005A9C]/10' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-card/90 backdrop-blur-xl rounded-[20px] border border-border/80 p-3.5 sm:p-4 shadow-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-3 h-3" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate">{label}</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-foreground truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="invitations" className="w-full space-y-4">
        <div className="w-full overflow-x-auto scrollbar-none pb-1">
          <TabsList className="bg-muted/60 p-1 border border-border inline-flex w-auto min-w-full sm:min-w-0 justify-start sm:justify-center">
            <TabsTrigger value="invitations" className="text-xs font-semibold shrink-0">Invitations ({invitations.length})</TabsTrigger>
            <TabsTrigger value="active" className="text-xs font-semibold shrink-0">Active Users ({activeUsers.length})</TabsTrigger>
          </TabsList>
        </div>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="m-0 space-y-3">
          {/* Mobile Native Card View (< md) */}
          <div className="md:hidden space-y-2.5">
            {loadingInvites ? (
              <div className="p-8 text-center text-muted-foreground text-xs">Loading invitations...</div>
            ) : invitations.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl">
                <UserPlus className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                No invitations yet. Tap "Invite to Portal" to get started.
              </div>
            ) : (
              invitations.map(inv => {
                const StatusIcon = statusIcon[inv.status] || Clock;
                return (
                  <div key={inv.id} className="bg-card rounded-2xl p-3.5 border border-border shadow-xs active:scale-[0.99] transition-all space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-9 h-9 bg-[#005A9C]/10 text-[#005A9C] dark:text-blue-400 rounded-full flex items-center justify-center shrink-0 font-bold text-xs">
                          {(inv.full_name || inv.email || '?')[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-foreground truncate">{inv.full_name || inv.email}</h4>
                          <p className="text-[11px] text-muted-foreground truncate">{inv.email}</p>
                        </div>
                      </div>
                      <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 flex items-center gap-1 ${statusStyles[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                        <StatusIcon className="w-3 h-3" />
                        {inv.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 py-0">
                        {inv.role}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {inv.created_at ? format(new Date(inv.created_at), 'dd MMM yyyy') : ''}
                      </span>
                    </div>

                    {inv.status === 'pending' && (
                      <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/40">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2.5 text-xs font-bold text-[#005A9C] dark:text-blue-400 hover:bg-[#005A9C]/10 rounded-lg gap-1"
                          onClick={() => copyDetails(inv)}
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy Details
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2.5 text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg gap-1"
                          onClick={() => revokeInvite.mutate(inv.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Revoke
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="hidden md:block rounded-[22px] border border-border/80 bg-card shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
              <h2 className="font-bold text-sm">All Invitations</h2>
              <Button variant="ghost" size="sm" onClick={() => refetchInvites()} className="gap-1 text-xs">
                <RefreshCw className="w-3 h-3" /> Refresh
              </Button>
            </div>
            {loadingInvites ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
            ) : invitations.length === 0 ? (
              <div className="p-12 text-center">
                <UserPlus className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-medium text-muted-foreground">No invitations yet</p>
                <p className="text-sm text-muted-foreground mt-1">Click "Invite to Portal" to get started.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {invitations.map(inv => {
                  const StatusIcon = statusIcon[inv.status] || Clock;
                  return (
                    <div key={inv.id} className="px-5 py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center shrink-0 font-semibold text-sm text-muted-foreground">
                          {(inv.full_name || inv.email || '?')[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{inv.full_name || inv.email}</p>
                          <p className="text-xs text-muted-foreground truncate">{inv.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs px-1.5 py-0">{inv.role}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {inv.created_at ? format(new Date(inv.created_at), 'dd MMM yyyy') : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={`text-xs flex items-center gap-1 ${statusStyles[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                          <StatusIcon className="w-3 h-3" />
                          {inv.status}
                        </Badge>
                        {inv.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs gap-1 h-7"
                              onClick={() => copyDetails(inv)}
                            >
                              <Copy className="w-3 h-3" /> Copy Details
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-red-500 hover:text-red-600 h-7"
                              onClick={() => revokeInvite.mutate(inv.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Active Users Tab */}
        <TabsContent value="active" className="m-0 space-y-3">
          {/* Mobile Native Card View (< md) */}
          <div className="md:hidden space-y-2.5">
            {loadingUsers ? (
              <div className="p-8 text-center text-muted-foreground text-xs">Loading active users...</div>
            ) : activeUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl">
                <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                No active portal users yet. Users appear once they accept their invite.
              </div>
            ) : (
              activeUsers.map(u => (
                <div key={u.id} className="bg-card rounded-2xl p-3.5 border border-border shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                        {(u.full_name || u.email || '?')[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-foreground truncate">{u.full_name || u.email}</h4>
                        <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                    <Badge className="text-[10px] font-bold bg-green-100 text-green-700 shrink-0">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 py-0">{u.role}</Badge>
                    {u.last_login_at && (
                      <span className="text-[10px] text-muted-foreground">
                        Last login: {format(new Date(u.last_login_at), 'dd MMM yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="hidden md:block rounded-[22px] border border-border/80 bg-card shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-border/60">
              <h2 className="font-bold text-sm">Active Portal Users</h2>
            </div>
            {loadingUsers ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
            ) : activeUsers.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-medium text-muted-foreground">No active portal users yet</p>
                <p className="text-sm text-muted-foreground mt-1">Users appear here once they accept their invitation.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {activeUsers.map(u => (
                  <div key={u.id} className="px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center font-semibold text-sm text-muted-foreground">
                        {(u.full_name || u.email || '?')[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{u.full_name || u.email}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs px-1.5 py-0">{u.role}</Badge>
                          {u.last_login_at && (
                            <span className="text-xs text-muted-foreground">
                              Last login: {format(new Date(u.last_login_at), 'dd MMM yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge className="text-xs bg-green-100 text-green-700">Active</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
