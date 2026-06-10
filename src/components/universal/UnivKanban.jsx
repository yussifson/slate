import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, MoreHorizontal, AlignLeft, Loader2, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function UnivKanban({ 
  stages = ['To Do', 'In Progress', 'In Review', 'Done'],
  title = "Kanban Board",
  searchPlaceholder = "Search tasks...",
  companyId,
  pageName
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['orbit_records', companyId, pageName],
    queryFn: async () => {
      if (!companyId || !pageName) return [];
      const { data, error } = await supabase
        .from('industry_records')
        .select('*')
        .eq('company_id', companyId)
        .eq('industry', 'orbit_build_data')
        .eq('record_type', pageName)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId && !!pageName
  });

  const addMutation = useMutation({
    mutationFn: async (newData) => {
      const { data, error } = await supabase
        .from('industry_records')
        .insert([{
          company_id: companyId,
          industry: 'orbit_build_data',
          record_type: pageName,
          data: newData,
          search_text: Object.values(newData).join(' ')
        }]);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orbit_records', companyId, pageName]);
      queryClient.invalidateQueries(['orbit_dynamic_records', companyId]);
      setIsAdding(false);
      setNewTaskTitle('');
      toast({ title: 'Success', description: 'Card added successfully.' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, newData }) => {
      const { data, error } = await supabase
        .from('industry_records')
        .update({ data: newData, search_text: Object.values(newData).join(' ') })
        .eq('id', id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orbit_records', companyId, pageName]);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('industry_records').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orbit_records', companyId, pageName]);
      queryClient.invalidateQueries(['orbit_dynamic_records', companyId]);
      toast({ title: 'Deleted', description: 'Card removed.' });
    }
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addMutation.mutate({
      title: newTaskTitle,
      stage: stages[0],
      priority: 'Medium',
      assignee: 'U'
    });
  };

  const handleMove = (recordId, currentData, direction) => {
    const currentIndex = stages.indexOf(currentData.stage || stages[0]);
    const newIndex = direction === 'right' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < stages.length) {
      updateMutation.mutate({ 
        id: recordId, 
        newData: { ...currentData, stage: stages[newIndex] } 
      });
    }
  };

  const displayData = records.map(r => ({ id: r.id, ...r.data }));

  const filteredData = displayData.filter(item => 
    Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getPriorityColor = (p) => {
    switch (p) {
      case 'Critical': return 'text-red-600 bg-red-100 dark:bg-red-500/10 border-red-200';
      case 'High': return 'text-orange-600 bg-orange-100 dark:bg-orange-500/10 border-orange-200';
      case 'Medium': return 'text-blue-600 bg-blue-100 dark:bg-blue-500/10 border-blue-200';
      default: return 'text-slate-600 bg-slate-100 dark:bg-slate-800 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="flex items-center justify-between mb-6 shrink-0 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">{title}</h2>
           <p className="text-sm text-muted-foreground mt-1">Visualize your workflows and drag to update.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative w-64 hidden sm:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Card
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="mb-6 p-4 bg-card border border-primary/20 rounded-2xl shadow-sm shrink-0">
          <form onSubmit={handleAdd} className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Task Title</label>
              <input 
                autoFocus
                type="text" 
                value={newTaskTitle} 
                onChange={e => setNewTaskTitle(e.target.value)} 
                placeholder="Enter task title..." 
                className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" 
              />
            </div>
            <Button type="button" variant="outline" onClick={() => setIsAdding(false)} className="h-10 rounded-xl">Cancel</Button>
            <Button type="submit" disabled={addMutation.isPending} className="h-10 bg-primary text-white rounded-xl">
              {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Card'}
            </Button>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto flex gap-4 pb-4 custom-scrollbar snap-x">
          {stages.map(stage => {
            const stageItems = filteredData.filter(item => (item.stage || stages[0]) === stage);
            return (
              <div key={stage} className="flex-shrink-0 w-80 bg-muted/30 border border-border rounded-2xl flex flex-col snap-center h-full">
                <div className="p-4 border-b border-border/50 flex justify-between items-center bg-card/40 rounded-t-2xl">
                  <h3 className="font-bold text-sm text-foreground tracking-tight">{stage}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-background border border-border text-xs font-medium text-muted-foreground shadow-sm">
                    {stageItems.length}
                  </span>
                </div>
                <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                  <AnimatePresence>
                    {stageItems.map(item => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={item.id} 
                        className="bg-card border border-border p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow group cursor-pointer relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors"></div>
                        <div className="flex justify-between items-start mb-3">
                          <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-md border ${getPriorityColor(item.priority)}`}>
                            {item.priority || 'Normal'}
                          </span>
                          <button onClick={() => deleteMutation.mutate(item.id)} className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <h4 className="font-semibold text-sm text-foreground leading-snug">{item.title || item.name || 'Untitled'}</h4>
                        {item.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2"><AlignLeft className="w-3 h-3 inline mr-1" />{item.description}</p>}
                        <div className="mt-4 flex items-center justify-between">
                           <div className="flex -space-x-2">
                             <div className="w-7 h-7 rounded-full border-2 border-card bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                               {item.assignee ? item.assignee.charAt(0) : 'U'}
                             </div>
                           </div>
                           <div className="flex gap-2">
                               {stage !== stages[0] && <button onClick={() => handleMove(item.id, item, 'left')} className="hover:text-primary text-xs text-muted-foreground px-2 py-1 bg-muted rounded">&larr;</button>}
                               {stage !== stages[stages.length-1] && <button onClick={() => handleMove(item.id, item, 'right')} className="hover:text-primary text-xs text-muted-foreground px-2 py-1 bg-muted rounded">&rarr;</button>}
                           </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {stageItems.length === 0 && (
                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-border/60 rounded-xl text-xs text-muted-foreground font-medium bg-card/20">
                      No cards
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
