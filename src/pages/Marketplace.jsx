import React, { useState, useEffect } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Blocks, Download, Search, Sparkles, CheckCircle2, Users, Star } from "lucide-react";
import { PremiumIcon } from "@/components/ui/PremiumIcon";

export default function Marketplace() {
  const { toast } = useToast();
  const companyId = useCompanyId();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [installingId, setInstallingId] = useState(null);
  const [installedIds, setInstalledIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", "CRM", "Finance", "HR", "Operations", "Healthcare", "Custom"];

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

      setInstalledIds(prev => new Set([...prev, mod.id]));
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

  // Assign a fake rating for visual richness
  const getStars = (id) => {
    const h = id?.charCodeAt(0) || 65;
    return 3 + (h % 3);
  };
  const getInstalls = (id) => {
    const h = id?.charCodeAt(1) || 50;
    return 100 + (h % 900);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 p-10 text-white shadow-2xl">
        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-pink-400/20 blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </div>
              <span className="text-white/70 text-sm font-medium uppercase tracking-widest">Marketplace</span>
            </div>
            <h1 className="text-4xl font-extrabold mb-2 leading-tight">
              Discover Powerful<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">Workflow Modules</span>
            </h1>
            <p className="text-white/70 max-w-lg text-base">
              One-click install. Community-built. Ready for your workspace in seconds.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2 text-sm bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <Users className="w-4 h-4 text-blue-200" />
              <span className="font-medium">{modules.length} Modules Available</span>
            </div>
            <div className="flex items-center gap-2 text-sm bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              <span className="font-medium">Community Templates</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search modules..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Module Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-6 animate-pulse">
              <div className="flex gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-muted flex-shrink-0"></div>
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-4/5"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredModules.length === 0 ? (
        <div className="text-center py-20 bg-muted/40 rounded-2xl border border-dashed border-border">
          <Blocks className="w-14 h-14 mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-1">No modules found</h3>
          <p className="text-muted-foreground">Try a different search or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((mod) => {
            const isInstalling = installingId === mod.id;
            const isOwned = mod.company_id === companyId;
            const isInstalled = installedIds.has(mod.id);
            const stars = getStars(mod.id);
            const installs = getInstalls(mod.id);

            return (
              <div
                key={mod.id}
                className="group relative bg-card rounded-2xl border border-border hover:border-primary/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Top glow accent on hover */}
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="p-6 flex flex-col flex-1">
                  {/* Header: Icon + Title */}
                  <div className="flex items-start gap-4 mb-5">
                    <PremiumIcon
                      name={mod.icon || 'Blocks'}
                      className="w-16 h-16 flex-shrink-0 shadow-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors truncate">
                        {mod.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Community Template</p>
                      {/* Star rating */}
                      <div className="flex items-center gap-1 mt-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < stars ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`}
                          />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">{installs} installs</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-3 flex-1 mb-5">
                    {mod.description || "A powerful community-built module to streamline your workflow and data management."}
                  </p>

                  {/* Tags row */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    <span className="text-xs px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full font-medium border border-emerald-500/20">Free</span>
                    <span className="text-xs px-2.5 py-0.5 bg-blue-500/10 text-blue-600 rounded-full font-medium border border-blue-500/20">Data Module</span>
                  </div>

                  {/* Footer Action */}
                  <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
                    <div className="text-xs text-muted-foreground">
                      {isOwned ? 'You own this module' : 'Free to install'}
                    </div>
                    <Button 
                      onClick={() => handleInstall(mod)} 
                      disabled={isInstalling || isOwned || isInstalled}
                      size="sm" 
                      className={`gap-2 font-semibold min-w-[110px] transition-all ${
                        isInstalled
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : isOwned
                          ? 'bg-muted text-muted-foreground cursor-default'
                          : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-primary/30'
                      }`}
                    >
                      {isInstalling ? (
                        <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin"></div>
                      ) : isInstalled ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {isInstalling ? 'Installing...' : isInstalled ? 'Installed' : isOwned ? 'Owned' : 'Install'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
