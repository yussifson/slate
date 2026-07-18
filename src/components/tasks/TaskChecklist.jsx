import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function TaskChecklist({ taskId }) {
    const companyId = useCompanyId();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [newItem, setNewItem] = useState('');

    const { data: checklists = [], isLoading } = useQuery({
        queryKey: ['task_checklists', taskId],
        queryFn: () => base44.entities.TaskChecklist.filter({ task_id: taskId }),
        enabled: !!taskId
    });

    const addMutation = useMutation({
        mutationFn: async (title) => {
            return await base44.entities.TaskChecklist.create({
                task_id: taskId,
                company_id: companyId,
                title,
                is_completed: false,
                created_by: user?.id,
                created_at: new Date().toISOString(),
                created_date: new Date().toISOString().split('T')[0]
            });
        },
        onSuccess: () => queryClient.invalidateQueries(['task_checklists', taskId])
    });

    const toggleMutation = useMutation({
        mutationFn: async ({ id, is_completed }) => {
            return await base44.entities.TaskChecklist.update(id, { is_completed });
        },
        onSuccess: () => queryClient.invalidateQueries(['task_checklists', taskId])
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            return await base44.entities.TaskChecklist.delete(id);
        },
        onSuccess: () => queryClient.invalidateQueries(['task_checklists', taskId])
    });

    const handleAdd = (e) => {
        e.preventDefault();
        if (!newItem.trim()) return;
        addMutation.mutate(newItem);
        setNewItem('');
    };

    if (!taskId) return <div className="text-sm text-slate-500 py-4">Save the task first to add checklists.</div>;

    const completedCount = checklists.filter(c => c.is_completed).length;
    const progress = checklists.length > 0 ? Math.round((completedCount / checklists.length) * 100) : 0;

    return (
        <div className="space-y-4 font-dmsans">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Checklist</h3>
                <span className="text-xs font-medium text-slate-500">{progress}% completed</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-secondary rounded-full h-1.5 mb-4 overflow-hidden">
                <div 
                    className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="space-y-2">
                {checklists.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 group p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors">
                        <Checkbox 
                            checked={item.is_completed === 'true' || item.is_completed === true}
                            onCheckedChange={(checked) => toggleMutation.mutate({ id: item.id, is_completed: checked })}
                            className="mt-0.5"
                        />
                        <span className={`flex-1 text-sm ${(item.is_completed === 'true' || item.is_completed === true) ? 'line-through text-slate-400' : 'text-slate-700 dark:text-foreground'}`}>
                            {item.title}
                        </span>
                        <Button 
                            variant="ghost" 
                            size="icon"
                            className="w-6 h-6 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                            onClick={() => deleteMutation.mutate(item.id)}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                ))}
            </div>

            <form onSubmit={handleAdd} className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-100 dark:border-border">
                <Input 
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Add an item..."
                    className="h-8 text-sm"
                />
                <Button type="submit" size="sm" className="h-8" disabled={addMutation.isPending || !newItem.trim()}>
                    <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
            </form>
        </div>
    );
}
