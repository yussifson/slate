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

export default function CanteenPOS() {
  // Data hooks
  const { data: menuItems = [], isLoading: loadingMenu } = useIndustryRecords('school_canteen_item');
  const { data: sales = [], isLoading: loadingSales } = useIndustryRecords('school_canteen_sale');
  const { mutateAsync: saveRecord } = useMutateIndustryRecord();
  const { mutateAsync: deleteRecord } = useDeleteIndustryRecord();

  // POS State
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [customerName, setCustomerName] = useState('');

  // Menu Management State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenuItemId, setEditingMenuItemId] = useState(null);
  const [menuData, setMenuData] = useState({
    name: '',
    category: 'Main Meal',
    price: 0,
    available: true,
    description: ''
  });

  // Derived POS values
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.data?.date === todayStr);
  const todayRevenue = todaySales.reduce((sum, s) => sum + (Number(s.data?.total) || 0), 0);

  // POS Functions
  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.item_id === item.id);
      if (existing) {
        return prev.map(i => i.item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
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
    
    const payload = {
      items: cart,
      total: cartTotal,
      payment_method: paymentMethod,
      customer_name: customerName,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    try {
      await saveRecord({
        recordType: 'school_canteen_sale',
        payload,
        searchText: `${customerName} ${paymentMethod}`,
        status: 'Completed'
      });
      toast.success('Sale completed successfully!');
      setCart([]);
      setCustomerName('');
    } catch (err) {
      toast.error('Failed to complete sale');
    }
  };

  // Menu Management Functions
  const openMenuModal = (record = null) => {
    if (record) {
      setEditingMenuItemId(record.id);
      setMenuData({
        name: record.data.name || '',
        category: record.data.category || 'Main Meal',
        price: Number(record.data.price) || 0,
        available: record.data.available ?? true,
        description: record.data.description || ''
      });
    } else {
      setEditingMenuItemId(null);
      setMenuData({
        name: '',
        category: 'Main Meal',
        price: 0,
        available: true,
        description: ''
      });
    }
    setIsMenuModalOpen(true);
  };

  const saveMenuItem = async () => {
    if (!menuData.name || menuData.price <= 0) {
      return toast.error('Name and valid price required');
    }
    try {
      await saveRecord({
        id: editingMenuItemId,
        recordType: 'school_canteen_item',
        payload: menuData,
        searchText: `${menuData.name} ${menuData.category}`,
        status: menuData.available ? 'Active' : 'Inactive'
      });
      toast.success('Menu item saved');
      setIsMenuModalOpen(false);
    } catch (e) {
      toast.error('Error saving item');
    }
  };

  const deleteMenuItem = async (id) => {
    if (window.confirm('Delete this menu item?')) {
      try {
        await deleteRecord({ id, recordType: 'school_canteen_item' });
        toast.success('Item deleted');
      } catch (e) {
        toast.error('Error deleting item');
      }
    }
  };

  if (loadingMenu || loadingSales) {
    return <div className="p-8 text-center text-gray-500">Loading Canteen POS...</div>;
  }

  return (
    <div className="p-6 h-screen flex flex-col max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Canteen POS</h1>
          <p className="text-gray-600">Manage sales and menu items.</p>
        </div>
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
          <CreditCard className="h-5 w-5" /> Today's Revenue: GHS {todayRevenue.toFixed(2)}
        </div>
      </div>

      <Tabs defaultValue="pos" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mb-4">
          <TabsTrigger value="pos">Point of Sale</TabsTrigger>
          <TabsTrigger value="menu">Menu Management</TabsTrigger>
          <TabsTrigger value="history">Sales History</TabsTrigger>
        </TabsList>

        {/* POS TAB */}
        <TabsContent value="pos" className="flex-1 flex gap-6 min-h-0 m-0">
          {/* Menu Grid */}
          <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-200 overflow-y-auto">
            <h2 className="font-bold text-lg mb-4">Menu Items</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {menuItems.filter(i => i.data?.available).map(item => (
                <div 
                  key={item.id} 
                  onClick={() => addToCart(item)}
                  className="bg-gray-50 border border-gray-200 p-4 rounded-lg cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between h-32"
                >
                  <span className="font-semibold text-gray-800 line-clamp-2">{item.data.name}</span>
                  <div className="flex justify-between items-end mt-2">
                    <span className="text-xs text-gray-500">{item.data.category}</span>
                    <span className="font-bold text-indigo-600">GHS {Number(item.data.price).toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {menuItems.length === 0 && <p className="text-gray-500 col-span-full">No menu items available. Add some in Menu Management.</p>}
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="w-96 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-indigo-600" />
              <h2 className="font-bold text-lg">Current Order</h2>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {cart.length === 0 ? (
                <p className="text-center text-gray-500 mt-10">Cart is empty</p>
              ) : (
                cart.map(item => (
                  <div key={item.item_id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <div className="flex-1">
                      <p className="font-semibold text-sm truncate pr-2">{item.item_name}</p>
                      <p className="text-xs text-gray-500">GHS {item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.item_id, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.item_id, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 ml-1" onClick={() => removeFromCart(item.item_id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl space-y-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span className="text-indigo-600">GHS {cartTotal.toFixed(2)}</span>
              </div>
              
              <div className="space-y-2">
                <Input 
                  placeholder="Customer Name (Optional)" 
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="bg-white"
                />
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12"
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                Complete Sale
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* MENU MANAGEMENT TAB */}
        <TabsContent value="menu" className="flex-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 overflow-y-auto m-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">Menu Items</h2>
            <Button onClick={() => openMenuModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="h-4 w-4 mr-2" /> Add Item
            </Button>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-3 font-medium text-gray-500">Name</th>
                <th className="p-3 font-medium text-gray-500">Category</th>
                <th className="p-3 font-medium text-gray-500">Price</th>
                <th className="p-3 font-medium text-gray-500">Status</th>
                <th className="p-3 font-medium text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map(item => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium">{item.data.name}</td>
                  <td className="p-3 text-sm text-gray-600">{item.data.category}</td>
                  <td className="p-3 font-medium">GHS {Number(item.data.price).toFixed(2)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.data.available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {item.data.available ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => openMenuModal(item)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteMenuItem(item.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>

        {/* SALES HISTORY TAB */}
        <TabsContent value="history" className="flex-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 overflow-y-auto m-0">
          <h2 className="font-bold text-lg mb-4">Recent Sales</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-3 font-medium text-gray-500">Date/Time</th>
                <th className="p-3 font-medium text-gray-500">Customer</th>
                <th className="p-3 font-medium text-gray-500">Items</th>
                <th className="p-3 font-medium text-gray-500">Payment</th>
                <th className="p-3 font-medium text-gray-500 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {sales.slice().reverse().map(sale => (
                <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 text-sm">
                    <div className="font-medium">{sale.data.date}</div>
                    <div className="text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3"/>{sale.data.time}</div>
                  </td>
                  <td className="p-3 text-sm">{sale.data.customer_name || 'Walk-in'}</td>
                  <td className="p-3 text-sm text-gray-600 max-w-xs truncate">
                    {sale.data.items?.map(i => `${i.quantity}x ${i.item_name}`).join(', ')}
                  </td>
                  <td className="p-3 text-sm">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">{sale.data.payment_method}</span>
                  </td>
                  <td className="p-3 text-right font-bold text-indigo-600">
                    GHS {Number(sale.data.total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>
      </Tabs>

      {/* Menu Item Modal */}
      <Dialog open={isMenuModalOpen} onOpenChange={setIsMenuModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMenuItemId ? 'Edit Item' : 'Add Menu Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input value={menuData.name} onChange={e => setMenuData({...menuData, name: e.target.value})} placeholder="e.g. Jollof Rice" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={menuData.category} onValueChange={v => setMenuData({...menuData, category: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Main Meal">Main Meal</SelectItem>
                    <SelectItem value="Snack">Snack</SelectItem>
                    <SelectItem value="Drink">Drink</SelectItem>
                    <SelectItem value="Fruit">Fruit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Price (GHS)</Label>
                <Input type="number" step="0.5" value={menuData.price} onChange={e => setMenuData({...menuData, price: Number(e.target.value)})} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="available" checked={menuData.available} onChange={e => setMenuData({...menuData, available: e.target.checked})} className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
              <Label htmlFor="available">Item is currently available</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMenuModalOpen(false)}>Cancel</Button>
            <Button onClick={saveMenuItem}>Save Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
