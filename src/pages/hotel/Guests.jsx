import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Search, User, CreditCard, Calendar, Star, BedDouble, Utensils, Receipt, Mail, Phone, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords } from '@/hooks/useIndustryData';
import { Badge } from "@/components/ui/badge";

export default function Guests() {
  const { t } = useTranslation();
  
  // Supabase Real-time Sync Hooks
  const { data: dbReservations = [], isLoading: isResLoading } = useIndustryRecords('reservation');
  const { data: dbRestaurantOrders = [] } = useIndustryRecords('restaurant_order');
  
  const [search, setSearch] = useState('');
  const [selectedGuest, setSelectedGuest] = useState(null);

  // Aggregate Guests dynamically from reservations
  const guestMap = new Map();
  
  dbReservations.forEach(r => {
    const guestName = r.data?.guestName || "Unknown Guest";
    const email = r.data?.guestEmail || "";
    const phone = r.data?.guestPhone || "";
    const key = (email || guestName).toLowerCase().trim();
    
    if (!guestMap.has(key)) {
      guestMap.set(key, {
        id: key,
        name: guestName,
        email: email,
        phone: phone,
        reservations: [],
        totalSpent: 0,
        nightsStayed: 0,
        loyaltyPoints: r.data?.points || 0
      });
    }
    
    const profile = guestMap.get(key);
    profile.reservations.push({ id: r.id, status: r.status, ...r.data });
    
    const resTotal = Number(r.data?.totalAmount) || Number(r.data?.total) || 0;
    const resNights = Number(r.data?.nights) || 1;
    
    profile.totalSpent += resTotal;
    // Count nights only if it's a completed or active stay (not cancelled)
    if (r.status !== 'Cancelled') {
      profile.nightsStayed += resNights;
    }
    
    // Attempt to aggregate restaurant orders charged to their room during their stay
    // We look for orders charged to their room number
    if (r.data?.roomNumber) {
      const roomOrders = dbRestaurantOrders.filter(o => 
        String(o.data?.roomNumber) === String(r.data.roomNumber) && 
        o.status === 'Paid'
      );
      // To avoid double counting, we assume the order total is added to their folio or tracked here
      // For simplicity in this view, we can just attach the orders to the profile
      profile.restaurantOrders = (profile.restaurantOrders || []).concat(roomOrders);
    }
  });

  const guests = Array.from(guestMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  
  const filteredGuests = guests.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) || 
    g.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6" style={{ background: "linear-gradient(135deg, rgba(68,49,153,0.08) 0%, rgba(255,255,255,0) 100%)", minHeight: "100vh" }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("guest_directory", "Guest Profiles & History")}</h1>
          <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t("manage_guest_history", "View guest expenditure, past stays, and preferences")}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left List: Guest Directory */}
        <div className={`w-full lg:w-1/3 bg-card p-4 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex flex-col h-[750px] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200 ${selectedGuest ? 'hidden lg:flex' : 'flex'}`}>
          <div className="relative mb-4 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
            <Input 
              placeholder={t("search_guests", "Search by name or email...")}
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-9 bg-muted" 
            />
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-2">
            {isResLoading ? (
               <div className="py-12 text-center text-[#71717a] dark:text-gray-400">{t("loading_guests", "Loading profiles...")}</div>
            ) : filteredGuests.length === 0 ? (
               <div className="py-12 text-center text-[#71717a] dark:text-gray-400">
                 <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                 <p className="font-semibold">{t("no_guests_found", "No guests found")}</p>
               </div>
            ) : (
              filteredGuests.map(g => (
                <div 
                  key={g.id} 
                  onClick={() => setSelectedGuest(g)}
                  className={`p-3 rounded-lg cursor-pointer transition-all border-[0.5px] ${selectedGuest?.id === g.id ? 'bg-primary/5 border-primary/30 shadow-sm' : 'hover:bg-muted/50 border-transparent'} flex items-center justify-between group`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${selectedGuest?.id === g.id ? 'bg-primary text-white' : 'bg-muted text-foreground'}`}>
                      {g.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate text-card-foreground group-hover:text-primary transition-colors">{g.name}</p>
                      <p className="text-xs text-[#71717a] dark:text-gray-400 truncate tracking-[0.04em]">{g.reservations.length} stays · ${g.totalSpent.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right View: Guest Profile Detail */}
        <div className={`w-full lg:w-2/3 flex flex-col h-[750px] ${!selectedGuest ? 'hidden lg:flex' : 'flex'}`}>
          {selectedGuest ? (
            <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 h-full flex flex-col overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
              
              {/* Profile Header */}
              <div className="p-6 border-b border-primary/10 bg-muted/30 relative">
                <Button variant="ghost" className="lg:hidden absolute top-4 right-4" onClick={() => setSelectedGuest(null)}>
                  Close
                </Button>
                <div className="flex items-start gap-5">
                  <div className="w-20 h-20 rounded-2xl bg-primary text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-primary/20 shrink-0">
                    {selectedGuest.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-semibold text-card-foreground tracking-tight">{selectedGuest.name}</h2>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-[#71717a] dark:text-gray-400">
                          {selectedGuest.email && (
                            <div className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {selectedGuest.email}</div>
                          )}
                          {selectedGuest.phone && (
                            <div className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {selectedGuest.phone}</div>
                          )}
                        </div>
                      </div>
                      {selectedGuest.totalSpent > 1000 && (
                         <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 gap-1 border-none px-3 py-1">
                           <Star className="w-3.5 h-3.5 fill-current" /> VIP Guest
                         </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-background rounded-lg p-3 border-[0.5px] border-border shadow-sm">
                    <p className="text-[10px] uppercase font-semibold text-[#71717a] dark:text-gray-400 tracking-wider">Lifetime Value</p>
                    <p className="text-xl font-bold text-primary mt-1">${selectedGuest.totalSpent.toFixed(2)}</p>
                  </div>
                  <div className="bg-background rounded-lg p-3 border-[0.5px] border-border shadow-sm">
                    <p className="text-[10px] uppercase font-semibold text-[#71717a] dark:text-gray-400 tracking-wider">Total Nights</p>
                    <p className="text-xl font-bold text-card-foreground mt-1">{selectedGuest.nightsStayed}</p>
                  </div>
                  <div className="bg-background rounded-lg p-3 border-[0.5px] border-border shadow-sm">
                    <p className="text-[10px] uppercase font-semibold text-[#71717a] dark:text-gray-400 tracking-wider">Loyalty Points</p>
                    <p className="text-xl font-bold text-indigo-600 mt-1">{selectedGuest.loyaltyPoints || 0}</p>
                  </div>
                </div>
              </div>

              {/* Profile Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* Stay History */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> Stay History</h3>
                    <Badge variant="outline" className="font-medium">{selectedGuest.reservations.length} Bookings</Badge>
                  </div>
                  <div className="space-y-3">
                    {selectedGuest.reservations.slice().reverse().map((res, idx) => (
                      <div key={idx} className="bg-muted/50 p-4 rounded-xl border-[0.5px] border-border flex items-center justify-between group hover:bg-muted transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-background border-[0.5px] border-border flex flex-col items-center justify-center shrink-0">
                            <span className="text-[10px] font-semibold text-primary uppercase leading-none mb-1">Room</span>
                            <span className="text-sm font-bold leading-none">{res.roomNumber || "TBD"}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {res.checkIn} <span className="text-muted-foreground mx-1">→</span> {res.checkOut}
                            </p>
                            <p className="text-xs text-[#71717a] dark:text-gray-400 mt-0.5">{res.roomType} · {res.nights} Night{res.nights !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">${(Number(res.totalAmount) || Number(res.total) || 0).toFixed(2)}</p>
                          <Badge className={`mt-1 text-[10px] px-1.5 py-0 ${res.status === 'Checked-in' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-slate-200 text-slate-700 hover:bg-slate-200'}`} variant="secondary">
                            {res.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Additional Activity (e.g. F&B) */}
                {selectedGuest.restaurantOrders && selectedGuest.restaurantOrders.length > 0 && (
                  <section>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4"><Utensils className="w-5 h-5 text-orange-500" /> F&B Expenditure</h3>
                    <div className="bg-muted/30 rounded-xl border-[0.5px] border-border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b border-border text-left">
                          <tr>
                            <th className="px-4 py-3 font-medium text-[#71717a] dark:text-gray-400">Order Ref</th>
                            <th className="px-4 py-3 font-medium text-[#71717a] dark:text-gray-400">Items</th>
                            <th className="px-4 py-3 font-medium text-right text-[#71717a] dark:text-gray-400">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {selectedGuest.restaurantOrders.map((order, idx) => (
                            <tr key={idx} className="hover:bg-muted/50 transition-colors">
                              <td className="px-4 py-3 font-medium">{order.data?.orderId}</td>
                              <td className="px-4 py-3 text-[#71717a] dark:text-gray-400 truncate max-w-[200px]">
                                {(order.data?.items || []).map(i => i.name).join(', ')}
                              </td>
                              <td className="px-4 py-3 font-semibold text-right">${(Number(order.data?.total) || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

              </div>
            </div>
          ) : (
            <div className="h-full bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex flex-col items-center justify-center text-[#71717a] dark:text-gray-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
              <User className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">{t("select_guest", "Select a guest profile")}</p>
              <p className="text-sm mt-1">{t("view_details", "Click on a guest in the directory to view their complete history.")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
