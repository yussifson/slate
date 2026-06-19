import { useTranslation} from "react-i18next";
import React, { useState} from "react";
import { base44} from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import { useAuth} from "@/lib/AuthContext";
import { Plus, GitBranch, Trash2, GripVertical, Save, Edit2, Bell, Clock} from "lucide-react";
// GripVertical used in PipelineEditor stage list
import CasePipelineKanban from "@/components/cases/CasePipelineKanban";
import { Button} from "@/components/ui/button";
import { Input} from "@/components/ui/input";
import { Badge} from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import { Label} from "@/components/ui/label";
import { useToast} from "@/components/ui/use-toast";
import PageHeader from "@/components/shared/PageHeader";

const CASE_TYPES = ["civil", "criminal", "corporate", "family", "property", "labor", "tax", "other"];
const STAGE_COLORS = ["#3B82F6", "#8B5CF6", "#F59E0B", "#10B981", "#EF4444", "#EC4899", "#06B6D4", "#84CC16"];

function generateId() {
 return Math.random().toString(36).slice(2, 9);
}

function PipelineCard({ pipeline, onEdit, onDelete, caseStates}) {
 const { t} = useTranslation();
 const stagesCount = pipeline.stages?.length || 0;
 const activeCases = caseStates.filter(cs => cs.pipeline_id === pipeline.id).length;

 return (
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/40 flex items-start justify-between gap-3">
 <div>
 <div className="flex items-center gap-2 flex-wrap">
 <h3 className="text-sm font-semibold">{pipeline.name}</h3>
 {pipeline.case_type && (
 <Badge variant="outline" className="text-[10px] capitalize">{pipeline.case_type}</Badge>
 )}
 {pipeline.is_default && (
 <Badge className="text-[10px] bg-slate-100 text-primary">{t("default", "Default")}</Badge>
 )}
 </div>
 <p className="text-xs text-[#71717a] dark:text-gray-400 mt-1 tracking-[0.04em]">{stagesCount} {t("stages", "stages ·")} {activeCases} {t("active_cases", "active cases")}</p>
 </div>
 <div className="flex gap-2">
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
 <div className="flex items-center gap-2 overflow-x-auto pb-1">
 {pipeline.stages.sort((a, b) => a.order - b.order).map((stage, idx) => {

 return (
 <React.Fragment key={stage.id}>
 <div className="flex flex-col items-center shrink-0">
 <div
 className="w-20 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-semibold "
 style={{ backgroundColor: stage.color || "#3B82F6"}}
 >
 {stage.name}
 </div>
 {stage.deadline_days && (
 <span className="text-[9px] text-[#71717a] dark:text-gray-400 mt-0.5 flex items-center gap-0.5">
 <Clock className="w-2.5 h-2.5" />{stage.deadline_days}d
 </span>
 )}
 </div>
 {idx < pipeline.stages.length - 1 && (
 <div className="w-4 h-px bg-primary/40 shrink-0 mx-0.5" />
 )}
 </React.Fragment>
 );
})}
 </div>
 </div>
 )}
 </div>
 );
}

function PipelineEditor({ pipeline, onClose, onSave}) {
 const [form, setForm] = useState(pipeline || { name: "", case_type: "civil", stages: [], is_default: false});
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
 setForm(prev => ({ ...prev, stages: [...prev.stages, newStage]}));
 setNewStageName("");
};

 const removeStage = (id) => setForm(prev => ({ ...prev, stages: prev.stages.filter(s => s.id !== id)}));

 const updateStage = (id, field, value) => setForm(prev => ({
 ...prev,
 stages: prev.stages.map(s => s.id === id ? { ...s, [field]: value} : s),
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
 <Label>{t("pipeline_name", "Pipeline Name")}</Label>
 <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value}))} placeholder="e.g. Criminal Defense" />
 </div>
 <div className="space-y-1.5">
 <Label>{t("case_type", "Case Type")}</Label>
 <Select value={form.case_type} onValueChange={v => setForm(p => ({ ...p, case_type: v}))}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>
 {CASE_TYPES.map(typeStr => {
 return <SelectItem key={typeStr} value={typeStr} className="capitalize">{t(typeStr, typeStr)}</SelectItem>;
})}
 </SelectContent>
 </Select>
 </div>
 <div className="flex items-end pb-0.5">
 <label className="flex items-center gap-2 cursor-pointer">
 <input type="checkbox" checked={form.is_default} onChange={e => setForm(p => ({ ...p, is_default: e.target.checked}))} className="rounded-md" />
 <span className="text-sm">{t("set_as_default_pipeline", "Set as default pipeline")}</span>
 </label>
 </div>
 </div>

 <div className="border-t border-primary/40 pt-4">
 <div className="flex items-center justify-between mb-3">
 <Label>{t("pipeline_stages", "Pipeline Stages")}</Label>
 <span className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{form.stages.length} {t("stages", "stages")}</span>
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
 <Button size="sm" onClick={addStage} className="gap-2.5 shrink-0">
 <Plus className="w-3.5 h-3.5" /> {t("add", "Add")}
 </Button>
 </div>

 <div className="space-y-2">
 {form.stages.sort((a, b) => a.order - b.order).map((stage, idx) => {

 return (
 <div key={stage.id} className="flex items-center gap-2 p-2.5 bg-muted/30 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40">
 <GripVertical className="w-3.5 h-3.5 text-[#71717a] dark:text-gray-400 shrink-0" />
 <div
 className="w-4 h-4 rounded-full shrink-0 border-2 border-white cursor-pointer"
 style={{ backgroundColor: stage.color}}
 onClick={() => {
 const nextColor = STAGE_COLORS[(STAGE_COLORS.indexOf(stage.color) + 1) % STAGE_COLORS.length];
 updateStage(stage.id, "color", nextColor);
}}
 title="Click to change color"
 />
 <span className="text-xs font-medium flex-1 truncate tracking-[0.04em]">{stage.name}</span>
 <div className="flex items-center gap-2 shrink-0">
 <Clock className="w-3 h-3 text-[#71717a] dark:text-gray-400" />
 <Input
 type="number"
 placeholder="days"
 value={stage.deadline_days || ""}
 onChange={e => updateStage(stage.id, "deadline_days", e.target.value ? parseInt(e.target.value) : null)}
 className="w-16 h-7 text-xs tracking-[0.04em]"
 />
 </div>
 <button
 onClick={() => updateStage(stage.id, "notify_team", !stage.notify_team)}
 className={`shrink-0 ${stage.notify_team ? "text-primary" : "text-[#71717a] dark:text-gray-400"}`}
 title="Toggle team notifications"
 >
 <Bell className="w-3.5 h-3.5" />
 </button>
 <button onClick={() => removeStage(stage.id)} className="text-destructive hover:opacity-80 shrink-0">
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 );
})}
 {form.stages.length === 0 && (
 <p className="text-xs text-[#71717a] dark:text-gray-400 text-center py-4 tracking-[0.04em]">{t("add_stages_to_build_your_pipel", "Add stages to build your pipeline")}</p>
 )}
 </div>
 </div>

 <div className="flex justify-end gap-2 border-t border-primary/40 pt-3">
 <Button variant="outline" onClick={onClose}>{t("cancel", "Cancel")}</Button>
 <Button onClick={() => onSave(form)} className="gap-2.5">
 <Save className="w-3.5 h-3.5" /> {t("save_pipeline", "Save Pipeline")}
 </Button>
 </div>
 </div>
 </DialogContent>
 </Dialog>
 );
}

export default function CasePipelinePage() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const { toast} = useToast();
 const queryClient = useQueryClient();
 const [editing, setEditing] = useState(null);
 const [showNew, setShowNew] = useState(false);

 const { data: pipelines = [], isLoading} = useQuery({
 queryKey: ["pipelines", user?.company_id],
 queryFn: () => base44.entities.CasePipeline.filter({ company_id: user?.company_id}),
 enabled: !!user?.company_id,
});

 const { data: caseStates = []} = useQuery({
 queryKey: ["pipeline-states", user?.company_id],
 queryFn: () => base44.entities.CasePipelineState.filter({ company_id: user?.company_id}),
 enabled: !!user?.company_id,
});

 const createMutation = useMutation({
 mutationFn: (data) => base44.entities.CasePipeline.create({ ...data, company_id: user?.company_id}),
 onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pipelines"]}); setShowNew(false); toast({ title: "Pipeline created"});},
});

 const updateMutation = useMutation({
 mutationFn: ({ id, data}) => base44.entities.CasePipeline.update(id, data),
 onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pipelines"]}); setEditing(null); toast({ title: "Pipeline updated"});},
});

 const deleteMutation = useMutation({
 mutationFn: (id) => base44.entities.CasePipeline.delete(id),
 onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pipelines"]}); toast({ title: "Pipeline deleted"});},
});

 const handleSave = (form) => {
 if (editing) updateMutation.mutate({ id: editing.id, data: form});
 else createMutation.mutate(form);
};

 return (
 <div className="space-y-6">
 <PageHeader
 title="Case Pipelines"
 subtitle="Define custom stages for each case type and track progress"
 actions={
 ["super_admin", "company_admin", "managing_partner"].includes(user?.role) && (
 <Button size="sm" onClick={() => setShowNew(true)} className="gap-2.5">
 <Plus className="w-4 h-4" /> {t("new_pipeline", "New Pipeline")}
 </Button>
 )
}
 />
 {/* Active case boards */}
 <CasePipelineKanban pipelines={pipelines} caseStates={caseStates} companyId={user?.company_id} />
 {/* Pipeline templates - Admin Only */}
 {["super_admin", "company_admin", "managing_partner"].includes(user?.role) && (
 <div>
 <h2 className="text-sm font-semibold mb-3 text-[#71717a] dark:text-gray-400 uppercase tracking-wide tracking-[0.04em]">{t("pipeline_templates", "Pipeline Templates")}</h2>
 {isLoading ? (
 <div className="text-center text-sm text-[#71717a] dark:text-gray-400 py-8">{t("loading_pipelines", "Loading pipelines...")}</div>
 ) : pipelines.length === 0 ? (
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-dashed border-primary/40 p-12 text-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <GitBranch className="w-10 h-10 text-[#71717a] dark:text-gray-400 mx-auto mb-3" />
 <p className="text-sm font-medium">{t("no_pipelines_yet", "No pipelines yet")}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 mt-1 mb-4 tracking-[0.04em]">{t(
 "create_your_first_pipeline_to_",
 "Create your first pipeline to track case stages"
 )}</p>
 <Button size="sm" onClick={() => setShowNew(true)}>{t("create_pipeline", "Create Pipeline")}</Button>
 </div>
 ) : (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 {pipelines.map(p => {

 return (
 <PipelineCard
 key={p.id}
 pipeline={p}
 caseStates={caseStates}
 onEdit={setEditing}
 onDelete={(id) => deleteMutation.mutate(id)}
 />
 );
})}
 </div>
 )}
 </div>
 )}
 {(showNew || editing) && (
 <PipelineEditor
 pipeline={editing}
 onClose={() => { setShowNew(false); setEditing(null);}}
 onSave={handleSave}
 />
 )}
 </div>
 );
}