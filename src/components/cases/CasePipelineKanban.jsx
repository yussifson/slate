import { useTranslation} from "react-i18next";
import React, { useState} from "react";
import { DragDropContext, Droppable, Draggable} from "@hello-pangea/dnd";
import { base44} from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import { useAuth} from "@/lib/AuthContext";
import { useToast} from "@/components/ui/use-toast";
import { Badge} from "@/components/ui/badge";
import { Button} from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import { CheckCircle, Plus, GripVertical} from "lucide-react";
import { PRIORITY_COLORS} from "@/lib/constants";

export default function CasePipelineKanban({ pipelines, caseStates, companyId}) {
 const { t} = useTranslation();
 const { toast} = useToast();
 const queryClient = useQueryClient();
 const [selectedPipelineId, setSelectedPipelineId] = useState(null);

 const activePipeline = selectedPipelineId
 ? pipelines.find(p => p.id === selectedPipelineId)
 : pipelines[0];

 const { data: cases = []} = useQuery({
 queryKey: ["cases-for-pipeline", companyId],
 queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId}),
 enabled: !!companyId});

 const updateStateMutation = useMutation({
 mutationFn: ({ stateId, caseId, stage, pipelineId}) => {
 if (stateId) {
 return base44.entities.CasePipelineState.update(stateId, {
 current_stage_id: stage.id,
 current_stage_name: stage.name,
 stage_entered_at: new Date().toISOString()});
}
 return base44.entities.CasePipelineState.create({
 company_id: companyId,
 case_id: caseId,
 pipeline_id: pipelineId,
 current_stage_id: stage.id,
 current_stage_name: stage.name,
 stage_entered_at: new Date().toISOString(),
 stage_history: []});
},
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["pipeline-states"]});
 toast({ title: "Item moved successfully"});
}});

 if (!activePipeline || !activePipeline.stages?.length) return null;

 const stages = [...activePipeline.stages].sort((a, b) => a.order - b.order);

 const trackedStates = caseStates.filter(cs => cs.pipeline_id === activePipeline.id);
 const trackedCaseIds = new Set(trackedStates.map(cs => cs.case_id));
 const untrackedCases = cases.filter(c => !trackedCaseIds.has(c.id));

 // Build stageId -> cards mapping
 const stageCards = {};
 stages.forEach(s => {
 stageCards[s.id] = trackedStates
 .filter(cs => cs.current_stage_id === s.id)
 .map(cs => {
 const caseData = cases.find(c => c.id === cs.case_id);
 return caseData ? { ...caseData, stateId: cs.id} : null;
})
 .filter(Boolean);
});

 const onDragEnd = (result) => {
 const { source, destination, draggableId} = result;
 if (!destination || source.droppableId === destination.droppableId) return;

 const destStage = stages.find(s => s.id === destination.droppableId);
 if (!destStage) return;

 // draggableId = caseId
 const caseId = draggableId;
 const existingState = trackedStates.find(cs => cs.case_id === caseId);

 updateStateMutation.mutate({
 stateId: existingState?.id || null,
 caseId,
 stage: destStage,
 pipelineId: activePipeline.id});
};

 return (
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {/* Header */}
 <div className="p-4 border-b border-primary/40 flex items-center justify-between gap-3 flex-wrap bg-muted/30">
 <div className="flex items-center gap-2">
 <CheckCircle className="w-4 h-4 text-primary" />
 <span className="text-sm font-semibold">{t("pipeline_board", "Pipeline Board")}</span>
 <span className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("drag_cards_between_stages", "· drag items between stages")}</span>
 </div>
 {pipelines.length > 1 && (
 <Select value={selectedPipelineId || pipelines[0]?.id} onValueChange={setSelectedPipelineId}>
 <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
 <SelectContent>
 {pipelines.map(p => {
 return <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>;
})}
 </SelectContent>
 </Select>
 )}
 </div>
 {/* Kanban columns */}
 <div className="p-4 overflow-x-auto">
 <DragDropContext onDragEnd={onDragEnd}>
 <div className="flex gap-4" style={{ minWidth: `${stages.length * 224 + (untrackedCases.length > 0 ? 224 : 0)}px`}}>
 {stages.map(stage => {
 return (
 <div key={stage.id} className="w-52 shrink-0 flex flex-col">
 {/* Stage header */}
 <div className="flex items-center gap-2 mb-3 px-1">
 <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color}} />
 <span className="text-xs font-semibold tracking-[0.04em]">{stage.name}</span>
 <span className="ml-auto text-[10px] bg-muted text-[#71717a] dark:text-gray-400 px-1.5 py-0.5 rounded-full">
 {stageCards[stage.id]?.length || 0}
 </span>
 </div>
 {/* Droppable column */}
 <Droppable droppableId={stage.id}>
 {(provided, snapshot) => {
 return (
 <div
 ref={provided.innerRef}
 {...provided.droppableProps}
 className={`flex-1 space-y-2 min-h-[120px] rounded-xl p-2 transition-colors ${
 snapshot.isDraggingOver ? "bg-slate-50 border-[0.5px] border-black/9 dark:border-white/8 border-dashed border-primary/30" : "bg-muted/20"
}`}
 >
 {(stageCards[stage.id] || []).map((c, index) => {
 return (
 <Draggable key={c.id} draggableId={c.id} index={index}>
 {(provided, snapshot) => {
 return (
 <div
 ref={provided.innerRef}
 {...provided.draggableProps}
 className={`bg-card border-[0.5px] border-black/9 dark:border-white/8 rounded-xl p-2.5 text-xs space-y-1.5 ${
 snapshot.isDragging ? " border-primary/40 rotate-1" : "border-primary/40"
}`}
 >
 <div className="flex items-start gap-2.5">
 <span {...provided.dragHandleProps} className="mt-0.5 cursor-grab active:cursor-grabbing">
 <GripVertical className="w-3 h-3 text-[#71717a] dark:text-gray-400" />
 </span>
 <p className="font-medium leading-tight line-clamp-2 flex-1">{c.title}</p>
 </div>
 {c.client_name && (
 <p className="text-[#71717a] dark:text-gray-400 truncate pl-4">{c.client_name}</p>
 )}
 {c.priority && (
 <div className="pl-4">
 <span className={`inline-block px-1.5 py-0.5 rounded-md text-[9px] font-semibold ${PRIORITY_COLORS[c.priority] || ""}`}>
 {c.priority}
 </span>
 </div>
 )}
 </div>
 );
}}
 </Draggable>
 );
})}
 {provided.placeholder}
 {(stageCards[stage.id]?.length === 0) && !snapshot.isDraggingOver && (
 <div className="h-12 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-dashed border-primary/40 flex items-center justify-center">
 <span className="text-[10px] text-[#71717a] dark:text-gray-400">{t("drop_here", "Drop here")}</span>
 </div>
 )}
 </div>
 );
}}
 </Droppable>
 </div>
 );
})}

 {/* Untracked cases column */}
 {untrackedCases.length > 0 && (
 <div className="w-52 shrink-0 flex flex-col">
 <div className="flex items-center gap-2 mb-3 px-1">
 <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground shrink-0" />
 <span className="text-xs font-semibold text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("not_tracked", "Not Tracked")}</span>
 <span className="ml-auto text-[10px] bg-muted text-[#71717a] dark:text-gray-400 px-1.5 py-0.5 rounded-full">{untrackedCases.length}</span>
 </div>
 <div className="space-y-2 bg-muted/10 rounded-xl p-2 min-h-[120px]">
 {untrackedCases.slice(0, 8).map(c => {
 return (
 <div key={c.id} className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-dashed border-primary/40 rounded-xl p-2.5 text-xs tracking-[0.04em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <p className="font-medium line-clamp-2 text-[#71717a] dark:text-gray-400 mb-1">{c.title}</p>
 <Button
 size="sm"
 variant="ghost"
 className="h-6 text-[10px] gap-2 px-1.5 w-full justify-start"
 onClick={() => {
 const firstStage = stages[0];
 if (firstStage) {
 updateStateMutation.mutate({ stateId: null, caseId: c.id, stage: firstStage, pipelineId: activePipeline.id});
}
}}
 >
 <Plus className="w-3 h-3" /> {t("add_to_board", "Add to board")}
 </Button>
 </div>
 );
})}
 </div>
 </div>
 )}
 </div>
 </DragDropContext>
 </div>
 </div>
 );
}
