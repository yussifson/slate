import { supabase} from '@/api/supabaseClient';
import React, { useState, useEffect} from "react";
import { powerSync} from "@/api/PowerSyncConnector";
import {X, Search, Check, Layers} from "lucide-react";
import { Button} from "@/components/ui/button";
import { Input} from "@/components/ui/input";
import { useToast} from "@/components/ui/use-toast";
import { UNIVERSAL_COMPONENTS} from "@/config/universal_components";
import { OrbitLoader } from "@/components/ui/orbit-loader";

export default function FirmFeaturesManager({ firm, onClose}) {
 const { toast} = useToast();
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [search, setSearch] = useState("");
 
 // Array of component_ids currently assigned to the firm
 const [assignedFeatures, setAssignedFeatures] = useState([]);
 const [recordId, setRecordId] = useState(null);
 const [rawConfig, setRawConfig] = useState(null);

 useEffect(() => {
 fetchFirmFeatures();
}, [firm.id]);

 const fetchFirmFeatures = async () => {
 setLoading(true);
 try {
 const { data, error} = await supabase
 .from("industry_records")
 .select("id, data")
 .eq("company_id", firm.id)
 .eq("industry", "orbit_build")
 .eq("record_type", "workspace_config")
 .maybeSingle();

 if (error) throw error;

 if (data) {
 setRecordId(data.id);
 setRawConfig(data.data);
 const pages = data.data.pages || [];
 setAssignedFeatures(pages.map(p => p.component_id));
} else {
 // Firm does not have an orbit_build config yet
 setRawConfig({ industry_name: 'Custom', industry_type: 'orbit_build', pages: []});
}
} catch (e) {
 toast({ title: "Error fetching features", description: e.message, variant: "destructive"});
} finally {
 setLoading(false);
}
};

 const toggleFeature = (component) => {
 if (assignedFeatures.includes(component.id)) {
 setAssignedFeatures(prev => prev.filter(id => id !== component.id));
} else {
 setAssignedFeatures(prev => [...prev, component.id]);
}
};

 const handleSave = async () => {
 setSaving(true);
 try {
 // Rebuild the pages array based on assignedFeatures
 // We will match the IDs to the UNIVERSAL_COMPONENTS list to get labels
 const newPages = assignedFeatures.map(id => {
 const comp = UNIVERSAL_COMPONENTS.find(c => c.id === id);
 return {
 page_name: comp ? comp.label : id,
 component_id: id,
 icon: comp ? comp.icon : "LayoutGrid"
};
});

 const updatedData = {
 ...rawConfig,
 pages: newPages
};

 if (recordId) {
 const { error} = await supabase
 .from("industry_records")
 .update({ data: updatedData})
 .eq("id", recordId);
 if (error) throw error;
} else {
 const { error} = await supabase
 .from("industry_records")
 .insert({
 company_id: firm.id,
 industry: "orbit_build",
 record_type: "workspace_config",
 data: updatedData
});
 if (error) throw error;
}

 toast({ title: "Features successfully assigned to firm!"});
 onClose();
} catch (e) {
 toast({ title: "Failed to save features", description: e.message, variant: "destructive"});
} finally {
 setSaving(false);
}
};

 const filteredComponents = UNIVERSAL_COMPONENTS.filter(c => 
 c.label.toLowerCase().includes(search.toLowerCase()) || 
 c.id.toLowerCase().includes(search.toLowerCase())
 );

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm animate-in fade-in">
 <div className="bg-card w-full max-w-4xl rounded-2xl flex flex-col max-h-[90vh] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 
 <div className="p-5 border-b border-primary/40 flex justify-between items-center bg-muted/20 shrink-0">
 <div>
 <h2 className="text-xl font-black flex items-center gap-2">
 <Layers className="w-5 h-5 text-primary" /> Manage Firm Features
 </h2>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">Assigning universal components to <strong className="text-foreground">{firm.name}</strong></p>
 </div>
 <button onClick={onClose} className="p-2 hover:bg-muted rounded-full text-[#71717a] dark:text-gray-400 transition-colors">
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-5 border-b border-primary/40 shrink-0">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <Input 
 placeholder="Search 200+ available features..." 
 className="pl-9 bg-background "
 value={search}
 onChange={e => setSearch(e.target.value)}
 />
 </div>
 </div>

 <div className="flex-1 overflow-auto custom-scrollbar p-5 bg-muted/10">
 {loading ? (
 <div className="flex flex-col items-center justify-center h-full text-[#71717a] dark:text-gray-400 gap-3">
 <OrbitLoader size="md" />
 <p>Loading assigned features...</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
 {filteredComponents.map(comp => {
 const isAssigned = assignedFeatures.includes(comp.id);
 return (
 <button
 key={comp.id}
 onClick={() => toggleFeature(comp)}
 className={`flex items-start gap-3 p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 text-left transition-all ${
 isAssigned 
 ? 'bg-primary/5 border-primary/40 ' 
 : 'bg-background border-primary/40 hover:border-primary/30 hover:bg-muted/30'
}`}
 >
 <div className={`mt-0.5 w-4 h-4 rounded-md-[4px] border-[0.5px] border-black/9 dark:border-white/8 flex items-center justify-center shrink-0 transition-colors ${
 isAssigned ? 'bg-primary border-primary text-white' : 'border-muted-foreground/30 bg-background'
}`}>
 {isAssigned && <Check className="w-3 h-3" />}
 </div>
 <div className="min-w-0">
 <p className={`text-sm font-semibold truncate leading-tight ${isAssigned ? 'text-primary' : 'text-foreground'}`}>
 {comp.label}
 </p>
 <p className="text-[10px] text-[#71717a] dark:text-gray-400 truncate mt-0.5 font-mono">
 {comp.id}
 </p>
 </div>
 </button>
 );
})}
 {filteredComponents.length === 0 && (
 <div className="col-span-full py-12 text-center text-[#71717a] dark:text-gray-400">
 No features found matching "{search}"
 </div>
 )}
 </div>
 )}
 </div>

 <div className="p-5 border-t border-primary/40 flex justify-between items-center bg-background shrink-0 rounded-md-b-2xl">
 <p className="text-sm text-[#71717a] dark:text-gray-400 font-medium">
 <strong className="text-foreground">{assignedFeatures.length}</strong> features assigned
 </p>
 <div className="flex gap-3">
 <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
 <Button onClick={handleSave} disabled={loading || saving} className="">
 {saving ? <><OrbitLoader size="sm" /> Saving...</> : 'Save Feature Assignments'}
 </Button>
 </div>
 </div>

 </div>
 </div>
 );
}
