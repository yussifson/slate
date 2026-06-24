import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Plus, Edit, Trash2, Mail, Phone, Badge, Calendar } from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RealEstateAPI from '@/api/RealEstateAPI';
import { toast } from 'react-hot-toast';

const roleColors = {
  'admin': 'bg-orange-100 text-orange-800',
  'agent': 'bg-green-100 text-green-800',
  'support': 'bg-blue-100 text-blue-800',
  'viewer': 'bg-gray-100 text-gray-800',
};

export default function TeamManagement() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [team, setTeam] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'agent',
    commissionRate: 0,
    licenseNumber: '',
    licenseExpiry: '',
  });

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const data = await RealEstateAPI.getTeamMembers(companyId);
        setTeam(data);
      } catch (e) {
        console.error('[TeamManagement] Fetch failed:', e);
        toast.error('Failed to load team members');
      }
      setIsLoading(false);
    };

    if (companyId) fetchTeam();
  }, [companyId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.name || !formData.email) {
        toast.error('Name and email are required');
        return;
      }

      if (editingId) {
        await RealEstateAPI.updateTeamMember(companyId, editingId, formData, user.id);
        toast.success('Team member updated');
      } else {
        await RealEstateAPI.createTeamMember(companyId, formData, user.id);
        toast.success('Team member added');
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: '', email: '', phone: '', role: 'agent',
        commissionRate: 0, licenseNumber: '', licenseExpiry: '',
      });

      const data = await RealEstateAPI.getTeamMembers(companyId);
      setTeam(data);
    } catch (e) {
      console.error('[TeamManagement] Submit failed:', e);
      toast.error('Failed to save team member');
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

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const stats = {
    totalMembers: team.length,
    agents: team.filter(m => m.role === 'agent').length,
    admins: team.filter(m => m.role === 'admin').length,
    avgCommissionRate: (team.reduce((sum, m) => sum + (m.commission_rate || 0), 0) / Math.max(team.length, 1)).toFixed(2),
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your team members and roles</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', email: '', phone: '', role: 'agent', commissionRate: 0, licenseNumber: '', licenseExpiry: '' }); }} className="gap-2 bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4" /> Add Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 border-t-2 border-t-green-600">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-green-700 text-xs font-semibold uppercase mb-1">Total Members</p>
                <p className="text-3xl font-bold">{stats.totalMembers}</p>
              </div>
              <Users className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 border-t-2 border-t-orange-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-orange-600 text-xs font-semibold uppercase mb-1">Agents</p>
                <p className="text-3xl font-bold">{stats.agents}</p>
              </div>
              <Badge className="bg-orange-100 text-orange-800">{stats.agents}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 border-t-2 border-t-orange-600 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-orange-100 text-xs font-semibold uppercase mb-1">Admins</p>
                <p className="text-3xl font-bold">{stats.admins}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 border-t-2 border-t-green-600 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-green-100 text-xs font-semibold uppercase mb-1">Avg Commission</p>
                <p className="text-3xl font-bold">{stats.avgCommissionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map(member => (
          <Card key={member.id} className="hover:shadow transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{member.name}</CardTitle>
                  <Badge className={roleColors[member.role] || 'bg-gray-100 text-gray-800'}>{member.role}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{member.email}</span>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{member.phone}</span>
                  </div>
                )}
              </div>
              
              <div className="pt-2 border-t space-y-2 text-xs">
                {member.commission_rate > 0 && (
                  <p><span className="font-semibold">Commission:</span> {member.commission_rate}%</p>
                )}
                {member.license_number && (
                  <p><span className="font-semibold">License:</span> {member.license_number}</p>
                )}
                {member.join_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>Joined: {new Date(member.join_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(member)} className="flex-1">
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {team.length === 0 && (
        <Card className="text-center py-12">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">No team members yet. Add your first team member!</p>
        </Card>
      )}

      {/* Form Modal */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Team Member' : 'Add Team Member'}</SheetTitle>
            <SheetDescription>Fill in the member details</SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>

            <div>
              <label className="text-sm font-medium">Email *</label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>

            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>

            <div>
              <label className="text-sm font-medium">Role</label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Commission Rate (%)</label>
              <Input type="number" step="0.01" value={formData.commissionRate} onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })} />
            </div>

            <div>
              <label className="text-sm font-medium">License Number</label>
              <Input value={formData.licenseNumber} onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })} />
            </div>

            <div>
              <label className="text-sm font-medium">License Expiry</label>
              <Input type="date" value={formData.licenseExpiry} onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })} />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                {editingId ? 'Update' : 'Add'} Member
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
