import React, { useState } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { ShoppingBag, CreditCard, Banknote, Search, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivPOS() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock Products
  const products = [
    { id: 1, name: 'Premium Espresso', price: 4.50, category: 'Beverage', color: 'bg-orange-100 text-orange-700' },
    { id: 2, name: 'Latte', price: 5.00, category: 'Beverage', color: 'bg-amber-100 text-amber-700' },
    { id: 3, name: 'Avocado Toast', price: 12.00, category: 'Food', color: 'bg-emerald-100 text-emerald-700' },
    { id: 4, name: 'Blueberry Muffin', price: 3.50, category: 'Food', color: 'bg-purple-100 text-purple-700' },
    { id: 5, name: 'Cold Brew', price: 4.00, category: 'Beverage', color: 'bg-blue-100 text-blue-700' },
    { id: 6, name: 'Bagel w/ Cream Cheese', price: 4.50, category: 'Food', color: 'bg-yellow-100 text-yellow-700' }
  ];

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleCheckout = async (method) => {
    if (cart.length === 0) return toast.error('Cart is empty');
    if (!companyId) return toast.error('No company selected');
    
    const newReceipt = {
      company_id: companyId,
      receipt_number: `REC-${Math.floor(Math.random() * 1000000)}`,
      total_amount: Number(totalAmount) || 0,
      payment_method: method,
      items: cart
    };

    try {
      const { error } = await supabase.from('univ_pos').insert(newReceipt);
      if (error) throw error;
      toast.success(`Payment of $${totalAmount.toFixed(2)} successful!`);
      setCart([]);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Checkout failed');
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden lg:flex-row gap-6 p-4 sm:p-6 ${view !== 'Default' ? 'hide-default' : ''}">
      
      {/* Product Grid Area */}
      <div className="view-header flex-1 flex flex-col min-h-[400px]">
        <div className="mb-6 relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground text-lg shadow-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-6 pr-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((p, i) => (
              <motion.button 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                key={p.id}
                onClick={() => addToCart(p)}
                className={`p-4 rounded-2xl border border-border/50 shadow-sm flex flex-col items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all ${p.color}`}
              >
                <div className="w-12 h-12 rounded-full bg-card/50 dark:bg-black/20 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-6 h-6 opacity-70" />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-sm leading-tight">{p.name}</h3>
                  <p className="text-xs font-semibold opacity-70 mt-1">${p.price.toFixed(2)}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Area */}
      <div className="w-full lg:w-96 flex flex-col bg-card border border-border rounded-2xl shadow-sm shrink-0 overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <h2 className="text-xl font-bold text-foreground">Current Order</h2>
          <p className="text-xs text-muted-foreground mt-1">{cart.length} items</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center bg-background border border-border p-3 rounded-xl">
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-foreground truncate pr-2">{item.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">${item.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                  <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-background rounded shadow-sm text-foreground hover:bg-muted transition-colors">-</button>
                  <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-background rounded shadow-sm text-foreground hover:bg-muted transition-colors">+</button>
                </div>
                <div className="font-bold text-sm w-12 text-right text-foreground">
                  ${(item.price * item.qty).toFixed(2)}
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-red-500 transition-colors p-1" title="Remove item">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-60 min-h-[200px]">
              <ShoppingBag className="w-12 h-12 mb-3" />
              <p>Cart is empty</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border bg-muted/10 space-y-4">
          <div className="flex justify-between items-center font-bold text-xl text-foreground">
            <span>Total</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button 
              disabled={cart.length === 0}
              onClick={() => handleCheckout('Cash')}
              className="flex items-center justify-center gap-2 p-3 bg-card border border-border rounded-xl text-foreground font-semibold hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Banknote className="w-5 h-5 text-emerald-600" /> Cash
            </button>
            <button 
              disabled={cart.length === 0}
              onClick={() => handleCheckout('Card')}
              className="flex items-center justify-center gap-2 p-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
            >
              <CreditCard className="w-5 h-5" /> Card
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
