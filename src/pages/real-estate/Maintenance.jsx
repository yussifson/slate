import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Wrench, AlertTriangle, Clock, CheckCircle, Home, User, Zap, Plus, Search } from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import RealEstateAPI from '@/api/RealEstateAPI';
import { toast } from 'react-hot-toast';

const priorityMatrix = {
  critical: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-300', badge: 'bg-orange-100 text-orange-800', label: 'Critical' },
  high: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-300', badge: 'bg-orange-100 text-orange-800', label: 'High' },
  medium: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-300', badge: 'bg-green-100 text-green-800', label: 'Medium' },
  low: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-300', badge: 'bg-green-100 text-green-800', label: 'Low' }
};

const statusConfig = {
  open: { color: 'text-orange-600', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  in_progress: { color: 'text-green-600', bg: 'bg-green-50', badge: 'bg-green-100 text-green-800', icon: Clock },
  completed: { color: 'text-green-600', bg: 'bg-green-50', badge: 'bg-green-100 text-green-800', icon: CheckCircle },
  scheduled: { color: 'text-orange-600', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-800', icon: Clock }
};

export default function Maintenance() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    inProgress: 0,
    completed: 0,
    totalCost: 0
  });

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_re_maintenance_requests WHERE company_id = ? ORDER BY created_at DESC',
          [companyId]
        );
        const data = res.rows._array || Array.from(res.rows);
        setRequests(data);

        const critical = data.filter(r => r.priority === 'critical').length;
        const inProgress = data.filter(r => r.status === 'in_progress').length;
        const completed = data.filter(r => r.status === 'completed').length;
        const totalCost = data.reduce((sum, r) => sum + (r.cost || 0), 0);

        setStats({ total: data.length, critical, inProgress, completed, totalCost });
      } catch (e) {
        console.error('[Maintenance]:', e);
        toast.error('Failed to load maintenance requests');
      }
      setIsLoading(false);
    };
    if (companyId) fetchRequests();
  }, [companyId]);

  useEffect(() => {
    let filtered = requests;
    if (search) {
      filtered = filtered.filter(r =>
        r.property_address?.toLowerCase().includes(search.toLowerCase()) ||
        r.issue_description?.toLowerCase().includes(search.toLowerCase()) ||
        r.reported_by_name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(r => r.priority === priorityFilter);
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    setFilteredRequests(filtered);
  }, [requests, search, priorityFilter, statusFilter]);

  const MaintenanceCard = ({ request, priority }) => (
    <div
      onClick={() => setSelectedRequest(request)}
      className={`p-4 rounded-lg border-2 cursor-pointer transform transition-all hover:shadow-lg hover:scale-105 ${priorityMatrix[request.priority].bg} ${priorityMatrix[request.priority].border}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-lg ${priorityMatrix[request.priority].bg} mt-1`}>
            <Wrench className={`w-4 h-4 ${priorityMatrix[request.priority].color}`} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">{request.property_address}</p>
            <p className="text-xs text-gray-600 line-clamp-2 mt-1">{request.issue_description}</p>
          </div>
        </div>
        <Badge className={priorityMatrix[request.priority].badge}>{request.priority.toUpperCase()}</Badge>
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <User className="w-3 h-3" /> {request.reported_by_name}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Clock className="w-3 h-3" /> {request.created_at}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Badge className={statusConfig[request.status]?.badge}>{request.status}</Badge>
        {request.cost && <span className="text-sm font-bold text-orange-600">${request.cost?.toLocaleString()}</span>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg"><Wrench className="w-7 h-7 text-orange-600" /></div>
              Maintenance Requests
            </h1>
            <p className="text-gray-600 mt-1">Manage and prioritize property maintenance tasks</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-orange-600 hover:bg-orange-700 gap-2">
            <Plus className="w-4 h-4" /> New Request
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-md bg-gradient-to-br from-slate-500 to-slate-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-200 text-xs font-semibold uppercase mb-1">Total Requests</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                  <p className="text-xs text-slate-300 mt-2">All time</p>
                </div>
                <Wrench className="w-8 h-8 opacity-70" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-red-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-red-100 text-xs font-semibold uppercase mb-1">Critical</p>
                  <p className="text-3xl font-bold">{stats.critical}</p>
                  <p className="text-xs text-red-200 mt-2">Urgent attention</p>
                </div>
                <AlertTriangle className="w-8 h-8 opacity-70" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-blue-100 text-xs font-semibold uppercase mb-1">In Progress</p>
                  <p className="text-3xl font-bold">{stats.inProgress}</p>
                  <p className="text-xs text-blue-200 mt-2">Being worked on</p>
                </div>
                <Clock className="w-8 h-8 opacity-70" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-green-100 text-xs font-semibold uppercase mb-1">Total Cost</p>
                  <p className="text-3xl font-bold">${(stats.totalCost / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-green-200 mt-2">Maintenance budget</p>
                </div>
                <Zap className="w-8 h-8 opacity-70" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Search property, issue, or reporter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border-gray-200"
          />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>

        {/* Priority Matrix View */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {Object.entries(priorityMatrix).map(([priority, config]) => {
            const requestsInPriority = filteredRequests.filter(r => r.priority === priority);
            return (
              <Card key={priority} className={`border-2 ${config.border} ${config.bg}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <span className={`w-3 h-3 rounded-full ${config.color}`}></span>
                    {config.label}
                  </CardTitle>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{requestsInPriority.length}</p>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Maintenance Requests Grid */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Maintenance Requests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRequests.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No maintenance requests found</p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <MaintenanceCard key={request.id} request={request} priority={request.priority} />
              ))
            )}
          </div>
        </div>

        {/* Form Sheet */}
        <Sheet open={showForm} onOpenChange={setShowForm}>
          <SheetContent side="right" className="w-full sm:w-[500px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>New Maintenance Request</SheetTitle>
            </SheetHeader>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const formPayload = {
                  propertyId: document.getElementById('maint-property').value || '',
                  propertyAddress: document.getElementById('maint-property-addr').value || '',
                  reportedBy: user?.id,
                  reportedByName: user?.email,
                  issueDescription: document.getElementById('maint-issue').value,
                  priority: document.getElementById('maint-priority').value,
                  assignedTo: document.getElementById('maint-assigned').value || '',
                  cost: parseFloat(document.getElementById('maint-cost').value) || 0,
                  notes: document.getElementById('maint-notes').value
                };
                await RealEstateAPI.createMaintenanceRequest(companyId, formPayload, user?.id);
                const res = await powerSync.execute(
                  'SELECT * FROM univ_re_maintenance_requests WHERE company_id = ? ORDER BY created_at DESC',
                  [companyId]
                );
                const data = res.rows._array || Array.from(res.rows);
                setRequests(data);
                toast.success('Maintenance request created');
                setShowForm(false);
                document.querySelectorAll('input, textarea, select').forEach(el => el.value = '');
              } catch (error) {
                console.error('Error creating maintenance:', error);
                toast.error('Failed to create maintenance request');
              }
            }} className="space-y-4 mt-6">
              <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Property *</label>
                <input id="maint-property" type="text" placeholder="Property ID" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required /></div>
              <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Property Address *</label>
                <input id="maint-property-addr" type="text" placeholder="Property Address" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required /></div>
              <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Issue Description *</label>
                <textarea id="maint-issue" placeholder="Describe the maintenance issue" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows="4" required></textarea></div>
              <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Priority</label>
                <select id="maint-priority" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="low">Low</option>
                  <option value="medium" selected>Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select></div>
              <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Assigned To</label>
                <input id="maint-assigned" type="text" placeholder="Staff member" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Estimated Cost</label>
                <input id="maint-cost" type="number" step="0.01" placeholder="0.00" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Notes</label>
                <textarea id="maint-notes" placeholder="Additional notes" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows="3"></textarea></div>
              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">Create Request</Button>
            </form>
          </SheetContent>
        </Sheet>

        {/* Details Sheet */}
        <Sheet open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
          <SheetContent side="right" className="w-full sm:w-96">
            <SheetHeader>
              <SheetTitle>Maintenance Request Details</SheetTitle>
            </SheetHeader>
            {selectedRequest && (
              <div className="space-y-6 mt-6">
                <div className={`p-4 rounded-lg border-l-4 ${priorityMatrix[selectedRequest.priority].bg}`}>
                  <p className={`text-sm font-bold ${priorityMatrix[selectedRequest.priority].color}`}>
                    PRIORITY: {selectedRequest.priority.toUpperCase()}
                  </p>
                  <p className={`text-xs mt-2 ${priorityMatrix[selectedRequest.priority].color}`}>
                    STATUS: {selectedRequest.status.toUpperCase()}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Property</p>
                    <p className="text-lg font-bold text-gray-900">{selectedRequest.property_address}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Issue Description</p>
                    <p className="text-sm text-gray-700">{selectedRequest.issue_description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Reported By</p>
                      <p className="font-medium text-gray-900">{selectedRequest.reported_by_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Assigned To</p>
                      <p className="font-medium text-gray-900">{selectedRequest.assigned_to || 'Unassigned'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Created</p>
                      <p className="text-sm text-gray-700">{selectedRequest.created_at}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Completed</p>
                      <p className="text-sm text-gray-700">{selectedRequest.completion_date || 'In Progress'}</p>
                    </div>
                  </div>

                  {selectedRequest.cost && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Estimated Cost</p>
                      <p className="text-2xl font-bold text-orange-600">${selectedRequest.cost?.toLocaleString()}</p>
                    </div>
                  )}

                  {selectedRequest.notes && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Notes</p>
                      <p className="text-sm text-gray-700">{selectedRequest.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
