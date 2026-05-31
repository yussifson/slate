import React, { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/api/supabaseClient";
import { useNavigate, useParams } from "react-router-dom";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Blocks, Sparkles, Plus, Trash2, X, Play } from "lucide-react";
import DynamicTable from "@/components/ui/DynamicTable";
import DynamicGrid from "@/components/ui/DynamicGrid";

const generateDummyData = (fields) => {
  const dummyCount = 5;
  const records = [];
  for (let i = 0; i < dummyCount; i++) {
    const data = {};
    fields.forEach(f => {
      const name = f.name.trim().replace(/ /g, '_').toLowerCase();
      if (!name) return;
      if (f.field_type === 'text') data[name] = `Sample ${f.name} ${i+1}`;
      else if (f.field_type === 'number') data[name] = Math.floor(Math.random() * 1000);
      else if (f.field_type === 'date') data[name] = new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0];
      else if (f.field_type === 'boolean') data[name] = Math.random() > 0.5;
      else if (f.field_type === 'select') {
        const opts = f.options ? f.options.split(',').map(o => o.trim()).filter(Boolean) : [];
        data[name] = opts.length > 0 ? opts[Math.floor(Math.random() * opts.length)] : 'Option 1';
      } else {
        data[name] = `Data ${i+1}`;
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
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Blocks");
  const [layout, setLayout] = useState("table");
  const [theme, setTheme] = useState("primary");
  const [fields, setFields] = useState([{ name: "name", field_type: "text", is_required: true, options: "" }]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  React.useEffect(() => {
    if (isEditing) {
      const loadModule = async () => {
        const { data: mod } = await supabase.from('module_definitions').select('*').eq('id', id).single();
        if (mod) {
          setName(mod.name || "");
          setDescription(mod.description || "");
          setIcon(mod.icon || "Blocks");
          setLayout(mod.config?.layout || "table");
          setTheme(mod.config?.theme || "primary");
          
          const { data: f } = await supabase.from('field_definitions').select('*').eq('module_id', id).order('order_index');
          if (f && f.length > 0) {
            setFields(f.map(x => ({ 
              ...x, 
              options: Array.isArray(x.options) ? x.options.join(', ') : x.options || "" 
            })));
          }
        }
      };
      loadModule();
    }
  }, [id, isEditing]);

  const handleAddField = () => {
    setFields([...fields, { name: "", field_type: "text", is_required: false, options: "" }]);
  };

  const handleRemoveField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index, key, value) => {
    const newFields = [...fields];
    newFields[index][key] = value;
    setFields(newFields);
  };

  const handleAiGenerate = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const payload = {
        prompt: aiPrompt, 
        company_id: companyId
      };
      
      if (isEditing) {
        payload.currentSchema = {
          name,
          description,
          icon,
          layout,
          theme,
          fields: fields.map(f => ({ name: f.name, field_type: f.field_type, is_required: f.is_required, options: f.options }))
        };
      }

      const response = await supabase.functions.invoke('generate-dynamic-module', {
        body: payload
      });
      
      if (response.error) throw response.error;
      
      const data = response.data;
      if (data?.success && data?.schema) {
        setName(data.schema.module.name || "");
        setDescription(data.schema.module.description || "");
        setIcon(data.schema.module.icon || "Blocks");
        setLayout(data.schema.module.layout || "table");
        setTheme(data.schema.module.theme || "primary");
        
        if (data.schema.fields && data.schema.fields.length > 0) {
          const mappedFields = data.schema.fields.map(f => ({
            name: f.name || "",
            field_type: f.field_type || "text",
            is_required: !!f.is_required,
            options: Array.isArray(f.options) ? f.options.join(", ") : ""
          }));
          setFields(mappedFields);
        }
        
        toast({ title: "OrbitBolt Generation Complete", description: "Review and customize your new module layout!" });
        setIsAiModalOpen(false);
        setAiPrompt("");
      } else {
        throw new Error("Invalid AI response");
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Generation Failed", description: err.message || "Failed to generate module.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
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
        status, // 'draft' or 'published'
        is_active: 'true',
        config: { layout, theme },
        updated_at: new Date().toISOString()
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

      if (isEditing) {
        await supabase.from('field_definitions').delete().eq('module_id', moduleId);
      }

      const fieldsToInsert = fields.map((f, idx) => ({
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

      toast({
        title: status === 'draft' ? "📝 Saved as Draft" : (isEditing ? "✨ Module Updated!" : "✨ Module Successfully Published!"),
        description: `Your custom module '${name}' is ready. Redirecting...`,
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20 max-w-[1600px] mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader title={isEditing ? "Edit Module" : "Module Builder"} subtitle="Design custom records and workflows." />
        <div className="flex gap-2">
          {isEditing && (
            <Button onClick={() => setIsAiModalOpen(true)} variant="outline" className="gap-2 font-semibold">
              <Sparkles className="w-4 h-4 text-purple-600" /> AI Edit Module
            </Button>
          )}
          {!isEditing && (
            <Button onClick={() => setIsAiModalOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-bold shadow-md">
              <Sparkles className="w-4 h-4" /> Generate with AI
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground border-b border-border pb-2">Module Details</h3>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Module Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Patient Referrals"
                  className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of what this module tracks..."
                  className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring h-20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Icon (Lucide React Name)</label>
                <input 
                  type="text" 
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="e.g. Blocks, Users, Settings"
                  className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground border-b border-border pb-2 mt-6">Data Fields</h3>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {fields.map((f, i) => (
                  <div key={i} className="bg-muted border border-border rounded-lg p-3 relative group">
                    <button type="button" onClick={() => handleRemoveField(i)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-2 gap-3 mb-2 pr-6">
                      <input 
                        type="text" 
                        value={f.name} 
                        onChange={e => handleFieldChange(i, 'name', e.target.value)} 
                        placeholder="Field Name" 
                        className="w-full rounded border border-input bg-background text-foreground px-2 py-1.5 text-sm" required 
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
                          className="w-full rounded border border-input bg-background text-foreground px-2 py-1.5 text-sm" required 
                        />
                      </div>
                    )}
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input 
                        type="checkbox" 
                        checked={f.is_required} 
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

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2 mt-6">
                <h3 className="font-semibold text-foreground">Design & Layout</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Layout Style</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setLayout("table")}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all ${layout === 'table' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:bg-muted'}`}
                  >
                    <svg className="w-6 h-6 mb-2 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    Table View
                  </button>
                  <button 
                    type="button"
                    onClick={() => setLayout("grid")}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all ${layout === 'grid' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:bg-muted'}`}
                  >
                    <svg className="w-6 h-6 mb-2 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
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
                      onClick={() => setTheme(t.id)}
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

        <div className="xl:col-span-2">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Play className="w-4 h-4 text-primary" />
                Live Preview
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
                  <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                  <p>Add fields to see a live preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isAiModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-border">
            <div className="p-4 border-b border-border flex justify-between items-center bg-primary text-primary-foreground">
              <h2 className="font-semibold flex items-center gap-2"><Sparkles className="w-5 h-5"/> AI Module Generator</h2>
              <button onClick={() => !isGenerating && setIsAiModalOpen(false)} className="hover:bg-primary-foreground/20 p-1 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleAiGenerate} className="p-6 bg-card">
              <label className="block text-sm font-medium text-foreground mb-2">
                What kind of workflow or data do you want to manage?
              </label>
              <textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="e.g. A School Bus Routing module with bus numbers, driver assignments, routes, and capacity."
                className="w-full rounded-lg border border-input bg-background text-foreground p-3 focus:ring-2 focus:ring-ring focus:outline-none min-h-[120px] resize-none"
                disabled={isGenerating}
              />
              {isGenerating && (
                <div className="mt-3 flex items-center gap-2 text-sm text-primary">
                  <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
                  <span>AI is generating your module schema... this may take 15–30 seconds</span>
                </div>
              )}
              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsAiModalOpen(false)} disabled={isGenerating}>Cancel</Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px]" disabled={isGenerating}>
                  {isGenerating ? "Generating..." : "Generate Schema"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
