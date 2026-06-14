import React, { useState, useEffect, useCallback} from "react";
import { AnimatePresence, motion} from "framer-motion";
import {
 X,
 FileText,
 Clock,
 StickyNote,
 Paperclip,
 Activity,
 ChevronLeft,
 Save,
 Circle,
 CheckCircle2,
 AlertCircle,
} from "lucide-react";
import { Badge} from "@/components/ui/badge";
import { Button} from "@/components/ui/button";
import { cn} from "@/lib/utils";

// ─── helpers ────────────────────────────────────────────────────────────────

/** Pretty-print a raw value for display */
function formatValue(val) {
 if (val === null || val === undefined) return "—";
 if (typeof val === "boolean") return val ? "Yes" : "No";
 if (typeof val === "object") {
 try {
 return JSON.stringify(val, null, 2);
} catch {
 return String(val);
}
}
 // ISO date strings → human readable
 if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
 try {
 return new Date(val).toLocaleString();
} catch {
 return val;
}
}
 return String(val);
}

/** Prettify a snake_case / camelCase key */
function formatKey(key) {
 return key
 .replace(/_/g, " ")
 .replace(/([A-Z])/g, " $1")
 .replace(/\b\w/g, (c) => c.toUpperCase())
 .trim();
}

/** Derive a status badge color from a string value */
function statusColor(val) {
 const v = String(val).toLowerCase();
 if (["active", "open", "approved", "done", "complete", "completed", "paid"].some((s) => v.includes(s)))
 return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
 if (["pending", "review", "in progress", "processing"].some((s) => v.includes(s)))
 return "bg-amber-500/15 text-amber-400 border-amber-500/30";
 if (["closed", "rejected", "cancelled", "canceled", "inactive", "failed"].some((s) => v.includes(s)))
 return "bg-rose-500/15 text-rose-400 border-rose-500/30";
 return "bg-blue-500/15 text-blue-400 border-blue-500/30";
}

/** Keys typically used as status indicators */
const STATUS_KEYS = ["status", "state", "stage", "phase", "priority"];

// ─── Tab definitions ─────────────────────────────────────────────────────────

const TABS = [
 { id: "overview", label: "Overview", icon: FileText},
 { id: "activity", label: "Activity", icon: Activity},
 { id: "notes", label: "Notes", icon: StickyNote},
 { id: "documents", label: "Documents", icon: Paperclip},
 { id: "timeline", label: "Timeline", icon: Clock},
];

// ─── Sub-panels ───────────────────────────────────────────────────────────────

function OverviewPanel({ record, onSave}) {
 const [editing, setEditing] = useState({});
 const [values, setValues] = useState({});
 const [dirty, setDirty] = useState(false);

 const entries = Object.entries(record || {});

 const handleClick = (key) => {
 setEditing((prev) => ({ ...prev, [key]: true}));
 setValues((prev) => ({ ...prev, [key]: record[key] ?? ""}));
};

 const handleChange = (key, val) => {
 setValues((prev) => ({ ...prev, [key]: val}));
 setDirty(true);
};

 const handleBlur = (key) => {
 setEditing((prev) => ({ ...prev, [key]: false}));
};

 const handleSave = () => {
 onSave?.(values);
 setDirty(false);
};

 return (
 <div className="flex flex-col h-full">
 <div className="flex-1 overflow-y-auto p-6">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
 {entries.map(([key, val]) => (
 <div key={key} className="group">
 <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
 {formatKey(key)}
 </p>
 {editing[key] ? (
 <input
 autoFocus
 className="w-full text-sm bg-muted/60 border border-primary/40 rounded-md px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
 value={String(values[key] ?? "")}
 onChange={(e) => handleChange(key, e.target.value)}
 onBlur={() => handleBlur(key)}
 />
 ) : (
 <p
 className="text-sm text-foreground cursor-pointer rounded-md px-2 py-1 -mx-2 hover:bg-muted/50 transition-colors whitespace-pre-wrap break-words min-h-[28px]"
 title="Click to edit"
 onClick={() => handleClick(key)}
 >
 {formatValue(val)}
 </p>
 )}
 </div>
 ))}
 </div>
 </div>
 {dirty && (
 <div className="border-t border-primary/40 px-6 py-3 flex justify-end">
 <Button size="sm" onClick={handleSave} className="gap-2">
 <Save className="w-4 h-4" />
 Save Changes
 </Button>
 </div>
 )}
 </div>
 );
}

function ActivityPanel() {
 return (
 <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
 <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
 <Activity className="w-7 h-7 text-muted-foreground opacity-50" />
 </div>
 <div>
 <p className="text-sm font-medium text-foreground">No activity yet</p>
 <p className="text-xs text-muted-foreground mt-1 max-w-xs">
 Activity tracking will appear here as you use this record.
 </p>
 </div>
 </div>
 );
}

function NotesPanel({ recordId}) {
 const storageKey = `record_notes_${recordId}`;

 const loadNotes = useCallback(() => {
 try {
 return JSON.parse(localStorage.getItem(storageKey) || "[]");
} catch {
 return [];
}
}, [storageKey]);

 const [notes, setNotes] = useState(loadNotes);
 const [draft, setDraft] = useState("");

 const handleAdd = () => {
 if (!draft.trim()) return;
 const newNote = {
 id: Date.now(),
 text: draft.trim(),
 createdAt: new Date().toISOString(),
};
 const updated = [newNote, ...notes];
 setNotes(updated);
 localStorage.setItem(storageKey, JSON.stringify(updated));
 setDraft("");
};

 return (
 <div className="flex flex-col h-full p-6 gap-4">
 {/* Input area */}
 <div className="flex flex-col gap-2">
 <textarea
 rows={3}
 placeholder="Add a note…"
 value={draft}
 onChange={(e) => setDraft(e.target.value)}
 className="w-full text-sm bg-muted/60 border border-primary/40 rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
 />
 <div className="flex justify-end">
 <Button size="sm" disabled={!draft.trim()} onClick={handleAdd} className="gap-2">
 <StickyNote className="w-4 h-4" />
 Add Note
 </Button>
 </div>
 </div>

 {/* Saved notes */}
 <div className="flex-1 overflow-y-auto space-y-3">
 {notes.length === 0 ? (
 <p className="text-xs text-muted-foreground text-center py-6">
 No notes yet. Add one above.
 </p>
 ) : (
 notes.map((note) => (
 <div
 key={note.id}
 className="rounded-lg border border-primary/40 bg-muted/30 px-4 py-3 space-y-1"
 >
 <p className="text-sm text-foreground whitespace-pre-wrap">{note.text}</p>
 <p className="text-[11px] text-muted-foreground">
 {new Date(note.createdAt).toLocaleString()}
 </p>
 </div>
 ))
 )}
 </div>
 </div>
 );
}

function DocumentsPanel() {
 return (
 <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
 <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
 <Paperclip className="w-7 h-7 text-muted-foreground opacity-50" />
 </div>
 <div>
 <p className="text-sm font-medium text-foreground">No documents attached</p>
 <p className="text-xs text-muted-foreground mt-1 max-w-xs">
 Attach documents to this record.
 </p>
 </div>
 <Button size="sm" disabled variant="outline" className="gap-2 opacity-50 cursor-not-allowed">
 <Paperclip className="w-4 h-4" />
 Upload (coming soon)
 </Button>
 </div>
 );
}

function TimelinePanel({ record}) {
 const milestones = [];

 if (record?.created_at) {
 milestones.push({
 label: "Record Created",
 date: record.created_at,
 type: "created",
});
}
 if (record?.updated_at && record.updated_at !== record.created_at) {
 milestones.push({
 label: "Last Updated",
 date: record.updated_at,
 type: "updated",
});
}
 if (milestones.length === 0) {
 milestones.push({
 label: "Record Opened",
 date: new Date().toISOString(),
 type: "now",
});
}

 return (
 <div className="p-6 overflow-y-auto">
 <div className="relative ml-4">
 {/* Vertical line */}
 <div className="absolute left-3 top-2 bottom-2 w-px bg-primary/40" />

 <div className="space-y-8">
 {milestones.map((m, i) => (
 <div key={i} className="flex items-start gap-5 relative">
 {/* Dot */}
 <div
 className={cn(
 "relative z-10 w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 -ml-0.5",
 m.type === "created"
 ? "border-emerald-500 bg-emerald-500/10"
 : m.type === "updated"
 ? "border-blue-500 bg-blue-500/10"
 : "border-muted-foreground/40 bg-muted"
 )}
 >
 {m.type === "created" ? (
 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
 ) : m.type === "updated" ? (
 <AlertCircle className="w-3.5 h-3.5 text-blue-500" />
 ) : (
 <Circle className="w-3.5 h-3.5 text-muted-foreground/50" />
 )}
 </div>

 {/* Content */}
 <div className="pt-0.5">
 <p className="text-sm font-medium text-foreground">{m.label}</p>
 <p className="text-xs text-muted-foreground mt-0.5">
 {new Date(m.date).toLocaleString()}
 </p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RecordWorkspace({
 record,
 title,
 onClose,
 onSave,
 isOpen,
 tableName,
}) {
 const [activeTab, setActiveTab] = useState("overview");

 // Close on Escape
 useEffect(() => {
 if (!isOpen) return;
 const handler = (e) => {
 if (e.key === "Escape") onClose?.();
};
 window.addEventListener("keydown", handler);
 return () => window.removeEventListener("keydown", handler);
}, [isOpen, onClose]);

 // Reset tab when a new record opens
 useEffect(() => {
 if (isOpen) setActiveTab("overview");
}, [isOpen, record?.id]);

 // Derive top-level metadata fields for sidebar (first 6 non-id, non-timestamp fields)
 const sidebarFields = Object.entries(record || {})
 .filter(([k]) => !["id", "created_at", "updated_at", "company_id"].includes(k))
 .slice(0, 6);

 const statusEntry = Object.entries(record || {}).find(([k]) =>
 STATUS_KEYS.includes(k.toLowerCase())
 );

 return (
 <AnimatePresence>
 {isOpen && (
 <>
 {/* Dark backdrop */}
 <motion.div
 key="backdrop"
 initial={{ opacity: 0}}
 animate={{ opacity: 1}}
 exit={{ opacity: 0}}
 transition={{ duration: 0.2}}
 className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
 onClick={onClose}
 />

 {/* Workspace panel */}
 <motion.div
 key="workspace"
 initial={{ x: "100%"}}
 animate={{ x: 0}}
 exit={{ x: "100%"}}
 transition={{ type: "spring", stiffness: 320, damping: 38}}
 className="fixed inset-y-0 right-0 z-50 flex w-full max-w-5xl "
 >
 {/* ── Left sidebar ── */}
 <div className="w-[280px] flex-shrink-0 flex flex-col bg-card border-r border-primary/40 overflow-y-auto">
 {/* Header */}
 <div className="flex items-center justify-between px-4 py-4 border-b border-primary/40">
 <button
 onClick={onClose}
 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
 >
 <ChevronLeft className="w-4 h-4" />
 Close
 </button>
 <button
 onClick={onClose}
 className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 {/* Title & context */}
 <div className="px-4 pt-5 pb-4 border-b border-primary/40 space-y-2">
 <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
 {tableName || "Record"}
 </p>
 <h2 className="text-base font-semibold text-foreground leading-snug break-words">
 {title || "Untitled"}
 </h2>
 {statusEntry && (
 <span
 className={cn(
 "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
 statusColor(statusEntry[1])
 )}
 >
 {formatValue(statusEntry[1])}
 </span>
 )}
 </div>

 {/* Key fields */}
 <div className="flex-1 px-4 py-4 space-y-4">
 {sidebarFields.map(([key, val]) => (
 <div key={key}>
 <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
 {formatKey(key)}
 </p>
 <p className="text-sm text-foreground break-words">{formatValue(val)}</p>
 </div>
 ))}
 </div>

 {/* Footer: record ID */}
 {record?.id && (
 <div className="px-4 py-3 border-t border-primary/40">
 <p className="text-[10px] font-mono text-muted-foreground/50 truncate">
 id: {record.id}
 </p>
 </div>
 )}
 </div>

 {/* ── Right panel ── */}
 <div className="flex-1 flex flex-col bg-background min-w-0">
 {/* Tab bar */}
 <div className="flex items-center gap-1 px-4 border-b border-primary/40 bg-card overflow-x-auto">
 {TABS.map(({ id, label, icon: Icon}) => (
 <button
 key={id}
 onClick={() => setActiveTab(id)}
 className={cn(
 "flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
 activeTab === id
 ? "border-primary text-primary"
 : "border-transparent text-muted-foreground hover:text-foreground hover:border-primary/40"
 )}
 >
 <Icon className="w-4 h-4" />
 {label}
 </button>
 ))}
 </div>

 {/* Tab content */}
 <div className="flex-1 overflow-hidden">
 <AnimatePresence mode="wait">
 <motion.div
 key={activeTab}
 initial={{ opacity: 0, y: 6}}
 animate={{ opacity: 1, y: 0}}
 exit={{ opacity: 0, y: -6}}
 transition={{ duration: 0.15}}
 className="h-full"
 >
 {activeTab === "overview" && (
 <OverviewPanel record={record} onSave={onSave} />
 )}
 {activeTab === "activity" && <ActivityPanel />}
 {activeTab === "notes" && (
 <NotesPanel recordId={record?.id || "unknown"} />
 )}
 {activeTab === "documents" && <DocumentsPanel />}
 {activeTab === "timeline" && <TimelinePanel record={record} />}
 </motion.div>
 </AnimatePresence>
 </div>
 </div>
 </motion.div>
 </>
 )}
 </AnimatePresence>
 );
}
