import React from "react";
import { LayoutGrid, List, Edit, Trash2, Eye, BookOpen, Calendar, Clock, MapPin, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Brand blue/navy palette for the School Suite */
export const SCHOOL_BRAND = {
  primary: "hsl(var(--primary))",        // Dynamic primary
  primaryDark: "hsl(var(--primary) / 0.9)",
  primaryLight: "hsl(var(--primary) / 0.1)",
  accent: "hsl(var(--primary))",         // Bright Blue
  chart: ["hsl(var(--primary))", "hsl(var(--primary) / 0.8)", "hsl(var(--primary) / 0.6)", "hsl(var(--primary) / 0.4)", "hsl(var(--primary) / 0.2)", "hsl(var(--primary) / 0.1)"],
};

export function ViewModeToggle({ viewMode, onChange, className }) {
  return (
    <div className={cn("bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 p-1 rounded-xl flex items-center shadow-sm", className)}>
      <button
        type="button"
        onClick={() => onChange("list")}
        className={cn(
          "p-2 rounded-lg transition-all duration-200",
          viewMode === "list" ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-700"
        )}
        title="List view"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={cn(
          "p-2 rounded-lg transition-all duration-200",
          viewMode === "grid" ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-700"
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
        <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/95 dark:bg-slate-800/95 shadow-md hover:text-primary rounded-xl border border-slate-100 dark:border-slate-700" onClick={onView}>
          <Eye className="w-3.5 h-3.5" />
        </Button>
      )}
      {onEdit && (
        <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/95 dark:bg-slate-800/95 shadow-md hover:text-primary rounded-xl border border-slate-100 dark:border-slate-700" onClick={onEdit}>
          <Edit className="w-3.5 h-3.5" />
        </Button>
      )}
      {onDelete && (
        <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/95 dark:bg-slate-800/95 shadow-md text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl border border-slate-100 dark:border-slate-700" onClick={onDelete}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}

export function StudentGridCard({ student, onEdit, onDelete, onView }) {
  const feeStyles = {
    Paid: "bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30",
    Owing: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    Partial: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
  };

  const statusStyles = {
    Active: "bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30",
    Suspended: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    Graduated: "bg-primary/5 text-primary/90 border-primary/20 dark:bg-primary/30 dark:text-primary/30 dark:border-primary/80"
  };

  return (
    <article className="school-card group relative p-6 hover:-translate-y-1.5 transition-all duration-300 flex flex-col min-h-[260px] text-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent dark:from-primary/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl" />
      <CardActions onView={onView} onEdit={onEdit} onDelete={onDelete} />
      
      <div className="w-24 h-24 mx-auto rounded-[1.5rem] bg-gradient-to-br from-primary/5 to-primary/15 dark:from-primary/20 dark:to-primary/30 border border-primary/10 dark:border-primary/20 shadow-inner flex items-center justify-center text-4xl font-black text-primary dark:text-primary mb-5 shrink-0 relative overflow-hidden transform group-hover:scale-105 transition-transform duration-300">
        {student.avatar || student.name?.[0]?.toUpperCase()}
      </div>
      
      <div className="min-w-0 flex-1 mb-6 relative z-10">
        <h3 className="school-heading font-extrabold text-xl line-clamp-1 tracking-tight group-hover:text-primary transition-colors">{student.name}</h3>
        <p className="text-xs text-muted-foreground font-semibold tracking-widest mt-1 opacity-70 font-dmsans">{student.studentId}</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-xs font-bold px-4 py-1.5 rounded-full bg-primary/10 dark:bg-slate-800 text-primary dark:text-primary shadow-sm border border-primary/10 dark:border-primary/20">{student.class}</span>
        </div>
      </div>
      
      <div className="mt-auto grid grid-cols-2 gap-4 pt-5 border-t border-slate-100 dark:border-slate-800 relative z-10">
        <div className="text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 opacity-60">Status</p>
          <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-md border uppercase tracking-wide", statusStyles[student.status] || "bg-muted text-muted-foreground")}>
            {student.status}
          </span>
        </div>
        <div className="text-center border-l border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 opacity-60">Fee Status</p>
          <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-md border uppercase tracking-wide", feeStyles[student.feeStatus] || "bg-muted text-muted-foreground")}>
            {student.feeStatus}
          </span>
        </div>
      </div>
    </article>
  );
}

export function ClassGridCard({ classInfo, onEdit, onDelete, onView }) {
  return (
    <article className="school-card group relative p-6 hover:-translate-y-1 transition-all duration-300 flex flex-col min-h-[220px] overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none transform translate-x-1/4 -translate-y-1/4 scale-150">
        <BookOpen className="w-32 h-32 text-primary" />
      </div>
      
      <div className="flex justify-between items-start mb-5 relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/15 dark:from-primary/20 dark:to-primary/30 border border-primary/10 dark:border-primary/20 shadow-sm text-primary dark:text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <BookOpen className="w-6 h-6" />
        </div>
        <CardActions onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </div>
      
      <div className="mb-6 relative z-10">
        <h3 className="school-heading font-extrabold text-2xl tracking-tight group-hover:text-primary transition-colors">{classInfo.name}</h3>
        <p className="text-sm font-semibold text-muted-foreground/80 mt-1 tracking-wide uppercase">{classInfo.subject}</p>
      </div>

      <div className="space-y-3 mt-auto relative z-10 bg-primary/5 dark:bg-slate-800/50 p-4 rounded-xl border border-primary/5 dark:border-slate-700">
        <div className="flex justify-between text-sm items-center">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Teacher</span>
          <span className="font-bold text-foreground text-right">{classInfo.teacher}</span>
        </div>
        <div className="flex justify-between text-sm items-center">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Enrolled</span>
          <span className="font-bold text-foreground bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-primary/10 dark:border-slate-700 shadow-sm">{classInfo.students}</span>
        </div>
        <div className="flex justify-between text-sm items-center pt-2 border-t border-primary/5 dark:border-slate-700">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Schedule</span>
          <span className="font-medium text-foreground text-right truncate max-w-[120px] text-xs">{classInfo.schedule}</span>
        </div>
      </div>
    </article>
  );
}

export function BookGridCard({ book, onEdit, onDelete, onView, onIssue }) {
  const isAvailable = book.available > 0;
  
  return (
    <article className="school-card group relative overflow-hidden flex flex-col min-h-[300px]">
      <div className="h-40 bg-gradient-to-br from-primary/5 to-primary/15 dark:from-slate-800 dark:to-slate-900 border-b border-primary/5 dark:border-slate-700 flex items-center justify-center relative p-4">
        {book.cover_url ? (
          <img src={book.cover_url} alt="Cover" className="h-full object-contain drop-shadow-md rounded-sm" />
        ) : (
          <div className="w-24 h-32 bg-white dark:bg-slate-800 border border-primary/10 dark:border-slate-700 shadow-sm rounded-lg flex items-center justify-center text-primary dark:text-slate-500">
            <BookOpen className="w-8 h-8" />
          </div>
        )}
        
        <span
          className={cn(
            "absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border shadow-sm backdrop-blur-md",
            isAvailable ? "bg-primary text-white border-primary" : "bg-red-500/90 text-white border-red-600"
          )}
        >
          {isAvailable ? `${book.available} Available` : "Checked Out"}
        </span>
        
        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {onView && (
             <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/95 dark:bg-slate-800/95 shadow-md rounded-xl" onClick={onView}>
               <Eye className="w-3.5 h-3.5" />
             </Button>
          )}
          {onEdit && (
            <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/95 dark:bg-slate-800/95 shadow-md rounded-xl" onClick={onEdit}>
              <Edit className="w-3.5 h-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/95 dark:bg-slate-800/95 shadow-md text-red-600 rounded-xl" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <p className="text-xs font-semibold text-primary mb-1 line-clamp-1 uppercase tracking-wider">{book.category}</p>
        <h3 className="school-heading font-bold text-lg leading-snug line-clamp-2">{book.title}</h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-1 font-dmsans">{book.author}</p>
        
        <div className="mt-auto pt-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-mono">ISBN: {book.isbn}</p>
          {onIssue && (
            <Button size="sm" variant={isAvailable ? "default" : "secondary"} className={cn("h-7 text-xs px-3 rounded-lg", isAvailable && "bg-primary hover:bg-primary/90 shadow-sm")} disabled={!isAvailable} onClick={onIssue}>
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
    Upcoming: 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30',
    Ongoing: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse dark:bg-amber-900/30 dark:text-amber-300',
    Completed: 'bg-primary/5 text-primary/90 border-primary/20 dark:bg-primary/30 dark:text-primary/30'
  };

  return (
    <article className="school-card group relative p-6 hover:shadow-xl transition-all flex flex-col min-h-[220px]">
      <div className="flex justify-between items-start mb-4">
        <select
          value={exam.status}
          onChange={e => onStatusChange && onStatusChange(exam, e.target.value)}
          className={cn("text-[10px] font-bold px-2 py-1 rounded-lg border uppercase cursor-pointer outline-none", statusStyles[exam.status] || "bg-muted text-muted-foreground")}
        >
          <option value="Upcoming">Upcoming</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Completed">Completed</option>
        </select>
        <CardActions onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </div>
      
      <div className="mb-4">
        <h3 className="school-heading font-bold text-xl mb-1">{exam.subject}</h3>
        <span className="text-xs font-bold px-2 py-1 bg-primary/10 dark:bg-slate-800 text-primary dark:text-primary rounded-lg">{exam.class}</span>
      </div>

      <div className="space-y-3 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground">{new Date(exam.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground">{exam.time} ({exam.duration})</span>
        </div>
        <div className="flex items-center gap-3">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground truncate">{exam.venue}</span>
        </div>
      </div>
    </article>
  );
}

export function ModuleBanner({ title, subtitle, dateText, onRefresh, isRefreshing, metrics }) {
  return (
    <div className="bg-gradient-to-r from-primary via-primary/90 to-primary rounded-3xl p-6 relative overflow-hidden mb-6 shadow-lg shadow-primary/20">
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl opacity-50 translate-y-1/3 -translate-x-1/4 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.04] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
        <div>
          {dateText && (
            <p className="text-white/80 text-[10px] font-bold tracking-widest uppercase mb-1 font-dmsans">
              {dateText}
            </p>
          )}
          <h1 className="text-2xl md:text-3xl font-black text-white mb-1 tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {title}
          </h1>
          <p className="text-white/90 text-sm font-medium opacity-90 font-dmsans">
            {subtitle}
          </p>
        </div>
        {onRefresh && (
          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={onRefresh} disabled={isRefreshing} size="sm" className="gap-1.5 text-xs font-bold bg-white/15 hover:bg-white/25 text-white rounded-xl border border-white/20 shadow-sm backdrop-blur-md">
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        )}
      </div>

      {metrics && metrics.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
          {metrics.map((m, i) => (
            <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group backdrop-blur-sm">
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors pointer-events-none" />
              <p className="text-2xl font-black text-white mb-1 relative z-10">{m.value}</p>
              <div className="flex items-center gap-1.5 relative z-10">
                {m.icon && <m.icon className="w-3.5 h-3.5 text-white/80" />}
                <p className="text-xs font-bold text-white uppercase tracking-wider">{m.title}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
