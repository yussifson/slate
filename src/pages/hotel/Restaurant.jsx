import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Utensils, Plus, Receipt, Search, ShoppingCart, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';

export default function Restaurant() {
  const { t } = useTranslation();
  // Supabase Real-time Sync Hooks
  const { data: dbMenu = [], isLoading: isMenuLoading } = useIndustryRecords('menu');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const menuItems = dbMenu.map(r => ({ id: r.id, ...r.data }));

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [order, setOrder] = useState([]);
  const [roomNumber, setRoomNumber] = useState('Room 101');
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);

  // Add Menu Form State
  const [newMenu, setNewMenu] = useState({
    name: '',
    category: 'Mains',
    price: ''
  });

  const handleAddMenuItem = () => {
    if (!newMenu.name.trim() || !newMenu.price) {
      return toast.error("Please fill in all fields");
    }

    const payload = {
      name: newMenu.name,
      category: newMenu.category,
      price: parseFloat(newMenu.price) || 0
    };

    mutateRecord.mutate({
      recordType: 'menu',
      payload,
      status: 'active',
      searchText: `${newMenu.name} ${newMenu.category}`
    }, {
      onSuccess: () => {
        toast.success('Menu item added successfully!');
        setShowAddMenuModal(false);
        setNewMenu({ name: '', category: 'Mains', price: '' });
      },
      onError: (err) => {
        toast.error('Failed to add menu item: ' + err.message);
      }
    });
  };

  const handleDeleteMenu = (id) => {
    if (window.confirm('Delete this menu item?')) {
      deleteRecord.mutate({ id, recordType: 'menu' }, {
        onSuccess: () => {
          toast.success('Menu item deleted!');
        }
      });
    }
  };

  const handlePlaceOrder = (paymentMethod) => {
    if (order.length === 0) return toast.error("Your order is empty");

    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderTotal = total * 1.1;

    const payload = {
      orderId,
      items: order.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
      total: parseFloat(orderTotal.toFixed(2)),
      roomNumber: paymentMethod === 'Room' ? roomNumber : 'POS Counter',
      paymentMethod,
      timestamp: new Date().toISOString()
    };

    mutateRecord.mutate({
      recordType: 'restaurant_order',
      payload,
      status: 'Paid',
      searchText: `${orderId} ${roomNumber}`
    }, {
      onSuccess: () => {
        toast.success(`Order ${orderId} placed successfully!`);
        setOrder([]);
      },
      onError: (err) => {
        toast.error('Failed to place order: ' + err.message);
      }
    });
  };

  const addToOrder = (item) => {
    setOrder(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromOrder = (id) => {
    setOrder(prev => prev.filter(i => i.id !== id));
  };

  const total = order.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const filtered = menuItems.filter(m => {
    const matchesSearch = m.name?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6" style={{ backgroundColor: "rgba(68, 49, 153, 0.03)", minHeight: "100vh" }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">{t("restaurant_room_service", "Restaurant & Room Service")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("manage_food_orders_and_pos", "Manage food orders and POS")}</p>
        </div>
        <Button onClick={() => setShowAddMenuModal(true)} className="gap-2 bg-[#443199] hover:bg-[#362878] text-white">
          <Plus className="w-4 h-4" /> {t("add_menu_item", "Add Menu Item")}
        </Button>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
         {/* Left: Menu & POS */}
         <div className="flex-1 space-y-4">
            <div className="bg-card p-4 rounded-xl shadow-sm border border-border flex gap-4">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search menu items..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-muted" />
               </div>
               <select 
                 value={selectedCategory} 
                 onChange={e => setSelectedCategory(e.target.value)} 
                 className="rounded-md border border-input bg-background px-3 py-2 text-sm max-w-[200px]"
               >
                  <option value="All">{t("all_categories", "All Categories")}</option>
                  <option value="Starters">{t("starters", "Starters")}</option>
                  <option value="Mains">{t("mains", "Mains")}</option>
                  <option value="Desserts">{t("desserts", "Desserts")}</option>
                  <option value="Beverages">{t("beverages", "Beverages")}</option>
               </select>
            </div>

            {isMenuLoading ? (
              <div className="py-12 text-center text-muted-foreground">{t("loading_menu", "Loading menu...")}</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground bg-card rounded-xl border border-border">
                <Utensils className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">{t("no_menu_items_found", "No menu items found.")}</p>
                <p className="text-xs mt-1">{t(
                  "click_add_menu_item_to_get_sta",
                  "Click \"Add Menu Item\" to get started."
                )}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                 {filtered.map(item => {
                   return (
                     <div key={item.id} className="group bg-card p-4 rounded-xl border border-border shadow-sm hover:shadow-md hover:border-violet-200 cursor-pointer transition-all flex flex-col justify-between h-32 relative">
                       <button 
                         onClick={(e) => { e.stopPropagation(); handleDeleteMenu(item.id); }} 
                         className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                         <Trash2 className="w-3.5 h-3.5" />
                       </button>
                       <div onClick={() => addToOrder(item)}>
                          <p className="font-bold text-card-foreground line-clamp-1">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                       </div>
                       <div onClick={() => addToOrder(item)} className="flex justify-between items-center mt-4">
                          <span className="font-bold text-violet-600">${item.price.toFixed(2)}</span>
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-violet-100 group-hover:text-violet-600"><Plus className="w-4 h-4"/></div>
                       </div>
                     </div>
                   );
                 })}
              </div>
            )}
         </div>

         {/* Right: Current Order */}
         <div className="w-full lg:w-96 bg-card rounded-xl shadow-md border border-border flex flex-col h-[600px] overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
               <h3 className="font-bold flex items-center gap-2"><ShoppingCart className="w-5 h-5"/> {t("current_order", "Current Order")}</h3>
               <Input value={roomNumber} onChange={e => setRoomNumber(e.target.value)} className="w-24 h-8 bg-slate-800 border-none text-white text-xs font-bold text-center" />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {order.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                     <Utensils className="w-12 h-12 mb-2" />
                     <p className="text-sm font-medium">{t("order_is_empty", "Order is empty")}</p>
                  </div>
               ) : (
                  order.map(item => {
                    return (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex-1">
                           <p className="font-bold text-sm text-card-foreground">{item.name}</p>
                           <p className="text-xs text-muted-foreground">${item.price} x {item.qty}</p>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="font-bold text-sm">${(item.price * item.qty).toFixed(2)}</span>
                           <button onClick={() => removeFromOrder(item.id)} className="text-red-500 hover:text-red-700 text-xs font-bold">{t("remove", "Remove")}</button>
                        </div>
                      </div>
                    );
                  })
               )}
            </div>
            <div className="p-4 border-t border-border bg-muted space-y-4">
               <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{t("subtotal", "Subtotal")}</span>
                  <span className="font-bold text-card-foreground">${total.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{t("tax_10", "Tax (10%)")}</span>
                  <span className="font-bold text-card-foreground">${(total * 0.1).toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center text-lg pt-2 border-t border-border">
                  <span className="font-bold text-card-foreground">{t("total", "Total")}</span>
                  <span className="font-bold text-violet-600">${(total * 1.1).toFixed(2)}</span>
               </div>
               <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button onClick={() => handlePlaceOrder('Room')} variant="outline" className="w-full">{t("charge_room", "Charge Room")}</Button>
                  <Button onClick={() => handlePlaceOrder('Cash')} className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"><Receipt className="w-4 h-4"/> {t("pay_now", "Pay Now")}</Button>
               </div>
            </div>
         </div>
      </div>
      {showAddMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2"><Utensils className="w-5 h-5 text-violet-600"/> {t("add_menu_item", "Add Menu Item")}</h2>
            <div className="space-y-3">
               <div>
                 <label className="text-xs font-bold text-muted-foreground uppercase">{t("item_name", "Item Name")}</label>
                 <Input value={newMenu.name} onChange={e => setNewMenu({ ...newMenu, name: e.target.value })} className="mt-1" placeholder="e.g. T-Bone Steak" />
               </div>
               <div>
                 <label className="text-xs font-bold text-muted-foreground uppercase">{t("category", "Category")}</label>
                 <select value={newMenu.category} onChange={e => setNewMenu({ ...newMenu, category: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                   <option>{t("starters", "Starters")}</option>
                   <option>{t("mains", "Mains")}</option>
                   <option>{t("desserts", "Desserts")}</option>
                   <option>{t("beverages", "Beverages")}</option>
                 </select>
               </div>
               <div>
                 <label className="text-xs font-bold text-muted-foreground uppercase">{t("price", "Price ($)")}</label>
                 <Input type="number" value={newMenu.price} onChange={e => setNewMenu({ ...newMenu, price: e.target.value })} className="mt-1" placeholder="e.g. 24.99" />
               </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddMenuModal(false)}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-[#443199] hover:bg-[#362878] text-white" onClick={handleAddMenuItem}>{t("add_item", "Add Item")}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
