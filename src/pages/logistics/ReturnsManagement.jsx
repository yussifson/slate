import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  RotateCcw, Search, Plus, MoreVertical, Eye, CheckCircle2,
  XCircle, AlertCircle, Truck, DollarSign, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useReturnOrders, useRequestReturn, useMutateReturnOrder, useReturnMetrics } from '@/hooks/logistics/useIncidentsAndReturns';
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

const STATUS_COLORS = {
  'requested': 'bg-blue-100 text-blue-700',
  'approved': 'bg-green-100 text-green-700',
  'rejected': 'bg-red-100 text-red-700',
  'in_transit': 'bg-orange-100 text-orange-700',
  'received': 'bg-purple-100 text-purple-700',
  'processed': 'bg-gray-100 text-gray-700'
};

export default function ReturnsManagement() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [formData, setFormData] = useState({
    originalShipmentId: '',
    returnReason: '',
    customerId: '',
    pickupScheduledDate: ''
  });

  const { data: returns } = useReturnOrders();
  const { data: metrics } = useReturnMetrics();
  const { mutate: requestReturn, isPending } = useRequestReturn();
  const { mutate: mutateReturn } = useMutateReturnOrder();

  const handleRequestReturn = async () => {
    if (!formData.originalShipmentId.trim() || !formData.returnReason.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    requestReturn({
      originalShipmentId: formData.originalShipmentId,
      returnReason: formData.returnReason,
      customerId: formData.customerId,
      returnLocation: { type: 'warehouse' },
      pickupScheduledDate: formData.pickupScheduledDate
    }, {
      onSuccess: () => {
        toast.success('Return request created!');
        setShowRequestModal(false);
        setFormData({ originalShipmentId: '', returnReason: '', customerId: '', pickupScheduledDate: '' });
      },
      onError: (error) => toast.error(`Error: ${error.message}`)
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Returns Management</h1>
          <p className="text-gray-600 mt-1">Handle reverse logistics and returns processing</p>
        </div>
        <Button 
          onClick={() => setShowRequestModal(true)}
          className="gap-2 bg-primary hover:bg-primary/90"
        >
          <RotateCcw className="w-4 h-4" />
          Request Return
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{metrics?.totalReturns || 0}</div>
              <p className="text-sm text-gray-600 mt-2">Total Returns</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{metrics?.statuses?.approved || 0}</div>
              <p className="text-sm text-gray-600 mt-2">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{metrics?.statuses?.in_transit || 0}</div>
              <p className="text-sm text-gray-600 mt-2">In Transit</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{metrics?.statuses?.processed || 0}</div>
              <p className="text-sm text-gray-600 mt-2">Processed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">${(metrics?.totalRefundAmount || 0).toFixed(2)}</div>
              <p className="text-sm text-gray-600 mt-2">Total Refunds</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Returns List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Return Orders</CardTitle>
            <Input
              placeholder="Search returns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All ({returns?.length || 0})</TabsTrigger>
              <TabsTrigger value="requested">Requested ({returns?.filter(r => r.return_status === 'requested').length || 0})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({returns?.filter(r => r.return_status === 'approved').length || 0})</TabsTrigger>
              <TabsTrigger value="transit">In Transit ({returns?.filter(r => r.return_status === 'in_transit').length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3 mt-4">
              {returns && returns.length > 0 ? (
                returns.map(returnOrder => (
                  <ReturnCard 
                    key={returnOrder.id} 
                    returnOrder={returnOrder}
                    onMutate={mutateReturn}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <RotateCcw className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No returns found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Request Return Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Request Return</CardTitle>
              <button onClick={() => setShowRequestModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-2">Original Shipment ID *</label>
                <Input
                  value={formData.originalShipmentId}
                  onChange={(e) => setFormData({ ...formData, originalShipmentId: e.target.value })}
                  placeholder="e.g., SHIP-1234"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Return Reason *</label>
                <select
                  value={formData.returnReason}
                  onChange={(e) => setFormData({ ...formData, returnReason: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm"
                >
                  <option value="">Select reason...</option>
                  <option value="defective">Defective Product</option>
                  <option value="damaged">Damaged in Transit</option>
                  <option value="wrong_item">Wrong Item Sent</option>
                  <option value="not_as_described">Not as Described</option>
                  <option value="customer_request">Customer Request</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Customer ID</label>
                <Input
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  placeholder="Optional"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Pickup Scheduled Date</label>
                <Input
                  type="date"
                  value={formData.pickupScheduledDate}
                  onChange={(e) => setFormData({ ...formData, pickupScheduledDate: e.target.value })}
                  className="text-sm"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowRequestModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-2 bg-primary"
                  onClick={handleRequestReturn}
                  disabled={isPending}
                >
                  <RotateCcw className="w-4 h-4" />
                  {isPending ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function ReturnCard({ returnOrder, onMutate }) {
  const [showActionForm, setShowActionForm] = useState(false);
  const [action, setAction] = useState('approve');
  const [refundAmount, setRefundAmount] = useState('');

  const handleApproveReject = () => {
    onMutate({
      returnOrderId: returnOrder.id,
      action,
      refundAmount: action === 'approve' ? parseFloat(refundAmount) : null
    }, {
      onSuccess: () => {
        toast.success(`Return ${action}d!`);
        setShowActionForm(false);
      }
    });
  };

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold">#{returnOrder.id?.slice(0, 8)}</h3>
            <Badge className={STATUS_COLORS[returnOrder.return_status]}>
              {returnOrder.return_status}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mb-1">Original Shipment: {returnOrder.original_shipment_id?.slice(0, 8)}</p>
          <p className="text-sm text-gray-700 font-medium">Reason: {returnOrder.return_reason}</p>
          {returnOrder.refund_amount && (
            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Refund: ${returnOrder.refund_amount.toFixed(2)}
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {returnOrder.return_status === 'requested' && (
              <>
                <DropdownMenuItem 
                  className="gap-2 text-green-600"
                  onClick={() => {
                    setAction('approve');
                    setShowActionForm(true);
                  }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="gap-2 text-red-600"
                  onClick={() => {
                    setAction('reject');
                    setShowActionForm(true);
                  }}
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem className="gap-2">
              <Eye className="w-4 h-4" />
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {showActionForm && (
        <div className="mt-3 p-3 border-t space-y-2">
          {action === 'approve' && (
            <div>
              <label className="text-sm font-semibold block mb-1">Refund Amount</label>
              <Input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="Enter refund amount"
                className="text-sm"
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => setShowActionForm(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className={`flex-1 gap-1 ${action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              onClick={handleApproveReject}
            >
              {action === 'approve' ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  Approve
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3" />
                  Reject
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
