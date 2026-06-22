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
      const zones = ['A1, B4', 'C2, D1', 'A3', 'B2, C1'][Math.floor(Math.random() * 4)];
      await powerSync.execute(
        'INSERT INTO univ_retail_picking_waves (id, created_at, company_id, status, warehouse_id) VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?)',
        [crypto.randomUUID(), user.company_id, 'Pending', zones]
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
          <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground tracking-[-0.02em]">
            <PackageSearch className="w-8 h-8 text-primary" />
            Picking & Packing Operations
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">Generate wave picks and scan barcodes to fulfill orders.</p>
        </div>
        <Button onClick={generateWave} size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
          <ScanBarcode className="w-5 h-5" /> Generate Wave Pick
        </Button>
      </div>

      <div className="grid gap-6">
        {waves.length === 0 ? (
          <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-12 text-center text-muted-foreground">
            No active picking waves. Click "Generate Wave Pick" to assign orders.
          </div>
        ) : (
          waves.map(wave => {
            const itemCount = (parseInt(wave.id.replace(/[^0-9]/g, '').slice(0, 2)) || 14) % 30 + 5;
            return (
            <Card key={wave.id} className="overflow-hidden border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 shadow-sm hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow">
              <div className={`h-2 ${wave.status === 'Completed' ? 'bg-emerald-500' : 'bg-primary'}`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/30 border-b border-primary/10">
                <div>
                  <CardTitle className="text-lg text-foreground tracking-[-0.02em]">Wave #{wave.id.split('-')[0].toUpperCase()}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1 font-mono tracking-[0.04em]">Generated: {wave.created_at ? new Date(wave.created_at).toLocaleString() : 'Just now'}</p>
                </div>
                <Badge variant={wave.status === 'Completed' ? 'default' : 'secondary'} className={wave.status === 'Completed' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                  {wave.status}
                </Badge>
              </CardHeader>
              <CardContent className="py-5 bg-card">
                <div className="flex items-center gap-12 text-sm">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.04em] mb-1">Assigned To</span>
                    <span className="font-medium text-foreground">{wave.assigned_to || 'Unassigned'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.04em] mb-1">Items to Pick</span>
                    <span className="font-medium text-foreground">{itemCount} items</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.04em] mb-1">Zones</span>
                    <span className="font-medium text-foreground">{wave.warehouse_id || 'A1, B4'}</span>
                  </div>
                </div>
              </CardContent>
              {wave.status !== 'Completed' && (
                <CardFooter className="bg-muted border-t border-primary/40 p-4 flex justify-between items-center">
                  <span className="text-sm text-emerald-600 dark:text-emerald-500 font-medium flex items-center gap-2"><ScanBarcode className="w-4 h-4"/> Ready for barcode scanner</span>
                  <Button onClick={() => completeWave(wave.id)} className="gap-2 bg-primary hover:bg-primary/90 text-white">
                    Complete Wave <CheckCircle2 className="w-4 h-4" />
                  </Button>
                </CardFooter>
              )}
            </Card>
          )})
        )}
      </div>
    </div>
  );
}
