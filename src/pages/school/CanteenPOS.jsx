import React, { useState, useMemo } from 'react';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toast from 'react-hot-toast';
import SchoolPageShell from '@/components/school/SchoolPageShell';

export default function CanteenPOS() {
  const { data: menuItems = [], isLoading: loadingMenu } = useIndustryRecords('school_canteen_item');
  const { data: sales = [], isLoading: loadingSales } = useIndustryRecords('school_canteen_sale');
  const { mutateAsync: saveRecord } = useMutateIndustryRecord();
  const { mutateAsync: deleteRecord } = useDeleteIndustryRecord();

  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [customerName, setCustomerName] = useState('');
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenuItemId, setEditingMenuItemId] = useState(null);
  const [menuData, setMenuData] = useState({ name: '', category: 'Main Meal', price: 0, available: true, description: '' });

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.data?.date === todayStr);
  const todayRevenue = todaySales.reduce((sum, s) => sum + (Number(s.data?.total) || 0), 0);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.item_id === item.id);
      if (existing) return prev.map(i => i.item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { item_id: item.id, item_name: item.data.name, price: Number(item.data.price), quantity: 1 }];
    });
  };

  const updateQuantity = (itemId, delta) => {
    setCart(prev => prev.map(i => {
      if (i.item_id === itemId) {
        const newQ = i.quantity + delta;
        return newQ > 0 ? { ...i, quantity: newQ } : i;
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(i => i.item_id !== itemId));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    const payload = { items: cart, total: cartTotal, payment_method: paymentMethod, customer_name: customerName, date: new Date().toISOString().split('T')[0], time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    try {
      await saveRecord({ recordType: 'school_canteen_sale', payload, searchText: `${customerName} ${paymentMethod}`, status: 'Completed' });
      toast.success('Sale completed successfully!');
      setCart([]);
      setCustomerName('');
    } catch (err) { toast.error('Failed to complete sale'); }
  };

  const openMenuModal = (record = null) => {
    if (record) {
      setEditingMenuItemId(record.id);
      setMenuData({ name: record.data.name || '', category: record.data.category || 'Main Meal', price: Number(record.data.price) || 0, available: record.data.available ?? true, description: record.data.description || '' });
    } else {
      setEditingMenuItemId(null);
      setMenuData({ name: '', category: 'Main Meal', price: 0, available: true, description: '' });
    }
    setIsMenuModalOpen(true);
  };

  const saveMenuItem = async () => {
    if (!menuData.name || menuData.price <= 0) return toast.error('Name and valid price required');
    try {
      await saveRecord({ id: editingMenuItemId, recordType: 'school_canteen_item', payload: menuData, searchText: `${menuData.name} ${menuData.category}`, status: menuData.available ? 'Active' : 'Inactive' });
      toast.success('Menu item saved');
      setIsMenuModalOpen(false);
    } catch (e) { toast.error('Error saving item'); }
  };

  const deleteMenuItem = async (id) => {
    if (window.confirm('Delete this menu item?')) {
      try {
        await deleteRecord({ id, recordType: 'school_canteen_item' });
        toast.success('Item deleted');
      } catch (e) { toast.error('Error deleting item'); }
    }
  };

  const isLoading = loadingMenu || loadingSales;
  const inputCls = "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <SchoolPageShell
      title="Canteen POS"
      subtitle="Point of sale registers and canteen menu management"
      breadcrumb={['School', 'Canteen']}
      actions={
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400 px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm shadow-sm">
          <CreditCard className="h-4 w-4" /> Today's Revenue: GHS {todayRevenue.toFixed(2)}
        </div>
      }
    >
      <Tabs defaultValue="pos" className="w-full space-y-6">
        <div className="flex justify-between items-center bg-card border border-border/50 rounded-xl p-4 shadow-sm flex-wrap gap-4">
          <TabsList className="bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="pos" className="rounded-md px-4 py-1.5 text-sm font-medium transition-colors">Point of Sale</TabsTrigger>
            <TabsTrigger value="menu" className="rounded-md px-4 py-1.5 text-sm font-medium transition-colors">Menu Management</TabsTrigger>
            <TabsTrigger value="history" className="rounded-md px-4 py-1.5 text-sm font-medium transition-colors">Sales History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="menu" className="m-0">
            <Button onClick={() => openMenuModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 h-9 text-xs font-semibold">
              <Plus className="h-4 w-4 mr-1.5" /> Add Item
            </Button>
          </TabsContent>
        </div>

        {/* POS Tab */}
        <TabsContent value="pos" className="grid grid-cols-1 lg:grid-cols-3 gap-6 m-0">
          {/* Menu Items Grid */}
          <div className="lg:col-span-2 bg-card p-6 rounded-xl border border-border/50 shadow-sm flex flex-col h-[calc(100vh-320px)] min-h-[450px]">
            <h2 className="font-bold text-base mb-4">Select Items</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto flex-1 pr-1">
              {menuItems.filter(i => i.data?.available).map(item => (
                <div key={item.id} onClick={() => addToCart(item)} className="bg-muted/30 hover:bg-muted/50 border border-border/50 hover:border-indigo-400 p-4 rounded-xl cursor-pointer hover:shadow-md transition-all flex flex-col justify-between h-28 group">
                  <span className="font-semibold text-foreground text-sm line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">{item.data.name}</span>
                  <div className="flex justify-between items-end mt-2">
                    <span className="text-[10px] text-muted-foreground bg-card border border-border/50 px-2 py-0.5 rounded-full font-medium">{item.data.category}</span>
                    <span className="font-bold text-indigo-600 text-sm">GHS {Number(item.data.price).toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {menuItems.length === 0 && <p className="text-muted-foreground text-sm col-span-full text-center py-10">No items available. Add some in Menu Management.</p>}
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="bg-card rounded-xl border border-border/50 shadow-sm flex flex-col h-[calc(100vh-320px)] min-h-[450px] overflow-hidden">
            <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-indigo-600" />
              <h2 className="font-bold text-base">Current Order</h2>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm">Cart is empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.item_id} className="flex justify-between items-center bg-muted/20 p-3 rounded-xl border border-border/30">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="font-semibold text-xs text-foreground truncate">{item.item_name}</p>
                      <p className="text-[10px] text-muted-foreground">GHS {item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button variant="outline" size="icon" className="h-6 w-6 rounded-md border-border/50" onClick={() => updateQuantity(item.item_id, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-6 w-6 rounded-md border-border/50" onClick={() => updateQuantity(item.item_id, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-500 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10" onClick={() => removeFromCart(item.item_id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-border/50 bg-muted/20 space-y-4">
              <div className="flex justify-between items-center text-base font-bold text-foreground">
                <span>Total Amount:</span>
                <span className="text-indigo-600 text-lg">GHS {cartTotal.toFixed(2)}</span>
              </div>
              
              <div className="space-y-2">
                <Input placeholder="Customer Name (Optional)" value={customerName} onChange={e => setCustomerName(e.target.value)} className="bg-background h-10 border-border/50 text-sm" />
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={inputCls}>
                  <option value="Cash">Cash Payment</option>
                  <option value="Mobile Money">Mobile Money (MoMo)</option>
                </select>
              </div>

              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 rounded-lg shadow-sm text-sm" onClick={handleCheckout} disabled={cart.length === 0}>
                Complete Order
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Menu Management Tab */}
        <TabsContent value="menu" className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden m-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">Loading menu items...</td></tr>
                ) : menuItems.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-16 text-center text-muted-foreground">No menu items found. Click "Add Item" to catalog.</td></tr>
                ) : menuItems.map(item => (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4 font-semibold text-foreground">{item.data.name}</td>
                    <td className="px-5 py-4 text-muted-foreground">{item.data.category}</td>
                    <td className="px-5 py-4 font-bold text-foreground">GHS {Number(item.data.price).toFixed(2)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${item.data.available ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20'}`}>
                        {item.data.available ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-8 hover:bg-muted" onClick={() => openMenuModal(item)}>Edit</Button>
                        <Button variant="ghost" size="sm" className="h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10" onClick={() => deleteMenuItem(item.id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Sales History Tab */}
        <TabsContent value="history" className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden m-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date / Time</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Items Sold</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment Method</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">Loading sales history...</td></tr>
                ) : sales.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-16 text-center text-muted-foreground">No sales recorded yet.</td></tr>
                ) : sales.slice().reverse().map(sale => (
                  <tr key={sale.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-foreground text-sm">{sale.data.date}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5"><Clock className="w-3 h-3 text-amber-500" />{sale.data.time}</p>
                    </td>
                    <td className="px-5 py-4 text-foreground font-medium">{sale.data.customer_name || 'Walk-in Customer'}</td>
                    <td className="px-5 py-4 text-muted-foreground max-w-xs truncate" title={sale.data.items?.map(i => `${i.quantity}x ${i.item_name}`).join(', ')}>
                      {sale.data.items?.map(i => `${i.quantity}x ${i.item_name}`).join(', ')}
                    </td>
                    <td className="px-5 py-4">
                      <span className="bg-muted text-muted-foreground px-2.5 py-1 rounded-md text-xs font-semibold">{sale.data.payment_method}</span>
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-indigo-600">GHS {Number(sale.data.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Menu Item Dialog */}
      <Dialog open={isMenuModalOpen} onOpenChange={setIsMenuModalOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>{editingMenuItemId ? 'Edit Item' : 'Add Menu Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Item Name *</Label>
              <Input value={menuData.name} onChange={e => setMenuData({...menuData, name: e.target.value})} placeholder="e.g. Jollof Rice" className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <select value={menuData.category} onChange={e => setMenuData({...menuData, category: e.target.value})} className={`w-full ${inputCls}`}>
                  <option value="Main Meal">Main Meal</option>
                  <option value="Snack">Snack</option>
                  <option value="Drink">Drink</option>
                  <option value="Fruit">Fruit</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Price (GHS) *</Label>
                <Input type="number" step="0.5" value={menuData.price} onChange={e => setMenuData({...menuData, price: Number(e.target.value)})} className="h-10" />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="available" checked={menuData.available} onChange={e => setMenuData({...menuData, available: e.target.checked})} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <Label htmlFor="available" className="cursor-pointer text-sm font-medium">Item is currently available</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMenuModalOpen(false)}>Cancel</Button>
            <Button onClick={saveMenuItem} className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SchoolPageShell>
  );
}
