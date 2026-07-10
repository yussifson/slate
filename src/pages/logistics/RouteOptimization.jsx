import { useTranslation } from "react-i18next";
import { useState } from 'react';
import {Map, MapPin, Zap, Lock, Navigation, ListOrdered, Save, Play} from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { usePowerSync } from '@powersync/react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useSubscription } from '@/hooks/useSubscription';
import { generateText } from '@/lib/cloudflareAI';
import { OrbitLoader } from "@/components/ui/orbit-loader";

export default function RouteOptimization() {
  const { t } = useTranslation();
  const powerSync = usePowerSync();
  const { user } = useAuth();
  const companyId = useCompanyId();
  
  // Custom hook that checks subscription.
  const { data: subData } = useSubscription();
  // If useSubscription returns null initially, we default to starter to be safe.
  const plan = subData?.subscription_plan || 'starter';
  const isProOrAbove = ['super_admin', 'admin'].includes(user?.role) || plan === 'pro' || plan === 'enterprise';

  const [stops, setStops] = useState([{ id: crypto.randomUUID(), address: '' }, { id: crypto.randomUUID(), address: '' }]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [routeName, setRouteName] = useState('Today Delivery Route');

  const handleAddStop = () => {
    setStops([...stops, { id: crypto.randomUUID(), address: '' }]);
  };

  const handleRemoveStop = (id) => {
    setStops(stops.filter(s => s.id !== id));
  };

  const handleUpdateStop = (id, address) => {
    setStops(stops.map(s => s.id === id ? { ...s, address } : s));
  };

  const handleOptimize = async () => {
    const validStops = stops.filter(s => s.address.trim() !== '');
    if (validStops.length < 2) {
      toast({ title: "Error", description: "Please add at least 2 addresses.", variant: "destructive" });
      return;
    }

    setIsOptimizing(true);
    try {
      const prompt = `You are a logistics AI. I have a list of delivery addresses. Optimize the delivery route for efficiency. 
      Return ONLY a raw JSON array of objects representing the optimized sequence. Each object MUST have an "original_id" matching the input, and an "address". 
      No markdown, no explanation.
      
      Input Addresses:
      ${validStops.map(s => JSON.stringify({ original_id: s.id, address: s.address })).join(',\n')}
      `;

      const response = await generateText([{ role: 'user', content: prompt }]);
      
      let optimizedArray = [];
      try {
        const match = response.match(/\[.*\]/s);
        if (match) {
          optimizedArray = JSON.parse(match[0]);
        } else {
          const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
          optimizedArray = JSON.parse(cleaned);
        }
      } catch (e) {
        throw new Error('Failed to parse AI output.');
      }

      if (!Array.isArray(optimizedArray) || optimizedArray.length === 0) {
        throw new Error('Invalid AI response format.');
      }

      // Reorder local state based on AI response
      const reorderedStops = optimizedArray.map(opt => {
        const original = validStops.find(s => s.id === opt.original_id);
        return original || { id: crypto.randomUUID(), address: opt.address };
      });

      setStops(reorderedStops);
      toast({ title: "Optimized!", description: "AI has successfully generated the most efficient route.", variant: "default" });
    } catch (error) {
      console.error(error);
      toast({ title: "AI Optimization Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSaveRoute = async () => {
    const validStops = stops.filter(s => s.address.trim() !== '');
    if (validStops.length === 0) return;

    setIsSaving(true);
    try {
      const routeId = crypto.randomUUID();
      
      // Save route header
      await powerSync.execute(
        `INSERT INTO logistics_routes (id, company_id, name, date, status) VALUES (?, ?, ?, ?, ?)`,
        [routeId, companyId, routeName, new Date().toISOString().split('T')[0], 'pending']
      );

      // Save individual stops
      for (let i = 0; i < validStops.length; i++) {
        await powerSync.execute(
          `INSERT INTO logistics_route_stops (id, route_id, company_id, address, sequence_number, status) VALUES (?, ?, ?, ?, ?, ?)`,
          [crypto.randomUUID(), routeId, companyId, validStops[i].address, i + 1, 'pending']
        );
      }

      toast({ title: "Route Saved", description: "Route synced to drivers.", variant: "default" });
      setStops([{ id: crypto.randomUUID(), address: '' }, { id: crypto.randomUUID(), address: '' }]);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to save route.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground flex items-center gap-2 tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <Zap className="w-6 h-6 text-primary" />
            {t("ai_route_optimization", "AI Route Optimization")}
          </h1>
          <p className="text-[#71717a] dark:text-gray-400 mt-1">
            {t("route_opt_desc", "Use our advanced AI to find the most efficient delivery sequence for your fleet.")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Route Builder */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <div className="mb-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">Route Name</label>
                <Input value={routeName} onChange={e => setRouteName(e.target.value)} className="mt-1" />
              </div>
            </div>

            <h2 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
              <ListOrdered className="w-5 h-5 text-primary" />
              Delivery Stops
            </h2>

            <div className="space-y-3">
              {stops.map((stop, index) => (
                <div key={stop.id} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0 tracking-[0.04em]">
                    {index + 1}
                  </div>
                  <Input 
                    placeholder="Enter address..." 
                    value={stop.address}
                    onChange={(e) => handleUpdateStop(stop.id, e.target.value)}
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveStop(stop.id)} className="text-destructive shrink-0">
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={handleAddStop} className="w-full mt-4 border-dashed">
              + Add Another Stop
            </Button>
          </div>
        </div>

        {/* Right Column: AI & Map */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI Optimization Banner / Paywall */}
          <div className="relative rounded-2xl overflow-hidden border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 bg-gradient-to-r from-primary/10 to-transparent p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary fill-primary" /> 
                Smart Routing Engine
              </h3>
              <p className="text-sm text-[#71717a] dark:text-gray-400">
                Let our AI instantly calculate the fastest, most fuel-efficient sequence for these stops.
              </p>
            </div>

            <div className="relative">
              {!isProOrAbove && (
                <div className="absolute -inset-2 bg-background/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-[0.5px] border-black/9 dark:border-white/8">
                  <Lock className="w-5 h-5 text-amber-500 mb-1" />
                  <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider tracking-[0.04em]">Pro Plan Required</span>
                </div>
              )}
              <Button 
                onClick={handleOptimize} 
                disabled={isOptimizing || !isProOrAbove} 
                className="gap-2 relative z-0"
                size="lg"
              >
                {isOptimizing ? <OrbitLoader size="md" /> : <Play className="w-5 h-5" />}
                {isOptimizing ? "Calculating..." : "AI Optimize Route"}
              </Button>
            </div>
          </div>

          {/* Map Preview Area */}
          <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm h-[500px] flex flex-col relative hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
             {/* Simulated Map Background */}
             <div className="absolute inset-0 bg-slate-100 dark:bg-card opacity-50 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8cGF0aCBkPSJNMCAyMEw0MCAyME0yMCAwTDIwIDQwIiBzdHJva2U9InJnYmEoMCwgMCwgMCwgMC4wNSkiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4=')]"></div>
             
             <div className="p-4 border-b border-[0.5px] border-black/9 dark:border-white/8/50 bg-background/80 backdrop-blur-md relative z-10 flex justify-between items-center">
                <h3 className="font-semibold flex items-center gap-2"><Map className="w-4 h-4" /> Live Route Preview</h3>
                <Button onClick={handleSaveRoute} disabled={isSaving || stops.filter(s=>s.address).length < 2} size="sm" className="gap-2">
                   {isSaving ? <OrbitLoader size="sm" /> : <Save className="w-4 h-4" />} Save Route
                </Button>
             </div>

             <div className="flex-1 relative z-10 p-6 flex items-center justify-center">
                {stops.filter(s => s.address).length > 0 ? (
                  <div className="space-y-6 w-full max-w-md bg-background/90 p-6 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-[0.5px] border-black/9 dark:border-white/8 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-md">
                     {stops.filter(s => s.address).map((stop, i, arr) => (
                       <div key={stop.id} className="relative">
                          <div className="flex items-center gap-4">
                             <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] z-10">
                               {i + 1}
                             </div>
                             <div className="flex-1">
                               <p className="text-sm font-semibold truncate">{stop.address}</p>
                               {i < arr.length - 1 && <p className="text-[10px] text-[#71717a] dark:text-gray-400 mt-1">Driving ~15 mins</p>}
                             </div>
                          </div>
                          {i < arr.length - 1 && (
                            <div className="absolute left-4 top-8 bottom-[-24px] w-0.5 bg-primary/30"></div>
                          )}
                       </div>
                     ))}
                  </div>
                ) : (
                  <div className="text-center text-[#71717a] dark:text-gray-400 flex flex-col items-center">
                     <Navigation className="w-12 h-12 mb-3 opacity-20" />
                     <p>Add delivery stops to see the route preview.</p>
                  </div>
                )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function TrashIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
