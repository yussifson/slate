import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Plus, Edit, Trash2, Star, Phone, Mail, TrendingUp, MessageSquare } from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RealEstateAPI } from '@/api/RealEstateAPI';
import { toast } from 'react-hot-toast';
import { useViewPreference } from '@/hooks/useViewPreference';
import ViewToggle from '@/components/shared/ViewToggle';
import GenericKanban from '@/components/views/GenericKanban';

const statusColors = {
  'new': 'bg-orange-100 text-orange-800',
  'contacted': 'bg-primary/10 text-primary/40',
  'qualified': 'bg-green-100 text-green-800',
  'negotiating': 'bg-primary/10 text-primary/40',
  'closed': 'bg-green-100 text-green-800',
  'lost': 'bg-gray-100 text-gray-800',
};

const leadTypeColors = {
  'buyer': 'bg-green-100 text-green-800',
  'seller': 'bg-orange-100 text-orange-800',
  'investor': 'bg-primary/10 text-primary/40',
  'renter': 'bg-gray-100 text-gray-800',
};

export default function CRMLeads() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [view, setView] = useViewPreference('re_crm_leads', 'grid');
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', leadType: 'buyer',
    source: 'website', status: 'new', budgetMin: 0, budgetMax: 0, notes: '',
  });
  const [activityData, setActivityData] = useState({
    activityType: 'call', subject: '', description: '', durationMinutes: 0, outcome: '',
  });

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const data = await RealEstateAPI.getLeads(companyId);
        setLeads(data);
      } catch (e) {
        console.error('[CRMLeads] Fetch failed:', e);
        toast.error('Failed to load leads');
      }
      setIsLoading(false);
    };

    if (companyId) fetchLeads();
  }, [companyId]);

  useEffect(() => {
    let filtered = leads;
    if (search) {
      filtered = filtered.filter(l =>
        l.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        l.last_name?.toLowerCase().includes(search.toLowerCase()) ||
        l.email?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(l => l.status === statusFilter);
    }
    setFilteredLeads(filtered.sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0)));
  }, [leads, search, statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.firstName || !formData.lastName || !formData.email) {
        toast.error('First name, last name, and email are required');
        return;
      }

      if (editingId) {
        await RealEstateAPI.updateLead(companyId, editingId, formData, user.id);
        toast.success('Lead updated');
      } else {
        await RealEstateAPI.createLead(companyId, formData, user.id);
        toast.success('Lead added');
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({
        firstName: '', lastName: '', email: '', phone: '', leadType: 'buyer',
        source: 'website', status: 'new', budgetMin: 0, budgetMax: 0, notes: '',
      });

      const data = await RealEstateAPI.getLeads(companyId);
      setLeads(data);
    } catch (e) {
      console.error('[CRMLeads] Submit failed:', e);
      toast.error('Failed to save lead');
    }
  };

  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    try {
      if (!selectedLead) return;
      
      await RealEstateAPI.createLeadActivity(companyId, selectedLead.id, activityData, user.id);
      
      // Update lead status if needed
      if (activityData.outcome === 'qualified') {
        await RealEstateAPI.updateLead(companyId, selectedLead.id, { status: 'qualified' }, user.id);
      }

      toast.success('Activity logged');
      setShowActivityForm(false);
      setActivityData({ activityType: 'call', subject: '', description: '', durationMinutes: 0, outcome: '' });

      const data = await RealEstateAPI.getLeads(companyId);
      setLeads(data);
    } catch (e) {
      console.error('[CRMLeads] Activity submit failed:', e);
      toast.error('Failed to log activity');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this lead?')) {
      try {
        await RealEstateAPI.deleteCRMLead(companyId, id);
        const data = await RealEstateAPI.getLeads(companyId);
        setLeads(data);
        toast.success('Lead deleted');
      } catch (e) { toast.error(e.message); }
    }
  };

  const handleEdit = (lead) => {
    setFormData({
      firstName: lead.first_name || '',
      lastName: lead.last_name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      leadType: lead.lead_type || 'buyer',
      source: lead.source || 'website',
      status: lead.status || 'new',
      budgetMin: lead.budget_min || 0,
      budgetMax: lead.budget_max || 0,
      notes: lead.notes || '',
    });
    setEditingId(lead.id);
    setShowForm(true);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const stats = {
    totalLeads: leads.length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    avgScore: leads.length > 0 ? Math.round(leads.reduce((sum, l) => sum + (l.lead_score || 0), 0) / leads.length) : 0,
    contacted: leads.filter(l => l.status !== 'new').length,
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">CRM - Lead Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage your property leads</p>
        </div>
        <div className="flex items-center gap-4">
          <ViewToggle view={view} onViewChange={setView} allowedViews={['grid', 'list', 'kanban']} />
          <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ firstName: '', lastName: '', email: '', phone: '', leadType: 'buyer', source: 'website', status: 'new', budgetMin: 0, budgetMax: 0, notes: '' }); }} className="gap-2 bg-orange-600 hover:bg-orange-700">
            <Plus className="w-4 h-4" /> Add Lead
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-green-700 text-xs font-semibold uppercase mb-1">Total Leads</p>
                <p className="text-3xl font-bold">{stats.totalLeads}</p>
              </div>
              <Users className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-orange-600 text-xs font-semibold uppercase mb-1">Qualified</p>
                <p className="text-3xl font-bold">{stats.qualified}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-green-700 text-xs font-semibold uppercase mb-1">Avg Lead Score</p>
                <p className="text-3xl font-bold">{stats.avgScore}</p>
              </div>
              <Star className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-primary text-xs font-semibold uppercase mb-1">Contacted</p>
                <p className="text-3xl font-bold">{stats.contacted}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input placeholder="Search by name, email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="negotiating">Negotiating</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredLeads.map(lead => (
            <Card key={lead.id} className="relative group bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 border-t-[80px] border-r-[80px] border-t-transparent border-r-primary/10 pointer-events-none group-hover:border-r-primary/20 transition-colors duration-500 z-0" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/5 to-transparent rounded-tr-[4rem] pointer-events-none z-0 transition-opacity duration-500 opacity-50 group-hover:opacity-100" />
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <Button size="icon" variant="ghost" onClick={() => { setSelectedLead(lead); setShowActivityForm(true); }} className="h-7 w-7 text-primary hover:bg-primary/10 bg-white/50 dark:bg-black/50 backdrop-blur-sm shadow-sm" title="Activity">
                  <MessageSquare className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleEdit(lead)} className="h-7 w-7 text-primary hover:bg-primary/10 bg-white/50 dark:bg-black/50 backdrop-blur-sm shadow-sm" title="Edit">
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(lead.id)} className="h-7 w-7 text-red-600 hover:bg-red-100 hover:text-red-700 bg-white/50 dark:bg-black/50 backdrop-blur-sm shadow-sm" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
                <div className="flex items-start justify-between pr-20">
                  <div className="flex-1">
                    <CardTitle className="text-base">{lead.first_name} {lead.last_name}</CardTitle>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge className={statusColors[lead.status] || 'bg-gray-100 text-gray-800'}>{lead.status}</Badge>
                      <Badge className={leadTypeColors[lead.lead_type] || 'bg-gray-100 text-gray-800'}>{lead.lead_type}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
                <div className="space-y-2">
                  {lead.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{lead.email}</span>
                    </div>
                  )}
                  {lead.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{lead.phone}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t mt-auto">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Lead Score:</span>
                    <span className="font-bold text-orange-600">{lead.lead_score || 0}/100</span>
                  </div>
                  {lead.budget_min && lead.budget_max && (
                    <p className="text-xs text-muted-foreground">Budget: ${lead.budget_min.toLocaleString()} - ${lead.budget_max.toLocaleString()}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredLeads.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No leads found. Create your first lead!</p>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="flex flex-col gap-3">
          {filteredLeads.map(lead => (
            <div key={lead.id} className="group relative flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 hover:shadow-md hover:border-primary/30 transition-all duration-200">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{lead.first_name} {lead.last_name}</p>
                <p className="text-sm text-muted-foreground truncate">{lead.email}</p>
              </div>
              <Badge className={statusColors[lead.status]}>{lead.status}</Badge>
              <Badge className={leadTypeColors[lead.lead_type]}>{lead.lead_type}</Badge>
              <span className="text-sm font-bold text-orange-600 whitespace-nowrap">{lead.lead_score || 0}/100</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" onClick={() => { setSelectedLead(lead); setShowActivityForm(true); }} className="h-7 w-7 text-primary hover:bg-primary/10" title="Activity"><MessageSquare className="w-3.5 h-3.5" /></Button>
                <Button size="icon" variant="ghost" onClick={() => handleEdit(lead)} className="h-7 w-7 text-primary hover:bg-primary/10" title="Edit"><Edit className="w-3.5 h-3.5" /></Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(lead.id)} className="h-7 w-7 text-red-600 hover:bg-red-100" title="Delete"><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
          {filteredLeads.length === 0 && <p className="text-center py-10 text-muted-foreground">No leads found.</p>}
        </div>
      )}

      {/* Kanban View */}
      {view === 'kanban' && (
        <GenericKanban
          data={filteredLeads}
          statusKey="status"
          titleKey="first_name"
          boardKey="re_crm_leads_board"
          defaultStages={Object.keys(statusColors)}
          onStatusChange={async (id, newStatus) => {
            try {
              await RealEstateAPI.updateLead(companyId, id, { status: newStatus }, user.id);
              const data = await RealEstateAPI.getLeads(companyId);
              setLeads(data);
            } catch (e) { toast.error(e.message); }
          }}
          onEdit={(item) => handleEdit(item)}
          onDelete={(id) => handleDelete(id)}
          onView={(item) => { setSelectedLead(item); setShowActivityForm(true); }}
        />
      )}

      {/* Lead Form */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Lead' : 'Add New Lead'}</SheetTitle>
            <SheetDescription>Fill in the lead information</SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">First Name *</label>
                <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name *</label>
                <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Email *</label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>

            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Lead Type</label>
                <Select value={formData.leadType} onValueChange={(value) => setFormData({ ...formData, leadType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">Buyer</SelectItem>
                    <SelectItem value="seller">Seller</SelectItem>
                    <SelectItem value="investor">Investor</SelectItem>
                    <SelectItem value="renter">Renter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Source</label>
                <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="ad">Ad</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Min Budget</label>
                <Input type="number" value={formData.budgetMin} onChange={(e) => setFormData({ ...formData, budgetMin: parseFloat(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm font-medium">Max Budget</label>
                <Input type="number" value={formData.budgetMax} onChange={(e) => setFormData({ ...formData, budgetMax: parseFloat(e.target.value) })} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full p-2 border rounded text-sm" rows="2" />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                {editingId ? 'Update' : 'Add'} Lead
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Activity Form */}
      <Sheet open={showActivityForm} onOpenChange={setShowActivityForm}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Log Activity</SheetTitle>
            <SheetDescription>Record interaction with {selectedLead?.first_name} {selectedLead?.last_name}</SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleActivitySubmit} className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-medium">Activity Type</label>
              <Select value={activityData.activityType} onValueChange={(value) => setActivityData({ ...activityData, activityType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Phone Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="text">Text Message</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="property_view">Property Viewing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Subject</label>
              <Input value={activityData.subject} onChange={(e) => setActivityData({ ...activityData, subject: e.target.value })} />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea value={activityData.description} onChange={(e) => setActivityData({ ...activityData, description: e.target.value })} className="w-full p-2 border rounded text-sm" rows="3" />
            </div>

            <div>
              <label className="text-sm font-medium">Duration (minutes)</label>
              <Input type="number" value={activityData.durationMinutes} onChange={(e) => setActivityData({ ...activityData, durationMinutes: parseInt(e.target.value) })} />
            </div>

            <div>
              <label className="text-sm font-medium">Outcome</label>
              <Select value={activityData.outcome} onValueChange={(value) => setActivityData({ ...activityData, outcome: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                Log Activity
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowActivityForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
