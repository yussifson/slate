import React from "react";
import { LayoutGrid, List, Edit, Trash2, Eye, BookOpen, Calendar, Clock, MapPin, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Brand blue/navy palette for the School Suite */
export const SCHOOL_BRAND = {
  primary: "hsl(215, 25%, 27%)", // Deep Slate/Navy
  primaryDark: "hsl(215, 25%, 15%)",
  primaryLight: "hsl(215, 25%, 96%)",
  chart: ["#1e293b", "#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1"],
};

export function ViewModeToggle({ viewMode, onChange, className }) {
  return (
    <div className={cn("bg-card border border-border p-1 rounded-lg flex items-center shadow-sm", className)}>
      <button
        type="button"
        onClick={() => onChange("list")}
        className={cn(
          "p-2 rounded-md transition-colors",
          viewMode === "list" ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900" : "text-muted-foreground hover:bg-muted"
        )}
        title="List view"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={cn(
          "p-2 rounded-md transition-colors",
          viewMode === "grid" ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900" : "text-muted-foreground hover:bg-muted"
        )}
        title="Grid view"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
    </div>
  );
}

function CardActions({ onEdit, onDelete, onView }) {
  return (
    <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
      {onView && (
        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/95 shadow-sm hover:text-blue-600" onClick={onView}>
          <Eye className="w-3.5 h-3.5" />
        </Button>
      )}
      {onEdit && (
        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/95 shadow-sm hover:text-blue-600" onClick={onEdit}>
          <Edit className="w-3.5 h-3.5" />
        </Button>
      )}
      {onDelete && (
        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/95 shadow-sm text-red-600 hover:text-red-700 hover:bg-red-50" onClick={onDelete}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}

export function StudentGridCard({ student, onEdit, onDelete, onView }) {
  const feeStyles = {
    Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Owing: "bg-red-50 text-red-700 border-red-200",
    Partial: "bg-amber-50 text-amber-700 border-amber-200"
  };

  const statusStyles = {
    Active: "bg-blue-50 text-blue-700 border-blue-200",
    Suspended: "bg-slate-100 text-slate-700 border-slate-200",
    Graduated: "bg-purple-50 text-purple-700 border-purple-200"
  };

  return (
    <article className="group relative bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col min-h-[260px] text-center">
      <CardActions onView={onView} onEdit={onEdit} onDelete={onDelete} />
      
      <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 border-4 border-background shadow-sm flex items-center justify-center text-3xl font-black text-primary mb-4 shrink-0 relative overflow-hidden">
        {student.avatar || student.name?.[0]?.toUpperCase()}
      </div>
      
      <div className="min-w-0 flex-1 mb-6">
        <h3 className="font-bold text-xl text-foreground line-clamp-1">{student.name}</h3>
        <p className="text-xs text-muted-foreground font-mono mt-1">{student.studentId}</p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-muted text-muted-foreground">{student.class}</span>
        </div>
      </div>
      
      <div className="mt-auto grid grid-cols-2 gap-4 pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Status</p>
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase", statusStyles[student.status] || "bg-muted text-muted-foreground")}>
            {student.status}
          </span>
        </div>
        <div className="text-center border-l border-border">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Fee Status</p>
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase", feeStyles[student.feeStatus] || "bg-muted text-muted-foreground")}>
            {student.feeStatus}
          </span>
        </div>
      </div>
    </article>
  );
}

export function ClassGridCard({ classInfo, onEdit, onDelete, onView }) {
  return (
    <article className="group relative bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:border-slate-300 transition-all flex flex-col min-h-[220px]">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <BookOpen className="w-6 h-6" />
        </div>
        <CardActions onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </div>
      
      <div className="mb-4">
        <h3 className="font-bold text-xl text-foreground">{classInfo.name}</h3>
        <p className="text-sm font-semibold text-muted-foreground mt-0.5">{classInfo.subject}</p>
      </div>

      <div className="space-y-2 mt-auto">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Teacher:</span>
          <span className="font-medium text-foreground">{classInfo.teacher}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Enrolled:</span>
          <span className="font-medium text-foreground">{classInfo.students} Students</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Schedule:</span>
          <span className="font-medium text-foreground truncate max-w-[120px]">{classInfo.schedule}</span>
        </div>
      </div>
    </article>
  );
}

export function BookGridCard({ book, onEdit, onDelete, onView, onIssue }) {
  const isAvailable = book.available > 0;
  
  return (
    <article className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all flex flex-col min-h-[300px]">
      <div className="h-40 bg-slate-50 border-b border-border flex items-center justify-center relative p-4">
        {book.cover_url ? (
          <img src={book.cover_url} alt="Cover" className="h-full object-contain drop-shadow-md rounded-sm" />
        ) : (
          <div className="w-24 h-32 bg-background border border-border shadow-sm rounded-sm flex items-center justify-center text-slate-300">
            <BookOpen className="w-8 h-8" />
          </div>
        )}
        
        <span
          className={cn(
            "absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border shadow-sm backdrop-blur-md",
            isAvailable ? "bg-emerald-500/90 text-white border-emerald-600" : "bg-red-500/90 text-white border-red-600"
          )}
        >
          {isAvailable ? `${book.available} Available` : "Checked Out"}
        </span>
        
        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {onView && (
             <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/95 shadow-sm" onClick={onView}>
               <Eye className="w-3.5 h-3.5" />
             </Button>
          )}
          {onEdit && (
            <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/95 shadow-sm" onClick={onEdit}>
              <Edit className="w-3.5 h-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/95 shadow-sm text-red-600" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <p className="text-xs font-semibold text-slate-500 mb-1 line-clamp-1">{book.category}</p>
        <h3 className="font-bold text-lg text-foreground leading-snug line-clamp-2">{book.title}</h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{book.author}</p>
        
        <div className="mt-auto pt-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-mono">ISBN: {book.isbn}</p>
          {onIssue && (
            <Button size="sm" variant={isAvailable ? "default" : "secondary"} className="h-7 text-xs px-3" disabled={!isAvailable} onClick={onIssue}>
              Issue
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ExamGridCard({ exam, onEdit, onDelete, onView, onStatusChange }) {
  const statusStyles = {
    Upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
    Ongoing: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };

  return (
    <article className="group relative bg-card border border-border rounded-2xl p-6 hover:shadow-xl transition-all flex flex-col min-h-[220px]">
      <div className="flex justify-between items-start mb-4">
        <select
          value={exam.status}
          onChange={e => onStatusChange && onStatusChange(exam, e.target.value)}
          className={cn("text-[10px] font-bold px-2 py-1 rounded-md border uppercase cursor-pointer outline-none", statusStyles[exam.status] || "bg-muted text-muted-foreground")}
        >
          <option value="Upcoming">Upcoming</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Completed">Completed</option>
        </select>
        <CardActions onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </div>
      
      <div className="mb-4">
        <h3 className="font-bold text-xl text-foreground mb-1">{exam.subject}</h3>
        <span className="text-xs font-bold px-2 py-1 bg-muted text-muted-foreground rounded">{exam.class}</span>
      </div>

      <div className="space-y-3 mt-auto pt-4 border-t border-border text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4" />
          <span className="font-medium text-foreground">{new Date(exam.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4" />
          <span className="font-medium text-foreground">{exam.time} ({exam.duration})</span>
        </div>
        <div className="flex items-center gap-3">
          <MapPin className="w-4 h-4" />
          <span className="font-medium text-foreground truncate">{exam.venue}</span>
        </div>
      </div>
    </article>
  );
}
