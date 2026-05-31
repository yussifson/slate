import React, { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/api/supabaseClient";
import { useNavigate, useParams } from "react-router-dom";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Blocks, Sparkles, Plus, Trash2, Play, Undo2, Redo2, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import DynamicTable from "@/components/ui/DynamicTable";
import DynamicGrid from "@/components/ui/DynamicGrid";
import { IconPicker } from "@/components/ui/IconPicker";
import { useUndoableState } from "@/hooks/useUndoableState";
import OrbitBoltPanel from "@/components/OrbitBoltPanel";

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
    records.push({ id: `dummy-${i}`, data, created_at: new Date().toISOString() });
  }
  return records;
};

export default function CreateModulePage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const companyId = useCompanyId();

  const initialState = {
    name: "",
    description: "",
    icon: "Blocks",
    layout: "table",
    theme: "primary",
    moduleType: "data_module",
    fields: [{ name: "name", field_type: "text", is_required: true, options: "" }]
  };

  const [state, setState, undo, redo, canUndo, canRedo, setWithoutHistory] = useUndoableState(initialState);
  const { name, description, icon, layout, theme, moduleType, fields } = state;

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isBoltOpen, setIsBoltOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isEditing && id) {
      const loadModule = async () => {
        try {
          const { data: mod, error: modError } = await supabase
            .from('module_definitions')
            .select('*')
            .eq('id', id)
            .single();

          if (modError) throw modError;
          if (!mod) return;

          const { data: fieldsData, error: fieldError } = await supabase
            .from('field_definitions')
            .select('*')
            .eq('module_id', id)
            .order('order_index', { ascending: true });

          if (fieldError) throw fieldError;

          const loadedFields = fieldsData && fieldsData.length > 0
            ? fieldsData.map(x => ({
                id: x.id,
                name: x.name || "",
                field_type: x.field_type || "text",
                is_required: x.is_required || false,
                options: Array.isArray(x.options) ? x.options.join(', ') : (x.options || "")
              }))
            : [{ name: "name", field_type: "text", is_required: true, options: "" }];

          setWithoutHistory({
            name: mod.name || "",
            description: mod.description || "",
            icon: mod.icon || "Blocks",
            layout: mod.config?.layout || "table",
            theme: mod.config?.theme || "primary",
            moduleType: mod.config?.page_type || mod.type || "data_module",
            fields: loadedFields
          });
        } catch (err) {
          console.error("Failed to load module for editing:", err);
          toast({ title: "Error", description: "Failed to load module data.", variant: "destructive" });
        }
      };
      loadModule();
    }
  }, [id, isEditing]);

  const handleAddField = () => {
    setState({ ...state, fields: [...fields, { name: "", field_type: "text", is_required: false, options: "" }] });
  };

  const handleRemoveField = (index) => {
    setState({ ...state, fields: fields.filter((_, i) => i !== index) });
  };

  const handleFieldChange = (index, key, value) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };
    setState({ ...state, fields: newFields });
  };

  // Called when OrbitBolt "Apply to Builder" is clicked
  const handleApplyBoltSchema = (schema) => {
    if (!schema) return;
    const mappedFields = (schema.fields && schema.fields.length > 0)
      ? schema.fields.map(f => ({
          name: f.name || "",
          field_type: f.field_type || "text",
          is_required: !!f.is_required,
          options: Array.isArray(f.options) ? f.options.join(", ") : (f.options || "")
        }))
      : state.fields;

    setState({
      name: schema.module?.name || name || "",
      description: schema.module?.description || description || "",
      icon: schema.module?.icon || icon || "Blocks",
      layout: schema.module?.layout || layout || "table",
      theme: schema.module?.theme || theme || "primary",
      moduleType: schema.module?.module_type || moduleType || "data_module",
      fields: mappedFields
    });

    toast({ title: "⚡ OrbitBolt Schema Applied!", description: "Review and customize your module, then publish." });
  };

  const saveModule = async (status = 'published') => {
    if (!name.trim() || fields.length === 0) {
      toast({ title: "Validation Error", description: "Module Name and at least 1 field are required.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const moduleId = isEditing ? id : crypto.randomUUID();

      const moduleData = {
        name,
        description,
        icon,
        status,
        is_active: 'true',
        type: moduleType === 'data_module' ? 'custom' : moduleType,
        config: { layout, theme, page_type: moduleType }
      };

      if (!isEditing) {
        moduleData.id = moduleId;
        moduleData.company_id = companyId || '00000000-0000-0000-0000-000000000000';
        moduleData.created_at = new Date().toISOString();
      }

      const { error: moduleError } = isEditing
        ? await supabase.from('module_definitions').update(moduleData).eq('id', id)
        : await supabase.from('module_definitions').insert(moduleData);

      if (moduleError) throw moduleError;

      // Delete existing fields then re-insert (clean update)
      await supabase.from('field_definitions').delete().eq('module_id', moduleId);

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

        const { error: fieldError } = await supabase.from('field_definitions').insert(fieldsToInsert);
        if (fieldError) throw fieldError;
      }

      toast({
        title: status === 'draft' ? "📝 Saved as Draft" : (isEditing ? "✨ Module Updated!" : "✨ Module Published!"),
        description: `'${name}' is ready. Redirecting...`,
      });

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      navigate(`/m/${slug}`);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: err.message || "Failed to save module.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Current schema for OrbitBolt context when editing
  const currentSchema = isEditing ? {
    name, description, icon, layout, theme,
    module_type: moduleType,
    fields: fields.map(f => ({ name: f.name, field_type: f.field_type, is_required: f.is_required, options: f.options }))
  } : null;

  return (
    <div className="flex h-full min-h-screen">
      {/* Main content area */}
      <div className="flex-1 min-w-0 space-y-6 animate-in fade-in duration-300 pb-20 p-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <PageHeader
            title={isEditing ? "Edit Module" : "Module Builder"}
            subtitle="Design custom records and workflows."
          />
          <div className="flex gap-2 items-center">
            <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} title="Undo">
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} title="Redo">
              <Redo2 className="w-4 h-4" />
            </Button>
            <div className="w-px h-8 bg-border mx-1" />
            <Button
              onClick={() => setIsBoltOpen(!isBoltOpen)}
              className={`gap-2 font-bold shadow-md transition-all ${
                isBoltOpen
                  ? 'bg-gradient-to-r from-purple-700 to-pink-700 text-white'
                  : isEditing
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
              }`}
            >
              <Zap className="w-4 h-4" />
              {isBoltOpen ? 'Close OrbitBolt' : isEditing ? 'Edit with OrbitBolt' : 'Build with OrbitBolt'}
            </Button>
          </div>
        </div>

        {/* Builder grid */}
        <div className={`grid grid-cols-1 ${isSidebarOpen ? 'xl:grid-cols-3' : 'xl:grid-cols-1'} gap-6 transition-all duration-300`}>
          {isSidebarOpen && (
            <div className="xl:col-span-1 space-y-6 animate-in slide-in-from-left duration-300">
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-6">
                {/* Module Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground border-b border-border pb-2">Module Details</h3>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Module Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setState({ ...state, name: e.target.value })}
                      placeholder="e.g. Patient Referrals"
                      className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Module Type</label>
                    <select
                      value={moduleType}
                      onChange={(e) => setState({ ...state, moduleType: e.target.value })}
                      className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="data_module">Data Module (Table/Grid)</option>
                      <option value="dashboard">Dashboard (Charts & Stats)</option>
                      <option value="kanban">Kanban Board (Workflow)</option>
                      <option value="document_manager">Document Manager</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setState({ ...state, description: e.target.value })}
                      placeholder="Brief description of what this module tracks..."
                      className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring h-20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Icon</label>
                    <IconPicker
                      value={icon}
                      onChange={(val) => setState({ ...state, icon: val })}
                    />
                  </div>
                </div>

                {/* Fields */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground border-b border-border pb-2 mt-6">Data Fields</h3>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {fields.map((f, i) => (
                      <div key={i} className="bg-muted border border-border rounded-lg p-3 relative group">
                        <button
                          type="button"
                          onClick={() => handleRemoveField(i)}
                          className="absolute top-2 right-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-2 gap-3 mb-2 pr-6">
                          <input
                            type="text"
                            value={f.name}
                            onChange={e => handleFieldChange(i, 'name', e.target.value)}
                            placeholder="Field Name"
                            className="w-full rounded border border-input bg-background text-foreground px-2 py-1.5 text-sm"
                          />
                          <select
                            value={f.field_type}
                            onChange={e => handleFieldChange(i, 'field_type', e.target.value)}
                            className="w-full rounded border border-input bg-background text-foreground px-2 py-1.5 text-sm"
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
                              className="w-full rounded border border-input bg-background text-foreground px-2 py-1.5 text-sm"
                            />
                          </div>
                        )}
                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={!!f.is_required}
                            onChange={e => handleFieldChange(i, 'is_required', e.target.checked)}
                            className="rounded border-input"
                          />
                          Required Field
                        </label>
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddField} className="w-full mt-2 h-8 text-xs gap-1">
                    <Plus className="w-3 h-3" /> Add New Field
                  </Button>
                </div>

                {/* Design & Layout */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground border-b border-border pb-2 mt-6">Design & Layout</h3>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Layout Style</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setState({ ...state, layout: "table" })}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all ${layout === 'table' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:bg-muted'}`}
                      >
                        <svg className="w-6 h-6 mb-2 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        Table View
                      </button>
                      <button
                        type="button"
                        onClick={() => setState({ ...state, layout: "grid" })}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all ${layout === 'grid' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:bg-muted'}`}
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
                        { id: "primary", hex: "#4f46e5" },
                        { id: "blue", hex: "#2563eb" },
                        { id: "emerald", hex: "#059669" },
                        { id: "rose", hex: "#e11d48" },
                        { id: "amber", hex: "#d97706" },
                        { id: "purple", hex: "#9333ea" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setState({ ...state, theme: t.id })}
                          className={`w-8 h-8 rounded-full transition-all flex items-center justify-center ${theme === t.id ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110' : 'hover:scale-105'}`}
                          style={{ backgroundColor: t.hex }}
                          title={t.id.charAt(0).toUpperCase() + t.id.slice(1)}
                        >
                          {theme === t.id && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Save Buttons */}
                <div className="pt-6 border-t border-border flex justify-end gap-3 mt-6">
                  <Button type="button" variant="outline" onClick={() => saveModule('draft')} disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? "Saving..." : "Save Draft"}
                  </Button>
                  <Button type="button" onClick={() => saveModule('published')} disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1">
                    {isSubmitting ? "Saving..." : (isEditing ? "Update Module" : "Publish")}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Preview Panel */}
          <div className={isSidebarOpen ? "xl:col-span-2" : "xl:col-span-1 h-full"}>
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden h-full flex flex-col transition-all duration-300">
              <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-3 text-foreground font-medium">
                  <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-1.5 rounded-md hover:bg-background border border-transparent hover:border-border transition-colors text-muted-foreground hover:text-foreground"
                    title={isSidebarOpen ? "Collapse Configuration" : "Expand Configuration"}
                  >
                    {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-primary" />
                    Live Preview
                  </div>
                </div>
                <div className="text-xs text-muted-foreground px-2 py-1 bg-background border border-border rounded-md">
                  Interactive Environment
                </div>
              </div>
              <div className="p-6 flex-1 min-h-[600px] bg-background/50">
                {fields.filter(f => f.name.trim()).length > 0 ? (
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Blocks className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">{name || "Untitled Module"}</h2>
                        <p className="text-sm text-muted-foreground">{description || "No description provided."}</p>
                      </div>
                    </div>
                    {layout === 'table' ? (
                      <DynamicTable
                        data={generateDummyData(fields)}
                        fieldDefinitions={fields.map((f, i) => ({ ...f, name: f.name.trim().replace(/ /g, '_').toLowerCase(), order_index: i }))}
                      />
                    ) : (
                      <DynamicGrid
                        data={generateDummyData(fields)}
                        fieldDefinitions={fields.map((f, i) => ({ ...f, name: f.name.trim().replace(/ /g, '_').toLowerCase(), order_index: i }))}
                        theme={theme}
                      />
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <Zap className="w-12 h-12 mb-4 opacity-20 text-purple-500" />
                    <p className="font-medium">Add fields or use OrbitBolt to generate your module</p>
                    <button
                      onClick={() => setIsBoltOpen(true)}
                      className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-purple-500/30"
                    >
                      ⚡ Launch OrbitBolt
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OrbitBolt Side Panel — sits beside the main content like Orbit AI */}
      <OrbitBoltPanel
        isOpen={isBoltOpen}
        onClose={() => setIsBoltOpen(false)}
        onApplySchema={handleApplyBoltSchema}
        currentSchema={currentSchema}
      />
    </div>
  );
}
