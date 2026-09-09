import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
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
  Plus, GitBranch, Trash2, Save, Edit2, Bell, Clock, Sparkles, Loader2,
  GripVertical, Zap, BarChart3, Target, TrendingUp, ChevronRight,
  CheckCircle2, AlertTriangle, Lightbulb, X, Tag, Building2
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { generateText } from "@/lib/cloudflareAI";
import UniversalPipelineKanban from "@/components/pipeline/UniversalPipelineKanban";

const STAGE_COLORS = [
  "#3B82F6", "#8B5CF6", "#F59E0B", "#10B981",
  "#EF4444", "#EC4899", "#06B6D4", "#84CC16",
  "#F97316", "#14B8A6"
];

// Universal industry-agnostic pipeline categories
const PIPELINE_CATEGORIES = [
  "sales", "recruitment", "projects", "support", "marketing",
  "procurement", "manufacturing", "real_estate", "legal", "healthcare",
  "logistics", "finance", "education", "custom"
];

const CATEGORY_LABELS = {
  sales: "Sales",
  recruitment: "Recruitment",
  projects: "Project Management",
  support: "Customer Support",
  marketing: "Marketing Campaigns",
  procurement: "Procurement",
  manufacturing: "Manufacturing",
  real_estate: "Real Estate",
  legal: "Legal / Cases",
  healthcare: "Healthcare",
  logistics: "Logistics",
  finance: "Finance",
  education: "Education",
  custom: "Custom"
};

// AI Sidebar panel
function AIPipelineAssistant({ pipeline, items, onClose }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi! I'm your Pipeline AI for **${pipeline.name}**. I can help you:\n\n• Analyze bottlenecks and stuck items\n• Suggest stage improvements\n• Forecast completion times\n• Generate action plans\n\nWhat would you like to know?`
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef(null);

  const stages = React.useMemo(() => {
    if (!pipeline?.stages) return [];
    try {
      const parsed = typeof pipeline.stages === 'string' ? JSON.parse(pipeline.stages) : pipeline.stages;
      return Array.isArray(parsed) ? [...parsed].sort((a, b) => a.order - b.order) : [];
    } catch (e) {
      return [];
    }
  }, [pipeline]);

  const stageStats = stages.map(stage => {
    const stageItems = items.filter(it => it.current_stage_id === stage.id);
    return { name: stage.name, count: stageItems.length, color: stage.color };
  });

  const ask = async () => {
    if (!input.trim() || isThinking) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsThinking(true);

    try {
      const systemPrompt = `You are an expert business pipeline analyst for the pipeline named "${pipeline.name}" (category: ${pipeline.category || "general"}).
Pipeline stages: ${stages.map(s => s.name).join(" → ")}
Stage statistics: ${stageStats.map(s => `${s.name}: ${s.count} items`).join(", ")}
Total items in pipeline: ${items.length}
Be concise, practical, and actionable. Use bullet points where helpful.`;

      const response = await generateText([
        { role: "system", content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: userMsg }
      ]);

      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setIsThinking(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const quickPrompts = [
    "Where are items getting stuck?",
    "Which stage has the most bottlenecks?",
    "Suggest ways to speed up conversion",
    "Analyze this pipeline's health"
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Pipeline AI</p>
            <p className="text-[10px] text-muted-foreground">{pipeline.name}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Stage stats */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">Pipeline Health</p>
        <div className="flex flex-wrap gap-1.5">
          {stageStats.map(s => (
            <div key={s.name} className="flex items-center gap-1.5 text-[10px] bg-muted/50 rounded-full px-2.5 py-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span>{s.name}</span>
              <span className="font-bold">{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-muted text-foreground rounded-tl-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-3 h-3 text-primary" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {quickPrompts.map(p => (
            <button
              key={p}
              onClick={() => { setInput(p); }}
              className="text-[10px] bg-primary/8 hover:bg-primary/15 text-primary border border-primary/20 rounded-full px-2.5 py-1 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && ask()}
          placeholder="Ask about your pipeline..."
          className="text-xs"
        />
        <Button size="icon" onClick={ask} disabled={isThinking || !input.trim()} className="shrink-0">
          {isThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

// AI Stage Suggester
function AIStageGenerator({ category, pipelineName, onApply, onClose }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggested, setSuggested] = useState(null);

  const generate = async () => {
    setIsGenerating(true);
    try {
      const response = await generateText([
        {
          role: "system",
          content: `You are a business process expert. Generate pipeline stages as a JSON array. Return ONLY valid JSON, no markdown.`
        },
        {
          role: "user",
          content: `Generate 5-7 pipeline stages for a "${pipelineName || category}" pipeline in the "${CATEGORY_LABELS[category] || category}" category.
Return JSON array like: [{"name":"Stage Name","deadline_days":7,"notify_team":true}]
Make stages practical and industry-appropriate.`
        }
      ]);

      // Ensure response is a string
      const responseText = typeof response === 'string' ? response : (response ? JSON.stringify(response) : "");

      // Parse JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const stages = JSON.parse(jsonMatch[0]);
        setSuggested(stages.map((s, i) => ({
          id: Math.random().toString(36).slice(2, 9),
          name: s.name,
          order: i,
          color: STAGE_COLORS[i % STAGE_COLORS.length],
          deadline_days: s.deadline_days || null,
          notify_team: s.notify_team !== false
        })));
      }
    } catch (e) {
      console.error("AI stage generation failed:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4 border border-primary/20 rounded-xl p-4 bg-primary/5">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold">AI Stage Generator</p>
      </div>

      {!suggested ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Let AI generate smart pipeline stages based on your selected category and pipeline name.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={generate} disabled={isGenerating} className="gap-2">
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              {isGenerating ? "Generating..." : "Generate Stages"}
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Suggested stages — click Apply to use:</p>
          <div className="flex flex-wrap gap-1.5">
            {suggested.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1.5 text-xs bg-card border border-border rounded-full px-2.5 py-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={() => onApply(suggested)} className="gap-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> Apply These Stages
            </Button>
            <Button size="sm" variant="outline" onClick={generate} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Regenerate"}
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Pipeline Editor Dialog
function PipelineEditor({ pipeline, onClose, onSave }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(pipeline || {
    name: "",
    category: "sales",
    description: "",
    stages: [],
    is_default: false,
    item_label: "Item"
  });
  const [newStageName, setNewStageName] = useState("");
  const [showAISuggester, setShowAISuggester] = useState(false);

  const addStage = () => {
    if (!newStageName.trim()) return;
    const newStage = {
      id: Math.random().toString(36).slice(2, 9),
      name: newStageName.trim(),
      order: form.stages.length,
      color: STAGE_COLORS[form.stages.length % STAGE_COLORS.length],
      deadline_days: null,
      notify_team: true
    };
    setForm(prev => ({ ...prev, stages: [...prev.stages, newStage] }));
    setNewStageName("");
  };

  const removeStage = (id) => setForm(prev => ({ ...prev, stages: prev.stages.filter(s => s.id !== id) }));
  const updateStage = (id, field, value) => setForm(prev => ({
    ...prev,
    stages: prev.stages.map(s => s.id === id ? { ...s, [field]: value } : s)
  }));

  const applyAIStages = (stages) => {
    setForm(prev => ({ ...prev, stages }));
    setShowAISuggester(false);
  };

  const sortedStages = React.useMemo(() => {
    if (!form.stages) return [];
    try {
      const parsed = typeof form.stages === 'string' ? JSON.parse(form.stages) : form.stages;
      return Array.isArray(parsed) ? [...parsed].sort((a, b) => a.order - b.order) : [];
    } catch (e) {
      return [];
    }
  }, [form.stages]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            {pipeline ? "Edit Pipeline" : "Create Pipeline"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Pipeline Name *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Sales Pipeline, Recruitment Flow, Project Tracker"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category || "sales"} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PIPELINE_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Item Label</Label>
              <Input
                value={form.item_label || "Item"}
                onChange={e => setForm(p => ({ ...p, item_label: e.target.value }))}
                placeholder="e.g. Deal, Candidate, Ticket, Case"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description || ""}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="What is this pipeline for?"
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                checked={form.is_default}
                onChange={e => setForm(p => ({ ...p, is_default: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="is_default" className="text-sm cursor-pointer">Set as default pipeline</label>
            </div>
          </div>

          {/* Stages */}
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label>Pipeline Stages</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{form.stages.length} stages</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
                  onClick={() => setShowAISuggester(!showAISuggester)}
                >
                  <Sparkles className="w-3 h-3" /> AI Suggest
                </Button>
              </div>
            </div>

            {showAISuggester && (
              <AIStageGenerator
                category={form.category}
                pipelineName={form.name}
                onApply={applyAIStages}
                onClose={() => setShowAISuggester(false)}
              />
            )}

            {/* Add stage input */}
            <div className="flex gap-2">
              <Input
                value={newStageName}
                onChange={e => setNewStageName(e.target.value)}
                placeholder="Stage name (e.g. Contacted, Qualified, Closed)"
                onKeyDown={e => e.key === "Enter" && addStage()}
                className="flex-1"
              />
              <Button size="sm" onClick={addStage} className="shrink-0 gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
            </div>

            {/* Stage list */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {sortedStages.map((stage) => (
                <div
                  key={stage.id}
                  className="flex items-center gap-2 p-2.5 bg-muted/30 rounded-xl border border-border/60"
                >
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <div
                    className="w-4 h-4 rounded-full shrink-0 border-2 border-white dark:border-card cursor-pointer shadow-sm"
                    style={{ backgroundColor: stage.color }}
                    onClick={() => {
                      const nextColor = STAGE_COLORS[(STAGE_COLORS.indexOf(stage.color) + 1) % STAGE_COLORS.length];
                      updateStage(stage.id, "color", nextColor);
                    }}
                    title="Click to change color"
                  />
                  <span className="text-xs font-medium flex-1 truncate">{stage.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="days"
                      value={stage.deadline_days || ""}
                      onChange={e => updateStage(stage.id, "deadline_days", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-14 h-7 text-xs"
                    />
                  </div>
                  <button
                    onClick={() => updateStage(stage.id, "notify_team", !stage.notify_team)}
                    className={`shrink-0 transition-colors ${stage.notify_team ? "text-primary" : "text-muted-foreground"}`}
                    title="Toggle notifications"
                  >
                    <Bell className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => removeStage(stage.id)} className="text-destructive hover:opacity-80 shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {form.stages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6 border-2 border-dashed border-border rounded-xl">
                  No stages yet. Add stages above or use AI Suggest.
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => onSave(form)} className="gap-2" disabled={!form.name.trim()}>
              <Save className="w-3.5 h-3.5" /> Save Pipeline
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Pipeline card for admin list
function PipelineCard({ pipeline, onEdit, onDelete, itemCount }) {
  const stages = React.useMemo(() => {
    if (!pipeline?.stages) return [];
    try {
      const parsed = typeof pipeline.stages === 'string' ? JSON.parse(pipeline.stages) : pipeline.stages;
      return Array.isArray(parsed) ? [...parsed].sort((a, b) => a.order - b.order) : [];
    } catch (e) {
      return [];
    }
  }, [pipeline]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col rounded-2xl border border-border/60 hover:border-emerald-500/50 bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
    >
      {/* Header Banner */}
      <div className="relative h-24 flex items-center justify-between p-4 overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-600">
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold shadow-inner">
            <GitBranch className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base tracking-tight">{pipeline.name}</h3>
              {pipeline.is_default && (
                <Badge className="text-[9px] uppercase font-bold bg-white/20 text-white border-0 backdrop-blur-sm">
                  Default Flow
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-white/80 font-medium mt-0.5">
              {stages.length} Stages · {itemCount} {pipeline.item_label || "Items"} Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 relative z-10" onClick={e => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20 rounded-lg" onClick={() => onEdit(pipeline)} title="Edit Pipeline">
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-200 hover:text-white hover:bg-rose-500/30 rounded-lg" onClick={() => onDelete(pipeline.id)} title="Delete Pipeline">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Body description & stages strip */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        {pipeline.description ? (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{pipeline.description}</p>
        ) : (
          <p className="text-xs text-muted-foreground italic">Standard workflow pipeline for tracking company deals and processes.</p>
        )}

        {stages.length > 0 && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Stage Pipeline Sequence</p>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {stages.map((stage, idx) => (
                <React.Fragment key={stage.id}>
                  <div
                    className="px-2.5 py-1 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm"
                    style={{ backgroundColor: stage.color || "#10B981" }}
                  >
                    <span className="truncate max-w-[90px]">{stage.name}</span>
                  </div>
                  {idx < stages.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Main Page
export default function PipelinePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [activePipelineId, setActivePipelineId] = useState(null);
  const [showAI, setShowAI] = useState(false);

  const isAdmin = ["super_admin", "company_admin", "managing_partner"].includes(user?.role);

  const { data: pipelines = [], isLoading } = useQuery({
    queryKey: ["pipelines", user?.company_id],
    queryFn: () => base44.entities.CasePipeline.filter({ company_id: user?.company_id }),
    enabled: !!user?.company_id
  });

  const { data: pipelineStates = [] } = useQuery({
    queryKey: ["pipeline-states", user?.company_id],
    queryFn: () => base44.entities.CasePipelineState.filter({ company_id: user?.company_id }),
    enabled: !!user?.company_id
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CasePipeline.create({ ...data, company_id: user?.company_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      setShowNew(false);
      toast({ title: "Pipeline created!" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CasePipeline.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      setEditing(null);
      toast({ title: "Pipeline updated!" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CasePipeline.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      toast({ title: "Pipeline deleted" });
    }
  });

  const handleSave = (form) => {
    // Stringify stages array before saving to database
    const payload = {
      ...form,
      stages: Array.isArray(form.stages) ? JSON.stringify(form.stages) : form.stages
    };
    if (editing) updateMutation.mutate({ id: editing.id, data: payload });
    else createMutation.mutate(payload);
  };

  const activePipeline = activePipelineId
    ? pipelines.find(p => p.id === activePipelineId)
    : pipelines[0];

  const pipelineItems = pipelineStates.filter(s => s.pipeline_id === activePipeline?.id);

  return (
    <div className="flex h-[calc(100vh-100px)] overflow-hidden">
      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-3 md:p-6 space-y-4">
          <PageHeader
            title="Pipelines"
            subtitle="Track your deals, projects, candidates and workflows across stages"
            actions={
              <div className="flex items-center gap-2">
                {activePipeline && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 border-primary/30 text-primary hover:bg-primary/5"
                    onClick={() => setShowAI(!showAI)}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">AI Insights</span>
                  </Button>
                )}
                {isAdmin && (
                  <Button size="sm" onClick={() => setShowNew(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> New Pipeline
                  </Button>
                )}
              </div>
            }
          />

          {/* Pipeline tabs */}
          {pipelines.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {pipelines.map(p => (
                <button
                  key={p.id}
                  onClick={() => setActivePipelineId(p.id)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activePipeline?.id === p.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {/* Kanban Board */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : pipelines.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <GitBranch className="w-7 h-7 text-primary" />
              </div>
              <p className="text-base font-semibold mb-1">No pipelines yet</p>
              <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
                Create your first pipeline to track your workflow — sales, recruitment, projects and more.
              </p>
              {isAdmin && (
                <Button onClick={() => setShowNew(true)} className="gap-2">
                  <Plus className="w-4 h-4" /> Create Pipeline
                </Button>
              )}
            </div>
          ) : (
            <UniversalPipelineKanban
              pipeline={activePipeline}
              pipelineStates={pipelineStates}
              companyId={user?.company_id}
            />
          )}

          {/* Admin pipeline list */}
          {isAdmin && pipelines.length > 0 && (
            <div className="pt-2">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Pipeline Templates
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {pipelines.map(p => (
                  <PipelineCard
                    key={p.id}
                    pipeline={p}
                    onEdit={setEditing}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    itemCount={pipelineStates.filter(s => s.pipeline_id === p.id).length}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Sidebar */}
      <AnimatePresence>
        {showAI && activePipeline && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-l border-border bg-card shrink-0 overflow-hidden hidden md:flex flex-col"
            style={{ width: 320 }}
          >
            <AIPipelineAssistant
              pipeline={activePipeline}
              items={pipelineItems}
              onClose={() => setShowAI(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
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
