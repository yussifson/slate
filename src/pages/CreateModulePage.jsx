import { supabase} from '@/api/supabaseClient';
import React, { useState, startTransition} from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Button} from "@/components/ui/button";
import { useToast} from "@/components/ui/use-toast";
import { powerSync} from "@/api/PowerSyncConnector";
import { useNavigate, useParams, useLocation} from "react-router-dom";
import { useCompanyId, useCompany } from "@/hooks/useCompanyId";
import { useAuth} from "@/lib/AuthContext";
import { useImpersonation} from "@/lib/ImpersonationContext";
import { Blocks, Sparkles, Plus, Trash2, Play, Undo2, Redo2, ChevronLeft, ChevronRight, Zap} from "lucide-react";
import DynamicTable from "@/components/ui/DynamicTable";
import DynamicGrid from "@/components/ui/DynamicGrid";
import { IconPicker} from "@/components/ui/IconPicker";
import DynamicDashboard from "@/components/ui/DynamicDashboard";
import DynamicKanbanView from "@/components/ui/DynamicKanbanView";
import { useUndoableState} from "@/hooks/useUndoableState";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import OrbitBoltWorkspace from "@/components/orbitbolt/OrbitBoltWorkspace";
import SecureSandbox from "@/components/orbitbolt/SecureSandbox";
import PageRenderer from "@/components/pages/PageRenderer";

// Lazy-loaded view components for new module types
const DynamicCalendarView = React.lazy(() => import("@/components/ui/DynamicCalendarView"));
const DynamicTimelineView = React.lazy(() => import("@/components/ui/DynamicTimelineView"));
const DynamicDirectoryView = React.lazy(() => import("@/components/ui/DynamicDirectoryView"));
const DynamicGalleryView = React.lazy(() => import("@/components/ui/DynamicGalleryView"));
const DynamicSpreadsheetView = React.lazy(() => import("@/components/ui/DynamicSpreadsheetView"));
const DynamicReportView = React.lazy(() => import("@/components/ui/DynamicReportView"));
const DynamicPipelineView = React.lazy(() => import("@/components/ui/DynamicPipelineView"));
const DynamicApprovalView = React.lazy(() => import("@/components/ui/DynamicApprovalView"));
const DynamicFormWizard = React.lazy(() => import("@/components/ui/DynamicFormWizard"));
const DynamicInventoryView = React.lazy(() => import("@/components/ui/DynamicInventoryView"));

const generateDummyData = (fields) => {
 const records = [];
 for (let i = 0; i < 5; i++) {
 const data = {};
 fields.forEach(f => {
 const name = f.name.trim().replace(/ /g, '_').toLowerCase();
 if (!name) return;
 if (f.field_type === 'text') data[name] = `Sample ${f.name} ${i + 1}`;
 else if (f.field_type === 'number') data[name] = Math.floor(Math.random() * 1000);
 else if (f.field_type === 'date') data[name] = new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0];
 else if (f.field_type === 'boolean') data[name] = Math.random() > 0.5;
 else if (f.field_type === 'select') {
 const opts = f.options ? f.options.split(',').map(o => o.trim()).filter(Boolean) : [];
 data[name] = opts.length > 0 ? opts[Math.floor(Math.random() * opts.length)] : 'Option 1';
} else {
 data[name] = `Data ${i + 1}`;
}
});
 records.push({ id: `dummy-${i}`, data, created_at: new Date().toISOString()});
}
 return records;
};

export default function CreateModulePage({ isBoltOpen: initialBoltOpen = false}) {
 const { id} = useParams();
 const isEditing = !!id;
 const navigate = useNavigate();
 const location = useLocation();
 const companyId = useCompanyId();
 const { company } = useCompany();
 const { user} = useAuth();
 const { toast} = useToast();

 const [isBoltOpen, setIsBoltOpen] = useState(initialBoltOpen || location.pathname === '/slate/BOLT');
 const { impersonatedCompany} = useImpersonation();
 const activeIndustry = sessionStorage.getItem('slate_industry_override') 
   || impersonatedCompany?.industry 
   || impersonatedCompany?.industry_type 
   || company?.industry_type 
   || user?.company_industry 
   || 'law';

  const getInitialState = () => {
    if (!isEditing) {
      try {
        const cached = sessionStorage.getItem('orbitbolt_draft_slate');
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (e) {}
    }
    return {
      name: "",
      description: "",
      icon: "Blocks",
      layout: "table",
      theme: "primary",
      moduleType: "data_module",
      fields: [{ name: "name", field_type: "text", is_required: true, options: ""}],
      customConfig: null
    };
  };

  const [state, setState, undo, redo, canUndo, canRedo, setWithoutHistory] = useUndoableState(getInitialState());
  const { name, description, icon, layout, theme, moduleType, fields} = state;

  React.useEffect(() => {
    if (!isEditing) {
      sessionStorage.setItem('orbitbolt_draft_slate', JSON.stringify(state));
    }
  }, [state, isEditing]);

 const [isSidebarOpen, setIsSidebarOpen] = useState(true);
 const [isSubmitting, setIsSubmitting] = useState(false);

 const onDragEnd = (result) => {
   if (!result.destination) return;
   const newFields = Array.from(state.fields);
   const [reorderedItem] = newFields.splice(result.source.index, 1);
   newFields.splice(result.destination.index, 0, reorderedItem);
   setState({ ...state, fields: newFields });
 };

 React.useEffect(() => {
 if (isEditing && id) {
 const loadModule = async () => {
 try {
 const { data: mod, error: modError} = await supabase
 .from('module_definitions')
 .select('*')
 .eq('id', id)
 .single();

 if (modError) throw modError;
 if (!mod) return;

 const { data: fieldsData, error: fieldError} = await supabase
 .from('field_definitions')
 .select('*')
 .eq('module_id', id)
 .order('order_index', { ascending: true});

 if (fieldError) throw fieldError;

 const loadedFields = fieldsData && fieldsData.length > 0
 ? fieldsData.map(x => ({
 id: x.id,
 name: x.name || "",
 field_type: x.field_type || "text",
 is_required: x.is_required || false,
 options: Array.isArray(x.options) ? x.options.join(', ') : (x.options || "")
}))
 : [{ name: "name", field_type: "text", is_required: true, options: ""}];

 setWithoutHistory({
 name: mod.name || "",
 description: mod.description || "",
 icon: mod.icon || "Blocks",
 layout: mod.config?.layout || "table",
 theme: mod.config?.theme || "primary",
 moduleType: mod.config?.page_type || mod.module_type || "data_module",
 fields: loadedFields
});
} catch (err) {
 console.error("Failed to load module for editing:", err);
 toast({ title: "Error", description: "Failed to load module data.", variant: "destructive"});
}
};
 loadModule();
}
}, [id, isEditing]);

 // Check for pending OrbitBolt schema on mount
 React.useEffect(() => {
 const pendingSchema = sessionStorage.getItem('orbitbolt_pending_schema');
 if (pendingSchema) {
 try {
 const schema = JSON.parse(pendingSchema);
 handleApplyBoltSchema(schema);
 sessionStorage.removeItem('orbitbolt_pending_schema');
} catch(e) {}
}
}, []);

 const handleAddField = () => {
 setState({ ...state, fields: [...fields, { name: "", field_type: "text", is_required: false, options: ""}]});
};

 const handleRemoveField = (index) => {
 setState({ ...state, fields: fields.filter((_, i) => i !== index)});
};

 const handleFieldChange = (index, key, value) => {
 const newFields = [...fields];
 newFields[index] = { ...newFields[index], [key]: value};
 setState({ ...state, fields: newFields});
};

  // Called when OrbitBolt "Apply to Builder" is clicked
  const handleApplyBoltSchema = (schema) => {
    if (!schema) return;
    
    if (schema.isUniversal) {
      setState(prev => ({
        ...prev,
        name: schema.name || prev.name || "Universal Component",
        description: prev.description || "Generated Component",
        icon: "Box",
        moduleType: "universal_component",
        customConfig: { component_id: schema.component_id }
      }));
    } else if (schema.type === 'Page') {
      setState(prev => ({
        ...prev,
        name: schema.props?.title || prev.name || "Custom Page",
        description: schema.props?.description || prev.description || "Custom Layout",
        icon: schema.props?.icon || "Layout",
        theme: schema.props?.theme || prev.theme || "primary",
        moduleType: "custom_page",
        customConfig: schema
      }));
    } else {
      // Normal Data Module
      const mappedFields = (schema.fields && schema.fields.length > 0)
        ? schema.fields.map(f => ({
            name: f.name || "",
            field_type: f.field_type || "text",
            is_required: !!f.is_required,
            options: Array.isArray(f.options) ? f.options.join(", ") : (f.options || "")
        }))
        : state.fields;

      setState(prev => ({
        ...prev,
        name: schema.module?.name || prev.name || "",
        description: schema.module?.description || prev.description || "",
        icon: schema.module?.icon || prev.icon || "Blocks",
        layout: schema.module?.layout || prev.layout || "table",
        theme: schema.module?.theme || prev.theme || "primary",
        moduleType: schema.module?.module_type || "data_module",
        fields: mappedFields
      }));
    }

    toast({ title: "⚡ OrbitBuild Schema Applied!", description: "Review and customize your slate, then publish."});
  };

  const saveModule = async (status = 'published') => {
    if (!name.trim()) {
      toast({ title: "Validation Error", description: "Slate Name is required.", variant: "destructive"});
      return;
    }
    if (state.moduleType === 'data_module' && fields.length === 0) {
      toast({ title: "Validation Error", description: "At least 1 field is required for a data slate.", variant: "destructive"});
      return;
    }

    setIsSubmitting(true);
    try {
      const moduleId = isEditing ? id : crypto.randomUUID();

      const configData = { layout, theme, page_type: state.moduleType };
      if (state.moduleType !== 'data_module' && state.customConfig) {
        Object.assign(configData, state.customConfig);
      }

      const moduleData = {
        name,
        description,
        icon,
        status,
        is_active: true,
        industry_type: activeIndustry,
        config: configData
      };

 if (!isEditing) {
 moduleData.id = moduleId;
 moduleData.company_id = companyId || '00000000-0000-0000-0000-000000000000';
 moduleData.created_at = new Date().toISOString();
}
      let moduleError = null;
      try {
        if (isEditing) {
          const _keys = Object.keys(moduleData);
          const _vals = Object.values(moduleData).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
          await powerSync.execute(`UPDATE module_definitions SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, id]);
        } else {
          const _keys = Object.keys(moduleData);
          const _vals = Object.values(moduleData).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
          await powerSync.execute(`INSERT INTO module_definitions (${_keys.join(', ')}) VALUES (${_keys.map(()=>'?').join(', ')})`, _vals);
        }
      } catch (err) {
        moduleError = err;
      }
      
      if (moduleError) throw moduleError;

 // Delete existing fields then re-insert (clean update)
 await powerSync.execute(`DELETE FROM field_definitions WHERE module_id = ?`, [moduleId]);

 const validFields = fields.filter(f => f.name.trim());
 if (validFields.length > 0) {
 const fieldsToInsert = validFields.map((f, idx) => ({
 id: crypto.randomUUID(),
 company_id: companyId || '00000000-0000-0000-0000-000000000000',
 module_id: moduleId,
 name: f.name.trim().replace(/ /g, '_').toLowerCase(),
 field_type: f.field_type,
 is_required: f.is_required,
 options: f.options ? f.options.split(',').map(o => o.trim()).filter(Boolean) : [],
 order_index: idx,
 created_at: new Date().toISOString()
}));

        try {
          for (const field of fieldsToInsert) {
            const _keys = Object.keys(field);
            const _vals = Object.values(field).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
            await powerSync.execute(`INSERT INTO field_definitions (${_keys.join(', ')}) VALUES (${_keys.map(()=>'?').join(', ')})`, _vals);
          }
        } catch (fieldError) {
          throw fieldError;
        }
}

 toast({
 title: status === 'draft' ? "📝 Saved as Draft" : (isEditing ? "✨ Slate Updated!" : "✨ Slate Published!"),
 description: `'${name}' is ready. Redirecting...`});

      if (!isEditing) {
        sessionStorage.removeItem('orbitbolt_draft_slate');
      }
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      navigate(`/m/${slug}`);
} catch (err) {
 console.error(err);
 toast({ title: "Error", description: err.message || "Failed to save slate.", variant: "destructive"});
} finally {
 setIsSubmitting(false);
}
};

 // Current schema for OrbitBolt context when editing
 const currentSchema = isEditing ? {
 name, description, icon, layout, theme,
 module_type: moduleType,
 fields: fields.map(f => ({ name: f.name, field_type: f.field_type, is_required: f.is_required, options: f.options}))
} : null;

 return (
 <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden">
 {/* Main content area */}
 <div className="flex-1 min-w-0 space-y-6 animate-in fade-in duration-300 pb-20 p-6 overflow-y-auto">
 {/* Top bar */}
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <PageHeader
 title={isEditing ? "Edit Slate" : "Slate Builder"}
 subtitle="Design custom records and workflows."
 />
 <div className="flex gap-2 items-center">
 <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} title="Undo">
 <Undo2 className="w-4 h-4" />
 </Button>
 <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} title="Redo">
 <Redo2 className="w-4 h-4" />
 </Button>
 <div className="w-px h-8 bg-primary/40 mx-1" />
 <Button
 onClick={() => setIsBoltOpen(!isBoltOpen)}
 className={`gap-2 font-semibold transition-all ${
 isBoltOpen
 ? 'bg-gradient-to-r from-primary/90 to-primary/90 text-white'
 : isEditing
 ? 'bg-gradient-to-r from-primary to-primary text-white hover:from-primary/90 hover:to-primary/90'
 : 'bg-gradient-to-r from-primary to-primary text-white hover:from-primary/90 hover:to-primary/90'
}`}
 >
 {isBoltOpen ? 'Close OrbitBuild' : 'Build with OrbitBuild'}
 </Button>
 </div>
 </div>

 {/* Builder grid */}
 <div className={`grid grid-cols-1 ${isSidebarOpen && !isBoltOpen ? 'xl:grid-cols-3' : ''} gap-6 transition-all duration-300`}>
 {isSidebarOpen && (
 <div className="xl:col-span-1 space-y-6 animate-in slide-in-from-left duration-300">
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 space-y-6 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {/* Slate Details */}
 <div className="space-y-4">
 <h3 className="font-semibold text-foreground border-b border-primary/40 pb-2">Slate Details</h3>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Slate Name</label>
 <input
 type="text"
 value={name}
 onChange={(e) => setState({ ...state, name: e.target.value})}
 placeholder="e.g. Patient Referrals"
 className="w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Slate Type</label>
 <select
 value={moduleType}
 onChange={(e) => {
 const val = e.target.value;
 startTransition(() => {
 setState({ ...state, moduleType: val});
});
}}
 className="w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <option value="data_module">Data Slate (Table/Grid)</option>
 <option value="dashboard">Dashboard (Charts & Stats)</option>
 <option value="kanban">Kanban Board (Workflow)</option>
 <option value="document_manager">Document Manager</option>
 <option value="calendar_view">Calendar View (Timeline)</option>
 <option value="form_builder">Multi-Step Form Wizard</option>
 <option value="directory">Directory (People/Contacts)</option>
 <option value="timeline">Activity Timeline</option>
 <option value="gallery">Gallery (Visual Cards)</option>
 <option value="spreadsheet">Spreadsheet (Inline Edit)</option>
 <option value="report">Report & Analytics</option>
 <option value="inventory">Inventory Tracker</option>
 <option value="crm_pipeline">Sales Pipeline (CRM)</option>
 <option value="approval_workflow">Approval Workflow</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Description</label>
 <textarea
 value={description}
 onChange={(e) => setState({ ...state, description: e.target.value})}
 placeholder="Brief description of what this slate tracks..."
 className="w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring h-20"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Icon</label>
 <IconPicker
 value={icon}
 onChange={(val) => setState({ ...state, icon: val})}
 />
 </div>
 </div>

 {/* Fields */}
 <div className="space-y-4">
 <h3 className="font-semibold text-foreground border-b border-primary/40 pb-2 mt-6">Data Fields</h3>
 <DragDropContext onDragEnd={onDragEnd}>
 <Droppable droppableId="fieldsList">
 {(provided) => (
 <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2" {...provided.droppableProps} ref={provided.innerRef}>
 {(fields || []).map((f, i) => (
 <Draggable key={`field-${i}`} draggableId={`field-${i}`} index={i}>
 {(provided, snapshot) => (
 <div 
 ref={provided.innerRef} 
 {...provided.draggableProps} 
 {...provided.dragHandleProps} 
 className={`bg-muted border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-3 relative group ${snapshot.isDragging ? 'shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-primary' : ''}`}
 >
 <button
 type="button"
 onClick={() => handleRemoveField(i)}
 className="absolute top-2 right-2 text-[#71717a] dark:text-gray-400 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 <div className="grid grid-cols-2 gap-3 mb-2 pr-6">
 <input
 type="text"
 value={f.name}
 onChange={e => handleFieldChange(i, 'name', e.target.value)}
 placeholder="Field Name"
 className="w-full rounded-md border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background text-foreground px-2 py-1.5 text-sm"
 />
 <select
 value={f.field_type}
 onChange={e => handleFieldChange(i, 'field_type', e.target.value)}
 className="w-full rounded-md border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background text-foreground px-2 py-1.5 text-sm"
 >
 <option value="text">Text</option>
 <option value="number">Number</option>
 <option value="date">Date</option>
 <option value="boolean">Checkbox (Yes/No)</option>
 <option value="select">Dropdown Select</option>
 </select>
 </div>
 {f.field_type === 'select' && (
 <div className="mb-2">
 <input
 type="text"
 value={f.options}
 onChange={e => handleFieldChange(i, 'options', e.target.value)}
 placeholder="Comma separated options (e.g. High, Medium, Low)"
 className="w-full rounded-md border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background text-foreground px-2 py-1.5 text-sm"
 />
 </div>
 )}
 <label className="flex items-center gap-2 text-sm text-[#71717a] dark:text-gray-400">
 <input
 type="checkbox"
 checked={!!f.is_required}
 onChange={e => handleFieldChange(i, 'is_required', e.target.checked)}
 className="rounded-md border-input"
 />
 Required Field
 </label>
 </div>
 )}
 </Draggable>
 ))}
 {provided.placeholder}
 </div>
 )}
 </Droppable>
 </DragDropContext>
 <Button type="button" variant="outline" size="sm" onClick={handleAddField} className="w-full mt-2 h-8 text-xs gap-2 tracking-[0.04em]">
 <Plus className="w-3 h-3" /> Add New Field
 </Button>
 </div>

 {/* Design & Layout */}
 <div className="space-y-4">
 <h3 className="font-semibold text-foreground border-b border-primary/40 pb-2 mt-6">Design & Layout</h3>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Layout Style</label>
 <div className="grid grid-cols-2 gap-3">
 <button
 type="button"
 onClick={() => {
 startTransition(() => {
 setState({ ...state, layout: "table"});
});
}}
 className={`flex flex-col items-center justify-center p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 text-sm font-medium transition-all ${layout === 'table' ? 'border-primary bg-primary/10 text-primary' : 'border-primary/40 bg-card text-[#71717a] dark:text-gray-400 hover:bg-muted'}`}
 >
 <svg className="w-6 h-6 mb-2 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
 Table View
 </button>
 <button
 type="button"
 onClick={() => {
 startTransition(() => {
 setState({ ...state, layout: "grid"});
});
}}
 className={`flex flex-col items-center justify-center p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 text-sm font-medium transition-all ${layout === 'grid' ? 'border-primary bg-primary/10 text-primary' : 'border-primary/40 bg-card text-[#71717a] dark:text-gray-400 hover:bg-muted'}`}
 >
 <svg className="w-6 h-6 mb-2 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
 Grid / Cards
 </button>
 </div>
 </div>

 <div className="pt-2">
 <label className="block text-sm font-medium text-foreground mb-3">Theme Color</label>
 <div className="flex flex-wrap gap-3">
 {[
 { id: "primary", hex: "#4f46e5"},
 { id: "blue", hex: "#2563eb"},
 { id: "emerald", hex: "#059669"},
 { id: "rose", hex: "#e11d48"},
 { id: "amber", hex: "#d97706"},
 { id: "purple", hex: "#9333ea"},
 ].map((t) => (
 <button
 key={t.id}
 type="button"
 onClick={() => setState({ ...state, theme: t.id})}
 className={`w-8 h-8 rounded-full transition-all flex items-center justify-center ${theme === t.id ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110' : 'hover:scale-105'}`}
 style={{ backgroundColor: t.hex}}
 title={t.id.charAt(0).toUpperCase() + t.id.slice(1)}
 >
 {theme === t.id && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Save Buttons */}
 <div className="pt-6 border-t border-primary/40 flex justify-end gap-3 mt-6">
 <Button type="button" variant="outline" onClick={() => saveModule('draft')} disabled={isSubmitting} className="flex-1">
 {isSubmitting ? "Saving..." : "Save Draft"}
 </Button>
 <Button type="button" onClick={() => saveModule('published')} disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1">
 {isSubmitting ? "Saving..." : (isEditing ? "Update Slate" : "Publish")}
 </Button>
 </div>
 </div>
 </div>
 )}

 {/* Preview Panel */}
 <div className={isSidebarOpen && !isBoltOpen ? "xl:col-span-2" : isSidebarOpen ? "lg:col-span-2 xl:col-span-1" : "xl:col-span-1 h-full"}>
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/40 flex items-center justify-between bg-muted/30">
 <div className="flex items-center gap-3 text-foreground font-medium">
 <button
 onClick={() => setIsSidebarOpen(!isSidebarOpen)}
 className="p-1.5 rounded-lg hover:bg-background border-[0.5px] border-black/9 dark:border-white/8 border-transparent hover:border-primary/40 transition-colors text-[#71717a] dark:text-gray-400 hover:text-foreground"
 title={isSidebarOpen ? "Collapse Configuration" : "Expand Configuration"}
 >
 {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
 </button>
 <div className="flex items-center gap-2">
 <Play className="w-4 h-4 text-primary" />
 Live Preview
 </div>
 </div>
 <div className="text-xs text-[#71717a] dark:text-gray-400 px-2 py-1 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-lg tracking-[0.04em]">
 Interactive Environment
 </div>
 </div>
  <div className="p-6 flex-1 min-h-[600px] bg-background/50">
    {((moduleType === 'data_module' && fields.filter(f => f.name.trim()).length > 0) || moduleType === 'universal_component' || moduleType === 'custom_page') ? (
      <div className="animate-in fade-in zoom-in-95 duration-300">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Blocks className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">{name || "Untitled Slate"}</h2>
            <p className="text-sm text-[#71717a] dark:text-gray-400">{description || "No description provided."}</p>
          </div>
        </div>
        
        <React.Suspense fallback={<div className="p-8 text-center text-[#71717a] dark:text-gray-400 animate-pulse">Loading preview...</div>}>
          {(() => {
            const dummyData = generateDummyData(fields);
            const fieldDefs = fields.map((f, i) => ({ ...f, name: f.name.trim().replace(/ /g, '_').toLowerCase(), order_index: i }));
            
            switch (moduleType) {
              case 'universal_component':
                return state.customConfig?.component_id ? React.createElement(React.lazy(() => import(`@/components/universal/${state.customConfig.component_id}.jsx`).catch(() => ({ default: () => <div className="p-8 border-[0.5px] border-black/9 dark:border-white/8 border-dashed rounded-xl border-red-500/50 bg-red-50 text-red-500 text-center">Component not found</div> })))) : null;
              case 'custom_page':
                return <PageRenderer schema={state.customConfig || {}} editMode={false} />;
              case 'dashboard':
                return <DynamicDashboard data={dummyData} fieldDefinitions={fieldDefs} />;
              case 'kanban':
                return <DynamicKanbanView data={dummyData} fieldDefinitions={fieldDefs} />;
              case 'calendar_view':
                return <DynamicCalendarView data={dummyData} fieldDefinitions={fieldDefs} />;
              case 'document_manager':
                return <DynamicGrid data={dummyData} fieldDefinitions={fieldDefs} theme={theme} isDocumentManager={true} />;
              case 'directory':
                return <DynamicDirectoryView data={dummyData} fieldDefinitions={fieldDefs} />;
              case 'timeline':
                return <DynamicTimelineView data={dummyData} fieldDefinitions={fieldDefs} />;
              case 'gallery':
                return <DynamicGalleryView data={dummyData} fieldDefinitions={fieldDefs} />;
              case 'spreadsheet':
                return <DynamicSpreadsheetView data={dummyData} fieldDefinitions={fieldDefs} />;
              case 'report':
                return <DynamicReportView data={dummyData} fieldDefinitions={fieldDefs} />;
              case 'inventory':
                return <DynamicInventoryView data={dummyData} fieldDefinitions={fieldDefs} />;
              case 'crm_pipeline':
                return <DynamicPipelineView data={dummyData} fieldDefinitions={fieldDefs} />;
              case 'approval_workflow':
                return <DynamicApprovalView data={dummyData} fieldDefinitions={fieldDefs} />;
              case 'form_builder':
                return <DynamicFormWizard data={dummyData} fieldDefinitions={fieldDefs} />;
              case 'custom_sandbox':
                return <SecureSandbox code={state.config?.custom_code || ""} initialData={{ records: dummyData, fieldDefs }} />;
              case 'data_module':
              default:
                return layout === 'table' ? (
                  <DynamicTable data={dummyData} fieldDefinitions={fieldDefs} />
                ) : (
                  <DynamicGrid data={dummyData} fieldDefinitions={fieldDefs} theme={theme} />
                );
            }
          })()}
        </React.Suspense>
      </div>
 ) : (
 <div className="h-full flex flex-col items-center justify-center text-[#71717a] dark:text-gray-400">
 <Zap className="w-12 h-12 mb-4 opacity-20 text-primary" />
 <p className="font-medium">Add fields or use OrbitBuild to generate your slate</p>
 <button
 onClick={() => setIsBoltOpen(true)}
 className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary text-white text-sm font-semibold hover:from-primary/90 hover:to-primary/90 transition-all -emerald-500/30"
 >
 ⚡ Launch OrbitBuild
 </button>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* OrbitBolt AI Full WorkSlate — sits as an overlay for generating slates */}
 {isBoltOpen && (
 <OrbitBoltWorkspace
 onClose={() => setIsBoltOpen(false)}
 onApplySchema={handleApplyBoltSchema}
 currentSchema={state}
 />
 )}
 </div>
 );
}
