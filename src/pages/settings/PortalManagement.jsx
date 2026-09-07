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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Client Portal Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Invite clients, patients, and other stakeholders to access their dedicated portal.
          </p>
        </div>
        <InviteDialog industry={industry} companyId={companyId} onSuccess={refetchInvites} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Active Portal Users', value: activeUsers.length, color: 'bg-green-100 text-green-700' },
          { icon: Clock, label: 'Pending Invitations', value: pendingInvites.length, color: 'bg-yellow-100 text-yellow-700' },
          { icon: Mail, label: 'Total Invited', value: invitations.length, color: 'bg-blue-100 text-blue-700' },
          { icon: Shield, label: 'Access Type', value: 'Role-Based', color: 'bg-primary/10 text-primary' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-card rounded-xl border border-border/50 p-5 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* How it works banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
          <Link2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">How the portal works</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Invited users receive an email and log in through your same <strong>{window.location.hostname}</strong> domain.
            When they sign in, they are automatically redirected to their personal portal view — they can only see data
            that belongs to them. No separate system, no separate login URL.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="invitations">
        <TabsList>
          <TabsTrigger value="invitations">Invitations ({invitations.length})</TabsTrigger>
          <TabsTrigger value="active">Active Users ({activeUsers.length})</TabsTrigger>
        </TabsList>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="mt-4">
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
              <h2 className="font-semibold text-sm">All Invitations</h2>
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
        <TabsContent value="active" className="mt-4">
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50">
              <h2 className="font-semibold text-sm">Active Portal Users</h2>
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
