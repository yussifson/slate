import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  AlertTriangle, Search, Plus, MoreVertical, Eye, Edit2, CheckCircle2,
  Zap, AlertCircle, Truck, FileText, Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useShipmentIncidents, useReportIncident, useResolveIncident, useIncidentsList } from '@/hooks/logistics/useIncidentsAndReturns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';

const SEVERITY_COLORS = {
  'critical': 'bg-red-100 text-red-700 border-red-300',
  'high': 'bg-orange-100 text-orange-700 border-orange-300',
  'medium': 'bg-yellow-100 text-yellow-700 border-yellow-300',
  'low': 'bg-blue-100 text-blue-700 border-blue-300'
};

const INCIDENT_TYPES = [
  'damage',
  'accident',
  'weather',
  'theft',
  'other'
];

export default function IncidentManagement() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState('medium');
  const [formData, setFormData] = useState({
    incidentType: 'damage',
    description: '',
    shipmentId: '',
    driverId: ''
  });

  const { data: allIncidents } = useIncidentsList();
  const { mutate: reportIncident, isPending } = useReportIncident();

  const openIncidents = allIncidents?.filter(i => i.status === 'open') || [];
  const resolvedIncidents = allIncidents?.filter(i => i.status === 'resolved') || [];

  const handleReportIncident = async () => {
    if (!formData.description.trim()) {
      toast.error('Please describe the incident');
      return;
    }

    reportIncident({
      shipmentId: formData.shipmentId,
      driverId: formData.driverId,
      vehicleId: formData.vehicleId,
      incidentType: formData.incidentType,
      severity: selectedSeverity,
      description: formData.description,
      incidentLocation: formData.location,
      incidentTimestamp: new Date().toISOString()
    }, {
      onSuccess: () => {
        toast.success('Incident reported successfully!');
        setShowReportModal(false);
        setFormData({ incidentType: 'damage', description: '', shipmentId: '', driverId: '' });
      },
      onError: (error) => toast.error(`Error: ${error.message}`)
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Incident Management</h1>
          <p className="text-gray-600 mt-1">Track and resolve delivery incidents</p>
        </div>
        <Button 
          onClick={() => setShowReportModal(true)}
          className="gap-2 bg-red-600 hover:bg-red-700"
        >
          <AlertTriangle className="w-4 h-4" />
          Report Incident
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{openIncidents.length}</div>
              <p className="text-sm text-gray-600 mt-2">Open Incidents</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {openIncidents.filter(i => i.severity === 'critical').length}
              </div>
              <p className="text-sm text-gray-600 mt-2">Critical</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{resolvedIncidents.length}</div>
              <p className="text-sm text-gray-600 mt-2">Resolved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {allIncidents?.length || 0}
              </div>
              <p className="text-sm text-gray-600 mt-2">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Incidents List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Incidents</CardTitle>
            <Input
              placeholder="Search incidents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="open">
            <TabsList>
              <TabsTrigger value="open">Open ({openIncidents.length})</TabsTrigger>
              <TabsTrigger value="resolved">Resolved ({resolvedIncidents.length})</TabsTrigger>
              <TabsTrigger value="all">All ({allIncidents?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="open" className="space-y-3 mt-4">
              {openIncidents.length > 0 ? (
                openIncidents.map(incident => (
                  <IncidentCard key={incident.id} incident={incident} />
                ))
              ) : (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-green-300 mb-3" />
                  <p className="text-gray-500">No open incidents</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="resolved" className="space-y-3 mt-4">
              {resolvedIncidents.length > 0 ? (
                resolvedIncidents.map(incident => (
                  <IncidentCard key={incident.id} incident={incident} resolved />
                ))
              ) : (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No resolved incidents</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-3 mt-4">
              {allIncidents && allIncidents.length > 0 ? (
                allIncidents.map(incident => (
                  <IncidentCard key={incident.id} incident={incident} />
                ))
              ) : (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No incidents recorded</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Report Incident Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Report Incident</CardTitle>
              <button onClick={() => setShowReportModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-2">Incident Type</label>
                <select
                  value={formData.incidentType}
                  onChange={(e) => setFormData({ ...formData, incidentType: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm"
                >
                  {INCIDENT_TYPES.map(type => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Severity</label>
                <div className="grid grid-cols-4 gap-2">
                  {['low', 'medium', 'high', 'critical'].map(sev => (
                    <button
                      key={sev}
                      onClick={() => setSelectedSeverity(sev)}
                      className={`p-2 rounded text-xs font-semibold capitalize ${
                        selectedSeverity === sev 
                          ? SEVERITY_COLORS[sev] + ' ring-2 ring-offset-2 ring-current'
                          : SEVERITY_COLORS[sev]
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm h-24"
                  placeholder="Describe what happened..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-semibold block mb-2">Shipment ID</label>
                  <Input
                    value={formData.shipmentId}
                    onChange={(e) => setFormData({ ...formData, shipmentId: e.target.value })}
                    placeholder="Optional"
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-2">Driver ID</label>
                  <Input
                    value={formData.driverId}
                    onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                    placeholder="Optional"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowReportModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-2 bg-red-600 hover:bg-red-700"
                  onClick={handleReportIncident}
                  disabled={isPending}
                >
                  <AlertTriangle className="w-4 h-4" />
                  {isPending ? 'Reporting...' : 'Report'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function IncidentCard({ incident, resolved }) {
  const { mutate: resolveIncident } = useResolveIncident();
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const handleResolve = () => {
    resolveIncident({
      incidentId: incident.id,
      resolutionNotes,
      status: 'resolved'
    }, {
      onSuccess: () => {
        toast.success('Incident resolved!');
        setShowResolveForm(false);
      }
    });
  };

  return (
    <div className={`border-l-4 rounded-lg p-4 ${incident.severity === 'critical' ? 'border-l-red-600 bg-red-50' : incident.severity === 'high' ? 'border-l-orange-600 bg-orange-50' : 'border-l-blue-600 bg-blue-50'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className={`w-5 h-5 ${incident.severity === 'critical' ? 'text-red-600' : 'text-orange-600'}`} />
            <h3 className="font-semibold capitalize">{incident.incident_type}</h3>
            <Badge className={SEVERITY_COLORS[incident.severity]}>
              {incident.severity}
            </Badge>
            {resolved && <Badge className="bg-green-100 text-green-700">Resolved</Badge>}
          </div>
          <p className="text-sm text-gray-700 mb-2">{incident.description}</p>
          <p className="text-xs text-gray-600">
            Reported {new Date(incident.reported_at).toLocaleDateString()}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="gap-2">
              <Eye className="w-4 h-4" />
              View Details
            </DropdownMenuItem>
            {!resolved && (
              <DropdownMenuItem className="gap-2" onClick={() => setShowResolveForm(true)}>
                <CheckCircle2 className="w-4 h-4" />
                Mark Resolved
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {showResolveForm && (
        <div className="mt-3 p-3 border-t border-current/20 space-y-2">
          <textarea
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="Resolution notes..."
            className="w-full border rounded p-2 text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => setShowResolveForm(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1 gap-1 bg-green-600 hover:bg-green-700"
              onClick={handleResolve}
            >
              <CheckCircle2 className="w-3 h-3" />
              Confirm
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
