import React, { useState, useEffect, useMemo } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Wrench, Star, Calendar, DollarSign, Plus, RefreshCw, AlertCircle, CheckCircle2, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';

export default function ContractorManagement() {
  const companyId = useCompanyId();
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContractor, setSelectedContractor] = useState(null);

  useEffect(() => {
    loadContractors();
  }, [companyId]);

  const loadContractors = async () => {
    try {
      setLoading(true);
      const mockContractors = [
        {
          id: 1,
          name: 'Premier Plumbing Co',
          specialty: 'Plumbing',
          phone: '+1 (555) 111-2222',
          email: 'contact@premierplumbing.com',
          rating: 4.9,
          reviews: 48,
          status: 'active',
          projects: 52,
          avgCost: 1200,
          reliability: 95,
          lastUsed: '2024-06-18',
          jobsCompleted: [
            { date: '2024-06-18', property: '456 Main St', cost: 1500, status: 'completed' },
            { date: '2024-06-10', property: '789 Oak Ave', cost: 900, status: 'completed' },
          ],
        },
        {
          id: 2,
          name: 'Elite Electrical Services',
          specialty: 'Electrical',
          phone: '+1 (555) 222-3333',
          email: 'contact@eliteelectric.com',
          rating: 4.7,
          reviews: 35,
          status: 'active',
          projects: 38,
          avgCost: 1800,
          reliability: 92,
          lastUsed: '2024-06-20',
          jobsCompleted: [
            { date: '2024-06-20', property: '321 Pine Rd', cost: 2100, status: 'completed' },
          ],
        },
        {
          id: 3,
          name: 'ProRemodeling LLC',
          specialty: 'General Contractor',
          phone: '+1 (555) 333-4444',
          email: 'info@proremodelng.com',
          rating: 4.6,
          reviews: 42,
          status: 'active',
          projects: 65,
          avgCost: 3500,
          reliability: 88,
          lastUsed: '2024-05-15',
          jobsCompleted: [
            { date: '2024-05-15', property: '654 Maple Dr', cost: 5200, status: 'completed' },
          ],
        },
      ];
      setContractors(mockContractors);
      setSelectedContractor(mockContractors[0]);
    } catch (error) {
      toast.error('Failed to load contractors');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    return {
      activeContractors: contractors.filter(c => c.status === 'active').length,
      avgRating: (contractors.reduce((sum, c) => sum + c.rating, 0) / contractors.length).toFixed(1),
      totalProjects: contractors.reduce((sum, c) => sum + c.projects, 0),
      avgReliability: Math.round(contractors.reduce((sum, c) => sum + c.reliability, 0) / contractors.length),
    };
  }, [contractors]);

  const specialtyData = useMemo(() => {
    return [
      { name: 'Plumbing', count: contractors.filter(c => c.specialty === 'Plumbing').length },
      { name: 'Electrical', count: contractors.filter(c => c.specialty === 'Electrical').length },
      { name: 'General', count: contractors.filter(c => c.specialty === 'General Contractor').length },
    ];
  }, [contractors]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  if (loading) return <div className="flex items-center justify-center min-h-screen"><RefreshCw className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg"><Wrench className="w-8 h-8 text-orange-600" /></div>
              Contractor Management
            </h1>
            <p className="text-slate-600 mt-2">Track contractors, ratings, and maintenance schedules</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-orange-600 hover:bg-orange-700 h-11">
                <Plus className="w-5 h-5" /> Add Contractor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Contractor</DialogTitle></DialogHeader>
              <form className="space-y-4">
                <Input placeholder="Contractor Name" />
                <Select>
                  <SelectTrigger><SelectValue placeholder="Specialty" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="general">General Contractor</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Phone" />
                <Input placeholder="Email" type="email" />
                <Button className="w-full bg-orange-600">Add Contractor</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600">Active Contractors</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{stats.activeContractors}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-100 p-2 bg-green-50 rounded" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-amber-700">Avg Rating</p>
                  <p className="text-2xl font-bold text-amber-900 mt-2">{stats.avgRating} ⭐</p>
                </div>
                <Star className="w-10 h-10 text-amber-200 p-2 bg-amber-200 rounded" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600">Total Projects</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{stats.totalProjects}</p>
                </div>
                <Wrench className="w-10 h-10 text-blue-100 p-2 bg-blue-50 rounded" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600">Avg Reliability</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{stats.avgReliability}%</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-100 p-2 bg-green-50 rounded" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="contractors">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1">
            <TabsTrigger value="contractors">Contractors</TabsTrigger>
            <TabsTrigger value="ratings">Ratings & Reviews</TabsTrigger>
            <TabsTrigger value="schedule">Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="contractors" className="mt-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="px-6 py-3 text-left text-sm font-semibold">Contractor</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Specialty</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Projects</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Rating</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Reliability</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Last Used</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contractors.map(c => (
                        <tr key={c.id} className="border-b hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedContractor(c)}>
                          <td className="px-6 py-3 font-medium text-slate-900">{c.name}</td>
                          <td className="px-6 py-3"><Badge variant="outline">{c.specialty}</Badge></td>
                          <td className="px-6 py-3 text-slate-600">{c.projects}</td>
                          <td className="px-6 py-3 font-semibold text-amber-600">{c.rating} ⭐</td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-200 rounded-full h-2 w-12">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${c.reliability}%` }} />
                              </div>
                              <span className="text-sm font-bold text-slate-900">{c.reliability}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-slate-600">{new Date(c.lastUsed).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ratings" className="mt-6">
            <div className="grid grid-cols-3 gap-6">
              <Card className="col-span-2 border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle>Top Contractors</CardTitle>
                  <CardDescription>By rating and reviews</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {contractors.sort((a, b) => b.rating - a.rating).map(c => (
                    <div key={c.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-slate-900">{c.name}</p>
                          <p className="text-sm text-slate-600">{c.specialty}</p>
                        </div>
                        <Badge className="bg-amber-100 text-amber-900">{c.rating} ⭐</Badge>
                      </div>
                      <p className="text-sm text-slate-600">{c.reviews} reviews • {c.projects} projects</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle>By Specialty</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={specialtyData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, count }) => `${name}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="mt-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Maintenance Schedule</CardTitle>
                <CardDescription>Upcoming maintenance tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { property: '456 Main St', task: 'Plumbing inspection', contractor: 'Premier Plumbing Co', date: '2024-07-05', priority: 'High' },
                    { property: '789 Oak Ave', task: 'Electrical audit', contractor: 'Elite Electrical Services', date: '2024-07-10', priority: 'Medium' },
                    { property: '321 Pine Rd', task: 'General maintenance', contractor: 'ProRemodeling LLC', date: '2024-07-15', priority: 'Low' },
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-slate-900">{item.task}</p>
                          <p className="text-sm text-slate-600">{item.property}</p>
                        </div>
                        <Badge className={item.priority === 'High' ? 'bg-red-100 text-red-900' : item.priority === 'Medium' ? 'bg-amber-100 text-amber-900' : 'bg-green-100 text-green-900'}>{item.priority}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{item.contractor}</span>
                        <span className="font-medium text-slate-900">{new Date(item.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
