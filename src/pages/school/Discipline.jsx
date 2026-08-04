import React, { useState } from 'react';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Plus, Search, Trash2, Edit2, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';

export default function Discipline() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  
  const { data: disciplines = [], isLoading } = useIndustryRecords('school_discipline');
  const { mutateAsync: saveRecord } = useMutateIndustryRecord();
  const { mutateAsync: deleteRecord } = useDeleteIndustryRecord();

  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    student_name: '',
    class_name: '',
    incident_type: 'Fighting',
    severity: 'Moderate',
    date: new Date().toISOString().split('T')[0],
    description: '',
    action_taken: 'Warned',
    reported_by: user?.name || '',
    status: 'Open'
  });

  const filteredRecords = disciplines.filter(record => {
    const d = record.data;
    if (!d) return false;
    const matchesSearch = d.student_name?.toLowerCase().includes(search.toLowerCase()) || d.description?.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = severityFilter === 'All' || d.severity === severityFilter;
    const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const openModal = (record = null) => {
    if (record) {
      setEditingId(record.id);
      setFormData({
        student_id: record.data.student_id || '',
        student_name: record.data.student_name || '',
        class_name: record.data.class_name || '',
        incident_type: record.data.incident_type || 'Fighting',
        severity: record.data.severity || 'Moderate',
        date: record.data.date || new Date().toISOString().split('T')[0],
        description: record.data.description || '',
        action_taken: record.data.action_taken || 'Warned',
        reported_by: record.data.reported_by || '',
        status: record.data.status || 'Open'
      });
    } else {
      setEditingId(null);
      setFormData({
        student_id: '',
        student_name: '',
        class_name: '',
        incident_type: 'Fighting',
        severity: 'Moderate',
        date: new Date().toISOString().split('T')[0],
        description: '',
        action_taken: 'Warned',
        reported_by: user?.name || '',
        status: 'Open'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.student_name || !formData.incident_type) {
      toast.error('Student name and Incident type are required');
      return;
    }

    try {
      await saveRecord({
        id: editingId,
        recordType: 'school_discipline',
        payload: formData,
        searchText: `${formData.student_name} ${formData.incident_type} ${formData.description}`,
        status: formData.status
      });
      toast.success('Incident saved successfully');
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Failed to save incident');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this incident?')) {
      try {
        await deleteRecord({ id, recordType: 'school_discipline' });
        toast.success('Incident deleted');
      } catch (error) {
        toast.error('Failed to delete incident');
      }
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Minor': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Moderate': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Severe': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Open': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'Under Review': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'Resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading discipline records...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Discipline Management</h1>
          <p className="text-gray-600">Track and manage student disciplinary incidents.</p>
        </div>
        <Button onClick={() => openModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Log Incident
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search student or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Severities</SelectItem>
            <SelectItem value="Minor">Minor</SelectItem>
            <SelectItem value="Moderate">Moderate</SelectItem>
            <SelectItem value="Severe">Severe</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="Under Review">Under Review</SelectItem>
            <SelectItem value="Resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-medium text-gray-500">Student</th>
              <th className="p-4 font-medium text-gray-500">Incident</th>
              <th className="p-4 font-medium text-gray-500">Date</th>
              <th className="p-4 font-medium text-gray-500">Severity</th>
              <th className="p-4 font-medium text-gray-500">Status</th>
              <th className="p-4 font-medium text-gray-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">
                  No disciplinary records found.
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
                <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-medium text-gray-800">{record.data.student_name}</div>
                    <div className="text-sm text-gray-500">{record.data.class_name}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-800">{record.data.incident_type}</div>
                    <div className="text-sm text-gray-500 max-w-xs truncate">{record.data.description}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{record.data.date}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getSeverityColor(record.data.severity)}`}>
                      {record.data.severity}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(record.data.status)}
                      <span className="text-sm font-medium text-gray-700">{record.data.status}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openModal(record)}>
                        <Edit2 className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(record.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Incident' : 'Log Disciplinary Incident'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Student Name</Label>
                <Input
                  value={formData.student_name}
                  onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Class</Label>
                <Input
                  value={formData.class_name}
                  onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                  placeholder="e.g. Primary 3A"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Incident Type</Label>
                <Select value={formData.incident_type} onValueChange={(v) => setFormData({ ...formData, incident_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fighting">Fighting</SelectItem>
                    <SelectItem value="Bullying">Bullying</SelectItem>
                    <SelectItem value="Truancy">Truancy</SelectItem>
                    <SelectItem value="Misconduct">Misconduct</SelectItem>
                    <SelectItem value="Vandalism">Vandalism</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={formData.severity} onValueChange={(v) => setFormData({ ...formData, severity: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Minor">Minor</SelectItem>
                    <SelectItem value="Moderate">Moderate</SelectItem>
                    <SelectItem value="Severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
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
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Details of the incident"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Action Taken</Label>
                <Select value={formData.action_taken} onValueChange={(v) => setFormData({ ...formData, action_taken: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Warned">Warned</SelectItem>
                    <SelectItem value="Suspension">Suspension</SelectItem>
                    <SelectItem value="Parent Called">Parent Called</SelectItem>
                    <SelectItem value="Counseling">Counseling</SelectItem>
                    <SelectItem value="Expelled">Expelled</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reported By</Label>
                <Input
                  value={formData.reported_by}
                  onChange={(e) => setFormData({ ...formData, reported_by: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Incident</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
