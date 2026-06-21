import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  FileCheck, Search, Plus, MoreVertical, Eye, Download,
  CheckCircle2, AlertCircle, Camera, Signature, Download as DownloadIcon,
  Thermometer, Droplets, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords } from '@/hooks/useIndustryData';
import { usePODRecord } from '@/hooks/logistics/usePODAndSLA';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';

export default function ProofOfDelivery() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [viewingPOD, setViewingPOD] = useState(null);

  const { data: shipments } = useIndustryRecords('shipment');
  const deliveredShipments = shipments?.filter(s => s.status === 'Delivered' || s.status === 'Delivered with Damage') || [];

  return (
    <div className="space-y-6 school-page-enter font-dmsans">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.02em]">Proof of Delivery</h1>
          <p className="text-gray-600 mt-1">Track and manage delivery signatures and documentation</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-semibold text-green-600 tracking-[-0.02em]">{deliveredShipments.length}</div>
              <p className="text-sm text-gray-600 mt-2">Total POD Records</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-semibold text-green-600 tracking-[-0.02em]">
                {deliveredShipments.filter(s => s.status === 'Delivered').length}
              </div>
              <p className="text-sm text-gray-600 mt-2">Successful</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-semibold text-red-600 tracking-[-0.02em]">
                {deliveredShipments.filter(s => s.status === 'Delivered with Damage').length}
              </div>
              <p className="text-sm text-gray-600 mt-2">Damaged</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-semibold text-blue-600 tracking-[-0.02em]">98%</div>
              <p className="text-sm text-gray-600 mt-2">Compliance Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* POD List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>POD Records</CardTitle>
            <Input
              placeholder="Search shipments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All ({deliveredShipments.length})</TabsTrigger>
              <TabsTrigger value="successful">Successful</TabsTrigger>
              <TabsTrigger value="damaged">With Issues</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3 mt-4">
              {deliveredShipments.length > 0 ? (
                deliveredShipments.map(shipment => (
                  <PODCard 
                    key={shipment.id} 
                    shipment={shipment}
                    onView={() => setViewingPOD(shipment.id)}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <FileCheck className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-[#71717a] dark:text-gray-400">No POD records found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* POD Detail Modal */}
      {viewingPOD && (
        <PODDetailModal 
          shipmentId={viewingPOD} 
          onClose={() => setViewingPOD(null)}
        />
      )}
    </div>
  );
}

function PODCard({ shipment, onView }) {
  const { data: pod } = usePODRecord(shipment.id);
  const shipmentData = typeof shipment.data === 'string' 
    ? JSON.parse(shipment.data) 
    : shipment.data;

  const isDamaged = shipment.status === 'Delivered with Damage';

  return (
    <div className="border-[0.5px] border-black/9 dark:border-white/8 rounded-xl p-4 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold">#{shipmentData.trackingNumber}</h3>
            <Badge className={isDamaged ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
              {isDamaged ? 'Damaged' : 'Delivered'}
            </Badge>
            {pod?.signature_url && (
              <Badge variant="outline" className="gap-2">
                <Signature className="w-3 h-3" />
                Signed
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">{shipmentData.destination}</p>
          <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Customer: {pod?.recipient_name || 'Not specified'}</p>
        </div>

        <div className="text-right space-y-2">
          <div className="text-xs text-gray-600 tracking-[0.04em]">
            {pod?.pod_timestamp && new Date(pod.pod_timestamp).toLocaleDateString()}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-2" onClick={onView}>
                <Eye className="w-4 h-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <DownloadIcon className="w-4 h-4" />
                Download PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* POD Evidence */}
      {(pod?.pod_photos?.length > 0 || pod?.signature_url) && (
        <div className="mt-3 pt-3 border-t flex gap-2">
          {pod.signature_url && (
            <div className="flex-1 p-2 bg-gray-50 rounded-md text-center text-xs tracking-[0.04em]">
              <Signature className="w-4 h-4 mx-auto mb-1 text-blue-600" />
              Signature captured
            </div>
          )}
          {pod.pod_photos?.length > 0 && (
            <div className="flex-1 p-2 bg-gray-50 rounded-md text-center text-xs tracking-[0.04em]">
              <Camera className="w-4 h-4 mx-auto mb-1 text-green-600" />
              {pod.pod_photos.length} photo(s)
            </div>
          )}
          {pod.temperature_celsius && (
            <div className="flex-1 p-2 bg-gray-50 rounded-md text-center text-xs tracking-[0.04em]">
              <Thermometer className="w-4 h-4 mx-auto mb-1 text-orange-600" />
              {pod.temperature_celsius}°C
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PODDetailModal({ shipmentId, onClose }) {
  const { data: shipments } = useIndustryRecords('shipment');
  const { data: pod } = usePODRecord(shipmentId);

  const shipment = shipments?.find(s => s.id === shipmentId);
  if (!shipment) return null;

  const shipmentData = typeof shipment.data === 'string' 
    ? JSON.parse(shipment.data) 
    : shipment.data;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <Card className="w-full max-w-2xl my-8 mx-4">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>POD Details - {shipmentData.trackingNumber}</CardTitle>
          <button onClick={onClose} className="text-[#71717a] dark:text-gray-400 hover:text-gray-700">✕</button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Shipment Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tracking Number</p>
              <p className="font-semibold">{shipmentData.trackingNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Customer</p>
              <p className="font-semibold">{shipmentData.customer}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Origin</p>
              <p className="font-semibold">{shipmentData.origin}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Destination</p>
              <p className="font-semibold">{shipmentData.destination}</p>
            </div>
          </div>

          {/* POD Information */}
          {pod && (
            <>
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Proof of Delivery</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Recipient Name</p>
                    <p className="font-semibold">{pod.recipient_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Recipient Phone</p>
                    <p className="font-semibold">{pod.recipient_phone || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Delivery Time</p>
                    <p className="font-semibold">{new Date(pod.pod_timestamp).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Condition</p>
                    <p className={`font-semibold ${pod.is_damaged ? 'text-red-600' : 'text-green-600'}`}>
                      {pod.is_damaged ? 'Damaged' : 'Good Condition'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Evidence */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Evidence</h3>
                <div className="grid grid-cols-2 gap-4">
                  {pod.signature_url && (
                    <div className="border-[0.5px] border-black/9 dark:border-white/8 rounded-xl p-3 text-center">
                      <Signature className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                      <p className="text-xs text-gray-600 tracking-[0.04em]">Signature Available</p>
                      <Button variant="outline" size="sm" className="mt-2 w-full gap-2">
                        <Eye className="w-3 h-3" />
                        View
                      </Button>
                    </div>
                  )}
                  {pod.pod_photos?.length > 0 && (
                    <div className="border-[0.5px] border-black/9 dark:border-white/8 rounded-xl p-3 text-center">
                      <Camera className="w-6 h-6 mx-auto mb-2 text-green-600" />
                      <p className="text-xs text-gray-600 tracking-[0.04em]">{pod.pod_photos.length} Photos</p>
                      <Button variant="outline" size="sm" className="mt-2 w-full gap-2">
                        <Eye className="w-3 h-3" />
                        View
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Conditions */}
              {(pod.temperature_celsius || pod.humidity_percent) && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Environmental Conditions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {pod.temperature_celsius && (
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-5 h-5 text-orange-600" />
                        <div>
                          <p className="text-sm text-gray-600">Temperature</p>
                          <p className="font-semibold">{pod.temperature_celsius}°C</p>
                        </div>
                      </div>
                    )}
                    {pod.humidity_percent && (
                      <div className="flex items-center gap-2">
                        <Droplets className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-600">Humidity</p>
                          <p className="font-semibold">{pod.humidity_percent}%</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {pod.delivery_notes && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Delivery Notes
                  </h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{pod.delivery_notes}</p>
                </div>
              )}

              {/* Damage Report */}
              {pod.is_damaged && pod.damage_description && (
                <div className="border-t pt-4 border-red-200 bg-red-50 p-3 rounded-md">
                  <h3 className="font-semibold mb-2 text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Damage Report
                  </h3>
                  <p className="text-sm text-red-600">{pod.damage_description}</p>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Button className="flex-1 gap-2 bg-primary">
              <DownloadIcon className="w-4 h-4" />
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
