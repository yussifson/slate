import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Plus, MoreVertical, Calendar as CalendarIcon, CheckCircle, Clock, Trash2, Edit3, Circle, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const STAGES = [
  { id: 'todo', label: 'To Do', color: 'bg-slate-500' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-indigo-500' },
  { id: 'done', label: 'Done', color: 'bg-emerald-500' }
];

export default function TaskBoard({ spaceId }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [boardId, setBoardId] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingToStage, setAddingToStage] = useState(null);

  useEffect(() => {
    if (spaceId) fetchBoardAndTasks();
  }, [spaceId]);

  const fetchBoardAndTasks = async () => {
    setLoading(true);
    try {
      // Find or create default board for this space
      let { data: board } = await supabase.from('clipad_task_boards').select('*').eq('space_id', spaceId).limit(1).single();
      
      if (!board) {
        const { data: newBoard, error } = await supabase.from('clipad_task_boards').insert({ space_id: spaceId, name: 'Main Board' }).select().single();
        if (error) throw error;
        board = newBoard;
      }
      setBoardId(board.id);

      const { data: tasksData, error: tasksError } = await supabase
        .from('clipad_tasks')
        .select('*, assignee:assignee_id(full_name, avatar_url)')
        .eq('board_id', board.id)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e, stageId) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !boardId) return;

    try {
      const { data, error } = await supabase.from('clipad_tasks').insert({
        board_id: boardId,
        title: newTaskTitle.trim(),
        status: stageId,
        assignee_id: user.id
      }).select('*, assignee:assignee_id(full_name, avatar_url)').single();

      if (error) throw error;
      setTasks(prev => [data, ...prev]);
      setNewTaskTitle('');
      setAddingToStage(null);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to add task.', variant: 'destructive' });
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      await supabase.from('clipad_tasks').update({ status: newStatus }).eq('id', taskId);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      await supabase.from('clipad_tasks').delete().eq('id', taskId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = (e, stageId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      updateTaskStatus(taskId, stageId);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading tasks...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-primary" /> Action Board
        </h2>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex items-start gap-6 min-w-max pb-4">
          {STAGES.map(stage => (
            <div 
              key={stage.id} 
              className="w-80 flex flex-col bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-border"
              onDrop={(e) => handleDrop(e, stage.id)}
              onDragOver={handleDragOver}
            >
              <div className="p-4 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                  <h3 className="font-semibold text-foreground text-sm">{stage.label}</h3>
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                    {tasks.filter(t => t.status === stage.id).length}
                  </span>
                </div>
                <button 
                  onClick={() => { setAddingToStage(stage.id); setNewTaskTitle(''); }}
                  className="p-1 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 flex-1 flex flex-col gap-3 min-h-[150px]">
                {addingToStage === stage.id && (
                  <form onSubmit={(e) => handleAddTask(e, stage.id)} className="bg-card p-3 rounded-xl border border-primary/50 shadow-sm">
                    <input
                      autoFocus
                      type="text"
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      placeholder="What needs to be done?"
                      className="w-full bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none mb-2"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button type="button" onClick={() => setAddingToStage(null)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                      <button type="submit" className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-lg font-medium">Add</button>
                    </div>
                  </form>
                )}

                {tasks.filter(t => t.status === stage.id).map(task => (
                  <div 
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="bg-card p-4 rounded-xl border border-border hover:border-border/80 shadow-sm cursor-grab active:cursor-grabbing group transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </p>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 p-1 hover:bg-secondary rounded-lg transition-all shrink-0">
                          <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl">
                          {STAGES.filter(s => s.id !== task.status).map(s => (
                            <DropdownMenuItem key={s.id} onClick={() => updateTaskStatus(task.id, s.id)} className="text-xs">
                              Move to {s.label}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-xs text-rose-500">
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {task.source === 'ai_generated' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-pink-500/10 text-pink-500 text-[10px] font-bold uppercase tracking-wider mb-3">
                        ✨ AI Generated
                      </span>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {task.due_date && <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {new Date(task.due_date).toLocaleDateString()}</span>}
                      </div>
                      {task.assignee && (
                        <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border" title={task.assignee.full_name}>
                          {task.assignee.avatar_url ? (
                            <img src={task.assignee.avatar_url} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
