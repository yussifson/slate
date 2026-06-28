import React, { useState } from 'react';
import { Code, GitPullRequest, Bug, Activity, Plus, MoreVertical, Calendar } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from '@/lib/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const COLUMNS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done'
};

export default function OptavelProductEng() {
  const { user } = useAuth();
  const companyId = user?.profile?.company_id || user?.company_id;
  const queryClient = useQueryClient();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeColumn, setActiveColumn] = useState('todo');

  const { data: tasks = [] } = useQuery({
    queryKey: ['optavel_tasks', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT * FROM optavel_tasks WHERE company_id = ? ORDER BY created_at DESC`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: bugs = [] } = useQuery({
    queryKey: ['optavel_bugs', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT * FROM optavel_bugs WHERE company_id = ? AND status = 'open'`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const createTask = useMutation({
    mutationFn: async () => {
      if (!newTaskTitle.trim()) return;
      const id = uuidv4();
      await powerSync.execute(
        `INSERT INTO optavel_tasks (id, company_id, title, status, priority, assignee_id) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, companyId, newTaskTitle, activeColumn, 'medium', user.id]
      );
    },
    onError: (e) => { console.error('Mutation Error:', e); alert('Error: ' + e.message); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [] });
      setNewTaskTitle('');
    }
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      await powerSync.execute(
        `UPDATE optavel_tasks SET status = ? WHERE id = ?`,
        [status, id]
      );
    },
    onError: (e) => { console.error('Mutation Error:', e); alert('Error: ' + e.message); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [] });
    }
  });

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Optimistically update UI
    const newStatus = destination.droppableId;
    updateTaskStatus.mutate({ id: draggableId, status: newStatus });
  };

  const tasksByColumn = Object.keys(COLUMNS).reduce((acc, colId) => {
    acc[colId] = tasks.filter(t => t.status === colId);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 p-8 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Code className="w-8 h-8 text-emerald-500" />
          Product & Engineering
        </h1>
        <p className="text-slate-400 mt-1">Sprint Kanban Board and Active Engineering Metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Tasks', val: tasks.length.toString(), icon: Activity, color: 'text-emerald-400' },
          { label: 'Open Bugs', val: bugs.length.toString(), icon: Bug, color: 'text-orange-400' },
          { label: 'Completed (7d)', val: tasksByColumn.done?.length.toString() || '0', icon: GitPullRequest, color: 'text-emerald-400' },
          { label: 'In Progress', val: tasksByColumn.in_progress?.length.toString() || '0', icon: Code, color: 'text-emerald-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-slate-400">{stat.label}</span>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stat.val}</h3>
          </div>
        ))}
      </div>

      <div className="mb-6 flex gap-3">
        <input 
          type="text" 
          placeholder="New task title..." 
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          value={newTaskTitle} 
          onChange={e => setNewTaskTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && createTask.mutate()}
        />
        <select 
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
          value={activeColumn}
          onChange={e => setActiveColumn(e.target.value)}
        >
          {Object.entries(COLUMNS).map(([key, label]) => (
            <option key={key} value={key}>Add to: {label}</option>
          ))}
        </select>
        <button 
          onClick={() => createTask.mutate()} 
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 transition-colors rounded-lg text-white font-medium flex items-center gap-2 shadow-sm shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {Object.entries(COLUMNS).map(([columnId, columnTitle]) => (
            <div key={columnId} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col h-[600px]">
              <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  {columnTitle}
                  <span className="bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full">
                    {tasksByColumn[columnId]?.length || 0}
                  </span>
                </h3>
              </div>
              
              <Droppable droppableId={columnId}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto rounded-xl p-1 transition-colors ${
                      snapshot.isDraggingOver ? 'bg-slate-200/50 dark:bg-slate-800/50' : ''
                    }`}
                  >
                    {tasksByColumn[columnId]?.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`mb-3 bg-white dark:bg-slate-950 p-4 rounded-xl shadow-sm border ${
                              snapshot.isDragging ? 'border-emerald-500 shadow-lg scale-[1.02]' : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                            } transition-all`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                task.priority === 'high' ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' :
                                'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                              }`}>
                                {task.priority || 'Medium'}
                              </span>
                              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                            <h4 className="font-medium text-slate-800 dark:text-slate-100 mb-3 text-sm leading-snug">
                              {task.title}
                            </h4>
                            <div className="flex items-center justify-between text-xs text-slate-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(task.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </div>
                              {task.assignee_id && (
                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-white dark:border-slate-950">
                                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                                </div>
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
  );
}
