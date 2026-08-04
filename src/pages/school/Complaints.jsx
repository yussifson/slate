import React, { useState } from 'react';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Search, Trash2, Edit2, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';

export default function Complaints() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const { data: complaints = [], isLoading } = useIndustryRecords('school_complaint');
  const { mutateAsync: saveRecord } = useMutateIndustryRecord();
  const { mutateAsync: deleteRecord } = useDeleteIndustryRecord();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    submitted_by: '',
    category: 'Academic',
    subject: '',
    description: '',
    priority: 'Medium',
    date: new Date().toISOString().split('T')[0],
    student_name: '',
    class_name: '',
    status: 'Open',
    resolution: '',
    resolved_by: '',
    resolved_date: null
  });

  const [resolveData, setResolveData] = useState({ resolution: '' });

  const filteredRecords = complaints.filter(record => {
    const d = record.data;
    if (!d) return false;
    const matchesSearch = d.subject?.toLowerCase().includes(search.toLowerCase()) || 
                          d.submitted_by?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openModal = (record = null) => {
    if (record) {
      setEditingId(record.id);
      setFormData({
        ...record.data,
      });
    } else {
      setEditingId(null);
      setFormData({
        submitted_by: '',
        category: 'Academic',
        subject: '',
        description: '',
        priority: 'Medium',
        date: new Date().toISOString().split('T')[0],
        student_name: '',
        class_name: '',
        status: 'Open',
        resolution: '',
        resolved_by: '',
        resolved_date: null
      });
    }
    setIsModalOpen(true);
  };

  const openResolveModal = (record) => {
    setEditingId(record.id);
    setFormData(record.data);
    setResolveData({ resolution: record.data.resolution || '' });
    setIsResolveModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.subject || !formData.submitted_by) {
      toast.error('Subject and Submitted By are required');
      return;
    }

    try {
      await saveRecord({
        id: editingId,
        recordType: 'school_complaint',
        payload: formData,
        searchText: `${formData.subject} ${formData.submitted_by} ${formData.student_name}`,
        status: formData.status
      });
      toast.success('Complaint saved successfully');
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Failed to save complaint');
    }
  };

  const handleResolve = async () => {
    if (!resolveData.resolution) {
      toast.error('Resolution text is required');
      return;
    }

    try {
      await saveRecord({
        id: editingId,
        recordType: 'school_complaint',
        payload: {
          ...formData,
          status: 'Resolved',
          resolution: resolveData.resolution,
          resolved_by: user?.name || 'Admin',
          resolved_date: new Date().toISOString().split('T')[0]
        },
        searchText: `${formData.subject} ${formData.submitted_by}`,
        status: 'Resolved'
      });
      toast.success('Complaint resolved');
      setIsResolveModalOpen(false);
    } catch (error) {
      toast.error('Failed to resolve complaint');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this complaint?')) {
      try {
        await deleteRecord({ id, recordType: 'school_complaint' });
        toast.success('Complaint deleted');
      } catch (error) {
        toast.error('Failed to delete complaint');
      }
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Urgent': return 'bg-red-100 text-red-800 border-red-200 animate-pulse';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'text-red-600 bg-red-50 border-red-200';
      case 'Under Review': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Resolved': return 'text-green-600 bg-green-50 border-green-200';
      case 'Closed': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading complaints...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Complaints & Feedback</h1>
          <p className="text-gray-600">Track and resolve issues from parents and staff.</p>
        </div>
        <Button onClick={() => openModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Log Complaint
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search by subject or submitter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="Under Review">Under Review</SelectItem>
            <SelectItem value="Resolved">Resolved</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center text-gray-500 border border-gray-200">
            No complaints found.
          </div>
        ) : (
          filteredRecords.map((record) => {
            const data = record.data;
            return (
              <div key={record.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-800">{data.subject}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(data.priority)}`}>
                      {data.priority}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(data.status)}`}>
                      {data.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">{data.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Submitted by: <span className="font-medium text-gray-700">{data.submitted_by}</span>
                    </div>
                    {data.student_name && (
                      <div>Student: <span className="font-medium text-gray-700">{data.student_name}</span></div>
                    )}
                    <div>Date: <span className="font-medium text-gray-700">{data.date}</span></div>
                    <div>Category: <span className="font-medium text-gray-700">{data.category}</span></div>
                  </div>

                  {data.status === 'Resolved' && data.resolution && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-md">
                      <div className="text-xs font-semibold text-green-800 mb-1 flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> Resolution ({data.resolved_date}):
                      </div>
                      <p className="text-sm text-green-700">{data.resolution}</p>
                    </div>
                  )}
                </div>

                <div className="flex md:flex-col justify-end gap-2 shrink-0 md:min-w-[120px]">
                  {data.status !== 'Resolved' && data.status !== 'Closed' && (
                    <Button variant="outline" size="sm" className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => openResolveModal(record)}>
                      <CheckCircle className="h-4 w-4 mr-2" /> Resolve
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => openModal(record)}>
                    <Edit2 className="h-4 w-4 mr-2" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(record.id)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Complaint' : 'Log New Complaint'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Submitted By</Label>
                <Input
                  value={formData.submitted_by}
                  onChange={(e) => setFormData({ ...formData, submitted_by: e.target.value })}
                  placeholder="e.g. Jane Doe (Parent)"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Academic">Academic</SelectItem>
                    <SelectItem value="Behavioral">Behavioral</SelectItem>
                    <SelectItem value="Facilities">Facilities</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Brief summary of the issue"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed explanation..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Related Student (Optional)</Label>
                <Input
                  value={formData.student_name}
                  onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                  placeholder="Student Name"
                />
              </div>
              <div className="space-y-2">
                <Label>Class (Optional)</Label>
                <Input
                  value={formData.class_name}
                  onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                  placeholder="e.g. Primary 3A"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Complaint</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Modal */}
      <Dialog open={isResolveModalOpen} onOpenChange={setIsResolveModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Resolve Complaint</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4 bg-gray-50 p-3 rounded text-sm text-gray-700 border border-gray-200">
              <p className="font-semibold mb-1">Subject: {formData.subject}</p>
              <p className="text-gray-500">By: {formData.submitted_by}</p>
            </div>
            <div className="space-y-2">
              <Label>Resolution Details</Label>
              <Textarea
                rows={4}
                value={resolveData.resolution}
                onChange={(e) => setResolveData({ resolution: e.target.value })}
                placeholder="Explain how this issue was resolved..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResolveModalOpen(false)}>Cancel</Button>
            <Button onClick={handleResolve} className="bg-green-600 hover:bg-green-700 text-white">Mark as Resolved</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
