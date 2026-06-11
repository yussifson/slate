import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { LayoutGrid, Plus, Search, Trash2, Edit2, Loader2, XCircle, User, Calendar, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';

const DEFAULT_COLS = ['To Do', 'In Progress', 'Review', 'Done'];
const PRIORITY_COLORS = { Low: 'bg-muted text-muted-foreground', Medium: 'bg-amber-50 text-amber-700', High: 'bg-orange-50 text-orange-700', Urgent: 'bg-red-50 text-red-700' };
const COL_COLORS = ['border-border', 'border-blue-400', 'border-violet-400', 'border-emerald-400'];
const EMPTY_FORM = { title: '', description: '', status: 'To Do', priority: 'Medium', assignee: '', due_date: '', labels: '' };

export default function UnivKanban({ title = "Kanban Board", companyId, pageName, tableName }) {
  const [view, setView] = useState('Default');

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [columns, setColumns] = useState(DEFAULT_COLS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [addingCol, setAddingCol] = useState(false);
  const [newColName, setNewColName] = useState('');

  // Fallback if tableName is undefined (shouldn't happen in OrbitBuild)
  const targetTable = tableName || 'univ_kanban_tasks';

  useEffect(() => {
    if (companyId) {
      fetchTasks();
      const savedCols = localStorage.getItem(`kanban_cols_${companyId}_${targetTable}`);
      if (savedCols) setColumns(JSON.parse(savedCols));
      
      const ch = supabase.channel(`kanban_ch_${targetTable}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: targetTable, filter: `company_id=eq.${companyId}` }, fetchTasks)
        .subscribe();
      return () => supabase.removeChannel(ch);
    }
  }, [companyId, targetTable]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from(targetTable).select('*').eq('company_id', companyId).order('created_at', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      
      // Auto-extract columns from data if they exist
      const loaded = data || [];
      const distinctStatuses = Array.from(new Set(loaded.map(t => t.status || 'To Do')));
      if (distinctStatuses.length > 0) {
        const merged = Array.from(new Set([...columns, ...distinctStatuses]));
        if (merged.length > columns.length) setColumns(merged);
      }
      
      setTasks(loaded);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase.from(targetTable).update(form).eq('id', editingId);
        if (error) throw error;
        toast.success('Task updated!');
      } else {
        const { error } = await supabase.from(targetTable).insert({ ...form, company_id: companyId });
        if (error) throw error;
        toast.success('Task created!');
      }
      closeModal(); fetchTasks();
    } catch (err) { toast.error('Failed to save task'); }
  };

  const remove = async (id) => {
    const { error } = await supabase.from(targetTable).delete().eq('id', id);
    if (error) toast.error('Failed to delete'); else { toast.success('Deleted'); fetchTasks(); }
  };

  const openModal = (r = null, defaultStatus = 'To Do') => {
    setForm(r ? { ...r } : { ...EMPTY_FORM, status: defaultStatus });
    setEditingId(r?.id || null);
    setIsModalOpen(true);
  };
  const closeModal = () => { setIsModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    setTasks(prev => prev.map(t => t.id === draggableId ? { ...t, status: newStatus } : t));
    try {
      const { error } = await supabase.from(targetTable).update({ status: newStatus }).eq('id', draggableId);
      if (error) throw error;
    } catch { toast.error('Failed to move task'); fetchTasks(); }
  };

  const addColumn = (e) => {
    e.preventDefault();
    if (!newColName.trim() || columns.includes(newColName.trim())) return;
    const updated = [...columns, newColName.trim()];
    setColumns(updated);
    localStorage.setItem(`kanban_cols_${companyId}`, JSON.stringify(updated));
    setNewColName(''); setAddingCol(false);
    toast.success('Column added!');
  };

  const filtered = tasks.filter(t => `${t.title} ${t.assignee} ${t.labels}`.toLowerCase().includes(search.toLowerCase()));

  
  const handleExport = () => {
    const exportData = (typeof records !== 'undefined' ? records : (typeof data !== 'undefined' ? data : []));
    if (!exportData || exportData.length === 0) return alert('No data to export');
    const keys = Object.keys(exportData[0]).filter(k => k !== 'company_id' && k !== 'id');
    const csv = [keys.join(','), ...exportData.map(r => keys.map(k => '"' + (r[k]||'').toString().replace(/"/g, '""') + '"').join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'export.csv'; a.click();
  };

  return (
    <div className="h-full flex flex-col gap-4 w-full bg-background p-4 sm:p-6 lg:p-8 ${view !== 'Default' ? 'hide-default' : ''}">
      <div className="view-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div><h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2"><LayoutGrid className="w-7 h-7 text-primary" />Kanban Board</h1><p className="text-muted-foreground text-sm font-medium mt-1">{tasks.length} tasks across {columns.length} columns.</p></div>
        <div className="flex items-center gap-2">

        
        
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>

        <button onClick={() => openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 shadow-sm"><Plus className="w-4 h-4" />Add Task</button>
      </div>
      </div>

      <div className="relative shrink-0 max-w-md"><Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." className="w-full h-10 pl-10 pr-4 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm shadow-sm" /></div>

      {loading ? <div className="flex flex-1 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex-1 overflow-x-auto overflow-y-hidden flex gap-4 pb-4 custom-scrollbar min-h-0">
            {columns.map((col, ci) => {
              const colTasks = filtered.filter(t => t.status === col);
              return (
                <div key={col} className={`flex-shrink-0 w-72 rounded-2xl border-t-4 ${COL_COLORS[ci % COL_COLORS.length]} bg-muted/40 border border-border flex flex-col`} style={{ height: 'calc(100% - 4px)' }}>
                  <div className="p-3 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-sm text-foreground">{col}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold px-2 py-0.5 bg-background border border-border rounded-full text-muted-foreground">{colTasks.length}</span>
                      <button onClick={() => openModal(null, col)} className="p-1 text-muted-foreground hover:text-primary transition-colors"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <Droppable droppableId={col}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className={`flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar rounded-b-2xl transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}>
                        {colTasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(prov, snap) => {
                              const displayTitle = task.title || task.name || task.client_name || task.employee_name || task.room_number || task.id.slice(0,8);
                              const displayDesc = task.description || task.notes || task.reason || task.email || '';
                              return (
                              <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} style={prov.draggableProps.style} className={`bg-card border border-border rounded-xl p-3 group shadow-sm transition-all ${snap.isDragging ? 'shadow-xl ring-2 ring-primary scale-105 z-50' : 'hover:shadow-md'}`}>
                                <div className="flex justify-between items-start mb-2">
                                  <p className="text-sm font-bold text-foreground leading-snug flex-1 pr-1">{displayTitle}</p>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <button onClick={() => openModal(task)} className="p-1 bg-muted rounded-md text-muted-foreground hover:text-primary"><Edit2 className="w-3 h-3" /></button>
                                    <button onClick={() => remove(task.id)} className="p-1 bg-red-50 rounded-md text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                                  </div>
                                </div>
                                {displayDesc && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{displayDesc}</p>}
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {task.priority && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>}
                                  {task.labels && task.labels.split(',').map(l => <span key={l} className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-md font-bold">{l.trim()}</span>)}
                                </div>
                                <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                                  {task.assignee && <span className="flex items-center gap-1"><User className="w-3 h-3" />{task.assignee}</span>}
                                  {(task.due_date || task.created_at) && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{task.due_date || task.created_at?.split('T')[0]}</span>}
                                </div>
                              </div>
                            )}}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {colTasks.length === 0 && !snapshot.isDraggingOver && <div className="h-20 flex items-center justify-center border-2 border-dashed border-border/50 rounded-xl text-xs text-muted-foreground">Drop tasks here</div>}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
            {/* Add Column */}
            <div className="flex-shrink-0 w-56 rounded-2xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center min-h-[150px] hover:border-border transition-colors bg-card/30">
              {addingCol ? (
                <form onSubmit={addColumn} className="p-4 w-full flex flex-col gap-2">
                  <input autoFocus type="text" value={newColName} onChange={e => setNewColName(e.target.value)} placeholder="Column name..." className="w-full h-9 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
                  <div className="flex gap-2"><button type="submit" className="flex-1 h-8 bg-primary text-white rounded-lg text-xs font-bold">Add</button><button type="button" onClick={() => setAddingCol(false)} className="flex-1 h-8 bg-muted rounded-lg text-xs font-bold">Cancel</button></div>
                </form>
              ) : (
                <button onClick={() => setAddingCol(true)} className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors p-4">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"><Plus className="w-5 h-5" /></div>
                  <span className="text-sm font-bold">Add Column</span>
                </button>
              )}
            </div>
          </div>
        </DragDropContext>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex justify-between items-center shrink-0"><h2 className="text-xl font-black">{editingId ? 'Edit Task' : 'New Task'}</h2><button onClick={closeModal} className="p-2 bg-muted rounded-full text-muted-foreground"><XCircle className="w-5 h-5" /></button></div>
            <form onSubmit={save} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Task Title *</label><input required type="text" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Column / Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">{columns.map(c=><option key={c}>{c}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Priority</label><select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">{Object.keys(PRIORITY_COLORS).map(p=><option key={p}>{p}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Assignee</label><input type="text" value={form.assignee} onChange={e=>setForm({...form,assignee:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Due Date</label><input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div className="col-span-2"><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Labels (comma-separated)</label><input type="text" value={form.labels} onChange={e=>setForm({...form,labels:e.target.value})} placeholder="bug, feature, design..." className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div className="col-span-2"><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Description</label><textarea rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm resize-none"/></div>
              </div>
              <div className="flex justify-end gap-3 mt-5 pt-5 border-t border-border"><button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button><button type="submit" className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm">{editingId?'Update':'Add Task'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

