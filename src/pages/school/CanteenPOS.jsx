import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UtensilsCrossed, CreditCard, ShoppingCart, Plus, Minus, Search, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CanteenPOS() {
  const { t } = useTranslation();
  
  const menuItems = [
    { id: 1, name: 'Margherita Pizza', price: 4.50, category: 'Hot Meals', img: '🍕' },
    { id: 2, name: 'Chicken Salad', price: 5.00, category: 'Healthy', img: '🥗' },
    { id: 3, name: 'Vegan Wrap', price: 4.00, category: 'Healthy', img: '🌯' },
    { id: 4, name: 'Orange Juice', price: 1.50, category: 'Drinks', img: '🧃' },
    { id: 5, name: 'Chocolate Muffin', price: 2.00, category: 'Snacks', img: '🧁' },
    { id: 6, name: 'Fruit Bowl', price: 3.00, category: 'Healthy', img: '🍎' }
  ];

  const [cart, setCart] = useState([]);

  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    else setCart([...cart, { ...item, qty: 1 }]);
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  return (
    <div className="flex flex-col h-[85vh] space-y-4">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <UtensilsCrossed className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Canteen POS</h1>
            <p className="text-sm text-muted-foreground">Manage campus cafeteria sales and wallets</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
        {/* Menu Section */}
        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search menu..." className="pl-9 bg-card" />
            </div>
            <Button variant="outline" className="bg-card">Hot Meals</Button>
            <Button variant="outline" className="bg-card">Drinks</Button>
            <Button variant="outline" className="bg-card">Snacks</Button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
            {menuItems.map(item => (
              <div key={item.id} onClick={() => addToCart(item)} className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center text-center group">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center text-4xl mb-3 group-hover:scale-110 transition-transform">
                  {item.img}
                </div>
                <h3 className="font-bold text-sm mb-1">{item.name}</h3>
                <p className="text-primary font-black">${item.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-full md:w-96 bg-card rounded-2xl border border-border shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Current Order</h3>
            <span className="bg-primary text-white text-xs px-2 py-1 rounded-full font-bold">{cart.length} items</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <ShoppingCart className="w-12 h-12 mb-2" />
                <p>Cart is empty</p>
              </div>
            ) : (
              cart.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-xl">{item.img}</div>
                    <div>
                      <p className="font-bold text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">${item.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="w-6 h-6 rounded-md bg-muted flex items-center justify-center hover:bg-border"><Minus className="w-3 h-3" /></button>
                    <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                    <button className="w-6 h-6 rounded-md bg-muted flex items-center justify-center hover:bg-border"><Plus className="w-3 h-3" /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-border bg-muted/10 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-bold">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-bold">$0.00</span>
            </div>
            <div className="border-t border-dashed border-border pt-2 flex justify-between items-center text-xl font-black">
              <span>Total</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button variant="outline" className="gap-2 h-12"><QrCode className="w-4 h-4" /> Student ID</Button>
              <Button className="gap-2 h-12 bg-green-600 hover:bg-green-700 text-white"><CreditCard className="w-4 h-4" /> Pay Now</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
