import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, X, CreditCard, Banknote, Print } from 'lucide-react';
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

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const fetchData = async () => {
    try {
      const [drugsResult, invResult, custResult] = await Promise.all([
        PharmacyAPI.getDrugs(companyId),
        PharmacyAPI.getInventory(companyId),
        PharmacyAPI.getCustomers(companyId)
      ]);
      setDrugs(drugsResult);
      setInventory(invResult);
      setCustomers(custResult);
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2">
          <Card className="p-6 border border-border bg-card mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">Available Drugs</h2>
            <div className="relative mb-4">
              <Input
                placeholder="Search drugs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {filteredDrugs.map(drug => {
                const inv = inventory.find(i => i.drug_id === drug.id && i.quantity_available > 0);
                return (
                  <button
                    key={drug.id}
                    onClick={() => addToCart(drug)}
                    className="text-left p-4 bg-muted hover:bg-muted/80 rounded-lg border border-border transition-colors"
                  >
                    <p className="font-semibold text-foreground text-sm">{drug.drug_name}</p>
                    <p className="text-xs text-muted-foreground">{drug.strength}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold text-primary">${parseFloat(drug.unit_price).toFixed(2)}</span>
                      <span className="text-xs bg-background px-2 py-1 rounded">{inv?.quantity_available} in stock</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Cart Section */}
        <div className="lg:col-span-1">
          <Card className="p-6 border border-border bg-card sticky top-6">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6" />
              Cart
            </h2>

            <div className="mb-4 pb-4 border-b border-border">
              <label className="text-sm font-medium text-foreground block mb-2">Customer</label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(cust => (
                    <SelectItem key={cust.id} value={cust.id}>{cust.customer_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {cart.map((item, idx) => (
                <div key={idx} className="bg-muted p-3 rounded-lg flex items-center justify-between group">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{item.drugName}</p>
                    <p className="text-xs text-muted-foreground">${item.unitPrice.toFixed(2)} x {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFromCart(idx)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <div className="space-y-3 border-t border-border pt-4 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (10%)</span>
                  <span className="font-medium text-foreground">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="font-bold text-lg text-primary">${total.toFixed(2)}</span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block">Payment Method</label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block">Amount Tendered</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                {amountTendered >= total && (
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      Change: ${change.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleCheckout}
              disabled={cart.length === 0 || amountTendered < total}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white h-12 font-semibold"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Complete Sale
            </Button>
          </Card>
        </div>
      </div>

      {/* Receipt Sheet */}
      <Sheet open={showReceipt} onOpenChange={setShowReceipt}>
        <SheetContent className="w-full max-w-sm overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Receipt</SheetTitle>
          </SheetHeader>
          {lastReceipt && (
            <div className="mt-6 space-y-4 font-mono text-sm">
              <div className="text-center pb-4 border-b border-border">
                <p className="font-bold">PHARMACY</p>
                <p className="text-xs text-muted-foreground">{lastReceipt.receiptNumber}</p>
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
              </div>

              <Button onClick={() => window.print()} className="w-full" variant="outline">
                <Print className="w-4 h-4 mr-2" />
                Print Receipt
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
