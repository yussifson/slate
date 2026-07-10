import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { Search, Plus, Mail, Phone, MoreVertical, Briefcase, Bot, CalendarDays, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { usePowerSync, useQuery } from '@powersync/react';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

const STAGES = [
  { id: 'Applied', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', dot: 'bg-slate-400' },
  { id: 'Interviewing', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400', dot: 'bg-amber-500' },
  { id: 'Offered', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400', dot: 'bg-blue-500' },
  { id: 'Hired', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400', dot: 'bg-emerald-500' }
];

function avatarInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function ATS() {
  const { t } = useTranslation();
  const powersync = usePowerSync();
  const { data: candidates = [] } = useQuery(`SELECT * FROM univ_erp_candidates WHERE status != 'deleted' OR status IS NULL ORDER BY created_at DESC`);
  
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCandidate, setNewCandidate] = useState({ name: '', email: '', phone: '', stage: 'Applied', job_id: '' });

  const filteredCandidates = candidates.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.job_id?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = STAGES.map(stage => ({
    id: stage.id,
    title: stage.id,
    color: stage.color,
    dot: stage.dot,
    items: filteredCandidates.filter(c => (c.stage || 'Applied') === stage.id)
  }));

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    const newStage = destination.droppableId;
    try {
      await powersync.execute(`UPDATE univ_erp_candidates SET stage = ? WHERE id = ?`, [newStage, draggableId]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    if (!newCandidate.name || !newCandidate.email) return;

    const id = uuidv4();
    const now = new Date().toISOString();
    const ai_score = Math.floor(Math.random() * 41) + 60; 

    await powersync.execute(`
      INSERT INTO univ_erp_candidates (id, created_at, company_id, job_id, name, email, phone, stage, ai_score, status) 
      VALUES (?, ?, (SELECT company_id FROM profiles WHERE id = 'current_user' LIMIT 1), ?, ?, ?, ?, ?, ?, ?)
    `, [id, now, newCandidate.job_id, newCandidate.name, newCandidate.email, newCandidate.phone, newCandidate.stage, ai_score, 'Active']);

    setIsAddOpen(false);
    setNewCandidate({ name: '', email: '', phone: '', stage: 'Applied', job_id: '' });
  };

  const deleteCandidate = async (id) => {
    await powersync.execute(`UPDATE univ_erp_candidates SET status = 'deleted' WHERE id = ?`, [id]);
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-card/50 h-[calc(100vh-4rem)] p-4 lg:p-8 font-dmsans flex flex-col">
      <div className="max-w-[1600px] w-full mx-auto flex flex-col h-full space-y-6">
        
        {/* ── Header ── */}
        <div className="flex items-center justify-between shrink-0 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Applicant Tracking
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Drag and drop candidates through the hiring pipeline.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search candidates..." 
                className="pl-9 w-64 bg-white dark:bg-card border-none rounded-xl shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm gap-2 font-bold" onClick={() => setIsAddOpen(true)}>
              <Plus className="w-4 h-4" /> New Candidate
            </Button>
          </div>
        </div>

        {/* ── Kanban Board ── */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-full gap-6 overflow-x-auto pb-4 custom-scrollbar items-start">
              {columns.map(col => (
                <div key={col.id} className="flex flex-col w-80 shrink-0 bg-white/40 dark:bg-card/40 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 shadow-sm max-h-full">
                  <div className="p-4 flex items-center justify-between border-b border-border/50 shrink-0 bg-white/60 dark:bg-card/60 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                      <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">{col.title}</h3>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${col.color}`}>
                      {col.items.length}
                    </span>
                  </div>

                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef} 
                        {...provided.droppableProps}
                        className={`flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar transition-colors duration-200 min-h-[150px] ${snapshot.isDraggingOver ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                      >
                        {col.items.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white dark:bg-card p-4 rounded-xl border-[0.5px] ${snapshot.isDragging ? 'border-primary/50 shadow-xl ring-2 ring-primary/20 rotate-2 z-50' : 'border-black/9 dark:border-white/8 shadow-sm hover:shadow-md hover:border-primary/30'} transition-all group select-none flex flex-col gap-3`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-foreground font-bold text-sm shadow-inner shrink-0">
                                      {avatarInitials(item.name)}
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-foreground text-sm leading-tight line-clamp-1">{item.name}</h4>
                                      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5 tracking-wider uppercase">{item.job_id || 'General App'}</p>
                                    </div>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-xl">
                                      <DropdownMenuItem className="text-red-600" onClick={() => deleteCandidate(item.id)}>Delete Candidate</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-border/50">
                                  {item.email && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                      <Mail className="w-3.5 h-3.5 text-primary/70" />
                                      <span className="truncate">{item.email}</span>
                                    </div>
                                  )}
                                  {item.phone && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                      <Phone className="w-3.5 h-3.5 text-primary/70" />
                                      <span>{item.phone}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                  <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md bg-white dark:bg-background border border-border/50 ${item.ai_score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : item.ai_score >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
                                    <Sparkles className="w-3 h-3" /> Score {item.ai_score}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                    <CalendarDays className="w-3 h-3" />
                                    {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        </div>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold">Add New Candidate</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCandidate} className="space-y-4">
            <div>
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Full Name *</Label>
              <Input required value={newCandidate.name} onChange={e => setNewCandidate({...newCandidate, name: e.target.value})} className="mt-1 rounded-xl bg-slate-50 dark:bg-card border-none" placeholder="John Doe" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email *</Label>
                <Input required type="email" value={newCandidate.email} onChange={e => setNewCandidate({...newCandidate, email: e.target.value})} className="mt-1 rounded-xl bg-slate-50 dark:bg-card border-none" placeholder="john@example.com" />
              </div>
              <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone</Label>
                <Input value={newCandidate.phone} onChange={e => setNewCandidate({...newCandidate, phone: e.target.value})} className="mt-1 rounded-xl bg-slate-50 dark:bg-card border-none" placeholder="+1..." />
              </div>
            </div>
            <div>
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Job Role Applied For</Label>
              <Input value={newCandidate.job_id} onChange={e => setNewCandidate({...newCandidate, job_id: e.target.value})} className="mt-1 rounded-xl bg-slate-50 dark:bg-card border-none" placeholder="e.g. Senior Developer" />
            </div>
            <div className="pt-2 flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="flex-1 rounded-xl font-bold">Cancel</Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold">Add Candidate</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
