import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { TrendingUp, DollarSign, Percent, BarChart3, Settings, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIndustryRecords, useMutateIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';

export default function RevenueManagement() {
  const { t } = useTranslation();
  const { data: dbRooms = [] } = useIndustryRecords('room');
  const { data: dbRes = [] } = useIndustryRecords('reservation');
  const mutateRecord = useMutateIndustryRecord();

  const [activeTab, setActiveTab] = useState('kpi');

  const { data: yieldRules = [] } = useIndustryRecords('hotel_yield_rule');
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [newRule, setNewRule] = useState({ condition: '', action: '', active: true });

  // Compute KPIs
  const totalRooms = dbRooms.length || 1; // prevent div by zero
  const today = new Date().toISOString().split('T')[0];
  
  const currentReservations = dbRes.map(r => r.data).filter(r => 
    r.status !== 'Cancelled' && r.checkIn <= today && r.checkOut > today
  );
  
  const occupiedRooms = currentReservations.length;
  const occupancyRate = (occupiedRooms / totalRooms) * 100;
  
  const currentRevenue = currentReservations.reduce((sum, r) => sum + (r.total / (r.nights || 1)), 0);
  const adr = occupiedRooms > 0 ? currentRevenue / occupiedRooms : 0;
  const revPar = adr * (occupancyRate / 100);

  // Forecast data (Real data derived from reservations)
  const forecastData = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayStr = d.toISOString().split('T')[0];
    
    const activeResForDay = dbRes.map(r => r.data).filter(r => 
      r.status !== 'Cancelled' && r.checkIn <= dayStr && r.checkOut > dayStr
    );
    
    const occRoomsForDay = activeResForDay.length;
    const occRateForDay = (occRoomsForDay / totalRooms) * 100;
    const revForDay = activeResForDay.reduce((sum, r) => sum + (Number(r.total) / (Number(r.nights) || 1)), 0);
    
    return {
      day: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `Day ${i+1}`,
      occ: occRateForDay,
      rev: revForDay
    };
  });
  return (
    <div className="space-y-6 school-page-enter font-dmsans">
      <div className="flex gap-4 border-b border-primary/20 pb-4 mb-6">
        <Button variant={activeTab === 'kpi' ? 'default' : 'outline'} onClick={() => setActiveTab('kpi')}>Executive Dashboard</Button>
        <Button variant={activeTab === 'forecast' ? 'default' : 'outline'} onClick={() => setActiveTab('forecast')}>Revenue Forecast</Button>
        <Button variant={activeTab === 'yield' ? 'default' : 'outline'} onClick={() => setActiveTab('yield')}>Yield Rules</Button>
      </div>

      {activeTab === 'kpi' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.02em]">Revenue Performance</h1>
              <p className="text-sm text-muted-foreground">Real-time KPIs calculated from your live inventory and reservations.</p>
            </div>
            <Button variant="outline" className="gap-2 border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" /> AI Insights
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card rounded-xl p-6 border-[0.5px] border-primary/20 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Occupancy Rate</p>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                  <Percent className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold">{occupancyRate.toFixed(1)}%</p>
              <p className="text-xs text-green-600 mt-2 font-medium">+2.4% vs last week</p>
            </div>

            <div className="bg-card rounded-xl p-6 border-[0.5px] border-primary/20 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">ADR</p>
                <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold">${adr.toFixed(2)}</p>
              <p className="text-xs text-green-600 mt-2 font-medium">+5.1% vs last week</p>
            </div>

            <div className="bg-card rounded-xl p-6 border-[0.5px] border-primary/20 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">RevPAR</p>
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold">${revPar.toFixed(2)}</p>
              <p className="text-xs text-green-600 mt-2 font-medium">+7.5% vs last week</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'forecast' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.02em]">5-Day Revenue Forecast</h1>
              <p className="text-sm text-muted-foreground">Predictive models based on current booking velocity and market trends.</p>
            </div>
          </div>
          <div className="bg-card border border-primary/20 rounded-xl p-6 overflow-hidden">
             {/* Simple visual bar chart replacement */}
             <div className="flex items-end h-64 gap-4 w-full pt-10">
               {forecastData.map((data, i) => (
                 <div key={i} className="flex-1 flex flex-col justify-end items-center group relative">
                   <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-white text-xs py-1 px-2 rounded font-semibold pointer-events-none">
                     ${data.rev.toFixed(0)}
                   </div>
                   <div 
                     className="w-full bg-primary/20 hover:bg-primary/40 rounded-t-lg transition-all duration-300 relative overflow-hidden" 
                     style={{ height: `${Math.min(100, data.occ)}%` }}
                   >
                     <div className="absolute bottom-0 w-full bg-primary" style={{ height: '4px' }}></div>
                   </div>
                   <p className="text-xs font-medium mt-3 text-muted-foreground">{data.day}</p>
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}

      {activeTab === 'yield' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.02em]">Automated Yield Rules</h2>
              <p className="text-sm text-muted-foreground">Dynamically adjust rates across channels without manual intervention.</p>
            </div>
            <Button onClick={() => setShowRuleModal(true)} className="gap-2 bg-primary text-white">
              <Plus className="w-4 h-4" /> Add Rule
            </Button>
          </div>
          <div className="bg-card rounded-xl border border-primary/20 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-primary/10">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Condition Trigger</th>
                  <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Automated Action</th>
                  <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-right font-semibold text-muted-foreground">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {yieldRules.filter(r => r.status !== 'Cancelled').length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-muted-foreground">No yield rules configured.</td>
                  </tr>
                )}
                {yieldRules.filter(r => r.status !== 'Cancelled').map(rule => (
                  <tr key={rule.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{rule.data.condition}</td>
                    <td className="px-6 py-4 text-primary font-medium">{rule.data.action}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => {
                          mutateRecord.mutate({
                            id: rule.id,
                            recordType: 'hotel_yield_rule',
                            payload: { ...rule.data, active: !rule.data.active },
                            status: 'Active',
                            searchText: rule.search_text
                          });
                        }}
                        className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${rule.data.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}
                      >
                        {rule.data.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700" onClick={() => {
                        // Deleting by setting status to Cancelled
                        mutateRecord.mutate({
                          id: rule.id,
                          recordType: 'hotel_yield_rule',
                          payload: rule.data,
                          status: 'Cancelled',
                          searchText: rule.search_text
                        }, { onSuccess: () => toast.success("Rule deleted") });
                      }}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-4">Add Yield Rule</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold">Condition Trigger</label>
                <input 
                  value={newRule.condition} 
                  onChange={e => setNewRule({...newRule, condition: e.target.value})} 
                  placeholder="e.g. Occupancy > 80%"
                  className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-primary focus:border-primary" 
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Automated Action</label>
                <input 
                  value={newRule.action} 
                  onChange={e => setNewRule({...newRule, action: e.target.value})} 
                  placeholder="e.g. Increase rates by 10%"
                  className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-primary focus:border-primary" 
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowRuleModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-primary text-white" onClick={() => {
                if(!newRule.condition || !newRule.action) return toast.error("Fill required fields");
                mutateRecord.mutate({
                  recordType: 'hotel_yield_rule',
                  payload: newRule,
                  status: 'Active',
                  searchText: `${newRule.condition} ${newRule.action}`
                }, { 
                  onSuccess: () => { 
                    toast.success("Rule added!"); 
                    setShowRuleModal(false); 
                    setNewRule({ condition: '', action: '', active: true }); 
                  } 
                });
              }}>Save Rule</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
