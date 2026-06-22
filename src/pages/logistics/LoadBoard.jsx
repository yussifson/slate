import { useTranslation } from "react-i18next";
import { useState } from 'react';
import {PackageSearch, Lock, Zap, MapPin, DollarSign, Weight, Truck, CheckCircle, Plus, Users} from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { usePowerSync } from '@powersync/react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useCompanyId } from '@/hooks/useCompanyId';
import { generateText } from '@/lib/cloudflareAI';
import { OrbitLoader } from "@/components/ui/orbit-loader";

export default function LoadBoard() {
  const { t } = useTranslation();
  const powerSync = usePowerSync();
  const { user } = useAuth();
  const companyId = useCompanyId();
  
  const { data: subData } = useSubscription();
  const plan = subData?.subscription_plan || 'starter';
  const isProOrAbove = ['super_admin', 'admin'].includes(user?.role) || plan === 'pro' || plan === 'enterprise';

  const [isPosting, setIsPosting] = useState(false);
  const [matchingLoadId, setMatchingLoadId] = useState(null);
  const [newLoad, setNewLoad] = useState({ origin: '', destination: '', weight: '', equipment: '', price: '' });

  // Fetch Loads
  const { data: loads } = useQuery({
    queryKey: ['logistics_loads', companyId],
    queryFn: async () => {
      const res = await powerSync.execute(
        'SELECT * FROM logistics_loads WHERE company_id = ? ORDER BY created_at DESC', 
        [companyId]
      );
      return res.rows?._array || [];
    }
  });

  // Fetch Load Matches
  const { data: loadMatches } = useQuery({
    queryKey: ['logistics_load_matches', companyId],
    queryFn: async () => {
      const res = await powerSync.execute(
        'SELECT m.*, f.vehicle_name, f.license_plate FROM logistics_load_matches m LEFT JOIN univ_fleet f ON m.vehicle_id = f.id WHERE m.company_id = ? ORDER BY m.match_score DESC', 
        [companyId]
      );
      return res.rows?._array || [];
    }
  });

  const handlePostLoad = async () => {
    if (!newLoad.origin || !newLoad.destination || !newLoad.weight) {
      toast({ title: "Validation", description: "Origin, destination, and weight are required.", variant: "destructive" });
      return;
    }
    
    setIsPosting(true);
    try {
      const loadId = crypto.randomUUID();
      await powerSync.execute(
        `INSERT INTO logistics_loads (id, company_id, origin, destination, weight_lbs, equipment_required, price, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [loadId, companyId, newLoad.origin, newLoad.destination, parseFloat(newLoad.weight), newLoad.equipment, parseFloat(newLoad.price || 0), 'open']
      );
      
      setNewLoad({ origin: '', destination: '', weight: '', equipment: '', price: '' });
      toast({ title: "Load Posted", description: "New load is now live on the board." });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to post load.", variant: "destructive" });
    } finally {
      setIsPosting(false);
    }
  };

  const handleMatchTrucks = async (load) => {
    setMatchingLoadId(load.id);
    try {
      // 1. Fetch available fleet
      const fleetRes = await powerSync.execute('SELECT * FROM univ_fleet WHERE company_id = ? AND status != ?', [companyId, 'Maintenance']);
      const availableFleet = fleetRes.rows?._array || [];

      if (availableFleet.length === 0) {
        toast({ title: "No Trucks", description: "No available trucks in your fleet to match.", variant: "destructive" });
        return;
      }

      // 2. Build prompt
      const prompt = `You are an AI Freight Broker. I have a Load to move and a list of available trucks in my fleet.
      Load details:
      Origin: ${load.origin}, Destination: ${load.destination}, Weight: ${load.weight_lbs} lbs, Equip Needed: ${load.equipment_required || 'Any'}
      
      Available Trucks:
      ${availableFleet.map(f => `ID: ${f.id}, Name: ${f.vehicle_name}, Type: ${f.vehicle_type}`).join('\n')}
      
      Analyze and return a JSON array of the top 2 best matches. Format:
      [{"vehicle_id": "truck-id", "match_score": 95, "reasoning": "Brief explanation"}]
      Only return the raw JSON array. No markdown.`;

      const response = await generateText([{ role: 'user', content: prompt }]);
      
      let parsed = [];
      try {
        parsed = JSON.parse(response.replace(/```json/g, '').replace(/```/g, '').trim());
      } catch (e) {
        // Fallback or handle parse error
        throw new Error("Failed to parse AI matching results.");
      }

      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("No matches found by AI.");

      // 3. Save matches
      for (const match of parsed) {
        const fleetMatch = availableFleet.find(f => f.id === match.vehicle_id);
        if (fleetMatch) {
          await powerSync.execute(
            `INSERT INTO logistics_load_matches (id, load_id, vehicle_id, company_id, match_score, reasoning, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [crypto.randomUUID(), load.id, fleetMatch.id, companyId, match.match_score || 85, match.reasoning || 'Good fit based on criteria.', 'proposed']
          );
        }
      }

      await powerSync.execute(
        `INSERT INTO univ_notifications (id, company_id, created_at, title, message, type, read) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), companyId, new Date().toISOString(), "AI Match Complete", `AI found ${parsed.length} truck matches for load to ${load.destination}`, "info", 0]
      );

      toast({ title: "Matches Found", description: "AI has successfully found the best trucks for this load." });
    } catch (e) {
      console.error(e);
      toast({ title: "Matching Failed", description: e.message, variant: "destructive" });
    } finally {
      setMatchingLoadId(null);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground flex items-center gap-2 tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <PackageSearch className="w-6 h-6 text-primary" />
            {t("load_board", "Automated Load Board")}
          </h1>
          <p className="text-[#71717a] dark:text-gray-400 mt-1">
            {t("load_board_desc", "Post shipments and let the AI find the most profitable carrier matches instantly.")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Post Load Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm sticky top-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <h2 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
              <Plus className="w-5 h-5 text-primary" />
              Post New Load
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Origin</label>
                 <Input placeholder="e.g. Chicago, IL" value={newLoad.origin} onChange={e => setNewLoad({...newLoad, origin: e.target.value})} />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Destination</label>
                 <Input placeholder="e.g. Dallas, TX" value={newLoad.destination} onChange={e => setNewLoad({...newLoad, destination: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                   <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Weight (lbs)</label>
                   <Input type="number" placeholder="40000" value={newLoad.weight} onChange={e => setNewLoad({...newLoad, weight: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                   <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Price ($)</label>
                   <Input type="number" placeholder="1500" value={newLoad.price} onChange={e => setNewLoad({...newLoad, price: e.target.value})} />
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Equipment Required</label>
                 <Input placeholder="e.g. 53' Dry Van, Reefer" value={newLoad.equipment} onChange={e => setNewLoad({...newLoad, equipment: e.target.value})} />
              </div>

              <Button onClick={handlePostLoad} disabled={isPosting} className="w-full mt-2">
                {isPosting ? <OrbitLoader size="sm" /> : null}
                Post to Board
              </Button>
            </div>
          </div>
        </div>

        {/* Load Board Feed */}
        <div className="lg:col-span-2 space-y-4">
          {loads?.map((load) => {
            const matchesForThisLoad = loadMatches?.filter(m => m.load_id === load.id) || [];
            const isMatched = matchesForThisLoad.length > 0;

            return (
              <div key={load.id} className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm hover:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] relative overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-primary" />
                       </div>
                       <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                             {load.origin} <span className="text-[#71717a] dark:text-gray-400 font-normal mx-1">→</span> {load.destination}
                          </h3>
                          <div className="flex items-center gap-4 text-xs text-[#71717a] dark:text-gray-400 mt-1 tracking-[0.04em]">
                             <span className="flex items-center gap-2"><Weight className="w-3 h-3" /> {load.weight_lbs} lbs</span>
                             <span className="flex items-center gap-2"><Truck className="w-3 h-3" /> {load.equipment_required || 'Any'}</span>
                             {load.price > 0 && <span className="flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400"><DollarSign className="w-3 h-3" /> {load.price}</span>}
                          </div>
                       </div>
                    </div>
                    <div>
                       <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${isMatched ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {isMatched ? 'Matches Found' : 'Open'}
                       </span>
                    </div>
                 </div>

                 {/* Matches Section */}
                 <div className="mt-4 pt-4 border-t border-[0.5px] border-black/9 dark:border-white/8">
                    {isMatched ? (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2"><Zap className="w-4 h-4 text-primary fill-primary" /> AI Recommended Carriers</h4>
                        {matchesForThisLoad.map(match => (
                           <div key={match.id} className="flex items-center justify-between bg-muted/40 p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-[0.5px] border-black/9 dark:border-white/8/50">
                              <div>
                                 <p className="text-sm font-semibold flex items-center gap-2">
                                    <Users className="w-4 h-4 text-[#71717a] dark:text-gray-400" />
                                    {match.vehicle_name || 'Fleet Truck'} <span className="text-xs font-normal text-[#71717a] dark:text-gray-400 ml-2 tracking-[0.04em]">({match.license_plate})</span>
                                 </p>
                                 <p className="text-xs text-[#71717a] dark:text-gray-400 mt-0.5 tracking-[0.04em]">{match.reasoning}</p>
                              </div>
                              <div className="text-right shrink-0 ml-4">
                                 <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border-[0.5px] border-black/9 dark:border-white/8 border-emerald-200 tracking-[0.04em]">
                                    {match.match_score}% Match
                                 </div>
                              </div>
                           </div>
                        ))}
                      </div>
                    ) : (
                      <div className="relative">
                         {!isProOrAbove && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px] rounded-xl">
                               <div className="bg-background border-[0.5px] border-black/9 dark:border-white/8 border-[0.5px] border-black/9 dark:border-white/8 px-4 py-2 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm flex items-center gap-2">
                                  <Lock className="w-4 h-4 text-amber-500" />
                                  <span className="text-xs font-semibold text-foreground tracking-[0.04em]">Pro Plan Required to Match Trucks</span>
                               </div>
                            </div>
                         )}
                         <Button 
                            variant="secondary" 
                            className="w-full relative z-0" 
                            disabled={!isProOrAbove || matchingLoadId === load.id}
                            onClick={() => handleMatchTrucks(load)}
                         >
                            {matchingLoadId === load.id ? (
                               <><OrbitLoader size="sm" /> AI is scanning fleet...</>
                            ) : (
                               <><Zap className="w-4 h-4 mr-2" /> AI Match Trucks</>
                            )}
                         </Button>
                      </div>
                    )}
                 </div>
              </div>
            );
          })}
          
          {(!loads || loads.length === 0) && (
             <div className="text-center p-12 border-2 border-dashed border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl text-[#71717a] dark:text-gray-400">
                <PackageSearch className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <h3 className="font-semibold text-lg">No loads posted yet</h3>
                <p className="text-sm">Post a load on the left to get started.</p>
             </div>
          )}
        </div>

      </div>
    </div>
  );
}
