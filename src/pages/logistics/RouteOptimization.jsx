import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  Map, Zap, Plus, Filter, MoreVertical, Eye, Edit2, Trash2,
  Truck, Package, Clock, MapPin, AlertCircle, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords } from '@/hooks/useIndustryData';
import { useRoutes, useAutoAssignment } from '@/hooks/logistics/useRouteOptimization';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCompanyId } from '@/hooks/useCompanyId';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';

const STATUS_COLORS = {
  'planned': 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-orange-100 text-orange-700',
  'completed': 'bg-green-100 text-green-700',
  'cancelled': 'bg-red-100 text-red-700'
};

export default function RouteOptimization() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [selectedShipments, setSelectedShipments] = useState([]);
  const [optimizationStrategy, setOptimizationStrategy] = useState('cost');

  const { data: shipments } = useIndustryRecords('shipment');
  const { data: routes } = useRoutes();
  const { mutate: autoAssign, isPending: isAssigning } = useAutoAssignment();

  const pendingShipments = shipments?.filter(s => s.status === 'Pending') || [];
  const unassignedCount = pendingShipments.length - selectedShipments.length;

  const handleOptimize = async () => {
    if (selectedShipments.length === 0) {
      toast.error('Please select at least one shipment');
      return;
    }

    autoAssign({
      shipmentIds: selectedShipments,
      optimizationStrategy
    }, {
      onSuccess: () => {
        toast.success('Routes optimized successfully!');
        setShowOptimizeModal(false);
        setSelectedShipments([]);
      },
      onError: (error) => toast.error(`Error: ${error.message}`)
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Route Optimization</h1>
          <p className="text-gray-600 mt-1">Intelligently assign and optimize delivery routes</p>
        </div>
        <Button 
          onClick={() => setShowOptimizeModal(true)}
          className="gap-2 bg-primary hover:bg-primary/90"
        >
          <Zap className="w-4 h-4" />
          Optimize Routes
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{routes?.length || 0}</div>
              <p className="text-sm text-gray-600 mt-2">Active Routes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{pendingShipments.length}</div>
              <p className="text-sm text-gray-600 mt-2">Unassigned</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {routes?.filter(r => r.route_status === 'completed').length || 0}
              </div>
              <p className="text-sm text-gray-600 mt-2">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {routes?.reduce((sum, r) => sum + (r.optimized_distance || 0), 0).toFixed(0)}
              </div>
              <p className="text-sm text-gray-600 mt-2">Total Distance (km)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Routes List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Active Routes</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Search routes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {routes && routes.length > 0 ? (
              routes.map(route => (
                <RouteCard key={route.id} route={route} />
              ))
            ) : (
              <div className="text-center py-12">
                <Map className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No routes created yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Optimization Modal */}
      {showOptimizeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Optimize Shipments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-3">
                  Select Shipments ({selectedShipments.length} selected)
                </label>
                {pendingShipments.length === 0 ? (
                  <div className="border rounded-lg p-6 text-center text-gray-500">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No pending shipments available</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                    {pendingShipments.map(shipment => (
                      <label key={shipment.id} className="flex items-center gap-3 p-3 hover:bg-white rounded transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedShipments.includes(shipment.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedShipments([...selectedShipments, shipment.id]);
                            } else {
                              setSelectedShipments(selectedShipments.filter(id => id !== shipment.id));
                            }
                          }}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{shipment.data?.trackingNumber || shipment.id?.slice(0, 8)}</p>
                          <p className="text-xs text-gray-600">{shipment.data?.destination || 'No destination'}</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700 text-xs">
                          {shipment.status || 'Pending'}
                        </Badge>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Optimization Strategy</label>
                <select
                  value={optimizationStrategy}
                  onChange={(e) => setOptimizationStrategy(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm"
                >
                  <option value="cost">Minimize Cost</option>
                  <option value="time">Minimize Time</option>
                  <option value="distance">Minimize Distance</option>
                  <option value="balanced">Balanced</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowOptimizeModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-2 bg-primary"
                  onClick={handleOptimize}
                  disabled={isAssigning || selectedShipments.length === 0}
                >
                  <Zap className="w-4 h-4" />
                  {isAssigning ? 'Optimizing...' : 'Optimize'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function RouteCard({ route }) {
  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">Route {route.id?.slice(0, 8)}</h3>
            <Badge className={STATUS_COLORS[route.route_status]}>
              {route.route_status}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">{route.shipment_ids?.length || 0} deliveries</p>
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
            <DropdownMenuItem className="gap-2">
              <Edit2 className="w-4 h-4" />
              Edit Route
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-red-600">
              <Trash2 className="w-4 h-4" />
              Delete Route
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Route Details */}
      <div className="grid grid-cols-4 gap-4 text-sm bg-gray-50 rounded p-3">
        <div>
          <p className="text-gray-600">Distance</p>
          <p className="font-semibold">{route.optimized_distance?.toFixed(1) || 0} km</p>
        </div>
        <div>
          <p className="text-gray-600">Est. Time</p>
          <p className="font-semibold">{route.estimated_duration_minutes || 0} min</p>
        </div>
        <div>
          <p className="text-gray-600">Priority</p>
          <p className="font-semibold">{route.priority || 5}/10</p>
        </div>
        <div>
          <p className="text-gray-600">Vehicle</p>
          <p className="font-semibold">ID: {route.vehicle_id?.slice(0, 8)}</p>
        </div>
      </div>

      {/* Shipments */}
      <div className="mt-3 space-y-2">
        {route.shipment_ids?.slice(0, 3).map((shipmentId, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
            <Package className="w-3 h-3" />
            <span>{shipmentId?.slice(0, 8)}...</span>
          </div>
        ))}
        {route.shipment_ids?.length > 3 && (
          <p className="text-xs text-gray-500 ml-5">+{route.shipment_ids.length - 3} more</p>
        )}
      </div>
    </div>
  );
}
