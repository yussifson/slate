import { jsx, jsxs } from "react/jsx-runtime";
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
  Plus,
  GitBranch,
  Trash2,
  Save,
  Edit2,
  Bell,
  Clock,
  Sparkles,
  Loader2,
  GripVertical,
  Zap,
  BarChart3,
  Target,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  X,
  Tag,
  Building2
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { generateText } from "@/lib/cloudflareAI";
import UniversalPipelineKanban from "@/components/pipeline/UniversalPipelineKanban";
const STAGE_COLORS = [
  "#3B82F6",
  "#8B5CF6",
  "#F59E0B",
  "#10B981",
  "#EF4444",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#14B8A6"
];
const PIPELINE_CATEGORIES = [
  "sales",
  "recruitment",
  "projects",
  "support",
  "marketing",
  "procurement",
  "manufacturing",
  "real_estate",
  "legal",
  "healthcare",
  "logistics",
  "finance",
  "education",
  "custom"
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
function AIPipelineAssistant({ pipeline, items, onClose }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi! I'm your Pipeline AI for **${pipeline.name}**. I can help you:

\u2022 Analyze bottlenecks and stuck items
\u2022 Suggest stage improvements
\u2022 Forecast completion times
\u2022 Generate action plans

What would you like to know?`
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef(null);
  const stages = React.useMemo(() => {
    if (!pipeline?.stages) return [];
    try {
      const parsed = typeof pipeline.stages === "string" ? JSON.parse(pipeline.stages) : pipeline.stages;
      return Array.isArray(parsed) ? [...parsed].sort((a, b) => a.order - b.order) : [];
    } catch (e) {
      return [];
    }
  }, [pipeline]);
  const stageStats = stages.map((stage) => {
    const stageItems = items.filter((it) => it.current_stage_id === stage.id);
    return { name: stage.name, count: stageItems.length, color: stage.color };
  });
  const ask = async () => {
    if (!input.trim() || isThinking) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsThinking(true);
    try {
      const systemPrompt = `You are an expert business pipeline analyst for the pipeline named "${pipeline.name}" (category: ${pipeline.category || "general"}).
Pipeline stages: ${stages.map((s) => s.name).join(" \u2192 ")}
Stage statistics: ${stageStats.map((s) => `${s.name}: ${s.count} items`).join(", ")}
Total items in pipeline: ${items.length}
Be concise, practical, and actionable. Use bullet points where helpful.`;
      const response = await generateText([
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: userMsg }
      ]);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]);
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
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 border-b border-border", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4 text-primary" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: "Pipeline AI" }),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground", children: pipeline.name })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: onClose, children: /* @__PURE__ */ jsx(X, { className: "w-3.5 h-3.5" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "px-4 py-3 border-b border-border", children: [
      /* @__PURE__ */ jsx("p", { className: "text-[10px] font-semibold uppercase text-muted-foreground mb-2", children: "Pipeline Health" }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5", children: stageStats.map((s) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[10px] bg-muted/50 rounded-full px-2.5 py-1", children: [
        /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full", style: { backgroundColor: s.color } }),
        /* @__PURE__ */ jsx("span", { children: s.name }),
        /* @__PURE__ */ jsx("span", { className: "font-bold", children: s.count })
      ] }, s.name)) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-3 text-sm", children: [
      messages.map((msg, i) => /* @__PURE__ */ jsxs("div", { className: `flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`, children: [
        msg.role === "assistant" && /* @__PURE__ */ jsx("div", { className: "w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5", children: /* @__PURE__ */ jsx(Sparkles, { className: "w-3 h-3 text-primary" }) }),
        /* @__PURE__ */ jsx("div", { className: `max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"}`, children: msg.content })
      ] }, i)),
      isThinking && /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Sparkles, { className: "w-3 h-3 text-primary" }) }),
        /* @__PURE__ */ jsxs("div", { className: "bg-muted rounded-2xl rounded-tl-sm px-3 py-2 flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce", style: { animationDelay: "0ms" } }),
          /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce", style: { animationDelay: "150ms" } }),
          /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce", style: { animationDelay: "300ms" } })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { ref: bottomRef })
    ] }),
    messages.length <= 1 && /* @__PURE__ */ jsx("div", { className: "px-4 pb-2 flex flex-wrap gap-1.5", children: quickPrompts.map((p) => /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => {
          setInput(p);
        },
        className: "text-[10px] bg-primary/8 hover:bg-primary/15 text-primary border border-primary/20 rounded-full px-2.5 py-1 transition-colors",
        children: p
      },
      p
    )) }),
    /* @__PURE__ */ jsxs("div", { className: "p-3 border-t border-border flex gap-2", children: [
      /* @__PURE__ */ jsx(
        Input,
        {
          value: input,
          onChange: (e) => setInput(e.target.value),
          onKeyDown: (e) => e.key === "Enter" && !e.shiftKey && ask(),
          placeholder: "Ask about your pipeline...",
          className: "text-xs"
        }
      ),
      /* @__PURE__ */ jsx(Button, { size: "icon", onClick: ask, disabled: isThinking || !input.trim(), className: "shrink-0", children: isThinking ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4" }) })
    ] })
  ] });
}
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
      const responseText = typeof response === "string" ? response : response ? JSON.stringify(response) : "";
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
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4 border border-primary/20 rounded-xl p-4 bg-primary/5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4 text-primary" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: "AI Stage Generator" })
    ] }),
    !suggested ? /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Let AI generate smart pipeline stages based on your selected category and pipeline name." }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: generate, disabled: isGenerating, className: "gap-2", children: [
          isGenerating ? /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }) : /* @__PURE__ */ jsx(Zap, { className: "w-3.5 h-3.5" }),
          isGenerating ? "Generating..." : "Generate Stages"
        ] }),
        /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: onClose, children: "Cancel" })
      ] })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground font-medium", children: "Suggested stages \u2014 click Apply to use:" }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5", children: suggested.map((s, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs bg-card border border-border rounded-full px-2.5 py-1", children: [
        /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full", style: { backgroundColor: s.color } }),
        s.name
      ] }, s.id)) }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 pt-1", children: [
        /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: () => onApply(suggested), className: "gap-2", children: [
          /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3.5 h-3.5" }),
          " Apply These Stages"
        ] }),
        /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: generate, disabled: isGenerating, children: isGenerating ? /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }) : "Regenerate" }),
        /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: onClose, children: "Cancel" })
      ] })
    ] })
  ] });
}
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
    setForm((prev) => ({ ...prev, stages: [...prev.stages, newStage] }));
    setNewStageName("");
  };
  const removeStage = (id) => setForm((prev) => ({ ...prev, stages: prev.stages.filter((s) => s.id !== id) }));
  const updateStage = (id, field, value) => setForm((prev) => ({
    ...prev,
    stages: prev.stages.map((s) => s.id === id ? { ...s, [field]: value } : s)
  }));
  const applyAIStages = (stages) => {
    setForm((prev) => ({ ...prev, stages }));
    setShowAISuggester(false);
  };
  const sortedStages = React.useMemo(() => {
    if (!form.stages) return [];
    try {
      const parsed = typeof form.stages === "string" ? JSON.parse(form.stages) : form.stages;
      return Array.isArray(parsed) ? [...parsed].sort((a, b) => a.order - b.order) : [];
    } catch (e) {
      return [];
    }
  }, [form.stages]);
  return /* @__PURE__ */ jsx(Dialog, { open: true, onOpenChange: onClose, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(GitBranch, { className: "w-4 h-4 text-primary" }),
      pipeline ? "Edit Pipeline" : "Create Pipeline"
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2 space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { children: "Pipeline Name *" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: form.name,
              onChange: (e) => setForm((p) => ({ ...p, name: e.target.value })),
              placeholder: "e.g. Sales Pipeline, Recruitment Flow, Project Tracker"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { children: "Category" }),
          /* @__PURE__ */ jsxs(Select, { value: form.category || "sales", onValueChange: (v) => setForm((p) => ({ ...p, category: v })), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsx(SelectContent, { children: PIPELINE_CATEGORIES.map((c) => /* @__PURE__ */ jsx(SelectItem, { value: c, children: CATEGORY_LABELS[c] }, c)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { children: "Item Label" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: form.item_label || "Item",
              onChange: (e) => setForm((p) => ({ ...p, item_label: e.target.value })),
              placeholder: "e.g. Deal, Candidate, Ticket, Case"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2 space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { children: "Description" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              value: form.description || "",
              onChange: (e) => setForm((p) => ({ ...p, description: e.target.value })),
              placeholder: "What is this pipeline for?",
              rows: 2,
              className: "resize-none"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              id: "is_default",
              checked: form.is_default,
              onChange: (e) => setForm((p) => ({ ...p, is_default: e.target.checked })),
              className: "rounded"
            }
          ),
          /* @__PURE__ */ jsx("label", { htmlFor: "is_default", className: "text-sm cursor-pointer", children: "Set as default pipeline" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "border-t border-border pt-4 space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx(Label, { children: "Pipeline Stages" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
              form.stages.length,
              " stages"
            ] }),
            /* @__PURE__ */ jsxs(
              Button,
              {
                size: "sm",
                variant: "outline",
                className: "h-7 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/5",
                onClick: () => setShowAISuggester(!showAISuggester),
                children: [
                  /* @__PURE__ */ jsx(Sparkles, { className: "w-3 h-3" }),
                  " AI Suggest"
                ]
              }
            )
          ] })
        ] }),
        showAISuggester && /* @__PURE__ */ jsx(
          AIStageGenerator,
          {
            category: form.category,
            pipelineName: form.name,
            onApply: applyAIStages,
            onClose: () => setShowAISuggester(false)
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(
            Input,
            {
              value: newStageName,
              onChange: (e) => setNewStageName(e.target.value),
              placeholder: "Stage name (e.g. Contacted, Qualified, Closed)",
              onKeyDown: (e) => e.key === "Enter" && addStage(),
              className: "flex-1"
            }
          ),
          /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: addStage, className: "shrink-0 gap-1.5", children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-3.5 h-3.5" }),
            " Add"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2 max-h-64 overflow-y-auto pr-1", children: [
          sortedStages.map((stage) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "flex items-center gap-2 p-2.5 bg-muted/30 rounded-xl border border-border/60",
              children: [
                /* @__PURE__ */ jsx(GripVertical, { className: "w-3.5 h-3.5 text-muted-foreground shrink-0" }),
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: "w-4 h-4 rounded-full shrink-0 border-2 border-white dark:border-card cursor-pointer shadow-sm",
                    style: { backgroundColor: stage.color },
                    onClick: () => {
                      const nextColor = STAGE_COLORS[(STAGE_COLORS.indexOf(stage.color) + 1) % STAGE_COLORS.length];
                      updateStage(stage.id, "color", nextColor);
                    },
                    title: "Click to change color"
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "text-xs font-medium flex-1 truncate", children: stage.name }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [
                  /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3 text-muted-foreground" }),
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      type: "number",
                      placeholder: "days",
                      value: stage.deadline_days || "",
                      onChange: (e) => updateStage(stage.id, "deadline_days", e.target.value ? parseInt(e.target.value) : null),
                      className: "w-14 h-7 text-xs"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => updateStage(stage.id, "notify_team", !stage.notify_team),
                    className: `shrink-0 transition-colors ${stage.notify_team ? "text-primary" : "text-muted-foreground"}`,
                    title: "Toggle notifications",
                    children: /* @__PURE__ */ jsx(Bell, { className: "w-3.5 h-3.5" })
                  }
                ),
                /* @__PURE__ */ jsx("button", { onClick: () => removeStage(stage.id), className: "text-destructive hover:opacity-80 shrink-0", children: /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5" }) })
              ]
            },
            stage.id
          )),
          form.stages.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground text-center py-6 border-2 border-dashed border-border rounded-xl", children: "No stages yet. Add stages above or use AI Suggest." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 border-t border-border pt-3", children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: onClose, children: "Cancel" }),
        /* @__PURE__ */ jsxs(Button, { onClick: () => onSave(form), className: "gap-2", disabled: !form.name.trim(), children: [
          /* @__PURE__ */ jsx(Save, { className: "w-3.5 h-3.5" }),
          " Save Pipeline"
        ] })
      ] })
    ] })
  ] }) });
}
function PipelineCard({ pipeline, onEdit, onDelete, itemCount }) {
  const stages = React.useMemo(() => {
    if (!pipeline?.stages) return [];
    try {
      const parsed = typeof pipeline.stages === "string" ? JSON.parse(pipeline.stages) : pipeline.stages;
      return Array.isArray(parsed) ? [...parsed].sort((a, b) => a.order - b.order) : [];
    } catch (e) {
      return [];
    }
  }, [pipeline]);
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      className: "bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all duration-200",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-border flex items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold truncate", children: pipeline.name }),
              pipeline.category && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px] capitalize shrink-0", children: CATEGORY_LABELS[pipeline.category] || pipeline.category }),
              pipeline.is_default && /* @__PURE__ */ jsx(Badge, { className: "text-[10px] bg-primary/10 text-primary border-0 shrink-0", children: "Default" })
            ] }),
            pipeline.description && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1 line-clamp-1", children: pipeline.description }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
              stages.length,
              " stages \xB7 ",
              itemCount,
              " ",
              pipeline.item_label || "items"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-1 shrink-0", children: [
            /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => onEdit(pipeline), children: /* @__PURE__ */ jsx(Edit2, { className: "w-3.5 h-3.5" }) }),
            /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-destructive hover:text-destructive", onClick: () => onDelete(pipeline.id), children: /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5" }) })
          ] })
        ] }),
        stages.length > 0 && /* @__PURE__ */ jsx("div", { className: "px-4 py-3", children: /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide", children: stages.map((stage, idx) => /* @__PURE__ */ jsxs(React.Fragment, { children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "w-20 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-semibold shrink-0 shadow-sm",
              style: { backgroundColor: stage.color || "#3B82F6" },
              children: /* @__PURE__ */ jsx("span", { className: "truncate px-1", children: stage.name })
            }
          ),
          idx < stages.length - 1 && /* @__PURE__ */ jsx(ChevronRight, { className: "w-3 h-3 text-muted-foreground shrink-0" })
        ] }, stage.id)) }) })
      ]
    }
  );
}
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
    const payload = {
      ...form,
      stages: Array.isArray(form.stages) ? JSON.stringify(form.stages) : form.stages
    };
    if (editing) updateMutation.mutate({ id: editing.id, data: payload });
    else createMutation.mutate(payload);
  };
  const activePipeline = activePipelineId ? pipelines.find((p) => p.id === activePipelineId) : pipelines[0];
  const pipelineItems = pipelineStates.filter((s) => s.pipeline_id === activePipeline?.id);
  return /* @__PURE__ */ jsxs("div", { className: "flex h-[calc(100vh-100px)] overflow-hidden", children: [
    /* @__PURE__ */ jsx("div", { className: "flex-1 min-w-0 overflow-y-auto", children: /* @__PURE__ */ jsxs("div", { className: "p-3 md:p-6 space-y-4", children: [
      /* @__PURE__ */ jsx(
        PageHeader,
        {
          title: "Pipelines",
          subtitle: "Track your deals, projects, candidates and workflows across stages",
          actions: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            activePipeline && /* @__PURE__ */ jsxs(
              Button,
              {
                size: "sm",
                variant: "outline",
                className: "gap-2 border-primary/30 text-primary hover:bg-primary/5",
                onClick: () => setShowAI(!showAI),
                children: [
                  /* @__PURE__ */ jsx(Sparkles, { className: "w-3.5 h-3.5" }),
                  /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "AI Insights" })
                ]
              }
            ),
            isAdmin && /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: () => setShowNew(true), className: "gap-2", children: [
              /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
              " New Pipeline"
            ] })
          ] })
        }
      ),
      pipelines.length > 1 && /* @__PURE__ */ jsx("div", { className: "flex gap-2 overflow-x-auto pb-1 scrollbar-hide", children: pipelines.map((p) => /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setActivePipelineId(p.id),
          className: `shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${activePipeline?.id === p.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/60 text-muted-foreground hover:bg-muted"}`,
          children: p.name
        },
        p.id
      )) }),
      isLoading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-20", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-primary" }) }) : pipelines.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-16 bg-card rounded-2xl border border-border", children: [
        /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx(GitBranch, { className: "w-7 h-7 text-primary" }) }),
        /* @__PURE__ */ jsx("p", { className: "text-base font-semibold mb-1", children: "No pipelines yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-5 max-w-xs mx-auto", children: "Create your first pipeline to track your workflow \u2014 sales, recruitment, projects and more." }),
        isAdmin && /* @__PURE__ */ jsxs(Button, { onClick: () => setShowNew(true), className: "gap-2", children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
          " Create Pipeline"
        ] })
      ] }) : /* @__PURE__ */ jsx(
        UniversalPipelineKanban,
        {
          pipeline: activePipeline,
          pipelineStates,
          companyId: user?.company_id
        }
      ),
      isAdmin && pipelines.length > 0 && /* @__PURE__ */ jsxs("div", { className: "pt-2", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3", children: "Pipeline Templates" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-3", children: pipelines.map((p) => /* @__PURE__ */ jsx(
          PipelineCard,
          {
            pipeline: p,
            onEdit: setEditing,
            onDelete: (id) => deleteMutation.mutate(id),
            itemCount: pipelineStates.filter((s) => s.pipeline_id === p.id).length
          },
          p.id
        )) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(AnimatePresence, { children: showAI && activePipeline && /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { width: 0, opacity: 0 },
        animate: { width: 320, opacity: 1 },
        exit: { width: 0, opacity: 0 },
        transition: { duration: 0.25 },
        className: "border-l border-border bg-card shrink-0 overflow-hidden hidden md:flex flex-col",
        style: { width: 320 },
        children: /* @__PURE__ */ jsx(
          AIPipelineAssistant,
          {
            pipeline: activePipeline,
            items: pipelineItems,
            onClose: () => setShowAI(false)
          }
        )
      }
    ) }),
    (showNew || editing) && /* @__PURE__ */ jsx(
      PipelineEditor,
      {
        pipeline: editing,
        onClose: () => {
          setShowNew(false);
          setEditing(null);
        },
        onSave: handleSave
      }
    )
  ] });
}
