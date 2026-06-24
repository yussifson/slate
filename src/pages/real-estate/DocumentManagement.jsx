import React, { useState, useEffect, useMemo } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileText, Upload, CheckCircle2, Clock, AlertCircle, Plus, RefreshCw, Download, Share2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';

export default function DocumentManagement() {
  const companyId = useCompanyId();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, [companyId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const mockDocuments = [
        {
          id: 1,
          name: 'Purchase Agreement - 456 Main St',
          type: 'Purchase Agreement',
          template: 'Standard Purchase Agreement',
          createdDate: '2024-06-20',
          dueDate: '2024-06-25',
          status: 'signed',
          signedBy: ['James Wilson', 'Margaret Johnson'],
          signatureProgress: 100,
          recipients: [
            { name: 'James Wilson', email: 'james@example.com', signed: true, signedDate: '2024-06-22' },
            { name: 'Margaret Johnson', email: 'margaret@example.com', signed: true, signedDate: '2024-06-23' },
          ],
        },
        {
          id: 2,
          name: 'Lease Agreement - 789 Oak Ave',
          type: 'Lease Agreement',
          template: 'Standard Residential Lease',
          createdDate: '2024-06-18',
          dueDate: '2024-06-28',
          status: 'pending',
          signedBy: ['Michelle Brown'],
          signatureProgress: 50,
          recipients: [
            { name: 'Michelle Brown', email: 'michelle@example.com', signed: true, signedDate: '2024-06-20' },
            { name: 'Robert Davis', email: 'robert@example.com', signed: false, signedDate: null },
          ],
        },
        {
          id: 3,
          name: 'Disclosure Statement - 321 Pine Rd',
          type: 'Disclosure',
          template: 'Property Disclosure Statement',
          createdDate: '2024-06-15',
          dueDate: '2024-06-22',
          status: 'pending_review',
          signedBy: [],
          signatureProgress: 0,
          recipients: [
            { name: 'David Martinez', email: 'david@example.com', signed: false, signedDate: null },
          ],
        },
      ];
      setDocuments(mockDocuments);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    return {
      totalDocuments: documents.length,
      signed: documents.filter(d => d.status === 'signed').length,
      pending: documents.filter(d => d.status === 'pending' || d.status === 'pending_review').length,
      signatureRate: documents.length > 0 ? Math.round((documents.filter(d => d.status === 'signed').length / documents.length) * 100) : 0,
    };
  }, [documents]);

  const templates = [
    { id: 1, name: 'Purchase Agreement', category: 'Sale', uses: 145 },
    { id: 2, name: 'Residential Lease', category: 'Lease', uses: 89 },
    { id: 3, name: 'Property Disclosure', category: 'Disclosure', uses: 156 },
    { id: 4, name: 'Listing Agreement', category: 'Listing', uses: 78 },
    { id: 5, name: 'Inspection Report', category: 'Inspection', uses: 92 },
  ];

  const workflowData = [
    { month: 'Jan', documents: 24, signed: 22 },
    { month: 'Feb', documents: 28, signed: 26 },
    { month: 'Mar', documents: 31, signed: 29 },
    { month: 'Apr', documents: 27, signed: 25 },
    { month: 'May', documents: 32, signed: 30 },
    { month: 'Jun', documents: 29, signed: 27 },
  ];

  if (loading) return <div className="flex items-center justify-center min-h-screen"><RefreshCw className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><FileText className="w-8 h-8 text-blue-600" /></div>
              Document Management
            </h1>
            <p className="text-slate-600 mt-2">Create, manage, and e-sign documents with automated workflows</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700 h-11">
                <Plus className="w-5 h-5" /> New Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create New Document</DialogTitle></DialogHeader>
              <form className="space-y-4">
                <Input placeholder="Document Name" />
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select Template" /></SelectTrigger>
                  <SelectContent>
                    {templates.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Recipient Email" type="email" />
                <Button className="w-full bg-blue-600">Create Document</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600">Total Documents</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{stats.totalDocuments}</p>
                </div>
                <FileText className="w-10 h-10 text-blue-100 p-2 bg-blue-50 rounded" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-700">Signed</p>
                  <p className="text-2xl font-bold text-green-900 mt-2">{stats.signed}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-200 p-2 bg-green-200 rounded" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600">Pending</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{stats.pending}</p>
                </div>
                <Clock className="w-10 h-10 text-amber-100 p-2 bg-amber-50 rounded" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600">Signature Rate</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{stats.signatureRate}%</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-blue-100 p-2 bg-blue-50 rounded" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="documents">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1">
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="mt-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="px-6 py-3 text-left text-sm font-semibold">Document Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Created</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Progress</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map(doc => (
                        <tr key={doc.id} className="border-b hover:bg-slate-50">
                          <td className="px-6 py-3 font-medium text-slate-900">{doc.name}</td>
                          <td className="px-6 py-3"><Badge variant="outline">{doc.type}</Badge></td>
                          <td className="px-6 py-3 text-slate-600">{new Date(doc.createdDate).toLocaleDateString()}</td>
                          <td className="px-6 py-3">
                            <Badge className={doc.status === 'signed' ? 'bg-green-100 text-green-900' : doc.status === 'pending' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'}>
                              {doc.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-200 rounded-full h-2 w-16">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${doc.signatureProgress}%` }} />
                              </div>
                              <span className="text-sm font-bold">{doc.signatureProgress}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 flex gap-2">
                            <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm"><Share2 className="w-4 h-4" /></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map(template => (
                <Card key={template.id} className="border-0 shadow-sm hover:shadow-md transition">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-slate-900">{template.name}</h3>
                        <p className="text-sm text-slate-600 mt-1">{template.category}</p>
                      </div>
                      <FileText className="w-8 h-8 text-blue-200" />
                    </div>
                    <p className="text-sm text-slate-600 mb-4">Used {template.uses} times</p>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">Use Template</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Document Workflow Analytics</CardTitle>
                <CardDescription>Processed documents and signature completion</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={workflowData}>
                    <CartesianGrid stroke="#e2e8f0" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }} />
                    <Legend />
                    <Bar dataKey="documents" fill="#3b82f6" />
                    <Bar dataKey="signed" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
