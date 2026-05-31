import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Search, Loader2, CheckCircle2, Download, ExternalLink, ShieldCheck, Blocks } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import * as LucideIcons from "lucide-react";

export default function Marketplace() {
  const { toast } = useToast();
  const companyId = useCompanyId();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [installingId, setInstallingId] = useState(null);
  const [installedIds, setInstalledIds] = useState(new Set());
  const [ownedIds, setOwnedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", "CRM", "Finance", "HR", "Operations", "Healthcare", "Custom"];

  useEffect(() => {
    fetchPublicModules();
  }, [companyId]);

  const fetchPublicModules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('module_definitions')
        .select('*')
        .eq('visibility', 'public')
        .eq('is_active', 'true');

      if (error) throw error;

      const mods = data || [];
      setModules(mods);

      // Identify which ones this company already owns (was the creator)
      if (companyId) {
        const owned = new Set(mods.filter(m => m.company_id === companyId).map(m => m.id));
        setOwnedIds(owned);
      }
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
        status: 'published',
        config: mod.config || {},
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
        title: "🎉 Module Installed!",
        description: `${mod.name} is now in your workspace.`,
      });

    } catch (err) {
      console.error(err);
      toast({ title: "Installation Failed", description: err.message, variant: "destructive" });
    } finally {
      setInstallingId(null);
    }
  };

  const filteredModules = modules.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All'; // Categories will be added dynamically when modules have them
    return matchesSearch && matchesCategory;
  });

  // Derive a safe icon component
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
          title="Module Marketplace"
          subtitle="Discover and install community-built modules for your workspace."
        />
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="h-8 gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" /> Free to Install
          </Badge>
        </div>
      </div>

      {/* Filter Bar — matches Integrations exactly */}
      <div className="bg-white dark:bg-slate-900/50 dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm dark:shadow-lg flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl w-full focus:bg-white dark:focus:bg-slate-800 transition-colors"
          />
        </div>
      </div>

      {/* Module Grid — matches Integrations card layout exactly */}
      {loading ? (
        <div className="py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredModules.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-center px-4 bg-white rounded-2xl border border-slate-200 border-dashed">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-5 border border-slate-100">
            <Blocks className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">No modules found</h3>
          <p className="text-slate-500 max-w-md leading-relaxed">
            {searchQuery
              ? "No modules match your search. Try a different term."
              : "No public modules available yet. Check back soon or publish your own!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredModules.map((mod) => {
            const isInstalling = installingId === mod.id;
            const isOwned = ownedIds.has(mod.id);
            const isInstalled = installedIds.has(mod.id);
            const IconComp = getIconComp(mod.icon);

            return (
              <div
                key={mod.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden ${
                  isInstalled || isOwned
                    ? 'border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-1'
                }`}
              >
                <div className="p-6 sm:p-7 flex-1">
                  <div className="flex justify-between items-start mb-6">
                    {/* Icon box — same style as Integrations logo box */}
                    <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 dark:border-slate-700 flex items-center justify-center p-3 shadow-sm">
                      <IconComp className="w-8 h-8 text-blue-600" />
                    </div>

                    {(isInstalled || isOwned) ? (
                      <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 font-extrabold gap-1.5 px-3 py-1.5 rounded-full shadow-sm">
                        <CheckCircle2 className="w-4 h-4" /> {isOwned ? 'Owned' : 'Installed'}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs font-bold text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full">
                        Free
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1.5">{mod.name}</h3>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3.5">
                    Community Template
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {mod.description || "A powerful community-built module to streamline your workflow and data management."}
                  </p>
                </div>

                {/* Card Footer — matches Integrations */}
                <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                    {mod.fields_count ? `${mod.fields_count} fields` : 'Custom module'}
                  </span>

                  {isOwned ? (
                    <Badge variant="outline" className="font-bold text-slate-500 border-slate-200 px-4 py-2 rounded-xl">
                      Your Module
                    </Badge>
                  ) : isInstalled ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold gap-1.5 px-4 py-2 rounded-xl">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Installed
                    </Badge>
                  ) : (
                    <Button
                      disabled={isInstalling}
                      onClick={() => handleInstall(mod)}
                      className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-600/20 transition-all hover:translate-y-[-1px]"
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
    </div>
  );
}
