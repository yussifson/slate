import { supabase} from '@/api/supabaseClient';
import React, { useState, useEffect} from "react";
import { Button} from "@/components/ui/button";
import { Badge} from "@/components/ui/badge";
import { Input} from "@/components/ui/input";
import { useToast} from "@/components/ui/use-toast";
import { powerSync} from "@/api/PowerSyncConnector";
import { useCompanyId} from "@/hooks/useCompanyId";
import { Search, Loader2, CheckCircle2, Download, Trash2, ShieldCheck, Blocks} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import * as LucideIcons from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from "@/components/ui/dialog";

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
 const { data, error} = await supabase
 .from('module_definitions')
 .select('*')
 .eq('visibility', 'public')
 .eq('is_active', 'true');

 if (error) throw error;
 const mods = data || [];
 setModules(mods);

 // Identify which ones this company created (owned)
 const owned = new Set(mods.filter(m => m.company_id === companyId).map(m => m.id));
 setOwnedIds(owned);

 // 2. Fetch all modules this company has installed (private clones)
 // We match by name against public modules to find the mapping
 const { data: myModules} = await supabase
 .from('module_definitions')
 .select('id, name, config')
 .eq('company_id', companyId)
 .eq('is_active', 'true');

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
 const _p = {
 company_id: companyId,
 name: module.name,
 icon: module.icon,
 color: module.color,
 is_active: true
};
 const _k = Object.keys(_p);
 const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 await powerSync.execute(`INSERT INTO module_definitions (${_k.join(', ')}) VALUES (${_k.map(()=>'?').join(', ')})`, _v);
 return null;
} catch(e) { return e;}
})();

 if (moduleError) throw moduleError;

 // Clone fields
 const { data: originalFields, error: fetchFieldsError} = await supabase
 .from('field_definitions')
 .select('*')
 .eq('module_id', mod.id);

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
 const { error: fieldsError} = await (async () => { let _p = fieldsToInsert; if (Array.isArray(_p)) _p = _p[0]; const _k = Object.keys(_p); const _v = Object.values(_p).map(v => typeof v === 'object' ? JSON.stringify(v) : v); const _pl = _k.map(()=>'?').join(', '); await powerSync.execute(`INSERT INTO field_definitions (${_k.join(', ')}) VALUES (${_pl})`, _v);})();
 if (fieldsError) throw fieldsError;
}

 setInstalledMap(prev => ({ ...prev, [mod.id]: newModuleId}));
 setInstallSuccessModal(mod);
 toast({
 title: "?? Slate Installed!",
 description: `${mod.name} is now in your workslate sidebar.`,
});

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
 title: "Module Uninstalled",
 description: `${mod.name} has been removed from your workslate.`,
});
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
 <Badge variant="outline" className="h-8 gap-1.5 bg-primary/10 dark:bg-primary/20 text-primary border-primary/20">
 <ShieldCheck className="w-3.5 h-3.5" /> Free to Install
 </Badge>
 </div>
 </div>

 {/* Filter Bar */}
 <div className="bg-white dark:bg-slate-900/40 dark:bg-slate-900/40 dark:bg-slate-900/50 dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
 <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
 {categories.map(cat => (
 <button
 key={cat}
 onClick={() => setActiveCategory(cat)}
 className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
 activeCategory === cat
 ? 'bg-primary text-white -emerald-600/20'
 : 'bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
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
 className="pl-10 h-11 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 dark:text-slate-100 dark:text-white placeholder:text-slate-400 rounded-xl w-full focus:bg-white dark:bg-slate-900/40 dark:bg-slate-900/40 dark:focus:bg-slate-800 transition-colors"
 />
 </div>
 </div>

 {/* Slate Grid */}
 {loading ? (
 <div className="py-24 flex justify-center">
 <Loader2 className="w-8 h-8 animate-spin text-primary" />
 </div>
 ) : filteredModules.length === 0 ? (
 <div className="py-24 flex flex-col items-center justify-center text-center px-4 bg-white dark:bg-slate-900/40 dark:bg-slate-900/40 rounded-2xl border border-slate-200 border-dashed">
 <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-5 border border-slate-100 dark:border-slate-800 dark:border-slate-800">
 <Blocks className="w-8 h-8 text-slate-400" />
 </div>
 <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 dark:text-slate-100 dark:text-white mb-2">No slates found</h3>
 <p className="text-slate-500 dark:text-slate-400 dark:text-slate-400 max-w-md leading-relaxed">
 {searchQuery
 ? "No modules match your search. Try a different term."
 : "No public modules available yet. Check back soon or publish your own!"}
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
 className={`bg-white dark:bg-slate-900/40 dark:bg-slate-900/40 dark:bg-slate-900 rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden ${
 isInstalled || isOwned
 ? 'border-primary -emerald-500/10 ring-1 ring-primary/20'
 : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-1'
}`}
 >
 <div className="p-6 sm:p-7 flex-1">
 <div className="flex justify-between items-start mb-6">
 <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-3 ">
 <IconComp className="w-8 h-8 text-primary" />
 </div>

 {(isInstalled || isOwned) ? (
 <Badge className="bg-primary/10 dark:bg-primary/20 text-primary border-primary/20 hover:bg-primary/20 font-extrabold gap-1.5 px-3 py-1.5 rounded-full ">
 <CheckCircle2 className="w-4 h-4" /> {isOwned ? 'Owned' : 'Installed'}
 </Badge>
 ) : (
 <Badge variant="outline" className="text-xs font-bold text-primary border-primary/20 bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 px-3 py-1 rounded-full">
 Free
 </Badge>
 )}
 </div>

 <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 dark:text-slate-100 dark:text-white mb-1.5">{mod.name}</h3>
 <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-3.5">
 Community Template
 </p>
 <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
 {mod.description || "A powerful community-built module to streamline your workflow and data management."}
 </p>
 </div>

 {/* Card Footer */}
 <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 dark:border-slate-800 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 flex items-center justify-between">
 <span className="text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-400">
 {mod.fields_count ? `${mod.fields_count} fields` : 'Custom module'}
 </span>

 {isOwned ? (
 <Badge variant="outline" className="font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 border-slate-200 px-4 py-2 rounded-xl">
 Your Module
 </Badge>
 ) : isInstalled ? (
 <Button
 variant="outline"
 disabled={isUninstalling}
 onClick={() => setConfirmUninstall(mod)}
 className="h-10 px-5 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 font-bold gap-2 transition-all"
 >
 {isUninstalling ? (
 <Loader2 className="w-4 h-4 animate-spin" />
 ) : (
 <><Trash2 className="w-4 h-4" /> Uninstall</>
 )}
 </Button>
 ) : (
 <Button
 disabled={isInstalling}
 onClick={() => handleInstall(mod)}
 className="h-10 px-6 rounded-xl bg-primary hover:bg-primary text-white font-bold -emerald-600/20 transition-all hover:translate-y-[-1px]"
 >
 {isInstalling ? (
 <Loader2 className="w-4 h-4 animate-spin" />
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
 <DialogDescription>
 Are you sure you want to uninstall <strong>{confirmUninstall?.name}</strong>? This will remove the module, all its fields, and all records from your workslate. This action cannot be undone.
 </DialogDescription>
 </DialogHeader>
 <DialogFooter className="mt-4">
 <Button variant="outline" onClick={() => setConfirmUninstall(null)}>Cancel</Button>
 <Button variant="destructive" onClick={() => handleUninstall(confirmUninstall)} disabled={!!uninstallingId}>
 {uninstallingId ? 'Uninstalling...' : 'Uninstall Module'}
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
 <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100 dark:text-slate-100 dark:text-white text-center">Installation Successful!</DialogTitle>
 </DialogHeader>
 <div className="text-slate-500 dark:text-slate-400 dark:text-slate-400 mt-2 text-[15px] leading-relaxed">
 <strong>{installSuccessModal?.name}</strong> has been successfully installed and added to your Slate sidebar. You can now start using it immediately.
 </div>
 <div className="mt-8 w-full">
 <Button className="w-full h-11 text-base font-bold bg-primary hover:bg-primary/90" onClick={() => setInstallSuccessModal(null)}>
 Awesome, thanks!
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}
