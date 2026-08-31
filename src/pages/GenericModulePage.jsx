import { OrbitLoader } from '@/components/ui/orbit-loader';
import { supabase} from '@/api/supabaseClient';
import React, { useState, useEffect, Suspense, lazy, startTransition} from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Button} from "@/components/ui/button";
import { Sparkles, Plus, RefreshCw, BarChart2, ShieldCheck, FileText, Table, Trello, Calendar, Clock, BarChart, Users, Grid, FileSpreadsheet, Filter, PieChart} from "lucide-react";
import { useToast} from "@/components/ui/use-toast";
import DynamicTable from "@/components/ui/DynamicTable";
import DynamicGrid from "@/components/ui/DynamicGrid";
import DynamicForm from "@/components/ui/DynamicForm";
import DynamicDashboard from "@/components/ui/DynamicDashboard";
import DynamicKanbanView from "@/components/ui/DynamicKanbanView";
import { powerSync} from "@/api/PowerSyncConnector";
import { INDUSTRIES } from "@/config/industries";
import { useAuth} from "@/lib/AuthContext";
import { useImpersonation} from "@/lib/ImpersonationContext";
import { useNavigate} from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from "@/components/ui/dialog";
import OrbitBoltWorkspace from "@/components/orbitbolt/OrbitBoltWorkspace";
import SecureSandbox from "@/components/orbitbolt/SecureSandbox";
import PageRenderer from "@/components/pages/PageRenderer";

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

import { useCompany } from "@/hooks/useCompanyId";

export default function GenericModulePage({ title: propTitle, description: propDescription}) {
 const { toast} = useToast();
 const { user} = useAuth();
 const { impersonatedCompany} = useImpersonation();
 const { company } = useCompany();
 const navigate = useNavigate();
 const path = window.location.pathname;
 
 const activeIndustry = sessionStorage.getItem('slate_industry_override') 
   || impersonatedCompany?.industry 
   || impersonatedCompany?.industry_type 
   || company?.industry_type 
   || user?.company_industry 
   || 'law';

 const [moduleDef, setModuleDef] = useState(null);
 const [fieldDefs, setFieldDefs] = useState([]);
 const [records, setRecords] = useState([]);
 const [isLoading, setIsLoading] = useState(true);
 const [isAddModalOpen, setIsAddModalOpen] = useState(false);
 const [isSettingsOpen, setIsSettingsOpen] = useState(false);
 const [activeView, setActiveView] = useState('default');

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

      // Fetch all active modules for this company directly from PowerSync (local DB)
      // This ensures we can see modules we just created before they sync to the cloud.
      const allModules = await powerSync.getAll(`SELECT * FROM module_definitions WHERE is_active = 1 AND (company_id = ? OR shared_with LIKE ?)`, [companyId, `%${companyId}%`]);

      const expectedLabels = [];
      Object.values(INDUSTRIES).forEach(ind => {
        (ind.nav || []).forEach(navItem => {
          if (navItem.path === `/${slug}` || navItem.path === `/m/${slug}`) {
            expectedLabels.push(navItem.label.toLowerCase());
          }
        });
      });

      const matched = (allModules || []).find(m => {
        const normName = (m.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (normName === slug) return true;
        if (expectedLabels.includes((m.name || '').toLowerCase())) return true;
        return false;
      });

      const mod = matched; 
      if (!mod) {
        setIsLoading(false);
        setModuleDef(null);
        return;
      }
      if (typeof mod.config === 'string') {
        try { mod.config = JSON.parse(mod.config); } catch(e) {}
      }
      
      // Enforce industry isolation — redirect on mismatch (prevents URL forgery)
      if (mod.industry_type && mod.industry_type !== activeIndustry) {
        toast({ title: "Access Denied", description: "This module is not available in the current workspace.", variant: "destructive"});
        navigate('/', { replace: true});
        return;
      }

      setModuleDef(mod);
      setVisibility(mod.visibility || 'private');
      setSharedWith(mod.shared_with || '');

      const fields = await powerSync.getAll(`SELECT * FROM field_definitions WHERE module_id = ? ORDER BY order_index ASC`, [mod.id]);
      setFieldDefs(fields || []);

 const recs = await powerSync.getAll(`SELECT * FROM dynamic_records WHERE module_id = ? ORDER BY created_at DESC`, [mod.id]);
 const parsedRecords = (recs || []).map(r => ({ ...r, data: typeof r.data === 'string' ? JSON.parse(r.data || '{}') : (r.data || {})}));
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
 (async () => {
 const _payload = { visibility, shared_with: sharedWith};
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 await powerSync.execute(`UPDATE module_definitions SET ${_keys.map(k => k+' = ?').join(', ')} WHERE id = ?`, [..._vals, moduleDef.id]);
})();
 const error = null;
 
 if (error) throw error;

 // Direct Share Cloning Logic
 if (visibility === 'shared' && sharedWith.trim().length > 0) {
 const ids = sharedWith.split(',').map(id => id.trim()).filter(Boolean);
 for (const targetCompanyId of ids) {
 // Check if already cloned to this company
 const { data: existing} = await supabase
 .from('module_definitions')
 .select('id')
 .eq('company_id', targetCompanyId)
 .eq('name', moduleDef.name);

 if (!existing || existing.length === 0) {
 // Clone module as draft
 const newModuleId = crypto.randomUUID();
 await (async () => {
 const _payload = {
 id: newModuleId,
 company_id: targetCompanyId,
 name: moduleDef.name,
 description: moduleDef.description,
 icon: moduleDef.icon,
 config: moduleDef.config,
 status: 'draft',
 is_active: 'true',
 created_at: new Date().toISOString()
};
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO module_definitions (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals);
})();

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
 await (async () => { let _payload = newFields; if (Array.isArray(_payload)) _payload = _payload[0]; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' ? JSON.stringify(v) : v); const _plhdr = _keys.map(()=>'?').join(', '); await powerSync.execute(`INSERT INTO field_definitions (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals);})();
}
}
}
}
 
 toast({ title: "Settings Saved", description: "Slate sharing and visibility updated."});
 setIsSettingsOpen(false);
 fetchDynamicData();
} catch (err) {
 console.error(err);
 toast({ title: "Error", description: "Failed to save settings.", variant: "destructive"});
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
 <div className="h-64 flex flex-col items-center justify-center text-[#71717a] dark:text-gray-400 bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 mt-6 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <OrbitLoader size="md" />
 <p>Loading slate definitions...</p>
 </div>
 );
}
 if (!moduleDef) {
 return (
 <div className="h-64 flex flex-col items-center justify-center text-[#71717a] dark:text-gray-400 bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 mt-6 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Sparkles className="w-12 h-12 text-[#71717a] dark:text-gray-400/50 mb-4" />
 <p className="font-medium text-foreground text-lg">No Dynamic Slates Found</p>
 <p className="text-sm mt-1">Use the AI Assistant to generate a new slate.</p>
 </div>
 );
}

 // Standard props for all dynamic views
 const viewProps = {
 data: records,
 fieldDefinitions: fieldDefs,
 moduleDef: moduleDef,
 onRefresh: fetchDynamicData};

 const suspenseFallback = (
 <div className="h-64 flex flex-col items-center justify-center text-[#71717a] dark:text-gray-400 bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <OrbitLoader size="sm" />
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

 
  const currentView = activeView === 'default' ? pageType : activeView;
  switch (currentView) {
    case 'universal_component':
      return moduleDef.config?.component_id ? React.createElement(lazy(() => import(`@/components/universal/${moduleDef.config.component_id}.jsx`).catch(() => ({ default: () => <div className="mt-6 p-8 border-[0.5px] border-black/9 dark:border-white/8 border-dashed rounded-xl border-red-500/50 bg-red-50 text-red-500 text-center">Component not found</div> })))) : null;
    case 'custom_page':
      return <PageRenderer schema={moduleDef.config || {}} editMode={false} />;

    case 'analytics':
    case 'dashboard':
      return (
        <div className="mt-6">
          <DynamicDashboard records={records} moduleDef={moduleDef} />
        </div>
      );

 case 'kanban':
 return (
 <div className="mt-6 bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
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
 initialData={{ records, fieldDefs, moduleDef}} 
 />
 </div>
 );

 case 'data_module':
 case 'document_manager':
 default:
 return (
 <div className={`${layoutConfig === 'table' ? 'bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden p-6' : ''} mt-6`}>
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
 <Button onClick={() => setIsSettingsOpen(true)} variant="outline" size="sm" className="gap-2.5 ">
 <ShieldCheck className="w-4 h-4" /> Share
 </Button>
 {isAdmin && (
 <Button onClick={() => setIsBoltOpen(true)} variant="outline" size="sm" className="gap-2.5 border-primary/30 text-primary hover:bg-slate-100">
 <Sparkles className="w-4 h-4" /> OrbitBuild
 </Button>
 )}
 <Button onClick={() => setIsAddModalOpen(true)} size="sm" className={`gap-2.5 text-white ${themeConfig === 'primary' ? 'bg-primary hover:bg-primary/90' : `bg-${themeConfig}-600 hover:bg-${themeConfig}-700`}`}>
 <Plus className="w-4 h-4" /> Add Record
 </Button>
 </div>
}
 />

 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex items-center justify-between  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <p className="text-xs text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">Total Records</p>
 <p className="text-2xl font-semibold text-foreground tracking-[-0.02em]">{records.length}</p>
 </div>
 <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center">
 <BarChart2 className="w-5 h-5 text-primary" />
 </div>
 </div>

 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex items-center justify-between  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <p className="text-xs text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">Slate Status</p>
 <p className="text-2xl font-semibold text-foreground tracking-[-0.02em]">Active</p>
 </div>
 <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center">
 <ShieldCheck className="w-5 h-5 text-primary" />
 </div>
 </div>

 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex items-center justify-between  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <p className="text-xs text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">Custom Fields</p>
 <p className="text-2xl font-semibold text-foreground tracking-[-0.02em]">{fieldDefs.length}</p>
 </div>
 <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center">
 <FileText className="w-5 h-5 text-primary" />
 </div>
 </div>
 </div>

 
 {/* 10 Views Switcher */}
 {moduleDef && (
 <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide border-b border-primary/40">
 {[
 { id: 'default', label: 'Default', icon: Sparkles},
 { id: 'table', label: 'Table', icon: Table},
 { id: 'kanban', label: 'Kanban', icon: Trello},
 { id: 'calendar', label: 'Calendar', icon: Calendar},
 { id: 'timeline', label: 'Timeline', icon: Clock},
 { id: 'analytics', label: 'Analytics', icon: BarChart},
 { id: 'directory', label: 'Directory', icon: Users},
 { id: 'gallery', label: 'Gallery', icon: Grid},
 { id: 'spreadsheet', label: 'Spreadsheet', icon: FileSpreadsheet},
 { id: 'pipeline', label: 'Pipeline', icon: Filter},
 { id: 'report', label: 'Report', icon: PieChart}
 ].map(view => {
 const Icon = view.icon;
 const isActive = activeView === view.id;
 return (
 <button
 key={view.id}
 onClick={() => {
 startTransition(() => {
 setActiveView(view.id);
});
}}
 className={`flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap rounded-t-lg border-b-2 transition-colors ${
 isActive 
 ? 'border-primary text-primary bg-primary/5' 
 : 'border-transparent text-[#71717a] dark:text-gray-400 hover:text-foreground hover:bg-slate-50'
}`}
 >
 <Icon className="w-4 h-4" />
 {view.label}
 </button>
 );
})}
 </div>
 )}

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
 <DialogTitle>Slate Sharing Settings</DialogTitle>
 <DialogDescription>Control who has access to this slate.</DialogDescription>
 </DialogHeader>
 
 <div className="space-y-4 mt-4">
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Visibility</label>
 <select 
 value={visibility} 
 onChange={e => setVisibility(e.target.value)}
 className="w-full border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background text-foreground rounded-lg px-3 py-2 text-sm"
 >
 <option value="private">Private (Only my workslate)</option>
 <option value="shared">Shared (Specific workslates)</option>
 <option value="public">Public (Marketplace Template)</option>
 </select>
 <p className="text-xs text-[#71717a] dark:text-gray-400 mt-1 tracking-[0.04em]">
 {visibility === 'public' && "This slate's configuration will be available in the public Marketplace for anyone to install."}
 {visibility === 'private' && "Only users in your firm can access this slate."}
 {visibility === 'shared' && "Users from the specified workspaces can access this slate."}
 </p>
 </div>

 {visibility === 'shared' && (
 <div className="animate-in fade-in zoom-in-95 duration-200">
 <label className="block text-sm font-medium text-foreground mb-1">Shared WorkSlate IDs</label>
 <input 
 type="text" 
 value={sharedWith}
 onChange={e => setSharedWith(e.target.value)}
 placeholder="Comma-separated workslate IDs"
 className="w-full border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background text-foreground rounded-lg px-3 py-2 text-sm"
 />
 <p className="text-xs text-[#71717a] dark:text-gray-400 mt-1 tracking-[0.04em]">Enter the Secure WorkSlate ID of the workslate you want to share with. They will receive a Draft copy they can publish.</p>
 </div>
 )}

 {isAdmin && (
 <div className="mt-4 p-3 bg-muted rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40">
 <p className="text-xs font-semibold text-foreground mb-1 tracking-[0.04em]">Your Secure WorkSlate ID</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 mb-2 tracking-[0.04em]">Give this ID to other workslates so they can share slates with you.</p>
 <div className="flex gap-2">
 <code className="flex-1 bg-background px-2 py-1.5 rounded-md border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-xs select-all tracking-[0.04em]">{user?.company_id || "No ID available"}</code>
 <Button variant="outline" size="sm" className="h-auto py-1" onClick={() => { navigator.clipboard.writeText(user?.company_id); toast({title:"Copied!", description:"Workslate ID copied to clipboard."})}}>Copy</Button>
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

 {/* OrbitBolt AI Full WorkSlate — for editing and building modules contextually */}
 {isBoltOpen && (
 <OrbitBoltWorkspace
 onClose={() => setIsBoltOpen(false)}
 />
 )}
 </div>
 );
}

