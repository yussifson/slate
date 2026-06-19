import { useTranslation } from "react-i18next";
import { useState } from 'react';
import {Warehouse as WarehouseIcon, Box, ArrowDownToLine, ArrowUpFromLine, ScanBarcode, Zap, Lock, CheckCircle, Search} from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { usePowerSync } from '@powersync/react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import AIDocumentParser from '@/components/shared/AIDocumentParser';
import { OrbitLoader } from "@/components/ui/orbit-loader";

export default function Warehouse() {
  const { t } = useTranslation();
  const powerSync = usePowerSync();
  const { user } = useAuth();
  const companyId = user?.app_metadata?.company_id || '00000000-0000-0000-0000-000000000000';
  
  const { data: subData } = useSubscription();
  const plan = subData?.subscription_plan || 'starter';
  const isProOrAbove = user?.role === 'super_admin' || plan === 'pro' || plan === 'enterprise';

  const [searchQuery, setSearchQuery] = useState('');
  const [manualEntry, setManualEntry] = useState({ sku: '', name: '', quantity: '', location: '' });
  const [isReceiving, setIsReceiving] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  // Fetch Inventory
  const { data: inventory } = useQuery({
    queryKey: ['logistics_warehouse_inventory', companyId],
    queryFn: async () => {
      const res = await powerSync.execute(
        'SELECT * FROM logistics_warehouse_inventory WHERE company_id = ? ORDER BY created_at DESC', 
        [companyId]
      );
      return res.rows?._array || [];
    }
  });

  const handleManualReceive = async () => {
    if (!manualEntry.sku || !manualEntry.quantity || !manualEntry.name) {
      toast({ title: "Validation", description: "SKU, Name, and Quantity are required.", variant: "destructive" });
      return;
    }
    
    setIsReceiving(true);
    try {
      const existing = inventory?.find(i => i.sku === manualEntry.sku);
      const qtyNum = parseInt(manualEntry.quantity);

      let itemId = existing?.id;

      if (existing) {
        await powerSync.execute(
          `UPDATE logistics_warehouse_inventory SET quantity = quantity + ?, location = ? WHERE id = ?`,
          [qtyNum, manualEntry.location || existing.location, existing.id]
        );
      } else {
        itemId = crypto.randomUUID();
        await powerSync.execute(
          `INSERT INTO logistics_warehouse_inventory (id, company_id, sku, name, quantity, location) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [itemId, companyId, manualEntry.sku, manualEntry.name, qtyNum, manualEntry.location]
        );
      }

      // Log the scan
      await powerSync.execute(
        `INSERT INTO logistics_warehouse_scans (id, company_id, item_id, scan_type, quantity_change, scanned_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), companyId, itemId, 'inbound', qtyNum, user?.email || 'Unknown User']
      );
      
      setManualEntry({ sku: '', name: '', quantity: '', location: '' });
      toast({ title: "Item Received", description: `${qtyNum}x ${manualEntry.name} added to inventory.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to receive item.", variant: "destructive" });
    } finally {
      setIsReceiving(false);
    }
  };

  const handleAIExtracted = async (data) => {
    // The AIDocumentParser returns a JSON object. We expect it to find SKU, Name, and Quantity.
    const extSku = data.SKU || data.sku || data.ItemNumber || data['Part Number'];
    const extName = data.Name || data.name || data.Product || data.Description;
    const extQty = data.Quantity || data.quantity || data.Qty || 1;

    if (!extSku || !extName) {
      toast({ title: "AI Parse Failed", description: "Could not clearly identify SKU and Name from the image.", variant: "destructive" });
      return;
    }

    setIsProcessingAI(true);
    try {
      const qtyNum = parseInt(extQty) || 1;
      const existing = inventory?.find(i => i.sku === extSku);
      let itemId = existing?.id;

      if (existing) {
        await powerSync.execute(
          `UPDATE logistics_warehouse_inventory SET quantity = quantity + ? WHERE id = ?`,
          [qtyNum, existing.id]
        );
      } else {
        itemId = crypto.randomUUID();
        await powerSync.execute(
          `INSERT INTO logistics_warehouse_inventory (id, company_id, sku, name, quantity, location) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [itemId, companyId, String(extSku), String(extName), qtyNum, 'Receiving Dock']
        );
      }

      await powerSync.execute(
        `INSERT INTO logistics_warehouse_scans (id, company_id, item_id, scan_type, quantity_change, scanned_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), companyId, itemId, 'inbound', qtyNum, user?.email || 'AI Auto-Receive']
      );

      toast({ title: "AI Auto-Received", description: `Successfully scanned and received ${qtyNum}x ${extName}.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to process AI data.", variant: "destructive" });
    } finally {
      setIsProcessingAI(false);
    }
  };

  const filteredInventory = inventory?.filter(i => 
    i.sku.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground flex items-center gap-2 tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <WarehouseIcon className="w-6 h-6 text-primary" />
            {t("smart_warehouse", "Smart 3PL Warehouse")}
          </h1>
          <p className="text-[#71717a] dark:text-gray-400 mt-1">
            {t("warehouse_desc", "Manage inventory levels and automate inbound receiving with AI barcode/label scanning.")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Receiving Dock */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm sticky top-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <h2 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
              <ArrowDownToLine className="w-5 h-5 text-primary" />
              Receiving Dock
            </h2>

            {/* AI Auto-Receive Paywall */}
            <div className="relative mb-8 rounded-xl overflow-hidden border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 bg-primary/5 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm">
               <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                 <Zap className="w-4 h-4 text-primary fill-primary" /> Smart Label Scan
               </h3>
               <p className="text-xs text-[#71717a] dark:text-gray-400 mb-4 tracking-[0.04em]">
                 Upload a photo of a box label or packing slip. Our AI will automatically parse the SKU, Name, and Quantity to receive it instantly.
               </p>

               <div className="relative">
                 {!isProOrAbove && (
                    <div className="absolute -inset-2 bg-background/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-[0.5px] border-black/9 dark:border-white/8">
                       <Lock className="w-5 h-5 text-amber-500 mb-1" />
                       <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider tracking-[0.04em]">Pro Plan Required</span>
                    </div>
                 )}
                 <div className="relative z-0">
                    <AIDocumentParser 
                      onExtracted={handleAIExtracted}
                      fieldsContext="SKU (or Item Number), Product Name (or Description), and Quantity"
                    />
                 </div>
               </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
               <div className="h-px bg-border-[0.5px] border-black/9 dark:border-white/8 flex-1"></div>
               <span className="text-xs text-[#71717a] dark:text-gray-400 uppercase tracking-wider font-semibold tracking-[0.04em]">OR Manual Entry</span>
               <div className="h-px bg-border-[0.5px] border-black/9 dark:border-white/8 flex-1"></div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 tracking-[0.04em]">SKU / Barcode</label>
                 <Input placeholder="e.g. WH-1002" value={manualEntry.sku} onChange={e => setManualEntry({...manualEntry, sku: e.target.value})} />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Product Name</label>
                 <Input placeholder="e.g. Industrial Filter" value={manualEntry.name} onChange={e => setManualEntry({...manualEntry, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                   <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Quantity</label>
                   <Input type="number" placeholder="50" value={manualEntry.quantity} onChange={e => setManualEntry({...manualEntry, quantity: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                   <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Location (Bin)</label>
                   <Input placeholder="e.g. A12" value={manualEntry.location} onChange={e => setManualEntry({...manualEntry, location: e.target.value})} />
                 </div>
              </div>

              <Button onClick={handleManualReceive} disabled={isReceiving} className="w-full mt-2" variant="outline">
                {isReceiving ? <OrbitLoader size="sm" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Receive Manually
              </Button>
            </div>
          </div>
        </div>

        {/* Inventory List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
             <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                <Box className="w-5 h-5 text-primary" />
                Current Inventory
             </h2>
             <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
                <Input placeholder="Search SKU or Name..." className="pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
             </div>
          </div>

          <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                   <thead className="text-xs text-[#71717a] dark:text-gray-400 uppercase bg-muted/50 border-b border-[0.5px] border-black/9 dark:border-white/8 tracking-[0.04em]">
                      <tr>
                         <th className="px-6 py-4 font-semibold">Product</th>
                         <th className="px-6 py-4 font-semibold">SKU</th>
                         <th className="px-6 py-4 font-semibold">Location</th>
                         <th className="px-6 py-4 font-semibold text-right">In Stock</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-border">
                      {filteredInventory?.map(item => (
                         <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4">
                               <div className="font-semibold text-foreground">{item.name}</div>
                            </td>
                            <td className="px-6 py-4 text-[#71717a] dark:text-gray-400 font-mono text-xs tracking-[0.04em]">
                               <div className="flex items-center gap-2"><ScanBarcode className="w-3 h-3" /> {item.sku}</div>
                            </td>
                            <td className="px-6 py-4">
                               <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-semibold tracking-[0.04em]">{item.location || 'Unassigned'}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <span className={`font-semibold text-base ${item.quantity < 10 ? 'text-destructive' : 'text-emerald-600'}`}>{item.quantity}</span>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
             {(!filteredInventory || filteredInventory.length === 0) && (
                <div className="text-center p-12 text-[#71717a] dark:text-gray-400">
                   <Box className="w-12 h-12 mx-auto mb-4 opacity-20" />
                   <h3 className="font-semibold text-lg">Inventory Empty</h3>
                   <p className="text-sm">Receive items on the dock to populate inventory.</p>
                </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
}
