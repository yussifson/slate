import React, { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/api/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Blocks, Sparkles, Plus, Trash2, X } from "lucide-react";

export default function CreateModulePage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const companyId = useCompanyId();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Blocks");
  const [fields, setFields] = useState([{ name: "name", field_type: "text", is_required: true, options: "" }]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

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
      const response = await supabase.functions.invoke('generate-dynamic-module', {
        body: { prompt: aiPrompt, company_id: companyId }
      });
      
      if (response.error) throw response.error;
      
      const data = response.data;
      if (data?.success && data?.schema) {
        setName(data.schema.module.name || "");
        setDescription(data.schema.module.description || "");
        setIcon(data.schema.module.icon || "Blocks");
        
        if (data.schema.fields && data.schema.fields.length > 0) {
          const mappedFields = data.schema.fields.map(f => ({
            name: f.name || "",
            field_type: f.field_type || "text",
            is_required: !!f.is_required,
            options: Array.isArray(f.options) ? f.options.join(", ") : ""
          }));
          setFields(mappedFields);
        }
        
        toast({ title: "Module Schema Generated", description: "Review and save your new module!" });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || fields.length === 0) return;

    setIsSubmitting(true);
    try {
      const moduleId = crypto.randomUUID();
      const { error: moduleError } = await supabase.from('module_definitions').insert({
        id: moduleId,
        company_id: companyId || '00000000-0000-0000-0000-000000000000',
        name,
        description,
        icon,
        is_active: 'true',
        created_at: new Date().toISOString()
      });

      if (moduleError) throw moduleError;

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
        title: "Module Saved",
        description: `Successfully created ${name}.`,
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
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader title="Visual Module Builder" subtitle="Design custom records and workflows." />
        <Button onClick={() => setIsAiModalOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-bold shadow-md">
          <Sparkles className="w-4 h-4" /> Generate with AI
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 shadow-sm max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="font-semibold text-foreground">Data Fields</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddField} className="h-7 px-2 text-xs gap-1">
                  <Plus className="w-3 h-3" /> Add Field
                </Button>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
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
            </div>
          </div>

          <div className="pt-6 border-t border-border flex justify-end">
            <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[150px]">
              {isSubmitting ? "Saving..." : "Save Module"}
            </Button>
          </div>
        </form>
      </div>

      {isAiModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-border">
            <div className="p-4 border-b border-white/20 flex justify-between items-center bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <h2 className="font-semibold flex items-center gap-2"><Sparkles className="w-5 h-5"/> AI Module Generator</h2>
              <button onClick={() => !isGenerating && setIsAiModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><X className="w-5 h-5"/></button>
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
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white min-w-[140px]" disabled={isGenerating}>
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
