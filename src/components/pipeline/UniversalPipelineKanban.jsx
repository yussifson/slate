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
    notes: "",
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
      setForm(prev => ({ ...prev, notes: response.trim() }));
    } catch (e) {
      console.error("AI suggestion failed:", e);
    } finally {
      setIsAISuggesting(false);
    }
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    onAdd({
      ...form,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : []
    });
    setForm({ title: "", assignee: "", priority: "medium", due_date: "", notes: "", tags: "" });
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
              <Label>Notes</Label>
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
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
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
      className={`bg-card border rounded-xl p-3 text-xs space-y-2 group cursor-pointer transition-all ${
        snapshot.isDragging
          ? "border-primary/50 shadow-lg rotate-1 scale-105"
          : "border-border hover:border-primary/30 hover:shadow-md"
      }`}
    >
      <div className="flex items-start gap-2">
        <span {...provided.dragHandleProps} className="mt-0.5 cursor-grab active:cursor-grabbing shrink-0">
          <GripVertical className="w-3 h-3 text-muted-foreground" />
        </span>
        <p className="font-medium leading-tight line-clamp-2 flex-1">{item.title}</p>
        {item.priority && (
          <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase ${PRIORITY_COLORS[item.priority] || ""}`}>
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
          <div className="flex flex-wrap gap-1 mt-1">
            {item.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[9px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
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
    return [...pipeline.stages].sort((a, b) => a.order - b.order);
  }, [pipeline]);

  const stageItems = React.useMemo(() => {
    const items = pipelineStates.filter(s => s.pipeline_id === pipeline?.id);
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
      return base44.entities.CasePipelineState.create({
        company_id: companyId,
        pipeline_id: pipeline.id,
        current_stage_id: stage.id,
        current_stage_name: stage.name,
        stage_entered_at: new Date().toISOString(),
        ...itemData,
        stage_history: []
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-states"] });
    }
  });

  const createItemMutation = useMutation({
    mutationFn: (itemData) => base44.entities.CasePipelineState.create({
      company_id: companyId,
      pipeline_id: pipeline.id,
      current_stage_id: addingToStage,
      current_stage_name: stages.find(s => s.id === addingToStage)?.name || "",
      stage_entered_at: new Date().toISOString(),
      stage_history: [],
      ...itemData
    }),
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

  if (!pipeline || stages.length === 0) return null;

  const totalItems = pipelineStates.filter(s => s.pipeline_id === pipeline.id).length;

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header bar */}
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">{pipeline.name}</span>
          <span className="text-xs text-muted-foreground">· drag {pipeline.item_label || "items"} between stages</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-1">
            {totalItems} {pipeline.item_label || "items"}
          </span>
        </div>
      </div>

      {/* Kanban */}
      <div className="p-4 overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <div
            className="flex gap-3"
            style={{ minWidth: `${stages.length * 220}px` }}
          >
            {stages.map(stage => {
              const cards = stageItems[stage.id] || [];
              return (
                <div key={stage.id} className="w-52 shrink-0 flex flex-col gap-2">
                  {/* Stage header */}
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                    <span className="text-xs font-semibold flex-1 truncate">{stage.name}</span>
                    <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full shrink-0">
                      {cards.length}
                    </span>
                    <button
                      onClick={() => setAddingToStage(stage.id)}
                      className="text-muted-foreground hover:text-primary transition-colors"
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
                        className={`flex-1 space-y-2 min-h-[140px] rounded-xl p-2 transition-all ${
                          snapshot.isDraggingOver
                            ? "bg-primary/5 border border-primary/20 border-dashed"
                            : "bg-muted/20"
                        }`}
                      >
                        {cards.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <PipelineItemCard
                                item={item}
                                provided={provided}
                                snapshot={snapshot}
                                itemLabel={pipeline.item_label || "Item"}
                              />
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {cards.length === 0 && !snapshot.isDraggingOver && (
                          <div
                            className="h-14 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
                            onClick={() => setAddingToStage(stage.id)}
                          >
                            <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">Add {pipeline.item_label || "item"}</span>
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
