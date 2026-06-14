import { useTranslation} from "react-i18next";
import React, { useState} from "react";
import { DragDropContext, Droppable, Draggable} from "@hello-pangea/dnd";
import { Badge} from "@/components/ui/badge";
import { PRIORITY_COLORS} from "@/lib/constants";
import { useNavigate} from "react-router-dom";
import { format} from "date-fns";
import { User, Calendar} from "lucide-react";

const COLUMNS = [
 { id: "open", label: "Open", color: "bg-primary", light: "bg-slate-50 border-primary/20"},
 { id: "in_progress", label: "In Progress", color: "bg-amber-500", light: "bg-amber-50 border-amber-200"},
 { id: "pending_hearing", label: "Pending Hearing", color: "bg-primary", light: "bg-slate-50 border-primary/20"},
 { id: "closed", label: "Closed", color: "bg-primary", light: "bg-slate-50 border-primary/20"},
 { id: "archived", label: "Archived", color: "bg-gray-400", light: "bg-gray-50 border-gray-200"},
];

export default function CasesKanban({ cases, onStatusChange}) {
 const { t} = useTranslation();
 const navigate = useNavigate();

 const grouped = COLUMNS.reduce((acc, col) => {
 acc[col.id] = cases.filter(c => c.status === col.id);
 return acc;
}, {});

 const onDragEnd = (result) => {
 const { draggableId, destination} = result;
 if (!destination) return;
 const newStatus = destination.droppableId;
 const caseItem = cases.find(c => c.id === draggableId);
 if (caseItem && caseItem.status !== newStatus) {
 onStatusChange(caseItem, newStatus);
}
};

 return (
 <DragDropContext onDragEnd={onDragEnd}>
 <div className="flex gap-4 overflow-x-auto pb-4">
 {COLUMNS.map(col => {
 return (
 <div key={col.id} className="flex-shrink-0 w-64">
 {/* Column header */}
 <div className="flex items-center gap-2 mb-3">
 <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
 <span className="text-sm font-semibold text-foreground">{col.label}</span>
 <span className="ml-auto text-xs font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
 {grouped[col.id]?.length || 0}
 </span>
 </div>
 {/* Droppable */}
 <Droppable droppableId={col.id}>
 {(provided, snapshot) => {
 return (
 <div
 ref={provided.innerRef}
 {...provided.droppableProps}
 className={`min-h-[200px] rounded-xl border-2 border-dashed p-2 transition-colors space-y-2 ${
 snapshot.isDraggingOver ? `${col.light}` : "border-border bg-muted/30"
}`}
 >
 {(grouped[col.id] || []).map((c, index) => {
 return (
 <Draggable key={c.id} draggableId={c.id} index={index}>
 {(provided, snapshot) => {
 return (
 <div
 ref={provided.innerRef}
 {...provided.draggableProps}
 {...provided.dragHandleProps}
 onClick={() => navigate(`/cases/${c.id}`, { state: { caseData: c}})}
 className={`bg-card rounded-lg border border-border p-3 cursor-pointer space-y-2 transition-all ${
 snapshot.isDragging ? " rotate-1 opacity-90" : " hover:border-primary/30"
}`}
 >
 <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2">{c.title}</p>
 {c.case_number && (
 <p className="text-[10px] text-muted-foreground font-mono">#{c.case_number}</p>
 )}
 <div className="flex flex-wrap gap-1">
 <Badge variant="outline" className="text-[10px] capitalize px-1.5 py-0">{c.case_type}</Badge>
 {c.priority && (
 <Badge className={`${PRIORITY_COLORS[c.priority]} text-[10px] px-1.5 py-0`}>{c.priority}</Badge>
 )}
 </div>
 <div className="space-y-1">
 {c.client_name && (
 <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
 <User className="w-3 h-3" />
 <span className="truncate">{c.client_name}</span>
 </div>
 )}
 {c.next_hearing_date && (
 <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
 <Calendar className="w-3 h-3" />
 <span>{format(new Date(c.next_hearing_date), "MMM d, yyyy")}</span>
 </div>
 )}
 </div>
 {c.assigned_lawyer_name && (
 <div className="flex items-center gap-1.5">
 <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
 <span className="text-[8px] font-bold text-primary">
 {c.assigned_lawyer_name[0].toUpperCase()}
 </span>
 </div>
 <span className="text-[10px] text-muted-foreground truncate">{c.assigned_lawyer_name}</span>
 </div>
 )}
 </div>
 );
}}
 </Draggable>
 );
})}
 {provided.placeholder}
 {(grouped[col.id] || []).length === 0 && !snapshot.isDraggingOver && (
 <div className="flex items-center justify-center h-20 text-[11px] text-muted-foreground">
 {t("drop_cases_here", "Drop cases here")}
 </div>
 )}
 </div>
 );
}}
 </Droppable>
 </div>
 );
})}
 </div>
 </DragDropContext>
 );
}