import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Plus, Minus, CreditCard, X, Receipt, ScanBarcode, Banknote, ShieldAlert, Sparkles, Bot, Lock, Printer } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { isRetailAdmin, isRetailCashier } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { usePayment } from "@/hooks/integrations/usePayment";
import { useCompanyId } from "@/hooks/useCompanyId";
import { generateText } from '@/lib/cloudflareAI';
import { usePaywall } from '@/hooks/usePaywall';
import { usePowerSync } from '@powersync/react';

export default function POS() {
  const { isProOrAbove } = usePaywall();
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const { processPayment } = usePayment();

  const canAccess = isRetailAdmin(user) || isRetailCashier(user);

  // Supabase Real-time Sync Hooks
  const powerSync = usePowerSync();
  const [dbRecords, setDbRecords] = useState([]);
  const [customerRecords, setCustomerRecords] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [isDbLoading, setIsDbLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchRecords = async () => {
      setIsDbLoading(true);
      try {
        const prodRes = await powerSync.execute('SELECT * FROM univ_retail_products WHERE company_id = ? AND status = ?', [companyId, 'Active']);
        if(active) setDbRecords(prodRes.rows._array || Array.from(prodRes.rows));

        const custRes = await powerSync.execute('SELECT * FROM univ_retail_customers WHERE company_id = ?', [companyId]);
        if(active) setCustomerRecords(custRes.rows._array || Array.from(custRes.rows));

        const promoRes = await powerSync.execute('SELECT * FROM univ_retail_promotions WHERE company_id = ? AND status = ?', [companyId, 'Active']);
        if(active) setPromotions(promoRes.rows._array || Array.from(promoRes.rows));
      } catch(e){}
      setIsDbLoading(false);
    };
    if (companyId) fetchRecords();
    return () => { active = false; };
  }, [companyId]);

  // Map database records
  const products = dbRecords.map(r => ({
    id: r.id,
    sku: r.sku || '',
    name: r.name || '',
    price: parseFloat(r.price) || 0,
    stock: parseInt(r.stock) || 0
  }));

  const customers = customerRecords.map(r => ({
    id: r.id,
    name: r.name || 'Unnamed Customer',
    email: r.email || ''
  }));

  const location = useLocation();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(location.state?.customerId || '');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);

  // Cash Payment Modal State
  const [showCashModal, setShowCashModal] = useState(false);
  const [amountTendered, setAmountTendered] = useState('');

  // Receipt Preview State
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);

  // ─── Barcode Scanner Listener ───────────────────────
  const barcodeBufferRef = useRef('');
  const barcodeTimerRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      if (e.key === 'Enter' && barcodeBufferRef.current.length >= 3) {
        const scannedSku = barcodeBufferRef.current.trim();
        const product = products.find(p => p.sku === scannedSku || (p.sku || '').toLowerCase() === (scannedSku || '').toLowerCase());
        if (product) {
          addToCart(product);
          toast.success(`Scanned: ${product.name}`);
        } else {
          toast.error(`No product found for SKU: ${scannedSku}`);
        }
        barcodeBufferRef.current = '';
        return;
      }

      if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
        clearTimeout(barcodeTimerRef.current);
        barcodeTimerRef.current = setTimeout(() => { barcodeBufferRef.current = ''; }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  // ─── AI Upsell ──────────────────────────────────────
  const handleAIUpsell = async () => {
    if (!isProOrAbove) {
      toast.error('AI Insights are available on Pro or Enterprise plans.');
      return;
    }
    if (cart.length === 0) {
      toast.error('Add items to cart first.');
      return;
    }
    setIsGenerating(true);
    setAiInsight('');
    try {
      const itemsList = cart.map(i => i.name).join(', ');
      const prompt = `You are a Retail AI Upsell Recommender. The customer has the following items in their cart: ${itemsList}. 
Suggest 1 or 2 complementary products they might want to buy right now. Keep it brief and persuasive.`;
      const response = await generateText(prompt);
      const responseText = typeof response === 'string' ? response : JSON.stringify(response);
      setAiInsight(responseText);
    } catch (e) {
      toast.error('AI Upsell failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Cart Operations ────────────────────────────────
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
        return prev.map(item => item.sku === product.sku ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (sku, delta) => {
    const product = products.find(p => p.sku === sku);
    if (!product) return;
    setCart(prev => prev.map(item => {
      if (item.sku === sku) {
        const newQty = item.qty + delta;
        if (newQty > product.stock) { toast.error("Cannot exceed available stock!"); return item; }
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (sku) => {
    setCart(prev => prev.filter(item => item.sku !== sku));
  };

  // ─── Promo Codes ────────────────────────────────────
  const applyPromoCode = () => {
    if (!promoCode.trim()) return;
    const promo = promotions.find(p => p.promo_code === promoCode.toUpperCase());
    if (promo) { setAppliedPromo(promo); toast.success(t("promo_applied", "Promo code applied!")); }
    else { toast.error(t("promo_invalid", "Invalid or inactive promo code")); }
  };

  const removePromo = () => { setAppliedPromo(null); setPromoCode(''); };

  // ─── Receipt Generation ─────────────────────────────
  const generateReceiptData = (saleId, paymentMethod, amtTendered = null) => {
    const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;
    return {
      receiptNumber, saleId,
      date: new Date().toLocaleString(),
      storeName: user?.user_metadata?.company_name || 'Retail Store',
      cashier: user?.user_metadata?.full_name || user?.email || 'Cashier',
      customer: customers.find(c => c.id === selectedCustomerId)?.name || 'Walk-in Customer',
      items: cart.map(i => ({ name: i.name, sku: i.sku, qty: i.qty, price: i.price, lineTotal: i.price * i.qty })),
      subtotal, discount, promoCode: appliedPromo?.promo_code || null, tax, total,
      paymentMethod,
      amountTendered: amtTendered,
      changeDue: amtTendered ? amtTendered - total : null,
    };
  };

  const printReceipt = (receipt) => {
    const w = window.open('', '_blank', 'width=400,height=600');
    if (!w) { toast.error('Please allow pop-ups to print receipts.'); return; }
    w.document.write(`<html><head><title>Receipt ${receipt.receiptNumber}</title>
<style>body{font-family:'Courier New',monospace;font-size:12px;padding:20px;max-width:300px;margin:0 auto}.center{text-align:center}.bold{font-weight:bold}.line{border-top:1px dashed #000;margin:8px 0}.row{display:flex;justify-content:space-between;margin:2px 0}.total-row{font-size:16px;font-weight:bold}h2{margin:4px 0}</style></head><body>
<div class="center"><h2>${receipt.storeName}</h2><p>Receipt #${receipt.receiptNumber}</p><p>${receipt.date}</p></div><div class="line"></div>
<p><strong>Cashier:</strong> ${receipt.cashier}</p><p><strong>Customer:</strong> ${receipt.customer}</p><div class="line"></div>
${receipt.items.map(i => `<div class="row"><span>${i.qty}x ${i.name}</span><span>$${i.lineTotal.toFixed(2)}</span></div>`).join('')}
<div class="line"></div><div class="row"><span>Subtotal</span><span>$${receipt.subtotal.toFixed(2)}</span></div>
${receipt.discount > 0 ? `<div class="row"><span>Discount${receipt.promoCode ? ' (' + receipt.promoCode + ')' : ''}</span><span>-$${receipt.discount.toFixed(2)}</span></div>` : ''}
<div class="row"><span>Tax (8%)</span><span>$${receipt.tax.toFixed(2)}</span></div><div class="line"></div>
<div class="row total-row"><span>TOTAL</span><span>$${receipt.total.toFixed(2)}</span></div><div class="line"></div>
<div class="row"><span>Payment</span><span>${receipt.paymentMethod}</span></div>
${receipt.amountTendered ? `<div class="row"><span>Tendered</span><span>$${receipt.amountTendered.toFixed(2)}</span></div><div class="row bold"><span>Change</span><span>$${receipt.changeDue.toFixed(2)}</span></div>` : ''}
<div class="line"></div><div class="center"><p>Thank you for shopping with us!</p><p>Sale ID: ${receipt.saleId}</p></div></body></html>`);
    w.document.close(); w.focus(); w.print();
  };

  // ─── Clear Cart Helper ──────────────────────────────
  const resetAfterSale = () => {
    setCart([]); setSelectedCustomerId(''); setAppliedPromo(null); setPromoCode('');
  };

  const decrementStock = async () => {
    for (const item of cart) {
      const original = dbRecords.find(r => r.id === item.id);
      if (original) {
        const newStock = Math.max(0, parseInt(original.stock) - item.qty);
        await powerSync.execute(`UPDATE univ_retail_products SET stock=?, status=? WHERE id=?`, 
          [newStock, newStock > 0 ? 'Active' : 'Out of Stock', original.id]
        );
      }
    }
    const res = await powerSync.execute('SELECT * FROM univ_retail_products WHERE company_id = ? AND status = ?', [companyId, 'Active']);
    setDbRecords(res.rows._array || Array.from(res.rows));
  };

  // ─── Checkout Handler ───────────────────────────────
  const handleCheckout = async (paymentMethod) => {
    if (cart.length === 0) return toast.error("Your cart is empty");

    const saleId = `SAL-${Math.floor(1000 + Math.random() * 9000)}`;
    const saleTotal = total;

    // Cash Payment – open the cash modal
    if (paymentMethod === 'Cash') {
      setShowCashModal(true);
      return;
    }

    // Card Terminal
    if (paymentMethod === 'Terminal') {
      toast.success("Connecting to Card Terminal...");
      setTimeout(async () => {
        toast.success("Payment successful via Terminal!");
        const receipt = generateReceiptData(saleId, 'Card Terminal');
        await powerSync.execute(`INSERT INTO univ_retail_orders (id, created_at, company_id, order_id, customer, date, total, status, items) VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?)`, 
          [crypto.randomUUID(), companyId, saleId, selectedCustomerId || null, new Date().toISOString().split('T')[0], parseFloat(saleTotal.toFixed(2)), 'Completed', JSON.stringify(cart.map(i => ({ sku: i.sku, name: i.name, qty: i.qty, price: i.price })))]
        );
        await powerSync.execute(`INSERT INTO univ_retail_sales (id, created_at, company_id, sale_id, date, cashier, method, items, total, status) VALUES (?, CURRENT_TIMESTAMP, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, 'Completed')`, 
          [crypto.randomUUID(), companyId, saleId, user?.user_metadata?.full_name || user?.email || 'Cashier', 'Terminal', cart.reduce((acc, i) => acc + i.qty, 0), parseFloat(saleTotal.toFixed(2))]
        );
        await decrementStock();
        setLastReceipt(receipt); setShowReceipt(true);
        resetAfterSale();
      }, 2000);
      return;
    }

    // Stripe / Paystack (online)
    if (paymentMethod === 'Stripe' || paymentMethod === 'Paystack') {
      try {
        const customerEmail = customers.find(c => c.id === selectedCustomerId)?.email || 'customer@example.com';
        await processPayment({
          companyId, provider: (paymentMethod || '').toLowerCase(),
          amount: parseFloat(saleTotal.toFixed(2)),
          currency: paymentMethod === 'Paystack' ? 'NGN' : 'USD',
          customerEmail, invoiceId: saleId
        });
        await powerSync.execute(`INSERT INTO univ_retail_orders (id, created_at, company_id, order_id, customer, date, total, status, items) VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?)`, 
          [crypto.randomUUID(), companyId, saleId, selectedCustomerId || null, new Date().toISOString().split('T')[0], parseFloat(saleTotal.toFixed(2)), 'Pending', JSON.stringify(cart.map(i => ({ sku: i.sku, name: i.name, qty: i.qty, price: i.price })))]
        );
        await powerSync.execute(`INSERT INTO univ_retail_sales (id, created_at, company_id, sale_id, date, cashier, method, items, total, status) VALUES (?, CURRENT_TIMESTAMP, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, 'Pending')`, 
          [crypto.randomUUID(), companyId, saleId, user?.user_metadata?.full_name || user?.email || 'Cashier', paymentMethod, cart.reduce((acc, i) => acc + i.qty, 0), parseFloat(saleTotal.toFixed(2))]
        );
        return;
      } catch (err) { return; }
    }

    // Default / Save
    try {
      await powerSync.execute(`INSERT INTO univ_retail_orders (id, created_at, company_id, order_id, customer, date, total, status, items) VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?)`, 
        [crypto.randomUUID(), companyId, saleId, selectedCustomerId || null, new Date().toISOString().split('T')[0], parseFloat(saleTotal.toFixed(2)), 'Completed', JSON.stringify(cart.map(i => ({ sku: i.sku, name: i.name, qty: i.qty, price: i.price })))]
      );
      await powerSync.execute(`INSERT INTO univ_retail_sales (id, created_at, company_id, sale_id, date, cashier, method, items, total, status) VALUES (?, CURRENT_TIMESTAMP, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, 'Completed')`, 
        [crypto.randomUUID(), companyId, saleId, user?.user_metadata?.full_name || user?.email || 'Cashier', paymentMethod, cart.reduce((acc, i) => acc + i.qty, 0), parseFloat(saleTotal.toFixed(2))]
      );
      toast.success(`Sale ${saleId} completed successfully!`);
      await decrementStock(); resetAfterSale();
    } catch (err) {
      toast.error('Failed to complete checkout: ' + err.message);
    }
  };

  // ─── Cash Checkout Confirmation ─────────────────────
  const confirmCashCheckout = async () => {
    const tendered = parseFloat(amountTendered);
    if (isNaN(tendered) || tendered < total) {
      toast.error(`Amount tendered must be at least $${total.toFixed(2)}`);
      return;
    }
    const saleId = `SAL-${Math.floor(1000 + Math.random() * 9000)}`;
    const changeDue = tendered - total;
    const receipt = generateReceiptData(saleId, 'Cash', tendered);

    try {
      await powerSync.execute(`INSERT INTO univ_retail_orders (id, created_at, company_id, order_id, customer, date, total, status, items) VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?)`, 
        [crypto.randomUUID(), companyId, saleId, selectedCustomerId || null, new Date().toISOString().split('T')[0], parseFloat(total.toFixed(2)), 'Completed', JSON.stringify(cart.map(i => ({ sku: i.sku, name: i.name, qty: i.qty, price: i.price })))]
      );
      await powerSync.execute(`INSERT INTO univ_retail_sales (id, created_at, company_id, sale_id, date, cashier, method, items, total, status) VALUES (?, CURRENT_TIMESTAMP, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, 'Completed')`, 
        [crypto.randomUUID(), companyId, saleId, user?.user_metadata?.full_name || user?.email || 'Cashier', 'Cash', cart.reduce((acc, i) => acc + i.qty, 0), parseFloat(total.toFixed(2))]
      );
      toast.success(`Cash Sale complete! Change due: $${changeDue.toFixed(2)}`);
      await decrementStock();
      setShowCashModal(false); setAmountTendered('');
      setLastReceipt(receipt); setShowReceipt(true);
      resetAfterSale();
    } catch (err) {
      toast.error('Failed: ' + err.message);
    }
  };

  // ─── Calculations ───────────────────────────────────
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  let discount = 0;
  if (appliedPromo) {
    if (appliedPromo.discount_type === 'percentage') {
      discount = subtotal * (appliedPromo.discount_value / 100);
    } else {
      discount = Math.min(appliedPromo.discount_value, subtotal);
    }
  }

  const afterDiscount = subtotal - discount;
  const tax = afterDiscount * 0.08;
  const total = afterDiscount + tax;

  const filtered = products.filter(p =>
    (p.name || '').toLowerCase().includes((search || '').toLowerCase()) ||
    p.sku?.includes(search)
  );

  // ─── Access Restriction ─────────────────────────────
  if (!canAccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500 h-[calc(100vh-100px)]">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
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

  // ─── Main Render ────────────────────────────────────
  return (
    <div className="h-[calc(100vh-200px)] flex flex-col md:flex-row gap-6 pb-6">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col bg-muted/50 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden md:h-full min-h-[40vh]">
        <div className="p-4 bg-card border-b border-primary/40 flex gap-4">
          <div className="relative flex-1">
            <ShoppingCart className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717a] dark:text-gray-400" />
            <Input placeholder="Search products by name or SKU..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-12 text-lg bg-muted" />
          </div>
          <div className="flex items-center gap-2 text-xs text-[#71717a] dark:text-gray-400 bg-muted px-3 py-1 rounded-lg border border-dashed border-primary/30">
            <ScanBarcode className="w-4 h-4 text-emerald-500" />
            <span>Scanner Ready</span>
          </div>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          {isDbLoading ? (
            <div className="py-12 text-center text-[#71717a] dark:text-gray-400">{t("loading_pos_register", "Loading POS register...")}</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-[#71717a] dark:text-gray-400 bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40">
              <ScanBarcode className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse" />
              <p className="font-semibold">{t("no_pos_products_found", "No POS products found.")}</p>
              <p className="text-xs mt-1 tracking-[0.04em]">{t("please_add_active_products_to_", "Please add active products to the Inventory page first.")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(product => (
                <div key={product.sku} onClick={() => addToCart(product)} className="bg-card p-4 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:border-orange-300 transition-all cursor-pointer flex flex-col h-32 select-none active:scale-95 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] duration-200">
                  <div className="flex-1">
                    <p className="font-semibold text-card-foreground leading-tight line-clamp-2">{product.name}</p>
                    <p className="text-xs text-[#71717a] dark:text-gray-400 font-mono mt-1 tracking-[0.04em]">{product.sku}</p>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <span className="text-lg font-black text-orange-600">${product.price.toFixed(2)}</span>
                    <span className="text-xs font-semibold text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{product.stock} {t("in_stock", "in stock")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Cart Sidebar ──────────────────────────────── */}
      <div className="w-full md:w-[450px] flex flex-col bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden shadow-xl md:shadow-none z-10 md:h-full flex-shrink-0 flex-grow-0">
        <div className="p-5 border-b border-primary/40 bg-muted/30">
          <div className="flex justify-between items-center w-full">
            <h2 className="font-semibold flex items-center gap-2 text-lg"><ShoppingCart className="w-5 h-5"/> {t("current_sale", "Current Sale")}</h2>
            <Button size="sm" variant="outline" className="gap-1 bg-primary/5 text-primary border-primary/20 h-8 text-xs" onClick={handleAIUpsell} disabled={isGenerating}>
              {isGenerating ? <Sparkles className="w-3 h-3 animate-spin" /> : (!isProOrAbove ? <Lock className="w-3 h-3" /> : <Bot className="w-3 h-3" />)}
              {isGenerating ? 'Analyzing...' : 'AI Upsell'}
            </Button>
          </div>
          <span className="bg-orange-700 px-2 py-1 rounded-md text-xs font-mono tracking-[0.04em] text-white mt-1 inline-block">{cart.length} {t("items", "items")}</span>
        </div>

        <div className="p-3 bg-muted border-b border-primary/40">
          <select value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}
            className="w-full bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
            <option value="">Walk-in Customer</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30 min-h-0">
          {aiInsight && (
            <div className="bg-primary/5 p-3 rounded-xl border border-primary/20 mb-3">
              <h3 className="text-xs font-semibold text-primary mb-1 flex items-center gap-2"><Bot className="w-3 h-3"/> AI Recommended Upsell</h3>
              <p className="text-xs text-foreground font-medium">{aiInsight}</p>
            </div>
          )}
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#71717a] dark:text-gray-400 opacity-50">
              <ShoppingCart className="w-16 h-16 mb-4 animate-bounce" />
              <p className="font-medium text-lg">{t("cart_is_empty", "Cart is empty")}</p>
              <p className="text-sm">{t("click_products_on_the_left_to_", "Click products on the left to add items")}</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.sku} className="bg-card p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex items-center justify-between group hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                <div className="flex-1">
                  <p className="font-semibold text-sm text-card-foreground leading-tight">{item.name}</p>
                  <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">${item.price.toFixed(2)} {t("each", "each")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-muted rounded-lg">
                    <button onClick={() => updateQty(item.sku, -1)} className="p-1 hover:bg-slate-200 rounded-l-md text-[#71717a] dark:text-gray-400"><Minus className="w-4 h-4"/></button>
                    <span className="w-8 text-center font-semibold text-sm">{item.qty}</span>
                    <button onClick={() => updateQty(item.sku, 1)} className="p-1 hover:bg-slate-200 rounded-r-md text-[#71717a] dark:text-gray-400"><Plus className="w-4 h-4"/></button>
                  </div>
                  <span className="font-black text-card-foreground w-16 text-right">${(item.price * item.qty).toFixed(2)}</span>
                  <button onClick={() => removeFromCart(item.sku)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><X className="w-4 h-4"/></button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ─── Totals & Payment Buttons ──────────────── */}
        <div className="p-5 bg-card border-t border-primary/40 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[#71717a] dark:text-gray-400 font-medium">{t("subtotal", "Subtotal")}</span>
            <span className="font-semibold text-card-foreground">${subtotal.toFixed(2)}</span>
          </div>

          {appliedPromo ? (
            <div className="flex justify-between items-center text-sm bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border-[0.5px] border-primary/40">
              <div className="flex items-center gap-2">
                <span className="text-primary/90 font-semibold text-xs uppercase bg-primary/20 px-1.5 py-0.5 rounded-md tracking-[0.04em]">{appliedPromo.code}</span>
                <button onClick={removePromo} className="text-primary hover:text-primary/80"><X className="w-3 h-3" /></button>
              </div>
              <span className="font-semibold text-primary">-${discount.toFixed(2)}</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input placeholder={t("promo_code", "Promo code")} value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} className="h-8 text-xs uppercase tracking-[0.04em]" />
              <Button variant="secondary" size="sm" onClick={applyPromoCode} className="h-8 text-xs tracking-[0.04em]">{t("apply", "Apply")}</Button>
            </div>
          )}

          <div className="flex justify-between items-center text-sm">
            <span className="text-[#71717a] dark:text-gray-400 font-medium">{t("tax_8", "Tax (8%)")}</span>
            <span className="font-semibold text-card-foreground">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-2xl pt-3 border-t border-primary/40 mt-2 tracking-[-0.02em]">
            <span className="font-black text-card-foreground">{t("total", "Total")}</span>
            <span className="font-black text-orange-600">${total.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <Button onClick={() => handleCheckout('Cash')} variant="outline" className="h-14 font-semibold text-foreground bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30" disabled={cart.length === 0}>
              <Banknote className="w-5 h-5 mr-2 text-emerald-600"/> Cash
            </Button>
            <Button onClick={() => handleCheckout('Terminal')} className="h-14 font-semibold text-base bg-blue-600 hover:bg-blue-700 text-white" disabled={cart.length === 0}>
              <CreditCard className="w-5 h-5 mr-1"/> {t("terminal", "Terminal")}
            </Button>
            <Button onClick={() => handleCheckout('Stripe')} className="h-14 font-semibold text-base bg-primary hover:bg-primary/90 text-white col-span-2" disabled={cart.length === 0}>
              <CreditCard className="w-5 h-5 mr-2"/> {t("pay_online", "Pay Online")}
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Cash Payment Modal ────────────────────────── */}
      {showCashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 border border-primary/40 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold flex items-center gap-2"><Banknote className="w-6 h-6 text-emerald-600"/>Cash Payment</h2>
              <button onClick={() => { setShowCashModal(false); setAmountTendered(''); }} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5"/></button>
            </div>

            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">Total Due</p>
                <p className="text-4xl font-black text-emerald-700 dark:text-emerald-400 tracking-[-0.02em]">${total.toFixed(2)}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em] mb-1 block">Amount Tendered</label>
                <Input type="number" step="0.01" min={total} placeholder={`Minimum $${total.toFixed(2)}`}
                  value={amountTendered} onChange={e => setAmountTendered(e.target.value)}
                  className="h-14 text-2xl font-bold text-center" autoFocus />
              </div>

              {amountTendered && parseFloat(amountTendered) >= total && (
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 animate-in fade-in duration-200">
                  <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">Change Due</p>
                  <p className="text-3xl font-black text-blue-700 dark:text-blue-400 tracking-[-0.02em]">${(parseFloat(amountTendered) - total).toFixed(2)}</p>
                </div>
              )}

              {/* Quick Cash Denomination Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[Math.ceil(total), Math.ceil(total / 5) * 5, Math.ceil(total / 10) * 10, Math.ceil(total / 20) * 20]
                  .filter((v, i, a) => a.indexOf(v) === i && v >= total).slice(0, 4).map(amt => (
                  <Button key={amt} variant="outline" size="sm" onClick={() => setAmountTendered(String(amt))} className="h-10 text-sm font-semibold">${amt}</Button>
                ))}
              </div>

              <Button onClick={confirmCashCheckout} className="w-full h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={!amountTendered || parseFloat(amountTendered) < total}>
                <Banknote className="w-5 h-5 mr-2"/> Complete Cash Sale
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Receipt Preview Modal ─────────────────────── */}
      {showReceipt && lastReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-primary/40 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><Receipt className="w-5 h-5 text-primary"/>Sale Complete!</h2>
              <button onClick={() => { setShowReceipt(false); setLastReceipt(null); }} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5"/></button>
            </div>

            <div className="bg-muted rounded-xl p-4 text-sm space-y-2 font-mono mb-4 max-h-64 overflow-y-auto">
              <p className="text-center font-bold text-base">{lastReceipt.storeName}</p>
              <p className="text-center text-xs text-muted-foreground">{lastReceipt.date}</p>
              <p className="text-center text-xs text-muted-foreground">Receipt #{lastReceipt.receiptNumber}</p>
              <hr className="border-dashed border-muted-foreground/30"/>
              {lastReceipt.items.map((item, idx) => (
                <div key={idx} className="flex justify-between"><span>{item.qty}x {item.name}</span><span>${item.lineTotal.toFixed(2)}</span></div>
              ))}
              <hr className="border-dashed border-muted-foreground/30"/>
              <div className="flex justify-between"><span>Subtotal</span><span>${lastReceipt.subtotal.toFixed(2)}</span></div>
              {lastReceipt.discount > 0 && <div className="flex justify-between text-primary"><span>Discount</span><span>-${lastReceipt.discount.toFixed(2)}</span></div>}
              <div className="flex justify-between"><span>Tax</span><span>${lastReceipt.tax.toFixed(2)}</span></div>
              <hr className="border-dashed border-muted-foreground/30"/>
              <div className="flex justify-between font-bold text-base"><span>TOTAL</span><span>${lastReceipt.total.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Payment</span><span>{lastReceipt.paymentMethod}</span></div>
              {lastReceipt.amountTendered && (
                <>
                  <div className="flex justify-between"><span>Tendered</span><span>${lastReceipt.amountTendered.toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold text-emerald-600"><span>Change</span><span>${lastReceipt.changeDue.toFixed(2)}</span></div>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setShowReceipt(false); setLastReceipt(null); }}>Done</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={() => printReceipt(lastReceipt)}>
                <Printer className="w-4 h-4 mr-2"/> Print Receipt
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
