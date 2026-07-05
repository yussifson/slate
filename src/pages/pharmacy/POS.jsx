import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, X, CreditCard, Banknote, Printer, Search } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { usePowerSync } from '@powersync/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import PharmacyAPI from '@/api/PharmacyAPI';

export default function POS() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [drugs, setDrugs] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountTendered, setAmountTendered] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [companySettings, setCompanySettings] = useState(null);

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const fetchData = async () => {
    try {
      const [drugsResult, invResult, custResult, compResult] = await Promise.all([
        PharmacyAPI.getDrugs(companyId),
        PharmacyAPI.getInventory(companyId),
        PharmacyAPI.getCustomers(companyId),
        powerSync.execute('SELECT * FROM companies WHERE id = ?', [companyId])
      ]);
      setDrugs(drugsResult);
      setInventory(invResult);
      setCustomers(custResult);
      if (compResult.rows?.length > 0) {
        setCompanySettings(compResult.rows.item(0));
      }
    } catch (e) {
      console.error('[POS] Error:', e);
      toast.error('Failed to load data');
    }
  };

  const filteredDrugs = drugs.filter(d =>
    d.drug_name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
    inventory.some(inv => inv.drug_id === d.id && inv.quantity_available > 0)
  );

  const addToCart = (drug) => {
    const inv = inventory.find(i => i.drug_id === drug.id && i.quantity_available > 0);
    if (!inv) {
      toast.error('No stock available');
      return;
    }

    const existingItem = cart.find(item => item.inventoryId === inv.id);
    if (existingItem) {
      if (existingItem.quantity < inv.quantity_available) {
        setCart(cart.map(item =>
          item.inventoryId === inv.id
            ? {...item, quantity: item.quantity + 1}
            : item
        ));
      }
    } else {
      setCart([...cart, {
        drugId: drug.id,
        drugName: drug.drug_name,
        inventoryId: inv.id,
        quantity: 1,
        unitPrice: parseFloat(drug.unit_price),
        lineTotal: parseFloat(drug.unit_price)
      }]);
    }
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateCartQuantity = (index, delta) => {
    setCart(cart.map((item, i) => {
      if (i !== index) return item;
      const newQuantity = item.quantity + delta;
      
      const inv = inventory.find(invItem => invItem.id === item.inventoryId);
      if (inv && newQuantity > inv.quantity_available) {
        toast.error('Not enough stock available');
        return item;
      }
      
      if (newQuantity <= 0) return null; // We filter out nulls below
      
      return { 
        ...item, 
        quantity: newQuantity, 
        lineTotal: item.unitPrice * newQuantity 
      };
    }).filter(Boolean));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;
  const change = amountTendered - total;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (amountTendered < total) {
      toast.error('Insufficient payment');
      return;
    }

    try {
      const saleData = {
        receiptNumber: `RCP-${Date.now()}`,
        customerId: selectedCustomerId || null,
        items: cart,
        subtotal,
        taxAmount: tax,
        discountAmount: 0,
        grandTotal: total,
        amountPaid: amountTendered,
        changeAmount: change,
        paymentMethod,
        shiftId: null
      };

      const result = await PharmacyAPI.createSale(companyId, saleData, user.id);

      setLastReceipt({
        receiptNumber: saleData.receiptNumber,
        items: cart,
        subtotal,
        tax,
        total,
        amountPaid: amountTendered,
        change,
        paymentMethod,
        timestamp: new Date()
      });

      setShowReceipt(true);
      setCart([]);
      setAmountTendered(0);
      setSelectedCustomerId('');
      toast.success('Sale completed successfully');
      fetchData();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-background p-4 print:hidden">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground">Point of Sale</h1>
          <p className="text-muted-foreground mt-2">Process transactions and manage sales</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <Card className="p-6 border border-border/50 bg-card/60 backdrop-blur-sm rounded-3xl h-full flex flex-col shadow-sm">
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search drugs by name or generic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 h-12 rounded-2xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary text-base"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                {filteredDrugs.map(drug => {
                  const inv = inventory.find(i => i.drug_id === drug.id && i.quantity_available > 0);
                  const isOutOfStock = !inv || inv.quantity_available <= 0;
                  
                  return (
                    <button
                      key={drug.id}
                      onClick={() => !isOutOfStock && addToCart(drug)}
                      disabled={isOutOfStock}
                      className={`text-left p-5 rounded-2xl border transition-all flex flex-col justify-between min-h-[140px] relative overflow-hidden group
                        ${isOutOfStock 
                          ? 'bg-muted/30 border-border/40 opacity-60 cursor-not-allowed' 
                          : 'bg-card border-border/60 hover:shadow-md hover:border-primary/50 hover:-translate-y-0.5'}`}
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-primary rounded-bl-[100px] -mr-6 -mt-6 pointer-events-none opacity-[0.85] z-0 transition-transform group-hover:scale-110" />
                      
                      <div className="w-full relative z-10 pr-4">
                        <p className={`font-bold text-lg leading-tight break-words ${isOutOfStock ? 'text-muted-foreground' : 'text-foreground group-hover:text-primary'}`}>
                          {drug.drug_name}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">{drug.generic_name || 'Generic'}</p>
                      </div>

                      <div className="flex justify-between items-end mt-4 pt-4 border-t border-border/40 w-full">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block mb-0.5">Price</span>
                          <span className={`font-bold text-lg ${isOutOfStock ? 'text-muted-foreground' : 'text-primary'}`}>
                            ${parseFloat(drug.unit_price).toFixed(2)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block mb-0.5">Stock</span>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${isOutOfStock ? 'bg-red-100 text-red-700' : 'bg-muted/50 border border-border/50 text-foreground'}`}>
                            {inv?.quantity_available || 0} left
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <Card className="p-6 border border-border/50 bg-card/60 backdrop-blur-sm rounded-3xl sticky top-6 shadow-sm flex flex-col" style={{ maxHeight: 'calc(100vh - 100px)' }}>
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/30/30 flex items-center justify-center text-primary dark:text-primary/80">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                Current Order
              </h2>

              <div className="mb-6">
                <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground block mb-2">Customer</label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-0 focus:ring-1 focus:ring-primary">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(cust => (
                      <SelectItem key={cust.id} value={cust.id}>{cust.customer_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar mb-6 pr-2 space-y-3 min-h-[250px]">
                {cart.length === 0 ? (
                  <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border/50 rounded-2xl">
                    <ShoppingCart className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">Cart is empty</p>
                  </div>
                ) : cart.map((item, idx) => (
                  <div key={idx} className="bg-background border border-border/40 p-4 rounded-2xl flex flex-col gap-3 group shadow-sm">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground break-words">{item.drugName}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="font-medium text-primary">${item.unitPrice.toFixed(2)}</span> / unit
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFromCart(idx)}
                        className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between mt-1 pt-3 border-t border-border/30">
                      <div className="flex items-center bg-muted/50 rounded-xl border border-border/50 p-0.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => updateCartQuantity(idx, -1)}
                          className="h-7 w-7 rounded-lg hover:bg-background text-foreground"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </Button>
                        <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => updateCartQuantity(idx, 1)}
                          className="h-7 w-7 rounded-lg hover:bg-background text-foreground"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block">Total</span>
                        <span className="font-bold text-base text-primary">
                          ${(item.unitPrice * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto">
                {cart.length > 0 && (
                  <div className="bg-muted/40 p-5 rounded-3xl border border-border/50 mb-6">
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax (10%)</span>
                        <span className="font-medium text-foreground">${tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-border/50">
                        <span className="font-bold text-foreground">Total</span>
                        <span className="font-bold text-2xl text-primary dark:text-primary/80">${total.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block mb-1">Payment</label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger className="h-10 rounded-xl bg-background border-border/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Card">Card</SelectItem>
                            <SelectItem value="Check">Check</SelectItem>
                            <SelectItem value="Insurance">Insurance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block mb-1">Tendered</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            value={amountTendered || ''}
                            onChange={(e) => setAmountTendered(parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="h-10 pl-7 rounded-xl bg-background border-border/50"
                          />
                        </div>
                      </div>
                    </div>

                    {amountTendered >= total && total > 0 && (
                      <div className="mt-4 bg-primary/10 dark:bg-primary/30/30 p-3 rounded-xl border border-primary/20 dark:border-primary/40 flex justify-between items-center">
                        <span className="text-sm font-bold text-primary/30 dark:text-primary/10">Change</span>
                        <span className="font-bold text-lg text-primary/90 dark:text-primary/80">${change.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || amountTendered < total}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 rounded-2xl font-bold text-lg shadow-md border-0 disabled:opacity-50"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Checkout
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Receipt Sheet */}
      <Sheet open={showReceipt} onOpenChange={setShowReceipt}>
        <SheetContent aria-describedby={undefined} className="w-full max-w-sm overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Receipt</SheetTitle>
          </SheetHeader>
          {lastReceipt && (
            <div className="mt-6 space-y-4 font-mono text-sm">
              <div className="text-center pb-4 border-b border-border">
                {companySettings?.receipt_show_logo && companySettings?.logo_url ? (
                  <img src={companySettings.logo_url} alt="Logo" className="h-10 mx-auto mb-2" />
                ) : null}
                <p className="font-bold uppercase text-lg">{companySettings?.name || 'PHARMACY'}</p>
                {companySettings?.receipt_header && (
                  <p className="text-xs whitespace-pre-line mt-1">{companySettings.receipt_header}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">Receipt #{lastReceipt.receiptNumber}</p>
              </div>

              <div className="space-y-2">
                {lastReceipt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span>{item.drugName} x{item.quantity}</span>
                    <span>${item.lineTotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-b border-border py-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${lastReceipt.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${lastReceipt.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base mt-2">
                  <span>Total:</span>
                  <span>${lastReceipt.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Payment:</span>
                  <span>${lastReceipt.amountPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Change:</span>
                  <span>${lastReceipt.change.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Method:</span>
                  <span>{lastReceipt.paymentMethod}</span>
                </div>
              </div>

              <div className="text-center text-xs text-muted-foreground pt-4">
                <p>{lastReceipt.timestamp.toLocaleString()}</p>
                {companySettings?.receipt_footer && (
                  <p className="mt-2 whitespace-pre-line italic">{companySettings.receipt_footer}</p>
                )}
              </div>

              <Button onClick={() => window.print()} className="w-full print:hidden" variant="outline">
                <Printer className="w-4 h-4 mr-2" />
                Print Receipt
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>

      {/* Hidden Print-Only View */}
      {lastReceipt && (
        <div className="hidden print:block fixed inset-0 bg-white text-black z-[999999] p-8 font-mono max-w-sm mx-auto w-full">
          <div className="text-center pb-4 border-b border-gray-300">
            {companySettings?.receipt_show_logo && companySettings?.logo_url ? (
              <img src={companySettings.logo_url} alt="Logo" className="h-12 mx-auto mb-2 filter grayscale" />
            ) : null}
            <h1 className="font-bold text-xl uppercase">{companySettings?.name || 'PHARMACY'}</h1>
            {companySettings?.receipt_header && (
              <p className="text-sm whitespace-pre-line mt-1">{companySettings.receipt_header}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">Receipt #{lastReceipt.receiptNumber}</p>
          </div>

          <div className="py-4 space-y-2 border-b border-gray-300">
            {lastReceipt.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>{item.drugName} x{item.quantity}</span>
                <span>${item.lineTotal.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="py-4 space-y-1 text-sm border-b border-gray-300">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${lastReceipt.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>${lastReceipt.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg mt-2">
              <span>Total:</span>
              <span>${lastReceipt.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="py-4 space-y-1 text-sm border-b border-gray-300">
            <div className="flex justify-between">
              <span>Payment:</span>
              <span>${lastReceipt.amountPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Change:</span>
              <span>${lastReceipt.change.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Method:</span>
              <span>{lastReceipt.paymentMethod}</span>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500 pt-4">
            <p>{lastReceipt.timestamp.toLocaleString()}</p>
            {companySettings?.receipt_footer && (
              <p className="mt-4 whitespace-pre-line italic">{companySettings.receipt_footer}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
