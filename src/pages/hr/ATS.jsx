import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { Search, Plus, Mail, Phone, MoreVertical, Briefcase, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { usePowerSync, useQuery } from '@powersync/react';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const STAGES = ['Applied', 'Interviewing', 'Offered', 'Hired'];

export default function ATS() {
  const { t } = useTranslation();
  const powersync = usePowerSync();
  const { data: candidates = [] } = useQuery(`SELECT * FROM univ_erp_candidates WHERE status != 'deleted' OR status IS NULL ORDER BY created_at DESC`);
  
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCandidate, setNewCandidate] = useState({ name: '', email: '', phone: '', stage: 'Applied' });

  // Filter candidates by search
  const filteredCandidates = candidates.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = STAGES.map(stage => ({
    id: stage,
    title: stage,
    items: filteredCandidates.filter(c => (c.stage || 'Applied') === stage)
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

  const handleAddCandidate = async () => {
    if (!newCandidate.name || !newCandidate.email) return;

    const id = uuidv4();
    const now = new Date().toISOString();
    const ai_score = Math.floor(Math.random() * 41) + 60; // 60-100

    await powersync.execute(`
      INSERT INTO univ_erp_candidates (id, created_at, name, email, phone, stage, ai_score, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, now, newCandidate.name, newCandidate.email, newCandidate.phone, newCandidate.stage, ai_score, 'active']);

    setIsAddOpen(false);
    setNewCandidate({ name: '', email: '', phone: '', stage: 'Applied' });
  };

  return (
    <div className="p-6 space-y-6 font-dmsans h-[calc(100vh-4rem)] flex flex-col max-w-7xl mx-auto">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Applicant Tracking System</h1>
          <p className="text-slate-500 mt-1">Manage candidates, interviews, and offers with interactive boards.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Search candidates..." 
              className="pl-9 w-64 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-all" onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Candidate
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex h-full gap-6 overflow-x-auto pb-4 custom-scrollbar">
            {columns.map(col => (
              <div key={col.id} className="flex flex-col w-80 shrink-0 bg-slate-50/80 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm">
                <div className="p-4 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 shrink-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200">{col.title}</h3>
                    <span className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs py-0.5 px-2 rounded-full font-medium shadow-sm border border-slate-100 dark:border-slate-700">
                      {col.items.length}
                    </span>
                  </div>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef} 
                      {...provided.droppableProps}
                      className={`flex-1 p-3 space-y-3 overflow-y-auto transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-primary/5 dark:bg-primary/10 rounded-b-2xl' : ''}`}
                    >
                      {col.items.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white dark:bg-slate-950 p-4 rounded-xl border ${snapshot.isDragging ? 'border-primary/50 shadow-xl ring-2 ring-primary/20 rotate-1 z-50' : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'} transition-all group select-none`}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-medium text-slate-900 dark:text-white leading-tight">{item.name}</h4>
                                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium"><Briefcase className="w-3.5 h-3.5 text-slate-400"/> {item.job_id || 'General Application'}</p>
                                </div>
                                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="space-y-2 mb-4">
                                {item.email && (
                                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-md text-slate-500">
                                      <Mail className="w-3 h-3 shrink-0" />
                                    </div>
                                    <span className="truncate">{item.email}</span>
                                  </div>
                                )}
                                {item.phone && (
                                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-md text-slate-500">
                                      <Phone className="w-3 h-3 shrink-0" />
                                    </div>
                                    <span>{item.phone}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-1.5 text-xs font-medium">
                                  <Bot className={`w-4 h-4 ${item.ai_score >= 80 ? 'text-emerald-500' : item.ai_score >= 60 ? 'text-amber-500' : 'text-slate-400'}`} />
                                  <span className={item.ai_score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : item.ai_score >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}>
                                    {item.ai_score ? `${item.ai_score}% Match` : 'Unscored'}
                                  </span>
                                </div>
                                {item.created_at && (
                                  <span className="text-[11px] font-medium text-slate-400 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-md">
                                    {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
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

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Candidate</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                placeholder="Jane Doe" 
                value={newCandidate.name} 
                onChange={e => setNewCandidate({...newCandidate, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="jane@example.com" 
                value={newCandidate.email}
                onChange={e => setNewCandidate({...newCandidate, email: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone" 
                placeholder="+1 (555) 000-0000" 
                value={newCandidate.phone}
                onChange={e => setNewCandidate({...newCandidate, phone: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCandidate} className="bg-primary text-white">Save Candidate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
