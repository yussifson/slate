import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { powerSync } from '@/api/PowerSyncConnector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, Plus, Box } from 'lucide-react';
import { toast } from 'sonner';

export default function WMSDashboard() {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Location State
  const [newLocName, setNewLocName] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');

  // New Bin State
  const [newBinLabel, setNewBinLabel] = useState('');
  const [newBinZone, setNewBinZone] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);

  useEffect(() => {
    if (user?.company_id) loadData(user.company_id);
  }, [user]);

  const loadData = async (companyId) => {
    try {
      const [locRes, binRes] = await Promise.all([
        powerSync.execute('SELECT * FROM univ_retail_warehouse_locations WHERE company_id = ? ORDER BY created_at DESC', [companyId]),
        powerSync.execute('SELECT * FROM univ_retail_warehouse_bins WHERE company_id = ? ORDER BY created_at DESC', [companyId])
      ]);
      setLocations(locRes.rows._array || Array.from(locRes.rows));
      setBins(binRes.rows._array || Array.from(binRes.rows));
      if (locRes.rows.length > 0 && !selectedWarehouseId) {
        setSelectedWarehouseId(locRes.rows.item(0).id);
      }
    } catch (e) {
      console.error('WMS Data Load Error', e);
    } finally {
      setLoading(false);
    }
  };

  const addLocation = async () => {
    if (!newLocName || !user?.company_id) return;
    try {
      await powerSync.execute(
        'INSERT INTO univ_retail_warehouse_locations (id, company_id, name, address) VALUES (uuid(), ?, ?, ?)',
        [user.company_id, newLocName, newLocAddress]
      );
      toast.success('Warehouse Location Added');
      setNewLocName('');
      setNewLocAddress('');
      loadData(user.company_id);
    } catch (e) {
      toast.error('Failed to add location');
    }
  };

  const addBin = async () => {
    if (!newBinLabel || !selectedWarehouseId || !user?.company_id) return;
    try {
      await powerSync.execute(
        'INSERT INTO univ_retail_warehouse_bins (id, company_id, warehouse_id, bin_label, zone) VALUES (uuid(), ?, ?, ?, ?)',
        [user.company_id, selectedWarehouseId, newBinLabel, newBinZone]
      );
      toast.success('Storage Bin Added');
      setNewBinLabel('');
      setNewBinZone('');
      loadData(user.company_id);
    } catch (e) {
      toast.error('Failed to add bin');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading WMS Dashboard...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <MapPin className="w-8 h-8 text-primary" />
          Warehouse Locations
        </h1>
        <p className="text-slate-500 mt-2">Manage warehouses, zones, and individual storage bins.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Warehouses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 items-end mb-6">
              <div className="space-y-1 flex-1">
                <Label>Warehouse Name</Label>
                <Input value={newLocName} onChange={e => setNewLocName(e.target.value)} placeholder="Main Distribution Center" />
              </div>
              <div className="space-y-1 flex-1">
                <Label>Address</Label>
                <Input value={newLocAddress} onChange={e => setNewLocAddress(e.target.value)} placeholder="123 Industrial Pkwy" />
              </div>
              <Button onClick={addLocation}><Plus className="w-4 h-4 mr-2" /> Add</Button>
            </div>
            
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-slate-500">No warehouses found.</TableCell></TableRow>}
                  {locations.map(loc => (
                    <TableRow key={loc.id} className={selectedWarehouseId === loc.id ? 'bg-slate-50' : ''} onClick={() => setSelectedWarehouseId(loc.id)}>
                      <TableCell className="font-medium cursor-pointer">{loc.name}</TableCell>
                      <TableCell>{loc.address}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><Box className="w-5 h-5"/> Storage Bins</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedWarehouseId ? (
              <div className="text-slate-500 text-center py-8">Select a warehouse to view or add bins.</div>
            ) : (
              <>
                <div className="flex gap-2 items-end mb-6">
                  <div className="space-y-1 flex-1">
                    <Label>Bin Label</Label>
                    <Input value={newBinLabel} onChange={e => setNewBinLabel(e.target.value)} placeholder="A1-Shelf-2" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <Label>Zone</Label>
                    <Input value={newBinZone} onChange={e => setNewBinZone(e.target.value)} placeholder="Electronics Zone" />
                  </div>
                  <Button onClick={addBin}><Plus className="w-4 h-4 mr-2" /> Add</Button>
                </div>
                
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bin Label</TableHead>
                        <TableHead>Zone</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bins.filter(b => b.warehouse_id === selectedWarehouseId).length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-slate-500">No bins in this warehouse.</TableCell></TableRow>}
                      {bins.filter(b => b.warehouse_id === selectedWarehouseId).map(bin => (
                        <TableRow key={bin.id}>
                          <TableCell className="font-mono">{bin.bin_label}</TableCell>
                          <TableCell>{bin.zone}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
