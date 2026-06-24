import React, { useState, useEffect, useMemo } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, AreaChart } from 'recharts';
import { Users, Plus, Search, Filter, Phone, Mail, Zap, TrendingUp, Target, DollarSign, Calendar, MapPin, Heart, AlertCircle, CheckCircle2, Clock, ArrowRight, MoreVertical, Download, RefreshCw } from 'lucide-react';
import { RealEstateAPI } from '@/api/RealEstateAPI';
import { toast } from 'react-hot-toast';

// Lead status pipeline stages
const PIPELINE_STAGES = [
  { id: 'new', label: 'New', color: 'bg-slate-500', icon: '🆕' },
  { id: 'contacted', label: 'Contacted', color: 'bg-blue-500', icon: '📞' },
  { id: 'qualified', label: 'Qualified', color: 'bg-purple-500', icon: '✓' },
  { id: 'negotiating', label: 'Negotiating', color: 'bg-amber-500', icon: '⚔️' },
  { id: 'closed', label: 'Closed', color: 'bg-green-500', icon: '🎉' },
  { id: 'lost', label: 'Lost', color: 'bg-red-500', icon: '❌' },
];

const SCORE_RANGES = [
  { range: [90, 100], label: 'Hot', color: '#ef4444', bgColor: 'bg-red-50' },
  { range: [75, 89], label: 'Warm', color: '#f59e0b', bgColor: 'bg-amber-50' },
  { range: [50, 74], label: 'Interested', color: '#3b82f6', bgColor: 'bg-blue-50' },
  { range: [0, 49], label: 'Cold', color: '#6b7280', bgColor: 'bg-gray-50' },
];

export default function CRMLeads() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  const [showNewLead, setShowNewLead] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', property: '',
    budgetMin: 0, budgetMax: 0, leadType: 'buyer', source: 'website', status: 'new',
  });

  useEffect(() => {
    fetchLeads();
  }, [companyId]);

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      // In production: const data = await RealEstateAPI.getLeads(companyId);
      // Mock comprehensive data for now
      const mockLeads = [
        { id: 1, firstName: 'John', lastName: 'Smith', email: 'john@example.com', phone: '+1 (555) 123-4567', property: '123 Main St', status: 'qualified', leadScore: 92, budgetMin: 400000, budgetMax: 600000, leadType: 'buyer', source: 'website', lastContact: '2024-06-22', activities: 8, daysInPipeline: 14 },
        { id: 2, firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', phone: '+1 (555) 234-5678', property: '456 Oak Ave', status: 'negotiating', leadScore: 87, budgetMin: 300000, budgetMax: 450000, leadType: 'buyer', source: 'referral', lastContact: '2024-06-20', activities: 12, daysInPipeline: 28 },
        { id: 3, firstName: 'Robert', lastName: 'Brown', email: 'robert@example.com', phone: '+1 (555) 345-6789', property: '789 Pine Rd', status: 'contacted', leadScore: 65, budgetMin: 250000, budgetMax: 350000, leadType: 'seller', source: 'cold_call', lastContact: '2024-06-18', activities: 3, daysInPipeline: 8 },
        { id: 4, firstName: 'Emily', lastName: 'Wilson', email: 'emily@example.com', phone: '+1 (555) 456-7890', property: '321 Elm St', status: 'closed', leadScore: 98, budgetMin: 500000, budgetMax: 700000, leadType: 'buyer', source: 'website', lastContact: '2024-06-15', activities: 15, daysInPipeline: 42 },
        { id: 5, firstName: 'Michael', lastName: 'Johnson', email: 'michael@example.com', phone: '+1 (555) 567-8901', property: '654 Maple Dr', status: 'new', leadScore: 45, budgetMin: 200000, budgetMax: 300000, leadType: 'investor', source: 'ad', lastContact: '2024-06-23', activities: 1, daysInPipeline: 1 },
      ];
      setLeads(mockLeads);
    } catch (error) {
      console.error('[v0] CRM Leads fetch error:', error);
      toast.error('Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = searchTerm === '' || 
        lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStage = selectedStage === 'all' || lead.status === selectedStage;
      return matchesSearch && matchesStage;
    });
  }, [leads, searchTerm, selectedStage]);

  const stats = useMemo(() => {
    return {
      totalLeads: leads.length,
      hotLeads: leads.filter(l => l.leadScore >= 90).length,
      avgScore: leads.length > 0 ? Math.round(leads.reduce((sum, l) => sum + l.leadScore, 0) / leads.length) : 0,
      pipelineValue: leads.reduce((sum, l) => sum + ((l.budgetMin + l.budgetMax) / 2), 0),
    };
  }, [leads]);

  const pipelineStages = useMemo(() => {
    return PIPELINE_STAGES.map(stage => ({
      ...stage,
      count: leads.filter(l => l.status === stage.id).length,
      leads: leads.filter(l => l.status === stage.id),
    }));
  }, [leads]);

  const conversionData = useMemo(() => {
    return [
      { stage: 'New', total: leads.filter(l => l.status === 'new').length },
      { stage: 'Contacted', total: leads.filter(l => l.status === 'contacted').length },
      { stage: 'Qualified', total: leads.filter(l => l.status === 'qualified').length },
      { stage: 'Negotiating', total: leads.filter(l => l.status === 'negotiating').length },
      { stage: 'Closed', total: leads.filter(l => l.status === 'closed').length },
    ];
  }, [leads]);

  const activityTrendData = [
    { date: 'Mon', calls: 24, meetings: 8, emails: 12 },
    { date: 'Tue', calls: 18, meetings: 12, emails: 15 },
    { date: 'Wed', calls: 28, meetings: 6, emails: 10 },
    { date: 'Thu', calls: 22, meetings: 10, emails: 14 },
    { date: 'Fri', calls: 30, meetings: 14, emails: 16 },
    { date: 'Sat', calls: 8, meetings: 4, emails: 6 },
    { date: 'Sun', calls: 0, meetings: 0, emails: 0 },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.firstName || !formData.lastName || !formData.email) {
        toast.error('Name and email required');
        return;
      }
      // In production: await RealEstateAPI.createLead(companyId, formData, user.id);
      const newLead = { id: leads.length + 1, ...formData, leadScore: 50, lastContact: new Date().toISOString().split('T')[0], activities: 0, daysInPipeline: 0 };
      setLeads([newLead, ...leads]);
      setShowNewLead(false);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', property: '', budgetMin: 0, budgetMax: 0, leadType: 'buyer', source: 'website', status: 'new' });
      toast.success('Lead created');
    } catch (error) {
      toast.error('Failed to create lead');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><RefreshCw className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><Users className="w-8 h-8 text-blue-600" /></div>
              CRM Lead Management
            </h1>
            <p className="text-slate-600 mt-2">Track, score, and convert high-value leads efficiently</p>
          </div>
          <Dialog open={showNewLead} onOpenChange={setShowNewLead}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white h-11">
                <Plus className="w-5 h-5" />
                New Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="First Name" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
                  <Input placeholder="Last Name" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
                </div>
                <Input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                <Input placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                <Input placeholder="Property Address" value={formData.property} onChange={(e) => setFormData({...formData, property: e.target.value})} />
                <div className="grid grid-cols-2 gap-3">
                  <Select value={formData.leadType} onValueChange={(v) => setFormData({...formData, leadType: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="buyer">Buyer</SelectItem><SelectItem value="seller">Seller</SelectItem><SelectItem value="investor">Investor</SelectItem></SelectContent>
                  </Select>
                  <Select value={formData.source} onValueChange={(v) => setFormData({...formData, source: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="website">Website</SelectItem><SelectItem value="referral">Referral</SelectItem><SelectItem value="cold_call">Cold Call</SelectItem><SelectItem value="ad">Ad</SelectItem></SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Create Lead</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm hover:shadow-md transition">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Leads</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalLeads}</p>
                </div>
                <Users className="w-12 h-12 text-blue-100 p-3 bg-blue-50 rounded-lg" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Hot Leads</p>
                  <p className="text-3xl font-bold text-red-900 mt-2">{stats.hotLeads}</p>
                </div>
                <Zap className="w-12 h-12 text-red-200 p-3 bg-red-100 rounded-lg" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Avg Score</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stats.avgScore}</p>
                </div>
                <Target className="w-12 h-12 text-amber-100 p-3 bg-amber-50 rounded-lg" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Pipeline Value</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">${(stats.pipelineValue / 1000000).toFixed(1)}M</p>
                </div>
                <DollarSign className="w-12 h-12 text-green-200 p-3 bg-green-100 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-3 gap-6">
              <Card className="col-span-2 border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Conversion Funnel</CardTitle>
                  <CardDescription>Leads through pipeline stages</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={conversionData}>
                      <CartesianGrid stroke="#e2e8f0" />
                      <XAxis dataKey="stage" />
                      <YAxis />
                      <Tooltip contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                      <Bar dataKey="total" fill="#3b82f6" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Lead Distribution</CardTitle>
                  <CardDescription>By temperature</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[{ label: 'Hot', count: stats.hotLeads, color: 'bg-red-500' }, { label: 'Warm', count: Math.floor(stats.totalLeads * 0.35), color: 'bg-amber-500' }, { label: 'Cold', count: Math.floor(stats.totalLeads * 0.30), color: 'bg-blue-500' }].map(item => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700">{item.label}</span>
                          <span className="text-sm font-bold text-slate-900">{item.count}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className={`${item.color} h-2 rounded-full`} style={{ width: `${(item.count / stats.totalLeads) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pipeline Tab */}
          <TabsContent value="pipeline" className="mt-6">
            <div className="grid grid-cols-6 gap-4">
              {pipelineStages.map(stage => (
                <Card key={stage.id} className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                      <CardTitle className="text-sm font-semibold">{stage.label}</CardTitle>
                    </div>
                    <CardDescription className="text-2xl font-bold mt-2">{stage.count}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-80 overflow-y-auto">
                    {stage.leads.map(lead => (
                      <div key={lead.id} className="p-2 bg-slate-50 rounded border border-slate-200 hover:border-blue-300 cursor-pointer transition" onClick={() => setSelectedLead(lead)}>
                        <p className="text-sm font-medium text-slate-900 truncate">{lead.firstName} {lead.lastName}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-slate-500">Score: {lead.leadScore}</span>
                          <Zap className={`w-3 h-3 ${lead.leadScore >= 90 ? 'text-red-500' : lead.leadScore >= 75 ? 'text-amber-500' : 'text-slate-300'}`} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle>Weekly Activity</CardTitle>
                  <CardDescription>Calls, meetings, and emails</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={activityTrendData}>
                      <defs>
                        <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e2e8f0" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }} />
                      <Area type="monotone" dataKey="calls" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCalls)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle>Lead Sources</CardTitle>
                  <CardDescription>Where your leads come from</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[{ source: 'Website', count: 12, color: 'bg-blue-500' }, { source: 'Referral', count: 8, color: 'bg-green-500' }, { source: 'Cold Call', count: 5, color: 'bg-amber-500' }].map(item => (
                      <div key={item.source}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700">{item.source}</span>
                          <span className="text-sm font-bold text-slate-900">{item.count}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className={`${item.color} h-2 rounded-full`} style={{ width: `${(item.count / 25) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* List View Tab */}
          <TabsContent value="list" className="mt-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle>All Leads</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-64" />
                    </div>
                    <Select value={selectedStage} onValueChange={setSelectedStage}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stages</SelectItem>
                        {PIPELINE_STAGES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Contact</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Property</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Score</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Stage</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Value</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map(lead => (
                        <tr key={lead.id} className="border-b hover:bg-slate-50 transition cursor-pointer" onClick={() => setSelectedLead(lead)}>
                          <td className="px-6 py-3"><div className="font-medium text-slate-900">{lead.firstName} {lead.lastName}</div></td>
                          <td className="px-6 py-3"><div className="text-sm text-slate-600">{lead.email}</div></td>
                          <td className="px-6 py-3"><div className="text-sm text-slate-600">{lead.property}</div></td>
                          <td className="px-6 py-3"><Badge variant="outline" className="bg-slate-100">{lead.leadScore}</Badge></td>
                          <td className="px-6 py-3"><Badge className={`${PIPELINE_STAGES.find(s => s.id === lead.status)?.color} text-white`}>{lead.status}</Badge></td>
                          <td className="px-6 py-3"><div className="font-medium text-slate-900">${((lead.budgetMin + lead.budgetMax) / 2000).toFixed(0)}K</div></td>
                          <td className="px-6 py-3 text-right"><div className="text-sm text-slate-600">{lead.daysInPipeline}</div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
