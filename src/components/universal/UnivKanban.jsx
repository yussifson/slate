import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompanyId } from '@/lib/hooks/useCompanyId';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from 'hello-pangea/dnd';
import { 
  LayoutList, Plus, Trash2, Edit2, Loader2, GripVertical, AlertCircle, Calendar, CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivKanban() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', status: 'todo', priority: 'medium', due_date: '' });

  const STAGES = ['todo', 'in_progress', 'review', 'done'];
  const STAGE_LABELS = { 'todo': 'To Do', 'in_progress': 'In Progress', 'review': 'Review', 'done': 'Done' };

  // For this generic component, we just use a default board implicitly linked to the company
  const { data: boards = [] } = useQuery({
    queryKey: ['univ_kanban_boards', companyId],
    queryFn: async () => {
      let res = await base44.db.from('univ_kanban_boards').select('*').eq('company_id', companyId);
      if (res.data?.length === 0) {
        res = await base44.db.from('univ_kanban_boards').insert([{ name: 'Main Board', company_id: companyId }]).select();
      }
      return res.data || [];
    },
    enabled: !!companyId
  });

  const boardId = boards?.[0]?.id;

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['univ_kanban_tasks', boardId],
    queryFn: async () => {
      const res = await base44.db.from('univ_kanban_tasks').select('*').eq('board_id', boardId).order('created_at', { ascending: false });
      if (res.error) throw res.error;
      return res.data;
    },
    enabled: !!boardId
  });

  const mutateTask = useMutation({
    mutationFn: async (payload) => {
      if (editingTask) return await base44.db.from('univ_kanban_tasks').update(payload).eq('id', editingTask);
      return await base44.db.from('univ_kanban_tasks').insert([{ ...payload, board_id: boardId }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_kanban_tasks']);
      toast.success(editingTask ? "Task updated" : "Task added");
      setIsTaskModalOpen(false);
      setEditingTask(null);
    }
  });

  const deleteTask = useMutation({
    mutationFn: async (id) => await base44.db.from('univ_kanban_tasks').delete().eq('id', id),
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_kanban_tasks']);
      toast.success("Task deleted");
    }
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ id, status }) => await base44.db.from('univ_kanban_tasks').update({ status }).eq('id', id),
    onSuccess: () => queryClient.invalidateQueries(['univ_kanban_tasks'])
  });

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId !== destination.droppableId) {
      updateTaskStatus.mutate({ id: draggableId, status: destination.droppableId });
    }
  };

  const openTaskModal = (task = null, status = 'todo') => {
    if (task) {
      setFormData(task);
      setEditingTask(task.id);
    } else {
      setFormData({ title: '', description: '', status, priority: 'medium', due_date: '' });
      setEditingTask(null);
    }
    setIsTaskModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutateTask.mutate(formData);
  };

  return (
    <div className="h-full min-h-[80vh] flex flex-col gap-6 w-full bg-background p-4 sm:p-6 lg:p-8">
      
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <LayoutList className="w-7 h-7 text-primary" /> Kanban Board
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Organize your workflow visually.</p>
        </div>
        <button onClick={() => openTaskModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden flex gap-5 pb-4 snap-x px-1 min-h-[500px] items-stretch custom-scrollbar">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            {STAGES.map(stage => {
              const stageTasks = tasks.filter(t => t.status === stage);
              return (
                <div key={stage} className="flex-shrink-0 w-[320px] max-w-[85vw] bg-muted/40 border border-border rounded-2xl flex flex-col snap-center shadow-sm h-full">
                  <div className="p-4 border-b border-border/50 flex justify-between items-center bg-card/60 rounded-t-2xl shrink-0">
                    <h3 className="font-bold text-sm text-foreground tracking-tight flex items-center gap-2">
                      {stage === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {STAGE_LABELS[stage]}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-background border border-border text-xs font-bold text-muted-foreground shadow-sm">{stageTasks.length}</span>
                  </div>
                  
                  <Droppable droppableId={stage}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col gap-3 min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}
                      >
                        {stageTasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`bg-card border border-border p-4 rounded-xl transition-all group relative overflow-hidden ${snapshot.isDragging ? 'shadow-xl ring-2 ring-primary scale-105 z-50' : 'shadow-sm hover:shadow-md'}`}
                                style={provided.draggableProps.style}
                              >
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl" style={{ backgroundColor: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#3b82f6' }}></div>
                                
                                <div className="flex justify-between items-start mb-2 pl-2">
                                  <h4 className="font-bold text-[14px] text-foreground tracking-tight pr-6">{task.title}</h4>
                                  <div className="flex gap-1 absolute right-2 top-2">
                                    <button onClick={() => openTaskModal(task)} className="text-slate-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-muted rounded-md"><Edit2 className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => deleteTask.mutate(task.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-50 rounded-md"><Trash2 className="w-3.5 h-3.5" /></button>
                                  </div>
                                </div>
                                <p className="text-[13px] text-muted-foreground line-clamp-2 pl-2 mb-3">{task.description}</p>
                                
                                <div className="flex items-center justify-between pl-2">
                                  <div {...provided.dragHandleProps} className="text-slate-400 hover:text-foreground cursor-grab active:cursor-grabbing p-1 -ml-1">
                                    <GripVertical className="w-4 h-4" />
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">
                                    <Calendar className="w-3 h-3" /> {task.due_date || 'No Date'}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        {/* Quick Add Button at bottom of column */}
                        <button onClick={() => openTaskModal(null, stage)} className="w-full py-2.5 rounded-lg border-2 border-dashed border-border/50 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/30 transition-all flex items-center justify-center gap-2 text-[13px] font-bold mt-2">
                          <Plus className="w-4 h-4" /> Add Task
                        </button>
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </DragDropContext>
        )}
      </div>

      {/* Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl flex flex-col">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-black text-foreground">{editingTask ? 'Edit Task' : 'New Task'}</h2>
              <button onClick={() => setIsTaskModalOpen(false)} className="p-2 bg-muted hover:bg-muted/80 rounded-full text-muted-foreground"><XCircle className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Title</label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Description</label>
                  <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm resize-none" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">
                      {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Priority</label>
                    <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Due Date</label>
                    <input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-border">
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" disabled={mutateTask.isPending} className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold">{mutateTask.isPending ? 'Saving...' : 'Save Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
