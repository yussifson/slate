import React, { useState, useEffect, Suspense, lazy } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus, RefreshCw, BarChart2, ShieldCheck, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import DynamicTable from "@/components/ui/DynamicTable";
import DynamicGrid from "@/components/ui/DynamicGrid";
import DynamicForm from "@/components/ui/DynamicForm";
import DynamicDashboard from "@/components/ui/DynamicDashboard";
import DynamicKanbanView from "@/components/ui/DynamicKanbanView";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { useImpersonation } from "@/lib/ImpersonationContext";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import OrbitBoltWorkspace from "@/components/orbitbolt/OrbitBoltWorkspace";
import SecureSandbox from "@/components/orbitbolt/SecureSandbox";

// Lazy-loaded view components for new module types
const DynamicCalendarView = lazy(() => import("@/components/ui/DynamicCalendarView"));
const DynamicTimelineView = lazy(() => import("@/components/ui/DynamicTimelineView"));
const DynamicDirectoryView = lazy(() => import("@/components/ui/DynamicDirectoryView"));
const DynamicGalleryView = lazy(() => import("@/components/ui/DynamicGalleryView"));
const DynamicSpreadsheetView = lazy(() => import("@/components/ui/DynamicSpreadsheetView"));
const DynamicReportView = lazy(() => import("@/components/ui/DynamicReportView"));
const DynamicPipelineView = lazy(() => import("@/components/ui/DynamicPipelineView"));
const DynamicApprovalView = lazy(() => import("@/components/ui/DynamicApprovalView"));
const DynamicFormWizard = lazy(() => import("@/components/ui/DynamicFormWizard"));
const DynamicInventoryView = lazy(() => import("@/components/ui/DynamicInventoryView"));

export default function GenericModulePage({ title: propTitle, description: propDescription }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { impersonatedCompany } = useImpersonation();
  const navigate = useNavigate();
  const path = window.location.pathname;
  
  const activeIndustry = sessionStorage.getItem('slate_industry_override') || impersonatedCompany?.industry_type || user?.company_industry || 'law';

  const [moduleDef, setModuleDef] = useState(null);
  const [fieldDefs, setFieldDefs] = useState([]);
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBoltOpen, setIsBoltOpen] = useState(false);
  const [visibility, setVisibility] = useState('private');
  const [sharedWith, setSharedWith] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const isAdmin = ["super_admin", "admin", "company_admin", "managing_partner"].includes(user?.role);

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
        .eq('is_active', true)
        .or(`company_id.eq.${companyId},shared_with.ilike.%${companyId}%`);

      const matched = (allModules || []).find(
        m => m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === slug
      );

      const mod = matched || (allModules && allModules[0]);
      if (!mod) return;
      
      // Enforce industry isolation — redirect on mismatch (prevents URL forgery)
      if (mod.industry_type && mod.industry_type !== activeIndustry) {
        toast({ title: "Access Denied", description: "This module is not available in the current workspace.", variant: "destructive" });
        navigate('/', { replace: true });
        return;
      }

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

      // Direct Share Cloning Logic
      if (visibility === 'shared' && sharedWith.trim().length > 0) {
        const ids = sharedWith.split(',').map(id => id.trim()).filter(Boolean);
        for (const targetCompanyId of ids) {
          // Check if already cloned to this company
          const { data: existing } = await supabase
            .from('module_definitions')
            .select('id')
            .eq('company_id', targetCompanyId)
            .eq('name', moduleDef.name);

          if (!existing || existing.length === 0) {
            // Clone module as draft
            const newModuleId = crypto.randomUUID();
            await supabase.from('module_definitions').insert({
              id: newModuleId,
              company_id: targetCompanyId,
              name: moduleDef.name,
              description: moduleDef.description,
              icon: moduleDef.icon,
              config: moduleDef.config,
              status: 'draft',
              is_active: 'true',
              created_at: new Date().toISOString()
            });

            // Clone fields
            const newFields = fieldDefs.map(f => ({
              id: crypto.randomUUID(),
              company_id: targetCompanyId,
              module_id: newModuleId,
              name: f.name,
              field_type: f.field_type,
              is_required: f.is_required,
              options: f.options,
              order_index: f.order_index,
              created_at: new Date().toISOString()
            }));
            if (newFields.length > 0) {
              await supabase.from('field_definitions').insert(newFields);
            }
          }
        }
      }
      
      toast({ title: "Settings Saved", description: "Module sharing and visibility updated." });
      setIsSettingsOpen(false);
      fetchDynamicData();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const layoutConfig = moduleDef?.config?.layout || 'table';
  const themeConfig = 'primary'; // Enforce unified Optavel theme across all suites
  const pageType = moduleDef?.config?.page_type || 'data_module';

  const renderModuleContent = () => {
    if (isLoading) {
      return (
        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground bg-card rounded-xl border border-border mt-6">
          <RefreshCw className="w-8 h-8 animate-spin mb-4" />
          <p>Loading module definitions...</p>
        </div>
      );
    }
    if (!moduleDef) {
      return (
        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground bg-card rounded-xl border border-border mt-6">
          <Sparkles className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <p className="font-medium text-foreground text-lg">No Dynamic Modules Found</p>
          <p className="text-sm mt-1">Use the AI Assistant to generate a new module.</p>
        </div>
      );
    }

    // Standard props for all dynamic views
    const viewProps = {
      data: records,
      fieldDefinitions: fieldDefs,
      moduleDef: moduleDef,
      onRefresh: fetchDynamicData,
    };

    const suspenseFallback = (
      <div className="h-64 flex flex-col items-center justify-center text-muted-foreground bg-card rounded-xl border border-border">
        <RefreshCw className="w-6 h-6 animate-spin mb-3" />
        <p className="text-sm">Loading view...</p>
      </div>
    );

    const wrapView = (ViewComponent, extraProps = {}) => (
      <div className="mt-6">
        <Suspense fallback={suspenseFallback}>
          <ViewComponent {...viewProps} {...extraProps} />
        </Suspense>
      </div>
    );

    switch (pageType) {
      case 'dashboard':
        return (
          <div className="mt-6">
            <DynamicDashboard records={records} moduleDef={moduleDef} />
          </div>
        );

      case 'kanban':
        return (
          <div className="mt-6 bg-card rounded-xl border border-border shadow-sm p-4 overflow-hidden">
            <DynamicKanbanView 
              records={records} 
              moduleDef={moduleDef} 
              fieldDefinitions={fieldDefs} 
              onRecordUpdated={fetchDynamicData} 
            />
          </div>
        );

      case 'calendar_view':
        return wrapView(DynamicCalendarView);

      case 'timeline':
        return wrapView(DynamicTimelineView);

      case 'directory':
        return wrapView(DynamicDirectoryView);

      case 'gallery':
        return wrapView(DynamicGalleryView);

      case 'spreadsheet':
        return wrapView(DynamicSpreadsheetView);

      case 'report':
        return wrapView(DynamicReportView);

      case 'crm_pipeline':
        return wrapView(DynamicPipelineView);

      case 'approval_workflow':
        return wrapView(DynamicApprovalView);

      case 'form_builder':
        return wrapView(DynamicFormWizard);

      case 'inventory':
        return wrapView(DynamicInventoryView);

      case 'custom_sandbox':
        return (
          <div className="mt-6">
            <SecureSandbox 
              code={moduleDef.config?.custom_code || ""} 
              initialData={{ records, fieldDefs, moduleDef }} 
            />
          </div>
        );

      case 'data_module':
      case 'document_manager':
      default:
        return (
          <div className={`${layoutConfig === 'table' ? 'bg-card rounded-xl border border-border overflow-hidden shadow-sm p-6' : ''} mt-6`}>
            {layoutConfig === 'table' ? (
              <DynamicTable data={records} fieldDefinitions={fieldDefs} moduleDef={moduleDef} onRefresh={fetchDynamicData} />
            ) : (
              <DynamicGrid data={records} fieldDefinitions={fieldDefs} theme={themeConfig} onRefresh={fetchDynamicData} />
            )}
          </div>
        );
    }
  };

  return (
    <div className={`space-y-6 animate-in fade-in duration-300 ${themeConfig !== 'primary' ? `theme-${themeConfig}` : ''}`}>
      <PageHeader
        title={title}
        subtitle={description}
        actions={
                  <div className="flex gap-2">
            <Button onClick={() => setIsSettingsOpen(true)} variant="outline" size="sm" className="gap-1.5 shadow-sm">
              <ShieldCheck className="w-4 h-4" /> Share
            </Button>
            {isAdmin && (
              <Button onClick={() => setIsBoltOpen(true)} variant="outline" size="sm" className="gap-1.5 shadow-sm border-primary/30 text-primary hover:bg-primary/10">
                <Sparkles className="w-4 h-4" /> OrbitBolt
              </Button>
            )}
            <Button onClick={() => setIsAddModalOpen(true)} size="sm" className={`gap-1.5 shadow-sm text-white ${themeConfig === 'primary' ? 'bg-primary hover:bg-primary/90' : `bg-${themeConfig}-600 hover:bg-${themeConfig}-700`}`}>
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
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
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

      {renderModuleContent()}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Record</DialogTitle>
            <DialogDescription>
              Fill out the form below to create a new record in {title}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
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
                <p className="text-xs text-muted-foreground mt-1">Enter the Secure Workspace ID of the workspace you want to share with. They will receive a Draft copy they can publish.</p>
              </div>
            )}

            {isAdmin && (
              <div className="mt-4 p-3 bg-muted rounded-lg border border-border">
                <p className="text-xs font-semibold text-foreground mb-1">Your Secure Workspace ID</p>
                <p className="text-xs text-muted-foreground mb-2">Give this ID to other workspaces so they can share modules with you.</p>
                <div className="flex gap-2">
                  <code className="flex-1 bg-background px-2 py-1.5 rounded border border-border text-xs select-all">{user?.company_id || "No ID available"}</code>
                  <Button variant="outline" size="sm" className="h-auto py-1" onClick={() => { navigator.clipboard.writeText(user?.company_id); toast({title:"Copied!", description:"Workspace ID copied to clipboard."})}}>Copy</Button>
                </div>
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

      {/* OrbitBolt AI Full Workspace — for editing and building modules contextually */}
      {isBoltOpen && (
        <OrbitBoltWorkspace
          onClose={() => setIsBoltOpen(false)}
        />
      )}
    </div>
  );
}
