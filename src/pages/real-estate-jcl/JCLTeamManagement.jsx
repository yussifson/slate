import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Plus, Edit, Trash2, Mail, Phone, Badge as BadgeIcon, Calendar,
  Shield, DollarSign, Award, RefreshCw, Search, CheckCircle2, UserCheck, Star
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { useViewPreference } from '@/hooks/useViewPreference';
import ViewToggle from '@/components/shared/ViewToggle';
import { formatCurrency } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function JCLTeamManagement() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [team, setTeam] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useViewPreference('re_team_jcl', 'grid');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'agent',
    commissionRate: 0,
    licenseNumber: '',
    licenseExpiry: '',
  });

  const fetchData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_team_members WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setTeam(res.rows._array || Array.from(res.rows || []));
    } catch (e) {
      console.error('[JCLTeamManagement] Fetch failed:', e);
      toast.error('Failed to load brokerage team members');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const filteredTeam = useMemo(() => {
    if (!search) return team;
    const q = search.toLowerCase();
    return team.filter(m =>
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.role?.toLowerCase().includes(q)
    );
  }, [team, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }

    try {
      if (editingId) {
        await powerSync.execute(
          `UPDATE univ_re_team_members 
           SET name = ?, email = ?, phone = ?, role = ?, commission_rate = ?, license_number = ?, license_expiry = ?
           WHERE id = ? AND company_id = ?`,
          [formData.name, formData.email, formData.phone, formData.role, formData.commissionRate, formData.licenseNumber, formData.licenseExpiry, editingId, companyId]
        );
        toast.success('Team member profile updated');
      } else {
        const newId = crypto.randomUUID();
        await powerSync.execute(
          `INSERT INTO univ_re_team_members 
           (id, company_id, name, email, phone, role, commission_rate, license_number, license_expiry, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [newId, companyId, formData.name, formData.email, formData.phone, formData.role, formData.commissionRate, formData.licenseNumber, formData.licenseExpiry, new Date().toISOString()]
        );
        toast.success('Brokerage agent added');
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', email: '', phone: '', role: 'agent', commissionRate: 0, licenseNumber: '', licenseExpiry: '' });
      fetchData();
    } catch (_err) {
      toast.error('Failed to save team member');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this agent from the team directory?')) {
      try {
        await powerSync.execute('DELETE FROM univ_re_team_members WHERE id = ? AND company_id = ?', [id, companyId]);
        toast.success('Agent removed from team directory');
        fetchData();
      } catch (_err) {
        toast.error('Failed to delete team member');
      }
    }
  };

  const handleEdit = (member) => {
    setFormData({
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      role: member.role || 'agent',
      commissionRate: member.commission_rate || 0,
      licenseNumber: member.license_number || '',
      licenseExpiry: member.license_expiry || '',
    });
    setEditingId(member.id);
    setShowForm(true);
  };

  const stats = useMemo(() => {
    const total = team.length;
    const agents = team.filter(m => m.role === 'agent').length;
    const admins = team.filter(m => m.role === 'admin').length;
    const avgCommission = total > 0 ? (team.reduce((sum, m) => sum + (m.commission_rate || 0), 0) / total).toFixed(1) : 0;
    return { total, agents, admins, avgCommission };
  }, [team]);

  return (
    <div className="p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#006065] to-[#004e52] flex items-center justify-center text-white shadow-md shadow-[#006065]/20">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Brokerage Team & Agent Roster
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              License certifications, commission split splits, and agent contact directory
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ViewToggle view={view} setView={setView} />
          <Button
            onClick={() => {
              setEditingId(null);
              setFormData({ name: '', email: '', phone: '', role: 'agent', commissionRate: 0, licenseNumber: '', licenseExpiry: '' });
              setShowForm(true);
            }}
            className="bg-[#006065] hover:bg-[#004e52] text-white font-bold text-xs h-9 px-3 rounded-xl gap-1.5 shadow-md shadow-emerald-950/20"
          >
            <Plus className="h-4 w-4" /> Add Agent / Member
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between group hover:border-emerald-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Team Roster</p>
            <p className="text-3xl font-extrabold text-foreground">{stats.total}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Active staff</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-[#006065]/10 text-[#006065] dark:text-[#fad503] flex items-center justify-center">
            <Users className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between group hover:border-emerald-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Brokers</p>
            <p className="text-3xl font-extrabold text-[#006065] dark:text-[#fad503]">{stats.agents}</p>
            <p className="text-[11px] text-emerald-600/80 font-medium">Licensed agents</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <UserCheck className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between group hover:border-emerald-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin Staff</p>
            <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{stats.admins}</p>
            <p className="text-[11px] text-blue-600/80 font-medium">System admins</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Shield className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between group hover:border-emerald-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Split Rate</p>
            <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{stats.avgCommission}%</p>
            <p className="text-[11px] text-amber-600/80 font-medium">Commission split</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Award className="h-5.5 w-5.5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 bg-card p-3 rounded-2xl border border-border/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agent by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-muted/30 border-border/60 focus:bg-background"
          />
        </div>
      </div>

      {/* Roster Cards */}
      {isLoading ? (
        <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-xs text-muted-foreground">Loading brokerage roster...</p>
        </div>
      ) : filteredTeam.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card">
          <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-bold text-foreground">No Team Members Found</p>
          <p className="text-xs text-muted-foreground mt-1">Add your agents and staff to manage commissions and property assignments.</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTeam.map(m => (
            <div key={m.id} className="p-5 rounded-2xl border border-border/80 bg-card hover:border-emerald-500/50 transition-all shadow-xs space-y-4 relative group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                    {(m.name || 'A')[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm line-clamp-1">{m.name}</h3>
                    <Badge variant="outline" className="text-[9px] uppercase font-bold bg-[#006065]/10 text-emerald-700 dark:text-emerald-400 border-[#006065]/30">
                      {m.role || 'Agent'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(m)} title="Edit">
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500/70 hover:text-rose-600" onClick={() => handleDelete(m.id)} title="Remove">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground pt-1">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span className="truncate">{m.email}</span>
                </div>
                {m.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>{m.phone}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-muted/40 font-mono text-center">
                <div>
                  <span className="text-[9px] uppercase font-semibold text-muted-foreground block mb-0.5">Split Rate</span>
                  <span className="text-sm font-bold text-[#006065] dark:text-[#fad503]">{m.commission_rate || 0}%</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-semibold text-muted-foreground block mb-0.5">License #</span>
                  <span className="text-xs font-semibold text-foreground">{m.license_number || 'Unassigned'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="text-left py-3 px-4">Member Name</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Phone</th>
                  <th className="text-right py-3 px-4">Split Rate</th>
                  <th className="text-center py-3 px-4">License #</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredTeam.map(m => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-foreground">{m.name}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[9px] uppercase font-bold bg-[#006065]/10 text-emerald-700 border-[#006065]/30">
                        {m.role || 'Agent'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{m.email}</td>
                    <td className="py-3 px-4 text-muted-foreground">{m.phone || '—'}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 font-mono">{m.commission_rate || 0}%</td>
                    <td className="py-3 px-4 text-center font-mono">{m.license_number || '—'}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(m)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500/70 hover:text-rose-600" onClick={() => handleDelete(m.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Member Form Modal */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full max-w-md">
          <SheetHeader>
            <SheetTitle className="text-lg font-bold">{editingId ? 'Edit Team Member' : 'Add Team Member'}</SheetTitle>
            <SheetDescription className="text-xs">Fill in agent credentials and commission split specifications.</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="text-xs font-semibold">Full Name *</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="h-9 text-xs mt-1" />
            </div>

            <div>
              <label className="text-xs font-semibold">Email Address *</label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="h-9 text-xs mt-1" />
            </div>

            <div>
              <label className="text-xs font-semibold">Phone Number</label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-9 text-xs mt-1" />
            </div>

            <div>
              <label className="text-xs font-semibold">Role Classification</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full h-9 text-xs border border-border rounded-lg px-3 bg-background mt-1"
              >
                <option value="admin">Admin</option>
                <option value="agent">Broker / Agent</option>
                <option value="support">Support Staff</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold">Commission Split Rate (%)</label>
              <Input type="number" step="0.1" value={formData.commissionRate} onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })} className="h-9 text-xs mt-1" />
            </div>

            <div>
              <label className="text-xs font-semibold">Real Estate License #</label>
              <Input value={formData.licenseNumber} onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })} className="h-9 text-xs mt-1" />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1 bg-[#006065] hover:bg-[#004e52] text-white font-bold text-xs h-9">
                {editingId ? 'Update Profile' : 'Add Team Member'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="h-9 text-xs">
                Cancel
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
