import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Plus, GitBranch, Trash2, GripVertical, Save, Edit2, Bell, Clock } from "lucide-react";
// GripVertical used in PipelineEditor stage list
import CasePipelineKanban from "@/components/cases/CasePipelineKanban";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/shared/PageHeader";

const CASE_TYPES = ["civil", "criminal", "corporate", "family", "property", "labor", "tax", "other"];
const STAGE_COLORS = ["#3B82F6", "#8B5CF6", "#F59E0B", "#10B981", "#EF4444", "#EC4899", "#06B6D4", "#84CC16"];

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function PipelineCard({ pipeline, onEdit, onDelete, caseStates }) {
  const stagesCount = pipeline.stages?.length || 0;
  const activeCases = caseStates.filter(cs => cs.pipeline_id === pipeline.id).length;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold">{pipeline.name}</h3>
            {pipeline.case_type && (
              <Badge variant="outline" className="text-[10px] capitalize">{pipeline.case_type}</Badge>
            )}
            {pipeline.is_default && (
              <Badge className="text-[10px] bg-primary/10 text-primary">Default</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{stagesCount} stages · {activeCases} active cases</p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(pipeline)}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(pipeline.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {pipeline.stages?.length > 0 && (
        <div className="p-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {pipeline.stages.sort((a, b) => a.order - b.order).map((stage, idx) => (
              <React.Fragment key={stage.id}>
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className="w-20 h-7 rounded-md flex items-center justify-center text-white text-[10px] font-semibold shadow-sm"
                    style={{ backgroundColor: stage.color || "#3B82F6" }}
                  >
                    {stage.name}
                  </div>
                  {stage.deadline_days && (
                    <span className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />{stage.deadline_days}d
                    </span>
                  )}
                </div>
                {idx < pipeline.stages.length - 1 && (
                  <div className="w-4 h-px bg-border shrink-0 mx-0.5" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PipelineEditor({ pipeline, onClose, onSave }) {
  const [form, setForm] = useState(pipeline || { name: "", case_type: "civil", stages: [], is_default: false });
  const [newStageName, setNewStageName] = useState("");

  const addStage = () => {
    if (!newStageName.trim()) return;
    const newStage = {
      id: generateId(),
      name: newStageName.trim(),
      order: form.stages.length,
      color: STAGE_COLORS[form.stages.length % STAGE_COLORS.length],
      deadline_days: null,
      notify_team: true,
    };
    setForm(prev => ({ ...prev, stages: [...prev.stages, newStage] }));
    setNewStageName("");
  };

  const removeStage = (id) => setForm(prev => ({ ...prev, stages: prev.stages.filter(s => s.id !== id) }));

  const updateStage = (id, field, value) => setForm(prev => ({
    ...prev,
    stages: prev.stages.map(s => s.id === id ? { ...s, [field]: value } : s),
  }));

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pipeline ? "Edit Pipeline" : "Create Pipeline"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Pipeline Name</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Criminal Defense" />
            </div>
            <div className="space-y-1.5">
              <Label>Case Type</Label>
              <Select value={form.case_type} onValueChange={v => setForm(p => ({ ...p, case_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CASE_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_default} onChange={e => setForm(p => ({ ...p, is_default: e.target.checked }))} className="rounded" />
                <span className="text-sm">Set as default pipeline</span>
              </label>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label>Pipeline Stages</Label>
              <span className="text-xs text-muted-foreground">{form.stages.length} stages</span>
            </div>

            {/* Add stage input */}
            <div className="flex gap-2 mb-3">
              <Input
                value={newStageName}
                onChange={e => setNewStageName(e.target.value)}
                placeholder="Stage name (e.g. Discovery, Filing)"
                onKeyDown={e => e.key === "Enter" && addStage()}
                className="flex-1"
              />
              <Button size="sm" onClick={addStage} className="gap-1.5 shrink-0">
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
            </div>

            <div className="space-y-2">
              {form.stages.sort((a, b) => a.order - b.order).map((stage, idx) => (
                <div key={stage.id} className="flex items-center gap-2 p-2.5 bg-muted/30 rounded-lg border border-border">
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <div
                    className="w-4 h-4 rounded-full shrink-0 border-2 border-white shadow-sm cursor-pointer"
                    style={{ backgroundColor: stage.color }}
                    onClick={() => {
                      const nextColor = STAGE_COLORS[(STAGE_COLORS.indexOf(stage.color) + 1) % STAGE_COLORS.length];
                      updateStage(stage.id, "color", nextColor);
                    }}
                    title="Click to change color"
                  />
                  <span className="text-xs font-medium flex-1 truncate">{stage.name}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="days"
                      value={stage.deadline_days || ""}
                      onChange={e => updateStage(stage.id, "deadline_days", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-16 h-7 text-xs"
                    />
                  </div>
                  <button
                    onClick={() => updateStage(stage.id, "notify_team", !stage.notify_team)}
                    className={`shrink-0 ${stage.notify_team ? "text-primary" : "text-muted-foreground"}`}
                    title="Toggle team notifications"
                  >
                    <Bell className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => removeStage(stage.id)} className="text-destructive hover:opacity-80 shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {form.stages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Add stages to build your pipeline</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => onSave(form)} className="gap-1.5">
              <Save className="w-3.5 h-3.5" /> Save Pipeline
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CasePipelinePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const { data: pipelines = [], isLoading } = useQuery({
    queryKey: ["pipelines", user?.company_id],
    queryFn: () => base44.entities.CasePipeline.filter({ company_id: user?.company_id }),
    enabled: !!user?.company_id,
  });

  const { data: caseStates = [] } = useQuery({
    queryKey: ["pipeline-states", user?.company_id],
    queryFn: () => base44.entities.CasePipelineState.filter({ company_id: user?.company_id }),
    enabled: !!user?.company_id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CasePipeline.create({ ...data, company_id: user?.company_id }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pipelines"] }); setShowNew(false); toast({ title: "Pipeline created" }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CasePipeline.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pipelines"] }); setEditing(null); toast({ title: "Pipeline updated" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CasePipeline.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pipelines"] }); toast({ title: "Pipeline deleted" }); },
  });

  const handleSave = (form) => {
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Case Pipelines"
        subtitle="Define custom stages for each case type and track progress"
        actions={
          <Button size="sm" onClick={() => setShowNew(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> New Pipeline
          </Button>
        }
      />

      {/* Active case boards */}
      <CasePipelineKanban pipelines={pipelines} caseStates={caseStates} companyId={user?.company_id} />

      {/* Pipeline templates */}
      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Pipeline Templates</h2>
        {isLoading ? (
          <div className="text-center text-sm text-muted-foreground py-8">Loading pipelines...</div>
        ) : pipelines.length === 0 ? (
          <div className="bg-card rounded-xl border border-dashed border-border p-12 text-center">
            <GitBranch className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">No pipelines yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Create your first pipeline to track case stages</p>
            <Button size="sm" onClick={() => setShowNew(true)}>Create Pipeline</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pipelines.map(p => (
              <PipelineCard
                key={p.id}
                pipeline={p}
                caseStates={caseStates}
                onEdit={setEditing}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>

      {(showNew || editing) && (
        <PipelineEditor
          pipeline={editing}
          onClose={() => { setShowNew(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}