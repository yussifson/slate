import React, { useState, useEffect } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Blocks, Download, Search, Sparkles } from "lucide-react";
import * as Icons from "lucide-react";

export default function Marketplace() {
  const { toast } = useToast();
  const companyId = useCompanyId();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [installingId, setInstallingId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchPublicModules();
  }, []);

  const fetchPublicModules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('module_definitions')
        .select('*')
        .eq('visibility', 'public')
        .eq('is_active', 'true');
        
      if (error) throw error;
      setModules(data || []);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load marketplace modules.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (mod) => {
    setInstallingId(mod.id);
    try {
      const newModuleId = crypto.randomUUID();
      const { error: moduleError } = await supabase.from('module_definitions').insert({
        id: newModuleId,
        company_id: companyId,
        name: mod.name,
        description: mod.description,
        icon: mod.icon,
        is_active: 'true',
        visibility: 'private',
        created_at: new Date().toISOString()
      });

      if (moduleError) throw moduleError;

      const { data: originalFields, error: fetchFieldsError } = await supabase
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

        const { error: fieldsError } = await supabase.from('field_definitions').insert(fieldsToInsert);
        if (fieldsError) throw fieldsError;
      }

      toast({
        title: "🎉 Module Installed Successfully!",
        description: `${mod.name} is now ready to use in your workspace.`,
      });
      
    } catch (err) {
      console.error(err);
      toast({ title: "Installation Failed", description: err.message, variant: "destructive" });
    } finally {
      setInstallingId(null);
    }
  };

  const filteredModules = modules.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-primary/90 to-primary/70 p-8 rounded-2xl text-primary-foreground shadow-lg">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2"><Sparkles className="w-8 h-8"/> Module Marketplace</h1>
          <p className="text-primary-foreground/80 max-w-xl">Discover, install, and share custom workflows and data modules built by the community. Add powerful new capabilities to your workspace in one click.</p>
        </div>
      </div>

      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search public modules..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        </div>
      ) : filteredModules.length === 0 ? (
        <div className="text-center p-12 bg-muted rounded-xl border border-dashed border-border">
          <Blocks className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-medium text-foreground">No public modules found</h3>
          <p className="text-muted-foreground">Check back later or publish your own module!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((mod) => {
            const IconComp = Icons[mod.icon] || Blocks;
            return (
              <div key={mod.id} className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{mod.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Community Template</p>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-6 flex-1 line-clamp-3">
                  {mod.description || "No description provided for this module."}
                </p>
                
                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs font-medium px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded-full">Free</span>
                  <Button 
                    onClick={() => handleInstall(mod)} 
                    disabled={installingId === mod.id || mod.company_id === companyId}
                    size="sm" 
                    className="gap-2"
                  >
                    {installingId === mod.id ? (
                      <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin"></div>
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {mod.company_id === companyId ? "Owned" : "Install"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
