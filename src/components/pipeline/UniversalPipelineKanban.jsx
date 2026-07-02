import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, GripVertical, CheckCircle, Loader2, Sparkles,
  User, Tag, Calendar, TrendingUp, AlertTriangle, X, ChevronRight,
  MoreHorizontal, Zap
} from "lucide-react";
import { generateText } from "@/lib/cloudflareAI";

const PRIORITY_COLORS = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

// Add Item Dialog — universal, not law-specific
function AddItemDialog({ open, onClose, onAdd, pipeline, targetStageId }) {
  const [form, setForm] = useState({
    title: "",
    assignee: "",
    priority: "medium",
    due_date: "",
    description: "",
    tags: ""
  });
  const [isAISuggesting, setIsAISuggesting] = useState(false);
  const itemLabel = pipeline?.item_label || "Item";

  const handleAISuggest = async () => {
    if (!form.title.trim()) return;
    setIsAISuggesting(true);
    try {
      const response = await generateText([
        {
          role: "system",
          content: `You are a helpful assistant that generates brief, actionable notes for pipeline items. Be concise (2-3 sentences max).`
        },
        {
          role: "user",
          content: `Generate brief notes for a pipeline item titled: "${form.title}" in a "${pipeline?.name || "general"}" pipeline.`
        }
      ]);
      setForm(prev => ({ ...prev, description: response.trim() }));
    } catch (e) {
      console.error("AI suggestion failed:", e);
    } finally {
      setIsAISuggesting(false);
    }
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    const stageId = addingToStage; // capture before close
    onAdd({
      ...form,
      targetStageId: stageId,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : []
    });
    setForm({ title: "", assignee: "", priority: "medium", due_date: "", description: "", tags: "" });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            Add {itemLabel}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{itemLabel} Title *</Label>
            <Input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder={`Enter ${itemLabel.toLowerCase()} title...`}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Assignee</Label>
              <Input
                value={form.assignee}
                onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))}
                placeholder="Name or email"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">🔴 High</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="low">🟢 Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tags</Label>
              <Input
                value={form.tags}
                onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                placeholder="tag1, tag2"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Description (Notes)</Label>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[10px] gap-1 text-primary"
                onClick={handleAISuggest}
                disabled={isAISuggesting || !form.title.trim()}
              >
                {isAISuggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                AI Draft
              </Button>
            </div>
            <Textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Additional notes..."
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.title.trim()}>
              Add {itemLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Item card component
function PipelineItemCard({ item, provided, snapshot, itemLabel }) {
  const isOverdue = item.due_date && new Date(item.due_date) < new Date();

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      className={`relative bg-card/80 backdrop-blur-md border border-white/10 dark:border-white/5 rounded-2xl p-4 text-xs space-y-3 group cursor-pointer transition-all duration-200 ${
        snapshot.isDragging
          ? "border-primary/50 shadow-2xl shadow-primary/10 rotate-2 scale-105 z-50 bg-card"
          : "hover:border-primary/30 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-white/5 shadow-sm hover:-translate-y-0.5"
      }`}
    >
      <div className="flex items-start gap-2">
        <span {...provided.dragHandleProps} className="mt-0.5 cursor-grab active:cursor-grabbing shrink-0 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 left-2 -translate-x-full">
          <GripVertical className="w-4 h-4 text-muted-foreground/50 hover:text-muted-foreground" />
        </span>
        <p className="font-semibold text-[13px] leading-snug line-clamp-2 flex-1 text-foreground/90">{item.title}</p>
        {item.priority && (
          <span className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${PRIORITY_COLORS[item.priority] || ""}`}>
            {item.priority}
          </span>
        )}
      </div>

      <div className="pl-5 space-y-1.5">
        {item.assignee && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <User className="w-2.5 h-2.5" />
            <span className="truncate">{item.assignee}</span>
          </div>
        )}
        {item.due_date && (
          <div className={`flex items-center gap-1 ${isOverdue ? "text-red-500" : "text-muted-foreground"}`}>
            <Calendar className="w-2.5 h-2.5" />
            <span>{isOverdue ? "⚠ " : ""}{item.due_date}</span>
          </div>
        )}
        {Array.isArray(item.tags) && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {item.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[9px] font-medium bg-secondary/50 text-secondary-foreground border border-black/5 dark:border-white/5 rounded-full px-2 py-0.5">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Main Kanban board component
export default function UniversalPipelineKanban({ pipeline, pipelineStates, companyId }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addingToStage, setAddingToStage] = useState(null);
  const { user } = useAuth();

  const stages = React.useMemo(() => {
    if (!pipeline?.stages) return [];
    try {
      const parsed = typeof pipeline.stages === 'string' ? JSON.parse(pipeline.stages) : pipeline.stages;
      return Array.isArray(parsed) ? [...parsed].sort((a, b) => a.order - b.order) : [];
    } catch (e) {
      return [];
    }
  }, [pipeline]);

  const stageItems = React.useMemo(() => {
    const items = pipelineStates.filter(s => s.pipeline_id === pipeline?.id).map(s => {
      let extraData = {};
      try {
        extraData = typeof s.stage_history === 'string' ? JSON.parse(s.stage_history) : s.stage_history;
      } catch (e) { }
      return {
        ...s,
        ...extraData,
        title: s.case_title || extraData?.title || "Untitled"
      };
    });

    const map = {};
    stages.forEach(s => {
      map[s.id] = items.filter(it => it.current_stage_id === s.id);
    });
    // Untracked: items with no stage match
    const trackedIds = new Set(items.filter(it => stages.some(s => s.id === it.current_stage_id)).map(it => it.id));
    map["__untracked__"] = items.filter(it => !trackedIds.has(it.id));
    return map;
  }, [pipelineStates, pipeline, stages]);

  const moveMutation = useMutation({
    mutationFn: ({ stateId, itemData, stage }) => {
      if (stateId) {
        return base44.entities.CasePipelineState.update(stateId, {
          current_stage_id: stage.id,
          current_stage_name: stage.name,
          stage_entered_at: new Date().toISOString()
        });
      }
      
      const { id, current_stage_id, current_stage_name, stage_entered_at, pipeline_id, company_id, case_title, ...extraData } = itemData;
      return base44.entities.CasePipelineState.create({
        company_id: companyId,
        pipeline_id: pipeline.id,
        current_stage_id: stage.id,
        current_stage_name: stage.name,
        stage_entered_at: new Date().toISOString(),
        case_title: itemData.title,
        stage_history: JSON.stringify(extraData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-states"] });
    }
  });

  const createItemMutation = useMutation({
    mutationFn: (itemData) => {
      const { targetStageId, ...extraData } = itemData;
      return base44.entities.CasePipelineState.create({
        company_id: companyId,
        pipeline_id: pipeline.id,
        current_stage_id: targetStageId,
        current_stage_name: stages.find(s => s.id === targetStageId)?.name || "",
        stage_entered_at: new Date().toISOString(),
        case_title: itemData.title,
        stage_history: JSON.stringify(extraData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-states"] });
      toast({ title: `${pipeline?.item_label || "Item"} added!` });
    }
  });

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || source.droppableId === destination.droppableId) return;
    const destStage = stages.find(s => s.id === destination.droppableId);
    if (!destStage) return;
    const existingState = pipelineStates.find(it => it.id === draggableId);
    moveMutation.mutate({
      stateId: existingState?.id || null,
      itemData: existingState || {},
      stage: destStage
    });
  };

  const [isDndReady, setIsDndReady] = useState(false);

  React.useEffect(() => {
    const animation = requestAnimationFrame(() => setIsDndReady(true));
    return () => {
      cancelAnimationFrame(animation);
      setIsDndReady(false);
    };
  }, []);

  if (!pipeline || stages.length === 0 || !isDndReady) return null;

  const totalItems = pipelineStates.filter(s => s.pipeline_id === pipeline.id).length;

  return (
    <div className="bg-card/50 backdrop-blur-3xl rounded-[2rem] border border-white/20 dark:border-white/10 shadow-xl overflow-hidden flex flex-col h-full relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-blue-500/5 rounded-full blur-3xl pointer-events-none -translate-x-1/2 translate-y-1/3" />

      {/* Header bar */}
      <div className="px-6 py-4 border-b border-white/10 dark:border-white/5 bg-background/40 backdrop-blur-xl flex items-center justify-between gap-4 flex-wrap relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-foreground/90 block">{pipeline.name}</span>
            <span className="text-[11px] text-muted-foreground font-medium">Drag {pipeline.item_label || "items"} between stages to update status</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1 shadow-sm">
            {totalItems} {pipeline.item_label || "items"}
          </span>
        </div>
      </div>

      {/* Kanban Container */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 relative z-10 scrollbar-thin scrollbar-thumb-primary/10 hover:scrollbar-thumb-primary/20">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex flex-nowrap gap-6 h-full items-start">
            {stages.map(stage => {
              const cards = stageItems[stage.id] || [];
              return (
                <div key={stage.id} className="w-[320px] shrink-0 flex flex-col gap-4 bg-background/40 backdrop-blur-2xl p-4 rounded-3xl border border-white/20 dark:border-white/5 shadow-2xl shadow-black/5 max-h-full">
                  {/* Stage header */}
                  <div className="flex items-center gap-3 px-2">
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <div className="absolute inset-0 rounded-full opacity-20" style={{ backgroundColor: stage.color }} />
                      <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: stage.color }} />
                    </div>
                    <span className="text-sm font-bold tracking-tight flex-1 truncate text-foreground/80">{stage.name}</span>
                    <span className="text-[11px] font-bold bg-secondary text-secondary-foreground px-2.5 py-0.5 rounded-full shadow-inner">
                      {cards.length}
                    </span>
                    <button
                      onClick={() => setAddingToStage(stage.id)}
                      className="text-muted-foreground hover:text-primary transition-all bg-card/50 hover:bg-card border border-white/10 dark:border-white/5 p-1.5 rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5 ml-1"
                      title={`Add ${pipeline.item_label || "item"} to ${stage.name}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Droppable column */}
                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto overflow-x-hidden space-y-3 min-h-[200px] rounded-2xl p-1.5 transition-all duration-300 scrollbar-thin scrollbar-thumb-black/5 dark:scrollbar-thumb-white/5 ${
                          snapshot.isDraggingOver
                            ? "bg-primary/5 ring-1 ring-primary/20 ring-inset"
                            : ""
                        }`}
                      >
                        {cards.map((item, index) => {
                          const safeId = item.id || `temp-${index}`;
                          return (
                          <Draggable key={safeId} draggableId={safeId} index={index}>
                            {(provided, snapshot) => (
                              <PipelineItemCard
                                item={item}
                                provided={provided}
                                snapshot={snapshot}
                                itemLabel={pipeline.item_label || "Item"}
                              />
                            )}
                          </Draggable>
                        )})}
                        {provided.placeholder}
                        {cards.length === 0 && !snapshot.isDraggingOver && (
                          <div
                            className="h-24 mx-1 rounded-2xl border border-dashed border-black/10 dark:border-white/10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm transition-all group"
                            onClick={() => setAddingToStage(stage.id)}
                          >
                            <div className="w-8 h-8 rounded-full bg-card border border-white/10 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-primary transition-colors">Add {pipeline.item_label || "item"}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Add Item Dialog */}
      <AddItemDialog
        open={!!addingToStage}
        onClose={() => setAddingToStage(null)}
        onAdd={(data) => createItemMutation.mutate(data)}
        pipeline={pipeline}
        targetStageId={addingToStage}
      />
    </div>
  );
}
