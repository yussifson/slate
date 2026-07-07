import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from "react-i18next";
import { Package, Printer, Plus, Minus, Search, Layers } from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Barcode from 'react-barcode';

export default function BarcodeManagement() {
  const { t } = useTranslation();
  const powerSync = usePowerSync();
  const companyId = useCompanyId();
  
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [printQueue, setPrintQueue] = useState([]); // [{product, quantity}]
  
  useEffect(() => {
    let active = true;
    const fetchProducts = async () => {
      if (!companyId) return;
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_retail_products WHERE company_id = ? ORDER BY name ASC',
          [companyId]
        );
        if (active) {
          setProducts(res.rows._array || Array.from(res.rows));
        }
      } catch (e) {
        console.error('Error fetching products', e);
      }
    };
    fetchProducts();
    return () => { active = false; };
  }, [companyId, powerSync]);

  const filteredProducts = products.filter(p => 
    (p.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
    (p.sku && (p.sku || '').toLowerCase().includes((searchQuery || '').toLowerCase()))
  );

  const addToQueue = (product) => {
    setPrintQueue(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setPrintQueue(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQ = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQ };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
    <div className="p-4 md:p-8 max-w-7xl mx-auto hide-on-print">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .hide-on-print {
            display: none !important;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }
          .print-label {
            width: 2in;
            height: 1in;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            page-break-inside: avoid;
            text-align: center;
            padding: 4px;
          }
        }
      `}</style>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Printer className="w-8 h-8 text-primary" />
          Barcode Management
        </h1>
        <p className="text-slate-500 mt-2">Select products to generate standard thermal barcodes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Product Selection */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  className="pl-9"
                  placeholder="Search products by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {filteredProducts.map(product => (
                  <div key={product.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{product.name}</p>
                        <p className="text-xs text-slate-500">SKU: {product.sku || 'N/A'} • Stock: {product.stock_quantity || 0}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => addToQueue(product)}>
                      Add to Print Queue
                    </Button>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="text-center text-slate-500 py-8">No products found.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Print Queue */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Print Queue</CardTitle>
              <CardDescription>{printQueue.reduce((acc, item) => acc + item.quantity, 0)} labels ready</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto mb-6 pr-2">
                {printQueue.map(item => (
                  <div key={item.product.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                    <div className="truncate flex-1 mr-2">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-xs text-slate-500">{item.product.sku}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, -1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {printQueue.length === 0 && (
                  <div className="text-center py-10 flex flex-col items-center text-slate-400">
                    <Layers className="w-12 h-12 mb-3 opacity-20" />
                    <p>Queue is empty</p>
                  </div>
                )}
              </div>

              <Button 
                className="w-full" 
                onClick={handlePrint}
                disabled={printQueue.length === 0}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Labels
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

      {/* Hidden Print Container */}
      <div className="print-container hidden">
        {printQueue.map((item, index) => {
          const labels = [];
          for (let i = 0; i < item.quantity; i++) {
            labels.push(
              <div key={`${item.product.id}-${i}`} className="print-label">
                <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 2px 0', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.product.name}
                </p>
                {item.product.sku ? (
                  <Barcode value={item.product.sku} width={1.5} height={40} fontSize={12} margin={0} displayValue={true} />
                ) : (
                  <p style={{ fontSize: '10px' }}>NO SKU</p>
                )}
                <p style={{ fontSize: '12px', margin: '2px 0 0 0' }}>${item.product.price || '0.00'}</p>
              </div>
            );
          }
          return labels;
        })}
      </div>
    </>
  );
}
