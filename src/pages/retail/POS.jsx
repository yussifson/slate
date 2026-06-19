import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { ShoppingCart, Search, Plus, Minus, CreditCard, X, Receipt, ScanBarcode, UserPlus, Wallet, Banknote, History, Save, ShieldAlert} from 'lucide-react';
import { Link, useLocation} from 'react-router-dom';
import { useAuth} from '@/lib/AuthContext';
import { isRetailAdmin, isRetailCashier} from '@/lib/constants';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord} from '@/hooks/useIndustryData';
import { toast} from 'react-hot-toast';
import { usePayment} from "@/hooks/integrations/usePayment";
import { useCompanyId} from "@/hooks/useCompanyId";

export default function POS() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const companyId = useCompanyId();
 const { processPayment} = usePayment();
 
 const canAccess = isRetailAdmin(user) || isRetailCashier(user);

 // Supabase Real-time Sync Hooks
 const { data: dbRecords = [], isLoading: isDbLoading} = useIndustryRecords('product');
 const { data: customerRecords = []} = useIndustryRecords('customer');
 const { data: promotions = []} = useIndustryRecords('promotion');
 const mutateRecord = useMutateIndustryRecord();

 // Map database records
 const products = dbRecords.map(r => ({
 id: r.id,
 sku: r.data?.sku || '',
 name: r.data?.name || '',
 price: parseFloat(r.data?.price) || 0,
 stock: parseInt(r.data?.stock) || 0
}));
 
 const customers = customerRecords.map(r => ({
 id: r.id,
 name: r.data?.name || 'Unnamed Customer'
}));

 const location = useLocation();
 const [search, setSearch] = useState('');
 const [cart, setCart] = useState([]);
 const [selectedCustomerId, setSelectedCustomerId] = useState(location.state?.customerId || '');
 const [promoCode, setPromoCode] = useState('');
 const [appliedPromo, setAppliedPromo] = useState(null);

 const addToCart = (product) => {
 if (product.stock <= 0) {
 return toast.error("Product is out of stock!");
}
 setCart(prev => {
 const existing = prev.find(item => item.sku === product.sku);
 if (existing) {
 if (existing.qty >= product.stock) {
 toast.error("Cannot add more than available stock!");
 return prev;
}
 return prev.map(item => item.sku === product.sku ? { ...item, qty: item.qty + 1} : item);
}
 return [...prev, { ...product, qty: 1}];
});
};

 const updateQty = (sku, delta) => {
 const product = products.find(p => p.sku === sku);
 if (!product) return;

 setCart(prev => prev.map(item => {
 if (item.sku === sku) {
 const newQty = item.qty + delta;
 if (newQty > product.stock) {
 toast.error("Cannot exceed available stock!");
 return item;
}
 return newQty > 0 ? { ...item, qty: newQty} : item;
}
 return item;
}));
};

 const removeFromCart = (sku) => {
 setCart(prev => prev.filter(item => item.sku !== sku));
};

 const applyPromoCode = () => {
 if (!promoCode.trim()) return;
 const promo = promotions.find(p => p.data?.code === promoCode.toUpperCase() && p.data?.isActive);
 if (promo) {
 setAppliedPromo(promo.data);
 toast.success(t("promo_applied", "Promo code applied!"));
} else {
 toast.error(t("promo_invalid", "Invalid or inactive promo code"));
}
};

 const removePromo = () => {
 setAppliedPromo(null);
 setPromoCode('');
};

 const handleCheckout = async (paymentMethod) => {
 if (cart.length === 0) return toast.error("Your cart is empty");

  const saleId = `SAL-${Math.floor(1000 + Math.random() * 9000)}`;
  const saleTotal = total;

  if (paymentMethod === 'Terminal') {
    toast.success("Connecting to Card Terminal...");
    setTimeout(() => {
      toast.success("Payment successful via Terminal!");
      const payload = {
        orderId: saleId, customerId: selectedCustomerId, date: new Date().toISOString().split('T')[0],
        items: cart.map(i => ({ sku: i.sku, name: i.name, qty: i.qty, price: i.price})),
        subtotal, discount, promoCode: appliedPromo?.code, tax, total: parseFloat(saleTotal.toFixed(2)), paymentMethod: 'Card Terminal', timestamp: new Date().toISOString()
      };
      mutateRecord.mutate({ recordType: 'order', payload, status: 'Completed', searchText: `${saleId} Terminal ${selectedCustomerId}`});
      setCart([]);
      setSelectedCustomerId('');
      setAppliedPromo(null);
      setPromoCode('');
    }, 2000);
    return;
  }

  // Use production payment integration if Stripe or Paystack is selected
  if (paymentMethod === 'Stripe' || paymentMethod === 'Paystack') {
 try {
 const customerEmail = customers.find(c => c.id === selectedCustomerId)?.data?.email || 'customer@example.com';
 await processPayment({
 companyId,
 provider: paymentMethod.toLowerCase(),
 amount: parseFloat(saleTotal.toFixed(2)),
 currency: paymentMethod === 'Paystack' ? 'NGN' : 'USD',
 customerEmail,
 invoiceId: saleId
});
 // processPayment will redirect to Stripe/Paystack checkout URL if successful.
 // We still save the order as 'Pending' in our DB before redirecting.
 const payload = {
 orderId: saleId, customerId: selectedCustomerId, date: new Date().toISOString().split('T')[0],
 items: cart.map(i => ({ sku: i.sku, name: i.name, qty: i.qty, price: i.price})),
 subtotal, discount, promoCode: appliedPromo?.code, tax, total: parseFloat(saleTotal.toFixed(2)), paymentMethod, timestamp: new Date().toISOString()
};
 mutateRecord.mutate({ recordType: 'order', payload, status: 'Pending', searchText: `${saleId} ${paymentMethod} ${selectedCustomerId}`});
 return; // Stop execution here because the user will be redirected
} catch (err) {
 return; // error is handled by usePayment toast
}
}

 const payload = {
 orderId: saleId,
 customerId: selectedCustomerId,
 date: new Date().toISOString().split('T')[0],
 items: cart.map(i => ({ sku: i.sku, name: i.name, qty: i.qty, price: i.price})),
 subtotal,
 discount,
 promoCode: appliedPromo?.code,
 tax,
 total: parseFloat(saleTotal.toFixed(2)),
 paymentMethod,
 timestamp: new Date().toISOString()
};

 mutateRecord.mutate({
 recordType: 'order',
 payload,
 status: 'Completed',
 searchText: `${saleId} ${paymentMethod} ${selectedCustomerId}`
}, {
 onSuccess: () => {
 toast.success(`Sale ${saleId} completed successfully!`);
 // Proactively decrement stock for purchased items
 cart.forEach(item => {
 const original = dbRecords.find(r => r.id === item.id);
 if (original) {
 const updatedPayload = {
 ...original.data,
 stock: Math.max(0, (parseInt(original.data?.stock) || 0) - item.qty)
};
 mutateRecord.mutate({
 id: original.id,
 recordType: 'product',
 payload: updatedPayload,
 status: original.status,
 searchText: original.search_text
});
}
});
 setCart([]);
 setSelectedCustomerId('');
 setAppliedPromo(null);
 setPromoCode('');
},
 onError: (err) => {
 toast.error('Failed to complete checkout: ' + err.message);
}
});
};

 const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
 
 let discount = 0;
 if (appliedPromo) {
 if (appliedPromo.discountType === 'percentage') {
 discount = subtotal * (appliedPromo.discountValue / 100);
} else {
 discount = Math.min(appliedPromo.discountValue, subtotal);
}
}

 const afterDiscount = subtotal - discount;
 const tax = afterDiscount * 0.08; // 8% tax
 const total = afterDiscount + tax;

 const filtered = products.filter(p => 
 p.name?.toLowerCase().includes(search.toLowerCase()) || 
 p.sku?.includes(search)
 );

 if (!canAccess) {
 return (
 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500 h-[calc(100vh-100px)]">
 <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-md-full flex items-center justify-center mb-6">
 <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-500" />
 </div>
 <h2 className="text-2xl font-semibold text-foreground mb-3 tracking-[-0.02em]">Access Restricted</h2>
 <p className="text-[#71717a] dark:text-gray-400 max-w-md mx-auto mb-8">
 Your current role does not grant you permission to use the Point of Sale system.
 </p>
 <Button asChild variant="outline">
 <Link to="/retail-dashboard">Return to Dashboard</Link>
 </Button>
 </div>
 );
}

 return (
 <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6 pb-6">
 {/* Product List */}
 <div className="flex-1 flex flex-col bg-muted/50 rounded-md-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden md:h-full min-h-[40vh]">
 <div className="p-4 bg-card border-b border-primary/40 flex gap-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="relative flex-1">
 <ShoppingCart className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717a] dark:text-gray-400" />
 <Input placeholder="Search products by name or SKU..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-12 text-lg bg-muted" />
 </div>
 </div>
 <div className="flex-1 p-4 overflow-y-auto">
 {isDbLoading ? (
 <div className="py-12 text-center text-[#71717a] dark:text-gray-400">{t("loading_pos_register", "Loading POS register...")}</div>
 ) : filtered.length === 0 ? (
 <div className="py-12 text-center text-[#71717a] dark:text-gray-400 bg-card rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <ScanBarcode className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse" />
 <p className="font-semibold">{t("no_pos_products_found", "No POS products found.")}</p>
 <p className="text-xs mt-1 tracking-[0.04em]">{t(
 "please_add_active_products_to_",
 "Please add active products to the Inventory page first."
 )}</p>
 </div>
 ) : (
 <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
 {filtered.map(product => {
 return (
 <div key={product.sku} onClick={() => addToCart(product)} className="bg-card p-4 rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:border-orange-300 transition-all cursor-pointer flex flex-col h-32 select-none active:scale-95 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex-1">
 <p className="font-semibold text-card-foreground leading-tight line-clamp-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{product.name}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 font-mono mt-1 tracking-[0.04em]">{product.sku}</p>
 </div>
 <div className="flex justify-between items-end mt-2">
 <span className="text-lg font-black text-orange-600">${product.price.toFixed(2)}</span>
 <span className="text-xs font-semibold text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{product.stock} {t("in_stock", "in stock")}</span>
 </div>
 </div>
 );
})}
 </div>
 )}
 </div>
 </div>
 
 {/* Cart Sidebar */}
 <div className="w-full md:w-[450px] flex flex-col bg-card rounded-md-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-xl md:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none z-10 md:h-full flex-shrink-0 flex-grow-0 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-5 border-b border-primary/40 bg-muted/30">
 <h2 className="font-semibold flex items-center gap-2 text-lg"><ShoppingCart className="w-5 h-5"/> {t("current_sale", "Current Sale")}</h2>
 <span className="bg-orange-700 px-2 py-1 rounded-md text-xs font-mono tracking-[0.04em]">{cart.length} {t("items", "items")}</span>
 </div>
 
 <div className="p-3 bg-muted border-b border-primary/40">
 <select 
 value={selectedCustomerId} 
 onChange={e => setSelectedCustomerId(e.target.value)} 
 className="w-full bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 >
 <option value="">Walk-in Customer</option>
 {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
 </select>
 </div>

 <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30 min-h-0">
 {cart.length === 0 ? (
 <div className="h-full flex flex-col items-center justify-center text-[#71717a] dark:text-gray-400 opacity-50">
 <ShoppingCart className="w-16 h-16 mb-4 animate-bounce" />
 <p className="font-medium text-lg">{t("cart_is_empty", "Cart is empty")}</p>
 <p className="text-sm">{t(
 "click_products_on_the_left_to_",
 "Click products on the left to add items"
 )}</p>
 </div>
 ) : (
 cart.map(item => {
 return (
 <div key={item.sku} className="bg-card p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex items-center justify-between group hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex-1">
 <p className="font-semibold text-sm text-card-foreground leading-tight hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{item.name}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">${item.price.toFixed(2)} {t("each", "each")}</p>
 </div>
 <div className="flex items-center gap-3">
 <div className="flex items-center bg-muted rounded-lg">
 <button onClick={() => updateQty(item.sku, -1)} className="p-1 hover:bg-slate-200 rounded-md-l-md text-[#71717a] dark:text-gray-400"><Minus className="w-4 h-4"/></button>
 <span className="w-8 text-center font-semibold text-sm">{item.qty}</span>
 <button onClick={() => updateQty(item.sku, 1)} className="p-1 hover:bg-slate-200 rounded-md-r-md text-[#71717a] dark:text-gray-400"><Plus className="w-4 h-4"/></button>
 </div>
 <span className="font-black text-card-foreground w-16 text-right hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">${(item.price * item.qty).toFixed(2)}</span>
 <button onClick={() => removeFromCart(item.sku)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><X className="w-4 h-4"/></button>
 </div>
 </div>
 );
})
 )}
 </div>
 
 <div className="p-5 bg-card border-t border-primary/40 space-y-3 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex justify-between items-center text-sm">
 <span className="text-[#71717a] dark:text-gray-400 font-medium">{t("subtotal", "Subtotal")}</span>
 <span className="font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">${subtotal.toFixed(2)}</span>
 </div>
 
 {/* Promo Input / Display */}
 {appliedPromo ? (
 <div className="flex justify-between items-center text-sm bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-primary/40">
 <div className="flex items-center gap-2">
 <span className="text-primary/90 font-semibold text-xs uppercase bg-primary/20 px-1.5 py-0.5 rounded-md tracking-[0.04em]">{appliedPromo.code}</span>
 <button onClick={removePromo} className="text-primary hover:text-primary/80"><X className="w-3 h-3" /></button>
 </div>
 <span className="font-semibold text-primary">-${discount.toFixed(2)}</span>
 </div>
 ) : (
 <div className="flex gap-2">
 <Input 
 placeholder={t("promo_code", "Promo code")}
 value={promoCode}
 onChange={e => setPromoCode(e.target.value.toUpperCase())}
 className="h-8 text-xs uppercase tracking-[0.04em]"
 />
 <Button variant="secondary" size="sm" onClick={applyPromoCode} className="h-8 text-xs tracking-[0.04em]">{t("apply", "Apply")}</Button>
 </div>
 )}

 <div className="flex justify-between items-center text-sm">
 <span className="text-[#71717a] dark:text-gray-400 font-medium">{t("tax_8", "Tax (8%)")}</span>
 <span className="font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">${tax.toFixed(2)}</span>
 </div>
 <div className="flex justify-between items-center text-2xl pt-3 border-t border-primary/40 mt-2 tracking-[-0.02em]">
 <span className="font-black text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("total", "Total")}</span>
 <span className="font-black text-orange-600">${total.toFixed(2)}</span>
 </div>
 
  <div className="grid grid-cols-2 gap-3 pt-4">
  <Button onClick={() => handleCheckout('Save')} variant="outline" className="h-14 font-semibold text-foreground bg-muted" disabled={cart.length === 0}><Receipt className="w-5 h-5 mr-2 text-[#71717a] dark:text-gray-400"/> {t("save", "Cash/Save")}</Button>
  <Button onClick={() => handleCheckout('Terminal')} className="h-14 font-semibold text-base bg-blue-600 hover:bg-blue-700 text-white" disabled={cart.length === 0}><CreditCard className="w-5 h-5 mr-1"/> {t("terminal", "Terminal")}</Button>
  <Button onClick={() => handleCheckout('Stripe')} className="h-14 font-semibold text-base bg-primary hover:bg-primary/90 text-white col-span-2" disabled={cart.length === 0}><CreditCard className="w-5 h-5 mr-2"/> {t("pay_online", "Pay Online")}</Button>
  </div>
 </div>
 </div>
 </div>
 );
}
