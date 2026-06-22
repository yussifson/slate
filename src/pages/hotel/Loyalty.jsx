import { useTranslation } from "react-i18next";
import { useState, useMemo } from 'react';
import { Award, Star, Search, Gift, Crown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';

export default function Loyalty() {
  const { t } = useTranslation();
  const { data: dbRes = [] } = useIndustryRecords('reservation');
  const [search, setSearch] = useState('');

  // Calculate points based on historical reservations (1 point per $10 spent)
  const loyaltyMembers = useMemo(() => {
    const membersMap = {};
    
    dbRes.forEach(r => {
      if (r.status === 'Cancelled' || !r.data.guest) return;
      const guestName = r.data.guest.trim();
      const spent = r.data.total || 0;
      const pointsEarned = Math.floor(spent / 10);
      
      if (!membersMap[guestName]) {
        membersMap[guestName] = { name: guestName, totalSpent: 0, points: 0, stays: 0 };
      }
      
      membersMap[guestName].totalSpent += spent;
      membersMap[guestName].points += pointsEarned;
      membersMap[guestName].stays += 1;
    });

    return Object.values(membersMap).map(m => {
      let tier = 'Silver';
      if (m.points > 500) tier = 'Gold';
      if (m.points > 2000) tier = 'Platinum';
      return { ...m, tier };
    }).sort((a, b) => b.points - a.points);
  }, [dbRes]);

  const filtered = loyaltyMembers.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  const handleManualPoints = (member) => {
    // In a real app, we would write a "loyalty_adjustment" record. 
    // Since we compute from reservations, we could just alert for demo purposes.
    toast.success(`Bonus points engine is active! UI will be wired to a loyalty ledger in production.`, { icon: '🎁' });
  };

  return (
    <div className="space-y-6 school-page-enter font-dmsans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">Guest Loyalty Engine</h1>
          <p className="text-sm text-muted-foreground">Automated points calculation and tier progression.</p>
        </div>
        <Button className="gap-2 bg-primary text-white">
          <Plus className="w-4 h-4" /> Manual Adjustment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-card rounded-xl p-6 border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Silver Members</p>
            <p className="text-2xl font-bold">{loyaltyMembers.filter(m => m.tier === 'Silver').length}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl p-6 border border-yellow-200 dark:border-yellow-900/30 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full text-yellow-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Gold Members</p>
            <p className="text-2xl font-bold">{loyaltyMembers.filter(m => m.tier === 'Gold').length}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl p-6 border border-indigo-200 dark:border-indigo-900/30 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Platinum Members</p>
            <p className="text-2xl font-bold">{loyaltyMembers.filter(m => m.tier === 'Platinum').length}</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-primary/20 overflow-hidden">
        <div className="p-4 border-b border-primary/10 bg-muted/30">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by guest name..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-9"
            />
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-primary/10">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Guest Name</th>
              <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Tier</th>
              <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Total Stays</th>
              <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Lifetime Spent</th>
              <th className="px-6 py-3 text-right font-semibold text-muted-foreground">Reward Points</th>
              <th className="px-6 py-3 text-right font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {filtered.map((m, i) => (
              <tr key={i} className="hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4 font-semibold">{m.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    m.tier === 'Platinum' ? 'bg-indigo-100 text-indigo-700' :
                    m.tier === 'Gold' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {m.tier}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium">{m.stays}</td>
                <td className="px-6 py-4 font-medium">${m.totalSpent.toFixed(2)}</td>
                <td className="px-6 py-4 text-right font-bold text-primary">{m.points} pts</td>
                <td className="px-6 py-4 text-right">
                  <Button variant="outline" size="sm" onClick={() => handleManualPoints(m)} className="h-8 gap-2 text-xs">
                    <Gift className="w-3 h-3" /> Adjust
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-muted-foreground">
                  No loyalty members found. Book a reservation to see guests here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
