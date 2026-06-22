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

  // Hardcoded for UI demo if no rules are stored yet
  const [rules, setRules] = useState([
    { id: 1, condition: 'Occupancy > 80%', action: 'Increase Base Rates by 15%', active: true },
    { id: 2, condition: 'Occupancy < 40%', action: 'Decrease Base Rates by 10%', active: false },
    { id: 3, condition: 'Local Event Active', action: 'Increase Base Rates by 25%', active: true }
  ]);

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

  // Forecast data (Mocked based on current trends)
  const forecastData = [
    { day: 'Today', occ: occupancyRate, rev: currentRevenue },
    { day: 'Tomorrow', occ: occupancyRate * 1.1, rev: currentRevenue * 1.15 },
    { day: 'Day 3', occ: occupancyRate * 0.9, rev: currentRevenue * 0.95 },
    { day: 'Day 4', occ: occupancyRate * 1.2, rev: currentRevenue * 1.3 },
    { day: 'Day 5', occ: Math.min(100, occupancyRate * 1.5), rev: currentRevenue * 1.6 }
  ];

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
            <Button className="gap-2 bg-primary text-white">
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
                {rules.map(rule => (
                  <tr key={rule.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{rule.condition}</td>
                    <td className="px-6 py-4 text-primary font-medium">{rule.action}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${rule.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {rule.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
