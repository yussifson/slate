import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, MapPin, Navigation } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function SHSBusRoutes() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoute, setNewRoute] = useState({
    routeName: '',
    zone: '',
    pickupPoints: '',
    feeAmount: ''
  });

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('shs_transport_route', user?.company_id);
      setRoutes(records);
    } catch (error) {
      console.error('Failed to fetch routes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchRoutes();
    }
  }, [user]);

  const handleSaveRoute = async () => {
    try {
      const payload = {
        company_id: user?.company_id,
        case_type: 'shs_transport_route',
        title: newRoute.routeName,
        case_number: `RTE-${Math.floor(Math.random() * 1000)}`,
        status: 'Active',
        data: {
          ...newRoute,
          feeAmount: parseFloat(newRoute.feeAmount) || 0,
          pickupPointsList: newRoute.pickupPoints.split(',').map(p => p.trim()).filter(Boolean)
        }
      };
      
      await base44.createEntity(payload);
      setIsModalOpen(false);
      setNewRoute({ routeName: '', zone: '', pickupPoints: '', feeAmount: '' });
      fetchRoutes();
    } catch (error) {
      console.error('Failed to save route:', error);
    }
  };

  const filteredRoutes = routes.filter(r => 
    r.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.data?.zone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-[#6F00FF] to-purple-800 bg-clip-text text-transparent">
            Transport Routes
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Define pickup points, zones, and termly transport fees.
          </p>
        </div>
        
        <Button onClick={() => setIsModalOpen(true)} className="h-9 gap-2 rounded-xl bg-[#6F00FF] hover:bg-[#5200c2] text-white shadow-md shadow-purple-500/20">
          <Plus className="w-4 h-4" /> Add Route
        </Button>
      </div>

      <Card className="rounded-3xl border-none shadow-sm bg-white/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">Defined Routes</CardTitle>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Search route or zone..." 
                className="pl-9 h-9 bg-white border-slate-200 rounded-xl focus-visible:ring-[#6F00FF]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading routes...</div>
          ) : filteredRoutes.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 mx-auto flex items-center justify-center mb-4">
                <Navigation className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">No routes defined</h3>
              <p className="text-sm text-slate-500">Add transport routes to map out the school network.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-slate-50/50">
              {filteredRoutes.map((route) => (
                <Card key={route.id} className="rounded-2xl border-none shadow-sm bg-white hover:ring-1 hover:ring-[#6F00FF]/30 transition-all">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-slate-800">{route.title}</h4>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none mt-1">
                          Zone: {route.data?.zone}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-sm block">
                          ${parseFloat(route.data?.feeAmount || 0).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold mt-1 block">Per Term</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <MapPin className="w-3.5 h-3.5" /> Pickup Points
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(route.data?.pickupPointsList || []).map((point, idx) => (
                          <span key={idx} className="text-xs font-medium bg-slate-50 border border-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                            {point}
                          </span>
                        ))}
                        {(!route.data?.pickupPointsList || route.data?.pickupPointsList.length === 0) && (
                          <span className="text-xs text-slate-400 italic">No points defined</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-6 bg-gradient-to-br from-[#6F00FF] to-purple-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Define Route</DialogTitle>
              <DialogDescription className="text-purple-100">
                Create a new bus route and set the transport fee.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 bg-slate-50 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Route Name</label>
              <Input 
                placeholder="e.g. Osu / Labadi Axis"
                className="bg-white border-slate-200 rounded-xl"
                value={newRoute.routeName}
                onChange={e => setNewRoute({...newRoute, routeName: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Zone / Region</label>
                <Input 
                  placeholder="e.g. Zone A"
                  className="bg-white border-slate-200 rounded-xl"
                  value={newRoute.zone}
                  onChange={e => setNewRoute({...newRoute, zone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Termly Fee ($)</label>
                <Input 
                  type="number"
                  min="0" step="0.01"
                  placeholder="0.00"
                  className="bg-white border-slate-200 rounded-xl font-bold"
                  value={newRoute.feeAmount}
                  onChange={e => setNewRoute({...newRoute, feeAmount: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Pickup Points (Comma separated)</label>
              <textarea 
                placeholder="e.g. Danquah Circle, Labadi Beach, Trade Fair"
                className="w-full h-24 rounded-xl border border-slate-200 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-[#6F00FF] resize-none text-sm"
                value={newRoute.pickupPoints}
                onChange={e => setNewRoute({...newRoute, pickupPoints: e.target.value})}
              />
            </div>
          </div>
          
          <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl font-semibold text-slate-600">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveRoute} 
              disabled={!newRoute.routeName || !newRoute.feeAmount}
              className="rounded-xl bg-[#6F00FF] hover:bg-[#5200c2] text-white font-bold"
            >
              Save Route
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
