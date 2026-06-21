import { supabase} from '@/api/supabaseClient';
import React, { useState, useEffect} from "react";
import { Button} from "@/components/ui/button";
import { Badge} from "@/components/ui/badge";
import { Input} from "@/components/ui/input";
import { useToast} from "@/components/ui/use-toast";
import { powerSync} from "@/api/PowerSyncConnector";
import { useCompanyId} from "@/hooks/useCompanyId";
import {Search, CheckCircle2, Download, Trash2, ShieldCheck, Blocks, TrendingUp, Zap, BarChart} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import * as LucideIcons from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from "@/components/ui/dialog";
import { OrbitLoader } from "@/components/ui/orbit-loader";

export default function Marketplace() {
 const { toast} = useToast();
 const companyId = useCompanyId();
 const [modules, setModules] = useState([]);
 const [loading, setLoading] = useState(true);
 const [installingId, setInstallingId] = useState(null);
 const [uninstallingId, setUninstallingId] = useState(null);
 // Maps source module ID -> installed module ID in user's company
 const [installedMap, setInstalledMap] = useState({});
 const [ownedIds, setOwnedIds] = useState(new Set());
 const [searchQuery, setSearchQuery] = useState("");
 const [activeCategory, setActiveCategory] = useState("All");
 const [confirmUninstall, setConfirmUninstall] = useState(null);
 const [installSuccessModal, setInstallSuccessModal] = useState(null);

 const categories = ["All", "CRM", "Finance", "HR", "Operations", "Healthcare", "Custom"];

 useEffect(() => {
 if (companyId) fetchPublicModules();
}, [companyId]);

 const fetchPublicModules = async () => {
 setLoading(true);
 try {
 // 1. Fetch all public marketplace modules
  const response = await supabase
  .from('module_definitions')
  .select('*')
  .eq('visibility', 'public')
  .eq('is_active', 'true');
  const data = response?.data || [];
  const error = response?.error || null;

 if (error) throw error;
 const mods = data || [];
 setModules(mods);

 // Identify which ones this company created (owned)
 const owned = new Set(mods.filter(m => m.company_id === companyId).map(m => m.id));
 setOwnedIds(owned);

 // 2. Fetch all modules this company has installed (private clones)
 // We match by name against public modules to find the mapping
  const myModulesResponse = await supabase
  .from('module_definitions')
  .select('id, name, config')
  .eq('company_id', companyId)
  .eq('is_active', 'true');
  const myModules = myModulesResponse?.data || [];

 const installed = {};
 for (const myMod of (myModules || [])) {
 // If it has a source_module_id in config, use that for direct mapping
 if (myMod.config?.source_module_id) {
 installed[myMod.config.source_module_id] = myMod.id;
} else {
 // Fallback: match by name against public modules (for legacy installs)
 const matchingPublic = mods.find(pm => pm.name === myMod.name && pm.company_id !== companyId);
 if (matchingPublic) {
 installed[matchingPublic.id] = myMod.id;
}
}
}
 setInstalledMap(installed);
} catch (err) {
 console.error(err);
 toast({ title: "Error", description: "Failed to load marketplace slates.", variant: "destructive"});
} finally {
 setLoading(false);
}
};

 const handleInstall = async (mod) => {
 setInstallingId(mod.id);
 try {
 const newModuleId = crypto.randomUUID();
 const moduleError = await (async () => {
 try {
 const _payload = {
 id: newModuleId,
 company_id: companyId,
 name: mod.name,
 icon: mod.icon,
 config: { source_module_id: mod.id },
 is_active: true
};
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 await powerSync.execute(`INSERT INTO module_definitions (${_keys.join(', ')}) VALUES (${_keys.map(()=>'?').join(', ')})`, _vals);
 return null;
} catch(e) { return e;}
})();

 if (moduleError) throw moduleError;

  // Clone fields
  const fetchFieldsResponse = await supabase
  .from('field_definitions')
  .select('*')
  .eq('module_id', mod.id);
  
  if (!fetchFieldsResponse) throw new Error("Supabase query returned undefined for field_definitions.");
  const originalFields = fetchFieldsResponse.data;
  const fetchFieldsError = fetchFieldsResponse.error;

 if (fetchFieldsError) throw fetchFieldsError;

 if (originalFields && originalFields.length > 0) {
 const fieldsToInsert = originalFields.map(f => ({
 id: crypto.randomUUID(),
 company_id: companyId,
 module_id: newModuleId,
 name: f.name,
 field_type: f.field_type,
 is_required: f.is_required,
 options: f.options,
 order_index: f.order_index,
 created_at: new Date().toISOString()
}));
      for (const fieldPayload of fieldsToInsert) {
        const _keys = Object.keys(fieldPayload);
        const _vals = Object.values(fieldPayload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const _plhdr = _keys.map(()=>'?').join(', ');
        await powerSync.execute(`INSERT INTO field_definitions (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals);
      }
}

 setInstalledMap(prev => ({ ...prev, [mod.id]: newModuleId}));
 setInstallSuccessModal(mod);
 toast({
 title: "?? Slate Installed!",
 description: `${mod.name} is now in your workslate sidebar.`});

} catch (err) {
 console.error(err);
 toast({ title: "Installation Failed", description: err.message, variant: "destructive"});
} finally {
 setInstallingId(null);
}
};

 const handleUninstall = async (mod) => {
 const installedModuleId = installedMap[mod.id];
 if (!installedModuleId) return;

 setUninstallingId(mod.id);
 try {
 // Delete all records for this module
 await powerSync.execute(`DELETE FROM dynamic_records WHERE module_id = ?`, [installedModuleId]);
 // Delete all field definitions
 await powerSync.execute(`DELETE FROM field_definitions WHERE module_id = ?`, [installedModuleId]);
 // Delete the module definition itself
 await powerSync.execute(`DELETE FROM ${'module_definitions'.replace(/['"`]/g, '')} WHERE id = ?`, [installedModuleId]);
 const error = null;
 if (error) throw error;

 setInstalledMap(prev => {
 const next = { ...prev};
 delete next[mod.id];
 return next;
});

 toast({
 title: "Slate Uninstalled",
 description: `${mod.name} has been removed from your workslate.`});
} catch (err) {
 console.error(err);
 toast({ title: "Uninstall Failed", description: err.message, variant: "destructive"});
} finally {
 setUninstallingId(null);
 setConfirmUninstall(null);
}
};

 const filteredModules = modules.filter(m => {
 const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
 (m.description || '').toLowerCase().includes(searchQuery.toLowerCase());
 const matchesCategory = activeCategory === 'All';
 return matchesSearch && matchesCategory;
});

 const getIconComp = (iconName) => {
 if (!iconName) return Blocks;
 const ic = LucideIcons[iconName];
 if (ic && (typeof ic === 'function' || typeof ic === 'object')) return ic;
 return Blocks;
};

 return (
 <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
 {/* Header */}
 <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
 <PageHeader
 title="Slate Marketplace"
 subtitle="Discover and install community-built slates for your workslate."
 />
 <div className="flex items-center gap-3">
 <Badge variant="outline" className="h-8 gap-2.5 bg-primary/10 dark:bg-primary/20 text-primary border-primary/20">
 <ShieldCheck className="w-3.5 h-3.5" /> Free to Install
 </Badge>
 </div>
 </div>

 {/* Marketplace Intelligence Layer */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
   <div className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 p-5 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-indigo-200/50 hover:shadow-md transition-all">
     <div className="flex items-center justify-between mb-3">
       <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-indigo-500" /> Ecosystem Growth</h3>
       <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{modules.length} Available</span>
     </div>
     <p className="text-xs text-slate-500 mb-2">Total community-verified slates currently ready for one-click installation.</p>
     <div className="text-[10px] uppercase font-semibold text-indigo-600 tracking-wider">Expanding Library</div>
   </div>

   <div className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 p-5 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-emerald-200/50 hover:shadow-md transition-all">
     <div className="flex items-center justify-between mb-3">
       <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Platform Security</h3>
       <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">100% Audited</span>
     </div>
     <p className="text-xs text-slate-500 mb-2">All marketplace slates undergo automated security and schema validation.</p>
     <div className="text-[10px] uppercase font-semibold text-emerald-600 tracking-wider">Verified Safe</div>
   </div>

   <div className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 p-5 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-amber-200/50 hover:shadow-md transition-all">
     <div className="flex items-center justify-between mb-3">
       <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Adoption Velocity</h3>
       <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">High Demand</span>
     </div>
     <p className="text-xs text-slate-500 mb-2">Global tenant installations have increased across enterprise networks.</p>
     <div className="text-[10px] uppercase font-semibold text-amber-600 tracking-wider">Trending Upwards</div>
   </div>
 </div>

 {/* Filter Bar */}
 <div className="bg-white dark:bg-slate-900/40 dark:bg-slate-900/40 dark:bg-slate-900/50 dark:backdrop-blur-xl rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 p-4 flex flex-col md:flex-row gap-4 items-center justify-between hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
 {categories.map(cat => (
 <button
 key={cat}
 onClick={() => setActiveCategory(cat)}
 className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
 activeCategory === cat
 ? 'bg-primary text-white -emerald-600/20'
 : 'bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 hover:bg-slate-100 dark:hover:bg-slate-700'
}`}
 >
 {cat}
 </button>
 ))}
 </div>
 <div className="relative w-full md:w-80">
 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
 <Input
 placeholder="Search slates..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-10 h-11 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 border-primary/40 dark:border-primary/40 text-slate-900 dark:text-slate-100 dark:text-slate-100 dark:text-white placeholder:text-slate-400 rounded-xl w-full focus:bg-white dark:bg-slate-900/40 dark:bg-slate-900/40 dark:focus:bg-slate-800 transition-colors hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 />
 </div>
 </div>

 {/* Slate Grid */}
 {loading ? (
 <div className="py-24 flex justify-center">
 <OrbitLoader size="md" />
 </div>
 ) : filteredModules.length === 0 ? (
 <div className="py-24 flex flex-col items-center justify-center text-center px-4 bg-white dark:bg-slate-900/40 dark:bg-slate-900/40 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 border-dashed hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 dark:border-primary/40">
 <Blocks className="w-8 h-8 text-slate-400" />
 </div>
 <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 dark:text-slate-100 dark:text-white mb-2">No slates found</h3>
 <p className="text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
 {searchQuery
 ? "No slates match your search. Try a different term."
 : "No public slates available yet. Check back soon or publish your own!"}
 </p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
 {filteredModules.map((mod) => {
 const isInstalling = installingId === mod.id;
 const isUninstalling = uninstallingId === mod.id;
 const isOwned = ownedIds.has(mod.id);
 const isInstalled = !!installedMap[mod.id];
 const IconComp = getIconComp(mod.icon);

 return (
 <div
 key={mod.id}
 className={`bg-white dark:bg-slate-900/40 dark:bg-slate-900/40 dark:bg-slate-900 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 transition-all duration-300 flex flex-col overflow-hidden ${
 isInstalled || isOwned
 ? 'border-primary -emerald-500/10 ring-1 ring-primary/20'
 : 'border-primary/40 dark:border-primary/40 hover:border-primary/40 dark:hover:border-primary/40 hover:-translate-y-1'
}`}
 >
 <div className="p-6 sm:p-7 flex-1">
 <div className="flex justify-between items-start mb-6">
 <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900/40 dark:bg-slate-900/40 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 flex items-center justify-center p-3  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <IconComp className="w-8 h-8 text-primary" />
 </div>

 {(isInstalled || isOwned) ? (
 <Badge className="bg-primary/10 dark:bg-primary/20 text-primary border-primary/20 hover:bg-primary/20 font-extrabold gap-2.5 px-3 py-1.5 rounded-full ">
 <CheckCircle2 className="w-4 h-4" /> {isOwned ? 'Owned' : 'Installed'}
 </Badge>
 ) : (
 <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20 bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 px-3 py-1 rounded-full tracking-[0.04em]">
 Free
 </Badge>
 )}
 </div>

 <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 dark:text-slate-100 dark:text-white mb-1.5">{mod.name}</h3>
 <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-3.5 tracking-[0.04em]">
 Community Template
 </p>
 <p className="text-sm text-slate-500 mb-6 line-clamp-2 min-h-[40px] leading-relaxed">
 {mod.description || "Custom slate"}
 </p>
 </div>

 {/* Card Footer */}
 <div className="px-6 py-5 border-t border-primary/40 dark:border-primary/40 dark:border-primary/40 dark:border-primary/40 bg-slate-50/80 dark:bg-slate-900/50 flex items-center justify-between">
 <span className="text-xs font-semibold tracking-wide text-slate-500">
 {mod.fields_count ? `${mod.fields_count} fields` : 'Custom slate'}
 </span>

 {isOwned ? (
 <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-0 font-medium">Custom Slate</Badge>
 ) : isInstalled ? (
 <Button
 variant="outline"
 disabled={isUninstalling}
 onClick={() => setConfirmUninstall(mod)}
 className="h-10 px-5 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 font-semibold gap-2 transition-all"
 >
 {isUninstalling ? (
 <OrbitLoader size="sm" />
 ) : (
 <><Trash2 className="w-4 h-4" /> Uninstall</>
 )}
 </Button>
 ) : (
 <Button
 disabled={isInstalling}
 onClick={() => handleInstall(mod)}
 className="h-10 px-6 rounded-xl bg-primary hover:bg-primary text-white font-semibold -emerald-600/20 transition-all hover:translate-y-[-1px]"
 >
 {isInstalling ? (
 <OrbitLoader size="sm" />
 ) : (
 <><Download className="w-4 h-4 mr-2 opacity-80" /> Install</>
 )}
 </Button>
 )}
 </div>
 </div>
 );
})}
 </div>
 )}

 {/* Uninstall Confirmation Dialog */}
 <Dialog open={!!confirmUninstall} onOpenChange={(open) => !open && setConfirmUninstall(null)}>
 <DialogContent className="sm:max-w-[425px]">
 <DialogHeader>
 <DialogTitle>Uninstall Slate</DialogTitle>
 <DialogDescription className="pt-3">
 Are you sure you want to uninstall <strong>{confirmUninstall?.name}</strong>? This will remove the slate, all its fields, and all records from your workslate. This action cannot be undone.
 </DialogDescription>
 </DialogHeader>
 <DialogFooter className="mt-4">
 <Button variant="outline" onClick={() => setConfirmUninstall(null)}>Cancel</Button>
 <Button variant="destructive" onClick={() => handleUninstall(confirmUninstall)} disabled={!!uninstallingId}>
 {uninstallingId ? 'Uninstalling...' : 'Uninstall Slate'}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* Installation Success Dialog */}
 <Dialog open={!!installSuccessModal} onOpenChange={(open) => !open && setInstallSuccessModal(null)}>
 <DialogContent className="sm:max-w-[425px] flex flex-col items-center justify-center text-center p-8">
 <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 border-4 border-primary/5">
 <CheckCircle2 className="w-8 h-8 text-primary" />
 </div>
 <DialogHeader>
 <DialogTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100 dark:text-slate-100 dark:text-white text-center tracking-[-0.02em]">Installation Successful!</DialogTitle>
 </DialogHeader>
 <div className="text-slate-500 dark:text-slate-400 dark:text-slate-400 mt-2 text-[15px] leading-relaxed">
 <strong>{installSuccessModal?.name}</strong> has been successfully installed and added to your Slate sidebar. You can now start using it immediately.
 </div>
 <div className="mt-8 w-full">
 <Button className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90" onClick={() => setInstallSuccessModal(null)}>
 Awesome, thanks!
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}
