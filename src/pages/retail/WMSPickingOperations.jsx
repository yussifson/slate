import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { powerSync } from '@/api/PowerSyncConnector';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PackageSearch, ScanBarcode, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WMSPickingOperations() {
  const { user } = useAuth();
  const [waves, setWaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.company_id) loadWaves(user.company_id);
  }, [user]);

  const loadWaves = async (companyId) => {
    try {
      const res = await powerSync.execute('SELECT * FROM univ_retail_picking_waves WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
      setWaves(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('Failed to load waves', e);
    } finally {
      setLoading(false);
    }
  };

  const generateWave = async () => {
    if (!user?.company_id) return;
    try {
      await powerSync.execute(
        'INSERT INTO univ_retail_picking_waves (id, company_id, status) VALUES (uuid(), ?, ?)',
        [user.company_id, 'Pending']
      );
      toast.success('Wave Pick Generated from pending orders');
      loadWaves(user.company_id);
    } catch (e) {
      toast.error('Failed to generate wave');
    }
  };

  const completeWave = async (waveId) => {
    try {
      await powerSync.execute(
        'UPDATE univ_retail_picking_waves SET status = ? WHERE id = ?',
        ['Completed', waveId]
      );
      toast.success('Wave marked as completed');
      loadWaves(user.company_id);
    } catch (e) {
      toast.error('Failed to complete wave');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading WMS Picking...</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <PackageSearch className="w-8 h-8 text-primary" />
            Picking & Packing Operations
          </h1>
          <p className="text-slate-500 mt-2">Generate wave picks and scan barcodes to fulfill orders.</p>
        </div>
        <Button onClick={generateWave} size="lg" className="gap-2">
          <ScanBarcode className="w-5 h-5" /> Generate Wave Pick
        </Button>
      </div>

      <div className="grid gap-6">
        {waves.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-12 text-center text-slate-500">
            No active picking waves. Click "Generate Wave Pick" to assign orders.
          </div>
        ) : (
          waves.map(wave => (
            <Card key={wave.id} className="overflow-hidden">
              <div className={`h-2 ${wave.status === 'Completed' ? 'bg-green-500' : 'bg-primary'}`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">Wave #{wave.id.split('-')[0].toUpperCase()}</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">Generated: {new Date(wave.created_at).toLocaleString()}</p>
                </div>
                <Badge variant={wave.status === 'Completed' ? 'default' : 'secondary'} className={wave.status === 'Completed' ? 'bg-green-500 hover:bg-green-600' : ''}>
                  {wave.status}
                </Badge>
              </CardHeader>
              <CardContent className="py-4">
                <div className="flex items-center gap-8 text-sm">
                  <div className="flex flex-col">
                    <span className="text-slate-500">Assigned To</span>
                    <span className="font-medium">Unassigned</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500">Items to Pick</span>
                    <span className="font-medium">14 (Mock Estimate)</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500">Zones</span>
                    <span className="font-medium">A1, B4</span>
                  </div>
                </div>
              </CardContent>
              {wave.status !== 'Completed' && (
                <CardFooter className="bg-slate-50 border-t border-slate-100 p-4 flex justify-between items-center">
                  <span className="text-sm text-slate-500 flex items-center gap-2"><ScanBarcode className="w-4 h-4"/> Ready for barcode scanner</span>
                  <Button onClick={() => completeWave(wave.id)} className="gap-2">
                    Complete Wave <CheckCircle2 className="w-4 h-4" />
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
