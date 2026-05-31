import React, { useState, useEffect } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus, RefreshCw, BarChart2, ShieldCheck, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import DynamicTable from "@/components/ui/DynamicTable";
import DynamicForm from "@/components/ui/DynamicForm";
import DynamicDashboard from "@/components/ui/DynamicDashboard";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function GenericModulePage({ title: propTitle, description: propDescription }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const path = window.location.pathname;
  
  const [moduleDef, setModuleDef] = useState(null);
  const [fieldDefs, setFieldDefs] = useState([]);
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [visibility, setVisibility] = useState('private');
  const [sharedWith, setSharedWith] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const fetchDynamicData = async () => {
    try {
      setIsLoading(true);
      const slug = window.location.pathname.replace(/^\/m\//, '').replace(/^\//, '').split('/')[0];
      const companyId = user?.company_id;
      if (!companyId || !slug) return;

      // Fetch all active modules for this company directly from Supabase
      const { data: allModules } = await supabase
        .from('module_definitions')
        .select('*')
        .eq('is_active', 'true')
        .or(`company_id.eq.${companyId},shared_with.ilike.%${companyId}%`);

      const matched = (allModules || []).find(
        m => m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === slug
      );

      const mod = matched || (allModules && allModules[0]);
      if (!mod) return;

      setModuleDef(mod);
      setVisibility(mod.visibility || 'private');
      setSharedWith(mod.shared_with || '');

      const { data: fields } = await supabase
        .from('field_definitions')
        .select('*')
        .eq('module_id', mod.id)
        .order('order_index', { ascending: true });
      setFieldDefs(fields || []);

      const { data: recs } = await supabase
        .from('dynamic_records')
        .select('*')
        .eq('module_id', mod.id)
        .order('created_at', { ascending: false });
      const parsedRecords = (recs || []).map(r => ({ ...r, data: typeof r.data === 'string' ? JSON.parse(r.data || '{}') : (r.data || {}) }));
      setRecords(parsedRecords);
    } catch (err) {
      console.error("Failed to load dynamic module", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) fetchDynamicData();
  }, [path, user?.company_id]);

  const title = propTitle || moduleDef?.name || "Dynamic Workspace";
  const description = propDescription || moduleDef?.description || "Loading configuration...";

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    fetchDynamicData(); // Refresh records
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const { error } = await supabase
        .from('module_definitions')
        .update({ visibility, shared_with: sharedWith })
        .eq('id', moduleDef.id);
        
      if (error) throw error;
      
      toast({ title: "Settings Saved", description: "Module visibility updated." });
      setIsSettingsOpen(false);
      fetchDynamicData();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title={title}
        subtitle={description}
        actions={
          <div className="flex gap-2">
            <Button onClick={() => setIsSettingsOpen(true)} variant="outline" size="sm" className="gap-1.5 shadow-sm">
              <ShieldCheck className="w-4 h-4" /> Share
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="gap-1.5 shadow-sm bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4" /> Add Record
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-card rounded-xl border border-border p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Records</p>
            <p className="text-2xl font-bold text-foreground">{records.length}</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-primary" />
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Module Status</p>
            <p className="text-2xl font-bold text-foreground">Active</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Custom Fields</p>
            <p className="text-2xl font-bold text-foreground">{fieldDefs.length}</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>

      {!isLoading && moduleDef && (
        <DynamicDashboard records={records} moduleDef={moduleDef} />
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm p-6 mt-6">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <RefreshCw className="w-8 h-8 animate-spin mb-4" />
            <p>Loading module definitions...</p>
          </div>
        ) : !moduleDef ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <Sparkles className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="font-medium text-foreground text-lg">No Dynamic Modules Found</p>
            <p className="text-sm mt-1">Use the AI Assistant to generate a new module.</p>
          </div>
        ) : (
          <DynamicTable data={records} fieldDefinitions={fieldDefs} />
        )}
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add New Record</DialogTitle>
            <DialogDescription>
              Fill out the form below to create a new record in {title}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 overflow-y-auto flex-1 pr-2">
            {moduleDef && (
              <DynamicForm 
                moduleDef={moduleDef} 
                fieldDefinitions={fieldDefs} 
                onSuccess={handleAddSuccess}
                onCancel={() => setIsAddModalOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Module Sharing Settings</DialogTitle>
            <DialogDescription>Control who has access to this module.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Visibility</label>
              <select 
                value={visibility} 
                onChange={e => setVisibility(e.target.value)}
                className="w-full border border-input bg-background text-foreground rounded-md px-3 py-2 text-sm"
              >
                <option value="private">Private (Only my workspace)</option>
                <option value="shared">Shared (Specific workspaces)</option>
                <option value="public">Public (Marketplace Template)</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {visibility === 'public' && "This module's configuration will be available in the public Marketplace for anyone to install."}
                {visibility === 'private' && "Only users in your firm can access this module."}
                {visibility === 'shared' && "Users from the specified workspaces can access this module."}
              </p>
            </div>

            {visibility === 'shared' && (
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <label className="block text-sm font-medium text-foreground mb-1">Shared Workspace IDs</label>
                <input 
                  type="text" 
                  value={sharedWith}
                  onChange={e => setSharedWith(e.target.value)}
                  placeholder="Comma-separated workspace IDs"
                  className="w-full border border-input bg-background text-foreground rounded-md px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">Enter the Company ID of the workspace you want to share with.</p>
              </div>
            )}

            <div className="pt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {isSavingSettings ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
