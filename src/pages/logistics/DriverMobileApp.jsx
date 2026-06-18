import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import {
  MapPin, Navigation, Phone, CheckCircle2, AlertCircle,
  Camera, Signature, Clock, Package, ArrowRight, PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords } from '@/hooks/useIndustryData';
import { useRoutes } from '@/hooks/logistics/useRouteOptimization';
import { useGPSTracking, useRecordGPSLocation, useLiveETA } from '@/hooks/logistics/useGPSTracking';
import { useCapturePOD } from '@/hooks/logistics/usePODAndSLA';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const STATUS_COLORS = {
  'pending': 'bg-amber-100 text-amber-700',
  'in_progress': 'bg-blue-100 text-blue-700',
  'completed': 'bg-green-100 text-green-700',
  'failed': 'bg-red-100 text-red-700'
};

export default function DriverMobileApp() {
  const { t } = useTranslation();
  const [driverId] = useState(localStorage.getItem('driverId') || '');
  const [currentRoute, setCurrentRoute] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [tracking, setTracking] = useState(false);

  const { data: routes } = useRoutes({ driver_id: driverId });
  const { mutate: recordLocation } = useRecordGPSLocation();

  // Request geolocation and start tracking
  useEffect(() => {
    if (!tracking) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, heading } = position.coords;
        setCurrentLocation({ latitude, longitude, accuracy, heading });

        // Record location periodically
        recordLocation({
          driverId,
          latitude,
          longitude,
          speed: position.coords.speed || 0,
          heading: heading || 0,
          accuracy
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Unable to get location');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 5000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [tracking, driverId, recordLocation]);

  if (!driverId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 to-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Driver Login Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Please log in as a driver to access assignments.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Today's Route</h1>
          <Button
            variant={tracking ? 'destructive' : 'secondary'}
            size="sm"
            onClick={() => setTracking(!tracking)}
            className="gap-2"
          >
            <Navigation className="w-4 h-4" />
            {tracking ? 'Stop Tracking' : 'Start Tracking'}
          </Button>
        </div>

        {currentLocation && (
          <div className="text-sm opacity-90">
            <p>Location: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}</p>
            <p>Accuracy: {Math.round(currentLocation.accuracy)}m</p>
          </div>
        )}
      </div>

      {/* Current Route Overview */}
      {currentRoute && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="font-semibold text-lg mb-1">Route {currentRoute.id}</h2>
              <p className="text-sm text-gray-600">{currentRoute.shipment_ids?.length || 0} deliveries</p>
            </div>
            <Badge className="bg-blue-600">Active</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-600">Distance</p>
              <p className="font-semibold">{currentRoute.optimized_distance?.toFixed(1) || 0} km</p>
            </div>
            <div>
              <p className="text-gray-600">Est. Time</p>
              <p className="font-semibold">{currentRoute.estimated_duration_minutes || 0} min</p>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="deliveries" className="w-full">
        <TabsList className="w-full rounded-none border-b bg-white">
          <TabsTrigger value="deliveries" className="flex-1">Deliveries</TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
          <TabsTrigger value="map" className="flex-1">Map</TabsTrigger>
        </TabsList>

        {/* Deliveries Tab */}
        <TabsContent value="deliveries" className="p-4 space-y-4">
          {routes && routes.length > 0 ? (
            routes.map(route => (
              <div key={route.id}>
                {route.shipment_ids?.map((shipmentId, idx) => (
                  <DeliveryCard
                    key={shipmentId}
                    shipmentId={shipmentId}
                    driverId={driverId}
                    isActive={idx === 0}
                    onSelectRoute={() => setCurrentRoute(route)}
                  />
                ))}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No deliveries assigned</p>
            </div>
          )}
        </TabsContent>

        {/* Completed Tab */}
        <TabsContent value="completed" className="p-4 space-y-4">
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
            <p className="text-gray-600">No completed deliveries yet</p>
          </div>
        </TabsContent>

        {/* Map Tab */}
        <TabsContent value="map" className="p-4">
          <Card>
            <CardContent className="pt-6">
              <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Map integration coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DeliveryCard({ shipmentId, driverId, isActive, onSelectRoute }) {
  const { data: shipments } = useIndustryRecords('shipment');
  const [showPODModal, setShowPODModal] = useState(false);
  const { mutate: capturePOD, isPending } = useCapturePOD();

  const shipment = shipments?.find(s => s.id === shipmentId);
  if (!shipment) return null;

  const shipmentData = typeof shipment.data === 'string' 
    ? JSON.parse(shipment.data) 
    : shipment.data;

  const { data: eta } = useLiveETA(
    shipmentId,
    shipmentData.destination?.latitude || 0,
    shipmentData.destination?.longitude || 0
  );

  const handleCompleteDelivery = async () => {
    capturePOD({
      shipmentId,
      driverId,
      recipientName: shipmentData.customer,
      deliveryNotes: 'Delivered successfully',
      isDamaged: false
    }, {
      onSuccess: () => {
        toast.success('Delivery completed!');
        setShowPODModal(false);
      }
    });
  };

  return (
    <Card className={`border-l-4 ${isActive ? 'border-l-primary bg-blue-50' : 'border-l-gray-200'}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={STATUS_COLORS[shipment.status?.toLowerCase() || 'pending']}>
                {shipment.status || 'Pending'}
              </Badge>
              {isActive && <Badge className="bg-blue-600">Current</Badge>}
            </div>
            <p className="font-semibold text-lg">#{shipmentData.trackingNumber}</p>
            <p className="text-sm text-gray-600">{shipmentData.customer}</p>
          </div>
          <div className="text-right">
            {eta?.etaMinutes && (
              <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                <Clock className="w-4 h-4" />
                {eta.etaMinutes} min
              </div>
            )}
          </div>
        </div>

        {/* Delivery Details */}
        <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
            <div>
              <p className="text-gray-600">To:</p>
              <p className="font-semibold">{shipmentData.destination}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Package className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
            <div>
              <p className="text-gray-600">Weight:</p>
              <p className="font-semibold">{shipmentData.weight} kg</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 gap-2"
            onClick={() => window.open(`tel:${shipmentData.customer}`)}
          >
            <Phone className="w-4 h-4" />
            Call
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 gap-2"
            onClick={() => window.open(`https://maps.google.com/?q=${shipmentData.destination}`)}
          >
            <Navigation className="w-4 h-4" />
            Navigate
          </Button>
          <Button 
            size="sm" 
            className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
            onClick={() => setShowPODModal(true)}
            disabled={isPending}
          >
            <CheckCircle2 className="w-4 h-4" />
            Complete
          </Button>
        </div>

        {/* POD Modal */}
        {showPODModal && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-semibold mb-3">Complete Delivery</p>
            <div className="space-y-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => {
                  // Camera integration
                  toast.info('Camera feature coming soon');
                }}
              >
                <Camera className="w-4 h-4" />
                Take Photo
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => {
                  // Signature pad integration
                  toast.info('Signature feature coming soon');
                }}
              >
                <Signature className="w-4 h-4" />
                Get Signature
              </Button>
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowPODModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleCompleteDelivery}
                  disabled={isPending}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
